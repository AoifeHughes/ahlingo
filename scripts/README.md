# AhLingo Scripts

This directory contains executable entry point scripts for content generation, audio generation, and validation tasks.

## Overview

All scripts are designed to be run from the project root directory:

```bash
# From /home/user/ahlingo/
python scripts/generate_content.py
python scripts/generate_audio.py
python scripts/validate_content.py
```

## Content Generation Scripts

### generate_content.py

Generates lesson content (exercises, translations, conversations) for the language learning database.

**Usage:**
```bash
# Generate all lessons
python scripts/generate_content.py

# Generate for specific language
python scripts/generate_content.py --language French

# Generate for specific difficulty
python scripts/generate_content.py --difficulty Beginner

# Full customization
python scripts/generate_content.py --language Spanish --difficulty Intermediate --topic "Food and Dining"
```

**Output:**
- Lessons are written to `database/languageLearningDatabase.db`
- Generation failures logged to `logs/generation/generation_failures_*.csv`

---

### generate_audio.py

Generates pronunciation audio for all exercises using Text-to-Speech.

**Usage:**
```bash
# Generate audio for all exercises
python scripts/generate_audio.py

# Store only in database (no files)
python scripts/generate_audio.py --db_only

# Use custom voice
python scripts/generate_audio.py --speaker "Thomas"

# Custom database path
python scripts/generate_audio.py --db_path ./my_database.db
```

**Features:**
- Supports 18+ languages via XTTS-v2
- Special support for Ukrainian with native TTS
- Stores audio as BLOBs in the database
- Optional file-based storage for backward compatibility

**Output:**
- Audio stored in `database/languageLearningDatabase.db` (pronunciation_audio table)
- Optional: WAV files in `audio_database/` directory

---

### validate_content.py

Validates database content for quality, completeness, and consistency.

**Usage:**
```bash
# Validate all content
python scripts/validate_content.py

# Verbose output
python scripts/validate_content.py --verbose

# Custom database
python scripts/validate_content.py --db_path ./my_database.db
```

**Validates:**
- Exercise completeness (no missing translations, pairs, etc.)
- Ambiguity in fill-in-blank exercises
- Conversation flow and structure
- Topic and difficulty consistency

**Output:**
- Validation report printed to console
- Critical issues highlighted with warnings

---

## Utility Scripts

### extract_model_template.py

Extracts chat templates from GGUF model files for use with local LLMs.

**Usage:**
```bash
python scripts/extract_model_template.py model_file.gguf
```

---

### Icon Generation Scripts

- `generate_icons.sh` - Generate iOS app icons
- `generate_android_icons.sh` - Generate Android app icons

**Usage:**
```bash
bash scripts/generate_icons.sh source_image.png
bash scripts/generate_android_icons.sh source_image.png
```

---

## Directory Structure

```
ahlingo/
├── scripts/                          # Entry point scripts (you are here)
│   ├── generate_content.py          # Main content generation
│   ├── generate_audio.py            # Audio generation
│   ├── validate_content.py          # Content validation
│   └── README.md                    # This file
│
├── content/
│   ├── generation/                  # Core generation logic
│   │   ├── core/                    # Main generators
│   │   ├── models/                  # Data models
│   │   ├── utils/                   # Utilities
│   │   └── config/                  # Configuration files
│   ├── tests/                       # Test scripts
│   └── database/                    # Database utilities
│
├── logs/                            # Log files
│   └── generation/                  # Generation logs
│
└── database/                        # SQLite database
    └── languageLearningDatabase.db
```

---

## Configuration

### Config Files

Located in `content/generation/config/`:

- `languages.txt` - Supported languages
- `levels.txt` - Difficulty levels
- `topics.txt` - Topic list
- `chapters.csv` - Chapter structure
- `prompt_file.json` - LLM prompts for generation

### Environment Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up database:**
   ```bash
   python create_exercise_database.py
   ```

3. **Configure API keys** (if using cloud LLMs):
   - OpenAI: Set `OPENAI_API_KEY` environment variable
   - Or use local models via `llama.cpp`

---

## Testing

Test scripts are located in `content/tests/`:

- `test_single_generation.py` - Test single lesson generation
- `test_outlines_generation.py` - Test outline generation
- `test_outlines.py` - Test outline parsing
- `demo_outlines.py` - Demo outline functionality

**Run tests:**
```bash
python content/tests/test_single_generation.py
python content/tests/demo_outlines.py
```

---

## Troubleshooting

### Common Issues

**1. Import Errors**
```
ModuleNotFoundError: No module named 'content'
```
**Solution:** Always run scripts from the project root directory.

**2. Database Locked**
```
OperationalError: database is locked
```
**Solution:** Close any other processes accessing the database.

**3. Audio Generation Fails**
```
Failed to generate audio for [language]
```
**Solution:**
- Check if TTS dependencies are installed: `pip install TTS`
- For Ukrainian: `pip install ukrainian-tts`
- Ensure sufficient disk space

**4. Generation Failures**
```
LLM returned invalid JSON
```
**Solution:**
- Check logs in `logs/generation/generation_failures_*.csv`
- Retry failed generations
- Adjust prompts in `content/generation/config/prompt_file.json`

---

## Additional Resources

- **Content Generation Guide:** `content/generation/CONTENT_GENERATION.md`
- **Migration Notes:** `content/MIGRATION_NOTES.md`
- **Troubleshooting:** `content/TROUBLESHOOTING.md`
- **Quick Start:** `content/QUICK_START.md`

---

## Contact

For issues or questions, see the main project README.
