const Trenitalia = require("api-trenitalia");
const moment = require('moment');
const fs = require('fs');

// Some constants
const MINHOUR = "6";
const MAXHOUR = "23";
const trenitalia = new Trenitalia();

/*  Nota: Le soluzione ricevute possono essere duplicate! (Problema risolto!)
    Utilizzo di moment perche' il fuso orario non permette di usare new Date();
    TODO: filtrare gli orari improponibili;
    TODO: Implementare la possibilita'di scegliere o meno di avere cambi
    */


async function getTrains(stationFromName, stationToName, startDate, days) {

    const stations_from = await trenitalia.autocomplete(stationFromName);
    const station_from = stations_from[0].name;
    const stations_to = await trenitalia.autocomplete(stationToName);
    const station_to = stations_to[0].name;

    let date = new moment(startDate);
    var solutionsArray = [];
    for (let i = 0; i < days; i++) {
        let date = startDate.add(1, 'days').format("DD/MM/YYYY");
        solutionsArray[i] = getAllDayTrains(date);
    }

    let solutionsByDay = {};
    let dataArray = await Promise.all(solutionsArray);

    for (let i = 0; i < days; i++) {
        //dates.push(startDate.add(1, 'days').format("DD/MM/YYYY"));
        let segnaposto = date.add(1, 'days').format("DD/MM/YYYY");
        solutionsByDay[segnaposto] = dataArray[i];
    }

    return solutionsByDay;



    // cerca i treni del giorno, gli filtra se sono a corsa unica, prende i migliori tre in base al prezzo
    async function getAllDayTrains(date) {
        console.log("Cercando i treni nel giorno: " + date);
        let hour = MINHOUR;
        let daySolutions = new Array();
        let nReq = 0;
        let lastReqTrain;
        const MAXREQUEST = 14;
        let isEndDay = false;
        // Necessario fare questi controlli per evitare loop infiniti
        while (nReq <= MAXREQUEST && parseInt(hour) < parseInt(MAXHOUR) && !isEndDay) {
            nReq++;
            let temp = await trenitalia.getOneWaySolutions(station_from, station_to, date, hour, 1, 0, false, false, null);
            daySolutions.push(temp);
            let lastTrain = temp[temp.length - 1];
            hour = moment(lastTrain.departuretime).format("HH"); // get last hour of last result
            if (moment(lastTrain.departuretime).format("DD/MM/YYYY") !== date)
                isEndDay = true;
            if (lastReqTrain != undefined && lastReqTrain.departuretime == lastTrain.departuretime) { // 5 risultati alla volta + piu' di 5 treni all' ora => loop infinito
                console.warn(`Alcune soluzioni del giorno ${date} ore: ${hour} potrebbero essere state state scartate ( Grazie API di trenitalia >:D )`)
                hour = moment(lastTrain.departuretime).add(1, "hours");
            }
            lastReqTrain = lastTrain;
        }

        daySolutions = uniqBy(daySolutions.flat(), (key) => key.trainlist[0].trainidentifier);
        // Filtra i treni senza cambio e sorta i risultati per prezzo, poi aggiunge delle proprieta' nell oggetto per rendere leggibili i risultati
        return tranformTimeToReadable(filterAndSort(daySolutions).slice(0, 3));


        // Funzione usata per ottenere array con valori unici
        function uniqBy(a, key) {
            var seen = {};
            return a.filter(function (item) {
                var k = key(item);
                return seen.hasOwnProperty(k) ? false : (seen[k] = true);
            })
        }
    }

}


function filterAndSort(solutionsArray) {
    return solutionsArray.filter(a => a.saleable && a.changesno == 0 /*&& (parseInt(moment(a.departuretime).format("HH")) < parseInt(MAXHOUR))*/)
        .sort((a, b) => a.originalPrice - b.originalPrice);
}

function tranformTimeToReadable(solutionsArray) {
    solutionsArray.forEach(solution => {
        solution.readableDeparturetime = moment(solution.departuretime).format("DD/MM HH:mm");
        solution.readableArrivaltime = moment(solution.arrivaltime).format("DD/MM HH:mm");
    });
    return solutionsArray;
}

async function saveToJSON(nameFile, obj) {
    fsPromises = fs.promises;
    await fsPromises.writeFile(nameFile, JSON.stringify(obj, null, "\t"), 'utf8');
    console.log("JSON file has been saved.");
}

function stampaSoluzione(soluzione) {
    console.log('--------------------------');
    // console.log(`Treno da:${soluzione.origin}`);
    // console.log(`Treno a:${soluzione.destination}`);
    console.log("Partenza:".padEnd(15) + `${soluzione.readableDeparturetime}`);
    console.log("Arrivo:".padEnd(15) + `${soluzione.readableArrivaltime}`);
    console.log("Prezzo min:".padEnd(15) + `\x1b[31m${soluzione.minprice}\x1b[0m`);
    console.log("Durata:".padEnd(15) + `${soluzione.duration}`);
    console.log("Treno:".padEnd(15) + `${soluzione.trainlist[0].trainidentifier}`);

    console.log("");
}

/// MAIN
async function Main() {
    var date = new Date(2022, 1, 01);
    var startDate = moment(date);
    const corseTrovate = await getTrains("Bologna", "Milano", startDate, 6);
    //saveToJSON("test/test.json", corseTrovate);


    let bestSolution;
    let bestPrice = Number.MAX_SAFE_INTEGER;
    for (giornata in corseTrovate) {
        let bestSoluzioniDelGiorno = corseTrovate[giornata]
        if (bestSoluzioniDelGiorno[0].minprice < bestPrice) {
            bestSolution = bestSoluzioniDelGiorno[0];
            bestPrice = bestSoluzioniDelGiorno[0].minprice
        }
        console.log("Giorno: " + giornata);
        for (soluzione of bestSoluzioniDelGiorno) {
            stampaSoluzione(soluzione);
        }
        console.log("=========================");
    }

    console.log("########################");
    console.log("\nMiglior soluzione\n");
    console.log("########################");
    stampaSoluzione(bestSolution);



}


Main();

