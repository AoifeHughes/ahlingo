# -*- coding: utf-8 -*-

from database_manager import LanguageDB
from generate_lessons import generate_lessons
from generate_pronunciation_audio import run_with_defaults


def initialize_default_settings():
    """Initialize default settings in the database."""
    with LanguageDB("./database/languageLearningDatabase.db") as db:
        # Get or create default user
        default_user = db.get_most_recent_user() or "default_user"

        # Set default OpenAI server and API key settings if they don't exist
        settings = db.get_user_settings(default_user)
        if "openai_server" not in settings:
            db.set_user_setting(
                default_user, "openai_server", "http://localhost:8080/v1"
            )
        if "api_key" not in settings:
            db.set_user_setting(default_user, "api_key", "sk-no-key-required")


if __name__ == "__main__":
    generate_lessons()
    run_with_defaults()
    initialize_default_settings()
