/**
 * Authoritative Data Architecture & Typed Interfaces
 * for El Niño × Telangana Research Project
 * 
 * STRICT COMPLIANCE:
 * - Authoritative sources only: IMD, NOAA CPC, data.gov.in, DES Telangana, TSDPS
 * - No Kaggle, Wikipedia, blogs, or fabricated data.
 * - Non-causal statistical taxonomy.
 */

import { AgroClimaticZone } from './filters';

// ==========================================
// 1. DATA SOURCE METADATA
// ==========================================

export type OfficialSourceId = 
  | 'noaa_cpc_oni'
  | 'imd_gridded_rainfall'
  | 'imd_gridded_temp'
  | 'des_telangana_agri'
  | 'tsdps_aws'
  | 'data_gov_in';

export interface DataSource {
  id: OfficialSourceId | string;
  sourceName: string;
  sourceOrganization: string;
  datasetName: string;
  sourceURL: string;
  downloadDate: string;
  coveragePeriod: string;
  frequency: 'Monthly' | 'Seasonal (JJAS)' | 'Annual' | 'Daily' | '3-Month Running Mean' | string;
  units: string;
  spatialResolution: string;
  citation: string;
  methodologyNotes?: string;
  limitations: string[];
  status: 'PENDING_INTEGRATION' | 'SCHEMA_MAPPED' | 'CONNECTED';
}

// ==========================================
// 2. ENSO DATA MODELS
// ==========================================

export type OniSeasonCode = 
  | 'DJF' | 'JFM' | 'FMA' | 'MAM' | 'AMJ' | 'MJJ' 
  | 'JJA' | 'JAS' | 'ASO' | 'SON' | 'OND' | 'NDJ';

export type EnsoState = 'EL_NINO' | 'NEUTRAL' | 'LA_NINA';

export type OniStrength = 
  | 'VERY_STRONG_EL_NINO' 
  | 'STRONG_EL_NINO' 
  | 'MODERATE_EL_NINO' 
  | 'WEAK_EL_NINO' 
  | 'NEUTRAL' 
  | 'WEAK_LA_NINA' 
  | 'MODERATE_LA_NINA' 
  | 'STRONG_LA_NINA';

/**
 * Individual 3-month running Oceanic Niño Index observation.
 * Note: Overlapping seasons are NOT statistically independent.
 */
export interface ENSORecord {
  year: number;
  season: OniSeasonCode;
  monthIndex: number; // 1 to 12
  oni: number; // °C anomaly in Niño 3.4 region (5°N-5°S, 120°-170°W)
  ensoState: EnsoState;
  classification: OniStrength;
  source: DataSource;
  nino34Sst?: number | null; // Raw SST in °C
  southernOscillationIndex?: number | null; // Standardized SOI
  isMonsoonRelevantSeason?: boolean; // JJA, JAS, ASO
}

/**
 * Derived annual non-overlapping ENSO indicator for Southwest Monsoon analysis.
 */
export interface DerivedMonsoonEnsoIndicator {
  year: number;
  indicatorType: 'JJA' | 'JAS' | 'JJAS_MEAN' | 'MJJ';
  oniValue: number;
  ensoState: EnsoState;
  classification: OniStrength;
  transformationMethod: string;
  degreeOfFreedomNote: string;
  source: DataSource;
}

// ==========================================
// 3. RAINFALL DATA MODELS (TELANGANA ONLY)
// ==========================================

export type RainfallSeasonType = 'JUNE' | 'JULY' | 'AUGUST' | 'SEPTEMBER' | 'JJAS' | 'OND' | 'ANNUAL';

export type ImdRainfallClassification = 
  | 'LARGE_EXCESS'  // >= +60%
  | 'EXCESS'        // +20% to +59%
  | 'NORMAL'        // -19% to +19%
  | 'DEFICIENT'     // -20% to -59%
  | 'LARGE_DEFICIENT'; // <= -60%

export interface RainfallRecord {
  year: number;
  monthOrSeason: RainfallSeasonType | string;
  rainfall: number | null; // Actual precipitation in mm
  normal: number; // Long Period Average (LPA) baseline in mm
  anomaly: number | null; // Departure in mm (rainfall - normal)
  anomalyPercent: number | null; // % departure ((rainfall - normal)/normal * 100)
  district?: string; // Optional district ID; omitted or 'STATE' for state-level
  districtName?: string;
  isStateLevel: boolean;
  classification?: ImdRainfallClassification;
  rainyDays?: number | null; // Days with >= 2.5mm
  drySpells?: number | null; // Periods of >= 7 consecutive dry days
  source: DataSource;
}

// ==========================================
// 4. TEMPERATURE DATA MODELS (TELANGANA ONLY)
// ==========================================

export interface TemperatureRecord {
  year: number;
  monthOrSeason: string; // 'JJAS', 'SUMMER', 'ANNUAL', or Month name
  temperature: number | null; // Mean Maximum Temperature (°C)
  normal: number | null; // Climatological normal (°C)
  anomaly: number | null; // Anomaly (°C departure from normal)
  minTemperature?: number | null; // Mean Minimum Temperature (°C)
  minTempAnomaly?: number | null;
  meanTemperature?: number | null;
  district?: string;
  districtName?: string;
  isStateLevel: boolean;
  heatWaveDays?: number | null; // Recorded IMD heatwave days (Tmax >= 40°C & anomaly >= 4.5°C)
  source: DataSource;
}

// ==========================================
// 5. AGRICULTURE DATA MODELS (TELANGANA ONLY)
// ==========================================

export type CropSeason = 'KHARIF' | 'RABI' | 'ANNUAL';

export interface AgricultureRecord {
  year: number;
  crop: string; // Crop Name (e.g. 'Paddy (Rice)', 'Cotton (Kapas)')
  cropId: string;
  season: CropSeason;
  area: number | null; // Gross Area Sown in Hectares
  production: number | null; // Total Production in Metric Tonnes
  yield: number | null; // Productivity in Kg / Hectare
  yieldNormal?: number | null; // 5-year Olympic moving average baseline
  yieldAnomalyPercent?: number | null; // % departure from baseline
  detrendedYieldKgHa?: number | null; // Linear/polynomial detrended yield
  district?: string;
  districtName?: string;
  isStateLevel: boolean;
  irrigationCoveragePercent?: number | null; // Percentage under canal/borewell irrigation
  source: DataSource;
}

// ==========================================
// 6. DISTRICT RECORD (TELANGANA 33 DISTRICTS)
// ==========================================

export interface DistrictRecord {
  districtId: string;
  districtName: string;
  teluguName: string;
  headquarters: string;
  zone: AgroClimaticZone;
  zoneName: string;
  normalSwmRainfallMm: number;
  normalAnnualRainfallMm: number;
  hasOfficialDistrictSeries: boolean;
  observationCount: number;
  source: DataSource;
}

// ==========================================
// 7. COMPOSITE STATISTICAL OBSERVATION
// ==========================================

/**
 * Aligned annual statistical observation record combining ENSO, Climate, and Agronomic variables
 * with full provenance tracking.
 */
export interface StatisticalObservation {
  year: number;
  
  // ENSO Indicators
  oniMonsoon: number | null; // JJAS or JAS selected monsoon ONI
  ensoPhase: EnsoState | null;
  ensoClassification?: OniStrength;
  
  // Climatology (Telangana Statewide)
  rainfallSWMm: number | null; // Southwest Monsoon (JJAS) rainfall in mm
  rainfallNormalMm: number; // 750.5 mm IMD LPA
  rainfallAnomalyMm: number | null;
  rainfallAnomalyPercent: number | null;
  rainfallCategory?: ImdRainfallClassification;
  
  // Thermal
  maxTemperatureC: number | null;
  maxTempAnomalyC: number | null;
  
  // Agriculture (Statewide Kharif Yields)
  paddyYieldKgHa: number | null;
  paddyDetrendedYield?: number | null;
  cottonYieldKgHa: number | null;
  cottonDetrendedYield?: number | null;
  maizeYieldKgHa: number | null;
  redGramYieldKgHa: number | null;
  soyabeanYieldKgHa: number | null;
  
  // Provenance & Quality
  isCompleteObservation: boolean;
  dataSources: {
    enso: string;
    rainfall: string;
    temperature: string;
    agriculture: string;
  };
  qualityFlags: string[];
}

// ==========================================
// 8. DATA QUALITY & VALIDATION MODELS
// ==========================================

export type IssueSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface ValidationIssue {
  id: string;
  severity: IssueSeverity;
  category: 'MISSING_VALUE' | 'DUPLICATE_RECORD' | 'OUT_OF_BOUNDS' | 'INVALID_DATE' | 'DISTRICT_NAMING' | 'INCONSISTENT_UNITS' | 'AUTOCORRELATION_WARNING';
  recordIdentifier: string; // e.g. "Year 2002 (Rainfall)" or "Row 45"
  variableName: string;
  message: string;
  valueReceived?: any;
  expectedConstraint?: string;
  recommendedAction: string;
}

export interface DataQualitySummary {
  totalObservations: number;
  validObservations: number;
  missingObservations: number;
  missingPercentage: number;
  duplicateObservations: number;
  anomalousValuesCount: number;
  dateRange: {
    startYear: number;
    endYear: number;
    totalYears: number;
  };
  source: string;
  sourceOrganization: string;
  frequency: string;
  units: string;
  validationIssues: ValidationIssue[];
  overallQualityStatus: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'REJECTED';
}
