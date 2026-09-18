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
  property set (`Pset_...`) e quantita' collegati all'elemento selezionato.

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
- L'icona/splash screen dell'app usa ancora i valori di default di
  Capacitor: puo' essere personalizzata in seguito con
  `npx @capacitor/assets generate --android`.
