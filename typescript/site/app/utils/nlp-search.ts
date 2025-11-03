/**
 * Natural Language Processing utilities for intelligent search
 * Extracts meaningful keywords from natural language queries
 */

// Common English stop words (articles, prepositions, conjunctions, pronouns, etc.)
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'i', 'you', 'we', 'they', 'what',
  'where', 'when', 'why', 'how', 'can', 'could', 'should', 'would',
  'may', 'might', 'must', 'shall', 'this', 'that', 'these', 'those',
  'do', 'does', 'did', 'have', 'has', 'had', 'get', 'got', 'want',
  'know', 'think', 'see', 'look', 'find', 'need', 'use', 'make',
  'take', 'give', 'go', 'come', 'say', 'tell', 'ask', 'show'
]);

// Word variations and synonyms map
// Maps query words to their base forms and related terms
const WORD_VARIANTS: Record<string, string[]> = {
  // Price/cost variations
  'price': ['price', 'pricing', 'cost', 'costing', 'costs', 'fee', 'fees', 'amount', 'charge'],
  'prices': ['price', 'pricing', 'cost', 'costing', 'costs'],
  'cost': ['price', 'pricing', 'cost', 'costing', 'costs', 'fee', 'fees'],
  'costing': ['price', 'pricing', 'cost', 'costing'],
  'costs': ['price', 'pricing', 'cost', 'costing', 'costs'],
  
  // Token variations
  'token': ['token', 'tokens', 'coin', 'coins', 'currency', 'crypto'],
  'tokens': ['token', 'tokens', 'coin', 'coins'],
  
  // Data variations
  'data': ['data', 'dataset', 'information', 'info'],
  'information': ['data', 'dataset', 'information', 'info'],
  'info': ['data', 'dataset', 'information', 'info'],
  
  // Wallet variations
  'wallet': ['wallet', 'wallets', 'account', 'accounts'],
  'wallets': ['wallet', 'wallets', 'account', 'accounts'],
  
  // API variations
  'api': ['api', 'apis', 'endpoint', 'endpoints', 'service', 'services'],
  'endpoint': ['api', 'apis', 'endpoint', 'endpoints', 'service', 'services'],
  'service': ['api', 'apis', 'endpoint', 'endpoints', 'service', 'services'],
  
  // Analysis variations
  'analysis': ['analysis', 'analyze', 'analyzing', 'analytics'],
  'analyze': ['analysis', 'analyze', 'analyzing', 'analytics'],
  'analytics': ['analysis', 'analyze', 'analyzing', 'analytics'],
  
  // Fetch/get variations
  'fetch': ['fetch', 'get', 'retrieve', 'obtain', 'download'],
  'get': ['fetch', 'get', 'retrieve', 'obtain', 'download'],
  'retrieve': ['fetch', 'get', 'retrieve', 'obtain'],
};

/**
 * Extract base form of a word (simple stemming)
 */
function getBaseForm(word: string): string {
  const lowerWord = word.toLowerCase();
  
  // Check word variants map first
  if (WORD_VARIANTS[lowerWord]) {
    return WORD_VARIANTS[lowerWord][0];
  }
  
  // Simple plural to singular conversion
  if (lowerWord.endsWith('ies')) {
    return lowerWord.slice(0, -3) + 'y';
  }
  if (lowerWord.endsWith('es') && lowerWord.length > 3) {
    return lowerWord.slice(0, -2);
  }
  if (lowerWord.endsWith('s') && lowerWord.length > 2) {
    return lowerWord.slice(0, -1);
  }
  
  // Simple -ing, -ed removal
  if (lowerWord.endsWith('ing') && lowerWord.length > 4) {
    return lowerWord.slice(0, -3);
  }
  if (lowerWord.endsWith('ed') && lowerWord.length > 3) {
    return lowerWord.slice(0, -2);
  }
  
  return lowerWord;
}

/**
 * Get word variants for fuzzy matching
 */
function getWordVariants(word: string): string[] {
  const lowerWord = word.toLowerCase();
  const baseForm = getBaseForm(lowerWord);
  
  // Get variants from map
  const variants = WORD_VARIANTS[baseForm] || WORD_VARIANTS[lowerWord] || [baseForm];
  
  // Add base form if not already included
  if (!variants.includes(baseForm)) {
    variants.push(baseForm);
  }
  
  return variants;
}

/**
 * Extract meaningful keywords from natural language query
 * Filters stop words, extracts base forms, and finds semantic variants
 */
export function extractSearchKeywords(query: string): string[] {
  if (!query || !query.trim()) {
    return [];
  }

  // Normalize and split query into words
  const words = query
    .toLowerCase()
    .trim()
    // Remove punctuation but keep important separators
    .replace(/[.,;:!?'"]/g, ' ')
    // Split by whitespace and hyphens
    .split(/[\s\-_]+/)
    // Remove empty strings
    .filter(w => w.length > 0);

  // Extract meaningful keywords
  const keywords: Set<string> = new Set();
  
  for (const word of words) {
    // Skip stop words
    if (STOP_WORDS.has(word)) {
      continue;
    }
    
    // Skip very short words (less than 2 characters)
    if (word.length < 2) {
      continue;
    }
    
    // Get base form and variants
    const baseForm = getBaseForm(word);
    const variants = getWordVariants(baseForm);
    
    // Add all variants to keywords set
    variants.forEach(v => {
      if (v.length >= 2 && !STOP_WORDS.has(v)) {
        keywords.add(v);
      }
    });
  }

  return Array.from(keywords);
}

/**
 * Check if text matches any of the search keywords
 * Uses fuzzy matching with word variants
 */
export function matchesSearchKeywords(text: string, keywords: string[]): boolean {
  if (!text || keywords.length === 0) {
    return false;
  }

  const textLower = text.toLowerCase();
  
  // Check if all keywords (or their variants) appear in the text
  return keywords.every(keyword => {
    const variants = getWordVariants(keyword);
    return variants.some(variant => textLower.includes(variant));
  });
}

/**
 * Calculate relevance score for a text based on keyword matches
 * Higher score means more relevant
 */
export function calculateRelevanceScore(text: string, keywords: string[]): number {
  if (!text || keywords.length === 0) {
    return 0;
  }

  const textLower = text.toLowerCase();
  let score = 0;
  let matchedKeywords = 0;

  for (const keyword of keywords) {
    const variants = getWordVariants(keyword);
    
    // Check for exact match (highest score)
    if (textLower.includes(keyword)) {
      score += 10;
      matchedKeywords++;
    } 
    // Check for variant match
    else {
      for (const variant of variants) {
        if (variant !== keyword && textLower.includes(variant)) {
          score += 5;
          matchedKeywords++;
          break;
        }
      }
    }
    
    // Bonus for keyword appearing in URL path (more specific)
    if (textLower.includes(`/${keyword}/`) || textLower.includes(`/${keyword}`)) {
      score += 5;
    }
  }

  // Normalize score by number of keywords
  if (keywords.length > 0) {
    const matchRatio = matchedKeywords / keywords.length;
    score = score * matchRatio;
  }

  return score;
}

/**
 * Extract keywords for highlighting (used in UI)
 * Returns keywords that should be highlighted, filtering stop words
 */
export function extractHighlightKeywords(query: string): string[] {
  if (!query || !query.trim()) {
    return [];
  }

  const words = query
    .toLowerCase()
    .trim()
    .replace(/[.,;:!?'"]/g, ' ')
    .split(/[\s\-_]+/)
    .filter(w => w.length > 0);

  const keywords: string[] = [];
  
  for (const word of words) {
    // Skip stop words for highlighting
    if (STOP_WORDS.has(word)) {
      continue;
    }
    
    // Only highlight meaningful words (2+ characters)
    if (word.length >= 2) {
      const baseForm = getBaseForm(word);
      keywords.push(baseForm);
    }
  }

  // Return unique keywords
  return Array.from(new Set(keywords));
}

