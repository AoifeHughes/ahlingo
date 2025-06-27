# AHLingo Language Learning - Monorepo

This is the monorepo for the AHLingo language learning application, featuring React Native mobile and Electron desktop apps with shared business logic.

## Project Structure

```
ahlingo/
├── packages/
│   ├── core/               # Pure JS/TS business logic
│   │   ├── src/           # Source code
│   │   │   ├── api/       # API clients and interfaces
│   │   │   ├── models/    # Data models and types
│   │   │   ├── services/  # Business logic services
│   │   │   └── utils/     # Shared utilities
│   │   └── types/         # TypeScript type definitions
│   ├── mobile/            # React Native app
│   │   ├── src/          # React Native source code
│   │   ├── android/      # Android platform files
│   │   └── ios/          # iOS platform files
│   └── desktop/          # Electron + React app
│       ├── src/          # React app source code
│       ├── public/       # Static assets and electron.js
│       └── build/        # Built React app
├── database/             # Original SQLite database
├── package.json          # Root workspace configuration
└── tsconfig.json         # Root TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- For mobile development:
  - React Native CLI
  - Android Studio (for Android)
  - Xcode (for iOS, macOS only)
- For desktop development:
  - All dependencies are installed via npm

### Installation

1. Install all dependencies:
```bash
npm install
```

This will install dependencies for all packages using npm workspaces.

2. Build the core package:
```bash
npm run build --workspace=packages/core
```

## Development Scripts

### Root Level Commands

```bash
# Install all dependencies
npm run install:all

# Build all packages
npm run build

# Run all apps in development mode (requires multiple terminals)
npm run dev

# Run individual package development
npm run dev:core      # Build core package in watch mode
npm run dev:mobile    # Start React Native Metro bundler
npm run dev:desktop   # Start Electron app in development

# Run tests across all packages
npm run test

# Lint all packages
npm run lint

# Clean all build artifacts and node_modules
npm run clean

# Reset: clean and reinstall everything
npm run reset
```

### Core Package

```bash
# Build the core package
cd packages/core
npm run build

# Watch mode for development
npm run dev

# Run tests
npm run test

# Lint code
npm run lint
```

### Mobile App (React Native)

```bash
cd packages/mobile

# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator/device
npm run android

# Run tests
npm run test

# Lint code
npm run lint

# Clean React Native
npm run clean
```

### Desktop App (Electron)

```bash
cd packages/desktop

# Start in development mode
npm run dev

# Build for production
npm run build

# Package for distribution
npm run dist

# Platform-specific builds
npm run dist:mac
npm run dist:win
npm run dist:linux

# Run tests
npm run test

# Lint code
npm run lint
```

## Hello World Setup Status

### ✅ Completed Features

- **Monorepo Structure**: Complete workspace setup with shared dependencies
- **Core Business Logic**: Extracted from Python codebase with TypeScript interfaces
- **Database Layer**: SQLite wrapper using better-sqlite3 for cross-platform compatibility
- **Mobile App**: React Native app with navigation, Redux state management, and basic screens
- **Desktop App**: Electron app with React, Material-UI, and matching screen structure
- **Shared Types**: Common TypeScript interfaces used across all packages
- **Development Tooling**: ESLint, Prettier, and build scripts configured

### 🚧 Current Status (Hello World)

Both mobile and desktop apps currently show:
- **Main Menu**: Navigation to different exercise types
- **Settings Screen**: User preferences and configuration
- **Topic Selection**: Choose learning topics (with mock data)
- **Pairs Game**: Basic game interface (mobile has partial implementation)
- **Placeholder Screens**: For conversation, translation, and chatbot features

### 📱 Mobile App Features

- React Navigation with stack navigator
- Redux Toolkit for state management
- React Native Elements for UI components
- Working pairs game with basic functionality
- Material Design theming
- Cross-platform (iOS/Android) support

### 🖥️ Desktop App Features

- Electron with React renderer
- Material-UI components and theming
- Responsive sidebar navigation
- Redux state management (shared logic with mobile)
- Cross-platform desktop support (Windows, macOS, Linux)

## Development Workflow

### Adding New Features

1. **Core Logic**: Add business logic to `packages/core/src/services/`
2. **Types**: Define interfaces in `packages/core/types/`
3. **Mobile**: Implement UI in `packages/mobile/src/screens/`
4. **Desktop**: Implement UI in `packages/desktop/src/screens/`

### Database Integration

Currently using mock data. To integrate the SQLite database:

1. **Core Package**: Implement database operations in `packages/core/src/services/database.ts`
2. **Mobile**: Use React Native SQLite storage
3. **Desktop**: Use Electron main process for database access

### Shared State Management

Both apps use Redux Toolkit with similar slice structures:
- `userSettingsSlice`: User preferences and settings
- `exerciseSlice`: Exercise data and content
- `gameSlice`: Game state management
- `navigationSlice` (mobile) / `uiSlice` (desktop): UI state

## Next Steps for Full Implementation

1. **Database Integration**:
   - Copy existing SQLite database
   - Implement database operations in core package
   - Connect mobile and desktop apps to real data

2. **Feature Implementation**:
   - Complete pairs game functionality
   - Implement conversation exercises
   - Add translation exercises
   - Integrate AI chatbot

3. **Advanced Features**:
   - User progress tracking
   - Audio pronunciation
   - Offline synchronization
   - Settings persistence

4. **Testing & Quality**:
   - Unit tests for core logic
   - Integration tests for database operations
   - E2E tests for user workflows

## Technology Stack

### Core
- TypeScript
- Better SQLite3
- Custom business logic services

### Mobile
- React Native 0.72+
- React Navigation 6
- Redux Toolkit
- React Native Elements
- React Native SQLite Storage

### Desktop
- Electron 26+
- React 18
- Material-UI 5
- Redux Toolkit
- Better SQLite3

## Contributing

1. Make changes in the appropriate package
2. Update shared types in the core package if needed
3. Test changes in both mobile and desktop apps
4. Run lint and tests before committing
5. Update documentation as needed

## Troubleshooting

### Common Issues

1. **Core package not found**: Run `npm run build --workspace=packages/core`
2. **Metro bundler issues**: Clear cache with `npx react-native start --reset-cache`
3. **Electron not starting**: Check that React build exists in `packages/desktop/build/`
4. **TypeScript errors**: Ensure all packages have compatible TypeScript versions

### Getting Help

- Check the individual package README files
- Review the original Python implementation for business logic reference
- Check the migration documentation in `REACT_NATIVE_MIGRATION_SPEC.md`

## License

MIT License - see LICENSE file for details.