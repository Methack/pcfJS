/**************************************************************/
/*     Michal Jireš (xjires02), 2020                          */
/*                                                            */
/*     Stránka vznikla jako součást bakalářské práce          */
/*                                                            */
/*     Tento soubor obsahuje pomocné funkce pro změny GUI     */
/**************************************************************/


//Funkce vytváří nové elementy tabulky a vloží data z localStorage
function printStorage(whichStorage, caption){
    //Jedna iterace vytvoří elementy jednoho řádku
    for (let i = 0; i < whichStorage.length; i++) {
        id++;
        tr = document.createElement("tr");
        var trid = "tr"+id;
        var prevtr = "tr"+(id-1);
        var capid = "cap"+id; 
        tr.setAttribute("id", trid);
        //Čas
        var tdcas = document.createElement("td");
        var cas = new Date();
        cas.setTime(whichStorage[i].Time);
        tdcas.innerHTML = cas.toLocaleTimeString();
        //Den
        var tdden = document.createElement("td");
        tdden.innerHTML = cas.toLocaleDateString();
        //Doba měření
        var tdmereni = document.createElement("td");
        tdmereni.innerHTML = whichStorage[i].MeasureTime;
        //Skew
        var tdalpha = document.createElement("td");
        tdalpha.innerHTML = (Number(whichStorage[i].Alpha)*1000).toFixed(6);
        //Tlačítko na smazání
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
        //Připnutí elementů na element řádku <tr>
        tr.appendChild(tdden);
        tr.appendChild(tdcas);
        tr.appendChild(tdmereni);
        tr.appendChild(tdalpha);
        tr.appendChild(tdbutton);
        //Nastavení classy pro poslední řádek daného serveru
        if(i == whichStorage.length-1 && caption != "Eva")
            tr.className = "lastTr";
        //Přiřazení captionu
        switch(whichStorage.length){
            default :
            case 2 : if(i == 0){addCaption(caption)};break;
            case 3 : 
            case 4 : if(i == 1){addCaption(caption)};break;
            case 5 : if(i == 2){addCaption(caption)};break;
        }
        //Přiřazení rádku do tabulky
        document.getElementById("TTab").appendChild(tr);
    }
}

//Pomocná funkce pro tvorbu elementu Caption
function addCaption(caption){
    var cap = document.createElement("caption");
    cap.innerHTML = caption;
    var capid = "cap"+id;
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
            //Naplní pole 5ti prvky
            novyArray.push(whichStorage[i]);
            if(novyArray[nejmensi].MeasureTime >= novyArray[novyArray.length-1].MeasureTime)
                nejmensi = novyArray.length-1;
        }else{
            //Vyřazuje prvky pokud mají menší dobu měření
            if(novyArray[nejmensi].MeasureTime < whichStorage[i].MeasureTime){
                novyArray[nejmensi] = whichStorage[i];
                for (let j = 0; j < 5; j++) {
                    if(novyArray[nejmensi].MeasureTime > novyArray[j].MeasureTime){
                        nejmensi = j;
                    }
                }
            }
        }
        //Pamatuje si nejnovější měření
        if(whichStorage[i].Time > whichStorage[nejnovejsi].Time)
            nejnovejsi = i;
    }
    //Pokud již v poli nění tak vloží nejnovější měření
    if(whichStorage[nejnovejsi].MeasureTime < novyArray[nejmensi].MeasureTime){
        novyArray.pop(nejmensi);
        novyArray.push(whichStorage[nejnovejsi]);
    }
    return novyArray;
}

//Funkce zastaví zasílání packetů, tím zruší měření. Po ukončení měření se plotnou body. 
function stopIt(){
    if(!JTdone){
        //Pokud měření běží ukončí ho
        document.getElementById("JSONTest").value += '\n Measuring stopped';
        document.getElementById("JSONTest").style.border = "1px dashed #FF6159";
        document.getElementById("JSONTest").scrollTop = document.getElementById("JSONTest").scrollHeight;
        JTdone = true;
        plotPoints(JTpackets, 0, "JSONTest", true, JTlastKnownSkew);
    }else if(JTerror){
        //Pokud server poslal error
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
    //Vypně tlačítka pro errory
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

    //Čte prvky z localStorage a přiřazuje je serverům
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

//Zobrazí error button pro konkrétní server
function errorChangeGUI(name){
    var buttonname = "";
    var taname = "";

    switch(name){
        case "JT" : buttonname = "JTB"; taname = "JSONTest";break;
        case "WC" : buttonname = "WCB"; taname = "WorldClock";break;
        case "EV" : buttonname = "EVB"; taname = "Eva"; break;
        default :
    }
    //Rozšíří divy aby se tam vešli buttony
    document.getElementById("JSONTestd").style.height = "389px";
    document.getElementById("WorldClockd").style.height = "389px";
    document.getElementById("Evad").style.height = "389px";

    //Nastaví aby s buttony počítali ostatní prvky
    document.getElementById("JTB").style.position = "static";
    document.getElementById("WCB").style.position = "static";
    document.getElementById("EVB").style.position = "static";

    //Aktivuje konkrétní button serveru co poslal error
    document.getElementById(buttonname).className = "activeB";
    document.getElementById(taname).value += '\n Server error';
    document.getElementById(taname).scrollTop = document.getElementById(taname).scrollHeight;
    document.getElementById(taname).style.border = "1px dashed #FF6159";
}

//Volá se po zmáčknutí error buttonu, zase aktivuje server co poslal error
function errorButton(id){
    //Nastaví defaultní border pro textareu
    switch(id){
        case "JTB" : JTdone = false;document.getElementById("JSONTest").style.border = "1px solid #EEEEEE";break;
        case "WCB" : WCdone = false;document.getElementById("WorldClock").style.border = "1px solid #EEEEEE";break;
        case "EVB" : EVdone = false;document.getElementById("Eva").style.border = "1px solid #EEEEEE";break;
    }

    document.getElementById(id).className = "disabledB";
    //Pokud jsou všechny servery aktivní, deaktivuje error buttony a zmenší divy
    if(document.getElementById("JTB").className == "disabledB" && document.getElementById("WCB").className == "disabledB" && document.getElementById("EVB").className == "disabledB"){
        document.getElementById("JSONTestd").style.height = "354px";
        document.getElementById("WorldClockd").style.height = "354px";
        document.getElementById("Evad").style.height = "354px";
        
        document.getElementById("JTB").style.position = "absolute";
        document.getElementById("WCB").style.position = "absolute";
        document.getElementById("EVB").style.position = "absolute";
    }
}

//Zobrazí div a vypíše do něj informace
function showInfo(which){
    document.getElementById("infodiv").style.visibility = "visible";
    var text = "";
    switch(which){
        case "texta" : 
            text = "<b>Textareas</b> contain times from server and client. These times are shown like this: <br>"+
                    "Time since start from server -- Time since start from client<br><br>"+
                    "These time are obtained once per second by getting current timestamp from server/client and subtracting first timestamp from them.<br><br><hr><br>"+
                    "We use these times in computation of <b>clock skew</b>. Which is displayed bellow textareas once computed.<br><br>"+
                    "If the computed clock skew is final, its font size will be larger.<br><br>"+
                    "If there are records of previous measurements, you can get more information, by hovering over number of final clock skew.<br>"+
                    "(You can tell its available when final clock skew has dotted line under it)<br><br><hr><br>"+
                    "If measuring was successful respective server will have green border around textarea. Unsuccessful measuring will have red border.<br><br>"+
                    "After successful measuring, computed skew will be saved in local storage and displayed in table bellow on next visit.<br><br><hr><br>"+
                    "Graph will appear after 40 seconds of measuring.";
            break;
        case "graf" :
            text = "<b>Graph</b> is interactive. You can zoom by clicking and dragging.<br><br>"+
                    "To reset axes (zoom out) double click inside graph or click on <b>Reset axes</b> button in top right corner.<br><br>"+
                    "By clicking on trace in legend you can show/hide it.<br><br>"+
                    "By double clicking on single trace in legend you can isolate it.<br><br><hr><br>"+
                    "<b>Graph</b> contains information about timestamps and clock skew.<br><br>"+
                    "<b>Y axes</b> represents offset. We get offset by subtracting server time from client time.<br>"+
                    "<b>X axes</b> represents server time. Server time is shown in textareas.<br><br>"+
                    "Lines are lower bounds of respective points. Angle between line and x axes is clock skew of the Client.<br><br>"+
                    "For each server there are shown points with their respective line.";
            break;
        case "predesle" :
            break;

        default:
            document.getElementById("infodiv").style.visibility = "hidden";
            return;
    }
    document.getElementById("info").innerHTML = text;
}

//Schová div s informacemi 
function clearInfo(){
    document.getElementById('infodiv').style.visibility='hidden';
    document.getElementById("info").innerHTML = "";
}