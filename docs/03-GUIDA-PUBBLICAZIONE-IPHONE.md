# Pubblicazione da iPhone (solo browser, nessun terminale)

Prima: nell'app **File** tocca lo ZIP per decomprimerlo.

## A. File da sostituire (stessa cartella, stesso nome)
In Safari apri il repository su GitHub, entra nella cartella indicata, tocca **Add file → Upload files**, scegli il file, poi **Commit changes**. Un file con lo stesso nome viene sostituito.
1. radice: `index.html`, `debug.html`
2. `css/`: `style.css`
3. `js/`: `i18n.js`

## B. File nuovi nelle cartelle già esistenti
4. radice: `sitemap.xml`, `robots.txt`, `404.html`
5. `css/`: `pages.css`
6. `assets/`: `og-image.png`

## C. Pagine nuove (cartelle nuove)
L'upload dal telefono non crea cartelle, quindi per ciascuna: **Add file → Create new file**, nel campo nome scrivi il percorso completo (la barra `/` crea la cartella), incolla il contenuto del file (aprilo in File, seleziona tutto, copia) e fai **Commit changes**.
- `about/index.html`
- `privacy/index.html`
- `guides/index.html`
- `guides/come-usare-ae-companion/index.html`
- `guides/calcolo-rendita/index.html`
- `guides/boost-e-punto-morto/index.html`

## D. Facoltativi
- Elimina `index.html.bak` (vuoto).
- `tools/`, `tests/`, `docs/` servono solo a te: puoi non caricarli (restano nello ZIP).

## E. Controllo
Dopo 1–3 minuti apri (anche in navigazione privata): la home, `/about/`, `/guides/`, `/guides/calcolo-rendita/`, `/sitemap.xml`. Poi controlla da iPhone che la Home si carichi, che i tuoi dati siano ancora lì e che il footer mostri Guide · Informazioni · Privacy. Se qualcosa non va, su GitHub apri il commit e usa **Revert**.

Non cambiare nome del repository o username.
