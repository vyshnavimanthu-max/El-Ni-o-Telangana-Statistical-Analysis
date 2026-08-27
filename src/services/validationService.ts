/**
 * Comprehensive Data Validation & Quality Assurance Layer
 * for Climatological, Oceanic & Agronomic Observational Series
 * 
 * VALIDATION MANDATES:
 * - Flag missing values (null, NaN, blank)
 * - Detect duplicate keys (year, season, district, crop)
 * - Identify out-of-bounds physically impossible meteorological/agronomic values
 * - Verify unit consistency
 * - Normalize and standardize Telangana district names (33 official districts + legacy aliases)
 * - Generate a standardized DataQualitySummary report
 */

import { 
  ENSORecord, 
  RainfallRecord, 
  TemperatureRecord, 
  AgricultureRecord, 
  DataQualitySummary, 
  ValidationIssue 
} from '../types/dataModels';
import { TELANGANA_DISTRICTS } from '../data/districts';

// Normalized district dictionary mapping aliases/common spelling variations to canonical IDs
export const TELANGANA_DISTRICT_ALIASES: Record<string, string> = {
  // Adilabad
  'adilabad': 'adilabad',
  'adb': 'adilabad',
  // Bhadradri Kothagudem
  'bhadradri kothagudem': 'bhadradri_kothagudem',
  'kothagudem': 'bhadradri_kothagudem',
  'bhadradri': 'bhadradri_kothagudem',
  // Hanumakonda / Warangal Urban
  'hanumakonda': 'hanumakonda',
  'hanamkonda': 'hanumakonda',
  'warangal urban': 'hanumakonda',
  'warangal (urban)': 'hanumakonda',
  // Warangal / Warangal Rural
  'warangal': 'warangal',
  'warangal rural': 'warangal',
  'warangal (rural)': 'warangal',
  // Hyderabad
  'hyderabad': 'hyderabad',
  'hyd': 'hyderabad',
  // Jagtial
  'jagtial': 'jagtial',
  'jagitial': 'jagtial',
  // Jangaon
  'jangaon': 'jangaon',
  'jangoan': 'jangaon',
  // Jayashankar Bhupalpally
  'jayashankar bhupalpally': 'jayashankar_bhupalpally',
  'bhupalpally': 'jayashankar_bhupalpally',
  'jayashankar': 'jayashankar_bhupalpally',
  // Jogulamba Gadwal
  'jogulamba gadwal': 'jogulamba_gadwal',
  'gadwal': 'jogulamba_gadwal',
  'jogulamba': 'jogulamba_gadwal',
  // Kamareddy
  'kamareddy': 'kamareddy',
  // Karimnagar
  'karimnagar': 'karimnagar',
  // Khammam
  'khammam': 'khammam',
  // Kumuram Bheem Asifabad
  'kumuram bheem asifabad': 'kumuram_bheem_asifabad',
  'komaram bheem': 'kumuram_bheem_asifabad',
  'asifabad': 'kumuram_bheem_asifabad',
  'komaram bheem asifabad': 'kumuram_bheem_asifabad',
  // Mahabubabad
  'mahabubabad': 'mahabubabad',
  'mahbubabad': 'mahabubabad',
  // Mahabubnagar
  'mahabubnagar': 'mahabubnagar',
  'mahbubnagar': 'mahabubnagar',
  'palamoor': 'mahabubnagar',
  // Mancherial
  'mancherial': 'mancherial',
  'manchiryala': 'mancherial',
  // Medak
  'medak': 'medak',
  // Medchal-Malkajgiri
  'medchal malkajgiri': 'medchal_malkajgiri',
  'medchal-malkajgiri': 'medchal_malkajgiri',
  'medchal': 'medchal_malkajgiri',
  'malkajgiri': 'medchal_malkajgiri',
  // Mulugu
  'mulugu': 'mulugu',
  'mulug': 'mulugu',
  // Nagarkurnool
  'nagarkurnool': 'nagarkurnool',
  'nagar kurnool': 'nagarkurnool',
  // Nalgonda
  'nalgonda': 'nalgonda',
  // Narayanpet
  'narayanpet': 'narayanpet',
  'narayanapet': 'narayanpet',
  // Nirmal
  'nirmal': 'nirmal',
  // Nizamabad
  'nizamabad': 'nizamabad',
  // Peddapalli
  'peddapalli': 'peddapalli',
  'peddapally': 'peddapalli',
  // Rajanna Sircilla
  'rajanna sircilla': 'rajanna_sircilla',
  'sircilla': 'rajanna_sircilla',
  'rajanna siricilla': 'rajanna_sircilla',
  // Ranga Reddy
  'ranga reddy': 'ranga_reddy',
  'rangareddy': 'ranga_reddy',
  'r.r. district': 'ranga_reddy',
  'k.v. ranga reddy': 'ranga_reddy',
  // Sangareddy
  'sangareddy': 'sangareddy',
  'sanga reddy': 'sangareddy',
  // Siddipet
  'siddipet': 'siddipet',
  // Suryapet
  'suryapet': 'suryapet',
  'surya pet': 'suryapet',
  // Vikarabad
  'vikarabad': 'vikarabad',
  // Wanaparthy
  'wanaparthy': 'wanaparthy',
  'wanaparthi': 'wanaparthy',
  // Yadadri Bhuvanagiri
  'yadadri bhuvanagiri': 'yadadri_bhuvanagiri',
  'yadadri': 'yadadri_bhuvanagiri',
  'bhongir': 'yadadri_bhuvanagiri',
  'bhuvanagiri': 'yadadri_bhuvanagiri'
};

export class ValidationService {
  /**
   * Standardizes and validates district names against official 33 Telangana districts
   */
  public static normalizeDistrict(rawName?: string): {
    isValid: boolean;
    normalizedId?: string;
    normalizedName?: string;
    isStateLevel: boolean;
    warning?: string;
  } {
    if (!rawName || rawName.trim() === '' || rawName.toUpperCase() === 'STATE' || rawName.toUpperCase() === 'TELANGANA') {
      return { isValid: true, isStateLevel: true };
    }

    const clean = rawName.trim().toLowerCase();
    const matchedId = TELANGANA_DISTRICT_ALIASES[clean];

    if (matchedId) {
      const canonical = TELANGANA_DISTRICTS.find(d => d.id === matchedId);
      return {
        isValid: true,
        normalizedId: matchedId,
        normalizedName: canonical ? canonical.name : matchedId,
        isStateLevel: false
      };
    }

    return {
      isValid: false,
      isStateLevel: false,
      warning: `Unknown district name '${rawName}'. Must match one of 33 official Telangana administrative districts.`
    };
  }

  /**
   * Validates ENSO (ONI) records
   */
  public static validateEnsoRecords(records: ENSORecord[]): DataQualitySummary {
    const issues: ValidationIssue[] = [];
    const seenKeys = new Set<string>();
    let missingCount = 0;
    let duplicateCount = 0;
    let anomalousCount = 0;

    let minYear = Infinity;
    let maxYear = -Infinity;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const rowId = `Row ${i + 1} (Year ${rec.year} - ${rec.season})`;

      if (rec.year < minYear) minYear = rec.year;
      if (rec.year > maxYear) maxYear = rec.year;

      // 1. Year bounds
      if (isNaN(rec.year) || rec.year < 1950 || rec.year > 2030) {
        issues.push({
          id: `enso_yr_${i}`,
          severity: 'ERROR',
          category: 'INVALID_DATE',
          recordIdentifier: rowId,
          variableName: 'year',
          message: `Year ${rec.year} is outside valid climatological historical bounds (1950–2030).`,
          valueReceived: rec.year,
          expectedConstraint: '1950 <= year <= 2030',
          recommendedAction: 'Verify observation timestamp against official NOAA CPC record.'
        });
      }

      // 2. Duplicate detection (Year + Season)
      const key = `${rec.year}_${rec.season}`;
      if (seenKeys.has(key)) {
        duplicateCount++;
        issues.push({
          id: `enso_dup_${i}`,
          severity: 'ERROR',
          category: 'DUPLICATE_RECORD',
          recordIdentifier: rowId,
          variableName: 'season',
          message: `Duplicate ENSO record detected for Year ${rec.year} Season ${rec.season}.`,
          valueReceived: key,
          recommendedAction: 'Remove duplicate time index entry.'
        });
      }
      seenKeys.add(key);

      // 3. Missing values
      if (rec.oni === null || rec.oni === undefined || isNaN(rec.oni)) {
        missingCount++;
        issues.push({
          id: `enso_miss_${i}`,
          severity: 'ERROR',
          category: 'MISSING_VALUE',
          recordIdentifier: rowId,
          variableName: 'oni',
          message: 'Missing or non-numeric ONI SST anomaly value.',
          recommendedAction: 'Acquire official ERSST.v5 Niño 3.4 value from NOAA CPC.'
        });
      } else {
        // 4. Physical bounds (-5.0°C to +5.0°C)
        if (rec.oni < -5.0 || rec.oni > 5.0) {
          anomalousCount++;
          issues.push({
            id: `enso_bound_${i}`,
            severity: 'ERROR',
            category: 'OUT_OF_BOUNDS',
            recordIdentifier: rowId,
            variableName: 'oni',
            message: `ONI anomaly ${rec.oni}°C exceeds physically possible equatorial SST anomaly limits (-5.0°C to +5.0°C).`,
            valueReceived: rec.oni,
            expectedConstraint: '-5.0 <= ONI <= +5.0',
            recommendedAction: 'Inspect for decimal transposition errors.'
          });
        }
      }
    }

    const total = records.length;
    const missingPct = total > 0 ? (missingCount / total) * 100 : 0;
    const validCount = total - missingCount - duplicateCount;

    let overallQualityStatus: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'REJECTED' = 'EXCELLENT';
    if (issues.some(iss => iss.severity === 'ERROR')) {
      overallQualityStatus = duplicateCount > 5 || anomalousCount > 0 ? 'REJECTED' : 'WARNING';
    } else if (missingPct > 5) {
      overallQualityStatus = 'GOOD';
    }

    return {
      totalObservations: total,
      validObservations: validCount,
      missingObservations: missingCount,
      missingPercentage: Number(missingPct.toFixed(2)),
      duplicateObservations: duplicateCount,
      anomalousValuesCount: anomalousCount,
      dateRange: {
        startYear: minYear === Infinity ? 0 : minYear,
        endYear: maxYear === -Infinity ? 0 : maxYear,
        totalYears: maxYear >= minYear ? maxYear - minYear + 1 : 0
      },
      source: 'NOAA Climate Prediction Center (CPC)',
      sourceOrganization: 'National Oceanic and Atmospheric Administration (NOAA)',
      frequency: '3-Month Running Mean',
      units: '°C (Niño 3.4 SST Anomaly)',
      validationIssues: issues,
      overallQualityStatus
    };
  }

  /**
   * Validates Rainfall records (IMD / DES Telangana)
   */
  public static validateRainfallRecords(records: RainfallRecord[]): DataQualitySummary {
    const issues: ValidationIssue[] = [];
    const seenKeys = new Set<string>();
    let missingCount = 0;
    let duplicateCount = 0;
    let anomalousCount = 0;

    let minYear = Infinity;
    let maxYear = -Infinity;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const rowId = `Year ${rec.year} - ${rec.monthOrSeason} (${rec.district || 'Statewide'})`;

      if (rec.year < minYear) minYear = rec.year;
      if (rec.year > maxYear) maxYear = rec.year;

      // 1. Year bounds
      if (isNaN(rec.year) || rec.year < 1901 || rec.year > 2030) {
        issues.push({
          id: `rain_yr_${i}`,
          severity: 'ERROR',
          category: 'INVALID_DATE',
          recordIdentifier: rowId,
          variableName: 'year',
          message: `Year ${rec.year} is outside climatological dataset coverage (1901–2030).`,
          valueReceived: rec.year,
          expectedConstraint: '1901 <= year <= 2030',
          recommendedAction: 'Check year column formatting.'
        });
      }

      // 2. Duplicate detection
      const key = `${rec.year}_${rec.monthOrSeason}_${rec.district || 'STATE'}`;
      if (seenKeys.has(key)) {
        duplicateCount++;
        issues.push({
          id: `rain_dup_${i}`,
          severity: 'ERROR',
          category: 'DUPLICATE_RECORD',
          recordIdentifier: rowId,
          variableName: 'year_season_district',
          message: `Duplicate rainfall observation found for ${key}.`,
          recommendedAction: 'Deduplicate dataset before statistical aggregation.'
        });
      }
      seenKeys.add(key);

      // 3. District normalization check
      if (rec.district && !rec.isStateLevel) {
        const norm = this.normalizeDistrict(rec.district);
        if (!norm.isValid) {
          issues.push({
            id: `rain_dist_${i}`,
            severity: 'WARNING',
            category: 'DISTRICT_NAMING',
            recordIdentifier: rowId,
            variableName: 'district',
            message: norm.warning || `Non-standard district identifier '${rec.district}'.`,
            recommendedAction: 'Map to canonical 33 Telangana district standard.'
          });
        }
      }

      // 4. Missing value checks
      if (rec.rainfall === null || rec.rainfall === undefined || isNaN(rec.rainfall)) {
        missingCount++;
        issues.push({
          id: `rain_miss_${i}`,
          severity: 'ERROR',
          category: 'MISSING_VALUE',
          recordIdentifier: rowId,
          variableName: 'rainfall',
          message: 'Missing or null precipitation measurement.',
          recommendedAction: 'Check IMD gridded interpolation or station rain gauge log.'
        });
      } else {
        // 5. Impossible bounds
        // SWM rainfall cannot be negative and cannot realistically exceed 4000 mm for Telangana
        if (rec.rainfall < 0) {
          anomalousCount++;
          issues.push({
            id: `rain_neg_${i}`,
            severity: 'ERROR',
            category: 'OUT_OF_BOUNDS',
            recordIdentifier: rowId,
            variableName: 'rainfall',
            message: `Negative rainfall (${rec.rainfall} mm) is physically impossible.`,
            valueReceived: rec.rainfall,
            expectedConstraint: 'rainfall >= 0.0 mm',
            recommendedAction: 'Replace negative values with 0.0 or null.'
          });
        } else if (rec.rainfall > 3500) {
          anomalousCount++;
          issues.push({
            id: `rain_high_${i}`,
            severity: 'WARNING',
            category: 'OUT_OF_BOUNDS',
            recordIdentifier: rowId,
            variableName: 'rainfall',
            message: `Rainfall (${rec.rainfall} mm) exceeds 3500 mm (historical Telangana maximum is ~1400 mm).`,
            valueReceived: rec.rainfall,
            expectedConstraint: '0 <= rainfall <= 3500 mm',
            recommendedAction: 'Verify whether units are incorrectly specified in centimetres.'
          });
        }
      }
    }

    const total = records.length;
    const missingPct = total > 0 ? (missingCount / total) * 100 : 0;

    let overallQualityStatus: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'REJECTED' = 'EXCELLENT';
    if (issues.some(iss => iss.severity === 'ERROR')) {
      overallQualityStatus = anomalousCount > 0 || duplicateCount > 5 ? 'REJECTED' : 'WARNING';
    } else if (missingPct > 5) {
      overallQualityStatus = 'GOOD';
    }

    return {
      totalObservations: total,
      validObservations: total - missingCount - duplicateCount,
      missingObservations: missingCount,
      missingPercentage: Number(missingPct.toFixed(2)),
      duplicateObservations: duplicateCount,
      anomalousValuesCount: anomalousCount,
      dateRange: {
        startYear: minYear === Infinity ? 0 : minYear,
        endYear: maxYear === -Infinity ? 0 : maxYear,
        totalYears: maxYear >= minYear ? maxYear - minYear + 1 : 0
      },
      source: 'India Meteorological Department (IMD)',
      sourceOrganization: 'Ministry of Earth Sciences / IMD Pune',
      frequency: 'Southwest Monsoon (JJAS) & Monthly',
      units: 'Millimetres (mm)',
      validationIssues: issues,
      overallQualityStatus
    };
  }

  /**
   * Validates Temperature records
   */
  public static validateTemperatureRecords(records: TemperatureRecord[]): DataQualitySummary {
    const issues: ValidationIssue[] = [];
    const seenKeys = new Set<string>();
    let missingCount = 0;
    let duplicateCount = 0;
    let anomalousCount = 0;

    let minYear = Infinity;
    let maxYear = -Infinity;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const rowId = `Year ${rec.year} - ${rec.monthOrSeason}`;

      if (rec.year < minYear) minYear = rec.year;
      if (rec.year > maxYear) maxYear = rec.year;

      const key = `${rec.year}_${rec.monthOrSeason}_${rec.district || 'STATE'}`;
      if (seenKeys.has(key)) {
        duplicateCount++;
        issues.push({
          id: `temp_dup_${i}`,
          severity: 'ERROR',
          category: 'DUPLICATE_RECORD',
          recordIdentifier: rowId,
          variableName: 'year_season',
          message: `Duplicate temperature observation for ${key}.`,
          recommendedAction: 'Deduplicate temperature dataset.'
        });
      }
      seenKeys.add(key);

      if (rec.temperature === null || rec.temperature === undefined || isNaN(rec.temperature)) {
        missingCount++;
      } else {
        if (rec.temperature < 10 || rec.temperature > 55) {
          anomalousCount++;
          issues.push({
            id: `temp_bound_${i}`,
            severity: 'ERROR',
            category: 'OUT_OF_BOUNDS',
            recordIdentifier: rowId,
            variableName: 'temperature',
            message: `Temperature ${rec.temperature}°C is outside valid Telangana climatological range (10°C–55°C).`,
            valueReceived: rec.temperature,
            expectedConstraint: '10.0 <= temperature <= 55.0 °C',
            recommendedAction: 'Verify thermometric instrument calibration.'
          });
        }
      }
    }

    const total = records.length;
    const missingPct = total > 0 ? (missingCount / total) * 100 : 0;

    return {
      totalObservations: total,
      validObservations: total - missingCount - duplicateCount,
      missingObservations: missingCount,
      missingPercentage: Number(missingPct.toFixed(2)),
      duplicateObservations: duplicateCount,
      anomalousValuesCount: anomalousCount,
      dateRange: {
        startYear: minYear === Infinity ? 0 : minYear,
        endYear: maxYear === -Infinity ? 0 : maxYear,
        totalYears: maxYear >= minYear ? maxYear - minYear + 1 : 0
      },
      source: 'India Meteorological Department (IMD)',
      sourceOrganization: 'Ministry of Earth Sciences / IMD Pune',
      frequency: 'Monsoon JJAS Mean Maximum Temperature',
      units: '°C (Degrees Celsius)',
      validationIssues: issues,
      overallQualityStatus: anomalousCount > 0 ? 'WARNING' : 'EXCELLENT'
    };
  }

  /**
   * Validates Agricultural records (DES Telangana)
   */
  public static validateAgricultureRecords(records: AgricultureRecord[]): DataQualitySummary {
    const issues: ValidationIssue[] = [];
    const seenKeys = new Set<string>();
    let missingCount = 0;
    let duplicateCount = 0;
    let anomalousCount = 0;

    let minYear = Infinity;
    let maxYear = -Infinity;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const rowId = `Year ${rec.year} - Crop: ${rec.crop} (${rec.district || 'Statewide'})`;

      if (rec.year < minYear) minYear = rec.year;
      if (rec.year > maxYear) maxYear = rec.year;

      const key = `${rec.year}_${rec.cropId}_${rec.season}_${rec.district || 'STATE'}`;
      if (seenKeys.has(key)) {
        duplicateCount++;
        issues.push({
          id: `agri_dup_${i}`,
          severity: 'ERROR',
          category: 'DUPLICATE_RECORD',
          recordIdentifier: rowId,
          variableName: 'crop_year',
          message: `Duplicate crop record for ${key}.`,
          recommendedAction: 'Deduplicate agricultural series.'
        });
      }
      seenKeys.add(key);

      if (rec.yield === null || rec.yield === undefined || isNaN(rec.yield)) {
        missingCount++;
      } else {
        if (rec.yield < 0 || rec.yield > 20000) {
          anomalousCount++;
          issues.push({
            id: `agri_yield_${i}`,
            severity: 'ERROR',
            category: 'OUT_OF_BOUNDS',
            recordIdentifier: rowId,
            variableName: 'yield',
            message: `Yield value ${rec.yield} kg/ha is outside plausible agricultural survey limits (0 to 20,000 kg/ha).`,
            valueReceived: rec.yield,
            expectedConstraint: '0 <= yield <= 20000 kg/ha',
            recommendedAction: 'Check if yield is given in Quintals/Acre or Tonnes/Ha instead of Kg/Ha.'
          });
        }
      }

      if (rec.area !== null && rec.area !== undefined && rec.area < 0) {
        anomalousCount++;
        issues.push({
          id: `agri_area_${i}`,
          severity: 'ERROR',
          category: 'OUT_OF_BOUNDS',
          recordIdentifier: rowId,
          variableName: 'area',
          message: `Area under cultivation cannot be negative (${rec.area} ha).`,
          valueReceived: rec.area,
          recommendedAction: 'Check DES Season and Crop Report tables.'
        });
      }
    }

    const total = records.length;
    const missingPct = total > 0 ? (missingCount / total) * 100 : 0;

    return {
      totalObservations: total,
      validObservations: total - missingCount - duplicateCount,
      missingObservations: missingCount,
      missingPercentage: Number(missingPct.toFixed(2)),
      duplicateObservations: duplicateCount,
      anomalousValuesCount: anomalousCount,
      dateRange: {
        startYear: minYear === Infinity ? 0 : minYear,
        endYear: maxYear === -Infinity ? 0 : maxYear,
        totalYears: maxYear >= minYear ? maxYear - minYear + 1 : 0
      },
      source: 'Directorate of Economics and Statistics (DES), Telangana',
      sourceOrganization: 'Planning Department, Government of Telangana',
      frequency: 'Annual Crop-Year (Kharif / Rabi)',
      units: 'Yield (Kg/Hectare), Area (Hectares), Production (Tonnes)',
      validationIssues: issues,
      overallQualityStatus: anomalousCount > 0 ? 'WARNING' : 'EXCELLENT'
    };
  }
}
