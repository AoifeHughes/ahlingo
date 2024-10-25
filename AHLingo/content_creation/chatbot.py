import openai
from typing import Dict, List

class ChatbotHandler:
    """Handles interactions with the language learning chatbot."""
    
    def __init__(self, base_url: str = "http://localhost:8080/v1", api_key: str = "sk-no-key-required"):
        """Initialize the chatbot handler with API configuration."""
        self.client = openai.OpenAI(
            base_url=base_url,
            api_key=api_key
        )
        
    def create_system_prompt(self, language: str, difficulty: str) -> Dict[str, str]:
        """Create the system prompt for the chatbot."""
        return {
            "role": "system",
            "content": f"""You are a helpful language learning assistant for
            {language}. Choose for yourself a typical name for a {language} speaker.
            You help students practice {language} at a {difficulty} level.
            Always respond in {language} but provide English to help the student
            understand. If the user uses English encourge them to try {language}
            and show examples."""
        }
    
    def get_chat_response(
        self,
        message: str,
        language: str,
        difficulty: str,
        conversation_history: List[Dict[str, str]] = None
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
        # Initialize or use existing conversation history
        if conversation_history is None:
            conversation_history = []
            
        # Create messages array with system prompt
        messages = [
            self.create_system_prompt(language, difficulty),
            *conversation_history,
            {"role": "user", "content": message}
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
            return f"[{language}]: Je suis désolé, il y a eu une erreur.\n[English]: I'm sorry, there was an error."
    
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
    test_message = "Hello, how are you?"
    response = handler.get_chat_response(
        message=test_message,
        language="French",
        difficulty="beginner"
    )
    print(f"Test Message: {test_message}")
    print(f"Response: {response}")

if __name__ == "__main__":
    main()