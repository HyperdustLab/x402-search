/**
 * Continuous background crawler service
 * Runs crawler periodically without blocking requests
 */

import { discoverAndUpdateEndpoints } from "./endpoint-list";
import { syncAllFacilitators } from "./facilitator-sync";

// Configuration
const CRAWL_INTERVAL = 30 * 60 * 1000; // 30 minutes
const FACILITATOR_SYNC_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
const INITIAL_DELAY = 30 * 1000; // 30 seconds after startup

let serviceRunning = false;
let crawlTimer: NodeJS.Timeout | null = null;
let facilitatorSyncTimer: NodeJS.Timeout | null = null;
let isInitialCrawl = true;

/**
 * Perform a single crawl cycle
 */
async function performCrawlCycle(): Promise<void> {
  try {
    console.log("[Crawler Service] Starting crawl cycle...");
    // Force refresh to always run actual crawl, not use cache
    await discoverAndUpdateEndpoints(true, false); // Force refresh and sync crawl
    console.log("[Crawler Service] Crawl cycle completed");
  } catch (error) {
    console.error("[Crawler Service] Crawl cycle failed:", error);
  }
}

/**
 * Perform facilitator synchronization
 */
async function performFacilitatorSync(): Promise<void> {
  try {
    console.log("[Crawler Service] Starting facilitator sync...");
    const result = await syncAllFacilitators({ limit: 1000 });
    console.log(
      `[Crawler Service] Facilitator sync completed: ${result.total} resources from ${result.results.length} facilitators`
    );
  } catch (error) {
    console.error("[Crawler Service] Facilitator sync failed:", error);
  }
}

/**
 * Start the continuous crawler service
 */
export function startCrawlerService(): void {
  if (serviceRunning) {
    console.log("[Crawler Service] Already running");
    return;
  }

  console.log("[Crawler Service] Starting continuous crawler service...");
  console.log(`[Crawler Service] Interval: ${CRAWL_INTERVAL / 1000 / 60} minutes`);
  console.log(`[Crawler Service] Initial delay: ${INITIAL_DELAY / 1000} seconds`);

  serviceRunning = true;

  // Initial crawl and sync after delay
  setTimeout(async () => {
    if (!serviceRunning) return;
    
    console.log("[Crawler Service] Running initial crawl and facilitator sync...");
    isInitialCrawl = false;
    
    // Run initial crawl
    await performCrawlCycle();
    
    // Run initial facilitator sync
    await performFacilitatorSync();

    // Schedule recurring crawls
    if (serviceRunning) {
      crawlTimer = setInterval(async () => {
        if (!serviceRunning) return;
        await performCrawlCycle();
      }, CRAWL_INTERVAL);
    }

    // Schedule recurring facilitator sync
    if (serviceRunning) {
      facilitatorSyncTimer = setInterval(async () => {
        if (!serviceRunning) return;
        await performFacilitatorSync();
      }, FACILITATOR_SYNC_INTERVAL);
    }
  }, INITIAL_DELAY);
}

/**
 * Stop the crawler service
 */
export function stopCrawlerService(): void {
  if (!serviceRunning) {
    return;
  }

  console.log("[Crawler Service] Stopping service...");
  serviceRunning = false;

  if (crawlTimer) {
    clearInterval(crawlTimer);
    crawlTimer = null;
  }

  if (facilitatorSyncTimer) {
    clearInterval(facilitatorSyncTimer);
    facilitatorSyncTimer = null;
  }
}

/**
 * Get service status
 */
export function getServiceStatus(): {
  running: boolean;
  isInitialCrawl: boolean;
  crawlInterval: number;
  facilitatorSyncInterval: number;
} {
  return {
    running: serviceRunning,
    isInitialCrawl,
    crawlInterval: CRAWL_INTERVAL,
    facilitatorSyncInterval: FACILITATOR_SYNC_INTERVAL,
  };
}

