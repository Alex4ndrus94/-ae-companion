// ======================================
// AE Core - Calculator
// Versione 0.1
// ======================================

function getCurrentBreakpoint(lands) {

    for (const bp of CONFIG.breakpoints) {

        if (lands >= bp.min && lands <= bp.max) {
            return bp;
        }

    }

    return null;

}

function getNextBreakpoint(lands) {

    for (const bp of CONFIG.breakpoints) {

        if (lands < bp.max) {

            return bp.max + 1;

        }

    }

    return null;

}
