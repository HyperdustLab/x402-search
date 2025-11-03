/**
 * Database module for storing discovered x402 resources
 * Uses JSON file storage (alternative to SQLite for Next.js compatibility)
 */

import path from "path";
import fs from "fs";
import type { DiscoveredResource, PaymentRequirements } from "x402/types";
import {
  extractSearchKeywords,
  matchesSearchKeywords,
  calculateRelevanceScore,
} from "../../utils/nlp-search";

// Ensure we're using Node.js runtime
export const runtime = "nodejs";

// Use a path that works in both dev and production
const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "resources.json");

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

interface StoredResource {
  resource: string;
  source: string;
  facilitatorName?: string;
  facilitatorUrl?: string;
  type: string;
  x402Version: number;
  accepts: PaymentRequirements[];
  metadata?: Record<string, unknown>;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

interface ResourceDatabase {
  resources: StoredResource[];
  lastUpdated: number;
}

/**
 * Load database from JSON file
 */
function loadDatabase(): ResourceDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Failed to load database:", error);
  }

  return {
    resources: [],
    lastUpdated: Date.now(),
  };
}

/**
 * Save database to JSON file
 */
function saveDatabase(db: ResourceDatabase): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    db.lastUpdated = Date.now();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to save database:", error);
    throw error;
  }
}

/**
 * Save a discovered resource to database
 * If resource already exists, update it
 */
export function saveResource(
  resource: DiscoveredResource,
  source: "crawler" | "facilitator" | "direct-discovery",
  facilitatorName?: string,
  facilitatorUrl?: string
): void {
  try {
    const db = loadDatabase();
    const lastUpdated = resource.lastUpdated instanceof Date
      ? resource.lastUpdated.toISOString()
      : new Date().toISOString();

    // Find existing resource
    const existingIndex = db.resources.findIndex(
      (r) => r.resource === resource.resource
    );

    const storedResource: StoredResource = {
      resource: resource.resource,
      source,
      facilitatorName: facilitatorName || undefined,
      facilitatorUrl: facilitatorUrl || undefined,
      type: resource.type,
      x402Version: resource.x402Version || 1,
      accepts: resource.accepts || [],
      metadata: resource.metadata,
      lastUpdated,
      createdAt: existingIndex >= 0 ? db.resources[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      db.resources[existingIndex] = storedResource;
    } else {
      db.resources.push(storedResource);
    }

    saveDatabase(db);
  } catch (error) {
    console.error("Failed to save resource:", error);
    throw error;
  }
}

/**
 * Save multiple resources in batch
 */
export function saveResources(
  resources: DiscoveredResource[],
  source: "crawler" | "facilitator" | "direct-discovery",
  facilitatorName?: string,
  facilitatorUrl?: string
): void {
  try {
    const db = loadDatabase();

    for (const resource of resources) {
      const lastUpdated = resource.lastUpdated instanceof Date
        ? resource.lastUpdated.toISOString()
        : new Date().toISOString();

      const existingIndex = db.resources.findIndex(
        (r) => r.resource === resource.resource
      );

      const storedResource: StoredResource = {
        resource: resource.resource,
        source,
        facilitatorName: facilitatorName || undefined,
        facilitatorUrl: facilitatorUrl || undefined,
        type: resource.type,
        x402Version: resource.x402Version || 1,
        accepts: resource.accepts || [],
        metadata: resource.metadata,
        lastUpdated,
        createdAt: existingIndex >= 0 ? db.resources[existingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        db.resources[existingIndex] = storedResource;
      } else {
        db.resources.push(storedResource);
      }
    }

    saveDatabase(db);
  } catch (error) {
    console.error("Failed to save resources:", error);
    throw error;
  }
}

/**
 * Query resources from database
 */
export interface ResourceQuery {
  query?: string; // Text search in resource URL, accepts description, metadata
  type?: string;
  source?: "crawler" | "facilitator" | "direct-discovery";
  facilitatorName?: string;
  limit?: number;
  offset?: number;
}

export interface ResourceWithSource {
  resource: DiscoveredResource;
  source: string;
  facilitatorName?: string;
  facilitatorUrl?: string;
}

export function queryResources(options: ResourceQuery = {}): {
  resources: ResourceWithSource[];
  total: number;
} {
  try {
    const db = loadDatabase();
    const {
      query,
      type,
      source,
      facilitatorName,
      limit = 100,
      offset = 0,
    } = options;

    let filtered = db.resources;

    // Apply filters
    if (query) {
      // Use NLP to extract meaningful keywords from natural language query
      const keywords = extractSearchKeywords(query);

      if (keywords.length > 0) {
        // Filter and score resources
        const scoredResources = filtered.map((r) => {
          const resourceLower = r.resource.toLowerCase();
          const acceptsDescriptions = r.accepts
            .map((accept) => accept.description?.toLowerCase() || "")
            .join(" ");
          const metadataStr = r.metadata
            ? JSON.stringify(r.metadata).toLowerCase()
            : "";

          // Create a combined searchable text
          const searchableText = [
            resourceLower,
            acceptsDescriptions,
            metadataStr,
          ].join(" ");

          // Check if matches and calculate relevance score
          const matches = matchesSearchKeywords(searchableText, keywords);
          const score = matches ? calculateRelevanceScore(searchableText, keywords) : 0;

          return { resource: r, matches, score };
        });

        // Filter only matching resources and sort by relevance
        filtered = scoredResources
          .filter((item) => item.matches)
          .sort((a, b) => b.score - a.score) // Sort by relevance (highest first)
          .map((item) => item.resource);
      }
    }

    if (type) {
      filtered = filtered.filter((r) => r.type === type);
    }

    if (source) {
      filtered = filtered.filter((r) => r.source === source);
    }

    if (facilitatorName) {
      filtered = filtered.filter((r) => r.facilitatorName === facilitatorName);
    }

    // Sort by lastUpdated (most recent first)
    filtered.sort((a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );

    const total = filtered.length;

    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit);

    // Convert to ResourceWithSource
    const resources: ResourceWithSource[] = paginated.map((r) => ({
      resource: {
        resource: r.resource,
        type: r.type,
        x402Version: r.x402Version,
        accepts: r.accepts,
        metadata: r.metadata,
        lastUpdated: new Date(r.lastUpdated),
      },
      source: r.source,
      facilitatorName: r.facilitatorName,
      facilitatorUrl: r.facilitatorUrl,
    }));

    return {
      resources,
      total,
    };
  } catch (error) {
    console.error("Failed to query resources:", error);
    // Return empty result instead of throwing to avoid breaking the API
    return {
      resources: [],
      total: 0,
    };
  }
}

/**
 * Get resource by URL
 */
export function getResourceByUrl(resourceUrl: string): {
  resource: DiscoveredResource | null;
  source: string;
  facilitatorName?: string;
  facilitatorUrl?: string;
} | null {
  try {
    const db = loadDatabase();
    const stored = db.resources.find((r) => r.resource === resourceUrl);

    if (!stored) {
      return null;
    }

    return {
      resource: {
        resource: stored.resource,
        type: stored.type,
        x402Version: stored.x402Version,
        accepts: stored.accepts,
        metadata: stored.metadata,
        lastUpdated: new Date(stored.lastUpdated),
      },
      source: stored.source,
      facilitatorName: stored.facilitatorName,
      facilitatorUrl: stored.facilitatorUrl,
    };
  } catch (error) {
    console.error("Failed to get resource by URL:", error);
    return null;
  }
}

/**
 * Get statistics about stored resources
 */
export function getResourceStats(): {
  total: number;
  bySource: Record<string, number>;
  byType: Record<string, number>;
  byFacilitator: Record<string, number>;
} {
  try {
    const db = loadDatabase();

    const total = db.resources.length;

    const bySource: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byFacilitator: Record<string, number> = {};

    for (const resource of db.resources) {
      bySource[resource.source] = (bySource[resource.source] || 0) + 1;
      byType[resource.type] = (byType[resource.type] || 0) + 1;
      if (resource.facilitatorName) {
        byFacilitator[resource.facilitatorName] = (byFacilitator[resource.facilitatorName] || 0) + 1;
      }
    }

    return {
      total,
      bySource,
      byType,
      byFacilitator,
    };
  } catch (error) {
    console.error("Failed to get resource stats:", error);
    return {
      total: 0,
      bySource: {},
      byType: {},
      byFacilitator: {},
    };
  }
}

/**
 * Clean up old resources (optional, for maintenance)
 */
export function cleanupOldResources(daysOld: number = 90): number {
  try {
    const db = loadDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffISO = cutoffDate.toISOString();

    const originalLength = db.resources.length;
    db.resources = db.resources.filter((r) => r.lastUpdated >= cutoffISO);
    const removed = originalLength - db.resources.length;

    if (removed > 0) {
      saveDatabase(db);
    }

    return removed;
  } catch (error) {
    console.error("Failed to cleanup old resources:", error);
    return 0;
  }
}


