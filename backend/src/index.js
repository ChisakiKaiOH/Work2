import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { router as accountsRouter } from './routes/accounts.js';
import { router as overviewRouter } from './routes/overview.js';
import { startScheduler } from './scheduler.js';
import './db.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/accounts', accountsRouter);
app.use('/api/overview', overviewRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Social Monitor API in ascolto su http://localhost:${port}`);
  startScheduler();
});
