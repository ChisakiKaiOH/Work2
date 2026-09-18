# Immagine per ospitare Shie Hassaikai Application (API + dashboard) su un
# host cloud sempre raggiungibile (es. Fly.io), cosi' l'app Android e la PWA
# funzionano ovunque, anche in 4G/5G, non solo sulla rete locale del PC.

# --- Stage 1: build della dashboard web ---
FROM node:22-slim AS frontend-build
WORKDIR /app/frontend
# Se il deploy imposta SHIE_API_KEY (vedi stage successivo), la dashboard
# servita da questo stesso host deve incorporare la stessa chiave per poter
# chiamare la propria API pubblica senza che l'utente debba inserirla a mano.
ARG VITE_API_KEY=""
ENV VITE_API_KEY=$VITE_API_KEY
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# --- Stage 2: backend + dashboard buildata, pronto per l'esecuzione ---
FROM node:22-slim
WORKDIR /app/backend
ENV NODE_ENV=production
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY backend/src ./src
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Stesso meccanismo usato dal wrapper Electron: il DB SQLite va scritto fuori
# dal codice dell'app, in un percorso che nel deploy cloud e' il volume
# persistente montato da fly.toml.
ENV SHIE_DATA_DIR=/data
ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080

CMD ["node", "src/index.js"]
