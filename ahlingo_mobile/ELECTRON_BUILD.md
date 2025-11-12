# AhLingo Electron Build Guide

This document explains how to build and distribute the AhLingo mobile app as a desktop application using Electron.

## Overview

The Electron build transforms the React Native mobile app into a desktop application using:
- **Electron**: Desktop application framework
- **react-native-web**: Translates React Native components to web-compatible components
- **webpack**: Bundles the application for the Electron renderer process
- **electron-builder**: Creates distributable packages for Windows, macOS, and Linux

## Important Notes

### Native Module Limitations

The following React Native modules are **mocked** in the Electron build and have limited functionality:

1. **react-native-sqlite-storage**: Database operations are logged but not executed
   - You may want to integrate `better-sqlite3` or `sql.js` for production use

2. **react-native-tts**: Text-to-speech uses Web Speech API when available
   - Basic TTS functionality works in Electron via the browser's speech synthesis

3. **react-native-fs**: File system operations are mocked
   - Consider using Electron's native file system APIs for production

4. **llama.rn**: AI/ML operations are mocked
   - Native AI models don't work in Electron; consider alternative solutions

### Mock Files Location

All mock implementations are located in `/electron/mocks/`. You can enhance these mocks with proper Electron-compatible implementations as needed.

## Available Scripts

### Development

```bash
npm run electron:dev
```

Builds the app in development mode and launches Electron. This includes:
- Source maps for debugging
- DevTools automatically opened
- Development mode warnings enabled

### Production Build

```bash
npm run electron:build
```

Creates distributable packages for your current platform:
- **Windows**: NSIS installer and portable executable
- **macOS**: DMG and ZIP archives
- **Linux**: AppImage and DEB packages

Output directory: `dist/`

### Package Without Distribution

```bash
npm run electron:pack
```

Creates an unpacked directory with the app ready to run (useful for testing the production build without creating installers).

### Distribution Only

```bash
npm run electron:dist
```

Same as `electron:build` - creates distributable packages.

## Build Configuration

The Electron build is configured in `package.json` under the `build` key:

```json
{
  "build": {
    "appId": "com.ahlingo.app",
    "productName": "AhLingo",
    "directories": {
      "buildResources": "electron/assets",
      "output": "dist"
    },
    "files": [
      "electron/**/*",
      "electron-build/**/*",
      "package.json"
    ],
    "mac": {
      "category": "public.app-category.education",
      "target": ["dmg", "zip"]
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "category": "Education"
    }
  }
}
```

### Customizing the Build

- **App Icon**: Place icon files in `electron/assets/`
  - macOS: `icon.icns`
  - Windows: `icon.ico`
  - Linux: `icon.png` (512x512 or larger)

- **Build Targets**: Modify the `build` section in `package.json` to change output formats

- **Code Signing**: Add signing credentials to enable signed builds (required for macOS distribution)

## Project Structure

```
ahlingo_mobile/
├── electron/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Preload script for secure IPC
│   ├── index.web.js         # Web entry point (uses react-native-web)
│   ├── index.html           # HTML template
│   ├── assets/              # Build resources (icons, etc.)
│   └── mocks/               # Mock implementations of native modules
│       ├── sqlite-mock.js
│       ├── tts-mock.js
│       ├── fs-mock.js
│       └── llama-mock.js
├── electron-build/          # Webpack output (gitignored)
├── dist/                    # electron-builder output (gitignored)
├── webpack.config.js        # Webpack configuration
└── package.json             # Dependencies and build config
```

## Webpack Configuration

The webpack configuration (`webpack.config.js`) handles:
- Transpiling React Native code to web-compatible code
- Aliasing `react-native` to `react-native-web`
- Replacing native modules with mocks
- Bundling assets (images, fonts, etc.)
- Creating source maps in development mode

## Development Workflow

1. **Make changes** to the React Native source code in `src/`
2. **Run the Electron build** with `npm run electron:dev`
3. **Test the desktop app** in the Electron window
4. **Iterate** as needed
5. **Create distributable** with `npm run electron:build` when ready

## Improving Mock Implementations

To make the Electron app fully functional, consider implementing proper desktop equivalents for the mocked modules:

### SQLite Database

Replace the mock in `electron/mocks/sqlite-mock.js` with a real implementation:

```bash
npm install better-sqlite3
```

Then update the mock to use `better-sqlite3` for actual database operations.

### File System

Use Electron's IPC to communicate with the main process for file operations:

```javascript
// In preload.js
contextBridge.exposeInMainWorld('fileSystem', {
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: (path, data) => ipcRenderer.invoke('write-file', path, data)
});
```

### Text-to-Speech

The current implementation uses Web Speech API, which works in Electron. For more advanced TTS, consider:
- Platform-specific TTS libraries
- Cloud-based TTS services

## Troubleshooting

### Build Failures

- Ensure all dependencies are installed: `npm install --legacy-peer-deps`
- Check Node.js version: `node --version` (should be >= 18)
- Clear build cache: `rm -rf electron-build dist`

### Runtime Errors

- Check the DevTools console (automatically opened in dev mode)
- Verify mock implementations are working as expected
- Check that assets are being copied correctly

### Platform-Specific Issues

- **macOS**: Code signing may be required for distribution
- **Windows**: Antivirus software may block the build process
- **Linux**: Ensure required libraries are installed for AppImage/DEB creation

## Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Documentation](https://www.electron.build/)
- [React Native Web Documentation](https://necolas.github.io/react-native-web/)

## License

This build configuration is part of the AhLingo project and follows the same license.
