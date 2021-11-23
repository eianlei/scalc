// (c) 2021 Ian Leiman, ian.leiman@gmail.com
// vanderwaals.js 
// GNU General Public License v3.0
// use at your own risk, no guarantees, no liability!
// github project .....
// javascript functions:
//    vdw_calc() calculates trimix blending using Van der Waals gas law instead of ideal gas law
//    this is a quick and dirty implementation that needs more testing
//    and there is no error checking what so ever, so crashes are more than likely
// originally coded in Python, then ported to C#, then to this Javascript implementation
// a tricky part in this is solving the cubic Van der Waals equation
// PYTHON version used fsolve() from scipy library = scipy.optimize.fsolve;
// C# version used RootFinding.Bisect(), 
// Javascript version uses RootFindingBisect(), which I ported from C# to JS
// 

const R = 0.0831451;
const ABSOLUTE_ZERO = -273.15;

/**
 * 
 * @param {*} n 
 * @param {*} V 
 * @param {*} T 
 * @returns 
 */
function ideal_gas_p( n,  V,  T)
{
    return n * R * T / V;
}

/**
 * 
 * @param {*} p 
 * @param {*} V 
 * @param {*} T 
 * @returns 
 */
function ideal_gas_n( p,  V,  T)
{
    return p * V / (R * T);
}

// implementation of the Van der Waals equation
// https://en.wikipedia.org/wiki/Van_der_Waals_equation
class VdW_equation
{
    constructor ( p,  n,  V,  T,  a,  b)
    {
        this.p = p;
        this.n = n;
        this.V = V;
        this.T = T;
        this.a = a;
        this.b = b;
        // we are using the methods are higher order functions
        // and therefore we need this binding
        this.solve_pressure = this.solve_pressure.bind(this);
        this.solve_mols = this.solve_mols.bind(this);
        //this.a = this.a.bind(this);
    }
    solve_pressure( pressure)
    {
        let f = (pressure + this.n * this.n * this.a / 
            (this.V * this.V)) * (this.V - this.n * this.b) 
            - this.n * R * this.T;
        return f;
    }
    solve_mols( mols)
    {
        let f = (this.p + mols * mols * this.a / 
            (this.V * this.V)) * (this.V - mols * this.b) 
            - mols * R * this.T;
        return f;
    }
}// class VdW_equation

//  calculate vdw coefficients a and b for a mix of O2, N2, He
//     input the fractions of each gas, return tuple [mix_a, mix_b]
/**
 * 
 * @param {*} o2_f 
 * @param {*} he_f 
 * @param {*} n2_f 
 * @returns [mix_a, mix_b]
 */    
function vdw_mix_ab( o2_f,  he_f,  n2_f)
{
    let mix_a = 0.0;
    let mix_b = 0.0;
    let x = [ o2_f,   n2_f,   he_f  ];
    // constants: https://en.wikipedia.org/wiki/Van_der_Waals_constants_(data_page)
    //      [Oxygen, Nitrogen,Helium]
    let a = [1.38200, 1.3700, 0.0346 ];
    let b = [0.03186, 0.0387, 0.0238 ];
    // formula: https://en.wikipedia.org/wiki/Van_der_Waals_equation#Gas_mixture
    for (let i=0; i<3; i++)
    {
        for (let j=0; j<3; j++)
        {
            mix_a += Math.sqrt(a[i] * a[j]) * x[i] * x[j];
            mix_b += Math.sqrt(b[i] * b[j]) * x[i] * x[j];
        }
    }
    let result = [mix_a, mix_b];
    return result;
}

// 
//     returns the pressure of a gas mixture of o2, he, n2 by solving Van der Waals equation
//     given mols, volume and temperature in Celsius
/**
 * 
 * @param {*} mols 
 * @param {*} volume 
 * @param {*} o2_f 
 * @param {*} he_f 
 * @param {*} n2_f 
 * @param {*} temperature 
 * @returns 
 */    
function vdw_solve_pressure(
    mols,
    volume,
    o2_f,
    he_f,
    n2_f,
    temperature)
{
    let temp_K = temperature - ABSOLUTE_ZERO;
    let [mix_a, mix_b] = vdw_mix_ab(o2_f, he_f, n2_f);
    let seed_p = ideal_gas_p(mols, volume, temp_K);
    let solved_p = 0;

    // CREATE a Van Der Waals equation instance
    vdw_eq = new VdW_equation(seed_p, mols, volume, temp_K, mix_a, mix_b);
    try
    {
        // solve the equation root by using Bisect
        solved_p = RootFindingBisect(vdw_eq.solve_pressure, seed_p * 0.6, seed_p * 1.5, 0.001, 0.1);
    }
    catch (err)
    {
        solved_p = -1;
        console.log(err);
    }

    return solved_p;
}



// 
//     returns the total mols in a gas mixture of o2, he, n2 by solving Van der Waals equation
//     given pressure, volume and temperature in Celsius
/**
 * 
 * @param {*} pressure 
 * @param {*} volume 
 * @param {*} o2_f 
 * @param {*} he_f 
 * @param {*} n2_f 
 * @param {*} temperature 
 * @returns 
 */     
function vdw_solve_mols(
    pressure,
    volume,
    o2_f,
    he_f,
    n2_f,
    temperature)
{
    var temp_K = temperature - ABSOLUTE_ZERO;
    var [mix_a, mix_b] = vdw_mix_ab(o2_f, he_f, n2_f);
    var seed_n = ideal_gas_n(pressure, volume, temp_K);


    let vdw_eq = new VdW_equation(pressure, seed_n, volume, temp_K, mix_a, mix_b);
    //TODO: add try cath exception here
    let solved_n = RootFindingBisect(vdw_eq.solve_mols, seed_n * 0.6, seed_n *1.5, 0.001, 0.1);
    return solved_n;
}

/**
 * 
 */    
const VdW_Result =
{
    status_code : 0,
    status_txt : "",
    fill_o2_bars :0,
    fill_he_bars :0,
    fill_air_bars :0,
}

/**
 * calculates a partial pressure gas fill using Van der Waals gas law
 * @param {*} start_bar 
 * @param {*} want_bar 
 * @param {*} start_o2 
 * @param {*} start_he 
 * @param {*} want_o2 
 * @param {*} want_he 
 * @param {*} volume 
 * @param {*} start_temp_c 
 * @returns 
 */     
function vdw_calc(
    start_bar = 0.0,
    start_o2 = 21.0,
    start_he = 35.0,
    want_bar = 200.0,
    want_o2 = 21.0,
    want_he = 35.0,
    volume = 12.0,
    start_temp_c = 20.0)
{
    let vdw_result = Object.create(BlenderState);
    vdw_result.status_code = 99;
    vdw_result.status_txt = "FATAL ERROR\n";

    let vdw_start_mols_all = 0;
    let vdw_start_mols_o2 = 0;
    let vdw_start_mols_he = 0;
    let vdw_start_mols_n2 = 0;
    let vdw_want_mols_o2 = 0;
    let vdw_want_mols_he = 0;
    let vdw_want_mols_n2 = 0;

    // assume end temperature is same as start, could change this later to make things more complicated
    let end_temp_c = start_temp_c;

    // convert percentages to fractions (_f)
    let start_o2_f = start_o2 / 100.0;
    let start_he_f = start_he / 100.0;
    let start_n2_f = 1.0 - start_o2_f - start_he_f;
    let want_o2_f = want_o2 / 100.0;
    let want_he_f = want_he / 100.0;
    let want_n2_f = 1.0 - want_o2_f - want_he_f;

    // some basic sanity checks
    if (want_o2==21 & want_he == 0)
    {
        vdw_result.status_txt = "ERROR 01: just filling air";
        vdw_result.status_code = 1;
        return vdw_result;
    }

    // how many mols of gas we have at start, in total and of each kind
    if (start_bar > 0)  // vdw_solve_mols() will crash if you try with 0 bars
    {
        vdw_start_mols_all = vdw_solve_mols(start_bar, volume, start_o2_f, start_he_f, start_n2_f, start_temp_c);
        vdw_start_mols_o2 = vdw_start_mols_all * start_o2_f;
        vdw_start_mols_he = vdw_start_mols_all * start_he_f;
        vdw_start_mols_n2 = vdw_start_mols_all * start_n2_f;
    } else
    {
        // empty tank, just keep the 0 values we already declared
    }

    // how many mols of gas we want to have, in total and of each kind
    let vdw_want_mols_all = vdw_solve_mols(want_bar, volume, want_o2_f, want_he_f, want_n2_f, end_temp_c);
    //TODO: error checking to be nicer
    if (vdw_want_mols_all > 0)
    {
        vdw_want_mols_o2 = vdw_want_mols_all * want_o2_f;
        vdw_want_mols_he = vdw_want_mols_all * want_he_f;
        vdw_want_mols_n2 = vdw_want_mols_all * want_n2_f;
    } else
    {
        vdw_result.status_txt = "ERROR 11: vdw_want_mols_all";
        vdw_result.status_code = 11;
        return vdw_result;
    }

    // how many mols we need to fill
    let vdw_fill_mols_all = vdw_want_mols_all - vdw_start_mols_all;
    let vdw_fill_mols_o2 = vdw_want_mols_o2 - vdw_start_mols_o2;
    let vdw_fill_mols_he = vdw_want_mols_he - vdw_start_mols_he;
    let vdw_fill_mols_n2 = vdw_want_mols_n2 - vdw_start_mols_n2;

    // first stage of filling is by helium, and we get a new mix "mix_he"
    var mix_he_mols_all = vdw_start_mols_all + vdw_fill_mols_he;
    var mix_he_o2_f = vdw_start_mols_o2 / mix_he_mols_all;
    var mix_he_he_f = vdw_want_mols_he / mix_he_mols_all;
    var mix_he_n2_f = 1.0 - mix_he_o2_f - mix_he_he_f;

    // then solve for pressure of this new mix
    var mix_helium_bars = vdw_solve_pressure(mix_he_mols_all, volume, mix_he_o2_f, mix_he_he_f, mix_he_n2_f, start_temp_c);
    //TODO: more error checking needed here
    var vdw_fill_he_bars = mix_helium_bars - start_bar;
    if (vdw_fill_he_bars < 0) 
    {
        vdw_result.status_txt = "ERROR 12: negative Helium fill";
        vdw_result.status_code = 12;
        return vdw_result;
    }

    // air is topped last, but we need to calculate how much we need it, so we can calculate for oxygen
    var air_o2_mols_o2 = vdw_fill_mols_n2 * (0.21 / 0.79);
    var mix_o2_mols_o2 = vdw_fill_mols_o2 - air_o2_mols_o2;
    var mix_o2_mols_all = mix_he_mols_all + mix_o2_mols_o2;
    var mix_o2_o2_f = (mix_o2_mols_o2 + vdw_start_mols_o2) / mix_o2_mols_all;
    var mix_o2_he_f = vdw_want_mols_he / mix_o2_mols_all;
    var mix_o2_n2_f = 1.0 - mix_o2_o2_f - mix_o2_he_f;

    // then solve for pressure of this new mix
    var mix_oxygen_bars = vdw_solve_pressure(mix_o2_mols_all, volume, mix_o2_o2_f, mix_o2_he_f, mix_o2_n2_f, start_temp_c);
    //TODO: error checking needed here
    var vdw_fill_o2_bars = mix_oxygen_bars - mix_helium_bars;
    if (vdw_fill_o2_bars < 0)
    {
        vdw_result.status_txt = "ERROR 13: negative Oxygen fill";
        vdw_result.status_code = 13;
        return vdw_result;
    }

    // finally air
    var vdw_fill_air_bars = want_bar - mix_oxygen_bars;

    // update the results
    vdw_result.add_he = vdw_fill_he_bars;
    vdw_result.add_o2 = vdw_fill_o2_bars;
    vdw_result.add_air = vdw_fill_air_bars;
    vdw_result.start_bar_in = start_bar;
    vdw_result.start_o2_in = start_o2; 
    vdw_result.start_he_in = start_he; 
    vdw_result.stop_o2_in = want_o2; 
    vdw_result.stop_he_in = want_he;
    vdw_result.start_n2_in = 100 - start_o2 - start_he;
    vdw_result.stop_bar_in = want_bar;
    vdw_result.tank_liters = volume;
    vdw_result.tbar_2 = mix_helium_bars;
    vdw_result.tbar_3 = mix_oxygen_bars;
    vdw_result.mix_o2_pct = want_o2, // final mix O2 %
    vdw_result.mix_he_pct = want_he, // final mix He %
    vdw_result.mix_n2_pct = 100-want_o2-want_he, // final mix N2 %
    // 
    vdw_result.t2_o2_pct = mix_he_o2_f *100; // tbar_2 mix O2 %
    vdw_result.t2_he_pct = mix_he_he_f *100; // tbar_2 mix He %
    vdw_result.t2_n2_pct = mix_he_n2_f *100; // tbar_2 mix N2 %
    // 
    vdw_result.t3_o2_pct = mix_o2_o2_f *100; // tbar_3 mix O2 %
    vdw_result.t3_he_pct = mix_o2_he_f *100; // tbar_3 mix He %
    vdw_result.t3_n2_pct = mix_o2_n2_f *100; // tbar_3 mix N2 %

    // build the string for return
    let start_mix;
    if (start_bar >0 ) {
        start_mix = `Starting from ${start_bar} bar with mix ${start_o2.toFixed(0)}/${start_he.toFixed(0)} (O2/He).`;
    } else {
        start_mix = `Starting from EMPTY TANK `;
    };
    let result_mix = `Resulting mix will be ${want_o2.toFixed(0)}/${want_he.toFixed(0)} (O2/He).`;
    let he_fill;
    if (vdw_fill_he_bars > 0)
        { 
            he_fill = `From ${start_bar.toFixed(1)} bars add ${vdw_fill_he_bars.toFixed(1)} bar Helium,`; 
        }
    else 
        { 
            he_fill = "* no Helium added"; 
        };
    let o2_fill;
    if (vdw_fill_o2_bars > 0)
    { 
        o2_fill = `From ${mix_helium_bars.toFixed(1)} bars add ${vdw_fill_o2_bars.toFixed(1)} bar Oxygen,`; 
    }
    else
    {
        o2_fill = `* no Oxygen added`;
    }

    let result =
        `${start_mix}\n` +
        `Van der Waals blend:\n` +
        `- ${he_fill}\n` +
        `- ${o2_fill}\n` +
        `- From ${mix_oxygen_bars.toFixed(1)} bars add ${vdw_fill_air_bars.toFixed(1)} bar air to ${want_bar.toFixed(1)} bar.  \n` +
        `${result_mix}\n`;

    vdw_result.status_txt = result;
    vdw_result.status_code = 0;
    return vdw_result;
}

// Python fsolve() not available, as we do not have scipy library in javascript as such
// instead use Bisect algorithm implementation in C#, reused from
// https://www.codeproject.com/Articles/79541/Three-Methods-for-Root-finding-in-C
// and converted here to Javascript
function RootFindingBisect(FunctionOfOneVariable, left, right, tolerance, target){
    let maxIterations = 50;
    let iterationsUsed = 0;
    let errorEstimate = Number.MAX_VALUE;
    if (tolerance <= 0.0)
    {
        let msg = string.Format(`Tolerance must be positive. Received ${tolerance}.`);
        throw (msg);
    }

    // Standardize the problem.  To solve f(x) = target,
    // solve g(x) = 0 where g(x) = f(x) - target.
    function g(x){ return ( FunctionOfOneVariable(x) -target)};
    //FunctionOfOneVariable g = delegate (double x) { return f(x) - target; };


    let g_left = g(left);  // evaluation of f at left end of interval
    let g_right = g(right);
    let mid;
    let g_mid;
    if (g_left * g_right >= 0.0)
    {
        let str = "Invalid starting bracket. Function must be above target on one end and below target on other end.";
        throw (str);
    }

    let intervalWidth = right - left;

    for(
        let iterationsUsed = 0;
        (iterationsUsed < maxIterations) && (intervalWidth > tolerance);
        iterationsUsed++
    )
    {
        intervalWidth *= 0.5;
        mid = left + intervalWidth;

        if ((g_mid = g(mid)) == 0.0)
        {
            errorEstimate = 0.0;
            return mid;
        }
        if (g_left * g_mid < 0.0)           // g changes sign in (left, mid)    
            g_right = g(right = mid);
        else                            // g changes sign in (mid, right)
            g_left = g(left = mid);
    }
    errorEstimate = right - left;
    return left; 

}