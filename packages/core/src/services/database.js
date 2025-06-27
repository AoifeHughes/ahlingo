"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageLearningDatabase = void 0;
class LanguageLearningDatabase {
    constructor(config) {
        console.log('Initializing mock database with config:', config);
        this.mockData = {
            languages: [
                { id: 1, language: 'French' },
                { id: 2, language: 'Spanish' },
                { id: 3, language: 'German' },
            ],
            topics: [
                { id: 1, topic: 'Greetings' },
                { id: 2, topic: 'Numbers' },
                { id: 3, topic: 'Colors' },
                { id: 4, topic: 'Food & Dining' },
                { id: 5, topic: 'Travel' },
            ],
            difficulties: [
                { id: 1, difficulty_level: 'Beginner' },
                { id: 2, difficulty_level: 'Intermediate' },
                { id: 3, difficulty_level: 'Advanced' },
            ],
            users: [
                { id: 1, name: 'default_user', last_login: new Date() },
            ],
            userSettings: [
                { id: 1, user_id: 1, setting_name: 'language_id', setting_value: '1' },
                { id: 2, user_id: 1, setting_name: 'difficulty_id', setting_value: '1' },
            ],
            pairExercises: [
                {
                    id: 1,
                    exercise_id: 1,
                    language_1: 'English',
                    language_2: 'French',
                    language_1_content: 'Hello',
                    language_2_content: 'Bonjour',
                },
                {
                    id: 2,
                    exercise_id: 1,
                    language_1: 'English',
                    language_2: 'French',
                    language_1_content: 'Goodbye',
                    language_2_content: 'Au revoir',
                },
                {
                    id: 3,
                    exercise_id: 1,
                    language_1: 'English',
                    language_2: 'French',
                    language_1_content: 'Thank you',
                    language_2_content: 'Merci',
                },
                {
                    id: 4,
                    exercise_id: 1,
                    language_1: 'English',
                    language_2: 'French',
                    language_1_content: 'Please',
                    language_2_content: 'S\'il vous plaît',
                },
            ],
        };
        this.initialize();
        this.logDatabaseStats();
    }
    initialize() {
        console.log('Mock database initialized with sample data');
    }
    logDatabaseStats() {
        console.log(`Database initialized - Topics: ${this.mockData.topics.length}, Exercises: ${this.mockData.pairExercises.length}`);
    }
    // Language operations
    getLanguages() {
        return this.mockData.languages;
    }
    getLanguageById(id) {
        return this.mockData.languages.find((lang) => lang.id === id);
    }
    // Topic operations
    getTopics() {
        return this.mockData.topics;
    }
    getTopicsByLanguageAndDifficulty(languageId, difficultyId) {
        // For mock implementation, just return all topics
        return this.mockData.topics;
    }
    // Difficulty operations
    getDifficulties() {
        return this.mockData.difficulties;
    }
    getDifficultyById(id) {
        return this.mockData.difficulties.find((diff) => diff.id === id);
    }
    // User operations
    getMostRecentUser() {
        const user = this.mockData.users[0];
        return user ? user.name : 'default_user';
    }
    createUser(name) {
        const newUser = {
            id: this.mockData.users.length + 1,
            name,
            last_login: new Date(),
        };
        this.mockData.users.push(newUser);
    }
    updateUserLogin(username) {
        const user = this.mockData.users.find((u) => u.name === username);
        if (user) {
            user.last_login = new Date();
        }
    }
    getUserByName(name) {
        return this.mockData.users.find((user) => user.name === name);
    }
    // User settings operations
    getUserSetting(userId, settingName) {
        const setting = this.mockData.userSettings.find((s) => s.user_id === userId && s.setting_name === settingName);
        return setting?.setting_value;
    }
    setUserSetting(userId, settingName, settingValue) {
        const existingIndex = this.mockData.userSettings.findIndex((s) => s.user_id === userId && s.setting_name === settingName);
        if (existingIndex >= 0) {
            this.mockData.userSettings[existingIndex].setting_value = settingValue;
        }
        else {
            this.mockData.userSettings.push({
                id: this.mockData.userSettings.length + 1,
                user_id: userId,
                setting_name: settingName,
                setting_value: settingValue,
            });
        }
    }
    getUserSettings(userId) {
        const settings = this.mockData.userSettings.filter((s) => s.user_id === userId);
        return settings.reduce((acc, setting) => {
            acc[setting.setting_name] = setting.setting_value;
            return acc;
        }, {});
    }
    // Exercise operations
    getExercisesByType(exerciseType) {
        // Mock implementation - return empty array for now
        return [];
    }
    getExercisesWithDetails(topicId, difficultyId, languageId, exerciseType) {
        // Mock implementation - return empty array for now
        return [];
    }
    // Pair exercise operations
    getRandomPairExercise(topicId, difficultyId, languageId) {
        // For mock implementation, return all pair exercises
        return this.mockData.pairExercises;
    }
    // Conversation exercise operations
    getConversationExercises(exerciseId) {
        return [];
    }
    // Translation exercise operations
    getTranslationExercises(exerciseId) {
        return [];
    }
    // User progress tracking
    recordExerciseAttempt(userId, exerciseId, isCorrect) {
        console.log(`Recording exercise attempt: user ${userId}, exercise ${exerciseId}, correct: ${isCorrect}`);
    }
    // Database management
    close() {
        console.log('Mock database closed');
    }
    backup(backupPath) {
        console.log(`Mock database backup to: ${backupPath}`);
    }
}
exports.LanguageLearningDatabase = LanguageLearningDatabase;
//# sourceMappingURL=database.js.map