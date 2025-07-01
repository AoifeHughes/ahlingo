# -*- coding: utf-8 -*-
"""
Outlines integration for structured lesson generation.
"""

import openai
import outlines
from typing import List, Dict, Any
import uuid
import json
from .models import ConversationExercise, create_pair_schema


# Centralized model configuration
MODEL_CONFIG = {
    "model_name": "mistralai/mistral-small-3.2",
    "base_url": "http://localhost:11434/v1", 
    "api_key": "sk-no-key-required",
    "temperature": 0.7
}


class ValidationError(Exception):
    """Custom exception for validation errors."""
    pass


def validate_conversations(data: list, language: str) -> list:
    """Validate conversation exercise data."""
    if not isinstance(data, list):
        raise ValidationError(f"Expected list, got {type(data)}")
    
    if not data:
        raise ValidationError("Empty conversation data")
    
    validated_data = []
    for i, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValidationError(f"Conversation {i}: Expected dict, got {type(item)}")
        
        if "conversation" not in item or "conversation_summary" not in item:
            raise ValidationError(f"Conversation {i}: Missing required fields")
        
        conversation = item["conversation"]
        if not isinstance(conversation, list) or len(conversation) < 2:
            raise ValidationError(f"Conversation {i}: Must have at least 2 dialogue turns")
        
        # Check for repetitive patterns
        messages = [turn.get("message", "") for turn in conversation if isinstance(turn, dict)]
        if len(set(messages)) < len(messages) * 0.7:  # Less than 70% unique messages
            raise ValidationError(f"Conversation {i}: Too repetitive")
        
        validated_data.append(item)
    
    return validated_data


def validate_pairs(data: list, language: str) -> list:
    """Validate word pairs data."""
    if not isinstance(data, list):
        raise ValidationError(f"Expected list, got {type(data)}")
    
    if len(data) != 10:
        raise ValidationError(f"Expected exactly 10 pairs, got {len(data)}")
    
    english_words = []
    target_words = []
    
    for i, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValidationError(f"Pair {i}: Expected dict, got {type(item)}")
        
        if "English" not in item or language not in item:
            raise ValidationError(f"Pair {i}: Missing required fields 'English' or '{language}'")
        
        english_word = item["English"].strip()
        target_word = item[language].strip()
        
        if not english_word or not target_word:
            raise ValidationError(f"Pair {i}: Empty words not allowed")
        
        # Check for reasonable length (not excessively long phrases)
        if len(english_word.split()) > 5 or len(target_word.split()) > 5:
            raise ValidationError(f"Pair {i}: Phrases too long, should be words or short phrases")
        
        english_words.append(english_word.lower())
        target_words.append(target_word.lower())
    
    # Check for duplicates
    if len(set(english_words)) != len(english_words):
        raise ValidationError("Duplicate English words found")
    if len(set(target_words)) != len(target_words):
        raise ValidationError(f"Duplicate {language} words found")
    
    return data


def validate_translations(data: list, language: str) -> list:
    """Validate sentence translations data."""
    if not isinstance(data, list):
        raise ValidationError(f"Expected list, got {type(data)}")
    
    if not (5 <= len(data) <= 7):
        raise ValidationError(f"Expected 5-7 translations, got {len(data)}")
    
    for i, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValidationError(f"Translation {i}: Expected dict, got {type(item)}")
        
        if "English" not in item or language not in item:
            raise ValidationError(f"Translation {i}: Missing required fields 'English' or '{language}'")
        
        english_sentence = item["English"].strip()
        target_sentence = item[language].strip()
        
        if not english_sentence or not target_sentence:
            raise ValidationError(f"Translation {i}: Empty sentences not allowed")
        
        # Check for reasonable sentence length (allow some flexibility for different languages)
        if len(english_sentence.split()) < 2 or len(target_sentence.split()) < 1:
            raise ValidationError(f"Translation {i}: Sentences too short, expected meaningful phrases or sentences")
    
    return data


def setup_outlines_model():
    """Setup Outlines with centralized configuration."""
    import warnings
    warnings.filterwarnings("ignore", category=RuntimeWarning, message=".*Event loop is closed.*")
    
    try:
        # Use centralized config
        model = outlines.models.openai(
            MODEL_CONFIG["model_name"],
            base_url=MODEL_CONFIG["base_url"],
            api_key=MODEL_CONFIG["api_key"]
        )
        return model
    except Exception as e:
        print(f"Error setting up outlines model: {e}")
        # Fallback to direct OpenAI client
        client = openai.OpenAI(
            base_url=MODEL_CONFIG["base_url"],
            api_key=MODEL_CONFIG["api_key"]
        )
        return client


def generate_conversations(model, language: str, level: str, topic: str):
    """Generate conversation exercises with guaranteed structure."""
    from .assistants import default_conversation_assistants
    
    # JSON schema for conversation exercises (as string for outlines)
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
    
    # Create system message with clear instructions
    system_content = f"""You are a {language} language learning tool. Generate {level} level {language} conversations about "{topic}".

Create 2-4 conversation exercises. Each should have:
- 3-6 dialogue turns between speakers
- Natural, realistic dialogue for {level} learners
- Progressive conversations that build naturally
- Each turn should add new information or move the conversation forward
- A clear conversation summary in English
- Speakers with appropriate {language} names

Avoid repetitive patterns. Focus on practical situations related to {topic}."""
    
    # Use structured generation with proper message format
    if hasattr(model, 'chat') and hasattr(model.chat, 'completions'):
        # For OpenAI client fallback
        messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": "Generate conversation examples"}
        ]
        
        # Add assistant examples if available
        if language in default_conversation_assistants:
            examples_content = default_conversation_assistants[language]["content"]
            messages.extend([
                {"role": "assistant", "content": examples_content},
                {"role": "user", "content": f"Now generate new conversations for the topic: {topic}"}
            ])
        
        # Use OpenAI client with JSON schema (manual parsing)
        completion = model.chat.completions.create(
            model=MODEL_CONFIG["model_name"],
            messages=messages,
            temperature=MODEL_CONFIG["temperature"]
        )
        result_text = completion.choices[0].message.content
        # Extract JSON array from response
        import re
        json_match = re.search(r'\[.*\]', result_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            return json.loads(result_text)
    else:
        # For outlines model with structured generation
        generator = outlines.generate.json(model, schema)
        
        # Create enhanced prompt with examples context
        examples_context = ""
        if language in default_conversation_assistants:
            examples_content = default_conversation_assistants[language]["content"]
            examples_context = f"\n\nReference examples (for structure only):\n{examples_content}\n\nNow generate NEW conversations for the topic: {topic}"
        
        full_prompt = system_content + examples_context
        result = generator(full_prompt)
        return json.loads(result)


def generate_pairs(model, language: str, level: str, topic: str):
    """Generate word pairs with guaranteed structure - creates exactly 10 pairs per exercise."""
    from .assistants import default_pairs_assistants
    
    # JSON schema for word pairs (as string for outlines)
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
    
    # Create system message with clear instructions
    system_content = f"""You are a {language} language learning tool. Generate vocabulary pairs for "{topic}".

Create EXACTLY 10 word pairs at {level} level:
- English word or phrase paired with {language} translation
- Mix of nouns, verbs, adjectives, and adverbs
- Common, practical vocabulary related to {topic}
- Use appropriate words or phrases for the language (single words, compounds, or short phrases as needed)
- Each pair must be unique within this set
- Create diverse vocabulary covering different aspects of {topic}"""
    
    # Use structured generation with proper message format
    if hasattr(model, 'chat') and hasattr(model.chat, 'completions'):
        # For OpenAI client fallback
        messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": "Generate word pair examples"}
        ]
        
        # Add assistant examples if available
        if language in default_pairs_assistants:
            examples_content = default_pairs_assistants[language]["content"]
            messages.extend([
                {"role": "assistant", "content": examples_content},
                {"role": "user", "content": f"Now generate 10 new word pairs for the topic: {topic}"}
            ])
        
        # Use OpenAI client with JSON schema (manual parsing)
        completion = model.chat.completions.create(
            model=MODEL_CONFIG["model_name"],
            messages=messages,
            temperature=MODEL_CONFIG["temperature"]
        )
        result_text = completion.choices[0].message.content
        # Extract JSON array from response
        import re
        json_match = re.search(r'\[.*\]', result_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            return json.loads(result_text)
    else:
        # For outlines model with structured generation
        generator = outlines.generate.json(model, schema)
        
        # Create enhanced prompt with examples context
        examples_context = ""
        if language in default_pairs_assistants:
            examples_content = default_pairs_assistants[language]["content"]
            examples_context = f"\n\nReference examples (for format only):\n{examples_content}\n\nNow generate 10 NEW word pairs for the topic: {topic}"
        
        full_prompt = system_content + examples_context
        result = generator(full_prompt)
        return json.loads(result)


def generate_translations(model, language: str, level: str, topic: str):
    """Generate sentence translations with guaranteed structure."""
    from .assistants import default_translation_assistants
    
    # JSON schema for sentence translations (as string for outlines)
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
    
    # Create system message with enhanced instructions
    system_content = f"""You are a {language} language learning tool. Generate sentence translations for "{topic}".

Create 5-7 sentence pairs at {level} level:
- Full English sentences with accurate {language} translations
- Mix of statements, questions, and commands
- Demonstrate key grammar patterns appropriate for {level} learners
- Natural, idiomatic translations that sound native
- Sentences should be practical and directly related to {topic}
- Vary sentence length and complexity for comprehensive practice
- Include cultural context when relevant to {topic}"""
    
    # Use structured generation with proper message format
    if hasattr(model, 'chat') and hasattr(model.chat, 'completions'):
        # For OpenAI client fallback
        messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": "Generate sentence translation examples"}
        ]
        
        # Add assistant examples if available
        if language in default_translation_assistants:
            examples_content = default_translation_assistants[language]["content"]
            messages.extend([
                {"role": "assistant", "content": examples_content},
                {"role": "user", "content": f"Now generate 5-7 new sentence translations for the topic: {topic}"}
            ])
        
        # Use OpenAI client with JSON schema (manual parsing)
        completion = model.chat.completions.create(
            model=MODEL_CONFIG["model_name"],
            messages=messages,
            temperature=MODEL_CONFIG["temperature"]
        )
        result_text = completion.choices[0].message.content
        # Extract JSON array from response
        import re
        json_match = re.search(r'\[.*\]', result_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            return json.loads(result_text)
    else:
        # For outlines model with structured generation
        generator = outlines.generate.json(model, schema)
        
        # Create enhanced prompt with examples context
        examples_context = ""
        if language in default_translation_assistants:
            examples_content = default_translation_assistants[language]["content"]
            examples_context = f"\n\nReference examples (for format only):\n{examples_content}\n\nNow generate 5-7 NEW sentence translations for the topic: {topic}"
        
        full_prompt = system_content + examples_context
        result = generator(full_prompt)
        return json.loads(result)


def generate_lessons_data_structured(
    language: str,
    level: str,
    topic: str,
    N_runs: int = 2,
    lesson_kinds: List[str] = ["conversations", "pairs", "translations"],
    model=None,  # Allow passing model to reuse it
    max_retries: int = 3
):
    """Drop-in replacement for your generate_lessons_data using Outlines with validation and retry logic."""
    
    # Setup model once if not provided
    if model is None:
        model = setup_outlines_model()
    
    # Validation function mapping
    validators = {
        "conversations": validate_conversations,
        "pairs": validate_pairs,
        "translations": validate_translations
    }
    
    # Generation function mapping
    generators = {
        "conversations": generate_conversations,
        "pairs": generate_pairs,
        "translations": generate_translations
    }
    
    for lesson_kind in lesson_kinds:
        for run in range(N_runs):
            lesson_id = str(uuid.uuid4())
            
            # Retry logic for failed generations
            for attempt in range(max_retries):
                try:
                    # Generate data
                    data = generators[lesson_kind](model, language, level, topic)
                    
                    # Validate data
                    validated_data = validators[lesson_kind](data, language)
                    
                    # Convert to JSON string to match your existing interface
                    json_response = json.dumps(validated_data, ensure_ascii=False)
                    yield lesson_kind, lesson_id, json_response
                    break  # Success, exit retry loop
                    
                except ValidationError as ve:
                    print(f"Validation failed for {lesson_kind} (attempt {attempt + 1}/{max_retries}): {ve}")
                    if attempt == max_retries - 1:
                        print(f"Max retries reached for {lesson_kind} {language}-{level}-{topic}")
                    continue
                    
                except Exception as e:
                    print(f"Error generating {lesson_kind} for {language}-{level}-{topic} (attempt {attempt + 1}/{max_retries}): {e}")
                    if attempt == max_retries - 1:
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