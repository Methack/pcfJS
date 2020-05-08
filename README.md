# pcfJS

Program získává čas ze serveru a porovnává ho s lokálním časem získaným pomocí js funkce performance.now. Tyto časové údaje používá pro výpočet posunu (skew) vnitřních hodin počítače.

Měření začne hned při načtení stránky. Lze ho zastavit zmáčknutím červeného tlačítka. Informace o předchozích úspěšných měření se zobrazí do tabulky (jestli nejsou infrmace tabulka, nejde vidět). Měření se zastaví pokud je výpočet úspěšný a nebo při překročí časového limitu. Pokud je měření úspěšné nastaví se zelené ohraničení kolem časových informací daného serveru. Po každém dokončení měření se pod časové informace vloží graf s naměřenými hodnotami. Tento graf je interaktivní. Po úspěšném měření se uloží informace o měření a zobrazí se při dalším načtení stránky. Tyto informace je možné smazat.

Časové údaje se získávají ze serverů pravidelně. Jak často, lze nastavit pomocí intervalTime v pcf.js. První měření probíhá déle, aby bylo možné získat co nejpřesnější hodnotu posunu. Pro změnu trvání prvního měření stačí změnit minTime vložením vlastní hodnoty v sekundách. Po úspěšném měření se uloží vypočítaná hodnota posunu (pro daný server). Při dalších měření se hledá stejná hodnota v rozmení (-2,2). Výpočet u dalších měření začne po získání dostatečného množství datových informací, množství lze změnit pomocí minPacketCount.  Výpočet je úspěšný pokud je stejný výsledek pro dva po sobě provedené výpočty. Jak často se provádí výpočty je možné změnit pomocí callSkewComputeTime. Při výpočtu existuje časový limit endWhen.



