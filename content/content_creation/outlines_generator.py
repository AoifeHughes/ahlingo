# -*- coding: utf-8 -*-
"""
Outlines integration for structured lesson generation.
"""

import openai
import outlines
from typing import List
import uuid
import json
from .models import ConversationExercise, create_pair_schema


def setup_outlines_model():
    """Setup Outlines with your local llama.cpp OpenAI-compatible API."""
    import warnings
    warnings.filterwarnings("ignore", category=RuntimeWarning, message=".*Event loop is closed.*")
    
    try:
        # Use the new API approach with timeout settings to avoid hanging
        model = outlines.models.openai(
            "qwen/qwen3-4b",
            base_url="http://localhost:11434/v1",
            api_key="sk-no-key-required"
        )
        return model
    except Exception as e:
        print(f"Error setting up outlines model: {e}")
        # Fallback to direct OpenAI client
        client = openai.OpenAI(
            base_url="http://localhost:11434/v1",
            api_key="sk-no-key-required"
        )
        return client


def generate_conversations(model, language: str, level: str, topic: str):
    """Generate conversation exercises with guaranteed structure."""
    from .assistants import default_conversation_assistants
    
    # JSON schema for conversation exercises as string
    schema = """{
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "conversation": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "speaker": {"type": "string"},
                            "message": {"type": "string"}
                        },
                        "required": ["speaker", "message"]
                    }
                },
                "conversation_summary": {"type": "string"}
            },
            "required": ["conversation", "conversation_summary"]
        }
    }"""
    
    # Get examples from assistants
    assistant_examples = ""
    if language in default_conversation_assistants:
        examples_content = default_conversation_assistants[language]["content"]
        assistant_examples = f"\n\nHere are examples of good conversation structure:\n{examples_content}"
    
    # Create the structured generator
    generator = outlines.generate.json(model, schema)
    
    prompt = f"""You are a {language} language learning tool. Generate {level} level {language} conversations about "{topic}".

Create 2-4 conversation exercises. Each should have:
- 3-6 dialogue turns between speakers  
- Natural, realistic dialogue for {level} learners
- Progressive conversations that don't repeat the same questions/answers
- Each turn should add new information or move the conversation forward
- A clear conversation summary in English
- Speakers with appropriate {language} names

IMPORTANT: Avoid repetitive loops. Each speaker should introduce new topics or information, not repeat the same questions.{assistant_examples}

Focus on practical situations related to {topic}. Make conversations realistic and engaging."""

    # Generate with guaranteed structure
    result = generator(prompt)
    # result is already a JSON string, parse it to return as list
    return json.loads(result)


def generate_pairs(model, language: str, level: str, topic: str):
    """Generate word pairs with guaranteed structure."""
    from .assistants import default_pairs_assistants
    
    # JSON schema for word pairs as string
    schema = f"""{{
        "type": "array",
        "items": {{
            "type": "object",
            "properties": {{
                "English": {{"type": "string"}},
                "{language}": {{"type": "string"}}
            }},
            "required": ["English", "{language}"]
        }}
    }}"""
    
    # Get examples from assistants
    assistant_examples = ""
    if language in default_pairs_assistants:
        examples_content = default_pairs_assistants[language]["content"]
        assistant_examples = f"\n\nHere are examples of good word pairs:\n{examples_content}"
    
    generator = outlines.generate.json(model, schema)
    
    prompt = f"""You are a {language} language learning tool. Generate vocabulary pairs for "{topic}".

Create 8-12 word pairs at {level} level:
- English word paired with {language} translation
- Mix of nouns, verbs, adjectives
- Common, practical vocabulary related to {topic}
- Single words only (avoid phrases)
- Ensure variety in word types and avoid repetition{assistant_examples}"""

    result = generator(prompt)
    # result is already a JSON string, parse it to return as list
    return json.loads(result)


def generate_translations(model, language: str, level: str, topic: str):
    """Generate sentence translations with guaranteed structure."""
    from .assistants import default_translation_assistants
    
    # JSON schema for sentence translations as string
    schema = f"""{{
        "type": "array",
        "items": {{
            "type": "object",
            "properties": {{
                "English": {{"type": "string"}},
                "{language}": {{"type": "string"}}
            }},
            "required": ["English", "{language}"]
        }}
    }}"""
    
    # Get examples from assistants
    assistant_examples = ""
    if language in default_translation_assistants:
        examples_content = default_translation_assistants[language]["content"]
        assistant_examples = f"\n\nHere are examples of good sentence translations:\n{examples_content}"
    
    generator = outlines.generate.json(model, schema)
    
    prompt = f"""You are a {language} language learning tool. Generate sentence translations for "{topic}".

Create 5-7 sentence pairs at {level} level:
- Full English sentences with {language} translations
- Mix of statements, questions, commands
- Demonstrate key grammar patterns appropriate for {level} learners
- Natural, idiomatic translations
- Sentences should be practical and related to {topic}
- Vary sentence length and complexity{assistant_examples}"""

    result = generator(prompt)
    # result is already a JSON string, parse it to return as list
    return json.loads(result)


def generate_lessons_data_structured(
    language: str,
    level: str,
    topic: str,
    N_runs: int = 2,
    lesson_kinds: List[str] = ["conversations", "pairs", "translations"],
    model=None  # Allow passing model to reuse it
):
    """Drop-in replacement for your generate_lessons_data using Outlines."""
    
    # Setup model once if not provided
    if model is None:
        model = setup_outlines_model()
    
    for lesson_kind in lesson_kinds:
        for run in range(N_runs):
            lesson_id = str(uuid.uuid4())
            
            try:
                if lesson_kind == "conversations":
                    data = generate_conversations(model, language, level, topic)
                elif lesson_kind == "pairs":
                    data = generate_pairs(model, language, level, topic)
                else:  # translations
                    data = generate_translations(model, language, level, topic)
                
                # Convert to JSON string to match your existing interface
                # data should already be a list from the generators
                json_response = json.dumps(data, ensure_ascii=False)
                yield lesson_kind, lesson_id, json_response
                
            except Exception as e:
                print(f"Error generating {lesson_kind} for {language}-{level}-{topic}: {e}")
                import traceback
                traceback.print_exc()
                continue


def test_outlines_generation():
    """Test that Outlines is working with your setup."""
    model = setup_outlines_model()
    
    # Test conversation generation
    print("Testing conversation generation...")
    conversations = generate_conversations(model, "French", "beginner", "food")
    print("Conversations:", json.dumps(conversations, indent=2, ensure_ascii=False))
    
    # Test pairs generation
    print("\nTesting pairs generation...")
    pairs = generate_pairs(model, "French", "beginner", "food")
    print("Word Pairs:", json.dumps(pairs, indent=2, ensure_ascii=False))
    
    # Test translations
    print("\nTesting translations generation...")
    translations = generate_translations(model, "French", "beginner", "food")
    print("Translations:", json.dumps(translations, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    test_outlines_generation()