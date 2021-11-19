// import { DivePhase } from "./calculate_plan.js";
// import { Diveplan } from "./diveplan.js";

/**
 * 
 * @param {*} diveplan 
 * @param {*} beginDepth 
 * @param {*} endDepth 
 * @param {*} intervalMinutes 
 * @returns 
 */
function tankUpdate(
    // 2021-11-19 major refactoring: all time units are now MINUTES, seconds removed everywhere
    diveplan, beginDepth=0.0, endDepth=0.0,
    intervalMinutes =0.0, ) 
{
    // calculate gas used to update tank pressure
    if (diveplan.currentTank != null) {
        var beginPressure = depth2absolutePressure(beginDepth);
        var endPressure = depth2absolutePressure(endDepth);
        var surfaceLitersGasConsumed = diveplan.currentTank.SAC * intervalMinutes;
        var avgPressure = Math.abs(endPressure + beginPressure) / 2;
        var depthLitersGasConsumed = avgPressure * surfaceLitersGasConsumed;
        var litersBefore = diveplan.currentTank.pressure * diveplan.currentTank.liters;
        var litersLeft = litersBefore - depthLitersGasConsumed;
        var barsLeft = litersLeft / diveplan.currentTank.liters;
        // finally update new pressure into the tank itself
        diveplan.currentTank.pressure = barsLeft;
    }
    return barsLeft;
} // tanksCheck

/**
 * 
 * @param {*} diveplan 
 */
function changeTanks(diveplan, runtime){
    // change to next tank, which can be DECO1, DECO2
    diveplan.currentTank.useUntilTime = runtime;

    if (diveplan.nextTank) {
        diveplan.currentTank = diveplan.nextTank;
        diveplan.currentTank.useFromTime = runtime;
    
        if (diveplan.currentTank.label == "deco1") {
            // check if DECO2 next
            if (diveplan.tankDeco2.use == true) {
                diveplan.nextTank = diveplan.tankDeco2;
                diveplan.changeDepth = diveplan.tankDeco2.changeDepth;
            } else {
                diveplan.nextTank = null;
                diveplan.changeDepth = -1000;
            }
        } else if (diveplan.currentTank.label == "deco2") {
            diveplan.nextTank = null;
            diveplan.changeDepth = -1000;
        }
    }
}


/**
 * 
 * @param {*} diveplan 
 * @param {*} runtime 
 */
function initTanks(diveplan, runtime = 0) {

    let tl = diveplan.tankList;
    let bottomTank = diveplan.tankBottom;
    let deco1Tank = diveplan.tankDeco1;
    let deco2Tank = diveplan.tankDeco2;

    // make all tanks full
    for (let iTank = 0; iTank < tl.length; iTank++ ) {
        tl[iTank].pressure = tl[iTank].bar;
        tl[iTank].useFromTime = 0;
        tl[iTank].useFromTime2 = 0;
        tl[iTank].useUntilTime = 0;
        tl[iTank].useUntilTime2 = 0;
    }


    diveplan.currentTank = bottomTank;
    diveplan.currentTank.useFromTime = runtime;
    if (deco1Tank.use == true) {
        diveplan.nextTank = deco1Tank;
        diveplan.changeDepth = deco1Tank.changeDepth;
    } else if (deco2Tank.use == true) {
        diveplan.nextTank = deco2Tank;
        diveplan.changeDepth = deco2Tank.changeDepth;
    } else {
        diveplan.nextTank = null;
        diveplan.changeDepth = -1;
    }

}// initTanks