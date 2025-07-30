import { initLlama } from 'llama.rn';
import RNFS from 'react-native-fs';
import {
  LocalModel,
  LocalModelDownloadProgress,
  LocalLlamaMessage,
  LocalLlamaCompletion,
  TokenData,
} from '../types';

// Pre-configured models that can be downloaded
const AVAILABLE_LOCAL_MODELS: LocalModel[] = [
  {
    id: 'tinyllama-1.1b-q4',
    name: 'TinyLlama 1.1B Q4',
    filename: 'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
    downloadUrl: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
    description: 'Compact and fast model, optimized for mobile devices',
    fileSize: 638 * 1024 * 1024, // ~638MB
  },
  {
    id: 'phi-3-mini-4k-instruct-q4',
    name: 'Phi-3 Mini 4K Instruct (Q4)',
    filename: 'phi-3-mini-4k-instruct-q4.gguf',
    downloadUrl: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
    description: 'Microsoft Phi-3 Mini optimized for instruction following',
    fileSize: 2.4 * 1024 * 1024 * 1024, // ~2.4GB
  },
  {
    id: 'phi-4-mini-instruct-q4',
    name: 'Phi-4 Mini Instruct (Q4)',
    filename: 'microsoft_Phi-4-mini-instruct-Q4_0.gguf',
    downloadUrl: 'https://huggingface.co/bartowski/microsoft_Phi-4-mini-instruct-GGUF/resolve/main/microsoft_Phi-4-mini-instruct-Q4_0.gguf?download=true',
    description: 'Latest Microsoft Phi-4 Mini model with enhanced instruction following',
    fileSize: 2.7 * 1024 * 1024 * 1024, // ~2.7GB
  },
];

const STOP_WORDS = [
  '</s>', '<|end|>', '<|eot_id|>', '<|end_of_text|>', 
  '<|im_end|>', '<|EOT|>', '<|END_OF_TURN_TOKEN|>', 
  '<|end_of_turn|>', '<|endoftext|>'
];

export interface LocalLlamaCallbacks {
  onContent: (content: string) => void;
  onComplete: (fullContent: string) => void;
  onError: (error: Error) => void;
}

class LocalLlamaService {
  private context: any | null = null;
  private currentModelId: string | null = null;
  private isInitializing = false;

  // Helper to get proper model path for iOS
  private getModelPath(filename: string): string {
    // On iOS, ensure we're using the Documents directory
    return `${RNFS.DocumentDirectoryPath}/${filename}`;
  }

  // Get list of available models for download
  getAvailableModels(): LocalModel[] {
    return AVAILABLE_LOCAL_MODELS;
  }

  // Get list of downloaded models
  async getDownloadedModels(): Promise<LocalModel[]> {
    const models: LocalModel[] = [];
    
    for (const model of AVAILABLE_LOCAL_MODELS) {
      const filePath = this.getModelPath(model.filename);
      const exists = await RNFS.exists(filePath);
      
      if (exists) {
        const stat = await RNFS.stat(filePath);
        models.push({
          ...model,
          filePath,
          isDownloaded: true,
          fileSize: parseInt(stat.size.toString()),
        });
      }
    }
    
    return models;
  }

  // Check if a specific model is downloaded
  async isModelDownloaded(modelId: string): Promise<boolean> {
    const model = AVAILABLE_LOCAL_MODELS.find(m => m.id === modelId);
    if (!model) {
      console.log(`❌ Model not found in AVAILABLE_LOCAL_MODELS: ${modelId}`);
      return false;
    }
    
    const filePath = this.getModelPath(model.filename);
    const exists = await RNFS.exists(filePath);
    
    console.log(`🔍 Checking model download status:`, {
      modelId,
      filename: model.filename,
      filePath,
      exists
    });
    
    if (exists) {
      try {
        const stats = await RNFS.stat(filePath);
        const actualSize = stats.size;
        
        console.log(`📊 Model file info:`, {
          modelId,
          filename: model.filename,
          actualSizeGB: actualSize / (1024 * 1024 * 1024),
          actualSizeMB: actualSize / (1024 * 1024)
        });
        
        // File exists and has content, consider it valid
        // No size validation - just check that it's not empty
        if (actualSize > 0) {
          console.log(`✅ Model ${modelId} is downloaded and valid (size: ${(actualSize / (1024 * 1024 * 1024)).toFixed(2)} GB)`);
          return true;
        } else {
          console.log(`❌ Model ${modelId} file is empty`);
          return false;
        }
      } catch (error) {
        console.log(`❌ Error checking model ${modelId}:`, error);
        return false;
      }
    }
    
    console.log(`❌ Model ${modelId} file does not exist`);
    return false;
  }

  // Download a model with progress tracking
  async downloadModel(
    modelId: string,
    onProgress?: (progress: LocalModelDownloadProgress) => void
  ): Promise<void> {
    const model = AVAILABLE_LOCAL_MODELS.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const filePath = this.getModelPath(model.filename);
    
    // Check if already exists and is complete
    const exists = await RNFS.exists(filePath);
    if (exists) {
      const isComplete = await this.isModelDownloaded(modelId);
      if (isComplete) {
        console.log(`Model ${modelId} already downloaded and complete`);
        return;
      } else {
        console.log(`Model ${modelId} exists but incomplete, removing partial download`);
        await RNFS.unlink(filePath);
      }
    }

    try {
      console.log(`🚀 Starting download for ${model.name} from ${model.downloadUrl}`);
      console.log(`📁 Downloading to: ${filePath}`);
      
      const { promise } = RNFS.downloadFile({
        fromUrl: model.downloadUrl,
        toFile: filePath,
        background: true, // Continue download in background (iOS)
        discretionary: true, // Allow OS to control timing for better performance (iOS)
        cacheable: true, // Allow caching in shared NSURLCache (iOS)
        progressDivider: 1, // Report progress for every byte written
        begin: (res) => {
          console.log(`📋 Download begin for ${model.name}:`, {
            jobId: res.jobId,
            statusCode: res.statusCode,
            contentLength: res.contentLength,
            headers: res.headers
          });
          
          // Initialize progress tracking with content length
          if (onProgress && res.contentLength > 0) {
            onProgress({
              modelId,
              progress: 0,
              bytesWritten: 0,
              contentLength: res.contentLength,
            });
          }
        },
        progress: (res) => {
          const progressPercent = res.contentLength > 0 ? (res.bytesWritten / res.contentLength) : 0;
          console.log(`📊 Download progress: ${Math.round(progressPercent * 100)}% (${res.bytesWritten}/${res.contentLength})`);
          
          if (onProgress) {
            onProgress({
              modelId,
              progress: progressPercent,
              bytesWritten: res.bytesWritten,
              contentLength: res.contentLength,
            });
          }
        },
      });

      await promise;
      console.log(`Successfully downloaded ${model.name}`);
    } catch (error) {
      console.error(`Error downloading model ${modelId}:`, error);
      
      // Clean up partial download
      try {
        await RNFS.unlink(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up partial download:', cleanupError);
      }
      
      throw new Error(`Failed to download ${model.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete a downloaded model
  async deleteModel(modelId: string): Promise<void> {
    const model = AVAILABLE_LOCAL_MODELS.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const filePath = this.getModelPath(model.filename);
    
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
        console.log(`Deleted model ${model.name}`);
        
        // If this was the current model, release the context
        if (this.currentModelId === modelId) {
          await this.cleanup();
        }
      }
    } catch (error) {
      console.error(`Error deleting model ${modelId}:`, error);
      throw new Error(`Failed to delete ${model.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Initialize a model for use
  async initializeModel(modelId: string): Promise<void> {
    if (this.isInitializing) {
      throw new Error('Model initialization already in progress');
    }

    // If same model is already loaded, no need to reinitialize
    if (this.context && this.currentModelId === modelId) {
      return;
    }

    this.isInitializing = true;

    try {
      // Clean up existing context
      await this.cleanup();

      const model = AVAILABLE_LOCAL_MODELS.find(m => m.id === modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      const filePath = this.getModelPath(model.filename);
      const exists = await RNFS.exists(filePath);
      
      if (!exists) {
        throw new Error(`Model ${model.name} is not downloaded. Please download it first.`);
      }

      console.log(`Initializing ${model.name}...`);

      // Get absolute path for iOS compatibility
      const stats = await RNFS.stat(filePath);
      const absoluteModelPath = stats.path;

      // Initialize with optimized parameters
      const initParams = {
        model: absoluteModelPath,
        use_mlock: true,
        n_ctx: 1024,
        n_gpu_layers: 99, // Use GPU acceleration on iOS
      };

      try {
        this.context = await initLlama(initParams);
        console.log(`Successfully initialized ${model.name}`);
      } catch (initError) {
        console.error(`Failed to initialize with GPU, trying CPU-only mode...`);
        
        // Retry with CPU-only parameters
        const cpuParams = {
          model: absoluteModelPath,
          use_mlock: false,
          n_ctx: 1024,
          n_gpu_layers: 0,
        };
        
        this.context = await initLlama(cpuParams);
        console.log(`Successfully initialized ${model.name} in CPU mode`);
      }

      this.currentModelId = modelId;
    } catch (error) {
      console.error(`Error initializing model ${modelId}:`, error);
      this.context = null;
      this.currentModelId = null;
      throw new Error(`Failed to initialize model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isInitializing = false;
    }
  }

  // Generate chat completion
  async completion(
    messages: LocalLlamaMessage[],
    callbacks: LocalLlamaCallbacks
  ): Promise<LocalLlamaCompletion> {
    if (!this.context) {
      throw new Error('No model initialized. Please initialize a model first.');
    }

    try {
      let fullContent = '';

      const result = await this.context.completion(
        {
          messages,
          n_predict: 2048,
          ignore_eos: false,
          stop: STOP_WORDS,
        },
        (data: TokenData) => {
          // This is the partial completion callback
          const { token } = data;
          fullContent += token;
          callbacks.onContent(token);
        }
      );

      callbacks.onComplete(fullContent);
      
      return {
        text: result?.text.trim() ?? fullContent.trim(),
        timings: result?.timings,
      };
    } catch (error) {
      console.error('Error during completion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during completion';
      callbacks.onError(new Error(errorMessage));
      throw error;
    }
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    if (this.context) {
      try {
        await this.context.release();
        console.log('Released llama context');
      } catch (error) {
        console.error('Error releasing context:', error);
      }
      this.context = null;
      this.currentModelId = null;
    }
  }

  // Get current model info
  getCurrentModel(): string | null {
    return this.currentModelId;
  }

  // Check if service is ready for inference
  isReady(): boolean {
    return this.context !== null && !this.isInitializing;
  }

  // Get storage usage
  async getStorageUsage(): Promise<{ totalSize: number; modelCount: number }> {
    const downloadedModels = await this.getDownloadedModels();
    const totalSize = downloadedModels.reduce((sum, model) => sum + (model.fileSize || 0), 0);
    
    return {
      totalSize,
      modelCount: downloadedModels.length,
    };
  }
}

export default new LocalLlamaService();