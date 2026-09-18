# Shie Hassaikai Application

Applicazione per tenere monitorati in un'unica dashboard i tuoi account su piu'
social network: X/Twitter, Instagram, YouTube, Facebook e TikTok.

Per ogni account traccia nel tempo follower, following, numero di post ed
engagement rate, oltre a un feed dei post recenti con like/commenti/condivisioni.

Installabile e avviabile su **PC** (come PWA dal browser oppure come vero
programma desktop via Electron) e su **Android** (PWA dal browser, o app
nativa via Capacitor).

## Architettura

```
backend/    API Node.js + Express, storage SQLite, scheduler periodico
frontend/   Dashboard React (Vite) con grafici (Recharts), PWA installabile
electron/   Wrapper desktop (Electron) che impacchetta backend + frontend in un installer
frontend/android/  Progetto nativo Android (Capacitor) generato dal frontend
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

Richiede Node.js 18+ per tutti i comandi seguenti.

## 1. PC - avvio rapido dal browser (PWA)

Il modo piu' veloce per provare l'app: backend e frontend nella stessa
origine, installabile come programma dal browser (Chrome/Edge: icona
"Installa" nella barra degli indirizzi).

```bash
cd backend && npm install && cp .env.example .env && cd ..
cd frontend && npm install && npm run build && cd ..
cd backend && npm start   # http://localhost:4000
```

Apri `http://localhost:4000`, poi usa "Installa app" dal menu del browser:
l'app compare come programma a se stante, con icona propria, senza barra
degli indirizzi.

Per sviluppo con hot-reload invece: `npm run dev` in `frontend/` (proxy
automatico verso il backend su `:4000`, vedi `frontend/vite.config.js`) e
`npm start` in `backend/` in un altro terminale.

## 2. PC - installer desktop nativo (Electron)

Genera un vero eseguibile installabile (AppImage su Linux, `.exe` NSIS su
Windows, `.dmg` su macOS), con backend incluso: nessun terminale da aprire,
si avvia come qualsiasi altro programma.

```bash
cd backend && npm install && cd ..
cd frontend && npm install && npm run build && cd ..
cd electron && npm install
npm run dist:linux   # oppure dist:win / dist:mac / dist (piattaforma corrente)
```

L'installer/pacchetto finale si trova in `electron/release/`. I dati
(database SQLite) vengono salvati nella cartella dati utente del sistema
operativo (non dentro la cartella di installazione), quindi l'app puo'
scrivere anche se installata in una posizione protetta.

Nota: `dist:win` e `dist:mac` producono un pacchetto per Windows/macOS solo
se eseguiti su (o con toolchain per) quel sistema operativo; costruiscili
sulla piattaforma di destinazione o tramite una pipeline CI multi-OS.

## 3. Android - PWA (consigliato, nessun SDK richiesto)

Se il telefono e il PC sono sulla stessa rete Wi-Fi:

1. Avvia il backend sul PC come al punto 1 (`npm start` in `backend/`, con
   `frontend/dist` gia' buildato).
2. Trova l'IP locale del PC (es. `192.168.1.x`).
3. Sul telefono, apri Chrome su `http://<ip-del-pc>:4000`.
4. Menu Chrome -> "Installa app" (o "Aggiungi a schermata Home"): l'app
   compare come icona a se stante, a schermo intero.

## 4. Android - app nativa (Capacitor, richiede Android Studio)

Il progetto nativo Android e' gia' generato in `frontend/android/` (icone e
splash screen basati sul logo incluse). Per costruire davvero l'APK serve
Android Studio / SDK sulla propria macchina (non disponibili in questo
ambiente di sviluppo remoto, dove il repository Maven di Google e'
irraggiungibile).

L'app nativa carica un pacchetto web statico e non ha un server locale sul
telefono: va quindi puntata all'indirizzo del backend sul PC in fase di
build, impostando `VITE_API_BASE`:

```bash
cd frontend
npm install
VITE_API_BASE="http://<ip-del-pc>:4000/api" npm run android:sync
npm run android:open   # apre il progetto in Android Studio
```

Da Android Studio: "Build > Build Bundle(s)/APK(s) > Build APK(s)", oppure
da riga di comando (su una macchina con SDK Android configurato):

```bash
cd frontend/android
./gradlew assembleDebug
# APK generato in android/app/build/outputs/apk/debug/app-debug.apk
```

Copia l'APK sul telefono e installalo (abilitando "Origini sconosciute" se
richiesto), oppure usa `adb install app-debug.apk`.

## Uso della dashboard

1. Apri la dashboard e usa il form "Aggiungi un account" scegliendo piattaforma
   e handle/username (o l'ID richiesto dalla relativa API, vedi tabella sopra).
2. Premi **Aggiorna** su un account per recuperare la prima istantanea di
   metriche e post.
3. Apri **Dettagli** per vedere l'andamento dei follower nel tempo e il feed
   dei post recenti.
4. In background, lo scheduler (`POLL_INTERVAL_MINUTES` nel `.env`, default 60)
   raccoglie automaticamente nuove istantanee per tutti gli account monitorati,
   cosi' il grafico storico si popola da solo.

## Branding

Il logo (`frontend/branding/shie-hassaikai-emblem.png`) genera tutte le
icone dell'app:

```bash
cd frontend
npm run generate-icons   # icone PWA in public/icons/
npx capacitor-assets generate --android \
  --iconBackgroundColor '#000000' --iconBackgroundColorDark '#000000' \
  --splashBackgroundColor '#000000' --splashBackgroundColorDark '#000000'
```

## Estendere l'app

- Aggiungere una piattaforma: creare un nuovo file in `backend/src/adapters/`
  con `isConfigured()`, `fetchMetrics(account)` e `fetchRecentPosts(account, limit)`,
  registrarlo in `backend/src/adapters/index.js` e aggiungere la piattaforma
  all'array `PLATFORMS`; nel frontend aggiungere una voce a
  `frontend/src/platforms.js`.
- I dati sono salvati in SQLite (`backend/data/shie-hassaikai.db` in locale,
  o nella cartella dati utente del sistema operativo quando in esecuzione
  tramite l'app Electron), quindi persistono tra i riavvii.
