# CAPI: SHADOW MISSIONS

Una prima demo giocabile di uno sniper game narrativo 3D, mobile-first. Isa, nome in codice **CAPI**, e il Labrador color miele **Docky** indagano su un carico sospetto.

## Gioca alla demo

**[Apri CAPI: Shadow Missions su GitHub Pages](https://hugoreynoso.github.io/snaiper/)**

Su smartphone è consigliata la modalità orizzontale durante la missione. Servono un browser con WebGL e accelerazione hardware. La prima visita richiede una connessione; dopo il caricamento, il service worker conserva le risorse visitate per l'uso offline.

![Isa e Docky — illustrazione della home](public/images/isa-docky-hero.webp)

## Cosa puoi giocare

La missione 01, **Operazione Porto Nero**, è completa: home → operazioni → briefing → porto 3D → vittoria/sconfitta → risultati → salvataggio.

- Porto procedurale con nave, gru, container, casse, magazzino e cinque NPC animati con primitive.
- Un responsabile con giacca rossa e telefono, due uomini armati e due lavoratori con casco giallo.
- Mira tramite trascinamento, zoom 1×–4×, sparo dal centro del mirino con raycasting e ostacoli solidi.
- Tre colpi per caricatore; ricarica di 1,8 secondi con munizioni di riserva illimitate nella demo.
- Respiro stabile per 4 secondi, riutilizzabile dopo 8 secondi dall'attivazione.
- Docky Scan evidenzia il responsabile per 5 secondi, con recupero di 30 secondi.
- Colpire il responsabile completa la missione. Colpire qualsiasi altra persona o superare 90 secondi la fa fallire.
- Pausa manuale e automatica quando la pagina passa in background.
- Stelle, miglior tempo, miglior precisione, crediti e impostazioni persistenti in localStorage, con recupero da dati corrotti.
- Equipaggiamento, dossier con le fotografie di riferimento, impostazioni, italiano e inglese.
- PWA con manifest, icone e service worker; audio sintetizzato via Web Audio.

Le missioni **02–10 sono anteprime bloccate**, non livelli giocabili. Solo **SR-01 Scout** è disponibile. La demo usa NPC e ambienti geometrici: non contiene ancora modelli realistici di Isa e Docky, una simulazione balistica, backend o classifiche.

## Controlli

| Azione | Touch / mouse | Tastiera |
| --- | --- | --- |
| Mirare | Trascina sul porto | — |
| Zoom | Pulsanti +/− o rotella | Frecce su/giù |
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
- Colpire una persona diversa dal responsabile provoca sempre la sconfitta.
- I 1.000 crediti vengono assegnati soltanto al primo completamento. Rigiocare può migliorare stelle e record, senza moltiplicare i crediti.

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
  game/GameCanvas.tsx   Ciclo missione, HUD, input e controllo camera
  game/world.ts         Porto, materiali, NPC e animazioni procedurali
  game/rules.ts         Esiti dei colpi, risultati e calcolo delle stelle
  game/audio.ts         Audio sintetizzato e gestione risorse audio
  services/save.ts      Validazione e salvataggio locale
  styles.css            Interfaccia responsive, HUD e accessibilità
public/
  images/               Illustrazione e fotografie di Isa e Docky
  manifest.webmanifest  Configurazione PWA
  sw.js                 Cache offline delle risorse visitate
  icon*.png             Icone PWA
  icon.svg              Favicon
.tests/                 (vedi tests/ nella radice)
tests/rules.test.ts      Test delle regole di successo e fallimento
.github/workflows/
  pages.yml             Test, build e deployment automatico
```

## Estendere il gioco

### Missioni

Aggiungi o modifica i dati in `src/data/missions.ts`. Il catalogo contiene nome, luogo, descrizione, difficoltà, ambiente, disponibilità, durata e ricompensa. Nella demo il runtime di `GameCanvas.tsx` è specifico per la missione 01: per rendere giocabile una nuova missione occorre implementare il relativo mondo, passare la configurazione al runtime e definire le sue condizioni di esito. Non basta cambiare `available`.

### NPC e modelli

`src/game/world.ts` contiene la factory `npc()` e il tipo `NPC`: ID, tipo, nodo radice, parti, salute, stato vitale, origine e comportamento. Aggiungi le istanze lì e assegna `metadata.npcId` e `metadata.type` a ogni mesh colpibile. `TARGET`, `HOSTILE` e `CIVILIAN` vengono interpretati da `hitOutcome()`.

Per modelli GLB futuri, aggiungi il loader Babylon compatibile, carica il modello sotto lo stesso nodo radice e conserva i metadata sulle mesh. Mantieni la factory di primitive come fallback se il caricamento fallisce. Il loader GLB non è ancora incluso.

### Texture

I materiali sono creati dalla funzione `material()` in `world.ts`. Le texture future possono risiedere in `public/textures/`: usa `import.meta.env.BASE_URL` per costruire i percorsi e conserva un colore di fallback. Preferisci texture compresse e dimensioni contenute per smartphone.

### Audio

`AudioManager` in `src/game/audio.ts` genera suoni provvisori senza file esterni. Per registrazioni future aggiungi i file in `public/sounds/`, decodificali dopo un gesto dell'utente e sostituisci i suoni nel metodo `play()`. Mantieni la gestione degli errori e la liberazione dell'AudioContext.

### Armi

La schermata equipaggiamento in `App.tsx` mostra tre profili. Le statistiche sono indicative e soltanto lo Scout è attivo. Per nuove armi giocabili, estrai una configurazione condivisa, collega caricatore/zoom/ricarica al runtime e salva la selezione. Danno, economia e potenziamenti non sono ancora simulati.

### Qualità e piattaforme

LOW/MEDIUM/HIGH/AUTO regolano la risoluzione interna; AUTO usa la densità dello schermo, non un benchmark del dispositivo. Le luci sono limitate e non ci sono ombre dinamiche o post-processing pesanti. Il renderer attuale usa WebGL; WebGPU, LOD, pooling e qualità adattiva in base agli FPS restano sviluppi futuri. Il pannello debug e l'accesso alla scena per i test esistono solo in development.

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
- [ ] Fase 2 — Missioni 02–05, configurazione completa del runtime per missione.
- [ ] Fase 3 — Missioni 06–10 e sblocco progressivo dei livelli implementati.
- [ ] Fase 4 — Modelli realistici, animazioni, registrazioni audio, WebGPU, ottimizzazioni su dispositivi reali, spagnolo.
- [ ] Fase 5 — Backend, account, classifiche e potenziamenti.
