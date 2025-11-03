/**
 * Test data for search functionality
 * This can be used when facilitator discovery API returns no data
 */

import type { DiscoveredResource } from "x402/types";

export const testDiscoveryResources: DiscoveredResource[] = [
  {
    resource: "https://api.example.com/premium-data",
    type: "http",
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: "base-sepolia",
        maxAmountRequired: "10000",
        resource: "https://api.example.com/premium-data",
        description: "Access to premium market data and financial analytics",
        mimeType: "application/json",
        payTo: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
        maxTimeoutSeconds: 60,
        asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        extra: {
          name: "USDC",
          version: "2",
        },
      },
    ],
    lastUpdated: Date.now(),
    metadata: {
      category: "finance",
      provider: "Example Corp",
      tags: ["market-data", "analytics", "finance"],
    },
  },
  {
    resource: "https://api.weather-service.com/forecast",
    type: "http",
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: "base",
        maxAmountRequired: "5000",
        resource: "https://api.weather-service.com/forecast",
        description: "7-day weather forecast API with detailed meteorological data",
        mimeType: "application/json",
        payTo: "0x1234567890123456789012345678901234567890",
        maxTimeoutSeconds: 30,
        asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        extra: {
          name: "USDC",
          version: "2",
        },
      },
    ],
    lastUpdated: Date.now() - 86400000, // 1 day ago
    metadata: {
      category: "weather",
      provider: "Weather Service Inc",
      tags: ["weather", "forecast", "meteorology"],
    },
  },
  {
    resource: "https://api.stock-data.io/quote",
    type: "http",
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: "base-sepolia",
        maxAmountRequired: "20000",
        resource: "https://api.stock-data.io/quote",
        description: "Real-time stock quotes and market data",
        mimeType: "application/json",
        payTo: "0x9876543210987654321098765432109876543210",
        maxTimeoutSeconds: 60,
        asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        extra: {
          name: "USDC",
          version: "2",
        },
      },
    ],
    lastUpdated: Date.now() - 3600000, // 1 hour ago
    metadata: {
      category: "finance",
      provider: "Stock Data LLC",
      tags: ["stocks", "trading", "market-data"],
    },
  },
  {
    resource: "https://api.ai-text-service.com/generate",
    type: "http",
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: "base",
        maxAmountRequired: "15000",
        resource: "https://api.ai-text-service.com/generate",
        description: "AI-powered text generation API using GPT models",
        mimeType: "application/json",
        payTo: "0x1111111111111111111111111111111111111111",
        maxTimeoutSeconds: 120,
        asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        extra: {
          name: "USDC",
          version: "2",
        },
      },
    ],
    lastUpdated: Date.now() - 7200000, // 2 hours ago
    metadata: {
      category: "ai",
      provider: "AI Services Co",
      tags: ["ai", "text-generation", "gpt", "nlp"],
    },
  },
  {
    resource: "https://api.image-processing.com/transform",
    type: "http",
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: "base-sepolia",
        maxAmountRequired: "8000",
        resource: "https://api.image-processing.com/transform",
        description: "Image processing and transformation API with filters and effects",
        mimeType: "image/jpeg",
        payTo: "0x2222222222222222222222222222222222222222",
        maxTimeoutSeconds: 45,
        asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        extra: {
          name: "USDC",
          version: "2",
        },
      },
    ],
    lastUpdated: Date.now() - 1800000, // 30 minutes ago
    metadata: {
      category: "media",
      provider: "Image Processing Ltd",
      tags: ["image", "processing", "transform", "filters"],
    },
  },
  {
    resource: "https://api.translation-service.com/translate",
    type: "http",
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: "base",
        maxAmountRequired: "3000",
        resource: "https://api.translation-service.com/translate",
        description: "Multi-language translation API supporting 100+ languages",
        mimeType: "application/json",
        payTo: "0x3333333333333333333333333333333333333333",
        maxTimeoutSeconds: 30,
        asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        extra: {
          name: "USDC",
          version: "2",
        },
      },
    ],
    lastUpdated: Date.now() - 10800000, // 3 hours ago
    metadata: {
      category: "language",
      provider: "Translation Pro",
      tags: ["translation", "language", "nlp"],
    },
  },
];

