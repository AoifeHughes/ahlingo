/**
 * Utility functions for the AHLingo language learning app
 */
/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export declare function shuffleArray<T>(array: T[]): T[];
/**
 * Delay execution for a specified number of milliseconds
 */
export declare function delay(ms: number): Promise<void>;
/**
 * Format a date to a human-readable string
 */
export declare function formatDate(date: Date): string;
/**
 * Generate a random ID
 */
export declare function generateId(): string;
/**
 * Capitalize the first letter of a string
 */
export declare function capitalize(str: string): string;
/**
 * Deep clone an object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export declare function isEmpty(value: any): boolean;
/**
 * Debounce a function
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Calculate percentage with precision
 */
export declare function calculatePercentage(value: number, total: number, precision?: number): number;
/**
 * Validate email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate URL format
 */
export declare function isValidUrl(url: string): boolean;
/**
 * Convert string to kebab-case
 */
export declare function toKebabCase(str: string): string;
/**
 * Convert string to camelCase
 */
export declare function toCamelCase(str: string): string;
/**
 * Truncate text to a specified length
 */
export declare function truncateText(text: string, maxLength: number, suffix?: string): string;
/**
 * Get contrast color (black or white) for a given background color
 */
export declare function getContrastColor(backgroundColor: string): string;
/**
 * Format file size in human readable format
 */
export declare function formatFileSize(bytes: number): string;
/**
 * Create a range of numbers
 */
export declare function range(start: number, end: number, step?: number): number[];
/**
 * Group array items by a key
 */
export declare function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]>;
//# sourceMappingURL=index.d.ts.map