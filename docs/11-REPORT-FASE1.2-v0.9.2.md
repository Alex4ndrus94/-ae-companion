# Report Fase 1.2 — AE Companion v0.9.1 → v0.9.2

Nulla è stato committato, pubblicato o deployato su GitHub.

## File modificati
| File | Modifica | Motivo |
|---|---|---|
| `js/income.js` | Nuove `getSRBView()` e `getSRBDisplay()` (solo wrapper di `getSRBBreakdown` e `getSRBDailyBoundsUSD`; estremi limitati con min/max per garantire low ≤ centrale ≤ high nonostante l'arrotondamento in virgola mobile). Formule invariate. | Fonte unica per dashboard e assistente |
| `js/app.js`, `index.html`, `css/style.css` | Riga «Intervallo teorico» e nota esplicativa (nascoste se non rilevanti); nota di ripartizione abbreviata; versione v0.9.2 | Mostrare l'incertezza senza duplicare testo |
| `js/assistant.js` | `isSRBQuestion()` + gestore SRB in testa (dopo i what-if numerici), `getSRBAssistantReply()`; rimosso il vecchio gestore SRB | Le domande SRB non sono più intercettate da «boost», «quanto rendo», ecc. |
| `js/i18n.js` | Testi IT/EN: risposte SRB, intervallo, nota, avviso conversione EUR; eliminato «~2,5 giorni/mese» da nota SRB, risposta assistente e consiglio AB | Frequenza mensile non verificata |
| `js/money.js` | Estratta `getCurrencyRateLabel()` (output di `getCurrencyNoteText` invariato) | Riutilizzo |
| `js/config.js` | Rimossa `srbDaysPerMonthAssumption` (non più usata) | Ipotesi non verificata |
| `tools/build-pages.js`, `guides/calcolo-rendita/index.html` | Paragrafo SRB con intervallo; pagina rigenerata (generatore verificato idempotente) | Coerenza |
| `tests/*` | Nuovo `check-srb-range.js` (122 controlli); `regression-compare.js` e `run-all.js` aggiornati | Test richiesti |

## Comportamento
- ≤150.000 terreni: stima esistente, nessun intervallo. Oltre: stima centrale + intervallo teorico + nota (ordine di acquisizione ignoto, ripartizione proporzionale, scenari estremi, non intervallo statistico né garanzia).
- Se oltre il limite gli estremi coincidono (es. una sola rarità, o differenza sotto il centesimo) l'intervallo **non** viene mostrato (nessun intervallo artificiale); resta la nota di ripartizione ×50/ordinario.
- Importi in valuta scelta; in EUR l'assistente aggiunge che è una conversione indicativa, non la rendita erogata dal gioco (la dashboard mostrava già la nota sul cambio).
- Riconoscimento SRB: «srb», «super rent boost», «super potenziamento», «super boost», ×50/x50/50x, oppure boost/potenziamento/rent boost insieme a «evento/event». «quanto rendo», «boost», «rent boost» o «zona morta» da soli restano ai gestori normali.

## Test eseguiti (Node v22, sandbox vm)
`node tests/run-all.js <cartella-v0.9.1>`: check-seo, check-lang-privacy, check-prefs-currency (56), check-parser (34), check-i18n (21), check-srb (68), **check-srb-range (122)**, regression-compare (80/80 scenari ordinari identici; 36/36 casi di confine con tutti i numeri identici a v0.9.1, cambia solo il testo SRB dell'assistente). Tutte superate. La UI è testata caricando il vero `app.js` in un DOM finto, non in un browser.

Copertura richiesta: 1–12 (casi 0, 1, 150.000, 150.001, 150.100, 200.000 misti, badge, ordinamento, coincidenza, UI, valori identici, 4 combinazioni lingua/valuta) e 13–21 (domande SRB, generiche, zona morta, profilo oltre soglia, cambio lingua).

**Non eseguito:** `tests/browser-smoke.js` (puppeteer/Chrome non disponibili qui), nessuna prova su Safari/iOS né verifica visiva del layout.

## Esempi di risposta dell'assistente (generati dal codice)
**IT sotto (100+40+10+2 = 152 terreni, 12 badge, EUR)** — «Quanto rendo con il super potenziamento?»

> Stima indicativa: durante un giorno di Super Rent Boost (×50) la rendita del tuo profilo sarebbe di circa 0,84 € al giorno. Vale solo mentre l'evento è attivo; durata e frequenza non sono garantite. Ipotesi: bonus badge incluso, boost ordinario non sommato al ×50 (cumulabilità non confermata ufficialmente). È una stima, non un guadagno garantito. Importi in euro: conversione indicativa (1 USD = 0,86 EUR, cambio fisso non ufficiale), non la rendita erogata dal gioco.

**EN sotto (100+40+10+2 = 152 terreni, 12 badge, USD)** — «How much do I earn during Super Rent Boost?»

> Rough estimate: during one day of Super Rent Boost (×50) your profile's income would be about $0.97 per day. It only applies while the event is active; duration and frequency are not guaranteed. Assumptions: badge bonus included, regular boost not added on top of ×50 (stacking is not officially confirmed). This is an estimate, not guaranteed earnings.

**IT sopra (200.000 terreni, 12 badge, EUR)** — «Quanto guadagno durante il Super Rent Boost?»

> Stima centrale durante un giorno di Super Rent Boost (×50): 981,47 € al giorno. Intervallo teorico: 797,07 €–1075,62 € al giorno. L'intervallo riflette l'ordine di acquisizione sconosciuto dei terreni (l'app conserva le quantità per rarità, non la cronologia). La stima centrale ripartisce proporzionalmente le rarità; i valori estremi sono scenari teorici, non previsioni garantite né un intervallo statistico. Ipotesi: hai 200.000 terreni, il ×50 vale per i primi 150.000 e gli altri 50.000 rendono con il boost ordinario ×2 (attivo 24 ore su 24); bonus badge incluso; boost ordinario non sommato al ×50. È una stima, non un guadagno garantito. Importi in euro: conversione indicativa (1 USD = 0,86 EUR, cambio fisso non ufficiale), non la rendita erogata dal gioco.

**EN sopra (200.000 terreni, 12 badge, USD)** — «What would my rent be during SRB?»

> Central estimate for one day of Super Rent Boost (×50): $1,141.24 per day. Theoretical range: $926.83–$1,250.73 per day. The range reflects the unknown order in which parcels were acquired (the app keeps quantities per rarity, not the history). The central estimate distributes rarities proportionally; the endpoints are theoretical scenarios, not guaranteed outcomes nor a statistical interval. Assumptions: you own 200,000 parcels, ×50 applies to the first 150,000 and the other 50,000 earn at the regular ×2 boost (active 24 hours a day); badge bonus included; regular boost not added on top of ×50. This is an estimate, not guaranteed earnings.


## Limiti aperti
- Il «quanto rendo» con scenario ipotetico («…con 200.000 terreni durante l'SRB») viene gestito dai what-if ordinari, non dall'SRB.
- «Durante l'evento» senza parola boost/potenziamento non è trattata come SRB (evento ambiguo): decisione da confermare.
- Cumulabilità di ×50 e boost ordinario, durata/frequenza SRB, soglie badge e tasso EUR/USD restano non verificati ufficialmente (invariati).
- Gli estremi dell'intervallo sono scenari teorici, non statistici.
- Layout della nuova riga/nota non verificato su dispositivi reali.
