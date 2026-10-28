# AE Companion v0.10.0 — Fase 2: conversione valutaria automatica
Report tecnico per la revisione indipendente. Base: ZIP v0.9.5 allegato. **Versione di sviluppo, non dichiarata pronta al rilascio.**
Nessun commit, push, deploy, pubblicazione o modifica di GitHub è stato eseguito: il lavoro è solo in questo ZIP.

## 1. Analisi del flusso v0.9.5 (fatta prima di modificare)
**Unità interna.** Ogni calcolo di rendita è in **USD** (`income.js`, `config.rentPerSecond`, `player.goal.incomeTargetUSD`, `passCosts`). Gli AB si ottengono da `convertRentUSDToAB(usd)` = USD × 25 e non dipendono dalla valuta.
**Confine di conversione.** Esisteva un solo punto: `convertToDisplay(usd)` / `convertFromDisplay(value, currency)` in `js/money.js`, con tasso fisso `CONFIG.exchangeRate`/`exchangeRateInfo.usdToEur` = 0,86 e solo EUR/USD.
**Chiamanti di `convertToDisplay`** (tutti con valori già in USD, nessun valore già convertito):
- `income.js`: `get*IncomeConverted()` (giorno/mese/anno, con e senza boost), `getIncomePerSecondConverted()`, `getSRBDailyIncomeEstimateConverted()`, `getSRBDisplay()` (stima, minimo, massimo).
- `advice.js`: guadagno per terreno/badge, obiettivo e gap (`getEfficiencyTip`, `getIncomeGoalTip`).
- `assistant.js`: what-if terreni/badge (giorno, mese, anno), rendita attuale, stima SRB.
- `strategy.js`: `formatStrategyMoney(usd)` (converte **dentro** la funzione: la strategia passa USD).
- `settings.js`: apertura (USD → valuta mostrata) e salvataggio (`convertFromDisplay`) dell'obiettivo di rendita.
**Schermate con importi:** dashboard (`app.js`: rendita giorno/mese/anno, base, al secondo, SRB e intervallo), strategia (`strategy.js`/`strategy-ui.js`), consigli e obiettivi (`advice.js`), assistente, card di condivisione (`sharecard.js`: `formatCurrency(getDailyIncomeConverted())`), impostazioni (obiettivo di rendita). **Non monetari e mai convertiti:** terreni, badge, AB, Day Explorer, percentuali, moltiplicatori, boost.
**Dipendenze dal 0,86 fisso:** `config.js` (2 campi), `money.js` (`convertToDisplay`, `convertFromDisplay`, `getExchangeRateInfo`, `getCurrencyRateLabel`), testi i18n (`currencyEstimateNote`, `assistantCurrencyNote`: «1 USD = {rate} EUR, cambio fisso»), `tools/build-pages.js` + guida «Calcolo rendita» (testo statico «tasso fisso 0.86»), alcuni test.
**Preferenze:** `aeLang` e `aeCurrency` (chiavi separate), migrazione idempotente in `prefs.js` (`aePrefsMigration`); utenti esistenti: valuta = quella vista prima (IT→EUR, EN→USD) poi salvata a parte. `PREFS_CURRENCIES` e `SUPPORTED_CURRENCIES` erano due liste `["EUR","USD"]`.

**Piano eseguito.** (1) nuovo `js/fx.js` (sorgente tassi, cache, stato); (2) `money.js`: conversione dal tasso, `NaN` → «—», cifre decimali per valuta, note; (3) `config.js`: via 0,86, nuovo blocco `CONFIG.fx`; (4) elenco valute unico (config) usato da `prefs.js` e `money.js`; (5) `settings.js`: inversione con lo stesso tasso mostrato; (6) `assistant.js`: avviso sul cambio su ogni risposta con importi quando il tasso non è valido/aggiornato; (7) i18n, guida e privacy; (8) test e confronto.

## 2. Fonte dei tassi — Frankfurter v2
Verificato sulla documentazione ufficiale (https://frankfurter.dev/ e `https://api.frankfurter.dev/v2/openapi.json`, v2.1.1), consultate in questa sessione:
- Endpoint usato: `GET https://api.frankfurter.dev/v2/rates?base=USD` (ultimi tassi, senza chiave). Risposta: **array** di `{ "date": "YYYY-MM-DD", "base": "USD", "quote": "EUR", "rate": 0.86 }` (include il record identità USD→USD = 1). Un solo scarico copre tutte le valute (nessun parametro `quotes`: un codice sconosciuto in `quotes` darebbe 422 e farebbe fallire tutto).
- Errori: HTTP 400/404/422 con corpo `{ "status", "message" }`; 503 per sovraccarico. Il sito dichiara 223 valute da 105 fonti ufficiali, aggiornamento giornaliero, nessuna chiave, nessuna quota (solo rate-limit anti-abuso), cache locale **incoraggiata**, uso commerciale gratuito per i tassi blended.
- Nessun endpoint di conversione: si converte localmente (USD × tasso).
- I tassi predefiniti sono **blended** tra i provider, mid-market; per i riferimenti ufficiali la documentazione indica `providers=ecb`. L'app mostra «fonte: Frankfurter» e la data del tasso, non «BCE».
- **Non è stata fatta alcuna chiamata reale** (rete disattivata nell'ambiente di build; lo strumento di fetch non ha accettato l'URL dell'API). Formato e comportamento derivano dalla specifica OpenAPI ufficiale, non da una risposta osservata.

## 3. Architettura
- **USD resta l'unità canonica.** Conversione **una sola volta**, in `convertToDisplay` (confine calcolo/visualizzazione). `formatCurrency*`/`formatMoneyDigits` formattano soltanto.
- `js/fx.js`: `fxParseResponse` (valida), cache `localStorage["aeFxRates.v1"]` = `{v:1, base:"USD", source, fetchedAt, rates{}, dates{}}` (chiave nuova e versionabile; non tocca profilo/preferenze), `getFxStatus(code)`, `getFxRate(code)`, `fxRefresh(force)`, `fxInit()`.
- **Stati** per valuta: `identity` (USD), `ok`, `stale` (non aggiornato), `loading`, `unavailable`, `unsupported` (la fonte non fornisce quella valuta).
- **Scelte mie da approvare:** TTL cache 12 h; data del tasso > 7 giorni = «non aggiornato»; pausa 60 s dopo un errore (salvo ritorno online/cambio valuta); timeout 8 s; elenco di 36 valute selezionabili (`CONFIG.fx.currencies`), usabili solo se presenti nella risposta.
- Cifre decimali: da `Intl.NumberFormat` (JPY 0, EUR/GBP/… 2, KWD/BHD 3). `formatStrategyMoney` usa le cifre della valuta (EUR/USD: identico a prima). `formatCurrencyPrecise` (rendita al secondo) resta a 8 decimali per tutte le valute.
- Lingua e valuta: indipendenti (`getDisplayLocale()` segue la lingua; la valuta è `aeCurrency`).
- **Inversione degli input:** `settings.js` salva il tasso con cui l'obiettivo è stato *mostrato*; se il campo non viene toccato il valore USD salvato resta **esattamente** invariato (in v0.9.5 veniva ricalcolato a ogni salvataggio); se è modificato si divide per lo stesso tasso. Senza tasso: campo vuoto, valore digitato rifiutato con messaggio.

## 4. Cache ed errori (comportamento)
| Situazione | Comportamento |
|---|---|
| Valuta USD | nessuna richiesta, nessuna nota |
| Cache valida (< 12 h) | nessuna richiesta |
| Cache scaduta | riscarica; in caso di successo aggiorna cache e schermata |
| Rete assente / HTTP errore con cache | usa l'ultimo tasso valido, stato `stale`, avviso «Cambio NON aggiornato (ultimo dato del …)» su dashboard e su ogni risposta dell'assistente con importi; cache non toccata |
| Risposta malformata | scartata; cache non sovrascritta; senza cache → `unavailable` |
| Nessun tasso valido | importi «—» ovunque + nota «cambio non disponibile»; **nessun 0,86 né altro valore di ripiego**; calcoli di gioco in USD intatti |
| Valuta non fornita dalla fonte | `unsupported`: «—» + messaggio chiaro; le altre valute funzionano |
| Cambio valuta a runtime | stato `loading` («—») finché il tasso arriva, poi aggiornamento automatico |
Richieste doppie evitate (richiesta in corso condivisa; aggiornamento anche al ritorno in primo piano e online). Un errore API non blocca l'app (promise sempre catturate, rendering protetto).

## 5. File
**Nuovi:** `js/fx.js`, `tests/check-fx.js`, `tests/compare-v0100.js`, questo report.
**Modificati:** `js/config.js` (rimosso 0,86; blocco `fx`), `js/money.js`, `js/settings.js`, `js/prefs.js` (1 riga: elenco valute), `js/assistant.js` (wrapper avviso + nota), `js/strategy.js` (solo `formatStrategyMoney`, cifre per valuta), `js/app.js` (+`fxInit()`), `js/i18n.js` (solo stringhe monetarie IT/EN), `index.html` (script `fx.js`, badge versione), `tools/build-pages.js` + pagine generate `guides/calcolo-rendita/` e `privacy/`, `tests/lib/sandbox.js`, `tests/run-all.js`, `tests/check-prefs-currency.js`, `tests/check-money-format.js`, `README.md`.
**Byte-identici a v0.9.5 (verificato con hash):** `income.js, countries.js, player.js, storage.js, calculator.js, playerEngine.js, advice.js, explorer.js, abtips.js, sharecard.js, ui.js, strategy-ui.js, explorer-ui.js, components.js, navigation.js, install-banner.js`. Per `strategy.js`, `app.js`, `prefs.js`, `assistant.js` lo script di confronto applica la patch inversa e ottiene i file v0.9.5 byte per byte (differenze limitate ai punti dichiarati). Costanti di gioco in `config.js` identiche (confronto profondo).

## 6. Test eseguiti (Node v22, nessuna rete) e risultati reali
`node tests/run-all.js <cartella-v0.9.5>` → **tutte le suite superate**:
- check-seo, check-lang-privacy, check-i18n: superati; check-parser 34; check-srb 68; check-srb-range 119; check-srb-routing 127; check-srb-v094 229 (stessi conteggi di v0.9.5).
- check-prefs-currency 56 e check-money-format 159 (stessi conteggi di v0.9.5, 2 aspettative adattate: vedi §7).
- **check-fx 199 (nuova)**: validazione risposta; USD→EUR/JPY/GBP/CAD/AUD/CHF/KWD con tassi simulati e calcolo manuale; USD=USD senza rete; 0/2/3 decimali; aggiornato, cache valida, cache scaduta, rete assente (con e senza cache), risposta malformata (3 forme + JSON non valido), HTTP 422, valuta non supportata, pausa dopo errore, richieste in parallelo, data troppo vecchia, cache corrotta; inversione degli input (tasso mostrato vs aggiornato, campo non toccato, JPY, senza tasso, cambio valuta nel pannello); assenza di doppia conversione; lingua×valuta indipendenti; importi in dashboard, SRB, strategia, obiettivi, assistente, condivisione (4 combinazioni lingua/valuta) e senza tasso; profilo e preferenze preesistenti invariati; nessun 0,86 nel codice.
- **compare-v0100 (nuova): 4817 controlli, 0 falliti.** 224 scenari v0.9.5↔v0.10.0 (8 gruppi Paese × IT/EN × EUR/USD × 7 profili, da 40 a 200.000 terreni): risultati grezzi del motore **identici con ===**, importi mostrati EUR/USD **identici carattere per carattere** (4816 testi) salvo la nota sul cambio; localStorage identico oltre alla chiave dei cambi. 294 combinazioni v0.10.0 (7 valute × 2 lingue × 3 gruppi × 7 profili): ogni importo = USD × tasso con cifre della valuta (882 verificati con formula indipendente); cambiare lingua non cambia nessun numero economico; cambiare valuta non cambia terreni, badge, AB, obiettivo, boost, SRB USD né i numeri della strategia.
Nessun test usa la rete (la sandbox non ha `fetch`; ogni risposta è simulata).

## 7. Aspettative cambiate (motivo esatto)
1. `check-prefs-currency` B: `setCurrency('GBP')` doveva essere rifiutata perché GBP non era supportata; ora lo è → il test usa `'XXX'` (stesso scopo: codice non supportato rifiutato).
2. `check-money-format` F: leggeva `CONFIG.exchangeRate` (rimosso) → legge `getFxRate('EUR')`, che nella sandbox è il tasso simulato 0,86 (stesso valore, nessun numero atteso modificato).
3. `tests/lib/sandbox.js`: pre-carica una cache dei cambi **simulata** (EUR 0,86, fresca) così i test preesistenti sugli importi in EUR restano deterministici senza rete; `opts.fx`/`opts.fetch` permettono scenari diversi.
4. `run-all.js` non esegue più `regression-compare.js` e `compare-numeric-v095.js`: confrontano coppie v0.9.x con una lista di file fissa e file «protetti» che ora cambiano per scelta (`regression-compare.js` fallisce perché il suo caricatore non include `fx.js`). Restano nel repository come storico; li sostituisce `compare-v0100.js`.
Nessuna aspettativa di calcolo, SRB, formula, rarità o tabella regionale è stata modificata.

## 8. Limiti aperti
1. **API reale non osservata**: formato/CORS/latenza non verificati con una chiamata vera (nessuna rete in build). Da provare al primo avvio reale; la richiesta usa solo l'header `Accept` (non richiede preflight).
2. **Nessun test su browser reale/Safari/iPhone** (`browser-smoke.js` non eseguito: puppeteer assente); il codice è stato eseguito solo in sandbox Node (vm) con DOM finto.
3. **Utenti EUR esistenti offline e senza cache** (primo avvio dopo l'aggiornamento senza rete) vedono «—» finché un download riesce: conseguenza voluta del divieto di ripiego silenzioso su 0,86.
4. **Nuova chiamata remota automatica** con valuta ≠ USD (con USD non parte): è un cambio rispetto al vincolo «nessuna chiamata remota» delle fasi precedenti. Privacy e guida aggiornate; serve la tua approvazione esplicita.
5. Tassi **blended mid-market**, non riferimento ufficiale BCE; per usare solo BCE si può passare a `providers=ecb` (decisione aperta).
6. Elenco di 36 valute scelto da me (non l'intero catalogo di ~165): include valute volatili (ARS, TRY…) per cui il sito sconsiglia usi di trading; da confermare. Le etichette delle valute diverse da EUR/USD vengono da `Intl.DisplayNames` (dipendono dal browser).
7. Soglie TTL 12 h / 7 giorni / pausa 60 s / timeout 8 s sono mie scelte, non dalla documentazione.
8. L'orologio del dispositivo decide la scadenza: un orologio errato può marcare come non aggiornato un dato buono (data di scaricamento futura oltre 1 h = scaduta).
9. La card di condivisione mostra «—» senza tasso e non stampa data/fonte del cambio (importi non modificati rispetto a v0.9.5).
10. Rendita al secondo con 8 decimali per ogni valuta (anche JPY); simboli ambigui disambiguati da Intl (CA$, A$).
11. Nessun service worker: nessuna cache offline dell'app oltre a quella dei cambi.
12. Se il campo obiettivo viene lasciato invariato il USD salvato non è più ricalcolato (miglioramento di comportamento, ma differenza rispetto a v0.9.5).
13. `README.md` e le altre guide non sono state riscritte oltre al necessario; l'architettura SEO internazionale (docs/08) non è stata toccata.

## 9. Conferma
Nessun commit, push, deploy o pubblicazione; nessuna modifica a GitHub; `localStorage` degli utenti non viene cancellato né riscritto (solo la chiave nuova `aeFxRates.v1` e, se l'utente cambia valuta, `aeCurrency`). In attesa della revisione indipendente dello ZIP.
