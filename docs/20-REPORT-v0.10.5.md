# AE Companion v0.10.5 — coerenza del campo `refreshing`
Base: v0.10.4. **Non dichiarata pronta al rilascio.** Nessun commit, push, deploy o pubblicazione.

## Difetto
In v0.10.4 `refreshing` era aggiunto solo al ramo «tasso presente» di `getFxStatus()`; gli stati senza tasso (creati dalla funzione interna `none()`: `loading`, `unavailable`, `unsupported`, rifiuti) non lo contenevano, quindi `getExchangeRateInfo().refreshing` risultava `false` anche con una richiesta in corso.

## Correzione (`js/fx.js`, solo `getFxStatus()`)
`refreshing: !!fxState.loading` è ora nell'oggetto base da cui derivano tutti gli stati con tasso o senza (compreso `none()`); USD (`identity`) restituisce sempre `refreshing: false`. Il campo duplicato nel ramo «tasso presente» è stato rimosso. Nessun stato modificato: senza tasso e richiesta in corso `loading`; senza tasso e senza richiesta `unavailable`/`unsupported`; tasso scaduto o `held` `stale` anche durante il caricamento; tasso appena aggiornato `ok`/`provisional`. `getExchangeRateInfo()` non è stato toccato (`!!s.refreshing`): ora coincide con lo status.

## Differenze rispetto alla v0.10.4 (`diff -r`)
`js/fx.js` (2 punti in `getFxStatus()`), `tests/check-fx.js` (+33 controlli, nessuno rimosso o modificato), `index.html` (badge), `README.md`, questo report. Nessun altro file: formule, rendite, SRB, AB, dati di gioco, conversione, validazione delle date, impostazioni e logica di cache invariati.

## Test (Node, nessuna rete) — risultati effettivi
- `node tests/run-all.js <v0.9.5>`: check-seo, check-lang-privacy ok; prefs-currency 56; parser 34; i18n 21; srb 68; srb-range 119; srb-routing 127; srb-v094 229; money-format 159; **fx 377** (era 344); **compare-v0100 4817 controlli, 0 falliti**; «Tutte le suite superate». `node --check` su tutti i `.js` di `js/`, `tests/`, `tools/`: nessun errore.
- Sezione O (nuova): 1) senza cache prima della richiesta: `unavailable`, `refreshing` false; 2) richiesta controllata pendente: `loading`, `fxState.loading` true, `getFxStatus('EUR').refreshing` e `getExchangeRateInfo().refreshing` true, nessun tasso e importi «—»; 3) dopo il fallimento: `unavailable`, false; 4) tasso scaduto durante la richiesta: `stale`, true, avviso «Cambio NON aggiornato»; 5) record rifiutati (data futura oltre tolleranza, data impossibile, tasso non valido) senza cache e con cache precedente, e tasso `held`: durante la richiesta `loading`/`stale` con `refreshing` true e nessun tasso creato o usato, a richiesta conclusa `refreshing` false; 6) successo: `ok` (0,85) e `provisional` con `refreshing` false; 7) `unsupported` (false) e `loading` (true); coerenza status/info per tutte le 36 valute con e senza richiesta, USD sempre false.
- Prova di efficacia: la nuova suite sul codice v0.10.4 → **16 falliti** (tutti gli stati senza tasso con richiesta in corso: `refreshing` assente/false); sul codice v0.10.5 → 0.

## Verifiche reali della fonte e limiti
Nessuna nuova lettura dell'API. Restano i limiti dei report docs/15 §8, 17 §6, 18 e 19 (nessun test su browser/iPhone, chiamata remota automatica da approvare, avviso «provvisorio» frequente col feed reale, orologio del dispositivo, ecc.). `refreshing` è oggi solo un dato di stato: nessun elemento dell'interfaccia lo mostra.
