// tmxcalc.js
// modifed from my original C# source TmxCalcClass.cs
// which was a tranlation from Python source
// split the orginal function into two parts, this one doing just the math
// the other one to generate text output from the results

function tmxcalc_num(filltype, start_bar, start_o2, start_he, 
    stop_bar, stop_o2, stop_he, he_ignore, o2_ignore)
{
    var tmxResult = {
        "status_code" : 99,
        "status_txt" : "FATAL ERROR\n",
        add_air : 0,
        add_o2 : 0,
        add_he : 0,
        add_nitrox : 0,
        add_tmx : 0,
        tbar_2 : 0,
        tbar_3 : 0,
        tmx_preo2_pct : 0,
        tmx_o2_pct : 0,
        mix_o2_pct : 0,
        mix_he_pct :0,
        mix_n_pct : 0

    }
    // error checking for input values, anything wrong and we return an error & skip calculations
    const filltypes = new Set(["air", "nx", "tmx", "pp", "cfm" ]);
    if (filltypes.has(filltype) == false) {
        tmxResult.status_code = 10;
        tmxResult.status_txt = `ERROR>>  filltype not supported *${filltype}*\n`;
        return tmxResult;
    };
    if (start_bar < 0)
    {
        tmxResult.status_code = 11;
        tmxResult.status_txt = "ERROR>>  tank start pressure cannot be <0\n";
        return tmxResult;
    };
    if (stop_bar < 0)
    {
        tmxResult.status_code = 12;
        tmxResult.status_txt = "ERROR>>  tank end pressure cannot be <0\n";
        return tmxResult;
    };
    if (start_bar > 300)
    {
        tmxResult.status_code = 13;
        tmxResult.status_txt = "ERROR>>  tank start pressure in Bar cannot be > 300\n";
        return tmxResult;
    };
    if (stop_bar > 301)
    {
        tmxResult.status_code = 14;
        tmxResult.status_txt = "ERROR>>  tank end pressure in Bar cannot be > 300\n";
        return tmxResult;
    };

    if (stop_bar <= start_bar)
    {
        tmxResult.status_code = 15;
        tmxResult.status_txt = "ERROR>>  wanted tank end pressure must be higher than start pressure\n";
        return tmxResult;
    };
    if (start_o2 < 0)
    {
        tmxResult.status_code = 16;
        tmxResult.status_txt = "ERROR>>  starting oxygen content cannot be <0%\n";
        return tmxResult;
    };
    if (start_he < 0)
    {
        tmxResult.status_code = 17;
        tmxResult.status_txt = "ERROR>>  starting helium content cannot be <0%\n";
        return tmxResult;
    };
    if (stop_o2 < 0)
    {
        tmxResult.status_code = 18;
        tmxResult.status_txt = "ERROR>>  wanted oxygen content cannot be <0%\n";
        return tmxResult;
    };
    if (stop_he < 0)
    {
        tmxResult.status_code = 19;
        tmxResult.status_txt = "ERROR>>  wanted helium content cannot be <0%\n";
        return tmxResult;
    };
    if (start_o2 > 100)
    {
        tmxResult.status_code = 20;
        tmxResult.status_txt = "ERROR>>  starting oxygen content cannot be >100%\n";
        return tmxResult;
    };
    if (start_he > 100)
    {
        tmxResult.status_code = 21;
        tmxResult.status_txt = "ERROR>>  starting helium content cannot be >100%\n";
        return tmxResult;
    };
    if (stop_o2 > 100)
    {
        tmxResult.status_code = 22;
        tmxResult.status_txt = "ERROR>>  wanted oxygen content cannot be >100%\n";
        return tmxResult;
    };
    if (stop_he > 100)
    {
        tmxResult.status_code = 23;
        tmxResult.status_txt = "ERROR>>  wanted helium content cannot be >100%\n";
        return tmxResult;
    };
    if (start_o2 + start_he > 100)
    {
        tmxResult.status_code = 24;
        tmxResult.status_txt = "ERROR>>  starting O2 + He percentage cannot exceed 100%\n";
        return tmxResult;
    };
    if (stop_o2 + stop_he > 100)
    {
        tmxResult.status_code = 25;
        tmxResult.status_txt = "ERROR>>  wanted O2 + He percentage cannot exceed 100%\n";
        return tmxResult;
    };

    // check if filling just air
    if (filltype == "air")
    {
        o2_ignore = true;
        he_ignore = true;
    }
    // check if filling just Nitrox
    if (filltype == "nx")
    {
        he_ignore = true;
    }
    ///////////// do the calculations
    start_he_bar = start_bar * start_he / 100; // how many bars Helium in tank at start?
                                                // two cases: for plain Nitrox and actual Trimix fill
    if (he_ignore)
    {
        // calculate for Nitrox fill, igonore end_he target, no Helium is going in
        stop_he_bar = start_he_bar;             // not add any He, so at the end we have same He bar
        stop_he = 100 * start_he_bar / stop_bar; // % He after the tank is filled full
        add_he = 0;                            // no Helium will be added
    } // end he_ignore == True
    else
    {
        // calculate for a trimix fill, Helium is added
        stop_he_bar = stop_bar * stop_he / 100;   // how may bar He me want to have after fill
        add_he = stop_he_bar - start_he_bar;    // how many bar of He we need to add
    }// end else he_ignore == False

    // COMMON PART OF CALCULATIONS
    // tbar_2 is the tank pressure after we have filled Helium with PP method
    tbar_2 = start_bar + add_he;
    //if he_ignore : add_he=0, and then tbar_2 = start_bar

    // are we not adding any oxygen?
    if (o2_ignore)
    {
        add_air = stop_bar - start_bar;         // if o2_ignore then just top with air
        tbar_3 = start_bar;
        add_o2 = 0;
    }
    else
    {
        // how many bar of air we must top after Helium and Oxygen are in
        add_air = ((stop_bar * (1 - stop_he / 100 - stop_o2 / 100)
                - start_bar * (1 - start_o2 / 100 - start_he / 100)) / 0.79);
        tbar_3 = stop_bar - add_air;                // tbar_3 is pressure after He+O2 is in before topping air
        add_o2 = tbar_3 - tbar_2;                  // how many bar O2 we need to fill before air
    }// end else
    start_o2_bar = start_bar * start_o2 / 100;     // how many bars O2 in tank at start?

    // we have now calculated all output needed for pp fill case
    // now we can verify the end mix, we can later check if we get what we want
    mix_o2_pct = (100 * (start_o2_bar + add_o2 + add_air * 0.21) / stop_bar);
    mix_he_pct = 100 * (start_he_bar + add_he) / stop_bar;
    mix_n_pct = 100 - mix_he_pct - mix_o2_pct;
    // additional output needed for cfm fill case
    add_nitrox = stop_bar - tbar_2;              // bars of Nitrox after Helium is in
    stop_o2_bar = stop_bar * stop_o2 / 100;       // bars of Oxygen that the Nitrox needs to contain
    nitrox_pct = 100 * ((stop_o2_bar - start_o2_bar) / add_nitrox); // %O2 of the Nitrox needed
                                                                    // additional output needed for tmx fill case
    add_tmx = stop_bar - start_bar;             // bars of TMX mix we need to fill
    tmx_he_pct = 100 * (stop_he_bar - start_he_bar) / add_tmx;  // %He that the TMX needs to have
    tmx_o2_pct = 100 * (stop_o2_bar - start_o2_bar) / add_tmx;  // %O2 that the TMX needs to have
    tmx_preo2_pct = tmx_o2_pct * ((100 - tmx_he_pct) / 100);   // what the O2 analyzer shows at start


    // error checking for results, anything wrong and we return error code
    if ((filltype == "cfm" | filltype == "nx") & nitrox_pct < 21)
    {
        tmxResult.status_code = 52;
        tmxResult.status_txt = `ERROR: Nitrox CFM O2% <21% cannot be made!\n` +
                               ` - would require ${nitrox_pct}% O2 CFM input\n`;
        return tmxResult;
    };
    if ((filltype == "cfm" | filltype == "nx") & nitrox_pct > 36)
    {
        tmxResult.status_code = 53;
        tmxResult.status_txt =
            "ERROR: Nitrox CFM O2% >36% cannot be made!\n" +
            ` - would require ${nitrox_pct}% O2 CFM input\n`;
        return tmxResult;
    };

    if (filltype == "tmx" & tmx_he_pct > 36)
    {
        tmxResult.status_code = 54;
        tmxResult.status_txt = "ERROR: Trimix CFM Helium % >36% cannot be made!\n";
        return tmxResult;
    };
    if (filltype == "tmx" & tmx_o2_pct > 36)
    {
        tmxResult.status_code = 55;
        tmxResult.status_txt = "ERROR: Trimix CFM where Oxygen % >36% cannot be made!\n";
        return tmxResult;
    };
    if (filltype == "tmx" & tmx_preo2_pct < 12)
    {
        tmxResult.status_code = 56;
        tmxResult.status_txt = "ERROR: Trimix CFM where Oxygen % <18% cannot be made!\n";
        return tmxResult;
    };

    // impossible mixes
    if (add_he < 0)
    {
        tmxResult.status_code = 61;
        tmxResult.status_txt =
        "ERROR: Blending this mix is not possible!\n" +
        " negative Helium \n" +
        `<add_he ${add_he}, add_o2 ${add_o2}, add_air ${add_air}> \n`;
        return tmxResult;
    };
    if (add_o2 < 0)
    {
        tmxResult.status_code = 62;
        tmxResult.status_txt =
        "ERROR: Blending this mix is not possible!\n" +
        ` - starting O2% is ${start_o2}% and you want ${stop_o2}% \n` +
        ` - removing ${add_o2} bar O2 is not possible \n`;
        return tmxResult;
    };
    if (add_air < 0)
    {
        tmxResult.status_code = 63;
        tmxResult.status_txt =
        "ERROR: Blending this mix is not possible!\n" +
        " negative Air \n" +
        "<add_he {add_he}, add_o2 {add_o2}, add_air {add_air}> \n";
        return tmxResult;
    };
    // all tests have passed so we return values of the calculation
    tmxResult.status_code = 0;
    tmxResult.status_txt = `ok\nair: ${add_air.toFixed(1)} o2: ${add_o2.toFixed(1)} he: ${add_he.toFixed(1)}\n`+
        `nx: ${add_nitrox.toFixed(1)} tmx: ${add_tmx.toFixed(1)}`;
    tmxResult.add_air = add_air;
    tmxResult.add_o2 = add_o2;
    tmxResult.add_he = add_he;
    tmxResult.add_nitrox = add_nitrox;
    tmxResult.add_tmx = add_tmx;
    tmxResult.tbar_2 = tbar_2;
    tmxResult.tbar_3 = tbar_3;
    tmxResult.tmx_preo2_pct = tmx_preo2_pct;
    tmxResult.tmx_o2_pct = tmx_o2_pct;
    tmxResult.mix_o2_pct = mix_o2_pct;
    tmxResult.mix_he_pct = mix_he_pct;
    tmxResult.mix_n_pct = mix_n_pct;
    return tmxResult;
}

function tmxcalc_text(filltype, start_bar, start_o2, start_he,
    mix_o2_pct, mix_he_pct, mix_n_pct,
    add_o2, add_he, add_air,
    tbar_3, stop_bar,
    )
{
    // initial strings to use later    
    if (add_he > 0)
    {
        he_fill = `From ${start_bar.toFixed(1)} bars add ${add_he.toFixed(1)} bar Helium,`;
    }
    else
    {
        he_fill = " - no helium added";
    }
    if (add_o2 > 0)
    {
        o2_fill = `From ${tbar_2.toFixed(1)} bars add ${add_o2.toFixed(1)} bar Oxygen,`;
    }
    else
    {
        o2_fill = " - no oxygen added";
    }
    if (add_nitrox > 0)
    {
        nitrox_fill = `From ${tbar_2.toFixed(1)} bars add ${add_nitrox.toFixed(1)} bar ${nitrox_pct.toFixed(1)}% NITROX BY CFM,`;
    }
    else
    {
        nitrox_fill = " - no Nitrox added";
    }
    if (add_tmx > 0)
    {
        tmx_fill = `From ${start_bar.toFixed(1)} bars add ${add_tmx.toFixed(1)} bar ${tmx_o2_pct.toFixed(1)}/${tmx_he_pct.toFixed(1)} TRIMIX BY CFM,`;   
    }
    else
    {
        tmx_fill = " - no Trimix added";
    }
    // start mix string
    if (start_bar > 0)
    {
        start_n2 = 100 - start_o2 - start_he;
        start_mix = `Starting from ${start_bar} bar with mix ${start_o2.toFixed(1)}/${start_he}/${start_n2.toFixed(0)} (O2/He/N).`;
    }
    else
        start_mix = "Starting from EMPTY TANK ";

    // result mix string
    result_mix = `Resulting mix will be ${mix_o2_pct.toFixed(0)}/${mix_he_pct.toFixed(0)}/${mix_n_pct.toFixed(0)} (O2/He/N).`;

    // sanity check, what are we actually making and what not
    if ((filltype == "tmx") && (add_he == 0))
    {
        filltype = "nx"; // NOT TRIMIX, just plain NX by CFM
    }
    if (add_o2 == 0 && add_he == 0)
    {
        filltype = "air"; // we are filling only air for sure
    }

    // finally build the output string 
    if (filltype == "air")
    {
        result = `${start_mix}\n` +
        "PLAIN AIR FILL:\n" +
        " - no Helium \n" +
        " - no extra Oxygen \n" +
        ` - From ${start_bar.toFixed(1)} bars add ${add_air.toFixed(1)} bar air to ${stop_bar.toFixed(1)} bar.  \n` +
        `${result_mix}\n`;
    }
    else if (filltype == "nx")
    {
        result = `${start_mix}\n` +
        "Nitrox CFM FILL:\n" +
        " - no Helium \n" +
        " - Oxygen enriched \n" +
        `${nitrox_fill} \n` +
        `${result_mix}\n`;
    }
    else if (filltype == "pp")
    {
        result = `${start_mix}\n` +
        "PARTIAL PRESSURE BLENDING:\n" +
        ` - ${he_fill}\n` +
        ` - ${o2_fill}\n` +
        ` - From ${tbar_3.toFixed(1)} bars add ${add_air.toFixed(1)} bar air to ${stop_bar.toFixed(1)} bar.  \n` +
        `${result_mix}\n`;
    }
    else if (filltype == "cfm")
    {
        result = `${start_mix}\n` +
        "Pure Helium + Nitrox CFM blending:\n" +
        ` - ${he_fill}\n` +
        ` - ${nitrox_fill}\n` +
        `${result_mix}\n`;
    }
    else if (filltype == "tmx")
    {
        result =
        `${start_mix}\n` +
        "TMX CFM blending:\n" +
        `${tmx_fill} \n` +
        ` - first open helium flow and adjust O2 to ${tmx_preo2_pct.toFixed(1)}% \n` +
        ` - then open oxygen flow and adjust O2 to ${tmx_o2_pct.toFixed(1)}% \n` +
        `${result_mix} \n`;
    }

    return result;
}