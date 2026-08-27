import { 
  MergedClimateRecord 
} from '../types/dataset';
import {
  calculatePearsonAndSpearman,
  calculateMultipleLinearRegression,
  studentTCriticalValue,
  calculateStudentTPValue,
  calculateMean,
  calculateStdDev
} from './engine';

export interface EvidenceRelationshipItem {
  id: string;
  relationship: string;
  shortName: string;
  predictorVar: string;
  predictorUnit: string;
  responseVar: string;
  responseUnit: string;
  category: 'CLIMATE_TELECONNECTION' | 'CLIMATE_THERMAL' | 'AGRONOMIC_VULNERABILITY';
  method: string;
  sampleSize: number;
  degreesOfFreedom: number;
  estimate: {
    pearsonR: number;
    spearmanRho: number;
    olsSlope: number;
    olsIntercept: number;
    olsSeSlope: number;
    rSquared: number;
  };
  confidenceInterval95: [number, number]; // 95% CI for Pearson r
  ci95Slope: [number, number]; // 95% CI for OLS slope
  ciSpan: number; // width of CI for uncertainty evaluation
  relativeUncertainty: number; // SE / |estimate|
  pValue: number;
  tStatistic: number;
  alpha: number;
  isStatisticallySignificant: boolean;
  significanceLabel: 'Statistically significant' | 'Not statistically significant';
  effectSize: {
    rSquared: number;
    rSquaredPct: number;
    cohensD?: number;
    magnitude: 'Large' | 'Moderate' | 'Small' | 'Negligible';
    label: string;
  };
  interpretation: {
    direction: string;
    strength: string;
    uncertainty: string;
    statisticalSignificance: string;
    practicalMeaning: string;
    limitations: string;
    summaryText: string;
  };
  scatterData: { x: number; y: number; year: number; phase: string }[];
}

export interface ResearchSummaryResults {
  strongestRelationship: EvidenceRelationshipItem;
  weakestRelationship: EvidenceRelationshipItem;
  mostSignificantResult: EvidenceRelationshipItem;
  mostUncertainResult: EvidenceRelationshipItem;
  totalEvaluated: number;
  significantCount: number;
  meanSharedVariancePct: number;
  timeRange: [number, number];
  sampleSize: number;
  importantLimitations: string[];
}

/**
 * Helper to compute single evidence item
 */
function computeSingleEvidenceItem(
  id: string,
  relationship: string,
  shortName: string,
  predictorName: string,
  predictorUnit: string,
  responseName: string,
  responseUnit: string,
  category: 'CLIMATE_TELECONNECTION' | 'CLIMATE_THERMAL' | 'AGRONOMIC_VULNERABILITY',
  xVals: (number | null | undefined)[],
  yVals: (number | null | undefined)[],
  years: number[],
  phases: (string | null | undefined)[],
  practicalUnitDescriptor: string,
  cropTechNote?: string,
  alpha = 0.05
): EvidenceRelationshipItem | null {
  const paired: { x: number; y: number; year: number; phase: string }[] = [];
  for (let i = 0; i < Math.min(xVals.length, yVals.length); i++) {
    const x = xVals[i];
    const y = yVals[i];
    if (typeof x === 'number' && !isNaN(x) && typeof y === 'number' && !isNaN(y)) {
      paired.push({
        x,
        y,
        year: years[i] ?? 1980 + i,
        phase: phases[i] || 'NEUTRAL'
      });
    }
  }

  const n = paired.length;
  if (n < 4) return null;

  const df = n - 2;
  const xArr = paired.map(p => p.x);
  const yArr = paired.map(p => p.y);

  // 1. Pearson and Spearman
  const corrRes = calculatePearsonAndSpearman(xArr, yArr, predictorName, responseName);
  const r = corrRes.pearsonR ?? 0;
  const rho = corrRes.spearmanRho ?? 0;
  const pVal = corrRes.pValuePearson ?? 1.0;
  const r2 = r * r;
  const tStat = corrRes.tStatisticPearson ?? 0;
  const ci95R = corrRes.confidenceInterval95 ?? [r, r];

  // 2. Bivariate OLS Regression
  const meanX = calculateMean(xArr)!;
  const meanY = calculateMean(yArr)!;
  let ssXX = 0;
  let ssXY = 0;
  let ssYY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xArr[i] - meanX;
    const dy = yArr[i] - meanY;
    ssXX += dx * dx;
    ssXY += dx * dy;
    ssYY += dy * dy;
  }

  const slope = ssXX > 0 ? ssXY / ssXX : 0;
  const intercept = meanY - slope * meanX;

  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yHat = intercept + slope * xArr[i];
    ssRes += Math.pow(yArr[i] - yHat, 2);
  }
  const s2 = df > 0 ? ssRes / df : 0;
  const seSlope = ssXX > 0 ? Math.sqrt(s2 / ssXX) : 0;

  const tCrit = studentTCriticalValue(df, alpha);
  const ci95Slope: [number, number] = [
    Number((slope - tCrit * seSlope).toFixed(4)),
    Number((slope + tCrit * seSlope).toFixed(4))
  ];

  const isSig = pVal < alpha;
  const ciSpan = Math.abs(ci95R[1] - ci95R[0]);
  const relUncertainty = Math.abs(slope) > 1e-6 ? seSlope / Math.abs(slope) : 999;

  // Effect Size categorization (Cohen 1988 conventions for r / R²)
  let magnitude: 'Large' | 'Moderate' | 'Small' | 'Negligible' = 'Negligible';
  const absR = Math.abs(r);
  if (absR >= 0.5 || r2 >= 0.25) magnitude = 'Large';
  else if (absR >= 0.3 || r2 >= 0.09) magnitude = 'Moderate';
  else if (absR >= 0.1 || r2 >= 0.01) magnitude = 'Small';
  else magnitude = 'Negligible';

  const dirWord = r > 0 ? 'Positive' : r < 0 ? 'Negative' : 'Neutral';
  const dirDetail = r > 0 
    ? `Positive direct relationship (+)` 
    : r < 0 
    ? `Inverse negative relationship (−)` 
    : `No systematic linear direction (zero slope)`;

  const strengthDetail = `${magnitude} association (${dirWord}), with Pearson r = ${r.toFixed(3)} (Spearman ρ = ${rho.toFixed(3)}) explaining ${(r2 * 100).toFixed(1)}% of total response variance (R² = ${r2.toFixed(3)}).`;

  const uncertaintyDetail = `95% Confidence Interval for Pearson r: [${ci95R[0].toFixed(3)}, ${ci95R[1].toFixed(3)}] (span: ${ciSpan.toFixed(3)}). The OLS marginal slope estimate is ${slope > 0 ? '+' : ''}${slope.toFixed(2)} ± ${(tCrit * seSlope).toFixed(2)} ${responseUnit}/${predictorUnit} (SE = ${seSlope.toFixed(2)}, relative uncertainty = ${(relUncertainty * 100).toFixed(1)}%).`;

  const sigDetail = isSig
    ? `Statistically significant at α = ${alpha} (t(${df}) = ${tStat.toFixed(2)}, two-tailed p = ${pVal < 0.0001 ? '< 0.0001' : pVal.toFixed(4)} < ${alpha}). We reject the null hypothesis of zero association.`
    : `Not statistically significant at α = ${alpha} (t(${df}) = ${tStat.toFixed(2)}, two-tailed p = ${pVal.toFixed(4)} >= ${alpha}). We fail to reject the null hypothesis of zero association.`;

  const practicalMeaning = `On average across the empirical record, each 1.0 ${predictorUnit} change in ${predictorName} is associated with a ${slope > 0 ? '+' : ''}${slope.toFixed(2)} ${responseUnit} change in ${responseName} (${practicalUnitDescriptor}).`;

  let baseLimitation = `Observational longitudinal association subject to unmodeled oceanic/atmospheric covariates (e.g. Indian Ocean Dipole, Bay of Bengal depression tracks) and linearity assumptions.`;
  if (cropTechNote) {
    baseLimitation += ` ${cropTechNote}`;
  }

  const summaryText = isSig
    ? `Statistically significant ${magnitude.toLowerCase()} ${dirWord.toLowerCase()} association (r = ${r.toFixed(3)}, 95% CI [${ci95R[0].toFixed(3)}, ${ci95R[1].toFixed(3)}], p = ${pVal.toFixed(4)}, R² = ${(r2 * 100).toFixed(1)}%). OLS slope indicates ${slope > 0 ? '+' : ''}${slope.toFixed(2)} ${responseUnit} per ${predictorUnit}.`
    : `No statistically significant linear association detected at α = 0.05 (r = ${r.toFixed(3)}, 95% CI [${ci95R[0].toFixed(3)}, ${ci95R[1].toFixed(3)}], p = ${pVal.toFixed(4)}).`;

  return {
    id,
    relationship,
    shortName,
    predictorVar: predictorName,
    predictorUnit,
    responseVar: responseName,
    responseUnit,
    category,
    method: `Pearson r (Fisher z CI) & Bivariate OLS (N = ${n})`,
    sampleSize: n,
    degreesOfFreedom: df,
    estimate: {
      pearsonR: Number(r.toFixed(4)),
      spearmanRho: Number(rho.toFixed(4)),
      olsSlope: Number(slope.toFixed(4)),
      olsIntercept: Number(intercept.toFixed(4)),
      olsSeSlope: Number(seSlope.toFixed(4)),
      rSquared: Number(r2.toFixed(4))
    },
    confidenceInterval95: [Number(ci95R[0].toFixed(4)), Number(ci95R[1].toFixed(4))],
    ci95Slope,
    ciSpan: Number(ciSpan.toFixed(4)),
    relativeUncertainty: Number(relUncertainty.toFixed(4)),
    pValue: Number(pVal.toFixed(5)),
    tStatistic: Number(tStat.toFixed(3)),
    alpha,
    isStatisticallySignificant: isSig,
    significanceLabel: isSig ? 'Statistically significant' : 'Not statistically significant',
    effectSize: {
      rSquared: Number(r2.toFixed(4)),
      rSquaredPct: Number((r2 * 100).toFixed(1)),
      magnitude,
      label: `${magnitude} (R² = ${(r2 * 100).toFixed(1)}%)`
    },
    interpretation: {
      direction: dirDetail,
      strength: strengthDetail,
      uncertainty: uncertaintyDetail,
      statisticalSignificance: sigDetail,
      practicalMeaning,
      limitations: baseLimitation,
      summaryText
    },
    scatterData: paired
  };
}

/**
 * Calculates complete suite of actual statistical evidence from live merged climate-crop records.
 * Populates ONLY from actual mathematical calculations. Zero invented numbers.
 */
export function calculateAllStatisticalEvidence(
  records: MergedClimateRecord[],
  alpha: number = 0.05,
  selectedCrop: 'cotton' | 'paddy' | 'maize' = 'cotton'
): {
  evidenceList: EvidenceRelationshipItem[];
  researchSummary: ResearchSummaryResults;
} {
  const years = records.map(r => r.year);
  const phases = records.map(r => r.ensoPhase);

  // Variable Series Arrays
  const oniJjas = records.map(r => r.oniJjas);
  const rainfallJjas = records.map(r => r.rainfallJjasMm);
  const rainfallAnomaly = records.map(r => r.rainfallAnomalyPercent);
  const meanMaxTemp = records.map(r => r.meanMaxTempC);
  const cottonYield = records.map(r => r.cottonYieldKgHa);
  const paddyYield = records.map(r => r.paddyYieldKgHa);
  const maizeYield = records.map(r => r.maizeYieldKgHa);

  const items: EvidenceRelationshipItem[] = [];

  // 1. ONI → Rainfall (JJAS mm)
  const rel1 = computeSingleEvidenceItem(
    'oni_rainfall_mm',
    'ONI JJAS → Monsoon Rainfall (JJAS mm)',
    'ONI → Rainfall (mm)',
    'Oceanic Niño Index (ONI JJAS)',
    '°C',
    'Telangana Monsoon Rainfall',
    'mm',
    'CLIMATE_TELECONNECTION',
    oniJjas,
    rainfallJjas,
    years,
    phases,
    'a 1.0°C warming anomaly in equatorial Pacific SST suppresses Telangana seasonal monsoon rainfall',
    'Teleconnection modulation by concurrent Indian Ocean Dipole (+IOD) events can decouple this relationship in specific years (e.g. 1997, 2019).',
    alpha
  );
  if (rel1) items.push(rel1);

  // 2. ONI → Rainfall Departure (% vs LPA)
  const rel2 = computeSingleEvidenceItem(
    'oni_rainfall_pct',
    'ONI JJAS → Monsoon Rainfall Departure (% vs LPA)',
    'ONI → Rainfall Departure (%)',
    'Oceanic Niño Index (ONI JJAS)',
    '°C',
    'Rainfall Departure from Normal',
    '%',
    'CLIMATE_TELECONNECTION',
    oniJjas,
    rainfallAnomaly,
    years,
    phases,
    'percentage precipitation deficit relative to the 750.5 mm Long Period Average (LPA) baseline',
    'Regional convective variability and episodic Bay of Bengal depressions introduce non-linear intra-seasonal noise.',
    alpha
  );
  if (rel2) items.push(rel2);

  // 3. ONI → Temperature (Mean Max T_max °C)
  const rel3 = computeSingleEvidenceItem(
    'oni_temperature',
    'ONI JJAS → Monsoon Mean Max Temperature (T_max °C)',
    'ONI → Temperature (T_max)',
    'Oceanic Niño Index (ONI JJAS)',
    '°C',
    'Daytime Mean Max Temperature',
    '°C',
    'CLIMATE_THERMAL',
    oniJjas,
    meanMaxTemp,
    years,
    phases,
    'warm Pacific SST anomalies associate with regional atmospheric subsidence, suppressed cloud cover, and heightened sensible surface heating',
    'Long-term greenhouse warming trend contributes a secular background slope in addition to interannual ENSO thermal pulses.',
    alpha
  );
  if (rel3) items.push(rel3);

  // Normalize selected crop identifier
  let normalizedCrop: 'cotton' | 'paddy' | 'maize' = 'cotton';
  if (selectedCrop) {
    const s = String(selectedCrop).toLowerCase();
    if (s.includes('paddy') || s.includes('rice')) normalizedCrop = 'paddy';
    else if (s.includes('maize') || s.includes('corn')) normalizedCrop = 'maize';
    else normalizedCrop = 'cotton';
  }

  // 4. ONI → Crop Yield (Selected Crop: Cotton / Paddy / Maize)
  const cropMap = {
    cotton: { name: 'Kharif Cotton Lint Yield', unit: 'kg/ha', series: cottonYield, note: 'Technology shift (Bt cotton adoption post-2002) and expanding micro-irrigation buffer yield from pure meteorological shocks.' },
    paddy: { name: 'Kharif Paddy Rice Yield', unit: 'kg/ha', series: paddyYield, note: 'Assured command canal irrigation (Kaleshwaram, Nagarjuna Sagar) significantly mitigates raw rainfall deficit impacts on paddy.' },
    maize: { name: 'Kharif Maize Grain Yield', unit: 'kg/ha', series: maizeYield, note: 'Rainfed upland red chalka soils make maize sensitive to mid-season dry spells during vegetative silking stages.' }
  };
  const activeCrop = cropMap[normalizedCrop] || cropMap.cotton;

  const rel4 = computeSingleEvidenceItem(
    `oni_${normalizedCrop}_yield`,
    `ONI JJAS → ${activeCrop.name} (${activeCrop.unit})`,
    `ONI → ${normalizedCrop.toUpperCase()} Yield`,
    'Oceanic Niño Index (ONI JJAS)',
    '°C',
    activeCrop.name,
    activeCrop.unit,
    'AGRONOMIC_VULNERABILITY',
    oniJjas,
    activeCrop.series,
    years,
    phases,
    `direct agronomic exposure of ${normalizedCrop} productivity to Pacific SST warming phases`,
    activeCrop.note,
    alpha
  );
  if (rel4) items.push(rel4);

  // 5. Rainfall → Crop Yield (Selected Crop)
  const rel5 = computeSingleEvidenceItem(
    `rainfall_${normalizedCrop}_yield`,
    `Monsoon Rainfall (JJAS mm) → ${activeCrop.name} (${activeCrop.unit})`,
    `Rainfall → ${normalizedCrop.toUpperCase()} Yield`,
    'Monsoon Rainfall Total (JJAS)',
    'mm',
    activeCrop.name,
    activeCrop.unit,
    'AGRONOMIC_VULNERABILITY',
    rainfallJjas,
    activeCrop.series,
    years,
    phases,
    `crop yield elasticity per 100 mm of Southwest Monsoon precipitation`,
    'Intra-seasonal dry spells and terminal rainfall distribution across June–September are critical beyond gross seasonal totals.',
    alpha
  );
  if (rel5) items.push(rel5);

  // 6. Temperature → Crop Yield (Selected Crop)
  const rel6 = computeSingleEvidenceItem(
    `temperature_${normalizedCrop}_yield`,
    `Daytime Temperature (T_max °C) → ${activeCrop.name} (${activeCrop.unit})`,
    `Temperature → ${normalizedCrop.toUpperCase()} Yield`,
    'Daytime Mean Max Temperature (T_max)',
    '°C',
    activeCrop.name,
    activeCrop.unit,
    'AGRONOMIC_VULNERABILITY',
    meanMaxTemp,
    activeCrop.series,
    years,
    phases,
    `thermal stress on crop anthesis, boll retention, and soil moisture vapor pressure deficit (VPD)`,
    'Extreme daytime heat waves (>40°C in early June) vs moderate monsoon temperatures exhibit non-linear crop response thresholds.',
    alpha
  );
  if (rel6) items.push(rel6);

  // 7. ONI → Cotton Yield (Fixed reference for multi-crop benchmark)
  if (normalizedCrop !== 'cotton') {
    const relCotton = computeSingleEvidenceItem(
      'oni_cotton_benchmark',
      'ONI JJAS → Kharif Cotton Lint Yield (kg/ha)',
      'ONI → Cotton Yield',
      'Oceanic Niño Index (ONI JJAS)',
      '°C',
      'Kharif Cotton Lint Yield',
      'kg/ha',
      'AGRONOMIC_VULNERABILITY',
      oniJjas,
      cottonYield,
      years,
      phases,
      'rainfed cash crop vulnerability to Pacific SST shifts',
      'Bt-cotton transition post-2002 represents an essential non-climatic technology confounder.',
      alpha
    );
    if (relCotton) items.push(relCotton);
  }

  // 8. ONI → Paddy Rice Yield (Fixed reference)
  if (normalizedCrop !== 'paddy') {
    const relPaddy = computeSingleEvidenceItem(
      'oni_paddy_benchmark',
      'ONI JJAS → Kharif Paddy Rice Yield (kg/ha)',
      'ONI → Paddy Yield',
      'Oceanic Niño Index (ONI JJAS)',
      '°C',
      'Kharif Paddy Rice Yield',
      'kg/ha',
      'AGRONOMIC_VULNERABILITY',
      oniJjas,
      paddyYield,
      years,
      phases,
      'irrigated foodgrain staple resilience against Pacific teleconnections',
      'Groundwater tubewell energization and lift irrigation projects decouple paddy yields from raw rainfall anomalies.',
      alpha
    );
    if (relPaddy) items.push(relPaddy);
  }

  // Dynamic Synthesis of Research Summary: Strongest, Weakest, Most Significant, Most Uncertain
  // Ranked dynamically strictly from actual computed metrics
  const sortedByAbsR = [...items].sort((a, b) => Math.abs(b.estimate.pearsonR) - Math.abs(a.estimate.pearsonR));
  const sortedByPVal = [...items].sort((a, b) => a.pValue - b.pValue || Math.abs(b.tStatistic) - Math.abs(a.tStatistic));
  const sortedByUncertainty = [...items].sort((a, b) => b.ciSpan - a.ciSpan || b.relativeUncertainty - a.relativeUncertainty);

  // Fallback template if dataset has < 4 observations in current filter window
  const fallbackItem: EvidenceRelationshipItem = {
    id: 'placeholder_fallback',
    relationship: 'Insufficient observations in selected filter window',
    shortName: 'Awaiting Records',
    predictorVar: 'Predictor',
    predictorUnit: '',
    responseVar: 'Response',
    responseUnit: '',
    category: 'CLIMATE_TELECONNECTION',
    method: 'N/A',
    sampleSize: records.length,
    degreesOfFreedom: Math.max(0, records.length - 2),
    estimate: {
      pearsonR: 0,
      spearmanRho: 0,
      olsSlope: 0,
      olsIntercept: 0,
      olsSeSlope: 0,
      rSquared: 0
    },
    confidenceInterval95: [0, 0],
    ci95Slope: [0, 0],
    ciSpan: 0,
    relativeUncertainty: 0,
    pValue: 1.0,
    tStatistic: 0,
    alpha,
    isStatisticallySignificant: false,
    significanceLabel: 'Not statistically significant',
    effectSize: {
      rSquared: 0,
      rSquaredPct: 0,
      magnitude: 'Negligible',
      label: 'Negligible (R² = 0.0%)'
    },
    interpretation: {
      direction: 'Insufficient data points to compute direction.',
      strength: 'Insufficient sample size in the active filter range.',
      uncertainty: 'Broad uncertainty interval due to low sample size.',
      statisticalSignificance: 'No significance test possible.',
      practicalMeaning: 'Expand the year range in the filter panel to calculate statistical relationships.',
      limitations: 'Sample size constraints prevent statistical estimation.',
      summaryText: 'Awaiting sufficient longitudinal data points.'
    },
    scatterData: []
  };

  const strongestRelationship = sortedByAbsR[0] || fallbackItem;
  const weakestRelationship = sortedByAbsR[sortedByAbsR.length - 1] || fallbackItem;
  const mostSignificantResult = sortedByPVal[0] || fallbackItem;
  const mostUncertainResult = sortedByUncertainty[0] || fallbackItem;

  const significantCount = items.filter(it => it.isStatisticallySignificant).length;
  const meanSharedVar = items.length > 0 ? calculateMean(items.map(it => it.estimate.rSquared * 100)) || 0 : 0;

  const validYears = years.filter((y): y is number => typeof y === 'number' && !isNaN(y));
  const minYear = validYears.length > 0 ? Math.min(...validYears) : 1980;
  const maxYear = validYears.length > 0 ? Math.max(...validYears) : 2026;

  const importantLimitations: string[] = [
    `Confounding Indian Ocean Dipole (+IOD / -IOD) and synoptic Bay of Bengal monsoon low-pressure tracks modulate teleconnection expression independently of Pacific ONI.`,
    `Agronomic technology shifts (widespread adoption of genetically modified Bt cotton post-2002, expanding energized tubewells, and major lift irrigation schemes) create structural trend breaks in crop yield time series.`,
    `Linear parametric assumptions (Pearson r / OLS) assume constant elasticity, whereas crop physiological stress often exhibits non-linear thermal and moisture threshold cutoffs.`,
    `Longitudinal sample size constraint (N = ${items[0]?.sampleSize || records.length} annual observations) yields moderately wide 95% confidence intervals (average CI span ≈ ${(items.length > 0 ? calculateMean(items.map(i => i.ciSpan)) || 0.5 : 0.5).toFixed(2)}).`
  ];

  const researchSummary: ResearchSummaryResults = {
    strongestRelationship,
    weakestRelationship,
    mostSignificantResult,
    mostUncertainResult,
    totalEvaluated: items.length,
    significantCount,
    meanSharedVariancePct: Number(meanSharedVar.toFixed(1)),
    timeRange: [minYear, maxYear],
    sampleSize: items[0]?.sampleSize || records.length,
    importantLimitations
  };

  return {
    evidenceList: items,
    researchSummary
  };
}
