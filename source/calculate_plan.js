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
const LOG_MODOUT = true;
const LOG_states = true;

// phases of dive
const DivePhase = {
    //INIT_TANKS: "inT",
    STARTING : "STA",
    DESCENDING : "DESC",
    BOTTOM : "BOT",
    ASCENDING : "ASC",
    AT_DECO : "DECO",
    //DECO_END : "end",
    SURFACE : "SUR",
  
};



/** 
 * @param {Diveplan} diveplan
 */
function calculatePlan(diveplan) {
    // 2021-11-19 major refactoring: all time units are now MINUTES, seconds removed everywhere
      


    let stepAscend;
    let newDecoStop = Object.create(DecoStop); // DecoStop defined in plan_txt.js
    let ascending;
    let depthRunAvg;


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

    /* alternative way to test 
    let aStep = 0.5;
    for (var aDepth= 0; aDepth < diveplan.bottomDepth; aDepth += aStep){
        ascDepths.push(aDepth);
        if (aDepth >= 12) aStep = 3
        else  if (aDepth >= 6) aStep = 1 ;
    }
    */
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

    let stepDescent = diveplan.bottomDepth / diveplan.desc_steps;
                        //calculateStepDescend(diveplan, diveplan.bottomDepth, intervalDescent) // diveplan.bottomDepth / 5.0;
    let intervalDescent = (diveplan.bottomDepth / diveplan.desc_rate) / diveplan.desc_steps; 
    let intervalBottom = diveplan.bottomTime / diveplan.bottom_steps;
                         //1.0; //--> diveplan.bottomTime / 5;
    let intervalAscent = 0.3333;
    let intervalDeco = 2.0;
    let intervalTankChange = 1.0;
    let addTankChangeTime = 0.0;

    // execute a dive
    let divephase = DivePhase.STARTING;
    let runTimeMin = 0.0; // runtime in MINUTES (was in seconds but refactored all code)
    let intervalMinutes = 1.0;
    let endDepth = 0.0;
    let beginDepth = 0.0;
    let depthSum = 0.0;
    let currentDecoDone = -1;


    wp_txt = `plan for ${(diveplan.bottomTime).toFixed(0)}min at ${diveplan.bottomDepth}m GF=${diveplan.GFlow*100}/${diveplan.GFhigh*100})`;
    if (LOG_states) console.log(`==== ${wp_txt}`);
    diveplan.wayPoints.push(wp_txt);

    //******************** THE LOOP THAT EXECUTES THE SIMULATED DIVE */    
    const MAX_index = 500
    for (let index = 0; index <= MAX_index; index++) {
        if (index >= MAX_index) {   
            console.log(`index >= ${MAX_index}`);
            throw `over ${MAX_index} iterations, aborting`;
        }

        if (LOG_LOOP) {  
            console.log(`[i${index}  b${beginDepth.toFixed(1)} e${endDepth.toFixed(1)} r${(runTimeMin).toFixed(1)}min ${divephase} `);   
        }; 


        let heliumFraction = diveplan.currentTank.he / 100.0;
        let oxygenFraction = diveplan.currentTank.o2 / 100.0;
        let nitrogenFraction = 1.0 - heliumFraction - oxygenFraction;
        ////////////////////////////////////////////////////////
        // do the model calculation for all tissue compartments
        let gfCurrent = gfObject.gfGet(endDepth);
        model.calculateAllTissuesDepth (beginDepth, endDepth, intervalMinutes, 
                                        heliumFraction, nitrogenFraction, gfCurrent );
        if (LOG_catd)  console.log(`>> CATD-in idx=${index} r=${runTimeMin.toFixed(1)} b/e=(${beginDepth}>${endDepth}) interval=${intervalMinutes.toFixed(1)} he/n2=(${heliumFraction}/${nitrogenFraction.toFixed(2)}) GF=${gfCurrent.toFixed(2)}`);  
        if (LOG_MODOUT) console.log(`<< CATD-out stop=${model.leadCeilingStop.toFixed(0)} c=${model.leadCeilingMeters.toFixed(1)} tc=${model.leadTissue}`)
        /////////////////////////////////////////////////////// 

        // update tank pressure    
        tankUpdate(diveplan, beginDepth, endDepth, intervalMinutes);

        // record the new point withj all data    
        let newPoint = Object.create( DiveProfilePoint) ;  /// <-----------------
        newPoint.time = runTimeMin;    
        newPoint.depth = endDepth;
        newPoint.pressure = depth2absolutePressure(endDepth);
        newPoint.tank = diveplan.currentTank;
        newPoint.tankPressure = diveplan.currentTank.pressure;
        newPoint.divephase = divephase;
        newPoint.gfSet = gfObject.gfSetFlag;
        newPoint.ascending = ascending;
        newPoint.gfNow = gfObject.gfGet(endDepth);
        depthSum += endDepth * intervalMinutes;
        depthRunAvg = depthSum / (runTimeMin + 0.00001) ;
        newPoint.depthRunAvg = depthRunAvg;

        // record the current Partial Pressures of all gases breathed
        newPoint.ppOxygen   = newPoint.pressure * oxygenFraction / surfacePressure;
        newPoint.ppNitrogen = newPoint.pressure * nitrogenFraction / surfacePressure;
        newPoint.ppHelium   = newPoint.pressure * heliumFraction / surfacePressure;
        // record the maximum Partial Pressures
        diveplan.maxPPoxygen   = Math.max(diveplan.maxPPoxygen, newPoint.ppOxygen);
        diveplan.maxPPhelium   = Math.max(diveplan.maxPPhelium, newPoint.ppHelium);
        diveplan.maxPPnitrogen = Math.max(diveplan.maxPPnitrogen, newPoint.ppNitrogen);
        diveplan.maxPPanyGas   = Math.max(diveplan.maxPPoxygen, diveplan.maxPPhelium, diveplan.maxPPnitrogen);
   
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



        ///// then check for dive state changes
        if (divephase == DivePhase.STARTING) {
            // STARTING: initialize variables, tanks and then got DESCENDING
            divephase = DivePhase.DESCENDING;
            runTimeMin = 0.0 ;
            initTanks(diveplan, runTimeMin);
            // fixme: this should be zero?
            intervalMinutes = 0.01;
            beginDepth = 0.0;
            endDepth = 0.0;
            depthSum = 0.0;
            depthRunAvg = 0.0;
            ascending = false;
            newDecoStop = null;
            // select the bottom tank to use, -> diveplan.currentTank, also affects nextTank, changeDepth
            
            
        } //end of divephase STARTING
        else if (divephase == DivePhase.DESCENDING) {
            // DESCENDING
            runTimeMin += intervalDescent;
            intervalMinutes = intervalDescent ;
            beginDepth = endDepth;
            endDepth = beginDepth + stepDescent;
            //tankUpdate(diveplan, beginDepth, endDepth, intervalDescent);
            // check if we have reached bottom already
            if (endDepth >= diveplan.bottomDepth) {
                // we have reached bottom now
                divephase = DivePhase.BOTTOM;
                endDepth = diveplan.bottomDepth;
                
                // record waypoint, now at bottom
                wp_txt = `\\ ${endDepth.toFixed(0).padStart(3, " ")}m ${runTimeMin.toFixed(0).padStart(2, " ")}min `+
                         `${runTimeMin.toFixed(0).padStart(2, " ")}min (${diveplan.currentTank.o2}/${diveplan.currentTank.he})`;
                if (LOG_states) console.log(`==== ${wp_txt}`);
                diveplan.wayPoints.push(wp_txt);
                diveplan.atBottom = runTimeMin;
            }
            

        } //end of divephase DESCENDING
        else if (divephase == DivePhase.BOTTOM) {
            // at BOTTOM
            runTimeMin += intervalBottom;
            intervalMinutes = intervalBottom ;
            beginDepth = diveplan.bottomDepth;
            endDepth = diveplan.bottomDepth;
            //tankUpdate(diveplan, beginDepth, endDepth, intervalBottom);
            // check if borrom time has ended
            if (runTimeMin >= diveplan.atBottom + diveplan.bottomTime) {
                // end of bottom time, now start ascending
                divephase = DivePhase.ASCENDING;
                diveplan.ascentBegins = runTimeMin;
                ascending = true;
                // record waypoint, now starting ascent
                wp_txt = `= ${endDepth.toFixed(0).padStart(3, " ")}m ${(runTimeMin-diveplan.atBottom).toFixed(0).padStart(2, " ")}min ${runTimeMin.toFixed(0).padStart(2, " ")}min (${diveplan.currentTank.o2}/${diveplan.currentTank.he})`;
                if (LOG_states) console.log(`==== ${wp_txt}`);
                diveplan.wayPoints.push(wp_txt);
            }
            
        } //end of divephase BOTTOM
        else if (divephase == DivePhase.AT_DECO) {
            // at a deco stop, possibly also a tank change
            runTimeMin += intervalDeco + addTankChangeTime;
            intervalMinutes = intervalDeco + addTankChangeTime;
            tankUpdate(diveplan, beginDepth, endDepth, intervalDeco + addTankChangeTime);
            // already added tank change interval, so now reset it to zero
            if (addTankChangeTime > 0) addTankChangeTime =0;
            // increment count for deco duraction            
            currentDecoDone += intervalDeco;
            //todo: check how long it has been now?
            
            if (newDecoStop != null) {
                newDecoStop.duration = currentDecoDone;
                if (LOG_ASC) console.log(`DECO t=${currentDecoDone} interval=${intervalDeco}`);
            } else {
                if (LOG_ASC) console.log(`DECO ERROR ### newDecoStop==null ${currentDecoDone} ${intervalDeco}`);
            }
            // check if time to end deco
            var EndDeco2surface = false;
            var EndDeco = false;
            if (endDepth <= 3.0 && model.leadCeilingMeters <= 0) EndDeco2surface = true; // near surface and no ceiling
            //******************** THIS IS WHERE DECO ENDS when below 3 m */
            const endDecoDelta = 3.0; // endDecoDelta configures the delta from current endDepth to ceiling when we end the deco stop
            if (endDepth > (model.leadCeilingMeters + endDecoDelta)) EndDeco = true; ///*** limit was 3, try 0.1 */
            
            if (EndDeco2surface || EndDeco) {
                // yes, it is time to end deco
                if (LOG_ASC) console.log(`DECO_END ${endDepth} > ${model.leadCeilingMeters.toFixed(1)} ${EndDeco2surface}`);
                if (EndDeco2surface) {
                    divephase = DivePhase.SURFACE;
                    endDepth = 0;
                    if (LOG_ASC) console.log(`from DECO to SURFACE ${endDepth}`);
                } else {
                    divephase = DivePhase.ASCENDING;
                }
                if (newDecoStop == null){
                    console.log("DECO_END ERROR ######### end deco but newDecoStop=null!!")
                    continue;
                }
                newDecoStop.duration = currentDecoDone;
                newDecoStop.o2 = diveplan.currentTank.o2;
                newDecoStop.he = diveplan.currentTank.he;
                diveplan.decoStopsCalculated.push(newDecoStop);
                // record the deco stop done
                wp_txt = `> ${beginDepth.toFixed(0).padStart(3, " ")}m ${currentDecoDone.toFixed(0).padStart(2, " ")}min `+
                    `@[${newDecoStop.runtime.toFixed(0).padStart(2, " ")}-${runTimeMin.toFixed(0).padStart(2, " ")}]min `+
                    `(${diveplan.currentTank.o2}/${diveplan.currentTank.he})`;
                if(LOG_states) console.log(`==== ${wp_txt}`);
                if (currentDecoDone >= 1.0)
                    diveplan.wayPoints.push(wp_txt);

                newDecoStop = null;
                //divephase = DivePhase.DECO_END
            } else {
                if (LOG_ASC) console.log(`DECO cont. d=${endDepth} c=${model.leadCeilingMeters} delta=${endDecoDelta}`);
            }

        } //end of divephase STOP_DECO

        else if (divephase == DivePhase.SURFACE) {
            // SURFACE
            diveplan.currentTank.useUntilTime = runTimeMin;
            //tankUpdate(diveplan, beginDepth, endDepth, intervalAscent);
            if (LOG_ASC) console.log(`SURFACE d=${endDepth} ceil=${model.leadCeilingMeters}`);

            // 
            let surfaceAtMinute = Math.ceil(runTimeMin);
            wp_txt = `SURFACE ${surfaceAtMinute}min (${diveplan.currentTank.o2}/${diveplan.currentTank.he})`;
            if (LOG_states) console.log(`==== ${wp_txt}`);
            diveplan.wayPoints.push(wp_txt);  
            break;
        } //end of divephase SURFACE

        else if (divephase == DivePhase.ASCENDING) {
            // ** ASCENDING ************************************************************
            runTimeMin += intervalAscent;
            intervalMinutes = intervalAscent;
            beginDepth = endDepth;
           


            // check that we are not at surface yet
            if (endDepth <= 0.0) {
                // we are surface, next loop is the last one
                divephase = DivePhase.SURFACE;
                beginDepth = 0.0;
                endDepth = 0.0;
                //tankUpdate(diveplan, beginDepth, endDepth, intervalAscent);

                // record waypoint, now at surface
                // apparenty code never gets here
                let surfaceAtMinute = Math.ceil(runTimeMin);
                wp_txt = `SURFACE at ${surfaceAtMinute}min (${diveplan.currentTank.o2}/${diveplan.currentTank.he})`;
                if (LOG_states) console.log(`=2== ${wp_txt}`);
                diveplan.wayPoints.push(wp_txt);    
            } 
            // check tank change
            else if (endDepth <= diveplan.changeDepth) {
                // do a tank change here
                // endDepth = diveplan.changeDepth;
                // runTimeMin += intervalTankChange;
                wp_txt = `..${diveplan.changeDepth.toFixed(0).padStart(3," ")}m T-chg @${runTimeMin.toFixed(0)}min `+
                         `GAS (${diveplan.currentTank.o2}/${diveplan.currentTank.he})`;
                if (LOG_states) console.log(`TANK CHANGE ${wp_txt}`);
                diveplan.wayPoints.push(wp_txt);

                changeTanks(diveplan, runTimeMin);

                // force a fake deco stop for gas change interval 
                addTankChangeTime = intervalTankChange;
                divephase = DivePhase.AT_DECO;
            } // tank change
            else {
                // check that next step will not cross ceiling
                let hitCeiling = endDepth <= model.leadCeilingStop;
                if ( hitCeiling ) {
                    // we have hit a deco ceiling
                    if (LOG_ASC) console.log(`--- GOTO DECO (${beginDepth}) leadCeilingStop=${model.leadCeilingStop.toFixed(1)}`);
                    // make sure we stay at this depth
                    endDepth = beginDepth;
                    divephase = DivePhase.AT_DECO;
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
                } // end hitCeiling
                else {
                    //** not at surface, no tank change and not hit deco ceiling, so then ascend next step */
                    //tankUpdate(diveplan, beginDepth, endDepth, intervalAscent);
                    if (ascDepths.length > 0) {
                        endDepth = ascDepths.pop(); // pop the next ascent step from the list
                    } else {
                        // this should not happen, continuing would throw errors anyway
                        console.log("ERROR: ASCENDING and ascDepths already empty");
                        break;
                    }
                    if (LOG_ASC) console.log(`   **ASCENDING b${beginDepth} e${endDepth}`);   
                } // end normal ascent
            } // end checked hitCeiling
        } // end of DivePhase.ASCENDING)

        else {
            // unknown divephase, should not happen
            var errorTxt = `ERROR:calculatePlan: at #${index} r=${runTimeMin.toFixed(1)} unknown state ${divephase}`;
            console.log(errorTxt);
            throw errorTxt;
            break;
        } // end of unknown divephase

        if (LOG_LOOP) {  
            console.log(` i${index} b${beginDepth.toFixed(1)} e${endDepth.toFixed(1)} r${(runTimeMin).toFixed(1)}min ${divephase} `);   
        };
    }; //
    // dive has ended, now save the data for plotting and printing
    diveplan.profileSampled = outProfile;
    // SUSPENDED diveplan.model = modelPoints;
    return 0;
  

}; // calculatePlan

