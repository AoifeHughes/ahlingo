# -*- coding: utf-8 -*-
import openai
from typing import Dict, List


class ChatbotHandler:
    """Handles interactions with the language learning chatbot."""

    LANGUAGE_CONFIGS = {
        "French": {
            "name_examples": ["Pierre", "Marie", "Jean", "Sophie"],
            "greeting_example": {
                "user": "Hello, how are you?",
                "assistant": """[French]: Bonjour! Je vais très bien, merci. Et vous?
[English]: Hello! I'm doing very well, thank you. And you?""",
            },
            "encouragement": """Try using these French phrases:
- Comment allez-vous? (How are you?)
- Je vais bien (I'm doing well)
- Ravi(e) de vous rencontrer (Nice to meet you)""",
        },
        "German": {
            "name_examples": ["Hans", "Anna", "Klaus", "Eva"],
            "greeting_example": {
                "user": "Hello, how are you?",
                "assistant": """[German]: Hallo! Mir geht es sehr gut, danke. Und Ihnen?
[English]: Hello! I'm doing very well, thank you. And you?""",
            },
            "encouragement": """Try using these German phrases:
- Wie geht es Ihnen? (How are you?)
- Mir geht es gut (I'm doing well)
- Freut mich Sie kennenzulernen (Nice to meet you)""",
        },
        "Spanish": {
            "name_examples": ["Miguel", "Ana", "Carlos", "Isabel"],
            "greeting_example": {
                "user": "Hello, how are you?",
                "assistant": """[Spanish]: ¡Hola! Estoy muy bien, gracias. ¿Y tú?
[English]: Hello! I'm doing very well, thank you. And you?""",
            },
            "encouragement": """Try using these Spanish phrases:
- ¿Cómo estás? (How are you?)
- Estoy bien (I'm doing well)
- Encantado/a de conocerte (Nice to meet you)""",
        },
        "Ukrainian": {
            "name_examples": ["Олена", "Тарас", "Оксана", "Богдан"],
            "greeting_example": {
                "user": "Hello, how are you?",
                "assistant": """[Ukrainian]: Привіт! У мене все добре, дякую. А у вас?
[English]: Hello! I'm doing well, thank you. And you?""",
            },
            "encouragement": """Try using these Ukrainian phrases:
- Як справи? (How are you?)
- У мене все добре (I'm doing well)
- Дуже приємно познайомитись (Nice to meet you)
- Доброго дня (Good day)""",
        },
    }

    DIFFICULTY_GUIDELINES = {
        "beginner": {
            "vocabulary": "Use basic, everyday vocabulary",
            "grammar": "Use simple present tense and basic sentence structures",
            "response_length": "Keep responses short and simple",
        },
        "intermediate": {
            "vocabulary": "Use varied vocabulary including some idioms",
            "grammar": "Use multiple tenses and compound sentences",
            "response_length": "Provide more detailed responses",
        },
        "advanced": {
            "vocabulary": "Use rich vocabulary including colloquialisms",
            "grammar": "Use complex grammar structures and all tenses",
            "response_length": "Give detailed, native-like responses",
        },
    }

    def __init__(
        self,
        base_url: str = "http://localhost:8080/v1",
        api_key: str = "sk-no-key-required",
    ):
        """Initialize the chatbot handler with API configuration."""
        self.client = openai.OpenAI(base_url=base_url, api_key=api_key)

    def create_system_prompt(self, language: str, difficulty: str) -> Dict[str, str]:
        """Create the system prompt for the chatbot."""
        if language not in self.LANGUAGE_CONFIGS:
            raise ValueError(f"Unsupported language: {language}")
        if difficulty.lower() not in self.DIFFICULTY_GUIDELINES:
            raise ValueError(f"Unsupported difficulty level: {difficulty}")

        lang_config = self.LANGUAGE_CONFIGS[language]
        diff_guidelines = self.DIFFICULTY_GUIDELINES[difficulty.lower()]

        system_prompt = f"""You are a helpful language learning assistant for {language}, named {lang_config['name_examples'][0]}.
You help students practice {language} at a {difficulty} level.

Guidelines for {difficulty} level:
- Vocabulary: {diff_guidelines['vocabulary']}
- Grammar: {diff_guidelines['grammar']}
- Response Length: {diff_guidelines['response_length']}

Always format your responses as:
[{language}]: (your response in {language})
[English]: (your translation in English)

Example interaction:
User: {lang_config['greeting_example']['user']}
Assistant: {lang_config['greeting_example']['assistant']}

When users write in English, encourage them to try {language} by showing examples:
{lang_config['encouragement']}

Remember:
1. Always respond in both languages
2. Adapt your language to the {difficulty} level
3. Be encouraging and supportive
4. If the user makes mistakes, correct them gently
5. Provide cultural context when relevant"""

        return {"role": "system", "content": system_prompt}

    def get_chat_response(
        self,
        message: str,
        language: str,
        difficulty: str,
        conversation_history: List[Dict[str, str]] = None,
    ) -> str:
        """
        Get a response from the chatbot.

        Args:
            message: The user's message
            language: The language being learned
            difficulty: The difficulty level
            conversation_history: List of previous messages in the conversation

        Returns:
            The chatbot's response
        """
        if conversation_history is None:
            conversation_history = []

        # Create messages array with system prompt
        messages = [
            self.create_system_prompt(language, difficulty),
            *conversation_history,
            {"role": "user", "content": message},
        ]

        try:
            # Get completion from API
            completion = self.client.chat.completions.create(
                model="llama",
                messages=messages,
                temperature=0.7,
            )

            # Return the response content
            return completion.choices[0].message.content

        except Exception as e:
            print(f"Error getting chatbot response: {str(e)}")
            error_responses = {
                "French": "[French]: Je suis désolé, il y a eu une erreur.\n[English]: I'm sorry, there was an error.",
                "German": "[German]: Es tut mir leid, es gab einen Fehler.\n[English]: I'm sorry, there was an error.",
                "Spanish": "[Spanish]: Lo siento, hubo un error.\n[English]: I'm sorry, there was an error.",
                "Ukrainian": "[Ukrainian]: Вибачте, сталася помилка.\n[English]: I'm sorry, there was an error.",
            }
            return error_responses.get(
                language, f"[{language}]: Error\n[English]: Error"
            )

    def format_response(self, response: str, language: str) -> str:
        """
        Clean up and format the response if needed.
        This can be expanded based on needs.
        """
        if not response.startswith(f"[{language}]"):
            return f"[{language}]: Error formatting response\n[English]: Error formatting response"
        return response


def main():
    """Test the chatbot handler."""
    handler = ChatbotHandler()
    test_messages = [
        ("Hello, how are you?", "French", "beginner"),
        ("Guten Tag!", "German", "intermediate"),
        ("¿Cómo estás?", "Spanish", "advanced"),
        ("Привіт!", "Ukrainian", "beginner"),
    ]

    for message, language, difficulty in test_messages:
        print(f"\nTesting {language} at {difficulty} level")
        print(f"Message: {message}")
        response = handler.get_chat_response(
            message=message, language=language, difficulty=difficulty
        )
        print(f"Response: {response}\n")
        print("-" * 50)


if __name__ == "__main__":
    main()
