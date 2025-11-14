# Content Generation System Migration Guide

## Overview

The content generation system has been consolidated from multiple scripts into a single unified system with integrated validation. This guide explains the changes and how to migrate.

## What Changed

### ✅ New System Features

1. **Unified Entry Point**: Single `generate_content.py` script replaces `create_exercise_database.py`
2. **Integrated Validation**: Exercises are validated immediately after generation (generate → validate → insert)
3. **JSON Configuration**: All settings in `database_generation.json` (no more .txt files)
4. **Sequential Processing**: Removed parallel workers for more reliable validation
5. **Failure Tracking**: JSON export of failures with retry capability
6. **Incremental Updates**: `--add-language`, `--add-level`, `--add-topic` flags

### ❌ Removed Files

**Scripts**:
- `content/create_exercise_database.py` → Replaced by `content/generate_content.py`
- `content/generation/core/generate_lessons.py` → Merged into `generate_content.py`

**Configuration**:
- `content/generation/config/languages.txt` → Moved to JSON
- `content/generation/config/levels.txt` → Moved to JSON
- `content/generation/config/topics.txt` → Moved to JSON

**Tests** (non-LLM):
- `content/tests/test_validation_models.py` → Removed (no LLM)
- `content/tests/test_validation_integration.py` → Removed (no LLM)
- `content/tests/test_validation_demo.py` → Removed (no LLM)

**Kept** (these remain LLM-based):
- `content/tests/test_generation_integration.py` (new comprehensive test)

### 🔧 Modified Files

**Configuration**:
- `content/generation/config/database_generation.json` (NEW)

**Core Logic**:
- `content/generation/utils/exercise_converters.py:211` - Strengthened ambiguity prompt
- `content/generation/core/outlines_generator.py` - Loads config from JSON

**Validation**:
- Validation integrated into generation pipeline (no separate run)

## Migration Steps

### 1. Update Configuration

The old text-based configuration:

```
content/generation/config/
├── languages.txt    (French, Spanish, ...)
├── levels.txt       (Beginner, Intermediate, Advanced)
└── topics.txt       (Greetings, Food, ...)
```

Is now:

```json
// content/generation/config/database_generation.json
{
  "languages": ["French", "Spanish", "German", "Ukrainian", "Italian"],
  "levels": ["beginner", "intermediate", "advanced"],
  "topics": ["Greetings and introductions", ...]
}
```

**Action**: Review `database_generation.json` and customize as needed.

### 2. Update Your Commands

**OLD** command:
```bash
python content/create_exercise_database.py \
  --db-path database/languageLearningDatabase.db \
  --languages French,Spanish \
  --levels Beginner \
  --max-workers 5
```

**NEW** command:
```bash
python content/generate_content.py \
  --db-path database/languageLearningDatabase.db \
  --languages French,Spanish \
  --levels beginner
  # Note: No --max-workers (sequential processing)
```

### 3. New Workflow

#### Default Generation (All Content)

```bash
# Generate everything from config
python content/generate_content.py --db-path database/languageLearningDatabase.db
```

This will:
1. Load `database_generation.json`
2. Generate all (language × level × topic × exercise_type) combinations
3. Validate each exercise immediately after generation
4. Insert only validated exercises into database
5. Export failures to `logs/generation/failures_TIMESTAMP.json`

#### Filtered Generation

```bash
# Only French, beginner level, fill-in-blank exercises
python content/generate_content.py \
  --languages French \
  --levels beginner \
  --exercise-types fill_in_blank
```

#### Add New Language to Existing Database

```bash
# Add Portuguese (generates all levels/topics/types)
python content/generate_content.py --add-language Portuguese
```

#### Retry Failed Generations

```bash
# Retry from previous failure log
python content/generate_content.py --retry-failures logs/generation/failures_20250114_103000.json
```

### 4. Testing

**OLD** (mixed LLM and non-LLM tests):
```bash
pytest content/tests/test_validation_*.py
```

**NEW** (only LLM-based integration tests):
```bash
# Requires LLM server running
pytest content/tests/test_generation_integration.py -v -s
```

### 5. Configuration Options

Edit `database_generation.json` to customize:

#### LLM Servers

```json
{
  "llm_servers": {
    "generation": {
      "url": "http://localhost:11434/v1",
      "model": "auto",  // or specific model name
      "temperature": 0.75
    },
    "validation": {
      "url": "http://localhost:11434/v1",
      "model": "auto",  // defaults to generation model
      "temperature": 0.3
    }
  }
}
```

#### Generation Settings

```json
{
  "generation_settings": {
    "lessons_per_combination": 10,  // Lessons per (lang, level, topic, type)
    "max_retries": 5,  // Retries if generation/validation fails
    "validation_threshold": 6,  // Minimum score (1-10) to accept
    "require_unambiguous_fill_in_blank": true  // Reject ambiguous exercises
  }
}
```

#### Exercise-Specific Temperatures

```json
{
  "exercise_temperatures": {
    "conversations": 0.8,  // More creative
    "pairs": 0.68,  // More consistent
    "translations": 0.72,
    "fill_in_blank": 0.75
  }
}
```

## Key Differences

### Workflow Change

**OLD**: Generate all → Insert all → Validate separately → Remove failed
```
generate_lessons.py (parallel) → database → database_validator.py → cleanup
```

**NEW**: Generate one → Validate one → Insert if passed
```
generate_content.py: for each exercise: generate → validate → insert (if passed)
```

### Validation Changes

**OLD**:
- Validation was a separate post-processing step
- Used `--remove-failed` to clean up
- Ambiguous exercises could pass with score ≥ 6

**NEW**:
- Validation integrated into generation
- Only validated exercises inserted
- Strengthened prompts: ambiguous exercises scored ≤ 5
- Hard requirement: `is_unambiguous == true` for fill-in-blank

### Parallel Processing

**OLD**: Used ThreadPoolExecutor with `--max-workers`

**NEW**: Sequential processing (no parallel workers)

**Why?** More reliable validation with LLM, clearer failure tracking, simpler debugging.

### Failure Handling

**OLD**:
- CSV log of failures
- Manual cleanup required

**NEW**:
- JSON export with full context
- Retry with `--retry-failures failures.json`
- Automatic tracking of validation scores

## Command Reference

### Basic Commands

```bash
# Generate all content
python content/generate_content.py

# Specify database path
python content/generate_content.py --db-path path/to/db.db

# Use custom config
python content/generate_content.py --config my_config.json
```

### Filtering

```bash
# Filter by language
python content/generate_content.py --languages French,Spanish

# Filter by level
python content/generate_content.py --levels beginner,intermediate

# Filter by topic
python content/generate_content.py --topics "Greetings and introductions,Food"

# Filter by exercise type
python content/generate_content.py --exercise-types fill_in_blank,conversations

# Combine filters
python content/generate_content.py --languages French --levels beginner --exercise-types fill_in_blank
```

### Incremental Updates

```bash
# Add new language to existing database
python content/generate_content.py --add-language Portuguese

# Add new difficulty level
python content/generate_content.py --add-level expert

# Add new topic
python content/generate_content.py --add-topic "Science and nature"
```

### Model Configuration

```bash
# Override generation model
python content/generate_content.py --generation-model qwen3-coder-30b

# Override validation model (use different model)
python content/generate_content.py --validation-model qwen3-4b

# Use same model for both (default if only one specified)
python content/generate_content.py --generation-model qwen3-coder-30b
```

### Debugging

```bash
# Debug mode (shows prompts and responses)
python content/generate_content.py --debug

# Dry run (don't insert to database)
python content/generate_content.py --dry-run

# Limit combinations for testing
python content/generate_content.py --max-combinations 5

# Disable thinking prefix
python content/generate_content.py --no-think
```

### Retry Failures

```bash
# Retry failed generations from previous run
python content/generate_content.py --retry-failures logs/generation/failures_20250114_103000.json
```

## Troubleshooting

### "No such file: database_generation.json"

**Problem**: Config file not found

**Solution**:
```bash
# Make sure you're in the repo root
cd /path/to/ahlingo
python content/generate_content.py --config content/generation/config/database_generation.json
```

### "Failed to connect to LLM server"

**Problem**: LLM server not running

**Solution**:
```bash
# Check if server is running
curl http://localhost:11434/v1/models

# If not, start your LLM server
# (instructions depend on your setup)
```

### "Validation failures too high"

**Problem**: Many exercises failing validation

**Solutions**:
1. Lower `validation_threshold` in config (e.g., 5 instead of 6)
2. Check LLM model quality
3. Review validation prompts in `exercise_converters.py`
4. Use `--debug` to see validation responses

### "Exercises still ambiguous after strengthening"

**Problem**: LLM not scoring ambiguous exercises ≤ 5

**Solution**:
- The prompt now says "MAXIMUM 5 for ambiguous exercises"
- Check `--debug` output to see actual scores
- May need to adjust `validation_threshold` or model

## FAQ

**Q: Can I still use parallel processing?**

A: No, the new system is sequential for better validation reliability. If you need faster generation, consider running multiple instances with different filters.

**Q: Where are the old .txt config files?**

A: They've been replaced by `database_generation.json`. The data has been migrated.

**Q: Can I validate existing database content?**

A: The old `database_validator.py` functionality has been integrated. For existing content, you could export exercises and re-run generation, or keep the old validator script for batch validation.

**Q: How do I add a new language/level/topic?**

A: Use `--add-language`, `--add-level`, or `--add-topic` flags. Or edit `database_generation.json` and run with filters.

**Q: What if I want non-LLM tests?**

A: The consolidation removed non-LLM tests as requested. All tests now use the actual LLM server for realistic validation.

## Next Steps

1. Review and customize `database_generation.json`
2. Test with a small subset: `--max-combinations 2`
3. Run full generation for your needed content
4. Monitor `logs/generation/` for failures
5. Retry failures as needed with `--retry-failures`

## Getting Help

For issues or questions:
- Check logs in `logs/generation/`
- Use `--debug` flag to see detailed output
- Review failure JSON files for patterns
- Test with `--dry-run` and `--max-combinations 1`
