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
  stream?: boolean;
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

export interface StreamingCallbacks {
  onContent: (content: string) => void;
  onComplete: (fullContent: string) => void;
  onError: (error: Error) => void;
}

export class OpenAIService {
  private static readonly DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';
  private static readonly REQUEST_TIMEOUT = 30000;

  static generateSystemPrompt(language: string, difficulty: string): string {
    return `You are a language learning assistant. Always attempt to speak in ${language} at ${difficulty} level. Encourage the user to learn and practice in ${language}. Respond in English when specifically asked by the user. Keep sentences short`;
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

  static async sendMessageStream(
    messages: OpenAIMessage[],
    settings: APISettings,
    callbacks: StreamingCallbacks,
    model: string = 'qwen/qwen3-4b'
  ): Promise<AbortController> {
    const controller = new AbortController();

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
      console.log('🔗 OpenAI API Streaming Connection Details:');
      console.log('  URL:', apiUrl);
      console.log('  Model:', model);
      console.log('  API Key:', settings.apiKey ? `${settings.apiKey.substring(0, 10)}...` : 'NOT SET');
      console.log('  Messages count:', messages.length);

      const requestBody: OpenAICompletionRequest = {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true, // Enable streaming
      };

      const timeoutId = setTimeout(() => {
        controller.abort();
        callbacks.onError(new Error('Request timed out'));
      }, this.REQUEST_TIMEOUT);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: apiUrl
        });
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      console.log('✅ Received response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        hasBody: !!response.body
      });

      // React Native's fetch doesn't support ReadableStream, use XMLHttpRequest for streaming
      if (!response.body) {
        console.log('📱 Using XMLHttpRequest for React Native streaming compatibility');

        return new Promise<AbortController>((resolve) => {
          const xhr = new XMLHttpRequest();
          let fullContent = '';
          let buffer = '';
          let isCompleted = false;

          // Set up abort controller integration
          const abortHandler = () => {
            xhr.abort();
            console.log('🛑 XMLHttpRequest aborted');
          };

          controller.signal.addEventListener('abort', abortHandler);

          xhr.open('POST', apiUrl, true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.setRequestHeader('Authorization', `Bearer ${settings.apiKey}`);
          xhr.setRequestHeader('Accept', 'text/event-stream');
          xhr.setRequestHeader('Cache-Control', 'no-cache');

          xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
              if (xhr.status !== 200) {
                const error = new Error(`API request failed: ${xhr.status} ${xhr.statusText}`);
                callbacks.onError(error);
                return;
              }
            }

            if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
              const newText = xhr.responseText;
              const newChunk = newText.slice(buffer.length);

              if (newChunk) {
                console.log('📥 XHR chunk received:', newChunk.length, 'chars');
                buffer = newText;

                // Process complete lines
                const lines = newChunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();

                    if (data === '[DONE]') {
                      console.log('✅ Stream finished with [DONE]');
                      if (!isCompleted) {
                        isCompleted = true;
                        callbacks.onComplete(fullContent);
                      }
                      controller.signal.removeEventListener('abort', abortHandler);
                      resolve(controller);
                      return;
                    }

                    if (data === '') continue;

                    try {
                      const parsed = JSON.parse(data);
                      console.log('📦 Received streaming data:', parsed);

                      const delta = parsed.choices?.[0]?.delta;
                      if (delta?.content) {
                        fullContent += delta.content;
                        callbacks.onContent(delta.content);
                        continue;
                      }

                      const finishReason = parsed.choices?.[0]?.finish_reason;
                      if (finishReason) {
                        console.log('✅ Stream finished with reason:', finishReason);
                        if (!isCompleted) {
                          isCompleted = true;
                          callbacks.onComplete(fullContent);
                        }
                        controller.signal.removeEventListener('abort', abortHandler);
                        resolve(controller);
                        return;
                      }

                      if (parsed.error) {
                        console.error('❌ API Error:', parsed.error);
                        const errorMsg = parsed.error.message || 'API request failed';
                        callbacks.onError(new Error(errorMsg));
                        controller.signal.removeEventListener('abort', abortHandler);
                        resolve(controller);
                        return;
                      }
                    } catch (parseError) {
                      console.warn('Failed to parse SSE data:', data, parseError);
                    }
                  }
                }
              }

              if (xhr.readyState === XMLHttpRequest.DONE) {
                console.log('✅ XHR completed, final content length:', fullContent.length);
                if (fullContent.length === 0) {
                  console.warn('⚠️ Stream completed but no content received');
                }
                if (!isCompleted) {
                  isCompleted = true;
                  callbacks.onComplete(fullContent);
                }
                controller.signal.removeEventListener('abort', abortHandler);
                resolve(controller);
              }
            }
          };

          xhr.onerror = () => {
            console.error('❌ XHR Error');
            callbacks.onError(new Error('Network error occurred'));
            controller.signal.removeEventListener('abort', abortHandler);
            resolve(controller);
          };

          xhr.ontimeout = () => {
            console.error('❌ XHR Timeout');
            callbacks.onError(new Error('Request timed out'));
            controller.signal.removeEventListener('abort', abortHandler);
            resolve(controller);
          };

          xhr.timeout = this.REQUEST_TIMEOUT;
          xhr.send(JSON.stringify(requestBody));
          resolve(controller);
        });
      }

      // Fallback for environments that support ReadableStream (shouldn't reach here in React Native)
      console.log('📡 Using ReadableStream (likely not React Native)');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('✅ Stream completed, final content length:', fullContent.length);
            callbacks.onComplete(fullContent);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();

              if (data === '[DONE]') {
                callbacks.onComplete(fullContent);
                return controller;
              }

              if (data === '') continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;
                if (delta?.content) {
                  fullContent += delta.content;
                  callbacks.onContent(delta.content);
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', data, parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('OpenAI Streaming API Error:', error);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          callbacks.onError(new Error('Request was cancelled'));
          return controller;
        }

        if (error.message.includes('401')) {
          callbacks.onError(new Error('Invalid API key. Please check your API key in settings.'));
          return controller;
        }

        if (error.message.includes('429')) {
          callbacks.onError(new Error('Rate limit exceeded. Please wait a moment and try again.'));
          return controller;
        }

        if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
          callbacks.onError(new Error('Server error. Please try again later.'));
          return controller;
        }

        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          callbacks.onError(new Error('Network error. Please check your internet connection.'));
          return controller;
        }

        callbacks.onError(error);
      } else {
        callbacks.onError(new Error('An unexpected error occurred while communicating with the API.'));
      }
    }

    return controller;
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
