//Rychlost posílání requestů v ms  
var intervalTime = 1000;

//Kolik musí minimálně mít packetů pro provádění výpočtů (v případě kdy již zná skew z předchozích měření)
var minPacketCount = 100;

//Kolik musí uběhnout času pro provádění výpočtu (v s) (v případě prvního měření na zařízení)
var minTime = 100;  //default asi 1200

//Určují jak často se bude volat počítání skew (v s)
var callSkewComputeTime = 300;

//Limit (v s) do kdy se musí stihnout vypočítat skew, jinak se výpočet zruší
var endWhen = 3620;

//Pomocné proměnné
var maxTime = 0;
var callSkewCompute = 0;
var defaultGraphUpdate = 99;
var graphUpdate = 30;

//JSONTestApi
var JTpackets = [];
var JTdone = false;
var JTerror = false;
var JTlastComputedSkew = {Alpha:0, Beta:0};
var JTlastKnownSkew = {Alpha:0, Beta:0};
var JTstarttimes = {Server:0, Client:0};

//WorldClockApi
var WCpackets = [];
var WCdone = false;
var WCerror = false;
var WClastComputedSkew = {Alpha:0, Beta:0};
var WClastKnownSkew = {Alpha:0, Beta:0};
var WCstarttimes = {Server:0, Client:0};

//Server Eva
var EVpackets = [];
var EVdone = false;
var EVerror = false;
var EVlastComputedSkew = {Alpha:0, Beta:0};
var EVlastKnownSkew = {Alpha:0, Beta:0};
var EVstarttimes = {Server:0, Client:0};


 


function CallThemAll(){

    //Výpočet jak často se bude počítat skew
    if(callSkewCompute == 0){
        if(JTpackets.length == 50)
            computeCallSkew(JTpackets);
        else if(WCpackets.length == 50)
            computeCallSkew(WCpackets);
        else if(EVpackets.length == 50)
            computeCallSkew(EVpackets);

        if(JTpackets.length >= 50 || WCpackets.length >= 50 || EVpackets >= 50){
            callSkewCompute = Math.round(callSkewComputeTime / (intervalTime/1000));
            if(callSkewCompute < 6)
                callSkewCompute = 6;
            console.log("CallCompute is "+callSkewCompute);
        }
    }


    //Update graf
    if(graphUpdate == 0){
        graphUpdate = defaultGraphUpdate;
        var traces = [];
        if(!JTerror){
            if(JTdone)
                doPlot(JTpackets, JTlastComputedSkew, "JSONTest");
            else
                plotPoints(JTpackets, 0, "JSONTest", false);
        }

        if(!WCerror){
            if(WCdone && !WCerror)
                doPlot(WCpackets, WClastComputedSkew, "WorldClock");
            else
                plotPoints(WCpackets, 0, "WorldClock", false);
        }

        if(!EVerror){
            if(EVdone && !EVerror)
                doPlot(EVpackets, EVlastComputedSkew, "Eva");
            else
                plotPoints(EVpackets, 0, "Eva", false);
        }
    }
    if(graphUpdate < 10)
        korekce = "0";
    else
        korekce = "";
    document.getElementById("graphUpdate").innerHTML = "Graph update in : "+korekce+graphUpdate+"s";
    graphUpdate--;
    
    //Moc dlouhé měření
    if(maxTime > endWhen){
        clearInterval(interval);
        if(!JTdone){
            document.getElementById("JSONTest").value += '\n Measuring failed';
            document.getElementById("JSONTest").style.border = "1px dashed #FF6159";
            document.getElementById("JSONTest").scrollTop = document.getElementById("JSONTest").scrollHeight;
            JTdone = true;
            plotPoints(JTpackets, 0, "JSONTest", true, {Alpha:0});
        }
        if(!WCdone){
            document.getElementById("WorldClock").value += '\n Measuring failed';
            document.getElementById("WorldClock").style.border = "1px dashed #FF6159";
            document.getElementById("WorldClock").scrollTop = document.getElementById("WorldClock").scrollHeight;
            WCdone = true;
            plotPoints(WCpackets, 0,"WorldClock", true, {Alpha:0});
        }
        if(!EVdone){
            document.getElementById("Eva").value += '\n Measuring failed';
            document.getElementById("Eva").style.border = "1px dashed #FF6159";
            document.getElementById("Eva").scrollTop = document.getElementById("Eva").scrollHeight;
            EVdone = true;
            plotPoints(EVpackets, 0,"Eva", true, {Alpha:0}); 
        }   
    }

    //Volání xhr
    if(!JTdone)
        getJsonTest();
    if(!WCdone)
        getWorldClock();
    if(!EVdone)
        getSkolniServer();

    //Měření je zkončilo
    if(JTdone && WCdone && EVdone){
        clearInterval(interval);

        document.getElementById('JTB').className = 'disabledB';
        document.getElementById('WCB').className = 'disabledB';
        document.getElementById('EVB').className = 'disabledB';
        document.getElementById("JTB").style.position = "absolute";
        document.getElementById("WCB").style.position = "absolute";
        document.getElementById("EVB").style.position = "absolute";
        document.getElementById("JSONTestd").style.height = "354px";
        document.getElementById("WorldClockd").style.height = "354px";
        document.getElementById("Evad").style.height = "354px";
        document.getElementById('stop').className = 'disabledB';
        document.getElementById("graphUpdate").innerHTML = "";
    }
}

//Vypočítá callSkewComputeTime podle toho jakou přesnost má preformance.now()
function computeCallSkew(packets){
    var tmp
    var level0 = 300;
    var level1 = 400;
    var level2 = 600;
    var level3 = 900;
    callSkewComputeTime = 2000;
    for (let i = 0; i < packets.length; i++) {
        tmp = packets[i].Client;
        tmp = Number(Math.floor((tmp*100).toFixed(3))/100);
        //3 desetiná místa -> level 0
        if(Number(tmp) != packets[i].Client){
            callSkewComputeTime = level0;
            return;
        }

        tmp = Number(Math.floor((tmp*10).toFixed(3))/10);
        //2 desetiná místa -> level 1
        if(Number(tmp) != packets[i].Client){
            callSkewComputeTime = level1;
            continue;
        }

        tmp = Math.floor(tmp);
        //1 desetiné místo -> level 2
        if(Number(tmp) != packets[i].Client){
            if(callSkewComputeTime <= level2){
                continue;
            }else{
                callSkewComputeTime = level2;
            }
        }
    }
    //level 3
    if(callSkewComputeTime > level3){
        callSkewComputeTime = level3;
        clearInterval(Interval);
        interval = setInterval(CallThemAll, 1100);
    }   
}

//Pomocí Plotly.js vytvoří graf
function plotPoints(packets, lastComputedSkew, name, final, lastKnownSkew){
    var skewid = name+"skew";
    if(lastComputedSkew == 0){
        if(packets.length > 20){
            var lastComputedSkew = computeSkew(packets);
            if(lastComputedSkew.Alpha === ""){
                console.log(name+" computeSkew error (Alpha > 100)");
                document.getElementById(skewid).innerHTML = 'Skew compute error';
                document.getElementById(skewid).style.visibility = 'visible';
                document.getElementById(skewid).style.fontSize = "20px";
                return;
            }
        }else{
            document.getElementById(skewid).innerHTML = 'Not enough packets to compute skew';
            document.getElementById(skewid).style.visibility = 'visible';
            document.getElementById(skewid).style.fontSize = "20px";
            return;
        }
    }
    document.getElementById(skewid).innerHTML = 'Skew is <span>'+(lastComputedSkew.Alpha*1000).toFixed(6)+'</span> ppm';
    document.getElementById(skewid).style.visibility = 'visible';
    if(final){
        document.getElementById(skewid).style.fontSize = "20px";
        document.getElementById(skewid).getElementsByTagName("span")[0].style.color = '#326EE6';  
        if(lastKnownSkew.Alpha != 0){
            document.getElementById(skewid).getElementsByTagName("span")[0].style.borderBottom = '2px dotted #326EE6';
            var tipid = name+"tip";
            document.getElementById(tipid).className = "ttiptext";
            document.getElementById(tipid).innerHTML = "Difference between expected ("+(lastKnownSkew.Alpha*1000).toFixed(6)+") and computed value is <b>" + (Math.abs(lastKnownSkew.Alpha - lastComputedSkew.Alpha)*1000).toFixed(6)+"</b> ppm";
        }
    }
    doPlot(packets, lastComputedSkew, name);
}

//Funkce pouze plotne body
function doPlot(packets, lastComputedSkew, name){
    deletePlotted(name);
    var Pointx = [];
    var Pointy = [];
    for (let index = 0; index < packets.length; index++) {
        Pointx.push(packets[index].Server);
        Pointy.push((packets[index].Offset)*(-1));
    }

    var points = {y:Pointy, x:Pointx, mode: 'markers', type: 'scatter', name : name};
    var upperDatay = [(Pointx[0] * lastComputedSkew.Alpha + lastComputedSkew.Beta), Pointx[Pointy.length-1] * lastComputedSkew.Alpha + lastComputedSkew.Beta];
    var upperDatax = [Pointx[0], Pointx[Pointx.length-1]];
    var upper = {y:upperDatay, x:upperDatax, mode: 'lines', name : name};
    var data = [points, upper];
    var plotlyOptions = { modeBarButtonsToRemove: ['sendDataToCloud', 'autoScale2d', 'hoverClosestCartesian', 'hoverCompareCartesian', 'lasso2d', 'select2d', 'toggleSpikelines', 'zoomIn2d', 'zoomOut2d',  'pan2d'], showTips: true , displaylogo: false};
    Plotly.plot('graf', data, {title:""},plotlyOptions);
    document.getElementById("graf").style.visibility = "visible";
}

//Funkce smaže trace z grafu (pokud v grafu jsou)
function deletePlotted(name){
    var plots = [];
    var indexes = [];
    plots = document.getElementById("graf").data;

    //Je undefined pokud ještě nebyl vytvořen graf
    if(plots == undefined)
        return;

    for (let i = 0; i < plots.length; i++) {
        if(plots[i].name == name)
            indexes.push(i);
    }

    if(indexes.length > 0)
        Plotly.deleteTraces('graf', indexes);
}

//Vypočítá nové skew a porovná ho s tím které dostane v argumentu, pokud se jejich rozdíl vleze do limitu ukončí výpočet dáného serveru.
function checkAndPlot(packets, lastComputedSkew, name, lastKnownSkew){
    result = computeSkew(packets);

    if(result.Alpha === ""){
        console.log(name+" computeSkew error (Alpha > 100)");
        return result;
    }

    console.log(name +" ("+Math.round(packets[packets.length-1].Client)+"s) skew is "+(result.Alpha*1000).toFixed(6)+" ppm, beta is "+result.Beta);

    if(lastComputedSkew.Alpha != 0){
        if(Math.abs(lastComputedSkew.Alpha - result.Alpha) < 0.001){
            lastComputedSkew = result;

            switch(name){
                case "WorldClock":
                    document.getElementById("WorldClock").value += '\n Measuring successful';
                    document.getElementById("WorldClock").style.border = "1px dashed #27CB3F";
                    document.getElementById("WorldClock").scrollTop = document.getElementById("WorldClock").scrollHeight;
                    WCdone = true;
                    break;
                case "JSONTest":
                    document.getElementById("JSONTest").value += '\n Measuring successful';
                    document.getElementById("JSONTest").style.border = "1px dashed #27CB3F";
                    document.getElementById("JSONTest").scrollTop = document.getElementById("JSONTest").scrollHeight;
                    JTdone = true;
                    break;
                case "Eva":
                    document.getElementById("Eva").value += '\n Measuring successful';
                    document.getElementById("Eva").style.border = "1px dashed #27CB3F";
                    document.getElementById("Eva").scrollTop = document.getElementById("Eva").scrollHeight;
                    EVdone = true;
                    break;
            }

            plotPoints(packets, lastComputedSkew, name, true, lastKnownSkew);

            var key = name + "-" + Date.now().toString();
            localStorage.setItem(key, [lastComputedSkew.Alpha,lastComputedSkew.Beta, Math.round(packets[packets.length-1].Client)]);
        }
    }
    return result;
}

// ----------------------------------------- JSONTestApi -----------------------------------------
function getJsonTest(){
    var requestTest = new XMLHttpRequest();
    requestTest.open('GET', 'http://time.jsontest.com/', true);
    requestTest.onerror = function () {
        if(!JTdone){
            JTdone = true; //Pokud přijde error, noposílají se dále nové requesty
            JTerror = true;
            errorChangeGUI("JT");
        }
    }
    requestTest.onload = function () {
        var cas = performance.now();
        var data = JSON.parse(this.response);
        if(JTstarttimes.Server == 0){
            JTstarttimes.Server = data.milliseconds_since_epoch;
            JTstarttimes.Client = cas;
        }else if(!JTdone){
            JTerror = false;
            //Převede časy na sekundy a odečte počáteční čas
            var server = ((data.milliseconds_since_epoch - JTstarttimes.Server) / 1000).toFixed(3);
            var client = ((cas - JTstarttimes.Client)/1000).toFixed(6);
            var packet = {Client:client, Server:server, Offset:""};
            JTpackets.push(packet);
            setOffset(packet);
            document.getElementById("JSONTest").value += '\n' + server + ' -- ' + client;
            document.getElementById("JSONTest").scrollTop = document.getElementById("JSONTest").scrollHeight;
            maxTime = client;
            if(JTpackets.length > minPacketCount && JTpackets.length % callSkewCompute == 0 && JTpackets[JTpackets.length-1].Client > minTime)
                JTlastComputedSkew = checkAndPlot(JTpackets, JTlastComputedSkew, "JSONTest", JTlastKnownSkew);
        }
    };
    requestTest.send();
}

// ----------------------------------------- WorldClockApi -----------------------------------------
function getWorldClock(){
    var requestClock = new XMLHttpRequest();
    requestClock.open('GET', 'http://www.worldclockapi.com/api/json/cet/now', true);
    requestClock.onerror = function () {
        if(!WCdone){
            WCdone = true; //Pokud přijde error, noposílají se dále nové requesty
            WCerror = true;
            errorChangeGUI("WC");
        }
    }
    requestClock.onload = function () {
        var cas = performance.now();
        var data = JSON.parse(this.response);
        if(WCstarttimes.Server == 0){
            WCstarttimes.Server = data.currentFileTime;
            WCstarttimes.Client = cas;
        }else if(!WCdone){
            WCerror = false;
            //Převede časy na sekundy a odečte počáteční čas
            var server = ((data.currentFileTime - WCstarttimes.Server)/10000000).toFixed(7);
            var client = ((cas - WCstarttimes.Client)/1000).toFixed(6);
            var packet = {Client:client, Server:server, Offset:""};
            WCpackets.push(packet);
            setOffset(packet);
            document.getElementById("WorldClock").value += '\n' + server + ' -- ' + client;
            document.getElementById("WorldClock").scrollTop = document.getElementById("WorldClock").scrollHeight;
            maxTime = client;
            if(WCpackets.length > minPacketCount && WCpackets.length % callSkewCompute == 0 && WCpackets[WCpackets.length-1].Client > minTime)
                WClastComputedSkew = checkAndPlot(WCpackets, WClastComputedSkew, "WorldClock", WClastKnownSkew);
        }
    };
    requestClock.send();
}

// ----------------------------------------- Školní Server -----------------------------------------
function getSkolniServer(){
    var requestSkol = new XMLHttpRequest();
    requestSkol.open('GET', 'http://www.stud.fit.vutbr.cz/~xjires02/', true);
    requestSkol.onerror = function () {
        if(!EVdone){
            EVdone = true; //Pokud přijde error, noposílají se dále nové requesty
            EVerror = true;
            errorChangeGUI("EV");
        }
    }
    requestSkol.onload = function () {
        var cas = performance.now();
        var data = JSON.parse(this.response);
        if(EVstarttimes.Server == 0){
            EVstarttimes.Server = data.hrtime;
            EVstarttimes.Client = cas;
        }else if(!EVdone){
            EVerror = false;
            //Převede časy na sekundy a odečte počáteční čas
            var server = ((data.hrtime - EVstarttimes.Server)/1000000000).toFixed(9);
            var client = ((cas - EVstarttimes.Client)/1000).toFixed(6);
            var packet = {Client:client, Server:server, Offset:""};
            EVpackets.push(packet);
            setOffset(packet);
            document.getElementById("Eva").value += '\n' + server + ' -- ' + client;
            document.getElementById("Eva").scrollTop = document.getElementById("Eva").scrollHeight;
            maxTime = client;
            if(EVpackets.length > minPacketCount && EVpackets.length % callSkewCompute == 0 && EVpackets[EVpackets.length-1].Client > minTime)
                EVlastComputedSkew = checkAndPlot(EVpackets, EVlastComputedSkew, "Eva", EVlastKnownSkew);
        }
    };
    requestSkol.send();
    
}

//Server je timestamp dostaný z requestu, client je čas získáný pomocí js
function setOffset(packet){
    var tmp;

    tmp = packet.Server;
    tmp -= packet.Client;
    tmp *= 1000;

    packet.Offset = tmp.toFixed(6);
}


/*
Funkce níže jsou převzaté z programu pcf napsaném v jazyce c a přepsané do javascriptu (https://www.vutbr.cz/studenti/zav-prace/detail/79043)
*/
function counterClockwiseTest(p1, p2, p3){
    return((p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x));
}

function convexHull(points, number){
    var m = 1;
    var tmp;

    for (let i = 2; i < number; i++) {
        while(i <= number && counterClockwiseTest(points[m-1], points[m], points[i]) >= 0){
            if(m == 1){
                tmp = points[m];
                points[m] = points[i];
                points[i] = tmp;
                i++;
            }else{
                m--;
            }
        }
        m++;
        tmp = points[m];
        points[m] = points[i];
        points[i] = tmp;
    }
    m++;
    return [points,m];
}

function computeSkew(packets){
    var result = {Alpha:"", Beta:""};
    var packets_count = packets.length;
    var points = [];

    for (let i = 0; i < packets.length; i++) {
        points.push({x:packets[i].Server, y:packets[i].Offset});
        packets_count = i;
    }

    data = convexHull(points, packets_count);
    hull = data[0];
    packets_count = data[1];

    var alpha;
    var beta;
    var min;
    var sum;

    var j = Math.round(packets_count / 2);

    alpha = ((hull[j].y - hull[j - 1].y) / (hull[j].x - hull[j - 1].x));
    
    if (Math.abs(alpha) > 100) {
        return result;
    }

    beta = hull[j - 1].y - (alpha * hull[j - 1].x);

    min = 0;
    for (let i = 0; i < packets.length; i++) {
        min += alpha * packets[i].Server + beta - packets[i].Offset;
    }

    result.Alpha = alpha;
    result.Beta = beta;

    for(i = 1; i < packets_count; i++){
        if(i == j)
            continue;
        alpha = ((hull[i].y - hull[i - 1].y) / (hull[i].x - hull[i - 1].x));
        if(alpha > 3 || alpha < -3)
            continue;
        
        beta = hull[i - 1].y - (alpha * hull[i - 1].x);
        sum = 0;
        for (let l = 0; l < packets.length; l++) {
            sum += alpha * packets[l].Server + beta - packets[l].Offset;
            if(sum >= min)
                break;
        }

        if(sum < min){
            result.Alpha = alpha;
            result.Beta = beta;
            min = sum;
        }
    }

    result.Alpha = Number(result.Alpha.toFixed(9))*(-1);
    result.Beta = Number(result.Beta.toFixed(9))*(-1);
    return result;
}



