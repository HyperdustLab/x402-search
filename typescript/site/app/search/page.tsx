'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MagnifyingGlassIcon, CodeBracketIcon, PlusIcon } from '@heroicons/react/24/outline';
import NavBar from '../components/NavBar';
import { SearchResult } from '../components/SearchResult';
import { SubmitEndpointModal } from '../components/SubmitEndpointModal';
import { SyncFacilitatorsButton } from '../components/SyncFacilitatorsButton';

interface SearchResponse {
  query: string;
  results: Array<{
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
  }>;
  total: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters: {
    type?: string;
    network?: string;
  };
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Auto-search if query param exists on mount
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam && queryParam.trim()) {
      performSearch(queryParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=20`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setSearchData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSearchData(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Update URL with search query
    const params = new URLSearchParams();
    params.set('q', searchQuery);
    router.push(`/search?${params.toString()}`);

    await performSearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <NavBar />
      
      {/* Search Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-4xl mx-auto px-6">
          {/* Logo/Title */}
          <div className="text-center mb-12">
            <Image
              src="/x402-icon-black.png"
              alt="x402"
              width={64}
              height={64}
              className="mx-auto mb-4"
            />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              x402 Search
            </h1>
            <p className="text-gray-600 text-lg">
              Search for x402-enabled endpoints and services
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search endpoints, APIs, or services..."
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                autoFocus
              />
            </div>
            <div className="flex flex-wrap gap-4 justify-center mt-6">
              <button
                type="submit"
                disabled={isSearching}
                className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-8 py-3 border-2 border-black rounded-lg hover:bg-black hover:text-white transition-all flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Submit Endpoint
              </button>
              <Link
                href="/protected"
                className="px-8 py-3 border-2 border-black rounded-lg hover:bg-black hover:text-white transition-all flex items-center gap-2"
              >
                <CodeBracketIcon className="w-5 h-5" />
                Try Demo
              </Link>
              <SyncFacilitatorsButton />
            </div>
          </form>

          {/* Search Results */}
          {searchQuery && (
            <div className="mt-12">
              {isSearching ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-black mr-2"></div>
                  Searching...
                </div>
              ) : error ? (
                <div className="text-center text-red-600 py-8">
                  <p>Error: {error}</p>
                </div>
              ) : searchData ? (
                <>
                  {searchData.total > 0 ? (
                    <>
                      <div className="mb-4 text-sm text-gray-600">
                        Found {searchData.total} result{searchData.total !== 1 ? 's' : ''} for "{searchQuery}"
                      </div>
                      <div className="space-y-4">
                        {searchData.results.map((result, index) => (
                          <SearchResult key={index} result={result} searchQuery={searchQuery} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p>No results found for "{searchQuery}"</p>
                      <p className="text-sm mt-2">Try different keywords or check your spelling.</p>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* Placeholder when no search */}
          {!searchQuery && (
            <div className="mt-12 text-center text-gray-500">
              <p>Enter a search query to find x402-enabled endpoints</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>Search for x402 payment-enabled endpoints and services</p>
        </div>
      </footer>

      {/* Submit Endpoint Modal */}
      <SubmitEndpointModal
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          // Refresh search results if we have a query
          if (searchQuery.trim() && searchData) {
            performSearch(searchQuery);
          }
        }}
      />
    </div>
  );
}

