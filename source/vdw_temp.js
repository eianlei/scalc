/** (c) 2021 Ian Leiman, ian.leiman@gmail.com
 * vdw_calc_temp() a version of vdv_calc() that takes varying temperatures into account
 * whereas vdv_calc() assumes constant 20 C 
 */

/**
 * 
 * @param {*} start_bar 
 * @param {*} start_o2 
 * @param {*} start_he 
 * @param {*} want_bar 
 * @param {*} want_o2 
 * @param {*} want_he 
 * @param {*} volume 
 * @param {*} temp_start 
 * @param {*} temp_he 
 * @param {*} temp_o2 
 * @param {*} temp_air 
 * @param {*} temp_final 
 * @param {*} temp_use 
 * @returns 
 */
function vdw_calc_temp(
    start_bar = 0.0,
    start_o2 = 21.0,
    start_he = 35.0,
    want_bar = 200.0,
    want_o2 = 21.0,
    want_he = 35.0,
    volume = 12.0,
    temp_start = 20.0,
    temp_he = 30.0,
    temp_o2 = 40.0,
    temp_air = 50.0,
    temp_final = 20.0,
    temp_use = 10.0,
    )
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
        vdw_start_mols_all = vdw_solve_mols(start_bar, volume, start_o2_f, start_he_f, start_n2_f, temp_start);
        vdw_start_mols_o2 = vdw_start_mols_all * start_o2_f;
        vdw_start_mols_he = vdw_start_mols_all * start_he_f;
        vdw_start_mols_n2 = vdw_start_mols_all * start_n2_f;
    } else
    {
        // empty tank, just keep the 0 values we already declared
    }

    // how many mols of gas we want to have, in total and of each kind
    let vdw_want_mols_all = vdw_solve_mols(want_bar, volume, want_o2_f, want_he_f, want_n2_f, temp_final);
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
    var mix_helium_bars = vdw_solve_pressure(mix_he_mols_all, volume, mix_he_o2_f, mix_he_he_f, mix_he_n2_f, temp_he);
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
    var mix_oxygen_bars = vdw_solve_pressure(mix_o2_mols_all, volume, mix_o2_o2_f, mix_o2_he_f, mix_o2_n2_f, temp_o2);
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
    // calculate the actual pressure of the final wanted mix at expected temperature
    var air_bars = vdw_solve_pressure(vdw_want_mols_all, volume, want_o2_f, want_he_f, want_n2_f, temp_air);
    var final_bars = vdw_solve_pressure(vdw_want_mols_all, volume, want_o2_f, want_he_f, want_n2_f, temp_final);
    // then calculate the pressure when this gas is being used at begin of dive
    var dive_bars =  vdw_solve_pressure(vdw_want_mols_all, volume, want_o2_f, want_he_f, want_n2_f, temp_use);

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
    vdw_result.air_bars = air_bars;
    vdw_result.final_bars = final_bars;
    vdw_result.dive_bars =  dive_bars;
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
        start_mix = `At ${temp_start}°C, starting from ${start_bar} bar with mix ${start_o2.toFixed(0)}/${start_he.toFixed(0)} (O2/He).`;
    } else {
        start_mix = `Starting from EMPTY TANK `;
    };
    let result_mix = `Resulting mix will be ${want_o2.toFixed(0)}/${want_he.toFixed(0)} (O2/He).`;
    let he_fill;
    if (vdw_fill_he_bars > 0)
        { 
            he_fill = `From ${start_bar.toFixed(1)} bars add ${vdw_fill_he_bars.toFixed(1)} bar Helium,`+
            `temperature ${temp_start}°C -> ${temp_he}°C`; 
        }
    else 
        { 
            he_fill = "* no Helium added"; 
        };
    let o2_fill;
    if (vdw_fill_o2_bars > 0)
    { 
        o2_fill = `From ${mix_helium_bars.toFixed(1)} bars add ${vdw_fill_o2_bars.toFixed(1)} bar Oxygen,`+
        `temperature ${temp_he}°C -> ${temp_o2}°C`; 
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
        `- From ${mix_oxygen_bars.toFixed(1)} bars add ${vdw_fill_air_bars.toFixed(1)} bar air to ${air_bars.toFixed(1)} bar,`+
                    `temperature ${temp_he}°C -> ${temp_air}°C\n`+
        `${result_mix}\n`+
        `after cooling down to ${temp_final}°C tank pressure is ${final_bars.toFixed(0)} bar\n`+
        `at begin of dive at ${temp_use}°C tank pressure is ${dive_bars.toFixed(0)} bar\n`;

    vdw_result.status_txt = result;
    vdw_result.status_code = 0;
    return vdw_result;
}