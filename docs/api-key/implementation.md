# Implementation Plan

Detailed implementation phases, module specs, and verification for the Kong OSS hybrid mode deployment. See [README.md](README.md) for architecture overview and decisions.

## Phases

### Phase 1: Foundation (testnet)

#### 1.1 — ElastiCache Redis module

New module: `infra/tofu-network-nodes/modules/aws-elasticache-redis/`

Resources:

- `aws_elasticache_replication_group` (Redis 7.x, Multi-AZ, encryption in transit)
- `aws_security_group` (allow from EKS node SGs)
- `aws_elasticache_subnet_group` (private subnets from VPC)

Config in YAML (networking module-set):

```yaml
redis:
  enabled: true
  source: "./modules/aws-elasticache-redis"
  config:
    node_type: cache.r6g.large
    num_cache_nodes: 2
    engine_version: "7.0"
```

Output: Redis primary endpoint (consumed by Kong module).

#### 1.2 — Aurora PostgreSQL for Kong control plane

New module: `infra/tofu-network-nodes/modules/aws-aurora-kong/`

Resources:

- `aws_rds_cluster` (Aurora PostgreSQL Serverless v2, encryption at rest)
- `aws_rds_cluster_instance` (1 writer + 1 reader for HA)
- `aws_security_group` (allow from EKS node SGs)
- `aws_db_subnet_group` (private subnets)

Kong's control plane uses this to store consumers, API keys, plugins, and routes. Only deployed in us-west-2 (control plane region).

Config in YAML (networking module-set, us-west-2 only):

```yaml
kong-database:
  enabled: true
  source: "./modules/aws-aurora-kong"
  config:
    engine_version: "15.4"
    min_capacity: 0.5
    max_capacity: 4
    database_name: kong
```

#### 1.3 — Kong Control Plane module (us-west-2 only)

New module: `infra/tofu-network-nodes/modules/kubernetes-kong-cp/`

Deploys via Helm chart `kong/kong` in control plane role:

- `KONG_ROLE=control_plane`
- Admin API as ClusterIP service (port 8001, internal only)
- Cluster listener on port 8005 (WebSocket, for data plane config sync)
- Connected to Aurora PostgreSQL for persistent storage
- Global `key-auth` plugin (anonymous consumer for unauth'd requests)
- Global `rate-limiting` plugin with Redis policy
- Consumer groups for tiers: `free` (60/min), `standard` (300/min), `premium` (1000/min)
- Prometheus plugin for metrics export
- Generates cluster certificate for mTLS with data planes

Config in YAML (networking module-set, us-west-2 only):

```yaml
kong-cp:
  enabled: true
  source: "./modules/kubernetes-kong-cp"
  config:
    replicaCount: 2
    redis_host: "" # from redis module output
    database_host: "" # from aurora module output
    cluster_cert_secret: kong-cluster-cert
    # Example values — actual limits TBD based on capacity planning
    anonymous_rate_limit:
      minute: 10
      hour: 100
    tiers:
      free: { minute: 60, hour: 1000 }
      standard: { minute: 300, hour: 10000 }
      premium: { minute: 1000, hour: 100000 }
```

#### 1.4 — Kong Data Plane module (all regions)

New module: `infra/tofu-network-nodes/modules/kubernetes-kong-dp/`

Deploys via Helm chart `kong/kong` in data plane role:

- `KONG_ROLE=data_plane`
- Proxy as Deployment with ClusterIP service
- Connects to control plane via WebSocket (port 8005) for config sync
- Caches config locally — continues serving if CP is unreachable
- No database connection needed
- Connects to Redis in us-west-2 for global rate limit counters
- mTLS with control plane via shared cluster certificate

Config in YAML (networking module-set, all regions):

```yaml
kong-dp:
  enabled: true
  source: "./modules/kubernetes-kong-dp"
  config:
    replicaCount: 3
    redis_host: "" # us-west-2 Redis endpoint
    control_plane_endpoint: "" # CP cluster endpoint
    cluster_cert_secret: kong-cluster-cert
```

#### 1.5 — Kong ALB (reuse existing pattern, all regions)

Kong DP's ClusterIP service gets exposed through an ALB using the same pattern as the NGINX ALB:

- New module or extend `kubernetes-nginx-ingress-alb` to be generic
- AWS Load Balancer Controller creates ALB targeting Kong DP pods
- WAFv2 ACL attached for IP-level protection
- ACM certificate for TLS termination

Wiring in `networking.tf`:

```hcl
# Control plane — us-west-2 only
module "kong_cp" {
  source = "./modules/kubernetes-kong-cp"
  count  = local.deploy_kong_cp ? 1 : 0

  namespace     = local.namespace_name
  network_name  = local.network_name
  redis_host    = module.redis[0].primary_endpoint
  database_host = module.kong_database[0].endpoint
  config        = local.modules["kong-cp"].config

  depends_on = [kubernetes_namespace_v1.network, module.redis, module.kong_database]
}

# Data plane — all regions
module "kong_dp" {
  source = "./modules/kubernetes-kong-dp"
  count  = local.deploy_kong_dp ? 1 : 0

  namespace              = local.namespace_name
  network_name           = local.network_name
  control_plane_endpoint = local.kong_cp_endpoint  # from remote state or config
  redis_host             = local.kong_redis_host    # us-west-2 Redis endpoint
  config                 = local.modules["kong-dp"].config

  depends_on = [kubernetes_namespace_v1.network]
}
```

### Phase 2: Traffic Migration (testnet)

#### 2.1 — Deploy Kong alongside NGINX

In the networking workspace:

- Both ingress controllers running simultaneously
- Kong routes to same VFN backend service as NGINX
- Verify key-auth and rate limiting work end-to-end

#### 2.2 — Weighted DNS cutover

- Update API DNS records to point to Kong's ALB
- Start with Kong weight=10, NGINX weight=90
- Gradually shift: 25/75 → 50/50 → 75/25 → 100/0
- Monitor error rates, latency, rate limit accuracy

#### 2.3 — Decommission NGINX API path

After full validation:

- Remove NGINX controller, ALB, and api-networking modules from networking config
- Clean up unused resources

### Phase 3: Admin API & Product Integration

#### 3.1 — Kong Admin API exposure

The Admin API runs on the **control plane only** (us-west-2). Exposure options:

- Internal-only via HAProxy ingress with IP allowlist
- Private DNS: `kong-admin.{env}.movementnetwork.xyz`
- Or: expose only via Kubernetes service (product team's app runs in-cluster or via VPN)

Config changes made via Admin API are automatically pushed to all data planes via WebSocket.

#### 3.2 — Product team: what they need to build

The product team builds a **thin wrapper service** around Kong's Admin API. Kong handles all key generation, validation, and rate limiting — the web app is a frontend + auth layer on top of it.

**Backend service (lightweight API)**

A small service that authenticates dashboard users, maps them to Kong consumers, and proxies authorized requests to the Kong Admin API.

| User-facing endpoint | What it does under the hood |
|---|---|
| `POST /keys` | Creates a Kong consumer (if first key) + calls `POST /consumers/{id}/key-auth` |
| `GET /keys` | Calls `GET /consumers/{id}/key-auth` |
| `DELETE /keys/{key}` | Calls `DELETE /consumers/{id}/key-auth/{key_id}` |
| `GET /usage` | Queries Prometheus/Mimir for per-consumer request metrics |
| `GET /plan` | Reads consumer's group membership from Kong |

The service is stateless aside from a user-to-consumer ID mapping (can live in the product team's existing database).

**Frontend dashboard**

- User authentication (Google OAuth, email/password, etc. — separate from API key auth)
- Key management: create, view, copy, revoke API keys
- Usage stats: request counts, rate limit remaining, historical graphs
- Plan/tier display: current tier, limits

**Usage and analytics data**

Two options for feeding data into the dashboard:

- **Prometheus/Mimir queries** — Kong's Prometheus plugin exports per-consumer metrics. Backend queries Mimir's HTTP API for historical data. Already flowing through our observability stack.
- **Kong rate-limiting status** — the plugin exposes remaining quota per consumer, giving real-time "you've used X of Y requests this minute."

**What the product team does NOT need to build**

- Key generation logic (Kong handles it)
- Rate limiting enforcement (Kong + Redis)
- API key validation at the proxy layer (Kong data planes)
- Rate limit counter storage (Redis)
- Multi-region routing (Route53 + Kong DPs)

**Estimated scope**: small-to-medium project — a standard CRUD app with OAuth login, a handful of API endpoints wrapping Kong Admin API, and a dashboard UI. For an experienced team, a few weeks of engineering.

#### 3.3 — Kong Admin API reference

The backend service calls these Kong Admin API endpoints:

| Operation | Endpoint | Method |
|-----------|----------|--------|
| Create consumer | `/consumers` | POST |
| Generate API key | `/consumers/{id}/key-auth` | POST |
| Revoke key | `/consumers/{id}/key-auth/{key_id}` | DELETE |
| List keys | `/consumers/{id}/key-auth` | GET |
| Assign tier | `/consumer_groups/{group}/consumers` | POST |
| Remove from tier | `/consumer_groups/{group}/consumers/{id}` | DELETE |
| Get usage stats | `/plugins/rate-limiting/status` | GET |

Key format options:

- Kong-generated random keys (default)
- Custom prefix format via `key` param: `mvmt_live_xxxxxxxxxxxx`

#### 3.4 — Anonymous consumer for unauthenticated requests

- Kong `key-auth` plugin with `anonymous` config pointing to a default consumer
- Default consumer has restrictive rate limiting (e.g., 10 req/min — actual limits TBD)
- Authenticated consumers get their tier's limits

### Phase 4: Multi-Region + Global Rate Limiting

#### 4.1 — Deploy data planes to all production regions

- Control plane (CP + Aurora + Redis) stays in us-west-2 only
- Enable `kong-dp` in each region's networking YAML config
- Data planes connect back to us-west-2 CP (WebSocket) and Redis (rate limit counters)
- CP endpoint and Redis host passed via config or remote state

#### 4.2 — Cross-region networking

- Kong CP cluster listener (port 8005) exposed via NLB or private DNS
- Data planes in other regions connect to CP via VPC peering or public endpoint with mTLS
- Redis endpoint accessible cross-region (security group allows EKS node SGs from all regions)

#### 4.3 — Observability

- Kong Prometheus plugin → Alloy scrapes → Mimir (per-region)
- Grafana dashboard: request rates by consumer/tier/region, rate limit rejections, latency percentiles
- CloudWatch alarms on Redis, Aurora, Kong CP, and Kong DP health

### Phase 5: Mainnet Rollout

Repeat Phase 2 (traffic migration) for mainnet.

## Files to Create

| Path | Purpose |
|------|---------|
| `modules/kubernetes-kong-cp/main.tf` | Kong control plane Helm deployment + plugins |
| `modules/kubernetes-kong-cp/variables.tf` | Module inputs (DB, Redis, cluster cert) |
| `modules/kubernetes-kong-cp/outputs.tf` | Admin API endpoint, cluster endpoint |
| `modules/kubernetes-kong-dp/main.tf` | Kong data plane Helm deployment |
| `modules/kubernetes-kong-dp/variables.tf` | Module inputs (CP endpoint, Redis, cert) |
| `modules/kubernetes-kong-dp/outputs.tf` | Proxy service name |
| `modules/aws-elasticache-redis/main.tf` | Redis replication group |
| `modules/aws-elasticache-redis/variables.tf` | Module inputs |
| `modules/aws-elasticache-redis/outputs.tf` | Endpoint, port |
| `modules/aws-aurora-kong/main.tf` | Aurora PostgreSQL for Kong CP |
| `modules/aws-aurora-kong/variables.tf` | Module inputs |
| `modules/aws-aurora-kong/outputs.tf` | Endpoint, port |

All paths relative to `infra/tofu-network-nodes/`.

## Files to Modify

| Path | Change |
|------|--------|
| `infra/tofu-network-nodes/networking.tf` | Add Kong CP/DP + Redis + Aurora module calls |
| `infra/tofu-network-nodes/main.tf` | Add `deploy_kong_cp`, `deploy_kong_dp`, `deploy_redis`, `deploy_kong_database` locals |
| `infra/tofu-network-nodes/variables.tf` | Add Redis/Kong/Aurora variables if needed |
| `infra/tofu-network-nodes/configs/testnet.yaml` | Enable kong-cp + kong-dp + redis + aurora in networking (us-west-2) |
| `infra/tofu-network-nodes/configs/mainnet.yaml` | Enable after testnet validation |

## Verification Plan

1. **testnet**: `tofu plan` on networking workspace — verify all Kong + Redis resources
2. **testnet**: Deploy, then test:
   - `curl -H "apikey: test123" https://testnet.movementnetwork.xyz/v1/` — authenticated request
   - `curl https://testnet.movementnetwork.xyz/v1/` — unauthenticated (should work with low rate limit)
   - Exceed rate limit → verify 429 response
   - Create/revoke keys via Admin API
   - Verify consumer group tier enforcement
3. **testnet**: Weighted DNS cutover, monitor in Grafana
4. **mainnet**: Same process, verify global rate limit counters across regions
