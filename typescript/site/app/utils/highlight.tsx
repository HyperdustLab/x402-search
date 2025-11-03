/**
 * Utility function to highlight search keywords in text
 */

import React from 'react';
import { extractHighlightKeywords } from './nlp-search';

/**
 * Highlight keywords in text (case-insensitive)
 * Uses NLP to extract meaningful keywords from natural language queries
 * @param text The text to highlight
 * @param query The search query (can be natural language)
 * @returns React element with highlighted keywords
 */
export function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) {
    return text;
  }

  // Use NLP to extract meaningful keywords (filters stop words)
  const keywords = extractHighlightKeywords(query);

  if (keywords.length === 0) {
    return text;
  }

  // Create a regex pattern that matches any of the keywords (case-insensitive)
  const pattern = new RegExp(
    `(${keywords.map((kw) => escapeRegex(kw)).join('|')})`,
    'gi'
  );

  // Split text by matches while preserving the matches
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;

  // Use matchAll for better handling (supported in modern browsers and Node.js)
  // Fallback to exec for older environments
  if (typeof text.matchAll === 'function') {
    const matches = Array.from(text.matchAll(pattern));
    
    for (const match of matches) {
      if (match.index === undefined) continue;
      
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add highlighted match
      parts.push(
        <mark
          key={`highlight-${lastIndex}-${match.index}`}
          className="bg-yellow-200 text-black font-medium px-0.5 rounded"
        >
          {match[0]}
        </mark>
      );

      lastIndex = match.index + match[0].length;
    }
  } else {
    // Fallback for older environments
    const regex = new RegExp(pattern);
    let match;
    let matchIndex = 0;
    
    while ((match = regex.exec(text)) !== null) {
      // Prevent infinite loops
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add highlighted match
      parts.push(
        <mark
          key={`highlight-${matchIndex}-${match.index}`}
          className="bg-yellow-200 text-black font-medium px-0.5 rounded"
        >
          {match[0]}
        </mark>
      );

      lastIndex = regex.lastIndex;
      matchIndex++;
      
      // Safety check to prevent infinite loops
      if (matchIndex > 1000) break;
    }
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no matches found, return original text
  if (parts.length === 0 || (parts.length === 1 && typeof parts[0] === 'string' && parts[0] === text)) {
    return text;
  }

  return <>{parts}</>;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

