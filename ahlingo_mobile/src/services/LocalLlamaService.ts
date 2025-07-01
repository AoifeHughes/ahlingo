import { initLlama, loadLlamaModelInfo } from 'llama.rn';
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
    description: 'Small model for testing - known to work on iOS',
    fileSize: 638 * 1024 * 1024, // ~638MB
  },
  {
    id: 'deepseek-r1-distill-qwen-1.5b-q3',
    name: 'DeepSeek R1 Distill Qwen 1.5B (Q3)',
    filename: 'deepseek-r1-distill-qwen-1.5b-q3.gguf',
    downloadUrl: 'https://huggingface.co/lmstudio-community/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q3_K_L.gguf',
    description: 'Compact 1.5B parameter model, good for basic conversations',
    fileSize: 980 * 1024 * 1024, // ~980MB based on actual download
  },
  {
    id: 'phi-3-mini-4k-instruct-q4',
    name: 'Phi-3 Mini 4K Instruct (Q4)',
    filename: 'phi-3-mini-4k-instruct-q4.gguf',
    downloadUrl: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
    description: 'Microsoft Phi-3 Mini optimized for instruction following',
    fileSize: 2.4 * 1024 * 1024 * 1024, // ~2.4GB
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
    if (!model) return false;
    
    const filePath = this.getModelPath(model.filename);
    const exists = await RNFS.exists(filePath);
    
    if (exists) {
      try {
        const stats = await RNFS.stat(filePath);
        const expectedSize = model.fileSize;
        const actualSize = stats.size;
        const sizeDiff = Math.abs(actualSize - expectedSize);
        const sizeTolerancePercent = 0.1; // 10% tolerance
        
        console.log(`📊 Model ${modelId} download verification:`, {
          expectedSize: `${(expectedSize / 1024 / 1024).toFixed(2)} MB`,
          actualSize: `${(actualSize / 1024 / 1024).toFixed(2)} MB`,
          sizeDifference: `${(sizeDiff / 1024 / 1024).toFixed(2)} MB`,
          isComplete: sizeDiff < (expectedSize * sizeTolerancePercent)
        });
        
        // Check if file size is within reasonable tolerance
        if (sizeDiff > (expectedSize * sizeTolerancePercent)) {
          console.warn(`⚠️ Model ${modelId} file size mismatch - download may be incomplete`);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error(`❌ Error checking model ${modelId} file stats:`, error);
        return false;
      }
    }
    
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
    
    // Check if already exists
    const exists = await RNFS.exists(filePath);
    if (exists) {
      console.log(`Model ${modelId} already downloaded`);
      return;
    }

    try {
      console.log(`Starting download of ${model.name}...`);
      
      const { promise } = RNFS.downloadFile({
        fromUrl: model.downloadUrl,
        toFile: filePath,
        progressInterval: 250, // Update every 250ms for smoother progress
        progress: (res) => {
          const progress = res.bytesWritten / res.contentLength;
          const percentage = (progress * 100).toFixed(1);
          
          console.log(`📥 Download progress for ${model.name}: ${percentage}% (${res.bytesWritten}/${res.contentLength} bytes)`);
          
          if (onProgress) {
            const progressData = {
              modelId,
              progress,
              bytesWritten: res.bytesWritten,
              contentLength: res.contentLength,
            };
            
            console.log('📤 Calling progress callback with:', progressData);
            onProgress(progressData);
          } else {
            console.log('⚠️ No progress callback provided');
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
      console.log(`📂 Model file path: ${filePath}`);
      
      // Enhanced file verification for iOS
      try {
        const stats = await RNFS.stat(filePath);
        console.log(`📊 File verification:`, {
          exists: exists,
          path: filePath,
          size: stats.size,
          isFile: stats.isFile(),
          absolutePath: stats.path, // This should be the full path
          readable: true, // RNFS.stat succeeds means file is readable
        });
        
        // Additional iOS-specific checks
        console.log(`📱 iOS File System Info:`, {
          documentsDirectory: RNFS.DocumentDirectoryPath,
          modelFilename: model.filename,
          fullPath: filePath,
          pathMatch: filePath === stats.path,
        });
      } catch (statError) {
        console.error(`❌ Failed to get file stats:`, statError);
        throw new Error(`Cannot access model file: ${statError instanceof Error ? statError.message : 'Unknown error'}`);
      }


      // Validate model file size (should be reasonable for a GGUF file)
      const stats = await RNFS.stat(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      console.log(`📏 Model file size: ${fileSizeMB.toFixed(2)} MB`);
      
      if (stats.size < 100 * 1024 * 1024) { // Less than 100MB is suspicious for a language model
        console.warn(`⚠️ Model file seems too small (${fileSizeMB.toFixed(2)} MB). This might indicate an incomplete download.`);
      }

      // Use the absolute path from stats for better iOS compatibility
      const absoluteModelPath = stats.path;
      
      // Load model info for debugging
      try {
        const modelPath = `file://${absoluteModelPath}`;
        console.log('Model Info:', await loadLlamaModelInfo(modelPath));
      } catch (infoError) {
        console.error(`❌ Failed to load model info:`, infoError);
      }

      // Try with iOS-optimized parameters
      const initParams = {
        model: absoluteModelPath, // Use absolute path for iOS
        use_mlock: true, // Force system to keep model in RAM
        n_ctx: 256, // Smaller context as requested
        n_gpu_layers: 99, // Use GPU layers as requested
      };

      console.log(`🚀 Calling initLlama with params:`, initParams);

      try {
        this.context = await initLlama(initParams);
        console.log(`✅ initLlama completed successfully`);
      } catch (initError) {
        console.error(`❌ initLlama failed:`, initError);
        
        // Log all properties of the error object
        if (initError && typeof initError === 'object') {
          console.error(`❌ Error object properties:`, Object.keys(initError));
          console.error(`❌ Full error object:`, JSON.stringify(initError, null, 2));
        }
        
        console.error(`❌ Error details:`, {
          name: initError instanceof Error ? initError.name : 'Unknown',
          message: initError instanceof Error ? initError.message : String(initError),
          stack: initError instanceof Error ? initError.stack : undefined,
          nativeError: (initError as any)?.nativeError,
          code: (initError as any)?.code,
          userInfo: (initError as any)?.userInfo,
        });

        // Check for specific error patterns
        const errorMessage = initError instanceof Error ? initError.message : String(initError);
        if (errorMessage.includes('architecture') || errorMessage.includes('x86_64') || errorMessage.includes('arm64')) {
          console.error(`❌ Architecture mismatch detected. This model may not be compatible with the current device architecture.`);
        }
        
        if (errorMessage.includes('memory') || errorMessage.includes('allocation')) {
          console.error(`❌ Memory allocation issue detected. The model may be too large for available memory.`);
        }

        // Try with different parameters if initial attempt fails
        console.log(`🔄 Retrying with minimal parameters...`);
        try {
          const retryParams = {
            model: absoluteModelPath, // Use absolute path
            use_mlock: false, // Disable mlock
            n_ctx: 128, // Even smaller context
            n_gpu_layers: 0, // Try without GPU
            n_batch: 8, // Small batch size
            f16_kv: false, // Use fp32 for compatibility
          };
          console.log(`🚀 Retry attempt with params:`, retryParams);
          this.context = await initLlama(retryParams);
          console.log(`✅ initLlama succeeded on retry with minimal parameters`);
        } catch (retryError) {
          console.error(`❌ Retry also failed:`, retryError);
          if (retryError && typeof retryError === 'object') {
            console.error(`❌ Retry error properties:`, Object.keys(retryError));
            console.error(`❌ Full retry error:`, JSON.stringify(retryError, null, 2));
          }
          throw new Error(`Failed to load the model after multiple attempts. Original error: ${errorMessage}`);
        }
      }

      this.currentModelId = modelId;
      console.log(`Successfully initialized ${model.name}`);
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