# -*- coding: utf-8 -*-
import openai
import json
import re
from tqdm import tqdm
from typing import Generator, Dict, List, Any
from AHLingo.database.database_manager import LanguageDB
from .assistants import (
    default_conversation_assistants,
    default_pairs_assistants,
    default_translation_assistants,
)
import uuid
# import logging

# logging.disable(logging.CRITICAL)


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


def clean_json_string(text: str) -> str:
    """Clean and prepare JSON string for parsing."""
    if not text:
        return ""

    # Handle French apostrophes and common patterns in one pass
    french_patterns = {
        "m\\'": "m'",
        "d\\'": "d'",
        "l\\'": "l'",
        "j\\'": "j'",
        "t\\'": "t'",
        "s\\'": "s'",
        "qu\\'": "qu'",
        "n\\'": "n'",
        "c\\'": "c'",  # Added common French pattern
    }

    for pattern, replacement in french_patterns.items():
        text = text.replace(pattern, replacement)

    # Fix any remaining problematic escapes
    text = re.sub(r"\\+\'", "'", text)
    text = text.replace('\\"', '"')
    text = text.replace("\\n", " ")

    return text


def safe_json_loads(text: str) -> Any:
    """Safely load JSON data with multiple fallback approaches."""
    try:
        # First try: direct parse
        return json.loads(text)
    except json.JSONDecodeError:
        try:
            # Second try: clean the string first
            cleaned = clean_json_string(text)
            return json.loads(cleaned)
        except json.JSONDecodeError:
            try:
                # Third try: find and extract JSON array
                json_match = re.search(r"\[[\s\S]*\]", cleaned)
                if json_match:
                    return json.loads(json_match.group())
                raise ValueError("No JSON array found in response")
            except Exception as e:
                raise ValueError(f"Failed to parse JSON after cleaning: {str(e)}")


def process_response(
    db: LanguageDB,
    response: str,
    language: str,
    topic: str,
    level: str,
    lesson_kind: str,
    lesson_id: str,
) -> None:
    """Process and insert response data into the database with proper text cleaning."""
    try:
        # Parse the JSON response
        cleaned_response = safe_json_loads(response)

        # Validate the structure
        if not validate_json_structure(cleaned_response, language, lesson_kind):
            print(
                f"Invalid response structure for {language}_{topic}_{level}_{lesson_id} in {lesson_kind}"
            )
            return

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
                    )
                elif lesson_kind == "pairs":
                    db.add_pair_exercise(
                        exercise_name=exercise_name,
                        language=language,
                        topic=topic,
                        difficulty_level=level,
                        language_1="English",
                        language_2=language,
                        language_1_content=clean_text(exercise["English"]),
                        language_2_content=clean_text(exercise[language]),
                    )
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
                    )
            except Exception as e:
                print(
                    f"Error processing exercise {idx + 1} for {language}_{topic}_{level}_{lesson_id} in {lesson_kind}: {str(e)}"
                )
                continue

    except json.JSONDecodeError as e:
        print(
            f"JSON decode error for {language}_{topic}_{level}_{lesson_id} in {lesson_kind}: {str(e)}"
        )
    except Exception as e:
        print(
            f"Error processing response for {language}_{topic}_{level}_{lesson_id} in {lesson_kind}: {str(e)}"
        )


def validate_json_structure(
    response_json: List[Dict], language: str, lesson_kind: str
) -> bool:
    """Validate the structure and content of generated JSON responses."""
    if not isinstance(response_json, list):
        return False

    if lesson_kind == "conversations":
        sample = json.loads(default_conversation_assistants[language]["content"])
        required_keys = set(sample[0].keys())
        conversation_keys = set(sample[0]["conversation"][0].keys())

        for item in response_json:
            if not set(item.keys()) == required_keys:
                return False
            if not isinstance(item["conversation"], list):
                return False
            for message in item["conversation"]:
                if not set(message.keys()) == conversation_keys:
                    return False
                # Validate message content
                if not message["message"] or len(message["message"].strip()) == 0:
                    return False
                if "\\" in message["message"] and not any(
                    esc in message["message"] for esc in ["\\n", '\\"', "\\'"]
                ):
                    return False

    elif lesson_kind in ["pairs", "translations"]:
        sample = None
        if lesson_kind == "pairs":
            sample = json.loads(default_pairs_assistants[language]["content"])
        else:
            sample = json.loads(default_translation_assistants[language]["content"])

        required_keys = set(sample[0].keys())

        for item in response_json:
            if not set(item.keys()) == required_keys:
                return False
            # Validate content for each language
            for key in required_keys:
                if not item[key] or len(str(item[key]).strip()) == 0:
                    return False
                if "\\" in str(item[key]) and not any(
                    esc in str(item[key]) for esc in ["\\n", '\\"', "\\'"]
                ):
                    return False

    return True


def generate_lessons_data(
    language: str,
    level: str,
    topic: str,
    N_runs: int = 5,
    lesson_kinds: List[str] = ["conversations", "pairs", "translations"],
) -> Generator[tuple[str, str, Dict], None, None]:
    """Generate lesson data using the OpenAI API."""

    def make_conversation_system(
        language: str, topic: str, level: str
    ) -> Dict[str, str]:
        return {
            "role": "system",
            "content": f'You are a {language} language learning tool. Your task is to generate a JSON array containing {level} level {language} conversations related to the topic "{topic}". Each conversation should have a clear objective, specified roles for the speakers, and a conversation summary. The conversations should be engaging, natural, and aligned with the language level. Include a mix of questions, responses, and idiomatic expressions. Aim for 4-6 turns per conversation.',
        }

    def make_pairs_system(language: str, topic: str, level: str) -> Dict[str, str]:
        return {
            "role": "system",
            "content": f'You are a {language} language learning tool. Your task is to generate a JSON array containing pairs of {language} words and their English translations. Where possible use single words only. The words should be common and relevant to the topic "{topic}" at the {level} level. Include a mix of nouns, verbs, adjectives, and adverbs. Aim for 5-10 word pairs.',
        }

    def make_translation_system(
        language: str, topic: str, level: str
    ) -> Dict[str, str]:
        return {
            "role": "system",
            "content": f'You are a {language} language learning tool. Your task is to generate a JSON array containing {level} level {language} sentences and their English translations. The sentences should be focused on the topic "{topic}" and showcase relevant vocabulary and grammar structures. Vary the sentence structures and include a mix of statements, questions, and commands. Aim for 5 sentence pairs. These should be full sentences.',
        }

    client = openai.OpenAI(
        base_url="http://localhost:8080/v1", api_key="sk-no-key-required"
    )

    for lesson_kind in lesson_kinds:
        system = None
        assistant = None

        if lesson_kind == "conversations":
            system = make_conversation_system(language, topic, level)
            assistant = default_conversation_assistants[language]
        elif lesson_kind == "pairs":
            system = make_pairs_system(language, topic, level)
            assistant = default_pairs_assistants[language]
        elif lesson_kind == "translations":
            system = make_translation_system(language, topic, level)
            assistant = default_translation_assistants[language]

        for run in range(N_runs):
            lesson_id = str(uuid.uuid4())  # Generate a single ID for the entire lesson

            user1 = {
                "role": "user",
                "content": f"Generate a variety of {level} level {language} {lesson_kind} exercises related to the topic '{topic}'. The exercises should be engaging, contextually relevant, and designed to improve vocabulary, grammar, and communication skills. Please provide the responses in the specified JSON format.",
            }

            user2 = {
                "role": "user",
                "content": f"Perfect! Now, generate 5 more varied examples for {lesson_kind} exercises at the {level} level, focusing on the topic '{topic}'. Ensure that the exercises are well-structured, cover different aspects of the language, and maintain the JSON format in your response. Use the exact same naming convention for your JSON keys, do not create new ones.",
            }

            completion = client.chat.completions.create(
                model="llama",
                messages=[system, user1, assistant, user2],
                temperature=0.9,
            )
            raw_response = completion.choices[0].message.content
            json_response = re.search(r"\[(.*)\]", raw_response, re.DOTALL)
            if json_response:
                yield lesson_kind, lesson_id, raw_response, json_response.group()
            else:
                yield lesson_kind, lesson_id, raw_response, raw_response


def populate_database():
    """Main function to generate lessons and populate the database."""
    # Read configuration files
    with open("generation_data/topics.txt", "r") as file:
        topics = [line.strip() for line in file]
    with open("generation_data/languages.txt", "r") as file:
        languages = [line.strip() for line in file]
    with open("generation_data/levels.txt", "r") as file:
        levels = [line.strip() for line in file]

    print("Running with the following parameters:")
    print("Languages:", ", ".join(languages))
    print("Levels:", ", ".join(levels))
    print("Topics:", ", ".join(topics))

    db = LanguageDB("./database/languageLearningDatabase.db")

    try:
        total = len(languages) * len(levels) * len(topics)
        with tqdm(total=total, desc="Overall Progress") as pbar:
            for language in languages:
                for level in levels:
                    for topic in topics:
                        tqdm.write(f"\nProcessing: {language} - {level} - {topic}")
                        for (
                            lesson_kind,
                            lesson_id,
                            raw_response,
                            json_response,
                        ) in generate_lessons_data(
                            language,
                            level,
                            topic,
                            N_runs=5,
                            lesson_kinds=["conversations", "pairs", "translations"],
                        ):
                            process_response(
                                db=db,
                                response=json_response,
                                language=language,
                                topic=topic,
                                level=level,
                                lesson_kind=lesson_kind,
                                lesson_id=lesson_id,
                            )
                        pbar.update(1)
    finally:
        db.close()
