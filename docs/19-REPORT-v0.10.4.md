# AE Companion v0.10.4 — cache dei rifiuti e stato «non aggiornato» durante il caricamento
Base: v0.10.3. **Non dichiarata pronta al rilascio**: richiede nuova revisione indipendente. Nessun commit, push, deploy o pubblicazione.

## 1. Persistenza dei record rifiutati (`js/fx.js`)
- `fxSaveCache()` ora salva anche `future` (`{codice: "YYYY-MM-DD"}`, data futura oltre tolleranza) e `invalid` (array di codici con data impossibile o tasso non valido). **Mai** il tasso né la data impossibile del record rifiutato.
- `fxLoadCache()` valida rigorosamente tutto: `future` accettato solo come oggetto semplice, con codici supportati (non USD), data valida secondo `fxIsDate()` e **solo per valute senza tasso in cache** (il tasso validato prevale); `invalid` solo come array di codici supportati senza tasso. Campi mancanti (cache v0.10.0–v0.10.3), di tipo sbagliato o con voci non valide (`XXX`, `USD`, `__proto__`, numeri, null, date impossibili/non ISO) sono ignorati. Questi campi non possono mai produrre un tasso: al massimo lo stato `unavailable`. La cache resta nella stessa versione di formato (`v:1`, campi additivi).
- Effetto: dopo il ricaricamento senza rete una valuta rifiutata per data futura resta `unavailable` con la data futura e il messaggio «data nel futuro» (non `unsupported`); con data impossibile resta `unavailable` (messaggio generico «non disponibile»); una valuta davvero assente dalla risposta resta `unsupported`. Un tasso precedente valido, conservato e marcato `held`, resta utilizzabile ma `stale` anche dopo il ricaricamento; gli altri tassi validi funzionano.

## 2. `stale` non sparisce durante il caricamento
In `getFxStatus()` la condizione `old && !loading` è stata rimossa: un tasso scaduto, vecchio o `held` resta `stale` **prima, durante e dopo una richiesta fallita**, e diventa `ok`/`provisional` solo quando un tasso valido lo sostituisce. Il caricamento è esposto a parte nel campo `refreshing` (anche in `getExchangeRateInfo().refreshing`), senza toglierne l'avviso. Invariato lo stato `loading` quando non esiste alcun tasso. Conseguenza voluta: con cache scaduta l'avviso «Cambio NON aggiornato» compare anche nei secondi della richiesta all'avvio.

## 3. Differenze rispetto alla v0.10.3 (`diff -r`)
`js/fx.js`, `js/money.js` (solo campo `refreshing`), `tests/check-fx.js` (+41 controlli, nessuno rimosso o modificato), `index.html` (badge), `README.md`, questo report. Nessun altro file; `settings.js`, formule, SRB, AB, USD, date strette e stato `provisional` non toccati.

## 4. Test e risultati effettivi (Node, nessuna rete)
- `node tests/run-all.js <v0.9.5>`: check-seo, check-lang-privacy ok; prefs-currency 56; parser 34; i18n 21; srb 68; srb-range 119; srb-routing 127; srb-v094 229; money-format 159; **fx 344** (era 303); **compare-v0100: 4817 controlli, 0 falliti**; «Tutte le suite superate». `node --check` su tutti i `.js`: nessun errore.
- Nuova sezione N: (1) risposta mista EUR futuro oltre tolleranza + JPY/CAD validi; (2) ricaricamento da cache e rete assente (prima e dopo `fxInit()`): EUR `unavailable` con data futura e nota appropriata, JPY/CAD ok, GBP assente `unsupported`; (3) stesso scenario con `2026-02-30`; (4) cache precedente valida EUR 0,8: conservata, `held` e rifiuto salvati, dopo ricaricamento `stale` utilizzabile (8,00 €); (5) cache senza campi nuovi, con campi di tipo sbagliato (stringa/array/numero/null/oggetto), con voci non valide, con tassi stringa/negativi/zero/null o data impossibile, con data futura oltre tolleranza: nessun tasso non valido accettato; (6) cache scaduta con richiesta in sospeso (fetch controllato manualmente): `stale` prima e durante, avviso presente, `refreshing` true; anche con `held` e con data futura (stale prevale su provvisorio); (7) richiesta fallita: resta `stale` con 0,8; (8) richiesta riuscita: `ok` col nuovo tasso e marcatura `held` rimossa; senza cache: `loading` poi `unavailable`. (9) Regressioni: tutte le sezioni preesistenti (provvisorio M, date strette M1–M2, correzione settings G2, date L) passano invariate.
- Prova di efficacia: la nuova suite sul codice v0.10.3 → **17 falliti** (es. N2: EUR rifiutato diventava «non fornisce la valuta EUR» dopo il ricaricamento; N6d/N6f/N6h: durante la richiesta lo stato passava a `ok`/`provisional` e l'avviso spariva); sul codice v0.10.4 → 0.

## 5. Verifiche reali della fonte
Nessuna nuova lettura in questa sessione (restano quelle registrate nei report v0.10.2/v0.10.3).

## 6. Limiti aperti
1. Se l'intera risposta è inutilizzabile (nessun record valido) la cache **non** viene riscritta: il motivo specifico del rifiuto resta solo in memoria e dopo un ricaricamento torna lo stato derivato dalla cache precedente.
2. Un rifiuto persistito per una valuta resta finché un aggiornamento riuscito non produce un tasso valido per quella valuta (o la risposta non la contiene più, caso in cui diventa `unsupported`); non scade da solo.
3. Con cache scaduta l'avviso «non aggiornato» compare anche durante il breve caricamento all'avvio (scelta richiesta dall'audit).
4. Restano i limiti di docs/15 §8, docs/17 §6 e docs/18 (avviso «provvisorio» frequente col feed reale, orologio del dispositivo, nessun test su browser/iPhone, chiamata remota da approvare).
