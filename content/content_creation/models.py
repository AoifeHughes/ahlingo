# -*- coding: utf-8 -*-
"""
Pydantic models for structured lesson generation using Outlines.
"""

from pydantic import BaseModel, Field
from typing import List


class ConversationTurn(BaseModel):
    """A single turn in a conversation exercise."""

    speaker: str = Field(..., description="Name of the speaker")
    message: str = Field(..., description="The spoken message")


class ConversationExercise(BaseModel):
    """A complete conversation exercise with summary."""

    conversation: List[ConversationTurn] = Field(
        ..., description="List of conversation turns"
    )
    conversation_summary: str = Field(..., description="Summary of the conversation")


class FillInBlankExercise(BaseModel):
    """A fill-in-blank exercise with correct and incorrect options."""

    sentence: str = Field(..., description="Sentence with one blank (_)")
    correct_answer: str = Field(..., description="The correct word for the blank")
    incorrect_1: str = Field(..., description="First incorrect option")
    incorrect_2: str = Field(..., description="Second incorrect option")
    blank_position: int = Field(..., description="Position of the blank in the sentence (0-indexed)")
    translation: str = Field(..., description="Complete English sentence translation")


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
