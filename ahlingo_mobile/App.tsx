/**
 * AHLingo React Native App
 * Language Learning Application
 * Migrated from Kivy to React Native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeDatabase, logDatabaseTables } from './src/services/RefactoredDatabaseService';

function AppContent(): React.JSX.Element {

  useEffect(() => {
    // Initialize database when app starts
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing AHLingo app...');

        // Initialize database once during app startup
        await initializeDatabase();
        console.log('✅ Database initialized successfully');

        // Log database tables to verify everything works
        await logDatabaseTables();

        console.log('✅ App initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      <AppNavigator />
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </Provider>
  );
}


export default App;
