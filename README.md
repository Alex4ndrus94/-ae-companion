# AE Companion

> Track. Plan. Conquer. — strumento web gratuito e indipendente per giocatori di Atlas Earth.

## Stato attuale (v0.9.5 — Fase 1.5: correzione mirata della formattazione monetaria)

Novità v0.9.5: la funzione monetaria condivisa (`js/money.js`, usata da dashboard, SRB, strategia, assistente, consigli e card di condivisione) raggruppa le migliaia anche a 4 cifre (it-IT prima mostrava «1234,56 €» ma «12.345,67 €»; ora «1.234,56 €»). Simbolo/codice e posizione della valuta restano quelli di `Intl.NumberFormat` (IT: «1.234,56 €» / «1.234,56 USD»; EN: «€1,234.56» / «$1,234.56»). Lingua e valuta restano indipendenti. Nessun valore numerico, formula (`income.js`), conversione EUR/USD, routing SRB, tabella regionale, profilo, preferenza o chiave localStorage è stato modificato. Vedi `docs/14-REPORT-FASE1.5-v0.9.5.md`. Test: `node tests/run-all.js <cartella-v0.9.4> --srb-text=same`. Versione in attesa di revisione indipendente.

## Versione precedente (v0.9.4 — Fase 1.4: correzioni mirate e verifica finale)

Novità v0.9.4: il riconoscimento SRB è solo **esplicito** (SRB, Super Rent Boost, super potenziamento, super boost, ×50). «Evento» + guadagno/boost senza nome SRB è ambiguo: l'assistente chiede un chiarimento senza importi. Le domande su AB/Airbucks legate a evento o SRB non producono mai una stima di rendita. Le ipotesi sulla distribuzione delle rarità nei profili ipotetici sono dichiarate come ipotesi del modello. Formula SRB (`income.js`), `config.js`, tabelle regionali e profilo invariati. Vedi `docs/13-REPORT-FASE1.4-v0.9.4.md`. Test: `node tests/run-all.js <cartella-v0.9.3> --srb-text=same`.

## Versione precedente (v0.9.3 — Fase 1.3: routing SRB e verifica pre-release)

Novità v0.9.3: le domande SRB esplicite («…con 200.000 terreni durante l'SRB») usano sempre il calcolo SRB dedicato (`income.js`), su una copia ipotetica che non modifica mai il profilo salvato; se mancano dati essenziali l'assistente chiede un chiarimento. Formule, tabelle regionali e profilo invariati. Vedi `docs/12-REPORT-FASE1.3-v0.9.3.md`. Test: `node tests/run-all.js <cartella-v0.9.2> --srb-text=same`.

## Versione precedente (v0.9.2 — Fase 1.2: trasparenza SRB)

Novità v0.9.2: oltre 150.000 terreni la stima SRB mostra anche l'intervallo teorico (da `getSRBDailyBoundsUSD`), l'assistente riconosce le domande SRB prima dei gestori generici, nessuna frequenza mensile presentata come regola. Formule invariate. Vedi `docs/11-REPORT-FASE1.2-v0.9.2.md`.

## Versione precedente (v0.9.1 — Fase 1.1: correzione SRB)

Novità v0.9.1: la stima Super Rent Boost applica il ×50 ai primi 150.000 terreni e il boost ordinario ai terreni oltre il limite; avvertenza sulle stime con boost attivo 24 h; etichetta conversione AB corretta (25 AB per 1 $ di rendita). Vedi `docs/10-REPORT-FASE1.1-v0.9.1.md`. Test: `node tests/run-all.js <cartella-v0.9.0>`.

## Stato precedente (v0.9.0 — Fase 1 migrazione internazionale)

Novità v0.9.0: lingua e valuta indipendenti (`js/prefs.js`, `js/money.js`), cluster con conferma, parser assistente corretto, ipotesi SRB esplicite. Vedi `docs/07-AUDIT-FONTI.md`, `docs/08-ARCHITETTURA-SEO-INTERNAZIONALE.md`, `docs/09-REPORT-FASE1-v0.9.0.md`. Test: `node tests/run-all.js <cartella-v0.8.1>`.

## Stato precedente (v0.8.1)

Funzioni realmente presenti: rendita giornaliera/mensile/annuale con e senza boost, terreni per rarità, badge con bonus passaporto, fasce di boost per gruppo di Paesi con avviso "zona morta", obiettivo (efficienza, rendita, terreni, Mayor) con Strategia dinamica, Assistente, Explorer Club (ladder e Day), flag Mission Pass, consigli Extra AB, card di condivisione, interfaccia IT/EN, salvataggio locale (localStorage).

HTML, CSS e JavaScript vanilla, nessun build e nessun framework. Hosting: GitHub Pages. Statistiche: GoatCounter (solo pagina dell'app). Non è affiliato né approvato da Atlas Reality / Atlas Earth.

Le sezioni "Main Features", "Roadmap" e "Technology Stack" più sotto sono il **piano originale** del progetto: grafici, storico, Mayor Tracker con date, analisi ROI dei pass e Chart.js **non sono implementati**.

Verifiche automatiche (Node): `node tests/check-seo.js`, `node tests/check-lang-privacy.js`, `node tests/regression-compare.js <cartella-vecchia> <cartella-nuova>`.

---

**Powered by Alessandro Chindemi**

---

## 🚀 Overview

AE Companion is a modern web application designed to help Atlas Earth players manage, analyze, and optimize their progress.

Unlike traditional spreadsheets or calculators, AE Companion combines real-time statistics, progression tracking, investment analysis, and intelligent recommendations into a single dashboard optimized for mobile and desktop.

The project follows a **mobile-first philosophy**, providing a fast, clean, and intuitive experience that feels like a native application.

---

# ✨ Vision

Our goal is simple:

> Build the most complete Atlas Earth companion available.

AE Companion is designed to become the ultimate control center for every serious Atlas Earth player.

---

# 🎯 Main Features

## 🏠 Dashboard

- Lifetime Rent
- Daily / Monthly / Yearly Income
- Current Boost
- Parcel Statistics
- Passport Bonus
- Atlas Bucks
- Progress Overview

---

## 🌍 Parcel Manager

Track your entire portfolio.

- Common
- Rare
- Epic
- Legendary

Automatic calculations and percentages included.

---

## 👑 Mayor Tracker

Monitor the race for Mayor.

Features:

- Distance from current Mayor
- Growth comparison
- Estimated takeover date
- Historical evolution

---

## 📈 Progress Analytics

Interactive charts showing:

- Parcel Growth
- Income Growth
- Badge Progress
- Atlas Bucks
- Mayor Race

---

## ⚡ Boost Advisor

Automatically detects your current boost tier and suggests whether to:

- Keep saving
- Buy parcels
- Perform a Tier Jump

---

## 🎟 Mission Pass Analyzer

Evaluate whether purchasing the Mission Pass is worth it based on:

- Progress
- Rewards
- ROI

---

## 💎 Explorer Club Analyzer

Track:

- Daily Rewards
- Monthly Value
- Cost per Atlas Buck
- Cost per Parcel
- ROI

---

## 🧠 AI Advisor (Planned)

An intelligent recommendation system capable of suggesting:

- When to buy parcels
- When to wait
- Whether to purchase badges
- Whether Explorer Club is profitable
- Mayor takeover strategy

---

# 📱 Mobile First

AE Companion is designed primarily for smartphones.

The desktop experience is an extension of the mobile version.

---

# 🌐 Future PWA

The application will become a Progressive Web App.

Benefits:

- Installable on iPhone & Android
- Offline support
- Fast loading
- Native app experience

---

# 🛣 Roadmap

## Version 0.1

- Project foundation
- Branding
- Dashboard UI
- Repository structure

---

## Version 0.2

- Functional Dashboard
- Parcel Statistics
- Passport Tracker

---

## Version 0.3

- Charts
- Historical Data
- Settings

---

## Version 0.4

- Mayor Tracker
- Progress Predictions

---

## Version 0.5

- Boost Simulator
- Tier Jump Advisor

---

## Version 0.6

- Mission Pass Analyzer
- Explorer Club Analyzer

---

## Version 1.0

First Public Release

---

# 🎨 Design Philosophy

Minimal.

Elegant.

Fast.

Data-driven.

No unnecessary elements.

Everything visible has a purpose.

---

# 🛠 Technology Stack

Frontend

- HTML5
- CSS3
- JavaScript

Charts

- Chart.js

Hosting

- GitHub Pages
- Cloudflare Pages

Future

- Progressive Web App (PWA)

---

# ❤️ Created by

**Alessandro Chindemi**

Designed and developed with ChatGPT.

---

# 📄 License

This project is currently private.

All rights reserved.

© 2026 Alessandro Chindemi

## Explorer Club (v0.6)

- `js/explorer.js` — logica: reward table unica (`EXPLORER_REWARD_TABLE`), Day calcolato dalla data
  (giorni di calendario, sicuro con ora legale), stato teorico vs confermato, proiezione sulla ladder.
- `js/explorer-ui.js` — card nella tab Strategia e pannelli (correzione streak, date, saldo AB).
- La Strategia legge gli AB/day da `getEffectiveDailyAB()` / `getExplorerDaysForAB()`.


## SEO, pagine informative e test (v0.8)

- `about/`, `privacy/`, `guides/` — pagine statiche generate da `tools/build-pages.js` (tabelle lette da `js/config.js` e `js/countries.js`).
- `sitemap.xml`, `robots.txt`, `404.html`, `assets/og-image.png`.
- `node tests/check-seo.js` — controlli statici (title, canonical, sitemap, JSON-LD, link).
- `docs/` — report, guida di pubblicazione, Search Console, piani.
- `node tests/check-lang-privacy.js` — coerenza lingua/metadata, privacy e disclaimer (v0.8.1).
- Lingua: HTML iniziale e metadata sono in italiano (lingua predefinita); cambiando lingua con IT/EN, `applyTranslations()` aggiorna anche title, meta description e `<html lang>`.
