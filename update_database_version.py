#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
One-time script to add versioning metadata to existing database.
This script adds the database_metadata table and sets the current version.
"""
import sys
from pathlib import Path

# Add content directory to Python path
content_dir = Path(__file__).parent / "content"
sys.path.insert(0, str(content_dir))
sys.path.insert(0, str(Path(__file__).parent))

from database.database_manager import LanguageDB
from version import DATABASE_VERSION, __version__


def update_database_with_versioning(db_path: str):
    """
    Add versioning metadata to an existing database.

    Args:
        db_path: Path to the database file
    """
    print(f"Updating database at: {db_path}")
    print(f"App version: {__version__}")
    print(f"Database version: {DATABASE_VERSION}")
    print()

    try:
        with LanguageDB(db_path) as db:
            # Check if database_metadata table exists
            db.cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='database_metadata'"
            )
            table_exists = db.cursor.fetchone()

            if not table_exists:
                print("Creating database_metadata table...")
                db.cursor.execute(
                    """CREATE TABLE database_metadata (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL
                    )"""
                )
                db.conn.commit()
                print("✓ database_metadata table created")
            else:
                print("✓ database_metadata table already exists")

            # Set or update the version
            current_version = None
            try:
                current_version = db.get_database_version()
                print(f"Current database version: {current_version}")
            except:
                print("No version found in database")

            db.set_database_version(DATABASE_VERSION)
            print(
                f"✓ Database version updated to {DATABASE_VERSION} (app version {__version__})"
            )

            # Verify the update
            new_version = db.get_database_version()
            print(f"\nVerification: Database version is now {new_version}")

            if new_version == DATABASE_VERSION:
                print("\n" + "=" * 60)
                print("✓ Database successfully updated with versioning metadata")
                print("=" * 60)
            else:
                print("\n" + "=" * 60)
                print("⚠ Warning: Version verification failed")
                print("=" * 60)
                sys.exit(1)

    except Exception as e:
        print(f"\n✗ Error updating database: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Add versioning metadata to existing database"
    )
    parser.add_argument(
        "--db-path",
        type=str,
        help="Path to database file (defaults to database/languageLearningDatabase.db)",
    )

    args = parser.parse_args()

    # Set up database path
    if args.db_path:
        db_path = args.db_path
    else:
        repo_root = Path(__file__).parent
        db_path = str(repo_root / "database" / "languageLearningDatabase.db")

    # Check if database exists
    if not Path(db_path).exists():
        print(f"Error: Database not found at {db_path}")
        print("Please provide the correct path using --db-path")
        sys.exit(1)

    update_database_with_versioning(db_path)
