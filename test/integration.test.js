const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const IR = require('../IRFunc');

describe('Irish Rail Live API Integration Tests', () => {
  it('getAllStations() returns full list of stations across Ireland', async () => {
    const stations = await IR.getAllStations();
    assert.strictEqual(Array.isArray(stations), true);
    assert.ok(stations.length > 100, `Expected > 100 stations, got ${stations.length}`);

    const tara = stations.find((s) => s.StationCode === 'TARA');
    assert.ok(tara, 'Tara Street station should exist');
    assert.strictEqual(tara.StationDesc, 'Tara Street');
    assert.ok(tara.StationLatitude, 'StationLatitude should be defined');
    assert.ok(tara.StationLongitude, 'StationLongitude should be defined');
    assert.ok(tara.StationId, 'StationId should be defined');
  });

  it('getCurrentTrains() returns currently active train positions', async () => {
    const trains = await IR.getCurrentTrains();
    assert.strictEqual(Array.isArray(trains), true);
    if (trains.length > 0) {
      const train = trains[0];
      assert.ok('TrainStatus' in train);
      assert.ok('TrainLatitude' in train);
      assert.ok('TrainLongitude' in train);
      assert.ok('TrainCode' in train);
      assert.ok('TrainDate' in train);
      assert.ok('PublicMessage' in train);
      assert.ok('Direction' in train);
    }
  });

  it('getAllStationsFilter() filters by station type and normalizes casing', async () => {
    const allStations = await IR.getAllStations();
    const dartStationsUpper = await IR.getAllStationsFilter('D');
    const dartStationsLower = await IR.getAllStationsFilter('d');

    assert.ok(dartStationsUpper.length > 0);
    assert.ok(dartStationsUpper.length < allStations.length);
    assert.strictEqual(dartStationsUpper.length, dartStationsLower.length);

    const mainline = await IR.getAllStationsFilter('M');
    assert.ok(mainline.length > 0);
  });

  it('getAllTrainsFilter() returns filtered running trains', async () => {
    const dartTrains = await IR.getAllTrainsFilter('D');
    assert.strictEqual(Array.isArray(dartTrains), true);

    const allTrains = await IR.getAllTrainsFilter('A');
    assert.strictEqual(Array.isArray(allTrains), true);
    assert.ok(allTrains.length >= dartTrains.length);
  });

  it('getAllStationCodes() returns code list containing major hubs', async () => {
    const codes = await IR.getAllStationCodes({ forceRefresh: true });
    assert.strictEqual(Array.isArray(codes), true);
    assert.ok(codes.length > 100);
    assert.ok(codes.includes('TARA'));
    assert.ok(codes.includes('CNLLY'));
    assert.ok(codes.includes('HSTON'));
  });

  it('getStationDataByCode() fetches station timetable data', async () => {
    const data = await IR.getStationDataByCode('TARA');
    assert.strictEqual(Array.isArray(data), true);
    if (data.length > 0) {
      const item = data[0];
      assert.strictEqual(item.Stationcode, 'TARA');
      assert.ok('Traincode' in item);
      assert.ok('Servertime' in item);
      assert.ok('Querytime' in item);
      assert.ok('Duein' in item);
    }
  });

  it('getStationDataByCodeWithNums() fetches timetable data within specified time window', async () => {
    const data60 = await IR.getStationDataByCodeWithNums('TARA', 60);
    const data20 = await IR.getStationDataByCodeWithNums('TARA', 20);

    assert.strictEqual(Array.isArray(data60), true);
    assert.strictEqual(Array.isArray(data20), true);
    assert.ok(data60.length >= data20.length);
  });

  it('getAllTrainsByStationCode() works with normalization and rejects unknown codes', async () => {
    const dataUpper = await IR.getAllTrainsByStationCode('TARA');
    const dataLower = await IR.getAllTrainsByStationCode('tara');
    const dataTrimmed = await IR.getAllTrainsByStationCode('  TARA  ');

    assert.strictEqual(Array.isArray(dataUpper), true);
    assert.strictEqual(dataUpper.length, dataLower.length);
    assert.strictEqual(dataUpper.length, dataTrimmed.length);

    await assert.rejects(
      async () => IR.getAllTrainsByStationCode('FAKE_STATION_CODE'),
      /Invalid station code: FAKE_STATION_CODE/
    );
  });

  it('getAllTrainsServing() returns trains for station by name', async () => {
    const data = await IR.getAllTrainsServing('Dublin Connolly');
    assert.strictEqual(Array.isArray(data), true);
    if (data.length > 0) {
      assert.strictEqual(data[0].Stationfullname, 'Dublin Connolly');
    }
  });

  it('getAllTrainsServingWthNums() respects minute parameter', async () => {
    const data = await IR.getAllTrainsServingWthNums('Dublin Connolly', 30);
    assert.strictEqual(Array.isArray(data), true);
  });

  it('getStationsFilter() searches stations by keyword', async () => {
    const results = await IR.getStationsFilter('Howth');
    assert.strictEqual(Array.isArray(results), true);
    assert.ok(results.length >= 1);
    const howth = results.find((s) => s.StationCode === 'HOWTH');
    assert.ok(howth, 'Expected HOWTH in search results');
    assert.strictEqual(howth.StationDesc, 'Howth');
  });

  it('getTrainMovements() fetches stop sequence for active train', async () => {
    const currentTrains = await IR.getCurrentTrains();
    if (currentTrains.length > 0) {
      const activeTrain = currentTrains[0];
      const movements = await IR.getTrainMovements(activeTrain.TrainCode, activeTrain.TrainDate);
      assert.strictEqual(Array.isArray(movements), true);
      if (movements.length > 0) {
        assert.ok('LocationCode' in movements[0]);
        assert.ok('LocationFullName' in movements[0]);
        assert.ok('LocationOrder' in movements[0]);
      }
    }
  });
});
