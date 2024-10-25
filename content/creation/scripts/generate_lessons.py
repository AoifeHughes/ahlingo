import openai
import json
import os
import re
from tqdm import tqdm
from assistants import default_conversation_assistants, default_translation_assistants, default_pairs_assistants
from assistants import blank_conversation_assistants, blank_translation_assistants, blank_pairs_assistants



def load_assistant_content(language, lesson_kind, topic, level):
    folder = f"../../{language}/{lesson_kind}/{topic}/{level}/"
    file_pattern = f"{language}_{topic}_{level}_0_0.json"
    file_path = os.path.join(folder, file_pattern)

    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            content = json.load(f)
            return json.dumps(content)
    else:
        return ""

def generate_lessons_data(language, level, topic, N_runs=5, lesson_kinds=['conversations', 'pairs', 'translations'], use_saved_output=False):
    def make_conversation_system(language, topic, level):
        return {
            "role": "system",
            "content": f'You are a {language} language learning tool. Your task is to generate a JSON array containing {level} level {language} conversations related to the topic "{topic}". Each conversation should have a clear objective, specified roles for the speakers, and a conversation summary. The conversations should be engaging, natural, and aligned with the language level. Include a mix of questions, responses, and idiomatic expressions. Aim for 4-6 turns per conversation.'
        }

    def make_pairs_system(language, topic, level):
        return {
            "role": "system",
            "content": f'You are a {language} language learning tool. Your task is to generate a JSON array containing pairs of {language} words and their English translations. The words should be common and relevant to the topic "{topic}" at the {level} level. Include a mix of nouns, verbs, adjectives, and adverbs. Aim for 10-15 word pairs.'
        }

    def make_translation_system(language, topic, level):
        return {
            "role": "system",
            "content": f'You are a {language} language learning tool. Your task is to generate a JSON array containing {level} level {language} sentences and their English translations. The sentences should be focused on the topic "{topic}" and showcase relevant vocabulary and grammar structures. Vary the sentence structures and include a mix of statements, questions, and commands. Aim for 5-8 sentence pairs.'
        }

    client = openai.OpenAI(
        base_url="http://localhost:8080/v1",
        api_key="sk-no-key-required"
    )

    def generate_responses():
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

            # Load assistant content from saved output file, if it exists
            if use_saved_output:
                better_content = load_assistant_content(language, lesson_kind, topic, level)
                if better_content != "":
                    assistant["content"] = better_content

            for _ in range(N_runs):
                user1 = {
                    "role": "user",
                    "content": f"Generate a variety of {level} level {language} {lesson_kind} exercises related to the topic '{topic}'. The exercises should be engaging, contextually relevant, and designed to improve vocabulary, grammar, and communication skills. Please provide the responses in the specified JSON format."
                }

                user2 = {
                    "role": "user",
                    "content": f"Great! Now, generate 5 more varied examples for {lesson_kind} exercises at the {level} level, focusing on the topic '{topic}'. Ensure that the exercises are well-structured, cover different aspects of the language, and maintain the JSON format in your response."
                }

                completion = client.chat.completions.create(
                    model="llama",
                    messages=[
                        system,
                        user1,
                        assistant,
                        user2
                    ],
                    temperature=0.9,
                )
                raw_response = completion.choices[0].message.content
                json_response = re.search(r'\[(.*)\]', raw_response, re.DOTALL)
                if json_response:
                    yield json_response.group()
                else:
                    yield raw_response

    return generate_responses()

def dump_response(response, language, topic, level, idx, run, folder):
    try:
        response_json = json.loads(response)
        os.makedirs(folder, exist_ok=True)
        with open(os.path.join(folder, f"{language}_{topic}_{level}_{idx}_{run}.json"), "w") as f:
            json.dump(response_json, f, indent=4, ensure_ascii=False)
    except json.JSONDecodeError:
        broken_folder = os.path.join(folder, "broken")
        os.makedirs(broken_folder, exist_ok=True)
        with open(os.path.join(broken_folder, f"{language}_{topic}_{level}_{idx}_broken_{run}.json"), "w") as f:
            f.write(response)

with open('topics.txt', 'r') as file:
    topics = [line.strip() for line in file]

with open('languages.txt', 'r') as file:
    languages = [line.strip() for line in file]

with open('levels.txt', 'r') as file:
    levels = [line.strip() for line in file]

print("Running with the following parameters:")
print("Languages:", ", ".join(languages))
print("Levels:", ", ".join(levels))
print("Topics:", ", ".join(topics))

for language in tqdm(languages, desc="Languages"):
    for level in tqdm(levels, desc="Levels"):
        for topic in tqdm(topics, desc="Topics"):
            for lesson_kind in ['conversations', 'pairs', 'translations']:
                run = 0
                for idx, response in enumerate(generate_lessons_data(language, level, topic, N_runs=2, lesson_kinds=[lesson_kind])):
                    output_folder = f"../../{language}/{lesson_kind}/{topic}/{level}/"
                    dump_response(response, language, topic, level, idx, run, output_folder)
                    run += 1