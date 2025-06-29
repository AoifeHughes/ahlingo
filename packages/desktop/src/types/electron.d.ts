// Electron API types for renderer process

export interface ElectronAPI {
  // Database operations
  database: {
    getTopics: () => Promise<any[]>;
    getPairExercisesByTopic: (topicId: number) => Promise<any[]>;
    getConversationExercisesByTopic: (topicId: number) => Promise<any[]>;
    getTranslationExercisesByTopic: (topicId: number) => Promise<any[]>;
    getLanguages: () => Promise<any[]>;
    getDifficulties: () => Promise<any[]>;
  };
  
  // User settings
  getMostRecentUser: () => Promise<string>;
  getUserSetting: (userId: string, settingName: string) => Promise<any>;
  setUserSetting: (userId: string, settingName: string, settingValue: any) => Promise<void>;
  
  // Database path
  getDatabasePath: () => Promise<string>;
  
  // App info
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  
  // Menu events
  onMenuNewGame: (callback: () => void) => void;
  onMenuAbout: (callback: () => void) => void;
  
  // Remove listeners
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}