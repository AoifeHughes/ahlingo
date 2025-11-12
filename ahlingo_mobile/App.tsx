/**
 * AHLingo React Native App
 * Language Learning Application
 * Migrated from Kivy to React Native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeDatabase, logDatabaseTables, getUserContext } from './src/services/RefactoredDatabaseService';
import { setSettings } from './src/store/slices/settingsSlice';
import { ThemeProvider } from './src/contexts/ThemeContext';

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

        // Load user settings from database and update Redux store
        try {
          const userContext = await getUserContext();
          console.log('👤 User context loaded:', userContext);

          store.dispatch(setSettings({
            language: userContext.settings.language,
            difficulty: userContext.settings.difficulty,
            userId: userContext.userId || 1,
          }));
          console.log('✅ User settings loaded into Redux store');
        } catch (settingsError) {
          console.error('⚠️ Failed to load user settings, using defaults:', settingsError);
          // Fallback to defaults if settings loading fails
          store.dispatch(setSettings({
            language: 'English',
            difficulty: 'Beginner',
            userId: 1,
          }));
        }

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
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}


export default App;
