"use strict";
/**
 * API interfaces and types for future server integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockApiClient = void 0;
// Mock API Client for development
class MockApiClient {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
    }
    async login(request) {
        // Mock implementation
        await this.delay(500);
        const user = {
            id: 1,
            name: request.username,
            last_login: new Date(),
        };
        this.isAuthenticated = true;
        this.currentUser = user;
        return {
            success: true,
            data: {
                user,
                token: 'mock-token-' + Date.now(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
            timestamp: new Date().toISOString(),
        };
    }
    async createUser(request) {
        await this.delay(300);
        const user = {
            id: Math.floor(Math.random() * 1000),
            name: request.username,
            last_login: new Date(),
        };
        return {
            success: true,
            data: user,
            timestamp: new Date().toISOString(),
        };
    }
    async logout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        return {
            success: true,
            timestamp: new Date().toISOString(),
        };
    }
    async getLanguages() {
        await this.delay(200);
        return {
            success: true,
            data: {
                languages: [
                    { id: 1, language: 'French' },
                    { id: 2, language: 'Spanish' },
                    { id: 3, language: 'German' },
                ],
            },
            timestamp: new Date().toISOString(),
        };
    }
    async getTopics() {
        await this.delay(200);
        return {
            success: true,
            data: {
                topics: [
                    { id: 1, topic: 'Greetings' },
                    { id: 2, topic: 'Numbers' },
                    { id: 3, topic: 'Colors' },
                ],
            },
            timestamp: new Date().toISOString(),
        };
    }
    async getDifficulties() {
        await this.delay(200);
        return {
            success: true,
            data: {
                difficulties: [
                    { id: 1, difficulty_level: 'Beginner' },
                    { id: 2, difficulty_level: 'Intermediate' },
                    { id: 3, difficulty_level: 'Advanced' },
                ],
            },
            timestamp: new Date().toISOString(),
        };
    }
    // Implement other methods as needed...
    async getUserSettings() {
        await this.delay(200);
        throw new Error('Not implemented in mock');
    }
    async updateUserSettings() {
        await this.delay(200);
        throw new Error('Not implemented in mock');
    }
    async getExercises() {
        await this.delay(200);
        throw new Error('Not implemented in mock');
    }
    async getPairExercises() {
        await this.delay(200);
        throw new Error('Not implemented in mock');
    }
    async getConversationExercises() {
        await this.delay(200);
        throw new Error('Not implemented in mock');
    }
    async getTranslationExercises() {
        await this.delay(200);
        throw new Error('Not implemented in mock');
    }
    async recordAttempt() {
        await this.delay(200);
        return {
            success: true,
            timestamp: new Date().toISOString(),
        };
    }
    async getUserProgress() {
        await this.delay(200);
        throw new Error('Not implemented in mock');
    }
    async syncData() {
        await this.delay(1000);
        throw new Error('Not implemented in mock');
    }
    async sendChatMessage() {
        await this.delay(1500);
        throw new Error('Not implemented in mock');
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.MockApiClient = MockApiClient;
//# sourceMappingURL=index.js.map