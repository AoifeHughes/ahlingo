# -*- coding: utf-8 -*-
import os

os.environ["KIVY_NO_CONSOLELOG"] = "1"

from content_creation.generate_lessons import populate_database
from database.database_manager import LanguageDB


def initialize_default_settings(db_loc=None):
    """Initialize default settings in the database."""
    from pathlib import Path
    
    # Use the same path logic as populate_database  
    if db_loc is None:
        script_dir = Path(__file__).parent.parent  # repo root directory
        db_loc = str(script_dir / "database" / "languageLearningDatabase.db")
    
    with LanguageDB(db_loc) as db:
        # Skip creating default user - only set settings if a user already exists
        most_recent_user = db.get_most_recent_user()
        if most_recent_user:
            # Set default OpenAI server and API key settings if they don't exist
            settings = db.get_user_settings(most_recent_user)
            if "openai_server" not in settings:
                db.set_user_setting(
                    most_recent_user, "openai_server", "http://localhost:8080/v1"
                )
            if "api_key" not in settings:
                db.set_user_setting(most_recent_user, "api_key", "sk-no-key-required")
        else:
            print("No users found in database - skipping default settings initialization")


if __name__ == "__main__":
    from pathlib import Path
    
    # Set up database path
    script_dir = Path(__file__).parent.parent  # repo root directory  
    db_path = str(script_dir / "database" / "languageLearningDatabase.db")
    
    # Create database directory if it doesn't exist
    db_dir = script_dir / "database"
    db_dir.mkdir(exist_ok=True)
    
    populate_database(db_path)
    initialize_default_settings(db_path)
