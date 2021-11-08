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
            tanktxt = `${t.label} (${t.o2}/${t.he}) ${t.pressure.toFixed(0)} bar at end\n`;
            txt += tanktxt;
        }

    }


    txt += "\ndeco stops:\n";
    let stopTxt = ' :-(';
    for(idx=0; idx < decoStops.length; idx++){
        if (decoStops[idx] ){
            let runtime = decoStops[idx].runtime/60;
            let depth = decoStops[idx].depth;
            let duration = decoStops[idx].duration/60;
            let o2 = decoStops[idx].o2;
            let he = decoStops[idx].he;

            stopTxt = `run ${runtime.toFixed(0)} min, ${depth.toFixed(0)} m, ${duration.toFixed(0)} min, gas ${o2}/${he}\n`;
        } else{
            stopTxt = '** empty stop record **\n';
        }
        txt += stopTxt;
    }
    return txt;
}