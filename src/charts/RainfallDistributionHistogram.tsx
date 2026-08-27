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
  ReferenceLine
} from 'recharts';
import { RainfallObservation } from '../types/climate';
import { calculateHistogramData } from '../statistics/engine';
import { EmptyState } from '../components/EmptyState';
import { SourceBadge } from '../components/SourceBadge';
import { RainfallVariableKey, RAINFALL_VARIABLES } from './RainfallTimeSeriesChart';
import { BarChart3, Activity } from 'lucide-react';

interface RainfallDistributionHistogramProps {
  data: RainfallObservation[];
  onConnectClick?: () => void;
  className?: string;
}

export const RainfallDistributionHistogram: React.FC<RainfallDistributionHistogramProps> = ({
  data,
  onConnectClick,
  className = ''
}) => {
  const [selectedVariable, setSelectedVariable] = useState<RainfallVariableKey>('JJAS');
  const [unitMode, setUnitMode] = useState<'MM' | 'PERCENT'>('MM');
  const [binCount, setBinCount] = useState<number>(10);

  const varConfig = RAINFALL_VARIABLES[selectedVariable];

  const seriesValues = useMemo(() => {
    if (!data) return [];
    return data
      .map(d => {
        const val = varConfig.getter(d);
        if (val === null || val === undefined || isNaN(val)) return null;
        if (unitMode === 'PERCENT') {
          return ((val - varConfig.normalMm) / varConfig.normalMm) * 100;
        }
        return val;
      })
      .filter((v): v is number => v !== null);
  }, [data, varConfig, unitMode]);

  const histogramStats = useMemo(() => {
    return calculateHistogramData(seriesValues, binCount);
  }, [seriesValues, binCount]);

  if (!data || seriesValues.length < 5) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Precipitation Probability Distribution Histogram
            </h3>
            <p className="text-xs text-slate-500">
              Empirical frequency histogram and fitted theoretical Gaussian probability density function
            </p>
          </div>
        </div>
        <EmptyState
          title="Awaiting Longitudinal Rainfall Series"
          message="Connect official dataset to compute the empirical distribution histogram, skewness, kurtosis, and Jarque-Bera normality tests."
          sourceAuthority="IMD National Gridded Data"
          requiredSchema={['Precipitation_mm', 'LPA_Baseline']}
          onConnectClick={onConnectClick}
        />
        <div className="mt-3">
          <SourceBadge
            source="India Meteorological Department (IMD)"
            period="Awaiting connection"
            units="Frequency Count (%)"
            observationCount={null}
          />
        </div>
      </div>
    );
  }

  const {
    bins,
    mean,
    median,
    stdDev,
    variance,
    skewness,
    excessKurtosis,
    sampleSize,
    jarqueBeraStat,
    jarqueBeraPValue,
    isNormallyDistributed
  } = histogramStats;

  const cv = mean !== null && stdDev !== null && mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : null;

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase bg-teal-50 text-teal-800 px-2 py-0.5 rounded font-semibold border border-teal-200">
              Empirical Probability Distribution
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Sample N = {sampleSize} years | {binCount} equal-width bins
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            Telangana {varConfig.shortLabel} Distribution &amp; Normality
          </h3>
          <p className="text-xs text-slate-500">
            Evaluating Gaussian conformance: Testing for skewness (asymmetry) and kurtosis (tail fatness) in regional precipitation.
          </p>
        </div>

        {/* Units and Bin Count Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unit Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setUnitMode('MM')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                unitMode === 'MM' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Precipitation (mm)
            </button>
            <button
              type="button"
              onClick={() => setUnitMode('PERCENT')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                unitMode === 'PERCENT' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Departure (%)
            </button>
          </div>

          {/* Bin Selectors */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px]">Bins:</span>
            {[8, 10, 12, 15].map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setBinCount(b)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono border ${
                  binCount === b ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Intra-seasonal Variable Selector */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(Object.keys(RAINFALL_VARIABLES) as RainfallVariableKey[]).map(key => {
          const cfg = RAINFALL_VARIABLES[key];
          const isSelected = selectedVariable === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedVariable(key)}
              className={`px-2.5 py-1 text-xs rounded border transition-all ${
                isSelected
                  ? 'bg-teal-50 border-teal-500 text-teal-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cfg.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Statistical Summary Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[10px] text-slate-500 font-mono block">Sample Mean (x̄)</span>
          <span className="text-sm font-bold font-mono text-slate-900">
            {mean !== null ? `${mean}${unitMode === 'PERCENT' ? '%' : ' mm'}` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">
            Median: {median !== null ? `${median}${unitMode === 'PERCENT' ? '%' : ' mm'}` : 'N/A'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[10px] text-slate-500 font-mono block">Std. Deviation (s)</span>
          <span className="text-sm font-bold font-mono text-slate-900">
            {stdDev !== null ? `±${stdDev}${unitMode === 'PERCENT' ? '%' : ' mm'}` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">
            Var: {variance !== null ? `${variance}` : 'N/A'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[10px] text-slate-500 font-mono block">Coeff. of Variation</span>
          <span className="text-sm font-bold font-mono text-teal-700">
            {cv !== null ? `${cv.toFixed(1)}%` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            CV = (s / x̄) × 100
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[10px] text-slate-500 font-mono block">Skewness (g₁)</span>
          <span className="text-sm font-bold font-mono text-slate-900">
            {skewness !== null ? (skewness > 0 ? `+${skewness}` : `${skewness}`) : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {skewness !== null ? (skewness > 0.5 ? 'Right skewed' : skewness < -0.5 ? 'Left skewed' : 'Symmetric') : ''}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[10px] text-slate-500 font-mono block">Excess Kurtosis (g₂)</span>
          <span className="text-sm font-bold font-mono text-slate-900">
            {excessKurtosis !== null ? (excessKurtosis > 0 ? `+${excessKurtosis}` : `${excessKurtosis}`) : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {excessKurtosis !== null ? (excessKurtosis > 0 ? 'Leptokurtic (fat tails)' : 'Platykurtic') : ''}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[10px] text-slate-500 font-mono block">Jarque-Bera Normality</span>
          <span className={`text-xs font-bold font-mono block ${isNormallyDistributed ? 'text-emerald-700' : 'text-amber-700'}`}>
            {isNormallyDistributed ? 'Gaussian Normal' : 'Non-Normal (p<0.05)'}
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">
            JB = {jarqueBeraStat}, p = {jarqueBeraPValue}
          </span>
        </div>
      </div>

      {/* Histogram Chart with Gaussian Density Overlay */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={bins} margin={{ top: 12, right: 20, left: -5, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="binLabel"
              tick={{ fontSize: 10, fill: '#64748b' }}
              angle={-20}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(v) => `${v}%`}
              label={{ value: 'Empirical & Theoretical Probability (%)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '12px', color: '#fff' }}
              formatter={(val: any, name: string, item: any) => {
                const p = item.payload;
                if (name === 'frequencyPercent') {
                  return [`${p.count} years (${val}%)`, 'Empirical Frequency'];
                }
                if (name === 'fittedGaussianDensity') {
                  return [`${val}%`, 'Fitted Normal Density'];
                }
                return [val, name];
              }}
              labelFormatter={(label) => `Interval Bin: ${label} ${unitMode === 'PERCENT' ? '%' : 'mm'}`}
            />

            {/* Empirical Frequency Bars */}
            <Bar
              dataKey="frequencyPercent"
              name="frequencyPercent"
              fill="#0d9488"
              opacity={0.85}
              radius={[3, 3, 0, 0]}
            />

            {/* Fitted Gaussian Curve */}
            <Line
              type="monotone"
              dataKey="fittedGaussianDensity"
              name="fittedGaussianDensity"
              stroke="#0f172a"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#0f172a' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Context */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] pt-2 border-t border-slate-100 text-slate-600">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#0d9488] inline-block"></span>
            <span>Empirical Frequency Histogram</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#0f172a] inline-block"></span>
            <span>Fitted Gaussian Density Curve</span>
          </span>
        </div>

        <SourceBadge
          source="India Meteorological Department (IMD) 0.25° Gridded Series"
          period="1980 – 2024"
          units="Frequency Probability (%)"
          observationCount={sampleSize}
        />
      </div>
    </div>
  );
};
