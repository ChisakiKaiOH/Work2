import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { router as accountsRouter } from './routes/accounts.js';
import { router as overviewRouter } from './routes/overview.js';
import { startScheduler } from './scheduler.js';
import './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Se il backend e' esposto su internet (es. Fly.io) senza questa chiave
// impostata, chiunque trovi l'URL potrebbe leggere/modificare i dati: quando
// SHIE_API_KEY e' configurata, le richieste API devono includere lo stesso
// valore nell'header X-Api-Key. In locale/demo (nessuna variabile impostata)
// il comportamento resta invariato e aperto, com'era prima.
function requireApiKey(req, res, next) {
  const expected = process.env.SHIE_API_KEY;
  if (!expected || req.get('X-Api-Key') === expected) return next();
  res.status(401).json({ error: 'Chiave API mancante o non valida' });
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.use('/api', requireApiKey);
  app.use('/api/accounts', accountsRouter);
  app.use('/api/overview', overviewRouter);

  // Se presente una build del frontend (frontend/dist), la serve dalla stessa
  // origine dell'API: comodo per l'installer Electron e per l'uso da rete
  // locale (es. da telefono verso il PC) senza dover configurare un proxy separato.
  const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get(/^(?!\/api\/).*/, (req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  return app;
}

export function startServer({ port, host } = {}) {
  const app = createApp();
  const resolvedPort = Number(port ?? process.env.PORT ?? 4000);
  const resolvedHost = host ?? process.env.HOST ?? '0.0.0.0';
  return new Promise((resolve, reject) => {
    const server = app.listen(resolvedPort, resolvedHost, () => {
      console.log(`Shie Hassaikai Application in ascolto su http://localhost:${resolvedPort}`);
      console.log("Raggiungibile anche da altri dispositivi sulla stessa rete tramite l'IP di questo PC.");
      startScheduler();
      resolve({ server, port: resolvedPort, host: resolvedHost });
    });
    server.on('error', reject);
  });
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  startServer();
}
