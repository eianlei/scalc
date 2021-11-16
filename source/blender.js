/**
* 
*/
let global_result;
var filltype = "pp";
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
    let liters = parseInt($("#tank_liters").val());
    let o2_price_eur = parseInt($("#o2_price").val());
    let he_price_eur = parseInt($("#he_price").val());
    let fill_price_eur = parseInt($("#c_price").val());
    // update the global state object for destination tank size
    global_result.tank_liters = liters;
    let txt;
    let total_cost;
    [total_cost, txt] = calculateCost(
        liters, 
        fill_bar = parseInt($('#end_bar').val()), 
        global_result.add_o2, 
        global_result.add_he, 
        o2_price_eur, he_price_eur, fill_price_eur
        );
    $("#cost_output").val(txt);    
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
    let start_bar =    parseInt($("#start_bar").val());
    let end_bar =      parseInt($('#end_bar').val());
    let start_o2_pct = parseInt($('#start_o2_pct').val());
    let start_he_pct = parseInt($('#start_he_pct').val());
    let end_o2_pct =   parseInt($('#end_o2_pct').val());
    let end_he_pct =   parseInt($('#end_he_pct').val());
    // filltype = "pp";
    // filltype = $("#ddl_ft").val;
    
    // let deb_txt =  `calculateBlend ${start_bar} ${end_bar} ${start_o2_pct} ${start_he_pct} ${end_o2_pct} ${end_he_pct}`;
    // console.log(filltype);
    // $("#text_output").val(deb_txt);
    let result = tmxcalc_num(filltype, start_bar, start_o2_pct, start_he_pct, 
        end_bar, end_o2_pct, end_he_pct, false, false);
        global_result = result;
        if (result.status_code == 0) {
            result_txt = tmxcalc_text(result);
            $("#text_output").val(result_txt);
        }
        else {
            $("#text_output").val(result.status_txt);
        }
    drawFillProfile(result);
    do_O2_storage();
    do_He_storage();
    do_compressor();
} 
        
// this is called when any class input2 element changes
$(function()
{
    $(".input2").on("change",calculateBlend)
})

$(function()
{
    $(".in_cost").on("change",doCost)
})
$(function()
{
    $(".o2_storage").on("change",do_O2_storage)
})
$(function()
{
    $(".He_storage").on("change",do_He_storage)
})
$(function()
{
    $(".compressor").on("change",do_compressor)
})

function do_O2_storage(){
    let liters = parseInt($("#tank_liters").val()); 
    let add_o2 = global_result.add_o2;
    let add_o2_liters = liters * add_o2;
    let o2_storage_liters = parseInt($("#o2_storage_liters").val());
    let o2_storage_start = parseInt($("#o2_storage_start").val());
    let o2_storage_rate = parseInt($("#o2_storage_rate").val());
    let usage_bars = add_o2_liters / o2_storage_liters;
    let end_bars = o2_storage_start - usage_bars;
    let time = add_o2 / o2_storage_rate;
    let need = 0;

    switch (global_result.filltype_in){
        case "pp": 
            $("#o2_storage_use").text(`decanting to ${liters} liter tank `+
            `from ${global_result.tbar_2.toFixed(1)}`+
            ` to ${global_result.tbar_3.toFixed(1)} bar`);
            need = global_result.tbar_2 + usage_bars;
            $("#o2_storage_need").text(need.toFixed(1)); 
            $("#o2_storage_time").text(time.toFixed(1)); 
            break;
        case "air":
            $("#o2_storage_use").text("not used");
            $("#o2_storage_need").text("none"); 
            $("#o2_storage_time").text("N/A"); 
            break;
        case "nx":
        case "tmx":
        case "cfm":
            $("#o2_storage_use").text("continuous flow mix to compressor");
            need = usage_bars;
            $("#o2_storage_need").text(need.toFixed(1));         
            $("#o2_storage_time").text("N/A"); 
            break;
    }

    $("#o2_storage_used").text(usage_bars.toFixed(1)); 
    $("#o2_storage_end").text(end_bars.toFixed(1)); 
}

function do_He_storage(){
    let liters = parseInt($("#tank_liters").val()); 
    let add_He = global_result.add_he;
    let add_He_liters = liters * add_He;
    let He_storage_liters = parseInt($("#He_storage_liters").val());
    let He_storage_start = parseInt($("#He_storage_start").val());
    let He_storage_rate = parseInt($("#He_storage_rate").val());
    let usage_bars = add_He_liters / He_storage_liters;
    let end_bars = He_storage_start - usage_bars;
    let time = add_He / He_storage_rate;
    let need = 0;

    if ((global_result.filltype_in == "pp" || global_result.filltype_in == "cfm" )
        && usage_bars > 0) {
            $("#He_storage_use").text(`decanting to ${liters} liter tank `+
            `from ${global_result.start_bar_in.toFixed(1)}`+
            ` to ${global_result.tbar_2.toFixed(1)} bar`);
            need = global_result.start_bar_in + usage_bars;
            $("#He_storage_need").text(need.toFixed(1)); 
            $("#He_storage_time").text(time.toFixed(1)); 
    } else if (global_result.filltype_in ==  "air" || usage_bars == 0){
            $("#He_storage_use").text("not used");
            $("#He_storage_need").text("none"); 
            $("#He_storage_time").text("N/A"); 
    } else if (global_result.filltype_in == "tmx"){
            $("#He_storage_use").text("continuous flow mix to compressor");
            need = usage_bars;
            $("#He_storage_need").text(need.toFixed(1));         
            $("#He_storage_time").text("N/A"); 
    }

    $("#He_storage_used").text(usage_bars.toFixed(1)); 
    $("#He_storage_end").text(end_bars.toFixed(1)); 
}

function do_compressor(){
    var rate = parseInt($("#compressor_rate").val()); 
    let liters = parseInt($("#tank_liters").val()); 
    //var delta = global_result.add_air;
    //var filled_liters = liters * delta;
    //var time = filled_liters / rate;

    if(global_result.filltype_in == "air" || global_result.filltype_in == "pp"){
        var delta = global_result.add_air;
        var filled_liters = liters * delta;
        $("#compressor_o2").text("n/a");       
        $("#compressor_he").text("n/a");       
    } else if (global_result.filltype_in == "nx" || global_result.filltype_in == "cfm") {
        var delta = global_result.add_nitrox;
        var filled_liters = liters * delta;
        var flow_o2 = rate * ((global_result.nitrox_pct -21) /100);
        $("#compressor_o2").text(flow_o2.toFixed(0));       
        $("#compressor_he").text("n/a");  
    } else if (global_result.filltype_in == "tmx" ) {
        var delta = global_result.add_tmx;
        var filled_liters = liters * delta;
        var flow_o2 = rate * ((global_result.tmx_preo2_pct) /100);
        var flow_he = rate * (global_result.tmx_he_pct /100);
        $("#compressor_o2").text(flow_o2.toFixed(0));       
        $("#compressor_he").text(flow_he.toFixed(0));  
    }
    var time = filled_liters / rate;

    $("#compressor_delta").text(delta.toFixed(0)); 
    $("#compressor_tl").text(liters.toFixed(0)); 
    $("#compressor_time").text(time.toFixed(1)); 
};
        
// dropdown menu for ft filltype selection
$("#ddl_ft").change(function () {
    dropval = $(this).val();
    console.log(`ddl_ft ${dropval} `);
    filltype = dropval;
    calculateBlend();
});

// dropdown menu for start gas  
$("#dd_startGas").change(function () {
    var dropTxt = $(this).val();
    var gases = dropTxt.split('/');
    $("#start_o2_pct").val(gases[0]);
    $("#start_he_pct").val(gases[1]);
    calculateBlend();
});

// dropdown menu for wanted gas  
$("#dd_wantedGas").change(function () {
    var dropTxt = $(this).val();
    var gases = dropTxt.split('/');
    $("#end_o2_pct").val(gases[0]);
    $("#end_he_pct").val(gases[1]);
    calculateBlend();
});

// dropdown menu for end_bar  
$("#dd_end_bar").change(function () {
    var dropTxt = $(this).val();
    $("#end_bar").val(parseInt(dropTxt) );
    
    calculateBlend();
});

// from button EMPTY tank
function emptyTank(){
    $("#start_bar").val(1);
    $("#start_o2_pct").val(21);
    $("#start_he_pct").val(0);
    $("#dd_startGas").val("21/0");
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
        
        // print how much gas added in each stage
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
            ctx.fillText(`${b1Bar[i].toFixed(0)} bar`, tx[i*2]+2, 208-b1Bar[i]);
            if (bHePct[i] > 0)
            ctx.fillText(`${bHePct[i].toFixed(0)} % He`, tx[i*2]+2, 218-b1Bar[i]);
            
            ctx.fillText(`${bO2Pct[i].toFixed(0)} % O2`, tx[i*2]+2, 218-bO2Bar[i]);
            ctx.fillText(`${bN2Pct[i].toFixed(0)} % N2`, tx[i*2]+2, 218-bHeBar[i]);    
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
        y = 210 - bar_arr[i];
        ctx.lineTo(x, y);
        ctx.lineTo(x2, y);
        //ctx.fillText(`${bar_arr[i]}`, x, y);
    }
    ctx.lineTo(x2, 210);
    ctx.lineTo(0, 210);
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
        ctx.lineTo(x, 210);
        ctx.stroke();
    }
    ctx.stroke();
    ctx.closePath();
}
            
