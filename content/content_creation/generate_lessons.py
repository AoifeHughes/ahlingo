# -*- coding: utf-8 -*-
import openai
import json
import re
from tqdm import tqdm
from typing import Dict, List, Any, Tuple, Generator
from database.database_manager import LanguageDB
from .assistants import (
    default_conversation_assistants,
    default_pairs_assistants,
    default_translation_assistants,
)
import uuid


def clean_text(text: str) -> str:
    """Clean and normalize text content with proper escaping."""
    if not text:
        return ""

    # One-pass replacement for better performance
    replacements = {
        "\\'": "'",  # Remove existing escaped single quotes
        '\\"': '"',  # Remove existing escaped double quotes
        "\\n": " ",  # Replace newlines with spaces
        "\\t": " ",  # Replace tabs with spaces
        '"': '\\"',  # Escape double quotes
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    # Remove any invalid escape sequences
    text = re.sub(r'\\([^"\\/bfnrtu])', r"\1", text)

    # Normalize spaces in one pass
    text = " ".join(text.split())

    return text


def safe_json_loads(text: str) -> Any:
    """Safely load JSON data with fallback approaches."""
    try:
        # First try: direct parse
        return json.loads(text)
    except json.JSONDecodeError:
        try:
            # Second try: find and extract JSON array
            json_match = re.search(r"\[[\s\S]*\]", text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            raise ValueError("No JSON array found in response")
        except Exception as e:
            raise ValueError(f"Failed to parse JSON: {str(e)}")


def process_response(
    db: LanguageDB,
    response: str,
    language: str,
    topic: str,
    level: str,
    lesson_kind: str,
    lesson_id: str,
) -> None:
    """Process and insert response data into the database."""
    try:
        # Parse the JSON response
        cleaned_response = safe_json_loads(response)

        lesson_name = f"{topic} {lesson_kind.title()} Lesson - ID: {lesson_id}"

        for idx, exercise in enumerate(cleaned_response):
            exercise_name = f"{lesson_name} - Exercise {idx + 1}"

            try:
                if lesson_kind == "conversations":
                    # Clean conversation messages
                    cleaned_conversations = []
                    for conv in exercise["conversation"]:
                        cleaned_conversations.append(
                            {
                                "speaker": clean_text(conv["speaker"]),
                                "message": clean_text(conv["message"]),
                            }
                        )

                    db.add_conversation_exercise(
                        exercise_name=exercise_name,
                        language=language,
                        topic=topic,
                        difficulty_level=level,
                        conversations=cleaned_conversations,
                        summary=clean_text(exercise["conversation_summary"]),
                        lesson_id=lesson_id,
                    )
                elif lesson_kind == "pairs":
                    # For pairs, we want to process the entire batch at once rather than individual pairs
                    # This should only execute once per response since we're handling all pairs together
                    if idx == 0:  # Only process on the first iteration
                        # Clean all pairs in the response
                        cleaned_pairs = []
                        for pair_exercise in cleaned_response:
                            cleaned_pairs.append({
                                "English": clean_text(pair_exercise["English"]),
                                language: clean_text(pair_exercise[language])
                            })
                        
                        # Add all pairs as a single exercise
                        db.add_pair_exercise_batch(
                            exercise_name=f"{lesson_name} - Exercise 1",
                            language=language,
                            topic=topic,
                            difficulty_level=level,
                            language_1="English",
                            language_2=language,
                            pairs=cleaned_pairs,
                            lesson_id=lesson_id,
                        )
                        # Skip the rest of the loop for pairs
                        break
                elif lesson_kind == "translations":
                    db.add_translation_exercise(
                        exercise_name=exercise_name,
                        language=language,
                        topic=topic,
                        difficulty_level=level,
                        language_1="English",
                        language_2=language,
                        language_1_content=clean_text(exercise["English"]),
                        language_2_content=clean_text(exercise[language]),
                        lesson_id=lesson_id,
                    )
            except Exception as e:
                print(
                    f"Error processing exercise {idx + 1} for {language}_{topic}_{level}_{lesson_id} in {lesson_kind}: {str(e)}"
                )
                continue

    except Exception as e:
        print(
            f"Error processing response for {language}_{topic}_{level}_{lesson_id} in {lesson_kind}: {str(e)}"
        )





def populate_database(db_loc: str = "../database/languageLearningDatabase.db"):
    """Main function to generate lessons and populate the database using Outlines."""
    from .outlines_generator import generate_lessons_data_structured, setup_outlines_model
    
    # Read configuration files
    with open("generation_data/topics.txt", "r") as file:
        topics = [line.strip() for line in file]
    with open("generation_data/languages.txt", "r") as file:
        languages = [line.strip() for line in file]
    with open("generation_data/levels.txt", "r") as file:
        levels = [line.strip() for line in file]
    
    print("Running with Outlines structured generation:")
    print("Languages:", ", ".join(languages))
    print("Levels:", ", ".join(levels))
    print("Topics:", ", ".join(topics))
    
    # Setup model once for reuse
    model = setup_outlines_model()
    
    db = LanguageDB(db_loc)
    
    try:
        combinations = [
            (language, level, topic)
            for language in languages
            for level in levels
            for topic in topics
        ]
        total = len(combinations)
        
        with tqdm(total=total, desc="Outlines Generation Progress") as pbar:
            for language, level, topic in combinations:
                try:
                    # Use Outlines generation with shared model
                    for lesson_kind, lesson_id, json_response in generate_lessons_data_structured(
                        language, level, topic, model=model
                    ):
                        # Use existing process_response function
                        process_response(
                            db=db,
                            response=json_response,
                            language=language,
                            topic=topic,
                            level=level,
                            lesson_kind=lesson_kind,
                            lesson_id=lesson_id
                        )
                except Exception as e:
                    print(f"Error processing {language}_{level}_{topic}: {str(e)}")
                    import traceback
                    traceback.print_exc()
                finally:
                    pbar.update(1)
    
    finally:
        db.close()
        print("Database generation complete!")


