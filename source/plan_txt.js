const DecoStop = {
    depth : 0,
    runtime : 0,
    duration : 0,
    o2: 0,
    he: 0,
}

/**
 * 
 * @param {[]} decoStops 
 */
function plan_txt(decoStops, waypoints, tankList){
    // 2021-11-19 major refactoring: all time units are now MINUTES, seconds removed everywhere

    let txt = 'deco planner result:\n';

    for(idx=0; idx < waypoints.length; idx++){
        txt += waypoints[idx];
        txt += "\n";
    }
    txt += "\ngas usage:\n";    
    let tanktxt = "";
    for(idx=0; idx < tankList.length; idx++){
        if (tankList[idx].use){
            let t = tankList[idx];
            let tO2HE = `(${t.o2}/${t.he})`
            tanktxt = `${t.label.padEnd(6," ")} ${tO2HE.padEnd(7," ")} ${t.pressure.toFixed(0).padStart(3, " ")} bar at end\n`;
            txt += tanktxt;
        }

    }


    txt += "\ndeco stops:\n"+
        "STOP ,duration, runtime  , gas\n";
    let stopTxt = ' :-(';
    for(idx=0; idx < decoStops.length; idx++){
        if (decoStops[idx] ){
            let runtime = decoStops[idx].runtime;
            let depth = decoStops[idx].depth;
            let duration = decoStops[idx].duration;
            let o2 = decoStops[idx].o2;
            let he = decoStops[idx].he;
            let depth_padded = depth.toFixed(0).padStart(3, " ");
            let duration_padded = duration.toFixed(1).padStart(4, " ");

            //stopTxt = `@${runtime.toFixed(1)} min, ${depth_padded} m, ${duration_padded} min, gas ${o2}/${he}\n`;
            stopTxt = `${depth_padded} m,${duration_padded} min, @${runtime.toFixed(1)} min, ${o2}/${he}\n`;
        } else{
            stopTxt = '** empty stop record **\n';
        }
        txt += stopTxt;
    }
    return txt;
}