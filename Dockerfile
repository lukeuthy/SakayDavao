# syntax=docker/dockerfile:1

# ---- Build stage: compile the PWA to static files ----
FROM node:20-alpine AS build
WORKDIR /app

# Optional build-time config. Vite inlines VITE_* at build time, so these must
# be present when `npm run build` runs (pass with --build-arg or via compose).
ARG VITE_ROUTES_URL=""
ARG VITE_REALTIME_URL=""
ENV VITE_ROUTES_URL=$VITE_ROUTES_URL \
    VITE_REALTIME_URL=$VITE_REALTIME_URL

# Install deps against the lockfile first (better layer caching).
COPY package*.json ./
RUN npm ci

# Build (copies ONNX wasm, generates icons, vite build → /app/dist).
COPY . .
RUN npm run build

# ---- Runtime stage: serve the static build with nginx ----
FROM nginx:1.27-alpine AS runtime
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
