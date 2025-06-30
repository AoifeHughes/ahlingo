#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script for Outlines integration with language lesson generation.
"""

import sys
import json
from pathlib import Path

# Add the content_creation directory to the path
sys.path.append(str(Path(__file__).parent))

from content_creation.outlines_generator import test_outlines_generation, generate_lessons_data_structured


def test_single_generation():
    """Test a single generation cycle to validate output structure."""
    print("=" * 60)
    print("Testing single generation cycle...")
    print("=" * 60)
    
    # Test parameters
    language = "French"
    level = "beginner" 
    topic = "food"
    
    try:
        for lesson_kind, lesson_id, json_response in generate_lessons_data_structured(
            language, level, topic, N_runs=1, lesson_kinds=["conversations"]
        ):
            print(f"\nLesson Kind: {lesson_kind}")
            print(f"Lesson ID: {lesson_id}")
            print(f"JSON Response (first 200 chars): {json_response[:200]}...")
            
            # Validate JSON structure
            data = json.loads(json_response)
            print(f"Successfully parsed JSON with {len(data)} exercises")
            
            # Print first exercise structure
            if data and len(data) > 0:
                print(f"First exercise keys: {list(data[0].keys())}")
                if 'conversation' in data[0]:
                    print(f"First conversation has {len(data[0]['conversation'])} turns")
                    
    except Exception as e:
        print(f"Error in single generation test: {e}")
        import traceback
        traceback.print_exc()


def test_all_types():
    """Test all three exercise types."""
    print("=" * 60)
    print("Testing all exercise types...")
    print("=" * 60)
    
    language = "Spanish"
    level = "intermediate"
    topic = "travel"
    
    for lesson_type in ["conversations", "pairs", "translations"]:
        print(f"\n--- Testing {lesson_type} ---")
        try:
            for lesson_kind, lesson_id, json_response in generate_lessons_data_structured(
                language, level, topic, N_runs=1, lesson_kinds=[lesson_type]
            ):
                data = json.loads(json_response)
                print(f"✓ {lesson_type}: Generated {len(data)} exercises")
                
                # Show structure of first exercise
                if data:
                    first_ex = data[0]
                    print(f"  Structure: {list(first_ex.keys())}")
                    
        except Exception as e:
            print(f"✗ {lesson_type}: Failed - {e}")


def compare_with_original():
    """Compare outlines output with original method (if available)."""
    print("=" * 60)
    print("Comparing with original method...")
    print("=" * 60)
    
    # This would require your original method to be available
    # For now, just show the outlines output structure
    
    language = "German"
    level = "beginner"
    topic = "family"
    
    print(f"Generating lessons for {language} - {level} - {topic}")
    
    for lesson_kind, lesson_id, json_response in generate_lessons_data_structured(
        language, level, topic, N_runs=1
    ):
        print(f"\n{lesson_kind.upper()} OUTPUT:")
        data = json.loads(json_response)
        print(json.dumps(data, indent=2, ensure_ascii=False)[:500] + "...")


if __name__ == "__main__":
    print("Starting Outlines integration tests...")
    
    # Run tests
    try:
        test_outlines_generation()
        print("\n" + "="*60)
        test_single_generation()
        print("\n" + "="*60) 
        test_all_types()
        print("\n" + "="*60)
        compare_with_original()
        
        print("\n" + "="*60)
        print("All tests completed!")
        print("If you see structured output above, Outlines is working correctly.")
        print("You can now use populate_database_with_outlines() in your generate_lessons.py")
        
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()