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

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/accounts', accountsRouter);
  app.use('/api/overview', overviewRouter);

  app.get('/api/health', (req, res) => res.json({ ok: true }));

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
