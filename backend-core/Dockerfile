# ==========================================
# STAGE 1: BUILDER
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ==========================================
# STAGE 2: PRODUCTION RUNNER
# ==========================================
FROM node:20-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY db ./db

# Persistent document storage volume (uploads)
RUN mkdir -p /app/uploads && chown -R node:node /app
VOLUME ["/app/uploads"]
ENV UPLOAD_ROOT_DIR=/app/uploads

# Non-root user for security isolation
USER node

EXPOSE 8000

ENV NODE_OPTIONS="--max-old-space-size=2048"

CMD ["npm", "start"]
