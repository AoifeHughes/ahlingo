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
    "temperature": 0.7,
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
        if not isinstance(conversation, list) or len(conversation) < 1:
            raise ValidationError(
                f"Conversation {i}: Must have at least 1 dialogue turn"
            )

        # Check for repetitive patterns
        messages = [
            turn.get("message", "") for turn in conversation if isinstance(turn, dict)
        ]
        if len(set(messages)) < len(messages) * 0.7:  # Less than 70% unique messages
            raise ValidationError(f"Conversation {i}: Too repetitive")

        validated_data.append(item)

    return validated_data


def validate_pairs(data: list, language: str) -> list:
    """Validate word pairs data."""
    if not isinstance(data, list):
        raise ValidationError(f"Expected list, got {type(data)}")

    if not (5 <= len(data) <= 15):
        raise ValidationError(f"Expected 5-15 pairs, got {len(data)}")

    english_words = []
    target_words = []

    for i, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValidationError(f"Pair {i}: Expected dict, got {type(item)}")

        if "English" not in item or language not in item:
            raise ValidationError(
                f"Pair {i}: Missing required fields 'English' or '{language}'"
            )

        english_word = item["English"].strip()
        target_word = item[language].strip()

        if not english_word or not target_word:
            raise ValidationError(f"Pair {i}: Empty words not allowed")

        # Check for reasonable length (not excessively long phrases)
        if len(english_word.split()) > 10 or len(target_word.split()) > 10:
            raise ValidationError(
                f"Pair {i}: Phrases too long, should be words or short phrases"
            )

        english_words.append(english_word.lower())
        target_words.append(target_word.lower())

    # Check for duplicates and remove them if found
    original_length = len(data)
    
    # Remove duplicates while preserving order
    seen_english = set()
    seen_target = set()
    unique_data = []
    
    for item in data:
        english_word = item["English"].strip().lower()
        target_word = item[language].strip().lower()
        
        if english_word not in seen_english and target_word not in seen_target:
            seen_english.add(english_word)
            seen_target.add(target_word)
            unique_data.append(item)
    
    # Check if we have enough pairs after removing duplicates
    if len(unique_data) < 5:
        raise ValidationError(f"After removing duplicates, only {len(unique_data)} pairs remain (minimum 5 required)")
    
    # If we removed duplicates, print a warning but continue
    if len(unique_data) != original_length:
        print(f"Warning: Removed {original_length - len(unique_data)} duplicate pairs, proceeding with {len(unique_data)} unique pairs")
    
    # Update the data to use the deduplicated version
    data = unique_data

    return data


def validate_translations(data: list, language: str) -> list:
    """Validate sentence translations data."""
    if not isinstance(data, list):
        raise ValidationError(f"Expected list, got {type(data)}")

    if not (3 <= len(data) <= 10):
        raise ValidationError(f"Expected 3-10 translations, got {len(data)}")

    for i, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValidationError(f"Translation {i}: Expected dict, got {type(item)}")

        if "English" not in item or language not in item:
            raise ValidationError(
                f"Translation {i}: Missing required fields 'English' or '{language}'"
            )

        english_sentence = item["English"].strip()
        target_sentence = item[language].strip()

        if not english_sentence or not target_sentence:
            raise ValidationError(f"Translation {i}: Empty sentences not allowed")

        # Check for reasonable sentence length (allow some flexibility for different languages)
        if len(english_sentence.split()) < 1 or len(target_sentence.split()) < 1:
            raise ValidationError(
                f"Translation {i}: Sentences too short, expected meaningful phrases or sentences"
            )

    return data


def validate_fill_in_blank(data: list, language: str) -> list:
    """Validate fill-in-blank exercise data."""
    if not isinstance(data, list):
        raise ValidationError(f"Expected list, got {type(data)}")

    if not (3 <= len(data) <= 10):
        raise ValidationError(f"Expected 3-10 fill-in-blank exercises, got {len(data)}")

    for i, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValidationError(f"Fill-in-blank {i}: Expected dict, got {type(item)}")

        required_fields = ["sentence", "correct_answer", "incorrect_1", "incorrect_2", "blank_position"]
        for field in required_fields:
            if field not in item:
                raise ValidationError(f"Fill-in-blank {i}: Missing required field '{field}'")

        sentence = item["sentence"].strip()
        correct_answer = item["correct_answer"].strip()
        incorrect_1 = item["incorrect_1"].strip()
        incorrect_2 = item["incorrect_2"].strip()

        # Validate sentence has content and contains a blank
        if not sentence:
            raise ValidationError(f"Fill-in-blank {i}: Empty sentence not allowed")
        
        if "_" not in sentence:
            raise ValidationError(f"Fill-in-blank {i}: Sentence must contain a blank (_)")
        
        # Count blanks - should have exactly one
        blank_count = sentence.count("_")
        if blank_count != 1:
            raise ValidationError(f"Fill-in-blank {i}: Sentence must contain exactly one blank, found {blank_count}")

        # Validate answers are not empty
        if not correct_answer or not incorrect_1 or not incorrect_2:
            raise ValidationError(f"Fill-in-blank {i}: All answer options must be non-empty")

        # Validate answers are different
        answers = [correct_answer, incorrect_1, incorrect_2]
        if len(set(answers)) != len(answers):
            raise ValidationError(f"Fill-in-blank {i}: Answer options must be unique")

        # Validate blank position
        blank_position = item["blank_position"]
        if not isinstance(blank_position, int):
            raise ValidationError(f"Fill-in-blank {i}: blank_position must be an integer")
        
        # Count words in sentence (replace _ with correct answer to count properly)
        sentence_with_answer = sentence.replace("_", correct_answer)
        word_count = len(sentence_with_answer.split())
        
        if blank_position < 0 or blank_position >= word_count:
            raise ValidationError(f"Fill-in-blank {i}: blank_position {blank_position} out of range for sentence with {word_count} words")

        # Validate sentence length (reasonable bounds)
        if word_count < 3 or word_count > 20:
            raise ValidationError(f"Fill-in-blank {i}: Sentence length should be 3-20 words, got {word_count}")

    return data


def setup_outlines_model():
    """Setup Outlines with centralized configuration."""
    import warnings

    warnings.filterwarnings(
        "ignore", category=RuntimeWarning, message=".*Event loop is closed.*"
    )

    try:
        # Use centralized config
        model = outlines.models.openai(
            MODEL_CONFIG["model_name"],
            base_url=MODEL_CONFIG["base_url"],
            api_key=MODEL_CONFIG["api_key"],
        )
        return model
    except Exception as e:
        print(f"Error setting up outlines model: {e}")
        # Fallback to direct OpenAI client
        client = openai.OpenAI(
            base_url=MODEL_CONFIG["base_url"], api_key=MODEL_CONFIG["api_key"]
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
- 2-10 dialogue turns between speakers
- Natural, realistic dialogue for {level} learners
- Progressive conversations that build naturally
- Each turn should add new information or move the conversation forward
- A clear conversation summary in English
- Speakers with appropriate {language} names

Avoid repetitive patterns. Focus on practical situations related to {topic}."""

    # Use structured generation with proper message format
    if hasattr(model, "chat") and hasattr(model.chat, "completions"):
        # For OpenAI client fallback
        messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": "Generate conversation examples"},
        ]

        # Add assistant examples if available
        if language in default_conversation_assistants:
            examples_content = default_conversation_assistants[language]["content"]
            messages.extend(
                [
                    {"role": "assistant", "content": examples_content},
                    {
                        "role": "user",
                        "content": f"Now generate new conversations for the topic: {topic}",
                    },
                ]
            )

        # Use OpenAI client with JSON schema (manual parsing)
        completion = model.chat.completions.create(
            model=MODEL_CONFIG["model_name"],
            messages=messages,
            temperature=MODEL_CONFIG["temperature"],
        )
        result_text = completion.choices[0].message.content
        # Extract JSON array from response
        import re

        json_match = re.search(r"\[.*\]", result_text, re.DOTALL)
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
    if hasattr(model, "chat") and hasattr(model.chat, "completions"):
        # For OpenAI client fallback
        messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": "Generate word pair examples"},
        ]

        # Add assistant examples if available
        if language in default_pairs_assistants:
            examples_content = default_pairs_assistants[language]["content"]
            messages.extend(
                [
                    {"role": "assistant", "content": examples_content},
                    {
                        "role": "user",
                        "content": f"Now generate 10 new word pairs for the topic: {topic}",
                    },
                ]
            )

        # Use OpenAI client with JSON schema (manual parsing)
        completion = model.chat.completions.create(
            model=MODEL_CONFIG["model_name"],
            messages=messages,
            temperature=MODEL_CONFIG["temperature"],
        )
        result_text = completion.choices[0].message.content
        # Extract JSON array from response
        import re

        json_match = re.search(r"\[.*\]", result_text, re.DOTALL)
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

Create 5-8 sentence pairs at {level} level:
- Full English sentences with accurate {language} translations
- Mix of statements, questions, and commands
- Demonstrate key grammar patterns appropriate for {level} learners
- Natural, idiomatic translations that sound native
- Sentences should be practical and directly related to {topic}
- Vary sentence length and complexity for comprehensive practice
- Include cultural context when relevant to {topic}"""

    # Use structured generation with proper message format
    if hasattr(model, "chat") and hasattr(model.chat, "completions"):
        # For OpenAI client fallback
        messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": "Generate sentence translation examples"},
        ]

        # Add assistant examples if available
        if language in default_translation_assistants:
            examples_content = default_translation_assistants[language]["content"]
            messages.extend(
                [
                    {"role": "assistant", "content": examples_content},
                    {
                        "role": "user",
                        "content": f"Now generate 5-8 new sentence translations for the topic: {topic}",
                    },
                ]
            )

        # Use OpenAI client with JSON schema (manual parsing)
        completion = model.chat.completions.create(
            model=MODEL_CONFIG["model_name"],
            messages=messages,
            temperature=MODEL_CONFIG["temperature"],
        )
        result_text = completion.choices[0].message.content
        # Extract JSON array from response
        import re

        json_match = re.search(r"\[.*\]", result_text, re.DOTALL)
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
            examples_context = f"\n\nReference examples (for format only):\n{examples_content}\n\nNow generate 5-8 NEW sentence translations for the topic: {topic}"

        full_prompt = system_content + examples_context
        result = generator(full_prompt)
        return json.loads(result)


def generate_fill_in_blank(model, language: str, level: str, topic: str):
    """Generate fill-in-blank exercises with guaranteed structure."""
    from .assistants import default_fill_in_blank_assistants

    # JSON schema for fill-in-blank exercises (as string for outlines)
    schema = f"""{{
        "type": "array",
        "items": {{
            "type": "object",
            "properties": {{
                "sentence": {{"type": "string"}},
                "correct_answer": {{"type": "string"}},
                "incorrect_1": {{"type": "string"}},
                "incorrect_2": {{"type": "string"}},
                "blank_position": {{"type": "integer"}}
            }},
            "required": ["sentence", "correct_answer", "incorrect_1", "incorrect_2", "blank_position"]
        }}
    }}"""

    # Create system message with enhanced instructions
    system_content = f"""You are a {language} language learning tool. Generate fill-in-blank exercises for "{topic}".

CRITICAL REQUIREMENTS:
1. Create exactly 5-8 fill-in-blank exercises at {level} level
2. Each sentence must contain EXACTLY ONE underscore (_) representing the blank
3. Each exercise must have EXACTLY 3 answer options that are COMPLETELY DIFFERENT from each other
4. The blank_position must be the correct word position (counting from 0)

FORMAT REQUIREMENTS:
- sentence: A {language} sentence with exactly one _ (underscore) where a word is missing
- correct_answer: The correct word that fills the blank
- incorrect_1: A plausible but wrong alternative (different from correct_answer)
- incorrect_2: Another plausible but wrong alternative (different from both correct_answer and incorrect_1)
- blank_position: Integer showing position of the blank (0 = first word, 1 = second word, etc.)

CONTENT GUIDELINES:
- Focus on {topic}-related vocabulary and grammar
- Ensure incorrect options are the same part of speech as the correct answer
- Make incorrect options plausible but clearly wrong in context
- Use sentences appropriate for {level} learners
- Test different word types: nouns, verbs, adjectives, etc.

EXAMPLE:
{{"sentence": "Je mange une _ rouge", "correct_answer": "pomme", "incorrect_1": "orange", "incorrect_2": "banane", "blank_position": 3}}

Remember: All three answer options must be unique, and there must be exactly one blank per sentence."""

    # Use structured generation with proper message format
    if hasattr(model, "chat") and hasattr(model.chat, "completions"):
        # For OpenAI client fallback
        messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": "Generate fill-in-blank exercise examples"},
        ]

        # Add assistant examples if available
        if language in default_fill_in_blank_assistants:
            examples_content = default_fill_in_blank_assistants[language]["content"]
            messages.extend(
                [
                    {"role": "assistant", "content": examples_content},
                    {
                        "role": "user",
                        "content": f"Now generate 5-8 new fill-in-blank exercises for the topic: {topic}",
                    },
                ]
            )

        # Use OpenAI client with JSON schema (manual parsing)
        completion = model.chat.completions.create(
            model=MODEL_CONFIG["model_name"],
            messages=messages,
            temperature=MODEL_CONFIG["temperature"],
        )
        result_text = completion.choices[0].message.content
        # Extract JSON array from response
        import re

        json_match = re.search(r"\[.*\]", result_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            return json.loads(result_text)
    else:
        # For outlines model with structured generation
        generator = outlines.generate.json(model, schema)

        # Create enhanced prompt with examples context
        examples_context = ""
        if language in default_fill_in_blank_assistants:
            examples_content = default_fill_in_blank_assistants[language]["content"]
            examples_context = f"\n\nReference examples (for format only):\n{examples_content}\n\nNow generate 5-8 NEW fill-in-blank exercises for the topic: {topic}"

        full_prompt = system_content + examples_context
        result = generator(full_prompt)
        return json.loads(result)


def generate_lessons_data_structured(
    language: str,
    level: str,
    topic: str,
    N_runs: int = 10,
    lesson_kinds: List[str] = ["conversations", "pairs", "translations", "fill_in_blank"],
    model=None,  # Allow passing model to reuse it
    max_retries: int = 5,
):
    """Drop-in replacement for your generate_lessons_data using Outlines with validation and retry logic."""

    # Setup model once if not provided
    if model is None:
        model = setup_outlines_model()

    # Validation function mapping
    validators = {
        "conversations": validate_conversations,
        "pairs": validate_pairs,
        "translations": validate_translations,
        "fill_in_blank": validate_fill_in_blank,
    }

    # Generation function mapping
    generators = {
        "conversations": generate_conversations,
        "pairs": generate_pairs,
        "translations": generate_translations,
        "fill_in_blank": generate_fill_in_blank,
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
                    print(
                        f"Validation failed for {lesson_kind} (attempt {attempt + 1}/{max_retries}): {ve}"
                    )
                    if attempt == max_retries - 1:
                        print(
                            f"Max retries reached for {lesson_kind} {language}-{level}-{topic}"
                        )
                    continue

                except Exception as e:
                    print(
                        f"Error generating {lesson_kind} for {language}-{level}-{topic} (attempt {attempt + 1}/{max_retries}): {e}"
                    )
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
