# -*- coding: utf-8 -*-
"""
Outlines integration for structured lesson generation.
"""

import json
import logging
import os
import threading

import openai
import outlines
from typing import Any, Dict, List
import uuid

try:
    from content.generation.models.models import (
        ConversationExercise,
        create_pair_schema,
    )
except ImportError:
    from content.generation.models.models import (
        ConversationExercise,
        create_pair_schema,
    )


# Centralized model configuration
MODEL_CONFIG = {
    "base_url": os.environ.get("AHLINGO_OUTLINES_URL", "http://192.168.68.51:11434/v1"),
    "api_key": os.environ.get("AHLINGO_OUTLINES_API_KEY", "sk-no-key-required"),
    "temperature": float(os.environ.get("AHLINGO_OUTLINES_TEMPERATURE", "0.75")),
    "exercise_temperatures": {
        "conversations": 0.8,
        "pairs": 0.68,
        "translations": 0.72,
        "fill_in_blank": 0.75,
    },
    "no_think": False,  # Set to True to prepend /no_think to prompts
    "debug": False,  # Set to True to show debug info and pause for user input
}


class OutlinesModelManager:
    """Wraps an OpenAI client/model pair and reuses it per thread."""

    def __init__(self, client: openai.OpenAI, model_name: str):
        self._client = client
        self._model_name = model_name
        self._thread_local = threading.local()
        self._lock = threading.Lock()

    def get_model(self):
        if hasattr(self._thread_local, "model"):
            return self._thread_local.model

        with self._lock:
            model = outlines.models.OpenAI(self._client, model_name=self._model_name)
        self._thread_local.model = model
        return model


def resolve_outlines_model(model):
    """Return the actual outlines model (handles manager wrappers)."""

    if isinstance(model, OutlinesModelManager):
        return model.get_model()
    return model


def _conversation_schema(_: str) -> Dict[str, Any]:
    return {
        "type": "array",
        "minItems": 2,
        "maxItems": 5,
        "items": {
            "type": "object",
            "required": ["conversation", "conversation_summary"],
            "properties": {
                "conversation": {
                    "type": "array",
                    "minItems": 2,
                    "maxItems": 8,
                    "items": {
                        "type": "object",
                        "required": ["speaker", "message"],
                        "properties": {
                            "speaker": {"type": "string"},
                            "message": {"type": "string"},
                        },
                        "additionalProperties": False,
                    },
                },
                "conversation_summary": {"type": "string"},
            },
            "additionalProperties": False,
        },
    }


def _pair_schema(language: str) -> Dict[str, Any]:
    return {
        "type": "array",
        "minItems": 5,
        "maxItems": 7,
        "items": {
            "type": "object",
            "required": ["English", language],
            "properties": {
                "English": {"type": "string"},
                language: {"type": "string"},
            },
            "additionalProperties": False,
        },
    }


def _translation_schema(language: str) -> Dict[str, Any]:
    return {
        "type": "array",
        "minItems": 5,
        "maxItems": 8,
        "items": {
            "type": "object",
            "required": ["English", language],
            "properties": {
                "English": {"type": "string"},
                language: {"type": "string"},
            },
            "additionalProperties": False,
        },
    }


def _fill_in_blank_schema(language: str) -> Dict[str, Any]:
    return {
        "type": "array",
        "minItems": 5,
        "maxItems": 8,
        "items": {
            "type": "object",
            "required": [
                "sentence",
                "correct_answer",
                "incorrect_1",
                "incorrect_2",
                "blank_position",
                "translation",
            ],
            "properties": {
                "sentence": {"type": "string"},
                "correct_answer": {"type": "string"},
                "incorrect_1": {"type": "string"},
                "incorrect_2": {"type": "string"},
                "blank_position": {"type": "integer"},
                "translation": {"type": "string"},
            },
            "additionalProperties": False,
        },
    }


SCHEMA_TEMPLATES = {
    "conversations": _conversation_schema,
    "pairs": _pair_schema,
    "translations": _translation_schema,
    "fill_in_blank": _fill_in_blank_schema,
}


def build_schema_for_lesson(lesson_kind: str, language: str) -> Dict[str, Any]:
    """Generate lesson-specific JSON schema for prompt guidance."""

    template = SCHEMA_TEMPLATES.get(lesson_kind)
    if not template:
        return {}

    return template(language)


def format_schema_block(schema: Dict[str, Any]) -> str:
    if not schema:
        return ""
    return "\n\nFollow this JSON schema exactly (JSON Schema):\n" + json.dumps(
        schema, ensure_ascii=False, indent=2
    )


def get_exercise_temperature(lesson_kind: str) -> float:
    return MODEL_CONFIG["exercise_temperatures"].get(
        lesson_kind, MODEL_CONFIG["temperature"]
    )


def run_outlines_generation(
    prompt: str, model, schema: Dict[str, Any] = None, temperature: float = None
):
    resolved_model = resolve_outlines_model(model)
    generator = outlines.Generator(resolved_model)
    kwargs = {}
    if schema:
        kwargs["schema"] = schema
    if temperature is not None:
        kwargs["temperature"] = temperature

    try:
        return generator(prompt, **kwargs)
    except TypeError as exc:
        logging.debug(
            "Outlines generator rejected kwargs %s: %s", list(kwargs.keys()), exc
        )
        fallback_kwargs = kwargs.copy()

        if "schema" in fallback_kwargs:
            fallback_kwargs.pop("schema")
            try:
                return generator(prompt, **fallback_kwargs)
            except TypeError:
                logging.debug(
                    "Outlines generator still rejected kwargs after dropping schema"
                )

        if "temperature" in fallback_kwargs:
            fallback_kwargs.pop("temperature")
            try:
                return generator(prompt, **fallback_kwargs)
            except TypeError:
                logging.debug(
                    "Outlines generator still rejected kwargs after dropping temperature"
                )

        return generator(prompt)


class ValidationError(Exception):
    """Custom exception for validation errors."""

    pass


def prepare_prompt(prompt: str) -> str:
    """Prepare prompt by adding /no_think prefix if enabled."""
    if MODEL_CONFIG.get("no_think", False):
        return "/no_think\n" + prompt
    return prompt


def clean_model_response(response: str) -> str:
    """Clean model response by removing <think> blocks and other artifacts."""
    import re

    # Remove <think>...</think> blocks (including multiline)
    response = re.sub(
        r"<think>.*?</think>", "", response, flags=re.DOTALL | re.IGNORECASE
    )

    # Remove any leading/trailing whitespace
    response = response.strip()

    return response


def debug_show_error(
    prompt: str, response: str, error: str, context: str = "Generation"
):
    """Show debug information for errors and pause for user input if debug mode is enabled."""
    if MODEL_CONFIG.get("debug", False):
        print("\n" + "=" * 80)
        print(f"🚨 DEBUG ERROR: {context}")
        print("=" * 80)
        print(f"\n❌ ERROR: {error}")
        print("\n📝 PROMPT SENT TO MODEL:")
        print("-" * 40)
        print(prompt)
        print("-" * 40)
        print("\n🤖 MODEL RESPONSE:")
        print("-" * 40)
        print(repr(response))  # Use repr to show exact string with escape chars
        print("-" * 40)
        print(f"\n📊 RESPONSE DETAILS:")
        print(f"  Length: {len(response)} characters")
        print(f"  Type: {type(response)}")
        if response.strip():
            print(f"  First 100 chars: {response[:100]!r}")
            print(f"  Last 100 chars: {response[-100:]!r}")
        else:
            print("  ⚠️  RESPONSE IS EMPTY OR WHITESPACE ONLY!")
        print("\n" + "=" * 80)
        input("🔍 Press ENTER to continue after error...")
        print()


def setup_outlines_model():
    """Setup Outlines with centralized configuration."""
    import warnings
    import logging

    # Suppress specific warnings that are not actionable
    warnings.filterwarnings(
        "ignore", category=RuntimeWarning, message=".*Event loop is closed.*"
    )

    try:
        # Create OpenAI client first
        client = openai.OpenAI(
            base_url=MODEL_CONFIG["base_url"],
            api_key=MODEL_CONFIG["api_key"],
        )

        # Determine model name from server or fallbacks
        try:
            models = client.models.list()
            if models.data:
                model_name = models.data[0].id
                logging.info(f"Using model: {model_name}")
            else:
                raise RuntimeError("No models available on server")
        except Exception as e:
            logging.warning(f"Failed to get models from server: {e}")
            for fallback in ["qwen3-4b", "mistral", "llama3", "llama"]:
                model_name = fallback
                logging.info(f"Falling back to model: {model_name}")
                break
            else:
                raise RuntimeError("No accessible models found")

        return OutlinesModelManager(client, model_name=model_name)
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
    """Format examples for inclusion in the prompt as a JSON array."""
    if not examples:
        return ""

    # Take only the first few examples to avoid overwhelming the prompt
    limited_examples = examples[:max_examples]

    # Format as a proper JSON array to match expected output format
    return json.dumps(limited_examples, ensure_ascii=False, indent=2)


def generate_conversations(model, language: str, level: str, topic: str):
    """Generate conversation exercises with guaranteed structure."""
    try:
        from content.generation.utils.assistants import default_conversation_assistants
        from content.generation.models.models import ConversationExercise
    except ImportError:
        from content.generation.utils.assistants import default_conversation_assistants
        from content.generation.models.models import ConversationExercise
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

    # Create enhanced prompt with examples context
    examples_context = ""
    if language in default_conversation_assistants:
        examples_content = default_conversation_assistants[language]["content"]
        examples = parse_assistant_examples(examples_content)
        if examples:
            formatted_examples = format_examples_for_prompt(examples)
            examples_context = f"\n\nReference examples (for structure only):\n{formatted_examples}\n\nNow generate NEW conversations for the topic: {topic}"

    schema = build_schema_for_lesson("conversations", language)
    schema_instruction = format_schema_block(schema)

    full_prompt = (
        system_content
        + examples_context
        + schema_instruction
        + "\n\nReturn a JSON array of conversation objects."
    )

    prepared_prompt = prepare_prompt(full_prompt)
    temperature = get_exercise_temperature("conversations")
    result = run_outlines_generation(
        prepared_prompt, model, schema=schema, temperature=temperature
    )

    # Parse JSON response and convert to Pydantic models
    if isinstance(result, str):
        # Clean the response by removing <think> blocks
        cleaned_result = clean_model_response(result)

        try:
            import re

            # Look for JSON array in the cleaned response
            json_match = re.search(r"\[.*\]", cleaned_result, re.DOTALL)
            if json_match:
                result_data = json.loads(json_match.group())
            else:
                result_data = json.loads(cleaned_result)
        except json.JSONDecodeError as e:
            logging.warning(f"Failed to parse JSON response: {e}")
            debug_show_error(
                prepared_prompt,
                str(result),
                f"JSON Parse Error: {e}\nOriginal: {result!r}\nCleaned: {cleaned_result!r}",
                f"Conversation Generation ({language}-{level}-{topic})",
            )
            return []
    else:
        result_data = result

    return [ConversationExercise(**item) for item in result_data]


def generate_pairs(model, language: str, level: str, topic: str):
    """Generate word pairs with guaranteed structure - creates exactly 5 pairs per exercise."""
    try:
        from content.generation.utils.assistants import default_pairs_assistants
        from content.generation.models.models import create_dynamic_word_pair_model
    except ImportError:
        from content.generation.utils.assistants import default_pairs_assistants
        from content.generation.models.models import create_dynamic_word_pair_model
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

    # Create enhanced prompt with examples context
    examples_context = ""
    if language in default_pairs_assistants:
        examples_content = default_pairs_assistants[language]["content"]
        examples = parse_assistant_examples(examples_content)
        if examples:
            formatted_examples = format_examples_for_prompt(examples)
            examples_context = f"\n\nReference examples (for format only):\n{formatted_examples}\n\nNow generate 5 NEW word pairs for the topic: {topic}"

    schema = build_schema_for_lesson("pairs", language)
    schema_instruction = format_schema_block(schema)

    full_prompt = (
        system_content
        + examples_context
        + schema_instruction
        + "\n\nReturn a JSON array of word pair objects."
    )

    prepared_prompt = prepare_prompt(full_prompt)
    temperature = get_exercise_temperature("pairs")
    result = run_outlines_generation(
        prepared_prompt, model, schema=schema, temperature=temperature
    )

    # Parse JSON response and convert to Pydantic models
    if isinstance(result, str):
        # Clean the response by removing <think> blocks
        cleaned_result = clean_model_response(result)

        try:
            import re

            # Look for JSON array in the cleaned response
            json_match = re.search(r"\[.*\]", cleaned_result, re.DOTALL)
            if json_match:
                result_data = json.loads(json_match.group())
            else:
                result_data = json.loads(cleaned_result)
        except json.JSONDecodeError as e:
            logging.warning(f"Failed to parse JSON response: {e}")
            debug_show_error(
                prepared_prompt,
                str(result),
                f"JSON Parse Error: {e}\nOriginal: {result!r}\nCleaned: {cleaned_result!r}",
                f"Pairs Generation ({language}-{level}-{topic})",
            )
            return []
    else:
        result_data = result

    # Create dynamic model and validate
    WordPairModel = create_dynamic_word_pair_model(language)
    return [WordPairModel(**item) for item in result_data]


def generate_translations(model, language: str, level: str, topic: str):
    """Generate sentence translations with guaranteed structure."""
    try:
        from content.generation.utils.assistants import default_translation_assistants
        from content.generation.models.models import (
            create_dynamic_translation_pair_model,
        )
    except ImportError:
        from content.generation.utils.assistants import default_translation_assistants
        from content.generation.models.models import (
            create_dynamic_translation_pair_model,
        )
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

    # Create enhanced prompt with examples context
    examples_context = ""
    if language in default_translation_assistants:
        examples_content = default_translation_assistants[language]["content"]
        examples = parse_assistant_examples(examples_content)
        if examples:
            formatted_examples = format_examples_for_prompt(examples)
            examples_context = f"\n\nReference examples (for format only):\n{formatted_examples}\n\nNow generate 5-8 NEW sentence translations for the topic: {topic}"

    schema = build_schema_for_lesson("translations", language)
    schema_instruction = format_schema_block(schema)

    full_prompt = (
        system_content
        + examples_context
        + schema_instruction
        + "\n\nReturn a JSON array of translation pair objects."
    )

    prepared_prompt = prepare_prompt(full_prompt)
    temperature = get_exercise_temperature("translations")
    result = run_outlines_generation(
        prepared_prompt, model, schema=schema, temperature=temperature
    )

    # Parse JSON response and convert to Pydantic models
    if isinstance(result, str):
        # Clean the response by removing <think> blocks
        cleaned_result = clean_model_response(result)

        try:
            import re

            # Look for JSON array in the cleaned response
            json_match = re.search(r"\[.*\]", cleaned_result, re.DOTALL)
            if json_match:
                result_data = json.loads(json_match.group())
            else:
                result_data = json.loads(cleaned_result)
        except json.JSONDecodeError as e:
            logging.warning(f"Failed to parse JSON response: {e}")
            debug_show_error(
                prepared_prompt,
                str(result),
                f"JSON Parse Error: {e}\nOriginal: {result!r}\nCleaned: {cleaned_result!r}",
                f"Translation Generation ({language}-{level}-{topic})",
            )
            return []
    else:
        result_data = result

    # Create dynamic model and validate
    TranslationPairModel = create_dynamic_translation_pair_model(language)
    return [TranslationPairModel(**item) for item in result_data]


def generate_complete_sentences_bulk(
    model, language: str, level: str, topic: str, count: int = 5
):
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

    # Use text generator for JSON output
    schema = {
        "type": "array",
        "minItems": count,
        "maxItems": count,
        "items": {
            "type": "object",
            "required": ["sentence", "translation"],
            "properties": {
                "sentence": {"type": "string"},
                "translation": {"type": "string"},
            },
            "additionalProperties": False,
        },
    }

    schema_instruction = format_schema_block(schema)

    full_prompt = (
        system_content
        + schema_instruction
        + f"\n\nReturn a JSON array of exactly {count} sentence objects, each with 'sentence' and 'translation' fields."
    )

    prepared_prompt = prepare_prompt(full_prompt)
    temperature = MODEL_CONFIG["temperature"]
    result = run_outlines_generation(
        prepared_prompt, model, schema=schema, temperature=temperature
    )

    # Parse JSON response
    if isinstance(result, str):
        # Clean the response by removing <think> blocks
        cleaned_result = clean_model_response(result)

        try:
            import re

            # Look for JSON array in the cleaned response
            json_match = re.search(r"\[.*\]", cleaned_result, re.DOTALL)
            if json_match:
                result_data = json.loads(json_match.group())
            else:
                result_data = json.loads(cleaned_result)
        except json.JSONDecodeError as e:
            logging.warning(f"Failed to parse JSON response: {e}")
            debug_show_error(
                prepared_prompt,
                str(result),
                f"JSON Parse Error: {e}\nOriginal: {result!r}\nCleaned: {cleaned_result!r}",
                f"Bulk Sentence Generation ({language}-{level}-{topic}, count={count})",
            )
            return []
    else:
        result_data = result

    return result_data


def generate_complete_sentence(model, language: str, level: str, topic: str):
    """Generate a single complete sentence (wrapper for bulk generation)."""
    bulk_result = generate_complete_sentences_bulk(
        model, language, level, topic, count=1
    )
    return bulk_result[0] if bulk_result else {"sentence": "", "translation": ""}


def select_word_to_remove(sentence: str, language: str = "French"):
    """Select a suitable word to remove from the sentence using heuristics instead of hardcoded lists."""
    words = sentence.split()

    # Find suitable words using language-agnostic heuristics
    suitable_words = []
    for i, word in enumerate(words):
        # Clean word of punctuation for checking
        clean_word = word.lower().rstrip(".,!?;:")

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
        longest_word = max(words, key=lambda w: len(w.rstrip(".,!?;:")))
        return words.index(longest_word), longest_word

    # Sort by: middle position preference, then word length (longer better)
    suitable_words.sort(key=lambda x: (abs(x[0] - len(words) // 2), -x[2]))

    return suitable_words[0][0], suitable_words[0][1]


def generate_incorrect_options(
    model, sentence: str, correct_answer: str, language: str, level: str
):
    """Generate 2 incorrect options for the fill-in-blank exercise."""
    system_content = f"""You are a {language} language learning tool. Given a sentence and the correct answer, generate 2 clearly incorrect alternatives.

SENTENCE: "{sentence}"
CORRECT ANSWER: "{correct_answer}"

REQUIREMENTS:
- Generate exactly 2 incorrect alternatives
- Each alternative must be AT MOST 3 WORDS (prefer single words when possible)
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
Bad alternatives: "voiture" (same as correct answer!), "auto" (too similar to correct answer), "suis en train de" (too many words - exceeds 3 word limit)

Generate 2 alternatives (1-3 words each) that are obviously wrong in this context and different from "{correct_answer}"."""

    # Use text generator for JSON output
    full_prompt = (
        system_content
        + "\n\nReturn a JSON object with 'incorrect_1' and 'incorrect_2' fields containing the two incorrect alternatives."
    )

    schema = {
        "type": "object",
        "required": ["incorrect_1", "incorrect_2"],
        "properties": {
            "incorrect_1": {"type": "string"},
            "incorrect_2": {"type": "string"},
        },
        "additionalProperties": False,
    }

    schema_instruction = format_schema_block(schema)

    full_prompt = full_prompt + schema_instruction
    prepared_prompt = prepare_prompt(full_prompt)
    temperature = MODEL_CONFIG["temperature"]
    result = run_outlines_generation(
        prepared_prompt, model, schema=schema, temperature=temperature
    )

    # Parse JSON response
    if isinstance(result, str):
        # Clean the response by removing <think> blocks
        cleaned_result = clean_model_response(result)

        try:
            import re

            # Look for JSON object in the cleaned response
            json_match = re.search(r"\{.*\}", cleaned_result, re.DOTALL)
            if json_match:
                result_data = json.loads(json_match.group())
            else:
                result_data = json.loads(cleaned_result)
        except json.JSONDecodeError as e:
            logging.warning(f"Failed to parse JSON response: {e}")
            debug_show_error(
                prepared_prompt,
                str(result),
                f"JSON Parse Error: {e}\nOriginal: {result!r}\nCleaned: {cleaned_result!r}",
                f"Incorrect Options Generation ({language}-{level}, correct='{correct_answer}')",
            )
            return "error1", "error2"
    else:
        result_data = result

    return result_data.get("incorrect_1", "error1"), result_data.get(
        "incorrect_2", "error2"
    )


def generate_fill_in_blank_structured(model, language: str, level: str, topic: str):
    """Generate fill-in-blank exercises using single-step structured generation."""
    try:
        from content.generation.models.models import FillInBlankExercise
    except ImportError:
        from content.generation.models.models import FillInBlankExercise
    from typing import List

    # Create comprehensive system message for structured generation
    system_content = f"""You are a {language} language learning tool. Generate 5 fill-in-blank exercises about "{topic}" at {level} level.

REQUIREMENTS:
- Generate complete exercises with all components in one step
- Each exercise must have a {language} sentence with exactly one blank (_)
- Choose content words (nouns, verbs, adjectives, adverbs) for blanks - avoid articles, prepositions, or obvious words
- Provide one correct answer and two clearly incorrect alternatives
- CRITICAL: All answer options (correct_answer, incorrect_1, incorrect_2) must be AT MOST 3 WORDS
- Prefer single-word answers when possible, but compound words or short phrases (2-3 words max) are acceptable
- All three answer options must be COMPLETELY UNIQUE from each other
- Incorrect options should be the same part of speech but obviously wrong in context
- Include accurate English translation of the complete sentence (without blank)
- Blank position should be 0-indexed word position

QUALITY STANDARDS:
- Sentences should be 4-15 words long and natural for {level} learners
- Focus on practical, everyday situations related to {topic}
- Answer options should be concise (1-3 words maximum)
- Avoid long phrases like "suis en train de" - use simpler forms like "fais" instead
- Incorrect options should be plausible words but clearly wrong
- Ensure variety in sentence structure and vocabulary
- Make exercises educational and engaging

EXAMPLES OF GOOD ANSWERS:
✓ "mange" (1 word - perfect)
✓ "très content" (2 words - acceptable)
✓ "pomme de terre" (3 words - acceptable for compound nouns)

EXAMPLES OF BAD ANSWERS:
✗ "suis en train de faire" (5 words - TOO LONG!)
✗ "je vais aller chercher" (4 words - TOO LONG!)

CRITICAL: Each exercise's correct_answer, incorrect_1, and incorrect_2 must be three different words/phrases, each with AT MOST 3 WORDS."""

    # Create enhanced prompt with examples context
    examples_context = ""
    try:
        from content.generation.utils.assistants import default_fill_in_blank_assistants

        if language in default_fill_in_blank_assistants:
            examples_content = default_fill_in_blank_assistants[language]["content"]
            examples = parse_assistant_examples(examples_content)
            if examples:
                formatted_examples = format_examples_for_prompt(
                    examples, max_examples=2
                )
                examples_context = f"\n\nReference examples (structure only):\n{formatted_examples}\n\nNow generate 5 NEW fill-in-blank exercises for: {topic}"
    except (ImportError, KeyError):
        # No examples available for this language, continue without them
        pass

    schema = build_schema_for_lesson("fill_in_blank", language)
    schema_instruction = format_schema_block(schema)

    full_prompt = (
        system_content
        + examples_context
        + schema_instruction
        + "\n\nReturn a JSON array of exactly 5 fill-in-blank exercise objects."
    )

    prepared_prompt = prepare_prompt(full_prompt)
    temperature = get_exercise_temperature("fill_in_blank")
    result = run_outlines_generation(
        prepared_prompt, model, schema=schema, temperature=temperature
    )

    # Parse JSON response and convert to Pydantic models
    if isinstance(result, str):
        # Clean the response by removing <think> blocks
        cleaned_result = clean_model_response(result)

        try:
            import re

            # Look for JSON array in the cleaned response
            json_match = re.search(r"\[.*\]", cleaned_result, re.DOTALL)
            if json_match:
                result_data = json.loads(json_match.group())
            else:
                result_data = json.loads(cleaned_result)
        except json.JSONDecodeError as e:
            logging.warning(f"Failed to parse JSON response: {e}")
            debug_show_error(
                prepared_prompt,
                str(result),
                f"JSON Parse Error: {e}\nOriginal: {result!r}\nCleaned: {cleaned_result!r}",
                f"Fill-in-Blank Structured Generation ({language}-{level}-{topic})",
            )
            return []
    else:
        result_data = result

    # Validate and convert to Pydantic models
    exercises = []
    for i, exercise_data in enumerate(result_data):
        try:
            # Validate uniqueness before creating Pydantic model
            correct = exercise_data.get("correct_answer", "")
            incorrect1 = exercise_data.get("incorrect_1", "")
            incorrect2 = exercise_data.get("incorrect_2", "")

            if len(set([correct, incorrect1, incorrect2])) != 3:
                logging.warning(
                    f"Skipping exercise {i+1} due to duplicate answers: correct='{correct}', incorrect1='{incorrect1}', incorrect2='{incorrect2}'"
                )
                continue

            exercise = FillInBlankExercise(**exercise_data)
            exercises.append(exercise)
        except Exception as e:
            logging.warning(
                f"Error creating exercise {i+1}: {e}\nData: {exercise_data}"
            )
            continue

    return exercises


def generate_fill_in_blank(model, language: str, level: str, topic: str):
    """Generate fill-in-blank exercises using the structured approach."""
    # Use the new structured generation approach
    return generate_fill_in_blank_structured(model, language, level, topic)


def generate_lessons_data_structured(
    language: str,
    level: str,
    topic: str,
    N_runs: int = 10,
    lesson_kinds: List[str] = [
        "conversations",
        "pairs",
        "translations",
        "fill_in_blank",
    ],
    model=None,  # Allow passing model to reuse it
    max_retries: int = 5,
    log_path: str = None,
):
    """Drop-in replacement for your generate_lessons_data using Outlines with validation and retry logic."""

    # Setup model manager once if not provided
    model_source = model if model is not None else setup_outlines_model()

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
                    resolved_model = resolve_outlines_model(model_source)
                    data = generators[lesson_kind](
                        resolved_model, language, level, topic
                    )

                    # Convert Pydantic models to dict for JSON serialization
                    if hasattr(data, "__iter__") and not isinstance(data, (str, bytes)):
                        # It's a list of models
                        data_dicts = [item.dict() for item in data]
                    else:
                        # It's a single model
                        data_dicts = data.dict()

                    # Convert to JSON string to match your existing interface
                    json_response = json.dumps(data_dicts, ensure_ascii=False)

                    # Log success
                    logging.info(
                        f"Successfully generated {lesson_kind} for {language}-{level}-{topic} (attempt {attempt + 1})"
                    )

                    yield lesson_kind, lesson_id, json_response
                    break  # Success, exit retry loop

                except Exception as e:
                    error_msg = f"Error generating {lesson_kind} for {language}-{level}-{topic} (attempt {attempt + 1}/{max_retries}): {e}"
                    logging.warning(error_msg)

                    if attempt == max_retries - 1:
                        logging.error(
                            f"Max retries reached for {lesson_kind} {language}-{level}-{topic}"
                        )
                        # Log to CSV if log_path is provided
                        if log_path:
                            try:
                                from .generate_lessons import log_failure
                            except ImportError:
                                from generate_lessons import log_failure
                            log_failure(
                                log_path,
                                language,
                                level,
                                topic,
                                lesson_kind,
                                lesson_id,
                                None,
                                "GenerationError",
                                str(e),
                                f"Failed after {max_retries} attempts",
                            )
                        import traceback

                        traceback.print_exc()
                    continue


def test_outlines_generation():
    """Test that Outlines is working with your setup."""
    import logging

    # Configure logging for the test
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )

    model = setup_outlines_model()

    # Test conversation generation
    print("Testing conversation generation...")
    conversations = generate_conversations(model, "French", "beginner", "food")
    print(
        "Conversations:",
        json.dumps(
            [conv.dict() for conv in conversations], indent=2, ensure_ascii=False
        ),
    )

    # Test pairs generation
    print("\nTesting pairs generation...")
    pairs = generate_pairs(model, "French", "beginner", "food")
    print(
        "Word Pairs:",
        json.dumps([pair.dict() for pair in pairs], indent=2, ensure_ascii=False),
    )

    # Test translations
    print("\nTesting translations generation...")
    translations = generate_translations(model, "French", "beginner", "food")
    print(
        "Translations:",
        json.dumps(
            [trans.dict() for trans in translations], indent=2, ensure_ascii=False
        ),
    )

    # Test fill-in-blank generation
    print("\nTesting fill-in-blank generation...")
    fill_in_blank = generate_fill_in_blank(model, "French", "beginner", "food")
    print(
        "Fill-in-blank:",
        json.dumps([fib.dict() for fib in fill_in_blank], indent=2, ensure_ascii=False),
    )


if __name__ == "__main__":
    test_outlines_generation()
