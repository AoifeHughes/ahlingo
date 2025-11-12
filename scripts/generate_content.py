#!/usr/bin/env python3
"""
Main entry point for generating lesson content.

This script wraps the core lesson generation functionality and can be run from
the project root directory.

Usage:
    python scripts/generate_content.py [options]

Examples:
    # Generate lessons for all languages
    python scripts/generate_content.py

    # Generate for a specific language
    python scripts/generate_content.py --language French

    # Generate with specific difficulty
    python scripts/generate_content.py --language French --difficulty Beginner
"""

import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Import and run the core lesson generator
from content.generation.core.generate_lessons import main

if __name__ == "__main__":
    main()
