#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Centralized version management for AhLingo.
Reads version from package.json as the single source of truth.
"""
import json
from pathlib import Path

# Path to package.json (single source of truth for version)
PACKAGE_JSON_PATH = Path(__file__).parent / "ahlingo_mobile" / "package.json"


def get_version() -> str:
    """
    Get the current version from package.json.

    Returns:
        Version string (e.g., "1.4.0")
    """
    try:
        with open(PACKAGE_JSON_PATH, "r", encoding="utf-8") as f:
            package_data = json.load(f)
            return package_data.get("version", "0.0.0")
    except FileNotFoundError:
        print(f"Warning: package.json not found at {PACKAGE_JSON_PATH}")
        return "0.0.0"
    except Exception as e:
        print(f"Error reading version from package.json: {e}")
        return "0.0.0"


def get_version_tuple() -> tuple:
    """
    Get version as a tuple of integers (major, minor, patch).

    Returns:
        Tuple of (major, minor, patch) as integers
    """
    version_str = get_version()
    try:
        parts = version_str.split(".")
        return tuple(int(part) for part in parts[:3])
    except (ValueError, IndexError):
        return (0, 0, 0)


def get_database_version() -> int:
    """
    Get database version as an integer.
    Database version follows the pattern: major * 100 + minor * 10 + patch

    For example:
    - 1.4.0 -> 140
    - 2.3.5 -> 235

    Returns:
        Integer database version
    """
    major, minor, patch = get_version_tuple()
    return major * 100 + minor * 10 + patch


# Module-level constants for convenience
__version__ = get_version()
VERSION_TUPLE = get_version_tuple()
DATABASE_VERSION = get_database_version()


if __name__ == "__main__":
    print(f"AhLingo Version: {__version__}")
    print(f"Version Tuple: {VERSION_TUPLE}")
    print(f"Database Version: {DATABASE_VERSION}")
