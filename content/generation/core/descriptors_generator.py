#!/usr/bin/env python3
"""
LLM-based image prompt and descriptor generation for AHLingo.

Generates candidate scene descriptions for a topic, and correct/incorrect
descriptors for a given image in a target language at a given difficulty
level.
"""

from typing import Dict, List, Optional

from generation.core.llm_client import LLMClient
from generation.models.models import ImageDescriptor, ImagePromptList


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
    client: LLMClient, topic: str, count: int = 10
) -> Optional[List[Dict]]:
    """Generate `count` image prompts for a topic.

    Returns a list of dicts with 'prompt' and 'topic' keys, or None on failure.
    """
    system_prompt = (
        f'Generate {count} simple scene descriptions for topic "{topic}". '
        "Each should be a concrete visual moment (5-15 words) suitable for flat "
        'clip art. Examples: "person eating pasta at a restaurant table", '
        '"chef holding a wooden spoon in a kitchen". Avoid abstract concepts and '
        "similar scenes."
    )
    user_prompt = f"Generate {count} distinct scene prompts for topic: {topic}"

    result = client.generate(
        ImagePromptList,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.8,
    )
    if not result:
        return None
    return [p.model_dump() for p in result.prompts[:count]]


def generate_descriptors(
    client: LLMClient,
    image_prompt: str,
    language: str,
    difficulty: str,
) -> Optional[Dict]:
    """Generate correct and incorrect descriptors for an image scene.

    Returns a dict with correct_descriptor, incorrect_1, incorrect_2,
    english_meaning, or None on failure.
    """
    difficulty_instructions = _difficulty_instructions(difficulty)

    system_prompt = f"""You are a {language} language learning tool. Given a description of an image scene, generate 3 descriptions in {language} at {difficulty.capitalize()} level.

TASK:
1. Write ONE correct description of the scene in {language}
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
- Incorrect 2: "un enfant joue au football" (child playing football)"""

    user_prompt = f'Image scene (English): "{image_prompt}"'

    result = client.generate(
        ImageDescriptor,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.7,
    )
    return result.model_dump() if result else None
