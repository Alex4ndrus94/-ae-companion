# AE Companion v0.9.1 — Fase 1.1: correzione SRB e affidabilità delle stime

Base: ZIP v0.9.0. Nessun commit, push o deploy eseguito. Consultazione fonti: **15 ottobre 2026**.

## 1. Fonti ufficiali consultate (Atlas Earth Help Center, Atlas Reality, Inc.)

| Regola | Fonte | Cosa afferma | Esito |
|---|---|---|---|
| Limite SRB | "Is there a limit on how many parcels I can boost during a Super Rent Boost (SRB) event?" — `https://atlasreality.helpshift.com/hc/en/3-atlas-earth/faq/484-is-there-a-limit-on-how-many-parcels-i-can-boost-during-a-super-rent-boost-srb-event/` | L'SRB arriva a 150.000 terreni: fino a 150.000 il pieno 50X; oltre, tasso standard del loro scaglione (esempio: 150.010 terreni → 1–150.000 a 50X, 150.001–150.010 al "normale 2X di quello scaglione"). | **verificata** |
| Funzionamento SRB | "What is a Super Rent Boost event?" — `…/faq/89-what-is-a-super-rent-boost-event/` | I boost attivi passano al tasso SRB all'inizio dell'evento e tornano allo standard alla fine. | verificata |
| Conversione rendita → AB | `…/faq/248-what-payout-options-are-currently-available-for-redemption/` e `…/faq/34-how-can-i-get-atlas-bucks/` | Tasso fisso: 1 $ di rendita virtuale = 25 AB. | **verificata** |
| Rendita sempre in USD | `…/faq/35-how-do-i-convert-virtual-rent-into-atlas-bucks/` e `…/faq/162-…/` | La rendita è sempre mostrata in USD, qualunque sia il Paese o la valuta. | verificata |
| Durata boost pubblicitario | `…/faq/60-how-can-i-boost-virtual-rent/` | Ogni annuncio boosta per 1 ora, fino a 6 annunci impilati; i bonus passaporto si cumulano con i boost pubblicitari. | verificata |
| Bonus passaporto | `…/faq/81-how-do-permanent-passport-boosts-work/` e `…/faq/333-how-do-badge-collections-boost-my-rent-permanently/` | 1–10 badge = +5%; 11–20 badge = +10%; "tiered". Le pagine consultabili non riportano le soglie successive. | **parzialmente verificata** (vedi §6) |

Siti di terze parti trovati nelle ricerche (calcolatori, guide, risultati di spam SEO) **non** sono stati usati come prova.

## 2. File modificati

| File | Modifica |
|---|---|
| `js/config.js` | Nuove costanti `srbParcelLimit: 150000` e `abPerUSDRent: 25` (con fonte). |
| `js/income.js` | `getRawIncomePerSecond()` ora usa l'helper `rawRentPerSecondOf(lands)` (stessa espressione). Nuove `getSRBBreakdown()` (calcolo puro, testabile), `getSRBDailyBoundsUSD()` (intervallo teorico), `getSRBDetails()`, `convertRentUSDToAB()`. `getSRBDailyIncomeEstimate()` usa la nuova formula. Il calcolo ordinario non è toccato. |
| `js/i18n.js` (IT/EN) | `srbAssumptions` e `assistantSRB` riscritti con la regola dei 150.000; nuove chiavi `srbLimitNote` e `dailyEstimateWarning`; `abTipRentConversion` corretto (25 AB per 1 $, valuta ininfluente). |
| `js/app.js`, `index.html` | Nota "Hai N terreni: ×50 su X, boost ordinario su Y" mostrata solo oltre il limite (`#srb-limit-note`); avvertenza 24 h (`#daily-estimate-warning`) sopra le stime; badge versione v0.9.1. |
| `guides/calcolo-rendita/index.html`, `tools/build-pages.js` | Paragrafo SRB allineato alla nuova formula (la pagina rigenerata con `build-pages.js` coincide con quella nello ZIP). |
| `tests/check-srb.js` (nuovo), `tests/run-all.js`, `tests/regression-compare.js`, `tests/lib/sandbox.js` | Nuova suite SRB (68 controlli); confini SRB nel confronto di regressione; la sandbox espone `setInterval/setTimeout` finti. |
| `docs/10-REPORT-FASE1.1-v0.9.1.md`, `docs/07-AUDIT-FONTI.md`, `README.md` | Report, aggiornamento audit fonti, note di versione. |

## 3. Formula prima / dopo

Notazione: `raw` = rendita grezza al secondo (Σ terreni × rendita per rarità), `B` = 1 + bonus badge/100, `N` = terreni totali, `L` = 150.000, `b` = boost ordinario dello scaglione del totale N.

- **Prima (v0.9.0):** `SRB/giorno = raw × B × 50 × 86400` per **tutti** i terreni.
- **Dopo, N ≤ L:** identica (stessa espressione e stesso ordine di operazioni → risultati bit a bit uguali).
- **Dopo, N > L:** `SRB/giorno = (raw·L/N × 50 + raw·(N−L)/N × b) × B × 86400`.

Il bonus badge `B` è applicato **una sola volta** a entrambe le quote. Il calcolo ordinario (`raw × B × b × 86400`) e quello SRB restano funzioni distinte. Tutto è in USD; `convertToDisplay()` interviene solo dopo, per la visualizzazione.

## 4. Ipotesi adottate (dichiarate anche in app)

1. **Ordine di acquisizione sconosciuto.** L'app registra solo il numero di terreni per rarità, non l'ordine. Entro il limite le rarità sono ripartite **in proporzione** alla composizione (valore atteso con rarità assegnata a caso). Non si presume che gli eccedenti siano tutti Common. L'intervallo teorico dovuto all'ordine è calcolato da `getSRBDailyBoundsUSD()` (nel caso misto da 200.000 terreni: 842,57 – 1137,02 $/giorno, stima 1037,49).
2. **Boost dei terreni oltre il limite.** È quello dello scaglione del **totale** dei terreni (il boost dipende dal numero totale, non dalla posizione del singolo terreno), coerentemente con l'esempio ufficiale.
3. **Nessun cumulo** tra ×50 e boost ordinario sui terreni entro il limite (come in v0.9.0): la cumulabilità non è confermata ufficialmente.
4. **Scaglioni oltre 150.000.** In tutte le 8 tabelle regionali l'ultimo scaglione è aperto e inizia ben sotto i 150.000: ogni terreno eccedente cade nello stesso scaglione (×2 in tutti i cluster attuali). Il caso "eccedenti in più scaglioni" è quindi verificato solo con tabelle **sintetiche** nei test.
5. Le tabelle regionali restano quelle di v0.9.0 (non riverificate: le tabelle ufficiali sono immagini).

## 5. Altre correzioni

- **Avvertenza stime giornaliere** (IT/EN): le stime assumono il boost ordinario attivo 24 ore su 24; nel gioco ogni annuncio dura 1 ora (fino a 6 impilati); non sono guadagni garantiti.
- **Etichetta AB:** "circa 33 AB per ogni €" → "1 $ di rendita virtuale = 25 AB (tasso fisso, sempre in dollari); la valuta mostrata non cambia gli AB ricevuti". Era l'unico punto dell'app che converte rendita in AB (solo testo, nessun calcolo): `convertRentUSDToAB()` è ora la funzione di riferimento.
- **Bonus badge:** soglie **non modificate** (vedi §6).

## 6. Bonus badge — nessuna modifica, discrepanza ancora aperta

L'app usa 1–10 = 5%, 11–30 = 10%, 31–60 = 15%, 61–100 = 20%, 101+ = 25%. L'Help Center consultabile conferma solo 1–10 = 5% e 11–20 = 10%; dice che ogni livello di passaporto aggiunge il 5% e che i livelli sono a scaglioni, ma non riporta le soglie successive. Se i livelli fossero da 10 badge, 21–30 badge darebbero 15% (l'app: 10%). Le soglie **non sono state cambiate** perché la fonte ufficiale non è sufficiente a sostituirle; serve la tabella ufficiale (o una conferma in gioco) prima di toccarle. Il bonus è applicato una sola volta in ordinario e SRB (test 9, 9b–9d).

## 7. Risultati dei test

`node tests/run-all.js ../ae-companion-v0.9.0`:

| Suite | Esito |
|---|---|
| check-seo.js | superata |
| check-lang-privacy.js | superata |
| check-prefs-currency.js | 56 ok, 0 falliti |
| check-parser.js | 34 ok, 0 falliti |
| check-i18n.js | 21 ok, 0 falliti |
| **check-srb.js (nuova)** | **68 ok, 0 falliti** |
| regression-compare.js (v0.9.0 ↔ v0.9.1) | 80/80 scenari ordinari identici (8 cluster × 2 lingue × 5 profili: rendita, boost, strategia 4 obiettivi, assistente, consigli AB, calcoli con valuta); 36/36 scenari di confine come atteso |
| browser-smoke.js | **non eseguita**: richiede puppeteer/Chromium, non disponibili qui. Nessuna verifica su Safari/iOS o browser reale. |

Verifica del rendering in sandbox (app.js con DOM finto): la nota "Hai 200.000 terreni…" compare in IT/EN solo oltre il limite; a 150.000 terreni è vuota.

**Il test smaschera la vecchia formula:** sostituendo temporaneamente la formula con ×50 su tutti i terreni, 25 controlli di `check-srb.js` falliscono (es. 150.001 terreni → 712,804752 invece di 712,80019008).

Regressione: dati del profilo, distribuzione delle rarità, fasce boost ordinarie, obiettivi, simulazioni, calcoli AB, preferenze lingua/valuta e cluster salvato non cambiano (confronto v0.9.0 ↔ v0.9.1 su due cartelle diverse, non su copie identiche). Le differenze SRB sono limitate ai profili con più di 150.000 terreni e al testo dedicato.

## 8. Casi di confine SRB (EU_WEST, rendita per secondo: Common 1,1e-9, Rare 1,6e-9, Epic 2,2e-9, Legendary 4,4e-9)

| Caso | Terreni a ×50 | Terreni a boost ordinario | Atteso ($/giorno) | Ottenuto | Esito | Vecchia formula |
|---|---|---|---|---|---|---|
| 0 terreni | 0 | 0 | 0 | 0,00000000 | OK | 0 |
| 1 terreno (Common) | 1 | 0 | 0,004752 | 0,00475200 | OK | 0,00475200 |
| 149.999 (Common) | 149.999 | 0 | 712,795248 | 712,79524800 | OK | 712,79524800 |
| 150.000 (Common) | 150.000 | 0 | 712,8 | 712,80000000 | OK | 712,80000000 |
| 150.001 (Common) | 150.000 | 1 | 712,80019008 | 712,80019008 | OK | 712,80475200 |
| 150.100 (Common) | 150.000 | 100 | 712,819008 | 712,81900800 | OK | 713,27520000 |
| 200.000 misti 50/30/15/5 | 150.000 | 50.000 | 1037,4912 | 1037,49120000 | OK | 1365,12000000 |
| 150.100 Common + 12 badge (+10%) | 150.000 | 100 | 784,1009088 | 784,10090880 | OK | 784,60272000 |

I valori attesi sono calcolati a mano (non con la formula dell'app). Altri casi coperti da `check-srb.js`: 150.100 Legendary; tutti gli 8 cluster con 150.100 terreni; tabella sintetica con eccedenti in scaglioni ×4 (150.100 terreni → 712,838016) e ×3 (200.100 terreni → 727,084512); EUR vs USD e IT vs EN (SRB interno e AB identici; visualizzazione in EUR = USD × 0,86); rendita ordinaria vs SRB; conversione AB.

## 9. Problemi ancora aperti

1. **Soglie badge oltre i 20 badge** non verificate (§6): possibile discrepanza per 21–30 badge e per le fasce successive.
2. **Tabelle boost per Paese** non riverificate (immagini ufficiali non leggibili con gli strumenti usati) e appartenenza dei Paesi ai cluster non verificata.
3. **Ordine di acquisizione dei terreni** non registrato: sopra 150.000 terreni la stima SRB è una stima proporzionale, con incertezza teorica (es. −19% / +10% nel caso misto da 200.000). Nessun intervallo è mostrato nell'interfaccia (solo nella funzione `getSRBDailyBoundsUSD`).
4. **Cumulabilità ×50 e boost ordinario** e "~2,5 giorni/mese" restano ipotesi, non regole ufficiali.
5. **Assistente:** le domande "quanto rendo con il super potenziamento" / "super rent boost x50" sono intercettate da altri gestori ("quanto rendo", zona morta) e non arrivano alla risposta SRB, raggiungibile ad esempio con "srb" (problema preesistente, non toccato; il test usa "srb").
6. **Tasso EUR/USD** fisso 0,86, indicativo, non aggiornato.
7. **Eventi "33 AB per $"** citati in guide non ufficiali: non confermati dall'Help Center; l'app usa solo il 25 AB per $ ufficiale.
8. **browser-smoke.js non eseguita** e nessuna verifica su Safari/iOS.
9. L'avvertenza 24 h è testo statico: l'app non modella ancora le ore di boost effettive per giorno.
