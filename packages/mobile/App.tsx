/**
 * AHLingo Mobile App
 * React Native language learning application
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  SafeAreaView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Provider } from 'react-redux';
import { store, initializeDataAdapters } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { DatabaseErrorBoundary } from './src/components/DatabaseErrorBoundary';
import { DatabaseValidator } from './src/utils/DatabaseValidator';

type AppState = 'loading' | 'ready' | 'error';

interface AppError {
  message: string;
  canRetry: boolean;
}

function App(): JSX.Element {
  const [appState, setAppState] = useState<AppState>('loading');
  const [error, setError] = useState<AppError | null>(null);

  const initializeApp = async () => {
    try {
      setAppState('loading');
      setError(null);
      
      console.log('Initializing app - checking database...');
      
      // Check if DatabaseValidator is available
      if (!DatabaseValidator) {
        throw new Error('DatabaseValidator module failed to import - check module linking');
      }
      
      // Step 1: Validate database files exist
      console.log('Step 1: Validating database files...');
      const fileValidation = await DatabaseValidator.validateDatabaseFiles();
      
      if (!fileValidation.isValid) {
        throw new Error(fileValidation.error || 'Database files not found');
      }
      
      // Step 2: Ensure database is copied to documents directory
      console.log('Step 2: Copying database to writable location...');
      await DatabaseValidator.ensureDatabaseCopied();
      
      // Step 3: Initialize data adapters now that database is ready
      console.log('Step 3: Initializing data adapters...');
      await initializeDataAdapters();
      
      // Step 4: Get database info for logging
      const dbInfo = await DatabaseValidator.getDatabaseInfo();
      console.log('Database info:', dbInfo);
      
      console.log('Database validation and adapter initialization successful');
      setAppState('ready');
    } catch (error: any) {
      console.error('App initialization failed:', error);
      setError({
        message: error.message || 'Failed to initialize app',
        canRetry: true,
      });
      setAppState('error');
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  const handleRetry = () => {
    initializeApp();
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Would you like to report this issue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report Issue',
          onPress: () => {
            console.log('Contact support requested');
            // In a real app, this would open email or support system
          },
        },
      ]
    );
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading AHLingo...</Text>
        <Text style={styles.loadingSubtext}>Preparing your language learning experience</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (appState === 'error' && error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>App Initialization Failed</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
        
        <View style={styles.troubleshootingContainer}>
          <Text style={styles.troubleshootingTitle}>Troubleshooting Steps:</Text>
          <Text style={styles.troubleshootingItem}>• Force quit and restart the app</Text>
          <Text style={styles.troubleshootingItem}>• Check if the app is properly installed</Text>
          <Text style={styles.troubleshootingItem}>• Reinstall the app if the problem persists</Text>
        </View>

        {error.canRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Ready state - render main app
  return (
    <Provider store={store}>
      <DatabaseErrorBoundary onRetry={handleRetry}>
        <AppNavigator />
      </DatabaseErrorBoundary>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  troubleshootingContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  troubleshootingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  troubleshootingItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    paddingLeft: 10,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  supportButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
  },
  supportButtonText: {
    color: '#2196F3',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default App;
