import { ChatMessage } from './ChatService';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAICompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface APISettings {
  apiKey: string;
  apiUrl?: string;
}

export class OpenAIService {
  private static readonly DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';
  private static readonly REQUEST_TIMEOUT = 30000;

  static generateSystemPrompt(language: string, difficulty: string): string {
    return `You are a language learning assistant. Always attempt to speak in ${language} at ${difficulty} level. Encourage the user to learn and practice in ${language}. Respond in English when specifically asked by the user.`;
  }

  static convertChatMessagesToOpenAI(
    messages: ChatMessage[],
    systemPrompt: string
  ): OpenAIMessage[] {
    const openAIMessages: OpenAIMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    messages.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        openAIMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    });

    return openAIMessages;
  }

  static async sendMessage(
    messages: OpenAIMessage[],
    settings: APISettings,
    model: string = 'qwen/qwen3-4b'
  ): Promise<string> {
    try {
      let apiUrl = settings.apiUrl || this.DEFAULT_API_URL;
      
      // If the URL doesn't end with the chat completions endpoint, add it
      if (apiUrl !== this.DEFAULT_API_URL && !apiUrl.includes('/chat/completions')) {
        // Remove trailing slash if present
        apiUrl = apiUrl.replace(/\/$/, '');
        // Add the OpenAI-compatible endpoint for Ollama
        apiUrl = `${apiUrl}/v1/chat/completions`;
      }
      
      // Log API connection details (without exposing the full API key)
      console.log('🔗 OpenAI API Connection Details:');
      console.log('  URL:', apiUrl);
      console.log('  Model:', model);
      console.log('  API Key:', settings.apiKey ? `${settings.apiKey.substring(0, 10)}...` : 'NOT SET');
      console.log('  Messages count:', messages.length);
      
      const requestBody: OpenAICompletionRequest = {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data: OpenAICompletionResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response choices returned from API');
      }

      const assistantMessage = data.choices[0].message;
      if (!assistantMessage || !assistantMessage.content) {
        throw new Error('Invalid response format from API');
      }

      return assistantMessage.content.trim();
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please check your internet connection and try again.');
        }
        
        if (error.message.includes('401')) {
          throw new Error('Invalid API key. Please check your API key in settings.');
        }
        
        if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        
        if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
          throw new Error('Server error. Please try again later.');
        }
        
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          throw new Error('Network error. Please check your internet connection.');
        }
        
        throw error;
      }
      
      throw new Error('An unexpected error occurred while communicating with the API.');
    }
  }

  static validateAPISettings(settings: APISettings): { isValid: boolean; error?: string } {
    if (!settings.apiKey || settings.apiKey.trim() === '') {
      return { isValid: false, error: 'API key is required' };
    }

    if (settings.apiUrl) {
      try {
        new URL(settings.apiUrl);
      } catch {
        return { isValid: false, error: 'Invalid API URL format' };
      }
    }

    return { isValid: true };
  }

  static async testConnection(settings: APISettings): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = this.validateAPISettings(settings);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const testMessages: OpenAIMessage[] = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, this is a connection test.' },
      ];

      await this.sendMessage(testMessages, settings);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }
}