/**
 * Text processing utilities for language learning exercises
 */

/**
 * Cleans text by normalizing punctuation and whitespace
 * - Attaches punctuation to preceding words
 * - Normalizes multiple spaces to single space
 * - Trims leading and trailing spaces
 */
export const cleanText = (text: string): string => {
  return text
    // Attach punctuation to the preceding word (remove spaces before punctuation)
    .replace(/\s+([.,!?;:])/g, '$1')
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    // Trim leading and trailing spaces
    .trim();
};

/**
 * Normalizes text for comparison (case-insensitive, trimmed)
 */
export const normalizeForComparison = (text: string): string => {
  return cleanText(text).toLowerCase().trim();
};

/**
 * Splits text into words, filtering out empty strings
 */
export const splitIntoWords = (text: string): string[] => {
  return cleanText(text).split(' ').filter(word => word.trim() !== '');
};