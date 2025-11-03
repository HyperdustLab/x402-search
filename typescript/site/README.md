# x402 Search & Discovery

> **⚠️ Project Notice**: This is the [HyperdustLab/x402-search](https://github.com/HyperdustLab/x402-search) project - a community-built extension of the official x402 Demo Site, **not** the official x402 implementation.
> 
> - **Official x402 Protocol**: [Coinbase/x402](https://github.com/coinbase/x402)
> - **Official Website**: [x402.org](https://x402.org)
> - **This Project Repository**: [HyperdustLab/x402-search](https://github.com/HyperdustLab/x402-search)
> 
> This project extends the official Demo Site with advanced search and discovery features. For a complete list of features and roadmap, see **[FEATURES_AND_ROADMAP.md](./FEATURES_AND_ROADMAP.md)**.

This is a [Next.js](https://nextjs.org) project that demonstrates the x402 payment protocol in action and showcases ecosystem builders. The demo site includes a modern UI and a facilitator backend that handles payment verification and settlement.

## Overview

x402 is an open protocol for internet-native payments built around the HTTP 402 status code. This demo site showcases how to implement x402 in a real-world application, demonstrating:

- Payment-gated content access
- Real-time payment verification
- Payment settlement
- Integration with EVM-compatible blockchains

## Features

- **Payment Middleware**: Protect routes with a simple middleware configuration
- **Facilitator Backend**: Handle payment verification and settlement
- **Live Demo**: Try out the payment flow with a protected route
- **Intelligent Search**: Natural language search with NLP-powered keyword extraction
- **Auto Discovery**: Automated crawler system for discovering x402 endpoints
- **Resource Aggregation**: Collects resources from multiple facilitators and crawlers
- **User Submission**: Allow users to submit new x402 endpoints

> 📖 **See [FEATURES_AND_ROADMAP.md](./FEATURES_AND_ROADMAP.md) for complete feature documentation, implementation details, and future development plans.**

## Getting Started

### Prerequisites

- Node.js 20+
- A wallet with testnet USDC (for testing)

### Installation

1. Install dependencies:

  ```bash
  pnpm install
  ```

2. Configure your environment variables in `.env.local`:

  ```bash
  # CDP API Credentials (required for session token endpoint)
  # Get from: https://portal.cdp.coinbase.com/projects/api-keys
  # Create a Secret API Key (not Client API Key)
  CDP_API_KEY_ID=your_cdp_api_key_id_here
  CDP_API_KEY_SECRET=your_cdp_api_key_secret_here

  # OnchainKit API Key (required for middleware)
  # Get from: https://onchainkit.xyz
  NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key_here

  # x402 Payment Configuration
  NEXT_PUBLIC_FACILITATOR_URL=https://x402.org/facilitator
  RESOURCE_WALLET_ADDRESS=your_wallet_address
  NETWORK=base-sepolia
  PRIVATE_KEY=your_private_key

  # Optional: For Solana support
  SOLANA_ADDRESS=your_solana_address_here
  ```

### Getting API Keys

1. **CDP API Keys** (Required for session token endpoint):
   - Go to [CDP Portal](https://portal.cdp.coinbase.com/)
   - Navigate to your project's [API Keys](https://portal.cdp.coinbase.com/projects/api-keys)
   - Click **Create API key**
   - Select **Secret API Key** (not Client API Key)
   - Download and securely store your `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET`

2. **OnchainKit API Key** (Required for middleware):
   - Get from [OnchainKit](https://onchainkit.xyz)
   - This is used for client-side wallet integration

3. **Enable Onramp Secure Initialization** (Optional but recommended):
   - Go to [CDP Portal](https://portal.cdp.coinbase.com/)
   - Navigate to **Payments → [Onramp & Offramp](https://portal.cdp.coinbase.com/products/onramp)**
   - Toggle **"Enforce secure initialization"** to **Enabled**

**Note**: Without CDP API credentials, the session token endpoint will return an error. The "Get more USDC" button in the paywall will not work without these credentials.

### Running the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/app` - Next.js application code
  - `/facilitator` - Payment facilitator API routes
  - `/protected` - Example protected route
- `/middleware.ts` - x402 payment middleware configuration
- `/ecosystem` - Directory of ecosystem builders 

## How It Works

1. When a user tries to access a protected route, the middleware checks for a valid payment
2. If no payment is found, the server responds with HTTP 402
3. The client can then make a payment and retry the request
4. The facilitator backend verifies the payment and allows access

## Adding Your Project to the Ecosystem

We welcome projects that are building with x402! To add your project to our ecosystem page, follow these steps:

1. Fork the repository
2. Create a new directory in `app/ecosystem/partners-data/[your-project-slug]`
3. Add your logo to `public/logos/`
4. Add your project's metadata in `metadata.json`:

```json
{
  "name": "Your Project Name",
  "description": "A brief description of your project and how it uses x402",
  "logoUrl": "/logos/your-logo.png",
  "websiteUrl": "https://your-project.com", // ideally pointing to somehwere to learn more about the x402 integration
  "category": "Client-Side Integrations" // Must match one of our categories: - `Client-Side Integrations`, `Services/Endpoints`, `Infrastructure & Tooling`, `Learning & Community Resources`
}
```

**For Facilitators, use this JSON template:**

```json
{
  "name": "Your Facilitator Name",
  "description": "A brief description of your facilitator service and supported networks",
  "logoUrl": "/logos/your-logo.png",
  "websiteUrl": "https://your-facilitator.com",
  "category": "Facilitators",
  "facilitator": {
    "baseUrl": "https://your-facilitator.com",
    "networks": ["base", "base-sepolia", "polygon", "solana"],
    "schemes": ["exact"],
    "assets": ["ERC20"],
    "supports": {
      "verify": true,
      "settle": true,
      "supported": true,
      "list": false
    }
  }
}
```


5. Submit a pull request

### Requirements by Category

#### Client-Side Integrations
- Must demonstrate a working integration with x402
- Should include a link to documentation, quickstart, or code examples
- Must be actively maintained

#### Services/Endpoints
- Must have a working mainnet integration
- Should include API documentation
- Should maintain 99% uptime

#### Infrastructure & Tooling
- Should include comprehensive documentation
- Should demonstrate clear value to the x402 ecosystem

#### Learning & Community Resources
- Must include a GitHub template or starter kit
- Should be shared on social media (Twitter/X, Discord, etc.)
- Must include clear setup instructions
- Should demonstrate a practical use case

#### Facilitators
- Must implement the x402 facilitator API specification
- Should support at least one payment scheme (e.g., "exact")
- Must provide working verify and/or settle endpoints
- Should maintain high uptime and reliability
- Must include comprehensive API documentation

### Review Process

1. Our team will review your submission within 5 business days
2. We may request additional information or changes
3. Once approved, your project will be added to the ecosystem page, and we'd love to do some co-marketing around your use case! 

## Documentation

- [Features & Roadmap](./FEATURES_AND_ROADMAP.md) - Current features and future plans
- [Crawler System](./app/api/discovery/CRAWLER_README.md) - Automated endpoint discovery
- [Direct Discovery API](./DIRECT_DISCOVERY.md) - Resource discovery documentation
- [Search Testing](./SEARCH_TESTING.md) - Search functionality testing guide

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [x402 Protocol Documentation](https://github.com/coinbase/x402) - learn about the x402 payment protocol
- [EVM Documentation](https://ethereum.org/en/developers/docs/) - learn about Ethereum Virtual Machine

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](https://github.com/coinbase/x402/blob/main/CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/coinbase/x402/blob/main/LICENSE) file for details.
