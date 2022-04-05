const Trenitalia = require("api-trenitalia");
const moment = require('moment');
const fs = require('fs');

// Some constants
const MINHOUR = "6";
const MAXHOUR = "23";
const trenitalia = new Trenitalia();

/*  Nota: Le soluzione ricevute possono essere duplicate!
    TODO: Trovare il modo per collegare la soluzione al sito di Trenitalia
    TODO: Implementare la possibilitaa'di scegliere o meno di avere cambi
    TODO: 
*/


async function getWeekTrains(stationFromName, stationToName, startDate, days) {

    days = 1; // Debug purpose ELIMINATE
    const stations_from = await trenitalia.autocomplete(stationFromName);
    const station_from = stations_from[0].name;
    const stations_to = await trenitalia.autocomplete(stationToName);
    const station_to = stations_to[0].name;

    var startDate = moment(startDate);
    var dates = new Array();
    var solutionsEachDay = new Object();
    for (var i = 1; i <= days; i++) {
        //dates.push(startDate.add(1, 'days').format("DD/MM/YYYY"));
        let date = startDate.add(i, 'days').format("DD/MM/YYYY");
        solutionsEachDay[date] = await getTrainsForTheDay(date);
    }



    // for (const date of dates) {
    //     //solutionsPerDay[date] = await trenitalia.getOneWaySolutions(station_from, station_to, date, startHour, 1, 0, false, false, null);
    //     //solutionsPerDay[date] = filterAndSort(solutionsPerDay[date]);
    //     //tranformTimeToReadable(solutionsPerDay[date]);


    // }
    return solutionsEachDay;




    async function getTrainsForTheDay(date) {
        console.log("Cercando i treni nel giorno: " + date);
        let hour = MINHOUR;
        let daySolutions = new Array();
        let nReq = 0;
        let lastReqTrain;
        const MAXREQUEST = 10;
        let isEndDay = false;
        while (nReq <= MAXREQUEST && parseInt(hour) < parseInt(MAXHOUR) && !isEndDay) {
            nReq++;
            let temp = await trenitalia.getOneWaySolutions(station_from, station_to, date, hour, 1, 0, false, false, null);
            daySolutions.push(temp);
            let lastTrain = temp[temp.length-1];
            hour = moment(lastTrain.departuretime).format("HH"); // get last hour of last result
            if(moment(lastTrain.departuretime).format("DD/MM/YYYY") !== date)
                isEndDay = true;
            if(lastReqTrain != undefined && lastReqTrain.departuretime == lastTrain.departuretime){
                throw 'Loop Detected! In getAlldayTrain() with date = ' + date;
            }
            lastReqTrain = lastTrain;
        }
        daySolutions = uniqBy(daySolutions.flat(),(key) => key.trainlist[0].trainidentifier);
        return tranformTimeToReadable(daySolutions);
        

        // Funzione usata per ottenere array con valori unici
        function uniqBy(a, key) {
            var seen = {};
            return a.filter(function(item) {
                var k = key(item);
                return seen.hasOwnProperty(k) ? false : (seen[k] = true);
            })
        }
    }

}


function filterAndSort(solutionsArray) {
    return solutionsArray.filter(a => a.changesno == 0)//.sort((a, b) => a.originalPrice - b.originalPrice);
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

async function showResult() {
    var startDate = Date();
    var date = new Date();
    const corseTrovate = await getWeekTrains("Bologna", "Foggia", new Date().setMonth(4), 1 );
    saveToJSON("test/test.json", corseTrovate);
    for (giornata in corseTrovate) {
        console.log("Giorno: " + giornata);
        console.log(corseTrovate[giornata],null,"\t");
        console.log("------------------------");
    }
}


showResult();
console.log("Fine");

