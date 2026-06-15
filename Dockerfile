# ── Stage 1: build React (Vite) ──────────────────────────────────────────────
FROM node:20-alpine AS client-build

WORKDIR /app/client

COPY client/package.json client/package-lock.json client/.npmrc ./
RUN npm ci --legacy-peer-deps

COPY client/index.html client/vite.config.js client/postcss.config.js client/tailwind.config.js ./
COPY client/public ./public
COPY client/src ./src

ENV VITE_API_URL=
RUN npm run build

# ── Stage 2: Express API + static frontend ───────────────────────────────────
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tini

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY Config ./Config
COPY app.js ./
COPY constants ./constants
COPY controllers ./controllers
COPY factories ./factories
COPY middleware ./middleware
COPY model ./model
COPY repositories ./repositories
COPY routers ./routers
COPY seeds ./seeds
COPY services ./services
COPY utils ./utils

COPY --from=client-build /app/client/dist ./client/dist

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=40s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "app.js"]
