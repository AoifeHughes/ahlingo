"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExerciseService = exports.UserSettingsService = exports.PairsGameLogic = exports.DatabaseManager = exports.LanguageLearningDatabase = void 0;
// Export all types
__exportStar(require("../types"), exports);
// Export database services
var database_1 = require("./services/database");
Object.defineProperty(exports, "LanguageLearningDatabase", { enumerable: true, get: function () { return database_1.LanguageLearningDatabase; } });
var DatabaseManager_1 = require("./services/DatabaseManager");
Object.defineProperty(exports, "DatabaseManager", { enumerable: true, get: function () { return DatabaseManager_1.DatabaseManager; } });
// Export business logic services
var gameLogic_1 = require("./services/gameLogic");
Object.defineProperty(exports, "PairsGameLogic", { enumerable: true, get: function () { return gameLogic_1.PairsGameLogic; } });
var userSettings_1 = require("./services/userSettings");
Object.defineProperty(exports, "UserSettingsService", { enumerable: true, get: function () { return userSettings_1.UserSettingsService; } });
var exerciseService_1 = require("./services/exerciseService");
Object.defineProperty(exports, "ExerciseService", { enumerable: true, get: function () { return exerciseService_1.ExerciseService; } });
// Export utility functions
__exportStar(require("./utils"), exports);
// Export API interfaces
__exportStar(require("./api"), exports);
//# sourceMappingURL=index.js.map