# -*- coding: utf-8 -*-
"""
Exercise generation via LLM tool-calling.

Each exercise type is generated as ONE object matching a Pydantic model,
requested directly through `LLMClient.generate` (see llm_client.py). There is
no client-side JSON extraction or schema-in-prompt text: the model's schema
*is* the tool's parameters, and the API guarantees (or the self-repair loop
enforces) that the response matches it.

Note on "one object per call": conversations and translations used to ask the
model for a batch (2-4 conversations / 5-8 sentences) and then discard all but
the first, since only one exercise is inserted per call. That wasted most of
each generation. Both now request exactly the single exercise that's actually
used. Word pairs remain a batch, since a pairs *exercise* legitimately bundles
5-7 pairs together.
"""

import json
import logging
from typing import Any, Dict, List, Optional

from generation.core.llm_client import LLMClient
from generation.models.models import (
    ConversationExercise,
    FillInBlankExercise,
    create_pair_list_model,
    create_translation_pair_model,
)
from generation.utils.assistants import (
    default_conversation_assistants,
    default_fill_in_blank_assistants,
    default_pairs_assistants,
    default_translation_assistants,
)

EXERCISE_TEMPERATURES = {
    "conversations": 0.8,
    "pairs": 0.68,
    "translations": 0.72,
    "fill_in_blank": 0.75,
}


def parse_assistant_examples(assistant_content: str) -> List[Dict]:
    """Parse the bundled example content (a JSON array) for an exercise type."""
    try:
        return json.loads(assistant_content)
    except json.JSONDecodeError as e:
        logging.warning(f"Failed to parse assistant examples: {e}")
        return []


def format_examples_for_prompt(examples: List[Dict], max_examples: int = 2) -> str:
    """Format examples for inclusion in the prompt as a JSON array."""
    if not examples:
        return ""
    return json.dumps(examples[:max_examples], ensure_ascii=False, indent=2)


def _build_examples_block(
    existing_examples: Optional[List[Dict]],
    existing_shape_fn,
    default_assistants: Dict,
    language: str,
    noun: str,
) -> str:
    """Build the shared 'reference examples / generate something new' prompt block.

    Args:
        existing_examples: Raw exercise rows fetched from the database, if any.
        existing_shape_fn: Reshapes one DB row into the example dict format.
        default_assistants: Per-language bundled example content.
        language: Target language.
        noun: What we're asking for, e.g. "conversation", "word pairs".
    """
    all_examples = []

    if existing_examples:
        all_examples.extend(existing_shape_fn(ex) for ex in existing_examples)

    if language in default_assistants:
        default_examples = parse_assistant_examples(default_assistants[language]["content"])
        for ex in default_examples[:1]:
            if ex not in all_examples:
                all_examples.append(ex)

    if not all_examples:
        return ""

    diversity_note = ""
    if existing_examples:
        diversity_note = (
            "\n\nIMPORTANT: The examples above show exercises that ALREADY EXIST in "
            "the database. Generate something DIFFERENT from these examples. Vary "
            "vocabulary and structure. Avoid repeating similar content."
        )

    formatted = format_examples_for_prompt(all_examples)
    return (
        f"\n\nReference examples:\n{formatted}{diversity_note}"
        f"\n\nNow generate a NEW {noun}."
    )


def generate_conversation(
    client: LLMClient,
    language: str,
    level: str,
    topic: str,
    existing_examples: Optional[List[Dict]] = None,
) -> Optional[ConversationExercise]:
    """Generate a single conversation exercise."""
    system_prompt = f"""You are a {language} language learning tool. Generate one {level} level {language} conversation about "{topic}".

Requirements:
- 2-5 dialogue turns between speakers
- Natural, realistic dialogue for {level} learners
- Each turn should add new information or move the conversation forward
- A clear conversation summary in English
- Speakers with appropriate {language} names

Avoid repetitive patterns. Focus on a practical situation related to {topic}."""

    def _shape(ex):
        conversations = ex.get("conversations", "")
        if isinstance(conversations, str):
            try:
                conversations = json.loads(conversations)
            except json.JSONDecodeError:
                conversations = []
        return {"conversation": conversations, "summary": ex.get("summary", "")}

    examples_block = _build_examples_block(
        existing_examples, _shape, default_conversation_assistants, language, "conversation"
    )
    user_prompt = f"Generate a {level} level conversation in {language} about: {topic}{examples_block}"

    return client.generate(
        ConversationExercise,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=EXERCISE_TEMPERATURES["conversations"],
    )


def generate_pairs(
    client: LLMClient,
    language: str,
    level: str,
    topic: str,
    existing_examples: Optional[List[Dict]] = None,
) -> Optional[List[Any]]:
    """Generate a batch of 5-7 word pairs. Returns the list of pair model instances."""
    system_prompt = f"""You are a {language} language learning tool. Generate vocabulary pairs for "{topic}".

Create 5-7 word pairs at {level} level:
- English word or phrase paired with {language} translation
- Mix of nouns, verbs, adjectives, and adverbs
- Common, practical vocabulary related to {topic}
- Each pair must be unique within this set
- Cover different aspects of {topic}"""

    def _shape(ex):
        pairs = ex.get("pairs", "")
        if isinstance(pairs, str):
            try:
                pairs = json.loads(pairs)
            except json.JSONDecodeError:
                pairs = []
        return {"pairs": pairs}

    examples_block = _build_examples_block(
        existing_examples, _shape, default_pairs_assistants, language, "set of word pairs"
    )
    user_prompt = f"Generate 5-7 word pairs in {language} for topic: {topic}{examples_block}"

    PairListModel = create_pair_list_model(language)
    result = client.generate(
        PairListModel,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=EXERCISE_TEMPERATURES["pairs"],
    )
    return result.exercises if result else None


def generate_translation(
    client: LLMClient,
    language: str,
    level: str,
    topic: str,
    existing_examples: Optional[List[Dict]] = None,
) -> Optional[Any]:
    """Generate a single English/target-language sentence pair."""
    system_prompt = f"""You are a {language} language learning tool. Generate one sentence translation for "{topic}".

Requirements:
- A full English sentence with an accurate {language} translation
- A statement, question, or command appropriate for {level} learners
- Demonstrates a grammar pattern appropriate for {level} learners
- Natural, idiomatic translation that sounds native
- Practical and directly related to {topic}"""

    def _shape(ex):
        return {
            "language_1_content": ex.get("language_1_content", ""),
            "language_2_content": ex.get("language_2_content", ""),
        }

    examples_block = _build_examples_block(
        existing_examples, _shape, default_translation_assistants, language, "sentence translation"
    )
    user_prompt = f"Generate one {level} level sentence translation in {language} for topic: {topic}{examples_block}"

    TranslationPairModel = create_translation_pair_model(language)
    return client.generate(
        TranslationPairModel,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=EXERCISE_TEMPERATURES["translations"],
    )


def generate_fill_in_blank(
    client: LLMClient,
    language: str,
    level: str,
    topic: str,
    existing_examples: Optional[List[Dict]] = None,
) -> Optional[FillInBlankExercise]:
    """Generate a single fill-in-blank exercise."""
    system_prompt = f"""You are a {language} language learning tool. Generate 1 fill-in-blank exercise about "{topic}" at {level} level.

Requirements:
- A {language} sentence with exactly one blank (_)
- Choose a content word (noun, verb, adjective, adverb) for the blank - avoid articles, prepositions, or obvious words
- One correct answer and two clearly incorrect alternatives
- CRITICAL: correct_answer, incorrect_1, and incorrect_2 must each be AT MOST 3 WORDS, and all three must be different from each other
- Incorrect options must be the same part of speech but obviously wrong in context
- An accurate, COMPLETE English translation of the sentence (with the blank filled in, no underscores)
- blank_position is the 0-indexed word position of the blank

Quality standards:
- Sentence should be 4-15 words long and natural for {level} learners
- Focus on practical, everyday situations related to {topic}
- Prefer single-word answers; avoid long verb phrases"""

    def _shape(ex):
        return {
            "sentence": ex.get("sentence", ""),
            "correct_answer": ex.get("correct_answer", ""),
            "incorrect_1": ex.get("incorrect_1", ""),
            "incorrect_2": ex.get("incorrect_2", ""),
            "blank_position": ex.get("blank_position", 0),
            "translation": ex.get("translation", ""),
        }

    examples_block = _build_examples_block(
        existing_examples, _shape, default_fill_in_blank_assistants, language, "fill-in-blank exercise"
    )
    user_prompt = f"Generate one {level} level fill-in-blank exercise in {language} for topic: {topic}{examples_block}"

    return client.generate(
        FillInBlankExercise,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=EXERCISE_TEMPERATURES["fill_in_blank"],
    )


GENERATORS = {
    "conversations": generate_conversation,
    "pairs": generate_pairs,
    "translations": generate_translation,
    "fill_in_blank": generate_fill_in_blank,
}


def generate_exercise(
    client: LLMClient,
    exercise_type: str,
    language: str,
    level: str,
    topic: str,
    existing_examples: Optional[List[Dict]] = None,
):
    """Dispatch to the generator for `exercise_type`.

    Returns the generated Pydantic model instance (or, for "pairs", a list of
    pair model instances), or None if generation/validation failed.
    """
    generator = GENERATORS.get(exercise_type)
    if not generator:
        raise ValueError(f"Unknown exercise type: {exercise_type}")
    return generator(client, language, level, topic, existing_examples)
