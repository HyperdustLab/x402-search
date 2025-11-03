/**
 * Facilitator name mapping based on URL
 * Maps facilitator URLs to their display names
 */

export interface FacilitatorInfo {
  name: string;
  url: string;
}

// Known facilitator mappings
const FACILITATOR_MAP: Record<string, FacilitatorInfo> = {
  "https://x402.org/facilitator": {
    name: "x402.org",
    url: "https://x402.org/facilitator",
  },
  "https://www.x402.org/facilitator": {
    name: "x402.org",
    url: "https://www.x402.org/facilitator",
  },
  "https://api.cdp.coinbase.com/platform/v2/x402": {
    name: "Coinbase CDP",
    url: "https://api.cdp.coinbase.com/platform/v2/x402",
  },
  "https://facilitator.mogami.tech": {
    name: "Mogami",
    url: "https://facilitator.mogami.tech",
  },
  "https://facilitator.x402.rs": {
    name: "x402.rs",
    url: "https://facilitator.x402.rs",
  },
  "https://facilitator.payai.network": {
    name: "PayAI",
    url: "https://facilitator.payai.network",
  },
  "https://facilitator.corbits.dev": {
    name: "Corbits",
    url: "https://facilitator.corbits.dev",
  },
};

/**
 * Get facilitator name from URL
 * @param facilitatorUrl - The facilitator URL
 * @returns Facilitator info with name and url
 */
export function getFacilitatorInfo(facilitatorUrl: string | undefined): FacilitatorInfo {
  if (!facilitatorUrl) {
    return {
      name: "Unknown",
      url: "Unknown",
    };
  }

  // Normalize URL (remove trailing slash)
  const normalizedUrl = facilitatorUrl.replace(/\/$/, "");

  // Check exact match
  if (FACILITATOR_MAP[normalizedUrl]) {
    return FACILITATOR_MAP[normalizedUrl];
  }

  // Check if URL contains any known facilitator domain
  for (const [key, info] of Object.entries(FACILITATOR_MAP)) {
    if (normalizedUrl.includes(key.replace(/^https?:\/\//, ""))) {
      return info;
    }
  }

  // Extract domain name as fallback
  try {
    const url = new URL(normalizedUrl);
    const hostname = url.hostname.replace(/^www\./, "");
    return {
      name: hostname,
      url: normalizedUrl,
    };
  } catch {
    return {
      name: normalizedUrl,
      url: normalizedUrl,
    };
  }
}

