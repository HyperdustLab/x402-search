/**
 * Facilitator synchronization service
 * Fetches resources from multiple facilitators and saves them to database
 */

import { useFacilitator } from "x402/verify";
import type {
  ListDiscoveryResourcesRequest,
  DiscoveredResource,
} from "x402/types";
import { getFacilitatorInfo, type FacilitatorInfo } from "../search/facilitator-map";
import { saveResources } from "./db";

export interface FacilitatorConfig {
  url: string;
  name?: string;
  enabled?: boolean;
}

/**
 * Get list of known facilitators
 * This should be expanded to include all known facilitators
 */
export function getKnownFacilitators(): FacilitatorConfig[] {
  // Extract facilitators from facilitator-map
  const facilitators: FacilitatorConfig[] = [
    {
      url: "https://x402.org/facilitator",
      name: "x402.org",
      enabled: true,
    },
    {
      url: "https://api.cdp.coinbase.com/platform/v2/x402",
      name: "Coinbase CDP",
      enabled: true,
    },
    {
      url: "https://facilitator.mogami.tech",
      name: "Mogami",
      enabled: true,
    },
    {
      url: "https://facilitator.x402.rs",
      name: "x402.rs",
      enabled: true,
    },
    {
      url: "https://facilitator.payai.network",
      name: "PayAI",
      enabled: true,
    },
    {
      url: "https://facilitator.corbits.dev",
      name: "Corbits",
      enabled: true,
    },
  ];

  return facilitators.filter((f) => f.enabled !== false);
}

/**
 * Sync resources from a single facilitator
 */
export async function syncFacilitator(
  facilitator: FacilitatorConfig,
  config: ListDiscoveryResourcesRequest = {}
): Promise<{ count: number; error?: string }> {
  try {
    console.log(`[Facilitator Sync] Syncing ${facilitator.name || facilitator.url}...`);

    const { list } = useFacilitator({ url: facilitator.url });
    const response = await list({
      ...config,
      limit: config.limit || 1000, // Fetch more resources
    });

    const resources = response.items || [];

    if (resources.length > 0) {
      const facilitatorInfo = getFacilitatorInfo(facilitator.url);
      saveResources(
        resources,
        "facilitator",
        facilitatorInfo.name,
        facilitatorInfo.url
      );
      console.log(
        `[Facilitator Sync] ✓ Synced ${resources.length} resources from ${facilitator.name || facilitator.url}`
      );
      return { count: resources.length };
    } else {
      console.log(
        `[Facilitator Sync] ⚠ No resources found from ${facilitator.name || facilitator.url}`
      );
      return { count: 0 };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.warn(
      `[Facilitator Sync] ✗ Failed to sync ${facilitator.name || facilitator.url}: ${errorMessage}`
    );
    return { count: 0, error: errorMessage };
  }
}

/**
 * Sync resources from all known facilitators
 */
export async function syncAllFacilitators(
  config: ListDiscoveryResourcesRequest = {}
): Promise<{
  total: number;
  results: Array<{ facilitator: string; count: number; error?: string }>;
}> {
  const facilitators = getKnownFacilitators();
  const results: Array<{ facilitator: string; count: number; error?: string }> = [];
  let total = 0;

  console.log(`[Facilitator Sync] Starting sync from ${facilitators.length} facilitators...`);

  // Sync all facilitators in parallel (with concurrency limit)
  const BATCH_SIZE = 3; // Limit concurrent requests to avoid overwhelming servers
  for (let i = 0; i < facilitators.length; i += BATCH_SIZE) {
    const batch = facilitators.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((facilitator) => syncFacilitator(facilitator, config))
    );

    for (let j = 0; j < batch.length; j++) {
      const result = batchResults[j];
      const facilitator = batch[j];

      if (result.status === "fulfilled") {
        const { count, error } = result.value;
        results.push({
          facilitator: facilitator.name || facilitator.url,
          count,
          error,
        });
        total += count;
      } else {
        results.push({
          facilitator: facilitator.name || facilitator.url,
          count: 0,
          error: result.reason instanceof Error ? result.reason.message : "Unknown error",
        });
      }
    }
  }

  console.log(
    `[Facilitator Sync] Completed: Synced ${total} total resources from ${facilitators.length} facilitators`
  );

  return { total, results };
}


