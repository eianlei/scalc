/**
 * Canonical diveplan object used by runPlan() / calculatePlan().
 * Classic script (no import/export). Load before planner.js.
 */
function createDiveplan() {
    return {
        bottomDepth: 50,
        bottomTime: 30,
        desc_rate: 10,
        desc_steps: 5,
        bottom_steps: 5,
        ascRateToDeco: 1,
        ascRateAtDeco: 1,
        ascRateToSurface: 1,
        GFlow: 0.30,
        GFhigh: 0.80,
        modelUsed: "ZHL16c",
        decoStopsCalculated: [],
        wayPoints: [],
        maxPPoxygen: 0,
        maxPPhelium: 0,
        maxPPnitrogen: 0,
        maxPPanyGas: 0,
        maxTCnitrogen: 0,
        maxTChelium: 0,
        ascentBegins: 0,
        atBottom: 0,
        changeDepth: 0,
        tankList: [],
        currentTank: null,
        tankBottom: null,
        tankDeco1: null,
        tankDeco2: null,
        nextTank: null,
        profileSampled: [],
        model: [],
        tableIsGenerated: false
    };
}
