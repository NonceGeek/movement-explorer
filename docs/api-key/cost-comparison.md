# API Gateway Cost Comparison: Self-Hosted vs SaaS

## Overview

Comparison of API token validation and rate limiting solutions for Movement Network's node APIs. Costs estimated for the full deployment across all environments (devnet, testnet, mainnet).

## Self-Hosted: Kong Gateway OSS (Recommended)

Kong OSS deployed in hybrid mode — control plane in us-west-2, data planes in every region.

### Per-Component Costs

#### Control Plane (us-west-2 only)

| Component | Sizing | Monthly |
|-----------|--------|---------|
| Aurora PostgreSQL Serverless v2 | 0.5-2 ACU (Kong metadata is small) | $50-80 |
| ElastiCache Redis (Multi-AZ) | cache.t4g.medium, 2 nodes | $95 |
| Kong CP pods (2 replicas) | 0.5 CPU / 1GB each, on existing EKS nodes | ~$30 |
| **CP subtotal** | | **$175-205** |

#### Data Plane (per region)

| Component | Sizing | Monthly |
|-----------|--------|---------|
| Kong DP pods (3 replicas) | 1 CPU / 2GB each, on existing EKS nodes | ~$70 |
| ALB (AWS LB Controller) | Base + LCU charges | ~$35 |
| **DP subtotal** | | **~$105** |

#### Notes

- Kong DP pods run on existing EKS nodes. Compute cost is the share of EC2 they consume, not new instances. If nodes are already full, add ~$120/mo for a dedicated t3.xlarge per region.
- Redis can be downsized to cache.t4g.small (~$47/mo) if counter volume is low, or upsized to cache.r6g.large (~$368/mo) under heavy load.
- ALB costs scale with traffic. The $35/mo estimate assumes moderate throughput. High-traffic mainnet could push this to $50-80.

### Environment Totals

| Environment | Regions | Monthly | Annual |
|-------------|---------|---------|--------|
| Testnet | 2 (us-west-2, us-east-1) | $385-415 | $4.6-5.0k |
| Mainnet | 4 (us-west-2, us-east-1, eu-central-1, ap-northeast-1) | $595-625 | $7.1-7.5k |
| **All environments** | **combined** | **$980-1,040** | **$11.7-12.5k** |

### Operational Costs (not billed)

- Engineering time to build and maintain Kong CP/DP modules
- On-call coverage for Kong, Aurora, and Redis
- Upgrades and patching (Kong releases, Redis/Aurora engine versions)
- Product team builds custom key management web app against Kong Admin API

## SaaS Options

### Kong Konnect

SaaS control plane with data planes running in our clusters.

| Item | Cost |
|------|------|
| Konnect Plus license | $20-35k/yr |
| ElastiCache Redis (still needed for rate limiting) | ~$95/mo ($1.1k/yr) per CP region |
| Kong DP pods (existing EKS nodes) | ~$70/mo per region |
| ALB per region | ~$35/mo per region |
| **Estimated annual total** | **$27-42k** |

- Built-in Dev Portal may reduce product team build effort
- Control plane ops (Aurora, upgrades, patching) handled by Kong
- Migration from OSS: config change, not a rewrite
- Enterprise RBAC, analytics, and audit logging included

### AWS API Gateway (HTTP API)

Fully managed, serverless. No in-cluster infrastructure.

| Item | Cost |
|------|------|
| Request charges | $1.00 per million requests |
| VPC Link (per region) | ~$10/mo |
| No Redis, Aurora, or pods needed | $0 |

| Monthly request volume | Monthly cost | Annual cost |
|------------------------|-------------|-------------|
| 10M requests | ~$10 | ~$120 |
| 100M requests | ~$100 | ~$1.2k |
| 500M requests | ~$500 | ~$6k |
| 1B requests | ~$1,000 | ~$12k |
| 5B requests | ~$5,000 | ~$60k |

- Cheapest at low volumes, most expensive at high volumes
- No per-key cost, but 10,000 API key limit per usage plan
- Per-region rate limits only (no global counters)
- +5-15ms latency per request
- Product team builds against AWS SDK (no dev portal)

### Cloudflare API Gateway

Edge-based API management on Cloudflare's network.

| Item | Cost |
|------|------|
| Enterprise plan | Custom pricing (typically $5-10k+/mo) |
| No Redis, Aurora, or pods needed | $0 |
| **Estimated annual total** | **$60-120k+** |

- Global rate limiting native (no Redis needed)
- DDoS protection included
- Lowest user-facing latency (edge PoPs worldwide)
- API key management API less mature for programmatic self-service
- Already using Cloudflare for some DNS endpoints

### Zuplo

Edge-deployed API gateway purpose-built for API key management.

| Item | Cost |
|------|------|
| Enterprise plan (base) | Starting at $1,000/mo |
| Usage charges (on top of base) | Volume-dependent (may be negotiable into an unlimited plan) |
| No Redis, Aurora, or pods needed | $0 |
| **Estimated annual total** | **$12-30k+** (depends on whether unlimited usage is negotiated) |

- Enterprise plan required for custom domains, SLA, and advanced rate limiting
- $1k/mo is the floor — usage charges may or may not apply depending on negotiated terms
- Best out-of-the-box developer portal (lowest product team build effort)
- Edge-deployed, global rate limiting native
- Smaller company, less battle-tested at scale
- All traffic proxied through their edge network

### Tyk Cloud

SaaS control plane with self-managed gateway nodes.

| Item | Cost |
|------|------|
| Tyk Cloud license | $15-25k/yr |
| Redis (still needed) | ~$95/mo ($1.1k/yr) |
| Tyk gateway pods (existing EKS nodes) | ~$70/mo per region |
| ALB per region | ~$35/mo per region |
| **Estimated annual total** | **$22-33k** |

- Built-in developer portal
- Slightly cheaper than Kong Konnect
- Smaller community and plugin ecosystem than Kong

## Side-by-Side Comparison

| Criteria | Kong OSS | Kong Konnect | AWS API GW | Cloudflare | Zuplo | Tyk Cloud |
|----------|----------|-------------|------------|------------|-------|-----------|
| **Annual cost (all envs)** | $12-13k | $27-42k | Volume-dependent | $60-120k+ | $12-30k+ | $22-33k |
| **Per-request cost** | None | None | $1/million | None | Negotiable | None |
| **Dev portal built-in** | No | Yes | No | No | Yes | Yes |
| **Product team build effort** | High | Low | Medium | High | Lowest | Low |
| **Global rate limiting** | Yes (central Redis) | Yes (central Redis) | No (per-region) | Yes (native) | Yes (native) | Yes (Redis) |
| **Latency impact** | +1-3ms | +1-3ms | +5-15ms | +1-2ms | +1-5ms | +1-3ms |
| **Ops burden** | High | Medium | None | None | None | Medium |
| **API key limit** | Unlimited | Unlimited | 10K/plan | Unlimited | Unlimited | Unlimited |
| **Vendor lock-in** | None | Medium | Low | Medium | High | Medium |
| **Migration from Kong OSS** | N/A | Config change | Full rewrite | Full rewrite | Full rewrite | Moderate |
| **Data stays in our infra** | Yes | Data plane yes | No | No | No | Data plane yes |

## Recommendation

**Start with Kong OSS.** At ~$12k/yr (testnet + mainnet) it is the most cost-effective option while giving full control over the infrastructure and data path. The hybrid mode architecture we've designed maps directly to Kong Konnect's model — if the operational burden of running the control plane (Aurora, Redis, upgrades) becomes a pain point, migrating to Konnect is a config change, not a rewrite.

If the product team determines that a built-in developer portal is a hard requirement (eliminating the need to build a custom key management web app), re-evaluate **Kong Konnect** or **Zuplo** at that point.
