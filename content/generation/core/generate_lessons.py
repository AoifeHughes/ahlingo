# -*- coding: utf-8 -*-
import openai
import json
import re
from tqdm import tqdm
from typing import Dict, List, Any, Tuple, Generator
from content.database.database_manager import LanguageDB
from content.generation.utils.assistants import (
    default_conversation_assistants,
    default_pairs_assistants,
    default_translation_assistants,
)
import uuid
import csv
from datetime import datetime
import os
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

# Thread lock for CSV logging
_log_lock = threading.Lock()


def initialize_failure_log(log_path: str = None) -> str:
    """Initialize the failure log CSV file with headers."""
    if log_path is None:
        from pathlib import Path
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # Ensure logs directory exists
        logs_dir = Path(__file__).parent.parent.parent.parent / "logs" / "generation"
        logs_dir.mkdir(parents=True, exist_ok=True)
        log_path = str(logs_dir / f"generation_failures_{timestamp}.csv")

    # Create or overwrite the CSV file with headers
    with open(log_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(
            [
                "timestamp",
                "language",
                "level",
                "topic",
                "lesson_kind",
                "lesson_id",
                "exercise_index",
                "error_type",
                "error_message",
                "exercise_data",
            ]
        )

    return log_path


def log_failure(
    log_path: str,
    language: str,
    level: str,
    topic: str,
    lesson_kind: str,
    lesson_id: str,
    exercise_index: int = None,
    error_type: str = None,
    error_message: str = None,
    exercise_data: str = None,
):
    """Log a failure to the CSV file (thread-safe)."""
    with _log_lock:
        with open(log_path, "a", newline="", encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(
                [
                    datetime.now().isoformat(),
                    language,
                    level,
                    topic,
                    lesson_kind,
                    lesson_id,
                    exercise_index if exercise_index is not None else "N/A",
                    error_type if error_type else "Unknown",
                    error_message if error_message else "No message",
                    exercise_data if exercise_data else "No data",
                ]
            )


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
    """Safely load JSON data - simplified since outlines guarantees valid JSON."""
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON: {str(e)}") from e


def process_response(
    db: LanguageDB,
    response: str,
    language: str,
    topic: str,
    level: str,
    lesson_kind: str,
    lesson_id: str,
    log_path: str = None,
) -> None:
    """Process and insert response data into the database with validation."""
    try:
        # Parse the JSON response
        cleaned_response = safe_json_loads(response)

        # Data is already validated by Pydantic models during generation
        # No need for additional validation here

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
                            error_msg = f"Skipping conversation turn with empty speaker or message in exercise {idx + 1}"
                            print(error_msg)
                            if log_path:
                                log_failure(
                                    log_path,
                                    language,
                                    level,
                                    topic,
                                    lesson_kind,
                                    lesson_id,
                                    idx,
                                    "ValidationError",
                                    error_msg,
                                    json.dumps(conv),
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
                        error_msg = f"No valid conversation turns found for exercise {idx + 1}, skipping"
                        print(error_msg)
                        if log_path:
                            log_failure(
                                log_path,
                                language,
                                level,
                                topic,
                                lesson_kind,
                                lesson_id,
                                idx,
                                "ValidationError",
                                error_msg,
                                json.dumps(exercise),
                            )
                        continue

                    summary = clean_text(exercise["conversation_summary"])
                    if not summary:
                        error_msg = f"Empty summary for conversation exercise {idx + 1}, skipping"
                        print(error_msg)
                        if log_path:
                            log_failure(
                                log_path,
                                language,
                                level,
                                topic,
                                lesson_kind,
                                lesson_id,
                                idx,
                                "ValidationError",
                                error_msg,
                                json.dumps(exercise),
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
                                error_msg = f"Skipping pair with empty English or {language} word"
                                print(error_msg)
                                if log_path:
                                    log_failure(
                                        log_path,
                                        language,
                                        level,
                                        topic,
                                        lesson_kind,
                                        lesson_id,
                                        0,
                                        "ValidationError",
                                        error_msg,
                                        json.dumps(pair_exercise),
                                    )
                                continue

                            cleaned_pairs.append(
                                {"English": english_word, language: target_word}
                            )

                        # Only insert if we have valid pairs
                        if not cleaned_pairs:
                            error_msg = (
                                f"No valid word pairs found, skipping batch insertion"
                            )
                            print(error_msg)
                            if log_path:
                                log_failure(
                                    log_path,
                                    language,
                                    level,
                                    topic,
                                    lesson_kind,
                                    lesson_id,
                                    0,
                                    "ValidationError",
                                    error_msg,
                                    json.dumps(cleaned_response),
                                )
                            break

                        if (
                            len(cleaned_pairs) < 3
                        ):  # Minimum threshold for useful word pair exercise
                            error_msg = f"Too few valid pairs ({len(cleaned_pairs)}), skipping batch insertion"
                            print(error_msg)
                            if log_path:
                                log_failure(
                                    log_path,
                                    language,
                                    level,
                                    topic,
                                    lesson_kind,
                                    lesson_id,
                                    0,
                                    "ValidationError",
                                    error_msg,
                                    json.dumps(cleaned_pairs),
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
                        error_msg = f"Skipping translation exercise {idx + 1} with empty English or {language} sentence"
                        print(error_msg)
                        if log_path:
                            log_failure(
                                log_path,
                                language,
                                level,
                                topic,
                                lesson_kind,
                                lesson_id,
                                idx,
                                "ValidationError",
                                error_msg,
                                json.dumps(exercise),
                            )
                        continue

                    # Check for reasonable sentence length (not just single words)
                    if (
                        len(english_sentence.split()) < 1
                        or len(target_sentence.split()) < 1
                    ):
                        error_msg = f"Skipping translation exercise {idx + 1} with sentences that are too short"
                        print(error_msg)
                        if log_path:
                            log_failure(
                                log_path,
                                language,
                                level,
                                topic,
                                lesson_kind,
                                lesson_id,
                                idx,
                                "ValidationError",
                                error_msg,
                                json.dumps(exercise),
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
                elif lesson_kind == "fill_in_blank":
                    sentence = clean_text(exercise["sentence"])
                    correct_answer = clean_text(exercise["correct_answer"])
                    incorrect_1 = clean_text(exercise["incorrect_1"])
                    incorrect_2 = clean_text(exercise["incorrect_2"])
                    blank_position = exercise["blank_position"]
                    translation = clean_text(exercise["translation"])

                    # Additional validation for database insertion
                    if (
                        not sentence
                        or not correct_answer
                        or not incorrect_1
                        or not incorrect_2
                        or not translation
                    ):
                        error_msg = f"Skipping fill-in-blank exercise {idx + 1} with empty sentence, answer options, or translation"
                        print(error_msg)
                        if log_path:
                            log_failure(
                                log_path,
                                language,
                                level,
                                topic,
                                lesson_kind,
                                lesson_id,
                                idx,
                                "ValidationError",
                                error_msg,
                                json.dumps(exercise),
                            )
                        continue

                    # Validate blank position is an integer
                    if not isinstance(blank_position, int):
                        error_msg = f"Skipping fill-in-blank exercise {idx + 1} with invalid blank_position"
                        print(error_msg)
                        if log_path:
                            log_failure(
                                log_path,
                                language,
                                level,
                                topic,
                                lesson_kind,
                                lesson_id,
                                idx,
                                "ValidationError",
                                error_msg,
                                json.dumps(exercise),
                            )
                        continue

                    # Validate sentence contains exactly one blank
                    if sentence.count("_") != 1:
                        error_msg = f"Skipping fill-in-blank exercise {idx + 1} with incorrect number of blanks"
                        print(error_msg)
                        if log_path:
                            log_failure(
                                log_path,
                                language,
                                level,
                                topic,
                                lesson_kind,
                                lesson_id,
                                idx,
                                "ValidationError",
                                error_msg,
                                json.dumps(exercise),
                            )
                        continue

                    db.add_fill_in_blank_exercise(
                        exercise_name=exercise_name,
                        language=language,
                        topic=topic,
                        difficulty_level=level,
                        sentence=sentence,
                        correct_answer=correct_answer,
                        incorrect_1=incorrect_1,
                        incorrect_2=incorrect_2,
                        blank_position=blank_position,
                        translation=translation,
                        lesson_id=lesson_id,
                    )
            except Exception as e:
                import logging

                error_msg = f"Error processing exercise {idx + 1} for {language}_{topic}_{level}_{lesson_id} in {lesson_kind}: {str(e)}"
                logging.error(error_msg)
                if log_path:
                    log_failure(
                        log_path,
                        language,
                        level,
                        topic,
                        lesson_kind,
                        lesson_id,
                        idx,
                        "ProcessingError",
                        str(e),
                        json.dumps(exercise) if "exercise" in locals() else "No data",
                    )
                continue

    except Exception as e:
        import logging

        error_msg = f"Error processing response for {language}_{topic}_{level}_{lesson_id} in {lesson_kind}: {str(e)}"
        logging.error(error_msg)
        if log_path:
            log_failure(
                log_path,
                language,
                level,
                topic,
                lesson_kind,
                lesson_id,
                None,
                "ResponseProcessingError",
                str(e),
                response[:500] if response else "No response",
            )


def process_language_level_topic(args):
    """Worker function to process a single language-level-topic combination."""
    language, level, topic, model, db_loc, log_path, exercise_types = args

    try:
        from content.generation.core.outlines_generator import generate_lessons_data_structured

        # Create a separate database connection for this thread
        db = LanguageDB(db_loc)

        try:
            # Use Outlines generation with shared model
            # Pass exercise_types as lesson_kinds parameter
            for (
                lesson_kind,
                lesson_id,
                json_response,
            ) in generate_lessons_data_structured(
                language,
                level,
                topic,
                model=model,
                log_path=log_path,
                lesson_kinds=exercise_types,
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
                    log_path=log_path,
                )
        finally:
            db.close()

        return f"Completed: {language}-{level}-{topic}"

    except Exception as e:
        import logging

        error_msg = f"Error processing {language}_{level}_{topic}: {str(e)}"
        logging.error(error_msg)
        log_failure(
            log_path,
            language,
            level,
            topic,
            "ALL",
            "N/A",
            None,
            "GenerationError",
            str(e),
            "N/A",
        )
        import traceback

        traceback.print_exc()
        return f"Failed: {language}-{level}-{topic}: {str(e)}"


def populate_database(
    db_loc: str = None,
    max_workers: int = 5,
    exercise_types: List[str] = None,
    languages_filter: List[str] = None,
    levels_filter: List[str] = None,
):
    """Main function to generate lessons and populate the database using Outlines.

    Args:
        db_loc: Path to database file
        max_workers: Number of parallel workers
        exercise_types: List of exercise types to generate (conversations, pairs, translations, fill_in_blank)
        languages_filter: List of languages to generate (filters languages.txt)
        levels_filter: List of difficulty levels to generate (filters levels.txt)
    """
    from content.generation.core.outlines_generator import (
        generate_lessons_data_structured,
        setup_outlines_model,
    )
    import os
    from pathlib import Path

    # Get the repository root directory (go up from content/generation/core/)
    script_dir = Path(__file__).parent.parent.parent.parent  # repo root directory

    # Set default database location relative to repo root
    if db_loc is None:
        db_loc = str(script_dir / "database" / "languageLearningDatabase.db")

    # Initialize failure log
    log_path = initialize_failure_log()
    print(f"Failure log initialized at: {log_path}")

    # Read configuration files relative to content directory
    config_dir = script_dir / "content" / "generation" / "config"
    with open(config_dir / "topics.txt", "r") as file:
        topics = [line.strip() for line in file]
    with open(config_dir / "languages.txt", "r") as file:
        all_languages = [line.strip() for line in file]
    with open(config_dir / "levels.txt", "r") as file:
        all_levels = [line.strip() for line in file]

    # Apply filters if provided
    languages = languages_filter if languages_filter else all_languages
    levels = levels_filter if levels_filter else all_levels

    print("Running with Outlines structured generation:")
    print("Languages:", ", ".join(languages))
    print("Levels:", ", ".join(levels))
    print("Topics:", ", ".join(topics))
    if exercise_types:
        print("Exercise types:", ", ".join(exercise_types))
    else:
        print("Exercise types: All")

    # Setup model once for reuse
    model = setup_outlines_model()

    combinations = [
        (language, level, topic)
        for language in languages
        for level in levels
        for topic in topics
    ]
    total = len(combinations)

    print(f"Processing {total} combinations with {max_workers} parallel workers...")

    # Prepare arguments for worker function
    worker_args = [
        (lang, level, topic, model, db_loc, log_path, exercise_types)
        for lang, level, topic in combinations
    ]

    # Use ThreadPoolExecutor for parallel processing
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        with tqdm(total=total, desc="Parallel Generation Progress") as pbar:
            # Submit all tasks
            future_to_combination = {
                executor.submit(process_language_level_topic, args): args[:3]
                for args in worker_args
            }

            # Process completed tasks
            for future in as_completed(future_to_combination):
                combination = future_to_combination[future]
                try:
                    result = future.result()
                    # Result contains success/failure message
                    if "Failed:" in result:
                        print(f"Warning: {result}")
                except Exception as e:
                    lang, level, topic = combination
                    print(f"Unexpected error for {lang}-{level}-{topic}: {e}")
                finally:
                    pbar.update(1)
        print("Database generation complete!")

        # Set database version from centralized version file
        # Version is automatically synced with package.json version
        import sys

        sys.path.insert(0, str(script_dir))
        from version import DATABASE_VERSION, __version__

        from database.database_manager import LanguageDB

        with LanguageDB(db_loc) as db:
            db.set_database_version(DATABASE_VERSION)
            print(
                f"Database version set to {DATABASE_VERSION} (app version {__version__})"
            )

        print(f"\nFailure log saved to: {log_path}")

        # Print a summary of failures
        try:
            with open(log_path, "r", newline="", encoding="utf-8") as csvfile:
                reader = csv.reader(csvfile)
                next(reader)  # Skip header
                failures = list(reader)
                if failures:
                    print(f"Total failures logged: {len(failures)}")
                    print("\nFailure summary by type:")
                    error_types = {}
                    for row in failures:
                        error_type = row[7]  # error_type column
                        error_types[error_type] = error_types.get(error_type, 0) + 1
                    for error_type, count in sorted(error_types.items()):
                        print(f"  {error_type}: {count}")
                else:
                    print("No failures logged - all generations successful!")
        except Exception as e:
            print(f"Could not read failure log summary: {e}")
