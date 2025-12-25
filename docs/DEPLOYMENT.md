# Deployment Strategy

**Target:** Kubernetes (K8s) with Helm charts
**CI/CD:** GitHub Actions
**Container Registry:** GitHub Container Registry (GHCR)

---

## Architecture Overview

### Deployment Components

1. **Next.js Application** - Containerized web application
2. **PostgreSQL Database** - Managed database or StatefulSet
3. **Redis** - Cache and job queue (StatefulSet or managed service)
4. **BullMQ Workers** - Background job processors (separate deployment)

### Infrastructure Options

#### Option 1: Managed Services (Recommended for Production)
- **Database:** AWS RDS PostgreSQL, Google Cloud SQL, or Azure Database
- **Redis:** AWS ElastiCache, Google Cloud Memorystore, or Azure Cache
- **K8s Cluster:** EKS, GKE, or AKS

#### Option 2: Self-Hosted (All in K8s)
- **Database:** PostgreSQL StatefulSet with persistent volumes
- **Redis:** Redis StatefulSet with persistent volumes
- **K8s Cluster:** Self-managed or managed

---

## Project Structure

```
vibeyard/
├── .github/
│   └── workflows/
│       ├── ci.yml           # CI pipeline (lint, test, build)
│       └── deploy.yml       # CD pipeline (build image, deploy to K8s)
├── helm/
│   └── vibeyard/
│       ├── Chart.yaml       # Helm chart metadata
│       ├── values.yaml      # Default configuration
│       ├── values-dev.yaml  # Development overrides
│       ├── values-staging.yaml  # Staging overrides
│       ├── values-prod.yaml # Production overrides
│       └── templates/
│           ├── deployment.yaml    # App deployment
│           ├── service.yaml       # Service definition
│           ├── ingress.yaml       # Ingress for external access
│           ├── configmap.yaml     # Non-sensitive config
│           ├── secret.yaml        # Sensitive config (sealed)
│           ├── postgres.yaml      # PostgreSQL StatefulSet (optional)
│           ├── redis.yaml         # Redis StatefulSet
│           ├── worker.yaml        # BullMQ worker deployment
│           └── _helpers.tpl       # Template helpers
├── k8s/
│   ├── namespaces/
│   │   ├── dev.yaml
│   │   ├── staging.yaml
│   │   └── prod.yaml
│   └── sealed-secrets/      # Sealed secrets for GitOps
│       ├── dev-secrets.yaml
│       ├── staging-secrets.yaml
│       └── prod-secrets.yaml
├── Dockerfile               # Multi-stage Dockerfile for Next.js
├── .dockerignore
└── docker-compose.yml       # Local development
```

---

## Dockerfile

Create a multi-stage Dockerfile for Next.js:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build Next.js app
RUN yarn build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Set to production
ENV NODE_ENV production

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

EXPOSE 3000

CMD ["yarn", "start"]
```

---

## Helm Chart Structure

### Chart.yaml

```yaml
apiVersion: v2
name: vibeyard
description: A Helm chart for Vibeyard - AI code project showcase platform
version: 0.1.0
appVersion: "1.0.0"
```

### values.yaml (Key Configuration)

```yaml
replicaCount: 3

image:
  repository: ghcr.io/your-org/vibeyard
  pullPolicy: IfNotPresent
  tag: "latest"

service:
  type: ClusterIP
  port: 3000

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: vibeyard.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: vibeyard-tls
      hosts:
        - vibeyard.example.com

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 250m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

postgresql:
  enabled: false  # Use managed database in production
  auth:
    username: vibeyard
    password: changeme
    database: vibeyard

redis:
  enabled: true
  architecture: standalone
  auth:
    enabled: false
  master:
    persistence:
      enabled: true
      size: 8Gi

worker:
  enabled: true
  replicaCount: 2
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 256Mi
```

---

## GitHub Actions Workflows

### .github/workflows/ci.yml

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Run linter
        run: yarn lint

      - name: Run type check
        run: yarn type-check

      - name: Run tests
        run: yarn test
        env:
          DATABASE_URL: postgresql://vibeyard:password@localhost:5432/vibeyard_test
          REDIS_URL: redis://localhost:6379

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: vibeyard
          POSTGRES_PASSWORD: password
          POSTGRES_DB: vibeyard_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
```

### .github/workflows/deploy.yml

```yaml
name: Deploy

on:
  push:
    branches:
      - main      # Deploy to production
      - develop   # Deploy to staging

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build-and-push
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Install Helm
        uses: azure/setup-helm@v3
        with:
          version: 'v3.12.0'

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}

      - name: Deploy to staging
        run: |
          helm upgrade --install vibeyard ./helm/vibeyard \
            --namespace staging \
            --create-namespace \
            --values ./helm/vibeyard/values-staging.yaml \
            --set image.tag=${{ github.sha }} \
            --wait \
            --timeout 10m

  deploy-production:
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Install Helm
        uses: azure/setup-helm@v3
        with:
          version: 'v3.12.0'

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG_PROD }}

      - name: Deploy to production
        run: |
          helm upgrade --install vibeyard ./helm/vibeyard \
            --namespace production \
            --create-namespace \
            --values ./helm/vibeyard/values-prod.yaml \
            --set image.tag=${{ github.sha }} \
            --wait \
            --timeout 10m
```

---

## Deployment Process

### Initial Setup

1. **Create K8s namespaces:**
   ```bash
   kubectl apply -f k8s/namespaces/
   ```

2. **Install cert-manager (for TLS):**
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

3. **Install NGINX Ingress Controller:**
   ```bash
   helm upgrade --install ingress-nginx ingress-nginx \
     --repo https://kubernetes.github.io/ingress-nginx \
     --namespace ingress-nginx --create-namespace
   ```

4. **Create Sealed Secrets (for GitOps):**
   ```bash
   # Install sealed-secrets controller
   helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
   helm install sealed-secrets sealed-secrets/sealed-secrets -n kube-system

   # Create sealed secret from regular secret
   kubectl create secret generic vibeyard-secrets \
     --from-literal=database-url="postgresql://..." \
     --from-literal=nextauth-secret="..." \
     --from-literal=github-client-secret="..." \
     --from-literal=openai-api-key="..." \
     --dry-run=client -o yaml | \
     kubeseal -o yaml > k8s/sealed-secrets/prod-secrets.yaml
   ```

5. **Set up GitHub Secrets:**
   - `KUBE_CONFIG_STAGING` - Kubeconfig for staging cluster
   - `KUBE_CONFIG_PROD` - Kubeconfig for production cluster

### Deploy to Local K8s (minikube/kind)

```bash
# Start minikube
minikube start

# Build Docker image
docker build -t vibeyard:local .

# Load image into minikube
minikube image load vibeyard:local

# Deploy with Helm
helm install vibeyard ./helm/vibeyard \
  --namespace dev \
  --create-namespace \
  --values ./helm/vibeyard/values-dev.yaml \
  --set image.tag=local

# Port forward to access locally
kubectl port-forward -n dev svc/vibeyard 3000:3000
```

### Deploy to Staging

```bash
# Merge to develop branch
git checkout develop
git merge feature/your-feature
git push origin develop

# GitHub Actions will automatically deploy to staging
```

### Deploy to Production

```bash
# Merge to main branch (requires PR approval)
git checkout main
git merge develop
git push origin main

# GitHub Actions will automatically deploy to production
```

---

## Rollback Strategy

### Rollback Helm Release

```bash
# List release history
helm history vibeyard -n production

# Rollback to previous version
helm rollback vibeyard -n production

# Rollback to specific revision
helm rollback vibeyard 3 -n production
```

### Manual Rollback

```bash
# Update deployment to use previous image
kubectl set image deployment/vibeyard \
  vibeyard=ghcr.io/your-org/vibeyard:previous-sha \
  -n production
```

---

## Monitoring and Observability

### Install Prometheus & Grafana (Optional)

```bash
# Add Prometheus Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

### Application Metrics

- Sentry for error tracking
- Custom metrics endpoint `/api/metrics` (Prometheus format)
- Grafana dashboards for:
  - Request rate, latency, error rate
  - Analysis job queue metrics
  - Database connection pool metrics
  - Redis cache hit rate

---

## Scaling Strategy

### Horizontal Pod Autoscaling (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: vibeyard-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: vibeyard
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Database Scaling

- **Read Replicas:** Configure PostgreSQL read replicas for heavy read workloads
- **Connection Pooling:** Use PgBouncer for connection pooling
- **Vertical Scaling:** Increase database instance size as needed

### Worker Scaling

- **Queue-based Autoscaling:** Scale BullMQ workers based on queue depth
- **Separate Worker Pools:** Different worker pools for different job types

---

## Security Considerations

### Image Security

- **Scan images:** Use Trivy or Snyk to scan for vulnerabilities
- **Non-root user:** Run container as non-root user (done in Dockerfile)
- **Read-only filesystem:** Set `readOnlyRootFilesystem: true` where possible

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: vibeyard-network-policy
spec:
  podSelector:
    matchLabels:
      app: vibeyard
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
```

### Secrets Management

- Use Sealed Secrets or External Secrets Operator
- Rotate secrets regularly
- Use separate secrets for each environment
- Never commit unencrypted secrets to Git

---

## Cost Optimization

### Resource Requests/Limits

- Set appropriate CPU/memory requests and limits
- Use Vertical Pod Autoscaler (VPA) to optimize resources

### Spot/Preemptible Instances

- Use spot instances for non-critical workloads (workers, staging)
- Mix spot and on-demand instances for production

### Database

- Use managed database services with auto-scaling
- Schedule database backups during off-peak hours
- Use read replicas only when necessary

---

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n production
kubectl describe pod vibeyard-xxx -n production
kubectl logs vibeyard-xxx -n production
kubectl logs vibeyard-xxx -n production --previous  # Previous container logs
```

### Check Helm Release

```bash
helm list -n production
helm status vibeyard -n production
helm get values vibeyard -n production
```

### Debug Database Connection

```bash
# Port forward to postgres
kubectl port-forward -n production svc/postgres 5432:5432

# Connect with psql
psql postgresql://vibeyard:password@localhost:5432/vibeyard
```

### Debug Redis Connection

```bash
# Port forward to redis
kubectl port-forward -n production svc/redis 6379:6379

# Connect with redis-cli
redis-cli -h localhost -p 6379
```

---

## Next Steps

1. Create Dockerfile
2. Create Helm charts in `helm/vibeyard/`
3. Set up GitHub Actions workflows
4. Configure K8s cluster (EKS, GKE, or AKS)
5. Set up DNS and TLS certificates
6. Deploy to staging and test
7. Deploy to production

---

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
