export interface Station {
  StationDesc: string;
  StationAlias: string;
  StationLatitude: string;
  StationLongitude: string;
  StationCode: string;
  StationId: string;
  [key: string]: any;
}

export interface TrainPosition {
  TrainStatus: string;
  TrainLatitude: string;
  TrainLongitude: string;
  TrainCode: string;
  TrainDate: string;
  PublicMessage: string;
  Direction: string;
  [key: string]: any;
}

export interface StationData {
  Servertime: string;
  Traincode: string;
  Stationfullname: string;
  Stationcode: string;
  Querytime: string;
  Traindate: string;
  Origin: string;
  Destination: string;
  Origintime: string;
  Destinationtime: string;
  Status: string;
  Lastlocation: string;
  Duein: string;
  Late: string;
  Exparrival: string;
  Expdepart: string;
  Scharrival: string;
  Schdepart: string;
  Direction: string;
  Traintype: string;
  Locationtype: string;
  [key: string]: any;
}

export interface StationFilter {
  StationDesc_sp: string;
  StationDesc: string;
  StationCode: string;
  [key: string]: any;
}

export interface TrainMovement {
  TrainCode: string;
  TrainDate: string;
  LocationCode: string;
  LocationFullName: string;
  LocationOrder: string;
  LocationType: string;
  TrainOrigin: string;
  TrainDestination: string;
  ScheduledArrival: string;
  ScheduledDeparture: string;
  ExpectedArrival: string;
  ExpectedDeparture: string;
  Arrival: string;
  Departure: string;
  AutoArrival: string;
  AutoDepart: string;
  StopType: string;
  [key: string]: any;
}

export type StationType = 'A' | 'M' | 'S' | 'D' | (string & {});
export type TrainType = 'A' | 'M' | 'S' | 'D' | (string & {});

export const BASE_URL: string;

export function fetchIrishRail(
  endpoint: string,
  params: Record<string, any>,
  rootKey: string,
  childKey: string
): Promise<any[]>;

export function getAllStations(): Promise<Station[]>;

export function getCurrentTrains(): Promise<TrainPosition[]>;

export function getAllStationsFilter(stationType?: StationType): Promise<Station[]>;

export function getAllTrainsFilter(trainType?: TrainType): Promise<TrainPosition[]>;

export function getAllTrainsServing(stationDesc: string): Promise<StationData[]>;

export function getAllTrainsServingWthNums(station: string, time: number | string): Promise<StationData[]>;

export function getAllTrainsServingWithNums(station: string, time: number | string): Promise<StationData[]>;

export function getAllStationCodes(options?: { forceRefresh?: boolean }): Promise<string[]>;

export function getStationDataByCode(stationCode: string): Promise<StationData[]>;

export function getStationDataByCodeWithNums(stationCode: string, time: number | string): Promise<StationData[]>;

export function getStationsFilter(stationText: string): Promise<StationFilter[]>;

export function getTrainMovements(trainId: string, trainDate: string): Promise<TrainMovement[]>;

export function getAllTrainsByStationCode(stationCode: string): Promise<StationData[]>;
