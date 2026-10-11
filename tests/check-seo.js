// Controlli statici SEO/pubblicazione. Uso: node tests/check-seo.js
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), BASE = "https://alex4ndrus94.github.io/-ae-companion/";
let fail = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fail++; };
const htmlFiles = []; (function walk(d) { for (const f of fs.readdirSync(d)) { if (["node_modules", ".git", "tests", "tools"].includes(f)) continue; const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") && htmlFiles.push(p); } })(ROOT);
const urlOf = f => { const r = path.relative(ROOT, f).split(path.sep).join("/"); return r === "index.html" ? BASE : r.endsWith("/index.html") || r.endsWith("index.html") ? BASE + r.replace(/index\.html$/, "") : BASE + r; };
const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
ok(/^<\?xml/.test(sitemap) && sitemap.includes("</urlset>"), "sitemap.xml ben formata (struttura base)");
ok(new Set(locs).size === locs.length, "sitemap senza duplicati");
const indexable = [];
for (const f of htmlFiles) {
  const s = fs.readFileSync(f, "utf8"), rel = path.relative(ROOT, f), u = urlOf(f);
  if (/noindex/.test(s)) { ok(!locs.includes(u), rel + ": noindex e fuori sitemap"); continue; }
  indexable.push(u);
  ok(/<title>[^<]{10,}<\/title>/.test(s), rel + ": title");
  ok(/<meta name="description" content="[^"]{50,}"/.test(s), rel + ": description");
  const can = (s.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  ok(can === u, rel + ": canonical = " + u + (can === u ? "" : " (trovato " + can + ")"));
  ok((s.match(/<h1[ >]/g) || []).length === 1, rel + ": un solo H1");
  ok(locs.includes(u), rel + ": presente in sitemap");
  for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); ok(true, rel + ": JSON-LD valido"); } catch (e) { ok(false, rel + ": JSON-LD non valido"); } }
  // link e asset relativi/assoluti interni
  for (const m of s.matchAll(/(?:href|src)="([^"#?]+)"/g)) {
    let h = m[1]; if (/^(https?:)?\/\//.test(h) && !h.startsWith(BASE)) continue; if (/^(mailto:|data:)/.test(h)) continue;
    let target = h.startsWith(BASE) ? path.join(ROOT, h.slice(BASE.length)) : h.startsWith("/-ae-companion/") ? path.join(ROOT, h.slice(15)) : path.resolve(path.dirname(f), h);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
    if (!fs.existsSync(target)) ok(false, rel + ": risorsa mancante -> " + h);
  }
}
for (const l of locs) ok(indexable.includes(l), "sitemap: " + l + " esiste ed e' indicizzabile");
ok(/Sitemap: https:\/\/alex4ndrus94\.github\.io\/-ae-companion\/sitemap\.xml/.test(fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8")), "robots.txt punta alla sitemap");
ok(!/Disallow:\s*\S/.test(fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8")), "robots.txt senza Disallow");
// i18n: chiavi usate in index.html presenti in IT e EN
const i18n = fs.readFileSync(path.join(ROOT, "js/i18n.js"), "utf8"), idx = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const keys = new Set([...idx.matchAll(/data-i18n(?:-placeholder)?="([^"]+)"/g)].map(m => m[1]));
const half = i18n.indexOf("en: {") > 0 ? i18n.indexOf("\n    en: {") : -1;
for (const k of keys) { const n = (i18n.match(new RegExp("\\b" + k + ":", "g")) || []).length; if (n < 2) ok(false, "i18n: chiave mancante in una lingua -> " + k); }
ok(true, "i18n: " + keys.size + " chiavi data-i18n verificate");
console.log(fail ? "\nFALLITI: " + fail : "\nTutti i controlli superati"); process.exit(fail ? 1 : 0);
