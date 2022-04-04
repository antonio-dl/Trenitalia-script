const Trenitalia = require("api-trenitalia");
const Moment = require('moment');


async function getWeekTrains(stationFromName, stationToName, startDate, startHour) {


    const t = new Trenitalia();
    const stations_from = await t.autocomplete(stationFromName);
    const station_from = stations_from[0].name;
    const stations_to = await t.autocomplete(stationToName);
    const station_to = stations_to[0].name;
    var startDate = Moment(startDate);
    var dates = new Array();
    for (var i = 1; i < 8; i++) {
        dates.push(startDate.add(1, 'days').format("DD/MM/YYYY"));
    }

    var solutionsPerDay = new Object();
    for (const date of dates) {
        solutionsPerDay[date] = await t.getOneWaySolutions(station_from, station_to, date, startHour, 1, 0,false,false,null);
        // solutions = await t.getOneWaySolutions(station_from, station_to, element, startHour, 1, 0);
        // for (const solution of solutions) {
        //     console.log(`Treno:\t${solution.trainlist[0].trainidentifier}`);
        //     console.log(`Part:\t${new Date(solution.departuretime)}`);
        //     console.log(`Arri:\t${new Date(solution.arrivaltime)}`);
        //     console.log(`Prezzo:\t${solution.originalPrice} €`);
        //     console.log("-----------------------------------");
    }
    return solutionsPerDay;
    //console.log(solutions);

}


var startDate = Date();
var date = new Date();

getWeekTrains("Bologna", "Foggia", new Date(), "13").then(solutions => {
    console.log(solutions);
});
