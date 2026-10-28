# AE Companion v0.10.2 — validazione delle date future dei tassi
Base: v0.10.1 revisionata. **Non dichiarata pronta al rilascio**: richiede nuova revisione indipendente. Nessun commit, push, deploy o pubblicazione.

## 1. Analisi
- **Significato della data.** Ogni record Frankfurter ha `date: "YYYY-MM-DD"`: un *giorno di calendario* senza ora né fuso. L'app lo legge come giorno UTC e lo confronta con la data UTC dell'orologio del dispositivo (`Math.floor(Date.now()/86400000)`), quindi il risultato non dipende dal fuso locale del telefono. Differenza in giorni interi: >0 passato, 0 oggi, <0 futuro.
- **In v0.10.1:** `fxParseResponse()` accettava qualunque data ISO formalmente valida; `getFxStatus()` controllava solo l'età massima (in giorni frazionari, 7,4 giorni = «vecchio»): una data futura risultava `ok`.
- **Verifica reale della fonte (24/10/2026, `web_fetch` di `https://api.frankfurter.dev/v2/rates?base=USD`, risposta intera letta):** array piatto come da specifica; le date variano **per record** (23, 24, 25/10). Con «oggi» = 24/10 (UTC), **molte valute principali sono datate 25/10: EUR 0,89113, GBP, JPY, CAD, AUD, CHF, KWD, SEK, NOK, CNY, INR, TRY… e anche il record USD→USD**; altre (BHD, ARS, CLP, COP…) 23/10, altre (ILS, MXN, BRL…) 24/10. Non è quindi un record isolato: è una caratteristica sistematica del feed (compatibile con un calendario del servizio avanti rispetto a UTC; il 25/10/2026 è domenica). La documentazione ufficiale (pagine JavaScript/Python di frankfurter.dev) conferma: CORS aperto, nessuna chiave, aggiornamento «al più qualche volta al giorno lavorativo», TTL breve sufficiente. Tutte le 36 valute dell'app erano presenti nella risposta.

## 2. Regola adottata (da approvare esplicitamente)
- Tolleranza `CONFIG.fx.futureToleranceDays = 1`: un giorno di calendario può superare di **1** la data UTC (fusi fino a UTC+14); **+1 è giustificato**, **oltre +1 è sospetto**.
- **Motivo della scelta:** con tolleranza 0 la risposta reale di oggi renderebbe inutilizzabili EUR, GBP, JPY, CAD, AUD, CHF… cioè quasi tutta l'app (dimostrato dal test L16). La tolleranza è un parametro: impostandola a 0 si rifiuta ogni data futura; **se il revisore preferisce 0, è una riga**, ma va accettato che le valute principali risultino «—» nei giorni in cui il feed è datato avanti.
- Un record oltre tolleranza **non invalida la risposta**: viene scartato *per valuta* (`fxState.future`), le altre valute restano valide e vengono salvate; il record anomalo non entra mai nella cache.
- Per la valuta scartata: se la cache precedente aveva un tasso valido (non futuro) lo si **conserva marcato «non aggiornato»** (`held`, salvato anche in cache: stato `stale`, avviso «Cambio NON aggiornato», importi con quel tasso); altrimenti stato `unavailable` con messaggio esplicito «data nel futuro (…)» e importi «—». **Mai 0,86 né altro valore di ripiego.** Se tutti i record validi sono futuri la risposta intera è inutilizzabile (cache intatta, errore `future`).
- Anche un tasso già in cache con data futura oltre tolleranza (orologio del dispositivo spostato indietro) non viene usato.
- Dopo una risposta con record scartato per la valuta selezionata vale la pausa di 60 s; il tentativo successivo con record corretto ripristina `ok` e toglie la marcatura.
- **Cambio di comportamento collegato:** il limite di 7 giorni è ora misurato in giorni di calendario UTC interi (prima giorni frazionari): una data di 7 giorni fa è nel limite, 8 giorni fa è «non aggiornato».
- Correzione v0.10.1 in `settings.js` **invariata** (nessun file di settings toccato): i test G2 passano tutti.

## 3. Modifiche rispetto alla v0.10.1 (`diff -r`)
`js/fx.js` (date, quarantena, `held`, `future`, stato), `js/money.js` (messaggio e `futureDate`; nuova `formatRateDate`), `js/config.js` (`futureToleranceDays`), `js/i18n.js` (+1 stringa IT/EN `fxNoteFutureDate`), `tests/check-fx.js` (+29 controlli, nessuno rimosso), `tests/lib/sandbox.js` (orologio simulato opzionale `opts.now`, default invariato), `index.html` (badge), `README.md`, questo report. Nessun altro file; formule, SRB, AB, tabelle, preferenze e `settings.js` non toccati.

## 4. Test effettivamente eseguiti (nessuna rete, Node)
`node tests/run-all.js <v0.9.5>`: check-seo, check-lang-privacy ok; prefs-currency 56; parser 34; i18n 21; srb 68; srb-range 119; srb-routing 127; srb-v094 229; money-format 159; **fx 243** (era 214); **compare-v0100 4817 controlli, 0 falliti**. Controllo di sintassi `node --check` su tutti i file di `js/`, `tests/`, `tests/lib/`, `tools/`: nessun errore.
Nuova sezione L: data = oggi; ieri; 7 giorni fa (limite); 8 giorni (oltre); +1 giorno (tolleranza 1: usata; tolleranza 0: scartata); +2, +11, +83 giorni; messaggio IT/EN; confine 23:59:59/00:00:00 UTC; cache con data futura; risposta mista (JPY e GBP validi, EUR anomalo: cache senza il record anomalo, JPY selezionabile); cache precedente valida durante risposta anomala (0,8 conservato, «non aggiornato», `held` in cache, altre valute aggiornate); cache fresca (nessuna richiesta); pausa e ripristino; tutte le date future con e senza cache; **fixture ricavata dalla risposta reale del 24/10/2026** (12 record fedeli) con orologio simulato: tolleranza 1 → tutte utilizzabili, tolleranza 0 → EUR/JPY scartate, BHD/ILS usabili.
Prova di efficacia: la nuova suite sul codice v0.10.1 → **19 falliti** (inclusi L10, L11c, L14: con v0.10.1 una data futura veniva mostrata come `ok`, es. «€5.00»); sul codice v0.10.2 → 0.

## 5. Verifica reale della fonte (registrata separatamente, non automatica)
Una sola lettura reale il 24/10/2026 (vedi §1). Non ripetibile dai test automatici. Non verificati dal vivo: latenza/CORS in un browser (la documentazione dichiara CORS aperto).

## 6. Limiti aperti
1. **Decisione sulla tolleranza (+1 giorno)**: da approvare (§2). Un revisore che consideri anomalo anche +1 deve impostare 0 accettando «—» sulle valute principali quando il feed è datato avanti.
2. La regola si basa sull'orologio del dispositivo: un orologio avanti di un giorno non cambia l'esito per le date passate, ma un orologio **indietro** di ≥2 giorni fa scartare tassi legittimi (mostrati «—» o «non aggiornato»); un orologio molto avanti può far apparire «non aggiornato» tassi buoni.
3. Il giorno di calendario dichiarato dalla fonte non è documentato nel fuso: l'interpretazione UTC+tolleranza è un'ipotesi prudente, non una garanzia del fornitore.
4. Restano i limiti del report v0.10.0 (docs/15 §8): nessun test su browser/iPhone, chiamata remota automatica da approvare, tassi blended, elenco valute e soglie scelti da me, ecc.
5. Il record USD→USD con data futura è ignorato (USD non usa la rete); i record di valute non nell'elenco non sono valutati.
