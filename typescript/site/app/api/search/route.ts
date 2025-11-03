import { NextRequest, NextResponse } from "next/server";
import { useFacilitator } from "x402/verify";
import { facilitator } from "@coinbase/x402";
import type {
  ListDiscoveryResourcesRequest,
  DiscoveredResource,
} from "x402/types";
import { testDiscoveryResources } from "./test-data";
import { getFacilitatorInfo } from "./facilitator-map";
import { queryResources, saveResources } from "../discovery/db";

// Use Node.js runtime for better-sqlite3 support
export const runtime = "nodejs";

/**
 * Search API endpoint for finding x402-enabled endpoints
 * 
 * Query parameters:
 * - q: Search query (keywords)
 * - type: Filter by resource type (e.g., "http")
 * - network: Filter by blockchain network (e.g., "base", "base-sepolia")
 * - limit: Maximum number of results (default: 20)
 * - offset: Pagination offset (default: 0)
 * 
 * Returns JSON response suitable for both humans and AI agents
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || undefined;
    const network = searchParams.get("network") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Prepare discovery request
    const discoveryRequest: ListDiscoveryResourcesRequest = {
      type,
      limit: Math.min(limit, 100), // Cap at 100
      offset,
    };

    // Trigger facilitator sync in background (async, don't wait for response)
    // This will sync from all known facilitators
    Promise.resolve().then(async () => {
      try {
        const { syncAllFacilitators } = await import("../discovery/facilitator-sync");
        await syncAllFacilitators(discoveryRequest);
      } catch (error) {
        console.warn("Facilitator sync failed:", error);
      }
    }).catch(() => {
      // Ignore errors
    });

    // Trigger crawler in background (async, don't wait)
    Promise.resolve().then(async () => {
      try {
        const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const discoveryUrl = new URL("/api/discovery/resources", baseUrl);
        if (type) discoveryUrl.searchParams.set("type", type);
        discoveryUrl.searchParams.set("limit", String(100));
        
        const res = await fetch(discoveryUrl.toString(), {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            console.log(`Background: Discovered ${data.items.length} resources from crawler`);
            // These are already saved to DB by discover-resources.ts
          }
        }
      } catch (error) {
        // Ignore errors in background fetch
      }
    }).catch(() => {
      // Ignore errors
    });

    // Query from database - get resources from both sources
    const facilitatorResults = queryResources({
      query: query.trim() || undefined,
      type,
      source: "facilitator",
      limit: limit * 2,
      offset: 0,
    });
    
    const crawlerResults = queryResources({
      query: query.trim() || undefined,
      type,
      source: "crawler",
      limit: limit * 2,
      offset: 0,
    });

    // Combine results from both sources (no deduplication as per user requirement)
    const allResources = [
      ...facilitatorResults.resources.map(r => ({
        resource: r.resource,
        source: r.source,
        facilitatorName: r.facilitatorName,
        facilitatorUrl: r.facilitatorUrl,
      })),
      ...crawlerResults.resources.map(r => ({
        resource: r.resource,
        source: r.source,
      })),
    ];

    // Apply network filter if specified
    let filteredItems = allResources;
    if (network) {
      filteredItems = allResources.filter((item) =>
        item.resource.accepts?.some((accept) => accept.network === network)
      );
    }

    // Apply pagination
    const paginatedItems = filteredItems.slice(offset, offset + limit);

    // Create a set of test resource URLs for quick lookup
    const testResourceUrls = new Set(testDiscoveryResources.map(item => item.resource));

    // Transform results for better display
    const results = paginatedItems.map((item) => {
      const resource = item.resource;
      // Get the first payment requirement for display
      const firstAccept = resource.accepts?.[0];
      
      // Extract price information
      const priceInfo = firstAccept?.maxAmountRequired
        ? {
            amount: firstAccept.maxAmountRequired,
            asset: firstAccept.asset,
            network: firstAccept.network,
          }
        : null;

      // Check if this item is from test data
      const isTest = testResourceUrls.has(resource.resource);
      
      // Determine facilitator/source info
      let resultFacilitator = null;
      if (!isTest) {
        if (item.source === "facilitator" && item.facilitatorName) {
          resultFacilitator = {
            name: item.facilitatorName,
            url: item.facilitatorUrl || "N/A",
          };
        } else if (item.source === "crawler") {
          resultFacilitator = { name: "Direct Discovery", url: "N/A" };
        }
      }

      return {
        resource: resource.resource,
        type: resource.type,
        x402Version: resource.x402Version,
        description: firstAccept?.description || resource.resource,
        price: priceInfo,
        network: firstAccept?.network,
        payTo: firstAccept?.payTo,
        mimeType: firstAccept?.mimeType,
        metadata: resource.metadata,
        lastUpdated: resource.lastUpdated,
        accepts: resource.accepts,
        isTest, // Mark as test data
        facilitator: resultFacilitator, // Source info
        source: item.source, // Add source field explicitly
      };
    });

    // Return response in format suitable for both humans and AI agents
    return NextResponse.json({
      query,
      results,
      total: filteredItems.length,
      pagination: {
        limit,
        offset,
        hasMore: filteredItems.length > offset + limit,
      },
      filters: {
        type,
        network,
      },
    });
  } catch (error) {
    console.error("Error in search API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
