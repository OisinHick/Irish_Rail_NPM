# Irish_Rail_NPM

[![npm version](https://img.shields.io/npm/v/irish-rail-npm)](https://www.npmjs.com/package/irish-rail-npm)

A lightweight and modern Node.js wrapper to pull Irish Rail real-time data quickly and easily in JavaScript.

This package calls the official public Irish Rail Realtime API and handles the XML parsing under the hood, returning clean, flattened JavaScript objects. Install it from [npm](https://www.npmjs.com/package/irish-rail-npm).

## Installation

### npm

```bash
npm install irish-rail-npm
```

### GitHub Packages

GitHub Packages requires authentication. Create a personal access token (classic)
with `read:packages`, set it as the `GITHUB_TOKEN` environment variable, and add
this registry configuration to your user-level `.npmrc`:

```ini
@oisinhick:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Install the GitHub Packages build with:

```bash
npm install @oisinhick/irish-rail-npm
```

The `@oisinhick/irish-rail-npm` package is published to GitHub Packages when a
GitHub Release is published. The first published package is private by default;
change its visibility to public in the repository's **Packages** settings if you
want unauthenticated public access.

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

### `getAllTrainsServingWthNums(station, time)` / `getAllTrainsServingWithNums(station, time)`
Returns all trains due to serve the named station in the next `x` minutes.
- **Parameters:**
  - `station` (`string`): Station name
  - `time` (`number` or `string`): Minutes range (must be between `5` and `90`)
- **Returns:** `Promise<Array<Object>>`

### `getAllStationCodes([options])`
Returns an array of all valid station codes (e.g., `['BFSTC', 'LBURN', ...]`). Results are cached in-memory for fast lookups.
- **Parameters:**
  - `options` (`Object`, optional): `{ forceRefresh: boolean }` to bypass cache.
- **Returns:** `Promise<Array<string>>`

### `getStationDataByCode(stationCode)`
Returns station data for a specific station code.
- **Parameters:** `stationCode` (`string`): The station code (e.g. `'TARA'`)
- **Returns:** `Promise<Array<Object>>`

### `getStationDataByCodeWithNums(stationCode, time)`
Returns station data for a specific station code within a given minute window.
- **Parameters:**
  - `stationCode` (`string`): The station code (e.g. `'TARA'`)
  - `time` (`number` or `string`): Minutes range (between `5` and `90`)
- **Returns:** `Promise<Array<Object>>`

### `getStationsFilter(stationText)`
Searches stations by text/keyword query.
- **Parameters:** `stationText` (`string`): Search query (e.g. `'Howth'`)
- **Returns:** `Promise<Array<{StationDesc_sp: string, StationDesc: string, StationCode: string}>>`

### `getTrainMovements(trainId, trainDate)`
Returns stop-by-stop movements and timetable progression for a specific train and date.
- **Parameters:**
  - `trainId` (`string`): Train identifier (e.g. `'E950'`)
  - `trainDate` (`string`): Date of the train (e.g. `'19 Oct 2026'`)
- **Returns:** `Promise<Array<Object>>`

### `getAllTrainsByStationCode(stationCode)`
Returns all trains serving a station by its station code. Validates the station code against the list of all valid station codes before calling the API. Case-insensitive and trims whitespace automatically.
- **Parameters:** `stationCode` (`string`): The station code (e.g. `'TARA'`)
- **Returns:** `Promise<Array<Object>>`

## Testing

The project uses Node.js native test runner (`node:test`):

```bash
# Run unit tests (offline with mocks)
npm test

# Run unit tests with code coverage report
npm run test:coverage

# Run live API integration tests
npm run test:integration

# Run all tests (unit + integration)
npm run test:all

# Run interactive live demo
npm run demo
```

## License

[ISC](LICENSE)
