#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Consolidated content generation system with integrated validation.

This script:
1. Loads configuration from database_generation.json
2. Generates exercises using LLM
3. Validates each exercise immediately after generation
4. Only inserts validated exercises into database
5. Tracks failures for retry
6. Supports filtering and incremental database updates

Usage:
    python content/generate_content.py --db-path database/languageLearningDatabase.db
    python content/generate_content.py --languages French --levels beginner
    python content/generate_content.py --add-language Portuguese
    python content/generate_content.py --retry-failures failures_2025.json
"""

import os
os.environ["KIVY_NO_CONSOLELOG"] = "1"

import json
import argparse
import sys
from pathlib import Path
from datetime import datetime
import uuid
from typing import Dict, List, Any, Optional, Tuple
from tqdm import tqdm

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from database.database_manager import LanguageDB
from generation.core import outlines_generator
from generation.models.validation_models import (
    parse_validation_result,
    FillInBlankValidation,
)
from generation.utils.exercise_converters import get_converter


def _convert_to_dict(obj):
    """Convert Pydantic models or other objects to dict for JSON serialization.

    Recursively handles nested structures.
    """
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    elif hasattr(obj, "dict"):
        return obj.dict()
    elif isinstance(obj, dict):
        # Recursively convert nested dicts
        return {key: _convert_to_dict(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        # Recursively convert lists
        return [_convert_to_dict(item) for item in obj]
    elif isinstance(obj, (str, int, float, bool, type(None))):
        return obj
    else:
        # Fallback: convert to string
        return str(obj)


class ContentGenerator:
    """Main class for content generation with integrated validation."""

    def __init__(
        self,
        config_path: str,
        db_path: str,
        generation_model: Optional[str] = None,
        validation_model: Optional[str] = None,
        debug: bool = False,
        no_think: bool = False,
        dry_run: bool = False,
    ):
        """Initialize the content generator.

        Args:
            config_path: Path to database_generation.json
            db_path: Path to SQLite database
            generation_model: Override generation model
            validation_model: Override validation model
            debug: Enable debug mode
            no_think: Prepend /no_think to prompts
            dry_run: Don't insert to database
        """
        self.config = self._load_config(config_path)
        self.db_path = db_path
        self.debug = debug
        self.no_think = no_think
        self.dry_run = dry_run

        # Override models if specified
        if generation_model:
            self.config["llm_servers"]["generation"]["model"] = generation_model
        if validation_model:
            self.config["llm_servers"]["validation"]["model"] = validation_model
        elif self.config["llm_servers"]["validation"]["model"] == "auto":
            # Use generation model for validation if not specified
            self.config["llm_servers"]["validation"]["model"] = self.config[
                "llm_servers"
            ]["generation"]["model"]

        # Set up models
        self.generation_model = None
        self.validation_model = None

        # Failure tracking
        self.failures = []
        self.stats = {
            "total_attempted": 0,
            "total_generated": 0,
            "total_validated": 0,
            "total_inserted": 0,
            "validation_failures": 0,
            "generation_failures": 0,
        }

    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from JSON file."""
        config_file = Path(config_path)
        if not config_file.exists():
            raise FileNotFoundError(
                f"Configuration file not found: {config_path}\n"
                f"Expected location: {config_file.absolute()}"
            )

        with open(config_file, "r") as f:
            config = json.load(f)

        # Validate required fields
        required_fields = [
            "llm_servers",
            "languages",
            "levels",
            "topics",
            "exercise_types",
        ]
        for field in required_fields:
            if field not in config:
                raise ValueError(
                    f"Missing required field in config: {field}"
                )

        return config

    def setup_models(self):
        """Set up generation and validation models."""
        print("Setting up LLM models...")

        # Set global config for outlines_generator
        gen_config = self.config["llm_servers"]["generation"]
        outlines_generator.MODEL_CONFIG.update(
            {
                "base_url": gen_config["url"],
                "api_key": gen_config["api_key"],
                "temperature": gen_config["temperature"],
                "exercise_temperatures": self.config["exercise_temperatures"],
                "no_think": self.no_think,
                "debug": self.debug,
            }
        )

        # Setup generation model
        self.generation_model = outlines_generator.setup_outlines_model()
        print(f"  Generation model: {type(self.generation_model).__name__}")

        # Setup validation model (can be same as generation)
        val_config = self.config["llm_servers"]["validation"]
        if (
            val_config["url"] == gen_config["url"]
            and val_config["model"] == gen_config["model"]
        ):
            # Use same model for validation
            self.validation_model = self.generation_model
            print(f"  Validation model: (same as generation)")
        else:
            # Create separate validation model
            # This is a simplified version - in production you'd need to create another model instance
            print(f"  Validation model: Separate model not yet implemented, using generation model")
            self.validation_model = self.generation_model

    def get_combinations(
        self,
        languages_filter: Optional[List[str]] = None,
        levels_filter: Optional[List[str]] = None,
        topics_filter: Optional[List[str]] = None,
        exercise_types_filter: Optional[List[str]] = None,
    ) -> List[Dict[str, str]]:
        """Get all (language, level, topic, exercise_type) combinations to process.

        Args:
            languages_filter: Filter to specific languages
            levels_filter: Filter to specific levels
            topics_filter: Filter to specific topics
            exercise_types_filter: Filter to specific exercise types

        Returns:
            List of combination dictionaries
        """
        languages = languages_filter or self.config["languages"]
        levels = levels_filter or self.config["levels"]
        topics = topics_filter or self.config["topics"]
        exercise_types = exercise_types_filter or self.config["exercise_types"]

        combinations = []
        for language in languages:
            for level in levels:
                for topic in topics:
                    for exercise_type in exercise_types:
                        combinations.append(
                            {
                                "language": language,
                                "level": level,
                                "topic": topic,
                                "exercise_type": exercise_type,
                            }
                        )

        return combinations

    def generate_exercise(
        self, language: str, level: str, topic: str, exercise_type: str
    ) -> Optional[Any]:
        """Generate a single exercise using the LLM.

        Args:
            language: Target language
            level: Difficulty level
            topic: Topic
            exercise_type: Type of exercise

        Returns:
            Generated exercise data or None if generation failed.
            For fill_in_blank, returns a FillInBlankExercise object with multiple exercises.
            For other types, returns a dict.
        """
        try:
            # Fetch existing exercises to use as examples for diversity
            existing_examples = self.fetch_existing_exercises_for_examples(
                language, level, topic, exercise_type, limit=3
            )

            if existing_examples and self.debug:
                print(f"Using {len(existing_examples)} existing exercises as examples for diversity")

            # Call appropriate generator function (model is first parameter)
            if exercise_type == "conversations":
                result = outlines_generator.generate_conversations(
                    self.generation_model, language, level, topic, existing_examples
                )
            elif exercise_type == "pairs":
                result = outlines_generator.generate_pairs(
                    self.generation_model, language, level, topic, existing_examples
                )
            elif exercise_type == "translations":
                result = outlines_generator.generate_translations(
                    self.generation_model, language, level, topic, existing_examples
                )
            elif exercise_type == "fill_in_blank":
                result = outlines_generator.generate_fill_in_blank_structured(
                    self.generation_model, language, level, topic, existing_examples
                )
                # Result is now a single dict (not a list)
                if result:
                    self.stats["total_generated"] += 1
                    return result
                else:
                    # None means generation or validation failed
                    return None
            else:
                raise ValueError(f"Unknown exercise type: {exercise_type}")

            # Handle result - could be a list of Pydantic models or None
            if result is None or (isinstance(result, list) and len(result) == 0):
                return None

            # Convert list of Pydantic models to appropriate dict format
            if isinstance(result, list) and len(result) > 0:
                # For pairs, conversations, and translations, the list IS the exercise
                # We need to convert it to the format expected by insert_exercise
                if exercise_type == "pairs":
                    # Convert list of word pair models to dict with "word_pairs" field
                    pairs_list = []
                    for pair in result:
                        if hasattr(pair, 'model_dump'):
                            pairs_list.append(pair.model_dump())
                        elif hasattr(pair, 'dict'):
                            pairs_list.append(pair.dict())
                        else:
                            pairs_list.append(pair)
                    result_dict = {"word_pairs": pairs_list}
                elif exercise_type == "conversations":
                    # Take first conversation from the list
                    first_conv = result[0]
                    if hasattr(first_conv, 'model_dump'):
                        result_dict = first_conv.model_dump()
                    elif hasattr(first_conv, 'dict'):
                        result_dict = first_conv.dict()
                    else:
                        result_dict = first_conv
                elif exercise_type == "translations":
                    # Take first translation from the list
                    first_trans = result[0]
                    if hasattr(first_trans, 'model_dump'):
                        result_dict = first_trans.model_dump()
                    elif hasattr(first_trans, 'dict'):
                        result_dict = first_trans.dict()
                    else:
                        result_dict = first_trans
                else:
                    # Unknown type, take first item
                    first_item = result[0]
                    if hasattr(first_item, 'model_dump'):
                        result_dict = first_item.model_dump()
                    elif hasattr(first_item, 'dict'):
                        result_dict = first_item.dict()
                    else:
                        result_dict = first_item

                self.stats["total_generated"] += 1
                return result_dict

            self.stats["total_generated"] += 1
            return result

        except Exception as e:
            if self.debug:
                import traceback
                traceback.print_exc()
            self.stats["generation_failures"] += 1
            return None

    def validate_exercise(
        self, exercise_data: Dict, language: str, level: str, exercise_type: str
    ) -> Tuple[bool, Any]:
        """Validate a generated exercise using the validation LLM.

        Args:
            exercise_data: Generated exercise data
            language: Target language
            level: Difficulty level
            exercise_type: Type of exercise

        Returns:
            Tuple of (passed: bool, validation_result)
        """
        try:
            # Get converter for this exercise type
            converter = get_converter(exercise_type, language, level)

            # For fill-in-blank exercises, do pre-validation on translation
            if exercise_type == "fill_in_blank" and hasattr(converter, 'validate_translation'):
                translation = exercise_data.get('translation', '')
                is_valid, error_msg = converter.validate_translation(translation)
                if not is_valid:
                    print(f"  ❌ Pre-validation failed: {error_msg}")
                    self.stats["validation_failures"] += 1
                    return False, {"error": error_msg, "issues_found": [error_msg]}

            # Convert exercise to text
            exercise_text = converter.convert_to_text(exercise_data)

            # Get validation prompt
            prompt = converter.get_validation_prompt(exercise_text)

            # Prepare prompt with /no_think if requested
            if self.no_think:
                prompt = "/no_think\n" + prompt

            # Call validation model
            # Note: Using the same generation mechanism for validation
            # In a more sophisticated setup, you'd have a separate validation call
            import openai

            client = openai.OpenAI(
                base_url=self.config["llm_servers"]["validation"]["url"],
                api_key=self.config["llm_servers"]["validation"]["api_key"],
            )

            # Get model name
            models = client.models.list()
            model_name = (
                self.config["llm_servers"]["validation"]["model"]
                if self.config["llm_servers"]["validation"]["model"] != "auto"
                else models.data[0].id if models.data else "default"
            )

            response = client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=self.config["llm_servers"]["validation"]["temperature"],
            )

            result_text = response.choices[0].message.content

            # Clean and parse validation result
            cleaned_text = outlines_generator.clean_model_response(result_text)
            validation_result = parse_validation_result(cleaned_text, exercise_type)

            self.stats["total_validated"] += 1

            # Check if passed
            threshold = self.config["generation_settings"]["validation_threshold"]
            passed = validation_result.overall_quality_score >= threshold

            # For fill-in-blank, also check ambiguity and translation blanks
            if (
                exercise_type == "fill_in_blank"
                and self.config["generation_settings"]["require_unambiguous_fill_in_blank"]
            ):
                if isinstance(validation_result, FillInBlankValidation):
                    if not validation_result.is_unambiguous:
                        print(f"  ❌ Validation failed: Exercise is ambiguous")
                        passed = False
                    # Also check that translation has no blanks
                    if not validation_result.translation_has_no_blanks:
                        print(f"  ❌ Validation failed: Translation has blanks")
                        passed = False

            if not passed:
                self.stats["validation_failures"] += 1
                if passed == (validation_result.overall_quality_score >= threshold):
                    print(f"  ❌ Validation failed: Quality score {validation_result.overall_quality_score} < threshold {threshold}")

            return passed, validation_result

        except Exception as e:
            if self.debug:
                import traceback
                traceback.print_exc()
            self.stats["validation_failures"] += 1
            # Return failed validation
            return False, {"error": str(e)}

    def insert_exercise(
        self, exercise_data: Dict, language: str, level: str, topic: str, exercise_type: str
    ) -> bool:
        """Insert validated exercise into database.

        Args:
            exercise_data: Validated exercise data
            language: Target language
            level: Difficulty level
            topic: Topic
            exercise_type: Type of exercise

        Returns:
            True if successfully inserted, False otherwise
        """
        if self.dry_run:
            print(f"  [DRY RUN] Would insert {exercise_type} exercise")
            return True

        try:
            with LanguageDB(self.db_path) as db:
                # Generate lesson ID (unique identifier)
                timestamp = datetime.now().strftime('%Y%m%d%H%M%S%f')
                lesson_id = f"{language}_{level}_{topic}_{exercise_type}_{timestamp}"
                unique_suffix = f"{timestamp}_{uuid.uuid4().hex[:8]}"

                # Insert based on exercise type
                if exercise_type == "conversations":
                    db.add_conversation_exercise(
                        exercise_name=f"{language}_{level}_{topic}_conversation_{unique_suffix}",
                        language=language,
                        topic=topic,
                        difficulty_level=level.capitalize(),
                        conversations=exercise_data.get("conversation", []),
                        summary=exercise_data.get("conversation_summary", ""),
                        lesson_id=lesson_id,
                    )
                elif exercise_type == "pairs":
                    pairs = exercise_data.get("word_pairs", [])
                    db.add_pair_exercise_batch(
                        exercise_name=f"{language}_{level}_{topic}_pairs_{unique_suffix}",
                        language=language,
                        topic=topic,
                        difficulty_level=level.capitalize(),
                        language_1="English",
                        language_2=language,
                        pairs=pairs,
                        lesson_id=lesson_id,
                    )
                elif exercise_type == "translations":
                    db.add_translation_exercise(
                        exercise_name=f"{language}_{level}_{topic}_translation_{unique_suffix}",
                        language=language,
                        topic=topic,
                        difficulty_level=level.capitalize(),
                        language_1="English",
                        language_2=language,
                        language_1_content=exercise_data.get("English", ""),
                        language_2_content=exercise_data.get(language, ""),
                        lesson_id=lesson_id,
                    )
                elif exercise_type == "fill_in_blank":
                    db.add_fill_in_blank_exercise(
                        exercise_name=f"{language}_{level}_{topic}_fill_in_blank_{unique_suffix}",
                        language=language,
                        topic=topic,
                        difficulty_level=level.capitalize(),
                        sentence=exercise_data.get("sentence", ""),
                        correct_answer=exercise_data.get("correct_answer", ""),
                        incorrect_1=exercise_data.get("incorrect_1", ""),
                        incorrect_2=exercise_data.get("incorrect_2", ""),
                        blank_position=exercise_data.get("blank_position", 0),
                        translation=exercise_data.get("translation", ""),
                        lesson_id=lesson_id,
                    )

            self.stats["total_inserted"] += 1
            return True

        except Exception as e:
            if self.debug:
                import traceback
                traceback.print_exc()
            print(f"  Error inserting exercise: {e}")
            return False

    def process_combination(self, combination: Dict, pbar=None) -> List[Dict]:
        """Process a single combination with retries.

        Args:
            combination: Dictionary with language, level, topic, exercise_type
            pbar: Optional tqdm progress bar to update

        Returns:
            List of failures (empty if all succeeded)
        """
        language = combination["language"]
        level = combination["level"]
        topic = combination["topic"]
        exercise_type = combination["exercise_type"]

        lessons_per_combo = self.config["generation_settings"]["lessons_per_combination"]
        max_retries = self.config["generation_settings"]["max_retries"]

        combination_failures = []

        for lesson_num in range(lessons_per_combo):
            self.stats["total_attempted"] += 1
            success = False

            for attempt in range(max_retries):
                # Generate exercise (may return a single dict or list of dicts for fill_in_blank)
                exercise_data = self.generate_exercise(language, level, topic, exercise_type)

                if exercise_data is None:
                    continue  # Try again

                # All exercise types now return a single dict
                # Validate exercise
                passed, validation_result = self.validate_exercise(
                    exercise_data, language, level, exercise_type
                )

                if not passed:
                    failed_validation = validation_result
                    # Log validation failure on last attempt
                    if attempt == max_retries - 1:
                        combination_failures.append(
                            {
                                "combination": combination.copy(),
                                "lesson_number": lesson_num,
                                "attempt": attempt + 1,
                                "error_type": "validation_failed",
                                "validation_result": _convert_to_dict(failed_validation) if failed_validation else "Unknown error",
                                "generated_data": _convert_to_dict(exercise_data),
                            }
                        )
                    continue  # Try again

                # Validation passed!
                print(f"  ✅ Validation passed (score: {validation_result.overall_quality_score})")

                # Check similarity to existing exercises
                existing_for_similarity = self.fetch_existing_exercises_for_examples(
                    language, level, topic, exercise_type, limit=10
                )
                if existing_for_similarity:
                    converter = get_converter(exercise_type, language, level)
                    is_similar, reason = converter.is_too_similar(
                        exercise_data, existing_for_similarity, threshold=0.6
                    )
                    if is_similar:
                        print(f"  ❌ Similarity check failed: {reason}")
                        # Log similarity failure on last attempt
                        if attempt == max_retries - 1:
                            combination_failures.append(
                                {
                                    "combination": combination.copy(),
                                    "lesson_number": lesson_num,
                                    "attempt": attempt + 1,
                                    "error_type": "similarity_check_failed",
                                    "error_message": reason,
                                    "generated_data": _convert_to_dict(exercise_data),
                                }
                            )
                        continue  # Try again

                print(f"  ✅ Similarity check passed, inserting into database...")
                # Insert into database
                if self.insert_exercise(exercise_data, language, level, topic, exercise_type):
                    print(f"  ✅ Successfully inserted exercise!")
                    success = True
                    break  # Success, move to next lesson
                else:
                    print(f"  ❌ Failed to insert exercise")
                    # Database insertion failed - continue to retry
                    continue

            if not success and len(combination_failures) == 0:
                # Failed all retries but no validation failure logged (must be generation failure)
                combination_failures.append(
                    {
                        "combination": combination.copy(),
                        "lesson_number": lesson_num,
                        "attempt": max_retries,
                        "error_type": "generation_failed",
                        "error_message": "Failed to generate exercise after max retries",
                    }
                )

            # Update progress bar after each lesson
            if pbar:
                pbar.update(1)

        return combination_failures

    def run(
        self,
        languages_filter: Optional[List[str]] = None,
        levels_filter: Optional[List[str]] = None,
        topics_filter: Optional[List[str]] = None,
        exercise_types_filter: Optional[List[str]] = None,
        max_combinations: Optional[int] = None,
    ):
        """Run the content generation pipeline.

        Args:
            languages_filter: Filter to specific languages
            levels_filter: Filter to specific levels
            topics_filter: Filter to specific topics
            exercise_types_filter: Filter to specific exercise types
            max_combinations: Limit number of combinations (for testing)
        """
        # Get combinations to process
        combinations = self.get_combinations(
            languages_filter, levels_filter, topics_filter, exercise_types_filter
        )

        if max_combinations:
            combinations = combinations[:max_combinations]

        print(f"\n{'='*80}")
        print(f"CONTENT GENERATION PIPELINE")
        print(f"{'='*80}")
        print(f"Total combinations to process: {len(combinations)}")
        print(f"Lessons per combination: {self.config['generation_settings']['lessons_per_combination']}")
        print(
            f"Total exercises to generate: {len(combinations) * self.config['generation_settings']['lessons_per_combination']}"
        )
        print(f"{'='*80}\n")

        # Setup models
        self.setup_models()

        # Calculate total exercises for progress bar
        total_exercises = len(combinations) * self.config['generation_settings']['lessons_per_combination']

        # Process each combination sequentially with progress bar per exercise
        with tqdm(total=total_exercises, desc="Generating exercises") as pbar:
            for combination in combinations:
                failures = self.process_combination(combination, pbar)
                self.failures.extend(failures)

        # Print summary
        self.print_summary()

        # Save failures
        if self.failures:
            self.save_failures()

    def print_summary(self):
        """Print generation statistics."""
        print(f"\n{'='*80}")
        print(f"GENERATION SUMMARY")
        print(f"{'='*80}")
        print(f"Total attempted: {self.stats['total_attempted']}")
        print(f"Successfully generated: {self.stats['total_generated']}")
        print(f"Successfully validated: {self.stats['total_validated']}")
        print(f"Successfully inserted: {self.stats['total_inserted']}")
        print(f"Generation failures: {self.stats['generation_failures']}")
        print(f"Validation failures: {self.stats['validation_failures']}")
        print(f"Total failures: {len(self.failures)}")

        if self.stats['total_attempted'] > 0:
            success_rate = (
                self.stats['total_inserted'] / self.stats['total_attempted'] * 100
            )
            print(f"Success rate: {success_rate:.1f}%")

        print(f"{'='*80}\n")

    def save_failures(self):
        """Save failures to JSON file."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        failures_dir = Path("logs/generation")
        failures_dir.mkdir(parents=True, exist_ok=True)

        failures_file = failures_dir / f"failures_{timestamp}.json"

        # Convert all Pydantic models to dicts for JSON serialization
        # Use the recursive converter on the entire failures list
        failures_data = {
            "timestamp": datetime.now().isoformat(),
            "config_used": self.config,
            "stats": self.stats,
            "failures": _convert_to_dict(self.failures),
        }

        with open(failures_file, "w") as f:
            json.dump(failures_data, f, indent=2)

        print(f"Failures saved to: {failures_file}")

    def load_failures(self, failures_file: str) -> List[Dict]:
        """Load failures from JSON file for retry.

        Args:
            failures_file: Path to failures JSON file

        Returns:
            List of failure dictionaries
        """
        with open(failures_file, "r") as f:
            failures_data = json.load(f)

        return failures_data.get("failures", [])

    def retry_failures(self, failures_file: str):
        """Retry failed combinations from a previous run.

        Args:
            failures_file: Path to failures JSON file
        """
        print(f"\nLoading failures from: {failures_file}")
        failures = self.load_failures(failures_file)

        print(f"Found {len(failures)} failures to retry")

        # Extract unique combinations from failures
        combinations = []
        seen = set()

        for failure in failures:
            combo = failure.get("combination", {})
            combo_key = (
                combo.get("language"),
                combo.get("level"),
                combo.get("topic"),
                combo.get("exercise_type"),
            )

            if combo_key not in seen:
                seen.add(combo_key)
                combinations.append(combo)

        print(f"Unique combinations to retry: {len(combinations)}")

        # Setup models
        self.setup_models()

        # Calculate total exercises for progress bar
        total_exercises = len(combinations) * self.config['generation_settings']['lessons_per_combination']

        # Process each combination with progress bar per exercise
        with tqdm(total=total_exercises, desc="Retrying exercises") as pbar:
            for combination in combinations:
                failures = self.process_combination(combination, pbar)
                self.failures.extend(failures)

        # Print summary
        self.print_summary()

        # Save new failures
        if self.failures:
            self.save_failures()

    def check_existing_content(
        self, language: str, level: str, topic: str, exercise_type: str
    ) -> bool:
        """Check if content already exists in database for this combination.

        Args:
            language: Target language
            level: Difficulty level
            topic: Topic
            exercise_type: Exercise type

        Returns:
            True if content exists, False otherwise
        """
        try:
            with LanguageDB(self.db_path) as db:
                # Query for existing exercises using JOINs to avoid needing IDs
                query = """
                    SELECT COUNT(*) FROM exercises_info e
                    JOIN languages l ON e.language_id = l.id
                    JOIN difficulties d ON e.difficulty_id = d.id
                    JOIN topics t ON e.topic_id = t.id
                    WHERE l.language = ? AND d.difficulty_level = ? AND t.topic = ?
                    AND e.exercise_type = ?
                """
                db.cursor.execute(query, (language, level.capitalize(), topic, exercise_type))
                result = db.cursor.fetchone()
                count = result[0] if result else 0

                return count > 0

        except Exception as e:
            if self.debug:
                print(f"Error checking existing content: {e}")
            return False

    def fetch_existing_exercises_for_examples(
        self, language: str, level: str, topic: str, exercise_type: str, limit: int = 3
    ) -> Optional[List[Dict[str, Any]]]:
        """Fetch existing exercises to use as examples for generation.

        Args:
            language: Target language
            level: Difficulty level
            topic: Topic
            exercise_type: Exercise type
            limit: Maximum number of examples to fetch (default 3)

        Returns:
            List of exercise dictionaries or None if no exercises exist
        """
        try:
            with LanguageDB(self.db_path) as db:
                # Map exercise types to their table names (support both singular and plural)
                type_to_table = {
                    "fill_in_blank": "fill_in_blank_exercises",
                    "translation": "translation_exercises",
                    "translations": "translation_exercises",  # Support plural form
                    "multiple_choice": "multiple_choice_exercises",
                    "conversation": "conversation_exercises",
                    "conversations": "conversation_exercises",  # Support plural form
                    "pair": "pair_exercises",
                    "pairs": "pair_exercises",  # Support plural form
                }

                table_name = type_to_table.get(exercise_type)
                if not table_name:
                    if self.debug:
                        print(f"Unknown exercise type for examples: {exercise_type}")
                    return None

                # Query for existing exercises
                query = f"""
                    SELECT ex.* FROM {table_name} ex
                    JOIN exercises_info e ON ex.exercise_id = e.id
                    JOIN languages l ON e.language_id = l.id
                    JOIN difficulties d ON e.difficulty_id = d.id
                    JOIN topics t ON e.topic_id = t.id
                    WHERE l.language = ? AND d.difficulty_level = ? AND t.topic = ?
                    ORDER BY RANDOM()
                    LIMIT ?
                """
                db.cursor.execute(query, (language, level.capitalize(), topic, limit * 2))
                rows = db.cursor.fetchall()

                if not rows:
                    return None

                # Get column names
                columns = [description[0] for description in db.cursor.description]

                # Convert rows to dictionaries
                exercises = []
                seen_content = set()  # Track unique content

                for row in rows:
                    exercise_dict = dict(zip(columns, row))

                    # Create a unique key based on exercise type
                    # For fill-in-blank: sentence + translation
                    # For translation: language_1_content + language_2_content
                    # For others: primary content field
                    if exercise_type == "fill_in_blank":
                        unique_key = (
                            exercise_dict.get("sentence", ""),
                            exercise_dict.get("translation", "")
                        )
                    elif exercise_type == "translation":
                        unique_key = (
                            exercise_dict.get("language_1_content", ""),
                            exercise_dict.get("language_2_content", "")
                        )
                    else:
                        # For other types, use first text field as unique key
                        unique_key = str(list(exercise_dict.values())[2:4])  # Skip id and exercise_id

                    # Only add if we haven't seen this content before
                    if unique_key not in seen_content:
                        seen_content.add(unique_key)
                        exercises.append(exercise_dict)

                    # Stop if we have enough unique examples
                    if len(exercises) >= limit:
                        break

                return exercises if exercises else None

        except Exception as e:
            if self.debug:
                print(f"Error fetching existing exercises for examples: {e}")
                import traceback
                traceback.print_exc()
            return None

    def filter_existing_combinations(
        self, combinations: List[Dict]
    ) -> Tuple[List[Dict], int]:
        """Filter out combinations that already exist in the database.

        Args:
            combinations: List of combination dictionaries

        Returns:
            Tuple of (filtered_combinations, skipped_count)
        """
        filtered = []
        skipped = 0

        for combo in combinations:
            exists = self.check_existing_content(
                combo["language"],
                combo["level"],
                combo["topic"],
                combo["exercise_type"],
            )

            if not exists:
                filtered.append(combo)
            else:
                skipped += 1

        return filtered, skipped


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Generate language learning content with integrated validation"
    )

    # Basic arguments
    parser.add_argument(
        "--config",
        type=str,
        default="content/generation/config/database_generation.json",
        help="Path to configuration JSON file",
    )
    parser.add_argument(
        "--db-path",
        type=str,
        help="Path to database file (defaults to repo root/database/languageLearningDatabase.db)",
    )

    # Filtering arguments
    parser.add_argument(
        "--languages",
        type=str,
        help="Comma-separated list of languages to generate (e.g., 'French,Spanish')",
    )
    parser.add_argument(
        "--levels",
        type=str,
        help="Comma-separated list of difficulty levels (e.g., 'beginner,intermediate')",
    )
    parser.add_argument(
        "--topics",
        type=str,
        help="Comma-separated list of topics (e.g., 'Greetings and introductions,Food')",
    )
    parser.add_argument(
        "--exercise-types",
        type=str,
        help="Comma-separated list of exercise types (e.g., 'conversations,fill_in_blank')",
    )

    # Model overrides
    parser.add_argument(
        "--generation-model",
        type=str,
        help="Override generation model from config",
    )
    parser.add_argument(
        "--validation-model",
        type=str,
        help="Override validation model from config",
    )

    # Debug flags
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug mode with prompt/response inspection",
    )
    parser.add_argument(
        "--no-think",
        action="store_true",
        help="Prepend /no_think to model prompts",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Don't insert to database (testing only)",
    )
    parser.add_argument(
        "--max-combinations",
        type=int,
        help="Limit number of combinations (for testing)",
    )

    # Incremental database updates
    parser.add_argument(
        "--add-language",
        type=str,
        help="Add new language to existing database (generates all levels/topics/types for this language)",
    )
    parser.add_argument(
        "--add-level",
        type=str,
        help="Add new level to existing database (generates all languages/topics/types for this level)",
    )
    parser.add_argument(
        "--add-topic",
        type=str,
        help="Add new topic to existing database (generates all languages/levels/types for this topic)",
    )

    # Retry failures
    parser.add_argument(
        "--retry-failures",
        type=str,
        help="Retry from failures JSON file",
    )

    args = parser.parse_args()

    # Set up database path
    if args.db_path:
        db_path = args.db_path
    else:
        script_dir = Path(__file__).parent.parent  # repo root directory
        db_path = str(script_dir / "database" / "languageLearningDatabase.db")

        # Create database directory if it doesn't exist
        db_dir = script_dir / "database"
        db_dir.mkdir(exist_ok=True)

    # Parse filters
    languages_filter = None
    if args.languages:
        languages_filter = [lang.strip() for lang in args.languages.split(",")]

    levels_filter = None
    if args.levels:
        levels_filter = [level.strip() for level in args.levels.split(",")]

    topics_filter = None
    if args.topics:
        topics_filter = [topic.strip() for topic in args.topics.split(",")]

    exercise_types_filter = None
    if args.exercise_types:
        exercise_types_filter = [et.strip() for et in args.exercise_types.split(",")]

    # Create generator
    generator = ContentGenerator(
        config_path=args.config,
        db_path=db_path,
        generation_model=args.generation_model,
        validation_model=args.validation_model,
        debug=args.debug,
        no_think=args.no_think,
        dry_run=args.dry_run,
    )

    # Handle retry failures mode
    if args.retry_failures:
        generator.retry_failures(args.retry_failures)
        return

    # Handle --add-* arguments (incremental updates)
    if args.add_language:
        if not args.add_language in generator.config["languages"]:
            # Add to config temporarily
            generator.config["languages"].append(args.add_language)
        languages_filter = [args.add_language]
        print(f"Adding new language: {args.add_language}")
        print(f"Will generate all levels/topics/types for this language")

    if args.add_level:
        if not args.add_level in generator.config["levels"]:
            generator.config["levels"].append(args.add_level)
        levels_filter = [args.add_level]
        print(f"Adding new level: {args.add_level}")
        print(f"Will generate all languages/topics/types for this level")

    if args.add_topic:
        if not args.add_topic in generator.config["topics"]:
            generator.config["topics"].append(args.add_topic)
        topics_filter = [args.add_topic]
        print(f"Adding new topic: {args.add_topic}")
        print(f"Will generate all languages/levels/types for this topic")

    # Run generation
    generator.run(
        languages_filter=languages_filter,
        levels_filter=levels_filter,
        topics_filter=topics_filter,
        exercise_types_filter=exercise_types_filter,
        max_combinations=args.max_combinations,
    )


if __name__ == "__main__":
    main()
