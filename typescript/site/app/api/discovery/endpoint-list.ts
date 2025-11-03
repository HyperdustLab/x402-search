/**
 * Managed endpoint list with automatic discovery via crawler
 */

import { crawlAllSources } from "./crawler";
import { validateX402Endpoint } from "./crawler/utils/validator";
import {
  resetProgress,
  updateCrawlProgress,
  updateValidationProgress,
  completeCrawl,
  setCrawlError,
} from "./progress";
import fs from "fs";
import path from "path";

const ENDPOINT_LIST_FILE = path.join(
  process.cwd(),
  "app/api/discovery/endpoints.json"
);

interface EndpointList {
  endpoints: string[];
  lastUpdated: number;
  sources: Record<string, number>; // source -> count
  stats: {
    totalDiscovered: number;
    totalValidated: number;
    lastCrawlTime?: number;
  };
}

/**
 * Load endpoint list from file
 */
export function loadEndpointList(): EndpointList {
  try {
    if (fs.existsSync(ENDPOINT_LIST_FILE)) {
      const content = fs.readFileSync(ENDPOINT_LIST_FILE, "utf8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn("Failed to load endpoint list:", error);
  }

  return {
    endpoints: [],
    lastUpdated: 0,
    sources: {},
    stats: {
      totalDiscovered: 0,
      totalValidated: 0,
    },
  };
}

/**
 * Save endpoint list to file
 */
function saveEndpointList(list: EndpointList): void {
  try {
    fs.writeFileSync(ENDPOINT_LIST_FILE, JSON.stringify(list, null, 2));
  } catch (error) {
    console.error("Failed to save endpoint list:", error);
  }
}

// Track if background crawl is in progress
let backgroundCrawlInProgress = false;
let backgroundCrawlPromise: Promise<string[]> | null = null;

/**
 * Actually perform the crawl and validation (internal function)
 */
async function performCrawl(): Promise<string[]> {
  const currentList = loadEndpointList();

  // Reset progress
  resetProgress();

  console.log("Running automated endpoint discovery...");

  try {
    // Crawl all sources with progress updates
    const discoveredUrls = await crawlAllSources((source, discovered, total) => {
      updateCrawlProgress(source, discovered, total);
      console.log(`[Crawl Progress] ${source}: Found ${discovered} URLs (${total} new)`);
    });

    console.log(`Crawled ${discoveredUrls.length} potential URLs`);

    // Validate each URL with progress updates
    const validEndpoints: string[] = [];
    const BATCH_SIZE = 10;

    console.log(`[Validation] Starting validation of ${discoveredUrls.length} discovered URLs...`);

    for (let i = 0; i < discoveredUrls.length; i += BATCH_SIZE) {
      const batch = discoveredUrls.slice(i, i + BATCH_SIZE);

      // Log which URLs are being validated
      console.log(`[Validation] Validating batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(discoveredUrls.length / BATCH_SIZE)}:`);
      batch.forEach((url, idx) => {
        console.log(`[Validation]   ${i + idx + 1}. ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`);
      });

      const results = await Promise.allSettled(
        batch.map((url) => validateX402Endpoint(url))
      );

      for (let j = 0; j < batch.length; j++) {
        const result = results[j];
        const url = batch[j];
        if (result.status === "fulfilled" && result.value) {
          validEndpoints.push(url);
          console.log(`[Validation]   ✓ Valid x402 endpoint found: ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`);
        } else if (result.status === "rejected") {
          const reason = result.reason instanceof Error ? result.reason.message : String(result.reason || 'Unknown error');
          console.log(`[Validation]   ✗ Validation failed for ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}: ${reason}`);
        } else {
          console.log(`[Validation]   ✗ Not an x402 endpoint: ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
        }
      }

      // Update progress
      const validated = Math.min(i + BATCH_SIZE, discoveredUrls.length);
      updateValidationProgress(validated, discoveredUrls.length, validEndpoints.length);

      // Log progress summary
      const progressPercent = ((validated / discoveredUrls.length) * 100).toFixed(1);
      console.log(
        `[Validation Progress] ${validated}/${discoveredUrls.length} (${progressPercent}%) - Found ${validEndpoints.length} valid x402 endpoints so far`
      );
    }

    console.log(`Validated ${validEndpoints.length} x402 endpoints`);

    // Merge with existing endpoints (keep old ones that are still valid)
    const existingEndpoints = currentList.endpoints.filter(
      (url) => !discoveredUrls.includes(url)
    ); // Keep endpoints not found in this crawl
    const allEndpoints = [...new Set([...existingEndpoints, ...validEndpoints])];

    const updatedList: EndpointList = {
      endpoints: allEndpoints,
      lastUpdated: Date.now(),
      sources: {
        ...currentList.sources,
        crawl: validEndpoints.length,
      },
      stats: {
        totalDiscovered: discoveredUrls.length,
        totalValidated: validEndpoints.length,
        lastCrawlTime: Date.now(),
      },
    };

    saveEndpointList(updatedList);

    // Mark as completed
    completeCrawl(validEndpoints.length, discoveredUrls.length);

    return allEndpoints;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Crawl failed:", errorMessage);
    setCrawlError(errorMessage);
    throw error;
  }
}

/**
 * Start background crawl (non-blocking)
 */
function startBackgroundCrawl(): Promise<string[]> {
  if (backgroundCrawlInProgress && backgroundCrawlPromise) {
    // Already running, return existing promise
    return backgroundCrawlPromise;
  }

  backgroundCrawlInProgress = true;
  backgroundCrawlPromise = performCrawl()
    .then((result) => {
      backgroundCrawlInProgress = false;
      backgroundCrawlPromise = null;
      return result;
    })
    .catch((error) => {
      backgroundCrawlInProgress = false;
      backgroundCrawlPromise = null;
      console.error("Background crawl failed:", error);
      throw error;
    });

  return backgroundCrawlPromise;
}

/**
 * Discover and update endpoint list automatically
 * @param forceRefresh - Force refresh even if cache is valid
 * @param background - If true, return immediately with existing list and crawl in background
 */
export async function discoverAndUpdateEndpoints(
  forceRefresh: boolean = false,
  background: boolean = false
): Promise<string[]> {
  const currentList = loadEndpointList();

  // Check if we need to refresh (older than 24 hours or empty)
  const isOld =
    Date.now() - (currentList.stats.lastCrawlTime || 0) >
    24 * 60 * 60 * 1000; // 24 hours

  // If we have valid cached endpoints and not forcing refresh, return immediately
  if (!forceRefresh && !isOld && currentList.endpoints.length > 0) {
    console.log(
      `Using cached endpoint list (${currentList.endpoints.length} endpoints, updated ${Math.round((Date.now() - currentList.stats.lastCrawlTime!) / 3600000)}h ago)`
    );
    return currentList.endpoints;
  }

  // If background mode and we have any endpoints, return them immediately and crawl in background
  if (background && currentList.endpoints.length > 0) {
    console.log(
      `Returning cached endpoints (${currentList.endpoints.length}) and starting background crawl...`
    );
    // Start background crawl (fire and forget)
    startBackgroundCrawl().catch((error) => {
      console.error("Background crawl error:", error);
    });
    return currentList.endpoints;
  }

  // If list is empty and background mode, start background crawl and return empty
  if (background && currentList.endpoints.length === 0) {
    console.log("Endpoint list is empty, starting background crawl...");
    startBackgroundCrawl().catch((error) => {
      console.error("Background crawl error:", error);
    });
    return [];
  }

  // Synchronous crawl (for force refresh or when background=false)
  return performCrawl();
}

/**
 * Get current endpoint list
 */
export function getEndpointList(): string[] {
  const list = loadEndpointList();
  return list.endpoints;
}

/**
 * Manually add endpoint (for admin/community)
 */
export function addEndpoint(url: string): void {
  const list = loadEndpointList();
  if (!list.endpoints.includes(url)) {
    list.endpoints.push(url);
    list.lastUpdated = Date.now();
    saveEndpointList(list);
  }
}

/**
 * Get endpoint list statistics
 */
export function getEndpointListStats(): EndpointList["stats"] {
  const list = loadEndpointList();
  return list.stats;
}

