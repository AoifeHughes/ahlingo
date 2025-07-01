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
}

export class ModelService {
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
}