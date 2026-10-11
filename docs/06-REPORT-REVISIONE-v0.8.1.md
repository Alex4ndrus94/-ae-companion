# AE Companion – Report revisione finale v0.8.1

Base: `ae-companion-v0.8.zip`. URL di pubblicazione (invariato): https://alex4ndrus94.github.io/-ae-companion/
Nessuna modifica a formule, dati, logica dell'app, layout, manifest, asset. Nessuna pubblicità, abbonamento, pagamento o dominio. Nulla è stato pubblicato sul repository remoto.

## 1. Decisione sulla lingua

**Situazione trovata**
- `<html lang="it">`, contenuto iniziale della Home e tutte le pagine informative in italiano; `currentLang` parte da `it`.
- Title, description, Open Graph, Twitter Card e descrizioni JSON-LD della Home erano in **inglese**, con `og:locale = en_US`.
- Al caricamento `detectLanguage()` usa la lingua salvata, altrimenti `navigator.language`: un browser non italiano (verosimilmente anche il rendering di Googlebot) passa a EN via JavaScript, ma title e description restavano quelli statici.

**Soluzione adottata (URL unico, nessuna pagina duplicata)**
- Metadata statici della Home portati in **italiano**, la lingua dell'HTML iniziale e predefinita dell'app: title, description, `og:*`, `twitter:*`, descrizioni JSON-LD, `og:locale = it_IT` con `en_US` come alternate. `inLanguage` del JSON-LD resta `["it","en"]`.
- `applyTranslations()` in `js/i18n.js` ora aggiorna anche `document.title` e la meta description con le nuove chiavi `metaTitle` / `metaDescription` (IT ed EN), oltre a `<html lang>` che già aggiornava. Il selettore IT/EN e la lingua predefinita sono invariati.
- Il motto di posizionamento in inglese ("Atlas Earth Calculator, Portfolio Tracker & Strategy Companion") è marcato `lang="en"` dentro la pagina italiana.
- Data "Ultimo aggiornamento" ora tradotta (prima era sempre in italiano anche con interfaccia EN).

**URL distinti IT/EN: valutati, non implementati.** Su GitHub Pages sono tecnicamente possibili (cartella `/en/` statica), ma richiederebbero una seconda copia dell'intera app e delle guide, la lingua forzata dall'URL (oggi decide localStorage/browser), `hreflang` reciproci e switcher a link: troppo rischioso da fare senza un browser per verificarlo e in contrasto con "nessuna pagina duplicata". Schema consigliato per quando servirà: `/en/` con pagina e metadata in inglese, `hreflang` it / en / x-default nelle due Home e nella sitemap, guide tradotte solo quando i testi sono pronti.

**Limite residuo.** Se Googlebot visualizza la Home con lingua inglese, il DOM dopo il rendering avrà title/description in inglese mentre l'HTML grezzo li ha in italiano: sono coerenti tra loro in entrambi i casi, ma Google può scegliere quale mostrare. Da osservare in Search Console (ispezione URL → HTML sottoposto a rendering). Con un solo URL non si può controllare di più.

## 2. Altre modifiche

| File | Modifica |
|---|---|
| `index.html` | metadata in italiano (sopra); versione footer `v0.7` → `v0.8.1`; data aggiornamento tradotta; `lang="en"` sul motto |
| `js/i18n.js` | solo aggiunte: `metaTitle`, `metaDescription`, `lastUpdateDate` (IT/EN) e 5 righe in `applyTranslations()` |
| `tools/build-pages.js` + `guides/boost-e-punto-morto/` | le tabelle Paese nella guida italiana usavano le etichette inglesi (`labelEn`): ora in italiano |
| `tools/build-pages.js` + `privacy/` | privacy riscritta sul comportamento reale (vedi §3) |
| `tools/build-pages.js` + `about/` | il paragrafo "I tuoi dati" cita statistiche e Google Fonts |
| `README.md` | aggiunto "Stato attuale" e nota che le sezioni Roadmap/Features sono il piano originale (grafici, storico, ROI pass, Chart.js non esistono); rimosso il riferimento a un test inesistente |
| `tests/` | nuovi `check-lang-privacy.js` e `regression-compare.js` |

Verificati e **lasciati invariati** perché già corretti: canonical (una per pagina, slash finale), `sitemap.xml` (7 URL, identica), percorsi relativi, link interni, `404.html` (percorsi assoluti `/-ae-companion/`, noindex), `debug.html` (noindex), JSON-LD (nessuna valutazione o recensione inventata), manifest, `robots.txt` (documentato come non valido fuori dalla radice dell'host).

## 3. Privacy e disclaimer

La pagina ora descrive: dati in localStorage con le 5 chiavi reali (`aeCompanionData`, `aeLang`, `aeCountryGroup`, `aeActiveTab`, `aeInstallBannerDismissed`), nessun account, nessun cookie propri (il codice non usa `document.cookie`), card di condivisione generata localmente, GoatCounter solo sulla pagina dell'app (script da gc.zgo.at), Google Fonts su tutte le pagine, hosting GitHub Pages, link a Instagram e Buy Me a Coffee, assenza di pubblicità, contatto. Dichiara che non è consulenza legale né dichiarazione di conformità.

Il disclaimer di indipendenza da Atlas Reality / Atlas Earth è presente nella Home (card "Cos'è AE Companion", IT/EN), in "Informazioni" e nel footer di ogni pagina informativa.

**Da far verificare al proprietario (non sono garanzie che posso dare io):**
- Cosa raccoglie davvero GoatCounter con la tua configurazione e come tratta l'IP: la pagina rimanda alla politica del fornitore senza elencare dati che non ho potuto verificare.
- Se per te servono un'informativa privacy completa (titolare, finalità, basi giuridiche, diritti, tempi di conservazione) e/o un banner di consenso: dipende da giurisdizione e uso, e non l'ho stabilito.
- Il caricamento di Google Fonts dai server Google. In `assets/fonts/` ci sono già i file woff2 (usati solo dalla card di condivisione) ma nessun `@font-face` li usa nelle pagine: farlo permetterebbe di togliere la dipendenza esterna, ma cambia il rendering e va provato su iPhone, quindi non l'ho fatto.
- La frase "Eventuali cambiamenti futuri saranno riportati in questa pagina" è un impegno tuo: confermalo o toglilo.
- Il README dichiara "This project is currently private. All rights reserved" mentre GitHub Pages gratuito richiede un repository pubblico: decidi tu la licenza (non modificata).
- Marchi: la formula "marchio dei rispettivi titolari" è generica; non ho verificato i marchi.

## 4. Test eseguiti (Node 22, sandbox `vm`, nessuna rete, nessun browser)

| Test | Esito |
|---|---|
| `node --check` su tutti i JS (`js/`, `tools/`, `tests/`) | PASS |
| `node tests/check-seo.js` (title, description, canonical, H1, sitemap, JSON-LD, link/asset interni, noindex, chiavi i18n) | PASS, 56 controlli |
| `node tests/check-lang-privacy.js` (lang vs metadata statici, JSON-LD, og:locale, cambio lingua in sandbox, pagine it, privacy vs codice e vs host esterni, disclaimer) | PASS |
| `node tests/regression-compare.js` v0.8 vs v0.8.1: rendita (giorno/mese/anno, con e senza boost, SRB), conversioni, boost, soglie di recupero, Strategia nei 4 obiettivi, Explorer Club, Assistente, consigli AB; 8 gruppi Paese × IT/EN × 5 profili | PASS, 80/80 identici |
| Verifica del test di regressione: con tasso EUR alterato in una copia | FAIL come previsto (40/80 diversi): il test rileva le differenze |
| `diff -r` v0.8 / v0.8.1 | Cambiati solo i file della tabella sopra; `sitemap.xml` e le altre 3 guide identiche |

## 5. NON eseguito

Safari/iPhone o altro browser reale (rendering, cambio lingua con click, layout footer), Lighthouse / Core Web Vitals, Google Search Console, Rich Results Test, validatori online (XML, schema.org, HTML), controllo dei link esterni, verifica online su GitHub Pages (refresh diretto delle route, 404, sitemap raggiungibile), anteprime social reali (Facebook/X). I test sopra su `applyTranslations` usano un DOM simulato, non un browser.

## 6. Operazioni manuali

1. Carica su GitHub (interfaccia web) i file cambiati: `index.html`, `js/i18n.js`, `about/index.html`, `privacy/index.html`, `guides/boost-e-punto-morto/index.html`, `tools/build-pages.js`, `README.md`, i due nuovi file in `tests/` e `docs/06-REPORT-REVISIONE-v0.8.1.md`. Nessun file da eliminare.
2. Dopo la pubblicazione, da iPhone: apri la Home, cambia IT/EN e controlla titolo della scheda, footer (versione e data) e card "Cos'è AE Companion"; apri `/privacy/` e `/guides/boost-e-punto-morto/`.
3. Search Console: ispeziona la Home e leggi l'HTML sottoposto a rendering (lingua e title visti da Google), invia `sitemap.xml`, controlla "Pagine" dopo qualche giorno. Vedi `04-GUIDA-SEARCH-CONSOLE.md`.
4. Compila la "data ultima verifica" delle guide solo dopo aver confrontato le tabelle con l'Help Center ufficiale.
