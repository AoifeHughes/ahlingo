#!/bin/bash
# Enhanced iOS build script with optimizations

echo "Building AHLingo for iOS with performance optimizations..."

# Install required packages
toolchain build python kivy
toolchain pip install kivymd tqdm

# iOS-specific optimizations
echo "Applying iOS performance optimizations..."

# Set environment variables for better iOS performance
export KIVY_NO_ARGS=1
export KIVY_NO_CONSOLELOG=1
export KIVY_GRAPHICS_PIPELINE=gl
export KIVY_GL_BACKEND=angle_sdl2

# Build the app with optimized settings
toolchain create AHLingo \
    --title "AHLingo" \
    --package org.ahlingo.app \
    --icon assets/logo.png \
    --orientation portrait \
    --presplash assets/logo.png \
    --with-sqlite3 \
    --add-file database/languageLearningDatabase.db:database/languageLearningDatabase.db \
    --add-file assets:assets

echo "Build completed. The app should now have improved performance on iOS."
