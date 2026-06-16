const { getAllTrainsByStationCode } = require('./IRFunc');

async function runTest() {
  try {
    console.log('Fetching live train data for Tara Street (TARA)...');
    const trains = await getAllTrainsByStationCode('TARA');
    console.log(`Successfully retrieved ${trains.length} trains.`);
    if (trains.length > 0) {
      console.log('Sample train data:', trains[0]);
    } else {
      console.log('No trains currently scheduled or active for TARA.');
    }
  } catch (error) {
    console.error('Error running test:', error.message);
  }
}

runTest();