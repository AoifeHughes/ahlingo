default_conversation_assistants = {
    "French": {
        "role": "assistant",
        "content": '[{"conversation": [{"speaker": "person1", "message": "Quel est ton animal préféré ?"}, {"speaker": "person2", "message": "Mon animal préféré est le chat. Et toi ?"}, {"speaker": "person1", "message": "J\'aime les chiens. Ils sont très fidèles."}], "conversation_summary": "A conversation discussing each person\'s favorite animal."}, {"conversation": [{"speaker": "person1", "message": "Tu aimes la nature ?"}, {"speaker": "person2", "message": "Oui, j\'adore me promener dans la forêt."}, {"speaker": "person1", "message": "Moi aussi. C\'est très relaxant d\'écouter les oiseaux."}], "conversation_summary": "A conversation about enjoying nature, especially walking in the forest and listening to birds."}]'
    },
    "German": {
        "role": "assistant",
        "content": '[{"conversation": [{"speaker": "Person 1", "message": "Was ist dein Lieblingstier?"}, {"speaker": "Person 2", "message": "Mein Lieblingstier ist die Katze. Und deins?"}, {"speaker": "Person 1", "message": "Ich mag Hunde. Sie sind sehr treu."}], "conversation_summary": "A conversation discussing each person\'s favorite animal."}, {"conversation": [{"speaker": "Person 1", "message": "Magst du die Natur?"}, {"speaker": "Person 2", "message": "Ja, ich liebe es, im Wald spazieren zu gehen."}, {"speaker": "Person 1", "message": "Ich auch. Es ist sehr entspannend, den Vögeln zuzuhören."}], "conversation_summary": "A conversation about enjoying nature, especially walking in the forest and listening to birds."}]'
    },
    "Spanish": {
        "role": "assistant",
        "content": '[{"conversation": [{"speaker": "Persona 1", "message": "¿Cuál es tu animal favorito?"}, {"speaker": "Persona 2", "message": "Mi animal favorito es el gato. ¿Y el tuyo?"}, {"speaker": "Persona 1", "message": "Me gustan los perros. Son muy leales."}], "conversation_summary": "A conversation about each person\'s favorite animal."}, {"conversation": [{"speaker": "Persona 1", "message": "¿Te gusta la naturaleza?"}, {"speaker": "Persona 2", "message": "Sí, me encanta pasear por el bosque."}, {"speaker": "Persona 1", "message": "A mí también. Es muy relajante escuchar a los pájaros."}], "conversation_summary": "A conversation about enjoying nature, especially walking in the forest and listening to birds."}]'
    }
}

default_pairs_assistants = {
    "French": {
        "role": "assistant",
        "content": '[{"English": "apple", "French": "pomme"}, {"English": "book", "French": "livre"}, {"English": "car", "French": "voiture"}, {"English": "dog", "French": "chien"}, {"English": "house", "French": "maison"}, {"English": "love", "French": "amour"}, {"English": "moon", "French": "lune"}, {"English": "sun", "French": "soleil"}, {"English": "tree", "French": "arbre"}, {"English": "water", "French": "eau"}]'
    },
    "German": {
        "role": "assistant",
        "content": '[{"English": "apple", "German": "Apfel"}, {"English": "book", "German": "Buch"}, {"English": "car", "German": "Auto"}, {"English": "dog", "German": "Hund"}, {"English": "house", "German": "Haus"}, {"English": "love", "German": "Liebe"}, {"English": "moon", "German": "Mond"}, {"English": "sun", "German": "Sonne"}, {"English": "tree", "German": "Baum"}, {"English": "water", "German": "Wasser"}]'
    },
    "Spanish": {
        "role": "assistant",
        "content": '[{"English": "apple", "Spanish": "manzana"}, {"English": "book", "Spanish": "libro"}, {"English": "car", "Spanish": "coche"}, {"English": "dog", "Spanish": "perro"}, {"English": "house", "Spanish": "casa"}, {"English": "love", "Spanish": "amor"}, {"English": "moon", "Spanish": "luna"}, {"English": "sun", "Spanish": "sol"}, {"English": "tree", "Spanish": "árbol"}, {"English": "water", "Spanish": "agua"}]'
    }
}

default_translation_assistants = {
    "French": {
        "role": "assistant",
        "content": '[{"English": "How are you today?", "French": "Comment vas-tu aujourd\'hui ?"}, {"English": "I am learning to speak French.", "French": "J\'apprends à parler français."}, {"English": "The weather is nice this afternoon.", "French": "Le temps est agréable cet après-midi."}, {"English": "Can you help me with my homework?", "French": "Peux-tu m\'aider avec mes devoirs ?"}, {"English": "My family is going on vacation next week.", "French": "Ma famille part en vacances la semaine prochaine."}, {"English": "This restaurant has delicious food.", "French": "Ce restaurant a de la nourriture délicieuse."}]'
    },
    "German": {
        "role": "assistant",
        "content": '[{"English": "How are you today?", "German": "Wie geht es dir heute?"}, {"English": "I am learning to speak German.", "German": "Ich lerne Deutsch zu sprechen."}, {"English": "The weather is nice this afternoon.", "German": "Das Wetter ist heute Nachmittag schön."}, {"English": "Can you help me with my homework?", "German": "Kannst du mir bei meinen Hausaufgaben helfen?"}, {"English": "My family is going on vacation next week.", "German": "Meine Familie macht nächste Woche Urlaub."}, {"English": "This restaurant has delicious food.", "German": "Dieses Restaurant hat köstliches Essen."}]'
    },
    "Spanish": {
        "role": "assistant",
        "content": '[{"English": "How are you today?", "Spanish": "¿Cómo estás hoy?"}, {"English": "I am learning to speak Spanish.", "Spanish": "Estoy aprendiendo a hablar español."}, {"English": "The weather is nice this afternoon.", "Spanish": "El clima es agradable esta tarde."}, {"English": "Can you help me with my homework?", "Spanish": "¿Puedes ayudarme con mi tarea?"}, {"English": "My family is going on vacation next week.", "Spanish": "Mi familia se va de vacaciones la próxima semana."}, {"English": "This restaurant has delicious food.", "Spanish": "Este restaurante tiene comida deliciosa."}]'
    }
}

blank_conversation_assistants = {
    "French": {
        "role": "assistant",
        "content": ""
    },
    "German": {
        "role": "assistant",
        "content": ""
    },
    "Spanish": {
        "role": "assistant",
        "content": ""
    }
}

blank_pairs_assistants = {
    "French": {
        "role": "assistant",
        "content": ""
    },
    "German": {
        "role": "assistant",
        "content": ""
    },
    "Spanish": {
        "role": "assistant",
        "content": ""
    }
}

blank_translation_assistants = {
    "French": {
        "role": "assistant",
        "content": ""
    },
    "German": {
        "role": "assistant",
        "content": ""
    },
    "Spanish": {
        "role": "assistant",
        "content": ""
    }
}