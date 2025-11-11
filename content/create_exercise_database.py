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
            print(
                "No users found in database - skipping default settings initialization"
            )


if __name__ == "__main__":
    import argparse
    from pathlib import Path

    parser = argparse.ArgumentParser(
        description="Generate language learning database exercises"
    )
    parser.add_argument(
        "--nothink", action="store_true", help="Prepend /no_think to model prompts"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug mode with prompt/response inspection",
    )
    parser.add_argument(
        "--db-path",
        type=str,
        help="Path to database file (defaults to repo root/database/languageLearningDatabase.db)",
    )
    parser.add_argument(
        "--exercise-type",
        type=str,
        choices=["conversations", "pairs", "translations", "fill_in_blank"],
        help="Only generate specific exercise type (conversations, pairs, translations, fill_in_blank)",
    )
    parser.add_argument(
        "--languages",
        type=str,
        help="Comma-separated list of languages to generate (e.g., 'French,Spanish')",
    )
    parser.add_argument(
        "--levels",
        type=str,
        help="Comma-separated list of difficulty levels to generate (e.g., 'Beginner,Intermediate')",
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=5,
        help="Number of parallel workers (default: 5)",
    )

    args = parser.parse_args()

    # Set up database path
    if args.db_path:
        db_path = args.db_path
    else:
        script_dir = Path(__file__).parent.parent  # repo root directory
        db_path = str(script_dir / "database" / "languageLearningDatabase.db")

        # Create database directory if it doesn't exist
        db_dir = script_dir / "database"
        db_dir.mkdir(exist_ok=True)

    # Set flags in outlines_generator if requested
    if args.nothink or args.debug:
        from content_creation.outlines_generator import MODEL_CONFIG

        if args.nothink:
            MODEL_CONFIG["no_think"] = True
            print("Enabled /no_think mode for model prompts")
        if args.debug:
            MODEL_CONFIG["debug"] = True
            print("Enabled debug mode - will pause at each generation step")

    # Parse language and level filters
    languages_filter = None
    if args.languages:
        languages_filter = [lang.strip() for lang in args.languages.split(",")]
        print(f"Filtering languages: {languages_filter}")

    levels_filter = None
    if args.levels:
        levels_filter = [level.strip() for level in args.levels.split(",")]
        print(f"Filtering levels: {levels_filter}")

    # Determine exercise types to generate
    exercise_types = None
    if args.exercise_type:
        exercise_types = [args.exercise_type]
        print(f"Filtering exercise types: {exercise_types}")

    populate_database(
        db_path,
        max_workers=args.max_workers,
        exercise_types=exercise_types,
        languages_filter=languages_filter,
        levels_filter=levels_filter,
    )
    initialize_default_settings(db_path)
