export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: "ai" | "portfolio" | "getting-started";
  content: string;
}

export const GUIDES: Guide[] = [
  {
    slug: "chatgpt-integration",
    title: "Using Movement API with ChatGPT",
    description:
      "Import the Movement OpenAPI spec into a Custom GPT to query blockchain data with natural language.",
    category: "ai",
    content: `
## Using Movement API with ChatGPT

You can create a Custom GPT that queries Movement blockchain data using natural language.

### Step 1: Download the OpenAPI Spec

Download the Movement API specification:

\`\`\`
https://mainnet.movementnetwork.xyz/v1/spec.yaml
\`\`\`

### Step 2: Create a Custom GPT

1. Go to [ChatGPT](https://chat.openai.com) → Explore GPTs → Create
2. In the **Configure** tab, add a name like "Movement Blockchain Assistant"
3. Under **Actions**, click "Create new action"
4. Click "Import from URL" and paste the spec URL above
5. Save your GPT

### Step 3: Start Querying

Now you can ask questions like:
- "What's the balance of address 0x1?"
- "Show me the latest transactions"
- "What's the current ledger version?"

The GPT will automatically call the correct Movement API endpoints.
    `,
  },
  {
    slug: "claude-mcp",
    title: "Using Movement API with Claude (MCP)",
    description:
      "Set up the Movement MCP Server so Claude can directly query on-chain data.",
    category: "ai",
    content: `
## Using Movement API with Claude via MCP

The Movement MCP Server lets Claude Desktop query blockchain data directly.

> **Note:** The MCP Server package (\`@movement/chain-mcp-server\`) is coming soon. This guide will be updated with installation instructions when it's available.

### What You'll Be Able to Do

Once the MCP Server is available, you can ask Claude:
- "What tokens does 0x1 hold?"
- "Show me transaction details for hash 0x..."
- "What's the current network TPS?"

### Current Alternative

In the meantime, you can use the Movement API directly. Here's how to provide context to Claude:

1. Copy the API base URL: \`https://mainnet.movementnetwork.xyz/v1\`
2. Tell Claude about the available endpoints
3. Ask Claude to generate fetch/curl commands for your queries

### API Endpoints for Common Queries

| Query | Endpoint |
|-------|----------|
| Account info | \`GET /accounts/{address}\` |
| Token balance | \`GET /accounts/{address}/resources\` |
| Transaction | \`GET /transactions/by_hash/{hash}\` |
| Latest block | \`GET /blocks/by_height/{height}\` |
| Network info | \`GET /info\` |
    `,
  },
  {
    slug: "portfolio-integration",
    title: "Portfolio Manager Integration",
    description:
      "Query token balances, holdings, and transaction history for portfolio tracking tools.",
    category: "portfolio",
    content: `
## Portfolio Manager Integration

Use the Movement API to build portfolio tracking for Movement addresses.

### Querying Token Balances

To get all tokens held by an address:

\`\`\`bash
curl https://mainnet.movementnetwork.xyz/v1/accounts/{address}/resources
\`\`\`

Filter the response for \`0x1::coin::CoinStore\` resources to find token balances.

### Querying Transaction History

Get recent transactions for an address:

\`\`\`bash
curl https://mainnet.movementnetwork.xyz/v1/accounts/{address}/transactions
\`\`\`

### Getting Token Prices

For USD-denominated portfolio values, combine on-chain balance data with price feeds from CoinGecko or similar services.

### Example: Portfolio Summary

\`\`\`javascript
async function getPortfolio(address) {
  const res = await fetch(
    \`https://mainnet.movementnetwork.xyz/v1/accounts/\${address}/resources\`
  );
  const resources = await res.json();

  const coinStores = resources.filter((r) =>
    r.type.includes("0x1::coin::CoinStore")
  );

  return coinStores.map((store) => ({
    token: store.type.split("<")[1].split(">")[0],
    balance: store.data.coin.value,
  }));
}
\`\`\`

> **Coming Soon:** Dedicated Portfolio API endpoints with pre-aggregated data and USD pricing.
    `,
  },
  {
    slug: "defi-data",
    title: "DeFi Data Queries",
    description:
      "Query LP positions, staking info, and DeFi protocol data from Movement.",
    category: "portfolio",
    content: `
## DeFi Data Queries

Query DeFi protocol data on the Movement blockchain.

### Staking Information

Query validator staking data:

\`\`\`bash
curl https://mainnet.movementnetwork.xyz/v1/accounts/{address}/resource/0x1::stake::StakePool
\`\`\`

### View Functions

Use the view function endpoint to call read-only Move functions:

\`\`\`bash
curl -X POST https://mainnet.movementnetwork.xyz/v1/view \\
  -H "Content-Type: application/json" \\
  -d '{
    "function": "0x1::coin::balance",
    "type_arguments": ["0x1::aptos_coin::AptosCoin"],
    "arguments": ["0x1"]
  }'
\`\`\`

### LP Position Queries

LP positions are protocol-specific. Query the relevant protocol's module resources:

\`\`\`javascript
async function getLPPositions(address, protocolAddress) {
  const res = await fetch(
    \`https://mainnet.movementnetwork.xyz/v1/accounts/\${address}/resources\`
  );
  const resources = await res.json();

  return resources.filter((r) =>
    r.type.startsWith(protocolAddress)
  );
}
\`\`\`

> **Coming Soon:** Aggregated DeFi position endpoints with protocol-specific decoders.
    `,
  },
];
