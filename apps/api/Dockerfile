# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for dependency resolution
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies with increased timeout and memory
RUN pnpm config set network-timeout 300000 && \
    pnpm install --frozen-lockfile --prefer-offline --no-audit

# Copy only necessary source code
COPY apps/api/src ./apps/api/src
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/tsconfig.json ./apps/api/
COPY packages/shared/src ./packages/shared/src

# Generate Prisma client
RUN cd apps/api && pnpm prisma:generate

# Expose port
EXPOSE 5000

# Set working directory to API
WORKDIR /app/apps/api

# Start the application in development mode
CMD ["pnpm", "dev"]