# Mobile App Troubleshooting

## Package Resolution Issues

### Problem
```
ERROR  Error: Unable to resolve module react-redux from App.tsx
ERROR  Error: Unable to resolve module @react-navigation/native-stack
```

### Root Cause
In npm workspaces, packages can be hoisted to the root `node_modules` but Metro bundler may not find them.

### Solution

1. **Check dependencies**: Run `npm run check-deps` to verify all packages are installed
2. **Install missing packages**: Run `npm install` if any are missing
3. **Clear Metro cache**: Run `npx react-native start --reset-cache`
4. **Restart bundler**: Kill existing Metro processes and restart

### Metro Configuration
The `metro.config.js` is configured to:
- Watch the workspace root directory
- Enable symlink resolution
- Include both local and root `node_modules` in resolution paths

### Automatic Checking
- The `postinstall` script automatically checks dependencies after each install
- Run `npm run check-deps` manually to verify dependency status

### If Problems Persist

1. **Clear all caches**:
   ```bash
   npx react-native start --reset-cache
   rm -rf node_modules
   npm install
   ```

2. **Reset Watchman** (if using):
   ```bash
   watchman watch-del '/Users/aoife/git/ahlingo'
   watchman watch-project '/Users/aoife/git/ahlingo'
   ```

3. **Verify workspace structure**:
   ```bash
   npm ls react-redux
   npm ls @react-navigation/native-stack
   ```