# Uscite granaio/navicella + Piano tenuto

**Date:** 2026-09-12  
**Status:** draft, awaiting product review  
**Palco:** giorno, sprite pieni, dock Apple. Niente notte, fantasmi, samurai, arcade.

## Goal

Quando chiami dal dock, le **bestie escono dal granaio rosso** e gli **strani dalla navicella**. Il **Piano** non è un animale: dal dock si apre la barra in alto con i tasti. Tieni premuto = suono continuo; in orchestra ogni nota dura **quanto l’hai tenuta**.

## Chi esce da dove

| Chi | Da dove | Poi |
| --- | --- | --- |
| Gallina, mucca, maiale, pappagallo | Porte bianche a X del **granaio** (dietro-destra del recinto) | Camminano **dentro il recinto** |
| Blippo, Kicko, Snarix, Zizz | **In alto a sinistra della staccionata** (sotto la navicella) | Camminano **dentro il recinto** |
| Piano | Da nessuna parte | Nessuno sul palco |

Le porte del granaio e il portellone danno sul cortile: **non** girano fuori dal recinto e **non** entrano dal varco davanti. Il varco resta solo per **CONFERMA** (pascolo davanti) e per il rientro a **FERMA**.

Appaiono sulla soglia (non in mezzo al prato) e si vedono uscire. Se la soglia è coperta dal tetto/navicella, restano visibili appena fuori dalla porta.

**Fuori scope:** tornare *dentro* granaio o navicella a FERMA. A FERMA rientrano nel recinto, come ora.

## Piano: non è un animale

- Resta **ultimo icona nel dock**.
- Toccarlo **non** chiama nessuno in fattoria: si apre il **menu in alto**, come per un animale, con REGISTRA / CONFERMA / CANCELLA e la piccola barra di tasti **A S D F G H J K L**.
- Nessuno sprite, nessuna corsa, nessun tag sul palco.
- Hover dock: «Piano», non «Chiama in fattoria».
- L’icona Piano resta usabile anche se il recinto è pieno. Non occupa un posto da animale.
- **CONFERMA** sul piano = la linea è pronta per l’orchestra. Nessuno esce dal varco.
- **Ottava** solo dopo che ci sono note e non stai più registrando (invariato).
- **CANCELLA** butta le note.
- Il giro REGISTRA → FERMA REGISTRAZIONE → CONFERMA → urlo farmer → FERMA non cambia per le bestie.

Se il menu piano è aperto e chiami una bestia, lei esce dal suo edificio e il menu passa a lei. Ritocchi Piano nel dock: il menu torna al piano, lei resta in fattoria.

## Tasto tenuto

Oggi il synth fa un colpo corto e si spegne anche se tieni. Deve:

- **Key down / dito giù** → parte e resta acceso.
- **Key up / dito su** → si spegne.
- Tastiera e tasti sul mini piano si comportano uguale.
- Puoi tenere **più tasti insieme**.
- Se stai ancora tenendo quando fermi la registrazione, quella nota si taglia lì.

In registrazione e in orchestra, ogni nota dura **quanto l’hai tenuta**, non fino alla nota dopo e non un secondo fisso.

Sulla timeline, le note del piano si vedono come **tratti** (inizio → fine), non solo pallini. Le bestie restano pallini. In UI non si scrive “pallino” / “nota”.

Con il menu piano aperto, **A S D F G H J K L** suonano i tasti (non chiamano le bestie). Con una bestia selezionata, quei tasti restano i suoi, come ora.

L’orchestra suona la linea del piano anche senza un corpo sul palco, se è CONFERMA. Il farmer parte anche se pronta c’è solo quella linea.

## Cosa non fare

- Non pushare il git Desktop su `mattia-candeloro-sito`.
- Non rimettere il Piano come creatura nel recinto (invisibile o visibile).
- Non far uscire bestie/strani dal varco o dal lato sbagliato del palco (granaio è destra, navicella è sinistra).
- Non toccare pose farmer, recinto disegnato, scala sprite, synth “preso online”.
- Non riaprire SCAPPA, Piazza, scritta pallini, 120 BPM in UI.

## Glossario (`CONTEXT.md`)

**Piano:** ultimo nel dock. Non è un animale. Toccarlo apre il menu in alto con i tasti; tieni premuto per tenere il suono; dopo REGISTRA le note vanno in orchestra per quanto le hai tenute.  
_Avoid_: animale, MIDI, DAW, VST, instrument track.

Sotto **CONFERMA**, togliere il secondo `_Avoid_` duplicato se si tocca il file.

## Successo

1. Dock gallina → esce dalle porte del granaio, cammina nel recinto.  
2. Dock Blippo → esce dalla navicella, cammina nel recinto.  
3. Dock Piano → barra in alto con tasti; palco invariato.  
4. Tieni A: suona finché tieni; molla: silenzio.  
5. REGISTRA, tieni una nota, FERMA, CONFERMA, urlo: in orchestra quella nota dura quanto l’hai tenuta.  
6. CONFERMA sul piano: nessuno cammina verso il pascolo.
