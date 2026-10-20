// Test E: parser dell'assistente. Verifica il VALORE numerico interpretato, non solo l'assenza di errori.
const { load, runIn, suite } = require("./lib/sandbox");
const T = suite("parser");
const DATA = JSON.stringify({ profile: { name: "T" }, lands: { common: 40, rare: 20, epic: 10, legendary: 2 }, badges: 12,
    mayorTarget: 0, passes: { explorer: false, mission: false }, goal: { type: "income", incomeTargetUSD: 5, incomeTargetBoosted: true, landsTarget: 0 },
    settings: { dailyLoginAB: 50, abBalance: 340 } });
const h = load({ store: { aeLang: "en", aeCurrency: "USD", aePrefsMigration: "1", aeCompanionData: DATA, aeCountryGroup: "EU_WEST" } });
const q = s => JSON.parse(runIn(h, "JSON.stringify(extractAssistantQuantities(normalizeText(" + JSON.stringify(s) + ")))"));
const tok = s => JSON.parse(runIn(h, "JSON.stringify(parseCountToken(" + JSON.stringify(s) + "))"));

console.log("== Token numerici");
T.eq([tok("1.014").status, tok("1.014").value], ["ok", 1014], "'1.014' = 1014 (non 14)");
T.eq([tok("1,014").status, tok("1,014").value], ["ok", 1014], "'1,014' = 1014");
T.eq([tok("101").status, tok("101").value], ["ok", 101], "'101' = 101");
T.eq([tok("1000").status, tok("1000").value], ["ok", 1000], "'1000' = 1000");
T.eq(tok("1.014.000").value, 1014000 > 1000000 ? null : 1014000, "'1.014.000' oltre il massimo ammesso -> non valido");
T.eq(tok("12.345").value, 12345, "'12.345' = 12345");
T.eq(tok("1.014,00").value, 1014, "'1.014,00' = 1014");
T.eq(tok("1,014.00").value, 1014, "'1,014.00' = 1014");
T.eq(tok("100.00").value, 100, "'100.00' = 100");
T.eq(tok("2.500.000").status, "invalid", "'2.500.000' > massimo: non valido");
T.eq(tok("1.5").status, "invalid", "'1.5' non e' un conteggio intero: non valido");
T.eq(tok("1,25").status, "invalid", "'1,25' non valido");
T.eq(tok("1.01.4").status, "invalid", "'1.01.4' separatori incoerenti: non valido");
T.eq([tok("0.500").status, tok("0.500").value], ["ambiguous", 500], "'0.500' ambiguo: si chiede conferma (candidato 500)");
T.eq(tok("-5").status, "invalid", "'-5' negativo: non valido");
T.eq(tok("1234.567").status, "invalid", "'1234.567' non valido");

console.log("\n== Frasi complete");
T.eq(q("I want 1.014 terreni").lands.value, 1014, "'1.014 terreni' -> 1014 terreni");
T.eq(q("What if I had 1,014 lands?").lands.value, 1014, "'1,014 lands' -> 1014 lands");
T.eq(q("e se avessi 101 badge?").badges.value, 101, "'101 badge' -> 101");
T.eq(q("quanto rendo con 1000 terreni").lands.value, 1000, "'1000 terreni' -> 1000");
const both = q("con 1.014 terreni e 101 badge quanto guadagno?");
T.eq([both.lands.value, both.badges.value], [1014, 101], "terreni e badge insieme: 1014 e 101");
const both2 = q("101 badge and 1,014 lands");
T.eq([both2.lands.value, both2.badges.value], [1014, 101], "ordine invertito: stessi valori");
T.eq(q("ciao come stai"), null, "nessun numero: nessuna intenzione what-if");
T.eq(q("ho -5 badge").badges.status, "invalid", "'-5 badge' negativo: non valido (prima diventava 5)");
T.eq(q("0.500 terreni").lands.status, "ambiguous", "'0.500 terreni' ambiguo");

console.log("\n== Risposte dell'assistente (valori nel testo)");
const reply = s => runIn(h, "getAssistantReply(" + JSON.stringify(s) + ")");
T.ok(reply("1.014 terreni").indexOf("1014 lands") !== -1, "risposta per '1.014 terreni' cita 1014 (non 14)");
T.ok(reply("1.014 terreni").indexOf("x2") !== -1, "1014 terreni: boost EU_WEST x2 (oltre 400 terreni)");
T.ok(reply("101 badge").indexOf("101 badges") !== -1 && reply("101 badge").indexOf("+25%") !== -1, "101 badge: bonus +25% come nella tabella del progetto");
const b = reply("1.014 terreni e 101 badge");
T.ok(b.indexOf("1014 lands") !== -1 && b.indexOf("101 badges") !== -1 && b.indexOf("x2") !== -1, "richiesta combinata: cita 1014 terreni e 101 badge");
T.ok(reply("0.500 terreni").indexOf("500") !== -1 && reply("0.500 terreni").indexOf("ambiguous") !== -1, "input ambiguo: chiede conferma invece di scegliere");
T.ok(reply("-5 badge").indexOf("can't use that number") !== -1, "numero negativo: messaggio di errore");
T.ok(reply("1.5 terreni").indexOf("can't use that number") !== -1, "numero non intero: messaggio di errore");
// confronto numerico: la risposta combinata deve coincidere col calcolo diretto
const direct = runIn(h, "formatCurrency(convertToDisplay(computeLandsWhatIf(1014, 101)))");
T.ok(b.indexOf(direct) !== -1, "il valore economico nella risposta combinata coincide con computeLandsWhatIf(1014, 101): " + direct);
const lOnly = runIn(h, "formatCurrency(convertToDisplay(computeLandsWhatIf(300)))");
T.ok(reply("300 terreni").indexOf(lOnly) !== -1, "solo terreni: stesso calcolo di v0.8.1 (computeLandsWhatIf senza badge override)");
T.done();
