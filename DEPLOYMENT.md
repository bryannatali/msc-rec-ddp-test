# Server Deployment Guide

Quick guide for deploying to a server with existing MongoDB.

## Scenario 1: Use Existing MongoDB on Server

If you already have MongoDB running on your server (port 27017), use this approach:

### Step 1: Prepare the Application

```bash
# On your local machine, copy files to server
scp -r ./* user@your-server:/path/to/ddp-test/

# Or use git
ssh user@your-server
cd /opt/apps  # or your preferred location
git clone <your-repo>
cd ddp-test
```

### Step 2: Use External MongoDB Compose File

```bash
# Use the external MongoDB compose file
docker-compose -f docker-compose.external-mongo.yml up -d

# Check logs
docker-compose -f docker-compose.external-mongo.yml logs -f
```

The app will connect to your existing MongoDB at `host.docker.internal:27017`.

### Step 3: Configure MongoDB Connection

If your MongoDB has authentication, create a `.env` file:

```bash
cat > .env << EOF
ROOT_URL=http://your-domain.com
PORT=3000
NODE_ENV=production
MONGO_URL=mongodb://username:password@host.docker.internal:27017/ddp-test?authSource=admin
EOF
```

Then update `docker-compose.external-mongo.yml` to use the .env file:

```yaml
app:
  env_file:
    - .env
```

## Scenario 2: Use Containerized MongoDB (Different Port)

If you want to run a separate MongoDB instance in a container:

### Step 1: Deploy with Modified Port

```bash
# The default docker-compose.yml now uses port 27018
docker-compose up -d

# This will:
# - Run MongoDB on port 27018 (avoids conflict with port 27017)
# - App connects to containerized MongoDB
```

### Step 2: Access MongoDB

```bash
# Connect from host
mongosh mongodb://localhost:27018

# Connect from app container
docker exec -it ddp-test-app sh
mongosh mongodb://mongo:27017  # Inside container network
```

## Scenario 3: Use Remote MongoDB

If MongoDB is on a different server:

### Update .env or docker-compose

```bash
# In .env
MONGO_URL=mongodb://username:password@mongodb-server.com:27017/ddp-test
```

Or directly in `docker-compose.external-mongo.yml`:

```yaml
app:
  environment:
    - MONGO_URL=mongodb://username:password@mongodb-server.com:27017/ddp-test
```

## Complete Deployment Steps

### 1. Choose Your MongoDB Option

```bash
# Option A: External MongoDB (recommended if already running)
docker-compose -f docker-compose.external-mongo.yml up -d

# Option B: Containerized MongoDB on port 27018
docker-compose up -d
```

### 2. Verify Application is Running

```bash
# Check containers
docker-compose ps

# Check logs
docker-compose logs -f app

# Test the API
curl http://localhost:3000
```

### 3. Configure Firewall (if needed)

```bash
# Allow port 3000
sudo ufw allow 3000/tcp

# Or if using Nginx proxy
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 4. Set Up Nginx (Optional but Recommended)

Create `/etc/nginx/sites-available/ddp-test`:

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
        
        # WebSocket support for Meteor DDP
        proxy_read_timeout 86400;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/ddp-test /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Set Up SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Update `docker-compose.yml`:

```yaml
environment:
  - ROOT_URL=https://your-domain.com
```

Restart:

```bash
docker-compose restart app
```

## Running Load Tests

### From Server

```bash
# Install Node.js if not already installed
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies
npm install

# Run tests
node load-test.js --clients 10,50,100,500
```

### From Local Machine

```bash
# Test remote server by specifying the URL
node load-test.js --server http://your-server-ip:3000

# Or with domain
node load-test.js --server https://your-domain.com

# With custom options
node load-test.js --server http://192.168.1.100:3000 --clients 10,50 --duration 30000
```

## Monitoring

### View Logs

```bash
# App logs
docker-compose logs -f app

# All logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100 app
```

### Check Resources

```bash
# Container stats
docker stats ddp-test-app

# Disk usage
docker system df
```

### Check MongoDB

```bash
# If using containerized MongoDB
docker exec -it ddp-test-mongo mongosh

# If using external MongoDB
mongosh mongodb://localhost:27017/ddp-test
```

Inside MongoDB shell:

```javascript
// Check database
use ddp-test
show collections

// Count test results
db.testResults.countDocuments()

// View latest results
db.testResults.find().sort({timestamp: -1}).limit(1).pretty()
```

## Maintenance

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose build
docker-compose up -d

# Or in one command
docker-compose up -d --build
```

### Backup Data

```bash
# If using containerized MongoDB
docker exec ddp-test-mongo mongodump --out /data/backup
docker cp ddp-test-mongo:/data/backup ./mongodb-backup-$(date +%Y%m%d)

# If using external MongoDB
mongodump --host localhost --port 27017 --db ddp-test --out ./mongodb-backup-$(date +%Y%m%d)
```

### Restore Data

```bash
# Containerized
docker cp ./mongodb-backup ddp-test-mongo:/data/backup
docker exec ddp-test-mongo mongorestore /data/backup

# External
mongorestore --host localhost --port 27017 --db ddp-test ./mongodb-backup
```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Clean up Docker system
docker system prune -a
```

## Troubleshooting

### Can't Connect to MongoDB

```bash
# Check if MongoDB is accessible
mongosh mongodb://localhost:27017

# Test from Docker container
docker run --rm mongo:7 mongosh mongodb://host.docker.internal:27017/ddp-test

# Check network
docker network inspect ddp-test_ddp-network
```

### Port Already in Use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# Change the port in docker-compose.yml
ports:
  - "8080:3000"  # External:Internal

# Restart
docker-compose up -d
```

### Permission Denied

```bash
# Fix permissions
sudo chown -R $USER:$USER .
sudo chmod -R 755 .
```

## Quick Reference

### Commands

```bash
# Start (external MongoDB)
docker-compose -f docker-compose.external-mongo.yml up -d

# Start (containerized MongoDB)
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart app

# View logs
docker-compose logs -f app

# Shell into container
docker exec -it ddp-test-app sh

# Run load tests
node load-test.js
```

### Files to Configure

- **MongoDB Connection**: `.env` or `docker-compose.yml` → `MONGO_URL`
- **Domain**: `docker-compose.yml` → `ROOT_URL`
- **Port**: `docker-compose.yml` → `ports`
- **Test Server URL**: `imports/config/testConfig.js` → `serverUrl`

---

For more details, see [DOCKER.md](./DOCKER.md) and [README.md](./README.md).

