import { tankList } from "./tanks.js";


export const Diveplan = {
    bottomDepth : 30,
    bottomTime : 20,
    descTime : 3,
    ascRateToDeco : 9,
    ascRateAtDeco : 6,
    ascRateToSurface : 3,
    GFlow : 30,
    GFhigh : 85,
    modelUsed : "ZHL16c",
    decoStopsCalculated : [],
    maxPPoxygen : 0,
    maxPPhelium : 0,
    maxPPnitrogen : 0,
    maxTCnitrogen : 0,
    maxTChelium : 0,
    ascentBegins : 0,
    changeDepth : 0,

    tankList : [],
    currentTank : "BOTTOM",
    nextTank : "",

    maxTCnitrogen : 0,
    maxTChelium : 0,
    profileSampled : [],
    model : []
};