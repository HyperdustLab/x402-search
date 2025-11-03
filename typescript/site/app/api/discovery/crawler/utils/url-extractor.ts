/**
 * Extract URLs from text (HTML, markdown, code, etc.)
 */

export function extractUrlsFromText(text: string): string[] {
  const urls: string[] = [];

  // Pattern 1: Standard HTTP(S) URLs
  const urlPattern = /https?:\/\/[^\s"<>'{}|\\^`\[\]]+/gi;
  const matches = text.match(urlPattern) || [];

  for (const match of matches) {
    // Clean up URL (remove trailing punctuation)
    let url = match.replace(/[.,;:!?)}\]>]+$/, "");

    // Only include URLs that look like API endpoints
    if (isLikelyApiEndpoint(url)) {
      urls.push(url);
    }
  }

  // Pattern 2: API endpoint patterns in code/config
  const apiPatterns = [
    /api[_-]?url\s*[:=]\s*["']?(https?:\/\/[^"'\s]+)/gi,
    /endpoint\s*[:=]\s*["']?(https?:\/\/[^"'\s]+)/gi,
    /base[_-]?url\s*[:=]\s*["']?(https?:\/\/[^"'\s]+)/gi,
    /BASE_URL\s*[:=]\s*["']?(https?:\/\/[^"'\s]+)/gi,
    /resource\s*[:=]\s*["']?(https?:\/\/[^"'\s]+)/gi,
  ];

  for (const pattern of apiPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && isLikelyApiEndpoint(match[1])) {
        urls.push(match[1]);
      }
    }
  }

  return [...new Set(urls)];
}

function isLikelyApiEndpoint(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Must be HTTP/HTTPS
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return false;
    }

    // Should have api, v1, v2 in path or subdomain
    const path = urlObj.pathname.toLowerCase();
    const hostname = urlObj.hostname.toLowerCase();

    return (
      hostname.includes("api.") ||
      path.includes("/api") ||
      path.includes("/v1") ||
      path.includes("/v2") ||
      path.includes("/endpoint") ||
      hostname.includes("api-") ||
      path.includes("/x402") ||
      hostname.includes("x402")
    );
  } catch {
    return false;
  }
}

