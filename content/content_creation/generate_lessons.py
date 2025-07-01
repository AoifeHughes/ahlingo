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
    """Process and insert response data into the database with validation."""
    try:
        # Parse the JSON response
        cleaned_response = safe_json_loads(response)

        # Import and apply validation from outlines_generator
        from .outlines_generator import (
            validate_conversations,
            validate_pairs,
            validate_translations,
            ValidationError,
        )

        # Validate the response data before processing
        try:
            if lesson_kind == "conversations":
                validated_response = validate_conversations(cleaned_response, language)
            elif lesson_kind == "pairs":
                validated_response = validate_pairs(cleaned_response, language)
            elif lesson_kind == "translations":
                validated_response = validate_translations(cleaned_response, language)
            else:
                raise ValueError(f"Unknown lesson kind: {lesson_kind}")
        except ValidationError as ve:
            print(
                f"Validation failed for {lesson_kind} {language}-{topic}-{level} (ID: {lesson_id}): {ve}"
            )
            print("Skipping database insertion for this lesson.")
            return  # Don't insert invalid data

        # Use validated response instead of cleaned_response
        cleaned_response = validated_response

        lesson_name = f"{topic} {lesson_kind.title()} Lesson - ID: {lesson_id}"

        for idx, exercise in enumerate(cleaned_response):
            exercise_name = f"{lesson_name} - Exercise {idx + 1}"

            try:
                if lesson_kind == "conversations":
                    # Clean conversation messages
                    cleaned_conversations = []
                    for conv in exercise["conversation"]:
                        speaker = clean_text(conv["speaker"])
                        message = clean_text(conv["message"])

                        # Additional validation for database insertion
                        if not speaker or not message:
                            print(
                                f"Skipping conversation turn with empty speaker or message in exercise {idx + 1}"
                            )
                            continue

                        cleaned_conversations.append(
                            {
                                "speaker": speaker,
                                "message": message,
                            }
                        )

                    # Only insert if we have valid conversations
                    if not cleaned_conversations:
                        print(
                            f"No valid conversation turns found for exercise {idx + 1}, skipping"
                        )
                        continue

                    summary = clean_text(exercise["conversation_summary"])
                    if not summary:
                        print(
                            f"Empty summary for conversation exercise {idx + 1}, skipping"
                        )
                        continue

                    db.add_conversation_exercise(
                        exercise_name=exercise_name,
                        language=language,
                        topic=topic,
                        difficulty_level=level,
                        conversations=cleaned_conversations,
                        summary=summary,
                        lesson_id=lesson_id,
                    )
                elif lesson_kind == "pairs":
                    # For pairs, we want to process the entire batch at once rather than individual pairs
                    # This should only execute once per response since we're handling all pairs together
                    if idx == 0:  # Only process on the first iteration
                        # Clean all pairs in the response with additional validation
                        cleaned_pairs = []
                        for pair_exercise in cleaned_response:
                            english_word = clean_text(pair_exercise["English"])
                            target_word = clean_text(pair_exercise[language])

                            # Additional validation for database insertion
                            if not english_word or not target_word:
                                print(
                                    f"Skipping pair with empty English or {language} word"
                                )
                                continue

                            cleaned_pairs.append(
                                {"English": english_word, language: target_word}
                            )

                        # Only insert if we have valid pairs
                        if not cleaned_pairs:
                            print(
                                f"No valid word pairs found, skipping batch insertion"
                            )
                            break

                        if (
                            len(cleaned_pairs) < 5
                        ):  # Minimum threshold for useful word pair exercise
                            print(
                                f"Too few valid pairs ({len(cleaned_pairs)}), skipping batch insertion"
                            )
                            break

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
                    english_sentence = clean_text(exercise["English"])
                    target_sentence = clean_text(exercise[language])

                    # Additional validation for database insertion
                    if not english_sentence or not target_sentence:
                        print(
                            f"Skipping translation exercise {idx + 1} with empty English or {language} sentence"
                        )
                        continue

                    # Check for reasonable sentence length (not just single words)
                    if (
                        len(english_sentence.split()) < 2
                        or len(target_sentence.split()) < 1
                    ):
                        print(
                            f"Skipping translation exercise {idx + 1} with sentences that are too short"
                        )
                        continue

                    db.add_translation_exercise(
                        exercise_name=exercise_name,
                        language=language,
                        topic=topic,
                        difficulty_level=level,
                        language_1="English",
                        language_2=language,
                        language_1_content=english_sentence,
                        language_2_content=target_sentence,
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
    from .outlines_generator import (
        generate_lessons_data_structured,
        setup_outlines_model,
    )

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
                    for (
                        lesson_kind,
                        lesson_id,
                        json_response,
                    ) in generate_lessons_data_structured(
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
                            lesson_id=lesson_id,
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
