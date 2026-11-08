# Render-compatible multi-stage Docker build
FROM node:20-slim AS builder
WORKDIR /app

# This project currently ships bun.lock but no package-lock.json.
# Use npm install (not npm ci) until an npm lockfile is committed.
COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000

COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json
COPY --from=builder /app/firebase-blueprint.json ./firebase-blueprint.json
COPY --from=builder /app/firestore.rules ./firestore.rules

EXPOSE 10000
CMD ["node", "dist/server.cjs"]
