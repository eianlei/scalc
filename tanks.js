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
    { label: "travel1", name: "T1", use: false, 
        o2: 21, he: 25, changeDepth: 40.0, SAC: 16, ppo2max: 1.4, liters: 11.0, 
        bar: 200.0, pressure: 200.0, useFromTime: 0, useUntilTime: 0, useFromTime2: 0, useUntilTime2: 0, 
        type: "travel", useOrder: 0, color: "Yellow"}
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
    diveplan, divephase, beginDepth=0.0, endDepth=0.0,
    intervalMinutes =0.0, runtime = 0) {

    let tl = diveplan.tankList;
    let travelTank = tl.find(x => x.type === 'travel');
    let bottomTank = tl.find(x => x.type === 'bottom');
    let deco1Tank = tl.find(x => x.label === 'deco1');
    let deco2Tank = tl.find(x => x.label === 'deco2');

    let divephaseNext = DivePhase.NULL;
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
        divephaseNext = DivePhase.STARTING;
    } else if (divephase == DivePhase.STARTING) {
        // select and return bottom or travel tank (B or T1),
        // if travel tank return DivePhase.DESC_CHG_TANK, and changeDepth        
        if (travelTank.use == true) {
            divephaseNext = DivePhase.DESC_T;
            diveplan.changeDepth = travelTank.changeDepth;
            diveplan.currentTank = travelTank;
            travelTank.useFromTime2 = runtime;
            diveplan.nextTank = bottomTank;
        } else {
            divephaseNext = DivePhase.DESCENDING;
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
        }
    } else if (divephase == DivePhase.DESCENDING) {
        // just update tank pressure
        divephaseNext = DivePhase.DESCENDING;
    } else if (divephase == DivePhase.DESC_T) {
        // just update tank pressure
        divephaseNext = DivePhase.DESC_T;
    } else if (divephase == DivePhase.STOP_DESC_T) {
        // change to next tank, which will be BOTTOM at descending
        tl[TankType.TRAVEL].useUntilTime2 = runtime;
        diveplan.currentTank = diveplan.nextTank;
        diveplan.currentTank.useFromTime = runtime;
        // which means that next gas must be TRAVEL again
        diveplan.nextTank = travelTank;
        divephaseNext = DivePhase.DESCENDING;
    } else if (divephase == DivePhase.BOTTOM) {
        // just update tank pressure
        divephaseNext = DivePhase.BOTTOM;
    } else if (divephase == DivePhase.ASCENDING) {
        // if any tank changes ahead, then ASC_CHG_TANK
        // if at BOTTOM tank and TRAVEL enabled, then TRAVEL comes next
        // else DECO1 or DECO2
        // if previous tank TRAVEL, then change to BOTTOM
        // if previous tank BOTTOM, then change to TRAVEL if enabled
        // else change to DECO1 if enabled, or DECO2
        if (diveplan.nextTank == null) {
            // there is no tank change ascending
            divephaseNext = DivePhase.ASCENDING;
        } else {
            divephaseNext = DivePhase.ASC_T;
            diveplan.changeDepth = diveplan.nextTank.changeDepth;
        }
    } else if (divephase == DivePhase.ASC_T) {
        // just update tank pressure
        divephaseNext = DivePhase.ASC_T;
    } else if (divephase == DivePhase.STOP_ASC_T) {
        // change to next tank, which can be TRAVEL, DECO1, DECO2
        diveplan.currentTank.useUntilTime = runtime;
        diveplan.currentTank = diveplan.nextTank;
        diveplan.currentTank.useFromTime = runtime;
        if (diveplan.currentTank == travelTank) {
            // now on TRAVEL tank, check if next can be DECO1, DECO2
            if (tl[TankType.DECO1].use == true) {
                diveplan.nextTank = tl[TankType.DECO1];
                diveplan.changeDepth = tl[TankType.DECO1].changeDepth;
                divephaseNext = DivePhase.ASC_T;
            } else if (tl[TankType.DECO2].use == true) {
                diveplan.nextTank = tl[TankType.DECO2];
                diveplan.changeDepth = tl[TankType.DECO2].changeDepth;
                divephaseNext = DivePhase.ASC_T;
            } else {
                diveplan.nextTank = null;
                diveplan.changeDepth = -1;
                divephaseNext = DivePhase.ASCENDING;
            }
        } else if (diveplan.currentTank == deco1Tank) {
            // check if DECO2 next
            if (deco2Tank.use == true) {
                diveplan.nextTank = deco2Tank;
                diveplan.changeDepth = deco2Tank.changeDepth;
                divephaseNext = DivePhase.ASC_T;
            } else {
                diveplan.nextTank = null;
                diveplan.changeDepth = -1;
                divephaseNext = DivePhase.ASCENDING;
            }
        } else if (diveplan.nextTank == deco2Tank) {
            diveplan.nextTank = null;
            divephaseNext = DivePhase.ASCENDING;
        }
    } else if (divephase == DivePhase.STOP_DECO) {
    } else if (divephase == DivePhase.DECO_END) {
    } else if (divephase == DivePhase.SURFACE) {
        // todo: record final tank pressures
        diveplan.currentTank.useUntilTime = runtime;
    } else {
        console.log("tanksCheck: error");
        
        return DivePhase.ERROR;
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
    return divephaseNext;
}