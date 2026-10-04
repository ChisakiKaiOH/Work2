# Architettura

## Principi

- **Stato unico, immutabile, in un reducer**: tutta la partita vive in un
  solo oggetto `GameState` (`src/types/index.ts`), gestito da un
  `useReducer` React (`src/game/reducer.ts`). Ogni azione o avanzamento di
  mese produce un nuovo stato, mai mutazioni in place.
- **Sistemi indipendenti e puri**: ogni dominio di gioco (`src/systems/*.ts`)
  espone funzioni pure che prendono dati in ingresso e restituiscono un
  risultato, senza leggere/scrivere stato globale né effetti collaterali
  (eccetto `saveSystem.ts`, che per definizione parla con `localStorage`).
  Questo li rende testabili in isolamento e componibili dal reducer.
- **Nessuna libreria di state management esterna**: Context API +
  `useReducer` sono sufficienti per questa dimensione di stato; evita una
  dipendenza e un concetto in più da imparare.
- **Zero dipendenze grafiche/audio esterne**: UI in CSS puro, grafica
  procedurale in SVG (loghi, mascotte, copertine) generata da un seme
  deterministico, cosicché la stessa entità (azienda, gioco) produce sempre
  la stessa immagine senza doverla salvare o scaricare.
- **Mobile-first**: ogni schermata è pensata prima per smartphone (bottom
  nav, card scrollabili, touch target ≥ 40px), poi verificata anche su
  tablet/desktop.

## Struttura delle cartelle

```
src/
  types/        Definizioni condivise: GameState e tutti i tipi che lo
                compongono (Project, Employee, ReleasedGame, RivalCompany,
                IntellectualProperty, FictionalPlatform, AwardCeremony,
                StockMarketState, Achievement, NewsItem, GlobalEventRecord,
                TimelineEntry, ...).

  data/         Dati statici e tabelle di bilanciamento, senza logica:
                genres.ts (pesi ideali per genere), sizes.ts,
                platformsThemes.ts, employees.ts (stipendi per ruolo),
                technology.ts (albero tecnologico), officeUpgrades.ts,
                events.ts / globalEventsData.ts, awardCategories.ts,
                achievements.ts (le 50 definizioni), difficulty.ts,
                reviewPhrases.ts (banca frasi per le recensioni).

  systems/      Un modulo per dominio, ciascuno con il proprio file di test
                *.test.ts accanto:
                - economy.ts        bilancio mensile (stipendi, affitto, ...)
                - development.ts    avanzamento fasi, compatibilità genere
                - employees.ts      candidati, assunzione, promozione
                - projectFactory.ts stima costo/durata/rischio di un progetto
                - sales.ts          curva di vendita, sconti, porting, DLC
                - reviews.ts        voto critica + testo recensioni
                - research.ts       albero tecnologico, moltiplicatori
                - events.ts         eventi personali dello studio
                - globalEvents.ts   eventi globali di mercato
                - market.ts         tendenze annuali di genere
                - companies.ts      IA delle aziende rivali, stadi di crescita
                - acquisitions.ts   due diligence, offerte, M&A
                - ip.ts             IP/franchise (sequel, remaster, film...)
                - awards.ts         Global Game Awards (nomination, podio)
                - achievements.ts   condizioni di sblocco dei 50 obiettivi
                - stockMarket.ts    IPO, prezzo azioni, portafoglio
                - news.ts           costruzione delle voci del feed notizie
                - saveSystem.ts     persistenza su localStorage (3 slot)

  game/
    initialState.ts   crea un GameState nuovo (studio, modalità, difficoltà)
    actions.ts        l'unione discriminata di tutte le azioni del reducer
    reducer.ts        compone i systems/ in un unico `gameReducer`; il TICK
                      mensile è orchestrato qui (ordine: eventi globali →
                      sviluppo → dipendenti → mondo/aziende rivali →
                      vendite → ricerca → economia → reputazione →
                      bancarotta → evento personale → tendenze annuali +
                      Global Game Awards → borsa → valore azienda/stadio →
                      achievement)
    GameContext.tsx   Provider React: ospita lo stato, il dispatch, e
                      l'intervallo che invia TICK in base alla velocità
                      scelta (pausa/1x/2x/4x), più l'autosave sullo slot
                      attivo ad ogni mese

  hooks/        useGameState() / useGameDispatch(): accesso tipizzato al
                Context, con errore esplicito se usati fuori da <GameProvider>.

  components/   UI condivisa e riusabile, senza logica di gioco propria:
                Button, Card, ProgressBar, StatPill, Modal, TopBar,
                BottomNav, AllocationSliders, Sparkline, EventModal,
                NotificationsStack, TutorialOverlay, e la grafica
                procedurale (CompanyLogo, Mascot, GameCover).

  screens/      Una cartella/file per schermata; screens/navigation.ts
                definisce l'unione `Screen`, i gruppi della bottom nav e la
                mappa schermata→gruppo. screens/world/ contiene i pannelli
                della scheda "Mondo" (Concorrenti, News, Premi, Obiettivi,
                Timeline, Borsa), composti da WorldScreen.tsx tramite
                scheda interna (lo stesso pattern di StudioScreen e
                GameDetailsScreen).

  utils/        format.ts (valuta, mesi, clamp), id.ts (id univoci),
                random.ts (helper + seededRandom/hashStringToSeed per la
                grafica procedurale deterministica), nameGenerator.ts
                (nomi di persone, giochi, aziende, piattaforme, recensori).
```

## Navigazione

Niente router: `App.tsx` mantiene uno stato locale `screen` (dallo union
`Screen`) e alcuni id selezionati (progetto/gioco/azienda correnti). La
`BottomNav` mostra 7 gruppi principali; le schermate di dettaglio
(`newProject`, `development`, `gameDetails`, `companyDetails`, `saveLoad`)
si raggiungono navigando da una schermata principale e tornano indietro con
un callback `onBack`, senza mai perdere lo stato di gioco (che vive nel
Context, non nella navigazione).

## Il ciclo TICK

Ad ogni mese, `runTick` in `reducer.ts` esegue, in quest'ordine, un unico
passaggio di calcolo che produce il nuovo `GameState`:

1. Eventuale evento globale di mercato (prima delle vendite, così il suo
   effetto si applica subito).
2. Avanzamento dei progetti in sviluppo.
3. Drift di morale/esperienza dei dipendenti.
4. Simulazione autonoma di tutte le aziende rivali (pubblicazioni, crescita,
   fallimenti, acquisizioni reciproche); il mondo si "ripopola" se troppe
   aziende sono scomparse.
5. Vendite dei giochi pubblicati.
6. Avanzamento della ricerca tecnologica attiva.
7. Bilancio economico mensile e aggiornamento del denaro.
8. Deriva della reputazione in base alla qualità media dei giochi.
9. Controllo bancarotta (con periodo di grazia dipendente dalla difficoltà).
10. Eventuale evento personale dello studio (bloccante solo se ha scelte
    reali; altrimenti si autorisolve e diventa una notifica).
11. Ogni 12 mesi: nuova tendenza di mercato + cerimonia dei Global Game
    Awards (nomination, podio, ricompense per le vittorie del giocatore).
12. Aggiornamento del prezzo delle azioni (borsa).
13. Ricalcolo del valore aziendale e dello stadio di crescita (con eventuale
    voce in timeline se lo stadio cambia).
14. Controllo dei 50 achievement e notifica di quelli appena sbloccati.

Ogni passaggio è una chiamata a una funzione pura di `systems/`; `runTick`
si limita a comporre gli input/output e a decidere l'ordine.

## Test

Ogni `systems/*.ts` ha un file `*.test.ts` affiancato con Vitest. Il reducer
ha una propria suite (`game/reducer.test.ts`) che testa le azioni principali
end-to-end (creazione/pubblicazione progetti, assunzioni, ricerca,
acquisizioni, borsa, bancarotta) e un test dedicato di stabilità/performance
su una sessione molto lunga (`game/longSession.test.ts`, 600 mesi simulati)
per intercettare regressioni di crescita illimitata delle liste o di
performance.

## Perché queste scelte

- **Reducer singolo invece di più store**: la partita è uno stato
  fortemente interconnesso (un'acquisizione tocca denaro, aziende, IP,
  dipendenti, reputazione, timeline, achievement nello stesso istante); un
  solo reducer con sistemi puri componibili è più semplice da ragionare e
  testare che N store sincronizzati.
- **Niente router**: la navigazione di un gestionale mobile è un albero
  poco profondo (bottom nav + "indietro"); uno stato locale con union type
  è più leggero di una libreria di routing e resta facile da seguire.
- **Grafica procedurale invece di asset**: garantisce originalità al 100%
  (nessun rischio di asset "presi in prestito"), pesa pochi KB di codice
  invece di immagini, e permette a ogni partita di avere un mondo
  visivamente diverso.
