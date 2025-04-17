# -*- coding: utf-8 -*-
import os

os.environ["KIVY_NO_CONSOLELOG"] = "1"

from content_creation.generate_lessons import populate_database
from database.database_manager import LanguageDB


def initialize_default_settings():
    """Initialize default settings in the database."""
    with LanguageDB("../database/languageLearningDatabase.db") as db:
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
    populate_database(max_concurrent=1)
    initialize_default_settings()
