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

// debug to console.log controls, set to true to log events
const LOG_LOOP = true;
const LOG_ASC = true;
const LOG_catd = true;
const LOG_MODOUT = false;
const LOG_bounces = true;
const LOG_states = false;

// phases of dive
const DivePhase = {
    INIT_TANKS: "inT",
    STARTING : "STA",
    DESCENDING : "DESC",
    BOTTOM : "BOT",
    ASCENDING : "ASC",
    STOP_DECO : "deco",
    DECO_END : "end",
    SURFACE : "SUR",
  
};



/** 
 * @param {Diveplan} diveplan
 */
function calculatePlan(diveplan) {
    // 2021-11-19 major refactoring: all time units are now MINUTES, seconds removed everywhere
      
    let divephase = DivePhase.STARTING;

    let stepAscend;
    let newDecoStop = Object.create(DecoStop); // DecoStop defined in plan_txt.js
    let ascending;
    let depthRunAvg;
    let endDepth;
    let beginDepth;
    let intervalMinutes;

    /**
     * calculates how many meters to ascend on next interval of minutes
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

    // create a list of depths to ascend, even 3m intervals
    let ascDepths = [];
    for (var aDepth= 0; aDepth < diveplan.bottomDepth; aDepth += 3.0){
        ascDepths.push(aDepth);
    }

    // these checks should be enforced in UI before we come here, this is a safeguard
    // check that deco tank change depths are not in conflict
    if (diveplan.tankDeco1.changeDepth >= diveplan.bottomDepth){
        // deco1 change depth below bottom, force it to 1st ascent step
        diveplan.tankDeco1.changeDepth = ascDepths.at(-1);
    }
    if (diveplan.tankDeco2.changeDepth > diveplan.tankDeco1.changeDepth){
        // deco2 change depth below deco1, force it 3 m above deco1
        diveplan.tankDeco2.changeDepth = diveplan.tankDeco1.changeDepth -3;
    }

    let gfObject = new gradientFactor( diveplan.GFlow, diveplan.GFhigh);
    let model = new ModelPoint();
    model.initSurface();

    // let modelPoints =[];
    diveplan.decoStopsCalculated = [];
    // this is where we record the dive profile
    let outProfile = [];


    // reset the maximum pp values
    diveplan.maxPPoxygen = 0.0;
    diveplan.maxPPhelium = 0.0;
    diveplan.maxPPnitrogen = 0.0;
    diveplan.maxTCnitrogen = 0.0;
    diveplan.maxTChelium = 0.0;

    // setting unit is minutes, refactored
    let intervalDescent = 0.5; //--> diveplan.descTime / 1.0;
    let stepDescent = calculateStepDescend(diveplan, diveplan.bottomDepth, intervalDescent) // diveplan.bottomDepth / 5.0;
    let intervalBottom = 1.0; //--> diveplan.bottomTime / 5;
    let intervalAscent = 0.3333;
    let intervalDeco = 2.0;
    let intervalTankChange = 1.0;
    let addTankChangeTime = 0.0;

    // execute a dive
    let index = 0;
    let runTimeMin = 0.0; // runtime in MINUTES (was in seconds but refactored all code)
    let depthSum = 0.0;
    let currentDecoDone = -1;

    //******************** THE LOOP THAT EXECUTES THE SIMULATED DIVE */    
    wp_txt = `plan for ${(diveplan.bottomTime).toFixed(0)}min at ${diveplan.bottomDepth}m GF=${diveplan.GFlow*100}/${diveplan.GFhigh*100})`;
    if (LOG_states) console.log(`==== ${wp_txt}`);
    diveplan.wayPoints.push(wp_txt);

    while (true) {
        index += 1;
        if (index > 500) {   
            console.log("index >500");
            throw "over 500 iterations, aborting";
        }
        if (divephase == DivePhase.STARTING) {
            runTimeMin = 0.0 ;
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
            initTanks(diveplan, runTimeMin);
            divephase = DivePhase.DESCENDING;
            
        } else if (divephase == DivePhase.DESCENDING) {
            runTimeMin += intervalDescent;
            intervalMinutes = intervalDescent ;
            beginDepth = endDepth;
            endDepth = beginDepth + stepDescent;
            if (endDepth >= diveplan.bottomDepth) {
                endDepth = diveplan.bottomDepth;
                divephase = DivePhase.BOTTOM;
                // record waypoint, now at bottom
                wp_txt = `d ${endDepth}m ${runTimeMin.toFixed(1)}min ${runTimeMin.toFixed(1)}min (${diveplan.currentTank.o2}/${diveplan.currentTank.he})`;
                if (LOG_states) console.log(`==== ${wp_txt}`);
                diveplan.wayPoints.push(wp_txt);
                diveplan.atBottom = runTimeMin;
            }
            tankUpdate(diveplan, beginDepth, endDepth, intervalDescent);

        } else if (divephase == DivePhase.BOTTOM) {
            runTimeMin += intervalBottom;
            intervalMinutes = intervalBottom ;
            beginDepth = diveplan.bottomDepth;
            endDepth = diveplan.bottomDepth;
            if (runTimeMin >= diveplan.atBottom + diveplan.bottomTime) {
                divephase = DivePhase.ASCENDING;
                diveplan.ascentBegins = runTimeMin;
                ascending = true;
                // record waypoint, now starting ascent
                wp_txt = `b ${endDepth}m ${(runTimeMin-diveplan.atBottom).toFixed(0)}min ${runTimeMin.toFixed(1)}min (${diveplan.currentTank.o2}/${diveplan.currentTank.he})`;
                if (LOG_states) console.log(`==== ${wp_txt}`);
                diveplan.wayPoints.push(wp_txt);
            }
            tankUpdate(diveplan, beginDepth, endDepth, intervalBottom);
        } 
        else if (divephase == DivePhase.ASCENDING) {
            if (LOG_ASC) console.log(`   **ASCENDING** `);   
            runTimeMin += intervalAscent;
            intervalMinutes = intervalAscent;
            beginDepth = endDepth;
            endDepth = ascDepths.pop(); // pop the next ascent step from the list
            tankUpdate(diveplan, beginDepth, endDepth, intervalAscent);

            if (endDepth <= 0.0) {
                divephase = DivePhase.SURFACE;
                beginDepth = 0.0;
                endDepth = 0.0;
                tankUpdate(diveplan, beginDepth, endDepth, intervalAscent);

                // record waypoint, now at surface
                let surfaceAtMinute = Math.ceil(runTimeMin);
                wp_txt = `SURFACE ${surfaceAtMinute}min (${diveplan.currentTank.o2}/${diveplan.currentTank.he})`;
                if (LOG_states) console.log(`==== ${wp_txt}`);
                diveplan.wayPoints.push(wp_txt);    
            } 
            else if (endDepth <= diveplan.changeDepth) {
                // do a tank change here
                // endDepth = diveplan.changeDepth;
                // runTimeMin += intervalTankChange;
                changeTanks(diveplan, runTimeMin);
                wp_txt = `  ${endDepth}m CHANGE @${runTimeMin.toFixed(0)}min to (${diveplan.currentTank.o2}/${diveplan.currentTank.he})`;
                if (LOG_states) console.log(`TANK CHANGE ${wp_txt}`);
                diveplan.wayPoints.push(wp_txt);
                // force a fake deco stop for gas change interval 
                addTankChangeTime = intervalTankChange;
                divephase = DivePhase.STOP_DECO;
            } 
            
        } // ascending
        else if (divephase == DivePhase.STOP_DECO) {
            runTimeMin += intervalDeco + addTankChangeTime;
            intervalMinutes = intervalDeco + addTankChangeTime;
            tankUpdate(diveplan, beginDepth, endDepth, intervalDeco + addTankChangeTime);
            // already added tank change interval, so now reset it to zero
            if (addTankChangeTime > 0) addTankChangeTime =0;
        } 
        else if (divephase == DivePhase.DECO_END) {
            runTimeMin += intervalDeco;
            intervalMinutes = intervalDeco; 
            divephase = DivePhase.ASCENDING;
            tankUpdate(diveplan, beginDepth, endDepth, intervalDeco);
        } 
        else if (divephase == DivePhase.SURFACE) {
            diveplan.currentTank.useUntilTime = runTimeMin;
            tankUpdate(diveplan, beginDepth, endDepth, intervalAscent);
            break;
        } 
        else {
            console.log("calculatePlan: slipped through the loop");
            throw "error 101";
            break;
        }
        /*
        if (LOG_LOOP) {  
            console.log(`${index}> ${endDepth.toFixed(1)}m ${(runTimeMin).toFixed(1)}min ${divephase} `);   
        }*/

        let tank = diveplan.currentTank;
        let newPoint = Object.create( DiveProfilePoint) ;  /// <-----------------
        newPoint.time = runTimeMin;    
        newPoint.depth = endDepth;
        newPoint.pressure = depth2absolutePressure(endDepth);
        newPoint.tank = tank;
        // newPoint.tankO2 = 
        newPoint.divephase = divephase;
        newPoint.gfSet = gfObject.gfSetFlag;
        newPoint.ascending = ascending;
        newPoint.gfNow = gfObject.gfGet(endDepth);
        depthSum += endDepth * intervalMinutes;
        depthRunAvg = depthSum / (runTimeMin + 0.00001) ;
        newPoint.depthRunAvg = depthRunAvg;
        newPoint.tankPressure = tank.pressure;
        let heliumFraction = tank.he / 100.0;
        let oxygenFraction = tank.o2 / 100.0;
        let nitrogenFraction = 1.0 - heliumFraction - oxygenFraction;
        // record the current Partial Pressures of all gases breathed
        newPoint.ppOxygen   = newPoint.pressure * oxygenFraction / surfacePressure;
        newPoint.ppNitrogen = newPoint.pressure * nitrogenFraction / surfacePressure;
        newPoint.ppHelium   = newPoint.pressure * heliumFraction / surfacePressure;
        // record the maximum Partial Pressures
        diveplan.maxPPoxygen   = Math.max(diveplan.maxPPoxygen, newPoint.ppOxygen);
        diveplan.maxPPhelium   = Math.max(diveplan.maxPPhelium, newPoint.ppHelium);
        diveplan.maxPPnitrogen = Math.max(diveplan.maxPPnitrogen, newPoint.ppNitrogen);
        diveplan.maxPPanyGas   = Math.max(diveplan.maxPPoxygen, diveplan.maxPPhelium, diveplan.maxPPnitrogen);

        ////////////////////////////////////////////////////////
        // do the model calculation for all tissue compartments
        let gfCurrent = gfObject.gfGet(endDepth);
        model.calculateAllTissuesDepth(beginDepth, 
            endDepth, intervalMinutes, heliumFraction, nitrogenFraction, gfCurrent );
        if (LOG_catd)  console.log(`     catd b${beginDepth} e${endDepth} i${intervalMinutes.toFixed(1)} (${heliumFraction}/${nitrogenFraction}) GF${gfCurrent.toFixed(2)}`);  
        if (LOG_MODOUT) console.log(`    MO stop=${model.leadCeilingStop.toFixed(0)} c=${model.leadCeilingMeters.toFixed(1)} tc=${model.leadTissue}`)
        ///////////////////////////////////////////////////////    
        newPoint.ceiling = model.leadCeilingMeters;
        newPoint.ceiling3m = model.leadCeilingStop;
        newPoint.margin = newPoint.depth - model.leadCeilingMeters;
        newPoint.leadTC = model.leadTissue;
        // then DEEP copy the ceiling values from model
        newPoint.TCm = Array(16);
        for (i=0; i < model.ceilings.length; i++){
            var copy = model.ceilings[i];
            newPoint.TCm[i] = copy;
        };

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
        if (divephase == DivePhase.ASCENDING || divephase == DivePhase.STOP_DECO ) 
        {//ascending
            if (LOG_ASC) console.log(`--- 1 ${endDepth.toFixed(1)} ${model.leadCeilingMeters.toFixed(1)}`);
            // check that next step will not cross ceiling
            let hitCeiling = endDepth <= model.leadCeilingStop;
            if ( hitCeiling && divephase != DivePhase.STOP_DECO) {
                // we have hit a deco ceiling or tanks change,
                if (LOG_ASC) console.log(`--- 2 ${model.leadCeilingStop.toFixed(1)}`);
                divephase = DivePhase.STOP_DECO;
                currentDecoDone = 0.0;
                 // now set the gradient factor
                newPoint.gfNow = gfObject.gfSet(endDepth);
                newPoint.gfSet = true;
                // the decos near surface take longer, so longer intervals used
                if (endDepth == 3.0) {
                    intervalDeco = 1.0;
                } else if (endDepth == 6.0) {
                    intervalDeco = 1.0;
                } else {
                    intervalDeco = 0.5;
                }
                //record the new deco stop
                newDecoStop = Object.create(DecoStop); // DecoStop defined in plan_txt.js;
                newDecoStop.depth = endDepth
                newDecoStop.runtime = runTimeMin;
            } else if (divephase == DivePhase.STOP_DECO) {
                // at a deco stop and waiting for ceiling to go up
                if (LOG_ASC) console.log("--- 4 at STOP_DECO");
                    currentDecoDone += intervalDeco;
                    if (LOG_ASC) console.log(`--- 6 ${currentDecoDone} ${intervalDeco}`);
                    //todo: check how long it has been now?
                
                if (newDecoStop != null) {
                    newDecoStop.duration = currentDecoDone;
                    if (LOG_ASC) console.log(`--- 7 ${currentDecoDone}`);
                }
                // check if time to end deco
                var EndDeco2surface = false;
                var EndDeco = false;
                if (endDepth >= 3.0 && model.leadCeilingMeters <= 0) EndDeco2surface = true; // near surface and no ceiling
                if (endDepth > (model.leadCeilingMeters + 2)) EndDeco = true; ///*** limit was 3, try 0.1 */
                if (EndDeco2surface || EndDeco) {
                    // yes, it is time to end deco
                    if (LOG_ASC) console.log(`-*- 8 ${endDepth} > ${model.leadCeilingMeters.toFixed(1)} ${EndDeco2surface}`);
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
                    wp_txt = `> ${endDepth}m ${(currentDecoDone)}min `+
                        `@[${(newDecoStop.runtime).toFixed(0)}-${(runTimeMin).toFixed(0)}]min `+
                        `(${diveplan.currentTank.o2}/${diveplan.currentTank.he})`;
                    if(LOG_states) console.log(`==== ${wp_txt}`);
                    diveplan.wayPoints.push(wp_txt);

                    newDecoStop = null;
                    //divephase = DivePhase.DECO_END
                } else {
                    if (LOG_ASC) console.log(`--- 9 ${endDepth} <= ${model.leadCeilingMeters +3.0}`);
                }
            }; // else if (divephase == DivePhase.STOP_DECO)
        };//ascending
        if (LOG_LOOP) {  
            console.log(`${index}# ${endDepth.toFixed(1)}m ${(runTimeMin).toFixed(1)}min ${divephase} c=${model.leadCeilingMeters.toFixed(1)}m `);   
        }
    }; //
    // dive has ended, now save the data for plotting and printing
    diveplan.profileSampled = outProfile;
    // SUSPENDED diveplan.model = modelPoints;
    return 0;
  

}; // calculatePlan

