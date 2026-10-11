# Guida Google Search Console (passaggi tuoi)

Nel progetto non c'è nessun token: va generato da te con il tuo account Google.

1. Vai su search.google.com/search-console → **Aggiungi proprietà** → **Prefisso URL** → `https://alex4ndrus94.github.io/-ae-companion/`
2. **Verifica** (metodi compatibili con GitHub Pages):
   - *Tag HTML*: copia il `<meta name="google-site-verification" content="…">` e aggiungilo in `index.html` subito dopo il `<title>`; commit; poi **Verifica**.
   - oppure *File HTML*: scarica il file proposto e caricalo nella radice del repository; poi **Verifica**.
3. **Sitemap**: menu *Sitemap* → inserisci `sitemap.xml` → Invia. Dovrebbe risultare “Operazione riuscita” e 7 URL scoperti.
4. **Ispezione URL**: incolla la home e `/guides/calcolo-rendita/` → *Test URL pubblico* → guarda lo screenshot renderizzato → *Richiedi indicizzazione*.
5. **Pagine** (indicizzazione): controlla “Indicizzata” / “Non indicizzata” con il motivo.
6. **Rendimento**: dopo alcuni giorni leggi impression, clic, CTR e posizione media; nella scheda *Query* vedi le ricerche reali.
7. Ripeti dopo ogni pubblicazione importante.

## Stati diversi
- **Pubblicata**: la pagina si apre da browser.
- **Scansionata**: Googlebot l'ha scaricata.
- **Indicizzata**: Google l'ha salvata e può mostrarla.
- **Con impression**: è apparsa in una ricerca.
- **Con clic**: qualcuno ci è arrivato da Google.
Che una pagina si apra non significa che sia indicizzata.
