# Bilanciamento ed economia

Riferimento rapido alle formule principali, per chi vuole modificarle. Ogni
valore citato vive in un file di `src/data/` (numeri) o `src/systems/`
(formule); questo documento spiega il *perché*, non duplica il codice.

## Economia di base

- **Capitale di partenza**: 50.000€ (`systems/economy.ts → STARTING_MONEY`),
  moltiplicato per `startingMoneyMultiplier` della difficoltà (0.5× Insane →
  1.5× Facile). In modalità Scenario il capitale è fissato dallo scenario
  stesso (es. 30.000€ per "Scalata Rapida").
- **Spese mensili fisse**: stipendi dei dipendenti + affitto base (700€) +
  upkeep degli upgrade ufficio acquistati + budget di marketing corrente +
  spesa di ricerca. Il totale è moltiplicato per `expenseMultiplier` della
  difficoltà (0.8× Facile → 1.4× Insane).
- **Stipendi**: `baseSalary + salaryPerLevel × (livello-1)`, diversi per
  ruolo (`data/employees.ts`). Sono stati calibrati (insieme all'affitto)
  perché un primo progetto Small con team assegnato sia sostenibile anche a
  difficoltà Normale: vedi la nota storica più sotto.
- **Bancarotta**: se il denaro scende a ≤0, si accumula un contatore di mesi
  negativi consecutivi; superata la soglia di grazia della difficoltà
  (1 mese Insane → 5 Facile, 3 Normale) lo studio chiude. Il contatore si
  azzera non appena il denaro torna positivo.

### Nota storica: perché gli stipendi iniziali sono stati ridotti

Una prima versione aveva stipendi più alti e affitto a 1.500€/mese: un
giocatore che assegnava **zero** dipendenti al primo progetto andava in
bancarotta prima di finirlo anche gestendo bene lo studio, perché il
bug "un tick avanza al massimo di una fase" (risolto, vedi sotto) rendeva
qualunque progetto lungo almeno 7 mesi indipendentemente dall'efficienza
del team. Gli stipendi sono stati abbassati di circa il 30% e l'affitto
portato a 700€ perché un giocatore che assegna il proprio team (il
comportamento normale, non quello ottimale) finisca comodamente il primo
gioco entro il budget iniziale anche a difficoltà Normale.

## Sviluppo

- **Fasi**: 7 fasi con pesi sulla durata totale del progetto (Concept 10%,
  Design 15%, Programming 30%, Art 20%, Audio 10%, Testing 10%, Polish 5%).
  Un progetto può avanzare **più di una fase nello stesso mese** se il team
  è sufficientemente efficiente (il progresso eccedente il 100% di una fase
  si riporta sulla successiva nello stesso tick) — questo evita che un
  progetto Small richieda sempre almeno 7 mesi indipendentemente dal team.
- **Efficienza del team**: per ogni dipendente assegnato,
  `(produttività/100) × fattore_morale × fattore_livello × affinità_fase ×
  bonus_postazioni`, sommati; un Producer non alimenta direttamente
  l'efficienza ma la moltiplica (+8% per livello). Zero dipendenti
  assegnati → efficienza fissa e molto bassa (0.15), il progetto avanza ma
  lentamente.
- **Qualità**: ogni fase alimenta solo gli assi di qualità pertinenti
  (es. Art → Grafica), pesata dalla quota di risorse allocata su
  quell'asse e dai moltiplicatori tecnologici sbloccati.
- **Bug**: si accumulano durante Programming in proporzione alla velocità
  del team e in proporzione inversa alla quota investita in Tecnologia; si
  riducono durante Testing/Polish.
- **Costo/durata stimati** (`systems/projectFactory.ts`): scalano con la
  dimensione del progetto (`data/sizes.ts`) e il numero di piattaforme
  scelte; la Generazione Procedurale (tecnologia) riduce tempo/costo dei
  progetti Large/AAA.

## Vendite

- **Lancio**: `domanda_base × fattore_hype × fattore_voto_critica ×
  copertura_piattaforme × fattore_prezzo × fattore_reputazione ×
  moltiplicatore_marketing`.
- **Decadimento mensile**: `unità_precedenti × ritenzione`, dove la
  ritenzione cresce con il voto della critica (35%-85%): un gioco molto
  apprezzato ha una "coda" commerciale molto più lunga.
- **Sconti**: aumentano temporaneamente le unità vendute del mese
  (fino a +160% al massimo sconto) a scapito del prezzo effettivo.
- **Eventi globali**: possono moltiplicare le vendite di tutti i giochi
  pubblicati per un mese (es. pandemia +25%, crisi economica -25%).

## Aziende rivali (IA)

- **Capitale/valore di partenza**: generati su 4 fasce di dimensione
  (indie piccolissime → colossi storici) con pesi 4:4:2:1, così il mondo
  parte già vario.
- **Pubblicazione mensile**: probabilità 5%-30% in base all'aggressività;
  genere scelto per bias di strategia (es. AAA-focused preferisce
  Action/RPG/FPS) o per popolarità di mercato; qualità stimata da
  reputazione e budget investito.
- **Fallimento**: solo per aziende piccole (valore < 500.000€) con
  capitale negativo, con una probabilità che cresce con il loro rischio.
- **Acquisizioni tra rivali**: solo aziende Aggressive/AAA-focused, verso
  bersagli con valore ≤15% del proprio, probabilità 1.5%/mese.
- **Ripopolamento**: se restano meno di 6 aziende, probabilità 30%/mese che
  ne nasca una nuova.

## Acquisizioni (M&A) — moltiplicatori sul valore aziendale del target

| Modalità      | Moltiplicatore base | Assorbe l'azienda? |
|---------------|---------------------|---------------------|
| Completa      | ×1.15                | Sì |
| Ostile        | ×1.45                | Sì |
| Partnership   | ×0.12                | No |
| Investimento  | ×0.22                | No |

Il prezzo finale è ulteriormente scalato da un fattore di reputazione del
target (0.7×–1.37×) e da uno sconto del 25% se il target ha capitale
negativo (azienda in difficoltà).

## Borsa

- **Soglia IPO**: valore aziendale ≥ 20.000.000€.
- **Prezzo per azione**: `valore_azienda / azioni_in_circolazione` (1
  milione di azioni), con una piccola componente di volatilità casuale
  (±4%/mese) oltre alla deriva verso il "fair value".

## Global Game Awards — punteggio per categoria

Punteggio base per ogni candidato: `qualityScore + criticScore × 6 +
log10(unità_vendute) × 8`. Le categorie per asse (Migliore Grafica/Audio/
Narrativa) aggiungono +40 se l'asse dominante del gioco coincide con la
categoria; le categorie di genere (Miglior RPG/Action/Strategico/
Multiplayer) filtrano i candidati per genere; Miglior Indie filtra per
fascia di budget, Miglior Mobile per piattaforma.

## Difficoltà — riepilogo moltiplicatori

| Difficoltà | Denaro iniziale | Spese | Eventi | Aggressività rivali | Vendite | Grazia bancarotta |
|---|---|---|---|---|---|---|
| Facile | ×1.5 | ×0.8 | ×0.8 | ×0.7 | ×1.15 | 5 mesi |
| Normale | ×1 | ×1 | ×1 | ×1 | ×1 | 3 mesi |
| Difficile | ×0.75 | ×1.2 | ×1.2 | ×1.3 | ×0.9 | 2 mesi |
| Insane | ×0.5 | ×1.4 | ×1.4 | ×1.6 | ×0.8 | 1 mese |

## Limiti di crescita delle liste (anti-memory-leak)

Per restare performante su partite di molte ore, ogni lista che si
accumula nel tempo è tenuta limitata: notifiche (40), log eventi personali
(50), feed notizie (60), eventi globali (40), cerimonie premi (30), catalogo
giochi di ogni singola azienda rivale (60 più recenti). La cronologia
(`timeline`) non è limitata esplicitamente perché cresce solo su eventi
intrinsecamente rari (cambio di stadio, massimo 5 volte per partita;
acquisizioni completate dal giocatore).
