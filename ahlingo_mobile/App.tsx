/**
 * AHLingo React Native App
 * Language Learning Application
 * Migrated from Kivy to React Native
 * 
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme, View, Text, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { logDatabaseTables } from './src/services/SimpleDatabaseService';

function AppContent(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    // Add a small delay to ensure component is mounted
    const timer = setTimeout(() => {
      logDatabaseTables();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.centerContainer}>
        <Text>Check console for database tables</Text>
      </View>
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

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#1976D2',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default App;
