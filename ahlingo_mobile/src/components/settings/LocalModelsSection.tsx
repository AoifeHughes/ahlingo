import React from 'react';
import { View, Text, Switch, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import SettingsItem from '../SettingsItem';
import StorageInfoCard from './StorageInfoCard';
import DownloadProgressBar from './DownloadProgressBar';
import { LocalModel, LocalModelDownloadProgress } from '../../types';
import { FormData } from '../../hooks/useSettingsForm';

interface LocalModelsSectionProps {
  // Form data
  enableLocalModels: boolean;
  preferLocalModels: boolean;
  onUpdateFormData: (field: keyof FormData, value: string | boolean) => void;
  
  // Local models state
  availableLocalModels: LocalModel[];
  downloadedModels: LocalModel[];
  downloadProgress: Record<string, LocalModelDownloadProgress>;
  isLoadingLocalModels: boolean;
  storageUsage: { totalSize: number; modelCount: number };
  
  // Functions
  loadLocalModels: () => Promise<void>;
  downloadModel: (modelId: string) => Promise<void>;
  deleteModel: (modelId: string) => Promise<void>;
  
  // Theme
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

const LocalModelsSection: React.FC<LocalModelsSectionProps> = ({
  enableLocalModels,
  preferLocalModels,
  onUpdateFormData,
  availableLocalModels,
  downloadedModels,
  downloadProgress,
  isLoadingLocalModels,
  storageUsage,
  loadLocalModels,
  downloadModel,
  deleteModel,
  theme,
}) => {
  const styles = createStyles(theme);

  return (
    <>
      <SettingsItem title="Local Models">
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Enable Local Models</Text>
          <Switch
            value={enableLocalModels}
            onValueChange={value => onUpdateFormData('enableLocalModels', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={enableLocalModels ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
        <Text style={styles.helpText}>
          Run AI models locally on your device for privacy and offline use
        </Text>
      </SettingsItem>

      {enableLocalModels && (
        <>
          <SettingsItem title="Prefer Local Models">
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Prefer Local Over Remote</Text>
              <Switch
                value={preferLocalModels}
                onValueChange={value => onUpdateFormData('preferLocalModels', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={preferLocalModels ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>
            <Text style={styles.helpText}>
              Use local models when available instead of remote models
            </Text>
          </SettingsItem>

          <SettingsItem title="Local Model Storage">
            <StorageInfoCard
              storageUsage={storageUsage}
              onRefresh={loadLocalModels}
              theme={theme}
            />
          </SettingsItem>

          <SettingsItem title="Available Models">
            {isLoadingLocalModels ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <View style={styles.modelsContainer}>
                {availableLocalModels.map((item) => {
                  const isDownloaded = downloadedModels.some(d => d.id === item.id);
                  const progress = downloadProgress[item.id];
                  const isDownloading = !!progress;

                  return (
                    <View key={item.id} style={styles.modelItem}>
                      <View style={styles.modelInfo}>
                        <Text style={styles.modelName}>{item.name}</Text>
                        <Text style={styles.modelDescription}>
                          {item.description} • {formatFileSize(item.fileSize || 0)}
                        </Text>
                        {isDownloading && progress && (
                          <DownloadProgressBar
                            progress={progress.progress}
                            bytesWritten={progress.bytesWritten}
                            contentLength={progress.contentLength}
                            theme={theme}
                          />
                        )}
                      </View>
                      <View style={styles.modelActions}>
                        {isDownloaded ? (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => deleteModel(item.id)}
                          >
                            <Text style={styles.deleteButtonText}>Delete</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.downloadButton]}
                            onPress={() => downloadModel(item.id)}
                            disabled={isDownloading}
                          >
                            <Text style={styles.downloadButtonText}>
                              {isDownloading ? 'Downloading...' : 'Download'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </SettingsItem>
        </>
      )}
    </>
  );
};

const createStyles = (currentTheme: any) => StyleSheet.create({
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: currentTheme.spacing.sm,
  },
  switchLabel: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.text,
    flex: 1,
  },
  helpText: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textSecondary,
    marginTop: currentTheme.spacing.xs,
    fontStyle: 'italic',
  },
  modelsContainer: {
    maxHeight: 300,
  },
  modelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: currentTheme.colors.surface,
    padding: currentTheme.spacing.md,
    marginBottom: currentTheme.spacing.sm,
    borderRadius: currentTheme.borderRadius.base,
    borderWidth: 1,
    borderColor: currentTheme.colors.border,
  },
  modelInfo: {
    flex: 1,
    marginRight: currentTheme.spacing.md,
  },
  modelName: {
    fontSize: currentTheme.typography.fontSizes.base,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.xs,
  },
  modelDescription: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textSecondary,
    marginBottom: currentTheme.spacing.xs,
  },
  modelActions: {
    justifyContent: 'center',
  },
  actionButton: {
    paddingHorizontal: currentTheme.spacing.md,
    paddingVertical: currentTheme.spacing.sm,
    borderRadius: currentTheme.borderRadius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: currentTheme.colors.success,
  },
  downloadButtonText: {
    color: currentTheme.colors.background,
    fontSize: currentTheme.typography.fontSizes.sm,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  deleteButton: {
    backgroundColor: currentTheme.colors.error,
  },
  deleteButtonText: {
    color: currentTheme.colors.background,
    fontSize: currentTheme.typography.fontSizes.sm,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
});

export default LocalModelsSection;