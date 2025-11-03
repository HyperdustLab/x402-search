/**
 * Automated crawler system for discovering x402 endpoints
 * Crawls multiple sources to automatically build endpoint list
 */

import { crawlGitHub } from "./sources/github";
import { crawlEcosystem } from "./sources/ecosystem";

export interface CrawlResult {
  urls: string[];
  source: string;
  timestamp: number;
}

export type ProgressCallback = (source: string, discovered: number, total: number) => void;

/**
 * Main crawler function that runs all crawlers
 */
export async function crawlAllSources(
  onProgress?: ProgressCallback
): Promise<string[]> {
  const allUrls = new Set<string>();

  console.log("Starting automated crawl of x402 endpoints...");

  // Strategy 1: Crawl GitHub repositories
  try {
    onProgress?.("GitHub", allUrls.size, 0);
    const githubUrls = await crawlGitHub();
    githubUrls.forEach((url) => allUrls.add(url));
    onProgress?.("GitHub", allUrls.size, githubUrls.length);
    console.log(`Discovered ${githubUrls.length} URLs from GitHub`);
  } catch (error) {
    console.warn("GitHub crawl failed:", error);
  }

  // Strategy 2: Crawl ecosystem partner websites
  try {
    onProgress?.("Ecosystem", allUrls.size, 0);
    const ecosystemUrls = await crawlEcosystem();
    ecosystemUrls.forEach((url) => allUrls.add(url));
    onProgress?.("Ecosystem", allUrls.size, ecosystemUrls.length);
    console.log(`Discovered ${ecosystemUrls.length} URLs from ecosystem`);
  } catch (error) {
    console.warn("Ecosystem crawl failed:", error);
  }

  // Strategy 3: Crawl documentation sites (can be added later)
  // try {
  //   const docUrls = await crawlDocumentation();
  //   docUrls.forEach(url => allUrls.add(url));
  // } catch (error) {
  //   console.warn('Documentation crawl failed:', error);
  // }

  // Strategy 4: Search engines (if API keys available) - can be added later
  // if (process.env.SEARCH_API_KEY) {
  //   try {
  //     const searchUrls = await crawlSearchEngines();
  //     searchUrls.forEach(url => allUrls.add(url));
  //   } catch (error) {
  //     console.warn('Search engine crawl failed:', error);
  //   }
  // }

  return Array.from(allUrls);
}

