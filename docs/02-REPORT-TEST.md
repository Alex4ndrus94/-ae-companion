# Report test

| Test | Come | Esito |
|---|---|---|
| Sintassi di tutti i JS | `node --check js/*.js` | PASS |
| Regressione calcoli | Caricati in `vm` i JS originali e modificati (config, i18n, paesi, player, explorer, storage, engine, strategy, calculator, income, advice); confrontati rendita giorno/mese/anno, senza boost, SRB, boost per fascia e soglia di recupero su 16 scenari (tutti i gruppi Paese × IT/EN) | PASS, output identici |
| Diff file | `diff -r` originale vs nuovo | Cambiati solo `index.html`, `css/style.css`, `debug.html`, `js/i18n.js` (0 righe rimosse da i18n e style) |
| Chiavi i18n | Ogni `data-i18n` di `index.html` esiste in IT ed EN | PASS |
| Title/description/canonical/H1 | `node tests/check-seo.js` su tutte le pagine indicizzabili | PASS |
| Sitemap | Struttura XML, nessun duplicato, ogni URL corrisponde a una pagina esistente e indicizzabile | PASS |
| JSON-LD | `JSON.parse` su tutti i blocchi | PASS (sintassi) |
| Link/asset interni | Verifica dell'esistenza dei file puntati da href/src | PASS |
| noindex | `404.html` e `debug.html` fuori sitemap | PASS |
| Lighthouse / Core Web Vitals | — | NON ESEGUITO |
| Test su Safari iPhone / layout reale | — | NON ESEGUITO |
| Click-through dell'app in browser (DOM) | `jsdom` non disponibile, nessuna rete | NON ESEGUITO |
| Rich Results Test / validatore schema.org | — | NON ESEGUITO |
| Validazione XML con validatore esterno | — | NON ESEGUITO |
| Refresh diretto delle nuove route su GitHub Pages | Dipende dalla pubblicazione (le cartelle con `index.html` funzionano nativamente) | NON ESEGUITO |
| Link esterni (Instagram, GoatCounter) | Nessuna rete | NON ESEGUITO |
| Test `tests/explorer.test.js` citato nel README | Il file non esiste nello ZIP | NON ESEGUIBILE |

Nota: nessun controllo sulla correttezza delle tabelle di gioco rispetto a fonti ufficiali.
