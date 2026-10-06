// ======================================
// AE Companion - Internazionalizzazione
// ======================================

const I18N_KEY = "aeLang";

const translations = {

    it: {

        appName: "AE Companion",
        tagline: "Track • Plan • Conquer",

        lands: "Terreni",
        income: "Rendita",
        today: "OGGI",
        month: "MESE",
        year: "ANNO",

        boostActive: "Boost attivo x{mult} (+{percent}%)",
        boostCompare: "Senza boost guadagneresti {base}/giorno anziché {boosted}",

        strategy: "Strategia",
        landsLabel: "Terreni",
        costLabel: "Costo",
        abPerDay: "AB/giorno",
        timeLabel: "Tempo",
        nextGoal: "Prossimo obiettivo",

        progressText: "{total} / {next} terreni • Ne manca {remaining}",
        progressTextLast: "{total} terreni • Ultimo breakpoint",

        day: "giorno",
        days: "giorni",

        tips: "Consigli",
        tipNoData: "Inserisci i tuoi terreni dal pannello Modifica dati per ricevere consigli personalizzati.",
        tipAccumulate: "Al momento acquistare terreni o badge non aumenterebbe la tua rendita in modo significativo: conviene accumulare AB prima di spendere.",
        tipRecommendLand: "Conviene puntare sui terreni: ogni {abCost} AB investiti ti danno circa {gainFormatted} di rendita giornaliera in più — al momento è l'opzione più efficiente rispetto ai badge. Puoi permettertelo: {timeText}.",
        tipRecommendBadge: "Conviene puntare sul passaporto: con {abNeeded} AB raggiungi la soglia dei badge che sblocca il bonus +{percent}%, circa {gainFormatted} di rendita giornaliera in più — più efficiente dei terreni in questo momento. Puoi permettertelo: {timeText}.",
        tipGoalIncomeReached: "Hai già raggiunto il tuo obiettivo di rendita ({targetFormatted}/giorno)! Puoi impostarne uno più ambizioso dal pannello Modifica dati.",
        tipGoalIncomeGap: "Per arrivare a {targetFormatted}/giorno di rendita ti mancano circa {gapFormatted}/giorno. Al ritmo più efficiente attuale servono circa {abNeeded} AB (~{daysText}).",
        tipGoalLandsReached: "Hai già raggiunto il tuo obiettivo di {target} terreni! Impostane uno nuovo dal pannello Modifica dati per continuare a monitorare i progressi.",
        tipGoalLandsGap: "Per arrivare a {target} terreni ti mancano {remaining} terreni (~{abNeeded} AB): circa {daysText} al tuo ritmo attuale.",
        tipBoostUrgent: "Attenzione: ti mancano solo {remaining} terreni prima che il tuo boost scenda da x{current} a x{next}. Puoi permetterteli: {timeText} — comprali appena possibile per restare più a lungo nella fascia ad alto rendimento.",
        tipDeadZoneWarning: "Attenzione, zona morta: superando i {cap} terreni il boost scende da x{current} a x{next}, e la tua rendita scenderebbe temporaneamente. Conviene fermarsi a {cap} e accumulare AB per saltare direttamente a {recoveryLands} terreni in un colpo solo, dove la rendita torna a superare quella attuale. Puoi arrivarci: {timeText}.",
        breakpointWarningInline: "Superati i {cap} terreni il boost scende a x{next} (ora x{current}): conviene fermarsi qui e saltare direttamente a {recoveryLands} terreni per non perdere rendita.",
        tipBoostRelaxed: "Hai ancora {remaining} terreni di margine prima che il boost scenda a x{next}: nessuna fretta, puoi accumulare AB con calma.",
        tipLastBreakpoint: "Hai raggiunto l'ultimo breakpoint disponibile: il tuo boost è ormai fisso, indipendentemente da quanti terreni comprerai ancora.",
        tipRarity: "La rarità di ogni terreno che acquisti è assegnata casualmente: hai circa il {legendaryOdds}% di probabilità di ottenere un Legendary, che rende {mult}x un Common allo stesso costo ({cost} AB). Non puoi scegliere la rarità, ma più terreni compri, più occasioni hai di ottenerne uno di pregio.",
        tipMayorStrategy: "Diventare mayor richiede più terreni di chiunque altro in quella specifica città: prima di accumulare terreni ovunque, valuta se conviene concentrarti su una città con pochi giocatori attivi, dove superare l'attuale mayor costa meno.",
        badgeBonusInfo: "Bonus passaporto: +{percent}% ({badges} badge)",
        perSecondIncome: "Rendita al secondo: {value}",

        assistantGreeting: "Ciao! Chiedimi qualcosa sulla tua situazione — es. \"cosa conviene comprare?\", \"quanto manca al mio obiettivo?\", \"quanti badge mi mancano?\".",
        assistantHelp: "Posso rispondere su: soglie boost, cosa conviene comprare ora, il tuo obiettivo, quanto guadagni, il mayor, i badge mancanti, il Super Potenziamento, il tuo saldo AB, i tuoi terreni, e come guadagnare più AB. Prova a chiedermelo con parole tue!",
        assistantIncomeSummary: "In questo momento guadagni circa {daily} al giorno, {monthly} al mese, {yearly} all'anno (con boost incluso).",
        tipBadgeMaxAssistant: "Hai già il bonus passaporto massimo (+{percent}%): il tuo numero di badge è già ottimale.",
        assistantBadgeProgress: "Ti mancano {remaining} badge per salire dal bonus +{current}% al +{percent}%: ogni badge in più aumenta la tua rendita in modo permanente.",
        assistantSRB: "Se riesci a tenere attivo il Super Potenziamento (x50) per un giorno intero, la tua rendita salirebbe indicativamente a circa {value} al giorno — vale solo durante l'evento (~2,5 giorni al mese).",
        assistantABBalance: "Hai {balance} AB disponibili al momento (il gruzzolo che hai inserito nel pannello ✏️).",
        assistantLandsBreakdown: "Possiedi {total} terreni in totale: {common} Common, {rare} Rare, {epic} Epic, {legendary} Legendary.",
        assistantABSources: "Le fonti principali di AB extra sono: Arcade, i mini-giochi (Golf, Warship, Bowling, Racer, Fishing), la conversione dell'affitto, i sondaggi, e il Super Potenziamento durante gli eventi. Trovi tutti i dettagli nella card \"Come guadagnare più AB\".",
        assistantWhatIfBadge: "Con {badges} badge (stessi terreni di ora) il bonus passaporto salirebbe a +{percent}%: la rendita diventerebbe circa {daily}/giorno, {monthly}/mese, {yearly}/anno (con boost incluso) — oggi sei a {currentDaily}/giorno.",
        assistantWhatIfLands: "Con {lands} terreni il boost sarebbe x{boost} e la rendita salirebbe a circa {daily}/giorno — oggi sei a {currentDaily}/giorno. È una stima: la rarità dei terreni non ancora posseduti è assegnata a caso.",
        assistantFallback: "Non sono sicuro di aver capito. Prova a chiedermi ad esempio: \"cosa conviene comprare?\", \"quanto manca al mio obiettivo?\", \"quanto guadagno?\", o scrivi \"aiuto\" per la lista completa.",
        assistantTitle: "Assistente",
        assistantDisclaimer: "Riconosce il tipo di domanda e risponde con calcoli reali sui tuoi dati — non è un'AI generica.",
        assistantPlaceholder: "Scrivi una domanda...",
        suggestionBuy: "Cosa conviene comprare?",
        suggestionGoal: "Quanto manca al mio obiettivo?",
        suggestionIncome: "Quanto guadagno?",
        send: "Invia",
        srbBoxTitle: "Con il Super Potenziamento attivo (x50)",
        srbBoxNote: "Stima supplementare, non inclusa nella rendita ufficiale sopra: attiva solo durante l'evento (~2,5 giorni/mese) e per la durata in cui riesci a mantenerlo attivo.",

        settingsTitleEdit: "Modifica dati",
        settingsTitleOnboarding: "Benvenuto!",
        settingsIntro: "Inserisci il tuo nome e i tuoi dati di partenza. Resteranno salvati su questo dispositivo.",
        nameLabel: "Nome",
        countryLabel: "Paese",
        sectionLands: "Terreni",
        sectionGoal: "Il tuo obiettivo",
        goalEfficiency: "Massimizzare l'efficienza generale",
        goalIncome: "Raggiungere una rendita specifica",
        goalLands: "Raggiungere un numero di terreni",
        goalMayor: "Diventare mayor di una città",
        goalIncomeTargetLabel: "Rendita giornaliera obiettivo",
        goalIncomeBoostedLabel: "Includi il boost pubblicità nel calcolo",
        goalLandsTargetLabel: "Numero di terreni obiettivo",
        sectionOther: "Altri dati",
        badgeLabel: "Badge",
        mayorTargetLabel: "Obiettivo Mayor",
        dailyABLabel: "AB guadagnati al giorno",
        abBalanceLabel: "AB disponibili ora (gruzzolo)",
        abAvailableNow: "puoi farlo subito con gli AB che hai già da parte",
        sectionPasses: "I tuoi pass attivi",
        passBadgeExplorerAlt: "Pass Esploratore attivo",
        passBadgeMissionAlt: "Mission Pass attivo",
        explorerPassLabel: "Pass Esploratore (Atlas Explorer Club)",
        missionPassLabel: "Mission Pass (sfide mensili)",
        tipExplorerPassSuggest: "Il Pass Esploratore (Atlas Explorer Club, ~{cost}/mese) aumenta indicativamente il ritmo giornaliero di AB e amplia il boost pubblicità: se vuoi accelerare molto, potrebbe valerne la pena — ma è una spesa reale, valutala in base al tuo budget.",
        tipMissionPassSuggest: "Il Mission Pass (~{cost}/mese) sblocca ricompense premium extra nelle sfide mensili (AB, diamanti, upgrade terreno Legendary): utile se completi già le sfide gratuite regolarmente.",
        tipPassesActive: "Hai già attivo il Pass Esploratore e/o il Mission Pass: ricordati che sono spese ricorrenti reali, tienile in conto nel valutare la convenienza dei tuoi investimenti in gioco.",
        cancel: "Annulla",
        save: "Salva",

        installIOS: "Aggiungi AE Companion alla Home: tocca Condividi (□↑) e poi \"Aggiungi a Home\"",
        installAndroid: "Installa AE Companion sul tuo dispositivo per un accesso più rapido",
        installAction: "Installa",

        abTipsTitle: "Come guadagnare più AB",
        abTipsDisclaimer: "Valori indicativi basati sull'esperienza della community, non dati ufficiali: possono variare.",
        abTipArcade: "Arcade: da 1 a 340 AB a partita, in base al livello e al gioco proposto. Se disponibile, la missione Arcade dà anche punti premio su una scala che va da 5-60 AB (gratis) a 25-260 AB (con Mission Pass).",
        abTipMinigames: "Mini-giochi disponibili: Atlas Golf, Atlas Warship, Atlas Bowling, Atlas Racer, Atlas Fishing — altra fonte di AB oltre all'Arcade.",
        abTipRentConversion: "Bonus conversione affitto: circa 33 AB per ogni € convertito dall'affitto.",
        abTipSurveyBoost: "Potenziamento sondaggi: aumenta gli AB guadagnati completando i sondaggi nella sezione Guadagna.",
        abTipSuperRentBoost: "Super Potenziamento Affitto (SRB): durante l'evento (circa 2,5 giorni al mese) l'affitto si accumula fino a 50x più veloce — pianifica gli acquisti di terreni prima di questo evento per sfruttarlo al massimo.",

        createdBy: "Creato da",
        igCta: "Richieste o consigli? Scrivimi su Instagram",
        coffeeCta: "Ti è utile? Offrimi un caffè",
        lastUpdate: "Ultimo aggiornamento",
        withoutBoost: "senza boost",
        navHome: "Home",
        navStrategy: "Strategia",
        navTips: "Extra AB",
        shareCardCta: "Traccia anche tu i tuoi progressi su Atlas Earth",
        shareCardFooter: "Gratis · Nessuna registrazione",
        shareCardShareText: "Le mie statistiche su Atlas Earth, tracciate con AE Companion!",
        shareCardFeatureAssistant: "Assistente strategico con calcoli reali",
        shareCardFeatureStrategy: "Consigli personalizzati sui tuoi dati",
        shareCardFeatureCommunity: "Tips AB dalla community, sempre aggiornati",

        featureAssistantTitle: "Assistente",
        featureAssistantSub: "Calcoli reali",
        featureAdviceTitle: "Consigli",
        featureAdviceSub: "Sui tuoi dati",
        featureTipsTitle: "Tips AB",
        featureTipsSub: "Sempre aggiornati",
        countryNoteTitle: "Calcoli basati sulle tabelle ufficiali Atlas Earth",
        countryNoteText: "Specifiche per ogni Paese: puoi cambiare il tuo da Modifica dati.",

        strategyEyebrowGoal: "Obiettivo",
        strategyGoalEfficiency: "Efficienza generale",
        strategyGoalIncome: "Rendita specifica",
        strategyGoalLands: "Numero di terreni",
        strategyGoalMayor: "Diventare Mayor",
        strategyDescEfficiency: "Confronto terreni, badge e soglie boost per indicarti la mossa più efficiente adesso.",
        strategyDescIncome: "Raggiungere {target} ({mode}).",
        strategyDescIncomeEmpty: "Nessuna rendita obiettivo impostata.",
        strategyDescLands: "Arrivare a {target} terreni.",
        strategyDescLandsEmpty: "Nessun numero di terreni obiettivo impostato.",
        strategyDescMayor: "Superare il riferimento Mayor di {ref} terreni.",
        strategyDescMayorEmpty: "Nessun riferimento Mayor impostato.",
        strategyModeBoosted: "con boost",
        strategyModePlain: "senza boost",
        strategyStatusActive: "In corso",
        strategyStatusReached: "Obiettivo raggiunto",
        strategyStatusReachedMayor: "Riferimento superato",
        strategyStatusMissing: "Dati mancanti",
        strategyActionTitle: "Azione consigliata",
        strategyNextStepTitle: "Prossimo passo",
        strategyEditData: "Modifica dati",
        strategyNow: "Subito",
        strategyPerDay: "/giorno",
        strategyPriorityLabel: "Priorità attuale",
        strategyPrioLands: "Terreni",
        strategyPrioBadges: "Badge",
        strategyPrioAccumulate: "Accumulo AB",
        strategyHeroEffSub: "Boost x{boost} • {lands} terreni • {badges} badge",
        strategyHeroIncomeLabel: "Rendita attuale",
        strategyHeroIncomeSub: "Obiettivo: {target} ({mode})",
        strategyHeroLandsLabel: "Terreni verso l'obiettivo",
        strategyHeroMayorSub: "Da superare: {ref} • ne servono {target}",
        strategyAbLine: "AB disponibili: {balance} • Guadagno: {daily} AB/giorno",

        // ----- Explorer Club -----
        explorerTitle: "Explorer Club",
        explorerStatusActive: "Attivo",
        explorerStatusNotStarted: "In partenza",
        explorerStatusExpired: "Scaduto",
        explorerStatusSetup: "Da configurare",
        explorerStart: "Inizio: {date}",
        explorerDayOf: "Day {day} / {total}",
        explorerDailyLogin: "Daily Login",
        explorerClubReward: "Explorer Club",
        explorerABPerDay: "AB/day automatici",
        explorerExtra: "Extra Explore",
        explorerExtraIncluded: "Incluso nel pass",
        explorerExtraNote: "Risorsa separata dagli AB: non entra nel calcolo AB/day.",
        explorerAllConfirmed: "Reward confermata",
        explorerConfirmedUpTo: "Confermato fino a Day {day}",
        explorerNoneConfirmed: "Nessuna reward confermata",
        explorerPendingOne: "1 reward da verificare",
        explorerPendingMany: "{count} reward da verificare",
        explorerConfirmOne: "Ho riscosso",
        explorerConfirmAll: "Ho riscosso tutte",
        explorerFix: "Correggi streak",
        explorerAddToBalance: "Aggiungi le reward confermate al saldo AB",
        explorerAddToBalanceHint: "Disattivalo se hai già aggiornato il saldo a mano.",
        explorerFeedbackAdded: "Confermate {days} reward: {ab} aggiunti al saldo AB.",
        explorerFeedbackNotAdded: "Confermate {days} reward ({ab}): saldo AB non modificato.",
        explorerFeedbackRolledBack: "Conferma corretta: AB riscossi aggiornati.",
        explorerNextMilestone: "Prossimo milestone: Day {day} tra {days} • {ab}",
        explorerMilestoneToday: "Oggi è un milestone: Day {day} • {ab}",
        explorerSetupTitle: "Imposta la data di inizio",
        explorerSetupText: "Inserisci il giorno in cui è partito il tuo Explorer Club: il Day e gli AB/day si calcolano da soli.",
        explorerSetupButton: "Imposta data",
        explorerNotStartedText: "Il pass inizia il {date} (tra {days}).",
        explorerExpiredText: "Il pass è scaduto il {date}: non vengono generate altre reward. Rinnovalo o disattivalo da Modifica dati.",
        explorerRenew: "Nuovo pass",
        explorerStartLabel: "Data di inizio (Day 1)",
        explorerEndLabel: "Scadenza pass (facoltativa)",
        explorerSheetStartTitle: "Date Explorer Club",
        explorerFixTitle: "Correggi streak",
        explorerFixIntro: "Per le regole di Atlas Earth, se salti un giorno la streak riparte da Day 1 e il giorno perso non si recupera.",
        explorerFixLastLabel: "Ultimo Day che hai riscosso",
        explorerFixApply: "Applica",
        explorerFixBroken: "Con questo valore la streak risulta interrotta: usa \"La streak è ripartita\" e indica la data di Day 1.",
        explorerFixRestartLabel: "La streak è ripartita da Day 1 il",
        explorerFixRestart: "Riparti da qui",
        explorerBalanceBtn: "Aggiorna saldo AB",
        explorerBalanceTitle: "Saldo AB",
        explorerBalanceHint: "Il saldo è quello reale nel gioco: puoi cambiarlo quando vuoi (minigiochi, missioni, Arcade e bonus non fanno parte degli AB/day).",
        explorerSettingsHint: "Con Explorer Club attivo gli AB/day arrivano dalla ladder: non serve inserirli.",
        explorerDateError: "Data non valida.",
        strategyAbLineExplorer: "AB disponibili: {balance} • AB/day automatici oggi: {daily}",
        strategyExplorerPending: "{count} reward non confermate: non sono incluse nella stima.",
        strategyExplorerVariable: "Minigiochi, missioni e Arcade non sono nella stima: contano quando aggiorni il saldo AB.",
        strategyExplorerExpired: "Pass Explorer scaduto: nessuna reward futura nella stima.",
        strategyExplorerNotStarted: "Explorer Club inizia il {date}: le reward entrano nella stima da quel giorno.",
        strategyMetricMilestone: "Prossimo traguardo",
        strategyMetricABNeeded: "AB necessari",
        strategyMetricABEstimate: "AB stimati",
        strategyMetricABAvailable: "AB disponibili",
        strategyMetricTime: "Tempo stimato",
        strategyMetricYieldLand: "Resa per terreno",
        strategyMetricYieldBadge: "Resa della soglia badge",
        strategyMetricRemaining: "Mancano",
        strategyMetricProgress: "Progresso",
        strategyMetricTarget: "Obiettivo",
        strategyMetricSurplus: "Margine",
        strategyMetricNextThreshold: "Prossima soglia",
        strategyMetricToBeat: "Da superare",
        strategyMetricLandsNow: "Terreni attuali",
        strategyMetricLandsEstimate: "Terreni stimati",
        strategyMetricNextStep: "Prossimo passo",
        strategyLastBreakpoint: "Nessuno: ultimo breakpoint (x{boost})",
        strategyThresholdValue: "{lands} terreni — x{boost}",
        strategyNoThreshold: "Nessuna soglia prima dell'obiettivo (boost x{boost})",
        strategyMilestoneBadgeValue: "{badges} badge (+{percent}%)",
        strategyMilestoneBadgeThenLands: "{badges} badge (+{percent}%) → {lands} terreni",
        strategyMilestoneLandsDelta: "{lands} terreni (+{delta})",
        strategyMilestoneDeadZone: "{lands} terreni (uscita dalla zona morta)",
        strategyMilestoneNextMayor: "+{n} terreni → {target}",
        strategyProgressTitleEfficiency: "Prossimo traguardo",
        strategyProgressTitleIncome: "Progresso verso la rendita",
        strategyProgressTitleLands: "Progresso verso i terreni",
        strategyProgressTitleMayor: "Progresso verso il Mayor",
        strategyProgressBadges: "{badges} / {target} badge • Ne mancano {remaining}",
        strategyProgressLands: "{total} / {target} terreni • Ne mancano {remaining}",
        strategyProgressIncome: "{current} / {target} • {percent}%",
        strategyProgressAB: "{balance} / {needed} AB accumulati",
        strategyProgressAccumulate: "AB disponibili: {balance}",
        strategyActLands: "Acquista terreni",
        strategyActBadges: "Punta ai badge",
        strategyActAccumulate: "Accumula AB",
        strategyActDeadZone: "Salta la zona morta in un solo acquisto",
        strategyActDeadZonePlan: "Pianifica il salto oltre la zona morta",
        strategyActComplete: "Completa i dati",
        strategyActReached: "Obiettivo raggiunto",
        strategyActReachedMayor: "Riferimento superato",
        strategyIncomeViaLands: "Per arrivare a {target} servono circa {lands} terreni in più (~{ab} AB). Tempo stimato: {time}. Stima basata sulla resa media attesa di un terreno e sulle soglie boost che attraverserai.",
        strategyIncomeViaBadges: "Conviene prima salire a {badges} badge (+{percent}% di bonus passaporto) e poi acquistare circa {lands} terreni: in tutto ~{ab} AB, meno che con i soli terreni. Tempo stimato: {time}.",
        strategyIncomeViaBadgesOnly: "Salire a {badges} badge (+{percent}% di bonus passaporto) basta per raggiungere l'obiettivo: ~{ab} AB. Tempo stimato: {time}.",
        strategyIncomeUnreachable: "Con i dati attuali non riesco a stimare un percorso realistico verso questa rendita.",
        strategyMissingIncome: "Imposta una rendita giornaliera obiettivo maggiore di zero dal pannello Modifica dati.",
        strategyMissingLands: "Imposta un numero di terreni obiettivo maggiore di zero dal pannello Modifica dati.",
        strategyMissingMayor: "Per questa strategia serve il numero di terreni del Mayor attuale da superare: inseriscilo in Modifica dati (campo Obiettivo Mayor). L'app non conosce città né Mayor, quindi senza questo dato non stima nulla.",
        strategyReachedIncome: "Hai già raggiunto la rendita obiettivo: {current} su {target}. L'obiettivo resta salvato, puoi cambiarlo da Modifica dati.",
        strategyReachedLands: "Hai già raggiunto l'obiettivo: {total} terreni su {target}. L'obiettivo resta salvato, puoi cambiarlo da Modifica dati.",
        strategyReachedMayor: "Possiedi {total} terreni: superi il riferimento inserito ({ref}). Il dato resta salvato, puoi aggiornarlo da Modifica dati.",
        strategyReachedNext: "Come prossimo passo, la priorità più efficiente adesso è: {priority}.",
        strategyLandsExplain: "Per arrivare a {target} terreni servono ancora {remaining} terreni (~{ab} AB). Tempo stimato: {time}.",
        strategyMayorExplain: "Per superare il riferimento attuale servono ancora {remaining} terreni.",
        strategyMayorCost: "Costo stimato: ~{ab} AB. Tempo stimato: {time}.",
        strategyMayorNote: "Il riferimento è il numero inserito in Modifica dati: l'app non conosce la città né il Mayor e non usa dati esterni.",
        strategyCrossings: "Lungo il percorso attraverserai {count} soglie boost, fino a x{boost}.",
        strategyCrossingsOne: "Lungo il percorso attraverserai 1 soglia boost (x{boost}).",
        strategyPathDeadZoneInside: "Zona morta: oltre i {cap} terreni il boost scende da x{from} a x{to} e fino a {recovery} terreni la rendita resta sotto quella che avresti a {cap}. Il traguardo ({target}) cade in questo intervallo.",
        strategyPathDeadZoneCross: "Lungo il percorso c'è una zona morta: oltre i {cap} terreni il boost scende da x{from} a x{to}. Conviene fermarsi a {cap}, accumulare AB e saltare direttamente a {recovery} terreni."

    },

    en: {

        appName: "AE Companion",
        tagline: "Track • Plan • Conquer",

        lands: "Lands",
        income: "Income",
        today: "TODAY",
        month: "MONTH",
        year: "YEAR",

        boostActive: "Active boost x{mult} (+{percent}%)",
        boostCompare: "Without boost you'd earn {base}/day instead of {boosted}",

        strategy: "Strategy",
        landsLabel: "Lands",
        costLabel: "Cost",
        abPerDay: "AB/day",
        timeLabel: "Time",
        nextGoal: "Next goal",

        progressText: "{total} / {next} lands • {remaining} to go",
        progressTextLast: "{total} lands • Last breakpoint",

        day: "day",
        days: "days",

        tips: "Tips",
        tipNoData: "Enter your lands from the Edit data panel to get personalized tips.",
        tipAccumulate: "Right now buying lands or badges wouldn't meaningfully increase your income: it's worth accumulating AB before spending.",
        tipRecommendLand: "Lands are the better move right now: every {abCost} AB invested gets you about {gainFormatted} more daily income — more efficient than badges at the moment. You can afford it: {timeText}.",
        tipRecommendBadge: "The passport is the better move right now: {abNeeded} AB gets you to the badge threshold that unlocks the +{percent}% bonus, about {gainFormatted} more daily income — more efficient than lands at the moment. You can afford it: {timeText}.",
        tipGoalIncomeReached: "You've already reached your income goal ({targetFormatted}/day)! You can set a more ambitious one from the Edit data panel.",
        tipGoalIncomeGap: "You need about {gapFormatted}/day more to reach {targetFormatted}/day. At the current most efficient pace, that's about {abNeeded} AB (~{daysText}).",
        tipGoalLandsReached: "You've already reached your goal of {target} lands! Set a new one from the Edit data panel to keep tracking your progress.",
        tipGoalLandsGap: "You need {remaining} more lands to reach {target} (~{abNeeded} AB): about {daysText} at your current pace.",
        tipBoostUrgent: "Heads up: only {remaining} more lands before your boost drops from x{current} to x{next}. You can afford it: {timeText} — buy as soon as you can to stay in the high-yield bracket longer.",
        tipDeadZoneWarning: "Dead zone ahead: past {cap} lands your boost drops from x{current} to x{next}, and your income would temporarily go down. It's better to stop at {cap} and save up to jump straight to {recoveryLands} lands in one go, where income overtakes your current level again. You can get there: {timeText}.",
        breakpointWarningInline: "Past {cap} lands the boost drops to x{next} (currently x{current}): it's better to stop here and jump straight to {recoveryLands} lands to avoid losing income.",
        tipBoostRelaxed: "You still have {remaining} lands of margin before your boost drops to x{next}: no rush, take your time accumulating AB.",
        tipLastBreakpoint: "You've reached the last available breakpoint: your boost is now fixed no matter how many more lands you buy.",
        tipRarity: "The rarity of each land you buy is assigned randomly: you have about a {legendaryOdds}% chance of getting a Legendary, which earns {mult}x a Common one at the same cost ({cost} AB). You can't choose the rarity, but the more lands you buy, the more chances you get a valuable one.",
        tipMayorStrategy: "Becoming mayor requires owning more lands than anyone else in that specific city: before buying lands everywhere, consider focusing on a city with few active players, where overtaking the current mayor costs less.",
        badgeBonusInfo: "Passport bonus: +{percent}% ({badges} badges)",
        perSecondIncome: "Income per second: {value}",

        assistantGreeting: "Hi! Ask me anything about your situation — e.g. \"what should I buy?\", \"how far am I from my goal?\", \"how many badges do I need?\".",
        assistantHelp: "I can help with: boost thresholds, what's worth buying right now, your goal, how much you earn, mayor, missing badges, the Super Rent Boost, your AB balance, your lands, and how to earn more AB. Try asking in your own words!",
        assistantIncomeSummary: "Right now you're earning about {daily} per day, {monthly} per month, {yearly} per year (boost included).",
        tipBadgeMaxAssistant: "You already have the maximum passport bonus (+{percent}%): your badge count is already optimal.",
        assistantBadgeProgress: "You need {remaining} more badges to go from +{current}% to +{percent}%: every extra badge permanently boosts your income.",
        assistantSRB: "If you can keep the Super Rent Boost (x50) active for a full day, your income would roughly rise to about {value} per day — only during the event (~2.5 days per month).",
        assistantABBalance: "You currently have {balance} AB available (the savings you entered in the ✏️ panel).",
        assistantLandsBreakdown: "You own {total} lands in total: {common} Common, {rare} Rare, {epic} Epic, {legendary} Legendary.",
        assistantABSources: "The main AB sources are: Arcade, mini-games (Golf, Warship, Bowling, Racer, Fishing), rent conversion, surveys, and the Super Rent Boost during events. Check the \"How to earn more AB\" card for details.",
        assistantWhatIfBadge: "With {badges} badges (same lands as now) your passport bonus would rise to +{percent}%: income would become about {daily}/day, {monthly}/month, {yearly}/year (boost included) — today you're at {currentDaily}/day.",
        assistantWhatIfLands: "With {lands} lands your boost would be x{boost} and income would rise to about {daily}/day — today you're at {currentDaily}/day. This is an estimate: the rarity of lands you don't own yet is randomly assigned.",
        assistantFallback: "I'm not sure I understood. Try asking me something like: \"what should I buy?\", \"how far am I from my goal?\", \"how much do I earn?\", or type \"help\" for the full list.",
        assistantTitle: "Assistant",
        assistantDisclaimer: "Recognizes the type of question and answers with real calculations on your data — not a general-purpose AI.",
        assistantPlaceholder: "Type a question...",
        suggestionBuy: "What should I buy?",
        suggestionGoal: "How far am I from my goal?",
        suggestionIncome: "How much do I earn?",
        send: "Send",
        srbBoxTitle: "With Super Rent Boost active (x50)",
        srbBoxNote: "Supplementary estimate, not included in the official income above: only active during the event (~2.5 days/month) and for as long as you can keep it active.",

        settingsTitleEdit: "Edit data",
        settingsTitleOnboarding: "Welcome!",
        settingsIntro: "Enter your name and starting data. It will be saved on this device.",
        nameLabel: "Name",
        countryLabel: "Country",
        sectionLands: "Lands",
        sectionGoal: "Your goal",
        goalEfficiency: "Maximize overall efficiency",
        goalIncome: "Reach a specific income",
        goalLands: "Reach a number of lands",
        goalMayor: "Become mayor of a city",
        goalIncomeTargetLabel: "Target daily income",
        goalIncomeBoostedLabel: "Include ad boost in the calculation",
        goalLandsTargetLabel: "Target number of lands",
        sectionOther: "Other data",
        badgeLabel: "Badges",
        mayorTargetLabel: "Mayor goal",
        dailyABLabel: "AB earned per day",
        abBalanceLabel: "AB available now (savings)",
        abAvailableNow: "you can do it right now with the AB you already have saved",
        sectionPasses: "Your active passes",
        passBadgeExplorerAlt: "Explorer Pass active",
        passBadgeMissionAlt: "Mission Pass active",
        explorerPassLabel: "Explorer Pass (Atlas Explorer Club)",
        missionPassLabel: "Mission Pass (monthly challenges)",
        tipExplorerPassSuggest: "The Explorer Pass (Atlas Explorer Club, ~{cost}/month) roughly increases your daily AB pace and extends the ad boost: if you want to speed up a lot, it might be worth it — but it's a real expense, weigh it against your budget.",
        tipMissionPassSuggest: "The Mission Pass (~{cost}/month) unlocks extra premium rewards in monthly challenges (AB, diamonds, Legendary land upgrade): useful if you already complete the free challenges regularly.",
        tipPassesActive: "You already have the Explorer Pass and/or Mission Pass active: remember these are real recurring costs, factor them in when weighing the value of your in-game investments.",
        cancel: "Cancel",
        save: "Save",

        installIOS: "Add AE Companion to your Home Screen: tap Share (□↑) then \"Add to Home Screen\"",
        installAndroid: "Install AE Companion on your device for quicker access",
        installAction: "Install",

        abTipsTitle: "How to earn more AB",
        abTipsDisclaimer: "Indicative values based on community experience, not official data: they may vary.",
        abTipArcade: "Arcade: 1 to 340 AB per game, depending on your level and the game offered. If available, the Arcade mission also gives reward points on a scale from 5-60 AB (free) to 25-260 AB (with Mission Pass).",
        abTipMinigames: "Available mini-games: Atlas Golf, Atlas Warship, Atlas Bowling, Atlas Racer, Atlas Fishing — another AB source besides Arcade.",
        abTipRentConversion: "Rent conversion bonus: about 33 AB for every € converted from rent.",
        abTipSurveyBoost: "Survey boost: increases the AB earned by completing surveys in the Earn section.",
        abTipSuperRentBoost: "Super Rent Boost (SRB): during the event (about 2.5 days per month) rent accrues up to 50x faster — plan your land purchases ahead of this event to make the most of it.",

        createdBy: "Created by",
        igCta: "Requests or feedback? Message me on Instagram",
        coffeeCta: "Find this useful? Buy me a coffee",
        lastUpdate: "Last update",
        withoutBoost: "without boost",
        navHome: "Home",
        navStrategy: "Strategy",
        navTips: "AB Extra",
        shareCardCta: "Track your Atlas Earth progress too",
        shareCardFooter: "Free · No sign-up",
        shareCardShareText: "My Atlas Earth stats, tracked with AE Companion!",
        shareCardFeatureAssistant: "Strategic assistant with real calculations",
        shareCardFeatureStrategy: "Personalized tips based on your data",
        shareCardFeatureCommunity: "Community AB tips, always up to date",

        featureAssistantTitle: "Assistant",
        featureAssistantSub: "Real calculations",
        featureAdviceTitle: "Advice",
        featureAdviceSub: "Based on your data",
        featureTipsTitle: "AB Tips",
        featureTipsSub: "Always up to date",
        countryNoteTitle: "Calculations based on the official Atlas Earth tables",
        countryNoteText: "Specific to each country: you can change yours in Edit data.",

        strategyEyebrowGoal: "Goal",
        strategyGoalEfficiency: "Overall efficiency",
        strategyGoalIncome: "Specific income",
        strategyGoalLands: "Number of lands",
        strategyGoalMayor: "Become Mayor",
        strategyDescEfficiency: "Compares lands, badges and boost thresholds to show you the most efficient move right now.",
        strategyDescIncome: "Reach {target} ({mode}).",
        strategyDescIncomeEmpty: "No target income set.",
        strategyDescLands: "Reach {target} lands.",
        strategyDescLandsEmpty: "No target number of lands set.",
        strategyDescMayor: "Beat the Mayor reference of {ref} lands.",
        strategyDescMayorEmpty: "No Mayor reference set.",
        strategyModeBoosted: "with boost",
        strategyModePlain: "without boost",
        strategyStatusActive: "In progress",
        strategyStatusReached: "Goal reached",
        strategyStatusReachedMayor: "Reference beaten",
        strategyStatusMissing: "Missing data",
        strategyActionTitle: "Recommended action",
        strategyNextStepTitle: "Next step",
        strategyEditData: "Edit data",
        strategyNow: "Now",
        strategyPerDay: "/day",
        strategyPriorityLabel: "Current priority",
        strategyPrioLands: "Lands",
        strategyPrioBadges: "Badges",
        strategyPrioAccumulate: "Saving AB",
        strategyHeroEffSub: "Boost x{boost} • {lands} lands • {badges} badges",
        strategyHeroIncomeLabel: "Current income",
        strategyHeroIncomeSub: "Goal: {target} ({mode})",
        strategyHeroLandsLabel: "Lands toward the goal",
        strategyHeroMayorSub: "To beat: {ref} • you need {target}",
        strategyAbLine: "AB available: {balance} • Earning: {daily} AB/day",

        // ----- Explorer Club -----
        explorerTitle: "Explorer Club",
        explorerStatusActive: "Active",
        explorerStatusNotStarted: "Starting soon",
        explorerStatusExpired: "Expired",
        explorerStatusSetup: "Setup needed",
        explorerStart: "Start: {date}",
        explorerDayOf: "Day {day} / {total}",
        explorerDailyLogin: "Daily Login",
        explorerClubReward: "Explorer Club",
        explorerABPerDay: "Automatic AB/day",
        explorerExtra: "Extra Explore",
        explorerExtraIncluded: "Included in the pass",
        explorerExtraNote: "Separate from AB: it is not part of the AB/day calculation.",
        explorerAllConfirmed: "Reward confirmed",
        explorerConfirmedUpTo: "Confirmed up to Day {day}",
        explorerNoneConfirmed: "No reward confirmed yet",
        explorerPendingOne: "1 reward to verify",
        explorerPendingMany: "{count} rewards to verify",
        explorerConfirmOne: "I collected it",
        explorerConfirmAll: "I collected them all",
        explorerFix: "Fix streak",
        explorerAddToBalance: "Add confirmed rewards to my AB balance",
        explorerAddToBalanceHint: "Turn it off if you already updated your balance by hand.",
        explorerFeedbackAdded: "{days} rewards confirmed: {ab} added to your AB balance.",
        explorerFeedbackNotAdded: "{days} rewards confirmed ({ab}): AB balance unchanged.",
        explorerFeedbackRolledBack: "Confirmation corrected: collected AB updated.",
        explorerNextMilestone: "Next milestone: Day {day} in {days} • {ab}",
        explorerMilestoneToday: "Today is a milestone: Day {day} • {ab}",
        explorerSetupTitle: "Set your start date",
        explorerSetupText: "Enter the day your Explorer Club started: the Day and AB/day work themselves out.",
        explorerSetupButton: "Set date",
        explorerNotStartedText: "The pass starts on {date} (in {days}).",
        explorerExpiredText: "The pass expired on {date}: no more rewards are generated. Renew it or turn it off from Edit data.",
        explorerRenew: "New pass",
        explorerStartLabel: "Start date (Day 1)",
        explorerEndLabel: "Pass expiry (optional)",
        explorerSheetStartTitle: "Explorer Club dates",
        explorerFixTitle: "Fix streak",
        explorerFixIntro: "By Atlas Earth rules, if you miss a day the streak restarts from Day 1 and the missed day can't be recovered.",
        explorerFixLastLabel: "Last Day you collected",
        explorerFixApply: "Apply",
        explorerFixBroken: "With this value the streak counts as broken: use \"The streak restarted\" and enter the Day 1 date.",
        explorerFixRestartLabel: "The streak restarted from Day 1 on",
        explorerFixRestart: "Restart from here",
        explorerBalanceBtn: "Update AB balance",
        explorerBalanceTitle: "AB balance",
        explorerBalanceHint: "This is your real in-game balance: change it any time (minigames, missions, Arcade and bonuses are not part of AB/day).",
        explorerSettingsHint: "With Explorer Club active, AB/day come from the ladder: no need to enter them.",
        explorerDateError: "Invalid date.",
        strategyAbLineExplorer: "AB available: {balance} • Automatic AB/day today: {daily}",
        strategyExplorerPending: "{count} unconfirmed rewards are not included in the estimate.",
        strategyExplorerVariable: "Minigames, missions and Arcade are not in the estimate: they count when you update your AB balance.",
        strategyExplorerExpired: "Explorer pass expired: no future rewards in the estimate.",
        strategyExplorerNotStarted: "Explorer Club starts on {date}: rewards enter the estimate from that day.",
        strategyMetricMilestone: "Next milestone",
        strategyMetricABNeeded: "AB needed",
        strategyMetricABEstimate: "Estimated AB",
        strategyMetricABAvailable: "AB available",
        strategyMetricTime: "Estimated time",
        strategyMetricYieldLand: "Yield per land",
        strategyMetricYieldBadge: "Badge tier yield",
        strategyMetricRemaining: "To go",
        strategyMetricProgress: "Progress",
        strategyMetricTarget: "Goal",
        strategyMetricSurplus: "Surplus",
        strategyMetricNextThreshold: "Next threshold",
        strategyMetricToBeat: "To beat",
        strategyMetricLandsNow: "Current lands",
        strategyMetricLandsEstimate: "Estimated lands",
        strategyMetricNextStep: "Next step",
        strategyLastBreakpoint: "None: last breakpoint (x{boost})",
        strategyThresholdValue: "{lands} lands — x{boost}",
        strategyNoThreshold: "No threshold before the goal (boost x{boost})",
        strategyMilestoneBadgeValue: "{badges} badges (+{percent}%)",
        strategyMilestoneBadgeThenLands: "{badges} badges (+{percent}%) → {lands} lands",
        strategyMilestoneLandsDelta: "{lands} lands (+{delta})",
        strategyMilestoneDeadZone: "{lands} lands (out of the dead zone)",
        strategyMilestoneNextMayor: "+{n} lands → {target}",
        strategyProgressTitleEfficiency: "Next milestone",
        strategyProgressTitleIncome: "Progress toward income",
        strategyProgressTitleLands: "Progress toward lands",
        strategyProgressTitleMayor: "Progress toward Mayor",
        strategyProgressBadges: "{badges} / {target} badges • {remaining} to go",
        strategyProgressLands: "{total} / {target} lands • {remaining} to go",
        strategyProgressIncome: "{current} / {target} • {percent}%",
        strategyProgressAB: "{balance} / {needed} AB saved",
        strategyProgressAccumulate: "AB available: {balance}",
        strategyActLands: "Buy lands",
        strategyActBadges: "Aim for badges",
        strategyActAccumulate: "Save AB",
        strategyActDeadZone: "Jump the dead zone in one purchase",
        strategyActDeadZonePlan: "Plan the jump past the dead zone",
        strategyActComplete: "Complete your data",
        strategyActReached: "Goal reached",
        strategyActReachedMayor: "Reference beaten",
        strategyIncomeViaLands: "To reach {target} you need about {lands} more lands (~{ab} AB). Estimated time: {time}. Based on the average expected yield of a land and the boost thresholds you will cross.",
        strategyIncomeViaBadges: "Best to first reach {badges} badges (+{percent}% passport bonus) and then buy about {lands} lands: ~{ab} AB in total, less than lands alone. Estimated time: {time}.",
        strategyIncomeViaBadgesOnly: "Reaching {badges} badges (+{percent}% passport bonus) is enough to hit the goal: ~{ab} AB. Estimated time: {time}.",
        strategyIncomeUnreachable: "With the current data I can't estimate a realistic path to this income.",
        strategyMissingIncome: "Set a target daily income above zero in the Edit data panel.",
        strategyMissingLands: "Set a target number of lands above zero in the Edit data panel.",
        strategyMissingMayor: "This strategy needs the current Mayor's land count to beat: enter it in Edit data (Mayor goal field). The app knows no cities or Mayors, so without it nothing can be estimated.",
        strategyReachedIncome: "You've already reached your target income: {current} out of {target}. The goal stays saved; you can change it in Edit data.",
        strategyReachedLands: "You've already reached your goal: {total} out of {target} lands. The goal stays saved; you can change it in Edit data.",
        strategyReachedMayor: "You own {total} lands: more than the reference you entered ({ref}). The value stays saved; you can update it in Edit data.",
        strategyReachedNext: "As a next step, the most efficient priority right now is: {priority}.",
        strategyLandsExplain: "To reach {target} lands you still need {remaining} lands (~{ab} AB). Estimated time: {time}.",
        strategyMayorExplain: "To beat the current reference you still need {remaining} lands.",
        strategyMayorCost: "Estimated cost: ~{ab} AB. Estimated time: {time}.",
        strategyMayorNote: "The reference is the number you entered in Edit data: the app doesn't know the city or the Mayor and uses no external data.",
        strategyCrossings: "Along the way you will cross {count} boost thresholds, up to x{boost}.",
        strategyCrossingsOne: "Along the way you will cross 1 boost threshold (x{boost}).",
        strategyPathDeadZoneInside: "Dead zone: beyond {cap} lands the boost drops from x{from} to x{to}, and until {recovery} lands your income stays below what you'd have at {cap}. Your target ({target}) falls in that range.",
        strategyPathDeadZoneCross: "There is a dead zone on the way: beyond {cap} lands the boost drops from x{from} to x{to}. Best to stop at {cap}, save AB and jump straight to {recovery} lands."

    }

};

let currentLang = "it";

function detectLanguage() {

    const saved = localStorage.getItem(I18N_KEY);

    if (saved && translations[saved]) return saved;

    const nav = (navigator.language || "en").toLowerCase();

    return nav.startsWith("it") ? "it" : "en";

}

function getCurrentLanguage() {

    return currentLang;

}

function t(key, vars) {

    let str = (translations[currentLang] && translations[currentLang][key])
        || translations.en[key]
        || key;

    if (vars) {

        Object.keys(vars).forEach(function (k) {
            str = str.split("{" + k + "}").join(vars[k]);
        });

    }

    return str;

}

// Formatta "N giorno/giorni" o "N day/days" nella lingua corrente
function formatDays(n) {

    const unit = n === 1 ? t("day") : t("days");

    return n + " " + unit;

}

function applyTranslations() {

    document.documentElement.lang = currentLang;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {

        el.textContent = t(el.getAttribute("data-i18n"));

    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {

        el.placeholder = t(el.getAttribute("data-i18n-placeholder"));

    });

    document.querySelectorAll(".lang-btn").forEach(function (btn) {

        btn.classList.toggle("active", btn.getAttribute("data-lang") === currentLang);

    });

}

function setLanguage(lang) {

    if (!translations[lang]) return;

    currentLang = lang;

    localStorage.setItem(I18N_KEY, lang);

    applyTranslations();

    if (typeof populateCountrySelect === "function") populateCountrySelect();

    if (typeof renderDashboard === "function") renderDashboard();

}

currentLang = detectLanguage();
