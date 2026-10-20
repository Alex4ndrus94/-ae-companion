# Report Fase 1 — AE Companion v0.9.0 (da v0.8.1)

Nessun commit, push o deploy è stato eseguito. Nessun backup JSON, chiamata remota, pubblicità o pagamento introdotto.

## 1. File modificati e motivazione
| File | Modifica |
|---|---|
| `js/prefs.js` (nuovo) | Migrazione una tantum e idempotente di lingua/valuta; funzione pura `computeInitialPrefs` testabile. Chiavi nuove: `aeCurrency`, `aePrefsMigration`. |
| `js/money.js` (nuovo) | Modulo centrale valuta: `getCurrency/setCurrency`, `convertToDisplay/convertFromDisplay`, `formatCurrency(Precise)`, nota "cambio indicativo". Unità interna canonica **USD** (verificata: `player.goal.incomeTargetUSD`, tutti i calcoli). |
| `js/i18n.js` | Lingua iniziale: salvata valida → quella decisa dalla migrazione → `en`. Il browser non decide più la lingua dei nuovi utenti. Nuove stringhe IT/EN; testi SRB e "tabelle ufficiali" riformulati. |
| `js/income.js`, `js/advice.js`, `js/strategy.js`, `js/assistant.js`, `js/settings.js` | Eliminato ogni legame valuta←lingua (`lang==="it" ? EUR : USD`) e il tasso duplicato in 3 punti; ora tutto passa da `money.js`. Formula SRB **invariata**, commento con le ipotesi. |
| `js/countries.js` | Cluster: salvato = preservato; altrimenti suggerimento dal browser (con affidabilità `region`/`language`/`none`) da confermare; selezione in bozza, salvata solo con Salva; Annulla non salva. Calcoli: valore provvisorio come in v0.8.1 finché non confermato. ID cluster invariati. |
| `js/assistant.js` | Parser numeri (1.014 / 1,014 / 101 / 1000 / negativi / non interi / ambigui), richieste combinate terreni+badge, cronologia strutturata rigenerata al cambio lingua/valuta. |
| `js/app.js`, `index.html` | Selettore valuta nelle Impostazioni esistenti, riquadro suggerimento cluster, nota cambio, ipotesi SRB, "giorno/day" non più hardcoded. Versione mostrata v0.9.0. |
| `privacy/index.html`, `tools/build-pages.js` | Elencate le nuove chiavi localStorage. |
| `docs/07…09`, `tests/*` | Audit fonti, architettura SEO, questo report, test. |

## 2. Comportamento precedente → nuovo
- **Valuta**: legata alla lingua (IT=EUR, EN=USD) → preferenza separata `aeCurrency`.
- **Nuovi utenti**: lingua dal browser (it→it) → **inglese + USD**.
- **Utenti esistenti**: senza `aeLang` salvata vedevano la lingua del browser → la migrazione la salva (e la valuta corrispondente) per non cambiare ciò che vedevano. Lingua o valuta già salvate non vengono mai toccate.
- **Cluster**: il select salvava subito a ogni cambio → ora salva solo con Salva dopo conferma esplicita. Utenti senza scelta salvata continuano a vedere gli stessi numeri (valore provvisorio) ma ricevono il suggerimento da confermare.
- **Obiettivo di rendita**: il valore digitato è interpretato nella valuta mostrata all'apertura del pannello (anche se la valuta viene cambiata nello stesso salvataggio) e salvato in USD.
- **Assistente**: "1.014 terreni" era letto come 14; "-5 badge" come 5; terreni+badge insieme ignoravano i terreni. Ora corretti; una domanda ambigua (es. "0.500") chiede conferma.

## 3. Test (prima → dopo)
| Suite | Prima (v0.8.1) | Dopo |
|---|---|---|
| `check-seo.js` | 56 PASS | 56 PASS |
| `check-lang-privacy.js` | 43 PASS | 43 PASS |
| `regression-compare.js` | richiede 2 cartelle (non eseguibile da solo) | **80/80** scenari identici tra v0.8.1 e v0.9.0 (8 gruppi × 2 lingue × 5 profili, 14 domande assistente incl. what-if badge/terreni) |
| `check-prefs-currency.js` (A–D) | — | 56 ok |
| `check-parser.js` (E) | — | 34 ok |
| `check-i18n.js` (F, G) | — | 21 ok |
| `browser-smoke.js` (Chromium headless) | — | 19 ok |

Il confronto di regressione confronta **due versioni diverse** del codice; ho verificato che rilevi una modifica numerica deliberata (cambio del tasso: 40/80 scenari in errore). Differenze intenzionali non coperte: testi SRB e dell'etichetta "tabelle" (riformulati); il test confronta le icone dei consigli AB, non il testo.

## 4. Problemi risolti
Valuta dipendente dalla lingua; select cluster che salvava subito; parser migliaia/negativi; richieste combinate; messaggi dell'assistente non aggiornati al cambio lingua; "giorno/day" hardcoded; diciture "ufficiale" non supportate dalle fonti.

## 5. Regressioni individuate
Nessuna sui calcoli. Un caso da conoscere: se il browser non permette localStorage, lingua/valuta restano in memoria per la sessione (nessun crash), ma non persistono.

## 6. Fonti ufficiali e dati regionali non verificati
Vedi `docs/07-AUDIT-FONTI.md`. In sintesi: SRB (x50, limite 150.000, funzionamento) **verified**; durata SRB e cumulabilità **partially_verified**; **soglie per Paese e appartenenza ai gruppi `unverified`** (tabelle ufficiali pubblicate come immagini, non leggibili); **12 Paesi nel codice non figurano tra quelli disponibili**; **discrepanza bonus badge** (fonte: 11–20 = 10%; app: 11–30 = 10%). Nessun valore modificato.

## 7. Ipotesi della stima SRB (mostrate in app)
Rendita base con bonus badge × 50, senza sommare il boost ordinario dei terreni; cumulabilità non confermata ufficialmente; durata/frequenza non garantite (~2,5 giorni/mese solo come ipotesi); limite 150.000 terreni non applicato; nessun "guadagno garantito".

## 8. SEO
Vedi `docs/08-ARCHITETTURA-SEO-INTERNAZIONALE.md`. (1) Progettazione completata. (2) Implementazione locale: solo testi corretti e test su link/hreflang/sitemap; nessun hreflang aggiunto. (3) Da pubblicare e verificare alla fine: pagine `/en/`, hreflang, sitemap, metadati.

## 9. Limiti dei test
- **Safari/iOS non testato.** Il browser reale usato è Chromium headless (file://), senza rete (font e GoatCounter non caricati).
- `browser-smoke.js` richiede puppeteer-core e un Chromium locali (opzionale; salta se mancano).
- Le risposte dell'assistente vengono rigenerate con i dati *correnti*, non con quelli del momento della domanda.
- Tasso EUR: fisso 0,86, nessuna data/fonte aggiornata (dichiarato in app).

## 10. Istruzioni di esecuzione
Da Node ≥ 18, nella cartella del progetto:
- `node tests/run-all.js <cartella-v0.8.1-originale>` — tutte le suite + regressione.
- Singole: `node tests/check-prefs-currency.js`, `node tests/check-parser.js`, `node tests/check-i18n.js`, `node tests/check-seo.js`, `node tests/check-lang-privacy.js`.
- Browser: `PUPPETEER_MODULE=<percorso> CHROME_PATH=<percorso> node tests/browser-smoke.js`.

## 11. Decisioni che richiedono la tua approvazione
1. **Bonus badge**: allineare la tabella a quanto dice l'Help Center (1–10 → 5%, 11–20 → 10%, …) o lasciarla com'è finché non è letta l'immagine ufficiale?
2. **12 Paesi non presenti nell'elenco ufficiale** (Portogallo, Austria, Taiwan, Belgio, Thailandia, Slovacchia, Lettonia, Filippine, Corea del Sud, Singapore, Emirati, Svizzera): tenerli, segnalarli o rimuoverli dai gruppi?
3. **Tabelle per Paese**: serve che tu legga/mi fornisca le immagini ufficiali per verificarle riga per riga.
4. **Cambio EUR**: tenere 0,86 fisso o aggiornarlo manualmente a ogni release (con data)?
5. **SRB**: applicare il limite di 150.000 terreni? Tenere "~2,5 giorni/mese" come ipotesi o toglierlo?
6. **Boost sempre attivo** (assunzione 24 h) vs 1 ora per annuncio: aggiungere un'avvertenza?
7. **Testo "33 AB per €"** vs 25 AB per $ ufficiale: correggere?
8. **Suggerimento cluster dalla sola lingua** (es. "it"): mostrarlo come debole (attuale) o richiedere sempre scelta manuale?
9. **HTML statico di `/`**: italiano (attuale) o inglese in attesa di `/en/`?
