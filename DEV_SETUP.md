# Development Setup

Quick guide for local development.

## Prerequisites

- Node.js 20+ installed
- Docker and Docker Compose installed
- Meteor installed (`curl https://install.meteor.com/ | sh`)

## Setup

### 1. Start MongoDB in Docker

```bash
# Start MongoDB container
docker-compose -f docker-compose.dev.yml up -d

# Check it's running
docker-compose -f docker-compose.dev.yml ps

# Or use npm script
npm run docker:dev
```

This starts only MongoDB on port 27019. The Meteor app runs on your local machine for better development experience.

### 2. Install Dependencies

```bash
# Install npm packages
npm install

# Install Meteor packages
meteor npm install
```

### 3. Start Meteor Development Server

```bash
# Start Meteor
npm start

# Or directly
meteor run
```

The app will be available at http://localhost:3000

### 4. Run Load Tests

In another terminal:

```bash
node load-test.js --clients 10 --duration 30000
```

## Development Workflow

### File Changes

Meteor has hot-reload enabled by default. Changes to any file will automatically:
- Rebuild the app
- Refresh the browser

### Database Access

```bash
# Connect to MongoDB (note: using port 27019 for dev)
mongosh mongodb://localhost:27019/ddp-test

# View collections
show collections

# View test results
db.testResults.find().pretty()

# Clear test data
db.testResults.deleteMany({})
db.testSessions.deleteMany({})
```

### View Logs

```bash
# Meteor logs are in the terminal where you ran npm start

# MongoDB logs
docker-compose -f docker-compose.dev.yml logs -f mongo
```

### Restart Services

```bash
# Restart MongoDB
docker-compose -f docker-compose.dev.yml restart

# Restart Meteor (Ctrl+C and npm start again)
```

## Stopping Development

```bash
# Stop Meteor: Ctrl+C in the terminal

# Stop MongoDB
docker-compose -f docker-compose.dev.yml down

# Stop and remove data (WARNING: deletes database)
docker-compose -f docker-compose.dev.yml down -v
```

## Troubleshooting

### Port 27019 Already in Use

Dev MongoDB runs on port 27019 to avoid conflicts with existing MongoDB installations.

```bash
# Check what's using it
lsof -i :27019

# If you need a different port, edit docker-compose.dev.yml:
ports:
  - "27020:27017"  # Change external port

# Then set MONGO_URL environment variable
export MONGO_URL=mongodb://localhost:27020/ddp-test
npm start
```

### Port 3000 Already in Use

```bash
# Run Meteor on different port
meteor run --port 3001

# Or set environment variable
PORT=3001 meteor run
```

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
docker ps

# Test connection (dev uses port 27019)
mongosh mongodb://localhost:27019

# View MongoDB logs
docker-compose -f docker-compose.dev.yml logs mongo
```

### Meteor Build Issues

```bash
# Clear Meteor cache
meteor reset

# Reinstall packages
rm -rf node_modules
npm install
meteor npm install
```

### Permission Issues (Linux)

```bash
# Fix permissions
sudo chown -R $USER:$USER .meteor/local
sudo chown -R $USER:$USER node_modules
```

## IDE Setup

### VS Code

Recommended extensions:
- ESLint
- Prettier
- MongoDB for VS Code

### Cursor

Already has great support for JavaScript/React.

## Testing

### Run All Tests

```bash
# Run with different client counts
node load-test.js --clients 10
node load-test.js --clients 10,50,100
node load-test.js --clients 10,50,100,500

# Custom duration
node load-test.js --clients 10 --duration 60000
```

### Debug Mode

```bash
# Run with debug output
DEBUG=* meteor run

# Or specific namespace
DEBUG=ddp-* meteor run
```

## Performance Tips

### For Better Development Experience

1. **Use Chrome DevTools**
   - Open http://localhost:3000
   - Press F12
   - Network tab shows DDP messages
   - Console shows app logs

2. **MongoDB Compass**
   - Download: https://www.mongodb.com/try/download/compass
   - Connect to: mongodb://localhost:27017
   - Visual database explorer

3. **Fast Refresh**
   - Meteor rebuilds only changed files
   - Keep browser DevTools open to see updates

### Speed Up Meteor

```bash
# Use local package cache
export METEOR_PACKAGE_DIRS=~/.meteor/packages

# Skip tests during development
meteor run --production=false
```

## Common Tasks

### Add a New Package

```bash
# Meteor package
meteor add package-name

# NPM package
meteor npm install package-name
```

### Update Dependencies

```bash
# Update Meteor
meteor update

# Update NPM packages
meteor npm update
```

### Reset Everything

```bash
# Stop everything
docker-compose -f docker-compose.dev.yml down -v
meteor reset

# Start fresh
docker-compose -f docker-compose.dev.yml up -d
npm install
npm start
```

## Environment Variables

Create `.env` in project root (optional):

```env
MONGO_URL=mongodb://localhost:27017/ddp-test
ROOT_URL=http://localhost:3000
PORT=3000
```

## Next Steps

1. ✅ Make changes to code
2. ✅ See changes instantly in browser
3. ✅ Run load tests to verify
4. ✅ Commit and push
5. ✅ Deploy with Docker (see DEPLOYMENT.md)

---

For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md)

