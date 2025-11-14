#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Version bump script for AhLingo.
Updates version across all platform-specific files and database.

Usage (from repo root):
    python scripts/bump_version.py major  # 1.4.0 -> 2.0.0
    python scripts/bump_version.py minor  # 1.4.0 -> 1.5.0
    python scripts/bump_version.py patch  # 1.4.0 -> 1.4.1
    python scripts/bump_version.py 1.5.0  # Set to specific version
"""
import json
import re
import sys
import shutil
from pathlib import Path
from typing import Tuple

# Add content directory to Python path for database access
sys.path.insert(0, str(Path(__file__).parent.parent / "content"))
from database.database_manager import LanguageDB


def parse_version(version_str: str) -> Tuple[int, int, int]:
    """Parse version string into (major, minor, patch) tuple."""
    parts = version_str.split(".")
    if len(parts) != 3:
        raise ValueError(
            f"Invalid version format: {version_str}. Expected format: X.Y.Z"
        )
    try:
        return tuple(int(p) for p in parts)
    except ValueError:
        raise ValueError(
            f"Invalid version format: {version_str}. All parts must be integers"
        )


def bump_version(current: Tuple[int, int, int], bump_type: str) -> Tuple[int, int, int]:
    """Bump version based on type."""
    major, minor, patch = current

    if bump_type == "major":
        return (major + 1, 0, 0)
    elif bump_type == "minor":
        return (major, minor + 1, 0)
    elif bump_type == "patch":
        return (major, minor, patch + 1)
    else:
        raise ValueError(
            f"Invalid bump type: {bump_type}. Must be 'major', 'minor', or 'patch'"
        )


def update_package_json(file_path: Path, new_version: str) -> bool:
    """Update version in package.json."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        old_version = data.get("version", "unknown")
        data["version"] = new_version

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            f.write("\n")  # Add trailing newline

        print(f"✓ Updated {file_path.name}: {old_version} -> {new_version}")
        return True
    except Exception as e:
        print(f"✗ Error updating {file_path.name}: {e}")
        return False


def update_android_gradle(
    file_path: Path, new_version: str, new_version_code: int
) -> bool:
    """Update versionName and versionCode in Android build.gradle."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Update versionName
        old_content = content
        content = re.sub(
            r'versionName\s+"[^"]+"', f'versionName "{new_version}"', content
        )

        # Update versionCode
        content = re.sub(
            r"versionCode\s+\d+", f"versionCode {new_version_code}", content
        )

        if content != old_content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(
                f"✓ Updated Android build.gradle: versionName={new_version}, versionCode={new_version_code}"
            )
            return True
        else:
            print(f"⚠ No changes made to Android build.gradle (pattern not found)")
            return False
    except Exception as e:
        print(f"✗ Error updating Android build.gradle: {e}")
        return False


def update_ios_project(
    file_path: Path, new_version: str, new_build_number: int
) -> bool:
    """Update MARKETING_VERSION and CURRENT_PROJECT_VERSION in iOS project.pbxproj."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        old_content = content

        # Update MARKETING_VERSION
        content = re.sub(
            r"MARKETING_VERSION\s*=\s*[^;]+;",
            f"MARKETING_VERSION = {new_version};",
            content,
        )

        # Update CURRENT_PROJECT_VERSION
        content = re.sub(
            r"CURRENT_PROJECT_VERSION\s*=\s*\d+;",
            f"CURRENT_PROJECT_VERSION = {new_build_number};",
            content,
        )

        if content != old_content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(
                f"✓ Updated iOS project.pbxproj: MARKETING_VERSION={new_version}, CURRENT_PROJECT_VERSION={new_build_number}"
            )
            return True
        else:
            print(f"⚠ No changes made to iOS project.pbxproj (pattern not found)")
            return False
    except Exception as e:
        print(f"✗ Error updating iOS project.pbxproj: {e}")
        return False


def update_database_version(db_path: Path, new_version_code: int) -> bool:
    """Update the database version to match the app version."""
    try:
        if not db_path.exists():
            print(f"⚠ Database not found at {db_path} - skipping database update")
            print(
                f"  (Database will be created with correct version when generated)"
            )
            return True

        with LanguageDB(str(db_path)) as db:
            old_version = db.get_database_version()
            db.set_database_version(new_version_code)
            print(
                f"✓ Updated database version: {old_version} -> {new_version_code}"
            )
            return True
    except Exception as e:
        print(f"✗ Error updating database version: {e}")
        return False


def copy_database_to_assets(db_path: Path, repo_root: Path) -> bool:
    """Copy the database to app assets folders for React Native and Android."""
    if not db_path.exists():
        print(f"⚠ Database not found at {db_path} - skipping copy to assets")
        return True

    # Define target directories
    targets = [
        repo_root / "ahlingo_mobile" / "assets" / "databases" / "languageLearningDatabase.db",
        repo_root / "ahlingo_mobile" / "android" / "app" / "src" / "main" / "assets" / "databases" / "languageLearningDatabase.db",
    ]

    success = True
    for target in targets:
        try:
            # Ensure target directory exists
            target.parent.mkdir(parents=True, exist_ok=True)

            # Copy database
            shutil.copy2(db_path, target)
            print(f"✓ Copied database to {target.relative_to(repo_root)}")
        except Exception as e:
            print(f"✗ Error copying database to {target.relative_to(repo_root)}: {e}")
            success = False

    return success


def main():
    if len(sys.argv) != 2:
        print("Usage: python scripts/bump_version.py [major|minor|patch|X.Y.Z]")
        print("\nExamples:")
        print("  python scripts/bump_version.py major  # Bump major version")
        print("  python scripts/bump_version.py minor  # Bump minor version")
        print("  python scripts/bump_version.py patch  # Bump patch version")
        print("  python scripts/bump_version.py 1.5.0  # Set specific version")
        sys.exit(1)

    arg = sys.argv[1]
    repo_root = Path(__file__).parent.parent

    # File paths
    package_json = repo_root / "ahlingo_mobile" / "package.json"
    android_gradle = repo_root / "ahlingo_mobile" / "android" / "app" / "build.gradle"
    ios_project = (
        repo_root / "ahlingo_mobile" / "ios" / "AhLingo.xcodeproj" / "project.pbxproj"
    )
    database_path = repo_root / "database" / "languageLearningDatabase.db"

    # Read current version from package.json
    try:
        with open(package_json, "r", encoding="utf-8") as f:
            current_version_str = json.load(f).get("version", "0.0.0")
    except Exception as e:
        print(f"Error reading current version: {e}")
        sys.exit(1)

    current_version = parse_version(current_version_str)

    # Determine new version
    if arg in ["major", "minor", "patch"]:
        new_version = bump_version(current_version, arg)
        new_version_str = ".".join(str(v) for v in new_version)
    else:
        # Assume it's a specific version
        try:
            new_version = parse_version(arg)
            new_version_str = arg
        except ValueError as e:
            print(f"Error: {e}")
            sys.exit(1)

    # Calculate version code for Android/iOS (major * 100 + minor * 10 + patch)
    version_code = new_version[0] * 100 + new_version[1] * 10 + new_version[2]

    print(f"\n{'='*60}")
    print(f"Bumping version: {current_version_str} -> {new_version_str}")
    print(f"Version code: {version_code}")
    print(f"{'='*60}\n")

    # Update all files
    success = True
    success &= update_package_json(package_json, new_version_str)
    success &= update_android_gradle(android_gradle, new_version_str, version_code)
    success &= update_ios_project(ios_project, new_version_str, version_code)
    success &= update_database_version(database_path, version_code)
    success &= copy_database_to_assets(database_path, repo_root)

    if success:
        print(f"\n{'='*60}")
        print(f"✓ Version successfully bumped to {new_version_str}")
        print(f"✓ Database version automatically updated to {version_code}")
        print(f"✓ Database copied to app assets folders")
        print(f"{'='*60}")
        print(f"\nNext steps:")
        print(f"  1. Review the changes: git diff")
        print(f"  2. Commit the changes:")
        print(f"     git add -A")
        print(f"     git commit -m 'chore: bump version to {new_version_str}'")
        print(f"  3. Tag the release:")
        print(f"     git tag v{new_version_str}")
        print(f"     git push origin v{new_version_str}")
    else:
        print(f"\n{'='*60}")
        print(f"⚠ Version bump completed with some errors")
        print(f"{'='*60}")
        sys.exit(1)


if __name__ == "__main__":
    main()
