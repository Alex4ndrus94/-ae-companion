# AE Companion v0.10.1 — correzione post-audit
Base: ZIP v0.10.0 revisionato. **Non dichiarata pronta al rilascio**: richiede una nuova revisione indipendente. Nessun commit, push, deploy o pubblicazione.

## Problema
`openSettings()` memorizza `settingsOpenRate = getFxRate(valuta)`; senza cambio è `NaN` e l'obiettivo è mostrato vuoto. `saveSettings()` passava quel `NaN` a `convertFromDisplay()`, che per un `rate` non valido ripiega sul tasso corrente: se il cambio arrivava a pannello aperto, un obiettivo digitato veniva salvato con un tasso non disponibile quando il campo era stato mostrato.

## Correzione (unico cambio di logica: `js/settings.js`, `saveSettings()`)
Se l'obiettivo è modificato e la valuta di apertura non è USD, `settingsOpenRate` deve essere un numero finito e > 0; altrimenti il salvataggio è rifiutato con il messaggio già previsto (`fxTargetNeedsRate`) e **nessun** dato viene scritto (il rifiuto avviene prima di qualsiasi modifica al profilo; i campi restano nel pannello). Non si usa mai un tasso arrivato dopo. Invariati: obiettivo non modificato (altri dati salvati, USD originale identico), USD, tasso valido all'apertura (anche non aggiornato). `money.js` e tutto il resto non sono stati toccati.

## Differenze rispetto allo ZIP v0.10.0 revisionato (`diff -r`)
`js/settings.js` (la correzione), `tests/check-fx.js` (+15 controlli, nessuno rimosso o modificato), `index.html` (badge v0.10.1), `README.md` (nota versione), `docs/16-…` (questo file). Nessun altro file.

## Test eseguiti
Nuova sezione G2 in `tests/check-fx.js`: apertura senza tasso EUR; tasso valido che arriva a pannello aperto; obiettivo modificato → rifiutato (USD resta 5, non 12,5); nessun altro dato alterato e **nessuna scrittura** in localStorage (nome, terreni, AB, obiettivo, preferenze); messaggio mostrato; obiettivo non modificato → altri dati salvati e USD identico; tasso valido all'apertura (0,8) con tasso corrente 0,9 → 10 EUR = 12,5 USD; tasso valido ma non aggiornato → salvato; USD invariato; tasso di apertura 0, −1, Infinity → rifiutato.
Verifica che i test rilevino il bug: eseguiti sul codice v0.10.0 revisionato → **7 falliti** (G2c, G2d, G2e, G2f, G2m×3); sul codice corretto → 0.
`node tests/run-all.js <v0.9.5>` (anche dallo ZIP estratto): check-seo, check-lang-privacy ok; prefs-currency 56; parser 34; i18n 21; srb 68; srb-range 119; srb-routing 127; srb-v094 229; money-format 159; **fx 214** (era 199); **compare-v0100 4817 controlli, 0 falliti** (risultati grezzi identici a v0.9.5). Nessun test preesistente eliminato o indebolito.

## Limiti aperti
Invariati rispetto al report v0.10.0 (docs/15, §8): API reale mai chiamata, nessun test su browser/iPhone, chiamata remota automatica da approvare, tassi blended, scelte su valute/soglie.
