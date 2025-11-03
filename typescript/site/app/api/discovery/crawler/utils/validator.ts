/**
 * Validate if a URL is actually an x402 endpoint
 * Uses relaxed validation criteria to improve discovery rate
 */

export async function validateX402Endpoint(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "x402-validator/1.0",
      },
      signal: AbortSignal.timeout(10000), // Increased timeout to 10 seconds
    });

    // Relaxed: Allow 402 or 200 status codes
    // Some endpoints may return 200 if already paid or allow free access
    if (response.status !== 402 && response.status !== 200) {
      return false;
    }

    // Relaxed: Allow various JSON formats or missing Content-Type
    const contentType = response.headers.get("content-type") || "";
    const isJsonLike = contentType.includes("application/json") || 
                       contentType.includes("json") ||
                       contentType === ""; // Allow missing Content-Type

    // If status is 200, must have some JSON indication
    if (response.status === 200 && !isJsonLike) {
      return false;
    }

    // Try to parse JSON, but don't immediately reject if parsing fails
    let data: any;
    try {
      data = await response.json();
    } catch {
      // JSON parsing failed, but if status is 402, still consider it a possible x402 endpoint
      return response.status === 402;
    }

    // Relaxed: Accept if x402Version exists (even without accepts array)
    if (data.x402Version) {
      // More certain if accepts array exists
      if (data.accepts && Array.isArray(data.accepts)) {
        return true;
      }
      // Even without accepts, if x402Version exists, accept it
      return true;
    }

    // Relaxed: Check for x402-related fields in response
    const responseStr = JSON.stringify(data).toLowerCase();
    if (response.status === 402 && (
      responseStr.includes("x402") ||
      responseStr.includes("payment") ||
      responseStr.includes("accepts")
    )) {
      return true;
    }

    return false;
  } catch {
    // Network error or timeout, reject (endpoint may exist but temporarily unavailable)
    return false;
  }
}

