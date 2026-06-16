# Irish_Rail_NPM

A lightweight and modern Node.js wrapper to pull Irish Rail real-time data quickly and easily in JavaScript.

This package calls the official public Irish Rail Realtime API and handles the XML parsing under the hood, returning clean, flattened JavaScript objects.

## Installation

```bash
npm install irish-rail-npm
```

## Quick Start

```javascript
const { getAllTrainsByStationCode } = require('irish-rail-npm');

async function checkTrains() {
  try {
    // Get live train info for Tara Street station (TARA)
    const trains = await getAllTrainsByStationCode('TARA');
    console.log(trains);
  } catch (error) {
    console.error('Error fetching train data:', error);
  }
}

checkTrains();
```

## API Reference

All functions return a `Promise` resolving to the fetched data.

### `getAllStations()`
Returns a list of all stations ordered by Latitude and Longitude.
- **Returns:** `Promise<Array<Object>>` (containing `StationDesc`, `StationAlias`, `StationLatitude`, `StationLongitude`, `StationCode`, `StationId`)

### `getCurrentTrains()`
Returns a listing of all currently running trains (trains between origin and destination, or starting within 10 minutes of the query time).
- **Returns:** `Promise<Array<Object>>` (containing `TrainStatus`, `TrainLatitude`, `TrainLongitude`, `TrainCode`, `TrainDate`, `PublicMessage`, `Direction`)

### `getAllStationsFilter(stationType)`
Returns all stations filtered by type.
- **Parameters:** `stationType` (`string`): `'A'` (All), `'M'` (Mainline), `'S'` (Suburban), `'D'` (DART). Default is `'A'`.
- **Returns:** `Promise<Array<Object>>`

### `getAllTrainsFilter(trainType)`
Returns running trains filtered by type.
- **Parameters:** `trainType` (`string`): `'A'` (All), `'M'` (Mainline), `'S'` (Suburban), `'D'` (DART). Default is `'A'`.
- **Returns:** `Promise<Array<Object>>`

### `getAllTrainsServing(stationDesc)`
Returns all trains due to serve the named station in the next 90 minutes.
- **Parameters:** `stationDesc` (`string`): Station name (e.g. `'Belfast'`, `'Dublin Connolly'`)
- **Returns:** `Promise<Array<Object>>`

### `getAllTrainsServingWthNums(station, time)`
Returns all trains due to serve the named station in the next `x` minutes.
- **Parameters:**
  - `station` (`string`): Station name
  - `time` (`number` or `string`): Minutes range (must be between `5` and `90`)
- **Returns:** `Promise<Array<Object>>`

### `getAllStationCodes()`
Returns an array of all valid station codes (e.g., `['BFSTC', 'LBURN', ...]`).
- **Returns:** `Promise<Array<string>>`

### `getStationDataByCode(stationCode)`
Returns station data for a specific station code.
- **Parameters:** `stationCode` (`string`): The station code (e.g. `'TARA'`)
- **Returns:** `Promise<Array<Object>>`

### `getAllTrainsByStationCode(stationCode)`
Returns all trains serving a station by its station code. Validates the station code against the list of all valid station codes before calling the API.
- **Parameters:** `stationCode` (`string`): The station code (e.g. `'TARA'`)
- **Returns:** `Promise<Array<Object>>`

## License

[ISC](LICENSE)
