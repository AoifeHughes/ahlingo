/**
 * @format
 */

console.log('📱 index.js loading...');

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

console.log('📱 Registering app component:', appName);
console.log('📱 App component:', typeof App);

AppRegistry.registerComponent(appName, () => App);

console.log('📱 App registration complete');
