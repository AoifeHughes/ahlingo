#!/usr/bin/env node

/**
 * Dependency checker for React Native in npm workspaces
 * Ensures all package.json dependencies are properly installed
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const nodeModulesPath = path.join(__dirname, 'node_modules');
const rootNodeModulesPath = path.join(__dirname, '../../node_modules');

console.log('🔍 Checking React Native dependencies...');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const missing = [];
  const found = [];
  
  for (const [name, version] of Object.entries(dependencies)) {
    const localPath = path.join(nodeModulesPath, name);
    const rootPath = path.join(rootNodeModulesPath, name);
    
    if (fs.existsSync(localPath) || fs.existsSync(rootPath)) {
      found.push(`✅ ${name}`);
    } else {
      missing.push(`❌ ${name} (${version})`);
    }
  }
  
  console.log('\n📦 Dependencies Status:');
  found.forEach(dep => console.log(dep));
  
  if (missing.length > 0) {
    console.log('\n🚨 Missing Dependencies:');
    missing.forEach(dep => console.log(dep));
    console.log('\n💡 Run: npm install');
    process.exit(1);
  } else {
    console.log('\n✅ All dependencies are properly installed!');
  }
  
} catch (error) {
  console.error('❌ Error checking dependencies:', error.message);
  process.exit(1);
}