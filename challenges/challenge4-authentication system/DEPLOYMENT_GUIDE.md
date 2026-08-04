# Deployment Guide

## Production Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates obtained
- [ ] Domain configured
- [ ] Backup strategy in place
- [ ] Monitoring tools set up

## Deployment Options

### Option 1: Docker Compose (Recommended)

**Best for:** Small to medium deployments, single server

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### 2. Application Deployment

```bash
# Clone repository
git clone https://github.com/yourusername/collab-platform.git
cd collab-platform

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET

# Build and start
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Check status
docker-compose ps
docker-compose logs -f
```

#### 3. Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/collab-platform

server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/collab-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 4. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

### Option 2: Kubernetes

**Best for:** Large scale deployments, high availability

#### Prerequisites

- Kubernetes cluster (EKS, GKE, AKS, or self-hosted)
- kubectl configured
- Helm 3 installed

#### 1. Create Kubernetes Manifests

**namespace.yaml:**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: collab-platform
```

**secrets.yaml:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: collab-platform
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:pass@postgres:5432/db"
  JWT_SECRET: "your-jwt-secret"
  JWT_REFRESH_SECRET: "your-refresh-secret"
  GOOGLE_CLIENT_ID: "your-google-client-id"
  GOOGLE_CLIENT_SECRET: "your-google-client-secret"
```

**postgres-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: collab-platform
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        env:
        - name: POSTGRES_DB
          value: "collaborative_platform"
        - name: POSTGRES_USER
          value: "postgres"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: POSTGRES_PASSWORD
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: collab-platform
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

**backend-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: collab-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: yourregistry/collab-backend:latest
        envFrom:
        - secretRef:
            name: app-secrets
        ports:
        - containerPort: 3001
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: collab-platform
spec:
  selector:
    app: backend
  ports:
  - port: 3001
    targetPort: 3001
  type: ClusterIP
```

**frontend-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: collab-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: yourregistry/collab-frontend:latest
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "https://yourdomain.com/api"
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: collab-platform
spec:
  selector:
    app: frontend
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

**ingress.yaml:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: collab-ingress
  namespace: collab-platform
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/websocket-services: "backend"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - yourdomain.com
    secretName: collab-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 3001
      - path: /socket.io
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 3001
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
```

#### 2. Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f redis-deployment.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f ingress.yaml

# Check deployment
kubectl get pods -n collab-platform
kubectl get services -n collab-platform
kubectl get ingress -n collab-platform

# View logs
kubectl logs -f deployment/backend -n collab-platform
```

### Option 3: Cloud Platform (AWS, GCP, Azure)

#### AWS Deployment

1. **Set up RDS for PostgreSQL**
2. **Set up ElastiCache for Redis**
3. **Deploy to ECS or EKS**
4. **Configure ALB for load balancing**
5. **Set up CloudFront for CDN**
6. **Configure Route53 for DNS**

#### GCP Deployment

1. **Set up Cloud SQL for PostgreSQL**
2. **Set up Memorystore for Redis**
3. **Deploy to Cloud Run or GKE**
4. **Set up Cloud Load Balancing**
5. **Configure Cloud CDN**
6. **Set up Cloud DNS**

## Database Backup

### Automated Backups

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Create backup
docker-compose exec -T postgres pg_dump -U postgres collaborative_platform > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Delete old backups (keep last 7 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# Upload to S3 (optional)
aws s3 cp "$BACKUP_FILE.gz" s3://your-bucket/backups/
```

Schedule with cron:
```bash
0 2 * * * /path/to/backup.sh
```

### Restore from Backup

```bash
# Stop application
docker-compose down

# Restore database
gunzip -c backup_20240101_020000.sql.gz | docker-compose exec -T postgres psql -U postgres collaborative_platform

# Start application
docker-compose up -d
```

## Monitoring

### Prometheus & Grafana

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  prometheus_data:
  grafana_data:
```

### Log Aggregation

Consider using:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Loki + Grafana
- Cloud provider logging (CloudWatch, Cloud Logging)

## Performance Tuning

### PostgreSQL

```sql
-- Increase connection pool
ALTER SYSTEM SET max_connections = '200';

-- Improve query performance
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';
ALTER SYSTEM SET checkpoint_completion_target = '0.9';
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = '100';
ALTER SYSTEM SET random_page_cost = '1.1';
ALTER SYSTEM SET effective_io_concurrency = '200';
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET min_wal_size = '2GB';
ALTER SYSTEM SET max_wal_size = '8GB';
```

### Redis

```bash
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### Node.js

```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096"

# Enable cluster mode
PM2_INSTANCES=max
```

## Troubleshooting

### Check Logs

```bash
# Docker Compose
docker-compose logs -f backend
docker-compose logs -f frontend

# Kubernetes
kubectl logs -f deployment/backend -n collab-platform
kubectl logs -f deployment/frontend -n collab-platform
```

### Database Connection Issues

```bash
# Test connection
docker-compose exec backend npx prisma db push --preview-feature

# Check PostgreSQL logs
docker-compose logs postgres
```

### Memory Issues

```bash
# Check container stats
docker stats

# Increase memory limits in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
```

## Support

For deployment support:
- Email: devops@yourapp.com
- Slack: #deployment-support
- Documentation: https://docs.yourapp.com/deployment