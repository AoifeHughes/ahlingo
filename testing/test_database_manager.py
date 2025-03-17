# -*- coding: utf-8 -*-
import pytest
import os
from AHLingo.database import database_manager


@pytest.fixture(scope="function")
def db():
    """Fixture to provide a database connection for each test"""
    database = database_manager.LanguageDB()
    database._initialize()
    yield database
    # Cleanup after each test
    database.cursor.execute("DELETE FROM user_exercise_attempts")
    database.cursor.execute("DELETE FROM conversation_exercises")
    database.cursor.execute("DELETE FROM conversation_summaries")
    database.cursor.execute("DELETE FROM pair_exercises")
    database.cursor.execute("DELETE FROM translation_exercises")
    database.cursor.execute("DELETE FROM exercises_info")
    database.cursor.execute("DELETE FROM topics")
    database.cursor.execute("DELETE FROM languages")
    database.cursor.execute("DELETE FROM difficulties")
    database.cursor.execute("DELETE FROM users")
    database.conn.commit()
    database.conn.close()
    # Delete the database file
    os.remove(database.db_path)


def test_get_or_create_topic(db):
    topic_id = db._get_or_create_topic("Test Topic")
    assert isinstance(topic_id, int)
    assert topic_id > 0
    existing_id = db._get_or_create_topic("Test Topic")
    assert existing_id == topic_id


def test_get_or_create_language(db):
    language_id = db._get_or_create_language("English")
    assert isinstance(language_id, int)
    assert language_id > 0
    existing_id = db._get_or_create_language("English")
    assert existing_id == language_id


def test_get_or_create_difficulty(db):
    difficulty_id = db._get_or_create_difficulty("Beginner")
    assert isinstance(difficulty_id, int)
    assert difficulty_id > 0
    existing_id = db._get_or_create_difficulty("Beginner")
    assert existing_id == difficulty_id


def test_get_failed_attempts(db):
    # Setup test data
    db._get_or_create_user("test_user")
    db.record_exercise_attempt("test_user", 1, False)
    db.record_exercise_attempt("test_user", 2, True)

    attempts = db.get_failed_attempts("test_user")
    assert isinstance(attempts, list)


def test_record_exercise_attempt(db):
    _ = db._get_or_create_user("test_user")

    exercise_id = db.add_conversation_exercise(
        f"Test Conversation Exercise {0}",  # Make name unique
        "English",
        "Test Topic",
        "Beginner",
        [{"speaker": "User", "message": "Hello"}, {"speaker": "Bot", "message": "Hi"}],
        "Summary of the conversation",
    )

    is_correct = False
    db.record_exercise_attempt("test_user", exercise_id, is_correct)
    attempts = db.get_failed_attempts("test_user")
    assert len(attempts) == 1


def test_add_conversation_exercise(db):
    exercise_id = db.add_conversation_exercise(
        f"Test Conversation Exercise {0}",  # Make name unique
        "English",
        "Test Topic",
        "Beginner",
        [{"speaker": "User", "message": "Hello"}, {"speaker": "Bot", "message": "Hi"}],
        "Summary of the conversation",
    )
    assert isinstance(exercise_id, int)
    assert exercise_id > 0


def test_add_pair_exercise(db):
    exercise_id = db.add_pair_exercise(
        f"Test Pair Exercise {1}",  # Make name unique
        "English",
        "Test Topic",
        "Beginner",
        "English",
        "Spanish",
        "Hello",
        "Hola",
    )
    assert isinstance(exercise_id, int)
    assert exercise_id > 0


def test_add_translation_exercise(db):
    exercise_id = db.add_translation_exercise(
        f"Test Translation Exercise {2}",  # Make name unique
        "English",
        "Test Topic",
        "Beginner",
        "English",
        "Spanish",
        "Hello",
        "Hola",
    )
    assert isinstance(exercise_id, int)
    assert exercise_id > 0
