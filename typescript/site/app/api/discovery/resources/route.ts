import { NextRequest, NextResponse } from "next/server";
import {
  ListDiscoveryResourcesRequest,
  ListDiscoveryResourcesResponse,
  ListDiscoveryResourcesResponseSchema,
  DiscoveredResource,
} from "x402/types";
import { discoverResourcesFromEndpoints } from "../discover-resources";
import { getCachedResources, setCachedResources, isCacheValid } from "../cache";

export const runtime = "nodejs";

/**
 * Direct Discovery API implementation
 * Scans endpoints directly without relying on facilitator Discovery API
 * 
 * Query parameters:
 * - type: Filter by resource type (e.g., "http")
 * - limit: Maximum number of results (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 * - refresh: Force refresh cache (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100); // Cap at 100
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const refresh = searchParams.get("refresh") === "true";

    // Check cache first (unless refresh requested)
    let discoveredResources: DiscoveredResource[];
    
    if (!refresh && isCacheValid()) {
      discoveredResources = getCachedResources();
      console.log(`Using cached resources (${discoveredResources.length} items)`);
    } else {
      // Perform discovery (will trigger crawler if needed)
      console.log("Performing fresh resource discovery...");
      discoveredResources = await discoverResourcesFromEndpoints({
        type,
        limit: 500, // Discover more than requested for caching
        forceRefresh: refresh, // Pass refresh flag to trigger crawler
      });
      setCachedResources(discoveredResources);
      console.log(`Discovered ${discoveredResources.length} resources`);
    }

    // Apply type filter if specified
    if (type) {
      discoveredResources = discoveredResources.filter((r) => r.type === type);
    }

    // Apply pagination
    const paginatedResources = discoveredResources.slice(offset, offset + limit);

    const response: ListDiscoveryResourcesResponse = {
      x402Version: 1,
      items: paginatedResources,
      pagination: {
        limit,
        offset,
        total: discoveredResources.length,
      },
    };

    // Validate response with schema
    const validatedResponse = ListDiscoveryResourcesResponseSchema.parse(response);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error("Error in discovery API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

