#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Audio Extraction and Database Reference Tool

This script:
1. Extracts audio files from the database to a structured file system
2. Creates a new database without the binary audio data
3. Adds file path references in the new database to point to the extracted files

Usage:
    python extract_audio_and_reference.py --source_db PATH --target_db PATH --output_dir PATH
"""

import argparse
import os
import sqlite3
import hashlib
from pathlib import Path
import time
from datetime import datetime
import wave
import json
from tqdm import tqdm

class AudioExtractorAndReferencer:
    """Extract audio data and create a referenced database."""
    
    def __init__(self, source_db: str, target_db: str, output_dir: str):
        """
        Initialize the audio extractor and reference creator.
        
        Args:
            source_db: Path to the source SQLite database
            target_db: Path to the target SQLite database (will be created)
            output_dir: Directory to store extracted audio files
        """
        self.source_db = Path(source_db)
        self.target_db = Path(target_db)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Create target database (remove if exists)
        if self.target_db.exists():
            os.remove(self.target_db)
        
        # Connect to the source database
        self.source_conn = sqlite3.connect(str(self.source_db))
        self.source_conn.row_factory = sqlite3.Row
        self.source_cursor = self.source_conn.cursor()
        
        # Connect to the target database
        self.target_conn = sqlite3.connect(str(self.target_db))
        self.target_conn.row_factory = sqlite3.Row
        self.target_cursor = self.target_conn.cursor()
        
        # Metadata to track extraction
        self.metadata_path = self.output_dir / "extraction_metadata.json"
        self.stats = {
            "total_audio_files": 0,
            "extracted_files": 0,
            "languages": {},
            "exercise_types": {},
            "total_size_before": 0,
            "total_size_after": 0,
            "start_time": datetime.now().isoformat(),
            "end_time": None
        }
        
    def _get_text_hash(self, text: str) -> str:
        """Generate a hash for text to use in filenames."""
        return hashlib.md5(text.encode("utf-8")).hexdigest()[:10]
    
    def _sanitize_filename(self, name: str) -> str:
        """Convert string to a safe filename."""
        # Replace any non-alphanumeric characters with underscores
        return ''.join(c if c.isalnum() else '_' for c in name)
    
    def _get_audio_count(self) -> int:
        """Get the total number of audio recordings."""
        self.source_cursor.execute("SELECT COUNT(*) FROM pronunciation_audio")
        return self.source_cursor.fetchone()[0]
    
    def _get_audio_size(self) -> int:
        """Get the total size of audio data in the database."""
        self.source_cursor.execute("SELECT SUM(LENGTH(audio_data)) FROM pronunciation_audio")
        result = self.source_cursor.fetchone()[0]
        return result if result else 0
    
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
    
    def _save_stats(self):
        """Save extraction statistics to a JSON file."""
        self.stats["end_time"] = datetime.now().isoformat()
        
        with open(self.metadata_path, "w", encoding="utf-8") as f:
            json.dump(self.stats, f, ensure_ascii=False, indent=2)
    
    def clone_database_structure(self):
        """Clone all tables, indices, and triggers from source to target database."""
        print("Cloning database structure...")
        
        # Get all table names
        self.source_cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row['name'] for row in self.source_cursor.fetchall() 
                  if row['name'] != 'sqlite_sequence' and not row['name'].startswith('sqlite_')]
        
        print(f"Found {len(tables)} tables to clone")
        
        # Create audio_file_paths table for storing references
        self.target_cursor.execute("""
            CREATE TABLE IF NOT EXISTS audio_file_paths (
                id INTEGER PRIMARY KEY,
                audio_id INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL
            )
        """)
        
        # For each table, clone structure
        for table in tables:
            print(f"Cloning structure for table: {table}")
            
            # Get table schema
            self.source_cursor.execute(f"SELECT sql FROM sqlite_master WHERE name='{table}';")
            schema = self.source_cursor.fetchone()['sql']
            
            # For the pronunciation_audio table, modify schema to allow NULL for audio_data
            if table == 'pronunciation_audio':
                print("Modifying pronunciation_audio table schema to allow NULL for audio_data...")
                # Get column definitions
                self.source_cursor.execute(f"PRAGMA table_info({table});")
                columns = self.source_cursor.fetchall()
                
                # Build a new CREATE TABLE statement without NOT NULL for audio_data
                new_schema = "CREATE TABLE pronunciation_audio (\n"
                for col in columns:
                    col_name = col['name']
                    col_type = col['type']
                    if col_name == 'audio_data':
                        # Remove NOT NULL constraint for audio_data
                        new_schema += f"    {col_name} {col_type},\n"
                    else:
                        # Keep other constraints as they are
                        not_null = "NOT NULL" if col['notnull'] else ""
                        pk = "PRIMARY KEY" if col['pk'] else ""
                        default = f"DEFAULT {col['dflt_value']}" if col['dflt_value'] is not None else ""
                        new_schema += f"    {col_name} {col_type} {not_null} {pk} {default},\n"
                
                # Add unique constraint if it exists in the original schema
                if "UNIQUE" in schema:
                    # Extract the UNIQUE constraint
                    unique_start = schema.find("UNIQUE")
                    unique_end = schema.find(")", unique_start)
                    unique_constraint = schema[unique_start:unique_end+1]
                    new_schema += f"    {unique_constraint}\n"
                else:
                    # Remove the trailing comma
                    new_schema = new_schema.rstrip(",\n") + "\n"
                
                new_schema += ");"
                
                # Create modified table in target database
                self.target_cursor.execute(new_schema)
            else:
                # Create the table in the target database with original schema
                self.target_cursor.execute(schema)
        
        # Copy indices and triggers
        print("Copying indices and triggers...")
        self.source_cursor.execute(
            """SELECT sql FROM sqlite_master 
               WHERE type IN ('index', 'trigger') 
               AND sql IS NOT NULL
               AND tbl_name NOT LIKE 'sqlite_%';"""
        )
        for row in self.source_cursor.fetchall():
            if row['sql'] and not row['sql'].startswith('CREATE TABLE'):
                try:
                    self.target_cursor.execute(row['sql'])
                except sqlite3.OperationalError as e:
                    print(f"Warning: Could not create index or trigger: {e}")
    
    def copy_tables_except_audio(self):
        """Copy all data from source to target, except audio_data."""
        print("Copying table data (excluding audio data)...")
        
        # Get all table names
        self.source_cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row['name'] for row in self.source_cursor.fetchall() 
                  if row['name'] != 'sqlite_sequence' and not row['name'].startswith('sqlite_')
                  and row['name'] != 'pronunciation_audio']
        
        # Copy all tables except pronunciation_audio (we'll handle that separately)
        for table in tables:
            print(f"Copying data for table: {table}")
            
            # Get total count for progress bar
            self.source_cursor.execute(f"SELECT COUNT(*) FROM {table};")
            total_rows = self.source_cursor.fetchone()[0]
            
            if total_rows == 0:
                print(f"Table {table} is empty, skipping...")
                continue
            
            total_chunks = (total_rows + 999) // 1000  # Ceiling division
            
            # Use a transaction for better performance
            self.target_conn.execute("BEGIN TRANSACTION;")
            
            # Process in chunks
            chunk_size = 1000
            for offset in tqdm(range(0, total_rows, chunk_size), 
                              desc=f"Copying {table} data", total=total_chunks):
                # Get a chunk of data
                self.source_cursor.execute(
                    f"SELECT * FROM {table} LIMIT {chunk_size} OFFSET {offset};"
                )
                rows = self.source_cursor.fetchall()
                if not rows:
                    break
                
                # Get column names from the first row
                columns = rows[0].keys()
                
                # Insert into target database
                placeholders = ', '.join(['?' for _ in columns])
                self.target_cursor.executemany(
                    f"INSERT INTO {table} VALUES ({placeholders});",
                    [tuple(row[col] for col in columns) for row in rows]
                )
            
            # Commit the transaction
            self.target_conn.execute("COMMIT;")
    
    def extract_audio_and_update_references(self):
        """Extract audio files and update database references."""
        print("Extracting audio files and updating references...")
        
        # Get total count for progress bar
        self.source_cursor.execute("SELECT COUNT(*) FROM pronunciation_audio;")
        total_rows = self.source_cursor.fetchone()[0]
        
        if total_rows == 0:
            print("No audio records found, skipping extraction...")
            return
        
        self.stats["total_audio_files"] = total_rows
        self.stats["total_size_before"] = self._get_audio_size()
        
        total_chunks = (total_rows + 99) // 100  # Ceiling division
        
        # Get all audio records
        for offset in tqdm(range(0, total_rows, 100), 
                          desc="Extracting audio files", total=total_chunks):
            # Get a chunk of data
            self.source_cursor.execute(
                """
                SELECT 
                    id, text, language, exercise_type, 
                    topic, difficulty, audio_data,
                    created_at
                FROM pronunciation_audio
                LIMIT 100 OFFSET ?;
                """,
                (offset,)
            )
            
            rows = self.source_cursor.fetchall()
            if not rows:
                break
            
            # Process each row
            for row in rows:
                audio_id = row["id"]
                text = row["text"]
                language = row["language"]
                exercise_type = row["exercise_type"]
                topic = row["topic"] or "general"
                difficulty = row["difficulty"] or "unknown"
                audio_data = row["audio_data"]
                created_at = row["created_at"]
                
                # Skip if no audio data
                if not audio_data:
                    continue
                
                # Generate a filename based on the text hash
                text_hash = self._get_text_hash(text)
                safe_text = self._sanitize_filename(text[:30])
                filename = f"{text_hash}_{safe_text}.wav"
                
                # Create directory structure: language/exercise_type/topic/difficulty
                rel_dir = Path(language) / exercise_type / topic / difficulty
                abs_dir = self.output_dir / rel_dir
                abs_dir.mkdir(parents=True, exist_ok=True)
                
                # Full path to the audio file
                abs_path = abs_dir / filename
                rel_path = rel_dir / filename
                
                # Save the audio file
                if self._save_audio_file(audio_data, abs_path):
                    # Update stats
                    self.stats["extracted_files"] += 1
                    self.stats["languages"][language] = self.stats["languages"].get(language, 0) + 1
                    self.stats["exercise_types"][exercise_type] = self.stats["exercise_types"].get(exercise_type, 0) + 1
                    
                    # Insert into target database without audio_data
                    self.target_cursor.execute(
                        """
                        INSERT INTO pronunciation_audio
                        (id, text, language, audio_data, exercise_type, topic, difficulty, created_at)
                        VALUES (?, ?, ?, NULL, ?, ?, ?, ?);
                        """,
                        (audio_id, text, language, exercise_type, topic, difficulty, created_at)
                    )
                    
                    # Add the file path reference
                    self.target_cursor.execute(
                        """
                        INSERT INTO audio_file_paths
                        (audio_id, file_path, created_at)
                        VALUES (?, ?, ?);
                        """,
                        (audio_id, str(rel_path), datetime.now().isoformat())
                    )
                    
                    # Commit every so often
                    if self.stats["extracted_files"] % 100 == 0:
                        self.target_conn.commit()
                        self._save_stats()
            
        # Final commit
        self.target_conn.commit()
    
    def add_helper_functions(self):
        """Add helper functions to the database for retrieving audio."""
        print("Adding helper view for audio retrieval...")
        
        # Create a view that joins pronunciation_audio with audio_file_paths
        self.target_cursor.execute("""
            CREATE VIEW IF NOT EXISTS audio_with_paths AS
            SELECT 
                pa.id, pa.text, pa.language, pa.exercise_type, pa.topic, pa.difficulty,
                afp.file_path
            FROM pronunciation_audio pa
            LEFT JOIN audio_file_paths afp ON pa.id = afp.audio_id;
        """)
        
        # Add example code as a comment in the database (as close as we can get to documentation)
        self.target_cursor.execute("""
            CREATE TABLE IF NOT EXISTS db_documentation (
                id INTEGER PRIMARY KEY,
                topic TEXT NOT NULL,
                description TEXT NOT NULL
            );
        """)
        
        
        self.target_conn.commit()
    
    def run(self):
        """Run the full extraction and database reference process."""
        try:
            # Clone database structure
            self.clone_database_structure()
            
            # Copy all tables except pronunciation_audio
            self.copy_tables_except_audio()
            
            # Extract audio and update references
            self.extract_audio_and_update_references()
            
            # Add helper functions
            self.add_helper_functions()
            
            # Get final stats
            self.stats["total_size_after"] = os.path.getsize(self.target_db) / (1024 * 1024)  # MB
            self._save_stats()
            
            # Print summary
            print("\nExtraction and database reference creation complete!")
            print(f"Total audio files extracted: {self.stats['extracted_files']}")
            print(f"Files saved to: {self.output_dir}")
            print(f"New database saved to: {self.target_db}")
            print(f"Original database size: {self.stats['total_size_before'] / (1024*1024):.2f} MB")
            print(f"New database size: {self.stats['total_size_after']:.2f} MB")
            
            # Print usage instructions
            print("\nTo use the new database:")
            print("1. Replace your original database with the new one")
            print("2. Update your code to use the audio_with_paths view for retrieving audio")
            print("3. Check the db_documentation table for example code")
            
        except Exception as e:
            print(f"Error during extraction and reference creation: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # Save stats even if there was an error
            self._save_stats()
            
            # Close connections
            self.source_conn.close()
            self.target_conn.close()

def main():
    """Parse arguments and run the audio extractor and referencer."""
    parser = argparse.ArgumentParser(
        description="Extract audio from database to files and create references"
    )
    parser.add_argument(
        "--source_db",
        default="./database/languageLearningDatabase.db",
        help="Path to the source SQLite database (default: ./database/languageLearningDatabase.db)",
    )
    parser.add_argument(
        "--target_db",
        default="./database/languageLearningDatabase_referenced.db",
        help="Path to the target SQLite database (default: ./database/languageLearningDatabase_referenced.db)",
    )
    parser.add_argument(
        "--output_dir",
        default="./audio_files",
        help="Directory to store extracted audio files (default: ./audio_files)",
    )
    
    args = parser.parse_args()
    
    # Start measuring time
    start_time = time.time()
    
    # Create and run the extractor and referencer
    extractor = AudioExtractorAndReferencer(
        args.source_db, args.target_db, args.output_dir
    )
    
    extractor.run()
    
    # End measuring time
    elapsed_time = time.time() - start_time
    print(f"Total execution time: {elapsed_time:.2f} seconds")

if __name__ == "__main__":
    main()