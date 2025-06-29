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
import { logDatabaseTables } from './src/services/SimpleDatabaseService';

function AppContent(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    // Initialize database when app starts
    const initializeApp = async () => {
      try {
        // The database will be automatically initialized when first accessed
        // by any SimpleDatabaseService function. Let's log the tables to verify.
        console.log('App starting - database will initialize on first access');
        
        // Add a small delay then log database tables to verify everything works
        setTimeout(() => {
          logDatabaseTables();
        }, 1000);
        
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
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
