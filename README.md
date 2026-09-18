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

## 0. Backend pubblico su Fly.io (per usare l'app anche fuori casa, in 4G/5G)

L'app Android e' un pacchetto statico installato sul telefono: non ha un
server locale, quindi deve contattare un backend raggiungibile da internet
per funzionare anche quando il telefono non e' sulla stessa rete Wi-Fi del
PC. Questo passaggio e' **necessario per l'uso in mobilita'**; se ti basta
usarla in casa sulla stessa rete puoi saltarlo e andare direttamente alla
sezione 2 ("Alternativa senza build").

Il deploy gira su GitHub Actions (`.github/workflows/deploy-backend.yml`)
perche' Fly.io non e' raggiungibile dall'ambiente di sviluppo remoto usato
per questo progetto. Setup una tantum:

1. Crea un account su [fly.io](https://fly.io) (richiede una carta per la
   verifica, ma l'uso descritto qui resta nel piano gratuito Hobby).
2. Installa `flyctl` sul tuo PC e accedi:
   ```bash
   curl -L https://fly.io/install.sh | sh   # Windows: iwr https://fly.io/install.ps1 -useb | iex
   fly auth login
   ```
3. Dalla cartella del progetto (dove ci sono `Dockerfile` e `fly.toml`), crea
   l'app e il volume persistente per il database (se il nome
   `shie-hassaikai-application` risulta gia' preso da un altro utente Fly,
   scegline uno univoco e aggiornalo anche in `fly.toml`, campo `app`):
   ```bash
   fly apps create shie-hassaikai-application
   fly volumes create shie_data --region fra --size 1 -a shie-hassaikai-application
   ```
4. Genera un token di deploy e copialo:
   ```bash
   fly tokens create deploy -a shie-hassaikai-application
   ```
5. Su GitHub: **Settings -> Secrets and variables -> Actions -> Secrets ->
   New repository secret**, crea:
   - `FLY_API_TOKEN` = il token del passo precedente;
   - `SHIE_API_KEY` = una password/chiave a scelta (es. generata con
     `openssl rand -hex 20`). Protegge l'API pubblica: senza questa chiave
     chiunque trovasse l'URL potrebbe leggere/modificare i tuoi dati. La
     dashboard servita dallo stesso host la incorpora gia' in automatico; per
     l'app Android nativa la useranno anche i comandi della sezione 2.
6. Lancia il deploy da **Actions -> Deploy Backend -> Run workflow** (parte
   anche da solo a ogni push che tocca `backend/**` o `frontend/**`).
7. A deploy completato l'app e' su `https://shie-hassaikai-application.fly.dev`
   (o il nome che hai scelto): apribile da qualunque browser, ovunque, e
   installabile li' stesso come PWA (funziona anche in 4G/5G da subito, senza
   bisogno dell'app nativa).

Per aggiornare l'app pubblicata (nuove funzionalita', fix) basta ripetere il
passo 6: il deploy e' idempotente e riusa lo stesso volume dati.

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

### App nativa (Capacitor) - build automatica via GitHub Actions (consigliato)

Non serve installare Android Studio da nessuna parte: il workflow
`.github/workflows/android-apk.yml` compila l'APK sui runner di GitHub.

1. Imposta l'indirizzo del backend che l'app deve contattare: **Settings ->
   Secrets and variables -> Actions -> Variables**, crea `ANDROID_API_BASE`
   con valore:
   - `https://shie-hassaikai-application.fly.dev/api` (o il tuo nome scelto)
     se hai fatto il deploy pubblico della sezione 0 -- **funziona ovunque,
     anche in 4G/5G**;
   - oppure `http://<ip-del-pc>:4000/api` se preferisci usare solo il PC di
     casa come server (funziona solo quando telefono e PC sono sulla stessa
     rete Wi-Fi, vedi "Alternativa senza build" piu' sotto).

   Se hai impostato anche il secret `SHIE_API_KEY` nella sezione 0, l'APK la
   user automaticamente (il workflow la legge da li'): non serve
   configurare altro. Senza questa variabile l'app compilata usera' `/api`
   relativo, che non funziona su Android (non c'e' un server locale sul
   telefono).
2. Il workflow parte da solo a ogni push che tocca `frontend/**`, oppure
   lancialo a mano da **Actions -> Build Android APK -> Run workflow** (li'
   puoi anche passare un indirizzo diverso una tantum, senza toccare la
   variabile di repository).
3. A build finita, apri il run del workflow e scarica l'artifact
   `shie-hassaikai-application-debug-apk` dalla sezione "Artifacts": contiene
   `app-debug.apk`.
4. Copia l'APK sul telefono e installalo (abilitando "Origini sconosciute" se
   richiesto), oppure `adb install app-debug.apk`.

### App nativa (Capacitor) - build locale con Android Studio

In alternativa, se hai Android Studio / SDK sulla tua macchina:

```bash
cd frontend
npm install
VITE_API_BASE="https://shie-hassaikai-application.fly.dev/api" VITE_API_KEY="<il-tuo-SHIE_API_KEY>" npm run android:sync
npm run android:open   # apre il progetto in Android Studio
```

Da Android Studio: "Build > Build Bundle(s)/APK(s) > Build APK(s)", oppure da
riga di comando (su una macchina con SDK Android configurato):

```bash
cd frontend/android
./gradlew assembleDebug
# APK generato in android/app/build/outputs/apk/debug/app-debug.apk
```

### Alternativa senza build: PWA dal browser

Non serve compilare nulla:

- **Ovunque, anche in 4G/5G** (richiede il deploy della sezione 0): apri
  `https://shie-hassaikai-application.fly.dev` in Chrome sul telefono e usa
  "Installa app" (o "Aggiungi a schermata Home").
- **Solo in casa, stessa rete Wi-Fi del PC**: avvia il backend sul PC
  (`npm start` in `backend/`, con `frontend/dist` gia' buildato), trova l'IP
  locale del PC (es. `192.168.1.x`) e apri `http://<ip-del-pc>:4000` in
  Chrome sul telefono, poi "Installa app".

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
