# Dockerfile for Meteor DDP Performance Testing App
FROM node:20-alpine AS builder

# Install Meteor
RUN apk add --no-cache curl bash && \
    curl https://install.meteor.com/ | sh

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .meteor ./.meteor

# Install dependencies
RUN meteor npm install

# Copy application source
COPY . .

# Build the Meteor app
RUN meteor build --server-only --directory /build

# Production image
FROM node:20-alpine

# Install dependencies for Puppeteer if running load tests in container
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Set working directory
WORKDIR /app

# Copy built app from builder
COPY --from=builder /build/bundle /app

# Install production dependencies
WORKDIR /app/programs/server
RUN npm install --production

# Go back to app directory
WORKDIR /app

# Create directory for test results
RUN mkdir -p /app/test-results

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV ROOT_URL=http://localhost:3000
ENV MONGO_URL=mongodb://mongo:27017/ddp-test

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the app
CMD ["node", "main.js"]

