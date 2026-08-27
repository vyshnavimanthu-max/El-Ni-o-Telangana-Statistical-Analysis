import { ENSORecord, RainfallRecord, TemperatureRecord, AgricultureRecord } from './dataModels';

export type UpdateFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type SourceUpdateStatus = 
  | 'UP_TO_DATE' 
  | 'UPDATE_AVAILABLE' 
  | 'SYNCING' 
  | 'VALIDATING' 
  | 'UPDATED' 
  | 'OFFLINE_UNREACHABLE' 
  | 'STRUCTURE_CHANGED' 
  | 'AWAITING_OFFICIAL_RELEASE' 
  | 'ERROR';

export type SourceEndpointType = 
  | 'REST_API' 
  | 'BULK_CSV_FTP' 
  | 'OFFICIAL_REGISTRY_MIRROR' 
  | 'GOV_PORTAL';

export interface SourceUpdateInfo {
  id: string;
  sourceName: string;
  datasetName: string;
  sourceOrganization: string;
  currentVersion: string;
  latestAvailableVersion: string;
  status: SourceUpdateStatus;
  lastChecked: string | null;
  lastUpdated: string | null;
  observationCount: number;
  coveragePeriod: string;
  endpointType: SourceEndpointType;
  endpointUrl: string;
  machineReadableStatus: 'AVAILABLE' | 'MIRROR_ACTIVE' | 'GOV_PORTAL_SCHEDULED';
  pendingObservationsCount: number;
  qualityScore: number; // 0 - 100
  validationRulesSummary: string[];
  notes: string;
}

export interface DatasetVersionSnapshot {
  versionId: string;
  timestamp: string;
  label: string;
  sourceIds: string[];
  totalObservations: number;
  studyPeriod: string;
  changeSummary: string;
  ensoCount: number;
  rainfallCount: number;
  tempCount: number;
  agriCount: number;
  isActive: boolean;
  datasetDataSnapshot: {
    rawEnso: ENSORecord[];
    rawRainfall: RainfallRecord[];
    rawTemperature: TemperatureRecord[];
    rawAgriculture: AgricultureRecord[];
  };
}

export interface DataChangeLogEntry {
  id: string;
  timestamp: string;
  sourceId: string;
  sourceName: string;
  action: 
    | 'UPDATE_CHECK' 
    | 'DATASET_APPLIED' 
    | 'VALIDATION_PASSED' 
    | 'QUALITY_ALERT' 
    | 'ROLLBACK' 
    | 'REANALYSIS' 
    | 'STRUCTURE_MISMATCH' 
    | 'ENDPOINT_OFFLINE'
    | 'MANUAL_REFRESH';
  description: string;
  details: {
    addedObservations?: number;
    modifiedObservations?: number;
    deletedObservations?: number;
    versionFrom?: string;
    versionTo?: string;
    qualityAlertsCount?: number;
    reanalyzedModelsCount?: number;
    notes?: string;
  };
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
}

export interface DataQualityAlert {
  id: string;
  timestamp: string;
  sourceId: string;
  sourceName: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  code: 
    | 'MISSING_VALUES' 
    | 'UNIT_MISMATCH' 
    | 'OUT_OF_BOUNDS' 
    | 'STRUCTURE_CHANGED' 
    | 'DUPLICATE_KEY' 
    | 'STATION_DENSITY_SHIFT'
    | 'UNVERIFIED_ESTIMATE';
  title: string;
  description: string;
  affectedVariables: string[];
  actionTaken: string;
}

export interface AutoUpdateState {
  isAutoUpdateEnabled: boolean;
  frequency: UpdateFrequency;
  lastChecked: string | null;
  lastSuccessfulUpdate: string | null;
  lastUpdateAttempt: string | null;
  nextScheduledCheck: string | null;
  isChecking: boolean;
  activeDatasetVersion: string;
  datasetsUpdatedCount: number;
  totalNewObservationsAdded: number;
  sources: Record<string, SourceUpdateInfo>;
  versionHistory: DatasetVersionSnapshot[];
  changeLog: DataChangeLogEntry[];
  qualityAlerts: DataQualityAlert[];
  lastAnalysisRecalculated: string | null;
  analysisRecalculatedCount: number;
}
