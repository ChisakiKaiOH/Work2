# Indie Studio Tycoon

Un gestionale originale ispirato al genere "game dev tycoon": parti da un
piccolo studio indipendente e trasformalo in uno dei più importanti colossi
dell'industria videoludica mondiale — creando giochi, IP, tecnologie,
acquisendo rivali, quotandoti in borsa e vincendo i Global Game Awards. Nome,
identità, meccaniche, testi, nomi di aziende/giochi/piattaforme e grafica
sono tutti originali, generati proceduralmente dove sensato, e pensati per
funzionare bene anche su smartphone.

Per una descrizione approfondita delle meccaniche vedi **[GAME_DESIGN.md](./GAME_DESIGN.md)**,
per l'architettura del codice **[ARCHITECTURE.md](./ARCHITECTURE.md)**, per le
formule e il bilanciamento economico **[BALANCE.md](./BALANCE.md)**.

## Cosa fai nel gioco

- **Crei videogiochi** scegliendo tra 22 generi, 16 temi, 4 piattaforme e 4
  dimensioni di progetto; il gioco calcola costo, durata, team consigliato,
  qualità potenziale, rischio e potenziale commerciale.
- **Sviluppi** attraverso 7 fasi, distribuendo le risorse tra Gameplay,
  Tecnologia, Grafica, Audio e Narrativa, valutate rispetto al genere con un
  giudizio testuale.
- **Gestisci un team** di 5 ruoli (Programmatore, Designer, Artista, Sound
  Designer, Producer): assumi, licenzi, promuovi, formi.
- **Pubblichi** i giochi e ricevi recensioni, voto della critica, vendite
  reali nel tempo (picco → coda commerciale), con sconti, aggiornamenti, DLC
  e porting.
- **Ogni gioco pubblicato diventa una IP**: puoi farla crescere con sequel,
  spin-off, remaster, remake, versioni mobile e — per gli studi più grandi —
  film/serie TV.
- **Compete contro un mondo vivo di aziende rivali** generate
  proceduralmente (nome, logo, fondatore, strategia, dipendenti, giochi),
  che agiscono autonomamente ogni mese anche quando non le guardi: pubblicano
  giochi, crescono, falliscono, si acquisiscono a vicenda.
- **Acquisisci, stringi partnership o investi** in qualunque azienda rivale,
  con una vera due diligence (valore, debiti, dipendenti, quota di mercato) e
  scelte post-acquisizione (mantenere il management, integrare, chiudere...).
- **Ti quoti in borsa** quando lo studio è grande abbastanza, e puoi
  comprare/vendere azioni delle aziende rivali quotate.
- **Ricerchi un vasto albero tecnologico** (14 categorie, dall'Engine alla
  Realtà Virtuale al Cloud Gaming) che si sblocca anche col passare degli
  anni di gioco.
- **Ogni anno si tengono i Global Game Awards**: 11 categorie, podio con
  medaglie, in cui competono tutti i giochi pubblicati nell'ultimo anno —
  tuoi e dei rivali.
- **Affronti eventi personali** (candidature, bug critici, richieste di
  aumento...) ed **eventi globali di mercato** (crisi economiche, boom
  tecnologici, nuove console, scandali...).
- **Sblocchi 50 obiettivi**, consulti la cronologia storica del tuo studio e
  la tua libreria di giochi con copertine generate proceduralmente.
- **Scegli modalità** (Carriera, Sandbox, Scenario a obiettivo) e
  **difficoltà** (Facile/Normale/Difficile/Insane).
- **Controlli il tempo** (pausa/1x/2x/4x) e **salvi** in 3 slot con autosave.

## Tecnologia utilizzata

```
React 19 + TypeScript   interfaccia e logica di gioco
Vite                     build tool / dev server
Context API + useReducer gestione dello stato di gioco (nessuna libreria
                          di state management esterna)
CSS + SVG puri           UI dark-mode premium, mobile-first, loghi/mascotte/
                          copertine generati proceduralmente, zero asset
                          grafici esterni
Vitest                   test automatici (63 test su 14 file)
Capacitor                pacchetto nativo Android
```

Il gioco funziona interamente lato client (nessun backend), con salvataggi
in `localStorage`.

## Requisiti

- Node.js 18+ e npm

## Installazione

```bash
npm install
```

## Avviare il gioco

```bash
npm run dev
```

Apre il dev server (di norma su `http://localhost:5173`). Funziona da
browser desktop o mobile.

## Build di produzione

```bash
npm run build
```

Compila con `tsc` (controllo tipi) e poi `vite build`, generando i file
statici in `dist/`.

## Test automatici

```bash
npm run test
```

63 test su 14 file: economia, vendite, recensioni, sviluppo (fasi,
compatibilità genere/allocazione), dipendenti, ricerca tecnologica, aziende
rivali (IA), acquisizioni, Global Game Awards, obiettivi, tendenze di
mercato, salvataggio/caricamento, il ciclo di gioco completo nel reducer
(incluse borsa e acquisizioni) e un test di stabilità/performance su 50
anni di partita simulata.

## Struttura del progetto

```
src/
  types/        tipi condivisi (GameState, Project, Employee, RivalCompany,
                IntellectualProperty, AwardCeremony, StockMarketState, ...)
  data/         dati statici: generi, piattaforme, dimensioni, temi, ruoli,
                albero tecnologico, upgrade ufficio, eventi, eventi globali,
                categorie premi, achievement, difficoltà/scenari
  systems/      logica di gioco pura e testabile: economy, development,
                employees, sales, reviews, research, events, globalEvents,
                market, companies (IA rivali), acquisitions, ip, awards,
                achievements, stockMarket, news, saveSystem, projectFactory
  game/         GameContext (provider + ciclo del tempo), reducer, azioni,
                stato iniziale di una nuova partita
  hooks/        useGameState / useGameDispatch
  components/   UI condivisa: Button, Card, ProgressBar, Modal, TopBar,
                BottomNav, AllocationSliders, Sparkline, EventModal,
                NotificationsStack, TutorialOverlay, CompanyLogo, Mascot,
                GameCover (tutte grafica procedurale via SVG/Canvas)
  screens/      le schermate di gioco (vedi sotto) + la navigazione;
                screens/world/ contiene i pannelli della scheda "Mondo"
  utils/        formattazione, id, numeri casuali (incluso un generatore
                seedato per la grafica procedurale), generatore di nomi
```

Ogni sistema di gioco (`src/systems/*.ts`) è un modulo indipendente di
funzioni pure, senza stato interno: il `reducer` li compone per calcolare il
nuovo stato ad ogni azione o avanzamento di mese. Questo rende ogni sistema
testabile in isolamento (vedi i file `*.test.ts` accanto a ciascun modulo).
Dettagli architetturali completi in [ARCHITECTURE.md](./ARCHITECTURE.md).

### Schermate

Main Menu, Nuova Partita (con scelta modalità/difficoltà), Dashboard, Studio
(Ufficio/Tecnologia/Marketing), Team, Nuovo Progetto, Sviluppo, Libreria
Giochi (con copertine procedurali), Dettaglio Gioco
(Panoramica+IP/Vendite/Recensioni), **Mondo** (Concorrenti, News, Premi,
Obiettivi, Timeline, Borsa), Dettaglio Azienda (acquisizioni), Eventi,
Impostazioni, Salva/Carica.

La navigazione principale avviene tramite la barra in basso (Dashboard,
Progetti, Team, Studio, Mondo, Eventi, Impostazioni); le schermate di
dettaglio si raggiungono navigando da quelle principali e hanno un pulsante
"Indietro".

## Esportazione Android

Il progetto è già impostato come app Capacitor (`capacitor.config.ts`,
cartella `android/`), esattamente come il resto delle app di questo
repository.

### Automatica via GitHub Actions (consigliato)

Il workflow `.github/workflows/indie-studio-tycoon-android-apk.yml` compila
l'APK sui runner di GitHub ad ogni push che tocca `indie-studio-tycoon/**`,
oppure a mano da **Actions → Build Indie Studio Tycoon Android APK → Run
workflow**. A build finita, scarica l'artifact
`indie-studio-tycoon-debug-apk` (contiene `app-debug.apk`) e installalo sul
telefono (`adb install app-debug.apk`, oppure copialo sul device e aprilo
abilitando "Origini sconosciute").

### Locale (richiede Android SDK)

```bash
npm run android:sync   # build web + npx cap sync android
npm run android:open   # apre il progetto in Android Studio
```

Oppure da riga di comando, con l'SDK Android configurato:

```bash
cd android
./gradlew assembleDebug
# APK in android/app/build/outputs/apk/debug/app-debug.apk
```

## Sostituire asset e audio

Il progetto non include asset grafici o audio esterni: loghi aziendali,
mascotte e copertine dei giochi sono SVG generati proceduralmente da un seme
deterministico (`src/components/CompanyLogo.tsx`, `Mascot.tsx`,
`GameCover.tsx` + `src/utils/random.ts → seededRandom`), così la stessa
azienda o lo stesso gioco hanno sempre lo stesso aspetto senza dover salvare
un'immagine. Non c'è ancora una colonna sonora. Per aggiungere audio in
futuro, il punto di innesto naturale è un nuovo modulo `src/systems/audio.ts`
che espone funzioni come `playMenuMusic()`, `playUiSound(id)`, richiamate dai
componenti (`Button`, `EventModal`, ecc.) e dal `GameContext` per gli eventi
di gioco; bastano file audio reali in `public/audio/` per renderlo
operativo, senza altre modifiche architetturali. L'icona dell'app Android
usa per ora l'icona di default di Capacitor: sostituiscila generando nuove
risorse in `android/app/src/main/res/` con lo strumento che preferisci (es.
`@capacitor/assets`).

## Problemi noti / limiti dichiarati

- Niente audio reale (solo il punto di innesto architetturale sopra
  descritto) e icona/splash Android ancora quelli di default di Capacitor:
  scelte di scope esplicite, non bug.
- Le piattaforme hardware fittizie (`FictionalPlatform`, es. "GameBox",
  "PlayCore") esistono come livello narrativo/di mercato (nascono con
  l'evento "nuova console", hanno un ciclo di vita) ma non sono ancora
  legate 1:1 alle vendite di ogni singolo gioco Console: quel livello di
  dettaglio avrebbe richiesto un sistema economico per-piattaforma molto più
  ampio, fuori dallo scope ragionevole di questa iterazione.
- Le aziende rivali non hanno (ancora) una vera simulazione di sviluppo
  gioco-per-gioco come il giocatore: pubblicano con una formula
  budget/qualità semplificata ma credibile, per restare performanti anche
  con molte aziende simulate ogni mese.
