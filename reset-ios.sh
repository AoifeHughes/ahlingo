#!/bin/bash

# AHLingo iOS Development Reset Script
# This script performs a clean reinstall of all dependencies for iOS development

echo "🧹 Starting AHLingo iOS clean reset..."

# Exit on any error
set -e

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📦 Step 1: Cleaning all node_modules and iOS build artifacts..."
rm -rf node_modules
rm -rf packages/*/node_modules
rm -rf packages/mobile/ios/Pods
rm -rf packages/mobile/ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData/*

echo "📥 Step 2: Installing npm dependencies..."
npm install

echo "🔨 Step 3: Building core package..."
npm run build --workspace=packages/core

echo "🍎 Step 4: Installing iOS CocoaPods..."
cd packages/mobile/ios
bundle exec pod install
cd "$SCRIPT_DIR"

echo "🧹 Step 5: Clearing Metro cache..."
cd packages/mobile
npx react-native start --reset-cache &
METRO_PID=$!
sleep 5
kill $METRO_PID 2>/dev/null || true

echo "✅ Reset complete! You can now run:"
echo "   cd packages/mobile && npx react-native run-ios"
echo ""
echo "Or from the root directory:"
echo "   npm run ios --workspace=packages/mobile"