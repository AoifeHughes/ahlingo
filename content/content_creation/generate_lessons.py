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
                    db.add_pair_exercise(
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


def generate_lessons_data(
    language: str,
    level: str,
    topic: str,
    N_runs: int = 2,
    lesson_kinds: List[str] = ["conversations", "pairs", "translations"],
):
    """Generate lesson data using the OpenAI API."""

    def make_conversation_system(language: str, topic: str, level: str) -> Dict[str, str]:
        return {
            "role": "system",
            "content": f'You are a {language} language learning tool. Your task is to generate a JSON array containing {level} level {language} conversations related to the topic "{topic}". Each conversation should have a clear objective, specified roles for the speakers, and a conversation summary. The conversations should be engaging, natural, and aligned with the language level. Include a mix of questions, responses, and idiomatic expressions. Aim for 2-6 turns per conversation. Respond only with valid JSON and you must conform to the structure given in the example. Do not write an introduction to the task',
        }

    def make_pairs_system(language: str, topic: str, level: str) -> Dict[str, str]:
        return {
            "role": "system",
            "content": f'You are a {language} language learning tool. Your task is to generate a JSON array containing pairs of {language} words and their English translations. Where possible use single words only. The words should be common and relevant to the topic "{topic}" at the {level} level. Include a mix of nouns, verbs, adjectives, and adverbs. Aim for 5-10 word pairs. Respond only with valid JSON you must conform to the structure given in the example. Do not write an introduction to the task',
        }

    def make_translation_system(language: str, topic: str, level: str) -> Dict[str, str]:
        return {
            "role": "system",
            "content": f'You are a {language} language learning tool. Your task is to generate a JSON array containing {level} level {language} sentences and their English translations. The sentences should be focused on the topic "{topic}" and showcase relevant vocabulary and grammar structures. Vary the sentence structures and include a mix of statements, questions, and commands. Aim for 5 sentence pairs. These should be full sentences. Respond only with valid JSON and you must conform to the structure given in the example. Do not write an introduction to the task',
        }

    client = openai.OpenAI(
        base_url="http://localhost:11434/v1", api_key="sk-no-key-required"
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
            lesson_id = str(uuid.uuid4())

            user1 = {
                "role": "user",
                "content": f"Generate a variety of {level} level {language} {lesson_kind} exercises related to the topic '{topic}'. The exercises should be engaging, contextually relevant, and designed to improve vocabulary, grammar, and communication skills. Please provide the responses in the specified JSON format.",
            }

            # Create exercise-specific follow-up prompts
            if lesson_kind == "conversations":
                user2 = {
                    "role": "user",
                    "content": f"Perfect! Now, generate another conversation exercise using the same JSON template format as shown above. Each conversation should have at least 3 dialogue turns, but add more when useful to make a realistic conversation and be at the {level} level, focusing on the topic '{topic}'. Ensure the conversations are well-structured, natural, and maintain the exact same JSON structure and ensure realistic language appropriate names are used.",
                }
            elif lesson_kind == "pairs":
                user2 = {
                    "role": "user", 
                    "content": f"Perfect! Now, generate 8-12 more word pairs using the same JSON template format as shown above. Focus on single words at the {level} level related to the topic '{topic}'. Ensure you use the exact same JSON structure and key names, with simple word-to-word translations.",
                }
            else:  # translations
                user2 = {
                    "role": "user",
                    "content": f"Perfect! Now, generate 5-7 more sentence translation pairs using the same JSON template format as shown above. Create full sentences at the {level} level focused on the topic '{topic}'. Ensure the sentences are well-structured and maintain the exact same JSON structure and key names.",
                }

            completion = client.chat.completions.create(
                model="llama",
                messages=[system, user1, assistant, user2],
                temperature=0.9,
            )
            raw_response = completion.choices[0].message.content
            json_response = re.search(r"\[(.*)\]", raw_response, re.DOTALL)
            if json_response:
                yield lesson_kind, lesson_id, json_response.group()
            else:
                yield lesson_kind, lesson_id, raw_response


def process_combination(language: str, level: str, topic: str, db: LanguageDB):
    """Process a single language-level-topic combination."""
    for (
        lesson_kind,
        lesson_id,
        json_response,
    ) in generate_lessons_data(language, level, topic):
        process_response(
            db=db,
            response=json_response,
            language=language,
            topic=topic,
            level=level,
            lesson_kind=lesson_kind,
            lesson_id=lesson_id,
        )


def populate_database(db_loc: str = "../database/languageLearningDatabase.db"):
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

    db = LanguageDB(db_loc)

    try:
        # Create all combinations
        combinations = [
            (language, level, topic)
            for language in languages
            for level in levels
            for topic in topics
        ]
        total = len(combinations)

        # Process combinations with progress bar
        with tqdm(total=total, desc="Overall Progress") as pbar:
            for language, level, topic in combinations:
                try:
                    process_combination(language, level, topic, db)
                except Exception as e:
                    print(f"Error processing {language}_{level}_{topic}: {str(e)}")
                finally:
                    pbar.update(1)

    finally:
        db.close()
