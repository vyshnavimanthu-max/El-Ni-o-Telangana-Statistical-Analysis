import React, { useState } from 'react';
import { Network, Activity, HelpCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { MergedClimateCropRecord } from '../types/dataset';
import { calculatePearsonAndSpearman } from '../statistics/engine';

interface CorrelationWorkbenchProps {
  data: MergedClimateCropRecord[];
}

interface CorrelationPairOption {
  id: string;
  name: string;
  varAKey: keyof MergedClimateCropRecord;
  varBKey: keyof MergedClimateCropRecord;
  varAName: string;
  varBName: string;
  category: 'Oceanic-Atmospheric' | 'Climate-Agronomic' | 'Agronomic-Yield';
}

const PAIR_OPTIONS: CorrelationPairOption[] = [
  {
    id: 'oni_rainfall',
    name: 'ONI JJAS vs Monsoon Rainfall Anomaly (%)',
    varAKey: 'oniJjas',
    varBKey: 'rainfallAnomalyPercent',
    varAName: 'Oceanic Niño Index (JJAS °C)',
    varBName: 'Monsoon Rainfall Departure (%)',
    category: 'Oceanic-Atmospheric'
  },
  {
    id: 'oni_temp',
    name: 'ONI JJAS vs Daytime Max Temperature (°C)',
    varAKey: 'oniJjas',
    varBKey: 'meanMaxTempC',
    varAName: 'Oceanic Niño Index (JJAS °C)',
    varBName: 'Mean Maximum Temperature (°C)',
    category: 'Oceanic-Atmospheric'
  },
  {
    id: 'oni_cotton',
    name: 'ONI JJAS vs Cotton Productivity (kg/ha)',
    varAKey: 'oniJjas',
    varBKey: 'cottonYieldKgHa',
    varAName: 'Oceanic Niño Index (JJAS °C)',
    varBName: 'Cotton Productivity (kg/ha)',
    category: 'Climate-Agronomic'
  },
  {
    id: 'oni_paddy',
    name: 'ONI JJAS vs Paddy Productivity (kg/ha)',
    varAKey: 'oniJjas',
    varBKey: 'paddyYieldKgHa',
    varAName: 'Oceanic Niño Index (JJAS °C)',
    varBName: 'Paddy Productivity (kg/ha)',
    category: 'Climate-Agronomic'
  },
  {
    id: 'oni_maize',
    name: 'ONI JJAS vs Maize Productivity (kg/ha)',
    varAKey: 'oniJjas',
    varBKey: 'maizeYieldKgHa',
    varAName: 'Oceanic Niño Index (JJAS °C)',
    varBName: 'Maize Productivity (kg/ha)',
    category: 'Climate-Agronomic'
  },
  {
    id: 'rainfall_cotton',
    name: 'Monsoon Rainfall Total vs Cotton Productivity',
    varAKey: 'rainfallJjasMm',
    varBKey: 'cottonYieldKgHa',
    varAName: 'Monsoon Rainfall (mm)',
    varBName: 'Cotton Productivity (kg/ha)',
    category: 'Agronomic-Yield'
  },
  {
    id: 'rainfall_paddy',
    name: 'Monsoon Rainfall Total vs Paddy Productivity',
    varAKey: 'rainfallJjasMm',
    varBKey: 'paddyYieldKgHa',
    varAName: 'Monsoon Rainfall (mm)',
    varBName: 'Paddy Productivity (kg/ha)',
    category: 'Agronomic-Yield'
  },
  {
    id: 'temp_cotton',
    name: 'Daytime Max Temperature vs Cotton Productivity',
    varAKey: 'meanMaxTempC',
    varBKey: 'cottonYieldKgHa',
    varAName: 'Mean Maximum Temp (°C)',
    varBName: 'Cotton Productivity (kg/ha)',
    category: 'Agronomic-Yield'
  }
];

export const CorrelationWorkbench: React.FC<CorrelationWorkbenchProps> = ({ data }) => {
  const [selectedPairId, setSelectedPairId] = useState<string>('oni_rainfall');

  const currentPair = PAIR_OPTIONS.find(p => p.id === selectedPairId) || PAIR_OPTIONS[0];

  const seriesA = data.map(d => d[currentPair.varAKey] as number | null | undefined);
  const seriesB = data.map(d => d[currentPair.varBKey] as number | null | undefined);

  const corr = calculatePearsonAndSpearman(seriesA, seriesB, currentPair.varAName, currentPair.varBName);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-serif">
              Bivariate Correlation Workbench (Pearson r & Spearman ρ)
            </h3>
            <p className="text-xs text-slate-500">
              Parametric and rank correlation coefficients with exact Student's t-test p-values & Fisher 95% CIs
            </p>
          </div>
        </div>

        {/* Pair Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="corr-pair-select" className="text-xs font-medium text-slate-600">
            Select Variable Pair:
          </label>
          <select
            id="corr-pair-select"
            value={selectedPairId}
            onChange={(e) => setSelectedPairId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            {PAIR_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>
                [{opt.category}] {opt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Structured Statistical Output Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pearson Product-Moment Card */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-bold text-slate-900 font-serif">
              Pearson Product-Moment Correlation (r)
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
              corr.isStatisticallySignificant ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {corr.isStatisticallySignificant ? 'Significant (p < 0.05)' : 'Not Significant (p ≥ 0.05)'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">Pearson r</span>
              <span className="text-base font-bold text-indigo-900">
                {corr.pearsonR !== null ? `${corr.pearsonR > 0 ? '+' : ''}${corr.pearsonR}` : '—'}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">p-Value (Two-Tailed)</span>
              <span className={`text-base font-bold ${corr.isStatisticallySignificant ? 'text-emerald-700' : 'text-slate-700'}`}>
                {corr.pValuePearson !== null ? corr.pValuePearson : '—'}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">Shared Variance (R²)</span>
              <span className="text-base font-bold text-slate-900">
                {corr.rSquared !== null ? `${(corr.rSquared * 100).toFixed(1)}%` : '—'}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">t-Statistic</span>
              <span className="text-slate-800">{corr.tStatisticPearson ?? '—'}</span>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">Degrees of Freedom</span>
              <span className="text-slate-800">df = {corr.degreesOfFreedom ?? '—'}</span>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">Sample Size (N)</span>
              <span className="text-slate-800">N = {corr.sampleSize}</span>
            </div>
          </div>

          <div className="p-2.5 bg-indigo-50/50 rounded border border-indigo-100 text-xs">
            <span className="font-semibold text-indigo-950 block mb-0.5">Fisher's Z-Transformed 95% Confidence Interval:</span>
            <span className="font-mono text-indigo-900 font-bold">
              {corr.confidenceInterval95 ? `[${corr.confidenceInterval95[0]}, ${corr.confidenceInterval95[1]}]` : '—'}
            </span>
          </div>
        </div>

        {/* Spearman Rank Card */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-bold text-slate-900 font-serif">
              Spearman Rank Correlation (ρ / r_s)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
              Non-Parametric Monotonicity
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">Spearman ρ</span>
              <span className="text-base font-bold text-indigo-900">
                {corr.spearmanRho !== null ? `${corr.spearmanRho > 0 ? '+' : ''}${corr.spearmanRho}` : '—'}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">p-Value (ρ)</span>
              <span className="text-base font-bold text-slate-800">
                {corr.pValueSpearman !== null ? corr.pValueSpearman : '—'}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">Sample Covariance</span>
              <span className="text-base font-bold text-slate-900">
                {corr.covariance !== null ? corr.covariance : '—'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-600 space-y-1">
            <strong className="text-slate-800 block">Monotonic Rank Assessment:</strong>
            <p>
              Spearman rank correlation evaluates monotonic association without requiring bivariate normality or linear proportionality, making it robust against extreme climatological outlier years.
            </p>
          </div>
        </div>
      </div>

      {/* Plain-English Interpretation */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1.5">
        <div className="flex items-center gap-1.5 text-slate-900 font-bold font-sans">
          <Activity className="w-3.5 h-3.5 text-indigo-600" />
          <span>Empirical Statistical Interpretation:</span>
        </div>
        <p className="leading-relaxed">
          {corr.interpretation}
        </p>
      </div>

      {/* Causation vs Correlation Epistemological Boundary */}
      <div className="flex items-start gap-2.5 p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-sans font-semibold">Methodological Caveat: Correlation vs Causal Inference</strong>
          <p className="mt-0.5 text-amber-800">
            {corr.causationWarning} Teleconnection mechanisms operate through coupled Walker circulation shifts, Indian Ocean Dipole (+IOD) interactions, and synoptic monsoon depressions. Co-movement does not imply unmediated bivariate cause-and-effect.
          </p>
        </div>
      </div>
    </div>
  );
};
