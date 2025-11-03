import { DiscoveredResource } from "x402/types";
import { highlightText } from "../utils/highlight";

interface SearchResultItem {
  resource: string;
  type: string;
  x402Version: number;
  description?: string;
  price?: {
    amount: string;
    asset: string;
    network: string;
  } | null;
  network?: string;
  payTo?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
  lastUpdated: string | number;
  accepts?: unknown[];
  isTest?: boolean;
  facilitator?: {
    name: string;
    url: string;
  } | null;
  source?: string; // 'crawler' | 'facilitator' | 'direct-discovery'
}

interface SearchResultProps {
  result: SearchResultItem;
  searchQuery?: string; // Optional search query for highlighting
}

export function SearchResult({ result, searchQuery }: SearchResultProps) {
  const formatPrice = (price: { amount: string; asset: string; network: string } | null | undefined) => {
    if (!price) return null;
    
    // Convert from wei/wei-like units to human-readable
    // This is a simplified version - you may want to use a library like viem for proper conversion
    try {
      const amountInWei = BigInt(price.amount);
      const amountInUsd = Number(amountInWei) / 1e6; // Assuming 6 decimals for USDC
      return `$${(amountInUsd / 1000000).toFixed(6)}`;
    } catch {
      return price.amount;
    }
  };

  const formatDate = (date: string | number) => {
    try {
      if (typeof date === "number") {
        return new Date(date * 1000).toLocaleDateString();
      }
      return new Date(date).toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="border-b border-gray-200 pb-6 last:border-b-0 hover:bg-gray-50 transition-colors rounded-lg p-4 -mx-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-xl font-semibold flex-1">
          <a
            href={result.resource}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {searchQuery ? highlightText(result.resource, searchQuery) : result.resource}
          </a>
        </h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          {result.source && (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
              result.source === 'facilitator' 
                ? 'bg-blue-50 text-blue-700 border-blue-300' 
                : result.source === 'crawler'
                ? 'bg-green-50 text-green-700 border-green-300'
                : 'bg-purple-50 text-purple-700 border-purple-300'
            }`}>
              {result.source === 'facilitator' && result.facilitator 
                ? `Source: ${result.facilitator.name}`
                : result.source === 'crawler'
                ? 'Source: Direct Discovery'
                : `Source: ${result.source}`
              }
            </span>
          )}
          {result.isTest && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
              Test
            </span>
          )}
        </div>
      </div>
      
      {result.description && (
        <p className="text-gray-700 mb-3 line-clamp-2">
          {searchQuery ? highlightText(result.description, searchQuery) : result.description}
        </p>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        {result.price && (
          <span className="font-medium text-black">
            Price: {formatPrice(result.price)} {result.price.network && `(${result.price.network})`}
          </span>
        )}
        {result.network && (
          <span>Network: <span className="font-mono">{result.network}</span></span>
        )}
        {result.type && (
          <span>Type: <span className="font-mono">{result.type}</span></span>
        )}
        {result.mimeType && (
          <span>Format: <span className="font-mono">{result.mimeType}</span></span>
        )}
        <span>Updated: {formatDate(result.lastUpdated)}</span>
      </div>

      {result.metadata && Object.keys(result.metadata).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              View metadata
            </summary>
            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
              {JSON.stringify(result.metadata, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

