# Monitoring and Observability Documentation

## Overview

This application uses **Prometheus** for metrics collection and **Grafana** for visualization and alerting. This provides comprehensive monitoring and observability for the Movie Recommendation API.

## Architecture

```
┌─────────────────┐
│   Application   │  ← Exposes /metrics endpoint
│   (Node.js API) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Prometheus    │  ← Scrapes metrics every 15s
│   (Time Series) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Grafana      │  ← Visualizes metrics & dashboards
│  (Visualization)│
└─────────────────┘
```

## Components

### 1. Prometheus

**Purpose**: Time-series database that collects and stores metrics.

**Features**:
- Scrapes metrics from application endpoints
- Stores time-series data
- Evaluates alerting rules
- Provides query language (PromQL)

**Access**:
- **Internal**: `http://prometheus:9090` (within cluster)
- **External**: `https://prometheus.teja.live` (via Ingress)

### 2. Grafana

**Purpose**: Visualization and dashboard platform.

**Features**:
- Pre-configured dashboards
- Custom queries and visualizations
- Alerting and notifications
- Data source integration

**Access**:
- **Internal**: `http://grafana:3000` (within cluster)
- **External**: `https://grafana.teja.live` (via Ingress)

## Metrics Collected

### HTTP Metrics

- **`http_requests_total`**: Total number of HTTP requests
  - Labels: `method`, `route`, `status_code`
- **`http_request_duration_seconds`**: Request duration histogram
  - Labels: `method`, `route`, `status_code`
  - Buckets: 0.1s, 0.3s, 0.5s, 0.7s, 1s, 3s, 5s, 7s, 10s
- **`http_request_errors_total`**: Total number of HTTP errors (4xx, 5xx)

### Database Metrics

- **`db_queries_total`**: Total number of database queries
  - Labels: `operation`, `table`
- **`db_query_duration_seconds`**: Database query duration histogram
  - Labels: `operation`, `table`
  - Buckets: 0.01s, 0.05s, 0.1s, 0.5s, 1s, 2s, 5s
- **`db_connections_active`**: Number of active database connections

### Business Metrics

- **`movies_total`**: Total number of movies in database
- **`users_total`**: Total number of users
- **`ratings_total`**: Total number of ratings
- **`watchlist_items_total`**: Total number of watchlist items

### Recommendation Metrics

- **`recommendations_generated_total`**: Total recommendations generated
  - Labels: `algorithm`, `status`
- **`recommendation_duration_seconds`**: Recommendation generation duration
  - Labels: `algorithm`
  - Buckets: 0.5s, 1s, 2s, 3s, 5s, 10s

### External API Metrics

- **`tmdb_api_requests_total`**: TMDB API requests
  - Labels: `endpoint`, `status`
- **`tmdb_api_duration_seconds`**: TMDB API request duration
  - Labels: `endpoint`
- **`openai_api_requests_total`**: OpenAI API requests
  - Labels: `model`, `status`
- **`openai_api_duration_seconds`**: OpenAI API request duration
  - Labels: `model`

### Cache Metrics

- **`cache_hits_total`**: Cache hits
  - Labels: `cache_type`
- **`cache_misses_total`**: Cache misses
  - Labels: `cache_type`
- **`cache_size`**: Current cache size
  - Labels: `cache_type`

### System Metrics (Default)

- **`process_cpu_user_seconds_total`**: CPU usage
- **`process_resident_memory_bytes`**: Memory usage
- **`nodejs_heap_size_used_bytes`**: Node.js heap usage
- **`nodejs_heap_size_total_bytes`**: Node.js heap total
- **`nodejs_eventloop_lag_seconds`**: Event loop lag
- **`nodejs_active_handles`**: Active handles

## Installation

### Prerequisites

- Kubernetes cluster with kubectl configured
- NGINX Ingress Controller installed
- cert-manager installed (for SSL certificates)

### Step 1: Create Monitoring Namespace

```bash
kubectl apply -f k8s/monitoring-namespace.yaml
```

### Step 2: Deploy Prometheus

```bash
kubectl apply -f k8s/prometheus-deployment.yaml
```

**Verify Deployment**:
```bash
kubectl get pods -n monitoring -l app=prometheus
kubectl get svc -n monitoring prometheus
```

### Step 3: Deploy Grafana

**Create Grafana Secrets**:
```bash
kubectl create secret generic grafana-secrets \
  --from-literal=admin-user=admin \
  --from-literal=admin-password=your-secure-password \
  -n monitoring
```

**Deploy Grafana**:
```bash
kubectl apply -f k8s/grafana-deployment.yaml
```

**Verify Deployment**:
```bash
kubectl get pods -n monitoring -l app=grafana
kubectl get svc -n monitoring grafana
```

### Step 4: Configure DNS

Add DNS records pointing to your Ingress Controller IP:

```
prometheus.teja.live  → <ingress-ip>
grafana.teja.live    → <ingress-ip>
```

### Step 5: Access Dashboards

- **Prometheus**: `https://prometheus.teja.live`
- **Grafana**: `https://grafana.teja.live`
  - Default username: `admin`
  - Default password: (from secret)

## Configuration

### Prometheus Configuration

The Prometheus configuration is stored in `k8s/prometheus-deployment.yaml` ConfigMap.

**Key Settings**:
- **Scrape Interval**: 15 seconds
- **Evaluation Interval**: 15 seconds
- **Retention**: 30 days
- **Storage**: EmptyDir (consider PersistentVolume for production)

**Scrape Targets**:
- Application pods with label `app=node-app`
- Prometheus itself
- Kubernetes API server
- Kubernetes nodes

### Grafana Configuration

**Data Sources**:
- Prometheus (auto-provisioned)
- URL: `http://prometheus:9090`

**Dashboards**:
- API Overview
- System Metrics
- Business Metrics

**Authentication**:
- Basic auth via Kubernetes secrets
- Consider OAuth/SSO for production

## Dashboards

### 1. API Overview Dashboard

**Location**: `grafana/dashboards/api-overview.json`

**Panels**:
- Request Rate (requests/sec)
- Error Rate (errors/sec)
- Response Time (95th percentile)
- Response Time Distribution (heatmap)
- HTTP Status Codes (pie chart)
- Top Endpoints by Request Count
- Database Query Duration
- Database Query Rate

**Access**: Grafana → Dashboards → Movie Recommendation API - Overview

### 2. System Metrics Dashboard

**Location**: `grafana/dashboards/system-metrics.json`

**Panels**:
- Memory Usage
- CPU Usage
- Event Loop Lag
- Active Handles
- Process Uptime
- Application Version

**Access**: Grafana → Dashboards → Movie Recommendation API - System Metrics

### 3. Business Metrics Dashboard

**Location**: `grafana/dashboards/business-metrics.json`

**Panels**:
- Total Movies
- Total Users
- Total Ratings
- Total Watchlist Items
- Recommendations Generated
- Recommendation Duration
- TMDB API Requests
- OpenAI API Requests
- Cache Hit Rate
- Authentication Attempts

**Access**: Grafana → Dashboards → Movie Recommendation API - Business Metrics

## Alerting Rules

Alerting rules are defined in `prometheus/alert_rules.yml`.

### Active Alerts

1. **HighErrorRate**
   - Condition: Error rate > 0.1 errors/sec for 5 minutes
   - Severity: Warning

2. **HighResponseTime**
   - Condition: 95th percentile response time > 2s for 5 minutes
   - Severity: Warning

3. **APIDown**
   - Condition: API unavailable for 1 minute
   - Severity: Critical

4. **HighDatabaseQueryTime**
   - Condition: 95th percentile query time > 1s for 5 minutes
   - Severity: Warning

5. **DatabaseConnectionIssues**
   - Condition: Active connections > 80 for 5 minutes
   - Severity: Warning

6. **HighMemoryUsage**
   - Condition: Memory usage > 90% for 5 minutes
   - Severity: Warning

7. **HighCPUUsage**
   - Condition: CPU usage > 80% for 5 minutes
   - Severity: Warning

8. **TMDBAPIFailures**
   - Condition: TMDB API error rate > 0.05 errors/sec for 5 minutes
   - Severity: Warning

9. **OpenAIAPIFailures**
   - Condition: OpenAI API error rate > 0.05 errors/sec for 5 minutes
   - Severity: Warning

10. **LowCacheHitRate**
    - Condition: Cache hit rate < 50% for 10 minutes
    - Severity: Info

### Configuring Alertmanager

To enable alerting, deploy Alertmanager:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: alertmanager
  namespace: monitoring
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: alertmanager
        image: prom/alertmanager:v0.26.0
        args:
          - '--config.file=/etc/alertmanager/alertmanager.yml'
        ports:
        - containerPort: 9093
```

Update Prometheus config to point to Alertmanager:

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

## Querying Metrics

### PromQL Examples

**Request Rate**:
```promql
rate(http_requests_total[5m])
```

**Error Rate**:
```promql
rate(http_request_errors_total[5m])
```

**95th Percentile Response Time**:
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**Average Response Time**:
```promql
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

**Error Percentage**:
```promql
sum(rate(http_request_errors_total[5m])) / sum(rate(http_requests_total[5m])) * 100
```

**Database Query Rate**:
```promql
rate(db_queries_total[5m])
```

**Cache Hit Rate**:
```promql
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))
```

**Top 10 Endpoints by Request Count**:
```promql
topk(10, sum by (route) (rate(http_requests_total[5m])))
```

## Application Integration

### Metrics Endpoint

The application exposes metrics at `/metrics`:

```bash
curl http://localhost:3000/metrics
```

### Adding Custom Metrics

**Example: Track a custom business metric**:

```typescript
import { Counter } from 'prom-client';
import { register } from './services/metrics';

export const customMetric = new Counter({
  name: 'custom_metric_total',
  help: 'Description of custom metric',
  labelNames: ['label1', 'label2'],
  registers: [register],
});

// Increment metric
customMetric.inc({ label1: 'value1', label2: 'value2' });
```

### Recording Database Query Metrics

Use the helper function:

```typescript
import { recordDbQuery } from '../middleware/metrics';

const movies = await recordDbQuery(
  'findMany',
  'movies',
  () => db.getMovies()
);
```

### Recording External API Metrics

```typescript
import { recordApiCall } from '../middleware/metrics';

const result = await recordApiCall(
  'tmdb',
  'search',
  () => tmdbService.searchMovies(query)
);
```

## Troubleshooting

For detailed troubleshooting guide, see [TROUBLESHOOTING_MONITORING.md](./TROUBLESHOOTING_MONITORING.md)

### Common Issues

### Prometheus Not Scraping Metrics

1. **Check Pod Labels**:
   ```bash
   kubectl get pods -l app=node-app --show-labels
   ```

2. **Check Prometheus Targets**:
   - Access Prometheus UI
   - Navigate to Status → Targets
   - Check if targets are UP

3. **Check Pod Logs**:
   ```bash
   kubectl logs -n monitoring -l app=prometheus
   ```

4. **Verify Metrics Endpoint**:
   ```bash
   kubectl port-forward <pod-name> 8080:8080
   curl http://localhost:8080/metrics
   ```

### Grafana Not Showing Data

1. **Check Data Source**:
   - Grafana → Configuration → Data Sources
   - Test Prometheus connection

2. **Check Dashboard Queries**:
   - Edit dashboard
   - Verify PromQL queries are correct
   - Check time range

3. **Check Grafana Logs**:
   ```bash
   kubectl logs -n monitoring -l app=grafana
   ```

### High Memory Usage

1. **Reduce Scrape Interval**:
   ```yaml
   scrape_interval: 30s  # Increase from 15s
   ```

2. **Reduce Retention**:
   ```yaml
   --storage.tsdb.retention.time=7d  # Reduce from 30d
   ```

3. **Use PersistentVolume**:
   - Replace EmptyDir with PersistentVolume
   - Better performance and data persistence

### Metrics Not Appearing

1. **Check Application Logs**:
   ```bash
   kubectl logs -l app=node-app
   ```

2. **Verify Metrics Endpoint**:
   ```bash
   curl http://<pod-ip>:8080/metrics
   ```

3. **Check Prometheus Configuration**:
   - Verify scrape configs
   - Check relabel configs
   - Verify service discovery

## Best Practices

### 1. Label Naming

- Use consistent label names
- Avoid high cardinality labels
- Use meaningful label values

### 2. Metric Naming

- Follow Prometheus naming conventions
- Use `_total` suffix for counters
- Use `_seconds` suffix for durations
- Use `_bytes` suffix for sizes

### 3. Retention

- Set appropriate retention periods
- Balance storage costs vs. historical data
- Consider long-term storage (Thanos, Cortex)

### 4. Alerting

- Set meaningful thresholds
- Avoid alert fatigue
- Use different severity levels
- Test alerting rules

### 5. Dashboards

- Keep dashboards focused
- Use appropriate visualizations
- Set reasonable refresh intervals
- Document dashboard purposes

## Production Considerations

### 1. High Availability

- Run Prometheus with multiple replicas
- Use Prometheus Operator for management
- Consider Thanos for long-term storage

### 2. Storage

- Use PersistentVolumes for data persistence
- Consider object storage for long-term retention
- Monitor storage usage

### 3. Security

- Enable authentication for Prometheus
- Use RBAC for Grafana
- Encrypt traffic with TLS
- Restrict network access

### 4. Scaling

- Monitor Prometheus resource usage
- Scale horizontally if needed
- Use federation for large deployments

### 5. Backup

- Backup Prometheus data regularly
- Export Grafana dashboards as JSON
- Document configuration changes

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Node.js Metrics Best Practices](https://prometheus.io/docs/instrumenting/exporters/)

## Summary

The monitoring stack provides:
- **Metrics Collection**: Prometheus scrapes application metrics
- **Visualization**: Grafana dashboards for insights
- **Alerting**: Proactive issue detection
- **Observability**: Full visibility into application behavior
- **Performance Tracking**: Monitor response times and throughput
- **Business Metrics**: Track key business indicators

