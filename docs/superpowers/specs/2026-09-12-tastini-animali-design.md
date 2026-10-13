# Tastini sopra le bestie (A–K, si scambiano)

**Date:** 2026-09-12  
**Status:** draft, awaiting product review  
**Palco:** giorno, sprite pieni, dock Apple. Niente notte, fantasmi, samurai, arcade.

## Goal

Ogni bestia in fattoria ha sulla testa un **tastino** con una lettera, in ordine **A S D F G H J K**. Lo tocchi (o premi quella lettera) e senti il verso. I pallini arrivano **solo** dalla lettera (o dal corpo) della bestia che stai registrando. I tastini si **scambiano** trascinandoli da una bestia all’altra.

Il Piano resta senza tastino sul palco.

## Cosa vedi

- Appena una bestia è in fattoria, sopra la testa c’è un bottoncino piccolo con la sua lettera (carta/inchiostro, come il resto dell’HUD).
- Il tastino **segue** la bestia: recinto, pascolo, corsa, rientro.
- C’è sempre, non solo quando è selezionata.
- Il nome sulla testa (il tag di oggi) sparisce: il nome resta nel menu in alto.
- Nessun tastino per il Piano. Nessuna scritta “pallino” / “tasto” / “hotkey” in UI: si vede solo la lettera.

## Chi ha quale lettera

- Prima bestia chiamata → **A**, seconda → **S**, poi D F G H J K.
- Al massimo **8** bestie in fattoria (una lettera ciascuno). L resta del Piano, sulla fascia, mai su una bestia.
- Dopo FERMA le lettere restano su chi le aveva. Si riassegnano solo se le scambi a mano.

## Tocco e tastiera (niente menu che salta)

**Bottoncino**

- Tap: verso di **quella** bestia. Il menu in alto **non** cambia (resta sulla gallina se stavi sulla gallina).
- Non apre il menu, non chiama nessuno dal dock.

**Tastiera** — stesso significato del bottoncino, **tranne** quando il menu Piano è aperto (allora A–L sono il piano).

- A suona chi ha A, S chi ha S, ecc.
- Il menu non salta.

**Corpo della bestia** (non il tastino)

- Fuori da REGISTRA: come ora — verso + menu di lei.
- In REGISTRA, se è **lei** quella in registrazione: verso + pallino (come la sua lettera).
- In REGISTRA, se è **un’altra**: verso, nessun pallino, menu resta.

## REGISTRA (esempio gallina = A)

Stai registrando la gallina.

| Gesto | Verso | Pallino sulla gallina |
| --- | --- | --- |
| A (tastiera o tastino) | gallina | sì |
| Corpo della gallina | gallina | sì |
| S, D, F… (tastiera o tastino) | quella bestia | no |
| Corpo di un’altra bestia | quella bestia | no |

Si registra **solo** la lettera della bestia in REGISTRA (e il suo corpo). Le altre si sentono e basta.

Stai registrando il Piano: la tastiera e la fascia sono il piano (linee melodiche). I tastini delle bestie continuano a farle sentire e **non** sporcano la linea del piano.

## Scambio

- Trascini il tastino **sopra un’altra bestia** (corpo o il suo tastino): si **scambiano**. Es. A sulla mucca, S torna sulla gallina.
- Lo lasci sul prato / recinto / farmer: **torna** indietro, nessuno scambio.
- Non lo metti sul Piano (non c’è corpo).
- Si scambia solo a fattoria ferma: **non** durante REGISTRA, **non** in orchestra. In quei momenti i tastini restano inchiodati.

## Orchestra e Piano

- **Orchestra:** i tastini restano visibili (sai chi è A). Tap e tastiera **non** suonano live: suona l’orchestra. Niente scambi.
- **Menu Piano aperto:** tastiera = piano. I bottoncini sopra le bestie, se li tocchi, le fai ancora sentire.
- Giro REGISTRA → FERMA REGISTRAZIONE → CONFERMA → urlo → FERMA: invariato per le bestie.

## Glossario (`CONTEXT.md`)

**Tastino:** il bottoncino con la lettera sopra la testa della bestia. In ordine A S D F G H J K. Tap (o la stessa lettera sulla tastiera) = verso di lei. Trascinalo su un’altra bestia per scambiare.  
_Avoid_: hotkey, shortcut, pad, MIDI

**Tasto:** aggiornare: durante REGISTRA, solo la lettera di **quella** bestia lascia un pallino; le altre lettere suonano le altre bestie senza registrare. Con il menu Piano aperto, A–L sono il piano.

## Cosa non fare

- Non pushare il git Desktop su `mattia-candeloro-sito`.
- Non mettere un tastino sul Piano né far uscire il Piano in fattoria.
- Non far lasciare pallini a S mentre registri chi ha A.
- Non far saltare il menu quando tocchi il tastino o premi la lettera.
- Non toccare uscite granaio / alto-sinistra staccionata, fascia Piano −/tasti/+, pose farmer, recinto disegnato.
- Non riaprire SCAPPA, Piazza, scritta pallini, 120 BPM in UI.

## Successo

1. Chiami gallina poi mucca: sopra la gallina **A**, sopra la mucca **S**.
2. Menu sulla gallina, tap su S: senti la mucca, il menu resta gallina.
3. Trascini A sulla mucca: mucca = A, gallina = S.
4. REGISTRA gallina (A): A e il suo corpo lasciano pallini; S suona la mucca e la sequenza della gallina resta pulita.
5. Menu Piano aperto: tastiera = piano; tap sul tastino della gallina = verso gallina.
6. Orchestra: i tastini si vedono, non si scambiano, non suonano sopra il giro.
7. Lo lasci cadere sul prato: torna sulla sua bestia.
