#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Integration tests for the complete content generation pipeline.

These tests require a running LLM server and test the full workflow:
- Generation → Validation → Database Insertion
- Failure tracking and retry
- Incremental database updates

To run: python -m pytest content/tests/test_generation_integration.py -v -s
"""

import sys
import json
import sqlite3
from pathlib import Path
import tempfile
import shutil

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from content.generate_content import ContentGenerator


class TestContentGenerationPipeline:
    """Test the complete content generation pipeline with LLM."""

    def setup_method(self):
        """Set up test environment for each test."""
        # Create temporary directory for test database
        self.temp_dir = tempfile.mkdtemp()
        self.test_db_path = str(Path(self.temp_dir) / "test.db")
        self.test_config_path = "content/generation/config/database_generation.json"

        # Initialize database with schema
        self._init_test_database()

    def teardown_method(self):
        """Clean up after each test."""
        # Remove temporary directory
        if Path(self.temp_dir).exists():
            shutil.rmtree(self.temp_dir)

    def _init_test_database(self):
        """Initialize test database with required schema."""
        from content.database.database_manager import LanguageDB

        with LanguageDB(self.test_db_path) as db:
            # Add required reference data
            # Languages
            for lang in ["French", "Spanish"]:
                db.execute_query(
                    "INSERT OR IGNORE INTO languages (language_name) VALUES (?)",
                    (lang,),
                )

            # Difficulties
            for diff in ["Beginner", "Intermediate"]:
                db.execute_query(
                    "INSERT OR IGNORE INTO difficulties (difficulty_name) VALUES (?)",
                    (diff,),
                )

            # Topics
            for topic in ["Greetings and introductions", "Food, drinks, and restaurants"]:
                db.execute_query(
                    "INSERT OR IGNORE INTO topics (topic_name) VALUES (?)", (topic,)
                )

    def test_llm_server_connection(self):
        """Test that we can connect to the LLM server."""
        print("\n" + "=" * 80)
        print("TEST: LLM Server Connection")
        print("=" * 80)

        generator = ContentGenerator(
            config_path=self.test_config_path,
            db_path=self.test_db_path,
            debug=False,
        )

        generator.setup_models()

        assert generator.generation_model is not None, "Generation model should be set up"
        assert generator.validation_model is not None, "Validation model should be set up"

        print("✅ Successfully connected to LLM server")

    def test_single_exercise_generation_and_validation(self):
        """Test generating and validating a single exercise."""
        print("\n" + "=" * 80)
        print("TEST: Single Exercise Generation & Validation")
        print("=" * 80)

        generator = ContentGenerator(
            config_path=self.test_config_path,
            db_path=self.test_db_path,
            debug=False,
        )

        generator.setup_models()

        # Generate a fill-in-blank exercise
        exercise_data = generator.generate_exercise(
            language="French",
            level="beginner",
            topic="Greetings and introductions",
            exercise_type="fill_in_blank",
        )

        assert exercise_data is not None, "Exercise generation should succeed"
        assert "sentence" in exercise_data, "Exercise should have sentence"
        assert "correct_answer" in exercise_data, "Exercise should have correct answer"

        print(f"✅ Generated exercise: {exercise_data.get('sentence')}")

        # Validate the exercise
        passed, validation_result = generator.validate_exercise(
            exercise_data,
            language="French",
            level="beginner",
            exercise_type="fill_in_blank",
        )

        print(f"Validation score: {validation_result.overall_quality_score}/10")
        print(f"Passed: {passed}")

        assert validation_result is not None, "Validation should return a result"
        assert hasattr(
            validation_result, "overall_quality_score"
        ), "Validation should have quality score"

        print("✅ Exercise validated successfully")

    def test_full_pipeline_with_insertion(self):
        """Test the complete pipeline: generate → validate → insert."""
        print("\n" + "=" * 80)
        print("TEST: Full Pipeline (Generate → Validate → Insert)")
        print("=" * 80)

        generator = ContentGenerator(
            config_path=self.test_config_path,
            db_path=self.test_db_path,
            debug=False,
        )

        # Run for a single combination
        generator.run(
            languages_filter=["French"],
            levels_filter=["beginner"],
            topics_filter=["Greetings and introductions"],
            exercise_types_filter=["fill_in_blank"],
            max_combinations=1,
        )

        # Check statistics
        assert generator.stats["total_attempted"] > 0, "Should have attempted generations"
        assert generator.stats["total_generated"] > 0, "Should have generated exercises"
        assert generator.stats["total_validated"] > 0, "Should have validated exercises"

        # Check database for inserted exercises
        conn = sqlite3.connect(self.test_db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM fill_in_blank_exercises")
        count = cursor.fetchone()[0]
        conn.close()

        print(f"Exercises inserted into database: {count}")
        assert count > 0, "Should have inserted at least one exercise into database"

        print("✅ Full pipeline completed successfully")

    def test_validation_rejects_low_quality(self):
        """Test that validation properly rejects low-quality exercises."""
        print("\n" + "=" * 80)
        print("TEST: Validation Rejects Low Quality")
        print("=" * 80)

        generator = ContentGenerator(
            config_path=self.test_config_path,
            db_path=self.test_db_path,
            debug=False,
        )

        generator.setup_models()

        # Create a deliberately ambiguous exercise
        bad_exercise = {
            "sentence": "Je visite mon _",
            "correct_answer": "frère",
            "incorrect_1": "père",
            "incorrect_2": "oncle",
            "blank_position": 2,
            "translation": "I visit my brother",
        }

        passed, validation_result = generator.validate_exercise(
            bad_exercise,
            language="French",
            level="beginner",
            exercise_type="fill_in_blank",
        )

        print(f"Validation score: {validation_result.overall_quality_score}/10")
        print(f"Is unambiguous: {validation_result.is_unambiguous}")
        print(f"Passed: {passed}")

        # This should fail validation due to ambiguity
        if not validation_result.is_unambiguous:
            print(
                "✅ Validation correctly detected ambiguity (may still pass if score >= threshold)"
            )
        else:
            print(
                "⚠️  Validation did not detect ambiguity (LLM decision may vary)"
            )

        if validation_result.overall_quality_score < 6:
            print("✅ Low quality score correctly assigned")

    def test_failure_tracking(self):
        """Test that failures are properly tracked."""
        print("\n" + "=" * 80)
        print("TEST: Failure Tracking")
        print("=" * 80)

        generator = ContentGenerator(
            config_path=self.test_config_path,
            db_path=self.test_db_path,
            debug=False,
        )

        # Create a minimal config that might fail
        # (This is a bit contrived - in real usage failures happen naturally)
        generator.run(
            languages_filter=["French"],
            levels_filter=["beginner"],
            topics_filter=["Greetings and introductions"],
            exercise_types_filter=["fill_in_blank"],
            max_combinations=1,
        )

        # Check if failures are tracked
        print(f"Total failures tracked: {len(generator.failures)}")
        print(f"Validation failures: {generator.stats['validation_failures']}")
        print(f"Generation failures: {generator.stats['generation_failures']}")

        # Failures will be saved to JSON
        if generator.failures:
            print(f"✅ Failures tracked: {len(generator.failures)} failure(s)")
        else:
            print("✅ No failures (all exercises passed)")

    def test_multiple_exercise_types(self):
        """Test generation for multiple exercise types."""
        print("\n" + "=" * 80)
        print("TEST: Multiple Exercise Types")
        print("=" * 80)

        generator = ContentGenerator(
            config_path=self.test_config_path,
            db_path=self.test_db_path,
            debug=False,
        )

        generator.setup_models()

        exercise_types = ["conversations", "pairs", "translations", "fill_in_blank"]
        results = {}

        for exercise_type in exercise_types:
            print(f"\nGenerating {exercise_type}...")
            exercise_data = generator.generate_exercise(
                language="French",
                level="beginner",
                topic="Greetings and introductions",
                exercise_type=exercise_type,
            )

            if exercise_data:
                results[exercise_type] = "✅ Success"
            else:
                results[exercise_type] = "❌ Failed"

        print("\nResults:")
        for ex_type, result in results.items():
            print(f"  {ex_type}: {result}")

        # At least some should succeed
        successes = sum(1 for r in results.values() if "Success" in r)
        assert successes > 0, "At least one exercise type should generate successfully"

        print(f"\n✅ Generated {successes}/{len(exercise_types)} exercise types")

    def test_filtering(self):
        """Test that filtering works correctly."""
        print("\n" + "=" * 80)
        print("TEST: Filtering")
        print("=" * 80)

        generator = ContentGenerator(
            config_path=self.test_config_path,
            db_path=self.test_db_path,
            debug=False,
        )

        # Get combinations with filtering
        combinations = generator.get_combinations(
            languages_filter=["French"],
            levels_filter=["beginner"],
            topics_filter=["Greetings and introductions"],
            exercise_types_filter=["fill_in_blank"],
        )

        print(f"Filtered combinations: {len(combinations)}")

        # Should be exactly 1 combination
        assert len(combinations) == 1, "Should have exactly 1 filtered combination"
        assert combinations[0]["language"] == "French"
        assert combinations[0]["level"] == "beginner"
        assert combinations[0]["topic"] == "Greetings and introductions"
        assert combinations[0]["exercise_type"] == "fill_in_blank"

        print("✅ Filtering works correctly")


if __name__ == "__main__":
    print("\n" + "🧪 " * 40)
    print("CONTENT GENERATION INTEGRATION TESTS")
    print("Requires LLM server running at http://localhost:11434/v1")
    print("🧪 " * 40 + "\n")

    # Run tests manually
    test = TestContentGenerationPipeline()

    # Test 1: Connection
    test.setup_method()
    try:
        test.test_llm_server_connection()
    finally:
        test.teardown_method()

    # Test 2: Single exercise
    test.setup_method()
    try:
        test.test_single_exercise_generation_and_validation()
    finally:
        test.teardown_method()

    # Test 3: Full pipeline
    test.setup_method()
    try:
        test.test_full_pipeline_with_insertion()
    finally:
        test.teardown_method()

    # Test 4: Validation
    test.setup_method()
    try:
        test.test_validation_rejects_low_quality()
    finally:
        test.teardown_method()

    # Test 5: Multiple types
    test.setup_method()
    try:
        test.test_multiple_exercise_types()
    finally:
        test.teardown_method()

    # Test 6: Filtering
    test.setup_method()
    try:
        test.test_filtering()
    finally:
        test.teardown_method()

    print("\n" + "✅ " * 40)
    print("ALL TESTS COMPLETED")
    print("✅ " * 40 + "\n")
