#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Test script to verify that the fill-in-blank validation catches ambiguous exercises.
"""

import sys
from pathlib import Path
import json

# Add content directory to Python path
content_dir = Path(__file__).parent / "content"
sys.path.insert(0, str(content_dir))

from content.generation.utils.database_validator import DatabaseValidator
from content.generation.utils.exercise_converters import FillInBlankConverter
from content.generation.utils.validation_models import parse_validation_result


def test_ambiguous_exercise():
    """Test validation with an intentionally ambiguous exercise."""

    # Create a validator
    validator = DatabaseValidator(":memory:")  # Use in-memory DB for testing
    validator.setup_model()

    # Create an ambiguous exercise (family members)
    ambiguous_exercise = {
        "id": "test_ambiguous",
        "exercise_type": "fill_in_blank",
        "language": "French",
        "difficulty_level": "beginner",
        "topic": "family",
        "sentence": "Je visite mon _",
        "correct_answer": "frère",
        "incorrect_1": "père",
        "incorrect_2": "oncle",
        "blank_position": 2,
        "translation": "I visit my brother",
    }

    print("Testing ambiguous exercise validation...")
    print(f"Exercise: {ambiguous_exercise['sentence']}")
    print(
        f"Options: {ambiguous_exercise['correct_answer']}, {ambiguous_exercise['incorrect_1']}, {ambiguous_exercise['incorrect_2']}"
    )

    # Validate the exercise
    try:
        result = validator.validate_exercise(ambiguous_exercise)

        print(f"\nValidation Results:")
        print(f"Overall Quality Score: {result.overall_quality_score}/10")
        print(f"Is Unambiguous: {getattr(result, 'is_unambiguous', 'N/A')}")
        print(f"Issues Found: {result.issues_found}")

        # Check if it caught the ambiguity
        if hasattr(result, "is_unambiguous") and not result.is_unambiguous:
            print("✅ SUCCESS: Validator correctly identified ambiguity!")
        elif result.overall_quality_score < 6:
            print("✅ PARTIAL SUCCESS: Low quality score suggests issues were found")
        else:
            print("❌ CONCERN: Validator may not have caught the ambiguity")

    except Exception as e:
        print(f"❌ ERROR: {e}")


def test_unambiguous_exercise():
    """Test validation with a clear, unambiguous exercise."""

    # Create a validator
    validator = DatabaseValidator(":memory:")
    validator.setup_model()

    # Create an unambiguous exercise (color context)
    unambiguous_exercise = {
        "id": "test_unambiguous",
        "exercise_type": "fill_in_blank",
        "language": "French",
        "difficulty_level": "beginner",
        "topic": "food",
        "sentence": "Je mange une _ rouge",
        "correct_answer": "pomme",
        "incorrect_1": "chat",
        "incorrect_2": "voiture",
        "blank_position": 3,
        "translation": "I eat a red apple",
    }

    print("\n" + "=" * 50)
    print("Testing unambiguous exercise validation...")
    print(f"Exercise: {unambiguous_exercise['sentence']}")
    print(
        f"Options: {unambiguous_exercise['correct_answer']}, {unambiguous_exercise['incorrect_1']}, {unambiguous_exercise['incorrect_2']}"
    )

    # Validate the exercise
    try:
        result = validator.validate_exercise(unambiguous_exercise)

        print(f"\nValidation Results:")
        print(f"Overall Quality Score: {result.overall_quality_score}/10")
        print(f"Is Unambiguous: {getattr(result, 'is_unambiguous', 'N/A')}")
        print(f"Issues Found: {result.issues_found}")

        # Check if it recognized good quality
        if hasattr(result, "is_unambiguous") and result.is_unambiguous:
            print("✅ SUCCESS: Validator correctly identified unambiguous exercise!")
        elif result.overall_quality_score >= 7:
            print("✅ PARTIAL SUCCESS: High quality score suggests good exercise")
        else:
            print("❌ UNEXPECTED: Validator gave low score to good exercise")

    except Exception as e:
        print(f"❌ ERROR: {e}")


if __name__ == "__main__":
    print("Testing Fill-in-Blank Ambiguity Validation")
    print("=" * 50)

    test_ambiguous_exercise()
    test_unambiguous_exercise()

    print("\n" + "=" * 50)
    print("Test completed! The validator should now catch ambiguous exercises.")
