# -*- coding: utf-8 -*-
"""
Outlines integration for structured lesson generation.
"""

import openai
import outlines
from typing import List, Dict, Any
import uuid
import json
import logging
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


def setup_outlines_model():
    """Setup Outlines with centralized configuration."""
    import warnings
    import logging

    # Suppress specific warnings that are not actionable
    warnings.filterwarnings(
        "ignore", category=RuntimeWarning, message=".*Event loop is closed.*"
    )

    try:
        # Use centralized config for outlines model
        model = outlines.models.openai(
            MODEL_CONFIG["model_name"],
            base_url=MODEL_CONFIG["base_url"],
            api_key=MODEL_CONFIG["api_key"],
        )
        return model
    except Exception as e:
        logging.error(f"Failed to setup outlines model: {e}")
        raise RuntimeError(f"Could not initialize outlines model: {e}") from e


def parse_assistant_examples(assistant_content: str) -> List[Dict]:
    """Parse assistant examples from JSON string into structured format."""
    try:
        return json.loads(assistant_content)
    except json.JSONDecodeError as e:
        logging.warning(f"Failed to parse assistant examples: {e}")
        return []


def format_examples_for_prompt(examples: List[Dict], max_examples: int = 2) -> str:
    """Format examples for inclusion in the prompt."""
    if not examples:
        return ""
    
    # Take only the first few examples to avoid overwhelming the prompt
    limited_examples = examples[:max_examples]
    
    formatted_examples = []
    for example in limited_examples:
        formatted_examples.append(json.dumps(example, ensure_ascii=False, indent=2))
    
    return "\n\n".join(formatted_examples)


def generate_conversations(model, language: str, level: str, topic: str):
    """Generate conversation exercises with guaranteed structure."""
    from .assistants import default_conversation_assistants
    from .models import ConversationExercise
    from typing import List

    # Create system message with clear instructions
    system_content = f"""You are a {language} language learning tool. Generate {level} level {language} conversations about "{topic}".

Create 2-4 conversation exercises. Each should have:
- 2-5 dialogue turns between speakers
- Natural, realistic dialogue for {level} learners
- Progressive conversations that build naturally
- Each turn should add new information or move the conversation forward
- A clear conversation summary in English
- Speakers with appropriate {language} names

Avoid repetitive patterns. Focus on practical situations related to {topic}."""

    # Use structured generation with simpler JSON schema
    list_schema = {
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
    }
    generator = outlines.generate.json(model, json.dumps(list_schema))

    # Create enhanced prompt with examples context
    examples_context = ""
    if language in default_conversation_assistants:
        examples_content = default_conversation_assistants[language]["content"]
        examples = parse_assistant_examples(examples_content)
        if examples:
            formatted_examples = format_examples_for_prompt(examples)
            examples_context = f"\n\nReference examples (for structure only):\n{formatted_examples}\n\nNow generate NEW conversations for the topic: {topic}"

    full_prompt = system_content + examples_context
    result = generator(full_prompt)
    
    # Convert JSON result to Pydantic models
    if isinstance(result, str):
        result = json.loads(result)
    
    return [ConversationExercise(**item) for item in result]


def generate_pairs(model, language: str, level: str, topic: str):
    """Generate word pairs with guaranteed structure - creates exactly 5 pairs per exercise."""
    from .assistants import default_pairs_assistants
    from .models import create_dynamic_word_pair_model
    from typing import List

    # Create system message with clear instructions
    system_content = f"""You are a {language} language learning tool. Generate vocabulary pairs for "{topic}".

Create EXACTLY 5 word pairs at {level} level:
- English word or phrase paired with {language} translation
- Mix of nouns, verbs, adjectives, and adverbs
- Common, practical vocabulary related to {topic}
- Use appropriate words or phrases for the language (single words, compounds, or short phrases as needed)
- Each pair must be unique within this set
- Create diverse vocabulary covering different aspects of {topic}"""

    # Use structured generation with simpler JSON schema
    list_schema = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "English": {"type": "string"},
                language: {"type": "string"}
            },
            "required": ["English", language]
        }
    }
    generator = outlines.generate.json(model, json.dumps(list_schema))

    # Create enhanced prompt with examples context
    examples_context = ""
    if language in default_pairs_assistants:
        examples_content = default_pairs_assistants[language]["content"]
        examples = parse_assistant_examples(examples_content)
        if examples:
            formatted_examples = format_examples_for_prompt(examples)
            examples_context = f"\n\nReference examples (for format only):\n{formatted_examples}\n\nNow generate 5 NEW word pairs for the topic: {topic}"

    full_prompt = system_content + examples_context
    result = generator(full_prompt)
    
    # Convert JSON result to Pydantic models
    if isinstance(result, str):
        result = json.loads(result)
    
    # Create dynamic model and validate
    WordPairModel = create_dynamic_word_pair_model(language)
    return [WordPairModel(**item) for item in result]


def generate_translations(model, language: str, level: str, topic: str):
    """Generate sentence translations with guaranteed structure."""
    from .assistants import default_translation_assistants
    from .models import create_dynamic_translation_pair_model
    from typing import List

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

    # Use structured generation with simpler JSON schema
    list_schema = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "English": {"type": "string"},
                language: {"type": "string"}
            },
            "required": ["English", language]
        }
    }
    generator = outlines.generate.json(model, json.dumps(list_schema))

    # Create enhanced prompt with examples context
    examples_context = ""
    if language in default_translation_assistants:
        examples_content = default_translation_assistants[language]["content"]
        examples = parse_assistant_examples(examples_content)
        if examples:
            formatted_examples = format_examples_for_prompt(examples)
            examples_context = f"\n\nReference examples (for format only):\n{formatted_examples}\n\nNow generate 5-8 NEW sentence translations for the topic: {topic}"

    full_prompt = system_content + examples_context
    result = generator(full_prompt)
    
    # Convert JSON result to Pydantic models
    if isinstance(result, str):
        result = json.loads(result)
    
    # Create dynamic model and validate
    TranslationPairModel = create_dynamic_translation_pair_model(language)
    return [TranslationPairModel(**item) for item in result]


def generate_complete_sentences_bulk(model, language: str, level: str, topic: str, count: int = 5):
    """Generate multiple complete sentences at once for efficiency."""
    
    system_content = f"""You are a {language} language learning tool. Generate {count} different, complete, grammatically correct {language} sentences about "{topic}" at {level} level.

REQUIREMENTS:
- Generate exactly {count} complete sentences
- Each sentence should be natural and grammatically correct
- Use vocabulary appropriate for {level} learners
- Focus on {topic}-related content
- Each sentence should be 3-15 words long
- Include varied word types (nouns, verbs, adjectives, etc.)
- Make sentences practical and useful for language learning
- Make each sentence unique with different vocabulary and structure
- Vary the grammar patterns (different subjects, verbs, tenses when appropriate)

Examples of good sentences:
- "Je conduis ma voiture bleue" (I drive my blue car)
- "Le chat mange sa nourriture" (The cat eats its food)
- "Elle porte une robe rouge" (She wears a red dress)
- "Nous allons à l'école demain" (We go to school tomorrow)

Generate {count} different sentences that follow these guidelines, each with its English translation."""

    # Use JSON schema for multiple sentences
    sentences_schema = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "sentence": {
                    "type": "string",
                    "minLength": 5,
                    "maxLength": 150
                },
                "translation": {
                    "type": "string",
                    "minLength": 5,
                    "maxLength": 150
                }
            },
            "required": ["sentence", "translation"]
        },
        "minItems": count,
        "maxItems": count
    }
    
    generator = outlines.generate.json(model, json.dumps(sentences_schema))
    result = generator(system_content)
    
    if isinstance(result, str):
        result = json.loads(result)
    
    return result


def generate_complete_sentence(model, language: str, level: str, topic: str):
    """Generate a single complete sentence (wrapper for bulk generation)."""
    bulk_result = generate_complete_sentences_bulk(model, language, level, topic, count=1)
    return bulk_result[0] if bulk_result else {"sentence": "", "translation": ""}


def select_word_to_remove(sentence: str, language: str = "French"):
    """Select a suitable word to remove from the sentence using heuristics instead of hardcoded lists."""
    words = sentence.split()
    
    # Find suitable words using language-agnostic heuristics
    suitable_words = []
    for i, word in enumerate(words):
        # Clean word of punctuation for checking
        clean_word = word.lower().rstrip('.,!?;:')
        
        # Skip very short words (likely articles/prepositions)
        if len(clean_word) <= 2:
            continue
            
        # Skip words that are all punctuation
        if not any(c.isalpha() for c in clean_word):
            continue
            
        # Prefer longer, content-bearing words
        suitable_words.append((i, word, len(clean_word)))
    
    # If no suitable words found, use the longest word
    if not suitable_words:
        longest_word = max(words, key=lambda w: len(w.rstrip('.,!?;:')))
        return words.index(longest_word), longest_word
    
    # Sort by: middle position preference, then word length (longer better)
    suitable_words.sort(key=lambda x: (abs(x[0] - len(words)//2), -x[2]))
    
    return suitable_words[0][0], suitable_words[0][1]


def generate_incorrect_options(model, sentence: str, correct_answer: str, language: str, level: str):
    """Generate 2 incorrect options for the fill-in-blank exercise."""
    system_content = f"""You are a {language} language learning tool. Given a sentence and the correct answer, generate 2 clearly incorrect alternatives.

SENTENCE: "{sentence}"
CORRECT ANSWER: "{correct_answer}"

REQUIREMENTS:
- Generate exactly 2 incorrect alternatives
- Each alternative must be a single word (no phrases)
- CRITICAL: Both alternatives MUST be different from "{correct_answer}"
- CRITICAL: Both alternatives MUST be different from each other
- Alternatives should be the same part of speech as the correct answer
- Alternatives should be plausible but clearly wrong in this context
- Use vocabulary appropriate for {level} learners
- Make sure the alternatives would make the sentence grammatically incorrect or nonsensical

Example:
Sentence: "Je conduis ma voiture bleue"
Correct: "voiture"
Good alternatives: "maison" (you can't drive a house), "chemise" (you can't drive a shirt)
Bad alternatives: "voiture" (same as correct answer!), "auto" (too similar to correct answer), "rouge bleue" (multiple words)

Generate 2 single-word alternatives that are obviously wrong in this context and different from "{correct_answer}"."""

    # Use simple JSON schema for alternatives
    alternatives_schema = {
        "type": "object",
        "properties": {
            "incorrect_1": {
                "type": "string",
                "minLength": 2,
                "maxLength": 30
            },
            "incorrect_2": {
                "type": "string",
                "minLength": 2,
                "maxLength": 30
            }
        },
        "required": ["incorrect_1", "incorrect_2"]
    }
    
    generator = outlines.generate.json(model, json.dumps(alternatives_schema))
    result = generator(system_content)
    
    if isinstance(result, str):
        result = json.loads(result)
    
    return result["incorrect_1"], result["incorrect_2"]


def generate_fill_in_blank_simple(model, language: str, level: str, topic: str):
    """Generate fill-in-blank exercises using the simplified bulk approach."""
    exercises = []
    
    try:
        # Step 1: Generate 5 complete sentences at once
        sentences_data = generate_complete_sentences_bulk(model, language, level, topic, count=5)
        
        for sentence_data in sentences_data:
            try:
                complete_sentence = sentence_data["sentence"]
                translation = sentence_data["translation"]
                
                # Step 2: Select word to remove
                blank_position, correct_answer = select_word_to_remove(complete_sentence, language)
                
                # Step 3: Create sentence with blank
                words = complete_sentence.split()
                words[blank_position] = "_"
                sentence_with_blank = " ".join(words)
                
                # Step 4: Generate incorrect options
                incorrect_1, incorrect_2 = generate_incorrect_options(
                    model, complete_sentence, correct_answer, language, level
                )
                
                # Step 5: Create exercise
                exercise = {
                    "sentence": sentence_with_blank,
                    "correct_answer": correct_answer,
                    "incorrect_1": incorrect_1,
                    "incorrect_2": incorrect_2,
                    "blank_position": blank_position,
                    "translation": translation
                }
                
                exercises.append(exercise)
                
            except Exception as e:
                print(f"Error processing sentence '{sentence_data.get('sentence', 'unknown')}': {e}")
                continue
                
    except Exception as e:
        print(f"Error generating bulk sentences: {e}")
        return []
    
    return exercises


def generate_fill_in_blank(model, language: str, level: str, topic: str):
    """Generate fill-in-blank exercises using the simplified approach."""
    from .models import FillInBlankExercise
    from typing import List

    # Use the simplified approach
    exercise_dicts = generate_fill_in_blank_simple(model, language, level, topic)
    
    # Convert to Pydantic models
    exercises = []
    for exercise_dict in exercise_dicts:
        try:
            exercise = FillInBlankExercise(**exercise_dict)
            exercises.append(exercise)
        except Exception as e:
            print(f"Error converting exercise to Pydantic model: {e}")
            print(f"Exercise data: {exercise_dict}")
            continue
    
    return exercises


def generate_lessons_data_structured(
    language: str,
    level: str,
    topic: str,
    N_runs: int = 10,
    lesson_kinds: List[str] = ["conversations", "pairs", "translations", "fill_in_blank"],
    model=None,  # Allow passing model to reuse it
    max_retries: int = 5,
    log_path: str = None,
):
    """Drop-in replacement for your generate_lessons_data using Outlines with validation and retry logic."""

    # Setup model once if not provided
    if model is None:
        model = setup_outlines_model()

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
                    # Generate data - now returns Pydantic model instances
                    data = generators[lesson_kind](model, language, level, topic)

                    # Convert Pydantic models to dict for JSON serialization
                    if hasattr(data, '__iter__') and not isinstance(data, (str, bytes)):
                        # It's a list of models
                        data_dicts = [item.dict() for item in data]
                    else:
                        # It's a single model
                        data_dicts = data.dict()

                    # Convert to JSON string to match your existing interface
                    json_response = json.dumps(data_dicts, ensure_ascii=False)
                    
                    # Log success
                    logging.info(f"Successfully generated {lesson_kind} for {language}-{level}-{topic} (attempt {attempt + 1})")
                    
                    yield lesson_kind, lesson_id, json_response
                    break  # Success, exit retry loop

                except Exception as e:
                    error_msg = f"Error generating {lesson_kind} for {language}-{level}-{topic} (attempt {attempt + 1}/{max_retries}): {e}"
                    logging.warning(error_msg)
                    
                    if attempt == max_retries - 1:
                        logging.error(f"Max retries reached for {lesson_kind} {language}-{level}-{topic}")
                        # Log to CSV if log_path is provided
                        if log_path:
                            from .generate_lessons import log_failure
                            log_failure(log_path, language, level, topic, lesson_kind,
                                      lesson_id, None, "GenerationError", str(e), 
                                      f"Failed after {max_retries} attempts")
                        import traceback
                        traceback.print_exc()
                    continue


def test_outlines_generation():
    """Test that Outlines is working with your setup."""
    import logging
    
    # Configure logging for the test
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    
    model = setup_outlines_model()

    # Test conversation generation
    print("Testing conversation generation...")
    conversations = generate_conversations(model, "French", "beginner", "food")
    print("Conversations:", json.dumps([conv.dict() for conv in conversations], indent=2, ensure_ascii=False))

    # Test pairs generation
    print("\nTesting pairs generation...")
    pairs = generate_pairs(model, "French", "beginner", "food")
    print("Word Pairs:", json.dumps([pair.dict() for pair in pairs], indent=2, ensure_ascii=False))

    # Test translations
    print("\nTesting translations generation...")
    translations = generate_translations(model, "French", "beginner", "food")
    print("Translations:", json.dumps([trans.dict() for trans in translations], indent=2, ensure_ascii=False))
    
    # Test fill-in-blank generation
    print("\nTesting fill-in-blank generation...")
    fill_in_blank = generate_fill_in_blank(model, "French", "beginner", "food")
    print("Fill-in-blank:", json.dumps([fib.dict() for fib in fill_in_blank], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    test_outlines_generation()
