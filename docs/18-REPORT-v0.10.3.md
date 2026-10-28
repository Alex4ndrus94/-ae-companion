# AE Companion v0.10.3 — audit finale delle date FX
Base: v0.10.2 revisionata. **Non dichiarata pronta al rilascio**: seguirà un'altra revisione indipendente. Nessun commit, push, deploy o pubblicazione.

## A. Data futura entro la tolleranza → stato «provisional»
- Nuovo stato `provisional` in `getFxStatus()`: il tasso resta **utilizzabile** (stessa conversione, stessa data della fonte, mai riscritta) ma **non è dichiarato aggiornato**. Vale solo se la data è futura di ≤ `futureToleranceDays` (1) e il tasso non è già «non aggiornato» (scaduto/vecchio/`held`: in quel caso prevale `stale`).
- Lo stato è **derivato** da data del tasso e orologio, non memorizzato: si mantiene quindi in cache e dopo ricaricamento, passa a `ok` da solo quando la data diventa «oggi» (stesso record, stessa data), torna `ok` dopo un aggiornamento con data valida, ed è per-valuta (cambio valuta: EUR provvisorio, JPY `ok`; USD senza note).
- Avviso visibile IT/EN (`fxNoteProvisional`, `assistantCurrencyNoteProvisional`): nella nota della dashboard e su ogni risposta dell'assistente con importi, con la data futura della fonte e «PROVVISORIO / PROVISIONAL … non confermato come aggiornato».
- Oltre la tolleranza: invariato (scarto per valuta, cache precedente valida con avviso, oppure «—»). Calcoli interni, USD e `settings.js` non toccati.
- **Documentato:** la tolleranza di 1 giorno è una scelta prudenziale (fusi orari fino a UTC+14), **non una garanzia del fornitore** (commento in `config.js` e questo report).

## B. Calendario rigoroso
`fxIsDate()` ora scompone `YYYY-MM-DD`, ricostruisce la data (anno/mese/giorno, bisestili inclusi) e richiede coincidenza esatta con la stringa: prima `2026-02-30` passava (JavaScript la normalizza in 2026-03-02). Un record con data o tasso non valido (supportato ma scartato) non entra mai in cache, **non invalida la risposta**, e per la valuta interessata dà `unavailable` (non più «valuta non supportata»), con la stessa conservazione della cache precedente valida marcata «non aggiornato» usata per le date future. Anche una cache con data impossibile viene ignorata.

## Differenze rispetto alla v0.10.2 (`diff -r`)
`js/fx.js`, `js/money.js` (stato/nota/assistente), `js/i18n.js` (+2 stringhe IT/EN: `fxNoteProvisional`, `assistantCurrencyNoteProvisional`), `js/config.js` (solo commento), `tests/check-fx.js`, `index.html` (badge), `README.md`, questo report. Nessun altro file (sandbox, settings, formule, SRB, AB, tabelle, preferenze invariati).

## Aspettative di test cambiate (motivo esatto)
Tre controlli della v0.10.2 asserivano «ok» per una data +1 giorno (L5, L8, L15): ora asseriscono `provisional`, come chiesto dall'audit (stesso tasso utilizzabile, stesse date). L15 verifica inoltre che i tassi restino quelli della fonte (0,89113 / 157,13 / 0,376). Nessun altro test modificato o rimosso.

## Test eseguiti (Node, nessuna rete) e risultati osservati
- `node tests/run-all.js <v0.9.5>`: check-seo, check-lang-privacy ok; prefs-currency 56; parser 34; i18n 21; srb 68; srb-range 119; srb-routing 127; srb-v094 229; money-format 159; **fx 303** (era 243); **compare-v0100: 4817 controlli, 0 falliti**; «Tutte le suite superate».
- `node --check` su tutti i `.js` di `js/`, `tests/`, `tools/`: nessun errore.
- Sezione M (nuova): date valide 2026-02-28, 2024-02-29 (e 2000-02-29, 2026-12-31…); invalide 2026-02-29/30/31, 2026-04-31, 2026-13-01, 2026-00-10, 1900-02-29, giorno 00/32, formati non ISO, stringhe vuote/spazi, valori non stringa; controllo che JavaScript normalizzerebbe 2026-02-30; risposta mista con data impossibile (non in cache, altri record validi, EUR `unavailable` «—», con cache precedente 0,8 «non aggiornato»); cache con data impossibile ignorata; domani entro tolleranza → `provisional` (non live, data non riscritta, avviso IT/EN in nota, dashboard, assistente); ricaricamento; stesso giorno; giorno successivo → `ok` da solo e avviso rimosso; aggiornamento riuscito con data valida → `ok`; cambio valuta; USD; tolleranza 0 e oltre tolleranza invariati; correzione settings v0.10.1 intatta con tasso provvisorio.
- Prova di efficacia: la nuova suite sul codice v0.10.2 → **25 falliti** (es. `2026-02-30` accettata e mostrata come 0,10 €; +1 giorno «ok» senza avviso); sul codice v0.10.3 → 0.

## Verifiche reali della fonte
In questa sessione **nessuna nuova lettura**. Restano: la lettura del 24/10/2026 (report v0.10.2) e la lettura del 25/10/2026 fatta dall'audit (EUR datato 2026-10-26), che conferma che +1 giorno è ricorrente nel feed reale. Non ripetibile dai test automatici.

## Limiti aperti
1. Con il feed reale quasi ogni valuta principale è datata +1 giorno: nella pratica gli utenti vedranno spesso l'avviso «PROVVISORIO». È la conseguenza voluta della regola; se il revisore lo giudica troppo rumoroso va deciso se mostrarlo come nota meno vistosa o ridurre/azzerare la tolleranza (con 0: «—» sulle principali).
2. Il motivo della data avanti nel feed non è documentato dal fornitore; il fuso (UTC+14) è un'ipotesi prudente.
3. L'orologio del dispositivo resta il riferimento di «oggi» (orologio sbagliato → stati sbagliati).
4. Restano i limiti di docs/15 §8 e docs/17 §6 (nessun test su browser/iPhone, chiamata remota automatica da approvare, tassi blended, elenco valute e soglie scelti da me).
