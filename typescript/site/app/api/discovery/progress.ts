/**
 * Progress tracking for crawler service
 * Stores real-time progress of crawling and validation
 */

import fs from "fs";
import path from "path";

const PROGRESS_FILE = path.join(process.cwd(), ".data", "crawler-progress.json");

export interface CrawlerProgress {
  status: "idle" | "crawling" | "validating" | "completed" | "error";
  phase: "crawl" | "validate";
  startTime: number;
  lastUpdate: number;
  totalDiscovered: number;
  totalValidated: number;
  currentValidating: number;
  currentCrawling: number;
  validEndpoints: number;
  currentSource?: string;
  error?: string;
  estimatedTimeRemaining?: number;
}

let progressCache: CrawlerProgress | null = null;

/**
 * Initialize progress file
 */
function ensureProgressFile(): void {
  const dir = path.dirname(PROGRESS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // Don't create file here if it doesn't exist, just ensure directory exists
  // File will be created by saveProgress when needed
}

/**
 * Load progress from file
 */
export function loadProgress(): CrawlerProgress {
  ensureProgressFile();
  
  if (progressCache) {
    return progressCache;
  }

  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const content = fs.readFileSync(PROGRESS_FILE, "utf8");
      progressCache = JSON.parse(content);
      return progressCache!;
    }
  } catch (error) {
    console.warn("Failed to load progress:", error);
  }

  // Return default progress without saving (to avoid recursion)
  const defaultProgress: CrawlerProgress = {
    status: "idle",
    phase: "crawl",
    startTime: Date.now(),
    lastUpdate: Date.now(),
    totalDiscovered: 0,
    totalValidated: 0,
    currentValidating: 0,
    currentCrawling: 0,
    validEndpoints: 0,
  };

  progressCache = defaultProgress;
  return defaultProgress;
}

/**
 * Save progress to file
 */
export function saveProgress(progress: Partial<CrawlerProgress>): void {
  ensureProgressFile(); // Only ensures directory exists, doesn't create file
  
  const current = loadProgress();
  const updated: CrawlerProgress = {
    ...current,
    ...progress,
    lastUpdate: Date.now(),
  };

  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(updated, null, 2));
    progressCache = updated;
  } catch (error) {
    console.error("Failed to save progress:", error);
  }
}

/**
 * Update progress for crawling phase
 */
export function updateCrawlProgress(
  source: string,
  discovered: number,
  totalCrawling: number
): void {
  saveProgress({
    status: "crawling",
    phase: "crawl",
    currentSource: source,
    totalDiscovered: discovered,
    currentCrawling: totalCrawling,
  });
}

/**
 * Update progress for validation phase
 */
export function updateValidationProgress(
  validated: number,
  total: number,
  validEndpoints: number
): void {
  const progress = loadProgress();
  const elapsed = Date.now() - progress.startTime;
  const avgTimePerUrl = validated > 0 ? elapsed / validated : 0;
  const remaining = total - validated;
  const estimatedTimeRemaining = remaining * avgTimePerUrl;

  saveProgress({
    status: "validating",
    phase: "validate",
    currentValidating: validated,
    totalValidated: total,
    validEndpoints: validEndpoints,
    estimatedTimeRemaining: estimatedTimeRemaining > 0 ? estimatedTimeRemaining : undefined,
  });
}

/**
 * Mark crawl as completed
 */
export function completeCrawl(validEndpoints: number, totalDiscovered: number): void {
  saveProgress({
    status: "completed",
    phase: "validate",
    validEndpoints: validEndpoints,
    totalDiscovered: totalDiscovered,
    totalValidated: totalDiscovered,
    currentValidating: totalDiscovered,
  });
}

/**
 * Mark crawl as error
 */
export function setCrawlError(error: string): void {
  saveProgress({
    status: "error",
    error: error,
  });
}

/**
 * Reset progress for new crawl
 */
export function resetProgress(): void {
  saveProgress({
    status: "idle",
    phase: "crawl",
    startTime: Date.now(),
    totalDiscovered: 0,
    totalValidated: 0,
    currentValidating: 0,
    currentCrawling: 0,
    validEndpoints: 0,
    currentSource: undefined,
    error: undefined,
    estimatedTimeRemaining: undefined,
  });
}

