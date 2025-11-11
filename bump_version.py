#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Version bump script for AhLingo.
Updates version across all platform-specific files.

Usage:
    python bump_version.py major  # 1.4.0 -> 2.0.0
    python bump_version.py minor  # 1.4.0 -> 1.5.0
    python bump_version.py patch  # 1.4.0 -> 1.4.1
    python bump_version.py 1.5.0  # Set to specific version
"""
import json
import re
import sys
from pathlib import Path
from typing import Tuple


def parse_version(version_str: str) -> Tuple[int, int, int]:
    """Parse version string into (major, minor, patch) tuple."""
    parts = version_str.split(".")
    if len(parts) != 3:
        raise ValueError(f"Invalid version format: {version_str}. Expected format: X.Y.Z")
    try:
        return tuple(int(p) for p in parts)
    except ValueError:
        raise ValueError(f"Invalid version format: {version_str}. All parts must be integers")


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
        raise ValueError(f"Invalid bump type: {bump_type}. Must be 'major', 'minor', or 'patch'")


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


def update_android_gradle(file_path: Path, new_version: str, new_version_code: int) -> bool:
    """Update versionName and versionCode in Android build.gradle."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Update versionName
        old_content = content
        content = re.sub(
            r'versionName\s+"[^"]+"',
            f'versionName "{new_version}"',
            content
        )

        # Update versionCode
        content = re.sub(
            r'versionCode\s+\d+',
            f'versionCode {new_version_code}',
            content
        )

        if content != old_content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"✓ Updated Android build.gradle: versionName={new_version}, versionCode={new_version_code}")
            return True
        else:
            print(f"⚠ No changes made to Android build.gradle (pattern not found)")
            return False
    except Exception as e:
        print(f"✗ Error updating Android build.gradle: {e}")
        return False


def update_ios_project(file_path: Path, new_version: str, new_build_number: int) -> bool:
    """Update MARKETING_VERSION and CURRENT_PROJECT_VERSION in iOS project.pbxproj."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        old_content = content

        # Update MARKETING_VERSION
        content = re.sub(
            r'MARKETING_VERSION\s*=\s*[^;]+;',
            f'MARKETING_VERSION = {new_version};',
            content
        )

        # Update CURRENT_PROJECT_VERSION
        content = re.sub(
            r'CURRENT_PROJECT_VERSION\s*=\s*\d+;',
            f'CURRENT_PROJECT_VERSION = {new_build_number};',
            content
        )

        if content != old_content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"✓ Updated iOS project.pbxproj: MARKETING_VERSION={new_version}, CURRENT_PROJECT_VERSION={new_build_number}")
            return True
        else:
            print(f"⚠ No changes made to iOS project.pbxproj (pattern not found)")
            return False
    except Exception as e:
        print(f"✗ Error updating iOS project.pbxproj: {e}")
        return False


def main():
    if len(sys.argv) != 2:
        print("Usage: python bump_version.py [major|minor|patch|X.Y.Z]")
        print("\nExamples:")
        print("  python bump_version.py major  # Bump major version")
        print("  python bump_version.py minor  # Bump minor version")
        print("  python bump_version.py patch  # Bump patch version")
        print("  python bump_version.py 1.5.0  # Set specific version")
        sys.exit(1)

    arg = sys.argv[1]
    repo_root = Path(__file__).parent

    # File paths
    package_json = repo_root / "ahlingo_mobile" / "package.json"
    android_gradle = repo_root / "ahlingo_mobile" / "android" / "app" / "build.gradle"
    ios_project = repo_root / "ahlingo_mobile" / "ios" / "AhLingo.xcodeproj" / "project.pbxproj"

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

    if success:
        print(f"\n{'='*60}")
        print(f"✓ Version successfully bumped to {new_version_str}")
        print(f"{'='*60}")
        print(f"\nNext steps:")
        print(f"  1. Review the changes: git diff")
        print(f"  2. Regenerate database if schema changed:")
        print(f"     python content/create_exercise_database.py")
        print(f"  3. Commit the changes:")
        print(f"     git add -A")
        print(f"     git commit -m 'chore: bump version to {new_version_str}'")
        print(f"  4. Tag the release:")
        print(f"     git tag v{new_version_str}")
        print(f"     git push origin v{new_version_str}")
    else:
        print(f"\n{'='*60}")
        print(f"⚠ Version bump completed with some errors")
        print(f"{'='*60}")
        sys.exit(1)


if __name__ == "__main__":
    main()
