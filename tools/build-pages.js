// AE Companion - generatore delle pagine informative (SEO)
// Uso (facoltativo, richiede Node): node tools/build-pages.js
// Le tabelle numeriche delle guide sono lette da js/config.js e js/countries.js,
// cosi' non esiste una seconda copia dei dati da tenere allineata a mano.
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
const BASE = "https://alex4ndrus94.github.io/-ae-companion/";

// --- legge CONFIG e countryGroups dal codice reale ---
const ctx = { localStorage: { getItem() { return null; }, setItem() {} }, navigator: { language: "it" }, document: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "js/config.js"), "utf8") + "\n;this.CONFIG=CONFIG;", ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "js/countries.js"), "utf8") + "\n;this.groups=countryGroups;", ctx);
const CONFIG = ctx.CONFIG, groups = ctx.groups;

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmtSec = n => n.toFixed(10).replace(".", ",");
const range = bp => bp.max === Infinity ? bp.min + "+" : bp.min + "–" + bp.max;

function boostTable(g) {
  return '<div class="table-wrap"><table><thead><tr><th>Terreni</th><th>Boost</th></tr></thead><tbody>' +
    g.breakpoints.map(b => `<tr><td>${range(b)}</td><td>x${b.boost}</td></tr>`).join("") + "</tbody></table></div>";
}

// punto morto: stessa formula di getBracketTransitionRecovery() in js/calculator.js
function deadZones(g) {
  const out = [];
  for (let i = 0; i < g.breakpoints.length - 1; i++) {
    const c = g.breakpoints[i], n = g.breakpoints[i + 1];
    const rec = Math.ceil((c.max * c.boost) / n.boost);
    out.push({ cap: c.max, from: c.boost, to: n.boost, start: n.min, rec, dead: rec > n.min });
  }
  return out;
}

const eu = groups.EU_WEST;
const dz = deadZones(eu);
const dzEx = dz[0];

function page(o) {
  const depth = o.path.split("/").filter(Boolean).length;
  const up = "../".repeat(depth) || "./";
  const url = BASE + o.path;
  const crumbs = [{ name: "AE Companion", url: BASE }].concat(o.crumbs || []).concat([{ name: o.h1, url }]);
  const ld = { "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })) };
  const nav = crumbs.map((c, i) => i === crumbs.length - 1 ? `<span aria-current="page">${esc(c.name)}</span>` : `<a href="${c.url.replace(BASE, up)}">${esc(c.name)}</a>`).join(" › ");
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<link rel="icon" href="${up}assets/logo.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${up}assets/icons/pwa/apple-touch-icon.png">
<meta name="theme-color" content="#10141B">
<meta property="og:type" content="article">
<meta property="og:site_name" content="AE Companion">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${BASE}assets/og-image.png">
<meta property="og:locale" content="it_IT">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${up}css/design-system.css">
<link rel="stylesheet" href="${up}css/pages.css">
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
</head>
<body class="doc-page">
<header class="doc-header">
  <a class="doc-brand" href="${up}"><img src="${up}assets/logo.svg" alt="" width="32" height="32"><span>AE Companion</span></a>
  <nav class="doc-nav" aria-label="Principale">
    <a href="${up}">App</a><a href="${up}guides/">Guide</a><a href="${up}about/">Informazioni</a>
  </nav>
</header>
<main class="doc-main">
<nav class="breadcrumb" aria-label="Breadcrumb">${nav}</nav>
<h1>${esc(o.h1)}</h1>
${o.body}
<p class="cta"><a class="btn-link" href="${up}">Apri AE Companion</a></p>
</main>
<footer class="doc-footer">
<p>AE Companion è un progetto indipendente, non affiliato, sponsorizzato né approvato da Atlas Reality o Atlas Earth. “Atlas Earth” è un marchio dei rispettivi titolari. I risultati sono stime a scopo informativo.</p>
<p><a href="${up}guides/">Guide</a> · <a href="${up}about/">Informazioni</a> · <a href="${up}privacy/">Privacy</a></p>
</footer>
</body>
</html>
`;
}

const pages = [];
function add(o) { pages.push(o); const f = path.join(ROOT, o.path, "index.html"); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, page(o)); }

// ---------- Informazioni ----------
add({ path: "about/", title: "Informazioni su AE Companion – strumento indipendente per Atlas Earth",
  desc: "Che cos'è AE Companion, chi lo sviluppa, cosa fa e cosa non è: uno strumento gratuito e indipendente per giocatori di Atlas Earth.",
  h1: "Informazioni su AE Companion", body: `
<p><strong>AE Companion</strong> — <em>Track. Plan. Conquer.</em> — è una web app gratuita pensata per chi gioca ad <strong>Atlas Earth</strong>: un calcolatore di rendita, un tracker del portafoglio terreni e un compagno di strategia, ottimizzato per smartphone.</p>
<h2>Cosa fa</h2>
<ul>
<li>Calcola la rendita giornaliera, mensile e annuale dei tuoi terreni, con e senza boost.</li>
<li>Applica le fasce di boost del Paese scelto e segnala le “zone morte” tra una fascia e l'altra.</li>
<li>Tiene traccia di terreni per rarità, badge e obiettivo Mayor.</li>
<li>Pianifica gli AB, compreso il calendario dell'Explorer Club.</li>
<li>Propone una strategia in base all'obiettivo scelto e risponde a domande sui tuoi dati con l'Assistente.</li>
<li>Genera una card di condivisione delle tue statistiche.</li>
</ul>
<p>Leggi <a href="../guides/come-usare-ae-companion/">come usare AE Companion</a> oppure <a href="../guides/calcolo-rendita/">come viene calcolata la rendita</a>.</p>
<h2>Chi lo sviluppa</h2>
<p>AE Companion è creato e mantenuto da <strong>Alessandro Chindemi</strong>. Richieste o suggerimenti: <a href="https://www.instagram.com/alexandrus_94/" rel="noopener" target="_blank">Instagram @alexandrus_94</a>.</p>
<h2>Cosa non è</h2>
<p>AE Companion è un progetto <strong>indipendente</strong>: non è affiliato, sponsorizzato né approvato da Atlas Reality o Atlas Earth. Non usa i loro loghi. I calcoli sono stime basate sulle tabelle e sui valori incorporati nell'app e possono differire da quanto mostrato nel gioco; in caso di dubbio fanno fede le informazioni ufficiali del Help Center di Atlas Earth.</p>
<h2>I tuoi dati</h2>
<p>I dati che inserisci restano nel tuo dispositivo. L'app usa però statistiche di visita (GoatCounter) e carica i caratteri da Google Fonts: i dettagli sono nella <a href="../privacy/">pagina Privacy</a>.</p>` });

// ---------- Privacy ----------
add({ path: "privacy/", title: "Privacy – AE Companion", desc: "Quali dati usa AE Companion: dati salvati sul dispositivo, statistiche di visita GoatCounter, caratteri da Google Fonts, hosting GitHub Pages.",
  h1: "Privacy", body: `
<p>Questa pagina descrive in modo semplice che cosa fa AE Companion con i dati. Non è una consulenza legale né una dichiarazione di conformità a normative specifiche. Ultimo aggiornamento: 9 ottobre 2026.</p>
<h2>Dati che inserisci nell'app</h2>
<p>Nome, terreni, badge, obiettivi, AB, pass attivi e date dell'Explorer Club vengono salvati nel <strong>localStorage del tuo browser</strong>, insieme alle preferenze di lingua, valuta, Paese, scheda aperta e alla scelta di chiudere il banner di installazione (chiavi: <code>aeCompanionData</code>, <code>aeLang</code>, <code>aeCurrency</code>, <code>aeFxRates.v1</code> (ultimi tassi di cambio scaricati), <code>aePrefsMigration</code>, <code>aeCountryGroup</code>, <code>aeActiveTab</code>, <code>aeInstallBannerDismissed</code>). L'app non richiede account né registrazione e non invia questi dati a un server di AE Companion. Cancellando i dati del sito dal browser li perdi. AE Companion non imposta cookie propri.</p>
<p>La card di condivisione viene generata nel tuo dispositivo; se la condividi, va dove scegli tu.</p>
<h2>Statistiche di visita</h2>
<p>La pagina dell'app (non le pagine Guide, Informazioni e Privacy) carica lo script di <strong>GoatCounter</strong> da gc.zgo.at e invia le statistiche di visita al conto GoatCounter del gestore del sito. In generale questi strumenti registrano dati tecnici della visita, per esempio la pagina vista e informazioni sul browser e sul dispositivo. Quali dati vengono effettivamente raccolti e come sono trattati è descritto dal fornitore: <a href="https://www.goatcounter.com/help/privacy" rel="noopener" target="_blank">goatcounter.com/help/privacy</a>.</p>
<h2>Caratteri e servizi esterni</h2>
<p>I caratteri di tutte le pagine vengono caricati da <strong>Google Fonts</strong> (fonts.googleapis.com e fonts.gstatic.com): per farlo il tuo browser contatta i server di Google, che ricevono, come ogni server contattato, almeno l'indirizzo IP e i dati tecnici della richiesta. I link a Instagram e Buy Me a Coffee portano a siti di terzi con le loro politiche e contattano quei servizi solo se li apri.</p>
<h2>Hosting</h2>
<p>Se scegli una valuta diversa dal dollaro USA, la pagina dell'app contatta <strong>api.frankfurter.dev</strong> (API Frankfurter, senza chiave) per scaricare i tassi di cambio giornalieri; con il dollaro USA non parte nessuna richiesta di questo tipo. La richiesta non contiene i tuoi dati di gioco, ma, come ogni richiesta di rete, espone al servizio almeno l'indirizzo IP e i dati tecnici del browser. Il fornitore descrive la propria informativa su <a href="https://frankfurter.dev/" rel="noopener" target="_blank">frankfurter.dev</a>. I tassi scaricati sono conservati nel localStorage per non ripetere la richiesta: l'app li aggiorna solo quando sono scaduti.</p>
<p>Il sito è ospitato su <strong>GitHub Pages</strong>. Come ogni servizio di hosting, GitHub può registrare dati tecnici delle richieste (per esempio l'indirizzo IP) secondo le proprie politiche.</p>
<h2>Pubblicità</h2>
<p>Al momento AE Companion non mostra pubblicità e non usa cookie pubblicitari. Eventuali cambiamenti futuri saranno riportati in questa pagina.</p>
<h2>Contatti</h2>
<p>Per domande su questa pagina: Alessandro Chindemi, <a href="https://www.instagram.com/alexandrus_94/" rel="noopener" target="_blank">Instagram @alexandrus_94</a>.</p>` });

// ---------- Guida: come usare ----------
const G1 = "guides/come-usare-ae-companion/";
add({ path: G1, crumbs: [{ name: "Guide", url: BASE + "guides/" }],
  title: "Come usare AE Companion: guida rapida al calcolatore per Atlas Earth",
  desc: "Guida passo passo ad AE Companion: inserire terreni e badge, scegliere Paese e obiettivo, leggere la rendita, usare Strategia, Assistente ed Explorer Club.",
  h1: "Come usare AE Companion", body: `
<p>AE Companion funziona nel browser e si può aggiungere alla schermata Home. Tutto parte dal pannello <strong>Modifica dati</strong>.</p>
<h2>1. Inserisci i tuoi dati</h2>
<ol>
<li>Tocca l'icona della <strong>matita</strong> nella card del giocatore.</li>
<li>Scegli il <strong>Paese</strong>: determina la tabella delle fasce di boost usata nei calcoli.</li>
<li>Scegli l'<strong>obiettivo</strong>: efficienza generale, rendita specifica, numero di terreni o Mayor di una città.</li>
<li>Inserisci i terreni per rarità (Common, Rare, Epic, Legendary), i badge, l'obiettivo Mayor e gli AB disponibili.</li>
<li>Se hai l'Explorer Club, attivalo e indica la data di inizio: il Day e gli AB al giorno si calcolano dalla tabella delle ricompense. Salva.</li>
</ol>
<h2>2. Leggi la Home</h2>
<p>La card <em>Rendita</em> mostra oggi, mese e anno, ciascuno anche <em>senza boost</em>. Sotto trovi boost attuale, bonus passaporto dei badge, rendita al secondo e una stima separata del Super Rent Boost. Il metodo è spiegato in <a href="../calcolo-rendita/">Come viene calcolata la rendita</a>.</p>
<h2>3. Usa Strategia e Assistente</h2>
<p>La scheda <em>Strategia</em> cambia in base all'obiettivo: indica quanto manca, quali soglie di boost attraverserai e se incontri una “zona morte” (<a href="../boost-e-punto-morto/">come funziona</a>). L'<em>Assistente</em> risponde a domande come “Cosa conviene comprare?” con calcoli sui tuoi dati; non è un'AI generica.</p>
<h2>4. Extra AB e condivisione</h2>
<p>La scheda <em>Extra AB</em> raccoglie consigli per guadagnare più AB. Con l'icona di condivisione crei una card con le tue statistiche. In alto puoi cambiare lingua (IT/EN).</p>
<h2>Limiti da conoscere</h2>
<p>I valori sono stime. Le tabelle sono incorporate nell'app e quelle del gioco possono cambiare: confrontale con l'Help Center ufficiale.</p>` });

// ---------- Guida: calcolo rendita ----------
const G2 = "guides/calcolo-rendita/";
const r = CONFIG.rentPerSecond;
add({ path: G2, crumbs: [{ name: "Guide", url: BASE + "guides/" }],
  title: "Calcolo rendita Atlas Earth: come lo fa AE Companion",
  desc: "Come AE Companion calcola la rendita dei terreni di Atlas Earth: rendita al secondo per rarità, bonus badge, boost, giorno, mese e anno, e Super Rent Boost.",
  h1: "Come viene calcolata la rendita in AE Companion", body: `
<p class="note"><strong>Nota sulle fonti.</strong> Questa guida descrive il calcolo <em>implementato in AE Companion</em>, ricavato dal suo codice. I valori per rarità e le soglie sono costanti dell'app (nel codice sono indicati come ripresi dall'Help Center di Atlas Earth); non sono stati riverificati in modo indipendente per questa pagina. <strong>Data ultima verifica: da confermare dal proprietario.</strong></p>
<h2>Passaggi</h2>
<ol>
<li><strong>Rendita grezza al secondo</strong>: somma, per ogni rarità, dei terreni posseduti per la rendita al secondo di quella rarità.</li>
<li><strong>Bonus passaporto</strong>: la rendita viene moltiplicata per 1 + percentuale del bonus legata al numero di badge.</li>
<li><strong>Boost</strong>: il risultato viene moltiplicato per il boost della fascia in cui cade il totale dei terreni, secondo la tabella del Paese (<a href="../boost-e-punto-morto/">vedi le fasce</a>).</li>
<li><strong>Periodi</strong>: giorno = secondi × 86.400; mese = 30 giorni; anno = 365 giorni.</li>
<li><strong>Valuta</strong>: la rendita è calcolata in USD. La valuta di visualizzazione è una scelta indipendente dalla lingua: gli importi vengono convertiti con il cambio giornaliero più recente dell'API Frankfurter (${CONFIG.fx.docsUrl}); l'app mostra la data del cambio e avvisa se non è aggiornato.</li>
</ol>
<p>La riga “senza boost” della Home salta il passaggio 3.</p>
<h2>Rendita al secondo per rarità (valori usati dall'app)</h2>
<div class="table-wrap"><table><thead><tr><th>Rarità</th><th>$ al secondo</th></tr></thead><tbody>
${["common", "rare", "epic", "legendary"].map(k => `<tr><td>${k[0].toUpperCase() + k.slice(1)}</td><td>${fmtSec(r[k])}</td></tr>`).join("")}
</tbody></table></div>
<h2>Bonus passaporto per numero di badge (valori usati dall'app)</h2>
<div class="table-wrap"><table><thead><tr><th>Badge</th><th>Bonus</th></tr></thead><tbody>
${CONFIG.badgeBoostTiers.map(t => `<tr><td>${t.max === Infinity ? t.min + "+" : (t.min === t.max ? t.min : t.min + "–" + t.max)}</td><td>+${t.percent}%</td></tr>`).join("")}
</tbody></table></div>
<h2>Super Rent Boost</h2>
<p>La Home mostra a parte una stima supplementare del Super Rent Boost (moltiplicatore x${CONFIG.srbMultiplier} nell'app), calcolata sulla rendita base con bonus badge, con x${CONFIG.srbMultiplier} sui primi ${CONFIG.srbParcelLimit.toLocaleString("it-IT")} terreni (limite indicato dall'Help Center) e con il boost ordinario del loro scaglione sui terreni oltre il limite; il boost ordinario <em>non</em> viene sommato al x50. Poiché l'app non conosce l'ordine di acquisizione dei terreni (conserva le quantità per rarità, non la cronologia), la stima centrale ripartisce proporzionalmente le rarità tra i terreni entro e oltre il limite. Se hai più di ${CONFIG.srbParcelLimit.toLocaleString("it-IT")} terreni, la Home mostra anche un intervallo teorico, con due scenari estremi sull'ordine di acquisizione: non è un intervallo statistico di confidenza né una garanzia di guadagno. La stima riguarda un singolo giorno di evento: durata e frequenza degli eventi non sono garantite, quindi l'app non stima un guadagno mensile. Non è inclusa nella rendita principale perché dipende dalla durata dell'evento e dal tempo in cui lo mantieni attivo. Non è confermato se in gioco i moltiplicatori si sommano: tratta il valore come ipotesi.</p>
<h2>Prova con i tuoi numeri</h2>
<p>Inserisci i tuoi dati in <a href="../../">AE Companion</a>; per capire quando conviene comprare terreni leggi anche <a href="../boost-e-punto-morto/">boost e punto morto</a>.</p>` });

// ---------- Guida: boost e punto morto ----------
const G3 = "guides/boost-e-punto-morto/";
const others = Object.keys(groups).filter(k => k !== "EU_WEST");
add({ path: G3, crumbs: [{ name: "Guide", url: BASE + "guides/" }],
  title: "Boost Atlas Earth e “punto morto”: fasce per Paese e come evitarlo",
  desc: "Come funzionano le fasce di boost in Atlas Earth secondo le tabelle di AE Companion, cos'è la zona morte tra due fasce e come si calcola quanti terreni servono per recuperare.",
  h1: "Fasce di boost e “punto morto”", body: `
<p class="note"><strong>Nota sulle fonti.</strong> Le tabelle sono quelle incorporate in AE Companion (nel codice indicate come tratte dall'Help Center di Atlas Reality) e vengono qui generate automaticamente dal codice. Non sono state riverificate in modo indipendente per questa pagina e il gioco può modificarle. <strong>Data ultima verifica: da confermare dal proprietario.</strong></p>
<h2>Come funzionano le fasce</h2>
<p>Il boost è un moltiplicatore della rendita che dipende dal <em>numero totale di terreni</em> e dal Paese. Più terreni hai, più il moltiplicatore scende: la rendita totale in genere cresce, ma con l'aumentare delle fasce ogni terreno in più rende meno in proporzione.</p>
<h2>Italia e Europa occidentale (tabella usata dall'app)</h2>
<p>Gruppo: ${esc(eu.label)}.</p>
${boostTable(eu)}
<h2>Il punto morto</h2>
<p>Al passaggio tra due fasce il moltiplicatore scende. Se superi il tetto della fascia attuale di poco, la rendita totale può diminuire invece di salire, finché non hai abbastanza terreni nella fascia successiva. AE Companion calcola la soglia di recupero così:</p>
<p class="formula">terreni di recupero = ⌈ tetto fascia attuale × boost attuale ÷ boost fascia successiva ⌉</p>
<p><strong>Esempio con la tabella sopra.</strong> Al tetto della prima fascia (${dzEx.cap} terreni) il boost è x${dzEx.from}; nella successiva è x${dzEx.to}, che parte da ${dzEx.start} terreni. Servono ⌈${dzEx.cap} × ${dzEx.from} ÷ ${dzEx.to}⌉ = <strong>${dzEx.rec} terreni</strong> per eguagliare la rendita che avevi a ${dzEx.cap}. Tra ${dzEx.cap + 1} e ${dzEx.rec - 1} terreni, a parità di rarità e badge, la rendita è inferiore. ${dzEx.dead ? "Qui esiste quindi una zona morte." : ""}</p>
<h3>Soglie di recupero per fascia (stessa tabella)</h3>
<div class="table-wrap"><table><thead><tr><th>Tetto fascia</th><th>Boost</th><th>Recupero a</th><th>Zona morte</th></tr></thead><tbody>
${dz.map(d => `<tr><td>${d.cap}</td><td>x${d.from} → x${d.to}</td><td>${d.rec}</td><td>${d.dead ? "sì" : "no"}</td></tr>`).join("")}
</tbody></table></div>
<p>I valori assumono rarità e badge costanti: in pratica contano anche la rarità dei terreni nuovi e il bonus badge. È un calcolo, non un consiglio d'acquisto.</p>
<h2>Altri gruppi di Paesi</h2>
${others.map(k => `<details><summary>${esc(groups[k].label)}</summary>${boostTable(groups[k])}</details>`).join("\n")}
<p>Per applicarlo ai tuoi numeri apri <a href="../../">AE Companion</a>; il metodo di calcolo della rendita è in <a href="../calcolo-rendita/">questa guida</a>.</p>` });

// ---------- Indice guide ----------
add({ path: "guides/", title: "Guide per Atlas Earth – AE Companion",
  desc: "Guide di AE Companion: come usare l'app, come si calcola la rendita dei terreni e come funzionano boost e punto morto in Atlas Earth.",
  h1: "Guide", body: `
<p>Guide sull'uso di AE Companion e sul metodo di calcolo che adotta. Ogni guida indica quando i dati provengono dal codice dell'app e vanno confrontati con le fonti ufficiali.</p>
<ul class="guide-list">
<li><a href="come-usare-ae-companion/">Come usare AE Companion</a><span>Dai dati iniziali a Strategia, Assistente ed Explorer Club.</span></li>
<li><a href="calcolo-rendita/">Come viene calcolata la rendita</a><span>Rendita al secondo, bonus badge, boost, mese e anno.</span></li>
<li><a href="boost-e-punto-morto/">Fasce di boost e punto morto</a><span>Tabelle per Paese e soglie di recupero.</span></li>
</ul>` });

// ---------- sitemap ----------
const urls = [BASE].concat(pages.map(p => BASE + p.path));
fs.writeFileSync(path.join(ROOT, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u => `  <url>\n    <loc>${u}</loc>\n  </url>`).join("\n") + "\n</urlset>\n");
console.log("Pagine generate:", pages.map(p => p.path).join(", "));
