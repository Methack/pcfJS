//Rychlost posílání requestů v ms  
var intervalTime = 1000;

//Kolik musí minimálně mít packetů pro provádění výpočtů (v případě kdy již zná skew z předchozích měření)
var minPacketCount = 100;

//Kolik musí uběhnout času pro provádění výpočtu (v s) (v případě prvního měření na zařízení)
var minTime = 1200;  //default asi 1200

//Určují jak často se bude volat počítání skew (v s)
var callSkewComputeTime = 10;

//Limit (v s) do kdy se musí stihnout vypočítat skew, jinak se výpočet zruší
var endWhen = 1500;

//Pomocné proměnné
var maxTime = 0;
var callSkewCompute = 0;

//JSONTestApi
var JTpackets = [];
var JTServerstarttime = 0;
var JTClientstarttime = 0;
var JTdone = false;
var JTlastComputedSkew = {Alpha:0, Beta:0};
var JTlastKnownSkew = {Alpha:0, Beta:0};

//WorldClockApi
var WCpackets = [];
var WCServerstarttime = 0;
var WCClientstarttime = 0;
var WCdone = false;
var WClastComputedSkew = {Alpha:0, Beta:0};
var WClastKnownSkew = {Alpha:0, Beta:0};

//Server Eva
var EVpackets = [];
var EVServerstarttime = 0;
var EVClientstarttime = 0;
var EVdone = false;
var EVlastComputedSkew = {Alpha:0, Beta:0};
var EVlastKnownSkew = {Alpha:0, Beta:0};


 


function CallThemAll(){
    if(callSkewCompute == 0){
        callSkewCompute = Math.round(callSkewComputeTime / (intervalTime/1000));
        if(callSkewCompute < 6)
            callSkewCompute = 6;
        console.log("Vypočítané callCompute je "+callSkewCompute);
    }

    if(maxTime > endWhen){
        clearInterval(interval);
        if(!JTdone){
            document.getElementById("JSONTest").innerHTML = document.getElementById("JSONTest").innerHTML + '\n Výpočet se nepodařil';
            document.getElementById("JSONTest").style.border = "1px dashed #FF6159";
            JTdone = true;
            plotPoints(JTpackets, 0, "JSONTest");
        }
        if(!WCdone){
            document.getElementById("WorldClock").innerHTML = document.getElementById("WorldClock").innerHTML + '\n Výpočet se nepodařil';
            document.getElementById("WorldClock").style.border = "1px dashed #FF6159";
            WCdone = true;
            plotPoints(WCpackets, 0,"WorldClock");
        }
        if(!EVdone){
            document.getElementById("Eva").innerHTML = document.getElementById("Eva").innerHTML + '\n Výpočet se nepodařil';
            document.getElementById("Eva").style.border = "1px dashed #FF6159";
            EVdone = true;
            plotPoints(EVpackets, 0,"Eva"); 
        }   
    }

    if(!JTdone)
        getJsonTest();
    if(!WCdone)
        getWorldClock();
    if(!EVdone)
        getSkolniServer();

    if(JTdone && WCdone && EVdone){
        clearInterval(interval);
        document.getElementById('JTB').className = 'disabledB';
        document.getElementById('WCB').className = 'disabledB';
        document.getElementById('EVB').className = 'disabledB';
        document.getElementById('stop').className = 'disabledB';
    }
}

//Pomocí Plotly.js vytvoří graf
function plotPoints(packets, lastKnownSkew, name){
    if(lastKnownSkew == 0)
        var lastKnownSkew = computeSkew(packets);
    document.getElementById(name).innerHTML = document.getElementById(name).innerHTML + '\n '+lastKnownSkew.Alpha;
    document.getElementById(name).scrollTop = document.getElementById(name).scrollHeight;

    var Pointx = [];
    var Pointy = [];
    for (let index = 0; index < packets.length; index++) {
        Pointx.push(packets[index].Server);
        Pointy.push((packets[index].Offset)*(-1));
    }

    var points = {y:Pointy, x:Pointx, mode: 'markers', type: 'scatter', name : name};
    var upperDatay = [(Pointx[0] * lastKnownSkew.Alpha + lastKnownSkew.Beta), Pointx[Pointy.length-1] * lastKnownSkew.Alpha + lastKnownSkew.Beta];
    var upperDatax = [Pointx[0], Pointx[Pointx.length-1]];
    var upper = {y:upperDatay, x:upperDatax, mode: 'lines', name : name};
    var data = [points, upper];
    Plotly.plot('graf', data);
    document.getElementById("graf").style.visibility = "visible";
}

//Vypočítá nové skew a porovná ho s tím které dostane v argumentu, pokud se jejich rozdíl vleze do limitu ukončí výpočet dáného serveru.
function checkAndPlot(packets, lastKnownSkew, name){
    result = computeSkew(packets);
    console.log(name +" ("+Math.round(packets[packets.length-1].Client)+"s) vypočítané skew je "+result.Alpha+"(ms/s), beta je "+result.Beta);

    if(lastKnownSkew.Alpha != 0){
        if(Math.abs(lastKnownSkew.Alpha - result.Alpha) < 0.002 && Math.abs(result.Alpha) > 0.01){
            lastKnownSkew = result;

            switch(name){
                case "WorldClock":
                    document.getElementById("WorldClock").innerHTML = document.getElementById("WorldClock").innerHTML + '\n Výpočet dokončen';
                    document.getElementById("WorldClock").style.border = "1px dashed #27CB3F";
                    WCdone = true;
                    break;
                case "JSONTest":
                    document.getElementById("JSONTest").innerHTML = document.getElementById("JSONTest").innerHTML + '\n Výpočet dokončen';
                    document.getElementById("JSONTest").style.border = "1px dashed #27CB3F";
                    JTdone = true;
                    break;
                case "Eva":
                    document.getElementById("Eva").innerHTML = document.getElementById("Eva").innerHTML + '\n Výpočet dokončen';
                    document.getElementById("Eva").style.border = "1px dashed #27CB3F";
                    EVdone = true;
                    break;
            }

            plotPoints(packets, lastKnownSkew, name);

            var key = name + "-" + Date.now().toString();
            localStorage.setItem(key, [lastKnownSkew.Alpha,lastKnownSkew.Beta, Math.round(packets[packets.length-1].Client)]);
        }
    }            
    return result;
}

// ----------------------------------------- JSONTestApi -----------------------------------------
function getJsonTest(){
    var requestTest = new XMLHttpRequest();
    requestTest.open('GET', 'http://time.jsontest.com/', true);
    requestTest.onerror = function () {
        JTdone = true; //Pokud přijde error, noposílají se dále nové requesty
        document.getElementById("JTB").className = "activeB";
        document.getElementById("JSONTest").innerHTML = document.getElementById("JSONTest").innerHTML + '\n Server je nefunkční';
        document.getElementById("JSONTest").scrollTop = document.getElementById("JSONTest").scrollHeight;
    }
    requestTest.onload = function () {
        var cas = performance.now();
        var data = JSON.parse(this.response);
        if(JTServerstarttime == 0){
            JTServerstarttime = data.milliseconds_since_epoch;
            JTClientstarttime = cas;
        }else if(!JTdone){
            //Převede časy na sekundy a odečte počáteční čas
            var server = ((data.milliseconds_since_epoch - JTServerstarttime) / 1000).toFixed(3);
            var client = ((cas - JTClientstarttime)/1000).toFixed(6);
            var packet = {Client:client, Server:server, Offset:""};
            JTpackets.push(packet);
            setOffset(packet);
            document.getElementById("JSONTest").innerHTML = document.getElementById("JSONTest").innerHTML + '\n' + server + ' -- ' + client;
            document.getElementById("JSONTest").scrollTop = document.getElementById("JSONTest").scrollHeight;
            maxTime = client;
        }
    };
    requestTest.send();
    //Pokud je JTlastKnownSkew.Alpha 0 pak se porovnávají dvě naposledy vypočtené skew dokud se neustálí, Začne se počítat po uplinutí minTime
    if(JTlastKnownSkew.Alpha == 0){
        if(JTpackets.length % callSkewCompute == 0 && JTpackets.length > minPacketCount && JTpackets[JTpackets.length-1].Client > minTime){
            JTlastComputedSkew = checkAndPlot(JTpackets, JTlastComputedSkew, "JSONTest");
        }
    }else{ //Pokud JTlastKnownSkew.Alpha není 0, pak už známe skew z minulé session porovnáváme toto skew s nově vypočteným dokud se jejich rozdíl nedostane pod hranici
        if(JTpackets.length % callSkewCompute == 0 && JTpackets.length > minPacketCount){
            checkAndPlot(JTpackets, JTlastKnownSkew, "JSONTest");
        }
    }
}

// ----------------------------------------- WorldClockApi -----------------------------------------
function getWorldClock(){
    var requestClock = new XMLHttpRequest();
    requestClock.open('GET', 'http://www.worldclockapi.com/api/json/cet/now', true);
    requestClock.onerror = function () {
        WCdone = true; //Pokud přijde error, noposílají se dále nové requesty
        document.getElementById("WCB").className = "activeB";
        document.getElementById("WorldClock").innerHTML = document.getElementById("WorldClock").innerHTML + '\n Server je nefunkční';
        document.getElementById("WorldClock").scrollTop = document.getElementById("WorldClock").scrollHeight;
    }
    requestClock.onload = function () {
        var cas = performance.now();
        var data = JSON.parse(this.response);
        if(WCServerstarttime == 0){
            WCServerstarttime = data.currentFileTime;
            WCClientstarttime = cas;
        }else if(!WCdone){
            //Převede časy na sekundy a odečte počáteční čas
            var server = ((data.currentFileTime-WCServerstarttime)/10000000).toFixed(7);
            var client = ((cas-WCClientstarttime)/1000).toFixed(6);
            var packet = {Client:client, Server:server, Offset:""};
            WCpackets.push(packet);
            setOffset(packet);
            document.getElementById("WorldClock").innerHTML = document.getElementById("WorldClock").innerHTML + '\n' + server + ' -- ' + client;
            document.getElementById("WorldClock").scrollTop = document.getElementById("WorldClock").scrollHeight;
            maxTime = client;
        }
    };
    requestClock.send();
    if(WClastKnownSkew.Alpha == 0){
        if(WCpackets.length % callSkewCompute == 0 && WCpackets.length > minPacketCount && WCpackets[WCpackets.length-1].Client > minTime){
            WClastComputedSkew = checkAndPlot(WCpackets, WClastComputedSkew, "WorldClock");
        }
    }else{
        if(WCpackets.length % callSkewCompute == 0 && WCpackets.length > minPacketCount){
            checkAndPlot(WCpackets, WClastKnownSkew, "WorldClock");
        }
    }
}

// ----------------------------------------- Školní Server -----------------------------------------
function getSkolniServer(){
    var requestSkol = new XMLHttpRequest();
    requestSkol.open('GET', 'http://www.stud.fit.vutbr.cz/~xjires02/', true);
    requestSkol.onerror = function () {
        EVdone = true; //Pokud přijde error, noposílají se dále nové requesty
        document.getElementById("EVB").className = "activeB";
        document.getElementById("Eva").innerHTML = document.getElementById("Eva").innerHTML + '\n Server je nefunkční';
        document.getElementById("Eva").scrollTop = document.getElementById("Eva").scrollHeight;
    }
    requestSkol.onload = function () {
        var cas = performance.now();
        var data = JSON.parse(this.response);
        if(EVServerstarttime == 0){
            EVServerstarttime = data.hrtime;
            EVClientstarttime = cas;
        }else if(!EVdone){
            //Převede časy na sekundy a odečte počáteční čas
            var server = ((data.hrtime - EVServerstarttime)/1000000000).toFixed(9);
            var client = ((cas - EVClientstarttime)/1000).toFixed(6);
            var packet = {Client:client, Server:server, Offset:""};
            EVpackets.push(packet);
            setOffset(packet);
            document.getElementById("Eva").innerHTML = document.getElementById("Eva").innerHTML + '\n' + server + ' -- ' + client;
            document.getElementById("Eva").scrollTop = document.getElementById("Eva").scrollHeight;
            maxTime = client;
        }
    };
    requestSkol.send();
    if(EVlastKnownSkew.Alpha == 0){
        if(EVpackets.length % callSkewCompute == 0 && EVpackets.length > minPacketCount && EVpackets[EVpackets.length-1].Client > minTime){
            EVlastComputedSkew = checkAndPlot(EVpackets, EVlastComputedSkew, "Eva");
        }
    }else{
        if(EVpackets.length % callSkewCompute == 0 && EVpackets.length > minPacketCount){
            checkAndPlot(EVpackets, EVlastKnownSkew, "Eva");
        }
    }
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
        result.Alpha = Number(Alpha)*(-1);
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

