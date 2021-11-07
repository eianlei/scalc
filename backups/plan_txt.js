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
function plan_txt(decoStops){

    let txt = 'deco planner result:\n';
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