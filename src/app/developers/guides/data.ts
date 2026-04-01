export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: "ai" | "portfolio" | "getting-started";
  content: string;
}

export const GUIDES: Guide[] = [
  // {
  //   slug: "chatgpt-integration",
  //   title: "Using Movement API with ChatGPT",
  //   description:
  //     "Import the Movement OpenAPI spec into a Custom GPT to query blockchain data with natural language.",
  //   category: "ai",
  //   content: `...`,
  // },
  // {
  //   slug: "claude-mcp",
  //   title: "Using Movement API with Claude (MCP)",
  //   description:
  //     "Set up the Movement MCP Server so Claude can directly query on-chain data.",
  //   category: "ai",
  //   content: `...`,
  // },
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
