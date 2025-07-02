import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface StorageInfoCardProps {
  storageUsage: { totalSize: number; modelCount: number };
  onRefresh: () => void;
  theme: any;
}

const formatFileSize = (bytes: number): string => {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
};

const StorageInfoCard: React.FC<StorageInfoCardProps> = ({ 
  storageUsage, 
  onRefresh, 
  theme 
}) => {
  const styles = StyleSheet.create({
    storageInfo: {
      backgroundColor: theme.colors.surfaceDark,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.base,
      marginBottom: theme.spacing.sm,
    },
    storageText: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    refreshButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      alignSelf: 'flex-start',
      marginTop: theme.spacing.xs,
    },
    refreshButtonText: {
      color: theme.colors.background,
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.semibold,
    },
  });

  return (
    <View style={styles.storageInfo}>
      <Text style={styles.storageText}>
        Storage Used: {formatFileSize(storageUsage.totalSize)}
      </Text>
      <Text style={styles.storageText}>
        Models Downloaded: {storageUsage.modelCount}
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
};

export default StorageInfoCard;