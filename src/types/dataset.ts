import { EnsoObservation } from './enso';
import { RainfallObservation, TemperatureObservation } from './climate';
import { CropYieldObservation } from './agriculture';
import { ObservationMetadata } from './filters';
import { 
  ENSORecord, 
  RainfallRecord, 
  TemperatureRecord, 
  AgricultureRecord, 
  DistrictRecord, 
  DataSource, 
  StatisticalObservation, 
  DataQualitySummary,
  DerivedMonsoonEnsoIndicator
} from './dataModels';

export * from './dataModels';

export interface MergedClimateRecord {
  year: number;
  oniJjas: number | null; // JJAS mean ONI
  ensoPhase: 'EL_NINO' | 'NEUTRAL' | 'LA_NINA' | null;
  rainfallJjasMm: number | null;
  rainfallAnomalyPercent: number | null;
  rainfallJuneMm?: number | null;
  rainfallJulyMm?: number | null;
  rainfallAugustMm?: number | null;
  rainfallSeptemberMm?: number | null;
  meanMaxTempC: number | null;
  meanMinTempC?: number | null;
  meanTempC?: number | null;
  tempMaxAnomalyC?: number | null;
  tempMinAnomalyC?: number | null;
  tempMeanAnomalyC?: number | null;
  oniNdj?: number | null;
  paddyYieldKgHa: number | null;
  cottonYieldKgHa: number | null;
  maizeYieldKgHa: number | null;
  redGramYieldKgHa?: number | null;
  redgramYieldKgHa?: number | null;
  soyabeanYieldKgHa: number | null;
}

export type MergedClimateCropRecord = MergedClimateRecord;

export interface ResearchDatasetState {
  isOfficialDataLoaded: boolean;
  ensoObservations: EnsoObservation[];
  rainfallObservations: RainfallObservation[];
  temperatureObservations: TemperatureObservation[];
  agricultureObservations: CropYieldObservation[];
  
  // Strongly Typed Raw & Derived Records
  rawEnsoRecords: ENSORecord[];
  derivedMonsoonEnso: DerivedMonsoonEnsoIndicator[];
  rawRainfallRecords: RainfallRecord[];
  rawTemperatureRecords: TemperatureRecord[];
  rawAgricultureRecords: AgricultureRecord[];
  statisticalObservations: StatisticalObservation[];
  
  // Merged time-series for chart alignment
  mergedRecords: MergedClimateRecord[];
  
  // Source & Quality Metadata
  ensoMetadata: ObservationMetadata;
  rainfallMetadata: ObservationMetadata;
  temperatureMetadata: ObservationMetadata;
  agricultureMetadata: ObservationMetadata;
  
  // Data Quality Summaries
  ensoQualitySummary?: DataQualitySummary;
  rainfallQualitySummary?: DataQualitySummary;
  temperatureQualitySummary?: DataQualitySummary;
  agricultureQualitySummary?: DataQualitySummary;
  
  lastIngestedTimestamp: string | null;
  datasetVersion: string;
  analysisRecalculatedTimestamp: string | null;
  reanalysisRunId: string;
}
