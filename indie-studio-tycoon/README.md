# Indie Studio Tycoon

Un gestionale originale ispirato al genere "game dev tycoon": gestisci una
piccola software house indipendente, crea videogiochi, fai crescere il team
e trasforma il tuo studio in un successo. Nome, identità, meccaniche, testi
e grafica sono originali e pensati per funzionare bene anche su smartphone.

## Cosa fai nel gioco

- **Crei progetti** scegliendo genere, piattaforme, dimensione e tema; il
  gioco calcola automaticamente costo, durata, team consigliato, qualità
  potenziale, rischio e potenziale commerciale.
- **Sviluppi** il gioco attraverso 7 fasi (Concept, Design, Programming,
  Art, Audio, Testing, Polish), distribuendo le risorse tra Gameplay,
  Tecnologia, Grafica, Audio e Narrativa. La combinazione scelta viene
  valutata rispetto al genere con un giudizio testuale (non solo un numero).
- **Assumi, licenzi, promuovi e formi** 5 ruoli di dipendenti (Programmatore,
  Designer, Artista, Sound Designer, Producer), ognuno con livello,
  stipendio, produttività, morale ed esperienza.
- **Pubblichi** i giochi completati impostando un prezzo: ricevi un voto
  della critica, 4 recensioni testuali generate in base alle caratteristiche
  reali del gioco, punti di forza/debolezza e commenti dei giocatori.
- **Gestisci le vendite** nel tempo (picco di lancio, calo, coda
  commerciale), con sconti, aggiornamenti, DLC, porting su altre piattaforme
  e sequel.
- **Gestisci l'economia**: stipendi, affitto, infrastruttura, marketing e
  ricerca sono spese mensili reali; se il denaro scende a zero hai alcuni
  mesi di tempo per recuperare prima della chiusura dello studio.
- **Ricerchi tecnologie** (motori proprietari, IA avanzata, grafica 3D,
  motore fisico, multiplayer online, illuminazione avanzata, realtà
  virtuale, generazione procedurale) che sbloccano dimensioni di progetto e
  migliorano la qualità raggiungibile.
- **Potenzi lo studio**: ufficio, postazioni di lavoro, server, sala
  riunioni, laboratorio R&D, area marketing.
- **Affronti eventi casuali**: candidature di talenti, bug critici,
  recensioni virali, concorrenza, trend di mercato, streamer famosi,
  richieste di aumento, opportunità di investimento. Gli eventi con una
  scelta reale mettono in pausa il gioco con una domanda; quelli puramente
  informativi compaiono come notifica, senza interrompere il flusso.
- **Controlli il tempo**: pausa, 1x, 2x, 4x.
- **Salvi la partita** in 3 slot distinti, con autosave automatico sullo
  slot attivo a ogni mese che passa.

## Tecnologia utilizzata

```
React 19 + TypeScript   interfaccia e logica di gioco
Vite                     build tool / dev server
Context API + useReducer gestione dello stato di gioco (nessuna libreria
                          di state management esterna)
CSS puro                 UI dark-mode, mobile-first, nessuna dipendenza grafica
Vitest                   test automatici
Capacitor                pacchetto nativo Android
```

Nessuna dipendenza grafica/audio di terze parti: tutta l'interfaccia è
CSS/SVG scritto a mano. Il gioco funziona interamente lato client (nessun
backend), con salvataggi in `localStorage`.

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

Esegue la suite Vitest: economia (stipendi, bilancio mensile), vendite
(curva di lancio/decadimento, sconti), recensioni (punteggio e testo
derivati dalla qualità reale), sviluppo (avanzamento di fase, compatibilità
genere/allocazione, penalità bug), salvataggio/caricamento (round-trip su
`localStorage`, metadati slot) e il ciclo di gioco completo nel reducer
(avanzamento del tempo, creazione/pubblicazione progetti, bancarotta dopo
il periodo di grazia).

## Struttura del progetto

```
src/
  types/        tipi condivisi (GameState, Project, Employee, ...)
  data/         dati statici: generi, piattaforme, dimensioni, temi,
                ruoli, albero tecnologico, upgrade ufficio, eventi, frasi
  systems/      logica di gioco pura e testabile: economy, development,
                employees, sales, reviews, research, events, saveSystem,
                projectFactory
  game/         GameContext (provider + ciclo del tempo), reducer, azioni,
                stato iniziale di una nuova partita
  hooks/        useGameState / useGameDispatch
  components/   UI condivisa: Button, Card, ProgressBar, Modal, TopBar,
                BottomNav, AllocationSliders, Sparkline, EventModal,
                NotificationsStack, TutorialOverlay
  screens/      le 17 schermate di gioco (vedi sotto) + la navigazione
  utils/        formattazione, id, numeri casuali, generatore di nomi
```

Ogni sistema di gioco (`src/systems/*.ts`) è un modulo indipendente di
funzioni pure, senza stato interno: il `reducer` li compone per calcolare il
nuovo stato ad ogni azione o avanzamento di mese. Questo rende ogni sistema
testabile in isolamento (vedi i file `*.test.ts` accanto a ciascun modulo).

### Schermate

Main Menu, Nuova Partita, Dashboard, Studio (Ufficio/Tecnologia/Marketing),
Team, Nuovo Progetto, Sviluppo, Libreria Giochi, Dettaglio Gioco
(Panoramica/Vendite/Recensioni), Eventi, Impostazioni, Salva/Carica. La
navigazione principale avviene tramite la barra in basso (Dashboard,
Progetti, Team, Studio, Eventi, Impostazioni); le schermate di dettaglio
(Nuovo Progetto, Sviluppo, Dettaglio Gioco, Salva/Carica) si raggiungono
navigando da quelle principali e hanno un pulsante "Indietro".

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

Il progetto non include asset grafici o audio esterni: l'interfaccia è
CSS/SVG generato autonomamente (vedi `src/components/Sparkline.tsx` per un
esempio di SVG inline) e non c'è ancora una colonna sonora. Per aggiungere
audio in futuro, il punto di innesto naturale è un nuovo modulo
`src/systems/audio.ts` che espone funzioni come `playMenuMusic()`,
`playUiSound(id)`, richiamate dai componenti (`Button`, `EventModal`, ecc.)
e dal `GameContext` per gli eventi di gioco; bastano file audio reali in
`public/audio/` per renderlo operativo, senza altre modifiche architetturali.
L'icona dell'app Android usa per ora l'icona di default di Capacitor:
sostituiscila generando nuove risorse in `android/app/src/main/res/` con lo
strumento che preferisci (es. `@capacitor/assets`).

## Meccaniche principali (riepilogo)

- **Compatibilità genere/allocazione**: ogni genere ha un profilo ideale di
  pesi su Gameplay/Tecnologia/Grafica/Audio/Narrativa
  (`src/data/genres.ts`); la distanza tra l'allocazione scelta e il profilo
  ideale produce un giudizio testuale (`src/systems/development.ts →
  compatibilityLabel`), non solo un punteggio.
- **Fasi di sviluppo**: ogni fase alimenta assi di qualità diversi e pesa in
  proporzione alla durata del progetto; un team efficiente può completare
  più fasi nello stesso mese, uno assente procede molto più lentamente.
- **Bug**: si accumulano soprattutto durante Programming se si investe poco
  in Tecnologia, e si riducono durante Testing/Polish.
- **Vendite**: picco al lancio seguito da un decadimento mensile più lento
  quanto più alto è il voto della critica (il classico effetto "passaparola");
  sconti, aggiornamenti, DLC e porting generano ondate di vendite aggiuntive.
- **Eventi**: solo quelli con una scelta reale (candidatura, bug critico,
  richiesta di aumento, investimento) metton in pausa il gioco; gli altri
  sono notizie che si applicano subito.
- **Bancarotta**: se il denaro scende a zero o sotto, hai 3 mesi di grazia
  per risollevarti (es. licenziando personale o tagliando il marketing)
  prima della chiusura dello studio.
