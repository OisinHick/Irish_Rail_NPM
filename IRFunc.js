const axios = require('axios');
const xml2js = require('xml2js');

const BASE_URL = 'http://api.irishrail.ie/realtime/realtime.asmx';

let cachedStationCodes = null;

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
  
  const items = parsed?.[rootKey]?.[childKey] || [];
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
    throw new Error('Failed to retrieve stations', { cause: error });
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
    throw new Error('Failed to retrieve train positions', { cause: error });
  }
}

/**
 * Returns a list of all stations filtered by StationType.
 * @param {string} stationType A for All, M for Mainline, S for suburban, D for DART. Any other value defaults to A.
 * @returns {Promise<Array<{StationDesc: string, StationAlias: string, StationLatitude: string, StationLongitude: string, StationCode: string, StationId: string}>>}
 */
async function getAllStationsFilter(stationType) {
  const normalizedType = typeof stationType === 'string' ? stationType.trim().toUpperCase() : 'A';
  const type = ['A', 'M', 'S', 'D'].includes(normalizedType) ? normalizedType : 'A';
  try {
    return await fetchIrishRail('getAllStationsXML_WithStationType', { StationType: type }, 'ArrayOfObjStation', 'objStation');
  } catch (error) {
    throw new Error('Failed to retrieve stations', { cause: error });
  }
}

/**
 * Returns a listing of 'running trains' filtered by TrainType.
 * @param {string} trainType A for All, M for Mainline, S for suburban, D for DART. Any other value defaults to A.
 * @returns {Promise<Array<{TrainStatus: string, TrainLatitude: string, TrainLongitude: string, TrainCode: string, TrainDate: string, PublicMessage: string, Direction: string}>>}
 */
async function getAllTrainsFilter(trainType) {
  const normalizedType = typeof trainType === 'string' ? trainType.trim().toUpperCase() : 'A';
  const type = ['A', 'M', 'S', 'D'].includes(normalizedType) ? normalizedType : 'A';
  try {
    return await fetchIrishRail('getCurrentTrainsXML_WithTrainType', { TrainType: type }, 'ArrayOfObjTrainPositions', 'objTrainPositions');
  } catch (error) {
    throw new Error('Failed to retrieve train positions', { cause: error });
  }
}

/**
 * Returns all trains due to serve the named station in the next 90 minutes.
 * @param {string} stationDesc Name of the station
 * @returns {Promise<Array<object>>}
 */
async function getAllTrainsServing(stationDesc) {
  try {
    return await fetchIrishRail('getStationDataByNameXML', { StationDesc: stationDesc }, 'ArrayOfObjStationData', 'objStationData');
  } catch (error) {
    throw new Error('Failed to retrieve train data', { cause: error });
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
    throw new Error('Failed to retrieve train data', { cause: error });
  }
}

/**
 * Returns a list of all station codes only.
 * @param {object} [options] Optional options object
 * @param {boolean} [options.forceRefresh=false] Whether to bypass cache and re-fetch stations
 * @returns {Promise<Array<string>>}
 */
async function getAllStationCodes(options = {}) {
  const { forceRefresh = false } = options;
  if (!forceRefresh && cachedStationCodes) {
    return cachedStationCodes;
  }
  try {
    const stations = await getAllStations();
    cachedStationCodes = stations.map((station) => station.StationCode);
    return cachedStationCodes;
  } catch (error) {
    throw new Error('Failed to retrieve station codes', { cause: error });
  }
}

/**
 * Returns station data for a specific station code.
 * @param {string} stationCode Station code (e.g. 'TARA')
 * @returns {Promise<Array<object>>}
 */
async function getStationDataByCode(stationCode) {
  const code = typeof stationCode === 'string' ? stationCode.trim().toUpperCase() : stationCode;
  try {
    return await fetchIrishRail('getStationDataByCodeXML', { StationCode: code }, 'ArrayOfObjStationData', 'objStationData');
  } catch (error) {
    throw new Error('Failed to retrieve station data', { cause: error });
  }
}

/**
 * Returns station data for a specific station code within a given minute range.
 * @param {string} stationCode Station code (e.g. 'TARA')
 * @param {number|string} time Minutes range (between 5 and 90)
 * @returns {Promise<Array<object>>}
 */
async function getStationDataByCodeWithNums(stationCode, time) {
  const code = typeof stationCode === 'string' ? stationCode.trim().toUpperCase() : stationCode;
  try {
    return await fetchIrishRail('getStationDataByCodeXML_WithNumMins', { StationCode: code, NumMins: time }, 'ArrayOfObjStationData', 'objStationData');
  } catch (error) {
    throw new Error('Failed to retrieve station data', { cause: error });
  }
}

/**
 * Filters stations by text/keyword query.
 * @param {string} stationText Text to search for in station description
 * @returns {Promise<Array<{StationDesc_sp: string, StationDesc: string, StationCode: string}>>}
 */
async function getStationsFilter(stationText) {
  try {
    return await fetchIrishRail('getStationsFilterXML', { StationText: stationText }, 'ArrayOfObjStationFilter', 'objStationFilter');
  } catch (error) {
    throw new Error('Failed to retrieve station filter data', { cause: error });
  }
}

/**
 * Returns stop-by-stop movements and timetable progression for a specific train and date.
 * @param {string} trainId The train identifier (e.g. 'E950')
 * @param {string} trainDate Date of the train (e.g. '19 Oct 2026' or '19/10/2026')
 * @returns {Promise<Array<object>>}
 */
async function getTrainMovements(trainId, trainDate) {
  const id = typeof trainId === 'string' ? trainId.trim() : trainId;
  const date = typeof trainDate === 'string' ? trainDate.trim() : trainDate;
  try {
    return await fetchIrishRail('getTrainMovementsXML', { TrainId: id, TrainDate: date }, 'ArrayOfObjTrainMovements', 'objTrainMovements');
  } catch (error) {
    throw new Error('Failed to retrieve train movements', { cause: error });
  }
}

/**
 * Returns all trains serving a station by its station code.
 * Validates the station code before fetching data.
 * @param {string} stationCode Station code (e.g. 'TARA')
 * @returns {Promise<Array<object>>}
 */
async function getAllTrainsByStationCode(stationCode) {
  const code = typeof stationCode === 'string' ? stationCode.trim().toUpperCase() : stationCode;
  const stationCodes = await getAllStationCodes();
  if (!stationCodes.includes(code)) {
    throw new Error(`Invalid station code: ${stationCode}`);
  }
  return getStationDataByCode(code);
}

module.exports = {
  BASE_URL,
  fetchIrishRail,
  getAllStations,
  getCurrentTrains,
  getAllStationsFilter,
  getAllTrainsFilter,
  getAllTrainsServing,
  getAllTrainsServingWthNums,
  getAllTrainsServingWithNums: getAllTrainsServingWthNums,
  getAllStationCodes,
  getAllTrainsByStationCode,
  getStationDataByCode,
  getStationDataByCodeWithNums,
  getStationsFilter,
  getTrainMovements,
};
