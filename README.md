# CAPI: SHADOW MISSIONS

Una prima demo giocabile di uno sniper game narrativo 3D, mobile-first. Isa, nome in codice **CAPI**, e il Labrador color miele **Docky** indagano su un carico sospetto.

## Gioca alla demo

**[Apri CAPI: Shadow Missions su GitHub Pages](https://hugoreynoso.github.io/snaiper/)**

Su smartphone è consigliata la modalità orizzontale durante la missione. Servono un browser con WebGL e accelerazione hardware. La prima visita richiede una connessione; dopo il caricamento, il service worker conserva le risorse visitate per l'uso offline.

![Isa e Docky — illustrazione della home](public/images/isa-docky-hero.webp)

## Cosa puoi giocare

La campagna contiene **10 missioni giocabili**, sbloccate in sequenza. Dopo una vittoria, **Prossima missione** apre il briefing successivo. Stelle e record sono salvati per ogni operazione; i vecchi salvataggi della missione 01 vengono migrati.

- Porto procedurale con nave, gru, container, casse, magazzino e cinque personaggi animati, con modelli umani GLB, volti e abiti texturizzati.
- Avversari con colori di fazione, corporatura più larga nelle prime missioni, cappelli da banda o equipaggiamento tattico, copertura del viso e armi. Gli obiettivi autorizzati hanno una fascia rossa; i civili hanno il casco giallo.
- Mira tramite tocco, trascinamento, joystick o tastiera, zoom 1×–8×, sparo dal centro del mirino con raycasting e ostacoli solidi.
- Tre colpi per caricatore; ricarica di 1,8 secondi con munizioni di riserva illimitate nella demo.
- Respiro stabile per 4 secondi, riutilizzabile dopo 8 secondi dall'attivazione.
- Docky Scan evidenzia tutti gli obiettivi per 5 secondi, con recupero di 30 secondi.
- Neutralizza tutti gli obiettivi: da uno a tre, con pattuglie progressivamente più veloci. Colpire civili o guardie senza fascia causa la sconfitta.
- Il tempo scende da 90 a 45 secondi: alla scadenza, allarme visivo, raffica nemica e sconfitta.
- Immagine dell’ultimo sparo con indicazione di colpo riuscito/mancato, impatti e caduta dei personaggi.
- Musica di suspense originale sintetizzata, pulsante MUSIC ON/OFF durante la partita, volumi separati nelle impostazioni e sparo con rumore, attacco e coda grave.
- Pausa manuale e automatica quando la pagina passa in background.
- Stelle, miglior tempo, miglior precisione, crediti e impostazioni persistenti in localStorage, con recupero da dati corrotti.
- Equipaggiamento, dossier con le fotografie di riferimento, impostazioni, italiano e inglese.
- PWA con manifest, icone e service worker; audio sintetizzato via Web Audio.

Le dieci operazioni sono varianti tattiche su una base di scena condivisa, con scenari portuali, urbani e industriali, posizioni, abiti e parametri differenti. I titoli narrativi non implicano sequenze dedicate di salvataggio ostaggi o inseguimenti. Solo **SR-01 Scout** è disponibile. Il porto usa geometria e texture procedurali, con ombre dinamiche e acqua animata. I personaggi condividono due modelli base. La demo non contiene ancora modelli realistici di Isa e Docky, una simulazione balistica, backend o classifiche.

## Controlli

| Azione | Touch / mouse | Tastiera |
| --- | --- | --- |
| Mirare | Tocca un punto, trascina o usa il joystick | WASD / frecce |
| Zoom | Pizzica, pulsanti +/− o rotella | + / − |
| Sparare | SPARA | Spazio |
| Ricaricare | Pulsante munizioni | R |
| Stabilizzare | RESPIRO | B |
| Cercare indizi | DOCKY SCAN | Q |
| Pausa | Pulsante pausa | Esc |

Le impostazioni includono sensibilità, volume atmosfera/effetti, vibrazione dove supportata, controlli mancini, riduzione oscillazione/rinculo, sottotitoli e qualità di rendering.

### Stelle e crediti

- **1 stella:** completa la missione.
- **2 stelle:** completa con precisione ≥ 60%.
- **3 stelle:** completa con precisione ≥ 70% in meno di 90 secondi.
- Colpire una persona senza fascia rossa provoca la sconfitta.
- La ricompensa, da 1.000 a 3.250 crediti, viene assegnata soltanto al primo completamento di ogni missione. Rigiocare può migliorare stelle e record, senza moltiplicare i crediti.

## Stack e avvio

Node.js **24**, TypeScript, Vite, React, Babylon.js e Lucide. Il motore 3D viene caricato solo quando si avvia una missione e viene eliminato all'uscita.

```sh
npm install
npm run dev
```

Apri l'indirizzo mostrato da Vite, con percorso `/snaiper/`.

```sh
npm test
npm run build
npm run preview
```

Per un'installazione identica alla CI, usa **pnpm 11.19.0** e il lockfile incluso:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

## Struttura

```text
src/
  app/App.tsx           Menu, schermate narrative, impostazioni e progressi
  data/missions.ts      Catalogo bilingue delle dieci operazioni
  game/GameCanvas.tsx   HUD React della missione
  game/world.ts         Porto, illuminazione e assemblaggio della scena
  game/runtime.ts      Ciclo missione, sparo, pausa e risultati
  game/aim.ts          Mira touch/mouse/tastiera e zoom
  game/characters.ts   Modelli GLB, animazioni e collisioni sulle ossa
  game/surfaces.ts     Texture procedurali
  game/water.ts        Shader acqua animata
  game/rules.ts         Esiti dei colpi, risultati e calcolo delle stelle
  game/audio.ts         Audio sintetizzato e gestione risorse audio
  services/save.ts      Validazione e salvataggio locale
  styles.css            Interfaccia responsive, HUD e accessibilità
public/
  models/               Modelli umani ottimizzati (~4 MB totali)
  images/               Illustrazione e fotografie di Isa e Docky
  manifest.webmanifest  Configurazione PWA
  sw.js                 Cache offline delle risorse visitate
  icon*.png             Icone PWA
  icon.svg              Favicon
tests/rules.test.ts      Test delle regole di successo e fallimento
.github/workflows/
  pages.yml             Test, build e deployment automatico
```

## Estendere il gioco

### Missioni

`src/data/missions.ts` configura le dieci operazioni: tempo, velocità di pattuglia, numero di obiettivi, ambiente, fazione, colore abiti e ricompensa. App passa la missione selezionata al runtime e al mondo 3D; lo sblocco richiede il completamento della precedente. Per missioni con obiettivi nuovi, estendere il runtime e le condizioni di esito.

### NPC e modelli

`src/game/characters.ts` carica Remy e SWAT con il loader Babylon glTF. Le cinque istanze hanno scheletri indipendenti, animazione idle e camminata procedurale. Collider invisibili seguono testa, busto e arti; i colpi usano questi collider e gli ostacoli del porto. Se il caricamento fallisce vengono usate primitive di riserva.

Provenienza, licenze e adattamenti sono descritti in [Crediti asset](docs/asset-credits.md).

### Texture

`surfaces.ts` genera texture di cemento, metallo e legno; `water.ts` anima l’acqua. Le texture dei personaggi sono incorporate nei GLB, ridimensionate a massimo 768 pixel.

### Audio

`AudioManager` in `src/game/audio.ts` genera suoni provvisori senza file esterni. Per registrazioni future aggiungi i file in `public/sounds/`, decodificali dopo un gesto dell'utente e sostituisci i suoni nel metodo `play()`. Mantieni la gestione degli errori e la liberazione dell'AudioContext.

### Armi

La schermata equipaggiamento in `App.tsx` mostra tre profili. Le statistiche sono indicative e soltanto lo Scout è attivo. Per nuove armi giocabili, estrai una configurazione condivisa, collega caricatore/zoom/ricarica al runtime e salva la selezione. Danno, economia e potenziamenti non sono ancora simulati.

### Qualità e piattaforme

LOW/MEDIUM/HIGH/AUTO regolano la risoluzione interna; AUTO usa la densità dello schermo, non un benchmark del dispositivo. Le ombre dinamiche sono disattivate in LOW, con mappe da 1024 o 2048 pixel negli altri livelli. Il renderer attuale usa WebGL; WebGPU, LOD e qualità adattiva in base agli FPS restano sviluppi futuri. Il pannello debug e l'accesso alla scena per i test esistono solo in development.

## Deploy

### GitHub Pages

Il workflow `.github/workflows/pages.yml` pubblica `dist/` dopo un push su `main`, solo se test e build passano. Nelle impostazioni del repository, **Settings → Pages → Source** deve essere **GitHub Actions**. `vite.config.ts` imposta `base: '/snaiper/'` per il repository attuale.

### Cloudflare Pages / Netlify

Per pubblicare alla radice di un altro dominio, modifica `base` in `vite.config.ts` in `'/'`. Configura Node 24, comando `npm run build` (dopo installazione) e directory di output `dist`. Non sono presenti API server o variabili segrete necessarie. Dopo aggiornamenti incompatibili della cache, incrementa il nome `CACHE` in `public/sw.js`.

## Riferimenti di Isa e Docky

- [Foto di Isa e Docky al Duomo](docs/references/isa-docky.jpeg): aspetto della protagonista e legame con il cane.
- [Foto di Docky](docs/references/docky.jpg): Labrador color miele, muso chiaro, pettorina rossa.
- [Concept originale](docs/references/concept.png): direzione artistica iniziale; non uno screenshot del gameplay.
- [Provenienza e prompt dell'illustrazione](docs/image-generation.md): asset ImageGen creato usando le fotografie come riferimento.

## Roadmap

- [x] Fase 1 — Prima missione giocabile, UI mobile, risultati e salvataggio.
- [x] Fase 2 — Missioni 02–05 e runtime configurabile.
- [x] Fase 3 — Missioni 06–10 e sblocco progressivo.
- [x] Personaggi umani GLB, mira libera con joystick e zoom 8×.
- [ ] Fase 4 — Modelli di Isa e Docky, animazioni avanzate, registrazioni audio, WebGPU, ottimizzazioni su dispositivi reali, spagnolo.
- [ ] Fase 5 — Backend, account, classifiche e potenziamenti.
