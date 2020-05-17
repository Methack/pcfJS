//Tento soubor obsahuje pomocné funkce, primárně pro výpis dat z localStorage


//Funkce vytváří nové elementy tabulky a vloží data z localStorage
function printStorage(whichStorage, caption){
    for (let i = 0; i < whichStorage.length; i++) {
        id++;
        tr = document.createElement("tr");
        var trid = "tr"+id;
        var prevtr = "tr"+(id-1);
        var capid = "cap"+id; 
        tr.setAttribute("id", trid);
        var tdcas = document.createElement("td");
        var cas = new Date();
        cas.setTime(whichStorage[i].Time);
        tdcas.innerHTML = cas.toLocaleTimeString();
        var tdden = document.createElement("td");
        tdden.innerHTML = cas.toLocaleDateString();
        var tdmereni = document.createElement("td");
        tdmereni.innerHTML = whichStorage[i].MeasureTime;
        var tdalpha = document.createElement("td");
        tdalpha.innerHTML = (Number(whichStorage[i].Alpha)*1000).toFixed(6);
        var tdbutton = document.createElement("td");
        var x = document.createElement("img");
        x.onclick = function () {
            if(confirm("Are you sure you want to delete this record ("+whichStorage[i].Key+")?")){
                localStorage.removeItem(whichStorage[i].Key);
                var tr = this.parentNode.parentNode;
                document.getElementById("TTab").removeChild(tr);
                if(tr.className == "lastTr" && whichStorage.length > 1){
                    document.getElementById(prevtr).className = "lastTr";
                }else if(tr.className == "lastTr" && whichStorage.length == 1){
                    var cap = document.getElementById(capid);
                    if(cap != null)
                        document.getElementById("TTab").removeChild(cap);
                }else if(prevtr.className = "lastTr" && whichStorage.length == 1){
                    prevtr.className = "";
                }
            }
        }
        x.alt = "Smazat";
        x.src = "styles/x.png";
        x.height = "15";
        tdbutton.appendChild(x);
        tr.appendChild(tdden);
        tr.appendChild(tdcas);
        tr.appendChild(tdmereni);
        tr.appendChild(tdalpha);
        tr.appendChild(tdbutton);
        if(i == whichStorage.length-1 && caption != "Eva")
            tr.className = "lastTr";
        switch(whichStorage.length){
            default :
            case 2 : if(i == 0){addCaption(caption)};break;
            case 3 : 
            case 4 : if(i == 1){addCaption(caption)};break;
            case 5 : if(i == 2){addCaption(caption)};break;
        }
        document.getElementById("TTab").appendChild(tr);
    }
}

//Pomocná funkce pro tvorbu elementu Caption
function addCaption(caption){
    var cap = document.createElement("caption");
    cap.innerHTML = caption;
    capid = "cap"+id;
    cap.setAttribute("id", capid);
    document.getElementById("TTab").appendChild(cap);
}

//Funkce vrací skew z localStorage z předchozích meření. Vrací skew, které vyšlo po nejdelším měření
function getLastKnownSkew(whichStorage){
    var newest = 0;
    var skewPair = {Alpha:0, Beta:0};
    for (let index = 0; index < whichStorage.length; index++) {
        var measureTime = whichStorage[index].MeasureTime;
        if(measureTime > newest){
            newest = measureTime;
            skewPair.Alpha = whichStorage[index].Alpha;
            skewPair.Beta = whichStorage[index].Beta;
        }
    }
    return skewPair;
}

//Funkce redukuje jaká data se z localStorage zobrazí. (4x nejdelší měření + 1x nejnovější měření)
function reduceStorageArray(whichStorage){
    var nejnovejsi = 0;
    var nejmensi = 0;
    var novyArray = [];
    for (let i = 0; i < whichStorage.length; i++) {
        if(novyArray.length < 5){
            novyArray.push(whichStorage[i]);
            if(novyArray[nejmensi].MeasureTime >= novyArray[novyArray.length-1].MeasureTime)
                nejmensi = novyArray.length-1;
        }else{
            if(novyArray[nejmensi].MeasureTime < whichStorage[i].MeasureTime){
                novyArray[nejmensi] = whichStorage[i];
                for (let j = 0; j < 5; j++) {
                    if(novyArray[nejmensi].MeasureTime > novyArray[j].MeasureTime){
                        nejmensi = j;
                    }
                }
            }
        }
        if(whichStorage[i].Time > whichStorage[nejnovejsi].Time)
            nejnovejsi = i;
    }
    
    if(whichStorage[nejnovejsi].MeasureTime < novyArray[nejmensi].MeasureTime){
        novyArray.pop(nejmensi);
        novyArray.push(whichStorage[nejnovejsi]);
    }
    return novyArray;
}

//Funkce zastaví zasílání packetů, tím zruší měření. Po ukončení měření se plotnou body. 
function stopIt(){
    if(!JTdone){
        document.getElementById("JSONTest").value += '\n Measuring stopped';
        document.getElementById("JSONTest").style.border = "1px dashed #FF6159";
        document.getElementById("JSONTest").scrollTop = document.getElementById("JSONTest").scrollHeight;
        JTdone = true;
        plotPoints(JTpackets, 0, "JSONTest", true, JTlastKnownSkew);
    }else if(JTerror){
        if(document.getElementById("JSONTestskew").style.visibility = "hidden"){
            document.getElementById("JSONTestskew").innerHTML = "Couldn't compute skew";
            document.getElementById("JSONTestskew").style.position = 'static';
            document.getElementById("JSONTestskew").style.visibility = 'visible';
            document.getElementById("JSONTestskew").style.fontSize = "20px";
            document.getElementById("JSONTest").style.border = "1px dashed #FF6159";
        }
    }else{
        doPlot(JTpackets, JTlastComputedSkew, "JSONTest");
    }
    if(!WCdone){
        document.getElementById("WorldClock").value += '\n Measuring stopped';
        document.getElementById("WorldClock").style.border = "1px dashed #FF6159";
        document.getElementById("WorldClock").scrollTop = document.getElementById("WorldClock").scrollHeight;
        WCdone = true;
        plotPoints(WCpackets, 0,"WorldClock", true, WClastKnownSkew);
    }else if(WCerror){
        if(document.getElementById("WorldClockskew").style.visibility = "hidden"){
            document.getElementById("WorldClockskew").innerHTML = "Couldn't compute skew";
            document.getElementById("WorldClockskew").style.position = 'static';
            document.getElementById("WorldClockskew").style.visibility = 'visible';
            document.getElementById("WorldClockskew").style.fontSize = "20px";
            document.getElementById("WorldClock").style.border = "1px dashed #FF6159";
        }
    }else{
        doPlot(WCpackets, WClastComputedSkew, "WorldClock");
    }
    if(!EVdone){
        document.getElementById("Eva").value += '\n Measuring stopped';
        document.getElementById("Eva").style.border = "1px dashed #FF6159";
        document.getElementById("Eva").scrollTop = document.getElementById("Eva").scrollHeight;
        EVdone = true;
        plotPoints(EVpackets, 0,"Eva", true, EVlastKnownSkew); 
    }else if(EVerror){
        if(document.getElementById("Evaskew").style.visibility = "hidden"){
            document.getElementById("Evaskew").innerHTML = "Couldn't compute skew";
            document.getElementById("Evaskew").style.position = 'static';
            document.getElementById("Evaskew").style.visibility = 'visible';
            document.getElementById("Evaskew").style.fontSize = "20px";
            document.getElementById("Eva").style.border = "1px dashed #FF6159";
        }
    }else{
        doPlot(EVpackets, EVlastComputedSkew, "Eva");
    } 
    document.getElementById('JTB').className = 'disabledB';
    document.getElementById("JSONTestd").style.height = "354px";
    document.getElementById('WCB').className = 'disabledB';
    document.getElementById("WorldClockd").style.height = "354px";
    document.getElementById('EVB').className = 'disabledB';
    document.getElementById("Evad").style.height = "354px";
    document.getElementById('stop').className = 'disabledB'; 
    
    document.getElementById("graphUpdate").innerHTML = "";
    clearInterval(interval);
}

//Vypíše všechny informace z localStorage
function showWholeStorage(){
    document.getElementById("bigStorage").style.visibility = "hidden";
    document.getElementById("bigStorage").style.position = "absolute";
    document.getElementById("show").style.visibility = "hidden";
    document.getElementById("show").style.position = "absolute";
    document.getElementById("onlyfive").style.visibility = "hidden";
    document.getElementById("onlyfive").style.position = "absolute";
    
    JTstorage = [];
    WCstorage = [];
    EVstorage = [];

    for (let index = 0; index < localStorage.length; index++) {
        key = localStorage.key(index);
        item = localStorage.getItem(key).split(",");
        keys = key.split("-");
        switch(keys[0]){
            case "Eva" : {EVstorage.push({Time:keys[1], Alpha:Number(item[0]), Beta:Number(item[1]), MeasureTime:Number(item[2]), Key:key});break;}
            case "JSONTest" : {JTstorage.push({Time:keys[1], Alpha:Number(item[0]), Beta:Number(item[1]), MeasureTime:Number(item[2]), Key:key});break;}
            case "WorldClock" : {WCstorage.push({Time:keys[1], Alpha:Number(item[0]), Beta:Number(item[1]), MeasureTime:Number(item[2]), Key:key});break;}
        }
    }

    var table = document.getElementById("TTab");
    for(;table.childElementCount > 1;){
        table.removeChild(table.lastChild);
    }

    printStorage(JTstorage, "JSONTest");
    printStorage(WCstorage, "WorldClock");
    printStorage(EVstorage, "Eva");
}

function errorChangeGUI(name){
    var buttonname = "";
    var taname = "";

    switch(name){
        case "JT" : buttonname = "JTB"; taname = "JSONTest";break;
        case "WC" : buttonname = "WCB"; taname = "WorldClock";break;
        case "EV" : buttonname = "EVB"; taname = "Eva"; break;
        default :
    }

    document.getElementById("JSONTestd").style.height = "389px";
    document.getElementById("WorldClockd").style.height = "389px";
    document.getElementById("Evad").style.height = "389px";

    document.getElementById("JTB").style.position = "static";
    document.getElementById("WCB").style.position = "static";
    document.getElementById("EVB").style.position = "static";

    document.getElementById(buttonname).className = "activeB";
    document.getElementById(taname).value += '\n Server error';
    document.getElementById(taname).scrollTop = document.getElementById("JSONTest").scrollHeight;
}

function errorButton(id){

    switch(id){
        case "JTB" : JTdone = false;document.getElementById("JSONTest").style.border = "none";break;
        case "WCB" : WCdone = false;document.getElementById("WorldClock").style.border = "none";break;
        case "EVB" : EVdone = false;document.getElementById("Eva").style.border = "none";break;
    }

    document.getElementById(id).className = "disabledB";

    if(document.getElementById("JTB").className == "disabledB" && document.getElementById("WCB").className == "disabledB" && document.getElementById("EVB").className == "disabledB"){
        document.getElementById("JSONTestd").style.height = "354px";
        document.getElementById("WorldClockd").style.height = "354px";
        document.getElementById("Evad").style.height = "354px";
        
        document.getElementById("JTB").style.position = "absolute";
        document.getElementById("WCB").style.position = "absolute";
        document.getElementById("EVB").style.position = "absolute";
    }
}
