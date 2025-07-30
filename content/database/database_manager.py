# -*- coding: utf-8 -*-
import sqlite3
from typing import List, Dict, Optional
from pathlib import Path
from datetime import datetime, timedelta


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
        self.cursor.execute("SELECT COUNT(*) FROM topics")
        print(f"Number of topics in the database: {self.cursor.fetchone()[0]}")

        # print number of exercises in the database
        self.cursor.execute("SELECT COUNT(*) FROM exercises_info")
        print(f"Number of exercises in the database: {self.cursor.fetchone()[0]}")

    def _initialize(self):
        """Create all necessary tables if they don't exist."""
        table_creation_queries = [
            """CREATE TABLE IF NOT EXISTS pronunciation_audio (
                id INTEGER PRIMARY KEY,
                text TEXT NOT NULL,
                language TEXT NOT NULL,
                audio_data BLOB NOT NULL,
                exercise_type TEXT NOT NULL,
                topic TEXT,
                difficulty TEXT,
                created_at TIMESTAMP NOT NULL,
                UNIQUE(text, language)
            )""",
            """CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                last_login TIMESTAMP
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
                exercise_type TEXT NOT NULL,
                lesson_id TEXT,
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
            )""",
            """CREATE TABLE IF NOT EXISTS fill_in_blank_exercises (
                id INTEGER PRIMARY KEY,
                exercise_id INTEGER NOT NULL,
                sentence TEXT NOT NULL,
                correct_answer TEXT NOT NULL,
                incorrect_1 TEXT NOT NULL,
                incorrect_2 TEXT NOT NULL,
                blank_position INTEGER NOT NULL,
                translation TEXT NOT NULL,
                FOREIGN KEY (exercise_id) REFERENCES exercises_info (id)
            )""",
            """CREATE TABLE IF NOT EXISTS user_exercise_attempts (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                exercise_id INTEGER NOT NULL,
                is_correct BOOLEAN NOT NULL,
                attempt_date TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (exercise_id) REFERENCES exercises_info (id)
            )""",
            """CREATE TABLE IF NOT EXISTS user_settings (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                setting_name TEXT NOT NULL,
                setting_value TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(user_id, setting_name)
            )""",
            """CREATE TABLE IF NOT EXISTS chat_details (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                language TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                model TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                last_updated TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )""",
            """CREATE TABLE IF NOT EXISTS chat_histories (
                id INTEGER PRIMARY KEY,
                chat_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                FOREIGN KEY (chat_id) REFERENCES chat_details (id)
            )""",
        ]

        for query in table_creation_queries:
            self.cursor.execute(query)
        self.conn.commit()

    def get_most_recent_user(self) -> Optional[str]:
        """Get the username of the most recently logged in user."""
        self.cursor.execute(
            """SELECT name FROM users
               WHERE last_login IS NOT NULL
               ORDER BY last_login DESC LIMIT 1"""
        )
        result = self.cursor.fetchone()
        return result["name"] if result else None

    def update_user_login(self, username: str):
        """Update the last login time for a user."""
        user_id = self._get_or_create_user(username)
        self.cursor.execute(
            "UPDATE users SET last_login = ? WHERE id = ?",
            (datetime.now(), user_id),
        )
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
        self.cursor.execute(
            "SELECT id FROM difficulties WHERE difficulty_level = ?",
            (difficulty_level,),
        )
        result = self.cursor.fetchone()
        if result:
            return result[0]

        self.cursor.execute(
            "INSERT INTO difficulties (difficulty_level) VALUES (?)",
            (difficulty_level,),
        )
        self.conn.commit()
        return self.cursor.lastrowid

    def _get_or_create_user(self, username: str) -> int:
        """Get user ID or create if it doesn't exist."""
        self.cursor.execute("SELECT id FROM users WHERE name = ?", (username,))
        result = self.cursor.fetchone()
        if result:
            return result[0]

        self.cursor.execute(
            "INSERT INTO users (name, last_login) VALUES (?, ?)",
            (username, datetime.now()),
        )
        self.conn.commit()
        return self.cursor.lastrowid

    def create_chat_session(
        self, username: str, language: str, difficulty: str, model: str
    ) -> int:
        """Create a new chat session and return its ID."""
        user_id = self._get_or_create_user(username)
        now = datetime.now()

        self.cursor.execute(
            """INSERT INTO chat_details
               (user_id, language, difficulty, model, created_at, last_updated)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_id, language, difficulty, model, now, now),
        )
        self.conn.commit()
        return self.cursor.lastrowid

    def add_chat_message(self, chat_id: int, role: str, content: str):
        """Add a message to an existing chat session."""
        self.cursor.execute(
            """INSERT INTO chat_histories
               (chat_id, role, content, timestamp)
               VALUES (?, ?, ?, ?)""",
            (chat_id, role, content, datetime.now()),
        )

        # Update last_updated timestamp in chat_details
        self.cursor.execute(
            """UPDATE chat_details
               SET last_updated = ?
               WHERE id = ?""",
            (datetime.now(), chat_id),
        )
        self.conn.commit()

    def get_chat_history(self, chat_id: int) -> List[Dict]:
        """Get all messages from a chat session."""
        self.cursor.execute(
            """SELECT role, content, timestamp
               FROM chat_histories
               WHERE chat_id = ?
               ORDER BY timestamp ASC""",
            (chat_id,),
        )
        return [dict(row) for row in self.cursor.fetchall()]

    def get_user_chats(self, username: str) -> List[Dict]:
        """Get all chat sessions for a user."""
        user_id = self._get_or_create_user(username)
        self.cursor.execute(
            """SELECT id, language, difficulty, model, created_at, last_updated
               FROM chat_details
               WHERE user_id = ?
               ORDER BY last_updated DESC""",
            (user_id,),
        )
        return [dict(row) for row in self.cursor.fetchall()]

    def get_user_settings(self, username: str = None) -> Dict[str, str]:
        """Get all settings for a user."""
        if not username:
            username = self.get_most_recent_user()
        user_id = self._get_or_create_user(username)
        self.cursor.execute(
            """SELECT setting_name, setting_value
               FROM user_settings
               WHERE user_id = ?""",
            (user_id,),
        )
        return {
            row["setting_name"]: row["setting_value"] for row in self.cursor.fetchall()
        }

    def set_user_setting(self, username: str, setting_name: str, setting_value: str):
        """Set a setting for a user."""
        user_id = self._get_or_create_user(username)
        self.cursor.execute(
            """INSERT INTO user_settings (user_id, setting_name, setting_value)
               VALUES (?, ?, ?)
               ON CONFLICT(user_id, setting_name)
               DO UPDATE SET setting_value = ?""",
            (user_id, setting_name, setting_value, setting_value),
        )
        self.conn.commit()

    def get_failed_attempts(self, username: str) -> List[Dict]:
        """Get list of failed exercise attempts for a user."""
        user_id = self._get_or_create_user(username)
        self.cursor.execute(
            """
            SELECT DISTINCT
            ei.id as exercise_id,
            t.topic as exercise_topic,
            CASE
                WHEN pe.id IS NOT NULL THEN 'Pairs'
                WHEN ce.id IS NOT NULL THEN 'Conversation'
                WHEN te.id IS NOT NULL THEN 'Translation'
                WHEN fib.id IS NOT NULL THEN 'Fill in Blank'
                ELSE 'Unknown'
            END as exercise_type,
            uea.attempt_date
            FROM user_exercise_attempts uea
            JOIN exercises_info ei ON uea.exercise_id = ei.id
            JOIN topics t ON ei.topic_id = t.id
            LEFT JOIN pair_exercises pe ON ei.id = pe.exercise_id
            LEFT JOIN conversation_exercises ce ON ei.id = ce.exercise_id
            LEFT JOIN translation_exercises te ON ei.id = te.exercise_id
            LEFT JOIN fill_in_blank_exercises fib ON ei.id = fib.exercise_id
            WHERE uea.user_id = ? AND uea.is_correct = 0
            ORDER BY uea.attempt_date DESC
            """,
            (user_id,),
        )
        return [dict(row) for row in self.cursor.fetchall()]

    def record_exercise_attempt(
        self, username: str, exercise_id: int, is_correct: bool
    ):
        """Record a user's attempt at an exercise."""
        user_id = self._get_or_create_user(username)
        self.cursor.execute(
            """INSERT INTO user_exercise_attempts
               (user_id, exercise_id, is_correct, attempt_date)
               VALUES (?, ?, ?, ?)""",
            (user_id, exercise_id, is_correct, datetime.now()),
        )
        self.conn.commit()

    def get_user_stats(self, username: str) -> Dict:
        """Get statistics for a user's exercise attempts."""
        user_id = self._get_or_create_user(username)

        # Get total attempts, correct answers, and success rate
        self.cursor.execute(
            """SELECT
                COUNT(*) as total_attempts,
                SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers
               FROM user_exercise_attempts
               WHERE user_id = ?""",
            (user_id,),
        )
        result = dict(self.cursor.fetchone())

        # Calculate success rate
        total = result["total_attempts"]
        correct = result["correct_answers"]
        result["success_rate"] = (correct / total * 100) if total > 0 else 0

        # Get recent attempts
        self.cursor.execute(
            """SELECT
                ei.exercise_name,
                uea.is_correct,
                uea.attempt_date
               FROM user_exercise_attempts uea
               JOIN exercises_info ei ON uea.exercise_id = ei.id
               WHERE uea.user_id = ?
               ORDER BY uea.attempt_date DESC
               LIMIT 10""",
            (user_id,),
        )
        result["recent_attempts"] = [dict(row) for row in self.cursor.fetchall()]

        return result

    def get_exercise_stats(self, exercise_id: int) -> Dict:
        """Get statistics for a specific exercise."""
        self.cursor.execute(
            """SELECT
                COUNT(*) as total_attempts,
                SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers
               FROM user_exercise_attempts
               WHERE exercise_id = ?""",
            (exercise_id,),
        )
        result = dict(self.cursor.fetchone())

        # Calculate success rate
        total = result["total_attempts"]
        correct = result["correct_answers"]
        result["success_rate"] = (correct / total * 100) if total > 0 else 0

        return result

    def get_user_streak(self, username: str) -> Dict:
        """Get the current and best streak for a user."""
        user_id = self._get_or_create_user(username)

        # Get all dates when the user completed at least one exercise
        self.cursor.execute(
            """SELECT DISTINCT date(attempt_date) as attempt_day
               FROM user_exercise_attempts
               WHERE user_id = ?
               ORDER BY attempt_day ASC""",
            (user_id,),
        )

        days = [row["attempt_day"] for row in self.cursor.fetchall()]

        if not days:
            return {"current_streak": 0, "best_streak": 0}

        # Calculate streaks
        streaks = []
        current_streak = 1

        for i in range(1, len(days)):
            prev_day = datetime.strptime(days[i - 1], "%Y-%m-%d").date()
            curr_day = datetime.strptime(days[i], "%Y-%m-%d").date()

            if (curr_day - prev_day).days == 1:
                current_streak += 1
            else:
                streaks.append(current_streak)
                current_streak = 1

        streaks.append(current_streak)

        # Check if the last day is today or yesterday to determine if streak is active
        last_day = datetime.strptime(days[-1], "%Y-%m-%d").date()
        today = datetime.now().date()

        if last_day == today or last_day == today - timedelta(days=1):
            current_streak = streaks[-1]
        else:
            current_streak = 0

        return {
            "current_streak": current_streak,
            "best_streak": max(streaks) if streaks else 0,
        }

    def get_exercises_by_language(self, username: str) -> List[Dict]:
        """Get the number of exercises completed for each language."""
        user_id = self._get_or_create_user(username)

        self.cursor.execute(
            """SELECT
                l.language,
                COUNT(DISTINCT uea.exercise_id) as completed_exercises,
                SUM(CASE WHEN uea.is_correct THEN 1 ELSE 0 END) as correct_answers,
                COUNT(uea.id) as total_attempts
               FROM user_exercise_attempts uea
               JOIN exercises_info ei ON uea.exercise_id = ei.id
               JOIN languages l ON ei.language_id = l.id
               WHERE uea.user_id = ?
               GROUP BY l.language""",
            (user_id,),
        )

        return [dict(row) for row in self.cursor.fetchall()]

    def get_exercises_by_language_difficulty(self, username: str) -> List[Dict]:
        """Get the number of exercises completed for each language and difficulty level."""
        user_id = self._get_or_create_user(username)

        self.cursor.execute(
            """SELECT
                l.language,
                d.difficulty_level,
                COUNT(DISTINCT uea.exercise_id) as completed_exercises,
                SUM(CASE WHEN uea.is_correct THEN 1 ELSE 0 END) as correct_answers,
                COUNT(uea.id) as total_attempts
               FROM user_exercise_attempts uea
               JOIN exercises_info ei ON uea.exercise_id = ei.id
               JOIN languages l ON ei.language_id = l.id
               JOIN difficulties d ON ei.difficulty_id = d.id
               WHERE uea.user_id = ?
               GROUP BY l.language, d.difficulty_level""",
            (user_id,),
        )

        return [dict(row) for row in self.cursor.fetchall()]

    def get_exercises_by_language_topic(self, username: str) -> List[Dict]:
        """Get the number of exercises completed for each language and topic."""
        user_id = self._get_or_create_user(username)

        self.cursor.execute(
            """SELECT
                l.language,
                t.topic,
                COUNT(DISTINCT uea.exercise_id) as completed_exercises,
                SUM(CASE WHEN uea.is_correct THEN 1 ELSE 0 END) as correct_answers,
                COUNT(uea.id) as total_attempts
               FROM user_exercise_attempts uea
               JOIN exercises_info ei ON uea.exercise_id = ei.id
               JOIN languages l ON ei.language_id = l.id
               JOIN topics t ON ei.topic_id = t.id
               WHERE uea.user_id = ?
               GROUP BY l.language, t.topic""",
            (user_id,),
        )

        return [dict(row) for row in self.cursor.fetchall()]

    def get_exercises_by_type(self, username: str) -> List[Dict]:
        """Get the number of exercises completed for each exercise type."""
        user_id = self._get_or_create_user(username)

        self.cursor.execute(
            """SELECT
                CASE
                    WHEN pe.id IS NOT NULL THEN 'Pairs'
                    WHEN ce.id IS NOT NULL THEN 'Conversation'
                    WHEN te.id IS NOT NULL THEN 'Translation'
                    WHEN fib.id IS NOT NULL THEN 'Fill in Blank'
                    ELSE 'Unknown'
                END as exercise_type,
                COUNT(DISTINCT uea.exercise_id) as completed_exercises,
                SUM(CASE WHEN uea.is_correct THEN 1 ELSE 0 END) as correct_answers,
                COUNT(uea.id) as total_attempts
               FROM user_exercise_attempts uea
               JOIN exercises_info ei ON uea.exercise_id = ei.id
               LEFT JOIN pair_exercises pe ON ei.id = pe.exercise_id
               LEFT JOIN conversation_exercises ce ON ei.id = ce.exercise_id
               LEFT JOIN translation_exercises te ON ei.id = te.exercise_id
               LEFT JOIN fill_in_blank_exercises fib ON ei.id = fib.exercise_id
               WHERE uea.user_id = ?
               GROUP BY exercise_type""",
            (user_id,),
        )

        return [dict(row) for row in self.cursor.fetchall()]

    def add_conversation_exercise(
        self,
        exercise_name: str,
        language: str,
        topic: str,
        difficulty_level: str,
        conversations: List[Dict[str, str]],
        summary: str,
        lesson_id: str = None,
    ) -> int:
        """Add a conversation exercise to the database."""
        language_id = self._get_or_create_language(language)
        topic_id = self._get_or_create_topic(topic)
        difficulty_id = self._get_or_create_difficulty(difficulty_level)

        # Always create a new exercise - lesson_id is just for grouping
        self.cursor.execute(
            """INSERT INTO exercises_info
               (exercise_name, language_id, topic_id, difficulty_id, exercise_type, lesson_id)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                exercise_name,
                language_id,
                topic_id,
                difficulty_id,
                "conversation",
                lesson_id,
            ),
        )
        exercise_id = self.cursor.lastrowid

        for idx, conv in enumerate(conversations):
            self.cursor.execute(
                """INSERT INTO conversation_exercises
                   (exercise_id, conversation_order, speaker, message)
                   VALUES (?, ?, ?, ?)""",
                (exercise_id, idx, conv["speaker"], conv["message"]),
            )

        self.cursor.execute(
            """INSERT INTO conversation_summaries
               (exercise_id, summary) VALUES (?, ?)""",
            (exercise_id, summary),
        )

        self.conn.commit()
        return exercise_id

    def add_pair_exercise(
        self,
        exercise_name: str,
        language: str,
        topic: str,
        difficulty_level: str,
        language_1: str,
        language_2: str,
        language_1_content: str,
        language_2_content: str,
        lesson_id: str = None,
    ) -> int:
        """Add a pair exercise to the database."""
        # Check if pair exercise already exists
        self.cursor.execute(
            """SELECT COUNT(*) FROM pair_exercises
               WHERE language_1_content = ? AND language_2_content = ?""",
            (language_1_content, language_2_content),
        )
        if self.cursor.fetchone()[0] > 0:
            return -1  # Exercise already exists

        language_id = self._get_or_create_language(language)
        topic_id = self._get_or_create_topic(topic)
        difficulty_id = self._get_or_create_difficulty(difficulty_level)

        # Always create a new exercise - lesson_id is just for grouping
        self.cursor.execute(
            """INSERT INTO exercises_info
               (exercise_name, language_id, topic_id, difficulty_id, exercise_type, lesson_id)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (exercise_name, language_id, topic_id, difficulty_id, "pairs", lesson_id),
        )
        exercise_id = self.cursor.lastrowid

        self.cursor.execute(
            """INSERT INTO pair_exercises
               (exercise_id, language_1, language_2, language_1_content, language_2_content)
               VALUES (?, ?, ?, ?, ?)""",
            (
                exercise_id,
                language_1,
                language_2,
                language_1_content,
                language_2_content,
            ),
        )

        self.conn.commit()
        return exercise_id

    def add_pair_exercise_batch(
        self,
        exercise_name: str,
        language: str,
        topic: str,
        difficulty_level: str,
        language_1: str,
        language_2: str,
        pairs: List[Dict[str, str]],
        lesson_id: str = None,
    ) -> int:
        """Add a batch of word pairs as a single exercise to the database."""
        if not pairs:
            return -1

        language_id = self._get_or_create_language(language)
        topic_id = self._get_or_create_topic(topic)
        difficulty_id = self._get_or_create_difficulty(difficulty_level)

        # Create a single exercise for all pairs
        self.cursor.execute(
            """INSERT INTO exercises_info
               (exercise_name, language_id, topic_id, difficulty_id, exercise_type, lesson_id)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (exercise_name, language_id, topic_id, difficulty_id, "pairs", lesson_id),
        )
        exercise_id = self.cursor.lastrowid

        # Insert all pairs under the same exercise_id
        for pair in pairs:
            # Check for duplicates within this batch (skip if duplicate)
            language_1_content = pair.get(language_1, "")
            language_2_content = pair.get(language_2, "")

            if not language_1_content or not language_2_content:
                continue  # Skip invalid pairs

            # Check if this specific pair already exists in the database
            self.cursor.execute(
                """SELECT COUNT(*) FROM pair_exercises
                   WHERE language_1_content = ? AND language_2_content = ?""",
                (language_1_content, language_2_content),
            )
            existing_count = self.cursor.fetchone()[0]
            if existing_count > 0:
                continue  # Skip duplicate pairs

            self.cursor.execute(
                """INSERT INTO pair_exercises
                   (exercise_id, language_1, language_2, language_1_content, language_2_content)
                   VALUES (?, ?, ?, ?, ?)""",
                (
                    exercise_id,
                    language_1,
                    language_2,
                    language_1_content,
                    language_2_content,
                ),
            )

        self.conn.commit()
        return exercise_id

    def add_translation_exercise(
        self,
        exercise_name: str,
        language: str,
        topic: str,
        difficulty_level: str,
        language_1: str,
        language_2: str,
        language_1_content: str,
        language_2_content: str,
        lesson_id: str = None,
    ) -> int:
        """Add a translation exercise to the database."""
        language_id = self._get_or_create_language(language)
        topic_id = self._get_or_create_topic(topic)
        difficulty_id = self._get_or_create_difficulty(difficulty_level)

        # Always create a new exercise - lesson_id is just for grouping
        self.cursor.execute(
            """INSERT INTO exercises_info
               (exercise_name, language_id, topic_id, difficulty_id, exercise_type, lesson_id)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                exercise_name,
                language_id,
                topic_id,
                difficulty_id,
                "translation",
                lesson_id,
            ),
        )
        exercise_id = self.cursor.lastrowid

        self.cursor.execute(
            """INSERT INTO translation_exercises
               (exercise_id, language_1, language_2, language_1_content, language_2_content)
               VALUES (?, ?, ?, ?, ?)""",
            (
                exercise_id,
                language_1,
                language_2,
                language_1_content,
                language_2_content,
            ),
        )

        self.conn.commit()
        return exercise_id

    def add_fill_in_blank_exercise(
        self,
        exercise_name: str,
        language: str,
        topic: str,
        difficulty_level: str,
        sentence: str,
        correct_answer: str,
        incorrect_1: str,
        incorrect_2: str,
        blank_position: int,
        translation: str,
        lesson_id: str = None,
    ) -> int:
        """Add a fill-in-blank exercise to the database."""
        language_id = self._get_or_create_language(language)
        topic_id = self._get_or_create_topic(topic)
        difficulty_id = self._get_or_create_difficulty(difficulty_level)

        # Always create a new exercise - lesson_id is just for grouping
        self.cursor.execute(
            """INSERT INTO exercises_info
               (exercise_name, language_id, topic_id, difficulty_id, exercise_type, lesson_id)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                exercise_name,
                language_id,
                topic_id,
                difficulty_id,
                "fill_in_blank",
                lesson_id,
            ),
        )
        exercise_id = self.cursor.lastrowid

        self.cursor.execute(
            """INSERT INTO fill_in_blank_exercises
               (exercise_id, sentence, correct_answer, incorrect_1, incorrect_2, blank_position, translation)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                exercise_id,
                sentence,
                correct_answer,
                incorrect_1,
                incorrect_2,
                blank_position,
                translation,
            ),
        )

        self.conn.commit()
        return exercise_id

    def get_languages(self) -> List[str]:
        """Get all available languages."""
        self.cursor.execute(
            """SELECT DISTINCT l.language
               FROM languages l
               JOIN exercises_info e ON l.id = e.language_id"""
        )
        return [row["language"] for row in self.cursor.fetchall()]

    def get_difficulty_levels(self) -> List[str]:
        """Get all difficulty levels."""
        self.cursor.execute("SELECT difficulty_level FROM difficulties")
        return [row["difficulty_level"] for row in self.cursor.fetchall()]

    def get_difficulty_by_language(self, language: str) -> List[str]:
        """Get available difficulty levels for a specific language."""
        self.cursor.execute(
            """SELECT DISTINCT d.difficulty_level
               FROM difficulties d
               JOIN exercises_info e ON d.id = e.difficulty_id
               JOIN languages l ON e.language_id = l.id
               WHERE l.language = ?""",
            (language,),
        )
        return [row["difficulty_level"] for row in self.cursor.fetchall()]

    def get_topics_by_language_difficulty(
        self, language: str, difficulty: str
    ) -> List[str]:
        """Get available topics for a specific language and difficulty level."""
        self.cursor.execute(
            """SELECT DISTINCT t.topic
               FROM topics t
               JOIN exercises_info e ON t.id = e.topic_id
               JOIN languages l ON e.language_id = l.id
               JOIN difficulties d ON e.difficulty_id = d.id
               WHERE l.language = ? AND d.difficulty_level = ?""",
            (language, difficulty),
        )
        return [row["topic"] for row in self.cursor.fetchall()]

    def get_random_pair_exercise(
        self, language: str, difficulty: str, topic: str, limit: int = 10
    ) -> List[Dict]:
        """Get random pair exercises for given criteria, grouped by lesson_id."""
        # First, get random lesson_ids that match the criteria
        self.cursor.execute(
            """SELECT DISTINCT e.lesson_id
               FROM exercises_info e
               JOIN pair_exercises p ON e.id = p.exercise_id
               JOIN topics t ON e.topic_id = t.id
               JOIN difficulties d ON e.difficulty_id = d.id
               WHERE p.language_1 = ? AND p.language_2 = ?
               AND t.topic = ? AND d.difficulty_level = ?
               ORDER BY RANDOM() LIMIT ?""",
            (
                "English",
                language,
                topic,
                difficulty,
                (limit + 9) // 10,
            ),  # Estimate number of lessons needed
        )
        lesson_ids = [
            row["lesson_id"] for row in self.cursor.fetchall() if row["lesson_id"]
        ]

        # If no lesson_ids with non-null values found, fall back to original random selection
        if not lesson_ids:
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
                ("English", language, topic, difficulty, limit),
            )
            return [dict(row) for row in self.cursor.fetchall()]

        # Get exercises for the selected lesson_ids
        placeholders = ",".join(["?"] * len(lesson_ids))
        query = f"""SELECT e.exercise_name, p.language_1, p.language_2,
                          p.language_1_content, p.language_2_content
                   FROM exercises_info e
                   JOIN pair_exercises p ON e.id = p.exercise_id
                   JOIN topics t ON e.topic_id = t.id
                   JOIN difficulties d ON e.difficulty_id = d.id
                   WHERE p.language_1 = ? AND p.language_2 = ?
                   AND t.topic = ? AND d.difficulty_level = ?
                   AND e.lesson_id IN ({placeholders})
                   ORDER BY e.lesson_id, e.id
                   LIMIT ?"""

        params = ["English", language, topic, difficulty] + lesson_ids + [limit]
        self.cursor.execute(query, params)
        return [dict(row) for row in self.cursor.fetchall()]

    def get_random_translation_exercise(
        self, language: str, difficulty: str, topic: str, limit: int = 10
    ) -> List[Dict]:
        """Get random translation exercises for given criteria, grouped by lesson_id."""
        # First, get random lesson_ids that match the criteria
        self.cursor.execute(
            """SELECT DISTINCT e.lesson_id
               FROM exercises_info e
               JOIN translation_exercises t_ex ON e.id = t_ex.exercise_id
               JOIN topics t ON e.topic_id = t.id
               JOIN difficulties d ON e.difficulty_id = d.id
               WHERE t_ex.language_1 = ? AND t_ex.language_2 = ?
               AND t.topic = ? AND d.difficulty_level = ?
               ORDER BY RANDOM() LIMIT ?""",
            (
                "English",
                language,
                topic,
                difficulty,
                (limit + 9) // 10,
            ),  # Estimate number of lessons needed
        )
        lesson_ids = [
            row["lesson_id"] for row in self.cursor.fetchall() if row["lesson_id"]
        ]

        # If no lesson_ids with non-null values found, fall back to original random selection
        if not lesson_ids:
            self.cursor.execute(
                """SELECT e.exercise_name, t_ex.language_1, t_ex.language_2,
                          t_ex.language_1_content, t_ex.language_2_content
                   FROM exercises_info e
                   JOIN translation_exercises t_ex ON e.id = t_ex.exercise_id
                   JOIN topics t ON e.topic_id = t.id
                   JOIN difficulties d ON e.difficulty_id = d.id
                   WHERE t_ex.language_1 = ? AND t_ex.language_2 = ?
                   AND t.topic = ? AND d.difficulty_level = ?
                   ORDER BY RANDOM() LIMIT ?""",
                ("English", language, topic, difficulty, limit),
            )
            return [dict(row) for row in self.cursor.fetchall()]

        # Get exercises for the selected lesson_ids
        placeholders = ",".join(["?"] * len(lesson_ids))
        query = f"""SELECT e.exercise_name, t_ex.language_1, t_ex.language_2,
                          t_ex.language_1_content, t_ex.language_2_content
                   FROM exercises_info e
                   JOIN translation_exercises t_ex ON e.id = t_ex.exercise_id
                   JOIN topics t ON e.topic_id = t.id
                   JOIN difficulties d ON e.difficulty_id = d.id
                   WHERE t_ex.language_1 = ? AND t_ex.language_2 = ?
                   AND t.topic = ? AND d.difficulty_level = ?
                   AND e.lesson_id IN ({placeholders})
                   ORDER BY e.lesson_id, e.id
                   LIMIT ?"""

        params = ["English", language, topic, difficulty] + lesson_ids + [limit]
        self.cursor.execute(query, params)
        return [dict(row) for row in self.cursor.fetchall()]

    def get_random_fill_in_blank_exercise(
        self, language: str, difficulty: str, topic: str, limit: int = 10
    ) -> List[Dict]:
        """Get random fill-in-blank exercises for given criteria, grouped by lesson_id."""
        # First, get random lesson_ids that match the criteria
        self.cursor.execute(
            """SELECT DISTINCT e.lesson_id
               FROM exercises_info e
               JOIN fill_in_blank_exercises fib ON e.id = fib.exercise_id
               JOIN topics t ON e.topic_id = t.id
               JOIN difficulties d ON e.difficulty_id = d.id
               JOIN languages l ON e.language_id = l.id
               WHERE l.language = ? AND t.topic = ? AND d.difficulty_level = ?
               ORDER BY RANDOM() LIMIT ?""",
            (
                language,
                topic,
                difficulty,
                (limit + 9) // 10,
            ),  # Estimate number of lessons needed
        )
        lesson_ids = [
            row["lesson_id"] for row in self.cursor.fetchall() if row["lesson_id"]
        ]

        # If no lesson_ids with non-null values found, fall back to original random selection
        if not lesson_ids:
            self.cursor.execute(
                """SELECT e.exercise_name, fib.sentence, fib.correct_answer,
                          fib.incorrect_1, fib.incorrect_2, fib.blank_position
                   FROM exercises_info e
                   JOIN fill_in_blank_exercises fib ON e.id = fib.exercise_id
                   JOIN topics t ON e.topic_id = t.id
                   JOIN difficulties d ON e.difficulty_id = d.id
                   JOIN languages l ON e.language_id = l.id
                   WHERE l.language = ? AND t.topic = ? AND d.difficulty_level = ?
                   ORDER BY RANDOM() LIMIT ?""",
                (language, topic, difficulty, limit),
            )
            return [dict(row) for row in self.cursor.fetchall()]

        # Get exercises for the selected lesson_ids
        placeholders = ",".join(["?"] * len(lesson_ids))
        query = f"""SELECT e.exercise_name, fib.sentence, fib.correct_answer,
                          fib.incorrect_1, fib.incorrect_2, fib.blank_position
                   FROM exercises_info e
                   JOIN fill_in_blank_exercises fib ON e.id = fib.exercise_id
                   JOIN topics t ON e.topic_id = t.id
                   JOIN difficulties d ON e.difficulty_id = d.id
                   JOIN languages l ON e.language_id = l.id
                   WHERE l.language = ? AND t.topic = ? AND d.difficulty_level = ?
                   AND e.lesson_id IN ({placeholders})
                   ORDER BY e.lesson_id, e.id
                   LIMIT ?"""

        params = [language, topic, difficulty] + lesson_ids + [limit]
        self.cursor.execute(query, params)
        return [dict(row) for row in self.cursor.fetchall()]

    def get_random_conversation_exercise(
        self, language: str, difficulty: str, topic: str, limit: int = 5
    ) -> List[Dict]:
        """Get random conversation exercises for given criteria, grouped by lesson_id."""
        # First, get random lesson_ids that match the criteria
        self.cursor.execute(
            """SELECT DISTINCT e.lesson_id
               FROM exercises_info e
               JOIN conversation_exercises c ON e.id = c.exercise_id
               JOIN topics t ON e.topic_id = t.id
               JOIN difficulties d ON e.difficulty_id = d.id
               JOIN languages l ON e.language_id = l.id
               WHERE l.language = ? AND t.topic = ? AND d.difficulty_level = ?
               ORDER BY RANDOM() LIMIT ?""",
            (
                language,
                topic,
                difficulty,
                (limit + 4) // 5,
            ),  # Estimate number of lessons needed
        )
        lesson_ids = [
            row["lesson_id"] for row in self.cursor.fetchall() if row["lesson_id"]
        ]

        # If no lesson_ids with non-null values found, fall back to original random selection
        if not lesson_ids:
            # Get exercise IDs first
            self.cursor.execute(
                """SELECT DISTINCT e.id as exercise_id, e.exercise_name
                   FROM exercises_info e
                   JOIN conversation_exercises c ON e.id = c.exercise_id
                   JOIN topics t ON e.topic_id = t.id
                   JOIN difficulties d ON e.difficulty_id = d.id
                   JOIN languages l ON e.language_id = l.id
                   WHERE l.language = ? AND t.topic = ? AND d.difficulty_level = ?
                   ORDER BY RANDOM() LIMIT ?""",
                (language, topic, difficulty, limit),
            )
            exercise_data = [dict(row) for row in self.cursor.fetchall()]

            # For each exercise, get the conversation messages and summary
            result = []
            for ex in exercise_data:
                # Get conversation messages
                self.cursor.execute(
                    """SELECT speaker, message
                       FROM conversation_exercises
                       WHERE exercise_id = ?
                       ORDER BY conversation_order""",
                    (ex["exercise_id"],),
                )
                conversation = [dict(row) for row in self.cursor.fetchall()]

                # Get summary
                self.cursor.execute(
                    """SELECT summary
                       FROM conversation_summaries
                       WHERE exercise_id = ?""",
                    (ex["exercise_id"],),
                )
                summary_row = self.cursor.fetchone()
                summary = summary_row["summary"] if summary_row else ""

                result.append(
                    {
                        "exercise_name": ex["exercise_name"],
                        "conversation": conversation,
                        "summary": summary,
                    }
                )

            return result

        # Get exercises for the selected lesson_ids
        placeholders = ",".join(["?"] * len(lesson_ids))

        # Get exercise IDs first
        query = f"""SELECT DISTINCT e.id as exercise_id, e.exercise_name
                   FROM exercises_info e
                   JOIN conversation_exercises c ON e.id = c.exercise_id
                   JOIN topics t ON e.topic_id = t.id
                   JOIN difficulties d ON e.difficulty_id = d.id
                   JOIN languages l ON e.language_id = l.id
                   WHERE l.language = ? AND t.topic = ? AND d.difficulty_level = ?
                   AND e.lesson_id IN ({placeholders})
                   ORDER BY e.lesson_id, e.id
                   LIMIT ?"""

        params = [language, topic, difficulty] + lesson_ids + [limit]
        self.cursor.execute(query, params)
        exercise_data = [dict(row) for row in self.cursor.fetchall()]

        # For each exercise, get the conversation messages and summary
        result = []
        for ex in exercise_data:
            # Get conversation messages
            self.cursor.execute(
                """SELECT speaker, message
                   FROM conversation_exercises
                   WHERE exercise_id = ?
                   ORDER BY conversation_order""",
                (ex["exercise_id"],),
            )
            conversation = [dict(row) for row in self.cursor.fetchall()]

            # Get summary
            self.cursor.execute(
                """SELECT summary
                   FROM conversation_summaries
                   WHERE exercise_id = ?""",
                (ex["exercise_id"],),
            )
            summary_row = self.cursor.fetchone()
            summary = summary_row["summary"] if summary_row else ""

            result.append(
                {
                    "exercise_name": ex["exercise_name"],
                    "conversation": conversation,
                    "summary": summary,
                }
            )

        return result

    def store_pronunciation_audio(
        self,
        text: str,
        language: str,
        audio_data: bytes,
        exercise_type: str,
        topic: str = None,
        difficulty: str = None,
    ) -> int:
        """Store pronunciation audio in the database.

        Args:
            text: The text for which the audio was generated
            language: The language of the audio
            audio_data: The binary audio data
            exercise_type: Type of exercise (pairs, translation, conversation)
            topic: Optional topic of the exercise
            difficulty: Optional difficulty level

        Returns:
            The ID of the inserted audio record
        """
        try:
            self.cursor.execute(
                """INSERT INTO pronunciation_audio
                   (text, language, audio_data, exercise_type, topic, difficulty, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(text, language)
                   DO UPDATE SET audio_data = ?, exercise_type = ?,
                                 topic = ?, difficulty = ?, created_at = ?""",
                (
                    text,
                    language,
                    audio_data,
                    exercise_type,
                    topic,
                    difficulty,
                    datetime.now(),
                    audio_data,
                    exercise_type,
                    topic,
                    difficulty,
                    datetime.now(),
                ),
            )
            self.conn.commit()
            return self.cursor.lastrowid
        except Exception as e:
            print(f"Error storing audio: {e}")
            return -1

    def get_pronunciation_audio(
        self, text: str, language: str = None
    ) -> Optional[bytes]:
        """Retrieve pronunciation audio from the database.

        Args:
            text: The text for which to retrieve audio
            language: Optional language filter

        Returns:
            Binary audio data if found, None otherwise
        """
        try:
            if language:
                self.cursor.execute(
                    """SELECT audio_data FROM pronunciation_audio
                       WHERE text = ? AND language = ?
                       ORDER BY created_at DESC LIMIT 1""",
                    (text, language),
                )
            else:
                self.cursor.execute(
                    """SELECT audio_data FROM pronunciation_audio
                       WHERE text = ?
                       ORDER BY created_at DESC LIMIT 1""",
                    (text,),
                )

            result = self.cursor.fetchone()
            return result["audio_data"] if result else None
        except Exception as e:
            print(f"Error retrieving audio: {e}")
            return None

    def get_audio_languages(self) -> List[str]:
        """Get all languages that have audio recordings."""
        self.cursor.execute("""SELECT DISTINCT language FROM pronunciation_audio""")
        return [row["language"] for row in self.cursor.fetchall()]

    def get_audio_count(self) -> int:
        """Get the total number of audio recordings."""
        self.cursor.execute("SELECT COUNT(*) FROM pronunciation_audio")
        return self.cursor.fetchone()[0]

    def get_all_conversation_exercises(self) -> List[Dict]:
        """Get all conversation exercises from the database."""
        query = """
        SELECT DISTINCT e.id, e.exercise_name, l.language, t.topic, 
               d.difficulty_level, e.lesson_id
        FROM exercises_info e
        JOIN conversation_exercises c ON e.id = c.exercise_id
        JOIN languages l ON e.language_id = l.id
        JOIN topics t ON e.topic_id = t.id
        JOIN difficulties d ON e.difficulty_id = d.id
        ORDER BY e.id
        """
        self.cursor.execute(query)
        exercises = []
        
        for row in self.cursor.fetchall():
            exercise_data = dict(row)
            
            # Get conversation messages
            self.cursor.execute(
                """SELECT speaker, message FROM conversation_exercises
                   WHERE exercise_id = ? ORDER BY conversation_order""",
                (exercise_data['id'],)
            )
            conversations = [dict(conv_row) for conv_row in self.cursor.fetchall()]
            
            # Get summary
            self.cursor.execute(
                """SELECT summary FROM conversation_summaries WHERE exercise_id = ?""",
                (exercise_data['id'],)
            )
            summary_row = self.cursor.fetchone()
            summary = summary_row['summary'] if summary_row else ''
            
            exercise_data['conversations'] = conversations
            exercise_data['summary'] = summary
            exercises.append(exercise_data)
            
        return exercises

    def get_all_pair_exercises(self) -> List[Dict]:
        """Get all pair exercises from the database."""
        query = """
        SELECT DISTINCT e.id, e.exercise_name, l.language, t.topic, 
               d.difficulty_level, e.lesson_id
        FROM exercises_info e
        JOIN pair_exercises p ON e.id = p.exercise_id
        JOIN languages l ON e.language_id = l.id
        JOIN topics t ON e.topic_id = t.id
        JOIN difficulties d ON e.difficulty_id = d.id
        ORDER BY e.id
        """
        self.cursor.execute(query)
        exercises = []
        
        for row in self.cursor.fetchall():
            exercise_data = dict(row)
            
            # Get pairs
            self.cursor.execute(
                """SELECT language_1_content, language_2_content 
                   FROM pair_exercises WHERE exercise_id = ?""",
                (exercise_data['id'],)
            )
            pairs = []
            for pair_row in self.cursor.fetchall():
                pairs.append({
                    'English': pair_row['language_1_content'],
                    exercise_data['language']: pair_row['language_2_content']
                })
            
            exercise_data['pairs'] = pairs
            exercises.append(exercise_data)
            
        return exercises

    def get_all_translation_exercises(self) -> List[Dict]:
        """Get all translation exercises from the database."""
        query = """
        SELECT e.id, e.exercise_name, l.language, t.topic, 
               d.difficulty_level, e.lesson_id,
               tr.language_1, tr.language_2, 
               tr.language_1_content, tr.language_2_content
        FROM exercises_info e
        JOIN translation_exercises tr ON e.id = tr.exercise_id
        JOIN languages l ON e.language_id = l.id
        JOIN topics t ON e.topic_id = t.id
        JOIN difficulties d ON e.difficulty_id = d.id
        ORDER BY e.id
        """
        self.cursor.execute(query)
        return [dict(row) for row in self.cursor.fetchall()]

    def get_all_fill_in_blank_exercises(self) -> List[Dict]:
        """Get all fill-in-blank exercises from the database."""
        query = """
        SELECT e.id, e.exercise_name, l.language, t.topic, 
               d.difficulty_level, e.lesson_id,
               fib.sentence, fib.correct_answer, fib.incorrect_1, 
               fib.incorrect_2, fib.blank_position
        FROM exercises_info e
        JOIN fill_in_blank_exercises fib ON e.id = fib.exercise_id
        JOIN languages l ON e.language_id = l.id
        JOIN topics t ON e.topic_id = t.id
        JOIN difficulties d ON e.difficulty_id = d.id
        ORDER BY e.id
        """
        self.cursor.execute(query)
        return [dict(row) for row in self.cursor.fetchall()]

    def remove_conversation_exercises(self, exercise_ids: List[int]) -> int:
        """Remove conversation exercises by IDs."""
        if not exercise_ids:
            return 0
            
        placeholders = ','.join(['?'] * len(exercise_ids))
        
        # Remove from conversation_exercises table
        self.cursor.execute(
            f"DELETE FROM conversation_exercises WHERE exercise_id IN ({placeholders})",
            exercise_ids
        )
        
        # Remove from conversation_summaries table
        self.cursor.execute(
            f"DELETE FROM conversation_summaries WHERE exercise_id IN ({placeholders})",
            exercise_ids
        )
        
        # Remove from exercises_info table
        self.cursor.execute(
            f"DELETE FROM exercises_info WHERE id IN ({placeholders})",
            exercise_ids
        )
        
        self.conn.commit()
        return len(exercise_ids)

    def remove_pair_exercises(self, exercise_ids: List[int]) -> int:
        """Remove pair exercises by IDs."""
        if not exercise_ids:
            return 0
            
        placeholders = ','.join(['?'] * len(exercise_ids))
        
        # Remove from pair_exercises table
        self.cursor.execute(
            f"DELETE FROM pair_exercises WHERE exercise_id IN ({placeholders})",
            exercise_ids
        )
        
        # Remove from exercises_info table
        self.cursor.execute(
            f"DELETE FROM exercises_info WHERE id IN ({placeholders})",
            exercise_ids
        )
        
        self.conn.commit()
        return len(exercise_ids)

    def remove_translation_exercises(self, exercise_ids: List[int]) -> int:
        """Remove translation exercises by IDs."""
        if not exercise_ids:
            return 0
            
        placeholders = ','.join(['?'] * len(exercise_ids))
        
        # Remove from translation_exercises table
        self.cursor.execute(
            f"DELETE FROM translation_exercises WHERE exercise_id IN ({placeholders})",
            exercise_ids
        )
        
        # Remove from exercises_info table
        self.cursor.execute(
            f"DELETE FROM exercises_info WHERE id IN ({placeholders})",
            exercise_ids
        )
        
        self.conn.commit()
        return len(exercise_ids)

    def remove_fill_in_blank_exercises(self, exercise_ids: List[int]) -> int:
        """Remove fill-in-blank exercises by IDs."""
        if not exercise_ids:
            return 0
            
        placeholders = ','.join(['?'] * len(exercise_ids))
        
        # Remove from fill_in_blank_exercises table
        self.cursor.execute(
            f"DELETE FROM fill_in_blank_exercises WHERE exercise_id IN ({placeholders})",
            exercise_ids
        )
        
        # Remove from exercises_info table
        self.cursor.execute(
            f"DELETE FROM exercises_info WHERE id IN ({placeholders})",
            exercise_ids
        )
        
        self.conn.commit()
        return len(exercise_ids)

    def close(self):
        """Close the database connection."""
        self.conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
