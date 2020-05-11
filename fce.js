//Tento soubor obsahuje pomocné funkce, primárně pro výpis dat z localStorage


//Funkce vytváří nové elementy tabulky a vloží data z localStorage
function printStorage(whichStorage, caption){
    for (let i = 0; i < whichStorage.length; i++) {
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
        tdmereni.innerHTML = whichStorage[i].MeasureTime+" s";
        var tdalpha = document.createElement("td");
        tdalpha.innerHTML = whichStorage[i].Alpha;
        var tdbeta = document.createElement("td");
        tdbeta.innerHTML = whichStorage[i].Beta;
        var tdbutton = document.createElement("td");
        var x = document.createElement("img");
        x.onclick = function () {
            if(confirm("Opravdu chcete tento záznam smazat ("+whichStorage[i].Key+")?")){
                localStorage.removeItem(whichStorage[i].Key);
                var tr = document.getElementById(trid);
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
        tr.appendChild(tdbeta);
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
        id++;
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
//Nemusí clearovat interval, ten se clearne sám ve funkci CallThemAll()
function stopIt(){
    if(!JTdone){
        document.getElementById("JSONTest").value += '\n M\u011B\u0159en\u00ED zru\u0161eno';
        document.getElementById("JSONTest").style.border = "1px dashed #FF6159";
        JTdone = true;
        plotPoints(JTpackets, 0, "JSONTest");
    }
    if(!WCdone){
        document.getElementById("WorldClock").value += '\n M\u011B\u0159en\u00ED zru\u0161eno';
        document.getElementById("WorldClock").style.border = "1px dashed #FF6159";
        WCdone = true;
        plotPoints(WCpackets, 0,"WorldClock");
    }
    if(!EVdone){
        document.getElementById("Eva").value += '\n M\u011B\u0159en\u00ED zru\u0161eno';
        document.getElementById("Eva").style.border = "1px dashed #FF6159";
        EVdone = true;
        plotPoints(EVpackets, 0,"Eva"); 
    }  
}

//Vypíše všechny informace z localStorage
function showWholeStorage(){
    document.getElementById("bigStorage").style.visibility = "hidden";
    document.getElementById("bigStorage").style.position = "absolute";
    document.getElementById("show").style.visibility = "hidden";
    document.getElementById("show").style.position = "absolute";
    
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