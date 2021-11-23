/** (c) 2021 Ian Leiman, ian.leiman@gmail.com 
 * planner.js
 * 
 */
// 2021-11-19 major refactoring: all time units are now MINUTES, seconds removed everywhere
// run the plan automatically for the 1st time with defaults
runPlan();

// When the user clicks on div, open the popup
function popupHowto() {
  var popup = document.getElementById("howtoPopup");
  popup.classList.toggle("show");
}

function showMain(){
    document.getElementById("table_panel").style.display = "none";
    document.getElementById("main").style.display = "block";
}

function openNav() {
  document.getElementById("mySidenav").style.width = "150px";
  document.getElementById("main").style.marginLeft = "150px";
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.getElementById("main").style.marginLeft= "0";
}

function drawSmallProfile(dp){
    var c = document.getElementById("profileCanvas");
    var cTXT = document.getElementById("profileCanvas_txt");
    let pw = c.width -50;
    let ph = c.height -15
    var ctx = c.getContext("2d");
    var ctxTXT = cTXT.getContext("2d");
    let prof = dp.profileSampled;
    let profLastIndex = prof.length -1;
    let totalTime = prof[profLastIndex].time;
    let maxDepth = dp.bottomDepth;

    // clear out previous plots
    ctx.clearRect(0,0, c.width, c.height);
    ctx.beginPath();
    ctx.moveTo(0, 0);

    // draw the depth profile, fill with blue gradient
    for (var i =0; i< prof.length; i++){
        point = prof[i];
        var x = (point.time / totalTime) * pw;
        var y = (point.depth / maxDepth ) * ph;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.lineWidth = 1;
    // ctx.fillStyle = "#8ED6FF";
    var grd = ctx.createLinearGradient(0,0, 0, ph);
    grd.addColorStop(0, "lightBlue");
    grd.addColorStop(1, "darkBlue");
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = "blue";
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.lineTo(0, 0);
    //*** CEILING profile, fill with green gradient
    ctx.globalAlpha = 0.6;
    for (var i =0; i< prof.length; i++){
        point = prof[i];
        var x = (point.time / totalTime) * pw;
        var y = (point.ceiling / maxDepth ) * ph;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.lineWidth = 1;
    // ctx.fillStyle = "Green";
    var grd = ctx.createLinearGradient(0,0, 0, ph);
    grd.addColorStop(0, "lightGreen");
    grd.addColorStop(1, "Green");
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = "darkGreen";
    ctx.stroke();
    ctx.closePath();
    //*** end of CEILING
    ctx.globalAlpha = 0.9;

    // draw time axis
    for (var tt=0; tt < totalTime; tt += 1){
        var x = tt / totalTime * pw;
        ctx.beginPath();
        ctx.moveTo(x, ph);
        ctx.lineTo(x, ph+5);
        ctx.strokeStyle = "black";
        ctx.stroke();
    } // time ticks every 5 min
    for (var tt=5; tt < totalTime; tt += 5){
        var x = tt / totalTime * pw;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ph-1);
        ctx.strokeStyle = "Grey";
        ctx.stroke();
        ctx.font = '8pt Arial';
        ctx.fillStyle = "black";
        ctx.fillText(`${tt}`, x-5, ph+14);
    } // time gridlines every 5 min and minutes text

    // draw depth grid
    for (var dd=0; dd < maxDepth; dd += 5){
        var y = dd / maxDepth * ph;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(pw, y);
        ctx.strokeStyle = "Green";
        ctx.stroke();
        ctx.font = '8pt Arial';
        ctx.fillStyle = "blue";
        ctx.fillText(`${dd} m`, pw+1, y+5);
    }
    ctx.stroke();

    // draw tank pressures
    var previousTank = null;
    var lastPressure = null;
    ctx.strokeStyle = "Orange";
    ctx.fillStyle = "red"
    ctx.font = '9pt Arial';
    var x1 = 0;
    var y1 = (1.0 - prof[0].tankPressure /300.0) * ph;
    ctx.beginPath();
    for (var i =0; i< prof.length; i++){
        point = prof[i];
        var thisTank = point.tank;
        var x = point.time / totalTime * pw;
        var y = (1.0 - point.tankPressure /300.0) * ph;
        if (thisTank != previousTank){
            if (lastPressure) {
                // tank/gas change at this point
                ctx.fillText(`${lastPressure.toFixed(0)} bar`, x-5, y1);
                ctx.fillText(`${previousTank.name}> ${thisTank.name}`, x-5, y1+10);
                ctx.beginPath();
                ctx.moveTo(x1, y1+5);
                ctx.lineTo(x1, y-5);
                ctx.lineWidth =4;
                ctx.strokeStyle = "red";
                ctx.stroke();
                //ctx.closePath();
            }
            ///////////ctx.strokeStyle = thisTank.color;
            // starting with new tank
            ctx.fillText(`${point.tankPressure.toFixed(0)} bar`, x+5, y)
            y1 = y;
        }
        // plot the pressure of the current tank
        ctx.strokeStyle = "Orange";
        ctx.lineWidth =1;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x, y);
        ctx.stroke();
        x1 = x; y1 = y;
        previousTank = thisTank;
        lastPressure = point.tankPressure;
    } // draw tank pressures loop
    ctx.closePath();
    // print the end pressure of the last tank
    ctx.fillText(`${lastPressure.toFixed(0)}`, x-20, y-10);

    function getPointText (xMouse){
        if (xMouse > pw) {
            return ["", 0];
        }
        var mouseTime = xMouse * totalTime /pw;
        for (idx = 0; idx < prof.length; idx++){
            if (prof[idx].time >= mouseTime) break;
        }
        var pointIdx = idx;
        var mousePoint = prof[pointIdx];
        var pointTxt = `${mousePoint.depth.toFixed(0)} m, ${(mouseTime).toFixed(0)} min`;
        var depthY = mousePoint.depth / maxDepth * ph ;
        return [pointTxt, depthY];
    }

    // track mouse over the topmost canvas c = "profileCanvas"
    cTXT.addEventListener('mousemove', function(e){
        with(ctxTXT) {
            ctxTXT.clearRect(0,0, ctxTXT.canvas.width, ctxTXT.canvas.height);
            ctxTXT.beginPath();
            ctxTXT.font = '8pt Arial';
            ctxTXT.fillStyle = "black";
            ctxTXT.strokeStyle = "black";
            ctx.lineWidth = 1;
            //** the following function gets you canvas relative x, y
            var [xt, yt] = getCursorPosition(c, e);
            // ctxTXT.fillText(`mouse ${xt} ${yt.toFixed(1)}`, xt+2, yt);
            var pointTxt;
            var depthY;
            [pointTxt, depthY] = getPointText(xt);
            ctxTXT.fillText(pointTxt, xt+2, yt);
            ctxTXT.moveTo(xt, 0);
            ctxTXT.lineTo(xt, ctxTXT.canvas.height);
            ctxTXT.closePath();
            ctxTXT.moveTo(0, depthY);
            ctxTXT.lineTo(ctxTXT.canvas.width, depthY);
            ctxTXT.stroke();
            ctxTXT.closePath();
            this.xt2 = xt; 
            this.yt2 = yt;
            // console.log (`mouse ${xt} ${yt}`);
        }
    } ,0);

} // drawSmallProfile()

function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    // console.log("x: " + x + " y: " + y)
    return [x, y];
} // from https://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element/18053642#18053642

$(function()
{
    $(".input3").on("change",runPlan)
})   

$("#dd_bGas").change(function () {
    var dropTxt = $(this).val()
    var gases = dropTxt.split('/');
    $("#bottom_O2").val(gases[0]);
    $("#bottom_He").val(gases[1]);
    runPlan();
  });

  $("#dd_gf").change(function () {
    var dropTxt = $(this).val()
    var gfs = dropTxt.split('/');
    $("#gf_low").val(gfs[0]);
    $("#gf_high").val(gfs[1]);
    runPlan();
  });

//let myDP = new Diveplan();

var globalDP;

/** runPlan() gets the inputs from GUI and then calls calculatePlan
 * @
*/
function runPlan()
{
    // are deco tanks in use, get checkbox status
    let deco1_use = $("#tank_deco1").prop("checked");
    let deco2_use = $("#tank_deco2").prop("checked");

    // check that input values are sane
    var bottom_O2_in = parseInt($("#bottom_O2").val());
    var bottom_He_in = parseInt($("#bottom_He").val());
    if (bottom_O2_in > 100 || bottom_O2_in <18){
        alert(`invalid bottom O2% = ${bottom_O2_in}\nreverting to 21%`);
        bottom_O2_in = 21;
        $("#bottom_O2").val(21);
    }
    if ((bottom_O2_in + bottom_He_in > 100) || bottom_He_in > 82 ){
        alert(`invalid bottom O2/He% = ${bottom_O2_in}/${bottom_He_in} \n`+
        "reverting to 21/35%");
        bottom_O2_in = 21;
        bottom_He_in = 35;
        $("#bottom_O2").val(21);
        $("#bottom_He").val(35);
    }

    // get input for the tank configuration
    const tankBottom =     { 
        label : "BOTTOM", name: "B", use: true, 
        o2: bottom_O2_in, 
        he: bottom_He_in, 
        SAC: parseInt($("#bottom_SAC").val()), 
        ppo2max: 1.4, 
        liters: parseInt($("#bottom_liters").val()), 
        bar: parseInt($("#bottom_bar").val()), 
        pressure: 200.0, useFromTime: 0, useUntilTime: 0, 
        type: "bottom", useOrder: 1, color: "Magenta" 
    };
    const tankDeco1 =     { 
        label: "deco1", name: "D1", 
        use: deco1_use,
        o2: parseInt($("#deco1_O2").val()), 
        he: parseInt($("#deco1_He").val()), 
        changeDepth: parseInt($("#deco1_switch").val()), 
        SAC: parseInt($("#deco1_SAC").val()), 
        ppo2max: 1.6, 
        liters: parseInt($("#deco1_liters").val()), 
        bar: parseInt($("#deco1_bar").val()), 
        pressure: 200.0, useFromTime: 0, useUntilTime: 0, 
        type: "deco", useOrder: 2, color: "Cyan"
    };
    const tankDeco2 =     { 
        label: "deco2", name: "D2", 
        use: deco2_use,
        o2: parseInt($("#deco2_O2").val()),  
        he: parseInt($("#deco2_He").val()),  
        changeDepth: parseInt($("#deco2_switch").val()), 
        SAC: parseInt($("#deco2_SAC").val()), 
        ppo2max: 1.6, 
        liters: parseInt($("#deco2_liters").val()), 
        bar: parseInt($("#deco2_bar").val()), 
        pressure: 200.0, useFromTime: 0, useUntilTime: 0, 
        type: "deco", useOrder: 3, color: "LightGray"
    };

    const myTanks = [tankBottom, tankDeco1, tankDeco2];

    // configure all inputs for the calculatePlan()
    const myDP = new Object();
       myDP.bottomDepth =   parseInt($("#dive_depth").val());
       myDP.bottomTime =    parseInt($("#dive_bottom_time").val()) ; // MINUTES !!!!
       myDP.desc_rate = 10 ; //minutes/seconds
       myDP.desc_steps = parseInt($("#desc_steps").val());
       myDP.bottom_steps = parseInt($("#bottom_steps").val());
       myDP.ascRateToDeco = 1;
       myDP.ascRateAtDeco = 1;
       myDP.ascRateToSurface = 1;
       myDP.GFlow = parseInt($("#gf_low").val()) / 100.0; // 0.30;  //<=== fraction, not percentage!
       myDP.GFhigh = parseInt($("#gf_high").val()) / 100.0; //  0.85; //<=== fraction, not percentage!
       myDP.modelUsed = "ZHL16c";
       myDP.decoStopsCalculated = [];
       myDP.wayPoints = [];
       myDP.maxPPoxygen = 0;
       myDP.maxPPhelium = 0;
       myDP.maxPPnitrogen = 0;
       myDP.maxTCnitrogen = 0;
       myDP.maxTChelium = 0;
       myDP.ascentBegins = 0;
       myDP.changeDepth = 0;

       myDP.tankList = myTanks;
       myDP.currentTank = tankBottom;
       myDP.tankBottom = tankBottom;
       myDP.tankDeco1 = tankDeco1; 
       myDP.tankDeco2 = tankDeco2; 
       myDP.nextTank = null;

       myDP.maxTCnitrogen = 0;
       myDP.maxTChelium = 0;
       myDP.profileSampled = [];
       myDP.model = [];
       myDP.tableIsGenerated = false; // controls openTable()
       
       // now finally call the actual work horse
       calculatePlan(myDP);
       /*
        try {
        calculatePlan(myDP);
        }
        catch(err) {
            alert(`calculatePlan() exception: ${err}\n`+
            "aborted, press F12 to see console.log\n"+
            "resetting depth and bottom time to 30m/20min");
            $("#dive_depth").val(30);
            $("#dive_bottom_time").val(20);
            return;
        }
       */
       // output the text from calculatePlan()
       txt = plan_txt(myDP.decoStopsCalculated, myDP.wayPoints, myDP.tankList);
       $("#planner_textout").val(txt);
    
       // draw the profile canvas
       globalDP = myDP;
       drawSmallProfile(myDP);
}      

function openTable(){
    document.getElementById("table_panel").style.display = "block";
    document.getElementById("main").style.display = "none";

    if (globalDP.tableIsGenerated == false) {
        // generate the table only once after calculatePlan()
        var pTable = "<table class= 'pTable'>"+
            "<th title='iteration index'>idx</th>"+
            "<th title='runtime in minutes'>min</th>"+
            "<th title='dive depth in meters'>m</th>"+
            "<th title='dive phase'>phase</th>"+
            "<th title='tank name'>T</th>"+
            "<th title='Oxygen/Helium %'>O2/He</th>"+
            "<th title='tank pressure in bar'>bar</th>"+
            "<th title='partial pressure of Oxygen'>ppO2</th>"+
            "<th title='Gradient Factor % at this depth'>GF</th>"+
            "<th title='Ceiling in 3 meter step'>C3m</th>"+
            "<th title='ceiling in meters'>Ceil</th>"+
            "<th title='margin from current depth to ceiling in meters'>marg</th>"+
            "<th title='leading tissue compartment number'>lead</th>";
        for (i=0; i<16; i++) {    
            pTable += `<th title='tissue compartment #${i} ceiling in meters'>TC${i}</th>`;
        }
        pTable += "<tr>";
        let bg_col = "white";
        for(i=0; i< globalDP.profileSampled.length; i++){
            point = globalDP.profileSampled[i];
            pTable += `<td>${i}</td>`;
            pTable += `<td>${(point.time).toFixed(1)}</td>`;
            pTable += `<td>${point.depth.toFixed(1)}</td>`;
            pTable += `<td>${point.divephase}</td>`;
            pTable += `<td>${point.tank.name}</td>`;    
            pTable += `<td>${point.tank.o2}/${point.tank.he}</td>`;    
            pTable += `<td>${point.tankPressure.toFixed(0)}</td>`;
            pTable += `<td>${point.ppOxygen.toFixed(2)}</td>`;
            pTable += `<td>${point.gfNow.toFixed(2)}</td>`;            
            pTable += `<td>${point.ceiling3m.toFixed(0)}</td>`;
            pTable += `<td>${point.ceiling.toFixed(1)}</td>`;
            pTable += `<td>${point.margin.toFixed(1)}</td>`;
            pTable += `<td>${point.leadTC}</td>`;
            for(tc=0; tc < point.TCm.length; tc++){
                //if (tc == point.leadTC) bg_col = "red"; else bg_col ="white";
                if (tc == point.leadTC) {
                    pTable += `<td bgcolor='red'>${point.TCm[tc].toFixed(1)}</td>`;
                }else {
                    pTable += `<td>${point.TCm[tc].toFixed(1)}</td>`;
                }
            }
            pTable += "</tr><tr>"
        }
        pTable += "</tr></table>"

        document.getElementById("planner_table").innerHTML = pTable;
        var tableElement = document.getElementById("planner_table").childNodes[0];
        tableElement.border = "1";
        tableElement.style.borderCollapse="collapse";
        tableElement.style.textAlign="right" ;
        //tableElement.style.
        globalDP.tableIsGenerated = true; // don't do it again
    }// if (globalDP.tableIsGenerated) 
}

// button table_save2csv onclick
function table_save2csv(){
    console.log("table_save2csv button pressed");
    const a = document.createElement('a');
    //const content = "table_save2csv button pressed\n testing\n file\n save\n";
    const content = createTableCSV();
    const file = new Blob([content], {type: "text/plain"});
    
    a.href= URL.createObjectURL(file);
    a.download = "planner_table.csv";
    a.click();

    URL.revokeObjectURL(a.href);
}

// create a CSV from the globalDP.profileSampled data
// NOTE: SAVING IN EU FORMAT!!
function createTableCSV(){
    let txt = "idx;min;m;phase;tank;O2%;HE%;bar;ppO2;GF;C3m;ceil;marg;lead;";
    for (i=0; i<16; i++) {    
        txt += `TC${i};`;
    }
    txt += `\n`;
    for(i=0; i< globalDP.profileSampled.length; i++){
            point = globalDP.profileSampled[i];
            txt += `${i};`;
            txt += `${point.time.toFixed(1).replace('.', ',')};`;
            txt += `${point.depth.toFixed(1).replace('.', ',')};`;
            txt += `${point.divephase};`;
            txt += `${point.tank.name};`;
            txt += `${point.tank.o2.toFixed(0)};`;
            txt += `${point.tank.he.toFixed(0)};`;
            txt += `${point.tankPressure.toFixed(0)};`;
            txt += `${point.ppOxygen.toFixed(1).replace('.', ',')};`;
            txt += `${point.gfNow.toFixed(2).replace('.', ',')};`;
            txt += `${point.ceiling3m.toFixed(0)};`;
            txt += `${point.ceiling.toFixed(1).replace('.', ',')};`;
            txt += `${point.margin.toFixed(1).replace('.', ',')};`;
            txt += `${point.leadTC.toFixed(0).replace('.', ',')};`;
            for(tc=0; tc < point.TCm.length; tc++){
                txt += `${point.TCm[tc].toFixed(1).replace('.', ',')};`;
            }        
            txt += `\n`;
    }

    return txt;
}