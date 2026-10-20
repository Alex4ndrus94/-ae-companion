# Audit fonti — AE Companion v0.9.0 (Fase 1)

Data di consultazione: **14 ottobre 2026**. Fonte primaria: Atlas Earth Help Center (Atlas Reality, Inc.), `atlasreality.helpshift.com`.
Stati: `verified` · `partially_verified` · `unverified`. **Nessun valore numerico è stato modificato in questa fase.**

| # | Regola | Stato | Fonte (URL) | Cosa afferma la fonte | Limiti / ambiguità | Comportamento nel codice |
|---|---|---|---|---|---|---|
| 1 | Soglie e moltiplicatori dei boost ordinari per Paese | **unverified** | `…/faq/39-why-do-ad-boosts-change-and-how-do-i-see-my-current-boost-rate/` ("Why do ad boosts change…") | Il boost dipende da numero di terreni e posizione; le tabelle ufficiali sono pubblicate **come immagini** (US e altri Paesi). | Le immagini non erano leggibili con gli strumenti usati: nessuna soglia è stata confrontata riga per riga. La pagina `…/faq/263-why-did-my-ad-boost-amount-change/` (agg. ~412 giorni fa) dice che i tassi possono cambiare nel tempo. | Invariato (`js/countries.js`). Etichetta "tabelle ufficiali" **rimossa** dai testi dell'app. |
| 2 | Appartenenza dei Paesi ai gruppi regionali | **unverified** | `…/faq/77-what-countries-is-atlas-earth-available-in/` | Elenca i Paesi disponibili: USA (e territori), Canada, Australia, UK, Irlanda, Messico, Nuova Zelanda, Sudafrica, Germania, Francia, Brasile, Giappone, Spagna, Paesi Bassi, Italia, Norvegia, Danimarca, Finlandia, Svezia. Dice che i tassi non sono uguali in ogni Paese. | Non dice quali Paesi condividano la stessa tabella. **Nel codice compaiono 12 Paesi non presenti nell'elenco ufficiale:** Portogallo, Austria, Taiwan, Belgio, Thailandia, Slovacchia, Lettonia, Filippine, Corea del Sud, Singapore, Emirati Arabi, Svizzera. Per i Paesi non lanciati "non è disponibile il Boost Ads". | Invariato. Da decidere (vedi report). |
| 3 | Territori non documentati | **unverified** | stessa pagina #2 | Cita "U.S. territories" come inclusi solo per la disponibilità del download. | Nessuna regola di boost per territori. | Invariato. |
| 4 | Funzionamento SRB (boost aumentato per tutti i giocatori durante l'evento) | **verified** | `…/faq/89-what-is-a-super-rent-boost-event/` | L'SRB alza il tasso di boost pubblicitario per tutti; i boost attivi passano automaticamente al tasso SRB all'inizio e tornano al tasso standard alla fine. | — | La stima usa x50 (`CONFIG.srbMultiplier`). |
| 5 | Moltiplicatore x50 e limite 150.000 terreni | **verified** | `…/faq/484-is-there-a-limit-on-how-many-parcels-i-can-boost-during-a-super-rent-boost-srb-event/` | Massimo 150.000 terreni a 50X; oltre, i terreni rendono al tasso standard del loro scaglione. | Il limite non è implementato nella stima SRB: oltre 150.000 terreni la stima sarebbe sovrastimata. Irrilevante per profili tipici. | Invariato. Da decidere. |
| 6 | Durata/frequenza SRB | **partially_verified** | pagina #1 (nota sotto i grafici) | Il grafico ufficiale *assume* un SRB di 32 ore, due volte al mese (64 ore/mese ≈ 2,7 giorni), e dice che gli eventi sono annunciati in anticipo. | È un'ipotesi del grafico, non una garanzia. Il valore "~2,5 giorni/mese" dell'app non ha una fonte esatta. | Testi riformulati: "ipotesi indicativa". `CONFIG.srbDaysPerMonthAssumption = 2.5` documentato come ipotesi. |
| 7 | Cumulabilità SRB × boost ordinario × bonus badge | **partially_verified** | pagine #4, #5 e `…/faq/60-how-can-i-boost-virtual-rent/` | I bonus passaporto "si cumulano con i boost pubblicitari". Durante l'SRB si riceve "il tasso di boost aumentato" e l'esempio dei terreni oltre il limite parla di "normale 2X per quello scaglione": l'SRB sembra **sostituire** il tasso dello scaglione, non sommarsi. | Nessuna frase esplicita sulla cumulabilità. | Formula invariata (base con badge × 50, senza boost terreni); ipotesi mostrata in app (`srbAssumptions`). |
| 8 | Bonus passaporto per numero di badge | **partially_verified — DISCREPANZA** | `…/faq/81-how-do-permanent-passport-boosts-work/` e `…/faq/60-…/` | 1–10 badge = 5%; 11–20 badge = 10%; "vale per ogni scaglione"; ogni livello di passaporto aggiunge il 5%. | L'app usa 11–30 = 10%, 31–60 = 15%, 61–100 = 20%, 101+ = 25%. Per 21–30 badge la fonte suggerisce 15%, l'app 10%. La tabella completa (`…/faq/333-…`) non era leggibile. | **Invariato** (`CONFIG.badgeBoostTiers`). Decisione richiesta. |
| 9 | Boost non sempre attivo | osservazione | pagina #8 (`faq/60`) | Ogni annuncio boosta per un'ora; si possono impilare fino a 6 annunci. | La "rendita con boost" dell'app assume il boost sempre attivo (24 h). | Invariato. Da decidere se aggiungere un'avvertenza. |
| 10 | Conversione rendita → AB | **unverified / incoerenza** | `…/faq/35-how-do-i-convert-virtual-rent-into-atlas-bucks/` | 1 $ di rendita = 25 AB. | Il testo dell'app dice "circa 33 AB per ogni €". | Invariato (solo testo). |
| 11 | Rendita al secondo per rarità, probabilità rarità, costi pass | non verificato in questa fase | — | — | Fuori ambito del controllo. | Invariato. |

Fonti non ufficiali (siti di terze parti trovati nelle ricerche) **non** sono state usate come prova.

---

## Aggiornamento v0.9.1 (consultazione del 15 ottobre 2026)

- **#5 (limite SRB 150.000):** riconfermata sulla pagina faq/484 e ora **implementata** nella stima (`getSRBBreakdown`). Vedi `docs/10-REPORT-FASE1.1-v0.9.1.md`.
- **#9 (boost non sempre attivo):** aggiunta avvertenza IT/EN (`dailyEstimateWarning`). Il modello continua ad assumere 24 h.
- **#10 (rendita → AB): verified.** 1 $ di rendita = 25 AB, tasso fisso (faq/248 e faq/34); la rendita è sempre in USD (faq/35, faq/162). Testo "33 AB per €" **corretto**.
- **#8 (bonus badge):** ancora `partially_verified`: soglie dell'app invariate; verificate solo 1–10 = 5% e 11–20 = 10% (faq/81; faq/333 non riporta la tabella).

---

## Aggiornamento v0.9.3 (consultazione del 17 ottobre 2026)

Consultazione tramite ricerca web; per ogni pagina è stato letto il testo restituito dal motore di ricerca (estratti), non l'intera pagina. Dominio ufficiale: `atlasreality.helpshift.com` (Atlas Earth Help Center). Siti di terze parti (atlasearthguides.com, atlasearthrent.app, calcolatori, recensioni) **non** sono usati come prova.

| Affermazione | Pagina (titolo) | URL | Esito |
|---|---|---|---|
| SRB al massimo su 150.000 terreni; oltre, tasso standard del proprio scaglione (esempio 150.010 terreni: gli ultimi 10 a 2X) | «Is there a limit on how many parcels I can boost during a Super Rent Boost (SRB) event?» | `https://atlasreality.helpshift.com/hc/en/3-atlas-earth/faq/484-is-there-a-limit-on-how-many-parcels-i-can-boost-during-a-super-rent-boost-srb-event/` | **Confermato** (50X entro il limite). |
| SRB = periodo in cui i tassi di boost pubblicitario aumentano per tutti i giocatori; i boost attivi passano al tasso SRB all'inizio e tornano al tasso standard alla fine | «What is a Super Rent Boost event?» | `https://atlasreality.helpshift.com/hc/en/3-atlas-earth/faq/89-what-is-a-super-rent-boost-event/` | Confermata la definizione. **Durata e frequenza non indicate** nel testo letto: restano non verificate. |
| SRB = evento a tempo, disponibile a tutti; i boost passaporto «stack with ad boosts» | «How can I boost virtual rent?» | `https://atlasreality.helpshift.com/hc/en/3-atlas-earth/faq/60-how-can-i-boost-virtual-rent/` | Cumulabilità passaporto + boost **pubblicitario** confermata; **nulla** sulla cumulabilità tra boost ordinario e ×50. |
| Bonus passaporto 1–10 badge = 5% | «How do permanent passport boosts work?» | `…/faq/81-how-do-permanent-passport-boosts-work/` | Confermato. |
| Bonus passaporto 11–20 badge = 10% (faq/81) **oppure** 11–30 badge = 10% (tabella faq/509) | faq/81 e «What are badges?» | `…/faq/509-what-are-badges/` | **Incoerenza tra due pagine ufficiali.** L'app usa 11–30 (come la tabella faq/509). Soglie successive (31/61/101) **non** confermate dal testo ufficiale letto. Tabella non modificata. |
| Conversione 1 $ di rendita = 25 AB | faq/35, faq/248, faq/34 | (vedi v0.9.1) | Verificata il 15/10/2026; **non riconsultata** in questa fase. |
| Boost ordinari e soglie per Paese | «Why do ad boosts change and how do I see my current boost rate?» (faq/39) | — | **Non riverificati** in questa fase: tabelle regionali invariate. |

Cambio EUR/USD: fisso 0,86, indicativo, non ufficiale, non aggiornato automaticamente (invariato).


---

## Aggiornamento v0.9.4 (tentativo di consultazione del 19 ottobre 2026)

In questa fase sono state eseguite **due ricerche web** (limite SRB 150.000 terreni; «What is a Super Rent Boost event») mirate al Help Center ufficiale (`atlasreality.helpshift.com`). **Nessuna pagina ufficiale è stata restituita**: i risultati erano solo siti di terze parti, pagine-copia e risultati non pertinenti. Questi risultati **non sono usati come prova** e non è stata letta alcuna pagina ufficiale nuova.

Conseguenza: **nessuno stato di verifica è cambiato**. Restano valide, con la data originale, le consultazioni del 14, 15 e 17 ottobre 2026 riportate sopra; in questa fase non sono state riconsultate.

| Regola | Stato in v0.9.4 |
|---|---|
| Limite SRB 150.000 / ×50 | Confermato il 17/10 (faq/484); non riconsultato il 19/10 |
| Cumulabilità boost ordinario + ×50 | **Non documentata**: la formula non li somma |
| Durata e frequenza SRB | **Non documentate** dalle fonti ufficiali lette: non mostrate come dato certo |
| Soglie badge oltre 10 (11–20 vs 11–30; 31/61/101) | **Non confermate** (incoerenza faq/81 vs faq/509): tabella invariata |
| Soglie e boost regionali | **Non riverificati**: `countries.js` invariato |
| Cambio EUR/USD | Fisso 0,86, indicativo, senza aggiornamento automatico |

Da fare (con accesso a pagine ufficiali): rileggere faq/484, faq/89, faq/81, faq/509 e annotare data e testo effettivamente letto.
