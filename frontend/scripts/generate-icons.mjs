// Genera le icone PWA/desktop/Android a partire dall'emblema Shie Hassaikai
// (branding/shie-hassaikai-emblem.png): sfondo nero, fiore bianco con il
// kanji 清 al centro. Usa sharp per ritagliare/ridimensionare.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(__dirname, '..', 'branding', 'shie-hassaikai-emblem.png');
const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const BG = { r: 0, g: 0, b: 0 };

async function squareCrop() {
  return sharp(sourcePath)
    .resize({ width: 768, height: 768, fit: 'cover', position: 'centre' })
    .toBuffer();
}

async function makeStandardIcon(square, size, filename) {
  const buf = await sharp(square).resize(size, size).png().toBuffer();
  fs.writeFileSync(path.join(outDir, filename), buf);
  console.log(`Creata ${filename} (${size}x${size})`);
}

async function makeMaskableIcon(square, size, filename) {
  // Il logo occupa gia' quasi tutto il riquadro: per l'icona "maskable" (Android
  // adaptive icon) lo si ridimensiona al ~62% del canvas cosi' che il fiore non
  // venga tagliato dalla maschera circolare/squircle del launcher.
  const contentSize = Math.round(size * 0.62);
  const content = await sharp(square).resize(contentSize, contentSize).toBuffer();
  const canvas = await sharp({
    create: { width: size, height: size, channels: 3, background: BG },
  })
    .composite([{ input: content, gravity: 'centre' }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(outDir, filename), canvas);
  console.log(`Creata ${filename} (${size}x${size}, maskable)`);
}

const square = await squareCrop();

await makeStandardIcon(square, 192, 'icon-192.png');
await makeStandardIcon(square, 512, 'icon-512.png');
await makeStandardIcon(square, 180, 'apple-touch-icon.png');
await makeStandardIcon(square, 32, 'favicon-32.png');
await makeMaskableIcon(square, 512, 'icon-512-maskable.png');
