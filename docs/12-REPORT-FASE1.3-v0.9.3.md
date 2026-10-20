# Report Fase 1.3 — AE Companion v0.9.2 → v0.9.3

**Nessun commit, push, deploy o pubblicazione è stato effettuato** su GitHub o altri servizi: il lavoro è rimasto locale (cartella e ZIP). Questo report non dichiara la versione pronta per il rilascio: la decisione spetta al revisore indipendente.

## 1. Cause del problema (v0.9.2)
In `js/assistant.js` il gestore generico dei numeri (`extractAssistantQuantities`) era il **primo** intento: ogni frase con «N terreni» o «N badge» veniva risolta dai what-if ordinari prima che `isSRBQuestion()` fosse valutata. Per questo «…con 200.000 terreni durante l'SRB» non raggiungeva il calcolo SRB (limite già annotato nel report 1.2). Inoltre «durante l'evento con 200000 parcelle» non era riconosciuta (nessuna parola boost).

## 2. Modifiche per file
| File | Modifica |
|---|---|
| `js/assistant.js` | Intento SRB spostato **prima** del gestore numerico; il test passa le quantità estratte al gestore. `isSRBQuestion()`: nuova regola «evento/event» + parola di rendita/guadagno (guadagn-, rend-, reddit-, earn, income, rent, yield) **esclusi** i casi con «AB/airbucks». `getSRBAssistantReply(q)`: valida i numeri con il parser esistente (non valido/ambiguo → stessi messaggi), costruisce una **copia** ipotetica, chiede chiarimento se mancano i terreni, nessun dato inventato. Nessuna formula SRB in questo file. |
| `js/income.js` | `getSRBView(landsOverride, badgesOverride)` e `getSRBDisplay(...)`: parametri facoltativi (senza argomenti: comportamento identico a v0.9.2). Nuove `distributeCountByWeights()` (resto più grande, aritmetica intera) e `getProjectedLands()` (copia, mai `player`). Formule `getSRBBreakdown` / `getSRBDailyBoundsUSD` **non toccate**. |
| `js/i18n.js` | Nuove chiavi IT/EN: `assistantSRBNeedData`, `assistantSRBBadgesProfile`, `assistantSRBRarity{Odds,Scaled,Extended,Saved}`, `assistantSRBHypo`, `assistantSRBHypoSplit`, `assistantSRBHypoRange`. Testi esistenti non modificati. |
| `tests/check-srb-routing.js` | **Nuovo**: 133 controlli (vedi §4). |
| `tests/regression-compare.js`, `tests/run-all.js` | Opzione `--srb-text=same` per il confronto v0.9.2→v0.9.3; i test precedenti non sono stati rimossi né indeboliti. |
| `index.html`, `README.md` | Versione v0.9.3. |
| `docs/07-AUDIT-FONTI.md`, `docs/12-…` | Fonti consultate il 17/10/2026; questo report. |

## 3. Regole di calcolo per il profilo ipotetico
- Numero di terreni **uguale** al salvato → nessuno scenario ipotetico (profilo salvato).
- **Diverso** → copia: profilo vuoto = rarità secondo `CONFIG.rarityOdds` (50/30/15/5); N minore del salvato = rarità salvate riscalate in proporzione; N maggiore = terreni salvati + aggiuntivi ripartiti secondo le probabilità. Il boost ordinario è quello dello scaglione di N terreni nel Paese salvato.
- Badge non indicati → quelli del profilo (dichiarato nella risposta). Solo badge indicati → terreni del profilo.
- Profilo vuoto senza numero, oppure 0 terreni → richiesta di chiarimento, nessun importo.
- Ipotesi mantenute esplicite: limite 150.000, boost ordinario sull'eccedenza, nessuna cumulabilità tra boost ordinario e ×50.

## 4. Test eseguiti (Node v22.22.2, sandbox `vm`) — risultati reali
`node tests/run-all.js <cartella-v0.9.2> --srb-text=same`:
- check-seo: superato · check-lang-privacy: superato · check-prefs-currency: 56 ok · check-parser: 34 ok · check-i18n: 21 ok · check-srb: 68 ok · check-srb-range: 122 ok · **check-srb-routing: 133 ok, 0 falliti**
- regression-compare (v0.9.2 → v0.9.3): vedi §5.

Copertura richiesta: 1 generica IT/EN · 2 200.000 terreni (6 formulazioni, valori attesi calcolati a mano) · 3 badge espliciti (15/31/40/101) · 4 dati mancanti (profilo vuoto, 0 terreni, numeri ambigui/non validi/oltre il massimo) · 5 profilo invariato (stato `player`, scritture localStorage) · 6 rendita generica ordinaria · 7 boost generico non SRB · 8 dead zone · 9 domande «evento» ambigue non SRB · 10 what-if ordinari invariati · 11 IT/EN senza parole nella lingua sbagliata + rigenerazione storico · 12 EUR/USD · 13 parser 200.000 / 200,000 / 200000 (+ 0,500, 1,25, 1.01.4, 1.500.000) · 14 intervallo min ≤ centrale ≤ max su 10 profili (0/1/150.000/150.001/150.100/misti/singola rarità/badge 0–101) con centrale ricalcolata a mano e assenza di intervallo artificiale.

**Primo giro dei nuovi test:** 8 falliti, tutti difetti del test stesso (spazi non separabili nel confronto degli importi; la risposta corretta sulle fonti AB cita «Super Rent Boost» e il mio controllo la scambiava per SRB). Corretti i test, non il codice; nessun test rimosso.

**Browser reale (non `tests/browser-smoke.js`):** lo script richiede `puppeteer-core`, non disponibile qui (`SKIP`). Ho eseguito un controllo ad hoc con Playwright + Chromium desktop (viewport 375×760) caricando `index.html` e inviando la domanda dall'assistente: risposta ipotetica mostrata in IT/EUR e EN/USD, profilo invariato, nessun errore JS, nessuno scroll orizzontale (scrollWidth = clientWidth = 375). **Non è Safari/iOS** e non sostituisce una verifica visiva su iPhone: layout non verificato su dispositivo reale.

## 5. Regressione
- **v0.9.2 → v0.9.3:** 80/80 scenari ordinari identici (8 gruppi Paese × 2 lingue × 5 profili: rendita, boost, strategia, assistente, consigli AB); 36/36 casi di confine SRB con tutti i numeri identici e testo SRB generico identico; la risposta alla domanda SRB ipotetica cambia in 36/36 (atteso: prima finiva nei what-if).
- **v0.9.1:** non confrontabile qui, perché la cartella v0.9.1 non è stata fornita (solo lo ZIP v0.9.2). Il confronto v0.9.1→v0.9.2 è nel report 1.2.

## 6. Esempi reali (generati dal codice)
**IT / EUR — profilo salvato 152 terreni, 12 badge** — «Quanto rendo con il super potenziamento?»

> Stima indicativa: durante un giorno di Super Rent Boost (×50) la rendita del tuo profilo sarebbe di circa 0,84 € al giorno. Vale solo mentre l'evento è attivo; durata e frequenza non sono garantite. Ipotesi: bonus badge incluso, boost ordinario non sommato al ×50 (cumulabilità non confermata ufficialmente). È una stima, non un guadagno garantito. Importi in euro: conversione indicativa (1 USD = 0,86 EUR, cambio fisso non ufficiale), non la rendita erogata dal gioco.

**IT / EUR — profilo salvato 152 terreni, 12 badge** — «Quanto guadagnerei durante l'evento con 200000 parcelle?»

> Scenario ipotetico (il profilo salvato non viene modificato): 200.000 terreni e 12 badge (dal tuo profilo). Terreni del tuo profilo mantenuti; i 199.848 aggiuntivi sono ripartiti secondo le probabilità di assegnazione usate dall'app (comune 50%, rara 30%, epica 15%, leggendaria 5%). Stima centrale per un giorno di Super Rent Boost (×50): 981,35 € al giorno. Intervallo teorico: 797,02 €–1075,48 € al giorno. L'intervallo riflette l'ordine di acquisizione sconosciuto dei terreni; la stima centrale ripartisce proporzionalmente le rarità e i valori estremi sono scenari teorici, non un intervallo statistico né una garanzia. Ipotesi: il ×50 vale per i primi 150.000 terreni e gli altri 50.000 rendono con il boost ordinario ×2 (attivo 24 ore su 24); bonus badge incluso; boost ordinario non sommato al ×50. È una stima, non un guadagno garantito. Importi in euro: conversione indicativa (1 USD = 0,86 EUR, cambio fisso non ufficiale), non la rendita erogata dal gioco.

**IT / EUR — profilo salvato 152 terreni, 12 badge** — «Calcola la rendita SRB con 200.000 terreni e 15 badge.»

> Scenario ipotetico (il profilo salvato non viene modificato): 200.000 terreni e 15 badge. Terreni del tuo profilo mantenuti; i 199.848 aggiuntivi sono ripartiti secondo le probabilità di assegnazione usate dall'app (comune 50%, rara 30%, epica 15%, leggendaria 5%). Stima centrale per un giorno di Super Rent Boost (×50): 981,35 € al giorno. Intervallo teorico: 797,02 €–1075,48 € al giorno. L'intervallo riflette l'ordine di acquisizione sconosciuto dei terreni; la stima centrale ripartisce proporzionalmente le rarità e i valori estremi sono scenari teorici, non un intervallo statistico né una garanzia. Ipotesi: il ×50 vale per i primi 150.000 terreni e gli altri 50.000 rendono con il boost ordinario ×2 (attivo 24 ore su 24); bonus badge incluso; boost ordinario non sommato al ×50. È una stima, non un guadagno garantito. Importi in euro: conversione indicativa (1 USD = 0,86 EUR, cambio fisso non ufficiale), non la rendita erogata dal gioco.

**IT / EUR — profilo salvato vuoto** — «Quanto renderei durante l'SRB?»

> Per stimare il Super Rent Boost mi serve un numero di terreni maggiore di zero, e nel tuo profilo non ce ne sono. Non voglio inventare dati: scrivimi ad esempio «Quanto renderei con 200.000 terreni e 15 badge durante l'SRB?» oppure inserisci i tuoi terreni dal pannello Modifica dati.

**EN / USD — profilo salvato 152 terreni, 12 badge** — «How much do I earn during Super Rent Boost?»

> Rough estimate: during one day of Super Rent Boost (×50) your profile's income would be about $0.97 per day. It only applies while the event is active; duration and frequency are not guaranteed. Assumptions: badge bonus included, regular boost not added on top of ×50 (stacking is not officially confirmed). This is an estimate, not guaranteed earnings.

**EN / USD — profilo salvato 152 terreni, 12 badge** — «What would my rent be during SRB with 200,000 parcels?»

> Hypothetical scenario (your saved profile is not changed): 200,000 parcels and 12 badges (from your profile). Your profile's parcels are kept; the 199,848 additional ones are distributed according to the assignment odds used by the app (common 50%, rare 30%, epic 15%, legendary 5%). Central estimate for one day of Super Rent Boost (×50): $1,141.11 per day. Theoretical range: $926.77–$1,250.55 per day. The range reflects the unknown order in which parcels were acquired; the central estimate distributes rarities proportionally and the endpoints are theoretical scenarios, not a statistical interval nor a guarantee. Assumptions: ×50 applies to the first 150,000 parcels and the other 50,000 earn at the regular ×2 boost (active 24 hours a day); badge bonus included; regular boost not added on top of ×50. This is an estimate, not guaranteed earnings.

**EN / USD — profilo salvato 152 terreni, 12 badge** — «Calculate my Super Rent Boost income with 200,000 parcels and 15 badges.»

> Hypothetical scenario (your saved profile is not changed): 200,000 parcels and 15 badges. Your profile's parcels are kept; the 199,848 additional ones are distributed according to the assignment odds used by the app (common 50%, rare 30%, epic 15%, legendary 5%). Central estimate for one day of Super Rent Boost (×50): $1,141.11 per day. Theoretical range: $926.77–$1,250.55 per day. The range reflects the unknown order in which parcels were acquired; the central estimate distributes rarities proportionally and the endpoints are theoretical scenarios, not a statistical interval nor a guarantee. Assumptions: ×50 applies to the first 150,000 parcels and the other 50,000 earn at the regular ×2 boost (active 24 hours a day); badge bonus included; regular boost not added on top of ×50. This is an estimate, not guaranteed earnings.


## 7. Fonti ufficiali: confermato / incerto
Dettaglio con URL e data in `docs/07-AUDIT-FONTI.md` (consultazione 17/10/2026, estratti di ricerca, non pagine intere).
- **Confermato:** limite SRB 150.000 con 50X; oltre il limite tasso standard dello scaglione (faq/484); passaporto 1–10 badge = 5%; definizione di SRB; boost passaporto cumulabile con boost pubblicitari.
- **Incerto / incoerente:** cumulabilità tra boost ordinario e ×50 (nessuna fonte ufficiale letta); durata e frequenza SRB (fonti ufficiali lette silenziose; le cifre di siti terzi non sono usate); soglie badge 11–20 (faq/81) vs 11–30 (faq/509) e 31/61/101 non confermate; soglie e boost regionali non riverificati; conversione AB verificata il 15/10 e non riconsultata. Nessuna tabella modificata. Cambio EUR/USD fisso 0,86, indicativo.

## 8. Problemi residui e limiti
- Controllo su Safari/iOS e layout su dispositivi reali non eseguiti; `browser-smoke.js` non eseguito.
- «Durante l'evento» + parola di rendita è trattato come SRB (euristica): frasi sul guadagno in un evento non-SRB sarebbero trattate allo stesso modo. Domande su AB nell'evento sono escluse.
- Il parser non capisce forme come «200k» o «badge 15» (invariato); «1 badges» in inglese singolare non è gestito (cosmetico).
- La composizione delle rarità ipotetiche è un modello (probabilità di assegnazione) e non il dato reale del giocatore; dichiarato nella risposta.
- Il nuovo avviso su dati mancanti sostituisce, per profilo vuoto, la vecchia risposta «0 €» dell'SRB.

## 9. Conferma
Nessun commit, push, deploy o pubblicazione. Versione dichiarata coerente: `index.html` (badge v0.9.3), README, cartella e ZIP `ae-companion-v0.9.3`.
