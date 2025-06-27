// Electron API types for renderer process

export interface ElectronAPI {
  // IPC Communication
  invoke(channel: string, ...args: any[]): Promise<any>;
  send(channel: string, ...args: any[]): void;
  on(channel: string, callback: (...args: any[]) => void): void;
  off(channel: string, callback: (...args: any[]) => void): void;
  
  // App Information
  getVersion(): Promise<string>;
  getPlatform(): Promise<string>;
  
  // Database Operations
  databaseOperation(operation: string, ...args: any[]): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}