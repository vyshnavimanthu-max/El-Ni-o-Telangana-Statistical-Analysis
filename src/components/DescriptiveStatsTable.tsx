import React, { useState } from 'react';
import { Calculator, BarChart3, Info, ChevronRight } from 'lucide-react';
import { MergedClimateCropRecord } from '../types/dataset';
import { calculateDescriptiveStats } from '../statistics/engine';

interface DescriptiveStatsTableProps {
  data: MergedClimateCropRecord[];
}

type VariableKey = 
  | 'rainfallJjasMm'
  | 'rainfallAnomalyPercent'
  | 'meanMaxTempC'
  | 'tempMaxAnomalyC'
  | 'oniJjas'
  | 'oniNdj'
  | 'cottonYieldKgHa'
  | 'paddyYieldKgHa'
  | 'maizeYieldKgHa'
  | 'redgramYieldKgHa'
  | 'soyabeanYieldKgHa';

interface VariableOption {
  key: VariableKey;
  label: string;
  unit: string;
  category: 'Climatology' | 'ENSO Oceanic' | 'Agriculture';
}

const VARIABLE_OPTIONS: VariableOption[] = [
  { key: 'rainfallJjasMm', label: 'Southwest Monsoon Rainfall (JJAS)', unit: 'mm', category: 'Climatology' },
  { key: 'rainfallAnomalyPercent', label: 'Monsoon Rainfall Departure / Anomaly', unit: '%', category: 'Climatology' },
  { key: 'meanMaxTempC', label: 'Monsoon Mean Maximum Temperature (T_max)', unit: '°C', category: 'Climatology' },
  { key: 'tempMaxAnomalyC', label: 'Mean Maximum Temperature Anomaly', unit: '°C', category: 'Climatology' },
  { key: 'oniJjas', label: 'Oceanic Niño Index (JJAS Monsoon Concurrent)', unit: '°C', category: 'ENSO Oceanic' },
  { key: 'oniNdj', label: 'Oceanic Niño Index (NDJ Peak Winter)', unit: '°C', category: 'ENSO Oceanic' },
  { key: 'cottonYieldKgHa', label: 'Cotton Productivity (Lint)', unit: 'kg/ha', category: 'Agriculture' },
  { key: 'paddyYieldKgHa', label: 'Paddy / Rice Productivity', unit: 'kg/ha', category: 'Agriculture' },
  { key: 'maizeYieldKgHa', label: 'Maize Productivity (Corn)', unit: 'kg/ha', category: 'Agriculture' },
  { key: 'redgramYieldKgHa', label: 'Red Gram / Tur Productivity (Pulses)', unit: 'kg/ha', category: 'Agriculture' },
  { key: 'soyabeanYieldKgHa', label: 'Soyabean Productivity (Oilseeds)', unit: 'kg/ha', category: 'Agriculture' },
];

export const DescriptiveStatsTable: React.FC<DescriptiveStatsTableProps> = ({ data }) => {
  const [selectedKey, setSelectedKey] = useState<VariableKey>('rainfallAnomalyPercent');

  const currentOption = VARIABLE_OPTIONS.find(o => o.key === selectedKey) || VARIABLE_OPTIONS[0];
  const seriesValues = data.map(d => d[selectedKey] as number | null | undefined);
  const stats = calculateDescriptiveStats(seriesValues, currentOption.label, currentOption.unit);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal-50 text-teal-700 rounded-md border border-teal-200">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-serif">
              Parametric & Non-Parametric Descriptive Statistics
            </h3>
            <p className="text-xs text-slate-500">
              Live mathematical derivation of central tendency, dispersion, higher-order moments & 95% confidence intervals
            </p>
          </div>
        </div>

        {/* Variable Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="desc-var-select" className="text-xs font-medium text-slate-600">
            Select Metric:
          </label>
          <select
            id="desc-var-select"
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value as VariableKey)}
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
          >
            {VARIABLE_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>
                [{opt.category}] {opt.label} ({opt.unit})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Structured Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Sample Size */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] font-mono uppercase text-slate-500 block">Sample Size (N)</span>
          <span className="text-lg font-bold font-mono text-slate-900">{stats.sampleSize}</span>
          <span className="text-[10px] text-slate-400 block">Annual observations</span>
        </div>

        {/* Arithmetic Mean */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] font-mono uppercase text-slate-500 block">Mean (μ / x̄)</span>
          <span className="text-lg font-bold font-mono text-teal-800">
            {stats.mean !== null ? stats.mean : '—'} <span className="text-xs font-normal text-slate-500">{stats.unit}</span>
          </span>
          <span className="text-[10px] text-slate-400 block">Arithmetic average</span>
        </div>

        {/* Median */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] font-mono uppercase text-slate-500 block">Median (Q2)</span>
          <span className="text-lg font-bold font-mono text-slate-900">
            {stats.median !== null ? stats.median : '—'} <span className="text-xs font-normal text-slate-500">{stats.unit}</span>
          </span>
          <span className="text-[10px] text-slate-400 block">50th percentile</span>
        </div>

        {/* Standard Deviation */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] font-mono uppercase text-slate-500 block">Std Deviation (s)</span>
          <span className="text-lg font-bold font-mono text-slate-900">
            {stats.standardDeviation !== null ? stats.standardDeviation : '—'} <span className="text-xs font-normal text-slate-500">{stats.unit}</span>
          </span>
          <span className="text-[10px] text-slate-400 block">Sample variability</span>
        </div>

        {/* Standard Error */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] font-mono uppercase text-slate-500 block">Std Error (SE)</span>
          <span className="text-lg font-bold font-mono text-slate-900">
            {stats.standardError !== null ? stats.standardError : '—'} <span className="text-xs font-normal text-slate-500">{stats.unit}</span>
          </span>
          <span className="text-[10px] text-slate-400 block">s / √N</span>
        </div>

        {/* 95% Confidence Interval for the Mean */}
        <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg">
          <span className="text-[11px] font-mono uppercase text-teal-800 block">95% CI for Mean</span>
          <span className="text-xs font-bold font-mono text-teal-900 block mt-1">
            {stats.confidenceInterval95Mean 
              ? `[${stats.confidenceInterval95Mean[0]}, ${stats.confidenceInterval95Mean[1]}]` 
              : '—'}
          </span>
          <span className="text-[10px] text-teal-700 block">x̄ ± t₀.₀₅,df × SE</span>
        </div>
      </div>

      {/* Comprehensive Metric Breakdown Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold font-mono">
              <th className="py-2.5 px-3">Statistical Measure</th>
              <th className="py-2.5 px-3">Mathematical Formula</th>
              <th className="py-2.5 px-3">Computed Value</th>
              <th className="py-2.5 px-3">Interpretation & Diagnostics</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-900">Sample Variance (s²)</td>
              <td className="py-2 px-3 font-mono text-slate-500">Σ(xᵢ - x̄)² / (n - 1)</td>
              <td className="py-2 px-3 font-mono font-bold">{stats.varianceSample ?? '—'}</td>
              <td className="py-2 px-3 text-slate-500">Unbiased sample variance estimator</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-900">Min / Max / Range</td>
              <td className="py-2 px-3 font-mono text-slate-500">Max(x) - Min(x)</td>
              <td className="py-2 px-3 font-mono font-bold">
                [{stats.min ?? '—'}, {stats.max ?? '—'}] • Range: {stats.range ?? '—'} {stats.unit}
              </td>
              <td className="py-2 px-3 text-slate-500">Extremum boundaries of historical record</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-900">Quartiles (Q1, Q2, Q3)</td>
              <td className="py-2 px-3 font-mono text-slate-500">25th, 50th, 75th percentiles</td>
              <td className="py-2 px-3 font-mono font-bold">
                Q1: {stats.q1 ?? '—'} | Q2: {stats.q2 ?? '—'} | Q3: {stats.q3 ?? '—'}
              </td>
              <td className="py-2 px-3 text-slate-500">Linear rank interpolation</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-900">Interquartile Range (IQR)</td>
              <td className="py-2 px-3 font-mono text-slate-500">IQR = Q3 - Q1</td>
              <td className="py-2 px-3 font-mono font-bold">{stats.iqr ?? '—'} {stats.unit}</td>
              <td className="py-2 px-3 text-slate-500">Robust middle 50% spread resistant to outliers</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-900">Coefficient of Variation (CV)</td>
              <td className="py-2 px-3 font-mono text-slate-500">(s / |x̄|) × 100%</td>
              <td className="py-2 px-3 font-mono font-bold">{stats.coefficientOfVariationPct !== null ? `${stats.coefficientOfVariationPct}%` : '—'}</td>
              <td className="py-2 px-3 text-slate-500">
                {stats.coefficientOfVariationPct !== null && stats.coefficientOfVariationPct > 30 
                  ? 'High relative variability (>30%)' 
                  : 'Moderate to low relative dispersion'}
              </td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-900">Fisher-Pearson Skewness (g₁)</td>
              <td className="py-2 px-3 font-mono text-slate-500">[n/( (n-1)(n-2) )] Σ((xᵢ-x̄)/s)³</td>
              <td className="py-2 px-3 font-mono font-bold">
                {stats.skewness !== null ? (stats.skewness > 0 ? `+${stats.skewness}` : stats.skewness) : '—'}
              </td>
              <td className="py-2 px-3 text-slate-500">
                {stats.skewness === null ? '—' : Math.abs(stats.skewness) < 0.5 ? 'Approximately symmetric distribution' : stats.skewness > 0 ? 'Right-skewed (positive tail)' : 'Left-skewed (negative tail)'}
              </td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-900">Excess Kurtosis (g₂)</td>
              <td className="py-2 px-3 font-mono text-slate-500">Sample standardized 4th moment - 3</td>
              <td className="py-2 px-3 font-mono font-bold">
                {stats.excessKurtosis !== null ? (stats.excessKurtosis > 0 ? `+${stats.excessKurtosis}` : stats.excessKurtosis) : '—'}
              </td>
              <td className="py-2 px-3 text-slate-500">
                {stats.excessKurtosis === null ? '—' : Math.abs(stats.excessKurtosis) < 0.5 ? 'Mesokurtic (near-Gaussian tails)' : stats.excessKurtosis > 0 ? 'Leptokurtic (heavy tails / outlier prone)' : 'Platykurtic (light tails)'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
