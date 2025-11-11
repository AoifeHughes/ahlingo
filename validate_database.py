#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Wrapper script to run database validation from the root directory.
This script can be run from the project root and will properly handle paths.
"""
import os
import sys
from pathlib import Path
import argparse

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Now import and run the actual validation script
from content.generation.utils.database_validator import run_validation

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Validate language learning database exercises"
    )
    parser.add_argument(
        "--db-path",
        help="Path to database file (default: content/database/languageLearningDatabase.db)",
    )
    parser.add_argument(
        "--threshold", type=int, default=6, help="Quality threshold (1-10, default: 6)"
    )
    parser.add_argument(
        "--max-exercises",
        type=int,
        help="Limit number of exercises to validate (for testing)",
    )
    parser.add_argument(
        "--remove-failed",
        action="store_true",
        help="Remove exercises that fail validation",
    )
    parser.add_argument(
        "--no-dry-run",
        action="store_true",
        help="Actually remove exercises (not just show what would be removed)",
    )
    parser.add_argument(
        "--report", type=str, help="Path to save validation report JSON file"
    )
    parser.add_argument(
        "--exercise-type",
        type=str,
        help="Only validate specific exercise type (conversation, pair, translation, fill_in_blank)",
    )
    parser.add_argument(
        "--test-ambiguity",
        action="store_true",
        help="Run ambiguity test for fill-in-blank exercises",
    )

    args = parser.parse_args()

    # Set up database path relative to project root if not provided
    if args.db_path is None:
        db_path = str(project_root / "database" / "languageLearningDatabase.db")
    else:
        db_path = args.db_path

    print(f"Validating database at: {db_path}")
    print(f"Running from: {os.getcwd()}")

    # Run ambiguity test if requested
    if args.test_ambiguity:
        print("Running ambiguity validation test...")
        import subprocess

        result = subprocess.run(
            [sys.executable, "content/tests/test_ambiguity_validation.py"],
            capture_output=True,
            text=True,
        )
        print(result.stdout)
        if result.stderr:
            print("Errors:", result.stderr)
        sys.exit(0)

    # Run validation
    run_validation(
        db_path=db_path,
        quality_threshold=args.threshold,
        max_exercises=args.max_exercises,
        remove_failed=args.remove_failed,
        dry_run=not args.no_dry_run,
        report_path=args.report,
        exercise_type=args.exercise_type,
    )
