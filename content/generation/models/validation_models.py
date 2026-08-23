# -*- coding: utf-8 -*-
"""
Validation schemas for LLM-based exercise quality review.

These models are handed directly to `LLMClient.generate` as the tool schema
for the validation call, so the API/self-repair loop guarantees well-typed
booleans and an in-range score -- no manual JSON scraping or null-coercion is
needed here.
"""

from typing import Dict, List, Type

from pydantic import BaseModel, Field


class ValidationResult(BaseModel):
    """Schema for validation responses from the LLM."""

    is_correct_language: bool = Field(
        default=False, description="Is the text in the specified language?"
    )
    has_correct_grammar: bool = Field(
        default=False, description="Is the grammar correct?"
    )
    is_translation_accurate: bool = Field(
        default=False,
        description="Is the translation accurate? Use false for non-translation exercises",
    )
    is_culturally_appropriate: bool = Field(
        default=False, description="Is the content culturally appropriate?"
    )
    is_educational_quality: bool = Field(
        default=False,
        description="Is this of good educational quality for language learning?",
    )
    overall_quality_score: int = Field(
        default=1, description="Overall quality score from 1-10", ge=1, le=10
    )
    issues_found: List[str] = Field(
        description="List of specific issues found", default_factory=list
    )


class ConversationValidation(ValidationResult):
    """Extended validation for conversation exercises."""

    has_natural_dialogue: bool = Field(
        default=False, description="Does the conversation flow naturally?"
    )
    appropriate_for_level: bool = Field(
        default=False,
        description="Is the difficulty appropriate for the specified level?",
    )


class PairValidation(ValidationResult):
    """Extended validation for word pair exercises."""

    translation_pairs_correct: bool = Field(
        default=False, description="Are all translation pairs accurate?"
    )
    appropriate_vocabulary_level: bool = Field(
        default=False, description="Is vocabulary appropriate for the level?"
    )


class TranslationValidation(ValidationResult):
    """Extended validation for translation exercises."""

    preserves_meaning: bool = Field(
        default=False, description="Does the translation preserve the original meaning?"
    )
    uses_natural_language: bool = Field(
        default=False,
        description="Does the translation use natural, idiomatic language?",
    )


class FillInBlankValidation(ValidationResult):
    """Extended validation for fill-in-blank exercises."""

    translation_matches_original: bool = Field(
        default=False,
        description="Does the English translation accurately convey the meaning of the original sentence?",
    )
    translation_has_no_blanks: bool = Field(
        default=True,
        description="Does the English translation contain NO blanks or underscores? It must be a complete sentence",
    )
    answer_options_appropriate: bool = Field(
        default=False,
        description="Are the answer options appropriate and at the right difficulty level?",
    )
    is_unambiguous: bool = Field(
        default=False,
        description="Is there only ONE clearly correct answer? No situation where multiple options could work",
    )


VALIDATION_SCHEMAS: Dict[str, Type[ValidationResult]] = {
    "conversation": ConversationValidation,
    "pair": PairValidation,
    "translation": TranslationValidation,
    "fill_in_blank": FillInBlankValidation,
}


def _normalize_exercise_type(exercise_type: str) -> str:
    """Normalize exercise type to singular form for validation schema lookup."""
    type_mapping = {
        "conversations": "conversation",
        "conversation": "conversation",
        "pairs": "pair",
        "pair": "pair",
        "translations": "translation",
        "translation": "translation",
        "fill_in_blank": "fill_in_blank",
    }
    return type_mapping.get(
        exercise_type.lower().strip(), exercise_type.lower().strip()
    )


def get_validation_schema(exercise_type: str) -> Type[ValidationResult]:
    """Get the validation Pydantic model for an exercise type."""
    return VALIDATION_SCHEMAS.get(
        _normalize_exercise_type(exercise_type), ValidationResult
    )
