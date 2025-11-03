/**
 * Cache discovered resources to avoid repeated scanning
 */

import type { DiscoveredResource } from "x402/types";

// In-memory cache (in production, use Redis or database)
let resourceCache: DiscoveredResource[] = [];
let cacheLastUpdated = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export function getCachedResources(): DiscoveredResource[] {
  if (Date.now() - cacheLastUpdated > CACHE_TTL) {
    return []; // Cache expired
  }
  return resourceCache;
}

export function setCachedResources(resources: DiscoveredResource[]): void {
  resourceCache = resources;
  cacheLastUpdated = Date.now();
}

export function isCacheValid(): boolean {
  return Date.now() - cacheLastUpdated < CACHE_TTL;
}

export function getCacheAge(): number {
  return Date.now() - cacheLastUpdated;
}

