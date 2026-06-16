const axios = require('axios');
const xml2js = require('xml2js');

const BASE_URL = 'http://api.irishrail.ie/realtime/realtime.asmx';

/**
 * Helper to fetch XML data from Irish Rail API, parse it, and return a flattened array of objects.
 * @param {string} endpoint The endpoint name (e.g. 'getAllStationsXML')
 * @param {object} params Query parameters
 * @param {string} rootKey Root tag in the XML (e.g. 'ArrayOfObjStation')
 * @param {string} childKey Child tag in the XML (e.g. 'objStation')
 * @returns {Promise<Array<object>>}
 */
async function fetchIrishRail(endpoint, params, rootKey, childKey) {
  const response = await axios.get(`${BASE_URL}/${endpoint}`, { params });
  const parsed = await xml2js.parseStringPromise(response.data);
  
  const items = parsed[rootKey]?.[childKey] || [];
  return items.map(item => {
    const flat = {};
    for (const key in item) {
      if (Array.isArray(item[key]) && item[key].length > 0) {
        const val = item[key][0];
        if (typeof val === 'string') {
          flat[key] = val.trim();
        } else if (typeof val === 'object' && Object.keys(val).length === 0) {
          flat[key] = '';
        } else {
          flat[key] = val;
        }
      }
    }
    return flat;
  });
}

/**
 * Returns a list of all stations ordered by Latitude and Longitude.
 * @returns {Promise<Array<{StationDesc: string, StationAlias: string, StationLatitude: string, StationLongitude: string, StationCode: string, StationId: string}>>}
 */
async function getAllStations() {
  try {
    return await fetchIrishRail('getAllStationsXML', {}, 'ArrayOfObjStation', 'objStation');
  } catch (error) {
    throw new Error('Failed to retrieve stations');
  }
}

/**
 * Returns a listing of 'running trains' (between origin and destination or starting within 10 minutes).
 * @returns {Promise<Array<{TrainStatus: string, TrainLatitude: string, TrainLongitude: string, TrainCode: string, TrainDate: string, PublicMessage: string, Direction: string}>>}
 */
async function getCurrentTrains() {
  try {
    return await fetchIrishRail('getCurrentTrainsXML', {}, 'ArrayOfObjTrainPositions', 'objTrainPositions');
  } catch (error) {
    throw new Error('Failed to retrieve train positions');
  }
}

/**
 * Returns a list of all stations filtered by StationType.
 * @param {string} stationType A for All, M for Mainline, S for suburban, D for DART. Any other value defaults to A.
 * @returns {Promise<Array<{StationDesc: string, StationAlias: string, StationLatitude: string, StationLongitude: string, StationCode: string, StationId: string}>>}
 */
async function getAllStationsFilter(stationType) {
  const type = ['A', 'M', 'S', 'D'].includes(stationType) ? stationType : 'A';
  try {
    return await fetchIrishRail('getAllStationsXML_WithStationType', { StationType: type }, 'ArrayOfObjStation', 'objStation');
  } catch (error) {
    throw new Error('Failed to retrieve stations');
  }
}

/**
 * Returns a listing of 'running trains' filtered by TrainType.
 * @param {string} trainType A for All, M for Mainline, S for suburban, D for DART. Any other value defaults to A.
 * @returns {Promise<Array<{TrainStatus: string, TrainLatitude: string, TrainLongitude: string, TrainCode: string, TrainDate: string, PublicMessage: string, Direction: string}>>}
 */
async function getAllTrainsFilter(trainType) {
  const type = ['A', 'M', 'S', 'D'].includes(trainType) ? trainType : 'A';
  try {
    return await fetchIrishRail('getCurrentTrainsXML_WithTrainType', { TrainType: type }, 'ArrayOfObjTrainPositions', 'objTrainPositions');
  } catch (error) {
    throw new Error('Failed to retrieve train positions');
  }
}

/**
 * Returns all trains due to serve the named station in the next 90 minutes.
 * @param {string} stationDesc Name of the station
 * @returns {Promise<Array<object>>}
 */
async function getAllTrainsServing(stationDesc) {
  console.log("Please note these trains are serving this station in the range of the next 90 minutes only");
  try {
    return await fetchIrishRail('getStationDataByNameXML', { StationDesc: stationDesc }, 'ArrayOfObjStationData', 'objStationData');
  } catch (error) {
    throw new Error('Failed to retrieve train data');
  }
}

/**
 * Returns all trains due to serve the named station in the next x minutes (between 5 and 90).
 * @param {string} station Name of the station
 * @param {number|string} time Minutes range
 * @returns {Promise<Array<object>>}
 */
async function getAllTrainsServingWthNums(station, time) {
  try {
    return await fetchIrishRail('getStationDataByNameXML_withNumMins', { StationDesc: station, NumMins: time }, 'ArrayOfObjStationData', 'objStationData');
  } catch (error) {
    throw new Error('Failed to retrieve train data');
  }
}

/**
 * Returns a list of all station codes only.
 * @returns {Promise<Array<string>>}
 */
async function getAllStationCodes() {
  try {
    const stations = await getAllStations();
    return stations.map((station) => station.StationCode);
  } catch (error) {
    throw new Error('Failed to retrieve station codes');
  }
}

/**
 * Returns station data for a specific station code.
 * @param {string} stationCode Station code (e.g. 'TARA')
 * @returns {Promise<Array<object>>}
 */
async function getStationDataByCode(stationCode) {
  console.log(`${BASE_URL}/getStationDataByCodeXML?StationCode=${stationCode}`);
  try {
    return await fetchIrishRail('getStationDataByCodeXML', { StationCode: stationCode }, 'ArrayOfObjStationData', 'objStationData');
  } catch (error) {
    console.log('Error:', error.message);
    throw new Error('Failed to retrieve station data');
  }
}

/**
 * Returns all trains serving a station by its station code.
 * Validates the station code before fetching data.
 * @param {string} stationCode Station code (e.g. 'TARA')
 * @returns {Promise<Array<object>>}
 */
async function getAllTrainsByStationCode(stationCode) {
  const stationCodes = await getAllStationCodes();
  if (!stationCodes.includes(stationCode)) {
    throw new Error(`Invalid station code: ${stationCode}`);
  }
  return getStationDataByCode(stationCode);
}

module.exports = {
  getAllStations,
  getCurrentTrains,
  getAllStationsFilter,
  getAllTrainsFilter,
  getAllTrainsServing,
  getAllTrainsServingWthNums,
  getAllStationCodes,
  getAllTrainsByStationCode,
  getStationDataByCode,
};
