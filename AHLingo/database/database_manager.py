import sqlite3
from typing import List, Dict
from pathlib import Path

class LanguageDB:
    def __init__(self, db_path: str = "./languageLearningDatabase.db"):
        """Initialize the database connection and create tables if they don't exist."""
        self.db_path = Path(db_path)
        # Ensure directory exists
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()
        self._initialize()

        # print the number of rows in the database
        self.cursor.execute("SELECT COUNT(*) FROM languages")

    def _initialize(self):
        """Create all necessary tables if they don't exist."""
        table_creation_queries = [
            """CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
            )""",
            """CREATE TABLE IF NOT EXISTS difficulties (
                id INTEGER PRIMARY KEY,
                difficulty_level TEXT NOT NULL UNIQUE
            )""",
            """CREATE TABLE IF NOT EXISTS languages (
                id INTEGER PRIMARY KEY,
                language TEXT NOT NULL UNIQUE
            )""",
            """CREATE TABLE IF NOT EXISTS topics (
                id INTEGER PRIMARY KEY,
                topic TEXT NOT NULL UNIQUE
            )""",
            """CREATE TABLE IF NOT EXISTS exercises_info (
                id INTEGER PRIMARY KEY,
                exercise_name TEXT NOT NULL UNIQUE,
                topic_id INTEGER NOT NULL,
                difficulty_id INTEGER NOT NULL,
                language_id INTEGER NOT NULL,
                FOREIGN KEY (topic_id) REFERENCES topics (id),
                FOREIGN KEY (difficulty_id) REFERENCES difficulties (id),
                FOREIGN KEY (language_id) REFERENCES languages (id)
            )""",
            """CREATE TABLE IF NOT EXISTS pair_exercises (
                id INTEGER PRIMARY KEY,
                exercise_id INTEGER NOT NULL,
                language_1 TEXT NOT NULL,
                language_2 TEXT NOT NULL,
                language_1_content TEXT NOT NULL,
                language_2_content TEXT NOT NULL,
                FOREIGN KEY (exercise_id) REFERENCES exercises_info (id)
            )""",
            """CREATE TABLE IF NOT EXISTS conversation_exercises (
                id INTEGER PRIMARY KEY,
                exercise_id INTEGER NOT NULL,
                conversation_order INTEGER,
                speaker TEXT NOT NULL,
                message TEXT NOT NULL,
                FOREIGN KEY (exercise_id) REFERENCES exercises_info (id)
            )""",
            """CREATE TABLE IF NOT EXISTS conversation_summaries (
                id INTEGER PRIMARY KEY,
                exercise_id INTEGER NOT NULL,
                summary TEXT NOT NULL,
                FOREIGN KEY (exercise_id) REFERENCES exercises_info (id)
            )""",
            """CREATE TABLE IF NOT EXISTS translation_exercises (
                id INTEGER PRIMARY KEY,
                exercise_id INTEGER NOT NULL,
                language_1 TEXT NOT NULL,
                language_2 TEXT NOT NULL,
                language_1_content TEXT NOT NULL,
                language_2_content TEXT NOT NULL,
                FOREIGN KEY (exercise_id) REFERENCES exercises_info (id)
            )"""
        ]
        
        for query in table_creation_queries:
            self.cursor.execute(query)
        self.conn.commit()

    def _get_or_create_topic(self, topic: str) -> int:
        """Get topic ID or create if it doesn't exist."""
        self.cursor.execute("SELECT id FROM topics WHERE topic = ?", (topic,))
        result = self.cursor.fetchone()
        if result:
            return result[0]
        
        self.cursor.execute("INSERT INTO topics (topic) VALUES (?)", (topic,))
        self.conn.commit()
        return self.cursor.lastrowid

    def _get_or_create_language(self, language: str) -> int:
        """Get language ID or create if it doesn't exist."""
        self.cursor.execute("SELECT id FROM languages WHERE language = ?", (language,))
        result = self.cursor.fetchone()
        if result:
            return result[0]
        
        self.cursor.execute("INSERT INTO languages (language) VALUES (?)", (language,))
        self.conn.commit()
        return self.cursor.lastrowid

    def _get_or_create_difficulty(self, difficulty_level: str) -> int:
        """Get difficulty ID or create if it doesn't exist."""
        self.cursor.execute("SELECT id FROM difficulties WHERE difficulty_level = ?", (difficulty_level,))
        result = self.cursor.fetchone()
        if result:
            return result[0]
        
        self.cursor.execute("INSERT INTO difficulties (difficulty_level) VALUES (?)", (difficulty_level,))
        self.conn.commit()
        return self.cursor.lastrowid

    def add_conversation_exercise(self, exercise_name: str, language: str, topic: str,
                                difficulty_level: str, conversations: List[Dict[str, str]], 
                                summary: str) -> int:
        """Add a conversation exercise to the database."""
        language_id = self._get_or_create_language(language)
        topic_id = self._get_or_create_topic(topic)
        difficulty_id = self._get_or_create_difficulty(difficulty_level)

        self.cursor.execute(
            """INSERT INTO exercises_info 
               (exercise_name, language_id, topic_id, difficulty_id) 
               VALUES (?, ?, ?, ?)""",
            (exercise_name, language_id, topic_id, difficulty_id)
        )
        exercise_id = self.cursor.lastrowid

        for idx, conv in enumerate(conversations):
            self.cursor.execute(
                """INSERT INTO conversation_exercises 
                   (exercise_id, conversation_order, speaker, message) 
                   VALUES (?, ?, ?, ?)""",
                (exercise_id, idx, conv['speaker'], conv['message'])
            )

        self.cursor.execute(
            """INSERT INTO conversation_summaries 
               (exercise_id, summary) VALUES (?, ?)""",
            (exercise_id, summary)
        )
        
        self.conn.commit()
        return exercise_id

    def add_pair_exercise(self, exercise_name: str, language: str, topic: str,
                         difficulty_level: str, language_1: str, language_2: str,
                         language_1_content: str, language_2_content: str) -> int:
        """Add a pair exercise to the database."""
        # Check if pair exercise already exists
        self.cursor.execute(
            """SELECT COUNT(*) FROM pair_exercises 
               WHERE language_1_content = ? AND language_2_content = ?""",
            (language_1_content, language_2_content)
        )
        if self.cursor.fetchone()[0] > 0:
            return -1  # Exercise already exists

        language_id = self._get_or_create_language(language)
        topic_id = self._get_or_create_topic(topic)
        difficulty_id = self._get_or_create_difficulty(difficulty_level)

        self.cursor.execute(
            """INSERT INTO exercises_info 
               (exercise_name, language_id, topic_id, difficulty_id) 
               VALUES (?, ?, ?, ?)""",
            (exercise_name, language_id, topic_id, difficulty_id)
        )
        exercise_id = self.cursor.lastrowid

        self.cursor.execute(
            """INSERT INTO pair_exercises 
               (exercise_id, language_1, language_2, language_1_content, language_2_content) 
               VALUES (?, ?, ?, ?, ?)""",
            (exercise_id, language_1, language_2, language_1_content, language_2_content)
        )
        
        self.conn.commit()
        return exercise_id

    def add_translation_exercise(self, exercise_name: str, language: str, topic: str,
                               difficulty_level: str, language_1: str, language_2: str,
                               language_1_content: str, language_2_content: str) -> int:
        """Add a translation exercise to the database."""
        language_id = self._get_or_create_language(language)
        topic_id = self._get_or_create_topic(topic)
        difficulty_id = self._get_or_create_difficulty(difficulty_level)

        self.cursor.execute(
            """INSERT INTO exercises_info 
               (exercise_name, language_id, topic_id, difficulty_id) 
               VALUES (?, ?, ?, ?)""",
            (exercise_name, language_id, topic_id, difficulty_id)
        )
        exercise_id = self.cursor.lastrowid

        self.cursor.execute(
            """INSERT INTO translation_exercises 
               (exercise_id, language_1, language_2, language_1_content, language_2_content) 
               VALUES (?, ?, ?, ?, ?)""",
            (exercise_id, language_1, language_2, language_1_content, language_2_content)
        )
        
        self.conn.commit()
        return exercise_id

    def get_languages(self) -> List[str]:
        """Get all available languages."""
        self.cursor.execute("SELECT language FROM languages")
        return [row['language'] for row in self.cursor.fetchall()]

    def get_difficulty_levels(self) -> List[str]:
        """Get all difficulty levels."""
        self.cursor.execute("SELECT difficulty_level FROM difficulties")
        return [row['difficulty_level'] for row in self.cursor.fetchall()]

    def get_difficulty_by_language(self, language: str) -> List[str]:
        """Get available difficulty levels for a specific language."""
        self.cursor.execute(
            """SELECT DISTINCT d.difficulty_level 
               FROM difficulties d
               JOIN exercises_info e ON d.id = e.difficulty_id
               JOIN languages l ON e.language_id = l.id
               WHERE l.language = ?""",
            (language,)
        )
        return [row['difficulty_level'] for row in self.cursor.fetchall()]

    def get_topics_by_language_difficulty(self, language: str, difficulty: str) -> List[str]:
        """Get available topics for a specific language and difficulty level."""
        self.cursor.execute(
            """SELECT DISTINCT t.topic 
               FROM topics t
               JOIN exercises_info e ON t.id = e.topic_id
               JOIN languages l ON e.language_id = l.id
               JOIN difficulties d ON e.difficulty_id = d.id
               WHERE l.language = ? AND d.difficulty_level = ?""",
            (language, difficulty)
        )
        return [row['topic'] for row in self.cursor.fetchall()]

    def get_random_pair_exercise(self, language: str, difficulty: str, topic: str, limit: int = 10) -> List[Dict]:
        """Get random pair exercises for given criteria."""
        self.cursor.execute(
            """SELECT e.exercise_name, p.language_1, p.language_2, 
                      p.language_1_content, p.language_2_content
               FROM exercises_info e
               JOIN pair_exercises p ON e.id = p.exercise_id
               JOIN topics t ON e.topic_id = t.id
               JOIN difficulties d ON e.difficulty_id = d.id
               WHERE p.language_1 = ? AND p.language_2 = ? 
               AND t.topic = ? AND d.difficulty_level = ?
               ORDER BY RANDOM() LIMIT ?""",
            ('English', language, topic, difficulty, limit)
        )
        return [dict(row) for row in self.cursor.fetchall()]

    def close(self):
        """Close the database connection."""
        self.conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()