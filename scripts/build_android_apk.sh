#!/bin/bash

# Build Android APK Script
# This script:
# 1. Copies the latest database file to Android assets
# 2. Builds a release APK
# 3. Copies the APK to the apk folder in project root

set -e  # Exit on error

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Building Android APK ===${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MOBILE_DIR="$PROJECT_ROOT/ahlingo_mobile"
DATABASE_SOURCE="$PROJECT_ROOT/database/languageLearningDatabase.db"
ANDROID_ASSETS_DIR="$MOBILE_DIR/android/app/src/main/assets/databases"
APK_OUTPUT_DIR="$MOBILE_DIR/apk"

echo -e "${BLUE}Step 1: Copying database file...${NC}"

# Check if database file exists
if [ ! -f "$DATABASE_SOURCE" ]; then
    echo -e "${RED}Error: Database file not found at $DATABASE_SOURCE${NC}"
    exit 1
fi

# Create Android assets directory if it doesn't exist
mkdir -p "$ANDROID_ASSETS_DIR"

# Copy database file
cp "$DATABASE_SOURCE" "$ANDROID_ASSETS_DIR/languageLearningDatabase.db"
echo -e "${GREEN}✓ Database copied to Android assets${NC}"

echo -e "${BLUE}Step 2: Building Android APK...${NC}"

# Navigate to mobile directory
cd "$MOBILE_DIR"

# Clean previous builds (optional, comment out if you want faster builds)
echo -e "${BLUE}Cleaning previous builds...${NC}"
cd android && ./gradlew clean && cd ..

# Build the release APK
echo -e "${BLUE}Building release APK...${NC}"
cd android && ./gradlew assembleRelease && cd ..

echo -e "${GREEN}✓ APK built successfully${NC}"

echo -e "${BLUE}Step 3: Copying APK to output folder...${NC}"

# Create APK output directory if it doesn't exist
mkdir -p "$APK_OUTPUT_DIR"

# Find the generated APK
APK_SOURCE="$MOBILE_DIR/android/app/build/outputs/apk/release/app-release.apk"

if [ ! -f "$APK_SOURCE" ]; then
    echo -e "${RED}Error: APK not found at $APK_SOURCE${NC}"
    exit 1
fi

# Get version name from build.gradle
VERSION=$(grep "versionName" "$MOBILE_DIR/android/app/build.gradle" | awk '{print $2}' | tr -d '"')
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
APK_FILENAME="ahlingo-${VERSION}-${TIMESTAMP}.apk"

# Copy APK with versioned filename
cp "$APK_SOURCE" "$APK_OUTPUT_DIR/$APK_FILENAME"

# Also create a symlink/copy as latest
cp "$APK_SOURCE" "$APK_OUTPUT_DIR/ahlingo-latest.apk"

echo -e "${GREEN}✓ APK copied to: $APK_OUTPUT_DIR/$APK_FILENAME${NC}"
echo -e "${GREEN}✓ Latest APK: $APK_OUTPUT_DIR/ahlingo-latest.apk${NC}"

# Show APK info
APK_SIZE=$(du -h "$APK_OUTPUT_DIR/$APK_FILENAME" | cut -f1)
echo ""
echo -e "${BLUE}=== Build Complete ===${NC}"
echo -e "Version: ${GREEN}$VERSION${NC}"
echo -e "Size: ${GREEN}$APK_SIZE${NC}"
echo -e "Location: ${GREEN}$APK_OUTPUT_DIR/$APK_FILENAME${NC}"
echo ""
echo -e "${BLUE}You can install the APK using:${NC}"
echo -e "  adb install \"$APK_OUTPUT_DIR/$APK_FILENAME\""
