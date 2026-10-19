const {
  getAllStations,
  getCurrentTrains,
  getAllTrainsByStationCode,
  getStationsFilter,
  getTrainMovements,
} = require('./IRFunc');

async function runDemo() {
  console.log('=== Irish Rail NPM Live Demo ===\n');

  try {
    console.log('1. Fetching total stations in network...');
    const stations = await getAllStations();
    console.log(`   Found ${stations.length} stations across Ireland.`);
    console.log(`   Sample station: ${stations[0]?.StationDesc} (Code: ${stations[0]?.StationCode})\n`);

    console.log('2. Searching stations by name query "Howth"...');
    const howthMatches = await getStationsFilter('Howth');
    console.log(`   Matches found: ${howthMatches.length}`);
    howthMatches.forEach((m) => console.log(`   - ${m.StationDesc} (${m.StationCode})`));
    console.log('');

    console.log('3. Fetching currently active trains on the network...');
    const activeTrains = await getCurrentTrains();
    console.log(`   Active trains currently running or starting shortly: ${activeTrains.length}`);
    if (activeTrains.length > 0) {
      const sample = activeTrains[0];
      console.log(`   Sample train: ${sample.TrainCode} [${sample.Direction}]`);
      console.log(`   Message: ${sample.PublicMessage.replace(/\n/g, ' ')}\n`);
    }

    console.log('4. Fetching real-time timetable for Tara Street (TARA)...');
    const taraTrains = await getAllTrainsByStationCode('TARA');
    console.log(`   Retrieved ${taraTrains.length} trains serving Tara Street.`);
    if (taraTrains.length > 0) {
      const nextTrain = taraTrains[0];
      console.log(`   Next train: ${nextTrain.Traincode} to ${nextTrain.Destination} due in ${nextTrain.Duein} mins (Late: ${nextTrain.Late} mins)`);

      console.log('\n5. Fetching movement timetable for train ' + nextTrain.Traincode + '...');
      const movements = await getTrainMovements(nextTrain.Traincode, nextTrain.Traindate);
      console.log(`   Total route stops: ${movements.length}`);
      if (movements.length > 0) {
        console.log(`   Origin: ${movements[0]?.LocationFullName} -> Final Destination: ${movements[movements.length - 1]?.LocationFullName}`);
      }
    }

    console.log('\n=== Demo Completed Successfully ===');
  } catch (error) {
    console.error('Error running demo:', error.message);
    process.exitCode = 1;
  }
}

runDemo();