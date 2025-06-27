import { PairExercise, GamePair, PairGameState, ExerciseWithDetails } from '../../types';
export declare class PairsGameLogic {
    /**
     * Shuffle an array in place using Fisher-Yates algorithm
     */
    private static shuffleArray;
    /**
     * Convert PairExercise data into GamePair format for UI
     */
    static createGamePairs(pairExercises: PairExercise[]): {
        leftPairs: GamePair[];
        rightPairs: GamePair[];
    };
    /**
     * Initialize a new game state
     */
    static initializeGameState(pairExercises: PairExercise[], currentExercise?: ExerciseWithDetails): PairGameState;
    /**
     * Handle selection of a pair button
     */
    static handlePairSelection(gameState: PairGameState, pairId: number, isLeftSide: boolean): {
        newState: PairGameState;
        isMatch: boolean;
        shouldDelay: boolean;
    };
    /**
     * Clear selections after incorrect match delay
     */
    static clearSelections(gameState: PairGameState): PairGameState;
    /**
     * Check if the game is completed
     */
    static isGameComplete(gameState: PairGameState): boolean;
    /**
     * Get the current game progress as a percentage
     */
    static getGameProgress(gameState: PairGameState): number;
    /**
     * Get the current accuracy percentage
     */
    static getAccuracy(gameState: PairGameState): number;
    /**
     * Reset the game state for a new round
     */
    static resetGame(gameState: PairGameState, newPairs?: PairExercise[], newExercise?: ExerciseWithDetails): PairGameState;
    /**
     * Validate that pair exercises are properly formatted
     */
    static validatePairExercises(pairs: PairExercise[]): {
        isValid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=gameLogic.d.ts.map