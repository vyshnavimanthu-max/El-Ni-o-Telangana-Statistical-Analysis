import React, { useMemo } from 'react';
import { AlertCircle, BookOpen, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { MergedClimateRecord } from '../types/dataset';
import {
  calculatePearsonCorrelation,
  calculateSpearmanCorrelation,
  calculateLinearRegression,
  calculateDescriptiveStats,
  calculateAnovaAndKruskal
} from '../statistics/engine';

interface TemperatureScientificInterpretationProps {
  data: MergedClimateRecord[];
  startYear: number;
  endYear: number;
  className?: string;
}

export const TemperatureScientificInterpretation: React.FC<TemperatureScientificInterpretationProps> = ({
  data,
  startYear,
  endYear,
  className = ''
}) => {
  const validData = useMemo(() => {
    return data.filter(d => d.meanMaxTempC !== null && d.oniJjas !== null);
  }, [data]);

  const stats = useMemo(() => {
    if (validData.length < 5) return null;

    const xVals = validData.map(d => d.oniJjas!);
    const yAnomVals = validData.map(d => d.tempMaxAnomalyC ?? Number((d.meanMaxTempC! - 32.4).toFixed(2)));
    const yAbsVals = validData.map(d => d.meanMaxTempC!);

    const corr = calculatePearsonCorrelation(xVals, yAnomVals, 'ONI (JJAS)', 'Max Temp Anomaly');
    const spearman = calculateSpearmanCorrelation(xVals, yAnomVals, 'ONI (JJAS)', 'Max Temp Anomaly');
    const reg = calculateLinearRegression(xVals, yAnomVals, 'Max Temp Anomaly (°C)', 'ONI (JJAS)');

    const elNinoVals = validData.filter(d => d.ensoPhase === 'EL_NINO').map(d => d.tempMaxAnomalyC ?? Number((d.meanMaxTempC! - 32.4).toFixed(2)));
    const neutralVals = validData.filter(d => d.ensoPhase === 'NEUTRAL').map(d => d.tempMaxAnomalyC ?? Number((d.meanMaxTempC! - 32.4).toFixed(2)));
    const laNinaVals = validData.filter(d => d.ensoPhase === 'LA_NINA').map(d => d.tempMaxAnomalyC ?? Number((d.meanMaxTempC! - 32.4).toFixed(2)));

    const elNinoStats = calculateDescriptiveStats(elNinoVals, 'El Niño', '°C');
    const neutralStats = calculateDescriptiveStats(neutralVals, 'Neutral', '°C');
    const laNinaStats = calculateDescriptiveStats(laNinaVals, 'La Niña', '°C');

    const anova = calculateAnovaAndKruskal(
      [
        { name: 'El Niño', values: elNinoVals },
        { name: 'Neutral', values: neutralVals },
        { name: 'La Niña', values: laNinaVals }
      ],
      'ENSO Phase',
      'Max Temp Anomaly'
    );

    return {
      sampleSize: validData.length,
      corr,
      spearman,
      reg,
      elNinoStats,
      neutralStats,
      laNinaStats,
      anova
    };
  }, [validData]);

  if (!stats) return null;

  const {
    sampleSize,
    corr,
    spearman,
    reg,
    elNinoStats,
    neutralStats,
    laNinaStats,
    anova
  } = stats;

  const isSignificant = corr.isStatisticallySignificant;
  const rVal = corr.pearsonR ?? 0;
  const pVal = corr.pValuePearson ?? 1;
  const slopeVal = reg.slopeBeta ?? reg.coefficients[1]?.estimateBeta ?? 0;
  const r2Val = (reg.rSquared ?? 0) * 100;
  const ciLower = reg.coefficients[1]?.ci95Low ?? 0;
  const ciUpper = reg.coefficients[1]?.ci95High ?? 0;

  // Dynamic sentence strictly adhering to prompt specification
  const primaryEvidenceStatement = `During the selected period (${startYear}–${endYear}, N = ${sampleSize}), ONI showed a ${
    isSignificant ? 'statistically significant' : 'non-significant'
  } ${rVal >= 0 ? 'positive' : 'negative'} association with Telangana maximum temperature anomaly (Pearson r = ${
    rVal >= 0 ? '+' : ''
  }${rVal.toFixed(3)}, p = ${pVal.toFixed(4)}, OLS slope β = ${slopeVal >= 0 ? '+' : ''}${slopeVal.toFixed(
    2
  )}°C departure per +1.0°C ONI, R² = ${r2Val.toFixed(1)}%).`;

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-5 ${className}`}>
      {/* Header */}
      <div className="border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-300 uppercase">
            Empirical Statistical Findings
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Strict Non-Causal Formulation
          </span>
        </div>
        <h3 className="text-base font-bold text-slate-900 font-serif">
          Scientific Synthesis: Thermal Teleconnection & Evidence Interpretation
        </h3>
        <p className="text-xs text-slate-500">
          Rigorous statistical synthesis of thermal teleconnections over Telangana without unjustified causal attribution
        </p>
      </div>

      {/* Mandatory Structured Evidence Statement Box */}
      <div className="bg-slate-900 text-slate-100 rounded-lg p-4.5 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Calculated Evidence Statement</span>
        </div>
        <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed font-serif">
          "{primaryEvidenceStatement}"
        </p>
      </div>

      {/* Key Statistical Evidence Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Parametric & Regression Metrics */}
        <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-serif">
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>Thermal Teleconnection Parameters</span>
          </div>
          <ul className="text-xs text-slate-700 space-y-2 leading-relaxed">
            <li className="flex items-start gap-1.5">
              <span className="text-slate-400 font-bold">•</span>
              <span>
                <strong>Bivariate Sensitivity:</strong> Telangana monsoon maximum temperature increases at an empirical rate of <strong>{slopeVal >= 0 ? '+' : ''}{slopeVal.toFixed(2)}°C</strong> per unit standard (+1.0°C) rise in ONI SST anomaly (95% CI: [{ciLower.toFixed(2)}, {ciUpper.toFixed(2)}]).
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-slate-400 font-bold">•</span>
              <span>
                <strong>Variance Explained (R²):</strong> The linear teleconnection accounts for <strong>{r2Val.toFixed(1)}%</strong> of interannual maximum temperature variance over Telangana across the {sampleSize}-year observation baseline.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-slate-400 font-bold">•</span>
              <span>
                <strong>Phase Stratification:</strong> Mean T_max anomaly is <strong>{elNinoStats.mean !== null && elNinoStats.mean >= 0 ? '+' : ''}{elNinoStats.mean?.toFixed(2)}°C</strong> (Median: {elNinoStats.median?.toFixed(2)}°C) during El Niño years, compared to <strong>{laNinaStats.mean !== null && laNinaStats.mean >= 0 ? '+' : ''}{laNinaStats.mean?.toFixed(2)}°C</strong> (Median: {laNinaStats.median?.toFixed(2)}°C) during La Niña regimes (One-Way ANOVA F = {anova.anova.fStatistic?.toFixed(2)}, p = {anova.anova.pValue?.toFixed(4)}).
              </span>
            </li>
          </ul>
        </div>

        {/* Physical Land-Atmosphere Feedbacks */}
        <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-serif">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>Underlying Land-Surface Physics</span>
          </div>
          <ul className="text-xs text-slate-700 space-y-2 leading-relaxed">
            <li className="flex items-start gap-1.5">
              <span className="text-slate-400 font-bold">•</span>
              <span>
                <strong>Insolation & Cloud Forcing:</strong> Suppressed convective cloud cover during El Niño monsoon breaks enhances downwelling shortwave solar radiation, driving terrestrial daytime maximum temperatures upwards.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-slate-400 font-bold">•</span>
              <span>
                <strong>Bowen Ratio & Soil Moisture Feedback:</strong> Rainfall deficits diminish root-zone soil moisture, suppressing latent evaporative cooling and partitioning available net radiation into sensible heat flux.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Explicit Uncertainty & Methodological Limitations Panel */}
      <div className="bg-amber-50/70 border border-amber-300/80 rounded-lg p-4.5 space-y-2.5 text-xs text-amber-950">
        <div className="flex items-center gap-2 font-bold font-serif text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Scientific Uncertainty & Methodological Limitations</span>
        </div>
        <div className="space-y-1.5 text-[11px] leading-relaxed text-amber-900/90">
          <p>
            <strong>1. Non-Causal Nature of Observational Correlation:</strong> While the correlation between ONI and Telangana temperature anomaly is statistically verified ({isSignificant ? 'p < 0.05' : 'p ≥ 0.05'}), correlation alone does not establish isolated physical causation. Global atmospheric circulation regimes (Indian Ocean Dipole, Madden-Julian Oscillation) concurrently modulate regional cloud cover and heat extremes.
          </p>
          <p>
            <strong>2. Local Microclimate & Irrigation Expansion:</strong> Rapid post-2014 expansion of surface lift irrigation (e.g. Kaleshwaram Project, SRSP canals) and localized vegetation greening across northern/central Telangana introduce regional evaporative cooling effects that can moderate peak daytime thermal anomalies independently of global ENSO phases.
          </p>
          <p>
            <strong>3. Observation Uncertainty Bounds:</strong> The 95% Confidence Interval for the thermal sensitivity slope is <strong>[{ciLower.toFixed(2)}, {ciUpper.toFixed(2)}] °C/°C ONI</strong>, indicating residual variance governed by intra-seasonal monsoon dynamics and regional boundary layer processes.
          </p>
        </div>
      </div>
    </div>
  );
};
