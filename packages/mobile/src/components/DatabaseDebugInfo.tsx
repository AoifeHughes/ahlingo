import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { DatabaseValidator } from '../utils/DatabaseValidator';
import { SQLiteManager } from '../utils/SQLiteManager';

export const DatabaseDebugInfo: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const collectDebugInfo = async () => {
    setIsLoading(true);
    const info: any = {};

    try {
      // Database file info
      info.fileInfo = await DatabaseValidator.getDatabaseInfo();
    } catch (error: any) {
      info.fileInfoError = error.message;
    }

    try {
      // SQLite Manager status
      const sqliteManager = SQLiteManager.getInstance();
      info.sqliteReady = sqliteManager.isReady();
      info.sqliteError = sqliteManager.getInitializationError();
      
      // Try to test connection
      if (!info.sqliteReady) {
        const connectionTest = await sqliteManager.testConnection();
        info.connectionTest = connectionTest;
      }
    } catch (error: any) {
      info.sqliteManagerError = error.message;
    }

    setDebugInfo(info);
    setIsLoading(false);
  };

  // Remove automatic debug info collection on mount for performance
  // useEffect(() => {
  //   collectDebugInfo();
  // }, []);

  const getStatusColor = (isGood: boolean) => isGood ? '#4CAF50' : '#F44336';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Database Debug Information</Text>
        
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={collectDebugInfo}
          disabled={isLoading}
        >
          <Text style={styles.refreshButtonText}>
            {isLoading ? 'Loading...' : 'Refresh Info'}
          </Text>
        </TouchableOpacity>

        {/* File Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Database Files</Text>
          {debugInfo.fileInfo ? (
            <>
              <Text style={styles.infoText}>
                Bundle Exists: <Text style={{color: getStatusColor(debugInfo.fileInfo.bundleExists)}}>
                  {debugInfo.fileInfo.bundleExists ? 'YES' : 'NO'}
                </Text>
              </Text>
              <Text style={styles.infoText}>
                Documents Exists: <Text style={{color: getStatusColor(debugInfo.fileInfo.documentsExists)}}>
                  {debugInfo.fileInfo.documentsExists ? 'YES' : 'NO'}
                </Text>
              </Text>
              {debugInfo.fileInfo.documentsSize && (
                <Text style={styles.infoText}>
                  File Size: {Math.round(debugInfo.fileInfo.documentsSize / 1024)} KB
                </Text>
              )}
              <Text style={styles.pathText}>Bundle: {debugInfo.fileInfo.bundlePath}</Text>
              <Text style={styles.pathText}>Documents: {debugInfo.fileInfo.documentsPath}</Text>
            </>
          ) : (
            <Text style={styles.errorText}>
              Error: {debugInfo.fileInfoError || 'Unable to get file info'}
            </Text>
          )}
        </View>

        {/* SQLite Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SQLite Status</Text>
          <Text style={styles.infoText}>
            Ready: <Text style={{color: getStatusColor(debugInfo.sqliteReady)}}>
              {debugInfo.sqliteReady ? 'YES' : 'NO'}
            </Text>
          </Text>
          
          {debugInfo.sqliteError && (
            <Text style={styles.errorText}>Error: {debugInfo.sqliteError}</Text>
          )}
          
          {debugInfo.connectionTest && (
            <>
              <Text style={styles.infoText}>
                Connection Test: <Text style={{color: getStatusColor(debugInfo.connectionTest.success)}}>
                  {debugInfo.connectionTest.success ? 'PASSED' : 'FAILED'}
                </Text>
              </Text>
              {!debugInfo.connectionTest.success && (
                <Text style={styles.errorText}>
                  Test Error: {debugInfo.connectionTest.error}
                </Text>
              )}
            </>
          )}
          
          {debugInfo.sqliteManagerError && (
            <Text style={styles.errorText}>
              Manager Error: {debugInfo.sqliteManagerError}
            </Text>
          )}
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {!debugInfo.fileInfo?.bundleExists && (
            <Text style={styles.warningText}>• Database not found in app bundle - reinstall app</Text>
          )}
          {!debugInfo.fileInfo?.documentsExists && (
            <Text style={styles.warningText}>• Database not copied to documents - file copy failed</Text>
          )}
          {debugInfo.sqliteError?.includes('NativeEventEmitter') && (
            <Text style={styles.warningText}>• Run "cd ios && pod install" and rebuild app</Text>
          )}
          {!debugInfo.sqliteReady && (
            <Text style={styles.warningText}>• SQLite module not ready - check native module linking</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  pathText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 3,
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9800',
    marginBottom: 5,
  },
});