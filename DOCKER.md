# Docker Deployment Guide

Complete guide for deploying the DDP Performance Testing application using Docker.

## Quick Start

### Production Deployment (with containerized MongoDB on port 27018)

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f app

# Run load tests (from host machine)
node load-test.js --clients 10 --duration 30000

# Stop the application
docker-compose down
```

### Using Existing MongoDB (recommended if MongoDB already running)

```bash
# Use external MongoDB compose file
docker-compose -f docker-compose.external-mongo.yml up -d

# View logs
docker-compose -f docker-compose.external-mongo.yml logs -f app

# Stop
docker-compose -f docker-compose.external-mongo.yml down
```

**Note**: MongoDB port has been changed to **27018** in the default `docker-compose.yml` to avoid conflicts with existing MongoDB installations. See [DEPLOYMENT.md](./DEPLOYMENT.md) for server deployment guide.

### Development Mode

```bash
# Run in development mode with hot reload
docker-compose -f docker-compose.dev.yml up

# Stop
docker-compose -f docker-compose.dev.yml down
```

## Production Deployment

### 1. Build the Docker Image

```bash
# Build the image
docker-compose build

# Or build manually
docker build -t ddp-test:latest .
```

### 2. Start Services

```bash
# Start all services (app + MongoDB)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Access the Application

- **Dashboard**: http://localhost:3000
- **API Endpoint**: http://localhost:3000/api/test

### 4. Run Load Tests

The load tests run from the host machine (or another container):

```bash
# Make sure the server is running
curl http://localhost:3000

# Run tests
node load-test.js

# Or with custom parameters
node load-test.js --clients 10,50,100 --duration 60000
```

## Server Deployment

### Deploy to Remote Server

1. **Copy files to server**:

```bash
# Copy entire project
scp -r ./* user@your-server:/path/to/ddp-test/

# Or use git
ssh user@your-server
cd /path/to/ddp-test
git pull
```

2. **Build and run on server**:

```bash
ssh user@your-server
cd /path/to/ddp-test

# Build and start
docker-compose up -d

# Check logs
docker-compose logs -f app
```

3. **Update ROOT_URL for your domain**:

Edit `docker-compose.yml`:

```yaml
environment:
  - ROOT_URL=https://your-domain.com
  - MONGO_URL=mongodb://mongo:27017/ddp-test
```

### Using Docker Compose with Custom Port

```yaml
services:
  app:
    ports:
      - "8080:3000" # External:Internal
```

### Environment Variables

Configure in `docker-compose.yml` or create `.env` file:

```env
ROOT_URL=http://localhost:3000
MONGO_URL=mongodb://mongo:27017/ddp-test
PORT=3000
NODE_ENV=production
```

## Running Load Tests in Docker

If you want to run load tests from within a container:

### Option 1: Run from Host

```bash
# Install dependencies locally
npm install

# Run tests against containerized app
node load-test.js
```

### Option 2: Create Load Test Container

```bash
# Run load tests in a container
docker run --rm \
  --network ddp-test_ddp-network \
  -v $(pwd)/test-results:/app/test-results \
  -w /app \
  node:20-alpine \
  sh -c "apk add --no-cache chromium && npm install && node load-test.js --clients 10"
```

### Option 3: Add to docker-compose

Add to `docker-compose.yml`:

```yaml
load-test:
  build:
    context: .
    dockerfile: Dockerfile
  container_name: ddp-test-loader
  command: node load-test.js --clients 10,50,100,500
  environment:
    - CONFIG_SERVER_URL=http://app:3000
  depends_on:
    - app
  networks:
    - ddp-network
  volumes:
    - ./test-results:/app/test-results
  profiles:
    - testing
```

Run with:

```bash
docker-compose --profile testing up load-test
```

## Nginx Reverse Proxy (Optional)

For production deployment with SSL:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support for DDP
        proxy_read_timeout 86400;
    }
}
```

## Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Only app
docker-compose logs -f app

# Only MongoDB
docker-compose logs -f mongo

# Last 100 lines
docker-compose logs --tail=100 app
```

### Health Checks

```bash
# Check app health
curl http://localhost:3000

# Check MongoDB
docker exec ddp-test-mongo mongosh --eval "db.adminCommand('ping')"

# Check Docker health status
docker-compose ps
```

### Resource Usage

```bash
# Monitor containers
docker stats

# Inspect specific container
docker inspect ddp-test-app
```

## Data Management

### MongoDB Backup

```bash
# Backup database
docker exec ddp-test-mongo mongodump --out /data/backup

# Copy backup to host
docker cp ddp-test-mongo:/data/backup ./mongodb-backup
```

### MongoDB Restore

```bash
# Copy backup to container
docker cp ./mongodb-backup ddp-test-mongo:/data/backup

# Restore
docker exec ddp-test-mongo mongorestore /data/backup
```

### Clear Test Results

```bash
# From container
docker exec ddp-test-mongo mongosh ddp-test --eval "db.testResults.deleteMany({})"

# Or from dashboard (browser console)
Meteor.call('testResults.clear')
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Check if port is in use
lsof -i :3000

# Restart services
docker-compose restart
```

### Connection Refused

```bash
# Check if containers are running
docker-compose ps

# Check network
docker network ls
docker network inspect ddp-test_ddp-network

# Test connectivity
docker exec ddp-test-app ping mongo
```

### MongoDB Issues

```bash
# Restart MongoDB
docker-compose restart mongo

# Reset MongoDB data (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

### Load Test Issues

```bash
# Check if server is accessible
curl http://localhost:3000

# Check API endpoint
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"method":"testSession.start","params":[10]}'

# Run with verbose logging
DEBUG=* node load-test.js
```

### Performance Issues

```bash
# Increase container resources
docker-compose down
docker-compose up -d --scale app=1 --memory=2g --cpus=2
```

## Cleanup

### Stop and Remove Everything

```bash
# Stop containers
docker-compose down

# Stop and remove volumes (deletes database)
docker-compose down -v

# Remove images
docker rmi ddp-test:latest

# Complete cleanup
docker system prune -a --volumes
```

## Production Checklist

- [ ] Update `ROOT_URL` to your domain
- [ ] Configure MongoDB authentication
- [ ] Set up SSL/TLS (use Nginx + Let's Encrypt)
- [ ] Configure firewall rules
- [ ] Set up automatic backups
- [ ] Configure log rotation
- [ ] Set up monitoring/alerts
- [ ] Test failover scenarios
- [ ] Document recovery procedures
- [ ] Configure resource limits

## Security Hardening

### MongoDB Authentication

Update `docker-compose.yml`:

```yaml
mongo:
  environment:
    - MONGO_INITDB_ROOT_USERNAME=admin
    - MONGO_INITDB_ROOT_PASSWORD=secure_password

app:
  environment:
    - MONGO_URL=mongodb://admin:secure_password@mongo:27017/ddp-test?authSource=admin
```

### Network Security

```yaml
networks:
  ddp-network:
    driver: bridge
    internal: false # Set to true to disable external access
```

## Performance Tuning

### MongoDB Configuration

Create `mongod.conf`:

```yaml
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1
net:
  maxIncomingConnections: 1000
```

Mount in docker-compose:

```yaml
mongo:
  volumes:
    - ./mongod.conf:/etc/mongod.conf
```

### Node.js Tuning

```yaml
app:
  environment:
    - NODE_OPTIONS=--max-old-space-size=2048
```

## Advanced Usage

### Multi-Stage Deployments

```bash
# Production
docker-compose -f docker-compose.yml up -d

# Staging
docker-compose -f docker-compose.staging.yml up -d

# Development
docker-compose -f docker-compose.dev.yml up
```

### Container Orchestration

For Kubernetes deployment, see `k8s/` directory (if needed, can create separate guide).

---

For more information, see the main [README.md](./README.md).
