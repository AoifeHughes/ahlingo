#!/bin/bash

# iOS App Icon Generator Script
# This script generates all required iOS app icon sizes from a logo.png file
cd ../assets
# Check if logo.png exists
if [ ! -f "logo.png" ]; then
    echo "Error: logo.png not found in current directory!"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed. Please install it first."
    echo "On macOS: brew install imagemagick"
    echo "On Ubuntu/Debian: sudo apt-get install imagemagick"
    exit 1
fi

# Create output directory
mkdir -p ios-icons

echo "Generating iOS app icons..."

# iPhone Notification icons - 20pt
echo "Creating iPhone Notification icons (20pt)..."
convert logo.png -resize 40x40 ios-icons/icon-40x40@2x.png
convert logo.png -resize 60x60 ios-icons/icon-60x60@3x.png

# iPhone Settings icons - 29pt
echo "Creating iPhone Settings icons (29pt)..."
convert logo.png -resize 58x58 ios-icons/icon-58x58@2x.png
convert logo.png -resize 87x87 ios-icons/icon-87x87@3x.png

# iPhone Spotlight icons - 40pt
echo "Creating iPhone Spotlight icons (40pt)..."
convert logo.png -resize 80x80 ios-icons/icon-80x80@2x.png
convert logo.png -resize 120x120 ios-icons/icon-120x120@3x.png

# iPhone App icons - 60pt
echo "Creating iPhone App icons (60pt)..."
convert logo.png -resize 120x120 ios-icons/icon-120x120@2x.png
convert logo.png -resize 180x180 ios-icons/icon-180x180@3x.png

# Optional: Create a JSON file with icon information
cat > ios-icons/Contents.json << EOF
{
  "images" : [
    {
      "size" : "20x20",
      "idiom" : "iphone",
      "filename" : "icon-40x40@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "20x20",
      "idiom" : "iphone",
      "filename" : "icon-60x60@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "29x29",
      "idiom" : "iphone",
      "filename" : "icon-58x58@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "29x29",
      "idiom" : "iphone",
      "filename" : "icon-87x87@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "40x40",
      "idiom" : "iphone",
      "filename" : "icon-80x80@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "40x40",
      "idiom" : "iphone",
      "filename" : "icon-120x120@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "60x60",
      "idiom" : "iphone",
      "filename" : "icon-120x120@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "60x60",
      "idiom" : "iphone",
      "filename" : "icon-180x180@3x.png",
      "scale" : "3x"
    }
  ],
  "info" : {
    "version" : 1,
    "author" : "iOS Icon Generator Script"
  }
}
EOF

echo "✅ All icons generated successfully in the 'ios-icons' directory!"
echo ""
echo "Generated files:"
ls -la ios-icons/*.png
echo ""
echo "You can now add these icons to your Xcode project's Assets.xcassets"
