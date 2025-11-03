/**
 * Crawl GitHub to find x402 endpoints
 * Searches repos, extracts URLs from README, code, etc.
 */

import { extractUrlsFromText } from "../utils/url-extractor";

interface RateLimitInfo {
  remaining: number;
  limit: number;
  reset: number;
}

/**
 * Extract rate limit information from GitHub API response headers
 */
function getRateLimitInfo(response: Response): RateLimitInfo | null {
  const remaining = response.headers.get("x-ratelimit-remaining");
  const limit = response.headers.get("x-ratelimit-limit");
  const reset = response.headers.get("x-ratelimit-reset");

  if (remaining && limit && reset) {
    return {
      remaining: parseInt(remaining, 10),
      limit: parseInt(limit, 10),
      reset: parseInt(reset, 10) * 1000, // Convert to milliseconds
    };
  }
  return null;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function crawlGitHub(): Promise<string[]> {
  const urls: string[] = [];
  const GITHUB_API_BASE = "https://api.github.com";
  const processedRepos = new Set<string>(); // Track processed repositories
  let totalReposFound = 0; // Total repos found across all searches
  let totalReposProcessed = 0; // Total unique repos processed

  // GitHub token for rate limiting (optional but recommended)
  const token = process.env.GITHUB_TOKEN;
  const hasToken = !!token;
  
  // Adjust limits based on token availability
  // With token: 30 requests/minute, 5000/hour
  // Without token: 10 requests/minute, 5000/hour
  const REPOS_PER_QUERY = hasToken ? 50 : 10; // Process more repos if we have token
  const MAX_CONCURRENT_READMES = hasToken ? 5 : 2; // Concurrent README fetches
  const REQUEST_DELAY_MS = hasToken ? 500 : 1000; // Delay between requests (milliseconds)

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`; // Use Bearer token format (GitHub recommends)
  }

  console.log(`[GitHub] Starting crawl${hasToken ? ' (with token)' : ' (no token - limited rate)'}`);
  console.log(`[GitHub] Configuration: ${REPOS_PER_QUERY} repos per query, ${MAX_CONCURRENT_READMES} concurrent requests`);

  let currentRateLimit: RateLimitInfo | null = null;

  // Search for repos mentioning x402
  try {
    const searchQueries = [
      "x402",
      "x402 payment",
      "x402 protocol",
      "coinbase x402",
      "x402 endpoint",
      "x402 api",
    ];

    for (const query of searchQueries) {
      try {
        // Check rate limit before each search
        if (currentRateLimit && currentRateLimit.remaining < 2) {
          const waitTime = currentRateLimit.reset - Date.now() + 1000; // Add 1 second buffer
          if (waitTime > 0) {
            console.warn(`[GitHub] Rate limit nearly exhausted (${currentRateLimit.remaining} remaining). Waiting ${Math.ceil(waitTime / 1000)}s...`);
            await sleep(waitTime);
          }
        }

        // Search without language restriction to find more repos
        const searchUrl = `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=100`;
        const response = await fetch(searchUrl, {
          headers,
          signal: AbortSignal.timeout(15000),
        });

        // Update rate limit info
        const rateLimitInfo = getRateLimitInfo(response);
        if (rateLimitInfo) {
          currentRateLimit = rateLimitInfo;
          console.log(`[GitHub] Rate limit: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining`);
        }

        if (!response.ok) {
          if (response.status === 403) {
            const rateLimitInfo = getRateLimitInfo(response);
            if (rateLimitInfo) {
              const waitTime = rateLimitInfo.reset - Date.now() + 1000;
              console.warn(`[GitHub] Rate limit exceeded for "${query}". Waiting ${Math.ceil(waitTime / 1000)}s...`);
              await sleep(Math.max(0, waitTime));
              continue; // Retry on next iteration
            }
          }
          console.warn(`[GitHub] Search failed for "${query}": ${response.status}`);
          continue;
        }

        const data = await response.json();
        const reposInThisQuery = data.items?.length || 0;
        const totalResults = data.total_count || 0;
        
        console.log(`[GitHub] Query "${query}": Found ${totalResults} total repos, processing first ${Math.min(reposInThisQuery, REPOS_PER_QUERY)} repos`);
        totalReposFound += totalResults;

        // Process repositories in batches with concurrency control
        const reposToProcess = (data.items || []).slice(0, REPOS_PER_QUERY);
        
        for (let i = 0; i < reposToProcess.length; i += MAX_CONCURRENT_READMES) {
          const batch = reposToProcess.slice(i, i + MAX_CONCURRENT_READMES);
          
          // Process batch concurrently
          const batchPromises = batch.map(async (repo: any) => {
            // Skip if already processed
            if (processedRepos.has(repo.full_name)) {
              return [];
            }
            
            processedRepos.add(repo.full_name);
            totalReposProcessed++;

            console.log(`[GitHub] Processing repository ${totalReposProcessed}/${processedRepos.size}: ${repo.full_name} (${repo.stargazers_count || 0} stars)`);

            // Get README content
            try {
              // Check rate limit before each README fetch
              if (currentRateLimit && currentRateLimit.remaining < 2) {
                const waitTime = currentRateLimit.reset - Date.now() + 1000;
                if (waitTime > 0) {
                  await sleep(waitTime);
                }
              }

              const readmeUrl = `${GITHUB_API_BASE}/repos/${repo.full_name}/readme`;
              const readmeRes = await fetch(readmeUrl, {
                headers,
                signal: AbortSignal.timeout(8000),
              });

              // Update rate limit info
              const rateLimitInfo = getRateLimitInfo(readmeRes);
              if (rateLimitInfo) {
                currentRateLimit = rateLimitInfo;
              }

              if (readmeRes.ok) {
                const readmeData = await readmeRes.json();

                // Decode base64 content
                const content = Buffer.from(readmeData.content, "base64").toString(
                  "utf-8"
                );

                // Extract URLs from README
                const extractedUrls = extractUrlsFromText(content);
                
                if (extractedUrls.length > 0) {
                  console.log(`[GitHub]   → Found ${extractedUrls.length} URLs in ${repo.full_name}`);
                  // Show first few URLs as examples
                  extractedUrls.slice(0, 3).forEach((url: string, idx: number) => {
                    console.log(`[GitHub]     ${idx + 1}. ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
                  });
                  if (extractedUrls.length > 3) {
                    console.log(`[GitHub]     ... and ${extractedUrls.length - 3} more URLs`);
                  }
                }
                
                return extractedUrls;
              } else {
                if (readmeRes.status === 404) {
                  console.log(`[GitHub]   → No README found for ${repo.full_name}`);
                } else {
                  console.log(`[GitHub]   → README fetch failed for ${repo.full_name}: ${readmeRes.status}`);
                }
                return [];
              }
            } catch (error) {
              console.log(`[GitHub]   → Failed to fetch README for ${repo.full_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              return [];
            }
          });

          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach((extractedUrls) => {
            urls.push(...extractedUrls);
          });

          // Add delay between batches to respect rate limits
          if (i + MAX_CONCURRENT_READMES < reposToProcess.length) {
            await sleep(REQUEST_DELAY_MS);
          }
        }
      } catch (error) {
        console.warn(`GitHub search failed for "${query}":`, error);
        continue;
      }
    }

    // Output statistics
    console.log(`[GitHub Statistics]`);
    console.log(`  - Total repositories found across all queries: ${totalReposFound}`);
    console.log(`  - Unique repositories processed: ${totalReposProcessed}`);
    console.log(`  - URLs extracted: ${urls.length}`);
    console.log(`  - Unique URLs: ${[...new Set(urls)].length}`);
    if (currentRateLimit) {
      console.log(`  - Final rate limit: ${currentRateLimit.remaining}/${currentRateLimit.limit} remaining`);
    }
  } catch (error) {
    console.warn("GitHub crawl failed:", error);
  }

  return [...new Set(urls)];
}

