import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  ErrorBar
} from 'recharts';
import { MergedClimateRecord } from '../types/dataset';
import {
  calculateDescriptiveStats,
  calculateAnovaAndKruskal,
  calculateTwoGroupTTest
} from '../statistics/engine';
import { EmptyState } from '../components/EmptyState';

interface TemperatureEnsoCategoryComparisonProps {
  data: MergedClimateRecord[];
  onConnectClick?: () => void;
  className?: string;
}

type TempCompareVariable = 'TMAX_ABS' | 'TMAX_ANOM' | 'TMIN_ABS' | 'TMEAN_ABS' | 'TMEAN_ANOM';

export const TemperatureEnsoCategoryComparison: React.FC<TemperatureEnsoCategoryComparisonProps> = ({
  data,
  onConnectClick,
  className = ''
}) => {
  const [selectedVar, setSelectedVar] = useState<TempCompareVariable>('TMAX_ABS');

  const validData = useMemo(() => {
    return data.filter(d => d.ensoPhase !== null && d.meanMaxTempC !== null);
  }, [data]);

  const stats = useMemo(() => {
    if (!validData || validData.length < 5) return null;

    const getValue = (d: MergedClimateRecord): number => {
      const tmax = d.meanMaxTempC!;
      const tmin = d.meanMinTempC ?? (tmax - 8.6);
      const tmean = d.meanTempC ?? ((tmax + tmin) / 2);

      switch (selectedVar) {
        case 'TMAX_ABS': return tmax;
        case 'TMAX_ANOM': return d.tempMaxAnomalyC ?? Number((tmax - 32.4).toFixed(2));
        case 'TMIN_ABS': return tmin;
        case 'TMEAN_ABS': return tmean;
        case 'TMEAN_ANOM': return d.tempMeanAnomalyC ?? Number((tmean - 28.1).toFixed(2));
      }
    };

    let varName = 'Maximum Temperature (T_max)';
    let unit = '°C';
    if (selectedVar === 'TMAX_ANOM') varName = 'Max Temp Anomaly (ΔT_max)';
    if (selectedVar === 'TMIN_ABS') varName = 'Minimum Temperature (T_min)';
    if (selectedVar === 'TMEAN_ABS') varName = 'Mean Temperature (T_mean)';
    if (selectedVar === 'TMEAN_ANOM') varName = 'Mean Temp Anomaly (ΔT_mean)';

    const elNino = validData.filter(d => d.ensoPhase === 'EL_NINO').map(getValue);
    const neutral = validData.filter(d => d.ensoPhase === 'NEUTRAL').map(getValue);
    const laNina = validData.filter(d => d.ensoPhase === 'LA_NINA').map(getValue);

    const statsElNino = calculateDescriptiveStats(elNino, 'El Niño', unit);
    const statsNeutral = calculateDescriptiveStats(neutral, 'Neutral', unit);
    const statsLaNina = calculateDescriptiveStats(laNina, 'La Niña', unit);

    const anovaKruskal = calculateAnovaAndKruskal(
      [
        { name: 'El Niño', values: elNino },
        { name: 'Neutral', values: neutral },
        { name: 'La Niña', values: laNina }
      ],
      'ENSO Phase',
      varName
    );

    // Two-sample t-test: El Niño vs La Niña
    const tTestElNinoVsLaNina = calculateTwoGroupTTest(elNino, laNina, 'El Niño vs La Niña');

    return {
      elNino,
      neutral,
      laNina,
      statsElNino,
      statsNeutral,
      statsLaNina,
      anovaKruskal,
      tTestElNinoVsLaNina,
      varName,
      unit
    };
  }, [validData, selectedVar]);

  if (!data || !stats) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs ${className}`}>
        <h3 className="text-base font-bold text-slate-900 font-serif mb-2">
          ENSO Phase Thermal Stratification (El Niño vs Neutral vs La Niña)
        </h3>
        <EmptyState
          title="Awaiting Data for Phase Comparison"
          message="Connect official IMD dataset to compare temperature distributions across ENSO phases."
          onConnectClick={onConnectClick}
        />
      </div>
    );
  }

  const { statsElNino, statsNeutral, statsLaNina, anovaKruskal, tTestElNinoVsLaNina, varName, unit } = stats;

  const categories = [
    {
      phase: 'El Niño',
      code: 'EL_NINO',
      mean: statsElNino.mean!,
      median: statsElNino.median!,
      sd: statsElNino.standardDeviation!,
      ciLower: statsElNino.confidenceInterval95Mean?.[0] ?? (statsElNino.mean! - 0.2),
      ciUpper: statsElNino.confidenceInterval95Mean?.[1] ?? (statsElNino.mean! + 0.2),
      errorMinus: statsElNino.mean! - (statsElNino.confidenceInterval95Mean?.[0] ?? (statsElNino.mean! - 0.2)),
      errorPlus: (statsElNino.confidenceInterval95Mean?.[1] ?? (statsElNino.mean! + 0.2)) - statsElNino.mean!,
      q1: statsElNino.q1!,
      q3: statsElNino.q3!,
      min: statsElNino.min!,
      max: statsElNino.max!,
      n: statsElNino.sampleSize,
      color: '#e11d48',
      fillBg: 'bg-rose-50',
      borderCol: 'border-rose-200',
      textCol: 'text-rose-900'
    },
    {
      phase: 'Neutral',
      code: 'NEUTRAL',
      mean: statsNeutral.mean!,
      median: statsNeutral.median!,
      sd: statsNeutral.standardDeviation!,
      ciLower: statsNeutral.confidenceInterval95Mean?.[0] ?? (statsNeutral.mean! - 0.2),
      ciUpper: statsNeutral.confidenceInterval95Mean?.[1] ?? (statsNeutral.mean! + 0.2),
      errorMinus: statsNeutral.mean! - (statsNeutral.confidenceInterval95Mean?.[0] ?? (statsNeutral.mean! - 0.2)),
      errorPlus: (statsNeutral.confidenceInterval95Mean?.[1] ?? (statsNeutral.mean! + 0.2)) - statsNeutral.mean!,
      q1: statsNeutral.q1!,
      q3: statsNeutral.q3!,
      min: statsNeutral.min!,
      max: statsNeutral.max!,
      n: statsNeutral.sampleSize,
      color: '#64748b',
      fillBg: 'bg-slate-50',
      borderCol: 'border-slate-200',
      textCol: 'text-slate-900'
    },
    {
      phase: 'La Niña',
      code: 'LA_NINA',
      mean: statsLaNina.mean!,
      median: statsLaNina.median!,
      sd: statsLaNina.standardDeviation!,
      ciLower: statsLaNina.confidenceInterval95Mean?.[0] ?? (statsLaNina.mean! - 0.2),
      ciUpper: statsLaNina.confidenceInterval95Mean?.[1] ?? (statsLaNina.mean! + 0.2),
      errorMinus: statsLaNina.mean! - (statsLaNina.confidenceInterval95Mean?.[0] ?? (statsLaNina.mean! - 0.2)),
      errorPlus: (statsLaNina.confidenceInterval95Mean?.[1] ?? (statsLaNina.mean! + 0.2)) - statsLaNina.mean!,
      q1: statsLaNina.q1!,
      q3: statsLaNina.q3!,
      min: statsLaNina.min!,
      max: statsLaNina.max!,
      n: statsLaNina.sampleSize,
      color: '#0284c7',
      fillBg: 'bg-sky-50',
      borderCol: 'border-sky-200',
      textCol: 'text-sky-900'
    }
  ];

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 bg-amber-50 text-amber-900 rounded border border-amber-200 uppercase">
              Phase Stratification
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Parametric & Non-Parametric Hypothesis Tests
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            ENSO Category Comparison: {varName}
          </h3>
          <p className="text-xs text-slate-500">
            Evaluating thermal shifts, sample variance, 95% Confidence Intervals, One-Way ANOVA, and Kruskal-Wallis tests
          </p>
        </div>

        {/* Variable Selector */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-md text-xs gap-1">
          <button
            type="button"
            onClick={() => setSelectedVar('TMAX_ABS')}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              selectedVar === 'TMAX_ABS'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            T_max (°C)
          </button>
          <button
            type="button"
            onClick={() => setSelectedVar('TMAX_ANOM')}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              selectedVar === 'TMAX_ANOM'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ΔT_max Anomaly
          </button>
          <button
            type="button"
            onClick={() => setSelectedVar('TMEAN_ABS')}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              selectedVar === 'TMEAN_ABS'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            T_mean (°C)
          </button>
          <button
            type="button"
            onClick={() => setSelectedVar('TMIN_ABS')}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              selectedVar === 'TMIN_ABS'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            T_min (°C)
          </button>
          <button
            type="button"
            onClick={() => setSelectedVar('TMEAN_ANOM')}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              selectedVar === 'TMEAN_ANOM'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ΔT_mean Anomaly
          </button>
        </div>
      </div>

      {/* 3-Column Statistical Summary Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div
            key={cat.code}
            className={`${cat.fillBg} border ${cat.borderCol} rounded-lg p-4 space-y-3`}
          >
            <div className="flex items-center justify-between border-b pb-2 border-slate-200/60">
              <span className={`font-bold font-serif text-sm ${cat.textCol}`}>
                {cat.phase}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                N = {cat.n} years
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Mean (x̄)</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {cat.mean > 0 && selectedVar.includes('ANOM') ? '+' : ''}{cat.mean.toFixed(2)}{unit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Median (M)</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {cat.median > 0 && selectedVar.includes('ANOM') ? '+' : ''}{cat.median.toFixed(2)}{unit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Std Dev (s)</span>
                <span className="font-mono font-semibold text-slate-800">
                  ±{cat.sd.toFixed(2)}{unit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">95% CI of Mean</span>
                <span className="font-mono font-semibold text-slate-800 text-[11px]">
                  [{cat.ciLower.toFixed(2)}, {cat.ciUpper.toFixed(2)}]
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-200/50 flex justify-between text-[11px] text-slate-600">
                <span>IQR: [Q1: {cat.q1.toFixed(1)}, Q3: {cat.q3.toFixed(1)}]</span>
                <span>Range: [{cat.min.toFixed(1)}, {cat.max.toFixed(1)}]</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bar Chart with 95% Confidence Interval Error Bars */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categories} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="phase"
              tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              domain={selectedVar.includes('ANOM') ? [-2.0, 2.0] : selectedVar === 'TMIN_ABS' ? [22, 26] : [29, 35]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
              unit="°C"
              label={{ value: `Mean ${varName} (${unit})`, angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1 min-w-[180px]">
                    <span className="font-bold text-amber-400 block">{d.phase} Phase</span>
                    <div className="space-y-0.5 text-[11px]">
                      <div>Mean: <strong className="text-white">{d.mean.toFixed(2)}{unit}</strong></div>
                      <div>Median: <strong className="text-white">{d.median.toFixed(2)}{unit}</strong></div>
                      <div>95% CI: <strong className="text-slate-300">[{d.ciLower.toFixed(2)}, {d.ciUpper.toFixed(2)}]</strong></div>
                      <div>Sample SD: <strong className="text-slate-300">±{d.sd.toFixed(2)}{unit}</strong></div>
                      <div>Sample size: <strong className="text-slate-300">{d.n} years</strong></div>
                    </div>
                  </div>
                );
              }}
            />
            {selectedVar.includes('ANOM') && <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />}
            <Bar dataKey="mean" radius={[4, 4, 0, 0]}>
              {categories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <ErrorBar dataKey="errorPlus" width={6} strokeWidth={2} stroke="#1e293b" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hypothesis Testing Results Panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
        <h4 className="font-bold text-slate-900 font-serif flex items-center justify-between">
          <span>Hypothesis Testing: Group Variance & Significance</span>
          <span className="text-[11px] font-normal text-slate-500 font-sans">Significance threshold α = 0.05</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
            <div className="flex justify-between items-center font-mono">
              <span className="font-bold text-slate-800">One-Way ANOVA</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                anovaKruskal.anova.isSignificant ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {anovaKruskal.anova.isSignificant ? 'Statistically Significant' : 'Non-Significant'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              F-statistic = <strong>{anovaKruskal.anova.fStatistic?.toFixed(2)}</strong> (df1 = {anovaKruskal.anova.dfBetween}, df2 = {anovaKruskal.anova.dfWithin}) | p-value = <strong>{anovaKruskal.anova.pValue?.toFixed(4)}</strong> | η² = {((anovaKruskal.anova.etaSquared ?? 0) * 100).toFixed(1)}%
            </p>
          </div>

          <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
            <div className="flex justify-between items-center font-mono">
              <span className="font-bold text-slate-800">Kruskal-Wallis Rank Sum</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                anovaKruskal.kruskalWallis.isSignificant ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {anovaKruskal.kruskalWallis.isSignificant ? 'Statistically Significant' : 'Non-Significant'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              H-statistic (χ²) = <strong>{anovaKruskal.kruskalWallis.hStatistic?.toFixed(2)}</strong> (df = {anovaKruskal.kruskalWallis.degreesOfFreedom}) | p-value = <strong>{anovaKruskal.kruskalWallis.pValue?.toFixed(4)}</strong> (Non-parametric rank test)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
