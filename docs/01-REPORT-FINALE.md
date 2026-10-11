# AE Companion – Report finale SEO (v0.8)

URL attuale (invariato): https://alex4ndrus94.github.io/-ae-companion/

## Modifiche

**File aggiunti**
- `about/index.html`, `privacy/index.html`, `guides/index.html`
- `guides/come-usare-ae-companion/index.html`, `guides/calcolo-rendita/index.html`, `guides/boost-e-punto-morto/index.html`
- `css/pages.css` (stile delle pagine informative, riusa `design-system.css`)
- `sitemap.xml`, `robots.txt`, `404.html`, `assets/og-image.png` (1200×630)
- `tools/build-pages.js` (rigenera pagine e sitemap leggendo `js/config.js` e `js/countries.js`: nessuna seconda copia dei dati)
- `tests/check-seo.js`, `docs/*`

**File modificati**
- `index.html`: title, description, canonical, robots, Open Graph, Twitter Card, icone, JSON-LD (WebSite + WebApplication), nuova card “Cos'è AE Companion” (testo reale nell'HTML iniziale, tradotto IT/EN), link crawlable a Guide/Informazioni/Privacy nel footer, `<noscript>`.
- `js/i18n.js`: **solo aggiunte** di chiavi (0 righe rimosse o modificate) per la nuova card e i link.
- `css/style.css`: solo stili aggiunti in coda.
- `debug.html`: aggiunto `noindex, nofollow`.

**File rimossi**: `index.html.bak` (0 byte, vuoto).

**Non toccati**: tutti gli altri JS (formule, strategia, assistente, Explorer, storage), manifest, asset, branding, layout dell'app.

**Dati strutturati**: JSON-LD `WebSite` e `WebApplication` in home (gratuita, creatore Alessandro Chindemi, nessuna recensione/valutazione/prezzo inventato); `BreadcrumbList` nelle pagine informative.

**Pagine indicizzabili (7)**: home, `/about/`, `/privacy/`, `/guides/` e le 3 guide. `404.html` e `debug.html` sono noindex.

## Risposte alle 24 domande

1. **Stack**: HTML/CSS/JavaScript vanilla, nessun framework, nessun build, nessun `package.json`. Script classici in ordine, dati in `localStorage`. Font da Google Fonts, statistiche GoatCounter. Nessun service worker (il manifest c'è, la PWA non è “completa”: niente offline).
2. **Funzioni presenti** (verificate nel codice): rendita giorno/mese/anno con e senza boost; terreni per rarità; badge con bonus passaporto; fasce di boost per gruppo di Paesi (con “zona morta”); obiettivo (efficienza/rendita/terreni/Mayor) e Strategia dinamica; Assistente; Explorer Club con ladder e Day; flag Mission Pass; consigli Extra AB; card di condivisione; IT/EN; banner di installazione; salvataggio locale. *Non* esistono: grafici, storico, Mayor tracker con date, analisi ROI dei pass (il README li descrive come roadmap/obsoleto).
3. **Ostacoli SEO**: nessun title/description/canonical/OG/robots/sitemap; HTML iniziale quasi vuoto (tutto popolato da JS); una sola URL; lingua scelta via JS dal browser (Googlebot usa verosimilmente l'inglese mentre l'HTML statico è italiano); `robots.txt` in un sottopercorso non viene letto dai crawler.
4. **Contenuto senza JS**: ora sì per titolo, descrizione, introduzione, elenco funzioni, link. I numeri e gli strumenti restano dipendenti da JS, per natura.
5. **Link crawlable**: sì, `<a href>` reali dal footer della home e tra le pagine.
6. **URL**: vedi sopra; tutti i 7 sono nella sitemap.
7. **Implementato vs raccomandato**: implementato tutto sopra. Solo raccomandati: URL separati per lingua con hreflang, guide su Explorer Club/AB, pagine per Paese, misure Lighthouse, ogni azione su Search Console.
8. **Sitemap**: XML ben formato (test locale), URL assoluti sul sottopercorso corretto, senza `lastmod` inventati. Validazione ufficiale: la farà Search Console.
9. **robots.txt**: consente tutto e indica la sitemap, **ma Google legge solo `https://alex4ndrus94.github.io/robots.txt`** (radice dell'host, che non controlli). Senza quel file Google considera la scansione permessa: nessun problema, solo non fidarti del file come meccanismo.
10. **Canonical**: coerenti; ogni pagina ha come canonical la propria URL con slash finale (verificato da `tests/check-seo.js`). La home usa la directory, non `index.html`.
11. **Dati strutturati**: JSON sintatticamente valido (test locale). Rich Results Test / Schema validator: **NON ESEGUITO** (richiedono rete).
12. **Keyword**: vedi `05-KEYWORD-E-PIANI.md`.
13. **Da verificare**: tabelle di boost, rendite per rarità, bonus badge, tasso EUR 0,86 e ladder Explorer rispetto alle fonti ufficiali; le guide riportano “data ultima verifica: da confermare”. Se vuoi compilarla, indicami la data della tua verifica.
14. **GitHub Pages senza dominio**: sì; percorsi relativi nell'app e nelle pagine, assoluti `/-ae-companion/…` solo in `404.html`. Verifica effettiva dopo la pubblicazione: da fare.
15. **Test superati**: vedi `02-REPORT-TEST.md`.
16. **Non eseguiti**: Lighthouse/Core Web Vitals, Safari iPhone, test interattivi in browser, validatori online, Search Console.
17. **Rischi residui**: nessuna modifica a logica o dati; rischio basso sul layout (una nuova card in Home, link nel footer) — controllala da iPhone dopo la pubblicazione. Il nome del repo inizia con “-”: funziona ma è fragile; non cambiarlo ora.
18. **Su GitHub**: guida `03-GUIDA-PUBBLICAZIONE-IPHONE.md`.
19. **Su Search Console**: `04-GUIDA-SEARCH-CONSOLE.md`.
20. **Prima di AdSense**: vedi `05-KEYWORD-E-PIANI.md` (contenuti originali in quantità sensata, traffico organico stabile, pagine privacy/consenso a norma, dominio proprio quasi indispensabile).
21. **Dominio a pagamento**: quando c'è traffico organico dimostrabile in Search Console e un motivo concreto (AdSense, brand); non prima.
22. **Prossimi 3 interventi**: (1) pubblicare e inviare sitemap + ispezione URL; (2) decidere la strategia di lingua (URL IT/EN distinti); (3) verificare le tabelle con l'Help Center e scrivere 1–2 guide nuove (Explorer Club, AB).
23. **ZIP**: `ae-companion-v0.8.zip`.
24. **Report**: cartella `docs/` nello ZIP.

## Checklist finale
- [x] Funzioni preservate (nessun JS di logica modificato; confronto numerico prima/dopo)
- [x] Build: non esiste una build, nulla da compilare (`node --check` OK su tutti i JS)
- [x] Test eseguiti: vedi report test (con elenco NON ESEGUITO)
- [x] SEO tecnica, sitemap, robots (con limite), canonical, structured data (sintassi)
- [x] Pagine indicizzabili: 7
- [x] Compatibilità GitHub Pages: percorsi verificati localmente; online da verificare
- [ ] Mobile: NON ESEGUITO su dispositivo
- [x] Search Console readiness (guida; nessun token)
- [x] Monetizzazione non attivata · [x] Dominio non acquistato · [x] ZIP consegnato
