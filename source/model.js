/*
2021-11-04 Ian Leiman
converted from Python source to javascript
pydplan_buhlmann.py to model.js, at https://github.com/eianlei/pydplan
this is the Buhlmann ZHL16c model implemented in JavaScript
*/

// import { ZHL16c } from "./ZHL16c.js"; // model coefficients for ZHL16c

const COMPS = 16;
const WaterVaporSurface = 0.0627;
const surfacePressure = 1.01325;
const surfaceTemperature = 20;
const AirHelium = 0.0;
const AirNitrogen = 0.7808;
const AirOxygen = 0.2095;
const AirArgon = 0.00934;
const AirInertGasFraction = AirHelium + AirNitrogen + AirArgon;
const initN2 = 0.745;

function depth2pressure(depth){
    pressure =  (depth / 10.0);
    return pressure;
}

function pressure2depth(pressure){
    depth = (pressure * 10.0);
    return depth;
}

function depth2absolutePressure(depth){
    pressure = surfacePressure + (depth / 10.0);
    return pressure;
}

/******************************************************************************** */
/**
 * @description Buhlmann model 
 */
class ModelPoint {
    constructor(){
        this.tissues = [];
        this.ceilings = [];
        // create tissue compartments
        for (let index = 0; index < COMPS; index++ ) {
            this.newtc = new Compartment(index)
            this.tissues.push(this.newtc);
            this.ceilings.push(0.0);
        }
        this.ambient = 0.0;
        this.leadMaxAmbBars = -100.0;

        this.gfNow = 1.0;
        this.leadTissue = -1;
        this.leadCeilingMeters = -100.0;
        this.leadCeilingStop = -1;
        this.leadCeilingBarsNitrogen = 0.0;
        this.leadCeilingBarsHelium = 0.0;
        this.maxNitrogenPressure = 0.0;
        this.maxHeliumPressure = 0.0;
        // store water vapor partial pressure
        this.waterVapor = WaterVaporSurface;
    }
    /* the methods */
    initSurface(){
        for (let index = 0; index < COMPS; index++ )  {
            this.tissues[index].setNewPressures(ZHL16c[index], 0.0, initN2);
            //** workaround to insert NitrogenK and HeliumK to ZHL16c table */
            //** should add to that table as hard coded, this is wasteful */
            ZHL16c[index].NitrogenK = Math.log(2) / ZHL16c[index].NitrogenHT;
            ZHL16c[index].HeliumK = Math.log(2) / ZHL16c[index].HeliumHT;
        }
    }

    // this is the beef of the show, calculate all tissue compartments
    /**
     * 
     * @param {number} beginPressure 
     * @param {number} endPressure 
     * @param {number} intervalMinutes 
     * @param {number} heliumFraction 
     * @param {number} nitrogenFraction 
     * @param {number} gfNow 
     * @description calculates all tissue compartments
     */
    calculateAllTissues(
        beginPressure, endPressure,
        intervalMinutes,  // MINUTES !!
        heliumFraction, nitrogenFraction, gfNow)
    {
        let beginAmbientPressure = beginPressure;
        let endAmbientPressure = endPressure;
        let heliumInspired = (beginAmbientPressure - this.waterVapor) * heliumFraction;
        let nitrogenInspired = (beginAmbientPressure - this.waterVapor) * nitrogenFraction;
        let heliumBarPerMin = 0.0;
        let nitrogenBarPerMin = 0.0;

        if (beginPressure == endPressure) {
            // constant depth case, gas rate not changing
            heliumBarPerMin = 0.0;
            nitrogenBarPerMin = 0.0;
        } else {
            // ascending or descending, calculate BAR/min change rate for inert gases
            let barPerMin = (endPressure - beginPressure) / intervalMinutes;
            heliumBarPerMin = barPerMin * heliumFraction;
            nitrogenBarPerMin = barPerMin * nitrogenFraction;
        }
        // common part for constant depth & ascending or descending
        this.ambient = endAmbientPressure;
        // now iterate all tissue compartments
        let maxCeiling_now = -100.0;
        let maxHeliumP_now = 0.0;
        let maxNitrogenP_now = 0.0;
        this.gfNow = gfNow;

        for (let index = 0; index < COMPS; index++ ) {
            let compartment = this.tissues[index];
            let coefficients = ZHL16c[index];
            compartment.calculateCompartment(coefficients, heliumInspired, nitrogenInspired, heliumBarPerMin, nitrogenBarPerMin, intervalMinutes);
            compartment.ambTolP = compartment.ambientToleratedPressure(endAmbientPressure);
            // the actual ceiling to use, based on gfNow
            let maxAmbBars = compartment.get_max_amb(gfNow) - surfacePressure;
            let tcCeiling_now = pressure2depth(maxAmbBars);
            this.ceilings[index] = tcCeiling_now;
            // find out the leading tissue and record it
            if (tcCeiling_now > maxCeiling_now) {
                maxCeiling_now = tcCeiling_now;
                this.leadTissue = compartment.index;
                this.leadMaxAmbBars = maxAmbBars;
                this.leadCeilingMeters = maxCeiling_now;
                this.leadCeilingStop = (Math.ceil(maxCeiling_now / 3.0)) * 3.0;
                //this.leadCeilingBarsNitrogen = compartment.get_max_amb_n2(gfNow) - surfacePressure
                //this.leadCeilingBarsHelium =   compartment.get_max_amb_he(gfNow) - surfacePressure
                // search for maximum pressures
            }
            if (compartment.nitrogenPressure > maxNitrogenP_now) {
                maxNitrogenP_now = compartment.nitrogenPressure;
                this.maxNitrogenPressure = maxNitrogenP_now;
            }
            if (compartment.heliumPressure > maxHeliumP_now) {
                maxHeliumP_now = compartment.heliumPressure;
                this.maxHeliumPressure = maxHeliumP_now;
            }
        }
    }//calculateAllTissues
    
    calculateAllTissuesDepth(beginDepth, endDepth,
                            intervalMinutes, 
                            heliumFraction, nitrogenFraction, gfNow)
    // same as calculateAllTissues() but depths as arguments, instead of pressures
    // we calculate the pressures here and convert for the call
    {
        var beginPressure = depth2absolutePressure(beginDepth);
        var endPressure = depth2absolutePressure(endDepth);
        this.calculateAllTissues(beginPressure, endPressure, intervalMinutes, heliumFraction, nitrogenFraction, gfNow);
    } //calculateAllTissuesDepth

    /*** these methods might be obsolete and no longer needed ? */
    control_compartment(gradient){
        var control_compartment_number = 0;
        var max_pressure = 0.0;
        for (let index = 0; index < COMPS; index++ ) {
            var pressure = this.tissues[index].get_max_amb(gradient) - surfacePressure;
            if (pressure > max_pressure) {
                control_compartment_number = index;
                max_pressure = pressure;
            }
        }
        return control_compartment_number + 1;
    }//control_compartment

    ceiling(gradient){
        var pressure = 0.0;
        for (let index = 0; index < COMPS; index++ )  {
            // Get compartment tolerated ambient pressure and convert from
            // absolute pressure to depth
            var comp_pressure = this.tissues[index].get_max_amb(gradient) - surfacePressure;
            if (comp_pressure > pressure) {
                pressure = comp_pressure;
            }
        }
        return pressure2depth(pressure);
    }//ceiling

    ceiling_in_pabs(gradient){
        var pressure = 0.0;
        for (let index = 0; index < COMPS; index++ )  {
            // Get compartment tolerated ambient pressure and convert from
            // absolute pressure to depth
            var comp_pressure = this.tissues[index].get_max_amb(gradient);
            if (comp_pressure > pressure) {
                pressure = comp_pressure;
            }
        }
        return pressure;
    }//ceiling_in_pabs

    m_value(pressure){
        var p_absolute = pressure + surfacePressure;
        var compartment_mv = 0.0;
        var max_mv = 0.0;
        for (let index = 0; index < COMPS; index++ )  {
            compartment_mv = this.tissues[index].get_mv(p_absolute);
            if (compartment_mv > max_mv) {
                max_mv = compartment_mv;
            }
        }
        return max_mv;
    }// m_value

}// ModelPoint


/******************************************************************************** */
class Compartment {
        constructor(index){
            this.index = index;
            this.heliumPressure = 0.0;
            this.nitrogenPressure = 0.0;
            this.HeliumNitrogenA = 0.0;
            this.HeliumNitrogenB = 0.0;
            this.mv = 0.0;
            this.ambTolP = 0.0;
            this.const_exp_const_depth_he = null;
            this.const_exp_const_depth_n2 = null;
            this.old_k_he = null;
            this.old_seg_time = null;  
        }
        
    setNewPressures(coefficient, heliumPressure, nitrogenPressure){
        this.heliumPressure = heliumPressure;
        this.nitrogenPressure = nitrogenPressure;
        this.HeliumNitrogenA = (coefficient.HeliumA * heliumPressure + coefficient.NitrogenA * nitrogenPressure) / (heliumPressure + nitrogenPressure);
        this.HeliumNitrogenB = (coefficient.HeliumB * heliumPressure + coefficient.NitrogenB * nitrogenPressure) / (heliumPressure + nitrogenPressure);
        this.mv = this.get_mv(surfacePressure);
    }

    calculateCompartment(
        coefficient, heliumInspired, nitrogenInspired,
        heliumRate, nitrogenRate, minutes)
    {
        let heliumNewPressure = 0;
        let nitrogenNewPressure = 0;

        // first check if we are staying at constant depth or ascending/descending
        if (heliumRate != 0 && nitrogenRate != 0) {
            // ascending or descending -> we use Schreiner equation
            // heliumRate, nitrogenRate units are BAR/min
            heliumNewPressure = this.newPressureSchreiner(this.heliumPressure, coefficient.HeliumK, heliumInspired, heliumRate, minutes);
            nitrogenNewPressure = this.newPressureSchreiner(this.nitrogenPressure, coefficient.NitrogenK, nitrogenInspired, nitrogenRate, minutes);
        } else {
            // at constant depth -> we use simplified Haldane or the instantaneous equation
            // we can also reuse the previously calculated component, no need to calculate it again
            if (this.old_seg_time == null || this.old_seg_time != minutes) {
                this.old_seg_time = minutes;
                this.const_exp_const_depth_he = 1 - Math.exp(-coefficient.HeliumK * minutes);
                this.const_exp_const_depth_n2 = 1 - Math.exp(-coefficient.NitrogenK * minutes);
            }
            heliumNewPressure = this.heliumPressure + (heliumInspired - this.heliumPressure) * this.const_exp_const_depth_he;
            nitrogenNewPressure = this.nitrogenPressure + (nitrogenInspired - this.nitrogenPressure) * this.const_exp_const_depth_n2;
        }
        this.setNewPressures(coefficient, heliumNewPressure, nitrogenNewPressure);
    }

    newPressureSchreiner(
        oldPressure,
        constK,
        gasInspired,
        gasRate,
        minutes)
    {
        let pressure = gasInspired + gasRate * (minutes - 1.0 / constK) - (gasInspired - oldPressure - gasRate / constK) * Math.exp(-constK * minutes);
        return pressure;
    }

    ambientToleratedPressure(pressure){
        let m_value = (pressure) / (this.HeliumNitrogenB + this.HeliumNitrogenA);
        return m_value;
    }

    get_max_amb(gf){
        let maxAmb = (this.heliumPressure + this.nitrogenPressure - this.HeliumNitrogenA * gf) / (gf / this.HeliumNitrogenB - gf + 1.0);
        return maxAmb;
    }

    get_mv(p_amb){
        let mv = (this.heliumPressure + this.nitrogenPressure) / (p_amb / (this.HeliumNitrogenB + this.HeliumNitrogenA));
        return mv;
    }

} // Compartment