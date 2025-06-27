"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = void 0;
const database_1 = require("./database");
class DatabaseManager {
    constructor() {
        this.db = null;
    }
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    getDatabase(config) {
        if (!this.db) {
            const defaultConfig = {
                path: 'database/languageLearningDatabase.db',
                isReadOnly: false,
            };
            this.db = new database_1.LanguageLearningDatabase(config || defaultConfig);
        }
        return this.db;
    }
    closeDatabase() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
    // Reset the singleton (useful for testing)
    static reset() {
        if (DatabaseManager.instance?.db) {
            DatabaseManager.instance.db.close();
        }
        DatabaseManager.instance = null;
    }
}
exports.DatabaseManager = DatabaseManager;
DatabaseManager.instance = null;
//# sourceMappingURL=DatabaseManager.js.map