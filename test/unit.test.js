const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const IR = require('../IRFunc');

describe('Irish Rail NPM - Unit Tests', () => {
  afterEach(() => {
    mock.reset();
  });

  describe('fetchIrishRail parser', () => {
    it('should parse and flatten valid XML data correctly', async () => {
      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
        <ArrayOfObjStation xmlns="http://api.irishrail.ie/realtime/">
          <objStation>
            <StationDesc> Belfast </StationDesc>
            <StationAlias />
            <StationLatitude>54.6123</StationLatitude>
            <StationLongitude>-5.91744</StationLongitude>
            <StationCode>BFSTC</StationCode>
            <StationId>228</StationId>
          </objStation>
        </ArrayOfObjStation>`;

      mock.method(axios, 'get', async () => ({ data: mockXml }));

      const result = await IR.fetchIrishRail('getAllStationsXML', {}, 'ArrayOfObjStation', 'objStation');

      assert.strictEqual(Array.isArray(result), true);
      assert.strictEqual(result.length, 1);
      assert.deepStrictEqual(result[0], {
        StationDesc: 'Belfast',
        StationAlias: '',
        StationLatitude: '54.6123',
        StationLongitude: '-5.91744',
        StationCode: 'BFSTC',
        StationId: '228',
      });
    });

    it('should handle empty XML root elements gracefully', async () => {
      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
        <ArrayOfObjStation xmlns="http://api.irishrail.ie/realtime/" />`;

      mock.method(axios, 'get', async () => ({ data: mockXml }));

      const result = await IR.fetchIrishRail('getAllStationsXML', {}, 'ArrayOfObjStation', 'objStation');
      assert.deepStrictEqual(result, []);
    });

    it('should handle empty string response without throwing unhandled exceptions', async () => {
      mock.method(axios, 'get', async () => ({ data: '' }));

      const result = await IR.fetchIrishRail('getAllStationsXML', {}, 'ArrayOfObjStation', 'objStation');
      assert.deepStrictEqual(result, []);
    });

    it('should convert empty object tags to empty string', async () => {
      const xml2js = require('xml2js');
      mock.method(axios, 'get', async () => ({ data: '<dummy/>' }));
      mock.method(xml2js, 'parseStringPromise', async () => ({
        ArrayOfObjStation: {
          objStation: [
            {
              EmptyTag: [{}],
              NormalTag: ['Hello'],
            },
          ],
        },
      }));

      const res = await IR.fetchIrishRail('getAllStationsXML', {}, 'ArrayOfObjStation', 'objStation');
      assert.deepStrictEqual(res, [{ EmptyTag: '', NormalTag: 'Hello' }]);
    });

    it('should handle non-string / nested object values in XML', async () => {
      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
        <ArrayOfObjStation xmlns="http://api.irishrail.ie/realtime/">
          <objStation>
            <CustomField><Nested>val</Nested></CustomField>
          </objStation>
        </ArrayOfObjStation>`;

      mock.method(axios, 'get', async () => ({ data: mockXml }));

      const result = await IR.fetchIrishRail('getAllStationsXML', {}, 'ArrayOfObjStation', 'objStation');
      assert.strictEqual(result.length, 1);
      assert.deepStrictEqual(result[0].CustomField, { Nested: ['val'] });
    });

    it('should throw when XML is malformed', async () => {
      mock.method(axios, 'get', async () => ({ data: '<unclosedTag>' }));

      await assert.rejects(
        async () => IR.fetchIrishRail('getAllStationsXML', {}, 'ArrayOfObjStation', 'objStation'),
        /Unclosed root tag/
      );
    });
  });

  describe('getAllStations()', () => {
    it('should retrieve all stations', async () => {
      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
        <ArrayOfObjStation>
          <objStation>
            <StationDesc>Dublin Connolly</StationDesc>
            <StationCode>CNLLY</StationCode>
          </objStation>
          <objStation>
            <StationDesc>Tara Street</StationDesc>
            <StationCode>TARA</StationCode>
          </objStation>
        </ArrayOfObjStation>`;

      mock.method(axios, 'get', async (url) => {
        assert.match(url, /getAllStationsXML$/);
        return { data: mockXml };
      });

      const stations = await IR.getAllStations();
      assert.strictEqual(stations.length, 2);
      assert.strictEqual(stations[0].StationCode, 'CNLLY');
      assert.strictEqual(stations[1].StationCode, 'TARA');
    });

    it('should throw formatted error when request fails', async () => {
      mock.method(axios, 'get', async () => {
        throw new Error('Network timeout');
      });

      await assert.rejects(
        async () => IR.getAllStations(),
        {
          name: 'Error',
          message: 'Failed to retrieve stations',
        }
      );
    });
  });

  describe('getCurrentTrains()', () => {
    it('should retrieve current running trains', async () => {
      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
        <ArrayOfObjTrainPositions>
          <objTrainPositions>
            <TrainStatus>R</TrainStatus>
            <TrainLatitude>53.35</TrainLatitude>
            <TrainLongitude>-6.26</TrainLongitude>
            <TrainCode>E101</TrainCode>
            <TrainDate>19 Oct 2026</TrainDate>
            <PublicMessage>E101 running</PublicMessage>
            <Direction>Southbound</Direction>
          </objTrainPositions>
        </ArrayOfObjTrainPositions>`;

      mock.method(axios, 'get', async (url) => {
        assert.match(url, /getCurrentTrainsXML$/);
        return { data: mockXml };
      });

      const trains = await IR.getCurrentTrains();
      assert.strictEqual(trains.length, 1);
      assert.strictEqual(trains[0].TrainCode, 'E101');
      assert.strictEqual(trains[0].Direction, 'Southbound');
    });

    it('should throw formatted error on failure', async () => {
      mock.method(axios, 'get', async () => {
        throw new Error('Server error');
      });

      await assert.rejects(
        async () => IR.getCurrentTrains(),
        { message: 'Failed to retrieve train positions' }
      );
    });
  });

  describe('getAllStationsFilter(stationType)', () => {
    it('should pass correct station type parameter', async () => {
      let capturedParams;
      mock.method(axios, 'get', async (url, config) => {
        capturedParams = config?.params;
        return { data: '<ArrayOfObjStation></ArrayOfObjStation>' };
      });

      await IR.getAllStationsFilter('D');
      assert.deepStrictEqual(capturedParams, { StationType: 'D' });

      await IR.getAllStationsFilter('m');
      assert.deepStrictEqual(capturedParams, { StationType: 'M' });

      await IR.getAllStationsFilter('invalid');
      assert.deepStrictEqual(capturedParams, { StationType: 'A' });
    });

    it('should throw on failure', async () => {
      mock.method(axios, 'get', async () => { throw new Error('fail'); });
      await assert.rejects(() => IR.getAllStationsFilter('D'), /Failed to retrieve stations/);
    });
  });

  describe('getAllTrainsFilter(trainType)', () => {
    it('should pass correct train type parameter', async () => {
      let capturedParams;
      mock.method(axios, 'get', async (url, config) => {
        capturedParams = config?.params;
        return { data: '<ArrayOfObjTrainPositions></ArrayOfObjTrainPositions>' };
      });

      await IR.getAllTrainsFilter('S');
      assert.deepStrictEqual(capturedParams, { TrainType: 'S' });

      await IR.getAllTrainsFilter('d');
      assert.deepStrictEqual(capturedParams, { TrainType: 'D' });

      await IR.getAllTrainsFilter('other');
      assert.deepStrictEqual(capturedParams, { TrainType: 'A' });
    });

    it('should throw on failure', async () => {
      mock.method(axios, 'get', async () => { throw new Error('fail'); });
      await assert.rejects(() => IR.getAllTrainsFilter('D'), /Failed to retrieve train positions/);
    });
  });

  describe('getAllTrainsServing(stationDesc)', () => {
    it('should query station data by name', async () => {
      let capturedParams;
      mock.method(axios, 'get', async (url, config) => {
        assert.match(url, /getStationDataByNameXML$/);
        capturedParams = config?.params;
        return { data: '<ArrayOfObjStationData></ArrayOfObjStationData>' };
      });

      const res = await IR.getAllTrainsServing('Dublin Connolly');
      assert.deepStrictEqual(res, []);
      assert.deepStrictEqual(capturedParams, { StationDesc: 'Dublin Connolly' });
    });

    it('should throw on failure', async () => {
      mock.method(axios, 'get', async () => { throw new Error('fail'); });
      await assert.rejects(() => IR.getAllTrainsServing('Connolly'), /Failed to retrieve train data/);
    });
  });

  describe('getAllTrainsServingWthNums(station, time) and alias', () => {
    it('should query station data by name with NumMins', async () => {
      let capturedParams;
      mock.method(axios, 'get', async (url, config) => {
        assert.match(url, /getStationDataByNameXML_withNumMins$/);
        capturedParams = config?.params;
        return { data: '<ArrayOfObjStationData></ArrayOfObjStationData>' };
      });

      await IR.getAllTrainsServingWthNums('Tara Street', 30);
      assert.deepStrictEqual(capturedParams, { StationDesc: 'Tara Street', NumMins: 30 });
    });

    it('alias getAllTrainsServingWithNums should reference same function', () => {
      assert.strictEqual(IR.getAllTrainsServingWithNums, IR.getAllTrainsServingWthNums);
    });

    it('should throw on failure', async () => {
      mock.method(axios, 'get', async () => { throw new Error('fail'); });
      await assert.rejects(() => IR.getAllTrainsServingWthNums('Tara Street', 20), /Failed to retrieve train data/);
    });
  });

  describe('getAllStationCodes()', () => {
    it('should return array of station codes and use cache on subsequent calls', async () => {
      let calls = 0;
      mock.method(axios, 'get', async () => {
        calls++;
        return {
          data: `<?xml version="1.0" encoding="utf-8"?>
            <ArrayOfObjStation>
              <objStation><StationCode>TARA</StationCode></objStation>
              <objStation><StationCode>CNLLY</StationCode></objStation>
            </ArrayOfObjStation>`,
        };
      });

      // Force refresh first to ensure clean state
      const codes1 = await IR.getAllStationCodes({ forceRefresh: true });
      assert.deepStrictEqual(codes1, ['TARA', 'CNLLY']);
      assert.strictEqual(calls, 1);

      // Subsequent call should use memory cache
      const codes2 = await IR.getAllStationCodes();
      assert.deepStrictEqual(codes2, ['TARA', 'CNLLY']);
      assert.strictEqual(calls, 1);

      // Force refresh should make a new HTTP call
      const codes3 = await IR.getAllStationCodes({ forceRefresh: true });
      assert.deepStrictEqual(codes3, ['TARA', 'CNLLY']);
      assert.strictEqual(calls, 2);
    });

    it('should throw on failure when fetching station codes', async () => {
      mock.method(axios, 'get', async () => { throw new Error('codes network fail'); });
      await assert.rejects(
        () => IR.getAllStationCodes({ forceRefresh: true }),
        /Failed to retrieve station codes/
      );
    });
  });

  describe('getStationDataByCode(stationCode)', () => {
    it('should query station data by code with normalized uppercase', async () => {
      let capturedParams;
      mock.method(axios, 'get', async (url, config) => {
        assert.match(url, /getStationDataByCodeXML$/);
        capturedParams = config?.params;
        return { data: '<ArrayOfObjStationData></ArrayOfObjStationData>' };
      });

      await IR.getStationDataByCode('tara');
      assert.deepStrictEqual(capturedParams, { StationCode: 'TARA' });
    });

    it('should throw on failure', async () => {
      mock.method(axios, 'get', async () => { throw new Error('fail'); });
      await assert.rejects(() => IR.getStationDataByCode('TARA'), /Failed to retrieve station data/);
    });
  });

  describe('getStationDataByCodeWithNums(stationCode, time)', () => {
    it('should query station data by code with numMins', async () => {
      let capturedParams;
      mock.method(axios, 'get', async (url, config) => {
        assert.match(url, /getStationDataByCodeXML_WithNumMins$/);
        capturedParams = config?.params;
        return { data: '<ArrayOfObjStationData></ArrayOfObjStationData>' };
      });

      await IR.getStationDataByCodeWithNums('tara', 45);
      assert.deepStrictEqual(capturedParams, { StationCode: 'TARA', NumMins: 45 });
    });

    it('should throw on failure', async () => {
      mock.method(axios, 'get', async () => { throw new Error('fail'); });
      await assert.rejects(() => IR.getStationDataByCodeWithNums('TARA', 45), /Failed to retrieve station data/);
    });
  });

  describe('getStationsFilter(stationText)', () => {
    it('should query stations filter XML', async () => {
      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
        <ArrayOfObjStationFilter>
          <objStationFilter>
            <StationDesc_sp>Howth</StationDesc_sp>
            <StationDesc>Howth</StationDesc>
            <StationCode>HOWTH</StationCode>
          </objStationFilter>
        </ArrayOfObjStationFilter>`;

      mock.method(axios, 'get', async (url, config) => {
        assert.match(url, /getStationsFilterXML$/);
        assert.deepStrictEqual(config.params, { StationText: 'Howth' });
        return { data: mockXml };
      });

      const res = await IR.getStationsFilter('Howth');
      assert.strictEqual(res.length, 1);
      assert.strictEqual(res[0].StationCode, 'HOWTH');
    });

    it('should throw on failure', async () => {
      mock.method(axios, 'get', async () => { throw new Error('fail'); });
      await assert.rejects(() => IR.getStationsFilter('Howth'), /Failed to retrieve station filter data/);
    });
  });

  describe('getTrainMovements(trainId, trainDate)', () => {
    it('should query train movements XML', async () => {
      const mockXml = `<?xml version="1.0" encoding="utf-8"?>
        <ArrayOfObjTrainMovements>
          <objTrainMovements>
            <TrainCode>P423</TrainCode>
            <TrainDate>19 Oct 2026</TrainDate>
            <LocationCode>HZLCH</LocationCode>
            <LocationFullName>Hazelhatch</LocationFullName>
          </objTrainMovements>
        </ArrayOfObjTrainMovements>`;

      mock.method(axios, 'get', async (url, config) => {
        assert.match(url, /getTrainMovementsXML$/);
        assert.deepStrictEqual(config.params, { TrainId: 'P423', TrainDate: '19 Oct 2026' });
        return { data: mockXml };
      });

      const res = await IR.getTrainMovements('P423', '19 Oct 2026');
      assert.strictEqual(res.length, 1);
      assert.strictEqual(res[0].LocationFullName, 'Hazelhatch');
    });

    it('should throw on failure', async () => {
      mock.method(axios, 'get', async () => { throw new Error('fail'); });
      await assert.rejects(() => IR.getTrainMovements('P423', '19 Oct 2026'), /Failed to retrieve train movements/);
    });
  });

  describe('getAllTrainsByStationCode(stationCode)', () => {
    it('should validate station code and fetch data when valid', async () => {
      mock.method(axios, 'get', async (url) => {
        if (url.includes('getAllStationsXML')) {
          return {
            data: `<ArrayOfObjStation>
              <objStation><StationCode>TARA</StationCode></objStation>
              <objStation><StationCode>CNLLY</StationCode></objStation>
            </ArrayOfObjStation>`,
          };
        }
        if (url.includes('getStationDataByCodeXML')) {
          return {
            data: `<ArrayOfObjStationData>
              <objStationData><Traincode>E101</Traincode><Stationcode>TARA</Stationcode></objStationData>
            </ArrayOfObjStationData>`,
          };
        }
        throw new Error('Unknown url: ' + url);
      });

      // Valid uppercase
      const res1 = await IR.getAllTrainsByStationCode('TARA');
      assert.strictEqual(res1.length, 1);
      assert.strictEqual(res1[0].Traincode, 'E101');

      // Valid lowercase (normalized)
      const res2 = await IR.getAllTrainsByStationCode('tara');
      assert.strictEqual(res2.length, 1);

      // Valid untrimmed
      const res3 = await IR.getAllTrainsByStationCode('  TARA  ');
      assert.strictEqual(res3.length, 1);
    });

    it('should reject with invalid station code error', async () => {
      mock.method(axios, 'get', async (url) => {
        if (url.includes('getAllStationsXML')) {
          return {
            data: `<ArrayOfObjStation>
              <objStation><StationCode>TARA</StationCode></objStation>
            </ArrayOfObjStation>`,
          };
        }
        throw new Error('Should not reach here');
      });

      await assert.rejects(
        async () => IR.getAllTrainsByStationCode('INVALID'),
        {
          name: 'Error',
          message: 'Invalid station code: INVALID',
        }
      );
    });
  });
});
