# Developer API Portal — Design Document

**Date:** 2026-03-23
**Status:** Approved
**Approach:** Embedded in Explorer (方案 A)

## Overview

Build a developer API portal into the Movement Explorer, providing interactive API documentation, API key management, LLM integration (MCP Server + built-in AI chat), and portfolio data APIs. Delivered in three versions.

## Requirements

### From Stakeholders (Wiz / Fynnix)

1. **Etherscan-level minimum** — full API docs, key management, usage stats
2. **LLM integration** — users can give their LLM an API key and ask natural language questions about on-chain data
3. **Portfolio manager support** — token balances, DeFi positions, transaction history APIs for portfolio tools

## Release Phases

| Version | Scope | Backend Required |
|---------|-------|------------------|
| **V1** | Interactive API docs + code snippets + LLM/Portfolio guides | No |
| **V2** | API Key management (CRUD + usage stats) | Yes — Next.js API Routes + Neon DB |
| **V3** | MCP Server + built-in AI chat + Portfolio data API | Yes — LLM API + aggregation layer |

---

## Navigation

Add "Developers" dropdown to existing `NAV_ITEMS`:

```
Blockchain ▾       Validators      Analytics      Developers ▾
├── Transactions                                  ├── API Docs
└── Blocks                                        ├── AI Assistant (V3)
                                                  └── API Keys (V2)
```

## Route Structure

```
/developers                  → Overview: quickstart + feature cards
/developers/api              → Interactive API docs (sidebar + endpoint list)
/developers/api/[endpoint]   → Single endpoint detail
/developers/guides           → LLM integration + Portfolio guides
/developers/guides/[slug]    → Individual guide
/developers/api-keys         → API Key management panel (V2)
/developers/ai               → Built-in AI chat (V3)
```

## Page Layout

Follows Analytics page pattern:
- **Desktop:** 250px sticky sidebar (endpoint category nav) + content area
- **Mobile:** Drawer sidebar + hamburger button
- **Scroll-spy:** Highlights current endpoint category on scroll

---

## V1 — Interactive API Documentation

### Data Source

Fetch OpenAPI spec from Movement node at build time:

```
https://mainnet.movementnetwork.xyz/v1/spec.yaml
```

Parse the spec to auto-generate endpoint pages. No manual endpoint maintenance.

### `/developers` Overview Page

Card layout with:
- **Quickstart** — 3 steps: pick network → send first request → view response
- **API Docs** — "Browse 27 endpoints" → link to `/developers/api`
- **Code Examples** — cURL / JS / Python quick samples
- **LLM Integration** — "Let AI query on-chain data" → link to guide
- **Portfolio Integration** — "Provide data for portfolio tools" → link to guide
- **API Keys** — "Coming Soon" badge (until V2)

### `/developers/api` Interactive Docs

**Sidebar** (grouped by OpenAPI tags):

```
General
  Get Ledger Info
  Check Node Health
  Show OpenAPI Explorer
Accounts
  Get Account
  Get Account Resources
  Get Account Modules
  ...
Transactions
  Get Transactions
  Submit Transaction
  ...
Blocks
Events
```

**Each endpoint displays:**
1. Method badge + path (e.g. `GET /accounts/{address}`)
2. Description from OpenAPI spec
3. Parameter form — auto-generated from schema, with input fields
4. "Send Request" button + network selector (reuses `NetworkSelect`)
5. Response viewer — syntax-highlighted JSON (reuses `CodeBlock`)
6. Code snippet tabs — cURL / JavaScript / Python / Go (dynamically generated from user params)

**Key interactions:**
- Requests sent client-side (browser fetch), no backend proxy
- Parameters auto-validated against OpenAPI schema
- Network switching reuses existing `NetworkSelect` component

### `/developers/guides` Guide Pages

Static MDX content. Initial guides:

| Guide | Content |
|-------|---------|
| Using with ChatGPT | Import OpenAPI spec into custom GPT |
| Using with Claude | MCP Server setup for Claude Desktop |
| Portfolio Manager Integration | Query balances, holdings, transaction history |
| DeFi Data Queries | LP positions, staking info |

### V1 Core Components

| Component | Responsibility |
|-----------|---------------|
| `DevelopersSidebar` | Sidebar nav + scroll-spy (reuse Analytics pattern) |
| `EndpointCard` | Full endpoint display |
| `ParameterForm` | Auto-generated parameter inputs from OpenAPI schema |
| `RequestRunner` | Send request + display response |
| `CodeSnippetTabs` | Multi-language code example switcher |
| `OpenApiProvider` | React Context managing parsed OpenAPI spec data |

---

## V2 — API Key Management

### Authentication

Wallet-based auth (no email/password):

```
Connect wallet → Click "Sign In" → Wallet signs message → Backend verifies → Returns JWT
```

- Reuses existing `WalletConnector` component
- JWT stored in localStorage, re-sign on expiry
- No additional registration flow

### API Routes

```
POST   /api/auth/nonce         → Generate random nonce for signing
POST   /api/auth/verify        → Verify wallet signature, return JWT
GET    /api/keys               → List user's API keys
POST   /api/keys               → Create new key
DELETE /api/keys/[id]          → Revoke key
GET    /api/keys/[id]/stats    → Get key usage statistics
```

### Database Schema (Neon PostgreSQL)

```sql
-- Users (wallet-based)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- API Keys (store hash, not plaintext)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,           -- e.g. "mvmt_a3b2..." for display
  label TEXT DEFAULT 'Untitled',      -- user-defined name
  permissions JSONB DEFAULT '{}',
  rate_limit INT DEFAULT 100,         -- requests per minute
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ
);

-- Usage tracking
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  status_code INT,
  response_time INT,                  -- milliseconds
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `/developers/api-keys` Page

Displays:
- List of user's API keys with prefix, label, creation date, rate limit
- Per-key actions: copy full key (on create only), view stats, revoke
- Usage overview: 30-day call volume chart + per-endpoint breakdown
- "Create New Key" button with label input and rate limit selection

### API Gateway Migration

Abstract key validation behind a provider interface:

```typescript
interface ApiGatewayProvider {
  validateKey(key: string): Promise<KeyInfo>
  createKey(userId: string, options: KeyOptions): Promise<Key>
  revokeKey(keyId: string): Promise<void>
  getUsage(keyId: string, range: DateRange): Promise<UsageStats>
}

// Implementations:
// internal.ts   ← V2 built-in (Next.js + Neon)
// zuplo.ts      ← Future migration to Zuplo
// kong.ts       ← Or Kong
```

Swap provider without changing frontend or API route signatures.

---

## V3 — MCP Server + AI Chat + Portfolio API

### MCP Server

Published as npm package: `@movement/chain-mcp-server`

**Tools provided:**

| Tool | Description |
|------|-------------|
| `get_account` | Query account info (balance, resources) |
| `get_account_tokens` | All tokens held by an address |
| `get_transaction` | Transaction details by hash |
| `search_transactions` | Search transactions by criteria |
| `get_block` | Block info by height |
| `get_token_price` | Token price data |
| `get_portfolio` | Full portfolio (tokens + LP + staking) |
| `get_defi_positions` | DeFi positions |
| `execute_view_function` | Call read-only Move functions |
| `get_network_stats` | Chain stats (TPS, gas, etc.) |

**User installation:**

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "movement": {
      "command": "npx",
      "args": ["@movement/chain-mcp-server"],
      "env": {
        "MOVEMENT_API_KEY": "mvmt_xxx",
        "MOVEMENT_NETWORK": "mainnet"
      }
    }
  }
}
```

### Built-in AI Chat

Floating chat widget (bottom-right corner) with:

**Architecture:**

```
Frontend (Chat Widget)
    │ POST /api/chat (SSE streaming)
    ▼
Next.js API Route (/api/chat)
    │ 1. Receive user message
    │ 2. Construct system prompt + tool definitions
    │ 3. Call LLM API (pluggable provider)
    │ 4. LLM returns tool_use → execute tool → call Movement API
    │ 5. Return result to LLM
    │ 6. Stream final answer back
    ▼
LLM Provider (pluggable)
```

**LLM Provider interface:**

```typescript
interface LLMProvider {
  chat(messages: Message[], tools: Tool[]): AsyncIterable<StreamChunk>
}

// providers/claude.ts   ← Anthropic Claude
// providers/openai.ts   ← OpenAI GPT
// providers/config.ts   ← Select based on env vars
```

**Chat UI features:**
- Streaming responses (SSE) with typewriter effect
- Tool call visualization ("Querying account balance...")
- Clickable results link to Explorer pages
- Context-aware: auto-includes current address if on an address page
- Daily free quota (e.g. 20 queries/day), beyond requires API Key

### Portfolio Data API

Aggregation endpoints combining Node API + Indexer + price data:

```
GET /api/portfolio/[address]           → Full portfolio overview
GET /api/portfolio/[address]/tokens    → Token holdings + USD value
GET /api/portfolio/[address]/defi      → LP positions + staking info
GET /api/portfolio/[address]/history   → Transaction history (paginated)
```

Returns standardized portfolio data format for external tool integration (Zapper, DeBank, etc.).

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 App Router, Tailwind CSS 4, Radix UI |
| State | Zustand (global) + TanStack Query (server) |
| API Docs | OpenAPI spec parsing, client-side request execution |
| Auth (V2) | Wallet signature + JWT |
| Database (V2) | Neon PostgreSQL |
| API Routes (V2+) | Next.js API Routes |
| LLM (V3) | Pluggable provider (Claude / OpenAI) |
| MCP (V3) | `@movement/chain-mcp-server` npm package |
