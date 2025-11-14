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

    def is_too_similar(self, new_exercise: Dict[str, Any], existing_exercises: List[Dict[str, Any]], threshold: float = 0.6) -> Tuple[bool, str]:
        """
        Check if new exercise is too similar to existing exercises.

        Args:
            new_exercise: The newly generated exercise
            existing_exercises: List of existing exercises to compare against
            threshold: Similarity threshold (0.0-1.0), default 0.6

        Returns:
            Tuple of (is_too_similar, reason)
        """
        # Default implementation: no similarity checking
        # Override in subclasses for specific exercise types
        return False, ""

    def _calculate_word_overlap(self, text1: str, text2: str) -> float:
        """Calculate word overlap between two texts.

        Args:
            text1: First text
            text2: Second text

        Returns:
            Overlap ratio (0.0-1.0)
        """
        if not text1 or not text2:
            return 0.0

        # Normalize and split into words
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())

        if not words1 or not words2:
            return 0.0

        # Calculate Jaccard similarity
        intersection = len(words1 & words2)
        union = len(words1 | words2)

        return intersection / union if union > 0 else 0.0


class ConversationConverter(ExerciseConverter):
    """Converter for conversation exercises."""

    def is_too_similar(self, new_exercise: Dict[str, Any], existing_exercises: List[Dict[str, Any]], threshold: float = 0.6) -> Tuple[bool, str]:
        """Check if conversation exercise is too similar to existing ones."""
        new_summary = new_exercise.get("conversation_summary", new_exercise.get("summary", ""))

        for existing in existing_exercises:
            existing_summary = existing.get("conversation_summary", existing.get("summary", ""))

            # Check for exact match
            if new_summary.lower() == existing_summary.lower():
                return True, f"Exact duplicate summary"

            # Check word overlap
            overlap = self._calculate_word_overlap(new_summary, existing_summary)
            if overlap >= threshold:
                return True, f"Too similar to existing conversation (overlap: {overlap:.2%})"

        return False, ""

    def convert_to_text(self, exercise_data: Dict[str, Any]) -> str:
        """Convert conversation exercise to readable dialogue format."""
        # Handle both "conversation" and "conversations" field names
        conversations = exercise_data.get("conversation", exercise_data.get("conversations", []))
        # Handle both "summary" and "conversation_summary" field names
        summary = exercise_data.get("conversation_summary", exercise_data.get("summary", ""))

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
                speaker = turn.get("speaker", "Unknown")
                message = turn.get("message", "")
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

Please evaluate the following aspects and respond with ONLY a JSON object using exactly these field names with true/false values:

{{
  "is_correct_language": true or false (Is all the {self.language} text actually in {self.language}?),
  "has_correct_grammar": true or false (Is the {self.language} grammar correct?),
  "is_translation_accurate": true (N/A for conversations - always set to true),
  "is_culturally_appropriate": true or false (Is the content culturally appropriate?),
  "has_natural_dialogue": true or false (Does the conversation flow naturally between speakers?),
  "appropriate_for_level": true or false (Is the difficulty appropriate for {self.level} learners?),
  "is_educational_quality": true or false (Is this good quality for language learning?),
  "overall_quality_score": integer from 1 to 10 (10 = excellent),
  "issues_found": ["list", "of", "specific", "problems", "found"] or [] if none
}}

CRITICAL: Use only true/false (not True/False or null). Return only the JSON object, no other text."""


class PairConverter(ExerciseConverter):
    """Converter for word pair exercises."""

    def is_too_similar(self, new_exercise: Dict[str, Any], existing_exercises: List[Dict[str, Any]], threshold: float = 0.6) -> Tuple[bool, str]:
        """Check if pair exercise is too similar to existing ones."""
        import json

        new_pairs = new_exercise.get("word_pairs", new_exercise.get("pairs", []))
        if isinstance(new_pairs, str):
            try:
                new_pairs = json.loads(new_pairs)
            except:
                new_pairs = []

        for existing in existing_exercises:
            existing_pairs = existing.get("word_pairs", existing.get("pairs", []))
            if isinstance(existing_pairs, str):
                try:
                    existing_pairs = json.loads(existing_pairs)
                except:
                    existing_pairs = []

            # Check for significant overlap in word pairs
            if len(new_pairs) >= 3 and len(existing_pairs) >= 3:
                # Count how many pairs match
                new_words = set()
                existing_words = set()

                for pair in new_pairs:
                    if isinstance(pair, dict):
                        # Add both English and target language words
                        for val in pair.values():
                            if isinstance(val, str):
                                new_words.add(val.lower())

                for pair in existing_pairs:
                    if isinstance(pair, dict):
                        for val in pair.values():
                            if isinstance(val, str):
                                existing_words.add(val.lower())

                if new_words and existing_words:
                    overlap = len(new_words & existing_words) / len(new_words | existing_words)
                    if overlap >= threshold:
                        return True, f"Too similar vocabulary (overlap: {overlap:.2%})"

        return False, ""

    def convert_to_text(self, exercise_data: Dict[str, Any]) -> str:
        """Convert word pair exercise to readable format."""
        pairs = exercise_data.get("pairs", [])

        # Parse pairs if they're stored as JSON string
        if isinstance(pairs, str):
            try:
                pairs = json.loads(pairs)
            except json.JSONDecodeError:
                pairs = []

        text_parts = ["=== WORD PAIRS ==="]

        for i, pair in enumerate(pairs, 1):
            if isinstance(pair, dict):
                english = pair.get("English", "")
                target = pair.get(self.language, "")
                text_parts.append(f"{i}. {english} → {target}")
            else:
                text_parts.append(f"{i}. {pair}")

        return "\n".join(text_parts)

    def get_validation_prompt(self, exercise_text: str) -> str:
        """Generate validation prompt for word pair exercises."""
        return f"""You are a language learning expert. Please validate these {self.language} word pairs for {self.level} level learners.

EXERCISE TO VALIDATE:
{exercise_text}

Please evaluate the following aspects and respond with ONLY a JSON object using exactly these field names with true/false values:

{{
  "is_correct_language": true or false (Is all the {self.language} text actually in {self.language}?),
  "has_correct_grammar": true or false (Are the {self.language} words/phrases grammatically correct?),
  "translation_pairs_correct": true or false (Are all English-{self.language} pairs accurate translations?),
  "is_culturally_appropriate": true or false (Is the vocabulary culturally appropriate?),
  "appropriate_vocabulary_level": true or false (Is the vocabulary appropriate for {self.level} learners?),
  "is_educational_quality": true or false (Are these useful for language learning?),
  "is_translation_accurate": true or false (Same as translation_pairs_correct),
  "overall_quality_score": integer from 1 to 10 (10 = excellent),
  "issues_found": ["list", "of", "specific", "problems", "found"] or [] if none
}}

CRITICAL: Use only true/false (not True/False or null). Return only the JSON object, no other text."""


class TranslationConverter(ExerciseConverter):
    """Converter for translation exercises."""

    def is_too_similar(self, new_exercise: Dict[str, Any], existing_exercises: List[Dict[str, Any]], threshold: float = 0.6) -> Tuple[bool, str]:
        """Check if translation exercise is too similar to existing ones."""
        new_lang1 = new_exercise.get("language_1_content", "")
        new_lang2 = new_exercise.get("language_2_content", "")

        for existing in existing_exercises:
            existing_lang1 = existing.get("language_1_content", "")
            existing_lang2 = existing.get("language_2_content", "")

            # Check for exact match on either language
            if (new_lang1.lower() == existing_lang1.lower() or
                new_lang2.lower() == existing_lang2.lower()):
                return True, f"Exact duplicate content"

            # Check word overlap on primary language content
            overlap = self._calculate_word_overlap(new_lang1, existing_lang1)
            if overlap >= threshold:
                return True, f"Too similar to existing translation (overlap: {overlap:.2%})"

        return False, ""

    def convert_to_text(self, exercise_data: Dict[str, Any]) -> str:
        """Convert translation exercise to readable format."""
        language_1_content = exercise_data.get("language_1_content", "")
        language_2_content = exercise_data.get("language_2_content", "")
        language_1 = exercise_data.get("language_1", "English")
        language_2 = exercise_data.get("language_2", self.language)

        text_parts = ["=== TRANSLATION EXERCISE ==="]
        text_parts.append(f"{language_1}: {language_1_content}")
        text_parts.append(f"{language_2}: {language_2_content}")

        return "\n".join(text_parts)

    def get_validation_prompt(self, exercise_text: str) -> str:
        """Generate validation prompt for translation exercises."""
        return f"""You are a language learning expert. Please validate this translation exercise for {self.level} level learners.

EXERCISE TO VALIDATE:
{exercise_text}

Please evaluate the following aspects and respond with ONLY a JSON object using exactly these field names with true/false values:

{{
  "is_correct_language": true or false (Is the {self.language} text actually in {self.language}?),
  "has_correct_grammar": true or false (Is the {self.language} grammar correct?),
  "is_translation_accurate": true or false (Is the translation between English and {self.language} accurate?),
  "preserves_meaning": true or false (Does the translation preserve the original meaning?),
  "uses_natural_language": true or false (Does the {self.language} translation sound natural and idiomatic?),
  "is_culturally_appropriate": true or false (Is the content culturally appropriate?),
  "is_educational_quality": true or false (Is this useful for language learning?),
  "overall_quality_score": integer from 1 to 10 (10 = excellent),
  "issues_found": ["list", "of", "specific", "problems", "found"] or [] if none
}}

CRITICAL: Use only true/false (not True/False or null). Return only the JSON object, no other text."""


class FillInBlankConverter(ExerciseConverter):
    """Converter for fill-in-blank exercises."""

    def validate_translation(self, translation: str) -> Tuple[bool, str]:
        """
        Validate that the translation doesn't contain blanks.

        Returns:
            Tuple of (is_valid, error_message)
        """
        if '_' in translation:
            return False, "Translation contains blanks or underscores - must be a complete sentence"
        return True, ""

    def is_too_similar(self, new_exercise: Dict[str, Any], existing_exercises: List[Dict[str, Any]], threshold: float = 0.6) -> Tuple[bool, str]:
        """Check if fill-in-blank exercise is too similar to existing ones."""
        new_sentence = new_exercise.get("sentence", "")

        for existing in existing_exercises:
            existing_sentence = existing.get("sentence", "")

            # Check for exact match
            if new_sentence.lower() == existing_sentence.lower():
                return True, f"Exact duplicate sentence: '{new_sentence}'"

            # Check word overlap
            overlap = self._calculate_word_overlap(new_sentence, existing_sentence)
            if overlap >= threshold:
                return True, f"Too similar to existing sentence (overlap: {overlap:.2%})"

        return False, ""

    def convert_to_text(self, exercise_data: Dict[str, Any]) -> str:
        """Convert fill-in-blank exercise to readable format."""
        sentence = exercise_data.get("sentence", "")
        correct_answer = exercise_data.get("correct_answer", "")
        incorrect_1 = exercise_data.get("incorrect_1", "")
        incorrect_2 = exercise_data.get("incorrect_2", "")
        translation = exercise_data.get("translation", "")
        blank_position = exercise_data.get("blank_position", 0)

        text_parts = ["=== FILL-IN-BLANK EXERCISE ==="]
        text_parts.append(f"Sentence: {sentence}")
        text_parts.append(f"Correct Answer: {correct_answer}")
        text_parts.append(f"Incorrect Option 1: {incorrect_1}")
        text_parts.append(f"Incorrect Option 2: {incorrect_2}")
        text_parts.append(f"Blank Position: {blank_position}")
        text_parts.append(f"English Translation: {translation}")

        return "\n".join(text_parts)

    def get_validation_prompt(self, exercise_text: str) -> str:
        """Generate validation prompt for fill-in-blank exercises."""
        return f"""You are a language learning expert. Please validate this {self.language} fill-in-blank exercise for {self.level} level learners.

EXERCISE TO VALIDATE:
{exercise_text}

Please evaluate the following aspects and respond with ONLY a JSON object using exactly these field names with true/false values:

{{
  "is_correct_language": true or false (Is the {self.language} text actually in {self.language}?),
  "has_correct_grammar": true or false (Is the {self.language} grammar correct?),
  "is_translation_accurate": true or false (Does the English translation accurately convey the meaning?),
  "translation_matches_original": true or false (Does the English translation match the meaning of the complete {self.language} sentence?),
  "translation_has_no_blanks": true or false (CRITICAL - Does the English translation contain NO blanks or underscores? It must be a complete sentence),
  "answer_options_appropriate": true or false (Are the answer options appropriate and at the right difficulty level?),
  "is_unambiguous": true or false (CRITICAL - Is there only ONE clearly correct answer? Check if multiple options could work),
  "is_culturally_appropriate": true or false (Is the content culturally appropriate?),
  "is_educational_quality": true or false (Is this useful for language learning?),
  "overall_quality_score": integer from 1 to 10 (10 = excellent, MAXIMUM 5 for ambiguous exercises - if is_unambiguous is false, score MUST be ≤5),
  "issues_found": ["list", "of", "specific", "problems", "found"] or [] if none
}}

AMBIGUITY CHECK: If you can imagine a scenario where multiple answer options could reasonably fit in the sentence, mark is_unambiguous as false and explain why in issues_found.

CRITICAL: Use only true/false (not True/False or null). Return only the JSON object, no other text."""


def get_converter(exercise_type: str, language: str, level: str) -> ExerciseConverter:
    """Factory function to get appropriate converter for exercise type."""
    converters = {
        "conversation": ConversationConverter,
        "conversations": ConversationConverter,  # Support plural form
        "pair": PairConverter,
        "pairs": PairConverter,  # Support plural form
        "translation": TranslationConverter,
        "translations": TranslationConverter,  # Support plural form
        "fill_in_blank": FillInBlankConverter,
    }

    converter_class = converters.get(exercise_type.lower())
    if not converter_class:
        raise ValueError(f"Unknown exercise type: {exercise_type}")

    return converter_class(language, level)


def identify_exercise_type(exercise_data: Dict[str, Any]) -> str:
    """Identify exercise type from database row data."""
    # Check for conversation-specific fields
    if "conversations" in exercise_data or "summary" in exercise_data:
        return "conversation"

    # Check for pair-specific fields
    if "pairs" in exercise_data:
        return "pair"

    # Check for translation-specific fields
    if "language_1_content" in exercise_data and "language_2_content" in exercise_data:
        return "translation"

    # Check for fill-in-blank specific fields
    if any(
        key in exercise_data
        for key in [
            "sentence",
            "correct_answer",
            "incorrect_1",
            "incorrect_2",
            "blank_position",
        ]
    ):
        return "fill_in_blank"

    # Fallback: try to infer from other clues
    if any(key in exercise_data for key in ["speaker", "message"]):
        return "conversation"

    # Default to translation if unclear
    return "translation"
