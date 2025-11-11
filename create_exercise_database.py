#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Wrapper script to run content creation from the root directory.
Use scripts/generate_content.py for the new entry point, or run directly from content/.
"""
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Import from the new location
from content.create_exercise_database import populate_database, initialize_default_settings

if __name__ == "__main__":
    # Set up database path relative to repo root directory
    db_path = str(project_root / "database" / "languageLearningDatabase.db")

    # Create database directory if it doesn't exist
    db_dir = project_root / "database"
    db_dir.mkdir(exist_ok=True)

    print(f"Creating database at: {db_path}")
    populate_database(db_path)
    initialize_default_settings(db_path)
    print("Database creation complete!")
