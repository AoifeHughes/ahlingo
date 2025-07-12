#!/bin/bash

# Android Icon Generator Script
# This script generates all required Android app icon sizes from logo.png

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📱 Android Icon Generator for AhLingo${NC}"
echo "=============================================="

# Check if logo.png exists
LOGO_PATH="./assets/logo.png"
if [ ! -f "$LOGO_PATH" ]; then
    echo -e "${RED}❌ Error: logo.png not found at $LOGO_PATH${NC}"
    echo "Please make sure logo.png exists in the assets directory."
    exit 1
fi

echo -e "${GREEN}✅ Found logo.png${NC}"

# Check if ImageMagick is installed
if command -v magick &> /dev/null; then
    CONVERT_CMD="magick"
    echo -e "${GREEN}✅ ImageMagick (v7+) is available${NC}"
elif command -v convert &> /dev/null; then
    CONVERT_CMD="convert"
    echo -e "${GREEN}✅ ImageMagick (legacy) is available${NC}"
else
    echo -e "${RED}❌ Error: ImageMagick is not installed${NC}"
    echo "Please install ImageMagick: brew install imagemagick"
    exit 1
fi

# Base directory for Android resources
RES_DIR="ahlingo_mobile/android/app/src/main/res"

echo -e "${BLUE}📱 Generating Android app icons...${NC}"

# Define icon configurations: "directory:size"
ICON_CONFIGS=(
    "mipmap-mdpi:48"
    "mipmap-hdpi:72" 
    "mipmap-xhdpi:96"
    "mipmap-xxhdpi:144"
    "mipmap-xxxhdpi:192"
)

# Generate icons for each density
for config in "${ICON_CONFIGS[@]}"; do
    IFS=':' read -r dir size <<< "$config"
    target_dir="$RES_DIR/$dir"
    target_file="$target_dir/ic_launcher.png"
    target_round_file="$target_dir/ic_launcher_round.png"
    
    echo -e "${YELLOW}⚙️  Generating ${size}x${size} icons for $dir...${NC}"
    
    # Create directory if it doesn't exist
    mkdir -p "$target_dir"
    
    # Generate the regular square icon
    $CONVERT_CMD "$LOGO_PATH" -resize "${size}x${size}" -background transparent "$target_file"
    
    if [ -f "$target_file" ]; then
        echo -e "${GREEN}   ✅ Created square icon: $target_file${NC}"
    else
        echo -e "${RED}   ❌ Failed to create square icon: $target_file${NC}"
        exit 1
    fi
    
    # Generate the circular icon
    # Create a simple circular crop of the logo
    radius=$((size/2 - 4))
    center=$((size/2))
    $CONVERT_CMD "$LOGO_PATH" -resize "${size}x${size}" \
        -gravity center \
        -extent "${size}x${size}" \
        \( +clone -threshold 101% -fill white -draw "circle ${center},${center} ${center},4" \) \
        -alpha off -compose copy_opacity -composite \
        "$target_round_file"
    if [ -f "$target_round_file" ]; then
        echo -e "${GREEN}   ✅ Created round icon: $target_round_file${NC}"
    else
        echo -e "${RED}   ❌ Failed to create round icon: $target_round_file${NC}"
        exit 1
    fi
done

echo ""
echo -e "${GREEN}🎉 Success! All Android app icons (square + circular) have been generated.${NC}"
echo ""
echo -e "${BLUE}📋 Generated files:${NC}"
for config in "${ICON_CONFIGS[@]}"; do
    IFS=':' read -r dir size <<< "$config"
    echo -e "   📱 $RES_DIR/$dir/ic_launcher.png (${size}x${size} square)"
    echo -e "   🔘 $RES_DIR/$dir/ic_launcher_round.png (${size}x${size} circular)"
done

echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "   1. Clean and rebuild your Android project"
echo "   2. Run: cd ahlingo_mobile/android && ./gradlew clean"
echo "   3. Run: npx react-native run-android"
echo ""
echo -e "${GREEN}🎓 Your AhLingo language learning app now has custom icons!${NC}"