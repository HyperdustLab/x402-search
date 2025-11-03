import { NextRequest, NextResponse } from "next/server";
import { getEndpointList, getEndpointListStats, loadEndpointList } from "../endpoint-list";
import { loadProgress } from "../progress";
import { getServiceStatus } from "../crawler-service";

export const runtime = "nodejs";

/**
 * Statistics API for endpoint discovery
 * Returns information about discovered endpoints and crawler statistics
 */
export async function GET(request: NextRequest) {
  try {
    const list = loadEndpointList();
    const endpoints = getEndpointList();
    const stats = getEndpointListStats();
    const progress = loadProgress();
    const serviceStatus = getServiceStatus();

    // Calculate age in hours
    const ageHours = list.stats.lastCrawlTime
      ? Math.round((Date.now() - list.stats.lastCrawlTime) / 3600000)
      : null;

    // Calculate age in human-readable format
    let ageText = "Never";
    if (ageHours !== null) {
      if (ageHours < 1) {
        ageText = "Less than 1 hour ago";
      } else if (ageHours < 24) {
        ageText = `${ageHours} hour${ageHours > 1 ? "s" : ""} ago`;
      } else {
        const days = Math.floor(ageHours / 24);
        ageText = `${days} day${days > 1 ? "s" : ""} ago`;
      }
    }

    // Calculate progress percentage
    let progressPercent = 0;
    if (progress.status === "validating" && progress.totalValidated > 0) {
      progressPercent = (progress.currentValidating / progress.totalValidated) * 100;
    } else if (progress.status === "crawling") {
      progressPercent = progress.totalDiscovered > 0 ? 50 : 10; // Estimate
    } else if (progress.status === "completed") {
      progressPercent = 100;
    }

    // Format estimated time remaining
    let estimatedTimeText: string | null = null;
    if (progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0) {
      const seconds = Math.round(progress.estimatedTimeRemaining / 1000);
      if (seconds < 60) {
        estimatedTimeText = `${seconds} seconds`;
      } else if (seconds < 3600) {
        estimatedTimeText = `${Math.round(seconds / 60)} minutes`;
      } else {
        estimatedTimeText = `${Math.round(seconds / 3600)} hours`;
      }
    }

    return NextResponse.json({
      totalEndpoints: endpoints.length,
      endpoints: endpoints,
      stats: {
        ...stats,
        lastUpdated: list.lastUpdated
          ? new Date(list.lastUpdated).toISOString()
          : null,
        lastCrawlTime: stats.lastCrawlTime
          ? new Date(stats.lastCrawlTime).toISOString()
          : null,
        ageHours,
        ageText,
      },
      sources: list.sources,
      summary: {
        totalInList: endpoints.length,
        totalDiscovered: stats.totalDiscovered || 0,
        totalValidated: stats.totalValidated || 0,
        validationRate:
          stats.totalDiscovered > 0
            ? (
                (stats.totalValidated / stats.totalDiscovered) *
                100
              ).toFixed(1) + "%"
            : "N/A",
      },
      progress: {
        status: progress.status,
        phase: progress.phase,
        progressPercent: Math.round(progressPercent),
        totalDiscovered: progress.totalDiscovered,
        totalValidated: progress.totalValidated,
        currentValidating: progress.currentValidating,
        validEndpoints: progress.validEndpoints,
        currentSource: progress.currentSource,
        estimatedTimeRemaining: estimatedTimeText,
        startTime: progress.startTime ? new Date(progress.startTime).toISOString() : null,
        lastUpdate: progress.lastUpdate ? new Date(progress.lastUpdate).toISOString() : null,
        error: progress.error,
      },
      service: {
        running: serviceStatus.running,
        isInitialCrawl: serviceStatus.isInitialCrawl,
        interval: serviceStatus.interval,
        nextCrawlIn: serviceStatus.running && progress.status === "completed"
          ? serviceStatus.interval - (Date.now() - (progress.startTime || 0)) % serviceStatus.interval
          : null,
      },
    });
  } catch (error) {
    console.error("Error getting endpoint stats:", error);
    return NextResponse.json(
      {
        error: "Failed to get stats",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

