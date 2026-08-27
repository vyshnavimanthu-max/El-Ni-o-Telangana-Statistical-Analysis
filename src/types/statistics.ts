/**
 * Comprehensive Statistical Types for El Niño × Telangana Research Engine
 * Strictly programmatic data structures with no hard-coded or fabricated outputs.
 */

export interface DescriptiveStats {
  variableName: string;
  unit: string;
  sampleSize: number;
  mean: number | null;
  median: number | null;
  varianceSample: number | null;
  variancePopulation: number | null;
  standardDeviation: number | null;
  standardError: number | null;
  min: number | null;
  max: number | null;
  range: number | null;
  q1: number | null;
  q2: number | null;
  q3: number | null;
  iqr: number | null;
  coefficientOfVariationPct: number | null;
  skewness: number | null;
  excessKurtosis: number | null;
  confidenceInterval95Mean: [number, number] | null;
}

export interface PhaseGroupComparison {
  phase: 'EL_NINO' | 'NEUTRAL' | 'LA_NINA';
  displayName: string;
  sampleSize: number;
  mean: number | null;
  median: number | null;
  standardDeviation: number | null;
  variance: number | null;
  standardError: number | null;
  min: number | null;
  max: number | null;
  q1: number | null;
  q3: number | null;
  iqr: number | null;
  confidenceInterval95: [number, number] | null;
}

export interface TwoGroupTestResult {
  testName: 'Independent Samples Student t-Test' | "Welch's t-Test" | 'Mann-Whitney U Test';
  group1Name: string;
  group2Name: string;
  sampleSize1: number;
  sampleSize2: number;
  mean1: number | null;
  mean2: number | null;
  meanDifference: number | null;
  testStatisticName: string;
  testStatisticValue: number | null;
  degreesOfFreedom: number | null;
  pValue: number | null;
  alpha: number;
  decision: 'REJECT_NULL' | 'FAIL_TO_REJECT_NULL';
  confidenceInterval95Diff: [number, number] | null;
  effectSizeName: "Cohen's d" | 'Rank-Biserial r';
  effectSizeValue: number | null;
  effectSizeInterpretation: string;
  assumptionsChecked: {
    name: string;
    passed: boolean;
    details: string;
  }[];
  interpretation: string;
}

export interface AnovaAndKruskalResult {
  factorName: string;
  variableName: string;
  totalSampleSize: number;
  groups: {
    name: string;
    n: number;
    mean: number;
    sd: number;
    median: number;
  }[];
  
  // Parametric ANOVA
  anova: {
    fStatistic: number | null;
    pValue: number | null;
    dfBetween: number;
    dfWithin: number;
    ssBetween: number;
    ssWithin: number;
    ssTotal: number;
    msBetween: number;
    msWithin: number;
    etaSquared: number | null;
    omegaSquared: number | null;
    isSignificant: boolean;
    decision: 'REJECT_NULL' | 'FAIL_TO_REJECT_NULL';
    postHocTukey: {
      groupA: string;
      groupB: string;
      meanDiff: number;
      qStatistic: number;
      pValue: number;
      ci95: [number, number];
      isSignificant: boolean;
    }[];
  };
  oneWayAnova?: {
    fStatistic: number | null;
    pValue: number | null;
    dfBetween: number;
    dfWithin: number;
    ssBetween: number;
    ssWithin: number;
    ssTotal: number;
    msBetween: number;
    msWithin: number;
    etaSquared: number | null;
    omegaSquared: number | null;
    isSignificant: boolean;
    decision: 'REJECT_NULL' | 'FAIL_TO_REJECT_NULL';
    postHocTukey: {
      groupA: string;
      groupB: string;
      meanDiff: number;
      qStatistic: number;
      pValue: number;
      ci95: [number, number];
      isSignificant: boolean;
    }[];
  };

  // Non-parametric Kruskal-Wallis
  kruskalWallis: {
    hStatistic: number | null;
    degreesOfFreedom: number;
    pValue: number | null;
    epsilonSquared: number | null;
    isSignificant: boolean;
    decision: 'REJECT_NULL' | 'FAIL_TO_REJECT_NULL';
  };

  // Assumption diagnostics
  assumptions: {
    normalityShapiroOrJB: {
      testName: string;
      statistic: number;
      pValue: number;
      isNormal: boolean;
      details: string;
    };
    homogeneityLevene: {
      statistic: number;
      pValue: number;
      isHomogeneous: boolean;
      details: string;
    };
  };

  recommendedTest: 'ANOVA' | 'KRUSKAL_WALLIS';
  interpretation: string;
}

export interface CorrelationResult {
  variableA: string;
  variableB: string;
  sampleSize: number;
  pearsonR: number | null;
  spearmanRho: number | null;
  pValuePearson: number | null;
  pValueSpearman: number | null;
  isStatisticallySignificant: boolean | null; // alpha = 0.05
  confidenceInterval95: [number, number] | null;
  tStatisticPearson: number | null;
  degreesOfFreedom: number | null;
  covariance: number | null;
  rSquared: number | null;
  interpretation: string;
  causationWarning: string;
}

export interface RegressionCoefficient {
  name: string;
  estimateBeta: number;
  standardError: number;
  tStatistic: number;
  pValue: number;
  ci95Low: number;
  ci95High: number;
  vif?: number | null; // Variance Inflation Factor for multiple regression
}

export interface RegressionResult {
  modelType: 'Simple Linear' | 'Multiple Linear (OLS)';
  dependentVariable: string;
  independentVariables: string[];
  sampleSize: number;
  coefficients: RegressionCoefficient[];
  slopeBeta?: number | null; // For simple regression convenience
  interceptAlpha: number | null;
  rSquared: number | null;
  adjustedRSquared: number | null;
  standardErrorOfEstimate: number | null;
  standardError?: number | null; // Alias for standardErrorOfEstimate
  pValueBeta?: number | null;
  rmse: number | null;
  fStatistic: number | null;
  pValueOfModel: number | null;
  dfModel: number;
  dfResidual: number;
  
  // Model Diagnostics
  diagnostics: {
    durbinWatson: {
      statistic: number | null;
      interpretation: string;
    };
    residualNormality: {
      skewness: number | null;
      excessKurtosis: number | null;
      jarqueBeraStat: number | null;
      pValue: number | null;
      isNormal: boolean;
      interpretation: string;
    };
    heteroscedasticityBreuschPagan: {
      lmStatistic: number | null;
      pValue: number | null;
      isHomoscedastic: boolean;
      interpretation: string;
    };
    multicollinearityVif?: {
      variable: string;
      vif: number;
      isAcceptable: boolean;
    }[];
  };

  residuals: {
    index: number;
    xValue?: number;
    actualY: number;
    predictedY: number;
    residual: number;
    standardizedResidual: number;
  }[];

  interpretation: string;
  limitations: string;
}

export interface PhaseComparisonStat {
  phase: 'EL_NINO' | 'NEUTRAL' | 'LA_NINA';
  count: number;
  mean: number | null;
  median: number | null;
  standardDeviation: number | null;
  interquartileRange?: [number, number] | null;
  min: number | null;
  max: number | null;
}

export interface AnovaResult {
  factor: string;
  variable: string;
  fStatistic: number | null;
  pValue: number | null;
  degreesOfFreedomBetween: number;
  degreesOfFreedomWithin: number;
  etaSquared?: number | null;
  postHocTukey?: {
    comparison: string;
    meanDifference: number;
    pValue: number;
  }[];
}

export interface ResearchHypothesis {
  id: string;
  code: string;
  title: string;
  nullHypothesis: string;
  alternativeHypothesis: string;
  statisticalTest: string;
  variablesTested: string[];
  status: 'PENDING_DATA_INGESTION' | 'CALCULATED';
  testStatisticName?: string;
  testStatisticValue?: number | null;
  pValue?: number | null;
  decision?: 'REJECT_NULL' | 'FAIL_TO_REJECT_NULL' | 'PENDING';
  practicalInterpretation?: string;
  caveatNotes: string;
}

/**
 * Standard Reusable Academic Research Result Object
 */
export interface StatisticalResult {
  id: string;
  analysisType: 'Descriptive' | 'Group Comparison' | 'Hypothesis Testing' | 'Correlation' | 'Linear Regression' | 'Multiple OLS Regression' | 'ANOVA' | 'Kruskal-Wallis';
  variable1: string;
  variable2?: string;
  sampleSize: number;
  estimate: number | null;
  standardError?: number | null;
  confidenceInterval?: [number, number] | null;
  pValue?: number | null;
  effectSize?: {
    type: "Cohen's d" | 'Eta-squared (η²)' | 'R-squared (R²)' | 'Rank-Biserial r' | 'Pearson r';
    value: number;
    interpretation: 'Negligible' | 'Small' | 'Medium' | 'Large' | 'Substantial';
  } | null;
  modelMetrics?: {
    rSquared?: number;
    adjustedRSquared?: number;
    fStatistic?: number;
    rmse?: number;
    degreesOfFreedom?: number | [number, number];
  };
  interpretation: string;
  limitations: string;
}
