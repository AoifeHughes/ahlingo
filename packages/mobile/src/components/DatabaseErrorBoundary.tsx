import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DatabaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Database Error Boundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Would you like to report this issue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report Issue',
          onPress: () => {
            const subject = encodeURIComponent('AHLingo Database Error');
            const body = encodeURIComponent(
              `Error: ${this.state.error?.message || 'Unknown error'}\n\nPlease describe what you were doing when this error occurred:`
            );
            Linking.openURL(`mailto:support@ahlingo.com?subject=${subject}&body=${body}`);
          },
        },
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      const isDatabaseError = this.state.error?.message?.includes('Database unavailable');

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>
              {isDatabaseError ? 'Database Not Available' : 'Something Went Wrong'}
            </Text>
            <Text style={styles.errorMessage}>
              {isDatabaseError
                ? 'The language learning database could not be loaded. This is required for the app to function.'
                : this.state.error?.message || 'An unexpected error occurred.'}
            </Text>

            <View style={styles.troubleshootingContainer}>
              <Text style={styles.troubleshootingTitle}>Troubleshooting Steps:</Text>
              <Text style={styles.troubleshootingItem}>• Force quit and restart the app</Text>
              <Text style={styles.troubleshootingItem}>• Check if the app is properly installed</Text>
              <Text style={styles.troubleshootingItem}>• Reinstall the app if the problem persists</Text>
            </View>

            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.supportButton} onPress={this.handleContactSupport}>
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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