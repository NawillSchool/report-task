const { getTrips, getDriver, getVehicle } = require('api');

/**
 * This function should return the data for drivers in the specified format
 *
 * Question 4
 *
 * @returns {any} Driver report data
 */
async function driverReport() {
  //Variable declaration
  let driverIds = [], details = [], driverInfo = [], vehicleId = [], userTrip = [], report = [];
  let output = {}, tripCount = {}, numCash = {}, billCash = {}, numNonCash = {}, billNonCash = {}, billTot = {};

  //Fetch trip data
  const tripsMain = await getTrips();
  const trips = JSON.parse(JSON.stringify(tripsMain));

  //Looping through the trips data to get an array of driver ids
  for (const trip of trips) {
    if (typeof(trip.billedAmount) === "string") {
      trip.billedAmount = parseFloat(trip.billedAmount.split(',').join(''));
    }

    //An array of driver ids
    if (!driverIds.includes(trip.driverID)) {
      driverIds.push(trip.driverID);
    }
  };


  //Get's the drivers details for each driver with a valid id
  for (const id of driverIds) {
    details.push(getDriver(id));
  };

  //An object with the status of each resolved promise above
  const driverStat = await Promise.allSettled(details);

  //An array of objects containing valid driver's id as keys and driver info as values
  for (let i = 0; i < driverIds.length; i++) {
    id = driverIds[i];
    if (driverStat[i].status == 'fulfilled') {
      driverInfo.push({[id]: driverStat[i].value})
    }
  };

  //An array of objects with the driver ids as keys and an array vehicle ids as keys
  vehicleId = driverInfo.map((item) => {
    key = Object.keys(item);
    keyVal = key.pop();
    return { [keyVal]: item[keyVal].vehicleID };
  });


  //Outputing the vehicle details for each driver
  async function vehDetails(id) {
    for (let i = 0; i < vehicleId.length; i++) {
      driver = vehicleId[i];
      prop = Object.keys(driver).pop();
      if (id == prop) {
        if (driver[prop].length > 1) {
          vehId1 = driver[prop][0]; 
          vehId2 = driver[prop][1];
          
          veh1 = await getVehicle(vehId1).catch(() => null);
          veh2 = await getVehicle(vehId2).catch(() => null);

          return [
            {'plate': veh1.plate, 'manufacturer': veh1.manufacturer},
            {'plate':veh2.plate, 'manufacturer': veh2.manufacturer}
          ];
        } else {
          vehId = driver[prop].pop();
          veh = await getVehicle(vehId).catch(() => null);

          return [
            {'plate': veh.plate, 'manufaturer': veh.manufacturer}
          ];
        }
      }
    }
  };


  //Generates the trip data for each driver
  function fetchTripData(id) {
    for (const trip of trips) {
      if (trip.driverID === id) {
        tripData = {
          "user": trip.user.name,
          "created": trip.created,
          "pickup": trip.pickup.address,
          "destination": trip.destination.address,
          "billed": trip.billedAmount,
          "isCash": trip.isCash
        }

        userTrip.push(tripData);
        tripData = {}
      }
    }
    return userTrip;
  };
  console.log(fetchTripData('d247da84-ffcb-4ca8-8459-f98c99b59822'))

  //Returns objects containing additional output data
  for (const trip of trips) {
    id = trip.driverID;
    tripCount[id] ? tripCount[id]++ : tripCount[id] = 1;

    if (trip.isCash) {
      numCash[id] ? numCash[id]++ : numCash[id] = 1;
      billCash[id] ? trip.billedAmount++ : billCash[id] = trip.billedAmount;
    } else {
      numNonCash[id] ? numNonCash[id]++ : numNonCash[id] = 1;
      billNonCash[id] ? trip.billedAmount++ : billNonCash[id] = trip.billedAmount;      
    }

    billTot[id] = (billCash[id] + billNonCash[id]);
  };
  

  for (let i = 0; i < driverIds.length - 1; i++) {
    let ids = driverIds[i]
    output = {
      "fullName": driverInfo[i][ids].name,
      "id": ids,
      "phone": driverInfo[i][ids].phone,
      "noOfTrips": tripCount[ids],
      "noOfVehicles": driverInfo[i][ids].vehicleID.length,
      "vehicles": vehDetails(ids),
      "noOfCashTrips": numCash[ids],
      "noOfNonCashTrips": numNonCash[ids],
      "totalAmountEarned": billTot[ids],
      "totalCashAmount": billCash[ids],
      "totalNonCashAmount": billNonCash[ids],
      "trips": fetchTripData(ids)
    }
    report.push(output);
    output = {};
  };
  
  return report;
  //console.log(report);
};
driverReport()

module.exports = driverReport;
