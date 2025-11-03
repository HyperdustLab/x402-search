/**
 * User endpoint submission API
 * Allows users to submit x402 endpoints for validation and inclusion
 */

import { NextRequest, NextResponse } from "next/server";
import { validateX402Endpoint } from "../../discovery/crawler/utils/validator";
import { addEndpoint } from "../../discovery/endpoint-list";
import { saveResource } from "../../discovery/db";
import type { DiscoveredResource } from "x402/types";

export const runtime = "nodejs";

interface SubmitRequest {
  url: string;
  validate?: boolean; // Whether to validate the endpoint
}

/**
 * POST /api/resources/submit
 * Submit a new x402 endpoint URL
 * 
 * Body:
 * {
 *   "url": "https://api.example.com/endpoint",
 *   "validate": true (optional, default: true)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: SubmitRequest = await request.json();
    const { url, validate = true } = body;

    // Validate URL format
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Invalid request", message: "URL is required and must be a string" },
        { status: 400 }
      );
    }

    // Check if URL is valid
    let urlObj: URL;
    try {
      urlObj = new URL(url);
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return NextResponse.json(
          { error: "Invalid URL", message: "URL must use HTTP or HTTPS protocol" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL", message: "URL format is invalid" },
        { status: 400 }
      );
    }

    // Validate endpoint if requested
    if (validate) {
      console.log(`[Submit] Validating endpoint: ${url}`);
      const isValid = await validateX402Endpoint(url);
      
      if (!isValid) {
        return NextResponse.json(
          {
            error: "Validation failed",
            message: "The URL does not appear to be a valid x402 endpoint. It must return HTTP 402 and contain x402 response structure.",
            validated: false,
          },
          { status: 400 }
        );
      }

      console.log(`[Submit] ✓ Valid x402 endpoint: ${url}`);
    }

    // Try to fetch full resource information
    let discoveredResource: DiscoveredResource | null = null;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "x402-submission-bot/1.0",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.status === 402 || response.status === 200) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("json")) {
          const data = await response.json();
          
          if (data.x402Version && data.accepts) {
            discoveredResource = {
              resource: url,
              type: "http",
              x402Version: data.x402Version,
              accepts: Array.isArray(data.accepts) ? data.accepts : [],
              lastUpdated: new Date(),
              metadata: {
                submittedBy: "user",
                submittedAt: new Date().toISOString(),
              },
            };
          }
        }
      }
    } catch (error) {
      console.warn(`[Submit] Failed to fetch full resource info for ${url}:`, error);
      // Continue anyway, we can still add the endpoint
    }

    // Add to endpoint list
    addEndpoint(url);
    console.log(`[Submit] Added endpoint to list: ${url}`);

    // Save to database if we have full resource info
    if (discoveredResource) {
      saveResource(discoveredResource, "direct-discovery");
      console.log(`[Submit] Saved resource to database: ${url}`);
    }

    return NextResponse.json({
      success: true,
      message: "Endpoint submitted successfully",
      url,
      validated: validate,
      savedToDatabase: discoveredResource !== null,
    });
  } catch (error) {
    console.error("[Submit] Error processing submission:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


