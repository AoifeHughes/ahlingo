# -*- coding: utf-8 -*-
"""
Validation models and schemas for database exercise validation.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import json


class ValidationResult(BaseModel):
    """Schema for validation responses from the LLM."""

    is_correct_language: bool = Field(
        default=False, description="Is the text in the specified language? (true/false)"
    )
    has_correct_grammar: bool = Field(
        default=False, description="Is the grammar correct? (true/false)"
    )
    is_translation_accurate: bool = Field(
        default=False,
        description="Is the translation accurate? Use false for non-translation exercises (true/false)",
    )
    is_culturally_appropriate: bool = Field(
        default=False, description="Is the content culturally appropriate? (true/false)"
    )
    is_educational_quality: bool = Field(
        default=False,
        description="Is this of good educational quality for language learning? (true/false)",
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
        default=False, description="Does the conversation flow naturally? (true/false)"
    )
    appropriate_for_level: bool = Field(
        default=False,
        description="Is the difficulty appropriate for the specified level? (true/false)",
    )


class PairValidation(ValidationResult):
    """Extended validation for word pair exercises."""

    translation_pairs_correct: bool = Field(
        default=False, description="Are all translation pairs accurate? (true/false)"
    )
    appropriate_vocabulary_level: bool = Field(
        default=False,
        description="Is vocabulary appropriate for the level? (true/false)",
    )


class TranslationValidation(ValidationResult):
    """Extended validation for translation exercises."""

    preserves_meaning: bool = Field(
        default=False,
        description="Does the translation preserve the original meaning? (true/false)",
    )
    uses_natural_language: bool = Field(
        default=False,
        description="Does the translation use natural, idiomatic language? (true/false)",
    )


class FillInBlankValidation(ValidationResult):
    """Extended validation for fill-in-blank exercises."""

    translation_matches_original: bool = Field(
        default=False,
        description="Does the English translation accurately convey the meaning of the original sentence? (true/false)",
    )
    translation_has_no_blanks: bool = Field(
        default=True,
        description="Does the English translation contain NO blanks or underscores? It must be a complete sentence (true/false)",
    )
    answer_options_appropriate: bool = Field(
        default=False,
        description="Are the answer options appropriate and at the right difficulty level? (true/false)",
    )
    is_unambiguous: bool = Field(
        default=False,
        description="Is there only ONE clearly correct answer? No ambiguous situations where multiple options could work (true/false)",
    )


def get_validation_schema(exercise_type: str) -> str:
    """Get JSON schema for validation based on exercise type."""
    schemas = {
        "conversation": ConversationValidation.model_json_schema(),
        "pair": PairValidation.model_json_schema(),
        "translation": TranslationValidation.model_json_schema(),
        "fill_in_blank": FillInBlankValidation.model_json_schema(),
    }

    return json.dumps(schemas.get(exercise_type, ValidationResult.model_json_schema()))


def clean_validation_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Clean validation data to handle null/None values and ensure proper types."""
    cleaned = {}

    # Handle boolean fields - convert None/null to False
    boolean_fields = [
        "is_correct_language",
        "has_correct_grammar",
        "is_translation_accurate",
        "is_culturally_appropriate",
        "is_educational_quality",
        "has_natural_dialogue",
        "appropriate_for_level",
        "translation_pairs_correct",
        "appropriate_vocabulary_level",
        "preserves_meaning",
        "uses_natural_language",
        "translation_matches_original",
        "translation_has_no_blanks",
        "answer_options_appropriate",
        "is_unambiguous",
    ]

    for field in boolean_fields:
        if field in data:
            value = data[field]
            if value is None:
                cleaned[field] = False
            elif isinstance(value, str):
                cleaned[field] = value.lower() in ("true", "yes", "1", "correct")
            else:
                cleaned[field] = bool(value)
        else:
            cleaned[field] = False

    # Handle overall_quality_score
    if "overall_quality_score" in data:
        score = data["overall_quality_score"]
        if score is None:
            cleaned["overall_quality_score"] = 1
        else:
            try:
                cleaned["overall_quality_score"] = max(1, min(10, int(score)))
            except (ValueError, TypeError):
                cleaned["overall_quality_score"] = 1
    else:
        cleaned["overall_quality_score"] = 1

    # Handle issues_found
    if "issues_found" in data:
        issues = data["issues_found"]
        if isinstance(issues, list):
            cleaned["issues_found"] = [
                str(issue) for issue in issues if issue is not None
            ]
        elif isinstance(issues, str):
            cleaned["issues_found"] = [issues] if issues.strip() else []
        else:
            cleaned["issues_found"] = []
    else:
        cleaned["issues_found"] = []

    # Add any other fields that weren't processed
    for key, value in data.items():
        if key not in cleaned:
            cleaned[key] = value

    return cleaned


def extract_json_object(text: str) -> Optional[str]:
    """Extract a JSON object from text robustly.

    Handles markdown code fences, prose before/after JSON, and nested braces
    by finding the first balanced JSON object.
    """
    import re

    # Strip markdown code fences
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```\s*$", "", cleaned, flags=re.MULTILINE)
    cleaned = cleaned.strip()

    # Try direct parse first
    try:
        json.loads(cleaned)
        return cleaned
    except json.JSONDecodeError:
        pass

    # Find first balanced JSON object using bracket counting
    depth = 0
    start = None
    for i, ch in enumerate(cleaned):
        if ch == "{":
            if start is None:
                start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and start is not None:
                candidate = cleaned[start : i + 1]
                try:
                    json.loads(candidate)
                    return candidate
                except json.JSONDecodeError:
                    start = None
    return None


def _normalize_exercise_type(exercise_type: str) -> str:
    """Normalize exercise type to singular form for validation model matching."""
    type_mapping = {
        "conversations": "conversation",
        "conversation": "conversation",
        "pairs": "pair",
        "pair": "pair",
        "translations": "translation",
        "translation": "translation",
        "fill_in_blank": "fill_in_blank",
    }
    return type_mapping.get(exercise_type.lower().strip(), exercise_type.lower().strip())


def parse_validation_result(response_text: str, exercise_type: str) -> ValidationResult:
    """Parse validation response into appropriate model."""
    normalized_type = _normalize_exercise_type(exercise_type)
    try:
        json_str = extract_json_object(response_text)
        if json_str is None:
            raise ValueError("No JSON object found in response")

        data = json.loads(json_str)

        # Clean the data to handle null values and type issues
        cleaned_data = clean_validation_data(data)

        # Return appropriate validation model based on normalized type
        if normalized_type == "conversation":
            return ConversationValidation(**cleaned_data)
        elif normalized_type == "pair":
            return PairValidation(**cleaned_data)
        elif normalized_type == "translation":
            return TranslationValidation(**cleaned_data)
        elif normalized_type == "fill_in_blank":
            return FillInBlankValidation(**cleaned_data)
        else:
            return ValidationResult(**cleaned_data)

    except Exception as e:
        error_msg = f"Error parsing validation result: {e}"
        print(error_msg)
        print(f"Exercise type: {exercise_type} (normalized: {normalized_type})")
        print(f"Raw response length: {len(response_text)} characters")
        print(f"Raw response: {response_text!r}")

        # Return a default "failed" validation
        return ValidationResult(
            is_correct_language=False,
            has_correct_grammar=False,
            is_translation_accurate=False,
            is_culturally_appropriate=False,
            is_educational_quality=False,
            overall_quality_score=1,
            issues_found=[f"Failed to parse validation response: {str(e)}"],
        )
