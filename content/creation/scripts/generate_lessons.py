import openai
import json
import openai
import json
import os
from tqdm import tqdm


def generate_lessons_data(language, level, topic, N_runs = 5, lesson_kinds=['conversations', 'pairs', 'translations']):
    def make_conversation_system(language, topic, level):
        return {"role": "system", "content": f'You are a language learning tool, your task is to generate produce JSON containing a series of {language} conversations tailored to what you would expect in a {level} level text book on "{topic}" in {language} at {level} level.'}

    def make_pairs_system(language, topic, level):
        return {"role": "system", "content": f'You are a language learning tool, your task is to generate produce JSON containing a series of pairs of words in {language} and their translations in json, each pair should be a common word at {level} level and varied, these words should be related to the topic of "{topic}".'}

    def make_translation_system(language, topic, level):
        return {"role": "system", "content": f'You are a language learning tool, your task is to generate {language} sentences tailored to what you would expect in a {level} level text book and their English translations. Responses should be in JSON and be focused on the topic of "{topic}".'}

    conversation_assistant = {
        "role": "assistant",
        "content": '[{"conversation": [{"speaker": "person1", "message": "Quel est ton animal préféré ?"}, {"speaker": "person2", "message": "Mon animal préféré est le chat. Et toi ?"}, {"speaker": "person1", "message": "J\'aime les chiens. Ils sont très fidèles."}], "conversation_summary": "A conversation discussing each person\'s favorite animal."}, {"conversation": [{"speaker": "person1", "message": "Tu aimes la nature ?"}, {"speaker": "person2", "message": "Oui, j\'adore me promener dans la forêt."}, {"speaker": "person1", "message": "Moi aussi. C\'est très relaxant d\'écouter les oiseaux."}], "conversation_summary": "A conversation about enjoying nature, especially walking in the forest and listening to birds."}]'
    }

    pairs_assistant = {
        "role": "assistant",
        "content": '[{"English": "apple", "French": "pomme"}, {"English": "book", "French": "livre"}, {"English": "car", "French": "voiture"}, {"English": "dog", "French": "chien"}, {"English": "house", "French": "maison"}, {"English": "love", "French": "amour"}, {"English": "moon", "French": "lune"}, {"English": "sun", "French": "soleil"}, {"English": "tree", "French": "arbre"}, {"English": "water", "French": "eau"}]'
    }

    translation_assistant = {
        "role": "assistant",
        "content": '[{"English": "How are you today?", "French": "Comment vas-tu aujourd\'hui ?"}, {"English": "I am learning to speak French.", "French": "J\'apprends à parler français."}, {"English": "The weather is nice this afternoon.", "French": "Le temps est agréable cet après-midi."}, {"English": "Can you help me with my homework?", "French": "Peux-tu m\'aider avec mes devoirs ?"}, {"English": "My family is going on vacation next week.", "French": "Ma famille part en vacances la semaine prochaine."}, {"English": "This restaurant has delicious food.", "French": "Ce restaurant a de la nourriture délicieuse."}]'
    }

    client = openai.OpenAI(
        base_url="http://localhost:8080/v1",  # "http://<Your api-server IP>:port"
        api_key="sk-no-key-required"
    )

    user1 = {"role": "user", "content": "Generate some language exercises for me."}
    user2 = {"role": "user", "content": "Create 5 more examples in the same JSON format."}      

    def generate_responses():
        for run in range(N_runs):
            conversation_system = make_conversation_system(language, topic, level)
            pairs_system = make_pairs_system(language, topic, level)
            translation_system = make_translation_system(language, topic, level)
            systems = []
            assistants = []

            if 'conversations' in lesson_kinds:
                systems.append(conversation_system)
                assistants.append(conversation_assistant)
            if 'pairs' in lesson_kinds:
                systems.append(pairs_system)
                assistants.append(pairs_assistant)
            if 'translations' in lesson_kinds: 
                systems.append(translation_system)
                assistants.append(translation_assistant)


            for idx, (system, assistant) in enumerate(zip(systems, assistants)):
                completion = client.chat.completions.create(
                    model="mistral",
                    messages=[
                        system,
                        user1,
                        assistant,
                        user2
                    ],
                    temperature=0.8,
                )
                raw_response = completion.choices[0].message.content
                yield raw_response

    return generate_responses()

def dump_response(response, language, topic, level, idx, run, folder):
    try:
        response = json.loads(response)
        # create folder and subfolders if they don't exist
        os.makedirs(folder, exist_ok=True)
        # write to file
        with open(os.path.join(folder, f"{language}_{topic}_{level}_{idx}_{run}.json"), "w") as f:
            json.dump(response, f, indent=4, ensure_ascii=False)
    except json.JSONDecodeError:
        # create folder and subfolders if they don't exist
        bkn_folder = folder+"/broken/"
        os.makedirs(bkn_folder, exist_ok=True)
        # write as text
        with open(os.path.join(bkn_folder, f"{language}_{topic}_{level}_{idx}_broken_{run}.json"), "w") as f:
            f.write(response)



with open('topics.txt', 'r') as file:
    topics = [line.strip() for line in file]

with open('languages.txt', 'r') as file:
    languages = [line.strip() for line in file]

with open('levels.txt', 'r') as file:
    levels = [line.strip() for line in file]

print("Running with the following parameters:")
print("Languages: ", "\n".join(languages))
print("Levels: ", "\n".join(levels))
print("Topics: ", "\n".join(topics))


for language in tqdm(languages, desc="Languages"):
    for level in tqdm(levels, desc="Levels"):
        for topic in tqdm(topics, desc="Topics"):
            for lesson_kind in ['conversations', 'pairs', 'translations']:
                run = 0
                for idx, response in enumerate(generate_lessons_data(language, level, topic, N_runs=3, lesson_kinds=[lesson_kind])):
                    output_folder = f"../../{language}/{lesson_kind}/{topic}/{level}/"
                    dump_response(response, language, topic, level, idx, run, output_folder)
                    run += 1