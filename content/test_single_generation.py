#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test a single lesson generation to verify the fixes work.
"""

import sys
from pathlib import Path
import json

# Add the content_creation directory to the path
sys.path.append(str(Path(__file__).parent))

from content_creation.outlines_generator import generate_lessons_data_structured, setup_outlines_model
from content_creation.generate_lessons import process_response
from database.database_manager import LanguageDB


def test_single_combination():
    """Test generating lessons for a single language/level/topic combination."""
    print("Testing single combination generation...")
    
    # Test parameters
    language = "French"
    level = "beginner"
    topic = "food"
    
    # Setup model once
    print("Setting up model...")
    model = setup_outlines_model()
    print("Model ready!")
    
    # Test database
    db = LanguageDB("test_database.db")
    
    try:
        print(f"Generating lessons for {language} - {level} - {topic}")
        
        for lesson_kind, lesson_id, json_response in generate_lessons_data_structured(
            language, level, topic, N_runs=1, model=model
        ):
            print(f"Generated {lesson_kind}: {len(json.loads(json_response))} exercises")
            
            # Test database insertion
            process_response(
                db=db,
                response=json_response,
                language=language,
                topic=topic,
                level=level,
                lesson_kind=lesson_kind,
                lesson_id=lesson_id
            )
            print(f"Successfully stored {lesson_kind} in database")
        
        print("✅ Single combination test completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    test_single_combination()