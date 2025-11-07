# -*- coding: utf-8 -*-
"""
Pydantic models for structured lesson generation using Outlines.
"""

from pydantic import BaseModel, Field, validator, ConfigDict
from typing import List, Union, Type
import re


class ConversationTurn(BaseModel):
    """A single turn in a conversation exercise."""

    model_config = ConfigDict(populate_by_name=True)

    speaker: str = Field(..., description="Name of the speaker")
    message: str = Field(..., description="The spoken message", alias="dialogue")

    @validator("speaker")
    def speaker_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Speaker name cannot be empty")
        return v.strip()

    @validator("message")
    def message_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()


class ConversationExercise(BaseModel):
    """A complete conversation exercise with summary."""

    model_config = ConfigDict(populate_by_name=True)

    conversation: List[ConversationTurn] = Field(
        ..., description="List of conversation turns", min_items=2, max_items=8
    )
    conversation_summary: str = Field(
        ..., description="Summary of the conversation", alias="summary"
    )

    @validator("conversation")
    def validate_conversation_quality(cls, v):
        if len(v) < 2:
            raise ValueError("Conversation must have at least 2 turns")

        # Check for repetitive messages
        messages = [turn.message for turn in v]
        unique_messages = set(messages)
        if len(unique_messages) < len(messages) * 0.7:  # Less than 70% unique
            raise ValueError("Conversation is too repetitive")

        return v

    @validator("conversation_summary")
    def summary_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Conversation summary cannot be empty")
        return v.strip()


class FillInBlankExercise(BaseModel):
    """A fill-in-blank exercise with correct and incorrect options."""

    sentence: str = Field(..., description="Sentence with one blank (_)")
    correct_answer: str = Field(..., description="The correct word for the blank")
    incorrect_1: str = Field(..., description="First incorrect option")
    incorrect_2: str = Field(..., description="Second incorrect option")
    blank_position: int = Field(
        ..., description="Position of the blank in the sentence (0-indexed)"
    )
    translation: str = Field(..., description="Complete English sentence translation")

    @validator("sentence")
    def validate_sentence_blank(cls, v):
        if not v or not v.strip():
            raise ValueError("Sentence cannot be empty")

        blank_count = v.count("_")
        if blank_count != 1:
            raise ValueError(
                f"Sentence must contain exactly one blank (_), found {blank_count}"
            )

        # Check reasonable sentence length (count complete sentence, not with blank)
        word_count = len(v.replace("_", "word").split())
        if word_count < 2 or word_count > 25:  # More flexible range
            raise ValueError(f"Sentence length should be 2-25 words, got {word_count}")

        return v.strip()

    @validator("correct_answer", "incorrect_1", "incorrect_2")
    def answer_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Answer options cannot be empty")

        # Allow multi-word answers for common expressions, but limit to 3 words max
        word_count = len(v.strip().split())
        if word_count > 3:
            raise ValueError(
                f'Answer options should be at most 3 words, got {word_count} words: "{v}"'
            )

        return v.strip()

    @validator("translation")
    def translation_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Translation cannot be empty")
        return v.strip()

    @validator("blank_position")
    def validate_blank_position(cls, v, values):
        if v < 0:
            raise ValueError("Blank position must be non-negative")

        # Simple validation - just check if position is within reasonable bounds
        if "sentence" in values:
            sentence = values["sentence"]
            # Count words in sentence (estimate based on spaces)
            estimated_word_count = sentence.count(" ") + 1

            # Check if position is obviously out of range
            if v >= estimated_word_count + 2:  # Allow some buffer
                raise ValueError(
                    f"Blank position {v} seems out of range for sentence with ~{estimated_word_count} words"
                )

        return v

    @validator("incorrect_2")
    def validate_unique_answers(cls, v, values):
        if "correct_answer" in values and "incorrect_1" in values:
            answers = [values["correct_answer"], values["incorrect_1"], v]
            if len(set(answers)) != len(answers):
                raise ValueError("Answer options must be unique")
        return v


class WordPair(BaseModel):
    """A word pair with English and target language."""

    english: str = Field(..., description="English word or phrase")
    target: str = Field(..., description="Target language word or phrase")

    @validator("english", "target")
    def not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Word pair values cannot be empty")
        return v.strip()

    @validator("english", "target")
    def reasonable_length(cls, v):
        if len(v.split()) > 10:
            raise ValueError("Word pairs should not exceed 10 words")
        return v


class TranslationPair(BaseModel):
    """A sentence translation pair with English and target language."""

    english: str = Field(..., description="English sentence")
    target: str = Field(..., description="Target language sentence")

    @validator("english", "target")
    def not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Translation sentences cannot be empty")
        return v.strip()

    @validator("english", "target")
    def reasonable_sentence_length(cls, v):
        word_count = len(v.split())
        if word_count < 1:
            raise ValueError("Translation sentences must have at least 1 word")
        return v


# Exercise list wrappers
class ConversationExerciseList(BaseModel):
    """A list of conversation exercises."""

    exercises: List[ConversationExercise] = Field(
        ..., description="List of conversation exercises", min_items=1, max_items=5
    )


class FillInBlankExerciseList(BaseModel):
    """A list of fill-in-blank exercises."""

    exercises: List[FillInBlankExercise] = Field(
        ..., description="List of fill-in-blank exercises", min_items=3, max_items=10
    )


class WordPairList(BaseModel):
    """A list of word pairs."""

    exercises: List[WordPair] = Field(
        ..., description="List of word pairs", min_items=5, max_items=15
    )

    @validator("exercises")
    def validate_unique_pairs(cls, v):
        english_words = [pair.english.lower() for pair in v]
        target_words = [pair.target.lower() for pair in v]

        if len(set(english_words)) != len(english_words):
            raise ValueError("Duplicate English words found")

        if len(set(target_words)) != len(target_words):
            raise ValueError("Duplicate target language words found")

        return v


class TranslationPairList(BaseModel):
    """A list of translation pairs."""

    exercises: List[TranslationPair] = Field(
        ..., description="List of translation pairs", min_items=3, max_items=10
    )


def create_pair_schema(language: str):
    """
    Create a dynamic Pydantic schema for word/sentence pairs.

    Args:
        language: Target language for the pairs (e.g., "French", "German")

    Returns:
        Pydantic model class for English-target language pairs
    """
    class_dict = {
        "English": (str, Field(..., description="English word or sentence")),
        language: (str, Field(..., description=f"{language} translation")),
    }
    return type(f"{language}Pair", (BaseModel,), class_dict)


def create_dynamic_word_pair_model(language: str) -> Type[BaseModel]:
    """
    Create a dynamic Pydantic model for word pairs in a specific language.

    Args:
        language: Target language name (e.g., "French", "German")

    Returns:
        Pydantic model class for word pairs in the specified language
    """

    # Create the dynamic model using the simpler approach
    exec(
        f"""
class {language}WordPair(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    English: str = Field(..., description="English word or phrase", alias="english")
    {language}: str = Field(..., description="{language} translation", alias="{language.lower()}")

    @validator('English')
    def english_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('English word cannot be empty')
        if len(v.split()) > 10:
            raise ValueError('English phrases should not exceed 10 words')
        return v.strip()

    @validator('{language}')
    def target_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('{language} word cannot be empty')
        if len(v.split()) > 10:
            raise ValueError('{language} phrases should not exceed 10 words')
        return v.strip()
    """
    )

    return locals()[f"{language}WordPair"]


def create_dynamic_translation_pair_model(language: str) -> Type[BaseModel]:
    """
    Create a dynamic Pydantic model for translation pairs in a specific language.

    Args:
        language: Target language name (e.g., "French", "German")

    Returns:
        Pydantic model class for translation pairs in the specified language
    """

    # Create the dynamic model using the simpler approach
    exec(
        f"""
class {language}TranslationPair(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    English: str = Field(..., description="English sentence", alias="english")
    {language}: str = Field(..., description="{language} translation", alias="{language.lower()}")

    @validator('English')
    def english_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('English sentence cannot be empty')
        if len(v.split()) < 1:
            raise ValueError('English sentences must have at least 1 word')
        return v.strip()

    @validator('{language}')
    def target_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('{language} sentence cannot be empty')
        if len(v.split()) < 1:
            raise ValueError('{language} sentences must have at least 1 word')
        return v.strip()
    """
    )

    return locals()[f"{language}TranslationPair"]
