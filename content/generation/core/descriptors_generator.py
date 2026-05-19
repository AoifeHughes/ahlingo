#!/usr/bin/env python3
"""
LLM-based image descriptor generation for AHLingo.

Generates correct and incorrect descriptors for images in a target language
at a given difficulty level.
"""

import json
import logging
import re
from typing import Dict, List, Optional

from generation.core.outlines_generator import (
    build_schema_for_lesson,
    clean_model_response,
    debug_show_error,
    prepare_prompt,
    resolve_outlines_model,
    run_outlines_generation,
)


def _image_prompt_schema() -> Dict:
    """JSON schema for LLM-generated image prompts."""
    return {
        "type": "array",
        "minItems": 5,
        "maxItems": 15,
        "items": {
            "type": "object",
            "required": ["prompt", "topic"],
            "properties": {
                "prompt": {"type": "string"},
                "topic": {"type": "string"},
            },
            "additionalProperties": False,
        },
    }


def _image_descriptor_schema() -> Dict:
    """JSON schema for image descriptors."""
    return {
        "type": "object",
        "required": ["correct_descriptor", "incorrect_1", "incorrect_2", "english_meaning"],
        "properties": {
            "correct_descriptor": {"type": "string"},
            "incorrect_1": {"type": "string"},
            "incorrect_2": {"type": "string"},
            "english_meaning": {"type": "string"},
        },
        "additionalProperties": False,
    }


def _difficulty_instructions(difficulty: str) -> str:
    """Return difficulty-specific instructions for descriptor generation."""
    instructions = {
        "beginner": (
            "Use simple vocabulary and short phrases (3-8 words). "
            "Focus on basic nouns and simple adjectives. "
            "Use present tense only. "
            "Example: 'un chat noir' (a black cat), 'une pomme rouge' (a red apple)"
        ),
        "intermediate": (
            "Use full sentences (8-15 words). "
            "Include verbs, adjectives, and basic grammar structures. "
            "Use present, past, and future tenses. "
            "Example: 'Le chat noir dort sur le canapé' (The black cat is sleeping on the sofa)"
        ),
        "advanced": (
            "Use complex sentences (12-25 words). "
            "Include subordinate clauses, relative pronouns, and advanced vocabulary. "
            "Use varied tenses and moods. "
            "Example: 'Le chat noir qui dort sur le canapé semble très fatigué après une longue journée' "
            "(The black cat that's sleeping on the sofa seems very tired after a long day)"
        ),
    }
    return instructions.get(difficulty.lower(), instructions["intermediate"])


def generate_image_prompts(
    model, topic: str, count: int = 10
) -> Optional[List[Dict]]:
    """Generate image prompts for a topic using the LLM.

    Args:
        model: The outlines model to use
        topic: The topic to generate prompts for
        count: Number of prompts to generate

    Returns:
        List of dicts with 'prompt' and 'topic' keys, or None on failure
    """
    system_content = f"""Generate {count} simple scene descriptions for topic "{topic}". Each should be a concrete visual moment (5-15 words) suitable for flat clip art. Examples: "person eating pasta at a restaurant table", "chef holding a wooden spoon in a kitchen". Avoid abstract concepts and similar scenes."""

    schema = _image_prompt_schema()
    full_prompt = (
        system_content
        + "\n\nReturn a JSON array of prompt objects, each with 'prompt' and 'topic' fields."
    )

    prepared_prompt = prepare_prompt(full_prompt)
    resolved_model = resolve_outlines_model(model)

    try:
        result = run_outlines_generation(
            prepared_prompt, resolved_model, schema=schema, temperature=0.8
        )

        if isinstance(result, str):
            cleaned = clean_model_response(result)
            json_match = re.search(r"\[.*\]", cleaned, re.DOTALL)
            if json_match:
                result_data = json.loads(json_match.group())
            else:
                result_data = json.loads(cleaned)
        else:
            result_data = result

        return result_data[:count]

    except Exception as e:
        logging.warning(f"Failed to generate image prompts for topic '{topic}': {e}")
        debug_show_error(
            prepared_prompt,
            str(result) if 'result' in locals() else "",
            str(e),
            f"Image Prompt Generation ({topic})",
        )
        return None


def generate_descriptors(
    model,
    image_prompt: str,
    language: str,
    difficulty: str,
) -> Optional[Dict]:
    """Generate correct and incorrect descriptors for an image.

    Args:
        model: The outlines model to use
        image_prompt: English description of the image scene
        language: Target language (e.g., "French")
        difficulty: Difficulty level (beginner/intermediate/advanced)

    Returns:
        Dict with correct_descriptor, incorrect_1, incorrect_2, english_meaning
        or None on failure
    """
    difficulty_instructions = _difficulty_instructions(difficulty)

    system_content = f"""You are a {language} language learning tool. Given a description of an image scene, generate 3 descriptions in {language} at {difficulty.capitalize()} level.

IMAGE SCENE (English): "{image_prompt}"

TASK:
1. Write ONE correct description of this scene in {language}
2. Write TWO clearly incorrect descriptions that describe completely different scenes

REQUIREMENTS:
- {difficulty_instructions}
- The correct descriptor must accurately describe the given scene
- The incorrect descriptors must describe scenes that are clearly NOT what's shown
- All three descriptors must be in {language}
- The incorrect descriptors should be plausible {language} phrases but obviously wrong for this image
- Include an English translation of the correct descriptor

Example format:
- Correct: "un homme mange des pâtes" (man eating pasta)
- Incorrect 1: "une femme conduit une voiture" (woman driving a car)
- Incorrect 2: "un enfant joue au football" (child playing football)

The incorrect descriptors should be about different actions, objects, or settings that are clearly not matching the image."""

    schema = _image_descriptor_schema()
    full_prompt = (
        system_content
        + "\n\nReturn a JSON object with 'correct_descriptor', 'incorrect_1', 'incorrect_2', and 'english_meaning' fields."
    )

    prepared_prompt = prepare_prompt(full_prompt)
    resolved_model = resolve_outlines_model(model)

    try:
        result = run_outlines_generation(
            prepared_prompt, resolved_model, schema=schema, temperature=0.7
        )

        if isinstance(result, str):
            cleaned = clean_model_response(result)
            json_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if json_match:
                result_data = json.loads(json_match.group())
            else:
                result_data = json.loads(cleaned)
        else:
            result_data = result

        return result_data

    except Exception as e:
        logging.warning(
            f"Failed to generate descriptors for image '{image_prompt[:50]}': {e}"
        )
        debug_show_error(
            prepared_prompt,
            str(result) if 'result' in locals() else "",
            str(e),
            f"Descriptor Generation ({language}-{difficulty})",
        )
        return None
