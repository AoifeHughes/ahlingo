#!/usr/bin/env python3
"""
Entry point for validating database content.

This script validates all exercises in the database for quality, completeness,
and consistency.

Usage:
    python scripts/validate_content.py [options]

Examples:
    # Validate all content
    python scripts/validate_content.py

    # Validate specific database
    python scripts/validate_content.py --db_path /path/to/database.db

    # Validate with detailed output
    python scripts/validate_content.py --verbose
"""

import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Import the validate_database module
import content.generation.utils.database_validator

if __name__ == "__main__":
    # The validation script uses its own main logic
    # Run it directly
    from validate_database import main

    main()
