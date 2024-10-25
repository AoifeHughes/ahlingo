import openai
import json
import re
from tqdm import tqdm
from typing import Generator, Dict, Any, List
from AHLingo.database.database_manager import LanguageDB
from .assistants import default_conversation_assistants, default_pairs_assistants, default_translation_assistants
import uuid

def validate_json_structure(response_json: List[Dict], language: str, lesson_kind: str) -> bool:
    """Validate the structure of generated JSON responses."""
    if not isinstance(response_json, list):
        return False
    
    if lesson_kind == 'conversations':
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
    
    elif lesson_kind in ['pairs', 'translations']:
        sample = None
        if lesson_kind == 'pairs':
            sample = json.loads(default_pairs_assistants[language]["content"])
        else:
            sample = json.loads(default_translation_assistants[language]["content"])
        
        required_keys = set(sample[0].keys())
        
        for item in response_json:
            if not set(item.keys()) == required_keys:
                return False
            
    return True

def generate_lessons_data(
    language: str,
    level: str,
    topic: str,
    N_runs: int = 5,
    lesson_kinds: List[str] = ['conversations', 'pairs', 'translations']
) -> Generator[tuple[str, str, Dict], None, None]:
    """Generate lesson data using the OpenAI API."""
    
    def make_conversation_system(language: str, topic: str, level: str) -> Dict[str, str]:
        return {
            "role": "system",
            "content": f'You are a {language} language learning tool. Your task is to generate a JSON array containing {level} level {language} conversations related to the topic "{topic}". Each conversation should have a clear objective, specified roles for the speakers, and a conversation summary. The conversations should be engaging, natural, and aligned with the language level. Include a mix of questions, responses, and idiomatic expressions. Aim for 4-6 turns per conversation.'
        }

    def make_pairs_system(language: str, topic: str, level: str) -> Dict[str, str]:
        return {
            "role": "system",
            "content": f'You are a {language} language learning tool. Your task is to generate a JSON array containing pairs of {language} words and their English translations. The words should be common and relevant to the topic "{topic}" at the {level} level. Include a mix of nouns, verbs, adjectives, and adverbs. Aim for 10-15 word pairs.'
        }

    def make_translation_system(language: str, topic: str, level: str) -> Dict[str, str]:
        return {
            "role": "system",
            "content": f'You are a {language} language learning tool. Your task is to generate a JSON array containing {level} level {language} sentences and their English translations. The sentences should be focused on the topic "{topic}" and showcase relevant vocabulary and grammar structures. Vary the sentence structures and include a mix of statements, questions, and commands. Aim for 5-8 sentence pairs.'
        }

    client = openai.OpenAI(
        base_url="http://localhost:8080/v1",
        api_key="sk-no-key-required"
    )

    for lesson_kind in lesson_kinds:
        system = None
        assistant = None

        if lesson_kind == 'conversations':
            system = make_conversation_system(language, topic, level)
            assistant = default_conversation_assistants[language]
        elif lesson_kind == 'pairs':
            system = make_pairs_system(language, topic, level)
            assistant = default_pairs_assistants[language]
        elif lesson_kind == 'translations':
            system = make_translation_system(language, topic, level)
            assistant = default_translation_assistants[language]

        for run in range(N_runs):
            lesson_id = str(uuid.uuid4())  # Generate a single ID for the entire lesson
            
            user1 = {
                "role": "user",
                "content": f"Generate a variety of {level} level {language} {lesson_kind} exercises related to the topic '{topic}'. The exercises should be engaging, contextually relevant, and designed to improve vocabulary, grammar, and communication skills. Please provide the responses in the specified JSON format."
            }

            user2 = {
                "role": "user",
                "content": f"Perfect! Now, generate 5 more varied examples for {lesson_kind} exercises at the {level} level, focusing on the topic '{topic}'. Ensure that the exercises are well-structured, cover different aspects of the language, and maintain the JSON format in your response. Use the exact same naming convention for your JSON keys, do not create new ones."
            }

            completion = client.chat.completions.create(
                model="llama",
                messages=[system, user1, assistant, user2],
                temperature=0.9,
            )
            raw_response = completion.choices[0].message.content
            json_response = re.search(r'\[(.*)\]', raw_response, re.DOTALL)
            if json_response:
                yield lesson_kind, lesson_id, raw_response, json_response.group()
            else:
                yield lesson_kind, lesson_id, raw_response, raw_response

def process_response(
    db: LanguageDB,
    response: str,
    language: str,
    topic: str,
    level: str,
    lesson_kind: str,
    lesson_id: str
) -> None:
    """Process and insert response data into the database."""
    try:
        response_json = json.loads(response)
        
        if not validate_json_structure(response_json, language, lesson_kind):
            print(f"Invalid structure for {language}_{topic}_{level}_{lesson_id} in {lesson_kind}")
            return
            
        lesson_name = f"{topic} {lesson_kind.title()} Lesson - ID: {lesson_id}"
        
        for idx, exercise in enumerate(response_json):
            exercise_name = f"{lesson_name} - Exercise {idx + 1}"
            
            if lesson_kind == 'conversations':
                db.add_conversation_exercise(
                    exercise_name=exercise_name,
                    language=language,
                    topic=topic,
                    difficulty_level=level,
                    conversations=exercise["conversation"],
                    summary=exercise["conversation_summary"]
                )
            elif lesson_kind == 'pairs':
                db.add_pair_exercise(
                    exercise_name=exercise_name,
                    language=language,
                    topic=topic,
                    difficulty_level=level,
                    language_1="English",
                    language_2=language,
                    language_1_content=exercise["English"],
                    language_2_content=exercise[language]
                )
            elif lesson_kind == 'translations':
                db.add_translation_exercise(
                    exercise_name=exercise_name,
                    language=language,
                    topic=topic,
                    difficulty_level=level,
                    language_1="English",
                    language_2=language,
                    language_1_content=exercise["English"],
                    language_2_content=exercise[language]
                )
                
    except json.JSONDecodeError:
        print(f"JSON decode error for {language}_{topic}_{level}_{lesson_id} in {lesson_kind}")

def populate_database():
    """Main function to generate lessons and populate the database."""
    # Read configuration files
    with open('generation_data/topics.txt', 'r') as file:
        topics = [line.strip() for line in file]
    with open('generation_data/languages.txt', 'r') as file:
        languages = [line.strip() for line in file]

    with open('generation_data/levels.txt', 'r') as file:
        levels = [line.strip() for line in file]

    print("Running with the following parameters:")

    print("Languages:", ", ".join(languages))

    print("Levels:", ", ".join(levels))

    print("Topics:", ", ".join(topics))


    db = LanguageDB("./database/languageLearningDatabase.db")
    
    try:
        for language in tqdm(languages, desc="Languages"):
            for level in tqdm(levels, desc="Levels"):
                for topic in tqdm(topics, desc="Topics"):
                    for lesson_kind, lesson_id, raw_response, json_response in generate_lessons_data(
                        language, level, topic, N_runs=2, lesson_kinds=['conversations', 'pairs', 'translations']
                    ):
                        process_response(
                            db=db,
                            response=json_response,
                            language=language,
                            topic=topic,
                            level=level,
                            lesson_kind=lesson_kind,
                            lesson_id=lesson_id
                        )
    finally:
        db.close()

if __name__ == "__main__":
    main()