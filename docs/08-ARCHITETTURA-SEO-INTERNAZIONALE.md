# Architettura SEO internazionale — proposta (v0.9.0, Fase 1)

Stato: **progettazione completata; implementazione locale minima; nulla pubblicato.** Nessuna garanzia di posizionamento.

## Situazione attuale (verificata)
- L'app è una pagina unica (`/-ae-companion/`); la lingua cambia via JavaScript e non esiste un URL distinto per lingua.
- `index.html` è statico in italiano (`<html lang="it">`, title/description/OG/JSON-LD in italiano); `og:locale=it_IT`, `en_US` come alternate.
- Pagine informative (about, privacy, guide) solo in italiano, generate da `tools/build-pages.js`.
- Sitemap, robots e canonical sono coerenti col sottopercorso GitHub Pages `/-ae-companion/` (test `check-seo.js`).

## Implementato in questa fase
- Titolo e description seguono già la lingua attiva (`applyTranslations`); `<html lang>` aggiornato al cambio lingua.
- Nessun `hreflang` aggiunto (non esistono URL linguistici distinti): il test `check-i18n.js` fallisce se ne compare uno.
- Testi non verificabili ("tabelle ufficiali", "rendita ufficiale") rimossi anche dall'HTML statico.
- Test su link locali, percorsi relativi, sitemap, canonical.

## Proposta per la fase finale (da approvare, non implementata)
1. **URL distinti** solo quando esisteranno le pagine: `/-ae-companion/` (default) e `/-ae-companion/en/` (generata da `build-pages.js` con title, description, OG, JSON-LD e `<html lang>` statici nella lingua).
2. `hreflang` reciproci + `x-default` **solo** tra URL realmente pubblicati e raggiungibili; canonical autoreferenziale per lingua.
3. Sitemap con le due versioni (`xhtml:link` alternate) generata dallo stesso script.
4. Pagine about/privacy/guide: versione EN da tradurre (oggi mancante); finché non esiste, nessun hreflang per esse.
5. JSON-LD coerente con il contenuto reale (nessuna valutazione/offerta inventata).
6. Decisione aperta: con l'inglese come lingua iniziale dei nuovi utenti, l'HTML statico di `/` resta italiano (ciò che vedono i crawler) o diventa inglese? Consiglio: tenere `/` italiano finché non esiste `/en/`.

## Da pubblicare e verificare alla fine
Qualsiasi modifica a `index.html`, sitemap, robots, manifest e nuove pagine; verifica con Search Console (URL reali, hreflang senza errori).
