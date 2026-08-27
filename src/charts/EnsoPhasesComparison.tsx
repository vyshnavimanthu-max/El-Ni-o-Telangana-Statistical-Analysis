import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
  ErrorBar
} from 'recharts';
import { Layers, BarChart2, TrendingUp, Info } from 'lucide-react';
import { MergedClimateRecord } from '../types/dataset';
import {
  calculatePhaseSummaryStats,
  calculateOneWayAnova,
  calculateKruskalWallis,
  calculateMean,
  calculateMedian,
  calculateStdDev,
  calculateQuartiles
} from '../statistics/engine';
import { EmptyState } from '../components/EmptyState';
import { SourceBadge } from '../components/SourceBadge';

interface EnsoPhasesComparisonProps {
  data: MergedClimateRecord[];
  onConnectClick?: () => void;
  className?: string;
}

type ComparisonMetric = 'rainfall_anomaly' | 'rainfall_total' | 'temperature' | 'yield_paddy' | 'yield_cotton' | 'yield_maize';

interface PhaseDistribution {
  phase: 'EL_NINO' | 'NEUTRAL' | 'LA_NINA';
  phaseName: string;
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  ciLower95: number;
  ciUpper95: number;
  q1: number;
  q3: number;
  iqr: number;
  min: number;
  max: number;
  color: string;
}

export const EnsoPhasesComparison: React.FC<EnsoPhasesComparisonProps> = ({
  data,
  onConnectClick,
  className = ''
}) => {
  const [selectedMetric, setSelectedMetric] = useState<ComparisonMetric>('rainfall_anomaly');

  const validData = useMemo(() => {
    return data.filter(d => d.ensoPhase !== null);
  }, [data]);

  // Extract variable values
  const { metricTitle, unit, groupData, baselineVal } = useMemo(() => {
    let title = 'Monsoon Rainfall Anomaly (% departure from LPA)';
    let u = '%';
    let baseline: number | null = 0;

    const extract = (d: MergedClimateRecord): number | null => {
      switch (selectedMetric) {
        case 'rainfall_anomaly':
          title = 'Southwest Monsoon Rainfall Anomaly (% departure from LPA)';
          u = '%';
          baseline = 0;
          return d.rainfallAnomalyPercent;
        case 'rainfall_total':
          title = 'Southwest Monsoon Total Rainfall (JJAS mm)';
          u = 'mm';
          baseline = 750.5;
          return d.rainfallJjasMm;
        case 'temperature':
          title = 'Monsoon Season Mean Maximum Temperature (°C)';
          u = '°C';
          baseline = 32.4;
          return d.meanMaxTempC;
        case 'yield_paddy':
          title = 'Kharif Paddy (Rice) Yield (kg/hectare)';
          u = 'kg/ha';
          baseline = null;
          return d.paddyYieldKgHa;
        case 'yield_cotton':
          title = 'Kharif Cotton Lint Yield (kg/hectare)';
          u = 'kg/ha';
          baseline = null;
          return d.cottonYieldKgHa;
        case 'yield_maize':
          title = 'Kharif Maize Yield (kg/hectare)';
          u = 'kg/ha';
          baseline = null;
          return d.maizeYieldKgHa;
        default:
          return d.rainfallAnomalyPercent;
      }
    };

    const paired = validData
      .map(d => ({ phase: d.ensoPhase!, val: extract(d) }))
      .filter((p): p is { phase: 'EL_NINO' | 'NEUTRAL' | 'LA_NINA'; val: number } => p.val !== null);

    return {
      metricTitle: title,
      unit: u,
      groupData: paired,
      baselineVal: baseline
    };
  }, [validData, selectedMetric]);

  // Calculate detailed phase distribution metrics
  const phaseDistributions: PhaseDistribution[] = useMemo(() => {
    const phases: Array<{ id: 'EL_NINO' | 'NEUTRAL' | 'LA_NINA'; name: string; color: string }> = [
      { id: 'EL_NINO', name: 'El Niño (Warm Phase)', color: '#e11d48' },
      { id: 'NEUTRAL', name: 'Neutral Phase', color: '#64748b' },
      { id: 'LA_NINA', name: 'La Niña (Cool Phase)', color: '#0284c7' }
    ];

    return phases.map(p => {
      const vals = groupData.filter(d => d.phase === p.id).map(d => d.val).sort((a, b) => a - b);
      const n = vals.length;
      if (n === 0) {
        return {
          phase: p.id,
          phaseName: p.name,
          count: 0,
          mean: 0,
          median: 0,
          stdDev: 0,
          ciLower95: 0,
          ciUpper95: 0,
          q1: 0,
          q3: 0,
          iqr: 0,
          min: 0,
          max: 0,
          color: p.color
        };
      }

      const meanVal = calculateMean(vals) || 0;
      const medianVal = calculateMedian(vals) || 0;
      const stdVal = calculateStdDev(vals) || 0;
      const quartiles = calculateQuartiles(vals);
      const se = stdVal / Math.sqrt(n);
      const ciHalf = 1.96 * se;

      return {
        phase: p.id,
        phaseName: p.name,
        count: n,
        mean: Number(meanVal.toFixed(2)),
        median: Number(medianVal.toFixed(2)),
        stdDev: Number(stdVal.toFixed(2)),
        ciLower95: Number((meanVal - ciHalf).toFixed(2)),
        ciUpper95: Number((meanVal + ciHalf).toFixed(2)),
        q1: Number(quartiles.q1.toFixed(2)),
        q3: Number(quartiles.q3.toFixed(2)),
        iqr: Number(quartiles.iqr.toFixed(2)),
        min: Number(vals[0].toFixed(2)),
        max: Number(vals[vals.length - 1].toFixed(2)),
        color: p.color
      };
    });
  }, [groupData]);

  // Run ANOVA and Kruskal-Wallis across the 3 groups
  const anovaGroups = useMemo(() => {
    return [
      { phase: 'EL_NINO', values: groupData.filter(d => d.phase === 'EL_NINO').map(d => d.val) },
      { phase: 'NEUTRAL', values: groupData.filter(d => d.phase === 'NEUTRAL').map(d => d.val) },
      { phase: 'LA_NINA', values: groupData.filter(d => d.phase === 'LA_NINA').map(d => d.val) }
    ];
  }, [groupData]);

  const anova = useMemo(() => calculateOneWayAnova(anovaGroups, metricTitle), [anovaGroups, metricTitle]);
  const kruskal = useMemo(() => calculateKruskalWallis(anovaGroups, metricTitle), [anovaGroups, metricTitle]);

  if (!data || validData.length < 3) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              ENSO Phase Group Comparison (El Niño vs Neutral vs La Niña)
            </h3>
            <p className="text-xs text-slate-500">
              Boxplots, confidence intervals, and hypothesis tests across climate regimes
            </p>
          </div>
        </div>
        <EmptyState
          title="Awaiting Merged Observational Dataset"
          message="Connect official records to compare distributions, confidence intervals, and compute ANOVA/Kruskal-Wallis tests."
          sourceAuthority="IMD × NOAA CPC × DES"
          requiredSchema={['ENSO_Phase', 'Rainfall_Anomaly', 'Temperature_C', 'Crop_Yield']}
          onConnectClick={onConnectClick}
        />
      </div>
    );
  }

  // Bar chart with 95% Confidence Intervals for Means
  const barChartData = phaseDistributions.map(p => ({
    name: p.phase === 'EL_NINO' ? 'El Niño' : p.phase === 'NEUTRAL' ? 'Neutral' : 'La Niña',
    fullName: p.phaseName,
    mean: p.mean,
    median: p.median,
    count: p.count,
    stdDev: p.stdDev,
    ciLower: p.ciLower95,
    ciUpper: p.ciUpper95,
    ciError: [Math.abs(p.mean - p.ciLower95), Math.abs(p.ciUpper95 - p.mean)],
    color: p.color
  }));

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header & Metric Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 bg-rose-50 text-rose-800 rounded border border-rose-200 uppercase">
              Phase Stratification
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Total Observations: N = {groupData.length} years
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            Stratified Comparison: El Niño vs Neutral vs La Niña
          </h3>
          <p className="text-xs text-slate-500">
            Comparing sample means, 95% confidence intervals, and full quartile boxplot distributions
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-md text-xs">
          {[
            { id: 'rainfall_anomaly', label: 'Rainfall Anomaly (%)' },
            { id: 'rainfall_total', label: 'Rainfall Total (mm)' },
            { id: 'temperature', label: 'Mean Max Temp (°C)' },
            { id: 'yield_paddy', label: 'Paddy Yield (kg/ha)' },
            { id: 'yield_cotton', label: 'Cotton Yield (kg/ha)' },
            { id: 'yield_maize', label: 'Maize Yield (kg/ha)' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedMetric(tab.id as ComparisonMetric)}
              className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                selectedMetric === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hypothesis Testing Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-md text-xs">
        <div className="flex items-center gap-3 font-mono">
          <span>
            <strong className="text-slate-500 font-sans">One-Way ANOVA: </strong>
            <span className="text-slate-800 font-bold">F = {anova.fStatistic !== null ? anova.fStatistic.toFixed(3) : 'N/A'}</span>
            <span className="text-slate-400 text-[10px] ml-1">({anova.degreesOfFreedomBetween}, {anova.degreesOfFreedomWithin})</span>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            <strong className="text-slate-500 font-sans">ANOVA p-value: </strong>
            <span className={`font-bold ${anova.pValue !== null && anova.pValue < 0.05 ? 'text-teal-800' : 'text-slate-700'}`}>
              {anova.pValue !== null ? `p = ${anova.pValue.toFixed(4)}` : 'N/A'}
            </span>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            <strong className="text-slate-500 font-sans">Kruskal-Wallis H: </strong>
            <span className="text-slate-800 font-bold">H = {kruskal.hStatistic !== null ? kruskal.hStatistic.toFixed(3) : 'N/A'}</span>
            <span className="text-slate-500 text-[10px] ml-1">(p = {kruskal.pValue !== null ? kruskal.pValue.toFixed(4) : 'N/A'})</span>
          </span>
        </div>

        <div className="text-[11px]">
          {anova.pValue !== null && anova.pValue < 0.05 ? (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
              Statistically Significant Inter-Phase Differences (p &lt; 0.05)
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-medium">
              Differences Not Statistically Detectable (p ≥ 0.05)
            </span>
          )}
        </div>
      </div>

      {/* Chart: Group Means with 95% Confidence Intervals */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barChartData} margin={{ top: 20, right: 25, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="fullName" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(v) => `${v}${unit}`}
              label={{ value: `${metricTitle} (${unit})`, angle: -90, position: 'insideLeft', offset: 5, fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '12px', color: '#fff' }}
              formatter={(val: any) => [`${val} ${unit}`, 'Sample Mean']}
              labelFormatter={(label) => `Phase: ${label}`}
            />
            {baselineVal !== null && (
              <ReferenceLine y={baselineVal} stroke="#94a3b8" strokeDasharray="2 2" label={{ value: `Baseline (${baselineVal}${unit})`, fill: '#64748b', fontSize: 10 }} />
            )}
            <Bar dataKey="mean" name="Sample Mean" radius={[4, 4, 0, 0]}>
              {barChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Boxplot & Statistical Summary Cards for all 3 groups */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {phaseDistributions.map(p => (
          <div key={p.phase} className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }}></span>
                {p.phaseName}
              </span>
              <span className="font-mono text-[11px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                N = {p.count} years
              </span>
            </div>

            {/* Mean and 95% Confidence Interval */}
            <div className="pt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Sample Mean (x̄):</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {p.mean > 0 && selectedMetric === 'rainfall_anomaly' ? '+' : ''}{p.mean} {unit}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-slate-500">95% Confidence Interval:</span>
                <span className="font-mono text-teal-800 font-semibold">
                  [{p.ciLower95}, {p.ciUpper95}] {unit}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-slate-500">Std Deviation (s):</span>
                <span className="font-mono text-slate-700">±{p.stdDev} {unit}</span>
              </div>
            </div>

            {/* Boxplot Quartiles Representation */}
            <div className="bg-white border border-slate-200 rounded p-2 text-[11px] font-mono space-y-1">
              <div className="text-[10px] font-sans font-semibold text-slate-500 border-b border-slate-100 pb-0.5">
                Distribution & Quartiles (Boxplot Metrics):
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-700">
                <div>Median: <strong className="text-slate-900">{p.median}</strong></div>
                <div>IQR: <strong>{p.iqr}</strong></div>
                <div>Q1 (25%): <strong>{p.q1}</strong></div>
                <div>Q3 (75%): <strong>{p.q3}</strong></div>
                <div>Min: <strong>{p.min}</strong></div>
                <div>Max: <strong>{p.max}</strong></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-1">
        <SourceBadge
          source="India Meteorological Department (IMD) × NOAA CPC × DES Telangana"
          period="1971 – 2026"
          units={unit}
          observationCount={groupData.length}
        />
      </div>
    </div>
  );
};
