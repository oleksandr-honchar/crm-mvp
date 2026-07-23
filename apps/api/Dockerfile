# apps/api/Dockerfile
FROM node:22-slim AS builder
WORKDIR /app

# Copy workspace root files first (better layer caching)
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm install --workspace=apps/api

COPY apps/api ./apps/api
RUN npm run build --workspace=apps/api

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 3000
CMD ["node", "apps/api/dist/src/main.js"]