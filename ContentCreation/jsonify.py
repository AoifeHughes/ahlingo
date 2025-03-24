#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Language Learning Content Extractor

This script extracts all language learning lessons and their associated audio files from the database,
organizes them into a structured filesystem, and creates JSON files for each lesson and a master index.

The script:
1. Extracts all lessons (pairs, translations, conversations) by language, topic, and difficulty
2. Extracts associated audio files and places them alongside the lessons
3. Creates JSON files for each lesson with all relevant content
4. Creates a master index.json with metadata about all lessons, languages, topics, etc.

Usage:
    python extract_lessons.py --db_path PATH --output_dir PATH
"""

import argparse
import os
import sqlite3
import hashlib
from pathlib import Path
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional, Set, Tuple
from tqdm import tqdm

class LanguageLearningExtractor:
    """Extract language learning content and organize it into a structured filesystem with JSON files."""
    
    def __init__(self, db_path: str, output_dir: str):
        """
        Initialize the content extractor.
        
        Args:
            db_path: Path to the SQLite database
            output_dir: Directory to store extracted content
        """
        self.db_path = Path(db_path)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Connect to the database
        self.conn = sqlite3.connect(str(self.db_path))
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()
        
        # Master index data
        self.master_index = {
            "languages": [],
            "topics": [],
            "difficulties": [],
            "lessons": {
                "pairs": [],
                "translations": [],
                "conversations": []
            },
            "stats": {
                "total_lessons": 0,
                "total_audio_files": 0,
                "extraction_date": datetime.now().isoformat()
            }
        }
        
        # Set to track unique languages, topics, and difficulties
        self.unique_languages = set()
        self.unique_topics = set()
        self.unique_difficulties = set()
        
        # Track extracted audio files
        self.extracted_audio_files = 0
    
    def _get_text_hash(self, text: str) -> str:
        """Generate a hash for text to use in filenames."""
        return hashlib.md5(text.encode("utf-8")).hexdigest()[:10]
    
    def _sanitize_filename(self, name: str) -> str:
        """Convert string to a safe filename."""
        # Replace any non-alphanumeric characters with underscores
        return ''.join(c if c.isalnum() else '_' for c in name)
    
    def _save_audio_file(self, audio_data: bytes, file_path: Path) -> bool:
        """Save binary audio data to a file."""
        try:
            file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(file_path, "wb") as f:
                f.write(audio_data)
            return True
        except Exception as e:
            print(f"Error saving audio file: {e}")
            return False
    
    def _save_json_file(self, data: Dict, file_path: Path) -> bool:
        """Save data to a JSON file."""
        try:
            file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Error saving JSON file: {e}")
            return False
    
    def _get_pronunciation_audio(self, text: str, language: str) -> Optional[bytes]:
        """Get pronunciation audio data for a text in a specific language."""
        try:
            self.cursor.execute(
                """SELECT audio_data FROM pronunciation_audio
                   WHERE text = ? AND language = ?
                   ORDER BY created_at DESC LIMIT 1""",
                (text, language),
            )
            result = self.cursor.fetchone()
            return result["audio_data"] if result else None
        except Exception as e:
            print(f"Error retrieving audio for '{text}' in {language}: {e}")
            return None
    
    def _extract_audio_for_text(self, text: str, language: str, lesson_dir: Path, prefix: str = "") -> Optional[str]:
        """
        Extract audio for a text and save it to the lesson directory.
        
        Args:
            text: The text for which to extract audio
            language: The language of the text
            lesson_dir: Directory to save the audio file
            prefix: Optional prefix for the filename
            
        Returns:
            Relative path to the audio file if successful, None otherwise
        """
        audio_data = self._get_pronunciation_audio(text, language)
        if not audio_data:
            return None
        
        # Generate filename
        text_hash = self._get_text_hash(text)
        safe_text = self._sanitize_filename(text[:30])
        filename = f"{prefix}_{text_hash}_{safe_text}.wav" if prefix else f"{text_hash}_{safe_text}.wav"
        
        # Save file
        file_path = lesson_dir / "audio" / filename
        if self._save_audio_file(audio_data, file_path):
            self.extracted_audio_files += 1
            return f"audio/{filename}"
        
        return None
    
    def get_all_metadata(self):
        """Get all languages, topics, and difficulties from the database."""
        print("Getting metadata...")
        
        # Get all languages
        self.cursor.execute("SELECT DISTINCT language FROM languages")
        self.unique_languages = {row["language"] for row in self.cursor.fetchall()}
        self.master_index["languages"] = sorted(list(self.unique_languages))
        
        # Get all topics
        self.cursor.execute("SELECT DISTINCT topic FROM topics")
        self.unique_topics = {row["topic"] for row in self.cursor.fetchall()}
        self.master_index["topics"] = sorted(list(self.unique_topics))
        
        # Get all difficulties
        self.cursor.execute("SELECT DISTINCT difficulty_level FROM difficulties")
        self.unique_difficulties = {row["difficulty_level"] for row in self.cursor.fetchall()}
        self.master_index["difficulties"] = sorted(list(self.unique_difficulties))
        
        print(f"Found {len(self.unique_languages)} languages, {len(self.unique_topics)} topics, and {len(self.unique_difficulties)} difficulty levels")
    
    def extract_pair_exercises(self):
        """Extract all pair exercises."""
        print("Extracting pair exercises...")
        
        # Get all pair exercises with metadata
        self.cursor.execute("""
            SELECT 
                e.id as exercise_id,
                e.exercise_name,
                l.language,
                t.topic,
                d.difficulty_level,
                p.language_1_content as english_content,
                p.language_2_content as target_language_content
            FROM exercises_info e
            JOIN pair_exercises p ON e.id = p.exercise_id
            JOIN languages l ON e.language_id = l.id
            JOIN topics t ON e.topic_id = t.id
            JOIN difficulties d ON e.difficulty_id = d.id
        """)
        
        pairs = self.cursor.fetchall()
        print(f"Found {len(pairs)} pair exercises")
        
        # Process each pair exercise
        for pair in tqdm(pairs, desc="Processing pair exercises"):
            exercise_id = pair["exercise_id"]
            language = pair["language"]
            topic = pair["topic"]
            difficulty = pair["difficulty_level"]
            eng_text = pair["english_content"]
            target_text = pair["target_language_content"]
            
            # Create directory structure: language/topic/difficulty/pairs/exercise_id
            lesson_dir = self.output_dir / language / topic / difficulty / "pairs" / str(exercise_id)
            audio_dir = lesson_dir / "audio"
            audio_dir.mkdir(parents=True, exist_ok=True)
            
            # Extract audio files
            eng_audio_path = self._extract_audio_for_text(eng_text, "English", lesson_dir, "eng")
            target_audio_path = self._extract_audio_for_text(target_text, language, lesson_dir, "target")
            
            # Create lesson JSON
            lesson_data = {
                "id": exercise_id,
                "type": "pair",
                "name": pair["exercise_name"],
                "language": language,
                "topic": topic,
                "difficulty": difficulty,
                "content": {
                    "english": {
                        "text": eng_text,
                        "audio": eng_audio_path
                    },
                    "target_language": {
                        "text": target_text,
                        "audio": target_audio_path
                    }
                }
            }
            
            # Save lesson JSON
            self._save_json_file(lesson_data, lesson_dir / "lesson.json")
            
            # Add to master index
            index_entry = {
                "id": exercise_id,
                "name": pair["exercise_name"],
                "language": language,
                "topic": topic,
                "difficulty": difficulty,
                "path": f"{language}/{topic}/{difficulty}/pairs/{exercise_id}/lesson.json"
            }
            self.master_index["lessons"]["pairs"].append(index_entry)
            
            # Update stats
            self.master_index["stats"]["total_lessons"] += 1
    
    def extract_translation_exercises(self):
        """Extract all translation exercises."""
        print("Extracting translation exercises...")
        
        # Get all translation exercises with metadata
        self.cursor.execute("""
            SELECT 
                e.id as exercise_id,
                e.exercise_name,
                l.language,
                t.topic,
                d.difficulty_level,
                te.language_1_content as english_content,
                te.language_2_content as target_language_content
            FROM exercises_info e
            JOIN translation_exercises te ON e.id = te.exercise_id
            JOIN languages l ON e.language_id = l.id
            JOIN topics t ON e.topic_id = t.id
            JOIN difficulties d ON e.difficulty_id = d.id
        """)
        
        translations = self.cursor.fetchall()
        print(f"Found {len(translations)} translation exercises")
        
        # Process each translation exercise
        for translation in tqdm(translations, desc="Processing translation exercises"):
            exercise_id = translation["exercise_id"]
            language = translation["language"]
            topic = translation["topic"]
            difficulty = translation["difficulty_level"]
            eng_text = translation["english_content"]
            target_text = translation["target_language_content"]
            
            # Create directory structure: language/topic/difficulty/translations/exercise_id
            lesson_dir = self.output_dir / language / topic / difficulty / "translations" / str(exercise_id)
            audio_dir = lesson_dir / "audio"
            audio_dir.mkdir(parents=True, exist_ok=True)
            
            # Extract audio files
            eng_audio_path = self._extract_audio_for_text(eng_text, "English", lesson_dir, "eng")
            target_audio_path = self._extract_audio_for_text(target_text, language, lesson_dir, "target")
            
            # Create lesson JSON
            lesson_data = {
                "id": exercise_id,
                "type": "translation",
                "name": translation["exercise_name"],
                "language": language,
                "topic": topic,
                "difficulty": difficulty,
                "content": {
                    "english": {
                        "text": eng_text,
                        "audio": eng_audio_path
                    },
                    "target_language": {
                        "text": target_text,
                        "audio": target_audio_path
                    }
                }
            }
            
            # Save lesson JSON
            self._save_json_file(lesson_data, lesson_dir / "lesson.json")
            
            # Add to master index
            index_entry = {
                "id": exercise_id,
                "name": translation["exercise_name"],
                "language": language,
                "topic": topic,
                "difficulty": difficulty,
                "path": f"{language}/{topic}/{difficulty}/translations/{exercise_id}/lesson.json"
            }
            self.master_index["lessons"]["translations"].append(index_entry)
            
            # Update stats
            self.master_index["stats"]["total_lessons"] += 1
    
    def extract_conversation_exercises(self):
        """Extract all conversation exercises."""
        print("Extracting conversation exercises...")
        
        # Get all conversation exercises with metadata
        self.cursor.execute("""
            SELECT DISTINCT
                e.id as exercise_id,
                e.exercise_name,
                l.language,
                t.topic,
                d.difficulty_level
            FROM exercises_info e
            JOIN conversation_exercises ce ON e.id = ce.exercise_id
            JOIN languages l ON e.language_id = l.id
            JOIN topics t ON e.topic_id = t.id
            JOIN difficulties d ON e.difficulty_id = d.id
        """)
        
        conversations = self.cursor.fetchall()
        print(f"Found {len(conversations)} conversation exercises")
        
        # Process each conversation exercise
        for conversation in tqdm(conversations, desc="Processing conversation exercises"):
            exercise_id = conversation["exercise_id"]
            language = conversation["language"]
            topic = conversation["topic"]
            difficulty = conversation["difficulty_level"]
            
            # Get conversation messages
            self.cursor.execute("""
                SELECT
                    conversation_order,
                    speaker,
                    message
                FROM conversation_exercises
                WHERE exercise_id = ?
                ORDER BY conversation_order
            """, (exercise_id,))
            
            messages = self.cursor.fetchall()
            
            # Get conversation summary if available
            self.cursor.execute("""
                SELECT summary
                FROM conversation_summaries
                WHERE exercise_id = ?
            """, (exercise_id,))
            
            summary_row = self.cursor.fetchone()
            summary = summary_row["summary"] if summary_row else None
            
            # Create directory structure: language/topic/difficulty/conversations/exercise_id
            lesson_dir = self.output_dir / language / topic / difficulty / "conversations" / str(exercise_id)
            audio_dir = lesson_dir / "audio"
            audio_dir.mkdir(parents=True, exist_ok=True)
            
            # Process messages and extract audio
            conversation_messages = []
            for msg in messages:
                order = msg["conversation_order"]
                speaker = msg["speaker"]
                message = msg["message"]
                
                # Extract audio for this message
                audio_path = self._extract_audio_for_text(
                    message, language, lesson_dir, f"msg_{order}"
                )
                
                conversation_messages.append({
                    "order": order,
                    "speaker": speaker,
                    "message": message,
                    "audio": audio_path
                })
            
            # Create lesson JSON
            lesson_data = {
                "id": exercise_id,
                "type": "conversation",
                "name": conversation["exercise_name"],
                "language": language,
                "topic": topic,
                "difficulty": difficulty,
                "summary": summary,
                "messages": conversation_messages
            }
            
            # Save lesson JSON
            self._save_json_file(lesson_data, lesson_dir / "lesson.json")
            
            # Add to master index
            index_entry = {
                "id": exercise_id,
                "name": conversation["exercise_name"],
                "language": language,
                "topic": topic,
                "difficulty": difficulty,
                "path": f"{language}/{topic}/{difficulty}/conversations/{exercise_id}/lesson.json",
                "message_count": len(conversation_messages)
            }
            self.master_index["lessons"]["conversations"].append(index_entry)
            
            # Update stats
            self.master_index["stats"]["total_lessons"] += 1
    
    def create_master_index(self):
        """Create and save the master index file."""
        print("Creating master index...")
        
        # Update final stats
        self.master_index["stats"]["total_audio_files"] = self.extracted_audio_files
        
        # Add language-specific stats
        language_stats = {}
        for language in self.unique_languages:
            pair_count = len([
                lesson for lesson in self.master_index["lessons"]["pairs"]
                if lesson["language"] == language
            ])
            translation_count = len([
                lesson for lesson in self.master_index["lessons"]["translations"]
                if lesson["language"] == language
            ])
            conversation_count = len([
                lesson for lesson in self.master_index["lessons"]["conversations"]
                if lesson["language"] == language
            ])
            
            language_stats[language] = {
                "pairs": pair_count,
                "translations": translation_count,
                "conversations": conversation_count,
                "total": pair_count + translation_count + conversation_count
            }
        
        self.master_index["language_stats"] = language_stats
        
        # Save the master index
        self._save_json_file(self.master_index, self.output_dir / "index.json")
        
        # Create README file with usage instructions
        readme_content = """# Language Learning Content

This directory contains extracted language learning content in a structured format.

## Structure

- `index.json`: Master index of all content
- `/<language>/<topic>/<difficulty>/<exercise_type>/<exercise_id>/lesson.json`: Individual lesson files
- `/<language>/<topic>/<difficulty>/<exercise_type>/<exercise_id>/audio/`: Audio files for the lesson

## Usage

1. Load the master index to get an overview of available content:
   ```python
   with open('index.json', 'r', encoding='utf-8') as f:
       index = json.load(f)
   ```

2. Access individual lessons by following the paths in the index:
   ```python
   lesson_path = index['lessons']['pairs'][0]['path']
   with open(lesson_path, 'r', encoding='utf-8') as f:
       lesson = json.load(f)
   ```

3. Audio files are referenced relative to the lesson file:
   ```python
   # Assuming 'lesson' is loaded as above
   audio_path = os.path.join(os.path.dirname(lesson_path), lesson['content']['english']['audio'])
   ```

## Content Types

- **Pairs**: Simple word or phrase pairs (English + target language)
- **Translations**: Longer sentence translations
- **Conversations**: Multi-turn dialogues with multiple speakers

"""
        with open(self.output_dir / "README.md", "w", encoding="utf-8") as f:
            f.write(readme_content)
    
    def run(self):
        """Run the full extraction process."""
        try:
            # Get metadata
            self.get_all_metadata()
            
            # Extract different types of exercises
            self.extract_pair_exercises()
            self.extract_translation_exercises()
            self.extract_conversation_exercises()
            
            # Create master index
            self.create_master_index()
            
            # Print summary
            print("\nExtraction complete!")
            print(f"Total lessons extracted: {self.master_index['stats']['total_lessons']}")
            print(f"Total audio files extracted: {self.extracted_audio_files}")
            print(f"Content saved to: {self.output_dir}")
            print(f"Master index saved to: {self.output_dir / 'index.json'}")
            
        except Exception as e:
            print(f"Error during extraction: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # Close database connection
            self.conn.close()

def main():
    """Parse arguments and run the content extractor."""
    parser = argparse.ArgumentParser(
        description="Extract language learning content to a structured filesystem with JSON files"
    )
    parser.add_argument(
        "--db_path",
        default="./database/languageLearningDatabase.db",
        help="Path to the SQLite database (default: ./database/languageLearningDatabase.db)",
    )
    parser.add_argument(
        "--output_dir",
        default="./language_learning_content",
        help="Directory to store extracted content (default: ./language_learning_content)",
    )
    
    args = parser.parse_args()
    
    # Start measuring time
    start_time = time.time()
    
    # Create and run the extractor
    extractor = LanguageLearningExtractor(args.db_path, args.output_dir)
    extractor.run()
    
    # End measuring time
    elapsed_time = time.time() - start_time
    print(f"Total execution time: {elapsed_time:.2f} seconds")

if __name__ == "__main__":
    main()