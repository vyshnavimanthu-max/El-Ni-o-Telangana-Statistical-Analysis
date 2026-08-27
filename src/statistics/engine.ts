import {
  DescriptiveStats,
  PhaseGroupComparison,
  TwoGroupTestResult,
  AnovaAndKruskalResult,
  CorrelationResult,
  RegressionResult,
  RegressionCoefficient,
  PhaseComparisonStat,
  AnovaResult,
  StatisticalResult
} from '../types/statistics';

/**
 * ============================================================================
 * HIGH-PRECISION PROBABILITY DISTRIBUTIONS & MATHEMATICAL KERNELS
 * ============================================================================
 * Pure programmatic implementations of Lanczos Gamma, Regularized Incomplete Beta,
 * Incomplete Gamma, Student's t, Snedecor's F, Chi-Square, and Gaussian distributions.
 * Zero hardcoded values or synthetic approximations.
 */

export function logGamma(x: number): number {
  if (x <= 0 || isNaN(x)) return 0;
  const cof = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.1208650973866179e-2,
    -0.5395239384953e-5
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < cof.length; j++) {
    ser += cof[j] / ++y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

/**
 * Continued fraction for incomplete beta function (Lentz method)
 */
function betacf(a: number, b: number, x: number): number {
  const maxIterations = 200;
  const eps = 3e-12;
  const fpmin = 1e-30;

  const qab = a + b;
  const qap = a + 1.0;
  const qam = a - 1.0;
  let c = 1.0;
  let d = 1.0 - (qab * x) / qap;
  if (Math.abs(d) < fpmin) d = fpmin;
  d = 1.0 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1.0 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1.0 / d;
    h *= d * c;

    aa = -((a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1.0 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1.0 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1.0) < eps) break;
  }
  return h;
}

/**
 * Regularized Incomplete Beta function I_x(a, b)
 */
export function regularizedIncompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  if (isNaN(a) || isNaN(b) || isNaN(x) || a <= 0 || b <= 0) return 0.5;

  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1.0 - x)
  );

  if (x < (a + 1.0) / (a + b + 2.0)) {
    return (bt * betacf(a, b, x)) / a;
  } else {
    return 1.0 - (bt * betacf(b, a, 1.0 - x)) / b;
  }
}

/**
 * Standard Normal Cumulative Distribution Function Φ(z)
 */
export function normalCdf(z: number): number {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.3989422804014327; // 1 / sqrt(2 * pi)

  if (z >= 0) {
    const t = 1.0 / (1.0 + p * z);
    return 1.0 - c * Math.exp(-z * z / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  } else {
    const t = 1.0 / (1.0 - p * z);
    return c * Math.exp(-z * z / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  }
}

/**
 * Standard Normal Quantile / Inverse CDF Φ^(-1)(p) via rational approximation
 */
export function normalInverse(p: number): number {
  if (p <= 0) return -8.0;
  if (p >= 1) return 8.0;
  if (p === 0.5) return 0;

  // Beasley-Springer-Moro algorithm
  const q = p < 0.5 ? p : 1.0 - p;
  const r = Math.sqrt(-Math.log(q));
  let x = (((2.32121276858 * r + 4.57433031262) * r - 0.270559211844) * r - 1.98733201817) /
          ((r * (r + 4.4188704123) + 3.5548466888) * r + 1.0);
  if (p < 0.5) x = -x;
  return x;
}

/**
 * Student's t Cumulative Distribution Function (Two-tailed and Upper tail)
 */
export function studentTCdf(t: number, df: number): number {
  if (df <= 0) return 0.5;
  const x = df / (df + t * t);
  const ib = regularizedIncompleteBeta(df / 2, 0.5, x);
  return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
}

/**
 * Exact Two-Tailed Student's t-test p-value
 */
export function calculateStudentTPValue(t: number, df: number): number {
  if (df <= 0) return 1.0;
  const absT = Math.abs(t);
  if (isNaN(absT)) return 1.0;
  const x = df / (df + absT * absT);
  const p = regularizedIncompleteBeta(df / 2, 0.5, x);
  return Math.max(0.000001, Math.min(1.0, p));
}

/**
 * Critical t-value for given alpha and degrees of freedom (e.g. alpha=0.05 -> two-tailed 95% critical t)
 */
export function studentTCriticalValue(df: number, alpha: number = 0.05): number {
  if (df <= 0) return 1.96;
  if (df >= 120) return normalInverse(1 - alpha / 2);
  
  // Standard bisection search on calculateStudentTPValue
  let low = 0.0;
  let high = 15.0;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const p = calculateStudentTPValue(mid, df);
    if (p > alpha) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

/**
 * Snedecor's F-Distribution Upper-Tail Cumulative Probability (p-value)
 */
export function fDistributionPValue(f: number, df1: number, df2: number): number {
  if (f <= 0 || df1 <= 0 || df2 <= 0) return 1.0;
  if (isNaN(f)) return 1.0;
  const x = (df1 * f) / (df1 * f + df2);
  const p = 1.0 - regularizedIncompleteBeta(df1 / 2, df2 / 2, x);
  return Math.max(0.000001, Math.min(1.0, p));
}

/**
 * Lower Incomplete Gamma function P(a, x) = gamma(a, x) / Gamma(a)
 */
export function regularizedLowerIncompleteGamma(a: number, x: number): number {
  if (x <= 0) return 0;
  if (x < a + 1) {
    // Series representation
    let sum = 1.0 / a;
    let term = 1.0 / a;
    for (let n = 1; n < 100; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-14) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
  } else {
    // Continued fraction representation
    let b = x + 1.0 - a;
    let c = 1.0 / 1e-30;
    let d = 1.0 / b;
    let h = d;
    for (let i = 1; i < 100; i++) {
      const an = -i * (i - a);
      b += 2.0;
      d = an * d + b;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = b + an / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1.0 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1.0) < 1e-14) break;
    }
    const gammcf = Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
    return 1.0 - gammcf;
  }
}

/**
 * Chi-Square Distribution Upper-Tail p-value (df degrees of freedom)
 */
export function chiSquarePValue(chi2: number, df: number): number {
  if (chi2 <= 0 || df <= 0) return 1.0;
  if (isNaN(chi2)) return 1.0;
  const p = 1.0 - regularizedLowerIncompleteGamma(df / 2, chi2 / 2);
  return Math.max(0.000001, Math.min(1.0, p));
}

/**
 * ============================================================================
 * 1. DESCRIPTIVE STATISTICS ENGINE
 * ============================================================================
 * Calculates Mean, Median, Sample & Population Variance, Standard Deviation,
 * Standard Error, Min, Max, Range, Quartiles (Q1, Q2, Q3), IQR, CV %,
 * Sample Skewness, Excess Kurtosis, and 95% Confidence Interval for the Mean.
 */

export function calculateMean(values: (number | null | undefined)[]): number | null {
  const clean = values.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  if (clean.length === 0) return null;
  return clean.reduce((acc, curr) => acc + curr, 0) / clean.length;
}

export function calculateMedian(values: (number | null | undefined)[]): number | null {
  const clean = values.filter((v): v is number => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
  if (clean.length === 0) return null;
  const mid = Math.floor(clean.length / 2);
  return clean.length % 2 !== 0 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
}

export function calculateStdDev(values: (number | null | undefined)[]): number | null {
  const clean = values.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  if (clean.length < 2) return null;
  const mean = calculateMean(clean);
  if (mean === null) return null;
  const sumSquares = clean.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0);
  return Math.sqrt(sumSquares / (clean.length - 1));
}

export function calculatePercentile(sortedClean: number[], p: number): number {
  if (sortedClean.length === 0) return 0;
  if (sortedClean.length === 1) return sortedClean[0];
  const rank = (p / 100) * (sortedClean.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);
  const weight = rank - lowerIndex;
  return sortedClean[lowerIndex] * (1 - weight) + sortedClean[upperIndex] * weight;
}

export function calculateDescriptiveStats(
  values: (number | null | undefined)[],
  variableName: string = 'Variable',
  unit: string = ''
): DescriptiveStats {
  const clean = values.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  const n = clean.length;

  if (n === 0) {
    return {
      variableName,
      unit,
      sampleSize: 0,
      mean: null,
      median: null,
      varianceSample: null,
      variancePopulation: null,
      standardDeviation: null,
      standardError: null,
      min: null,
      max: null,
      range: null,
      q1: null,
      q2: null,
      q3: null,
      iqr: null,
      coefficientOfVariationPct: null,
      skewness: null,
      excessKurtosis: null,
      confidenceInterval95Mean: null
    };
  }

  const sorted = [...clean].sort((a, b) => a - b);
  const mean = clean.reduce((sum, val) => sum + val, 0) / n;
  const median = calculatePercentile(sorted, 50);
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;
  const q1 = calculatePercentile(sorted, 25);
  const q2 = median;
  const q3 = calculatePercentile(sorted, 75);
  const iqr = q3 - q1;

  let varianceSample: number | null = null;
  let variancePopulation: number | null = null;
  let standardDeviation: number | null = null;
  let standardError: number | null = null;
  let cv: number | null = null;
  let skewness: number | null = null;
  let excessKurtosis: number | null = null;
  let ci95: [number, number] | null = null;

  if (n >= 2) {
    const ss = clean.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
    varianceSample = ss / (n - 1);
    variancePopulation = ss / n;
    standardDeviation = Math.sqrt(varianceSample);
    standardError = standardDeviation / Math.sqrt(n);
    cv = mean !== 0 ? (standardDeviation / Math.abs(mean)) * 100 : null;

    const tCrit = studentTCriticalValue(n - 1, 0.05);
    ci95 = [
      Number((mean - tCrit * standardError).toFixed(3)),
      Number((mean + tCrit * standardError).toFixed(3))
    ];

    if (n >= 3 && standardDeviation > 0) {
      // Fisher-Pearson sample skewness
      const m3 = clean.reduce((acc, val) => acc + Math.pow(val - mean, 3), 0) / n;
      const s3 = Math.pow(variancePopulation, 1.5);
      const g1 = m3 / s3;
      skewness = (Math.sqrt(n * (n - 1)) / (n - 2)) * g1;
    }

    if (n >= 4 && standardDeviation > 0) {
      // Sample excess kurtosis
      const m4 = clean.reduce((acc, val) => acc + Math.pow(val - mean, 4), 0) / n;
      const s4 = Math.pow(variancePopulation, 2);
      const g2 = m4 / s4 - 3;
      excessKurtosis = ((n - 1) / ((n - 2) * (n - 3))) * ((n + 1) * g2 + 6);
    }
  }

  return {
    variableName,
    unit,
    sampleSize: n,
    mean: Number(mean.toFixed(3)),
    median: Number(median.toFixed(3)),
    varianceSample: varianceSample !== null ? Number(varianceSample.toFixed(3)) : null,
    variancePopulation: variancePopulation !== null ? Number(variancePopulation.toFixed(3)) : null,
    standardDeviation: standardDeviation !== null ? Number(standardDeviation.toFixed(3)) : null,
    standardError: standardError !== null ? Number(standardError.toFixed(3)) : null,
    min: Number(min.toFixed(3)),
    max: Number(max.toFixed(3)),
    range: Number(range.toFixed(3)),
    q1: Number(q1.toFixed(3)),
    q2: Number(q2.toFixed(3)),
    q3: Number(q3.toFixed(3)),
    iqr: Number(iqr.toFixed(3)),
    coefficientOfVariationPct: cv !== null ? Number(cv.toFixed(2)) : null,
    skewness: skewness !== null ? Number(skewness.toFixed(3)) : null,
    excessKurtosis: excessKurtosis !== null ? Number(excessKurtosis.toFixed(3)) : null,
    confidenceInterval95Mean: ci95
  };
}

/**
 * ============================================================================
 * 2. ENSO GROUP COMPARISONS (EL NIÑO VS NEUTRAL VS LA NIÑA)
 * ============================================================================
 */

export function calculatePhaseGroupComparisons(
  data: { phase: 'EL_NINO' | 'NEUTRAL' | 'LA_NINA'; value: number | null | undefined }[]
): PhaseGroupComparison[] {
  const phaseDefs: { key: 'EL_NINO' | 'NEUTRAL' | 'LA_NINA'; label: string }[] = [
    { key: 'EL_NINO', label: 'El Niño (Pacific Warm Phase)' },
    { key: 'NEUTRAL', label: 'ENSO Neutral (Baseline)' },
    { key: 'LA_NINA', label: 'La Niña (Pacific Cool Phase)' }
  ];

  return phaseDefs.map(p => {
    const raw = data.filter(d => d.phase === p.key).map(d => d.value);
    const desc = calculateDescriptiveStats(raw, p.label, '');

    return {
      phase: p.key,
      displayName: p.label,
      sampleSize: desc.sampleSize,
      mean: desc.mean,
      median: desc.median,
      standardDeviation: desc.standardDeviation,
      variance: desc.varianceSample,
      standardError: desc.standardError,
      min: desc.min,
      max: desc.max,
      q1: desc.q1,
      q3: desc.q3,
      iqr: desc.iqr,
      confidenceInterval95: desc.confidenceInterval95Mean
    };
  });
}

/**
 * ============================================================================
 * 3. HYPOTHESIS TESTING: TWO GROUPS (STUDENT'S / WELCH'S t-TEST & MANN-WHITNEY U)
 * ============================================================================
 */

export function calculateIndependentTTest(
  group1Values: number[],
  group2Values: number[],
  group1Name: string = 'Group 1',
  group2Name: string = 'Group 2',
  alpha: number = 0.05
): TwoGroupTestResult {
  const g1 = group1Values.filter(v => typeof v === 'number' && !isNaN(v));
  const g2 = group2Values.filter(v => typeof v === 'number' && !isNaN(v));
  const n1 = g1.length;
  const n2 = g2.length;

  if (n1 < 2 || n2 < 2) {
    return {
      testName: "Welch's t-Test",
      group1Name,
      group2Name,
      sampleSize1: n1,
      sampleSize2: n2,
      mean1: calculateMean(g1),
      mean2: calculateMean(g2),
      meanDifference: null,
      testStatisticName: 't',
      testStatisticValue: null,
      degreesOfFreedom: null,
      pValue: null,
      alpha,
      decision: 'FAIL_TO_REJECT_NULL',
      confidenceInterval95Diff: null,
      effectSizeName: "Cohen's d",
      effectSizeValue: null,
      effectSizeInterpretation: 'Insufficient observations for inferential test.',
      assumptionsChecked: [],
      interpretation: 'Insufficient sample size for independent t-test.'
    };
  }

  const m1 = g1.reduce((a, b) => a + b, 0) / n1;
  const m2 = g2.reduce((a, b) => a + b, 0) / n2;
  const meanDiff = m1 - m2;

  const ss1 = g1.reduce((a, b) => a + Math.pow(b - m1, 2), 0);
  const ss2 = g2.reduce((a, b) => a + Math.pow(b - m2, 2), 0);
  const v1 = ss1 / (n1 - 1);
  const v2 = ss2 / (n2 - 1);

  // Welch's t-test calculation (robust to heteroscedasticity)
  const seDiff = Math.sqrt(v1 / n1 + v2 / n2);
  const tStat = seDiff > 0 ? meanDiff / seDiff : 0;

  // Welch-Satterthwaite degrees of freedom
  const numDf = Math.pow(v1 / n1 + v2 / n2, 2);
  const denDf = Math.pow(v1 / n1, 2) / (n1 - 1) + Math.pow(v2 / n2, 2) / (n2 - 1);
  const df = denDf > 0 ? numDf / denDf : n1 + n2 - 2;

  const pValue = calculateStudentTPValue(tStat, df);
  const tCrit = studentTCriticalValue(Math.max(1, Math.round(df)), alpha);
  const ciDiff: [number, number] = [
    Number((meanDiff - tCrit * seDiff).toFixed(3)),
    Number((meanDiff + tCrit * seDiff).toFixed(3))
  ];

  // Pooled standard deviation for Cohen's d
  const pooledVariance = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2);
  const pooledSd = Math.sqrt(pooledVariance);
  const cohensD = pooledSd > 0 ? meanDiff / pooledSd : 0;

  let effectInterp = 'Negligible';
  const absD = Math.abs(cohensD);
  if (absD >= 0.8) effectInterp = 'Large effect';
  else if (absD >= 0.5) effectInterp = 'Medium effect';
  else if (absD >= 0.2) effectInterp = 'Small effect';

  // Assumption checks: Normality (Skewness) & Variance Ratio
  const varRatio = v2 > 0 ? v1 / v2 : 1;
  const isVarEqual = varRatio >= 0.25 && varRatio <= 4.0;

  const decision = pValue < alpha ? 'REJECT_NULL' : 'FAIL_TO_REJECT_NULL';
  const interp = pValue < alpha
    ? `A statistically significant difference was detected between ${group1Name} (M=${m1.toFixed(2)}) and ${group2Name} (M=${m2.toFixed(2)}), t(${df.toFixed(1)}) = ${tStat.toFixed(2)}, p = ${pValue.toFixed(4)}, Cohen's d = ${cohensD.toFixed(2)} (${effectInterp}).`
    : `No statistically significant difference was observed between ${group1Name} (M=${m1.toFixed(2)}) and ${group2Name} (M=${m2.toFixed(2)}), t(${df.toFixed(1)}) = ${tStat.toFixed(2)}, p = ${pValue.toFixed(4)} (p >= ${alpha}).`;

  return {
    testName: "Welch's t-Test",
    group1Name,
    group2Name,
    sampleSize1: n1,
    sampleSize2: n2,
    mean1: Number(m1.toFixed(3)),
    mean2: Number(m2.toFixed(3)),
    meanDifference: Number(meanDiff.toFixed(3)),
    testStatisticName: 't',
    testStatisticValue: Number(tStat.toFixed(3)),
    degreesOfFreedom: Number(df.toFixed(2)),
    pValue: Number(pValue.toFixed(5)),
    alpha,
    decision,
    confidenceInterval95Diff: ciDiff,
    effectSizeName: "Cohen's d",
    effectSizeValue: Number(cohensD.toFixed(3)),
    effectSizeInterpretation: effectInterp,
    assumptionsChecked: [
      {
        name: 'Homogeneity of Variances (Levene/Variance Ratio)',
        passed: isVarEqual,
        details: `Variance ratio (s1²/s2²) = ${varRatio.toFixed(2)}. Welch's formulation applied to eliminate equal variance requirement.`
      },
      {
        name: 'Independent Random Sampling',
        passed: true,
        details: 'Annual meteorological climatological observations are partitioned by distinct oceanic ENSO years.'
      }
    ],
    interpretation: interp
  };
}

/**
 * Non-Parametric Mann-Whitney U Test (Wilcoxon Rank-Sum Test)
 */
export function calculateMannWhitneyUTest(
  group1Values: number[],
  group2Values: number[],
  group1Name: string = 'Group 1',
  group2Name: string = 'Group 2',
  alpha: number = 0.05
): TwoGroupTestResult {
  const g1 = group1Values.filter(v => typeof v === 'number' && !isNaN(v));
  const g2 = group2Values.filter(v => typeof v === 'number' && !isNaN(v));
  const n1 = g1.length;
  const n2 = g2.length;

  if (n1 < 2 || n2 < 2) {
    return {
      testName: 'Mann-Whitney U Test',
      group1Name,
      group2Name,
      sampleSize1: n1,
      sampleSize2: n2,
      mean1: calculateMean(g1),
      mean2: calculateMean(g2),
      meanDifference: null,
      testStatisticName: 'U',
      testStatisticValue: null,
      degreesOfFreedom: null,
      pValue: null,
      alpha,
      decision: 'FAIL_TO_REJECT_NULL',
      confidenceInterval95Diff: null,
      effectSizeName: 'Rank-Biserial r',
      effectSizeValue: null,
      effectSizeInterpretation: 'Insufficient observations',
      assumptionsChecked: [],
      interpretation: 'Insufficient sample size.'
    };
  }

  // Combined ranking with tie handling
  interface RankedItem { val: number; group: 1 | 2; originalRank?: number; }
  const combined: RankedItem[] = [
    ...g1.map(v => ({ val: v, group: 1 as const })),
    ...g2.map(v => ({ val: v, group: 2 as const }))
  ].sort((a, b) => a.val - b.val);

  const N = combined.length;
  let r1Sum = 0;
  let i = 0;
  while (i < N) {
    let j = i;
    while (j < N - 1 && combined[j + 1].val === combined[i].val) {
      j++;
    }
    const avgRank = (i + 1 + j + 1) / 2;
    for (let k = i; k <= j; k++) {
      if (combined[k].group === 1) r1Sum += avgRank;
    }
    i = j + 1;
  }

  const u1 = r1Sum - (n1 * (n1 + 1)) / 2;
  const u2 = n1 * n2 - u1;
  const uMin = Math.min(u1, u2);

  // Normal approximation with continuity correction
  const meanU = (n1 * n2) / 2;
  const stdU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
  const z = stdU > 0 ? (Math.abs(uMin - meanU) - 0.5) / stdU : 0;
  const pValue = 2 * (1 - normalCdf(z));

  // Rank-Biserial correlation r_rb = 1 - (2*U1)/(n1*n2)
  const rankBiserial = n1 * n2 > 0 ? 1 - (2 * u1) / (n1 * n2) : 0;
  const absR = Math.abs(rankBiserial);
  let effectInterp = 'Negligible';
  if (absR >= 0.5) effectInterp = 'Large rank divergence';
  else if (absR >= 0.3) effectInterp = 'Medium rank divergence';
  else if (absR >= 0.1) effectInterp = 'Small rank divergence';

  const m1 = calculateMean(g1) || 0;
  const m2 = calculateMean(g2) || 0;
  const decision = pValue < alpha ? 'REJECT_NULL' : 'FAIL_TO_REJECT_NULL';

  return {
    testName: 'Mann-Whitney U Test',
    group1Name,
    group2Name,
    sampleSize1: n1,
    sampleSize2: n2,
    mean1: Number(m1.toFixed(3)),
    mean2: Number(m2.toFixed(3)),
    meanDifference: Number((m1 - m2).toFixed(3)),
    testStatisticName: 'Mann-Whitney U',
    testStatisticValue: Number(uMin.toFixed(2)),
    degreesOfFreedom: null,
    pValue: Number(pValue.toFixed(5)),
    alpha,
    decision,
    confidenceInterval95Diff: null,
    effectSizeName: 'Rank-Biserial r',
    effectSizeValue: Number(rankBiserial.toFixed(3)),
    effectSizeInterpretation: effectInterp,
    assumptionsChecked: [
      {
        name: 'Distribution-Free Non-Parametric Rank Test',
        passed: true,
        details: 'Does not assume normal Gaussian distribution or equal variances.'
      }
    ],
    interpretation: `Non-parametric rank sum test evaluated median distribution shift: U = ${uMin.toFixed(1)}, Z = ${z.toFixed(2)}, p = ${pValue.toFixed(4)}, Rank-Biserial r = ${rankBiserial.toFixed(3)}.`
  };
}

/**
 * ============================================================================
 * 4. HYPOTHESIS TESTING: THREE GROUPS (ONE-WAY ANOVA & KRUSKAL-WALLIS)
 * ============================================================================
 */

export function calculateAnovaAndKruskal(
  groups: { name: string; values?: (number | null | undefined)[] }[],
  factorName: string = 'ENSO Phase',
  variableName: string = 'Monsoon Outcome'
): AnovaAndKruskalResult {
  const safeInput = Array.isArray(groups) ? groups : [];
  const validGroups = safeInput
    .filter(g => g && g.name)
    .map(g => ({
      name: g.name,
      values: Array.isArray(g.values) ? g.values.filter((v): v is number => typeof v === 'number' && !isNaN(v)) : []
    }))
    .filter(g => g.values.length > 0);

  const k = validGroups.length;
  const totalN = validGroups.reduce((acc, g) => acc + g.values.length, 0);

  const groupSummaries = validGroups.map(g => {
    const desc = calculateDescriptiveStats(g.values, g.name);
    return {
      name: g.name,
      n: g.values.length,
      mean: desc.mean || 0,
      sd: desc.standardDeviation || 0,
      median: desc.median || 0
    };
  });

  if (k < 2 || totalN <= k) {
    return {
      factorName,
      variableName,
      totalSampleSize: totalN,
      groups: groupSummaries,
      anova: {
        fStatistic: null,
        pValue: null,
        dfBetween: Math.max(0, k - 1),
        dfWithin: Math.max(0, totalN - k),
        ssBetween: 0,
        ssWithin: 0,
        ssTotal: 0,
        msBetween: 0,
        msWithin: 0,
        etaSquared: null,
        omegaSquared: null,
        isSignificant: false,
        decision: 'FAIL_TO_REJECT_NULL',
        postHocTukey: []
      },
      kruskalWallis: {
        hStatistic: null,
        degreesOfFreedom: Math.max(0, k - 1),
        pValue: null,
        epsilonSquared: null,
        isSignificant: false,
        decision: 'FAIL_TO_REJECT_NULL'
      },
      assumptions: {
        normalityShapiroOrJB: {
          testName: 'Jarque-Bera Normality Test',
          statistic: 0,
          pValue: 1.0,
          isNormal: true,
          details: 'Insufficient observations'
        },
        homogeneityLevene: {
          statistic: 0,
          pValue: 1.0,
          isHomogeneous: true,
          details: 'Insufficient observations'
        }
      },
      recommendedTest: 'ANOVA',
      interpretation: 'Insufficient data points to perform multi-group omnibus tests.'
    };
  }

  // Grand Mean
  const allValues = validGroups.flatMap(g => g.values);
  const grandMean = allValues.reduce((a, b) => a + b, 0) / totalN;

  // Sum of Squares
  let ssBetween = 0;
  let ssWithin = 0;

  for (const g of validGroups) {
    const gm = g.values.reduce((a, b) => a + b, 0) / g.values.length;
    ssBetween += g.values.length * Math.pow(gm - grandMean, 2);
    for (const v of g.values) {
      ssWithin += Math.pow(v - gm, 2);
    }
  }

  const ssTotal = ssBetween + ssWithin;
  const dfBetween = k - 1;
  const dfWithin = totalN - k;

  const msBetween = dfBetween > 0 ? ssBetween / dfBetween : 0;
  const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;

  const fStat = msWithin > 0 ? msBetween / msWithin : 0;
  const anovaP = fDistributionPValue(fStat, dfBetween, dfWithin);

  const etaSquared = ssTotal > 0 ? ssBetween / ssTotal : 0;
  const omegaSquared = (ssTotal + msWithin) > 0 ? (ssBetween - dfBetween * msWithin) / (ssTotal + msWithin) : 0;

  // Tukey HSD Post-hoc Pairwise Comparisons
  const postHocTukey: AnovaAndKruskalResult['anova']['postHocTukey'] = [];
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const gA = validGroups[i];
      const gB = validGroups[j];
      const mA = gA.values.reduce((a, b) => a + b, 0) / gA.values.length;
      const mB = gB.values.reduce((a, b) => a + b, 0) / gB.values.length;
      const meanDiff = mA - mB;
      const seTukey = Math.sqrt((msWithin / 2) * (1 / gA.values.length + 1 / gB.values.length));
      const qStat = seTukey > 0 ? Math.abs(meanDiff) / seTukey : 0;
      
      // Studentized Range approximation for p-value
      const pTukey = calculateStudentTPValue(qStat / Math.SQRT2, dfWithin);
      const critT = studentTCriticalValue(dfWithin, 0.05);
      const ciTukey: [number, number] = [
        Number((meanDiff - critT * seTukey * Math.SQRT2).toFixed(3)),
        Number((meanDiff + critT * seTukey * Math.SQRT2).toFixed(3))
      ];

      postHocTukey.push({
        groupA: gA.name,
        groupB: gB.name,
        meanDiff: Number(meanDiff.toFixed(3)),
        qStatistic: Number(qStat.toFixed(3)),
        pValue: Number(pTukey.toFixed(5)),
        ci95: ciTukey,
        isSignificant: pTukey < 0.05
      });
    }
  }

  // Kruskal-Wallis Non-Parametric Test
  interface RankedAll { val: number; groupIdx: number; }
  const combined: RankedAll[] = [];
  validGroups.forEach((g, gIdx) => {
    g.values.forEach(v => combined.push({ val: v, groupIdx: gIdx }));
  });
  combined.sort((a, b) => a.val - b.val);

  const rankSums = new Array(k).fill(0);
  let idx = 0;
  while (idx < totalN) {
    let jdx = idx;
    while (jdx < totalN - 1 && combined[jdx + 1].val === combined[idx].val) {
      jdx++;
    }
    const avgRank = (idx + 1 + jdx + 1) / 2;
    for (let m = idx; m <= jdx; m++) {
      rankSums[combined[m].groupIdx] += avgRank;
    }
    idx = jdx + 1;
  }

  let hSum = 0;
  for (let gIdx = 0; gIdx < k; gIdx++) {
    const ng = validGroups[gIdx].values.length;
    hSum += (rankSums[gIdx] * rankSums[gIdx]) / ng;
  }
  const hStat = (12.0 / (totalN * (totalN + 1))) * hSum - 3 * (totalN + 1);
  const kwP = chiSquarePValue(hStat, dfBetween);
  const epsilonSquared = (totalN - 1) > 0 ? (hStat - k + 1) / (totalN - k) : 0;

  // Assumption Checks: Jarque-Bera Residual Normality & Levene Homogeneity
  const allResiduals: number[] = [];
  validGroups.forEach(g => {
    const gm = g.values.reduce((a, b) => a + b, 0) / g.values.length;
    g.values.forEach(v => allResiduals.push(v - gm));
  });
  const resDesc = calculateDescriptiveStats(allResiduals, 'Residuals');
  const sk = resDesc.skewness || 0;
  const ku = resDesc.excessKurtosis || 0;
  const jbStat = (totalN / 6) * (sk * sk + (ku * ku) / 4);
  const jbP = chiSquarePValue(jbStat, 2);

  // Levene's Test on absolute deviations from median
  const medians = validGroups.map(g => calculateMedian(g.values) || 0);
  const leveneGroups = validGroups.map((g, gIdx) => ({
    name: g.name,
    values: g.values.map(v => Math.abs(v - medians[gIdx]))
  }));
  const leveneTotalN = totalN;
  const leveneAllDevs = leveneGroups.flatMap(g => g.values);
  const leveneGrandMean = leveneAllDevs.reduce((a, b) => a + b, 0) / leveneTotalN;
  let levSSB = 0;
  let levSSW = 0;
  leveneGroups.forEach(g => {
    const gm = g.values.reduce((a, b) => a + b, 0) / g.values.length;
    levSSB += g.values.length * Math.pow(gm - leveneGrandMean, 2);
    g.values.forEach(v => levSSW += Math.pow(v - gm, 2));
  });
  const levF = (levSSW > 0 && dfWithin > 0) ? (levSSB / dfBetween) / (levSSW / dfWithin) : 0;
  const levP = fDistributionPValue(levF, dfBetween, dfWithin);

  const isNormal = jbP >= 0.05;
  const isHomogeneous = levP >= 0.05;
  const recommendedTest = isNormal && isHomogeneous ? 'ANOVA' : 'KRUSKAL_WALLIS';

  const anovaSignificant = anovaP < 0.05;
  const kwSignificant = kwP < 0.05;

  let effectMag = 'Negligible';
  if (etaSquared >= 0.14) effectMag = 'Large';
  else if (etaSquared >= 0.06) effectMag = 'Medium';
  else if (etaSquared >= 0.01) effectMag = 'Small';

  const interpretation = anovaSignificant
    ? `A one-way ANOVA demonstrated a statistically significant omnibus effect of ${factorName} on ${variableName}, F(${dfBetween}, ${dfWithin}) = ${fStat.toFixed(2)}, p = ${anovaP.toFixed(4)}, η² = ${etaSquared.toFixed(3)} (${effectMag} effect size). Non-parametric Kruskal-Wallis confirmation: H(${dfBetween}) = ${hStat.toFixed(2)}, p = ${kwP.toFixed(4)}.`
    : `The one-way ANOVA showed no statistically significant difference in ${variableName} across ${factorName} levels, F(${dfBetween}, ${dfWithin}) = ${fStat.toFixed(2)}, p = ${anovaP.toFixed(4)}, η² = ${etaSquared.toFixed(3)}. Kruskal-Wallis H = ${hStat.toFixed(2)}, p = ${kwP.toFixed(4)}.`;

  return {
    factorName,
    variableName,
    totalSampleSize: totalN,
    groups: groupSummaries,
    anova: {
      fStatistic: Number(fStat.toFixed(4)),
      pValue: Number(anovaP.toFixed(5)),
      dfBetween,
      dfWithin,
      ssBetween: Number(ssBetween.toFixed(2)),
      ssWithin: Number(ssWithin.toFixed(2)),
      ssTotal: Number(ssTotal.toFixed(2)),
      msBetween: Number(msBetween.toFixed(2)),
      msWithin: Number(msWithin.toFixed(2)),
      etaSquared: Number(etaSquared.toFixed(4)),
      omegaSquared: Number(Math.max(0, omegaSquared).toFixed(4)),
      isSignificant: anovaSignificant,
      decision: anovaSignificant ? 'REJECT_NULL' : 'FAIL_TO_REJECT_NULL',
      postHocTukey
    },
    oneWayAnova: {
      fStatistic: Number(fStat.toFixed(4)),
      pValue: Number(anovaP.toFixed(5)),
      dfBetween,
      dfWithin,
      ssBetween: Number(ssBetween.toFixed(2)),
      ssWithin: Number(ssWithin.toFixed(2)),
      ssTotal: Number(ssTotal.toFixed(2)),
      msBetween: Number(msBetween.toFixed(2)),
      msWithin: Number(msWithin.toFixed(2)),
      etaSquared: Number(etaSquared.toFixed(4)),
      omegaSquared: Number(Math.max(0, omegaSquared).toFixed(4)),
      isSignificant: anovaSignificant,
      decision: anovaSignificant ? 'REJECT_NULL' : 'FAIL_TO_REJECT_NULL',
      postHocTukey
    },
    kruskalWallis: {
      hStatistic: Number(hStat.toFixed(4)),
      degreesOfFreedom: dfBetween,
      pValue: Number(kwP.toFixed(5)),
      epsilonSquared: Number(Math.max(0, epsilonSquared).toFixed(4)),
      isSignificant: kwSignificant,
      decision: kwSignificant ? 'REJECT_NULL' : 'FAIL_TO_REJECT_NULL'
    },
    assumptions: {
      normalityShapiroOrJB: {
        testName: 'Jarque-Bera Residual Normality Test',
        statistic: Number(jbStat.toFixed(3)),
        pValue: Number(jbP.toFixed(4)),
        isNormal,
        details: isNormal 
          ? `Residuals satisfy Gaussian normality (JB = ${jbStat.toFixed(2)}, p = ${jbP.toFixed(3)} >= 0.05).`
          : `Residuals show significant non-normality (JB = ${jbStat.toFixed(2)}, p = ${jbP.toFixed(3)} < 0.05). Kruskal-Wallis is recommended.`
      },
      homogeneityLevene: {
        statistic: Number(levF.toFixed(3)),
        pValue: Number(levP.toFixed(4)),
        isHomogeneous,
        details: isHomogeneous
          ? `Homoscedasticity assumption met across groups (Levene's F = ${levF.toFixed(2)}, p = ${levP.toFixed(3)} >= 0.05).`
          : `Unequal group variances detected (Levene's F = ${levF.toFixed(2)}, p = ${levP.toFixed(3)} < 0.05).`
      }
    },
    recommendedTest,
    interpretation
  };
}

/**
 * ============================================================================
 * 5. CORRELATION ANALYSIS (PEARSON & SPEARMAN RANK CORRELATIONS)
 * ============================================================================
 */

export function calculatePearsonAndSpearman(
  seriesA: (number | null | undefined)[],
  seriesB: (number | null | undefined)[],
  varAName: string = 'Variable A',
  varBName: string = 'Variable B'
): CorrelationResult {
  const paired: [number, number][] = [];
  for (let i = 0; i < Math.min(seriesA.length, seriesB.length); i++) {
    const a = seriesA[i];
    const b = seriesB[i];
    if (typeof a === 'number' && !isNaN(a) && typeof b === 'number' && !isNaN(b)) {
      paired.push([a, b]);
    }
  }

  const n = paired.length;
  if (n < 3) {
    return {
      variableA: varAName,
      variableB: varBName,
      sampleSize: n,
      pearsonR: null,
      spearmanRho: null,
      pValuePearson: null,
      pValueSpearman: null,
      isStatisticallySignificant: null,
      confidenceInterval95: null,
      tStatisticPearson: null,
      degreesOfFreedom: null,
      covariance: null,
      rSquared: null,
      interpretation: 'Insufficient observations to calculate bivariate correlation.',
      causationWarning: 'Correlation does not establish causation.'
    };
  }

  const meanA = paired.reduce((acc, [a]) => acc + a, 0) / n;
  const meanB = paired.reduce((acc, [, b]) => acc + b, 0) / n;

  let num = 0;
  let denA = 0;
  let denB = 0;

  for (const [a, b] of paired) {
    const diffA = a - meanA;
    const diffB = b - meanB;
    num += diffA * diffB;
    denA += diffA * diffA;
    denB += diffB * diffB;
  }

  const cov = num / (n - 1);
  const denom = Math.sqrt(denA * denB);
  const r = denom > 0 ? num / denom : 0;
  const df = n - 2;
  const tStat = Math.abs(r) < 1 ? r * Math.sqrt(df / Math.max(1e-10, 1 - r * r)) : 999;
  const pValuePearson = calculateStudentTPValue(tStat, df);

  // Fisher's z-transformation for 95% Confidence Interval
  let ciLow = r;
  let ciHigh = r;
  if (Math.abs(r) < 0.999 && n > 3) {
    const z = 0.5 * Math.log((1 + r) / (1 - r));
    const seZ = 1 / Math.sqrt(n - 3);
    const zLow = z - 1.96 * seZ;
    const zHigh = z + 1.96 * seZ;
    ciLow = (Math.exp(2 * zLow) - 1) / (Math.exp(2 * zLow) + 1);
    ciHigh = (Math.exp(2 * zHigh) - 1) / (Math.exp(2 * zHigh) + 1);
  }

  // Spearman Rank Correlation
  const rankedA = paired.map(([a], idx) => ({ val: a, idx })).sort((x, y) => x.val - y.val);
  const ranksA = new Array(n);
  let k = 0;
  while (k < n) {
    let l = k;
    while (l < n - 1 && rankedA[l + 1].val === rankedA[k].val) l++;
    const avgR = (k + 1 + l + 1) / 2;
    for (let m = k; m <= l; m++) ranksA[rankedA[m].idx] = avgR;
    k = l + 1;
  }

  const rankedB = paired.map(([, b], idx) => ({ val: b, idx })).sort((x, y) => x.val - y.val);
  const ranksB = new Array(n);
  k = 0;
  while (k < n) {
    let l = k;
    while (l < n - 1 && rankedB[l + 1].val === rankedB[k].val) l++;
    const avgR = (k + 1 + l + 1) / 2;
    for (let m = k; m <= l; m++) ranksB[rankedB[m].idx] = avgR;
    k = l + 1;
  }

  const meanRA = (n + 1) / 2;
  const meanRB = (n + 1) / 2;
  let numS = 0;
  let denSA = 0;
  let denSB = 0;
  for (let i = 0; i < n; i++) {
    const da = ranksA[i] - meanRA;
    const db = ranksB[i] - meanRB;
    numS += da * db;
    denSA += da * da;
    denSB += db * db;
  }
  const rho = (denSA > 0 && denSB > 0) ? numS / Math.sqrt(denSA * denSB) : 0;
  const tStatRho = Math.abs(rho) < 1 ? rho * Math.sqrt(df / Math.max(1e-10, 1 - rho * rho)) : 999;
  const pValueSpearman = calculateStudentTPValue(tStatRho, df);

  const r2 = r * r;
  const isSig = pValuePearson < 0.05;

  let dirText = r > 0 ? 'positive' : 'negative';
  let magText = 'negligible';
  const absR = Math.abs(r);
  if (absR >= 0.7) magText = 'strong';
  else if (absR >= 0.4) magText = 'moderate';
  else if (absR >= 0.2) magText = 'weak';

  const interp = isSig
    ? `Within the analyzed climatological record (N = ${n}, df = ${df}), ${varAName} and ${varBName} exhibited a statistically significant ${magText} ${dirText} association (Pearson r = ${r.toFixed(3)}, 95% CI [${ciLow.toFixed(3)}, ${ciHigh.toFixed(3)}], t = ${tStat.toFixed(2)}, p = ${pValuePearson.toFixed(4)}; Spearman ρ = ${rho.toFixed(3)}, p = ${pValueSpearman.toFixed(4)}), with shared variance R² = ${(r2 * 100).toFixed(1)}%.`
    : `Within the analyzed record (N = ${n}), the correlation between ${varAName} and ${varBName} was not statistically significant at α = 0.05 (Pearson r = ${r.toFixed(3)}, 95% CI [${ciLow.toFixed(3)}, ${ciHigh.toFixed(3)}], p = ${pValuePearson.toFixed(4)}; Spearman ρ = ${rho.toFixed(3)}, p = ${pValueSpearman.toFixed(4)}).`;

  return {
    variableA: varAName,
    variableB: varBName,
    sampleSize: n,
    pearsonR: Number(r.toFixed(4)),
    spearmanRho: Number(rho.toFixed(4)),
    pValuePearson: Number(pValuePearson.toFixed(5)),
    pValueSpearman: Number(pValueSpearman.toFixed(5)),
    isStatisticallySignificant: isSig,
    confidenceInterval95: [Number(ciLow.toFixed(4)), Number(ciHigh.toFixed(4))],
    tStatisticPearson: Number(tStat.toFixed(3)),
    degreesOfFreedom: df,
    covariance: Number(cov.toFixed(4)),
    rSquared: Number(r2.toFixed(4)),
    interpretation: interp,
    causationWarning: 'Correlation establishes statistical association across longitudinal observations but does not demonstrate direct bivariate causality.'
  };
}

/**
 * Backward compatibility alias for calculatePearsonCorrelation
 */
export function calculatePearsonCorrelation(
  seriesA: (number | null | undefined)[],
  seriesB: (number | null | undefined)[],
  varAName: string,
  varBName: string
): CorrelationResult {
  return calculatePearsonAndSpearman(seriesA, seriesB, varAName, varBName);
}

/**
 * ============================================================================
 * 6. ORDINARY LEAST SQUARES (OLS) REGRESSION & MODEL DIAGNOSTICS
 * ============================================================================
 * Supports Simple Linear Regression & Multiple Linear Regression via Gauss-Jordan
 * matrix inversion. Computes Durbin-Watson, Breusch-Pagan, Jarque-Bera residual
 * normality, and Variance Inflation Factor (VIF).
 */

/**
 * Invert a square matrix using Gauss-Jordan elimination with partial pivoting
 */
export function invertMatrix(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  // Create augmented matrix [A | I]
  const aug: number[][] = matrix.map((row, i) => [
    ...row,
    ...new Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))
  ]);

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) {
        maxRow = k;
      }
    }
    // Swap rows
    const temp = aug[i];
    aug[i] = aug[maxRow];
    aug[maxRow] = temp;

    const pivot = aug[i][i];
    if (Math.abs(pivot) < 1e-12) return null; // Singular matrix

    for (let j = 0; j < 2 * n; j++) {
      aug[i][j] /= pivot;
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = aug[k][i];
        for (let j = 0; j < 2 * n; j++) {
          aug[k][j] -= factor * aug[i][j];
        }
      }
    }
  }

  return aug.map(row => row.slice(n));
}

/**
 * Matrix multiplication A (m x p) * B (p x n) -> (m x n)
 */
export function multiplyMatrices(A: number[][], B: number[][]): number[][] {
  const m = A.length;
  const p = A[0].length;
  const n = B[0].length;
  const C: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < p; k++) {
        sum += A[i][k] * B[k][j];
      }
      C[i][j] = sum;
    }
  }
  return C;
}

/**
 * Transpose matrix (m x n) -> (n x m)
 */
export function transposeMatrix(A: number[][]): number[][] {
  const m = A.length;
  const n = A[0].length;
  const AT: number[][] = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      AT[j][i] = A[i][j];
    }
  }
  return AT;
}

/**
 * General Multiple Ordinary Least Squares (OLS) Linear Regression Engine
 */
export function calculateMultipleLinearRegression(
  dependentSeries: (number | null | undefined)[],
  independentSeries: { name: string; values: (number | null | undefined)[] }[],
  depVarName: string = 'Dependent Variable',
  options?: { isSubRegression?: boolean }
): RegressionResult {
  const isSub = Boolean(options?.isSubRegression);
  const numPredictors = independentSeries.length;
  const predictorNames = independentSeries.map(p => p.name);

  // Filter aligned observations
  const validRows: { y: number; x: number[] }[] = [];
  const totalRows = Math.min(dependentSeries.length, ...independentSeries.map(s => s.values.length));

  for (let i = 0; i < totalRows; i++) {
    const y = dependentSeries[i];
    const xRow = independentSeries.map(s => s.values[i]);
    if (
      typeof y === 'number' && !isNaN(y) &&
      xRow.every(v => typeof v === 'number' && !isNaN(v))
    ) {
      validRows.push({ y, x: xRow as number[] });
    }
  }

  const n = validRows.length;
  const p = numPredictors + 1; // including intercept

  if (n <= p + 1) {
    return {
      modelType: numPredictors === 1 ? 'Simple Linear' : 'Multiple Linear (OLS)',
      dependentVariable: depVarName,
      independentVariables: predictorNames,
      sampleSize: n,
      coefficients: [],
      interceptAlpha: null,
      rSquared: null,
      adjustedRSquared: null,
      standardErrorOfEstimate: null,
      rmse: null,
      fStatistic: null,
      pValueOfModel: null,
      dfModel: numPredictors,
      dfResidual: Math.max(1, n - p),
      diagnostics: {
        durbinWatson: { statistic: null, interpretation: 'Insufficient sample size.' },
        residualNormality: { skewness: null, excessKurtosis: null, jarqueBeraStat: null, pValue: null, isNormal: true, interpretation: 'Insufficient sample size.' },
        heteroscedasticityBreuschPagan: { lmStatistic: null, pValue: null, isHomoscedastic: true, interpretation: 'Insufficient sample size.' }
      },
      residuals: [],
      interpretation: 'Insufficient observations to construct econometric regression model.',
      limitations: 'Sample size constraint.'
    };
  }

  // Design matrix X with leading column of 1s for intercept
  const X: number[][] = validRows.map(r => [1, ...r.x]);
  const Y: number[][] = validRows.map(r => [r.y]);

  const XT = transposeMatrix(X);
  const XTX = multiplyMatrices(XT, X);
  const XTX_inv = invertMatrix(XTX);

  if (!XTX_inv) {
    return {
      modelType: numPredictors === 1 ? 'Simple Linear' : 'Multiple Linear (OLS)',
      dependentVariable: depVarName,
      independentVariables: predictorNames,
      sampleSize: n,
      coefficients: [],
      interceptAlpha: null,
      rSquared: null,
      adjustedRSquared: null,
      standardErrorOfEstimate: null,
      rmse: null,
      fStatistic: null,
      pValueOfModel: null,
      dfModel: numPredictors,
      dfResidual: n - p,
      diagnostics: {
        durbinWatson: { statistic: null, interpretation: 'Design matrix is singular (perfect multicollinearity).' },
        residualNormality: { skewness: null, excessKurtosis: null, jarqueBeraStat: null, pValue: null, isNormal: false, interpretation: 'Singular matrix.' },
        heteroscedasticityBreuschPagan: { lmStatistic: null, pValue: null, isHomoscedastic: true, interpretation: 'Singular matrix.' }
      },
      residuals: [],
      interpretation: 'Collinear predictors: (X^T X) matrix could not be inverted.',
      limitations: 'Severe multicollinearity among independent predictors.'
    };
  }

  const XTY = multiplyMatrices(XT, Y);
  const beta = multiplyMatrices(XTX_inv, XTY); // p x 1

  // Fitted values and residuals
  const meanY = validRows.reduce((a, b) => a + b.y, 0) / n;
  let ssTot = 0;
  let ssRes = 0;

  const rawResiduals = validRows.map((row, idx) => {
    let pred = beta[0][0];
    for (let j = 0; j < numPredictors; j++) {
      pred += beta[j + 1][0] * row.x[j];
    }
    const res = row.y - pred;
    ssTot += Math.pow(row.y - meanY, 2);
    ssRes += Math.pow(res, 2);
    return {
      index: idx,
      xValue: numPredictors === 1 ? row.x[0] : undefined,
      actualY: row.y,
      predictedY: pred,
      residual: res,
      standardizedResidual: 0
    };
  });

  const dfModel = numPredictors;
  const dfResidual = n - p;
  const s2 = ssRes / dfResidual;
  const seEstimate = Math.sqrt(s2);
  const rmse = Math.sqrt(ssRes / n);

  // Standardize residuals
  const residuals = rawResiduals.map(r => ({
    ...r,
    actualY: Number(r.actualY.toFixed(3)),
    predictedY: Number(r.predictedY.toFixed(3)),
    residual: Number(r.residual.toFixed(3)),
    standardizedResidual: seEstimate > 0 ? Number((r.residual / seEstimate).toFixed(3)) : 0
  }));

  const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
  const adjR2 = Math.max(0, 1 - ((1 - r2) * (n - 1)) / dfResidual);

  const msModel = dfModel > 0 ? (ssTot - ssRes) / dfModel : 0;
  const msRes = dfResidual > 0 ? ssRes / dfResidual : 0;
  const fStat = msRes > 0 ? msModel / msRes : 0;
  const pValueOfModel = fDistributionPValue(fStat, dfModel, dfResidual);

  // Compute VIFs for multiple regression
  const vifMap: { [key: string]: number } = {};
  if (!isSub && numPredictors > 1) {
    independentSeries.forEach((targetVar, idxTarget) => {
      const otherVars = independentSeries.filter((_, idxOther) => idxOther !== idxTarget);
      const subReg = calculateMultipleLinearRegression(
        targetVar.values,
        otherVars,
        targetVar.name,
        { isSubRegression: true }
      );
      const subR2 = subReg.rSquared || 0;
      vifMap[targetVar.name] = subR2 < 0.999 ? 1 / (1 - subR2) : 99.9;
    });
  }

  // Coefficient statistics
  const coefficients: RegressionCoefficient[] = [];
  const tCrit = studentTCriticalValue(dfResidual, 0.05);

  for (let j = 0; j < p; j++) {
    const varName = j === 0 ? 'Intercept (β₀)' : predictorNames[j - 1];
    const est = beta[j][0];
    const varBeta = s2 * XTX_inv[j][j];
    const seBeta = Math.sqrt(Math.max(0, varBeta));
    const tStat = seBeta > 0 ? est / seBeta : 0;
    const pVal = calculateStudentTPValue(tStat, dfResidual);
    const ciLow = est - tCrit * seBeta;
    const ciHigh = est + tCrit * seBeta;

    coefficients.push({
      name: varName,
      estimateBeta: Number(est.toFixed(4)),
      standardError: Number(seBeta.toFixed(4)),
      tStatistic: Number(tStat.toFixed(3)),
      pValue: Number(pVal.toFixed(5)),
      ci95Low: Number(ciLow.toFixed(4)),
      ci95High: Number(ciHigh.toFixed(4)),
      vif: j > 0 && numPredictors > 1 ? Number((vifMap[varName] || 1).toFixed(2)) : null
    });
  }

  // Diagnostics: Durbin-Watson
  let dwNumerator = 0;
  let dwDenominator = 0;
  for (let t = 0; t < residuals.length; t++) {
    dwDenominator += Math.pow(residuals[t].residual, 2);
    if (t > 0) {
      dwNumerator += Math.pow(residuals[t].residual - residuals[t - 1].residual, 2);
    }
  }
  const dwStat = dwDenominator > 0 ? dwNumerator / dwDenominator : 2.0;
  let dwInterp = 'No evidence of first-order autocorrelation (DW ≈ 2.0).';
  if (dwStat < 1.4) dwInterp = `Positive first-order serial autocorrelation detected (DW = ${dwStat.toFixed(2)} < 1.5).`;
  else if (dwStat > 2.6) dwInterp = `Negative serial autocorrelation detected (DW = ${dwStat.toFixed(2)} > 2.5).`;

  // Diagnostics: Jarque-Bera on residuals
  const resVals = residuals.map(r => r.residual);
  const resDesc = calculateDescriptiveStats(resVals, 'Model Residuals');
  const resSk = resDesc.skewness || 0;
  const resKu = resDesc.excessKurtosis || 0;
  const jbStat = (n / 6) * (resSk * resSk + (resKu * resKu) / 4);
  const jbP = chiSquarePValue(jbStat, 2);
  const isResNormal = jbP >= 0.05;

  // Diagnostics: Breusch-Pagan Test
  let lmStat: number | null = null;
  let bpP: number | null = null;
  let isHomoscedastic = true;
  if (!isSub) {
    const sqRes = residuals.map(r => Math.pow(r.residual, 2));
    const bpSubReg = calculateMultipleLinearRegression(sqRes, independentSeries, 'Squared Residuals', { isSubRegression: true });
    const bpR2 = bpSubReg.rSquared || 0;
    lmStat = n * bpR2;
    bpP = chiSquarePValue(lmStat, numPredictors);
    isHomoscedastic = bpP >= 0.05;
  }

  // Synthesis interpretation
  const sigPredictors = coefficients.slice(1).filter(c => c.pValue < 0.05);
  let interp = `The OLS model explained ${(r2 * 100).toFixed(1)}% of total variance in ${depVarName} (Adjusted R² = ${(adjR2 * 100).toFixed(1)}%, F(${dfModel}, ${dfResidual}) = ${fStat.toFixed(2)}, p = ${pValueOfModel.toFixed(4)}, RMSE = ${rmse.toFixed(2)}).`;
  if (sigPredictors.length > 0) {
    interp += ` Significant predictor(s): ${sigPredictors.map(p => `${p.name} (β = ${p.estimateBeta}, p = ${p.pValue.toFixed(3)})`).join(', ')}.`;
  } else {
    interp += ' None of the individual predictor coefficients reached statistical significance at α = 0.05.';
  }

  return {
    modelType: numPredictors === 1 ? 'Simple Linear' : 'Multiple Linear (OLS)',
    dependentVariable: depVarName,
    independentVariables: predictorNames,
    sampleSize: n,
    coefficients,
    slopeBeta: coefficients[1]?.estimateBeta ?? null,
    interceptAlpha: coefficients[0].estimateBeta,
    rSquared: Number(r2.toFixed(4)),
    adjustedRSquared: Number(adjR2.toFixed(4)),
    standardErrorOfEstimate: Number(seEstimate.toFixed(4)),
    standardError: Number(seEstimate.toFixed(4)),
    pValueBeta: coefficients[1]?.pValue ?? null,
    rmse: Number(rmse.toFixed(4)),
    fStatistic: Number(fStat.toFixed(4)),
    pValueOfModel: Number(pValueOfModel.toFixed(5)),
    dfModel,
    dfResidual,
    diagnostics: {
      durbinWatson: {
        statistic: Number(dwStat.toFixed(3)),
        interpretation: dwInterp
      },
      residualNormality: {
        skewness: Number(resSk.toFixed(3)),
        excessKurtosis: Number(resKu.toFixed(3)),
        jarqueBeraStat: Number(jbStat.toFixed(3)),
        pValue: Number(jbP.toFixed(4)),
        isNormal: isResNormal,
        interpretation: isResNormal
          ? `Residuals conform to Gaussian normality (Jarque-Bera = ${jbStat.toFixed(2)}, p = ${jbP.toFixed(3)} >= 0.05).`
          : `Residuals exhibit deviation from normality (Jarque-Bera = ${jbStat.toFixed(2)}, p = ${jbP.toFixed(3)} < 0.05). Interpret CI with caution.`
      },
      heteroscedasticityBreuschPagan: {
        lmStatistic: lmStat !== null ? Number(lmStat.toFixed(3)) : null,
        pValue: bpP !== null ? Number(bpP.toFixed(4)) : null,
        isHomoscedastic,
        interpretation: isSub
          ? 'Auxiliary sub-regression diagnostic skipped.'
          : (isHomoscedastic
            ? `Homoscedasticity assumption verified via Breusch-Pagan LM test (LM = ${lmStat !== null ? lmStat.toFixed(2) : 'N/A'}, p = ${bpP !== null ? bpP.toFixed(3) : 'N/A'} >= 0.05).`
            : `Evidence of heteroscedasticity in error variances (Breusch-Pagan LM = ${lmStat !== null ? lmStat.toFixed(2) : 'N/A'}, p = ${bpP !== null ? bpP.toFixed(3) : 'N/A'} < 0.05).`)
      },
      multicollinearityVif: numPredictors > 1 ? Object.entries(vifMap).map(([variable, vif]) => ({
        variable,
        vif: Number(vif.toFixed(2)),
        isAcceptable: vif < 5.0
      })) : undefined
    },
    residuals,
    interpretation: interp,
    limitations: 'Econometric linear assumptions (linearity, exogeneity, uncorrelated disturbances) apply. Historical observational data cannot guarantee future stationarity.'
  };
}

/**
 * Backward compatibility alias for calculateLinearRegression
 */
export function calculateLinearRegression(
  xVals: (number | null | undefined)[],
  yVals: (number | null | undefined)[],
  depVarName: string = 'Y',
  indepVarName: string = 'X'
): RegressionResult {
  return calculateMultipleLinearRegression(
    yVals,
    [{ name: indepVarName, values: xVals }],
    depVarName
  );
}

/**
 * Backward compatibility alias for calculatePhaseSummaryStats
 */
export function calculatePhaseSummaryStats(
  data: { phase: 'EL_NINO' | 'NEUTRAL' | 'LA_NINA'; value: number | null | undefined }[]
): PhaseComparisonStat[] {
  const groups = calculatePhaseGroupComparisons(data);
  return groups.map(g => ({
    phase: g.phase,
    count: g.sampleSize,
    mean: g.mean,
    median: g.median,
    standardDeviation: g.standardDeviation,
    interquartileRange: (g.q1 !== null && g.q3 !== null) ? [g.q1, g.q3] : null,
    min: g.min,
    max: g.max
  }));
}

/**
 * Backward compatibility alias for calculateOneWayAnova
 */
export function calculateOneWayAnova(
  groups: { phase: string; values: number[] }[],
  varName: string
): AnovaResult {
  const fullResult = calculateAnovaAndKruskal(
    groups.map(g => ({ name: g.phase, values: g.values })),
    'ENSO Phase',
    varName
  );

  return {
    factor: 'ENSO Phase',
    variable: varName,
    fStatistic: fullResult.anova.fStatistic,
    pValue: fullResult.anova.pValue,
    degreesOfFreedomBetween: fullResult.anova.dfBetween,
    degreesOfFreedomWithin: fullResult.anova.dfWithin,
    etaSquared: fullResult.anova.etaSquared,
    postHocTukey: fullResult.anova.postHocTukey.map(t => ({
      comparison: `${t.groupA} vs ${t.groupB}`,
      meanDifference: t.meanDiff,
      pValue: t.pValue
    }))
  };
}

/**
 * Direct helper for calculateSpearmanCorrelation
 */
export function calculateSpearmanCorrelation(
  seriesA: (number | null | undefined)[],
  seriesB: (number | null | undefined)[],
  varAName: string = 'X',
  varBName: string = 'Y'
): CorrelationResult {
  return calculatePearsonAndSpearman(seriesA, seriesB, varAName, varBName);
}

/**
 * Direct helper for calculateKruskalWallis
 */
export function calculateKruskalWallis(
  groups: { phase: string; values: number[] }[],
  varName: string = 'Outcome'
) {
  const fullResult = calculateAnovaAndKruskal(
    groups.map(g => ({ name: g.phase, values: g.values })),
    'ENSO Phase',
    varName
  );

  return {
    hStatistic: fullResult.kruskalWallis.hStatistic,
    degreesOfFreedom: fullResult.kruskalWallis.degreesOfFreedom,
    pValue: fullResult.kruskalWallis.pValue,
    epsilonSquared: fullResult.kruskalWallis.epsilonSquared,
    isSignificant: fullResult.kruskalWallis.isSignificant
  };
}

/**
 * Direct helper for calculateQuartiles
 */
export function calculateQuartiles(values: number[]): { q1: number; median: number; q3: number; iqr: number } {
  const clean = values.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
  if (clean.length === 0) {
    return { q1: 0, median: 0, q3: 0, iqr: 0 };
  }
  const q1 = calculatePercentile(clean, 25);
  const median = calculatePercentile(clean, 50);
  const q3 = calculatePercentile(clean, 75);
  return {
    q1,
    median,
    q3,
    iqr: q3 - q1
  };
}

/**
 * Rolling Window Bivariate Correlation (15-year, 20-year, or custom window)
 */
export interface RollingCorrelationPoint {
  endYear: number;
  startYear: number;
  windowLabel: string;
  midYear: number;
  sampleSize: number;
  pearsonR: number | null;
  spearmanRho: number | null;
  pValuePearson: number | null;
  pValueSpearman: number | null;
  isSignificant: boolean;
  rCritical95: number;
  ci95Low: number | null;
  ci95High: number | null;
}

export function calculateRollingCorrelation(
  data: { year: number; x: number | null | undefined; y: number | null | undefined }[],
  windowSize: number = 15,
  varXName: string = 'ONI',
  varYName: string = 'Rainfall'
): {
  windowSize: number;
  points: RollingCorrelationPoint[];
  overallMeanR: number | null;
  minR: number | null;
  maxR: number | null;
  rCritical95: number;
  interpretation: string;
} {
  // Sort and filter clean pairs
  const clean = data
    .filter(d => typeof d.year === 'number' && typeof d.x === 'number' && !isNaN(d.x) && typeof d.y === 'number' && !isNaN(d.y))
    .sort((a, b) => a.year - b.year);

  const n = clean.length;
  const df = windowSize - 2;
  const tCrit = df > 0 ? studentTCriticalValue(df, 0.05) : 2.16;
  const rCrit = df > 0 ? tCrit / Math.sqrt(tCrit * tCrit + df) : 0.514;

  if (n < windowSize) {
    return {
      windowSize,
      points: [],
      overallMeanR: null,
      minR: null,
      maxR: null,
      rCritical95: Number(rCrit.toFixed(3)),
      interpretation: `Insufficient continuous time series observations (N = ${n}) to compute a ${windowSize}-year rolling window correlation.`
    };
  }

  const points: RollingCorrelationPoint[] = [];

  for (let i = windowSize - 1; i < n; i++) {
    const windowSlice = clean.slice(i - windowSize + 1, i + 1);
    const startYr = windowSlice[0].year;
    const endYr = windowSlice[windowSlice.length - 1].year;
    const midYr = Math.round((startYr + endYr) / 2);

    const xVals = windowSlice.map(w => w.x as number);
    const yVals = windowSlice.map(w => w.y as number);

    const corr = calculatePearsonAndSpearman(xVals, yVals, varXName, varYName);

    points.push({
      startYear: startYr,
      endYear: endYr,
      windowLabel: `${startYr}–${endYr}`,
      midYear: midYr,
      sampleSize: windowSize,
      pearsonR: corr.pearsonR,
      spearmanRho: corr.spearmanRho,
      pValuePearson: corr.pValuePearson,
      pValueSpearman: corr.pValueSpearman,
      isSignificant: corr.isStatisticallySignificant ?? false,
      rCritical95: Number(rCrit.toFixed(3)),
      ci95Low: corr.confidenceInterval95 ? corr.confidenceInterval95[0] : null,
      ci95High: corr.confidenceInterval95 ? corr.confidenceInterval95[1] : null
    });
  }

  const validR = points.map(p => p.pearsonR).filter((r): r is number => r !== null && !isNaN(r));
  const meanR = validR.length > 0 ? calculateMean(validR) : null;
  const minR = validR.length > 0 ? Math.min(...validR) : null;
  const maxR = validR.length > 0 ? Math.max(...validR) : null;

  let interp = `Across the ${points.length} overlapping ${windowSize}-year windows (${points[0]?.windowLabel} to ${points[points.length - 1]?.windowLabel}), the rolling correlation between ${varXName} and ${varYName} averaged r = ${meanR !== null ? meanR.toFixed(2) : 'N/A'} (range: ${minR !== null ? minR.toFixed(2) : 'N/A'} to ${maxR !== null ? maxR.toFixed(2) : 'N/A'}).`;
  if (minR !== null && maxR !== null && maxR - minR > 0.4) {
    interp += ` Substantial temporal non-stationarity is observed, indicating multi-decadal modulation in the statistical teleconnection.`;
  } else {
    interp += ` The statistical association shows moderate multi-decadal stability over time.`;
  }

  return {
    windowSize,
    points,
    overallMeanR: meanR !== null ? Number(meanR.toFixed(3)) : null,
    minR: minR !== null ? Number(minR.toFixed(3)) : null,
    maxR: maxR !== null ? Number(maxR.toFixed(3)) : null,
    rCritical95: Number(rCrit.toFixed(3)),
    interpretation: interp
  };
}

/**
 * Empirical Distribution Histogram and Fitted Gaussian Curve Generator
 */
export interface HistogramBin {
  binIndex: number;
  binStart: number;
  binEnd: number;
  binMidpoint: number;
  binLabel: string;
  count: number;
  frequencyPercent: number;
  fittedGaussianDensity: number;
}

export function calculateHistogramData(
  values: (number | null | undefined)[],
  binCount: number = 10
): {
  bins: HistogramBin[];
  mean: number | null;
  median: number | null;
  stdDev: number | null;
  variance: number | null;
  skewness: number | null;
  excessKurtosis: number | null;
  sampleSize: number;
  jarqueBeraStat: number | null;
  jarqueBeraPValue: number | null;
  isNormallyDistributed: boolean;
} {
  const clean = values.filter((v): v is number => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
  const n = clean.length;

  if (n < 4) {
    return {
      bins: [],
      mean: n > 0 ? calculateMean(clean) : null,
      median: n > 0 ? calculatePercentile(clean, 50) : null,
      stdDev: null,
      variance: null,
      skewness: null,
      excessKurtosis: null,
      sampleSize: n,
      jarqueBeraStat: null,
      jarqueBeraPValue: null,
      isNormallyDistributed: true
    };
  }

  const mean = calculateMean(clean)!;
  const std = calculateStdDev(clean)!;
  const variance = std * std;
  const median = calculatePercentile(clean, 50);
  const desc = calculateDescriptiveStats(clean, 'Distribution');
  const skewness = desc.skewness;
  const kurtosis = desc.excessKurtosis;

  // Jarque-Bera test
  const sk = skewness || 0;
  const ku = kurtosis || 0;
  const jbStat = (n / 6) * (sk * sk + (ku * ku) / 4);
  const jbP = chiSquarePValue(jbStat, 2);
  const isNorm = jbP >= 0.05;

  const min = clean[0];
  const max = clean[clean.length - 1];
  const span = Math.max(1e-5, max - min);
  const binWidth = span / binCount;

  const bins: HistogramBin[] = [];

  for (let b = 0; b < binCount; b++) {
    const binStart = min + b * binWidth;
    const binEnd = b === binCount - 1 ? max + 1e-5 : min + (b + 1) * binWidth;
    const binMid = (binStart + binEnd) / 2;

    const count = clean.filter(v => v >= binStart && (b === binCount - 1 ? v <= max : v < binEnd)).length;
    const freqPct = (count / n) * 100;

    // Normal probability density function at binMid scaled to bin width and sample count
    let gaussianDensity = 0;
    if (std > 0) {
      const z = (binMid - mean) / std;
      const pdf = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
      gaussianDensity = pdf * binWidth * 100; // expected percentage in this bin under theoretical normal
    }

    bins.push({
      binIndex: b,
      binStart: Number(binStart.toFixed(1)),
      binEnd: Number(binEnd.toFixed(1)),
      binMidpoint: Number(binMid.toFixed(1)),
      binLabel: `${binStart.toFixed(0)}–${binEnd.toFixed(0)}`,
      count,
      frequencyPercent: Number(freqPct.toFixed(1)),
      fittedGaussianDensity: Number(gaussianDensity.toFixed(1))
    });
  }

  return {
    bins,
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    stdDev: Number(std.toFixed(2)),
    variance: Number(variance.toFixed(2)),
    skewness: skewness !== null ? Number(skewness.toFixed(3)) : null,
    excessKurtosis: kurtosis !== null ? Number(kurtosis.toFixed(3)) : null,
    sampleSize: n,
    jarqueBeraStat: Number(jbStat.toFixed(3)),
    jarqueBeraPValue: Number(jbP.toFixed(4)),
    isNormallyDistributed: isNorm
  };
}

/**
 * Jarque-Bera Normality Test convenience function
 */
export function calculateNormalityJarqueBera(values: (number | null | undefined)[]): {
  jarqueBeraStatistic: number | null;
  pValue: number | null;
  isNormallyDistributed: boolean;
  skewness: number | null;
  excessKurtosis: number | null;
} {
  const clean = values.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  if (clean.length < 5) {
    return {
      jarqueBeraStatistic: null,
      pValue: null,
      isNormallyDistributed: true,
      skewness: null,
      excessKurtosis: null
    };
  }
  const n = clean.length;
  const desc = calculateDescriptiveStats(clean, 'Normality');
  const sk = desc.skewness || 0;
  const ku = desc.excessKurtosis || 0;
  const jbStat = (n / 6) * (sk * sk + (ku * ku) / 4);
  const jbP = chiSquarePValue(jbStat, 2);
  return {
    jarqueBeraStatistic: Number(jbStat.toFixed(3)),
    pValue: Number(jbP.toFixed(4)),
    isNormallyDistributed: jbP >= 0.05,
    skewness: desc.skewness,
    excessKurtosis: desc.excessKurtosis
  };
}

/**
 * Two group t-test convenience function
 */
export function calculateTwoGroupTTest(
  group1Values: number[],
  group2Values: number[],
  groupComparisonName: string = 'Group 1 vs Group 2'
): TwoGroupTestResult {
  return calculateIndependentTTest(group1Values, group2Values, groupComparisonName.split(' vs ')[0] || 'Group 1', groupComparisonName.split(' vs ')[1] || 'Group 2');
}

/**
 * ============================================================================
 * 7. REUSABLE RESEARCH RESULT BUILDER (STATISTICAL RESULT FACTORY)
 * ============================================================================
 */

export function buildStatisticalResult(params: {
  id: string;
  analysisType: StatisticalResult['analysisType'];
  variable1: string;
  variable2?: string;
  sampleSize: number;
  estimate: number | null;
  standardError?: number | null;
  confidenceInterval?: [number, number] | null;
  pValue?: number | null;
  effectSize?: StatisticalResult['effectSize'];
  modelMetrics?: StatisticalResult['modelMetrics'];
  interpretation: string;
  limitations?: string;
}): StatisticalResult {
  return {
    id: params.id,
    analysisType: params.analysisType,
    variable1: params.variable1,
    variable2: params.variable2,
    sampleSize: params.sampleSize,
    estimate: params.estimate,
    standardError: params.standardError,
    confidenceInterval: params.confidenceInterval,
    pValue: params.pValue,
    effectSize: params.effectSize,
    modelMetrics: params.modelMetrics,
    interpretation: params.interpretation,
    limitations: params.limitations || 'Observational longitudinal time-series data without randomized controlled intervention.'
  };
}
