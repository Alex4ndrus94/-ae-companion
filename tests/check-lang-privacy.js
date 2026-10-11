// Coerenza lingua/metadata, privacy e disclaimer. Uso: node tests/check-lang-privacy.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
let fail = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fail++; };
const rd = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const dec = s => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
const idx = rd("index.html");
const attr = re => { const m = idx.match(re); return m ? dec(m[1]) : null; };

// --- i18n in sandbox con DOM minimo ---
const meta = { content: "", setAttribute(k, v) { this.content = v; } };
const ctx = { console, navigator: { language: "it" }, localStorage: { getItem: () => null, setItem() {} },
  document: { documentElement: { lang: "" }, title: "", querySelectorAll: () => [], querySelector: s => (s === 'meta[name="description"]' ? meta : null) } };
vm.createContext(ctx);
vm.runInContext(rd("js/config.js") + "\n" + rd("js/i18n.js") + "\n;this.T=translations;this.setLanguage=setLanguage;this.applyTranslations=applyTranslations;this.I=I18N_KEY;", ctx);
const T = ctx.T;

// 1. lingua dichiarata vs metadata statici (lingua predefinita = it)
const htmlLang = (idx.match(/<html lang="([a-z-]+)"/) || [])[1];
ok(htmlLang === "it", "index.html: <html lang> = it (lingua predefinita dell'app, invariata)");
const title = attr(/<title>([^<]+)<\/title>/), desc = attr(/<meta name="description" content="([^"]+)"/);
ok(title === T.it.metaTitle, "title statico = metaTitle IT");
ok(desc === T.it.metaDescription, "description statica = metaDescription IT");
ok(attr(/property="og:title" content="([^"]+)"/) === title && attr(/name="twitter:title" content="([^"]+)"/) === title, "og:title e twitter:title = title");
ok(attr(/property="og:description" content="([^"]+)"/) === desc && attr(/name="twitter:description" content="([^"]+)"/) === desc, "og:description e twitter:description = description");
ok(/og:locale" content="it_IT"/.test(idx) && /og:locale:alternate" content="en_US"/.test(idx), "og:locale it_IT con alternate en_US");
const ld = [...idx.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
const nodes = ld.flatMap(j => j["@graph"] || [j]);
ok(nodes.filter(n => n.description).every(n => n.description === desc), "JSON-LD: description = description statica (" + nodes.filter(n => n.description).length + " nodi)");
ok(nodes.every(n => !n.inLanguage || (n.inLanguage.includes("it") && n.inLanguage.includes("en"))), "JSON-LD: inLanguage it+en (selettore IT/EN mantenuto)");
ok(/<p class="about-positioning" lang="en"/.test(idx), "motto inglese di posizionamento marcato lang=en dentro pagina it");
ok(/data-i18n="lastUpdateDate">([^<]+)</.test(idx) && idx.match(/data-i18n="lastUpdateDate">([^<]+)</)[1] === T.it.lastUpdateDate, "data ultimo aggiornamento tradotta (fallback statico = IT)");

// 2. cambio lingua: title/description/lang seguono
for (const L of ["it", "en"]) {
  ok(typeof T[L].metaTitle === "string" && T[L].metaTitle.length >= 20 && T[L].metaTitle.length <= 70, L + ": metaTitle 20-70 caratteri (" + T[L].metaTitle.length + ")");
  ok(typeof T[L].metaDescription === "string" && T[L].metaDescription.length >= 70 && T[L].metaDescription.length <= 160, L + ": metaDescription 70-160 caratteri (" + T[L].metaDescription.length + ")");
  ctx.setLanguage(L);
  ok(ctx.document.title === T[L].metaTitle && meta.content === T[L].metaDescription && ctx.document.documentElement.lang === L, "setLanguage('" + L + "'): title, description e <html lang> allineati");
}
ok(Object.keys(T.it).length === Object.keys(T.en).length, "chiavi i18n IT=" + Object.keys(T.it).length + " EN=" + Object.keys(T.en).length + " (stesso numero)");

// 3. pagine informative: lingua it, nessuna etichetta inglese
const pages = ["about", "privacy", "guides", "guides/come-usare-ae-companion", "guides/calcolo-rendita", "guides/boost-e-punto-morto"];
for (const p of pages) { const s = rd(p + "/index.html"); ok(/<html lang="it">/.test(s) && /og:locale" content="it_IT"/.test(s), p + ": lang=it e og:locale=it_IT"); }
const g3 = rd("guides/boost-e-punto-morto/index.html");
ok(!/🇮🇹 Italy|United States|Germany/.test(g3) && /Stati Uniti/.test(g3), "guida boost: etichette Paese in italiano");

// 4. privacy vs comportamento reale
const pv = rd("privacy/index.html");
const keys = [...["config", "i18n", "countries", "install-banner", "navigation", "storage"].map(f => rd("js/" + f + ".js")).join("\n").matchAll(/(?:I18N_KEY|COUNTRY_KEY|INSTALL_DISMISS_KEY|TAB_KEY|STORAGE_KEY)\s*=\s*"([^"]+)"/g)].map(m => m[1]);
ok(keys.length === 5 && keys.every(k => pv.includes(k)), "privacy elenca tutte le chiavi localStorage presenti nel codice: " + keys.join(", "));
const usesCookie = /document\.cookie/.test(fs.readdirSync(path.join(ROOT, "js")).map(f => rd("js/" + f)).join("\n"));
ok(!usesCookie, "il codice non usa document.cookie (coerente con 'nessun cookie propri')");
const hosts = [...idx.matchAll(/(?:src|href)="((?:https?:)?\/\/[^"]+)"/g)].map(m => m[1]);
const need = { "fonts.googleapis.com": "Google Fonts", "fonts.gstatic.com": "Google Fonts", "gc.zgo.at": "GoatCounter", "instagram.com": "Instagram", "buymeacoffee.com": "Buy Me a Coffee" };
for (const [h, name] of Object.entries(need)) if (hosts.some(x => x.includes(h)) || /goatcounter/.test(idx)) ok(pv.includes(name), "privacy cita " + name + " (host " + h + ")");
ok(/<script[^>]*(goatcounter|gc\.zgo\.at)/.test(idx) && pages.every(p => !/<script[^>]*(goatcounter|gc\.zgo\.at)/.test(rd(p + "/index.html"))), "GoatCounter caricato solo da index.html, non dalle pagine informative (come descritto in privacy)");
ok(/GitHub Pages/.test(pv) && /Non è una consulenza legale/.test(pv), "privacy cita GitHub Pages e precisa che non è consulenza legale");
ok(!/conforme|GDPR|CCPA|garantiamo/i.test(pv), "privacy: nessuna dichiarazione di conformità/garanzia legale");
ok(/non mostra pubblicità/.test(pv) && !/adsbygoogle|googlesyndication/.test(idx), "privacy: nessuna pubblicità, coerente con index.html");

// 5. disclaimer di indipendenza
for (const L of ["it", "en"]) ok(/Atlas Reality/.test(T[L].aboutDisclaimer) && /Atlas Earth/.test(T[L].aboutDisclaimer), L + ": disclaimer in app cita Atlas Reality e Atlas Earth");
for (const p of pages) ok(/non affiliato, sponsorizzato né approvato da Atlas Reality o Atlas Earth/.test(rd(p + "/index.html")), p + ": disclaimer indipendenza nel footer");

console.log(fail ? "\nFALLITI: " + fail : "\nTutti i controlli superati"); process.exit(fail ? 1 : 0);
