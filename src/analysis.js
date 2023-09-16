const { getTrips, getDriver } = require('api');

/**
 * This function should return the trip data analysis
 *
 * Question 3
 * @returns {any} Trip data analysis
 */
async function analysis() {
  const tripsMain = await getTrips();
  const trips = JSON.parse(JSON.stringify(tripsMain));
  let cashCount = 0, nonCashCount = 0, billTot = 0, cashBill = 0, nonCashBill = 0, driverCount = 0, maxCount = 0, driverId;
  let mostTripId, mostTripBill = 0, maxID, maxIdValue, highEarnTrips = 0;
  let unique = [], details = [], validData = [], tripCount = {}, driverEarnings = {};

  //Looping through to get data from each trip in the array of trips
  for (const trip of trips) {
    if (typeof(trip.billedAmount) === "string") {
      trip.billedAmount = parseFloat(trip.billedAmount.split(',').join(''));
    }
    
    if (trip.isCash) {
      cashCount++;
      cashBill += trip.billedAmount;
    } else {
      nonCashCount++;
      nonCashBill += trip.billedAmount;
    }
    
    //Get an array of unique driver IDs
    driverId = trip.driverID;
    if (!unique.includes(driverId)) {
      unique.push(driverId);
    }

    //An object with the trip count for each driver
    tripCount[driverId] ? tripCount[driverId]++ : tripCount[driverId] = 1;
  };

  //Total billed amount for all trips
  billTot = cashBill + nonCashBill;

  //Get's the details for each promise using their unique id
  for (const id of unique) {
    details.push(getDriver(id));
  };

  //An object containing the status of each resolved promise
  const dData = await Promise.allSettled(details);
  
  //An object of driver details filtered using the status from the above data
  validData = dData.filter(item => {
    if (item.status == 'fulfilled') {
      return item;
    }
  });

  //Loops through the valid data to return the drivers whom have more than 1 vehicle
  for (let d of validData) {
    if (d.value.vehicleID.length > 1) {
      driverCount++;
    }
  };


  //Gets the driver with the most trips
  for (let prop in tripCount) {
    if (tripCount[prop] > maxCount) {
      maxCount = tripCount[prop];
      mostTripId = prop;
    }
  };

  //Driver with the most trips
  const driverMT = await getDriver(mostTripId).catch(() => null);

  //The total amount earned by the driver with the most trips
  for (let i = 0; i < trips.length; i++) {
    if (mostTripId === trips[i].driverID) {
      mostTripBill += trips[i].billedAmount;
    }
    
    //Populates an object with the total earnings of every driver
    let earn = trips[i].billedAmount;
    driverEarnings[trips[i].driverID] = driverEarnings[trips[i].driverID] ? driverEarnings[trips[i].driverID] + earn : earn;
  };
  
  //Take value earnings to two decimal places
  for (let prop in driverEarnings) {
    driverEarnings[prop] = Number(driverEarnings[prop].toFixed(2));
  };

  //Sorts through the entires of the driverEarnings object and returns it as an array
  maxID = Object.entries(driverEarnings).sort((a, b) => b[1] - a[1])[0];
  maxIdValue = maxID[1];

  //Driver with the highest earning
  const driverHE = await getDriver(maxID[0]).catch(() => null);

  //Number of trips for the driver with the highest earnings
  for (let prop in tripCount) {
    if (prop == maxID[0]) {
      highEarnTrips = tripCount[prop];
    }
  };

  const output = {
    "noOfCashTrips": cashCount,
    "noOfNonCashTrips": nonCashCount,
    "billedTotal": billTot,
    "cashBilledTotal": cashBill,
    "nonCashBilledTotal": Number(nonCashBill.toFixed(2)),
    "noOfDriversWithMoreThanOneVehicle": driverCount,
    "mostTripsByDriver": {
      "name": driverMT.name,
      "email": driverMT.email,
      "phone": driverMT.phone,
      "noOfTrips": maxCount,
      "totalAmountEarned": mostTripBill
    },
    "highestEarningDriver": {
      "name": driverHE.name,
      "email": driverHE.email,
      "phone": driverHE.phone,
      "noOfTrips": highEarnTrips,
      "totalAmountEarned": maxIdValue
    }
  };
  
  return output;
}

module.exports = analysis;
