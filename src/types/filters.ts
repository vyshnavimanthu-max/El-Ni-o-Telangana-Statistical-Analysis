export type EnsoPhase = 'ALL' | 'EL_NINO' | 'NEUTRAL' | 'LA_NINA';

export type ClimateSeason = 'SWM_MONSOON' | 'NEM_POST_MONSOON' | 'WINTER' | 'SUMMER' | 'ANNUAL';

export type AgroClimaticZone = 
  | 'NORTHERN_TELANGANA_ZONE' 
  | 'SOUTHERN_TELANGANA_ZONE' 
  | 'CENTRAL_TELANGANA_ZONE'
  | 'HIGH_ALTITUDE_TRIBAL_ZONE';

export interface ResearchFilters {
  startYear: number;
  endYear: number;
  ensoPhase: EnsoPhase;
  selectedVariable: 'rainfall' | 'temperature' | 'agriculture' | 'composite';
  season: ClimateSeason;
  geographyLevel: 'state' | 'district' | 'zone';
  selectedDistrictId?: string;
  selectedZoneId?: AgroClimaticZone;
  selectedCropId?: string;
  lagMonths: number; // 0, 1, 2, 3 months lag analysis
}

export interface DataSourceMetadata {
  id: string;
  name: string;
  organization: string;
  authority?: string;
  description: string;
  periodCoverage: string;
  period?: string;
  variables: string[];
  spatialResolution: string;
  resolution?: string;
  temporalResolution: string;
  format?: string;
  accessUrl?: string;
  url?: string;
  citation: string;
  status: 'PENDING_INTEGRATION' | 'SCHEMA_MAPPED' | 'CONNECTED';
}

export interface ObservationMetadata {
  source: string;
  period: string;
  units: string;
  observationCount: number | null;
  datasetCitation?: string;
  lastUpdated?: string;
}
