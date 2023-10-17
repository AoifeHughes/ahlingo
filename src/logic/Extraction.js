import { extract } from "@extractus/article-extractor";

async function extractMainTextFromURL(url) {
  try {
    const result = await extract(url);
    return result.content;
  } catch (error) {
    return `Failed to extract main text from ${url}:`, error;
  }
}

export { extractMainTextFromURL };
