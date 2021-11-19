// import { DivePhase } from "./calculate_plan.js";
// import { Diveplan } from "./diveplan.js";

/*
const tankList = [
    { label : "BOTTOM", name: "B", use: true, 
        o2: 21, he: 35, SAC: 15, ppo2max: 1.4, liters: 24.0, 
        bar: 200.0, pressure: 200.0, useFromTime: 0, useUntilTime: 0, 
        type: "bottom", useOrder: 1, color: "Magenta" },
    { label: "deco1", name: "D1", use: true, 
        o2: 50, he: 0, changeDepth: 21.0, SAC: 13, ppo2max: 1.6, liters: 7.0, 
        bar: 200.0, pressure: 200.0, useFromTime: 0, useUntilTime: 0, 
        type: "deco", useOrder: 2, color: "Cyan"},
    { label: "deco2", name: "D2", use: true, 
        o2: 100, he: 0, changeDepth: 6.0, SAC: 13, ppo2max: 1.6, liters: 7.0, 
        bar: 200.0, pressure: 200.0, useFromTime: 0, useUntilTime: 0, 
        type: "deco", useOrder: 3, color: "LightGray"},

];
*/

/** 
 * @param {Diveplan} diveplan
 * @param {DivePhase} divephase
 * @param {number} beginDepth
 * @param {number} endDepth 
 * @param {number} intervalMinutes
 * @param {number}  runtime
 */
function tanksCheck(
    // 2021-11-19 major refactoring: all time units are now MINUTES, seconds removed everywhere
    // refactor: remove divephaseNext
    diveplan, divephase, beginDepth=0.0, endDepth=0.0,
    intervalMinutes =0.0, runtime = 0) {

    let tl = diveplan.tankList;
    let bottomTank = diveplan.tankBottom;
    let deco1Tank = diveplan.tankDeco1;
    let deco2Tank = diveplan.tankDeco2;

    if (divephase == DivePhase.INIT_TANKS) {
        // make all tanks full
        diveplan.currentTank = null;
        diveplan.nextTank = null;

        for (let iTank = 0; iTank < tl.length; iTank++ ) {
            tl[iTank].pressure = tl[iTank].bar;
            tl[iTank].useFromTime = 0;
            tl[iTank].useFromTime2 = 0;
            tl[iTank].useUntilTime = 0;
            tl[iTank].useUntilTime2 = 0;
        }

    } else if (divephase == DivePhase.STARTING) {
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
    } else if (divephase == DivePhase.ASCENDING) {
        if (diveplan.nextTank != null) {
            diveplan.changeDepth = diveplan.nextTank.changeDepth;
        }
    } else if (divephase == DivePhase.STOP_ASC_T) {
        // change to next tank, which can be DECO1, DECO2
        diveplan.currentTank.useUntilTime = runtime;
        diveplan.currentTank = diveplan.nextTank;
        diveplan.currentTank.useFromTime = runtime;
        
        if (diveplan.currentTank == deco1Tank) {
            // check if DECO2 next
            if (deco2Tank.use == true) {
                diveplan.nextTank = deco2Tank;
                diveplan.changeDepth = deco2Tank.changeDepth;
            } else {
                diveplan.nextTank = null;
                diveplan.changeDepth = -1;
            }
        } else if (diveplan.nextTank == deco2Tank) {
            diveplan.nextTank = null;
        }
    }
    else if (divephase == DivePhase.SURFACE) {
        // todo: record final tank pressures
        diveplan.currentTank.useUntilTime = runtime;
    } 

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
    return 0;
} // tanksCheck