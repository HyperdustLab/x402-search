/**
 * Direct resource discovery by probing endpoints
 * Uses automated crawler to discover endpoints, then probes them directly
 */

import type { DiscoveredResource, PaymentRequirements } from "x402/types";
import {
  getEndpointList,
  discoverAndUpdateEndpoints,
} from "./endpoint-list";
import { saveResources } from "./db";

// Note: This module is used by API routes that need Node.js runtime

interface DiscoveryConfig {
  type?: string;
  limit?: number;
  forceRefresh?: boolean;
}

/**
 * Probe a single endpoint to check if it requires x402 payment
 * Returns the discovered resource or null if not x402-enabled
 */
async function probeEndpoint(
  url: string
): Promise<DiscoveredResource | null> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "x402-discovery-bot/1.0",
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    // Check for 402 Payment Required status
    if (response.status !== 402) {
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return null;
    }

    const data = await response.json();

    // Validate x402 response structure
    if (!data.x402Version || !data.accepts || !Array.isArray(data.accepts)) {
      return null;
    }

    // Extract payment requirements
    const accepts: PaymentRequirements[] = data.accepts.map((accept: any) => ({
      scheme: accept.scheme,
      network: accept.network,
      maxAmountRequired: accept.maxAmountRequired,
      resource: accept.resource || url,
      description: accept.description || "",
      mimeType: accept.mimeType || "",
      payTo: accept.payTo,
      maxTimeoutSeconds: accept.maxTimeoutSeconds || 60,
      asset: accept.asset,
      outputSchema: accept.outputSchema || null,
      extra: accept.extra || null,
    }));

    // Build discovered resource
    const discoveredResource: DiscoveredResource = {
      resource: url,
      type: "http",
      x402Version: data.x402Version,
      accepts,
      lastUpdated: new Date(),
      metadata: {
        discoveredBy: "direct-probe",
        discoveredAt: new Date().toISOString(),
      },
    };

    return discoveredResource;
  } catch (error) {
    // Network error, timeout, or invalid response
    return null;
  }
}

/**
 * Discover resources from a list of potential endpoints
 */
async function discoverFromEndpointList(
  endpoints: string[],
  config: DiscoveryConfig
): Promise<DiscoveredResource[]> {
  const discovered: DiscoveredResource[] = [];
  const limit = config.limit || 1000;

  // Probe endpoints in parallel (with concurrency limit)
  const BATCH_SIZE = 10;
  for (
    let i = 0;
    i < endpoints.length && discovered.length < limit;
    i += BATCH_SIZE
  ) {
    const batch = endpoints.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((endpoint) => probeEndpoint(endpoint))
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        discovered.push(result.value);
        if (discovered.length >= limit) break;
      }
    }

    // Log progress for large batches
    if (endpoints.length > 50 && (i + BATCH_SIZE) % 50 === 0) {
      console.log(
        `Probed ${Math.min(i + BATCH_SIZE, endpoints.length)}/${endpoints.length} endpoints, found ${discovered.length} x402 resources...`
      );
    }
  }

  return discovered;
}

/**
 * Main discovery function
 * Uses automated crawler to get endpoint list, then probes them directly
 */
export async function discoverResourcesFromEndpoints(
  config: DiscoveryConfig = {}
): Promise<DiscoveredResource[]> {
  const allDiscovered: DiscoveredResource[] = [];

  // Get endpoint list from automated crawler
  // Use background mode to avoid blocking frontend requests
  console.log("Getting endpoint list from crawler...");
  const endpointList = await discoverAndUpdateEndpoints(
    config.forceRefresh || false,
    true // background mode - return immediately if cache exists, crawl in background
  );

  if (endpointList.length === 0) {
    console.log(
      "No endpoints in cache. Background crawl started. Will return results on next request."
    );
    return [];
  }

  console.log(`Probing ${endpointList.length} endpoints from crawler...`);

  // Probe all endpoints from the list
  const probedResults = await discoverFromEndpointList(endpointList, config);
  allDiscovered.push(...probedResults);

  // Deduplicate by resource URL
  const uniqueResources = new Map<string, DiscoveredResource>();
  for (const resource of allDiscovered) {
    if (!uniqueResources.has(resource.resource)) {
      uniqueResources.set(resource.resource, resource);
    }
  }

  // Save discovered resources to database
  if (allDiscovered.length > 0) {
    const uniqueResourcesArray = Array.from(uniqueResources.values());
    console.log(`Saving ${uniqueResourcesArray.length} discovered resources to database...`);
    saveResources(uniqueResourcesArray, "crawler");
    console.log(`Saved ${uniqueResourcesArray.length} resources to database`);
  }

  // Apply type filter if specified
  let filtered = Array.from(uniqueResources.values());
  if (config.type) {
    filtered = filtered.filter((r) => r.type === config.type);
  }

  // Sort by lastUpdated (most recent first)
  filtered.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

  // Apply limit
  const limit = config.limit || 1000;
  return filtered.slice(0, limit);
}

/**
 * Background discovery task
 * Can be called periodically to refresh the resource list
 * This will trigger crawler and update endpoint list
 */
export async function refreshDiscoveredResources(): Promise<number> {
  // Force refresh to trigger crawler
  const resources = await discoverResourcesFromEndpoints({
    limit: 1000,
    forceRefresh: true,
  });
  return resources.length;
}

