/*
2021-11-08 Ian Leiman
calculate_plan.js
*/
/*
//*** not  currently supported on all browsers ***
import { Diveplan } from "./diveplan.js";
import {gradientFactor} from "./gradient_factor.js";
import {ModelPoint} from "./model.js";
import {tanksCheck, tankList} from "./tanks.js"
import { DiveProfilePoint } from "./profile_point.js";
import { DecoStop } from "./plan_txt.js";
*/

// debug to console controls
const LOG_LOOP = false;
const LOG_ASC = false;
const LOG_catd = false;
const LOG_MODOUT = false;

// phases of dive
const DivePhase = {
    INIT_TANKS: "inT",
    STARTING : "STA",
    DESCENDING : "DES",
    BOTTOM : "BOT",
    ASCENDING : "ASC",
    STOP_DECO : "deco",
    DECO_END : "end",
    SURFACE : "SUR",
    DESC_T : "DEt",
    ASC_T : "ASCtc",
    STOP_DESC_T : "SDt",
    STOP_ASC_T : "tank",
    ERROR : "ERROR",
    NULL : "NULL",
};



/** 
 * @param {Diveplan} diveplan
 */
function calculatePlan(diveplan) {
      
    let divephase = DivePhase.STARTING;

    let stepAscend;
    let newDecoStop = Object.create(DecoStop); // DecoStop defined in plan_txt.js
    let ascending;
    let depthRunAvg;
    let endDepth;
    let beginDepth;
    let intervalMinutes;

    /**
     * calculates how mnay meters to ascend on next interval of minutes
     * @param {Diveplan} DP 
     * @param {number} depth in meters from where the ascent is to be made
     * @param {number} interval in minutes
     * @returns {number} meters to ascend during the interval
     */
    function calculateStepAscend (DP, depth, interval)  {
        // return 1;
        let rate = 1; // DP.ascRateToDeco;
        if (depth > 22) {
            rate = 9; // 9 m/min up to 22 m
        } else if (depth >= 6) {
            rate = 6;
        } else if (depth >= 3) {
            rate = 2;
        } else {
            rate = 1;
        }
        return rate * interval; // meters to ascend on {interval} of minutes
    };

    /**
     * 
     * @param {*} DP 
     * @param {*} depth 
     * @param {*} interval 
     * @returns 
     */
    function calculateStepDescend (DP, depth, interval)  {
        // return 1;
        let rate = 10;
        return rate * interval;
    };

    let gfObject = new gradientFactor( diveplan.GFlow, diveplan.GFhigh);
 
    let model = new ModelPoint();
    model.initSurface();

    // let modelPoints =[];
    diveplan.decoStopsCalculated = [];


    // reset the maximum pp values
    diveplan.maxPPoxygen = 0.0;
    diveplan.maxPPhelium = 0.0;
    diveplan.maxPPnitrogen = 0.0;
    diveplan.maxTCnitrogen = 0.0;
    diveplan.maxTChelium = 0.0;

    let intervalDescent = 30; //--> diveplan.descTime / 5.0;
    let stepDescent = calculateStepDescend(diveplan, diveplan.bottomDepth, intervalDescent/60.0) // diveplan.bottomDepth / 5.0;
    let intervalBottom = 60; //--> diveplan.bottomTime / 20.0;
    let intervalAscent = 20;
    let intervalDeco = 60.0;
    let intervalTankChange = 60.0;
    // this is where we record the dive profile
    let outProfile = [];


    // execute a dive
    let index = 0;
    let runtime = 0.0;
    let depthSum = 0.0;
    
    
    tanksCheck(diveplan, DivePhase.INIT_TANKS);
    // note that tanksCheck may select the diveplan.currentTank

    let currentDecoDone = -1;

    //******************** THE LOOP THAT EXECUTES THE SIMULATED DIVE */    
    wp_txt = `plan for ${(diveplan.bottomTime/60).toFixed(0)}min at ${diveplan.bottomDepth}m GF=${diveplan.GFlow*100}/${diveplan.GFhigh*100})`;
    console.log(`==== ${wp_txt}`);
    diveplan.wayPoints.push(wp_txt);

    while (true) {
        index += 1;
        if (index > 500) {   
            console.log("index >500");
            throw "over 500 iterations, aborting";
        }
        if (divephase == DivePhase.STARTING) {
            runtime = 0.0;
            // fixme: this should be zero?
            intervalMinutes = 0.01;
            beginDepth = 0.0;
            endDepth = 0.0;
            depthSum = 0.0;
            depthRunAvg = 0.0;
            ascending = false;
            divephase = DivePhase.DESCENDING;
            newDecoStop = null;
            // select the first tank to use, -> diveplan.currentTank, also affects nextTank, changeDepth
            divephase = tanksCheck(diveplan, DivePhase.STARTING, runtime);
        } else if (divephase == DivePhase.DESCENDING) {
            runtime += intervalDescent;
            intervalMinutes = intervalDescent / 60.0;
            beginDepth = endDepth;
            endDepth = beginDepth + stepDescent;
            if (endDepth >= diveplan.bottomDepth) {
                endDepth = diveplan.bottomDepth;
                divephase = DivePhase.BOTTOM;
                // record waypoint, now at bottom
                wp_txt = `d ${endDepth}m ${runtime/60}min ${runtime/60}min (${diveplan.currentTank.o2}/${diveplan.currentTank.he})`;
                console.log(`==== ${wp_txt}`);
                diveplan.wayPoints.push(wp_txt);
                diveplan.atBottom = runtime;
            }
            tanksCheck(diveplan, DivePhase.DESCENDING, beginDepth, endDepth, intervalMinutes, runtime);


        } else if (divephase == DivePhase.DESC_T) {
            runtime += intervalDescent;
            intervalMinutes = intervalDescent / 60.0;
            beginDepth = endDepth;
            endDepth = beginDepth + stepDescent;
            if (endDepth >= diveplan.changeDepth) {
                endDepth = diveplan.changeDepth;
                divephase = DivePhase.STOP_DESC_T;
            }
            tanksCheck(diveplan, DivePhase.DESC_T, beginDepth, endDepth, intervalMinutes, runtime);
        } else if (divephase == DivePhase.STOP_DESC_T) {
            beginDepth = endDepth;
            runtime += intervalTankChange;
            intervalMinutes = intervalTankChange / 60.0;
            divephase = tanksCheck(diveplan, DivePhase.STOP_DESC_T, beginDepth, endDepth, intervalMinutes, runtime);
        } else if (divephase == DivePhase.BOTTOM) {
            runtime += intervalBottom;
            intervalMinutes = intervalBottom / 60.0;
            beginDepth = diveplan.bottomDepth;
            endDepth = diveplan.bottomDepth;
            if (runtime >= diveplan.atBottom + diveplan.bottomTime) {
                divephase = DivePhase.ASCENDING;
                diveplan.ascentBegins = runtime;
                ascending = true;
                // record waypoint, now starting ascent
                wp_txt = `b ${endDepth}m ${(runtime-diveplan.atBottom)/60}min ${runtime/60}min (${diveplan.currentTank.o2}/${diveplan.currentTank.he})`;
                console.log(`==== ${wp_txt}`);
                diveplan.wayPoints.push(wp_txt);
            }
            tanksCheck(diveplan, DivePhase.BOTTOM, beginDepth, endDepth, intervalMinutes, runtime);
        } else if (divephase == DivePhase.ASCENDING) {
            if (LOG_ASC) console.log(`   **ASCENDING** `);   
            runtime += intervalAscent;
            intervalMinutes = intervalAscent / 60.0;
            beginDepth = endDepth;
            stepAscend = calculateStepAscend(diveplan, beginDepth, intervalMinutes);
            if (beginDepth - stepAscend < model.leadCeilingStop) {
                //console.log(`ASCENDING bounce stop at ${model.leadCeilingStop} m, runtime ${runtime}, index ${index}`);
                console.log(`   BOUNCE1 ${divephase} i=${index} r=${runtime} d=${endDepth} ${model.leadCeilingMeters}`);   
                endDepth = model.leadCeilingStop;
            } else {
                endDepth = beginDepth - stepAscend;
            }
            if (endDepth <= 0.0) {
                divephase = DivePhase.SURFACE;
                beginDepth = 0.0;
                endDepth = 0.0;
                tanksCheck(diveplan, DivePhase.SURFACE, beginDepth, endDepth, intervalMinutes, runtime);

                // record waypoint, now at surface
                let surfaceAtMinute = Math.ceil(runtime/60);
                wp_txt = `SURFACE ${surfaceAtMinute}min (${diveplan.currentTank.o2}/${diveplan.currentTank.he})`;
                console.log(`==== ${wp_txt}`);
                diveplan.wayPoints.push(wp_txt);
            } else {
                divephase = tanksCheck(diveplan, DivePhase.ASCENDING, beginDepth, endDepth, intervalMinutes, runtime);
                if (LOG_ASC) console.log(`   ** tanksCheck ${divephase} `);   
            }
        } else if (divephase == DivePhase.ASC_T) {
            runtime += intervalAscent;
            intervalMinutes = intervalAscent / 60.0;
            beginDepth = endDepth;
            stepAscend = calculateStepAscend(diveplan, beginDepth, intervalMinutes);
            if (beginDepth - stepAscend < model.leadCeilingStop) {
                //console.log(`ASC_T bounce stop at ${model.leadCeilingStop} m, runtime ${runtime}, index ${index}`);
                console.log(`   BOUNCE2 ${divephase} i=${index} r=${runtime} d=${endDepth} ${model.leadCeilingMeters}`);   
                
                endDepth = model.leadCeilingStop;
            } else {
                endDepth = beginDepth - stepAscend;
            }
            if (endDepth <= diveplan.changeDepth) {
                endDepth = diveplan.changeDepth;
                divephase = DivePhase.STOP_ASC_T;
            } else {
                tanksCheck(diveplan, DivePhase.ASC_T, beginDepth, endDepth, intervalMinutes, runtime);
            }
        } else if (divephase == DivePhase.STOP_ASC_T) {
            beginDepth = endDepth;
            runtime += intervalTankChange;
            intervalMinutes = intervalTankChange / 60.0;
            tanksCheck(diveplan, DivePhase.STOP_ASC_T, beginDepth, endDepth, intervalMinutes, runtime);
            // force a deco stop after tank change, this allows recoding it properly
            divephase = DivePhase.STOP_DECO;
            //print('+ STOP_CHG_TANK_ASC at {} m '.format(endDepth))
        } else if (divephase == DivePhase.STOP_DECO) {
            runtime += intervalDeco;
            intervalMinutes = intervalDeco / 60.0;
            tanksCheck(diveplan, DivePhase.STOP_DECO, beginDepth, endDepth, intervalMinutes, runtime);
        } else if (divephase == DivePhase.DECO_END) {
            runtime += intervalDeco;
            intervalMinutes = intervalDeco / 60.0;
            divephase = DivePhase.ASCENDING;
            tanksCheck(diveplan, DivePhase.DECO_END, beginDepth, endDepth, intervalMinutes, runtime);
        } else if (divephase == DivePhase.SURFACE) {
            diveplan.currentTank.useUntilTime = runtime;
            tanksCheck(diveplan, DivePhase.SURFACE, beginDepth, endDepth, 0.1, runtime);
            break;
        } else {
            console.log("calculatePlan: slipped through the loop");
            break;
        }

            let tank = diveplan.currentTank;
            let newPoint = Object.create( DiveProfilePoint) ;  /// <-----------------
            newPoint.time = runtime;    
            newPoint.depth = endDepth;
            newPoint.pressure = depth2absolutePressure(endDepth);
            newPoint.tank = tank;
            newPoint.divephase = divephase;
            newPoint.gfSet = gfObject.gfSetFlag;
            newPoint.ascending = ascending;
            newPoint.gfNow = gfObject.gfGet(endDepth);
            depthSum += endDepth * intervalMinutes;
            depthRunAvg = depthSum / ((runtime + 0.001) / 60.0);
            newPoint.depthRunAvg = depthRunAvg;
            newPoint.tankPressure = tank.pressure;
            let heliumFraction = tank.he / 100.0;
            let oxygenFraction = tank.o2 / 100.0;
            let nitrogenFraction = 1.0 - heliumFraction - oxygenFraction;
            // record the current Partial Pressures of all gases breathed
            newPoint.ppOxygen = newPoint.pressure * oxygenFraction / surfacePressure;
            newPoint.ppNitrogen = newPoint.pressure * nitrogenFraction / surfacePressure;
            newPoint.ppHelium = newPoint.pressure * heliumFraction / surfacePressure;
            // record the maximum Partial Pressures
            diveplan.maxPPoxygen = Math.max(diveplan.maxPPoxygen, newPoint.ppOxygen);
            diveplan.maxPPhelium = Math.max(diveplan.maxPPhelium, newPoint.ppHelium);
            diveplan.maxPPnitrogen = Math.max(diveplan.maxPPnitrogen, newPoint.ppNitrogen);
            diveplan.maxPPanyGas = Math.max(diveplan.maxPPoxygen, diveplan.maxPPhelium, diveplan.maxPPnitrogen);

            ////////////////////////////////////////////////////////
            // do the model calculation for all tissue compartments
            let gfCurrent = gfObject.gfGet(endDepth);
            model.calculateAllTissuesDepth(beginDepth, 
                endDepth, intervalMinutes, heliumFraction, nitrogenFraction, gfCurrent );
            if (LOG_catd)  console.log(`     catd ${beginDepth}, ${endDepth}, ${intervalMinutes} ${heliumFraction} ${nitrogenFraction} ${gfCurrent}`);  
            if (LOG_MODOUT) console.log(`    MO stop=${model.leadCeilingStop.toFixed(0)} c=${model.leadCeilingMeters.toFixed(1)} tc=${model.leadTissue}`)
            ///////////////////////////////////////////////////////    
            newPoint.ceiling = model.leadCeilingMeters;

            // search and record max N2, He TC pressures
            diveplan.maxTCnitrogen = Math.max(diveplan.maxTCnitrogen, model.maxNitrogenPressure);
            diveplan.maxTChelium = Math.max(diveplan.maxTChelium, model.maxHeliumPressure);
            outProfile.push(newPoint);

            ///////////////////////////////////////////////////
            // SUSPENDED THE RECORDING OF THE ModelPoints
            // then deepcopy and PUSH the model state to the list of model states
            // let modelCopy = deepcopy(model);
            // modelPoints.push(modelCopy);
            // newPoint.modelpoint = modelCopy;
            ///////////////////////////////////////////////////

        
            // here we start the deco stops when ascending, or check if deco stop can be ended
            if (divephase == DivePhase.ASCENDING ||
                divephase == DivePhase.STOP_DECO ||
                divephase == DivePhase.ASC_T ||
                divephase == DivePhase.STOP_ASC_T ) 
            {//ascending
                if (LOG_ASC) console.log(`--- 1 ${endDepth} ${model.leadCeilingMeters.toFixed(1)}`);
                // check that next step will not cross ceiling
                let hitCeiling = endDepth <= model.leadCeilingStop;
                if ( hitCeiling && divephase != DivePhase.STOP_DECO) {
                    if (LOG_ASC) console.log(`--- 2 ${model.leadCeilingStop.toFixed(1)}`);
                    // we have hit a deco ceiling or tanks change, check if starting or ongoing deco
                    if (divephase == DivePhase.STOP_ASC_T) {
                        // stop for a tank change first
                        if (LOG_ASC) console.log("--- 3a doing tank change stop");
                    } else {
                        divephase = DivePhase.STOP_DECO;
                        if (LOG_ASC) console.log("--- 3b next step>> STOP_DECO");
                    }
                    currentDecoDone = 0.0;
                    // force the next depth to be at the step
                    if (endDepth < model.leadCeilingStop) {
                        // this is a bounce, but should not occur due to fixes done higher up
                        //console.log(`BOUNCE at ${runtime} s ${endDepth} m`);
                        console.log(`   BOUNCE3 ${divephase} i=${index} r=${runtime} d=${endDepth} ${model.leadCeilingMeters}`);   
                    }
                    beginDepth = model.leadCeilingStop;
                    endDepth = beginDepth;
                    // now set the gradient factor
                    newPoint.gfNow = gfObject.gfSet(endDepth);
                    newPoint.gfSet = true;
                    // the decos near surface take longer, so longer intervals used
                    if (beginDepth == 3.0) {
                        intervalDeco = 180.0;
                    } else if (beginDepth == 6.0) {
                        intervalDeco = 120.0;
                    } else {
                        intervalDeco = 60.0;
                    }
                    //record the new deco stop
                    newDecoStop = Object.create(DecoStop); // DecoStop defined in plan_txt.js;
                    newDecoStop.depth = beginDepth
                    newDecoStop.runtime = runtime;
                } else if (divephase == DivePhase.STOP_DECO) {
                    if (LOG_ASC) console.log("--- 4 at STOP_DECO");
                    if (currentDecoDone == -1) {
                        if (LOG_ASC) console.log("--- 5");
                        // really dirty fix
                        currentDecoDone = intervalDeco;
                        newDecoStop = Object.create(DecoStop); // DecoStop defined in plan_txt.js;
                        newDecoStop.depth = beginDepth;
                        newDecoStop.runtime = runtime;
                        newDecoStop.duration = intervalDeco;
                    } else {
                        // ongoing deco stop, increment the timer
                        
                        currentDecoDone += intervalDeco;
                        if (LOG_ASC) console.log(`--- 6 ${currentDecoDone} ${intervalDeco}`);
                        //todo: check how long it has been now?
                    }
                    if (newDecoStop != null) {
                        newDecoStop.duration = currentDecoDone;
                        if (LOG_ASC) console.log(`--- 7 ${currentDecoDone}`);
                    }
                    // check if time to end deco
                    if (endDepth > (model.leadCeilingMeters + 3.0)) {
                        if (LOG_ASC) console.log(`--- 8 ${endDepth} > ${model.leadCeilingMeters +3.0}`);
                        divephase = DivePhase.ASCENDING;

                        if (newDecoStop == null){
                            console.log("######### 8 end deco but newDecoStop=null!!")
                            continue;
                        }
                        newDecoStop.duration = currentDecoDone;
                        newDecoStop.o2 = diveplan.currentTank.o2;
                        newDecoStop.he = diveplan.currentTank.he;
                        diveplan.decoStopsCalculated.push(newDecoStop);
                        // record the deco stop done
                        wp_txt = `> ${endDepth}m ${(currentDecoDone)/60}min ${(runtime/60).toFixed(0)}min (${diveplan.currentTank.o2}/${diveplan.currentTank.he})`;
                        console.log(`==== ${wp_txt}`);
                        diveplan.wayPoints.push(wp_txt);

                        newDecoStop = null;
                        //divephase = DivePhase.DECO_END
                    } else {
                        if (LOG_ASC) console.log(`--- 9 ${endDepth} <= ${model.leadCeilingMeters +3.0}`);
                    }
               }; // else if (divephase == DivePhase.STOP_DECO)
           };//ascending
        if (LOG_LOOP) {  
            console.log(`${index}# ${endDepth.toFixed(1)}m ${(runtime /60).toFixed(1)}min ${divephase} c=${model.leadCeilingMeters.toFixed(1)}m `);   
        }
        }; //
    // dive has ended, now save the data for plotting and printing
    diveplan.profileSampled = outProfile;
    // SUSPENDED diveplan.model = modelPoints;
    return 0;
  

}; // calculatePlan

