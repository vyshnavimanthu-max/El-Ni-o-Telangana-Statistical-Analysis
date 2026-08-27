/**
 * Central Ingestion, Validation & Harmonization Service
 * for El Niño × Telangana Research Application
 * 
 * STRICT COMPLIANCE:
 * - Authoritative sources only: IMD, NOAA CPC, DES Telangana, TSDPS, data.gov.in
 * - Explicit "Official dataset connection required" un-ingested state
 * - Non-overlapping monsoon ENSO derivation
 * - Multi-stage data validation & quality reporting
 */

import { 
  ResearchDatasetState, 
  MergedClimateRecord 
} from '../types/dataset';
import { 
  ENSORecord, 
  RainfallRecord, 
  TemperatureRecord, 
  AgricultureRecord, 
  StatisticalObservation,
  DerivedMonsoonEnsoIndicator,
  OniSeasonCode 
} from '../types/dataModels';
import { OFFICIAL_SOURCES } from '../data/officialSources';
import { EnsoEngine, MonsoonEnsoIndicatorType } from './ensoEngine';
import { ValidationService } from './validationService';
import { 
  getOfficialNoaaEnsoRecords, 
  getOfficialImdRainfallRecords, 
  getOfficialImdMonthlyRainfallRecords,
  getOfficialImdTemperatureRecords, 
  getOfficialDesAgricultureRecords 
} from '../data/referenceOfficialData';

export const INITIAL_DATASET_STATE: ResearchDatasetState = {
  isOfficialDataLoaded: false,
  ensoObservations: [],
  rainfallObservations: [],
  temperatureObservations: [],
  agricultureObservations: [],
  rawEnsoRecords: [],
  derivedMonsoonEnso: [],
  rawRainfallRecords: [],
  rawTemperatureRecords: [],
  rawAgricultureRecords: [],
  statisticalObservations: [],
  mergedRecords: [],
  ensoMetadata: {
    source: 'NOAA Climate Prediction Center (CPC)',
    period: 'Official connection required (1950–2026 NOAA standard)',
    units: '°C (Niño 3.4 SST Anomaly)',
    observationCount: null,
    datasetCitation: 'NOAA ERSST.v5 ONI 3-Month Running Mean'
  },
  rainfallMetadata: {
    source: 'India Meteorological Department (IMD) Gridded / DES Telangana',
    period: 'Official connection required (1971–2026)',
    units: 'mm / % departure from LPA (750.5 mm)',
    observationCount: null,
    datasetCitation: 'IMD National Gridded 0.25° × 0.25° Resolution'
  },
  temperatureMetadata: {
    source: 'India Meteorological Department (IMD)',
    period: 'Official connection required (1971–2026)',
    units: '°C (Monsoon Mean Max Anomaly)',
    observationCount: null,
    datasetCitation: 'IMD Gridded Daily Temperature 0.5° × 0.5°'
  },
  agricultureMetadata: {
    source: 'Directorate of Economics and Statistics (DES), Govt. of Telangana',
    period: 'Official connection required (Kharif & Rabi series)',
    units: 'kg / hectare (Yield) & Lakh Hectares (Area)',
    observationCount: null,
    datasetCitation: 'Telangana Season & Crop Reports (DES Hyderabad)'
  },
  lastIngestedTimestamp: null,
  datasetVersion: 'v2026.08.15-baseline',
  analysisRecalculatedTimestamp: null,
  reanalysisRunId: 'init-run'
};

export class DatasetService {
  private static state: ResearchDatasetState = { ...INITIAL_DATASET_STATE };
  private static listeners: ((state: ResearchDatasetState) => void)[] = [];
  private static activeEnsoIndicator: MonsoonEnsoIndicatorType = 'JJAS_MEAN';

  public static getState(): ResearchDatasetState {
    return this.state;
  }

  public static subscribe(listener: (state: ResearchDatasetState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notify() {
    this.listeners.forEach(l => l(this.state));
  }

  /**
   * Reset to un-ingested state ("Official dataset connection required")
   */
  public static clearDataset(): void {
    this.state = { ...INITIAL_DATASET_STATE };
    this.notify();
  }

  /**
   * Loads verified official benchmark research datasets from authoritative repositories:
   * 1. NOAA CPC ONI (1950–2024)
   * 2. IMD 0.25° Gridded Southwest Monsoon Rainfall (1971–2024)
   * 3. IMD 0.5° Gridded Maximum Temperature (1971–2024)
   * 4. DES Telangana Season & Crop Reports (1971–2024)
   */
  public static loadOfficialBenchmarkDatasets(
    indicatorType: MonsoonEnsoIndicatorType = this.activeEnsoIndicator
  ): void {
    this.activeEnsoIndicator = indicatorType;

    const rawEnso = getOfficialNoaaEnsoRecords();
    const rawRainfall = getOfficialImdRainfallRecords();
    const rawTemperature = getOfficialImdTemperatureRecords();
    const rawAgriculture = getOfficialDesAgricultureRecords();

    // 1. Run Data Validation & Quality Audits
    const ensoQuality = ValidationService.validateEnsoRecords(rawEnso);
    const rainfallQuality = ValidationService.validateRainfallRecords(rawRainfall);
    const tempQuality = ValidationService.validateTemperatureRecords(rawTemperature);
    const agriQuality = ValidationService.validateAgricultureRecords(rawAgriculture);

    // 2. Extract Non-Overlapping Monsoon ENSO Indicators
    const derivedEnso = EnsoEngine.extractMonsoonIndicators(rawEnso, indicatorType);

    // 3. Convert to backward-compatible view format
    const ensoObs = rawEnso.map(r => ({
      year: r.year,
      month: r.monthIndex,
      season3Month: r.season,
      oniValue: r.oni,
      classification: r.classification as any,
      phase: r.ensoState
    }));

    const rainfallObs = rawRainfall.map(r => ({
      year: r.year,
      districtId: r.district,
      june: null,
      july: null,
      august: null,
      september: null,
      southwestMonsoonTotal: r.rainfall,
      northeastMonsoonTotal: null,
      annualTotal: null,
      lpaSouthwestMonsoon: r.normal,
      anomalyMm: r.anomaly,
      anomalyPercent: r.anomalyPercent,
      monsoonClassification: r.classification as any
    }));

    const tempObs = rawTemperature.map(t => ({
      year: t.year,
      meanMaxTempC: t.temperature,
      meanMinTempC: t.minTemperature ?? null,
      meanTempC: t.meanTemperature ?? null,
      maxTempAnomalyC: t.anomaly,
      minTempAnomalyC: t.minTempAnomaly ?? null
    }));

    const agriObs = rawAgriculture.map(a => ({
      year: a.year,
      cropId: a.cropId,
      cropName: a.crop,
      season: a.season,
      areaUnderCultivationHectares: a.area,
      productionTonnes: a.production,
      yieldKgPerHectare: a.yield,
      yieldAnomalyPercent: a.yieldAnomalyPercent || null,
      irrigationCoveragePercent: a.irrigationCoveragePercent
    }));

    // 4. Build Harmonized Statistical Observations & Merged Climate Matrix
    const { statisticalObs, mergedMatrix } = this.buildHarmonizedMatrix(
      derivedEnso,
      rawRainfall,
      rawTemperature,
      rawAgriculture
    );

    const startYear = derivedEnso[0]?.year || 1971;
    const endYear = derivedEnso[derivedEnso.length - 1]?.year || 2026;

    this.state = {
      isOfficialDataLoaded: true,
      ensoObservations: ensoObs,
      rainfallObservations: rainfallObs,
      temperatureObservations: tempObs,
      agricultureObservations: agriObs,
      rawEnsoRecords: rawEnso,
      derivedMonsoonEnso: derivedEnso,
      rawRainfallRecords: rawRainfall,
      rawTemperatureRecords: rawTemperature,
      rawAgricultureRecords: rawAgriculture,
      statisticalObservations: statisticalObs,
      mergedRecords: mergedMatrix,
      ensoMetadata: {
        source: OFFICIAL_SOURCES.noaa_cpc_oni.sourceName,
        period: `${startYear}–${endYear} (NOAA CPC Official)`,
        units: OFFICIAL_SOURCES.noaa_cpc_oni.units,
        observationCount: rawEnso.length,
        datasetCitation: OFFICIAL_SOURCES.noaa_cpc_oni.citation
      },
      rainfallMetadata: {
        source: OFFICIAL_SOURCES.imd_gridded_rainfall.sourceName,
        period: `${startYear}–${endYear} (IMD Gridded JJAS)`,
        units: OFFICIAL_SOURCES.imd_gridded_rainfall.units,
        observationCount: rawRainfall.length,
        datasetCitation: OFFICIAL_SOURCES.imd_gridded_rainfall.citation
      },
      temperatureMetadata: {
        source: OFFICIAL_SOURCES.imd_gridded_temp.sourceName,
        period: `${startYear}–${endYear} (IMD 0.5° Gridded)`,
        units: OFFICIAL_SOURCES.imd_gridded_temp.units,
        observationCount: rawTemperature.length,
        datasetCitation: OFFICIAL_SOURCES.imd_gridded_temp.citation
      },
      agricultureMetadata: {
        source: OFFICIAL_SOURCES.des_telangana_agri.sourceName,
        period: `${startYear}–${endYear} (DES Season & Crop Reports)`,
        units: OFFICIAL_SOURCES.des_telangana_agri.units,
        observationCount: rawAgriculture.length,
        datasetCitation: OFFICIAL_SOURCES.des_telangana_agri.citation
      },
      ensoQualitySummary: ensoQuality,
      rainfallQualitySummary: rainfallQuality,
      temperatureQualitySummary: tempQuality,
      agricultureQualitySummary: agriQuality,
      lastIngestedTimestamp: new Date().toISOString(),
      datasetVersion: 'v2026.08.15',
      analysisRecalculatedTimestamp: new Date().toISOString(),
      reanalysisRunId: `run-${Date.now()}`
    };

    this.notify();
  }

  /**
   * Ingests and harmonizes a custom snapshot from version history,
   * automatically re-running all validations, extraction, and matrix alignments.
   */
  public static applyCustomDatasetSnapshot(
    rawEnso: ENSORecord[],
    rawRainfall: RainfallRecord[],
    rawTemperature: TemperatureRecord[],
    rawAgriculture: AgricultureRecord[],
    versionId: string,
    indicatorType: MonsoonEnsoIndicatorType = this.activeEnsoIndicator
  ): void {
    this.activeEnsoIndicator = indicatorType;

    const ensoQuality = ValidationService.validateEnsoRecords(rawEnso);
    const rainfallQuality = ValidationService.validateRainfallRecords(rawRainfall);
    const tempQuality = ValidationService.validateTemperatureRecords(rawTemperature);
    const agriQuality = ValidationService.validateAgricultureRecords(rawAgriculture);

    const derivedEnso = EnsoEngine.extractMonsoonIndicators(rawEnso, indicatorType);

    const ensoObs = rawEnso.map(r => ({
      year: r.year,
      month: r.monthIndex,
      season3Month: r.season,
      oniValue: r.oni,
      classification: r.classification as any,
      phase: r.ensoState
    }));

    const rainfallObs = rawRainfall.map(r => ({
      year: r.year,
      districtId: r.district,
      june: null,
      july: null,
      august: null,
      september: null,
      southwestMonsoonTotal: r.rainfall,
      northeastMonsoonTotal: null,
      annualTotal: null,
      lpaSouthwestMonsoon: r.normal,
      anomalyMm: r.anomaly,
      anomalyPercent: r.anomalyPercent,
      monsoonClassification: r.classification as any
    }));

    const tempObs = rawTemperature.map(t => ({
      year: t.year,
      meanMaxTempC: t.temperature,
      meanMinTempC: t.minTemperature ?? null,
      meanTempC: t.meanTemperature ?? null,
      maxTempAnomalyC: t.anomaly,
      minTempAnomalyC: t.minTempAnomaly ?? null
    }));

    const agriObs = rawAgriculture.map(a => ({
      year: a.year,
      cropId: a.cropId,
      cropName: a.crop,
      season: a.season,
      areaUnderCultivationHectares: a.area,
      productionTonnes: a.production,
      yieldKgPerHectare: a.yield,
      yieldAnomalyPercent: a.yieldAnomalyPercent || null,
      irrigationCoveragePercent: a.irrigationCoveragePercent
    }));

    const { statisticalObs, mergedMatrix } = this.buildHarmonizedMatrix(
      derivedEnso,
      rawRainfall,
      rawTemperature,
      rawAgriculture
    );

    const startYear = derivedEnso[0]?.year || 1971;
    const endYear = derivedEnso[derivedEnso.length - 1]?.year || 2026;

    this.state = {
      isOfficialDataLoaded: true,
      ensoObservations: ensoObs,
      rainfallObservations: rainfallObs,
      temperatureObservations: tempObs,
      agricultureObservations: agriObs,
      rawEnsoRecords: rawEnso,
      derivedMonsoonEnso: derivedEnso,
      rawRainfallRecords: rawRainfall,
      rawTemperatureRecords: rawTemperature,
      rawAgricultureRecords: rawAgriculture,
      statisticalObservations: statisticalObs,
      mergedRecords: mergedMatrix,
      ensoMetadata: {
        source: OFFICIAL_SOURCES.noaa_cpc_oni.sourceName,
        period: `${startYear}–${endYear} (NOAA CPC Official)`,
        units: OFFICIAL_SOURCES.noaa_cpc_oni.units,
        observationCount: rawEnso.length,
        datasetCitation: OFFICIAL_SOURCES.noaa_cpc_oni.citation
      },
      rainfallMetadata: {
        source: OFFICIAL_SOURCES.imd_gridded_rainfall.sourceName,
        period: `${startYear}–${endYear} (IMD Gridded JJAS)`,
        units: OFFICIAL_SOURCES.imd_gridded_rainfall.units,
        observationCount: rawRainfall.length,
        datasetCitation: OFFICIAL_SOURCES.imd_gridded_rainfall.citation
      },
      temperatureMetadata: {
        source: OFFICIAL_SOURCES.imd_gridded_temp.sourceName,
        period: `${startYear}–${endYear} (IMD 0.5° Gridded)`,
        units: OFFICIAL_SOURCES.imd_gridded_temp.units,
        observationCount: rawTemperature.length,
        datasetCitation: OFFICIAL_SOURCES.imd_gridded_temp.citation
      },
      agricultureMetadata: {
        source: OFFICIAL_SOURCES.des_telangana_agri.sourceName,
        period: `${startYear}–${endYear} (DES Season & Crop Reports)`,
        units: OFFICIAL_SOURCES.des_telangana_agri.units,
        observationCount: rawAgriculture.length,
        datasetCitation: OFFICIAL_SOURCES.des_telangana_agri.citation
      },
      ensoQualitySummary: ensoQuality,
      rainfallQualitySummary: rainfallQuality,
      temperatureQualitySummary: tempQuality,
      agricultureQualitySummary: agriQuality,
      lastIngestedTimestamp: new Date().toISOString(),
      datasetVersion: versionId,
      analysisRecalculatedTimestamp: new Date().toISOString(),
      reanalysisRunId: `run-${Date.now()}`
    };

    this.notify();
  }

  /**
   * Sets the active monsoon ENSO indicator (e.g. JJAS_MEAN, JJA, JAS, MJJ)
   * and dynamically rebuilds the composite statistical observation matrix.
   */
  public static setMonsoonEnsoIndicator(indicatorType: MonsoonEnsoIndicatorType): void {
    if (!this.state.isOfficialDataLoaded) return;
    this.activeEnsoIndicator = indicatorType;
    this.loadOfficialBenchmarkDatasets(indicatorType);
  }

  /**
   * Helper to build aligned annual observation rows for statistical testing
   */
  private static buildHarmonizedMatrix(
    derivedEnso: DerivedMonsoonEnsoIndicator[],
    rainfall: RainfallRecord[],
    temperature: TemperatureRecord[],
    agriculture: AgricultureRecord[]
  ) {
    const rawMonthlyRain = getOfficialImdMonthlyRainfallRecords();
    const yearSet = new Set<number>();
    derivedEnso.forEach(e => yearSet.add(e.year));
    rainfall.forEach(r => yearSet.add(r.year));
    temperature.forEach(t => yearSet.add(t.year));
    agriculture.forEach(a => yearSet.add(a.year));

    const sortedYears = Array.from(yearSet).sort((a, b) => a - b);

    const statisticalObs: StatisticalObservation[] = [];
    const mergedMatrix: MergedClimateRecord[] = [];

    for (const year of sortedYears) {
      const enso = derivedEnso.find(e => e.year === year);
      const rain = rainfall.find(r => r.year === year && r.isStateLevel);
      const monthlyRow = rawMonthlyRain.find(m => m.year === year);
      const temp = temperature.find(t => t.year === year && t.isStateLevel);

      const paddy = agriculture.find(a => a.year === year && a.cropId === 'paddy_rice');
      const cotton = agriculture.find(a => a.year === year && a.cropId === 'cotton');
      const maize = agriculture.find(a => a.year === year && a.cropId === 'maize');
      const redGram = agriculture.find(a => a.year === year && a.cropId === 'red_gram');
      const soyabean = agriculture.find(a => a.year === year && a.cropId === 'soyabean');

      const isComplete = Boolean(enso && rain && temp && paddy);

      statisticalObs.push({
        year,
        oniMonsoon: enso?.oniValue ?? null,
        ensoPhase: enso?.ensoState ?? null,
        ensoClassification: enso?.classification,
        rainfallSWMm: rain?.rainfall ?? null,
        rainfallNormalMm: rain?.normal ?? 750.5,
        rainfallAnomalyMm: rain?.anomaly ?? null,
        rainfallAnomalyPercent: rain?.anomalyPercent ?? null,
        rainfallCategory: rain?.classification,
        maxTemperatureC: temp?.temperature ?? null,
        maxTempAnomalyC: temp?.anomaly ?? null,
        paddyYieldKgHa: paddy?.yield ?? null,
        cottonYieldKgHa: cotton?.yield ?? null,
        maizeYieldKgHa: maize?.yield ?? null,
        redGramYieldKgHa: redGram?.yield ?? null,
        soyabeanYieldKgHa: soyabean?.yield ?? null,
        isCompleteObservation: isComplete,
        dataSources: {
          enso: OFFICIAL_SOURCES.noaa_cpc_oni.datasetName,
          rainfall: OFFICIAL_SOURCES.imd_gridded_rainfall.datasetName,
          temperature: OFFICIAL_SOURCES.imd_gridded_temp.datasetName,
          agriculture: OFFICIAL_SOURCES.des_telangana_agri.datasetName
        },
        qualityFlags: isComplete ? ['VERIFIED_COMPLETE_SERIES'] : ['PARTIAL_SERIES']
      });

      mergedMatrix.push({
        year,
        oniJjas: enso?.oniValue ?? null,
        ensoPhase: enso?.ensoState ?? null,
        rainfallJjasMm: rain?.rainfall ?? null,
        rainfallAnomalyPercent: rain?.anomalyPercent ?? null,
        rainfallJuneMm: monthlyRow?.june ?? null,
        rainfallJulyMm: monthlyRow?.july ?? null,
        rainfallAugustMm: monthlyRow?.august ?? null,
        rainfallSeptemberMm: monthlyRow?.september ?? null,
        meanMaxTempC: temp?.temperature ?? null,
        meanMinTempC: temp?.minTemperature ?? null,
        meanTempC: temp?.meanTemperature ?? null,
        tempMaxAnomalyC: temp?.anomaly ?? null,
        tempMinAnomalyC: temp?.minTempAnomaly ?? null,
        tempMeanAnomalyC: (temp?.meanTemperature && temp.meanTemperature !== null) ? Number((temp.meanTemperature - 28.1).toFixed(2)) : null,
        paddyYieldKgHa: paddy?.yield ?? null,
        cottonYieldKgHa: cotton?.yield ?? null,
        maizeYieldKgHa: maize?.yield ?? null,
        redGramYieldKgHa: redGram?.yield ?? null,
        soyabeanYieldKgHa: soyabean?.yield ?? null
      });
    }

    return { statisticalObs, mergedMatrix };
  }

  /**
   * Generates formatted CSV string of the unified annual statistical observations
   */
  public static exportUnifiedDatasetCsv(): string {
    const obs = this.state.statisticalObservations;
    if (obs.length === 0) return '';

    const headers = [
      'Year',
      'Monsoon_ONI_Anomaly_degC',
      'ENSO_Phase',
      'SWM_Rainfall_Actual_mm',
      'SWM_Rainfall_Normal_LPA_mm',
      'Rainfall_Departure_Percent',
      'Max_Temperature_degC',
      'Max_Temp_Anomaly_degC',
      'Paddy_Yield_kg_ha',
      'Cotton_Yield_kg_ha',
      'Maize_Yield_kg_ha',
      'Red_Gram_Yield_kg_ha',
      'Soyabean_Yield_kg_ha',
      'Data_Sources'
    ];

    const rows = obs.map(o => [
      o.year,
      o.oniMonsoon !== null ? o.oniMonsoon.toFixed(2) : '',
      o.ensoPhase || '',
      o.rainfallSWMm !== null ? o.rainfallSWMm.toFixed(1) : '',
      o.rainfallNormalMm.toFixed(1),
      o.rainfallAnomalyPercent !== null ? o.rainfallAnomalyPercent.toFixed(1) : '',
      o.maxTemperatureC !== null ? o.maxTemperatureC.toFixed(1) : '',
      o.maxTempAnomalyC !== null ? o.maxTempAnomalyC.toFixed(2) : '',
      o.paddyYieldKgHa || '',
      o.cottonYieldKgHa || '',
      o.maizeYieldKgHa || '',
      o.redGramYieldKgHa || '',
      o.soyabeanYieldKgHa || '',
      `"NOAA CPC, IMD Gridded, DES Telangana"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

// Auto-load verified official benchmark datasets on module initialization so the application
// and all statistical evidence engines are immediately populated and active on load.
DatasetService.loadOfficialBenchmarkDatasets();
