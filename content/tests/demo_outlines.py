#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Demo script showing how to use the new Outlines integration.

This script demonstrates the enhanced lesson generation system that:
- Uses Outlines for structured, reliable JSON generation
- Integrates proven examples from assistants.py
- Eliminates repetitive conversation loops
- Provides high-quality, varied content

Run this script to see the improved lesson generation in action.
"""

import sys
from pathlib import Path
import json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Add the content_creation directory to the path
sys.path.append(str(Path(__file__).parent))

from content.generation.core.generate_lessons import populate_database
from content.generation.core.outlines_generator import generate_lessons_data_structured


def demo_single_lesson():
    """Generate a single lesson to show the output format."""
    print("=" * 60)
    print("DEMO: Generating a single lesson with Outlines")
    print("=" * 60)

    language = "French"
    level = "beginner"
    topic = "food"

    print(f"Generating {language} {level} lessons about {topic}...")

    for lesson_kind, lesson_id, json_response in generate_lessons_data_structured(
        language, level, topic, N_runs=1, lesson_kinds=["pairs"]
    ):
        print(f"\nLesson Type: {lesson_kind}")
        print(f"Lesson ID: {lesson_id}")

        # Parse and display the JSON
        data = json.loads(json_response)
        print(f"Generated {len(data)} exercises:")

        for i, exercise in enumerate(data[:3]):  # Show first 3
            print(
                f"  Exercise {i+1}: {json.dumps(exercise, ensure_ascii=False, indent=4)}"
            )

        if len(data) > 3:
            print(f"  ... and {len(data) - 3} more exercises")


def demo_all_types():
    """Generate all three types of exercises."""
    print("\n" + "=" * 60)
    print("DEMO: Generating all exercise types")
    print("=" * 60)

    language = "Spanish"
    level = "intermediate"
    topic = "travel"

    for lesson_kind, lesson_id, json_response in generate_lessons_data_structured(
        language, level, topic, N_runs=1
    ):
        data = json.loads(json_response)
        print(f"\n{lesson_kind.upper()}: {len(data)} exercises generated")

        # Show first exercise of each type
        if data:
            first = data[0]
            print(f"Sample: {json.dumps(first, ensure_ascii=False, indent=2)}")


if __name__ == "__main__":
    print("Outlines Integration Demo")
    print("This script demonstrates the new structured generation.")
    print("Make sure your Ollama server is running with qwen/qwen3-4b model.")

    try:
        demo_single_lesson()
        demo_all_types()

        print("\n" + "=" * 60)
        print("SUCCESS: Outlines integration is working!")
        print("\nTo use this for full database population:")
        print("from content.generation.core.generate_lessons import populate_database")
        print(
            "populate_database()  # Uses Outlines structured generation with 10 exercises per topic!"
        )

    except Exception as e:
        print(f"Error: {e}")
        import traceback

        traceback.print_exc()
