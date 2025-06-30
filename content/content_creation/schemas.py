# -*- coding: utf-8 -*-
from pydantic import BaseModel, create_model
from typing import List

class ConversationMessage(BaseModel):
    """Represents a single message in a conversation."""
    speaker: str
    message: str

class ConversationExercise(BaseModel):
    """Represents a conversation exercise with multiple messages and a summary."""
    conversation: List[ConversationMessage]
    conversation_summary: str

class ConversationExercises(BaseModel):
    """Root model for a list of conversation exercises."""
    exercises: List[ConversationExercise]

def create_language_pair_model(language: str):
    """Create a Pydantic model for language pairs with the specified target language."""
    fields = {
        'English': (str, ...),
        language: (str, ...)
    }
    PairModel = create_model('LanguagePair', **fields)
    
    # Create a root model that contains the list
    class LanguagePairExercises(BaseModel):
        exercises: List[PairModel]
    
    return LanguagePairExercises

def create_translation_pair_model(language: str):
    """Create a Pydantic model for translation pairs with the specified target language."""
    fields = {
        'English': (str, ...),
        language: (str, ...)
    }
    TranslationModel = create_model('TranslationPair', **fields)
    
    # Create a root model that contains the list
    class TranslationPairExercises(BaseModel):
        exercises: List[TranslationModel]
    
    return TranslationPairExercises