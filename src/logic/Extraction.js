import { extract } from "@extractus/article-extractor";

async function extractMainTextFromURL(url) {
  try {
    const result = await extract(url);
    const parser = new DOMParser();
    const content = parser.parseFromString(result.content, "text/html");
    return content.body.textContent.trim();
  } catch (error) {
    return `Failed to extract main text from ${url}:`, error;
  }
}

export { extractMainTextFromURL };
