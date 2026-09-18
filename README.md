# Shie Hassaikai Application

Applicazione per tenere monitorati in un'unica dashboard i tuoi account su piu'
social network: X/Twitter, Instagram, YouTube, Facebook e TikTok.

Per ogni account traccia nel tempo follower, following, numero di post ed
engagement rate, oltre a un feed dei post recenti con like/commenti/condivisioni.

Pensata per essere installata su **Windows** (installer desktop nativo, via
Electron) e su **Android** (PWA dal browser o app nativa via Capacitor).

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

Richiede Node.js 18+ sulla macchina dove si costruisce l'app (non serve nulla
di piu' su Windows una volta generato l'installer).

## 1. Windows - installer desktop nativo (consigliato)

Genera un vero programma installabile per Windows (`.exe`, installer NSIS)
con il backend incluso: una volta installato si avvia come qualsiasi altro
programma, nessun terminale ne' server da avviare a mano.

Da una macchina Windows con Node.js 18+ installato, nella cartella del
progetto:

```bat
cd backend && npm install && cd ..
cd frontend && npm install && npm run build && cd ..
cd electron && npm install
npm run dist:win
```

L'installer finale (`Shie Hassaikai Application Setup 1.0.0.exe`) si trova in
`electron/release/`. Distribuiscilo/eseguilo sulla macchina Windows di
destinazione: l'installazione crea un collegamento come qualunque altro
programma. I dati (database SQLite) vengono salvati nella cartella dati
utente di Windows (`%APPDATA%`), non dentro la cartella di installazione.

Questa pipeline (electron-builder + il wrapper in `electron/`) e' stata
verificata end-to-end in fase di sviluppo: il pacchetto Windows x64 generato
e' stato eseguito con successo (tramite Wine, per la verifica in ambiente
Linux) confermando che backend, database SQLite e interfaccia si avviano
correttamente nel binario impacchettato.

> Nota: la build va prodotta su Windows (o con una toolchain equivalente, es.
> una pipeline CI Windows) perche' l'installer NSIS incorpora binari nativi
> specifici della piattaforma di destinazione.

### Alternativa rapida: PWA dal browser (utile per test veloci su PC)

```bash
cd backend && npm install && copy .env.example .env
cd frontend && npm install && npm run build
cd ../backend && npm start   # http://localhost:4000
```

Apri `http://localhost:4000` in Chrome/Edge e usa "Installa app" dalla barra
degli indirizzi: nessuna build Electron necessaria, utile per provare l'app
prima di generare l'installer definitivo.

## 2. Android

### App nativa (Capacitor)

Il progetto nativo Android e' gia' generato in `frontend/android/`, incluse
icone adattive e splash screen basati sul logo. Per costruire l'APK serve
Android Studio / SDK sulla propria macchina.

L'app nativa carica un pacchetto web statico e non ha un server locale sul
telefono: va quindi puntata all'indirizzo del backend (in esecuzione sul PC,
vedi sopra) in fase di build, impostando `VITE_API_BASE`:

```bash
cd frontend
npm install
VITE_API_BASE="http://<ip-del-pc>:4000/api" npm run android:sync
npm run android:open   # apre il progetto in Android Studio
```

Da Android Studio: "Build > Build Bundle(s)/APK(s) > Build APK(s)", oppure da
riga di comando (su una macchina con SDK Android configurato):

```bash
cd frontend/android
./gradlew assembleDebug
# APK generato in android/app/build/outputs/apk/debug/app-debug.apk
```

Copia l'APK sul telefono e installalo (abilitando "Origini sconosciute" se
richiesto), oppure usa `adb install app-debug.apk`.

### Alternativa senza build: PWA dal browser

Se il telefono e il PC (che fa da server) sono sulla stessa rete Wi-Fi, non
serve compilare nulla:

1. Avvia il backend sul PC come sopra (`npm start` in `backend/`, con
   `frontend/dist` gia' buildato).
2. Trova l'IP locale del PC (es. `192.168.1.x`).
3. Sul telefono, apri Chrome su `http://<ip-del-pc>:4000`.
4. Menu Chrome -> "Installa app" (o "Aggiungi a schermata Home"): l'app
   compare come icona a se stante, a schermo intero.

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

## Altre piattaforme desktop

`electron/` supporta anche Linux (`npm run dist:linux`, AppImage) e macOS
(`npm run dist:mac`, `.dmg`, va eseguito su macOS) con lo stesso wrapper,
qualora servisse in futuro, ma i target principali di questo progetto restano
Windows e Android.

## Estendere l'app

- Aggiungere una piattaforma: creare un nuovo file in `backend/src/adapters/`
  con `isConfigured()`, `fetchMetrics(account)` e `fetchRecentPosts(account, limit)`,
  registrarlo in `backend/src/adapters/index.js` e aggiungere la piattaforma
  all'array `PLATFORMS`; nel frontend aggiungere una voce a
  `frontend/src/platforms.js`.
- I dati sono salvati in SQLite (`backend/data/shie-hassaikai.db` in locale,
  o nella cartella dati utente del sistema operativo quando in esecuzione
  tramite l'app Electron), quindi persistono tra i riavvii.
