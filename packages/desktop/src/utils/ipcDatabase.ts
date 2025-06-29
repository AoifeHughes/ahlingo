/**
 * IPC Database utilities for Electron renderer process
 * Communicates with the main process to access the database
 */

export class IPCDatabaseProxy {
  async getTopics() {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.database.getTopics();
  }

  async getPairExercisesByTopic(topicId: number) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.database.getPairExercisesByTopic(topicId);
  }

  async getConversationExercisesByTopic(topicId: number) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.database.getConversationExercisesByTopic(topicId);
  }

  async getTranslationExercisesByTopic(topicId: number) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.database.getTranslationExercisesByTopic(topicId);
  }

  async getLanguages() {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.database.getLanguages();
  }

  async getDifficulties() {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.database.getDifficulties();
  }
}