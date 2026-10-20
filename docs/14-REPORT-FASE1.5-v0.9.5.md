# Report Fase 1.5 — AE Companion v0.9.5

**Correzione mirata della formattazione monetaria.** Base: `ae-companion-v0.9.4.zip`.
**Stato: in attesa di revisione indipendente. Non dichiarata pronta per il rilascio.** Nessun commit, push, deploy o pubblicazione.

---

## 1. Problema trovato

Analisi di `js/money.js` e di tutti i punti che formattano importi. Un solo punto di formattazione condiviso (`formatMoneyDigits`, da cui derivano `formatCurrency` e `formatCurrencyPrecise`; `strategy.js` usa `formatMoneyDigits` direttamente). Nessun altro file usa `Intl.NumberFormat` con `style: "currency"`, e nessun file concatena a mano simboli o codici di valuta (verificato anche da test, sezione H).

Difetto riprodotto sulla v0.9.4 (Node 22, ICU completo):

| Importo | IT/EUR v0.9.4 | IT/EUR v0.9.5 |
|---|---|---|
| 123,45 | `123,45 €` | `123,45 €` |
| **1234,56** | **`1234,56 €`** | **`1.234,56 €`** |
| 12345,67 | `12.345,67 €` | `12.345,67 €` |

Causa: per CLDR la lingua italiana ha «minimumGroupingDigits = 2», quindi `Intl.NumberFormat("it-IT")` non mette il separatore delle migliaia sui numeri a 4 cifre. Nella stessa schermata comparivano così «1234,56 €» e «12.345,67 €» (valori a 4 cifre sono tipici della stima SRB, es. 1141,24). EN/en-US non era affetto.

## 2. Modifica (una sola funzione di produzione: `js/money.js`)

- `formatMoneyDigits` ora costruisce il formatter con `useGrouping: "always"` (raggruppamento da 1.000 in su, in tutte le lingue).
- **Simbolo/codice e posizione della valuta restano decisi solo da Intl.** Nessuna concatenazione manuale. Risultato verificato:

| | EUR | USD |
|---|---|---|
| IT | `1.234,56 €` | `1.234,56 USD` |
| EN | `€1,234.56` | `$1,234.56` |

- Compatibilità con motori meno recenti: rilevamento di `useGrouping: "always"` (`supportsGroupingAlways`); se non supportato, `repairFourDigitGrouping` inserisce il separatore sui soli numeri a 4 cifre usando il separatore che **la stessa locale** produce da `formatToParts` per 5+ cifre. Se anche questo non è disponibile si ricade sul formato precedente senza errori.
- Lingua e valuta restano indipendenti (`getDisplayLocale()` segue la lingua, `currentCurrency` la valuta): IT/EUR, IT/USD, EN/EUR, EN/USD verificati.
- Versione aggiornata: badge in `index.html` (v0.9.5), `README.md`.

## 3. Cosa NON è stato modificato

Verificato per hash (byte-identici a v0.9.4): `js/income.js`, `config.js`, `countries.js`, `player.js`, `storage.js`, `prefs.js`, `calculator.js`, `playerEngine.js`, `strategy.js`, `advice.js`, `assistant.js`, `explorer.js`, `i18n.js`, `abtips.js`, `settings.js`, `sharecard.js` (16/16). Quindi: nessuna formula di rendita, nessuna conversione EUR/USD (1 USD = 0,86 EUR, `convertToDisplay`/`convertFromDisplay` invariate), nessun routing o intervallo SRB, nessun profilo/preferenza/chiave localStorage, nessuna tabella regionale.

## 4. Test

### Nuovo: `tests/check-money-format.js` (159 controlli)
- A. 4 combinazioni lingua/valuta × importi da 0 a 7 cifre intere (0; 0,004; 0,5; 0,99; 12,34; 123,45; 999,99; 1.000; 1.234,56; 9.999,99; 12.345,67; 99.999,99; 123.456,78; 999.999,99; 1.234.567,89).
- B. Testo → numero: il valore ricostruito dalla stringa coincide con il valore arrotondato (incl. 0,1+0,2 e 1e-9).
- C. Simbolo/codice e posizione (IT dopo l'importo con spazio non separabile; EN prima, senza spazio); una sola indicazione di valuta per importo.
- D. `formatCurrencyPrecise` (8 decimali), `formatMoneyDigits(…, 4)`, `formatStrategyMoney` sotto 1 centesimo.
- E. Lingua e valuta indipendenti (cambi incrociati, chiavi `aeLang`/`aeCurrency` salvate separatamente).
- F. Valori numerici invariati: `convertToDisplay`/`convertFromDisplay`, cambio 0,86, la formattazione non modifica gli input; rendita, SRB (min ≤ centrale ≤ max) e conversioni identiche tra le lingue.
- G. Stessa funzione usata da SRB (`getSRBDisplay`), strategia (`formatStrategyMoney`) e assistente.
- H. Analisi statica: nessun simbolo/codice concatenato, nessun `Intl` valutario fuori da `money.js`, nessun template i18n con simbolo accanto a un importo già formattato.
- I. Simulazione di un motore senza `useGrouping: "always"`: stessi risultati del percorso principale.

Controllo di sensatezza: eseguito contro il codice v0.9.4 il nuovo test **fallisce** (30 controlli prima di fermarsi, tutti sul difetto); con il ripiego disattivato a mano la sezione I fallisce.

### Nuovo: `tests/compare-numeric-v095.js` (confronto numerico prima/dopo)
224 scenari (8 gruppi Paese × 4 lingua/valuta × 7 profili da 40 a 200.000 terreni, incl. il caso 1.014 terreni): **14.304 numeri grezzi confrontati con `===`**, tutti identici; **14.864 testi mostrati** identici nelle cifre (tolti solo separatori, spazi, simboli/codici); `localStorage` identico; 16/16 file protetti identici. Copertura importi mostrati per cifre intere: <1 → 616, 1 → 318, 2 → 438, 3 → 468, 4 → 304, 5 → 256, 6 → 64. Controllo di sensatezza: cambiando a mano `exchangeRate` il confronto fallisce (225 controlli).

### Risultato reale di `node tests/run-all.js <v0.9.4 originale> --srb-text=same`
```
OK   check-seo.js  ->  Tutti i controlli superati
OK   check-lang-privacy.js  ->  Tutti i controlli superati
OK   check-prefs-currency.js  ->  prefs-currency: 56 ok, 0 falliti
OK   check-parser.js  ->  parser: 34 ok, 0 falliti
OK   check-i18n.js  ->  i18n: 21 ok, 0 falliti
OK   check-srb.js  ->  srb: 68 ok, 0 falliti
OK   check-srb-range.js  ->  srb-range: 119 ok, 0 falliti
OK   check-srb-routing.js  ->  srb-routing: 127 ok, 0 falliti
OK   check-srb-v094.js  ->  srb-v094: 229 ok, 0 falliti
OK   check-money-format.js  ->  money-format: 159 ok, 0 falliti
OK   regression-compare.js  ->  INFO domanda SRB ipotetica (200.000 terreni): risposta cambiata in 0/36 scenari ...
OK   compare-numeric-v095.js  ->  PASS confronto numerico v0.9.4 -> v0.9.5: 29856 controlli superati, 0 falliti

Tutte le suite superate
```
`regression-compare.js`: 80/80 scenari identici; 36/36 confini SRB come atteso.

### ⚠ Modifiche alle suite precedenti (da rivedere)
Le suite precedenti fissavano il vecchio formato a 4 cifre. Per questo ho dovuto modificare **solo le attese di formato**, senza rimuovere né indebolire alcun controllo (stesso numero di controlli: 68 / 119 / 127 / 229) e senza toccare formule o valori attesi:
- `check-srb.js` W7: atteso `1.141,24` (prima `1141,24`, con commento «it-IT non raggruppa a 4 cifre»).
- `check-srb-range.js`: attese letterali `1.141,24`, `1.250,73`, `1.075,62 €` (test 12, 20g, 21c).
- `check-srb-routing.js` e `check-srb-v094.js`: gli helper che producono la stringa attesa dalla formula a mano (`usd`, `eur`, `money`) ora usano `useGrouping: "always"`; i numeri attesi sono gli stessi.
- `regression-compare.js`: nuova opzione `--money-format=normalized` (usata da `run-all.js`): nei testi ignora solo separatori, spazi e simboli/codici di valuta; i valori numerici grezzi restano confrontati in modo esatto.
- `check-prefs-currency.js` è **identico** a v0.9.4 e passa.

## 5. Punti aperti e limiti (onestà sui controlli)

1. **Non eseguito:** `tests/browser-smoke.js` (richiede un browser; nessun browser/rete in questo ambiente) e qualsiasi prova su Safari/iPhone reale. Tutti i test girano in Node 22 con `vm`; il ripiego per motori Intl meno recenti è **simulato**, non provato su un motore vecchio reale. Da verificare a mano su iPhone: es. IT/EUR con importo tra 1.000 e 9.999.
2. **Decisione per il revisore:** in IT/USD Intl scrive il **codice** «USD» (`1.234,56 USD`), mentre le altre tre combinazioni usano il simbolo. È il comportamento standard (CLDR) già documentato nei test precedenti, quindi non l'ho cambiato. Se si preferisce «1.234,56 $» basta `currencyDisplay: "narrowSymbol"` in `buildMoneyFormatter` (modifica a una riga, ma tocca altre attese di test).
3. **Fuori ambito, non toccato:** i conteggi non monetari (terreni, AB; `app.js` nota limite SRB, `assistant.js`, `explorer.js`) usano `Intl.NumberFormat`/`toLocaleString` senza raggruppamento forzato, quindi in italiano «1014 terreni» resta senza punto mentre gli importi ora hanno «1.014,00 €». È una piccola incoerenza visiva da valutare separatamente. Idem il campo numerico dell'obiettivo in Impostazioni (`toFixed(2)`), che è un valore di input e non un testo mostrato.
4. Le pagine statiche (`guides/`, `privacy/`, `about/`) non usano la funzione monetaria e non sono state modificate.
5. `docs/02-REPORT-TEST.md` e i report precedenti non sono stati aggiornati: descrivono lo stato delle versioni passate.

## 6. File modificati rispetto a v0.9.4
`js/money.js` (produzione), `index.html` (badge versione), `README.md`, `tests/run-all.js`, `tests/regression-compare.js`, `tests/check-srb.js`, `tests/check-srb-range.js`, `tests/check-srb-routing.js`, `tests/check-srb-v094.js`; nuovi: `tests/check-money-format.js`, `tests/compare-numeric-v095.js`, `docs/14-REPORT-FASE1.5-v0.9.5.md`.
