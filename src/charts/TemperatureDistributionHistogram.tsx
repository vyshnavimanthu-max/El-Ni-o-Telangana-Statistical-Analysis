import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { MergedClimateRecord } from '../types/dataset';
import {
  calculateDescriptiveStats,
  calculateNormalityJarqueBera
} from '../statistics/engine';
import { EmptyState } from '../components/EmptyState';

interface TemperatureDistributionHistogramProps {
  data: MergedClimateRecord[];
  onConnectClick?: () => void;
  className?: string;
}

type DistVariable = 'TMAX_ABS' | 'TMAX_ANOM' | 'TMIN_ABS' | 'TMEAN_ABS' | 'TMEAN_ANOM';

export const TemperatureDistributionHistogram: React.FC<TemperatureDistributionHistogramProps> = ({
  data,
  onConnectClick,
  className = ''
}) => {
  const [selectedVar, setSelectedVar] = useState<DistVariable>('TMAX_ABS');

  const validData = useMemo(() => {
    return data.filter(d => d.meanMaxTempC !== null);
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

    const values = validData.map(getValue);
    const descStats = calculateDescriptiveStats(values, varName, unit);
    const jbTest = calculateNormalityJarqueBera(values);

    // Build Binned Histogram
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const numBins = 10;
    const binWidth = (maxVal - minVal) / numBins;

    const bins: Array<{
      binCenter: number;
      binLabel: string;
      frequency: number;
      relativeFreqPct: number;
      theoreticalNormalDensity: number;
    }> = [];

    const mean = descStats.mean ?? 0;
    const sd = descStats.standardDeviation ?? 1;

    for (let i = 0; i < numBins; i++) {
      const binLower = minVal + i * binWidth;
      const binUpper = binLower + binWidth;
      const center = (binLower + binUpper) / 2;

      // Count observations in this bin
      const count = values.filter(v => (i === numBins - 1 ? (v >= binLower && v <= binUpper) : (v >= binLower && v < binUpper))).length;
      const relFreq = (count / values.length) * 100;

      // Theoretical Normal probability density function at bin center
      // Gaussian PDF: f(x) = (1 / (sd * sqrt(2*pi))) * exp(-0.5 * ((x-mean)/sd)^2)
      // Multiply by binWidth * 100 to get expected relative frequency percentage in the bin
      const z = (center - mean) / sd;
      const normalPdf = (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
      const theoreticalPct = normalPdf * binWidth * 100;

      bins.push({
        binCenter: Number(center.toFixed(2)),
        binLabel: `${center.toFixed(1)}°C`,
        frequency: count,
        relativeFreqPct: Number(relFreq.toFixed(1)),
        theoreticalNormalDensity: Number(theoreticalPct.toFixed(1))
      });
    }

    return {
      descStats,
      jbTest,
      bins,
      varName,
      unit,
      sampleSize: values.length
    };
  }, [validData, selectedVar]);

  if (!data || !stats) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs ${className}`}>
        <h3 className="text-base font-bold text-slate-900 font-serif mb-2">
          Empirical Temperature Distribution & Normality Fit
        </h3>
        <EmptyState
          title="Awaiting Data for Distribution Plotting"
          message="Connect official IMD temperature dataset to evaluate empirical frequency histogram and Gaussian curve."
          onConnectClick={onConnectClick}
        />
      </div>
    );
  }

  const { descStats, jbTest, bins, varName, unit, sampleSize } = stats;

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 bg-amber-50 text-amber-900 rounded border border-amber-200 uppercase">
              Distribution & Normality
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Sample N = {sampleSize} annual records
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            Empirical Distribution of {varName}
          </h3>
          <p className="text-xs text-slate-500">
            Empirical frequency histogram compared with fitted theoretical Gaussian (Normal) probability density function
          </p>
        </div>

        {/* Variable Switcher */}
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
            T_max
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
            T_mean
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
            T_min
          </button>
        </div>
      </div>

      {/* Normality & Moment Metrics Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
        <div>
          <span className="text-slate-500 block text-[11px]">Mean ± SD</span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {descStats.mean?.toFixed(2)} ± {descStats.standardDeviation?.toFixed(2)}{unit}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Median = {descStats.median?.toFixed(2)}{unit}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px]">Sample Skewness (g₁)</span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {descStats.skewness !== null ? `${descStats.skewness > 0 ? '+' : ''}${descStats.skewness.toFixed(3)}` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {Math.abs(descStats.skewness ?? 0) < 0.5 ? 'Approximately Symmetric' : descStats.skewness! > 0 ? 'Right-Skewed (Warm Tail)' : 'Left-Skewed'}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px]">Excess Kurtosis (g₂)</span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {descStats.excessKurtosis !== null ? `${descStats.excessKurtosis > 0 ? '+' : ''}${descStats.excessKurtosis.toFixed(3)}` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {Math.abs(descStats.excessKurtosis ?? 0) < 0.5 ? 'Mesokurtic (Normal Tails)' : descStats.excessKurtosis! > 0 ? 'Leptokurtic (Heavy Tails)' : 'Platykurtic'}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px]">Jarque-Bera Normality Test</span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            JB = {jbTest.jarqueBeraStatistic?.toFixed(2)}
          </span>
          <span className={`text-[10px] font-bold block ${jbTest.isNormallyDistributed ? 'text-emerald-700' : 'text-amber-700'}`}>
            {jbTest.isNormallyDistributed ? 'Normal (p > 0.05)' : 'Non-Normal (p ≤ 0.05)'} (p = {jbTest.pValue?.toFixed(3)})
          </span>
        </div>
      </div>

      {/* Composed Histogram & Normal Curve */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={bins} margin={{ top: 15, right: 25, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="binLabel"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
              label={{ value: `${varName} (${unit})`, position: 'insideBottom', offset: -12, fill: '#475569', fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
              unit="%"
              label={{ value: 'Relative Frequency (%)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1 min-w-[190px]">
                    <span className="font-bold text-amber-400 block font-mono">Bin Center: {d.binLabel}</span>
                    <div className="space-y-0.5 text-[11px]">
                      <div>Empirical Count: <strong className="text-white">{d.frequency} observations ({d.relativeFreqPct}%)</strong></div>
                      <div>Fitted Gaussian Density: <strong className="text-rose-300">{d.theoreticalNormalDensity}%</strong></div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

            <Bar
              dataKey="relativeFreqPct"
              name="Empirical Relative Frequency (%)"
              fill="#fb7185"
              stroke="#e11d48"
              strokeWidth={1}
              radius={[3, 3, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="theoreticalNormalDensity"
              name="Theoretical Fitted Gaussian PDF"
              stroke="#0f172a"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#0f172a' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
