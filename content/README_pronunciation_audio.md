# Pronunciation Audio Generator for AHLingo

This tool generates pronunciation audio files for language learning exercises using XTTS-v2 (Coqui AI). It reads from the AHLingo language learning database and creates a separate database of WAV sound files for pronunciation practice.

## Features

- Generates audio for all exercise types in the AHLingo database:
  - Pair exercises (word pairs)
  - Translation exercises (sentence pairs)
  - Conversation exercises (dialogues)
- Creates audio files for both languages (typically English and the target language)
- Organizes audio files in a structured directory hierarchy
- Maintains a metadata file for easy lookup and reference
- Supports resuming interrupted generation processes
- Works with multiple languages

## Requirements

- Python 3.7+
- TTS library with XTTS-v2 support
- tqdm (for progress bars)
- AHLingo database

## Installation

1. Make sure you have the required dependencies:

```bash
pip install -r requirements.txt
```

2. The XTTS-v2 model will be downloaded automatically on first run (requires internet connection)

## Usage

Run the script with default settings:

```bash
python generate_pronunciation_audio.py
```

This will:
- Read from the default database location (`./database/languageLearningDatabase.db`)
- Save audio files to `./audio_database/`

### Custom Settings

You can specify custom paths and options:

```bash
python generate_pronunciation_audio.py --db_path /path/to/database.db --output_dir /path/to/audio/output
```

For better voice quality, you can provide a reference audio file for voice cloning:

```bash
python generate_pronunciation_audio.py --reference_audio /path/to/reference.wav
```

The reference audio should be a clear recording of a native speaker in the target language. This helps XTTS-v2 generate more natural-sounding speech.

## Output Structure

The script creates a structured directory hierarchy:

```
audio_database/
├── audio_metadata.json  # Metadata file with all audio information
├── pairs/               # Word pair exercises
│   ├── French/          # Organized by language
│   │   ├── topic_difficulty_hash_en.wav      # English audio
│   │   └── topic_difficulty_hash_french.wav  # Target language audio
│   ├── Spanish/
│   └── ...
├── translations/        # Translation exercises
│   ├── French/
│   └── ...
└── conversations/       # Conversation exercises
    ├── French/
    └── ...
```

## Metadata File

The script maintains a JSON metadata file (`audio_metadata.json`) that contains information about all generated audio files, including:

- Original text
- File paths
- Language information
- Topic and difficulty level
- Exercise relationships

This metadata can be used by applications to locate and use the audio files.

## Integration with AHLingo

This tool is designed to work alongside the AHLingo language learning application. The generated audio files can be used for:

- Pronunciation practice
- Listening exercises
- Speaking exercises with comparison to native pronunciation
- Audio flashcards

## Troubleshooting

- If you encounter errors related to the TTS library, make sure you have installed it with XTTS-v2 support.
- If the script fails to find the database, check the path and make sure the database exists.
- For memory issues with large databases, consider running the script in batches by modifying the code to process specific languages or exercise types.
