# ==========================================
# STAGE 1: BUILDER
# ==========================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json* ./
RUN npm ci

# Copy configuration schemas and source code
COPY tsconfig.json ./
COPY src/ ./src/

# FORCE FRESH REBUILD FOR VELO COMPILER MATRIX V1
RUN echo "FORCE FRESH REBUILD V2" && npm run build

# ==========================================
# STAGE 2: PRODUCTION RUNNER
# ==========================================
FROM node:20-alpine AS runner

# Set production environment flags
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy package definitions
COPY package.json package-lock.json* ./

# Install ONLY production dependencies to keep the image lean and secure
RUN npm ci --only=production && npm cache clean --force

# Copy compiled source files from the builder stage
COPY --from=builder /app/dist ./dist

# Create a non-root user for security isolation
RUN addgroup -S velogroup && adduser -S velouser -G velogroup
USER velouser

# Expose required network port
EXPOSE 8000

# Optimize Node.js memory limits for high-performance operations
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Command to execute the production server
CMD ["npm", "start"]
