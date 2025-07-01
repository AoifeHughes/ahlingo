# -*- coding: utf-8 -*-
"""
Exercise converters to transform database exercises into text for validation.
"""

from typing import Dict, List, Any, Tuple
import json


class ExerciseConverter:
    """Base class for converting exercises to validation text."""
    
    def __init__(self, language: str, level: str):
        self.language = language
        self.level = level
    
    def convert_to_text(self, exercise_data: Dict[str, Any]) -> str:
        """Convert exercise data to readable text for validation."""
        raise NotImplementedError
    
    def get_validation_prompt(self, exercise_text: str) -> str:
        """Generate validation prompt for the LLM."""
        raise NotImplementedError


class ConversationConverter(ExerciseConverter):
    """Converter for conversation exercises."""
    
    def convert_to_text(self, exercise_data: Dict[str, Any]) -> str:
        """Convert conversation exercise to readable dialogue format."""
        conversations = exercise_data.get('conversations', [])
        summary = exercise_data.get('summary', '')
        
        # Parse conversations if they're stored as JSON string
        if isinstance(conversations, str):
            try:
                conversations = json.loads(conversations)
            except json.JSONDecodeError:
                conversations = []
        
        text_parts = []
        
        # Add dialogue
        if conversations:
            text_parts.append("=== CONVERSATION ===")
            for turn in conversations:
                speaker = turn.get('speaker', 'Unknown')
                message = turn.get('message', '')
                text_parts.append(f"{speaker}: {message}")
        
        # Add summary
        if summary:
            text_parts.append(f"\n=== SUMMARY ===\n{summary}")
        
        return "\n".join(text_parts)
    
    def get_validation_prompt(self, exercise_text: str) -> str:
        """Generate validation prompt for conversation exercises."""
        return f"""You are a language learning expert. Please validate this {self.language} conversation exercise for {self.level} level learners.

EXERCISE TO VALIDATE:
{exercise_text}

Please evaluate the following aspects and respond with a JSON object:

1. is_correct_language: Is all the {self.language} text actually in {self.language}?
2. has_correct_grammar: Is the {self.language} grammar correct?
3. is_translation_accurate: N/A for conversations (set to true)
4. is_culturally_appropriate: Is the content culturally appropriate?
5. has_natural_dialogue: Does the conversation flow naturally between speakers?
6. appropriate_for_level: Is the difficulty appropriate for {self.level} learners?
7. is_educational_quality: Is this good quality for language learning?
8. overall_quality_score: Rate from 1-10 (10 = excellent)
9. issues_found: List any specific problems found

Respond only with valid JSON matching the expected schema."""


class PairConverter(ExerciseConverter):
    """Converter for word pair exercises."""
    
    def convert_to_text(self, exercise_data: Dict[str, Any]) -> str:
        """Convert word pair exercise to readable format."""
        pairs = exercise_data.get('pairs', [])
        
        # Parse pairs if they're stored as JSON string
        if isinstance(pairs, str):
            try:
                pairs = json.loads(pairs)
            except json.JSONDecodeError:
                pairs = []
        
        text_parts = ["=== WORD PAIRS ==="]
        
        for i, pair in enumerate(pairs, 1):
            if isinstance(pair, dict):
                english = pair.get('English', '')
                target = pair.get(self.language, '')
                text_parts.append(f"{i}. {english} → {target}")
            else:
                text_parts.append(f"{i}. {pair}")
        
        return "\n".join(text_parts)
    
    def get_validation_prompt(self, exercise_text: str) -> str:
        """Generate validation prompt for word pair exercises."""
        return f"""You are a language learning expert. Please validate these {self.language} word pairs for {self.level} level learners.

EXERCISE TO VALIDATE:
{exercise_text}

Please evaluate the following aspects and respond with a JSON object:

1. is_correct_language: Is all the {self.language} text actually in {self.language}?
2. has_correct_grammar: Are the {self.language} words/phrases grammatically correct?
3. translation_pairs_correct: Are all English-{self.language} pairs accurate translations?
4. is_culturally_appropriate: Is the vocabulary culturally appropriate?
5. appropriate_vocabulary_level: Is the vocabulary appropriate for {self.level} learners?
6. is_educational_quality: Are these useful for language learning?
7. overall_quality_score: Rate from 1-10 (10 = excellent)
8. issues_found: List any specific problems found
9. is_translation_accurate: Same as translation_pairs_correct

Respond only with valid JSON matching the expected schema."""


class TranslationConverter(ExerciseConverter):
    """Converter for translation exercises."""
    
    def convert_to_text(self, exercise_data: Dict[str, Any]) -> str:
        """Convert translation exercise to readable format."""
        language_1_content = exercise_data.get('language_1_content', '')
        language_2_content = exercise_data.get('language_2_content', '')
        language_1 = exercise_data.get('language_1', 'English')
        language_2 = exercise_data.get('language_2', self.language)
        
        text_parts = ["=== TRANSLATION EXERCISE ==="]
        text_parts.append(f"{language_1}: {language_1_content}")
        text_parts.append(f"{language_2}: {language_2_content}")
        
        return "\n".join(text_parts)
    
    def get_validation_prompt(self, exercise_text: str) -> str:
        """Generate validation prompt for translation exercises."""
        return f"""You are a language learning expert. Please validate this translation exercise for {self.level} level learners.

EXERCISE TO VALIDATE:
{exercise_text}

Please evaluate the following aspects and respond with a JSON object:

1. is_correct_language: Is the {self.language} text actually in {self.language}?
2. has_correct_grammar: Is the {self.language} grammar correct?
3. is_translation_accurate: Is the translation between English and {self.language} accurate?
4. preserves_meaning: Does the translation preserve the original meaning?
5. uses_natural_language: Does the {self.language} translation sound natural and idiomatic?
6. is_culturally_appropriate: Is the content culturally appropriate?
7. appropriate_for_level: Is the difficulty appropriate for {self.level} learners?
8. is_educational_quality: Is this useful for language learning?
9. overall_quality_score: Rate from 1-10 (10 = excellent)
10. issues_found: List any specific problems found

Respond only with valid JSON matching the expected schema."""


def get_converter(exercise_type: str, language: str, level: str) -> ExerciseConverter:
    """Factory function to get appropriate converter for exercise type."""
    converters = {
        'conversation': ConversationConverter,
        'pair': PairConverter,
        'translation': TranslationConverter,
    }
    
    converter_class = converters.get(exercise_type.lower())
    if not converter_class:
        raise ValueError(f"Unknown exercise type: {exercise_type}")
    
    return converter_class(language, level)


def identify_exercise_type(exercise_data: Dict[str, Any]) -> str:
    """Identify exercise type from database row data."""
    # Check for conversation-specific fields
    if 'conversations' in exercise_data or 'summary' in exercise_data:
        return 'conversation'
    
    # Check for pair-specific fields
    if 'pairs' in exercise_data:
        return 'pair'
    
    # Check for translation-specific fields
    if 'language_1_content' in exercise_data and 'language_2_content' in exercise_data:
        return 'translation'
    
    # Fallback: try to infer from other clues
    if any(key in exercise_data for key in ['speaker', 'message']):
        return 'conversation'
    
    # Default to translation if unclear
    return 'translation'