#!/usr/bin/env python3
"""
Test script for the new Outlines-based generation system.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from content_creation.generate_lessons import generate_lessons_data, process_structured_response
from database.database_manager import LanguageDB

def test_generation():
    """Test the new structured generation system."""
    print("Testing Outlines-based generation...")
    
    # Test parameters
    language = "French"
    level = "beginner"
    topic = "animals"
    
    try:
        # Test generation for each exercise type
        lesson_kinds = ["conversations"]  # Start with just conversations for testing
        
        for lesson_kind, lesson_id, structured_response in generate_lessons_data(
            language=language,
            level=level, 
            topic=topic,
            N_runs=1,
            lesson_kinds=lesson_kinds
        ):
            print(f"\n--- Generated {lesson_kind} exercise ---")
            print(f"Lesson ID: {lesson_id}")
            print(f"Response type: {type(structured_response)}")
            print(f"Response: {structured_response}")
            
            # Test processing the response
            print(f"\n--- Testing database processing ---")
            
            # Create a test database in memory
            db = LanguageDB(":memory:")
            
            try:
                process_structured_response(
                    db=db,
                    structured_data=structured_response,
                    language=language,
                    topic=topic,
                    level=level,
                    lesson_kind=lesson_kind,
                    lesson_id=lesson_id,
                )
                print("✅ Database processing successful!")
                
                # Check what was inserted
                if lesson_kind == "conversations":
                    exercises = db.get_random_conversation_exercise(language, level, topic, 1)
                    print(f"✅ Found {len(exercises)} conversation exercise(s) in database")
                    
            except Exception as e:
                print(f"❌ Database processing failed: {e}")
                import traceback
                traceback.print_exc()
            finally:
                db.close()
                
    except Exception as e:
        print(f"❌ Generation failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🧪 Testing Outlines integration...")
    test_generation()
    print("🏁 Test completed!")