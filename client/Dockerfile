# syntax=docker/dockerfile:1

# ---- Build stage: compile the PWA to static files ----
FROM node:20-alpine AS build
WORKDIR /app

# Optional build-time config. Vite inlines VITE_* at build time, so these must
# be present when the build runs (pass with --build-arg or via compose).
# NOTE: VITE_CONTRIBUTIONS_API_URL can also be baked here if you serve this image
# instead of Amplify — add an ARG/ENV pair for it the same way.
ARG VITE_ROUTES_URL=""
ARG VITE_REALTIME_URL=""
ARG VITE_CONTRIBUTIONS_API_URL=""
ENV VITE_ROUTES_URL=$VITE_ROUTES_URL \
    VITE_REALTIME_URL=$VITE_REALTIME_URL \
    VITE_CONTRIBUTIONS_API_URL=$VITE_CONTRIBUTIONS_API_URL

# This project uses pnpm (pnpm-lock.yaml is the source of truth). Corepack ships
# with Node 20 and pins the pnpm version from package.json's packageManager field.
RUN corepack enable

# Install deps against the frozen lockfile first (better layer caching).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Build (copies ONNX wasm, generates icons, vite build → /app/dist).
COPY . .
RUN pnpm run build

# ---- Runtime stage: serve the static build with nginx ----
FROM nginx:1.27-alpine AS runtime
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
