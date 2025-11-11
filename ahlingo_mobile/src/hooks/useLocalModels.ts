import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { LocalModel, LocalModelDownloadProgress } from '../types';
import LocalLlamaService from '../services/LocalLlamaService';

interface UseLocalModelsReturn {
  // State
  availableLocalModels: LocalModel[];
  downloadedModels: LocalModel[];
  downloadProgress: Record<string, LocalModelDownloadProgress>;
  isLoadingLocalModels: boolean;
  storageUsage: { totalSize: number; modelCount: number };

  // Functions
  loadLocalModels: () => Promise<void>;
  downloadModel: (modelId: string) => Promise<void>;
  deleteModel: (modelId: string) => Promise<void>;
}

export const useLocalModels = (enableLocalModels: boolean): UseLocalModelsReturn => {
  // State
  const [availableLocalModels, setAvailableLocalModels] = useState<LocalModel[]>([]);
  const [downloadedModels, setDownloadedModels] = useState<LocalModel[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, LocalModelDownloadProgress>>({});
  const [isLoadingLocalModels, setIsLoadingLocalModels] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ totalSize: number; modelCount: number }>({
    totalSize: 0,
    modelCount: 0
  });

  // Use refs to ensure we always have the latest progress
  const downloadProgressRef = useRef<Record<string, LocalModelDownloadProgress>>({});

  // Keep ref in sync with state
  useEffect(() => {
    downloadProgressRef.current = downloadProgress;
  }, [downloadProgress]);

  // Load models when local models are enabled
  useEffect(() => {
    if (enableLocalModels) {
      loadLocalModels();
    }
  }, [enableLocalModels]);

  const loadLocalModels = async () => {
    setIsLoadingLocalModels(true);
    try {
      const available = LocalLlamaService.getAvailableModels();
      const downloaded = await LocalLlamaService.getDownloadedModels();
      const usage = await LocalLlamaService.getStorageUsage();

      setAvailableLocalModels(available);
      setDownloadedModels(downloaded);
      setStorageUsage(usage);
    } catch (error) {
      console.error('Failed to load local models:', error);
    } finally {
      setIsLoadingLocalModels(false);
    }
  };

  const downloadModel = useCallback(async (modelId: string) => {
    try {
      console.log('🚀 Starting download for model:', modelId);

      // Initialize progress state
      const initialProgress = { modelId, progress: 0, bytesWritten: 0, contentLength: 0 };
      setDownloadProgress(prev => ({
        ...prev,
        [modelId]: initialProgress
      }));

      // Use a throttled update function to prevent too many renders
      let lastUpdateTime = 0;
      const updateThrottle = 50; // Update every 50ms for smoother progress

      await LocalLlamaService.downloadModel(modelId, (progressData) => {
        const now = Date.now();

        console.log('🔄 Settings received progress:', {
          modelId: progressData.modelId,
          percentage: Math.round(progressData.progress * 100),
          bytes: `${progressData.bytesWritten}/${progressData.contentLength}`,
          timestamp: now
        });

        // Always update the ref immediately
        downloadProgressRef.current[modelId] = progressData;

        // But throttle state updates to prevent excessive renders
        if (now - lastUpdateTime >= updateThrottle || progressData.progress === 1) {
          lastUpdateTime = now;

          console.log('📊 Updating UI with progress:', {
            modelId: progressData.modelId,
            percentage: Math.round(progressData.progress * 100),
          });

          setDownloadProgress(prev => ({
            ...prev,
            [modelId]: progressData
          }));
        }
      });

      console.log('✅ Download completed for model:', modelId);

      // Refresh models list
      await loadLocalModels();

      // Clear progress
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[modelId];
        return newProgress;
      });

      Alert.alert('Success', 'Model downloaded successfully!');
    } catch (error) {
      console.error('❌ Failed to download model:', error);
      Alert.alert('Error', `Failed to download model: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Clear progress on error
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[modelId];
        return newProgress;
      });
    }
  }, []);

  const deleteModel = async (modelId: string) => {
    try {
      Alert.alert(
        'Delete Model',
        'Are you sure you want to delete this model? This will free up storage space.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await LocalLlamaService.deleteModel(modelId);
                await loadLocalModels();
                Alert.alert('Success', 'Model deleted successfully!');
              } catch (error) {
                console.error('Failed to delete model:', error);
                Alert.alert('Error', `Failed to delete model: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in delete model:', error);
    }
  };

  return {
    // State
    availableLocalModels,
    downloadedModels,
    downloadProgress,
    isLoadingLocalModels,
    storageUsage,

    // Functions
    loadLocalModels,
    downloadModel,
    deleteModel,
  };
};
