/** (c) 2021 Ian Leiman, ian.leiman@gmail.com
* blender.js
* 
*/
function inputVal(id) {
    return document.getElementById(id).value;
}
function setInputVal(id, value) {
    document.getElementById(id).value = value;
}
function setText(id, text) {
    document.getElementById(id).textContent = text;
}
function onClassChange(className, handler) {
    document.querySelectorAll("." + className).forEach(function (el) {
        el.addEventListener("change", handler);
    });
}

let global_result;
var filltype = "pp";
var algorithm = "IDG";
// always run the whole show once with defaults
calculateBlend();

function openCost(){
    document.getElementById("blender_cost").style.display = "block";
    document.getElementById("blender_main").style.display = "none";
    document.getElementById("blender_sources").style.display = "none";
    doCost();
};

function openSources(){
    document.getElementById("blender_sources").style.display = "block";
    document.getElementById("blender_main").style.display = "none";
    document.getElementById("blender_cost").style.display = "none";
};

/**
 * 
 */
function doCost(){
    let liters = parseInt(inputVal("tank_liters"));
    let o2_price_eur = parseInt(inputVal("o2_price"));
    let he_price_eur = parseInt(inputVal("he_price"));
    let fill_price_eur = parseInt(inputVal("c_price"));
    // update the global state object for destination tank size
    global_result.tank_liters = liters;
    let txt;
    let total_cost;
    [total_cost, txt] = calculateCost(
        liters, 
        fill_bar = parseInt(inputVal("end_bar")), 
        global_result.add_o2, 
        global_result.add_he, 
        o2_price_eur, he_price_eur, fill_price_eur
        );
    setInputVal("cost_output", txt);    
    do_O2_storage();
    do_He_storage();
    do_compressor();
};

function back2blender(){
        document.getElementById("blender_cost").style.display = "none";
        document.getElementById("blender_sources").style.display = "none";
        document.getElementById("blender_main").style.display = "block";
};
    
    
function calculateBlend()
{
    let start_bar =    parseInt(inputVal("start_bar"));
    let end_bar =      parseInt(inputVal("end_bar"));
    let start_o2_pct = parseInt(inputVal("start_o2_pct"));
    let start_he_pct = parseInt(inputVal("start_he_pct"));
    let end_o2_pct =   parseInt(inputVal("end_o2_pct"));
    let end_he_pct =   parseInt(inputVal("end_he_pct"));
    let liters = parseInt(inputVal("tank_liters")); 
    let result;
    // filltype = "pp";
    // filltype = document.getElementById("ddl_ft").value;
    
    // let deb_txt =  `calculateBlend ${start_bar} ${end_bar} ${start_o2_pct} ${start_he_pct} ${end_o2_pct} ${end_he_pct}`;
    // console.log(filltype);
    // setInputVal("text_output", deb_txt);
    // just trying this out
    if (filltype == "pp" && algorithm== "VdW1") {
        result = vdw_calc(start_bar, start_o2_pct, start_he_pct, 
            end_bar, end_o2_pct, end_he_pct, liters, 20.0);
        setInputVal("text_output", result.status_txt);
        global_result = result;
    } else if (filltype == "pp" && algorithm== "VdW2") {
        let temp_start =    parseInt(inputVal("temp_start"));
        let temp_he    =    parseInt(inputVal("temp_he"));
        let temp_o2    =    parseInt(inputVal("temp_o2"));
        let temp_air   =    parseInt(inputVal("temp_air"));
        let temp_final =    parseInt(inputVal("temp_final"));
        let temp_use   =    parseInt(inputVal("temp_use"));

        result = vdw_calc_temp(start_bar, start_o2_pct, start_he_pct, 
            end_bar, end_o2_pct, end_he_pct, liters, temp_start,
            temp_he, temp_o2, temp_air, temp_final, temp_use);
        setInputVal("text_output", result.status_txt);
        global_result = result;


    } else {
        result = tmxcalc_num(filltype, start_bar, start_o2_pct, start_he_pct, 
            end_bar, end_o2_pct, end_he_pct, false, false);
            global_result = result;
        if (result.status_code == 0) {
            result_txt = tmxcalc_text(result);
            setInputVal("text_output", result_txt);
        }
        else {
            setInputVal("text_output", result.status_txt);
        }
    }


    drawFillProfile(result);
    do_O2_storage();
    do_He_storage();
    do_compressor();
} 
        
onClassChange("input2", calculateBlend);
onClassChange("in_cost", doCost);
onClassChange("o2_storage", do_O2_storage);
onClassChange("He_storage", do_He_storage);
onClassChange("compressor", do_compressor);

function do_O2_storage(){
    let liters = parseInt(inputVal("tank_liters")); 
    let add_o2 = global_result.add_o2;
    let add_o2_liters = liters * add_o2;
    let o2_storage_liters = parseInt(inputVal("o2_storage_liters"));
    let o2_storage_start = parseInt(inputVal("o2_storage_start"));
    let o2_storage_rate = parseInt(inputVal("o2_storage_rate"));
    let usage_bars = add_o2_liters / o2_storage_liters;
    let end_bars = o2_storage_start - usage_bars;
    let time = add_o2 / o2_storage_rate;
    let need = 0;

    switch (global_result.filltype_in){
        case "pp": 
            setText("o2_storage_use", `decanting to ${liters} liter tank `+
            `from ${global_result.tbar_2.toFixed(1)}`+
            ` to ${global_result.tbar_3.toFixed(1)} bar`);
            need = global_result.tbar_2 + usage_bars;
            setText("o2_storage_need", need.toFixed(1)); 
            setText("o2_storage_time", time.toFixed(1)); 
            break;
        case "air":
            setText("o2_storage_use", "not used");
            setText("o2_storage_need", "none"); 
            setText("o2_storage_time", "N/A"); 
            break;
        case "nx":
        case "tmx":
        case "cfm":
            setText("o2_storage_use", "continuous flow mix to compressor");
            need = usage_bars;
            setText("o2_storage_need", need.toFixed(1));         
            setText("o2_storage_time", "N/A"); 
            break;
    }

    setText("o2_storage_used", usage_bars.toFixed(1)); 
    setText("o2_storage_end", end_bars.toFixed(1)); 
}

function do_He_storage(){
    let liters = parseInt(inputVal("tank_liters")); 
    let add_He = global_result.add_he;
    let add_He_liters = liters * add_He;
    let He_storage_liters = parseInt(inputVal("He_storage_liters"));
    let He_storage_start = parseInt(inputVal("He_storage_start"));
    let He_storage_rate = parseInt(inputVal("He_storage_rate"));
    let usage_bars = add_He_liters / He_storage_liters;
    let end_bars = He_storage_start - usage_bars;
    let time = add_He / He_storage_rate;
    let need = 0;

    if ((global_result.filltype_in == "pp" || global_result.filltype_in == "cfm" )
        && usage_bars > 0) {
            setText("He_storage_use", `decanting to ${liters} liter tank `+
            `from ${global_result.start_bar_in.toFixed(1)}`+
            ` to ${global_result.tbar_2.toFixed(1)} bar`);
            need = global_result.start_bar_in + usage_bars;
            setText("He_storage_need", need.toFixed(1)); 
            setText("He_storage_time", time.toFixed(1)); 
    } else if (global_result.filltype_in ==  "air" || usage_bars == 0){
            setText("He_storage_use", "not used");
            setText("He_storage_need", "none"); 
            setText("He_storage_time", "N/A"); 
    } else if (global_result.filltype_in == "tmx"){
            setText("He_storage_use", "continuous flow mix to compressor");
            need = usage_bars;
            setText("He_storage_need", need.toFixed(1));         
            setText("He_storage_time", "N/A"); 
    }

    setText("He_storage_used", usage_bars.toFixed(1)); 
    setText("He_storage_end", end_bars.toFixed(1)); 
}

function do_compressor(){
    var rate = parseInt(inputVal("compressor_rate")); 
    let liters = parseInt(inputVal("tank_liters")); 
    //var delta = global_result.add_air;
    //var filled_liters = liters * delta;
    //var time = filled_liters / rate;

    if(global_result.filltype_in == "air" || global_result.filltype_in == "pp"){
        var delta = global_result.add_air;
        var filled_liters = liters * delta;
        setText("compressor_o2", "n/a");       
        setText("compressor_he", "n/a");       
    } else if (global_result.filltype_in == "nx" || global_result.filltype_in == "cfm") {
        var delta = global_result.add_nitrox;
        var filled_liters = liters * delta;
        var flow_o2 = rate * ((global_result.nitrox_pct -21) /100);
        setText("compressor_o2", flow_o2.toFixed(0));       
        setText("compressor_he", "n/a");  
    } else if (global_result.filltype_in == "tmx" ) {
        var delta = global_result.add_tmx;
        var filled_liters = liters * delta;
        var flow_o2 = rate * ((global_result.tmx_preo2_pct) /100);
        var flow_he = rate * (global_result.tmx_he_pct /100);
        setText("compressor_o2", flow_o2.toFixed(0));       
        setText("compressor_he", flow_he.toFixed(0));  
    }
    var time = filled_liters / rate;

    setText("compressor_delta", delta.toFixed(0)); 
    setText("compressor_tl", liters.toFixed(0)); 
    setText("compressor_time", time.toFixed(1)); 
};
        
// dropdown menu for ft filltype selection
document.getElementById("ddl_ft").addEventListener("change", function () {
    dropval = this.value;
    console.log(`ddl_ft ${dropval} `);
    filltype = dropval;
    calculateBlend();
});

// dropdown menu for start gas  
document.getElementById("dd_startGas").addEventListener("change", function () {
    var dropTxt = this.value;
    var gases = dropTxt.split('/');
    setInputVal("start_o2_pct", gases[0]);
    setInputVal("start_he_pct", gases[1]);
    calculateBlend();
});

// dropdown menu for wanted gas  
document.getElementById("dd_wantedGas").addEventListener("change", function () {
    var dropTxt = this.value;
    var gases = dropTxt.split('/');
    setInputVal("end_o2_pct", gases[0]);
    setInputVal("end_he_pct", gases[1]);
    calculateBlend();
});

// dropdown menu for end_bar  
document.getElementById("dd_end_bar").addEventListener("change", function () {
    var dropTxt = this.value;
    setInputVal("end_bar", parseInt(dropTxt));
    
    calculateBlend();
});

// dropdown menu for algorithm  
document.getElementById("ddl_algorithm").addEventListener("change", function () {
    var dropTxt = this.value;
    algorithm = dropTxt;
    
    calculateBlend();
});

// from button EMPTY tank
function emptyTank(){
    setInputVal("start_bar", 1);
    setInputVal("start_o2_pct", 21);
    setInputVal("start_he_pct", 0);
    setInputVal("dd_startGas", "21/0");
    calculateBlend();
};
    
function calculateCost(
    liters, fill_bar, add_o2, add_he, o2_cost_eur, he_cost_eur, fill_cost_eur)
    {
        // cost calculation
        let o2_lit = liters * fill_bar * (add_o2 / fill_bar);
        let he_lit = liters * fill_bar * (add_he / fill_bar);
        let o2_eur = o2_lit * o2_cost_eur / 1000;
        let he_eur = he_lit * he_cost_eur / 1000;
        let total_cost = fill_cost_eur + o2_eur + he_eur;
        let txt = 
        "Total cost of the fill is:\n"+
        `${total_cost.toFixed(2)} EUR\n`+
        `- ${o2_lit.toFixed(0)} liters Oxygen costing ${o2_eur.toFixed(2)} EUR\n`+
        `- ${he_lit.toFixed(0)} liters Helium costing ${he_eur.toFixed(2)} EUR\n`+ 
        `- cfm/air fill costing ${fill_cost_eur.toFixed(2)} EUR\n`;

        // return the results
        return [total_cost, txt];
    }
        
/**
* 
*/
function drawFillProfile(result){
    var c = document.getElementById("bProfCanvas");
    var cTXT = document.getElementById("pProfCanvas_txt");
    let pw = c.width -50;
    let ph = c.height -15
    var ctx = c.getContext("2d");
    var ctxTXT = cTXT.getContext("2d");
    ctx.font = '9px Arial';
    ctx.fillStyle = "black";
    ctx.globalAlpha = 0.8;
    
    // clear out previous plots
    ctx.clearRect(0,0, c.width, c.height);
    if (result.status_code > 0){
        ctx.font = '20px Arial';
        ctx.fillStyle = "red";
        ctx.fillText(`ERROR`, 50, 100);
        return;
    }
    
    var tx = [ 0 , 40, 80,120,170,210,270,320,320]; 
    switch (result.filltype_in){
        case "air":
        ctx.fillText(`plain air fill`, tx[1]+2, 15);
        var steps = [0, 3];
        var divs = [tx[1], tx[6]];
        break;
        case "nx":
        ctx.fillText(`CFM fill with Nitrox`, tx[1]+2, 15);
        var steps = [0, 3];
        var divs = [tx[1], tx[6]];
        break;
        case "tmx":
        ctx.fillText(`CFM fill with Trimix`, tx[1]+2, 15);
        var steps = [0, 3];
        var divs = [tx[1], tx[6]];
        break;
        case "cfm":
        ctx.fillText(`add He`, tx[1]+2, 15);
        ctx.fillText(`${result.add_he.toFixed(1)} bar`, tx[1]+2, 25);
        ctx.fillText(`CFM fill with Nitrox`, tx[2]+2, 15);
        var steps = [0, 1, 3];
        var divs = [tx[1], tx[2], tx[6]];
        break;
        default:    
        
        var steps = [0, 1, 2, 3];
        var divs = tx;
        
        // print how much gas added in each stage in
        [[1, "He", result.add_he], 
        [3, "O2", result.add_o2], 
        [5, "air", result.add_air]].forEach( i => {
            ctx.fillText(`add ${i[1]}`, tx[i[0]]+2, 15);
            ctx.fillText(`${i[2].toFixed(1)}`, tx[i[0]]+2, 25);
        });
        
    };
    
    // total pressures at different fill phases
    var b1Bar = [result.start_bar_in, result.tbar_2, result.tbar_3, result.stop_bar_in];
    
    // Helium pressures from total down at different fill phases
    var b2 = Array(8);
    var bHePct = [result.start_he_in, result.t2_he_pct, result.t3_he_pct, result.mix_he_pct];
    var bHeBar = [
        result.start_bar_in * (100-result.start_he_in)/100,
        result.tbar_2 * (100-result.t2_he_pct)/100,
        result.tbar_3 * (100-result.t3_he_pct)/100,
        result.stop_bar_in * (100-result.mix_he_pct)/100
    ];
    
    // Oxygen pressures from bottom up at different fill phases
    var bO2Pct =[result.start_o2_in, result.t2_o2_pct, result.t3_o2_pct, result.mix_o2_pct];
    var bO2Bar = Array(4);
    bO2Bar[0] = result.start_bar_in * (result.start_o2_in)/100;
    bO2Bar[1] = result.tbar_2 * (result.t2_o2_pct)/100;
    bO2Bar[2] = result.tbar_3 * (result.t3_o2_pct)/100;;
    bO2Bar[3] = result.stop_bar_in * (result.mix_o2_pct)/100;
    
    // Nitrogen
    var bN2Pct =[(100-result.start_o2_in-result.start_he_in), 
        result.t2_n2_pct, result.t3_n2_pct, result.mix_n2_pct];    
        
        // draw gas fill plot
        // first the total, with Helium color fill
        drawRamp(ctx, "Coral", tx, b1Bar, steps);
        
        // then Nitrogen
        drawRamp(ctx, "LightBlue", tx, bHeBar, steps);
        
        // finally Oxygen
        drawRamp(ctx, "cyan", tx, bO2Bar, steps);
        
        drawVertLines(ctx, divs);
        
        ctx.beginPath();
        ctx.fillStyle = "black";
        
        // print stable pressures at begin/end of each fill stage
        for ( s=0; s < steps.length; s++)  {
            i = steps[s];
            ctx.fillText(`${b1Bar[i].toFixed(0)} bar`, tx[i*2]+2, 308-b1Bar[i]);
            if (bHePct[i] > 0)
            ctx.fillText(`${bHePct[i].toFixed(0)} % He`, tx[i*2]+2, 318-b1Bar[i]);
            
            ctx.fillText(`${bO2Pct[i].toFixed(0)} % O2`, tx[i*2]+2, 318-bO2Bar[i]);
            ctx.fillText(`${bN2Pct[i].toFixed(0)} % N2`, tx[i*2]+2, 318-bHeBar[i]);    
        };
        
        
        
        
        
        
        ctx.stroke();
    }    
            
function drawRamp(ctx, color, tx, bar_arr, steps){
    var x = 0 ;
    var y = 0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (var s=0; s< steps.length; s++){
        i = steps[s];
        if (bar_arr[i] == null) break;
        x  = tx[i*2];
        x2 = tx[i*2 +1] 
        y = 310 - bar_arr[i];
        ctx.lineTo(x, y);
        ctx.lineTo(x2, y);
        //ctx.fillText(`${bar_arr[i]}`, x, y);
    }
    ctx.lineTo(x2, 310);
    ctx.lineTo(0, 310);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.lineWidth = 1;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.closePath();
}

function drawVertLines(ctx, divs){
    var x = 0 ;
    var y = 0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "black";
    
    for (var s=0; s< divs.length; s++){
        x = divs[s];
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 310);
        ctx.stroke();
    }
    ctx.stroke();
    ctx.closePath();
}
            
