/**
 * Crawl ecosystem partner websites to find endpoints
 */

import fs from "fs";
import path from "path";
import { extractUrlsFromText } from "../utils/url-extractor";

export async function crawlEcosystem(): Promise<string[]> {
  const urls: string[] = [];
  const partnersDirectory = path.join(
    process.cwd(),
    "app/ecosystem/partners-data"
  );

  try {
    const partnerFolders = fs
      .readdirSync(partnersDirectory)
      .filter((file) =>
        fs.statSync(path.join(partnersDirectory, file)).isDirectory()
      );

    const totalPartners = Math.min(partnerFolders.length, 50);
    console.log(`[Ecosystem] Found ${partnerFolders.length} partner directories, processing ${totalPartners}`);

    for (let idx = 0; idx < totalPartners; idx++) {
      const folder = partnerFolders[idx];
      // Limit to avoid too many requests
      const metadataPath = path.join(
        partnersDirectory,
        folder,
        "metadata.json"
      );
      try {
        const metadata = JSON.parse(
          fs.readFileSync(metadataPath, "utf8")
        );

        const partnerName = metadata.name || folder;
        console.log(`[Ecosystem] Processing partner ${idx + 1}/${totalPartners}: ${partnerName}`);

        if (metadata.websiteUrl) {
          console.log(`[Ecosystem]   → Crawling: ${metadata.websiteUrl}`);
          // Crawl the partner website
          try {
            const response = await fetch(metadata.websiteUrl, {
              headers: { "User-Agent": "x402-crawler/1.0" },
              signal: AbortSignal.timeout(5000),
            });

            if (response.ok) {
              const html = await response.text();

              // Extract URLs from HTML
              const extractedUrls = extractUrlsFromText(html);
              urls.push(...extractedUrls);
              
              if (extractedUrls.length > 0) {
                console.log(`[Ecosystem]   → Found ${extractedUrls.length} URLs from ${partnerName}`);
                // Show first few URLs as examples
                extractedUrls.slice(0, 3).forEach((url, urlIdx) => {
                  console.log(`[Ecosystem]     ${urlIdx + 1}. ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
                });
                if (extractedUrls.length > 3) {
                  console.log(`[Ecosystem]     ... and ${extractedUrls.length - 3} more URLs`);
                }
              } else {
                console.log(`[Ecosystem]   → No URLs extracted from ${partnerName}`);
              }
            } else {
              console.log(`[Ecosystem]   → Failed to fetch ${metadata.websiteUrl}: HTTP ${response.status}`);
            }
          } catch (error) {
            console.log(`[Ecosystem]   → Error crawling ${metadata.websiteUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Skip if website crawl fails
            continue;
          }
        } else {
          console.log(`[Ecosystem]   → No website URL for ${partnerName}`);
        }
      } catch (error) {
        console.log(`[Ecosystem]   → Failed to read metadata for ${folder}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    }
    
    console.log(`[Ecosystem] Completed: Processed ${totalPartners} partners, extracted ${urls.length} URLs total`);
  } catch (error) {
    console.warn("Ecosystem crawl failed:", error);
  }

  return [...new Set(urls)];
}

