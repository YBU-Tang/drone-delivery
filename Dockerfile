# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY apps/*/package*.json ./apps/

# Install all dependencies
RUN npm ci --workspaces

# Copy source
COPY apps/ ./apps/

# Build admin app
RUN npm run build -w apps/admin

# Build merchant app
RUN npm run build -w apps/merchant

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install serve to serve static files
RUN npm install -g serve

# Copy built assets from builder
COPY --from=builder /app/apps/admin/dist ./dist/admin
COPY --from=builder /app/apps/merchant/dist ./dist/merchant

# Copy and install server
COPY --from=builder /app/apps/server/package*.json ./server/
COPY --from=builder /app/apps/server/src ./server/src

WORKDIR /app/server
RUN npm ci --only=production

# Server runs on 3001
EXPOSE 3001

CMD ["node", "src/index.js"]
