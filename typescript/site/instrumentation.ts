/**
 * Next.js instrumentation hook
 * This file runs once when the server starts
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import and start the crawler service
    const { startCrawlerService } = await import('./app/api/discovery/crawler-service');
    
    console.log('[Instrumentation] Initializing crawler service...');
    startCrawlerService();
    console.log('[Instrumentation] Crawler service initialized');
  }
}


