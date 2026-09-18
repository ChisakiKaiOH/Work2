// Copia backend/src e la build del frontend dentro electron/ prima del
// packaging: electron-builder impacchetta solo file interni alla cartella del
// progetto, e cosi' facendo il codice del backend risolve le sue dipendenze
// (express, better-sqlite3, ...) da electron/node_modules -- che
// electron-builder ricompila per l'ABI di Electron -- invece che da
// backend/node_modules (compilato per il Node.js di sistema).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const electronRoot = path.join(__dirname, '..');
const repoRoot = path.join(electronRoot, '..');

function copyDir(from, to) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`Copiato ${path.relative(repoRoot, from)} -> ${path.relative(repoRoot, to)}`);
}

const frontendDist = path.join(repoRoot, 'frontend', 'dist');
if (!fs.existsSync(frontendDist)) {
  console.error('frontend/dist non trovato: esegui prima "npm run build" in frontend/.');
  process.exit(1);
}

copyDir(path.join(repoRoot, 'backend', 'src'), path.join(electronRoot, 'backend', 'src'));
// Node determina se un .js e' ESM o CommonJS dal "type" nel package.json piu'
// vicino: senza questo file (non copiato insieme a src/) userebbe quello di
// electron/, che e' CommonJS, e "import" romperebbe in fase di parsing.
fs.writeFileSync(
  path.join(electronRoot, 'backend', 'package.json'),
  JSON.stringify({ type: 'module' }, null, 2)
);
copyDir(frontendDist, path.join(electronRoot, 'frontend', 'dist'));
copyDir(
  path.join(repoRoot, 'frontend', 'public', 'icons'),
  path.join(electronRoot, 'frontend', 'public', 'icons')
);
