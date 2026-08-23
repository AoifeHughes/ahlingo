# -*- coding: utf-8 -*-
"""
Pydantic models for structured lesson generation.

These models double as the JSON schemas handed to the LLM via tool-calling
(see `generation.core.llm_client.LLMClient.generate`), so field descriptions
and constraints here directly shape what the model is asked to produce.
"""

from typing import List, Type

from pydantic import BaseModel, ConfigDict, Field, create_model, field_validator, model_validator


class ConversationTurn(BaseModel):
    """A single turn in a conversation exercise."""

    model_config = ConfigDict(populate_by_name=True)

    speaker: str = Field(..., description="Name of the speaker")
    message: str = Field(..., description="The spoken message", alias="dialogue")

    @field_validator("speaker", "message")
    @classmethod
    def not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Speaker/message cannot be empty")
        return v.strip()


class ConversationExercise(BaseModel):
    """A complete conversation exercise with summary."""

    model_config = ConfigDict(populate_by_name=True)

    conversation: List[ConversationTurn] = Field(
        ..., description="List of conversation turns", min_length=2, max_length=8
    )
    conversation_summary: str = Field(
        ..., description="Summary of the conversation", alias="summary"
    )

    @field_validator("conversation")
    @classmethod
    def validate_conversation_quality(cls, v):
        if len(v) < 2:
            raise ValueError("Conversation must have at least 2 turns")

        messages = [turn.message for turn in v]
        unique_messages = set(messages)
        if len(unique_messages) < len(messages) * 0.7:  # Less than 70% unique
            raise ValueError("Conversation is too repetitive")

        return v

    @field_validator("conversation_summary")
    @classmethod
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

    @field_validator("sentence")
    @classmethod
    def validate_sentence_blank(cls, v):
        if not v or not v.strip():
            raise ValueError("Sentence cannot be empty")

        blank_count = v.count("_")
        if blank_count != 1:
            raise ValueError(
                f"Sentence must contain exactly one blank (_), found {blank_count}"
            )

        word_count = len(v.replace("_", "word").split())
        if word_count < 2 or word_count > 25:
            raise ValueError(f"Sentence length should be 2-25 words, got {word_count}")

        return v.strip()

    @field_validator("correct_answer", "incorrect_1", "incorrect_2")
    @classmethod
    def answer_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Answer options cannot be empty")

        word_count = len(v.strip().split())
        if word_count > 3:
            raise ValueError(
                f'Answer options should be at most 3 words, got {word_count} words: "{v}"'
            )

        return v.strip()

    @field_validator("translation")
    @classmethod
    def translation_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Translation cannot be empty")
        return v.strip()

    @model_validator(mode="after")
    def validate_blank_position_and_uniqueness(self):
        if self.blank_position < 0:
            raise ValueError("Blank position must be non-negative")

        estimated_word_count = self.sentence.count(" ") + 1
        if self.blank_position >= estimated_word_count + 2:  # allow some buffer
            raise ValueError(
                f"Blank position {self.blank_position} seems out of range for "
                f"sentence with ~{estimated_word_count} words"
            )

        answers = [self.correct_answer, self.incorrect_1, self.incorrect_2]
        if len(set(answers)) != len(answers):
            raise ValueError("Answer options must be unique")

        return self


def _bounded_text_validator(max_words: int = 10):
    """Build a reusable field_validator classmethod enforcing non-empty, bounded text."""

    def _check(cls, v):
        if not v or not v.strip():
            raise ValueError("Value cannot be empty")
        if len(v.split()) > max_words:
            raise ValueError(f"Should not exceed {max_words} words")
        return v.strip()

    return _check


def create_pair_model(language: str) -> Type[BaseModel]:
    """Create a Pydantic model for an English/target-language word pair.

    Uses `pydantic.create_model` (no string interpolation / `exec`), so it is
    safe for arbitrary language names.
    """
    validators = {
        "_check_pair_fields": field_validator("English", language)(
            _bounded_text_validator(max_words=10)
        )
    }
    return create_model(
        f"{language}Pair",
        __config__=ConfigDict(populate_by_name=True),
        __validators__=validators,
        **{
            "English": (str, Field(..., description="English word or phrase")),
            language: (str, Field(..., description=f"{language} translation")),
        },
    )


def create_pair_list_model(language: str) -> Type[BaseModel]:
    """A batch of 5-7 word pairs, wrapped in an object (required for tool-call args)."""
    PairModel = create_pair_model(language)
    return create_model(
        f"{language}PairList",
        exercises=(
            List[PairModel],
            Field(..., description="List of word pairs", min_length=5, max_length=7),
        ),
    )


def create_translation_pair_model(language: str) -> Type[BaseModel]:
    """Create a Pydantic model for an English/target-language sentence pair."""

    def _not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Sentence cannot be empty")
        return v.strip()

    validators = {
        "_check_translation_fields": field_validator("English", language)(_not_empty)
    }
    return create_model(
        f"{language}TranslationPair",
        __config__=ConfigDict(populate_by_name=True),
        __validators__=validators,
        **{
            "English": (str, Field(..., description="English sentence")),
            language: (str, Field(..., description=f"{language} translation")),
        },
    )


class ImageDescriptor(BaseModel):
    """A descriptor set for an image exercise."""

    correct_descriptor: str = Field(
        ..., description="Correct description of the image in the target language"
    )
    incorrect_1: str = Field(
        ..., description="Clearly wrong description 1 in the target language"
    )
    incorrect_2: str = Field(
        ..., description="Clearly wrong description 2 in the target language"
    )
    english_meaning: str = Field(
        ..., description="English translation of the correct descriptor"
    )

    @field_validator("correct_descriptor", "incorrect_1", "incorrect_2", "english_meaning")
    @classmethod
    def not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Descriptor values cannot be empty")
        return v.strip()

    @model_validator(mode="after")
    def validate_unique_descriptors(self):
        descriptors = [self.correct_descriptor, self.incorrect_1, self.incorrect_2]
        if len(set(d.lower() for d in descriptors)) != 3:
            raise ValueError("All three descriptors must be different from each other")
        return self


class ImagePrompt(BaseModel):
    """A single image prompt for clip-art generation."""

    prompt: str = Field(
        ..., description="English description of the scene for clip-art generation"
    )
    topic: str = Field(..., description="The topic this image belongs to")

    @field_validator("prompt")
    @classmethod
    def prompt_valid(cls, v):
        if not v or not v.strip():
            raise ValueError("Image prompt cannot be empty")
        word_count = len(v.strip().split())
        if word_count < 3 or word_count > 20:
            raise ValueError(f"Image prompt should be 3-20 words, got {word_count}")
        return v.strip()


class ImagePromptList(BaseModel):
    """A list of image prompts for a topic."""

    prompts: List[ImagePrompt] = Field(
        ..., description="List of image prompts", min_length=5, max_length=15
    )
