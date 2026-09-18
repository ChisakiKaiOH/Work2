# Social Monitor

Applicazione per tenere monitorati in un'unica dashboard i tuoi account su piu'
social network: X/Twitter, Instagram, YouTube, Facebook e TikTok.

Per ogni account traccia nel tempo follower, following, numero di post ed
engagement rate, oltre a un feed dei post recenti con like/commenti/condivisioni.

## Architettura

```
backend/    API Node.js + Express, storage SQLite, scheduler periodico
frontend/   Dashboard React (Vite) con grafici (Recharts)
```

Il backend usa un **adapter per piattaforma** (`backend/src/adapters/`). Ogni
adapter, se configurato con le relative credenziali API nel `.env`, recupera
dati reali; se non configurato (o se la chiamata fallisce), l'account ricade
automaticamente sull'**adapter demo**, che genera metriche e post plausibili
in modo deterministico, cosi' l'app e' subito utilizzabile senza alcuna chiave
API.

| Piattaforma | API reale supportata | Note |
|---|---|---|
| X / Twitter | API v2 (`TWITTER_BEARER_TOKEN`) | serve un Bearer Token |
| Instagram | Graph API (`INSTAGRAM_ACCESS_TOKEN`) | richiede account Business/Creator collegato a una Pagina FB; l'handle e' l'IG User ID |
| YouTube | Data API v3 (`YOUTUBE_API_KEY`) | l'handle e' il channel ID (`UC...`) o `@handle` |
| Facebook | Graph API (`FACEBOOK_ACCESS_TOKEN`) | l'handle e' il Page ID |
| TikTok | non disponibile | non esiste una API pubblica di sola lettura per metriche account; resta in modalita' demo |

## Avvio in locale

Richiede Node.js 18+.

### Backend

```bash
cd backend
npm install
cp .env.example .env   # opzionale: aggiungi le tue chiavi API reali
npm start               # API su http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev              # dashboard su http://localhost:5173
```

Il dev server del frontend fa da proxy verso `/api` sul backend (vedi
`frontend/vite.config.js`), quindi bastano i due comandi sopra in due terminali
separati.

## Uso

1. Apri la dashboard e usa il form "Aggiungi un account" scegliendo piattaforma
   e handle/username (o l'ID richiesto dalla relativa API, vedi tabella sopra).
2. Premi **Aggiorna** su un account per recuperare la prima istantanea di
   metriche e post.
3. Apri **Dettagli** per vedere l'andamento dei follower nel tempo e il feed
   dei post recenti.
4. In background, lo scheduler (`POLL_INTERVAL_MINUTES` nel `.env`, default 60)
   raccoglie automaticamente nuove istantanee per tutti gli account monitorati,
   cosi' il grafico storico si popola da solo.

## Estendere l'app

- Aggiungere una piattaforma: creare un nuovo file in `backend/src/adapters/`
  con `isConfigured()`, `fetchMetrics(account)` e `fetchRecentPosts(account, limit)`,
  registrarlo in `backend/src/adapters/index.js` e aggiungere la piattaforma
  all'array `PLATFORMS`; nel frontend aggiungere una voce a
  `frontend/src/platforms.js`.
- I dati sono salvati in SQLite (`backend/data/social-monitor.db`), quindi
  persistono tra i riavvii.
