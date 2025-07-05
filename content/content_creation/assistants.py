# -*- coding: utf-8 -*-
default_conversation_assistants = {
    "French": {
        "role": "assistant",
        "content": '[{"conversation": [{"speaker": "Marie", "message": "Quel est ton animal préféré ?"}, {"speaker": "Pierre", "message": "Mon animal préféré est le chat. Et toi ?"}, {"speaker": "Marie", "message": "J\'aime les chiens. Ils sont très fidèles."}], "conversation_summary": "A conversation discussing each person\'s favorite animal."}, {"conversation": [{"speaker": "Claire", "message": "Tu aimes la nature ?"}, {"speaker": "Julien", "message": "Oui, j\'adore me promener dans la forêt."}, {"speaker": "Claire", "message": "Moi aussi. C\'est très relaxant d\'écouter les oiseaux."}], "conversation_summary": "A conversation about enjoying nature, especially walking in the forest and listening to birds."}]',
    },
    "German": {
        "role": "assistant",
        "content": '[{"conversation": [{"speaker": "Anna", "message": "Was ist dein Lieblingstier?"}, {"speaker": "Hans", "message": "Mein Lieblingstier ist die Katze. Und deins?"}, {"speaker": "Anna", "message": "Ich mag Hunde. Sie sind sehr treu."}], "conversation_summary": "A conversation discussing each person\'s favorite animal."}, {"conversation": [{"speaker": "Lisa", "message": "Magst du die Natur?"}, {"speaker": "Max", "message": "Ja, ich liebe es, im Wald spazieren zu gehen."}, {"speaker": "Lisa", "message": "Ich auch. Es ist sehr entspannend, den Vögeln zuzuhören."}], "conversation_summary": "A conversation about enjoying nature, especially walking in the forest and listening to birds."}]',
    },
    "Spanish": {
        "role": "assistant",
        "content": '[{"conversation": [{"speaker": "María", "message": "¿Cuál es tu animal favorito?"}, {"speaker": "Carlos", "message": "Mi animal favorito es el gato. ¿Y el tuyo?"}, {"speaker": "María", "message": "Me gustan los perros. Son muy leales."}], "conversation_summary": "A conversation about each person\'s favorite animal."}, {"conversation": [{"speaker": "Ana", "message": "¿Te gusta la naturaleza?"}, {"speaker": "Diego", "message": "Sí, me encanta pasear por el bosque."}, {"speaker": "Ana", "message": "A mí también. Es muy relajante escuchar a los pájaros."}], "conversation_summary": "A conversation about enjoying nature, especially walking in the forest and listening to birds."}]',
    },
    "Ukrainian": {
        "role": "assistant",
        "content": '[{"conversation": [{"speaker": "Оксана", "message": "Яка твоя улюблена тварина?"}, {"speaker": "Іван", "message": "Моя улюблена тварина - кіт. А твоя?"}, {"speaker": "Оксана", "message": "Мені подобаються собаки. Вони дуже вірні."}], "conversation_summary": "A conversation discussing each person\'s favorite animal."}, {"conversation": [{"speaker": "Анна", "message": "Тобі подобається природа?"}, {"speaker": "Петро", "message": "Так, я обожнюю гуляти в лісі."}, {"speaker": "Анна", "message": "Я теж. Дуже заспокійливо слухати птахів."}], "conversation_summary": "A conversation about enjoying nature, especially walking in the forest and listening to birds."}]',
    },
}

default_pairs_assistants = {
    "French": {
        "role": "assistant",
        "content": '[{"English": "apple", "French": "pomme"}, {"English": "book", "French": "livre"}, {"English": "car", "French": "voiture"}, {"English": "dog", "French": "chien"}, {"English": "house", "French": "maison"}, {"English": "love", "French": "amour"}, {"English": "moon", "French": "lune"}, {"English": "sun", "French": "soleil"}, {"English": "tree", "French": "arbre"}, {"English": "water", "French": "eau"}]',
    },
    "German": {
        "role": "assistant",
        "content": '[{"English": "apple", "German": "Apfel"}, {"English": "book", "German": "Buch"}, {"English": "car", "German": "Auto"}, {"English": "dog", "German": "Hund"}, {"English": "house", "German": "Haus"}, {"English": "love", "German": "Liebe"}, {"English": "moon", "German": "Mond"}, {"English": "sun", "German": "Sonne"}, {"English": "tree", "German": "Baum"}, {"English": "water", "German": "Wasser"}]',
    },
    "Spanish": {
        "role": "assistant",
        "content": '[{"English": "apple", "Spanish": "manzana"}, {"English": "book", "Spanish": "libro"}, {"English": "car", "Spanish": "coche"}, {"English": "dog", "Spanish": "perro"}, {"English": "house", "Spanish": "casa"}, {"English": "love", "Spanish": "amor"}, {"English": "moon", "Spanish": "luna"}, {"English": "sun", "Spanish": "sol"}, {"English": "tree", "Spanish": "árbol"}, {"English": "water", "Spanish": "agua"}]',
    },
    "Ukrainian": {
        "role": "assistant",
        "content": '[{"English": "apple", "Ukrainian": "яблуко"}, {"English": "book", "Ukrainian": "книга"}, {"English": "car", "Ukrainian": "автомобіль"}, {"English": "dog", "Ukrainian": "собака"}, {"English": "house", "Ukrainian": "будинок"}, {"English": "love", "Ukrainian": "любов"}, {"English": "moon", "Ukrainian": "місяць"}, {"English": "sun", "Ukrainian": "сонце"}, {"English": "tree", "Ukrainian": "дерево"}, {"English": "water", "Ukrainian": "вода"}]',
    },
}

default_translation_assistants = {
    "French": {
        "role": "assistant",
        "content": '[{"English": "How are you today?", "French": "Comment vas-tu aujourd\'hui ?"}, {"English": "I am learning to speak French.", "French": "J\'apprends à parler français."}, {"English": "The weather is nice this afternoon.", "French": "Le temps est agréable cet après-midi."}, {"English": "Can you help me with my homework?", "French": "Peux-tu m\'aider avec mes devoirs ?"}, {"English": "My family is going on vacation next week.", "French": "Ma famille part en vacances la semaine prochaine."}, {"English": "This restaurant has delicious food.", "French": "Ce restaurant a de la nourriture délicieuse."}]',
    },
    "German": {
        "role": "assistant",
        "content": '[{"English": "How are you today?", "German": "Wie geht es dir heute?"}, {"English": "I am learning to speak German.", "German": "Ich lerne Deutsch zu sprechen."}, {"English": "The weather is nice this afternoon.", "German": "Das Wetter ist heute Nachmittag schön."}, {"English": "Can you help me with my homework?", "German": "Kannst du mir bei meinen Hausaufgaben helfen?"}, {"English": "My family is going on vacation next week.", "German": "Meine Familie macht nächste Woche Urlaub."}, {"English": "This restaurant has delicious food.", "German": "Dieses Restaurant hat köstliches Essen."}]',
    },
    "Spanish": {
        "role": "assistant",
        "content": '[{"English": "How are you today?", "Spanish": "¿Cómo estás hoy?"}, {"English": "I am learning to speak Spanish.", "Spanish": "Estoy aprendiendo a hablar español."}, {"English": "The weather is nice this afternoon.", "Spanish": "El clima es agradable esta tarde."}, {"English": "Can you help me with my homework?", "Spanish": "¿Puedes ayudarme con mi tarea?"}, {"English": "My family is going on vacation next week.", "Spanish": "Mi familia se va de vacaciones la próxima semana."}, {"English": "This restaurant has delicious food.", "Spanish": "Este restaurante tiene comida deliciosa."}]',
    },
    "Ukrainian": {
        "role": "assistant",
        "content": '[{"English": "How are you today?", "Ukrainian": "Як ти сьогодні?"}, {"English": "I am learning to speak Ukrainian.", "Ukrainian": "Я вчуся розмовляти українською."}, {"English": "The weather is nice this afternoon.", "Ukrainian": "Сьогодні вдень гарна погода."}, {"English": "Can you help me with my homework?", "Ukrainian": "Можеш допомогти мені з домашнім завданням?"}, {"English": "My family is going on vacation next week.", "Ukrainian": "Моя сім\'я їде у відпустку наступного тижня."}, {"English": "This restaurant has delicious food.", "Ukrainian": "У цьому ресторані смачна їжа."}]',
    },
}

blank_conversation_assistants = {
    "French": {"role": "assistant", "content": ""},
    "German": {"role": "assistant", "content": ""},
    "Spanish": {"role": "assistant", "content": ""},
    "Ukrainian": {"role": "assistant", "content": ""},
}

blank_pairs_assistants = {
    "French": {"role": "assistant", "content": ""},
    "German": {"role": "assistant", "content": ""},
    "Spanish": {"role": "assistant", "content": ""},
    "Ukrainian": {"role": "assistant", "content": ""},
}

blank_translation_assistants = {
    "French": {"role": "assistant", "content": ""},
    "German": {"role": "assistant", "content": ""},
    "Spanish": {"role": "assistant", "content": ""},
    "Ukrainian": {"role": "assistant", "content": ""},
}

default_fill_in_blank_assistants = {
    "French": {
        "role": "assistant",
        "content": '[{"sentence": "Je mange une _ rouge", "correct_answer": "pomme", "incorrect_1": "orange", "incorrect_2": "banane", "blank_position": 3}, {"sentence": "Il _ à l\'école tous les jours", "correct_answer": "va", "incorrect_1": "vient", "incorrect_2": "court", "blank_position": 1}, {"sentence": "La _ est très belle aujourd\'hui", "correct_answer": "météo", "incorrect_1": "musique", "incorrect_2": "lumière", "blank_position": 1}, {"sentence": "Elle _ un livre intéressant", "correct_answer": "lit", "incorrect_1": "écrit", "incorrect_2": "achète", "blank_position": 1}, {"sentence": "Mon _ préféré est le bleu", "correct_answer": "couleur", "incorrect_1": "animal", "incorrect_2": "sport", "blank_position": 1}]',
    },
    "German": {
        "role": "assistant",
        "content": '[{"sentence": "Ich esse einen roten _", "correct_answer": "Apfel", "incorrect_1": "Pfirsich", "incorrect_2": "Kirsche", "blank_position": 3}, {"sentence": "Er _ jeden Tag zur Schule", "correct_answer": "geht", "incorrect_1": "läuft", "incorrect_2": "fährt", "blank_position": 1}, {"sentence": "Das _ ist heute sehr schön", "correct_answer": "Wetter", "incorrect_1": "Essen", "incorrect_2": "Konzert", "blank_position": 1}, {"sentence": "Sie _ ein interessantes Buch", "correct_answer": "liest", "incorrect_1": "schreibt", "incorrect_2": "kauft", "blank_position": 1}, {"sentence": "Meine _ Farbe ist Blau", "correct_answer": "Lieblings", "incorrect_1": "erste", "incorrect_2": "letzte", "blank_position": 1}]',
    },
    "Spanish": {
        "role": "assistant",
        "content": '[{"sentence": "Yo como una _ roja", "correct_answer": "manzana", "incorrect_1": "naranja", "incorrect_2": "cereza", "blank_position": 3}, {"sentence": "Él _ a la escuela todos los días", "correct_answer": "va", "incorrect_1": "camina", "incorrect_2": "corre", "blank_position": 1}, {"sentence": "El _ está muy bueno hoy", "correct_answer": "tiempo", "incorrect_1": "café", "incorrect_2": "concierto", "blank_position": 1}, {"sentence": "Ella _ un libro interesante", "correct_answer": "lee", "incorrect_1": "escribe", "incorrect_2": "compra", "blank_position": 1}, {"sentence": "Mi _ favorito es el azul", "correct_answer": "color", "incorrect_1": "animal", "incorrect_2": "deporte", "blank_position": 1}]',
    },
    "Ukrainian": {
        "role": "assistant",
        "content": '[{"sentence": "Я їм червоне _", "correct_answer": "яблуко", "incorrect_1": "апельсин", "incorrect_2": "персик", "blank_position": 2}, {"sentence": "Він _ до школи щодня", "correct_answer": "йде", "incorrect_1": "біжить", "incorrect_2": "їздить", "blank_position": 1}, {"sentence": "_ сьогодні дуже гарна", "correct_answer": "Погода", "incorrect_1": "Музика", "incorrect_2": "Їжа", "blank_position": 0}, {"sentence": "Вона _ цікаву книгу", "correct_answer": "читає", "incorrect_1": "пише", "incorrect_2": "купує", "blank_position": 1}, {"sentence": "Мій улюблений _ синій", "correct_answer": "колір", "incorrect_1": "спорт", "incorrect_2": "фільм", "blank_position": 2}]',
    },
}

blank_fill_in_blank_assistants = {
    "French": {"role": "assistant", "content": ""},
    "German": {"role": "assistant", "content": ""},
    "Spanish": {"role": "assistant", "content": ""},
    "Ukrainian": {"role": "assistant", "content": ""},
}
