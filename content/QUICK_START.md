# Quick Start Guide - Content Generation

Get started with the new consolidated content generation system in 5 minutes.

## Prerequisites

1. **LLM Server Running**
   ```bash
   # Check if your LLM server is running
   curl http://localhost:11434/v1/models
   ```

2. **Database Exists**
   ```bash
   # Create database directory if needed
   mkdir -p database
   ```

## 1. Test the System (2 minutes)

Run a minimal test to verify everything works:

```bash
# Generate 1 French beginner fill-in-blank exercise
python content/generate_content.py \
  --languages French \
  --levels beginner \
  --topics "Greetings and introductions" \
  --exercise-types fill_in_blank \
  --max-combinations 1 \
  --debug
```

**Expected output**:
- LLM connection message
- Generation progress
- Validation score
- Database insertion confirmation
- Statistics summary

## 2. Generate Small Sample (5 minutes)

Generate a small but complete sample:

```bash
# French beginner content (all exercise types)
python content/generate_content.py \
  --languages French \
  --levels beginner \
  --max-combinations 10
```

This generates:
- ~40-100 exercises (depending on retries)
- All 4 exercise types (conversations, pairs, translations, fill-in-blank)
- Validated before insertion
- Failures exported to `logs/generation/failures_*.json`

## 3. Generate Full Content (30+ minutes)

Generate complete language learning content:

```bash
# All languages, all levels, all topics, all types
python content/generate_content.py --db-path database/languageLearningDatabase.db
```

**⚠️ Warning**: This will make ~18,000 LLM calls (9,000 generation + 9,000 validation)

**Better approach** - Generate incrementally:

```bash
# Day 1: French content
python content/generate_content.py --languages French

# Day 2: Spanish content
python content/generate_content.py --languages Spanish

# Day 3: Beginner level only (all languages)
python content/generate_content.py --levels beginner

# Day 4: Advanced level only
python content/generate_content.py --levels advanced
```

## 4. Handle Failures

If you have failures (check `logs/generation/`):

```bash
# Retry failed generations
python content/generate_content.py \
  --retry-failures logs/generation/failures_20250114_103000.json
```

## 5. Add New Content

After initial generation, add new content:

```bash
# Add Portuguese language
python content/generate_content.py --add-language Portuguese

# Add "expert" level
python content/generate_content.py --add-level expert

# Add new topic
python content/generate_content.py --add-topic "Science and nature"
```

## Common Commands

### Development/Testing

```bash
# Dry run (don't insert to database)
python content/generate_content.py --dry-run --max-combinations 2

# Debug mode (see prompts and responses)
python content/generate_content.py --debug --max-combinations 1

# Use specific model
python content/generate_content.py --generation-model qwen3-coder-30b
```

### Production

```bash
# Generate specific subset
python content/generate_content.py \
  --languages French,Spanish \
  --levels beginner,intermediate \
  --topics "Food, drinks, and restaurants"

# Full generation with custom config
python content/generate_content.py \
  --config my_config.json \
  --db-path production.db
```

## Configuration

Edit `content/generation/config/database_generation.json`:

### Change Server URL

```json
{
  "llm_servers": {
    "generation": {
      "url": "http://your-server:11434/v1",
      ...
    }
  }
}
```

### Adjust Validation Threshold

```json
{
  "generation_settings": {
    "validation_threshold": 7  // Higher = stricter (1-10)
  }
}
```

### Change Lessons Per Combination

```json
{
  "generation_settings": {
    "lessons_per_combination": 5  // Default: 10
  }
}
```

## Monitoring Progress

### Watch Generation

```bash
# Real-time monitoring (terminal output)
python content/generate_content.py --languages French | tee generation.log
```

### Check Database

```bash
# Count exercises in database
sqlite3 database/languageLearningDatabase.db \
  "SELECT exercise_type, COUNT(*) FROM exercises_info GROUP BY exercise_type"
```

### Review Failures

```bash
# View failure summary
cat logs/generation/failures_*.json | jq '.stats'

# Count failures by type
cat logs/generation/failures_*.json | jq '.failures | group_by(.error_type) | map({type: .[0].error_type, count: length})'
```

## Troubleshooting

### "Connection refused"

**Problem**: LLM server not running

**Solution**:
```bash
# Check if server is accessible
curl -v http://localhost:11434/v1/models
```

### "Validation failures too high"

**Problem**: Most exercises failing validation

**Solutions**:
1. Lower threshold: Edit `generation_settings.validation_threshold` to 5
2. Check model quality: Try different model with `--generation-model`
3. Review failures: `cat logs/generation/failures_*.json | jq '.failures[0]'`

### "Out of memory"

**Problem**: Too many combinations

**Solution**:
```bash
# Process in smaller batches
python content/generate_content.py --languages French --levels beginner
python content/generate_content.py --languages French --levels intermediate
# etc.
```

## Next Steps

1. ✅ Test with `--max-combinations 1 --debug`
2. ✅ Generate sample content (1 language, 1 level)
3. ✅ Review failures and adjust config if needed
4. ✅ Generate production content incrementally
5. ✅ Set up automated retry for failures

## Getting Help

- **Migration from old system**: Read `MIGRATION_GUIDE.md`
- **Full documentation**: See `CONSOLIDATION_SUMMARY.md`
- **Test results**: Check `tests/LLM_VALIDATION_FINDINGS.md`
- **Configuration reference**: See `database_generation.json` comments

## Integration Test

Verify the complete system:

```bash
# Run integration tests (requires LLM server)
pytest content/tests/test_generation_integration.py -v -s
```

---

**Ready to generate?** Start with Step 1 above!
