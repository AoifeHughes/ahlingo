#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Generate pronunciation audio files for language learning exercises using XTTS-v2.
Includes special support for Ukrainian using the ukrainian-tts library.

This script reads from the language learning database and generates audio files
for each exercise in both languages (typically English and the target language).
The audio files are compressed to AAC at 64kbps and stored in the database.

Requirements:
- TTS (with XTTS-v2 support)
- ukrainian-tts (for Ukrainian language support)
- ffmpeg (for audio compression to AAC)
- sqlite3
- pathlib
- tqdm (for progress bars)

Usage:
    python generate_pronunciation_audio.py [--db_path PATH] [--output_dir PATH] [--reference_audio PATH]
"""

import argparse
import os
import sqlite3
from pathlib import Path
from typing import Dict
import json
import hashlib
from tqdm import tqdm

# Import TTS for XTTS-v2
try:
    from TTS.api import TTS
except ImportError:
    print("Error: TTS package not found. Please install it with:")
    print("pip install TTS")
    exit(1)

# Import Ukrainian TTS (if available)
try:
    from ukrainian_tts.tts import TTS as UkrainianTTS, Voices, Stress

    UKRAINIAN_TTS_AVAILABLE = True
    print("Ukrainian TTS library found and loaded")
except ImportError:
    UKRAINIAN_TTS_AVAILABLE = False
    print("Ukrainian TTS library not found. Install with:")
    print("pip install git+https://github.com/robinhad/ukrainian-tts.git")

from AHLingo.database.database_manager import LanguageDB


class PronunciationAudioGenerator:
    """Generate and store pronunciation audio for language exercises in the database."""

    def __init__(
        self,
        db_path: str,
        output_dir: str = None,
        reference_audio: str = None,
        speaker: str = None,
        ukr_voice: str = None,
    ):
        """
        Initialize the audio generator.

        Args:
            db_path: Path to the SQLite database
            output_dir: Optional directory to store audio files (for backward compatibility)
            reference_audio: Optional path to reference audio file for voice cloning
            speaker: Speaker ID for multi-speaker models
            ukr_voice: Voice for Ukrainian TTS (default: Dmytro)
        """
        self.reference_audio = reference_audio
        self.db_path = Path(db_path)

        # For backward compatibility
        self.output_dir = None
        if output_dir:
            self.output_dir = Path(output_dir)
            self.output_dir.mkdir(parents=True, exist_ok=True)
            self.metadata_path = self.output_dir / "audio_metadata.json"
            self.metadata = self._load_metadata()
        else:
            self.metadata = {"pairs": {}, "translations": {}, "conversations": {}}

        # Initialize database connection
        self.db = LanguageDB(str(self.db_path))

        # Check for ffmpeg availability
        self._check_ffmpeg_availability()

        # Print audio count in database
        print(f"Number of audio recordings in database: {self.db.get_audio_count()}")

        # Initialize Ukrainian TTS if available
        if UKRAINIAN_TTS_AVAILABLE:
            # Set the Ukrainian voice
            if ukr_voice and hasattr(Voices, ukr_voice):
                self.ukr_voice = getattr(Voices, ukr_voice).value
            else:
                self.ukr_voice = Voices.Dmytro.value

            self.ukrainian_tts = UkrainianTTS(device="cpu")
            print(f"Ukrainian TTS initialized with voice: {self.ukr_voice}")

        # Initialize TTS model
        try:
            self.tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
            print("XTTS-v2 model loaded successfully")

            # Get available speakers and select one if not specified
            print("Available speakers:")
            print(self.tts.speakers)

            # Set speaker - either use provided speaker or select first available
            if speaker and speaker in self.tts.speakers:
                self.speaker = speaker
            else:
                self.speaker = self.tts.speakers[0] if self.tts.speakers else None

            print(f"Using speaker: {self.speaker}")

            # Supported languages
            self.supported_languages = [
                "en",
                "es",
                "fr",
                "de",
                "it",
                "pt",
                "pl",
                "tr",
                "ru",
                "nl",
                "cs",
                "ar",
                "zh-cn",
                "hu",
                "ko",
                "ja",
                "hi",
            ]

            # Add Ukrainian if the library is available
            if UKRAINIAN_TTS_AVAILABLE:
                self.supported_languages.append("uk")

            print(f"Supported languages: {self.supported_languages}")

        except Exception as e:
            print(f"Error loading XTTS-v2 model: {e}")
            print("Make sure you have installed TTS with XTTS-v2 support:")
            print("pip install TTS")
            exit(1)

    def _load_metadata(self) -> Dict:
        """Load existing metadata or create new if it doesn't exist."""
        if self.metadata_path.exists():
            with open(self.metadata_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"pairs": {}, "translations": {}, "conversations": {}}

    def _save_metadata(self):
        """Save metadata to file."""
        with open(self.metadata_path, "w", encoding="utf-8") as f:
            json.dump(self.metadata, f, ensure_ascii=False, indent=2)

    def _check_ffmpeg_availability(self):
        """Check if ffmpeg is available for audio compression."""
        import subprocess
        try:
            subprocess.run(
                ["ffmpeg", "-version"], 
                capture_output=True, 
                check=True
            )
            print("ffmpeg found - audio will be compressed to AAC at 64kbps")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("Warning: ffmpeg not found. Audio will be stored as uncompressed WAV.")
            print("To enable AAC compression, install ffmpeg:")
            print("  macOS: brew install ffmpeg")
            print("  Ubuntu/Debian: sudo apt install ffmpeg")
            print("  Windows: Download from https://ffmpeg.org/download.html")

    def _get_text_hash(self, text: str) -> str:
        """Generate a hash for text to use in filenames."""
        return hashlib.md5(text.encode("utf-8")).hexdigest()[:10]

    def _compress_audio_to_aac(self, wav_path: str) -> bytes:
        """
        Convert WAV audio to AAC at 64kbps using ffmpeg.
        
        Args:
            wav_path: Path to the input WAV file
            
        Returns:
            bytes: Compressed AAC audio data
        """
        import subprocess
        import tempfile
        
        try:
            # Create temporary file for AAC output
            with tempfile.NamedTemporaryFile(suffix=".aac", delete=False) as temp_aac:
                temp_aac_path = temp_aac.name
            
            # Use ffmpeg to convert WAV to AAC at 64kbps
            ffmpeg_cmd = [
                "ffmpeg", "-y",  # -y to overwrite output file
                "-i", wav_path,  # input file
                "-c:a", "aac",   # audio codec: AAC
                "-b:a", "64k",   # audio bitrate: 64kbps
                "-movflags", "+faststart",  # optimize for streaming
                temp_aac_path
            ]
            
            # Run ffmpeg command
            result = subprocess.run(
                ffmpeg_cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            # Read compressed audio data
            with open(temp_aac_path, "rb") as f:
                compressed_data = f.read()
            
            # Clean up temporary AAC file
            os.unlink(temp_aac_path)
            
            return compressed_data
            
        except subprocess.CalledProcessError as e:
            print(f"Error compressing audio with ffmpeg: {e}")
            print(f"ffmpeg stderr: {e.stderr}")
            # Fall back to original WAV data if compression fails
            with open(wav_path, "rb") as f:
                return f.read()
        except Exception as e:
            print(f"Unexpected error during audio compression: {e}")
            # Fall back to original WAV data
            with open(wav_path, "rb") as f:
                return f.read()

    def _get_language_code(self, language: str) -> str:
        """Map language names to language codes for XTTS."""
        language_map = {
            "English": "en",
            "French": "fr",
            "Spanish": "es",
            "German": "de",
            "Italian": "it",
            "Portuguese": "pt",
            "Polish": "pl",
            "Turkish": "tr",
            "Russian": "ru",
            "Dutch": "nl",
            "Czech": "cs",
            "Arabic": "ar",
            "Chinese": "zh-cn",
            "Hungarian": "hu",
            "Korean": "ko",
            "Japanese": "ja",
            "Hindi": "hi",
            "Ukrainian": "uk",
        }

        # Return mapped code or default to English if not found
        return language_map.get(language, "en")

    def _generate_audio(
        self,
        text: str,
        language: str,
        output_path: Path = None,
        exercise_type: str = None,
        topic: str = None,
        difficulty: str = None,
    ) -> bool:
        """
        Generate audio for the given text and store it in the database and/or file.

        Args:
            text: Text to convert to speech
            language: Language name (e.g., 'English', 'French', 'Spanish')
            output_path: Optional path to save the audio file (for backward compatibility)
            exercise_type: Type of exercise (pairs, translation, conversation)
            topic: Topic of the exercise
            difficulty: Difficulty level of the exercise

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Check if audio already exists in database
            existing_audio = self.db.get_pronunciation_audio(text, language)
            if existing_audio and not output_path:
                # Audio already exists in database and no file output needed
                return True

            # Get language code
            lang_code = self._get_language_code(language)

            # Create a temporary file to store the audio
            import tempfile

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_path = temp_file.name

            # Special case for Ukrainian using the ukrainian-tts library
            if lang_code == "uk" and UKRAINIAN_TTS_AVAILABLE:
                with open(temp_path, mode="wb") as file:
                    _, _ = self.ukrainian_tts.tts(
                        text, self.ukr_voice, Stress.Dictionary.value, file
                    )
            else:
                # Check if language is supported by XTTS-v2
                if lang_code not in self.supported_languages:
                    print(
                        f"Warning: Language '{language}' (code: {lang_code}) not in supported languages list. Using English instead."
                    )
                    lang_code = "en"

                # Generate audio using reference audio for voice cloning if provided
                if self.reference_audio and os.path.exists(self.reference_audio):
                    self.tts.tts_to_file(
                        text=text,
                        file_path=temp_path,
                        speaker_wav=self.reference_audio,
                        language=lang_code,
                    )
                else:
                    # Use selected speaker
                    self.tts.tts_to_file(
                        text=text,
                        file_path=temp_path,
                        language=lang_code,
                        speaker=self.speaker,
                    )

            # Convert WAV to AAC at 64kbps before storing
            compressed_audio_data = self._compress_audio_to_aac(temp_path)

            # Store compressed audio in database if exercise_type is provided
            if exercise_type:
                self.db.store_pronunciation_audio(
                    text, language, compressed_audio_data, exercise_type, topic, difficulty
                )

            # Copy to output_path if provided (for backward compatibility)
            if output_path:
                import shutil

                output_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy(temp_path, str(output_path))

            # Clean up temporary file
            os.unlink(temp_path)

            return True
        except Exception as e:
            print(f"Error generating audio for '{text}': {e}")
            return False

    def process_pair_exercises(self):
        """Process all pair exercises and generate audio files."""
        print("Processing pair exercises...")

        # Get all languages
        languages = self.db.get_languages()

        for language in languages:
            if language == "English":
                continue  # Skip English as it's always the first language

            # Create directory for this language if output_dir is specified
            lang_dir = None
            if self.output_dir:
                lang_dir = self.output_dir / "pairs" / language
                lang_dir.mkdir(parents=True, exist_ok=True)

            # Get all difficulty levels for this language
            difficulties = self.db.get_difficulty_by_language(language)

            for difficulty in difficulties:
                # Get all topics for this language and difficulty
                topics = self.db.get_topics_by_language_difficulty(language, difficulty)

                for topic in topics:
                    # Get pair exercises
                    exercises = self.db.get_random_pair_exercise(
                        language, difficulty, topic, limit=1000
                    )

                    for exercise in tqdm(
                        exercises,
                        desc=f"Generating audio for {language} {difficulty} {topic} pairs",
                    ):
                        # Extract text content
                        eng_text = exercise["language_1_content"]
                        lang_text = exercise["language_2_content"]

                        # Generate unique IDs for each text
                        eng_hash = self._get_text_hash(eng_text)
                        lang_hash = self._get_text_hash(lang_text)

                        # Define file paths if output_dir is specified
                        eng_file = None
                        lang_file = None
                        if lang_dir:
                            eng_file = (
                                lang_dir / f"{topic}_{difficulty}_{eng_hash}_en.wav"
                            )
                            lang_file = (
                                lang_dir
                                / f"{topic}_{difficulty}_{lang_hash}_{language.lower()}.wav"
                            )

                        # Check if already processed in metadata
                        pair_id = f"{eng_hash}_{lang_hash}"
                        if self.output_dir and pair_id in self.metadata["pairs"]:
                            continue

                        # Check if audio already exists in database
                        eng_exists = self.db.get_pronunciation_audio(
                            eng_text, "English"
                        )
                        lang_exists = self.db.get_pronunciation_audio(
                            lang_text, language
                        )

                        # Generate audio only if it doesn't exist in the database
                        eng_success = True
                        if not eng_exists:
                            eng_success = self._generate_audio(
                                eng_text,
                                "English",
                                eng_file,
                                exercise_type="pairs",
                                topic=topic,
                                difficulty=difficulty,
                            )

                        lang_success = True
                        if not lang_exists:
                            lang_success = self._generate_audio(
                                lang_text,
                                language,
                                lang_file,
                                exercise_type="pairs",
                                topic=topic,
                                difficulty=difficulty,
                            )

                        # Update metadata if output_dir is specified
                        if self.output_dir and eng_success and lang_success:
                            self.metadata["pairs"][pair_id] = {
                                "english": {
                                    "text": eng_text,
                                    "file": str(eng_file.relative_to(self.output_dir)),
                                },
                                "target_language": {
                                    "language": language,
                                    "text": lang_text,
                                    "file": str(lang_file.relative_to(self.output_dir)),
                                },
                                "topic": topic,
                                "difficulty": difficulty,
                            }

                            # Save metadata periodically
                            if len(self.metadata["pairs"]) % 10 == 0:
                                self._save_metadata()

    def process_translation_exercises(self):
        """Process all translation exercises and generate audio files."""
        print("Processing translation exercises...")

        # Connect directly to the database for more complex queries
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get all translation exercises
        cursor.execute(
            """
            SELECT
                e.id as exercise_id,
                e.exercise_name,
                t.topic,
                d.difficulty_level,
                l.language,
                te.language_1_content as english_content,
                te.language_2_content as target_language_content
            FROM exercises_info e
            JOIN translation_exercises te ON e.id = te.exercise_id
            JOIN topics t ON e.topic_id = t.id
            JOIN difficulties d ON e.difficulty_id = d.id
            JOIN languages l ON e.language_id = l.id
        """
        )

        translations = cursor.fetchall()

        for translation in tqdm(translations, desc="Generating audio for translations"):
            # Extract data
            exercise_id = translation["exercise_id"]
            language = translation["language"]
            topic = translation["topic"]
            difficulty = translation["difficulty_level"]
            eng_text = translation["english_content"]
            lang_text = translation["target_language_content"]

            # Skip if already processed in metadata
            if self.output_dir and str(exercise_id) in self.metadata["translations"]:
                continue

            # Create directory if output_dir is specified
            lang_dir = None
            if self.output_dir:
                lang_dir = self.output_dir / "translations" / language
                lang_dir.mkdir(parents=True, exist_ok=True)

            # Generate unique IDs
            eng_hash = self._get_text_hash(eng_text)
            lang_hash = self._get_text_hash(lang_text)

            # Define file paths if output_dir is specified
            eng_file = None
            lang_file = None
            if lang_dir:
                eng_file = lang_dir / f"{topic}_{difficulty}_{eng_hash}_en.wav"
                lang_file = (
                    lang_dir
                    / f"{topic}_{difficulty}_{lang_hash}_{language.lower()}.wav"
                )

            # Check if audio already exists in database
            eng_exists = self.db.get_pronunciation_audio(eng_text, "English")
            lang_exists = self.db.get_pronunciation_audio(lang_text, language)

            # Generate audio only if it doesn't exist in the database
            eng_success = True
            if not eng_exists:
                eng_success = self._generate_audio(
                    eng_text,
                    "English",
                    eng_file,
                    exercise_type="translation",
                    topic=topic,
                    difficulty=difficulty,
                )

            lang_success = True
            if not lang_exists:
                lang_success = self._generate_audio(
                    lang_text,
                    language,
                    lang_file,
                    exercise_type="translation",
                    topic=topic,
                    difficulty=difficulty,
                )

            # Update metadata if output_dir is specified
            if self.output_dir and eng_success and lang_success:
                self.metadata["translations"][str(exercise_id)] = {
                    "english": {
                        "text": eng_text,
                        "file": str(eng_file.relative_to(self.output_dir)),
                    },
                    "target_language": {
                        "language": language,
                        "text": lang_text,
                        "file": str(lang_file.relative_to(self.output_dir)),
                    },
                    "topic": topic,
                    "difficulty": difficulty,
                }

                # Save metadata periodically
                if len(self.metadata["translations"]) % 10 == 0:
                    self._save_metadata()

        conn.close()

    def process_conversation_exercises(self):
        """Process all conversation exercises and generate audio files."""
        print("Processing conversation exercises...")

        # Connect directly to the database for more complex queries
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get all conversation exercises
        cursor.execute(
            """
            SELECT DISTINCT
                e.id as exercise_id,
                e.exercise_name,
                t.topic,
                d.difficulty_level,
                l.language
            FROM exercises_info e
            JOIN conversation_exercises ce ON e.id = ce.exercise_id
            JOIN topics t ON e.topic_id = t.id
            JOIN difficulties d ON e.difficulty_id = d.id
            JOIN languages l ON e.language_id = l.id
        """
        )

        conversations = cursor.fetchall()

        for conversation in tqdm(
            conversations, desc="Generating audio for conversations"
        ):
            # Extract data
            exercise_id = conversation["exercise_id"]
            language = conversation["language"]
            topic = conversation["topic"]
            difficulty = conversation["difficulty_level"]

            # Skip if already processed in metadata
            if self.output_dir and str(exercise_id) in self.metadata["conversations"]:
                continue

            # Get all messages for this conversation
            cursor.execute(
                """
                SELECT
                    conversation_order,
                    speaker,
                    message
                FROM conversation_exercises
                WHERE exercise_id = ?
                ORDER BY conversation_order
            """,
                (exercise_id,),
            )

            messages = cursor.fetchall()

            # Create directory if output_dir is specified
            lang_dir = None
            if self.output_dir:
                lang_dir = self.output_dir / "conversations" / language
                lang_dir.mkdir(parents=True, exist_ok=True)

            conversation_files = []
            all_success = True

            # Process each message in the conversation
            for msg in messages:
                speaker = msg["speaker"]
                message = msg["message"]
                order = msg["conversation_order"]

                # Generate unique ID
                msg_hash = self._get_text_hash(message)

                # Define file path if output_dir is specified
                file_path = None
                if lang_dir:
                    file_path = (
                        lang_dir
                        / f"{topic}_{difficulty}_{exercise_id}_{order}_{msg_hash}.wav"
                    )

                # Check if audio already exists in database
                audio_exists = self.db.get_pronunciation_audio(message, language)

                # Generate audio only if it doesn't exist in the database
                success = True
                if not audio_exists:
                    success = self._generate_audio(
                        message,
                        language,
                        file_path,
                        exercise_type="conversation",
                        topic=topic,
                        difficulty=difficulty,
                    )

                if success and self.output_dir:
                    conversation_files.append(
                        {
                            "order": order,
                            "speaker": speaker,
                            "message": message,
                            "file": str(file_path.relative_to(self.output_dir)),
                        }
                    )
                elif not success:
                    all_success = False

            # Update metadata if output_dir is specified
            if self.output_dir and all_success and conversation_files:
                self.metadata["conversations"][str(exercise_id)] = {
                    "language": language,
                    "topic": topic,
                    "difficulty": difficulty,
                    "messages": conversation_files,
                }

                # Save metadata periodically
                if len(self.metadata["conversations"]) % 5 == 0:
                    self._save_metadata()

        conn.close()

    def run(self):
        """Run the audio generation process for all exercise types."""
        try:
            self.process_pair_exercises()
            self.process_translation_exercises()
            self.process_conversation_exercises()

            # Final save of metadata if output_dir is specified
            if self.output_dir:
                self._save_metadata()
                print("Audio files saved to {}".format(self.output_dir))
                print("Generated audio files for:")
                print("  - {} pair exercises".format(len(self.metadata["pairs"])))
                print(
                    "  - {} translation exercises".format(
                        len(self.metadata["translations"])
                    )
                )
                print(
                    "  - {} conversation exercises".format(
                        len(self.metadata["conversations"])
                    )
                )

            # Print database stats
            print(
                "Total audio recordings in database: {}".format(
                    self.db.get_audio_count()
                )
            )
            print("Audio generation complete.")

        except KeyboardInterrupt:
            print("\nProcess interrupted by user.")
            if self.output_dir:
                print("Saving metadata...")
                self._save_metadata()
                print("Metadata saved.")
            print("Exiting.")
        finally:
            # Close database connection
            self.db.close()


def main():
    """Parse arguments and run the audio generator."""
    parser = argparse.ArgumentParser(
        description="Generate pronunciation audio files for language exercises"
    )
    parser.add_argument(
        "--db_path",
        default="./database/languageLearningDatabase.db",
        help="Path to the SQLite database (default: ./database/languageLearningDatabase.db)",
    )
    parser.add_argument(
        "--output_dir",
        help="Directory to store audio files (optional, if not provided audio will only be stored in the database)",
    )
    parser.add_argument(
        "--reference_audio",
        help="Path to reference audio file for voice cloning (optional)",
    )
    parser.add_argument(
        "--speaker",
        help="Speaker ID for multi-speaker models (will use first available if not specified)",
    )
    parser.add_argument(
        "--ukr_voice",
        default="Dmytro",
        help="Voice for Ukrainian TTS (options: Dmytro, Lada, Mykyta, Tetiana) (default: Dmytro)",
    )
    parser.add_argument(
        "--db_only",
        action="store_true",
        help="Store audio only in the database, not as files (same as omitting --output_dir)",
    )

    args = parser.parse_args()

    # If --db_only is specified, don't use output_dir
    output_dir = None if args.db_only else args.output_dir

    generator = PronunciationAudioGenerator(
        args.db_path, output_dir, args.reference_audio, args.speaker, args.ukr_voice
    )
    generator.run()


if __name__ == "__main__":
    main()
