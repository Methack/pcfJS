# pcfJS

Program získává čas ze serveru a porovnává ho s lokálním časem získaným pomocí js funkce performance.now. Tyto časové údaje používá pro výpočet posunu (skew) vnitřních hodin počítače.

Měření začne hned při načtení stránky. Lze ho zastavit zmáčknutím červeného tlačítka. Informace o předchozích úspěšných měření se zobrazí do tabulky (jestli nejsou infrmace tabulka, nejde vidět). Měření se zastaví pokud je výpočet úspěšný a nebo při překročí časového limitu. Pokud je měření úspěšné nastaví se zelené ohraničení kolem časových informací daného serveru. Po každém dokončení měření se pod časové informace vloží graf s naměřenými hodnotami. Tento graf je interaktivní. Po úspěšném měření se uloží informace o měření a zobrazí se při dalším načtení stránky. Tyto informace je možné smazat.



