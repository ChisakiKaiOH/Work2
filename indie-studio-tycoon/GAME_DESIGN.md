# Indie Studio Tycoon — Game Design Document

## Visione

Un gestionale "game dev tycoon" originale in cui il giocatore non si limita
a far crescere un singolo studio, ma costruisce un vero **impero
multimediale**: giochi, IP, tecnologia, dipendenti, aziende acquisite,
azioni in borsa, premi di settore. La partita è pensata per durare molte
ore e per restare imprevedibile ad ogni avvio, grazie alla generazione
procedurale del mondo (nomi di aziende, giochi, copertine, loghi, strategie
dei rivali).

## Progressione

```
Piccolo Studio
  ↓ (valore azienda ≥ 250.000€)
Studio Indipendente
  ↓ (valore azienda ≥ 2.000.000€)
Azienda Media
  ↓ (valore azienda ≥ 20.000.000€)        ← qui si può produrre film/serie TV dalle IP
Grande Software House                       ← qui si può andare in borsa
  ↓ (valore azienda ≥ 150.000.000€)
Colosso dell'Industria
  ↓ (valore azienda ≥ 1.000.000.000€)
Impero Multimediale
```

Il valore azienda (`companyValue`, vedi [BALANCE.md](./BALANCE.md)) combina
liquidità, valore delle IP possedute e ricavi storici: cresce pubblicando
giochi di successo, vincendo premi, e si può accelerare con acquisizioni.

## Ciclo di gioco mensile

```
MESE
 → sviluppo dei progetti attivi
 → simulazione autonoma delle aziende rivali (pubblicano, crescono,
   falliscono, si acquisiscono tra loro)
 → vendite dei giochi pubblicati (curva di lancio/decadimento)
 → ricerca tecnologica
 → economia (stipendi, affitto, marketing, ricerca → profitto/perdita)
 → eventuale evento personale (scelta) o globale (automatico)
 → ogni 12 mesi: nuova tendenza di mercato + Global Game Awards
 → controllo obiettivi sbloccati
 → MESE successivo
```

## Creazione di un videogioco

Un progetto è `Genere + Tema + Piattaforma + Dimensione`, a cui si aggiunge
l'allocazione di risorse tra 5 assi di qualità (**Gameplay, Tecnologia,
Grafica, Audio, Narrativa**) e il team assegnato. 22 generi (Action, RPG,
JRPG, Adventure, Horror, Survival, Strategy, Simulation, Racing, Sports,
Fighting, Puzzle, Platform, Roguelike, MMO, MOBA, FPS, RTS, Tactical,
Sandbox, Visual Novel, Educational) e 16 temi (Fantasy, Sci-Fi, Horror,
Cyberpunk, Medieval, Modern, Futuristic, Post-apocalyptic, Mystery,
Superhero, Historical, Space, Military, Comedy, Noir, Sports) permettono
centinaia di combinazioni.

Ogni genere ha un **profilo ideale** di pesi sui 5 assi
(`src/data/genres.ts`): la distanza tra l'allocazione scelta dal giocatore e
quel profilo produce un giudizio testuale — "Combinazione perfetta per il
genere", "Buon equilibrio", "Investimenti sbilanciati", "Combinazione
inadatta" — mai un numero nudo.

Lo sviluppo passa per 7 fasi (Concept, Design, Programming, Art, Audio,
Testing, Polish), ciascuna delle quali alimenta assi di qualità diversi.
Un team ben assegnato e specializzato può completare più fasi nello stesso
mese; un progetto senza team procede molto più lentamente (ma non si
blocca mai del tutto).

## Pubblicazione, IP e franchise

Alla pubblicazione, il gioco genera un voto della critica, 4 recensioni
testuali coerenti con i suoi punti di forza/debolezza reali, pro/contro, e
**diventa automaticamente una IP**. Da quel momento la IP ha un proprio
valore, fanbase e riconoscibilità, e può crescere con:

```
GIOCO ORIGINALE
 → SEQUEL / SPIN-OFF        (nuovo progetto, stesso franchise)
 → DLC                       (contenuto extra sul gioco esistente)
 → REMASTER / REMAKE         (rilancio immediato, senza nuovo ciclo di sviluppo)
 → VERSIONE MOBILE           (porting)
 → FILM / SERIE TV           (solo da Grande Software House in su, e solo se
                               la IP ha abbastanza fanbase e riconoscibilità)
```

## Il mondo: aziende rivali

Ogni nuova partita genera ~10 aziende concorrenti con nome procedurale
(radice + suffisso "da software house", con mutazioni buffe in stile
parodia — mai frammenti di marchi reali), logo, fondatore, anno di
fondazione, strategia (Aggressiva, Innovativa, Conservativa, Indie
Friendly, Focalizzata su AAA/Mobile/Hardware), capitale e dipendenti.

Ogni mese, **autonomamente**, ogni azienda rivale può: pubblicare un nuovo
gioco (la cui genere/qualità/vendite dipendono dalla sua strategia e dal
mercato), crescere o ridursi in base alla propria salute finanziaria,
fallire (e uscire dal mondo di gioco), o acquisire un'azienda rivale molto
più piccola. Se il numero di aziende scende troppo, ne nasce occasionalmente
una nuova: il mondo non si esaurisce mai, anche su partite molto lunghe.

## Acquisizioni (M&A)

Il giocatore può aprire la scheda di un'azienda rivale e vedere una vera
**due diligence** (valore, ricavi/debiti stimati, dipendenti, quota di
mercato), poi scegliere tra:

- **Acquisizione completa**: rileva l'azienda col consenso del management.
- **Acquisizione ostile**: la rileva forzando la mano, a un prezzo più alto.
- **Partnership**: accordo commerciale, l'azienda resta indipendente.
- **Investimento**: capitale in cambio di una relazione migliore.

Per le acquisizioni che assorbono l'azienda, il giocatore scelle cosa farne:
mantenere il management, sostituirlo (rischio di morale sul proprio team),
integrarla (massimizza il valore e le IP acquisite) o chiuderla (solo
l'incasso residuo).

## Borsa

Quando il valore aziendale del giocatore supera 20.000.000€, può quotarsi in
borsa: il prezzo per azione reagisce alle performance dello studio. Le
aziende rivali più grandi possono già essere quotate: il giocatore può
comprare e vendere le loro azioni, costruendo un portafoglio di
investimenti paralleli alla propria attività principale.

## Global Game Awards

Una volta all'anno si tiene la cerimonia: 11 categorie (Gioco dell'Anno,
Miglior RPG/Action/Strategico/Indie/Grafica/Audio/Innovazione/Multiplayer/
Narrativa/Mobile), ciascuna con un podio (🥇🥈🥉 + 4°/5°) tra tutti i giochi
pubblicati — propri e dei rivali — nei 12 mesi precedenti. Vincere aumenta
reputazione, valore dell'IP, fanbase e valore aziendale; compare anche nel
feed di notizie.

## Ricerca e tecnologia

21 tecnologie in 14 categorie (Engine, Graphics, AI, Audio, Network, VR,
Mobile, Cloud, Physics, Tools, Animation, Procedural, Online, Security).
Alcune sono disponibili da subito, altre compaiono solo dopo un certo numero
di mesi di gioco, simulando l'evoluzione tecnologica del settore nel tempo.

## Eventi

- **Eventi personali** (candidature, bug critici, richieste di aumento,
  opportunità di investimento, recensioni virali, trend di settore...): solo
  quelli con una scelta reale mettono in pausa il gioco con una domanda; gli
  altri sono notifiche immediate.
- **Eventi globali** (pandemia, crisi economica, boom tecnologico, nuova
  console, crisi dei componenti, scandalo, leak, attacco informatico,
  successo virale, influencer, tecnologia rivoluzionaria...): modificano
  temporaneamente vendite, costi di ricerca o il mercato per tutti.

## Obiettivi, cronologia, portfolio

50 achievement originali, una timeline dinamica della storia dello studio
(fondazione, cambi di stadio, acquisizioni...), e una libreria "I miei
giochi" con copertine generate proceduralmente in stile cartoon/box-art a
partire da genere, tema e un seme univoco per gioco.

## Modalità e difficoltà

- **Carriera**: la progressione classica.
- **Sandbox**: risorse più abbondanti, pensato per sperimentare.
- **Scenario**: un obiettivo chiaro da raggiungere in un tempo limite (es.
  "Azienda Media in 5 anni" con budget di partenza ridotto).

4 livelli di difficoltà (Facile/Normale/Difficile/Insane) modulano denaro di
partenza, spese, frequenza degli eventi, aggressività dei rivali, vendite e
durata della grazia prima della bancarotta.

## Fallimento

Il gioco non è sempre positivo: un progetto può flopppare, un dipendente
chiave può andarsene, un rivale può superare lo studio. Se il denaro scende
a zero, il giocatore ha un periodo di grazia (1-5 mesi secondo la
difficoltà) per recuperare — licenziando personale, tagliando il marketing,
vendendo azioni — prima della chiusura definitiva dello studio.
