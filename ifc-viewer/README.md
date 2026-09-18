# IFC Reader

Applicazione Android (e web) per leggere file **IFC** (Industry Foundation
Classes, il formato standard per i modelli BIM), navigare il modello in 3D,
selezionare i singoli oggetti e consultarne le proprieta' (attributi IFC,
property set, quantita').

## Cosa fa

- **Apri** un file `.ifc` dal telefono (selettore file nativo).
- **Naviga** il modello in 3D: un dito per orbitare, due per pan/zoom
  (pinch), via [camera-controls](https://github.com/yomotsu/camera-controls).
- **Seleziona** un oggetto toccandolo nella vista 3D, oppure dall'**albero
  della struttura spaziale** (Progetto > Sito > Edificio > Piano > Elementi).
- **Consulta le proprieta'**: nome, GUID, categoria IFC, attributi e tutti i
  property set (`Pset_...`) e quantita' collegati all'elemento selezionato;
  un tocco copia tutte le proprieta' come testo.
- **Sfoglia per categoria** (muri, porte, finestre, ...): tocca una categoria
  per isolarla nella vista 3D e inquadrarla.
- **Cerca per nome** un elemento nel modello e selezionalo direttamente dal
  risultato.
- **Isola** l'elemento selezionato (nascondi tutto il resto) e **mostra
  tutto** per tornare alla vista completa.
- **Viste rapide**: dall'alto, di fronte, assonometrica, adatta alla vista.
- **Sezioni**: aggiungi un piano di sezione orizzontale o verticale per
  vedere l'interno del modello, o rimuovili.
- **Info modello**: nome del file, numero di elementi, dimensioni
  complessive e conteggio per categoria.
- **Stili grafici**: Ombreggiato, Wireframe e Trasparente (X-ray), oltre al
  toggle della griglia di riferimento.
- **Misura**: tocca due punti nel modello per misurarne la distanza (linea +
  valore in metri); "Cancella misure" rimuove le misurazioni fatte.
- **Screenshot**: salva la vista 3D corrente come immagine PNG.
- **Vista in pianta**: tocca "Pianta" per passare a una vista ortogonale
  dall'alto con solo pan/zoom (senza rotazione), come una planimetria 2D.
- **Piani**: elenco dei piani (`IfcBuildingStorey`) del modello, ordinati per
  quota; tocca un piano per isolarlo e passare automaticamente alla vista in
  pianta di quel livello.
- **Percorso struttura**: il pannello proprietà mostra il percorso
  gerarchico dell'elemento selezionato (Progetto › Sito › Edificio › Piano).
- **Condividi**: invia lo screenshot corrente tramite il pannello di
  condivisione di Android (o lo scarica, se la condivisione non è
  disponibile).
- **Schermo intero**: nasconde barra e pannello per una vista 3D immersiva.
- **Riprendi l'ultimo file**: l'ultimo file IFC aperto resta in cache sul
  dispositivo; alla riapertura dell'app un pulsante permette di riaprirlo
  senza dover navigare di nuovo nelle cartelle.
- **Impostazioni**: tema (sistema/chiaro/scuro), unità di misura (metri/
  piedi, usata da Misura e Info modello) e colore di evidenziazione della
  selezione — tutte salvate sul dispositivo.

## Stack tecnologico

```
React + Vite            interfaccia
three.js                 rendering 3D (WebGL)
@thatopen/components      motore BIM (camera, scena, selezione, evidenziazione)
@thatopen/fragments       parsing/conversione IFC in "fragments" + geometria
web-ifc                  parser IFC (WASM)
Capacitor                 pacchetto nativo Android
```

Il parsing IFC e il rendering girano interamente **sul dispositivo**: i file
WASM di `web-ifc` e il worker di `@thatopen/fragments` sono incorporati
nell'app (`public/wasm/`, `public/fragments-worker.mjs`), quindi l'app apre
i file IFC anche **senza connessione internet**.

## Sviluppo

```bash
npm install
npm run dev        # http://localhost:5173, apri un .ifc da browser (desktop o mobile)
```

## Build Android

### Automatica via GitHub Actions (consigliato)

Non serve installare Android Studio: il workflow
`.github/workflows/ifc-viewer-android-apk.yml` compila l'APK sui runner di
GitHub a ogni push che tocca `ifc-viewer/**`, oppure a mano da
**Actions -> Build IFC Reader Android APK -> Run workflow**. A build finita,
scarica l'artifact `ifc-reader-debug-apk` (contiene `app-debug.apk`) e
installalo sul telefono (`adb install app-debug.apk`, oppure copialo e aprilo
abilitando "Origini sconosciute").

### Locale (richiede Android SDK)

```bash
npm install
npm run android:sync   # build web + npx cap sync android
npm run android:open   # apre il progetto in Android Studio
```

Oppure da riga di comando, con l'SDK Android configurato:

```bash
cd android
./gradlew assembleDebug
# APK in android/app/build/outputs/apk/debug/app-debug.apk
```

## Note e limiti noti

- Testato con file IFC2X3 e IFC4 di dimensioni contenute. File molto grandi
  (decine/centinaia di MB) possono richiedere piu' tempo per il parsing su
  dispositivi meno potenti.
- L'albero della struttura mostra la gerarchia spaziale (progetto, sito,
  edificio, piano, elementi); alcuni nodi intermedi generati internamente da
  `getSpatialStructure()` senza categoria propria vengono automaticamente
  "appiattiti" per mostrare una gerarchia piu' leggibile.
- La ricerca per nome e la vista "Categorie" escludono automaticamente le
  entita' IFC non fisiche (property set, unita' di misura, relazioni, ...),
  mostrando solo elementi spaziali/costruttivi.
- Il file per "Riprendi l'ultimo file" resta salvato in locale (IndexedDB)
  finche' non se ne apre un altro o non si tocca la "✕" sul suggerimento; non
  viene mai inviato altrove.
- "Condividi" usa la Web Share API del browser/WebView: se il dispositivo o
  la build non la supportano, l'app scarica lo screenshot al posto di
  aprire il pannello di condivisione.

## Branding

Icona e splash screen sono generate da un unico logo vettoriale
(`assets/logo.svg` -> `assets/logo.png`, un cubo isometrico con un punto
evidenziato, che richiama la selezione di un oggetto nel modello 3D):

```bash
npx capacitor-assets generate --android \
  --iconBackgroundColor '#f4f6f8' --iconBackgroundColorDark '#14171a' \
  --splashBackgroundColor '#f4f6f8' --splashBackgroundColorDark '#14171a'
```

Rigenera icone/splash (chiaro e scuro) in `android/app/src/main/res/` a
partire da `assets/logo.png`. Per cambiare il logo, sostituisci
`assets/logo.svg`, ri-esporta `assets/logo.png` (1024x1024, sfondo
trasparente) e ripeti il comando sopra.
