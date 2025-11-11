# Outlines Integration for Structured Lesson Generation

This document describes the Outlines integration that provides structured, reliable lesson generation for the Ahlingo language learning platform.

## Overview

The lesson generation system has been enhanced with [Outlines](https://outlines-dev.github.io/outlines/), a Python library that ensures structured output from language models. This integration guarantees valid JSON responses and eliminates parsing errors while maintaining the quality of the original lesson examples.

## Architecture

### Core Components

1. **`models.py`** - Pydantic data models for type safety
2. **`outlines_generator.py`** - Structured generation with Outlines
3. **`generate_lessons.py`** - Main database population functions
4. **`assistants.py`** - High-quality example data (unchanged)

### Data Flow

```
Input: Language, Level, Topic
    ↓
Setup Outlines Model (qwen/qwen3-4b)
    ↓
Load Assistant Examples (from assistants.py)
    ↓
Generate Structured JSON (conversations/pairs/translations)
    ↓
Store in Database (using existing schema)
```

## Key Features

### ✅ **Structured Generation**
- **Guaranteed valid JSON** - No more parsing errors
- **Type-safe data models** using Pydantic
- **Schema validation** ensures consistent structure

### ✅ **Quality Assurance**
- **Proven examples** from `assistants.py` guide generation
- **Anti-repetition measures** prevent conversation loops
- **Progressive conversations** with natural topic development

### ✅ **Performance Optimized**
- **Model reuse** across all generations
- **Async-safe** with proper cleanup
- **Clean console output** with progress tracking

## Usage

### Basic Usage

```python
from content_creation.generate_lessons import populate_database

# Generate all lessons using Outlines (default method)
populate_database()
```

### Advanced Usage

```python
from content_creation.outlines_generator import generate_lessons_data_structured
from content_creation.generate_lessons import populate_database_legacy

# Generate specific lessons
for lesson_kind, lesson_id, json_response in generate_lessons_data_structured(
    language="French",
    level="beginner",
    topic="food"
):
    print(f"Generated {lesson_kind}: {len(json.loads(json_response))} exercises")

# Use legacy method if needed
populate_database_legacy()
```

### Testing

```python
# Test single generation
python test_single_generation.py

# Run comprehensive demo
python demo_outlines.py
```

## Configuration Files

The system reads from three configuration files:

- **`generation_data/languages.txt`** - Supported languages
- **`generation_data/levels.txt`** - Difficulty levels  
- **`generation_data/topics.txt`** - Learning topics

## Exercise Types

### 1. Conversations
- **Structure**: Array of conversation exercises
- **Content**: Speaker/message pairs with summaries
- **Quality**: Progressive conversations that develop naturally
- **Example**:
```json
{
  "conversation": [
    {"speaker": "Marie", "message": "Bonjour! Comment tu t'appelles?"},
    {"speaker": "Jean", "message": "Je m'appelle Jean. Je suis étudiant."},
    {"speaker": "Marie", "message": "Enchantée! Moi, je travaille ici."}
  ],
  "conversation_summary": "Introduction between Marie and Jean, sharing names and occupations."
}
```

### 2. Word Pairs
- **Structure**: English-target language word pairs
- **Content**: Single words with direct translations
- **Quality**: Varied vocabulary covering different word types
- **Example**:
```json
{"English": "apple", "French": "pomme"}
```

### 3. Sentence Translations
- **Structure**: English-target language sentence pairs
- **Content**: Full sentences demonstrating grammar patterns
- **Quality**: Mix of statements, questions, and commands
- **Example**:
```json
{"English": "How are you today?", "French": "Comment allez-vous aujourd'hui?"}
```

## Database Schema

The integration maintains full compatibility with the existing database schema:

- **`exercises_info`** - Exercise metadata
- **`conversation_exercises`** - Conversation turns
- **`conversation_summaries`** - Conversation summaries
- **`pair_exercises`** - Word pairs
- **`translation_exercises`** - Sentence translations

## Migration Guide

### From Legacy to Outlines

The migration is already complete! The default `populate_database()` function now uses Outlines.

**What Changed:**
- ✅ `populate_database()` now uses Outlines by default
- ✅ `populate_database_legacy()` preserves original method
- ✅ Same database schema and API
- ✅ Improved quality and reliability

**What Stayed the Same:**
- ✅ Database structure unchanged
- ✅ Configuration files unchanged
- ✅ Assistant examples preserved
- ✅ All existing functionality maintained

## Troubleshooting

### Common Issues

1. **Model Not Found**
   ```
   Error: Model 'qwen/qwen3-4b' not found
   ```
   **Solution**: Ensure Ollama is running with the correct model:
   ```bash
   ollama pull qwen:3-4b
   ollama serve
   ```

2. **Connection Refused**
   ```
   Error: Connection refused to localhost:11434
   ```
   **Solution**: Start Ollama server:
   ```bash
   ollama serve
   ```

3. **Async Event Loop Warnings**
   ```
   RuntimeWarning: Event loop is closed
   ```
   **Solution**: These warnings are harmless and automatically suppressed.

### Performance Tips

1. **Reuse Models**: The system automatically reuses models for better performance
2. **Monitor Progress**: Use the progress bar to track generation status
3. **Batch Processing**: The system processes all combinations efficiently

### Quality Assurance

1. **Check Results**: Use demo scripts to verify output quality
2. **Database Inspection**: Query the database to review generated content
3. **Error Handling**: All errors are logged with detailed information

## Model Requirements

### Supported Models
- **Primary**: `qwen/qwen3-4b` (recommended)
- **Fallback**: Any OpenAI-compatible model via Ollama

### Server Requirements
- **Ollama server** running on `localhost:11434`
- **Sufficient memory** for the chosen model
- **Stable network connection** for model downloads

## Examples and Testing

### Quick Test
```python
from content_creation.outlines_generator import setup_outlines_model, generate_conversations

model = setup_outlines_model()
conversations = generate_conversations(model, "French", "beginner", "food")
print(f"Generated {len(conversations)} conversations")
```

### Quality Check
```python
# Check for conversation progression (no repetition)
conv = conversations[0]['conversation']
speakers = [turn['speaker'] for turn in conv]
messages = [turn['message'] for turn in conv]

# Verify no repeated messages
assert len(set(messages)) == len(messages), "Found repeated messages!"
print("✅ No repetition detected")
```

## Benefits

### Reliability
- **100% valid JSON** - No parsing failures
- **Consistent structure** - Schema validation
- **Error recovery** - Graceful handling of issues

### Quality  
- **Natural conversations** - No repetitive loops
- **Varied content** - Uses proven examples
- **Progressive development** - Conversations that evolve

### Performance
- **Faster generation** - No retry loops
- **Better resource usage** - Model reuse
- **Clean output** - Minimal console spam

## Future Enhancements

Potential improvements for future versions:

1. **Custom Schemas** - Support for new exercise types
2. **Multi-model Support** - Integration with different LLMs
3. **Quality Metrics** - Automated quality assessment
4. **Parallel Generation** - Concurrent processing
5. **Fine-tuning** - Custom model training

## Support

For issues or questions:

1. **Check existing conversations** in the database for quality
2. **Run test scripts** to verify functionality  
3. **Review logs** for error details
4. **Test with single combinations** before full generation

---

*Last updated: January 2025*
*Integration version: 1.0*
