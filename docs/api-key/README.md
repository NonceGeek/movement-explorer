# API Token Validation & Rate Limiting for Node APIs

## Context

Movement Network's VFN REST APIs (port 8080) are publicly exposed via Route53 geo-routed DNS across multiple regions (us-west-2, us-east-1, eu-central-1, ap-northeast-1 on mainnet). Today there is no per-user authentication or token-based rate limiting — only IP-based WAFv2 rules. The product team needs users to be able to obtain API keys with tiered rate limits, and will build a web app for self-service key management.

## Decisions

- **Unauthenticated requests**: Allow with restrictive default rate limit (not blocked)
- **Scope**: Shared API endpoint only (`testnet.movementnetwork.xyz`). Per-node NLBs stay direct.
- **Solution**: Kong Gateway OSS (self-managed, in-cluster)
- **Rate limits**: Global (single counter across all regions)

## Related Documents

- [Implementation Plan](implementation.md) — phases, module specs, HCL examples, verification
- [Cost Comparison](cost-comparison.md) — self-hosted vs SaaS pricing analysis

## Current Request Path (API traffic only)

```mermaid
graph LR
    Client --> Route53["Route53<br/>(latency/weighted)"]
    Route53 --> ALB["ALB<br/>(AWS LB Controller + WAFv2)"]
    ALB --> NGINX["NGINX Ingress Controller<br/>(ClusterIP)"]
    NGINX --> VFN["VFN Pod :8080"]
```

Key files:

- `infra/tofu-network-nodes/networking.tf` — NGINX controller, ALB, API networking
- `infra/tofu-network-nodes/modules/kubernetes-api-networking-alb/` — ALB + DNS for shared API
- `infra/tofu-network-nodes/modules/kubernetes-nginx-ingress-alb/` — NGINX ALB ingress
- `infra/tofu-network-nodes/main.tf` — deploy flags, config loading

## Target Architecture

### Deployment Model: Kong Hybrid Mode

Kong OSS supports a **hybrid mode** that separates the control plane (config + Admin API) from the data plane (traffic handling). This gives us fault tolerance — if the control plane goes down, data planes continue serving traffic with cached config.

```mermaid
graph TB
    subgraph usw2["us-west-2 (primary)"]
        subgraph cp["Control Plane"]
            KongCP["Kong CP<br/>(Admin API :8001)"]
            Aurora["PostgreSQL (Aurora)<br/>consumers, keys, plugins"]
            Redis["Redis (ElastiCache)<br/>global rate limit counters"]
            KongCP --- Aurora
            KongCP --- Redis
        end
        subgraph dpw2["Data Plane"]
            KongDPW2["Kong DP<br/>(cached config)"]
            ALBW2_REST["ALB (WAFv2 + ACM)"] --> KongDPW2
            KongDPW2 --> VFNW2["VFN :8080<br/>(REST API)"]
            KongDPW2 --> HasuraW2["Hasura :8080<br/>(GraphQL)"]
        end
        KongCP -- "WebSocket<br/>config sync" --> KongDPW2
    end

    subgraph use1["us-east-1"]
        subgraph dpe1["Data Plane"]
            KongDPE1["Kong DP"]
            ALBE1["ALB"] --> KongDPE1
            KongDPE1 --> VFNE1["VFN :8080"]
        end
    end

    subgraph euc1["eu-central-1"]
        subgraph dpeu["Data Plane"]
            KongDPEU["Kong DP"]
            ALBEU["ALB"] --> KongDPEU
            KongDPEU --> VFNEU["VFN :8080"]
        end
    end

    KongCP -- "WebSocket<br/>config sync" --> KongDPE1
    KongCP -- "WebSocket<br/>config sync" --> KongDPEU

    subgraph dashboard["Product Team Dashboard"]
        Frontend["Frontend<br/>(React/etc)"]
        Backend["Backend Service<br/>User auth (OAuth/SSO)<br/>User-Consumer mapping<br/>Wraps Kong Admin API"]
        Frontend --> Backend
    end

    Backend -- "REST calls<br/>(internal/VPN)" --> KongCP
```

The dashboard backend calls the Kong Admin API to create/revoke API keys, assign consumers to tier groups, and retrieve rate limit usage stats.

```mermaid
graph LR
    subgraph "Dashboard Backend Operations"
        B[Backend Service] --> K[Kong Admin API :8001]
        K --> Keys["Create/revoke<br/>API keys"]
        K --> Tiers["Assign consumer<br/>to tier group"]
        K --> Stats["Get rate limit<br/>usage stats"]
    end
```

### Request Path (per region)

```mermaid
graph LR
    Client --> Route53["Route53<br/>(latency/weighted)"]
    Route53 --> ALB["ALB<br/>(WAFv2 + ACM cert)"]
    ALB --> KongDP["Kong Data Plane<br/>(key-auth + rate-limiting)"]
    KongDP --> VFN["VFN Pod :8080"]
```

Kong replaces NGINX Ingress Controller in the API path. HAProxy (TCP/p2p traffic) is unaffected. Per-node NLBs are unaffected.

### Fault Tolerance

| Failure | Impact |
|---------|--------|
| Control plane down (us-west-2 CP) | Data planes continue serving with cached config. Existing keys work. Cannot create/revoke keys until CP recovers. |
| Redis down (us-west-2) | Rate limiting degrades to local counters (per-pod). Auth continues working (keys cached in DP). |
| Single region data plane down | Route53 health checks route traffic to healthy regions. No impact to other regions. |
| PostgreSQL down | Same as control plane down — DPs use cached config. Admin API returns errors. |

## Global Rate Limiting Strategy

Kong OSS `rate-limiting` plugin with `policy = "redis"` stores all counters in Redis. All data planes across regions connect to the single Redis in us-west-2 for globally accurate counters.

- ElastiCache Redis in us-west-2 (Multi-AZ for HA)
- Cross-region latency for Redis calls: ~30-70ms (acceptable — blockchain RPC responses already take 50-200ms)
- Rate limit counters are globally accurate in real-time

**Fallback if Redis is unreachable:** Kong falls back to local per-pod counters (`policy = "local"`). Rate limits become per-pod approximations until Redis recovers — prevents total auth failure.

**Future optimization if latency becomes an issue:**

- ElastiCache Global Datastore with primary in us-west-2 and read replicas per-region
- Kong reads from local replica (fast) but writes go to primary (~1s replication lag)
- Rate limits become "eventually consistent" — acceptable for rate limiting

## Indexer (GraphQL + Hasura) Integration

The network indexer (`tofu-network-indexer`) exposes a GraphQL API via Hasura at `indexer.{env}.movementnetwork.xyz`. Today it is unauthenticated for read-only queries. Kong can protect it using the same API keys and consumer tiers as the REST API.

### Architecture

Kong data planes proxy both REST API and GraphQL traffic. The indexer becomes another route on the same data plane — no separate gateway needed:

```mermaid
graph LR
    subgraph "Kong DP (us-west-2)"
        REST["Route: *.movementnetwork.xyz/v1/*"] --> VFN["VFN :8080<br/>(REST API)"]
        GQL["Route: indexer.*.movementnetwork.xyz/*"] --> Hasura["Hasura :8080<br/>(GraphQL)"]
    end
```

- Same API key authenticates against both services
- Product team manages one set of keys for both REST and GraphQL
- Per-route rate limits allow different thresholds for each service

### Two-Layer Rate Limiting

GraphQL queries vary wildly in cost — a single request can return 10 rows or 10,000. Rate limiting is split across two layers:

**Layer 1: Kong (request-count gating)**

Controls how many requests a user can make per time window. Example values — actual limits TBD:

| Route | Free | Standard | Premium |
|-------|------|----------|---------|
| REST API (`/v1/`) | 60 req/min | 300/min | 1000/min |
| GraphQL (`indexer.*`) | 20 req/min | 100/min | 500/min |

Lower limits on GraphQL reflect the heavier per-request cost.

**Layer 2: Hasura (query complexity gating)**

Controls how much data a single query can return. Hasura's built-in per-role permissions handle this natively — no custom code needed.

### Tier-to-Role Mapping

Kong's `request-transformer` plugin injects an `x-hasura-role` header based on the user's consumer group. Hasura reads this header and applies role-specific permissions:

| Kong Consumer Group | Hasura Role | Row Limit | Table Access |
|---------------------|-------------|-----------|--------------|
| `free` | `api-free` | 100 rows | Public tables only |
| `standard` | `api-standard` | 1,000 rows | All tables |
| `premium` | `api-premium` | 10,000 rows | All tables + aggregations |
| anonymous (no key) | `api-anonymous` | 50 rows | Public tables only |

*Row limits and table access are examples — actual values TBD based on capacity planning.*

**How it flows:**

```mermaid
sequenceDiagram
    participant User
    participant Kong as Kong DP
    participant Hasura

    User->>Kong: GraphQL request + API key
    Kong->>Kong: Validate key, identify consumer group ("standard")
    Kong->>Kong: Inject x-hasura-role: api-standard header
    Kong->>Kong: Strip any client-sent x-hasura-role (prevent spoofing)
    Kong->>Hasura: Forward request with role header
    Hasura->>Hasura: Apply api-standard permissions (1,000 row limit)
    Hasura-->>User: Response (up to 1,000 rows)
```

Hasura also enforces `query_depth_limit: 15` globally (already configured) to prevent deeply nested queries regardless of tier.

### What the User Experiences

A `free` tier user running:

```graphql
query { transactions(limit: 5000) { hash, sender, timestamp } }
```

Hasura silently caps the result to 100 rows (the `api-free` role's limit). No error — just fewer results. The user sees their tier's limits in the dashboard and can upgrade for larger queries.

### Product Team Dashboard Impact

No extra work for the product team. Assigning a user to a Kong consumer group already controls:

1. **REST API rate limits** (Kong rate-limiting plugin)
2. **GraphQL request rate limits** (Kong rate-limiting plugin, per-route)
3. **GraphQL query size limits** (Hasura role permissions, via Kong header injection)

One tier assignment, all three limits update automatically.

### Configuration Required

**Kong side (infra):**

- `request-transformer` plugin per consumer group — adds `x-hasura-role` header
- Route for `indexer.{env}.movementnetwork.xyz` pointing to Hasura ClusterIP service
- Strip client-sent `x-hasura-role` on the indexer route

**Hasura side (application config):**

- Define roles (`api-free`, `api-standard`, `api-premium`, `api-anonymous`) in Hasura metadata
- Set per-role select permissions on each table with row `limit` values
- Managed via Hasura migrations or console — no infra changes
