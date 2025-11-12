interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface OpenAIModelsResponse {
  object: string;
  data: OpenAIModel[];
}

export interface ModelInfo {
  id: string;
  name: string;
  owned_by?: string;
  isLocal?: boolean;
  isDownloaded?: boolean;
  fileSize?: number;
  description?: string;
}

export class ModelService {
  static async fetchAllModels(serverUrl?: string, apiKey?: string, includeLocal: boolean = true): Promise<ModelInfo[]> {
    const allModels: ModelInfo[] = [];

    // Fetch local models if enabled
    if (includeLocal) {
      try {
        const localModels = await this.fetchLocalModels();
        allModels.push(...localModels);
      } catch (error) {
        console.error('Failed to fetch local models:', error);
      }
    }

    // Fetch remote models if server URL provided
    if (serverUrl) {
      try {
        const remoteModels = await this.fetchAvailableModels(serverUrl, apiKey);
        allModels.push(...remoteModels);
      } catch (error) {
        console.error('Failed to fetch remote models:', error);
      }
    }

    return allModels;
  }

  static async fetchLocalModels(): Promise<ModelInfo[]> {
    try {
      // Dynamic import to avoid issues if llama.rn is not available
      const LocalLlamaService = (await import('./LocalLlamaService')).default;

      const downloadedModels = await LocalLlamaService.getDownloadedModels();
      const availableModels = LocalLlamaService.getAvailableModels();

      const localModels: ModelInfo[] = [];

      // Add downloaded models
      for (const model of downloadedModels) {
        localModels.push({
          id: `local:${model.id}`,
          name: `${model.name} (Local)`,
          owned_by: 'local',
          isLocal: true,
          isDownloaded: true,
          fileSize: model.fileSize,
          description: model.description,
        });
      }

      // Add available but not downloaded models
      for (const model of availableModels) {
        const isDownloaded = downloadedModels.some(d => d.id === model.id);
        if (!isDownloaded) {
          localModels.push({
            id: `local:${model.id}`,
            name: `${model.name} (Not Downloaded)`,
            owned_by: 'local',
            isLocal: true,
            isDownloaded: false,
            fileSize: model.fileSize,
            description: model.description,
          });
        }
      }

      return localModels;
    } catch (error) {
      console.error('Error fetching local models:', error);
      return [];
    }
  }

  static async fetchAvailableModels(serverUrl: string, apiKey?: string): Promise<ModelInfo[]> {
    try {
      // Clean up the URL and add the OpenAI models endpoint
      let apiUrl = serverUrl.replace(/\/$/, '');

      // Add the OpenAI-compatible models endpoint
      if (!apiUrl.includes('/models')) {
        if (!apiUrl.includes('/v1')) {
          apiUrl = `${apiUrl}/v1/models`;
        } else {
          apiUrl = `${apiUrl}/models`;
        }
      }

      console.log('🔍 Fetching models from OpenAI-compatible endpoint:', apiUrl);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if API key is provided
      if (apiKey && apiKey.trim() !== '') {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // Create manual timeout since AbortSignal.timeout isn't supported in React Native
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data: OpenAIModelsResponse = await response.json();

      console.log('📋 Raw models data:', data);

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid models response format - expected OpenAI format with data array');
      }

      const models: ModelInfo[] = data.data.map(model => ({
        id: model.id,
        name: model.id,
        owned_by: model.owned_by,
        isLocal: false,
        isDownloaded: true, // Remote models are considered "available"
      }));

      console.log('✅ Processed models:', models);

      return models;
    } catch (error) {
      console.error('❌ Failed to fetch models:', error);

      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          throw new Error('Request timed out. Please check your server URL and network connection.');
        }

        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          throw new Error('Network error. Please check your server URL and ensure the server is running.');
        }

        if (error.message.includes('401')) {
          throw new Error('Unauthorized. Please check your API key.');
        }

        throw error;
      }

      throw new Error('An unexpected error occurred while fetching models.');
    }
  }

  static async testServerConnection(serverUrl: string, apiKey?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const models = await this.fetchAvailableModels(serverUrl, apiKey);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }

  // Helper methods for model management
  static isLocalModel(modelId: string): boolean {
    return modelId.startsWith('local:');
  }

  static extractLocalModelId(modelId: string): string {
    return modelId.replace('local:', '');
  }

  static formatModelName(model: ModelInfo): string {
    if (model.isLocal) {
      const status = model.isDownloaded ? 'Local' : 'Not Downloaded';
      return `${model.name} (${status})`;
    }
    return model.name;
  }

  static getModelSize(model: ModelInfo): string {
    if (!model.fileSize) return 'Unknown size';

    const sizeInGB = model.fileSize / (1024 * 1024 * 1024);
    if (sizeInGB >= 1) {
      return `${sizeInGB.toFixed(1)} GB`;
    }

    const sizeInMB = model.fileSize / (1024 * 1024);
    return `${sizeInMB.toFixed(0)} MB`;
  }
}
