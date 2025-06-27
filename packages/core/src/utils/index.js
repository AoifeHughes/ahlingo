"use strict";
/**
 * Utility functions for the AHLingo language learning app
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.shuffleArray = shuffleArray;
exports.delay = delay;
exports.formatDate = formatDate;
exports.generateId = generateId;
exports.capitalize = capitalize;
exports.deepClone = deepClone;
exports.isEmpty = isEmpty;
exports.debounce = debounce;
exports.calculatePercentage = calculatePercentage;
exports.isValidEmail = isValidEmail;
exports.isValidUrl = isValidUrl;
exports.toKebabCase = toKebabCase;
exports.toCamelCase = toCamelCase;
exports.truncateText = truncateText;
exports.getContrastColor = getContrastColor;
exports.formatFileSize = formatFileSize;
exports.range = range;
exports.groupBy = groupBy;
/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
/**
 * Delay execution for a specified number of milliseconds
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Format a date to a human-readable string
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}
/**
 * Generate a random ID
 */
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
/**
 * Capitalize the first letter of a string
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
/**
 * Deep clone an object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
function isEmpty(value) {
    if (value == null)
        return true;
    if (typeof value === 'string')
        return value.trim() === '';
    if (Array.isArray(value))
        return value.length === 0;
    if (typeof value === 'object')
        return Object.keys(value).length === 0;
    return false;
}
/**
 * Debounce a function
 */
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
/**
 * Calculate percentage with precision
 */
function calculatePercentage(value, total, precision = 1) {
    if (total === 0)
        return 0;
    return parseFloat(((value / total) * 100).toFixed(precision));
}
/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Validate URL format
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Convert string to kebab-case
 */
function toKebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase();
}
/**
 * Convert string to camelCase
 */
function toCamelCase(str) {
    return str
        .replace(/-([a-z])/g, (g) => g[1].toUpperCase())
        .replace(/^[A-Z]/, (g) => g.toLowerCase());
}
/**
 * Truncate text to a specified length
 */
function truncateText(text, maxLength, suffix = '...') {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}
/**
 * Get contrast color (black or white) for a given background color
 */
function getContrastColor(backgroundColor) {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
/**
 * Format file size in human readable format
 */
function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
/**
 * Create a range of numbers
 */
function range(start, end, step = 1) {
    const result = [];
    for (let i = start; i < end; i += step) {
        result.push(i);
    }
    return result;
}
/**
 * Group array items by a key
 */
function groupBy(array, keyFn) {
    return array.reduce((groups, item) => {
        const key = keyFn(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}
//# sourceMappingURL=index.js.map