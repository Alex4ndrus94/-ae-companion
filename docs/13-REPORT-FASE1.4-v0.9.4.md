# Report Fase 1.4 — AE Companion v0.9.3 → v0.9.4

**Nessun commit, push, deploy o pubblicazione è stato effettuato**: tutto è rimasto locale (cartella e ZIP). **La v0.9.4 non è dichiarata pronta per il rilascio**: la decisione spetta alla revisione indipendente.

## 1. Cosa è cambiato
| File | Modifica |
|---|---|
| `js/assistant.js` | Riconoscimento SRB **solo esplicito** (SRB, Super Rent Boost, super potenziamento, super boost, ×50), sempre prima dei gestori numerici. Rimosse le regole v0.9.3 «boost+evento» e «evento+guadagno» → SRB. Nuovi: `isABEventQuestion` (AB/Airbucks con evento o SRB → fonti AB, mai stima di rendita), `isAmbiguousEventQuestion` («evento» + guadagno/rendita/boost senza nome SRB e senza AB → chiarimento, nessun importo). Parola «rend…» ora ancorata a inizio parola (prima «prende» poteva essere scambiato per «rende»). |
| `js/i18n.js` | Nuova chiave IT/EN `assistantEventAmbiguous`. Testi sulle rarità ipotetiche resi espliciti: «ipotesi del modello, non la tua distribuzione reale» (`assistantSRBRarityOdds/Extended`), «ipotesi di proporzionalità» (`…Scaled`). |
| `tests/check-srb-v094.js` | **Nuovo**: 229 controlli (sezioni A–I). Eseguito contro il codice v0.9.3 fallisce 70 controlli: i test rilevano davvero i difetti. |
| `tests/run-all.js` | Aggiunta la nuova suite. |
| `tests/check-srb-routing.js` | Rimossi 2 casi «durante l'evento» (no nome SRB): per decisione della Fase 1.4 sono ambigui, ora coperti in `check-srb-v094.js` (B). Motivo documentato nel file. |
| `tests/check-srb-range.js` | Rimossi 3 casi («rent boost durante l'evento», «rent boost during the event», «quanto rendo col boost durante l'evento?») dalla lista «→ SRB», stesso motivo. Nota: restavano verdi solo perché il messaggio di chiarimento contiene «Super Rent Boost» (test debole); ora sono verificati correttamente in B. |
| `js/income.js`, `js/config.js`, `js/countries.js`, dashboard, strategia, obiettivi | **Non modificati** (`diff` identico a v0.9.3). Formula SRB invariata. |
| `index.html`, `README.md` | Versione v0.9.4. |
| `docs/07-AUDIT-FONTI.md`, `docs/13-…` | Aggiornamento audit (vedi §5); questo report. |

Nessun test è stato eliminato per farlo passare senza sostituzione; le uniche modifiche ai test esistenti sono le 5 righe sopra, perché il comportamento atteso è cambiato per requisito.

## 2. Ipotesi sui profili ipotetici
Invariato il metodo (copia, mai `player`, nessuna scrittura in localStorage): con 152 terreni salvati e 200.000 ipotizzati si **mantengono i 152** e i 199.848 aggiuntivi sono ripartiti 50/30/15/5 (resto più grande). Ora la risposta dichiara che questa ripartizione è un'ipotesi del modello e non la distribuzione reale. Badge non indicati → quelli del profilo, dichiarato.

## 3. Verifica matematica (a mano, indipendente dal codice)
Controllati: 0, 1, 150.000, 150.001, 150.100 terreni; rarità miste e singola; badge 0/5/12/31/61/101; boost ordinari di più gruppi; estremi uguali e diversi. Sempre minimo ≤ centrale ≤ massimo; ≤150.000 nessun intervallo; una sola rarità oltre soglia nessun intervallo artificiale; boost ordinario mai sommato al ×50. Nessun errore trovato nella formula.

## 4. Test eseguiti (Node v22.22.2, sandbox `vm`) — risultati reali
`node tests/run-all.js <v0.9.3> --srb-text=same`: check-seo OK · lang-privacy OK · prefs-currency 56 · parser 34 · i18n 21 · srb 68 · srb-range 119 · srb-routing 127 · **srb-v094 229** · regression-compare OK. 0 falliti.
**Regressione v0.9.3 → v0.9.4:** 80/80 scenari ordinari identici; 36/36 casi di confine con numeri identici e testo SRB generico identico; la risposta ipotetica cambia in 30/36 (atteso: nuova frase sulle rarità; negli altri 6 il profilo coincide con quello salvato). Confronti precedenti (v0.9.1→0.9.2, 0.9.2→0.9.3) restano nei report 11 e 12; il confronto con la v0.9.1 non è rieseguibile (cartella non fornita).
**Browser (Chromium via Playwright, viewport 375×760, NON Safari/iOS):** IT/EUR e EN/USD, domande SRB, evento ambiguo e AB inviate dall'assistente: nessun errore JS, scrollWidth = clientWidth = 375, nessun overflow nei messaggi, profilo in localStorage invariato, badge v0.9.4.
**Non eseguiti:** `tests/browser-smoke.js` (richiede `puppeteer-core`, non disponibile); qualsiasi prova su Safari/iOS o iPhone reale: **interfaccia su iPhone non verificata**.

## 5. Fonti e incertezze
In questa fase due ricerche web non hanno restituito **alcuna pagina ufficiale** (solo siti terzi, non usati come prova): nessuno stato di verifica è cambiato e non sono state aggiunte fonti. Restano valide le consultazioni del 14, 15 e 17/10/2026 in `docs/07-AUDIT-FONTI.md`. Incerti: soglie badge oltre 10 (faq/81 vs faq/509; 31/61/101 non confermate), cumulabilità boost ordinario + ×50 (non documentata), durata e frequenza SRB (non documentate), soglie regionali (non riverificate, tabelle non toccate). Cambio EUR/USD fisso 0,86 indicativo.

## 6. Esempi reali (generati dal codice, profilo 152 terreni, 12 badge)
**[IT/EUR] Quanto renderei con 200.000 terreni durante l'SRB?**
> Scenario ipotetico (il profilo salvato non viene modificato): 200.000 terreni e 12 badge (dal tuo profilo). Terreni del tuo profilo mantenuti; i 199.848 aggiuntivi sono ripartiti secondo le probabilità di assegnazione usate dall'app (comune 50%, rara 30%, epica 15%, leggendaria 5%): è un'ipotesi del modello, non la distribuzione reale che avresti. Stima centrale per un giorno di Super Rent Boost (×50): 981,35 € al giorno. Intervallo teorico: 797,02 €–1075,48 € al giorno. L'intervallo riflette l'ordine di acquisizione sconosciuto dei terreni; la stima centrale ripartisce proporzionalmente le rarità e i valori estremi sono scenari teorici, non un intervallo statistico né una garanzia. Ipotesi: il ×50 vale per i primi 150.000 terreni e gli altri 50.000 rendono con il boost ordinario ×2 (attivo 24 ore su 24); bonus badge incluso; boost ordinario non sommato al ×50. È una stima, non un guadagno garantito. Importi in euro: conversione indicativa (1 USD = 0,86 EUR, cambio fisso non ufficiale), non la rendita erogata dal gioco.

**[IT/USD] Calcola la rendita SRB con 200.000 terreni e 15 badge.**
> Scenario ipotetico (il profilo salvato non viene modificato): 200.000 terreni e 15 badge. Terreni del tuo profilo mantenuti; i 199.848 aggiuntivi sono ripartiti secondo le probabilità di assegnazione usate dall'app (comune 50%, rara 30%, epica 15%, leggendaria 5%): è un'ipotesi del modello, non la distribuzione reale che avresti. Stima centrale per un giorno di Super Rent Boost (×50): 1141,11 USD al giorno. Intervallo teorico: 926,77 USD–1250,55 USD al giorno. L'intervallo riflette l'ordine di acquisizione sconosciuto dei terreni; la stima centrale ripartisce proporzionalmente le rarità e i valori estremi sono scenari teorici, non un intervallo statistico né una garanzia. Ipotesi: il ×50 vale per i primi 150.000 terreni e gli altri 50.000 rendono con il boost ordinario ×2 (attivo 24 ore su 24); bonus badge incluso; boost ordinario non sommato al ×50. È una stima, non un guadagno garantito.

**[IT/EUR] Quanto guadagnerei durante il Super Rent Boost?**
> Stima indicativa: durante un giorno di Super Rent Boost (×50) la rendita del tuo profilo sarebbe di circa 0,84 € al giorno. Vale solo mentre l'evento è attivo; durata e frequenza non sono garantite. Ipotesi: bonus badge incluso, boost ordinario non sommato al ×50 (cumulabilità non confermata ufficialmente). È una stima, non un guadagno garantito. Importi in euro: conversione indicativa (1 USD = 0,86 EUR, cambio fisso non ufficiale), non la rendita erogata dal gioco.

**[IT/EUR] Quanto guadagnerei durante l'evento con 200000 parcelle?**
> Non è chiaro a quale evento ti riferisci, quindi non stimo nessun importo. Se intendi il Super Rent Boost (×50), scrivimi ad esempio «Quanto renderei durante l'SRB?» oppure «Quanto renderei con 200.000 terreni e 15 badge durante l'SRB?». Se parli di un altro evento o di AB, indicamelo.

**[IT/EUR] Come guadagno AB durante l'SRB?**
> Le fonti principali di AB extra sono: Arcade, i mini-giochi (Golf, Warship, Bowling, Racer, Fishing), la conversione dell'affitto, i sondaggi, e il Super Potenziamento durante gli eventi. Trovi tutti i dettagli nella card "Come guadagnare più AB".

**[EN/USD] What would my rent be during SRB with 200,000 parcels?**
> Hypothetical scenario (your saved profile is not changed): 200,000 parcels and 12 badges (from your profile). Your profile's parcels are kept; the 199,848 additional ones are distributed according to the assignment odds used by the app (common 50%, rare 30%, epic 15%, legendary 5%): this is a model assumption, not the real distribution you would have. Central estimate for one day of Super Rent Boost (×50): $1,141.11 per day. Theoretical range: $926.77–$1,250.55 per day. The range reflects the unknown order in which parcels were acquired; the central estimate distributes rarities proportionally and the endpoints are theoretical scenarios, not a statistical interval nor a guarantee. Assumptions: ×50 applies to the first 150,000 parcels and the other 50,000 earn at the regular ×2 boost (active 24 hours a day); badge bonus included; regular boost not added on top of ×50. This is an estimate, not guaranteed earnings.

**[EN/EUR] Calculate my Super Rent Boost income with 200,000 parcels and 15 badges.**
> Hypothetical scenario (your saved profile is not changed): 200,000 parcels and 15 badges. Your profile's parcels are kept; the 199,848 additional ones are distributed according to the assignment odds used by the app (common 50%, rare 30%, epic 15%, legendary 5%): this is a model assumption, not the real distribution you would have. Central estimate for one day of Super Rent Boost (×50): €981.35 per day. Theoretical range: €797.02–€1,075.48 per day. The range reflects the unknown order in which parcels were acquired; the central estimate distributes rarities proportionally and the endpoints are theoretical scenarios, not a statistical interval nor a guarantee. Assumptions: ×50 applies to the first 150,000 parcels and the other 50,000 earn at the regular ×2 boost (active 24 hours a day); badge bonus included; regular boost not added on top of ×50. This is an estimate, not guaranteed earnings. Euro amounts: indicative conversion (1 USD = 0.86 EUR, fixed unofficial rate), not the rent actually paid by the game.

**[EN/USD] How much would I earn during the event?**
> It isn't clear which event you mean, so I won't estimate any amount. If you mean the Super Rent Boost (×50), ask me something like “What would I earn during SRB?” or “What would I earn with 200,000 parcels and 15 badges during SRB?”. If you mean another event or AB, please say so.

## 7. Problemi residui
- Fonti ufficiali non riconsultate in questa fase (rete/ricerca non ha restituito il Help Center).
- Safari/iOS e `browser-smoke.js` non eseguiti.
- Dopo un chiarimento l'assistente non ricorda la domanda precedente: l'utente deve riformulare citando l'SRB.
- Il parser non capisce «200k» né «badge 15» (invariato).
- Formattazione importi: con it-IT Intl non raggruppa le migliaia a 4 cifre («1141,11 USD», «1075,48 €») e in IT/USD mostra «USD» dopo il numero. È comportamento di `formatCurrency` esistente, non modificato; da valutare.
- Il messaggio di rendita ordinaria resta «0,84 € al giorno» ecc. senza modifiche: nessuna regressione.

## 8. Coerenza versione e conferma
Versione v0.9.4 in `index.html`, `README.md`, cartella `ae-companion-v0.9.4` e ZIP `ae-companion-v0.9.4.zip`. **Nessun commit, push, deploy o pubblicazione.** In attesa della revisione indipendente.
