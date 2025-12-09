# Kubernetes Deployment Documentation

## Overview

This application is deployed on DigitalOcean Kubernetes (DOKS) using a comprehensive Kubernetes setup that includes Deployments, Services, Ingress, and cert-manager for SSL/TLS certificates.

## Architecture Overview

```
Internet
   ↓
[Ingress Controller (nginx)]
   ↓
[Ingress Resource]
   ↓
[Service (ClusterIP)]
   ↓
[Deployment (2 Replicas)]
   ↓
[Pods running Node.js app]
```

## Kubernetes Manifests

### 1. Deployment (`k8s/deployment.yaml`)

#### Purpose
Manages the application pods, ensuring desired number of replicas are running.

#### Key Components

**Metadata:**
```yaml
name: node-app
```
- Deployment name used for identification and selection

**Replicas:**
```yaml
replicas: 2
```
- Maintains 2 pod replicas for high availability
- Kubernetes automatically restarts failed pods
- Load is distributed across replicas

**Container Configuration:**
```yaml
image: registry.digitalocean.com/movierec/node-app:latest
ports:
  - name: http
    containerPort: 8080
    protocol: TCP
```
- Pulls image from DigitalOcean Container Registry
- Container listens on port 8080
- Port name used for service routing

**Environment Variables:**
```yaml
env:
  - name: PORT
    value: "8080"
envFrom:
  - secretRef:
      name: app-secrets
```
- Sets PORT to 8080 (overrides app default of 3000)
- Loads all secrets from `app-secrets` Secret resource
- Secrets include: DATABASE_URL, JWT_SECRET, OPENAI_API_KEY, TMDB_API_KEY, etc.

**Image Pull Secrets:**
```yaml
imagePullSecrets:
  - name: registry-digitaloceanregistry
```
- Authenticates with DigitalOcean Container Registry
- Required for private registry access

#### Pod Template
- Labels: `app: node-app` (used by Service for selection)
- Container runs Node.js application
- Automatically restarts on failure

### 2. Service (`k8s/service.yaml`)

#### Purpose
Exposes the deployment internally within the cluster and provides load balancing.

#### Configuration

**Type:**
```yaml
# type: ClusterIP (default, commented out)
```
- ClusterIP: Internal cluster access only
- LoadBalancer: External IP (commented, not used)
- Service type defaults to ClusterIP

**Selector:**
```yaml
selector:
  app: node-app
```
- Routes traffic to pods with label `app: node-app`
- Automatically discovers all matching pods

**Port Mapping:**
```yaml
ports:
  - name: http
    port: 80
    targetPort: 8080
    protocol: TCP
```
- Service listens on port 80
- Forwards to container port 8080
- Other services access via `node-app-service:80`

#### Service Discovery
- DNS name: `node-app-service.default.svc.cluster.local`
- Short name: `node-app-service`
- Accessible from any pod in the cluster

### 3. Ingress (`k8s/ingress.yaml`)

#### Purpose
Exposes the service externally with SSL/TLS termination and domain routing.

#### Configuration

**Ingress Class:**
```yaml
ingressClassName: nginx
```
- Uses NGINX Ingress Controller
- Must be installed in cluster

**TLS Configuration:**
```yaml
tls:
  - hosts:
    - api.teja.live
    secretName: node-app-tls
```
- Enables HTTPS for `api.teja.live`
- Certificate stored in `node-app-tls` secret
- Managed by cert-manager (automatic renewal)

**Routing Rules:**
```yaml
rules:
  - host: api.teja.live
    http:
      paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: node-app-service
              port:
                number: 80
```
- Routes all traffic from `api.teja.live` to service
- Path `/` matches all paths (prefix matching)
- Forwards to `node-app-service` on port 80

**Annotations:**
```yaml
annotations:
  cert-manager.io/cluster-issuer: letsencrypt-prod
```
- Instructs cert-manager to issue certificate
- Uses `letsencrypt-prod` ClusterIssuer
- Automatically provisions Let's Encrypt certificate

### 4. ClusterIssuer (`k8s/cluster-issuer.yaml`)

#### Purpose
Configures cert-manager to automatically issue SSL certificates from Let's Encrypt.

#### Configuration

**ACME Configuration:**
```yaml
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: vurukondasaiteja13@gmail.com
```
- Uses Let's Encrypt production API
- Email for certificate expiration notifications
- Production server (not staging)

**Solver:**
```yaml
solvers:
  - http01:
      ingress:
        class: nginx
```
- Uses HTTP-01 challenge method
- Validates domain ownership via HTTP
- Works with NGINX Ingress Controller

**Private Key:**
```yaml
privateKeySecretRef:
  name: letsencrypt-prod
```
- Stores ACME account private key
- Used for certificate signing requests

## Deployment Workflow

### CI/CD Pipeline (GitHub Actions)

The deployment process is automated via `.github/workflows/deploy.yml`:

#### Step 1: Build and Push Docker Image
```yaml
docker build -t registry.digitalocean.com/${REGISTRY_NAME}/node-app:${GITHUB_SHA::8} .
docker push registry.digitalocean.com/${REGISTRY_NAME}/node-app:${GITHUB_SHA::8}
```
- Builds image tagged with commit SHA
- Pushes to DigitalOcean Container Registry

#### Step 2: Configure Kubernetes Access
```yaml
doctl kubernetes cluster kubeconfig save k8s-1-33-1-do-5-blr1-1763101949513
```
- Saves kubeconfig for cluster access
- Enables kubectl commands in CI/CD

#### Step 3: Cleanup Existing Resources
```yaml
kubectl delete deployment node-app --ignore-not-found
kubectl delete service node-app-service --ignore-not-found
kubectl delete ingress node-app-ingress --ignore-not-found
```
- Removes old resources (if they exist)
- Ensures clean deployment

#### Step 4: Create Image Pull Secret
```yaml
kubectl create secret docker-registry registry-digitaloceanregistry \
  --docker-server=registry.digitalocean.com \
  --docker-username=$DO_TOKEN \
  --docker-password=$DO_TOKEN
```
- Creates secret for registry authentication
- Required for pulling private images

#### Step 5: Update Deployment Image Tag
```yaml
sed -i 's|image: registry.digitalocean.com/movierec/node-app:.*|image: registry.digitalocean.com/movierec/node-app:'"${GITHUB_SHA::8}"'|' k8s/deployment.yaml
```
- Updates deployment.yaml with new image tag
- Ensures latest code is deployed

#### Step 6: Install cert-manager (if needed)
```yaml
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.yaml
```
- Installs cert-manager if not present
- Waits for CRDs to be available

#### Step 7: Apply Kubernetes Manifests
```yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/cluster-issuer.yaml
```
- Creates/updates all Kubernetes resources
- Rolling update for deployment (zero downtime)

#### Step 8: Create Application Secrets
```yaml
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  ...
```
- Creates secret with environment variables
- Base64 encoded automatically by Kubernetes

#### Step 9: Verify Deployment
```yaml
kubectl rollout status deployment/node-app
kubectl get pods
kubectl get services
kubectl get ingress
```
- Checks deployment status
- Verifies pods are running
- Confirms service and ingress are created

## Secrets Management

### Application Secrets (`app-secrets`)

Contains sensitive configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT token signing key
- `OPENAI_API_KEY`: OpenAI API key
- `TMDB_API_KEY`: TMDB API key
- `TMDB_BASE_URL`: TMDB API base URL
- `TMDB_IMAGE_BASE_URL`: TMDB image CDN URL

### Registry Secret (`registry-digitaloceanregistry`)

- Type: `docker-registry`
- Used for pulling images from private registry
- Contains DigitalOcean access token

### TLS Secret (`node-app-tls`)

- Created automatically by cert-manager
- Contains SSL certificate and private key
- Auto-renewed before expiration

## Networking

### Internal Networking

**Pod-to-Pod:**
- Pods can communicate via service DNS
- Example: `http://node-app-service:80`

**Service Discovery:**
- Kubernetes DNS resolves service names
- Format: `<service-name>.<namespace>.svc.cluster.local`

### External Access

**Ingress Controller:**
- NGINX Ingress Controller runs as LoadBalancer service
- Gets external IP from DigitalOcean
- Routes traffic based on hostname and path

**DNS Configuration:**
- A record: `api.teja.live` → Ingress Controller IP
- DNS must point to LoadBalancer external IP

## Scaling

### Horizontal Pod Autoscaling (HPA)

Not currently configured, but can be added:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: node-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: node-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Manual Scaling

```bash
# Scale to 5 replicas
kubectl scale deployment node-app --replicas=5

# Check current replicas
kubectl get deployment node-app
```

## Health Checks

### Liveness Probe

Not currently configured, but recommended:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
```

## Resource Limits

### Current Configuration

No resource limits set. Recommended:

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

## Monitoring and Logging

### View Pod Logs

```bash
# All pods
kubectl logs -l app=node-app

# Specific pod
kubectl logs <pod-name>

# Follow logs
kubectl logs -f <pod-name>

# Previous container (if restarted)
kubectl logs <pod-name> --previous
```

### Pod Status

```bash
# Describe pod
kubectl describe pod <pod-name>

# Get pod events
kubectl get events --field-selector involvedObject.name=<pod-name>
```

### Service Status

```bash
# Describe service
kubectl describe service node-app-service

# Get endpoints
kubectl get endpoints node-app-service
```

## Troubleshooting

### Pod Not Starting

1. **Check pod status:**
   ```bash
   kubectl get pods -l app=node-app
   kubectl describe pod <pod-name>
   ```

2. **Check logs:**
   ```bash
   kubectl logs <pod-name>
   ```

3. **Common issues:**
   - Image pull errors (check imagePullSecrets)
   - Database connection failures (check DATABASE_URL)
   - Missing environment variables

### Service Not Routing

1. **Check service endpoints:**
   ```bash
   kubectl get endpoints node-app-service
   ```

2. **Verify selector matches pod labels:**
   ```bash
   kubectl get pods --show-labels
   ```

### Ingress Not Working

1. **Check ingress status:**
   ```bash
   kubectl describe ingress node-app-ingress
   ```

2. **Verify ingress controller:**
   ```bash
   kubectl get pods -n ingress-nginx
   ```

3. **Check LoadBalancer IP:**
   ```bash
   kubectl get svc -n ingress-nginx ingress-nginx-controller
   ```

### Certificate Issues

1. **Check certificate status:**
   ```bash
   kubectl describe certificate node-app-tls
   ```

2. **Check cert-manager logs:**
   ```bash
   kubectl logs -n cert-manager -l app=cert-manager
   ```

3. **Verify ClusterIssuer:**
   ```bash
   kubectl describe clusterissuer letsencrypt-prod
   ```

## Rolling Updates

### Update Strategy

Deployment uses default `RollingUpdate` strategy:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

- Creates new pods before terminating old ones
- Ensures zero downtime during updates
- Can rollback if issues occur

### Rollback

```bash
# View rollout history
kubectl rollout history deployment/node-app

# Rollback to previous version
kubectl rollout undo deployment/node-app

# Rollback to specific revision
kubectl rollout undo deployment/node-app --to-revision=2
```

## Security Best Practices

1. **Secrets Management:**
   - Never commit secrets to repository
   - Use Kubernetes Secrets or external secret managers
   - Rotate secrets regularly

2. **Network Policies:**
   - Restrict pod-to-pod communication
   - Limit ingress/egress traffic

3. **RBAC:**
   - Use least privilege principle
   - Create service accounts with minimal permissions

4. **Image Security:**
   - Scan images for vulnerabilities
   - Use trusted base images
   - Keep images updated

## Summary

The Kubernetes deployment provides:
- **High Availability**: Multiple replicas ensure uptime
- **Scalability**: Easy to scale up/down
- **SSL/TLS**: Automatic certificate management
- **Load Balancing**: Traffic distributed across pods
- **Zero Downtime**: Rolling updates
- **Self-Healing**: Automatic pod restarts
- **Service Discovery**: Automatic DNS resolution

