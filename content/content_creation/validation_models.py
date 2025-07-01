# -*- coding: utf-8 -*-
"""
Validation models and schemas for database exercise validation.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import json


class ValidationResult(BaseModel):
    """Schema for validation responses from the LLM."""
    is_correct_language: bool = Field(description="Is the text in the specified language?")
    has_correct_grammar: bool = Field(description="Is the grammar correct?")
    is_translation_accurate: bool = Field(description="Is the translation accurate? (N/A for non-translation exercises)")
    is_culturally_appropriate: bool = Field(description="Is the content culturally appropriate?")
    is_educational_quality: bool = Field(description="Is this of good educational quality for language learning?")
    overall_quality_score: int = Field(description="Overall quality score from 1-10", ge=1, le=10)
    issues_found: List[str] = Field(description="List of specific issues found", default_factory=list)


class ConversationValidation(ValidationResult):
    """Extended validation for conversation exercises."""
    has_natural_dialogue: bool = Field(description="Does the conversation flow naturally?")
    appropriate_for_level: bool = Field(description="Is the difficulty appropriate for the specified level?")


class PairValidation(ValidationResult):
    """Extended validation for word pair exercises."""
    translation_pairs_correct: bool = Field(description="Are all translation pairs accurate?")
    appropriate_vocabulary_level: bool = Field(description="Is vocabulary appropriate for the level?")


class TranslationValidation(ValidationResult):
    """Extended validation for translation exercises."""
    preserves_meaning: bool = Field(description="Does the translation preserve the original meaning?")
    uses_natural_language: bool = Field(description="Does the translation use natural, idiomatic language?")


def get_validation_schema(exercise_type: str) -> str:
    """Get JSON schema for validation based on exercise type."""
    schemas = {
        "conversation": ConversationValidation.model_json_schema(),
        "pair": PairValidation.model_json_schema(),
        "translation": TranslationValidation.model_json_schema(),
    }
    
    return json.dumps(schemas.get(exercise_type, ValidationResult.model_json_schema()))


def parse_validation_result(response_text: str, exercise_type: str) -> ValidationResult:
    """Parse validation response into appropriate model."""
    try:
        # Extract JSON from response if needed
        import re
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
        else:
            json_str = response_text
            
        data = json.loads(json_str)
        
        # Return appropriate validation model based on type
        if exercise_type == "conversation":
            return ConversationValidation(**data)
        elif exercise_type == "pair":
            return PairValidation(**data)
        elif exercise_type == "translation":
            return TranslationValidation(**data)
        else:
            return ValidationResult(**data)
            
    except Exception as e:
        print(f"Error parsing validation result: {e}")
        # Return a default "failed" validation
        return ValidationResult(
            is_correct_language=False,
            has_correct_grammar=False,
            is_translation_accurate=False,
            is_culturally_appropriate=False,
            is_educational_quality=False,
            overall_quality_score=1,
            issues_found=[f"Failed to parse validation response: {str(e)}"]
        )