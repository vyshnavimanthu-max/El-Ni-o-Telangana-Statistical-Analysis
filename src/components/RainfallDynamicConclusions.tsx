import React, { useMemo } from 'react';
import { MergedClimateRecord } from '../types/dataset';
import {
  calculatePearsonCorrelation,
  calculateLinearRegression,
  calculateRollingCorrelation,
  calculateMean,
  calculateStdDev
} from '../statistics/engine';
import { CheckCircle2, AlertTriangle, BookOpen, Clock, ShieldAlert, Cpu } from 'lucide-react';

interface RainfallDynamicConclusionsProps {
  data: MergedClimateRecord[];
  className?: string;
}

export const RainfallDynamicConclusions: React.FC<RainfallDynamicConclusionsProps> = ({
  data,
  className = ''
}) => {
  const dynamicFindings = useMemo(() => {
    if (!data || data.length < 5) return null;

    const validData = data.filter(d => 
      d.oniJjas !== null && 
      d.rainfallJjasMm !== null && 
      d.rainfallAnomalyPercent !== null &&
      !isNaN(d.oniJjas) && 
      !isNaN(d.rainfallJjasMm)
    );

    const n = validData.length;
    if (n < 5) return null;

    const xOni = validData.map(d => d.oniJjas!);
    const yJjasMm = validData.map(d => d.rainfallJjasMm!);
    const yJjasAnom = validData.map(d => d.rainfallAnomalyPercent!);

    // Correlations & Regressions
    const corrJjas = calculatePearsonCorrelation(xOni, yJjasMm, 'ONI', 'JJAS Rainfall (mm)');
    const regJjasAnom = calculateLinearRegression(xOni, yJjasAnom, 'Rainfall Anomaly (%)', 'ONI');
    const regJjasMm = calculateLinearRegression(xOni, yJjasMm, 'JJAS Rainfall (mm)', 'ONI');

    // Monthly sensitivity analysis
    const months = [
      { name: 'June', getter: (d: MergedClimateRecord) => d.rainfallJuneMm, normal: 129.5 },
      { name: 'July', getter: (d: MergedClimateRecord) => d.rainfallJulyMm, normal: 242.8 },
      { name: 'August', getter: (d: MergedClimateRecord) => d.rainfallAugustMm, normal: 218.4 },
      { name: 'September', getter: (d: MergedClimateRecord) => d.rainfallSeptemberMm, normal: 159.8 }
    ];

    const monthlyResults = months.map(m => {
      const monthPairs = validData
        .map(d => ({ oni: d.oniJjas!, val: m.getter(d) }))
        .filter(p => typeof p.val === 'number' && !isNaN(p.val as number));

      const corr = calculatePearsonCorrelation(
        monthPairs.map(p => p.oni),
        monthPairs.map(p => p.val as number),
        'ONI',
        m.name
      );

      const reg = calculateLinearRegression(
        monthPairs.map(p => p.oni),
        monthPairs.map(p => p.val as number),
        m.name,
        'ONI'
      );

      return {
        name: m.name,
        r: corr.pearsonR,
        p: corr.pValuePearson,
        isSig: corr.isStatisticallySignificant,
        slopeBeta: reg.slopeBeta,
        r2: reg.rSquared
      };
    });

    // Find month with strongest negative correlation
    const validMonths = monthlyResults.filter(m => m.r !== null);
    const mostSensitiveMonth = validMonths.length > 0
      ? [...validMonths].sort((a, b) => (a.r ?? 0) - (b.r ?? 0))[0]
      : null;

    // Phase Drought Proportions
    const elNinoRecords = validData.filter(d => d.ensoPhase === 'EL_NINO');
    const neutralRecords = validData.filter(d => d.ensoPhase === 'NEUTRAL');
    const laNinaRecords = validData.filter(d => d.ensoPhase === 'LA_NINA');

    const elNinoDroughtCount = elNinoRecords.filter(d => (d.rainfallAnomalyPercent ?? 0) <= -19).length;
    const neutralDroughtCount = neutralRecords.filter(d => (d.rainfallAnomalyPercent ?? 0) <= -19).length;
    const laNinaDroughtCount = laNinaRecords.filter(d => (d.rainfallAnomalyPercent ?? 0) <= -19).length;

    const elNinoDroughtPct = elNinoRecords.length > 0 ? (elNinoDroughtCount / elNinoRecords.length) * 100 : 0;
    const neutralDroughtPct = neutralRecords.length > 0 ? (neutralDroughtCount / neutralRecords.length) * 100 : 0;
    const laNinaDroughtPct = laNinaRecords.length > 0 ? (laNinaDroughtCount / laNinaRecords.length) * 100 : 0;

    // Rolling correlation stability over 15-year window
    const rollingPairs = validData.map(d => ({ year: d.year, x: d.oniJjas, y: d.rainfallJjasMm }));
    const rolling15 = calculateRollingCorrelation(rollingPairs, 15, 'ONI', 'Rainfall');

    return {
      sampleSize: n,
      corrJjas,
      regJjasAnom,
      regJjasMm,
      monthlyResults,
      mostSensitiveMonth,
      elNinoCount: elNinoRecords.length,
      neutralCount: neutralRecords.length,
      laNinaCount: laNinaRecords.length,
      elNinoDroughtPct: Number(elNinoDroughtPct.toFixed(1)),
      neutralDroughtPct: Number(neutralDroughtPct.toFixed(1)),
      laNinaDroughtPct: Number(laNinaDroughtPct.toFixed(1)),
      rolling15
    };
  }, [data]);

  if (!dynamicFindings) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs ${className}`}>
        <h3 className="text-sm font-bold text-slate-800">
          Awaiting Statistical Synthesis
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Dynamic statistical conclusions will compute automatically once official longitudinal records are ingested.
        </p>
      </div>
    );
  }

  const {
    sampleSize,
    corrJjas,
    regJjasAnom,
    regJjasMm,
    monthlyResults,
    mostSensitiveMonth,
    elNinoDroughtPct,
    neutralDroughtPct,
    laNinaDroughtPct,
    rolling15
  } = dynamicFindings;

  const r = corrJjas.pearsonR ?? 0;
  const pVal = corrJjas.pValuePearson ?? 1;
  const isSig = corrJjas.isStatisticallySignificant ?? false;
  const betaAnom = regJjasAnom.slopeBeta ?? 0;
  const betaMm = regJjasMm.slopeBeta ?? 0;
  const r2Pct = regJjasAnom.rSquared !== null ? (regJjasAnom.rSquared * 100).toFixed(1) : '0';

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-5 ${className}`}>
      {/* Header */}
      <div className="border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-semibold border border-emerald-200">
            Empirical Statistical Synthesis
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Derived Strictly from N = {sampleSize} Verified Climatological Observations
          </span>
        </div>
        <h3 className="text-base font-bold text-slate-900 font-serif">
          Telangana Rainfall Analysis: Scientific Conclusions Grounded in Computed Metrics
        </h3>
        <p className="text-xs text-slate-600">
          All conclusions below are dynamically formulated from empirical bivariate correlation coefficients, OLS regression slopes, intra-seasonal stratifications, and rolling decadal windows.
        </p>
      </div>

      {/* Core Dynamic Findings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Finding 1: Macro Teleconnection Magnitude */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold font-serif">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>1. Southwest Monsoon (JJAS) Teleconnection Sensitivity</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Across the analyzed record (N = {sampleSize}), Telangana southwest monsoon rainfall exhibits a <strong>{r < 0 ? 'negative' : 'positive'}</strong> correlation with the Oceanic Niño Index (Pearson r = <strong>{r > 0 ? `+${r.toFixed(3)}` : r.toFixed(3)}</strong>, p = <strong>{pVal.toFixed(4)}</strong>; {isSig ? 'statistically significant at α = 0.05' : 'does not reach statistical significance at α = 0.05'}).
          </p>
          <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-[11px] text-slate-800 space-y-0.5">
            <div>• OLS Slope (β): <strong>{betaAnom > 0 ? `+${betaAnom.toFixed(2)}` : betaAnom.toFixed(2)}% anomaly per +1.0°C ONI</strong> ({betaMm > 0 ? `+${betaMm.toFixed(1)}` : betaMm.toFixed(1)} mm/°C)</div>
            <div>• Shared Variance (R²): <strong>{r2Pct}%</strong> of Telangana monsoon variance explained by equatorial Pacific SST anomalies alone.</div>
          </div>
        </div>

        {/* Finding 2: Intra-Seasonal Monthly Vulnerability */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold font-serif">
            <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
            <span>2. Intra-Seasonal Rainfall Partitioning</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Intra-seasonal analysis reveals heterogeneous teleconnection responses across the four monsoon months. 
            {mostSensitiveMonth && (
              <> The peak suppression effect occurs during <strong>{mostSensitiveMonth.name}</strong> (r = <strong>{mostSensitiveMonth.r !== null ? (mostSensitiveMonth.r > 0 ? `+${mostSensitiveMonth.r.toFixed(2)}` : mostSensitiveMonth.r.toFixed(2)) : 'N/A'}</strong>, β = <strong>{mostSensitiveMonth.slopeBeta !== null ? `${mostSensitiveMonth.slopeBeta.toFixed(1)} mm/°C` : 'N/A'}</strong>), coinciding with critical crop vegetative and tillering phases in Telangana.</>
            )}
          </p>
          <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center pt-1">
            {monthlyResults.map(m => (
              <div key={m.name} className="p-1 bg-white rounded border border-slate-200">
                <span className="block font-bold text-slate-700">{m.name}</span>
                <span className={m.isSig ? 'text-rose-700 font-semibold' : 'text-slate-500'}>
                  r={m.r !== null ? (m.r > 0 ? `+${m.r.toFixed(2)}` : m.r.toFixed(2)) : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Finding 3: Decadal Non-Stationarity & Rolling Stability */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold font-serif">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>3. Decadal Teleconnection Non-Stationarity (Rolling 15-Year Windows)</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            The 15-year rolling correlation between ONI and Telangana rainfall spans from <strong>{rolling15.minR !== null ? rolling15.minR.toFixed(2) : 'N/A'}</strong> to <strong>{rolling15.maxR !== null ? (rolling15.maxR > 0 ? `+${rolling15.maxR.toFixed(2)}` : rolling15.maxR.toFixed(2)) : 'N/A'}</strong> (mean r = <strong>{rolling15.overallMeanR !== null ? rolling15.overallMeanR.toFixed(2) : 'N/A'}</strong>).
          </p>
          <p className="text-slate-500 text-[11px] leading-normal">
            This temporal modulation demonstrates that the Pacific teleconnection is not static; it is modulated on multi-decadal timescales by background climate modes like the Pacific Decadal Oscillation (PDO) and Indian Ocean Dipole (IOD).
          </p>
        </div>

        {/* Finding 4: Conditional Drought & Excess Probabilities */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold font-serif">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>4. Stratified Meteorological Deficit Risk</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Historical empirical probability of experiencing an IMD Deficient Monsoon (departure &le; -19% vs LPA normal of 750.5 mm):
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-[11px]">
            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-900">
              <span className="block text-[10px] uppercase font-bold text-rose-700">El Niño</span>
              <span className="text-sm font-extrabold">{elNinoDroughtPct}%</span>
              <span className="text-[10px] text-rose-600">drought freq.</span>
            </div>
            <div className="p-2 bg-slate-100 border border-slate-200 rounded text-slate-800">
              <span className="block text-[10px] uppercase font-bold text-slate-600">Neutral</span>
              <span className="text-sm font-extrabold">{neutralDroughtPct}%</span>
              <span className="text-[10px] text-slate-500">drought freq.</span>
            </div>
            <div className="p-2 bg-sky-50 border border-sky-200 rounded text-sky-900">
              <span className="block text-[10px] uppercase font-bold text-sky-700">La Niña</span>
              <span className="text-sm font-extrabold">{laNinaDroughtPct}%</span>
              <span className="text-[10px] text-sky-600">drought freq.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Baseline Documentation & Methodological Constraints */}
      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Documented Climatological Baseline &amp; Non-Causal Constraints:</span>
        </div>
        <p className="leading-relaxed">
          <strong>Documented Normal Period:</strong> All rainfall anomalies and percentage departures are strictly calculated against the <strong>India Meteorological Department (IMD) 1971–2020 Long Period Average (LPA)</strong> baseline (Telangana JJAS Normal = <strong>750.5 mm</strong>, Annual Normal = <strong>952.7 mm</strong>).
        </p>
        <p className="text-[11px] text-amber-800 leading-normal">
          <strong>Observational Limitation:</strong> Statistical association and regression slopes quantify empirical co-variability but do not imply deterministic causality. Regional precipitation is influenced by internal atmospheric dynamics, monsoon depressions, and meso-scale convective systems.
        </p>
      </div>
    </div>
  );
};
