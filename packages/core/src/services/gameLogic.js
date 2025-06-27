"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PairsGameLogic = void 0;
class PairsGameLogic {
    /**
     * Shuffle an array in place using Fisher-Yates algorithm
     */
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    /**
     * Convert PairExercise data into GamePair format for UI
     */
    static createGamePairs(pairExercises) {
        const gamePairs = pairExercises.map((pair, index) => ({
            id: pair.id,
            leftText: pair.language_1_content,
            rightText: pair.language_2_content,
            matched: false,
            leftSelected: false,
            rightSelected: false,
        }));
        // Shuffle left and right pairs independently
        const leftPairs = this.shuffleArray(gamePairs.map(pair => ({ ...pair })));
        const rightPairs = this.shuffleArray(gamePairs.map(pair => ({ ...pair })));
        return { leftPairs, rightPairs };
    }
    /**
     * Initialize a new game state
     */
    static initializeGameState(pairExercises, currentExercise) {
        return {
            pairs: pairExercises,
            selectedLeft: undefined,
            selectedRight: undefined,
            matchedPairs: new Set(),
            score: {
                correct: 0,
                incorrect: 0,
            },
            currentExercise,
            isLoading: false,
            error: undefined,
        };
    }
    /**
     * Handle selection of a pair button
     */
    static handlePairSelection(gameState, pairId, isLeftSide) {
        const newState = { ...gameState };
        let isMatch = false;
        let shouldDelay = false;
        if (isLeftSide) {
            // If clicking the same left button, deselect it
            if (newState.selectedLeft === pairId) {
                newState.selectedLeft = undefined;
            }
            else {
                newState.selectedLeft = pairId;
            }
        }
        else {
            // If clicking the same right button, deselect it
            if (newState.selectedRight === pairId) {
                newState.selectedRight = undefined;
            }
            else {
                newState.selectedRight = pairId;
            }
        }
        // Check for match if both sides are selected
        if (newState.selectedLeft !== undefined && newState.selectedRight !== undefined) {
            if (newState.selectedLeft === newState.selectedRight) {
                // Match found!
                isMatch = true;
                newState.matchedPairs.add(pairId);
                newState.score.correct += 1;
                newState.selectedLeft = undefined;
                newState.selectedRight = undefined;
            }
            else {
                // No match - increment incorrect score and prepare for delay
                isMatch = false;
                shouldDelay = true;
                newState.score.incorrect += 1;
            }
        }
        return { newState, isMatch, shouldDelay };
    }
    /**
     * Clear selections after incorrect match delay
     */
    static clearSelections(gameState) {
        return {
            ...gameState,
            selectedLeft: undefined,
            selectedRight: undefined,
        };
    }
    /**
     * Check if the game is completed
     */
    static isGameComplete(gameState) {
        return gameState.matchedPairs.size === gameState.pairs.length;
    }
    /**
     * Get the current game progress as a percentage
     */
    static getGameProgress(gameState) {
        if (gameState.pairs.length === 0)
            return 0;
        return (gameState.matchedPairs.size / gameState.pairs.length) * 100;
    }
    /**
     * Get the current accuracy percentage
     */
    static getAccuracy(gameState) {
        const totalAttempts = gameState.score.correct + gameState.score.incorrect;
        if (totalAttempts === 0)
            return 0;
        return (gameState.score.correct / totalAttempts) * 100;
    }
    /**
     * Reset the game state for a new round
     */
    static resetGame(gameState, newPairs, newExercise) {
        return {
            pairs: newPairs || gameState.pairs,
            selectedLeft: undefined,
            selectedRight: undefined,
            matchedPairs: new Set(),
            score: {
                correct: 0,
                incorrect: 0,
            },
            currentExercise: newExercise || gameState.currentExercise,
            isLoading: false,
            error: undefined,
        };
    }
    /**
     * Validate that pair exercises are properly formatted
     */
    static validatePairExercises(pairs) {
        const errors = [];
        if (!pairs || pairs.length === 0) {
            errors.push('No pair exercises provided');
            return { isValid: false, errors };
        }
        pairs.forEach((pair, index) => {
            if (!pair.language_1_content || pair.language_1_content.trim() === '') {
                errors.push(`Pair ${index + 1}: Missing language_1_content`);
            }
            if (!pair.language_2_content || pair.language_2_content.trim() === '') {
                errors.push(`Pair ${index + 1}: Missing language_2_content`);
            }
            if (typeof pair.id !== 'number') {
                errors.push(`Pair ${index + 1}: Invalid or missing ID`);
            }
        });
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
exports.PairsGameLogic = PairsGameLogic;
//# sourceMappingURL=gameLogic.js.map