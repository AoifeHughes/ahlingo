# iOS Development Setup - AHLingo

## Quick Reset

For a complete clean reinstall of the iOS development environment:

```bash
./reset-ios.sh
```

## Manual Reset Steps

If you prefer to run the steps manually:

```bash
# 1. Clean all dependencies and build artifacts
rm -rf node_modules packages/*/node_modules packages/mobile/ios/Pods
rm -rf packages/mobile/ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# 2. Install npm dependencies
npm install

# 3. Build the core package (required by mobile)
npm run build --workspace=packages/core

# 4. Install iOS CocoaPods
cd packages/mobile/ios
bundle exec pod install
cd ../../..

# 5. Clear Metro cache (optional but recommended)
cd packages/mobile
npx react-native start --reset-cache
# Press Ctrl+C after Metro starts

# 6. Run the iOS app
npx react-native run-ios
```

## Common Issues

### Pod Installation Fails
If `bundle exec pod install` fails:
```bash
cd packages/mobile/ios
bundle install  # Install Ruby dependencies first
bundle exec pod install
```

### Metro Bundler Issues
If you encounter Metro bundler errors:
```bash
# Clear all caches
cd packages/mobile
npx react-native start --reset-cache
watchman watch-del-all  # If using Watchman
```

### Build Errors in Xcode
If the build fails in Xcode:
1. Open `packages/mobile/ios/mobile.xcworkspace` (not `.xcodeproj`)
2. Product → Clean Build Folder (Cmd+Shift+K)
3. Product → Build (Cmd+B)

## Development Workflow

After a successful reset, you can run the iOS app with:

```bash
# From packages/mobile directory
npx react-native run-ios

# Or from root directory
npm run ios --workspace=packages/mobile
```

### Specifying a Simulator
```bash
npx react-native run-ios --simulator="iPhone 15 Pro"
```

### Building for Release
```bash
npx react-native run-ios --configuration Release
```