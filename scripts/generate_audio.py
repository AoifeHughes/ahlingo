#!/usr/bin/env python3
"""
Entry point for generating pronunciation audio for exercises.

This script generates TTS audio for all exercise types (pairs, translations, conversations)
and stores them in the database.

Usage:
    python scripts/generate_audio.py [options]

Examples:
    # Generate audio for all exercises
    python scripts/generate_audio.py

    # Generate audio with custom database path
    python scripts/generate_audio.py --db_path /path/to/database.db

    # Store only in database (no file output)
    python scripts/generate_audio.py --db_only

    # Use custom voice
    python scripts/generate_audio.py --speaker "voice_name"
"""

import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Import and run the audio generator
from content.generation.core.audio_generator import main

if __name__ == "__main__":
    main()
