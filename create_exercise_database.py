#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Wrapper script to run content creation from the root directory.
This script can be run from the project root and will properly handle paths.
"""
import os
import sys
from pathlib import Path

# Add content directory to Python path
content_dir = Path(__file__).parent / "content"
sys.path.insert(0, str(content_dir))

# Now import and run the actual script
from create_exercise_database import populate_database, initialize_default_settings

if __name__ == "__main__":
    # Set up database path relative to repo root directory
    repo_root = Path(__file__).parent
    db_path = str(repo_root / "database" / "languageLearningDatabase.db")
    
    # Create database directory if it doesn't exist
    db_dir = repo_root / "database"
    db_dir.mkdir(exist_ok=True)
    
    print(f"Creating database at: {db_path}")
    print(f"Running from: {os.getcwd()}")
    
    populate_database(db_path)
    initialize_default_settings(db_path)
    
    print("Database creation complete!")