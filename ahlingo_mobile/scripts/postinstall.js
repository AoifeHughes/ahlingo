const { execSync } = require('child_process');

// `pod install` requires CocoaPods, which is only relevant (and only
// installed) on macOS. Skip it on Linux/Windows CI runners and dev
// machines instead of failing the whole `npm ci`/`npm install`.
if (process.platform === 'darwin') {
  execSync('pod install', { cwd: 'ios', stdio: 'inherit' });
}

execSync('node scripts/syncIosAssets.js', { stdio: 'inherit' });
