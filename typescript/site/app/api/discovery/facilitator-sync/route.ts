/**
 * Manual facilitator sync API endpoint
 * Allows triggering facilitator sync on demand
 */

import { NextRequest, NextResponse } from "next/server";
import { syncAllFacilitators } from "../facilitator-sync";

export const runtime = "nodejs";

/**
 * POST /api/discovery/facilitator-sync
 * Manually trigger synchronization from all facilitators
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[API] Manual facilitator sync triggered");
    const result = await syncAllFacilitators({ limit: 1000 });

    return NextResponse.json({
      success: true,
      message: `Synced ${result.total} resources from ${result.results.length} facilitators`,
      total: result.total,
      facilitators: result.results.map((r) => ({
        name: r.facilitator,
        count: r.count,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error("[API] Facilitator sync failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync facilitators",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


