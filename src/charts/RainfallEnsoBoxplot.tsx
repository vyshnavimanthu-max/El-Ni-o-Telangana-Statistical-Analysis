import React, { useState, useMemo } from 'react';
import { MergedClimateRecord } from '../types/dataset';
import {
  calculateQuartiles,
  calculateMean,
  calculateStdDev,
  calculateAnovaAndKruskal,
  calculatePercentile
} from '../statistics/engine';
import { EmptyState } from '../components/EmptyState';
import { SourceBadge } from '../components/SourceBadge';
import { RainfallVariableKey, RAINFALL_VARIABLES } from './RainfallTimeSeriesChart';
import { Info, HelpCircle } from 'lucide-react';

interface RainfallEnsoBoxplotProps {
  data: MergedClimateRecord[];
  onConnectClick?: () => void;
  className?: string;
}

interface PhaseBoxStats {
  phase: 'EL_NINO' | 'NEUTRAL' | 'LA_NINA';
  phaseName: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  n: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  mean: number;
  stdDev: number;
  cv: number;
  ci95Low: number;
  ci95High: number;
  outliers: number[];
  values: number[];
}

export const RainfallEnsoBoxplot: React.FC<RainfallEnsoBoxplotProps> = ({
  data,
  onConnectClick,
  className = ''
}) => {
  const [selectedVariable, setSelectedVariable] = useState<RainfallVariableKey>('JJAS');
  const [unitMode, setUnitMode] = useState<'MM' | 'PERCENT'>('MM');

  const varConfig = RAINFALL_VARIABLES[selectedVariable];

  const phaseStats = useMemo(() => {
    if (!data || data.length < 5) return null;

    const extractValue = (d: MergedClimateRecord): number | null => {
      let rawVal: number | null | undefined = null;
      if (selectedVariable === 'JJAS') rawVal = d.rainfallJjasMm;
      else if (selectedVariable === 'ANNUAL') rawVal = (d as any).annualTotal ?? d.rainfallJjasMm;
      else if (selectedVariable === 'JUNE') rawVal = d.rainfallJuneMm;
      else if (selectedVariable === 'JULY') rawVal = d.rainfallJulyMm;
      else if (selectedVariable === 'AUGUST') rawVal = d.rainfallAugustMm;
      else if (selectedVariable === 'SEPTEMBER') rawVal = d.rainfallSeptemberMm;

      if (rawVal === null || rawVal === undefined || isNaN(rawVal)) return null;

      if (unitMode === 'PERCENT') {
        const normal = varConfig.normalMm;
        return Number((((rawVal - normal) / normal) * 100).toFixed(2));
      }
      return Number(rawVal.toFixed(1));
    };

    const elNinoVals = data
      .filter(d => d.ensoPhase === 'EL_NINO')
      .map(extractValue)
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

    const neutralVals = data
      .filter(d => d.ensoPhase === 'NEUTRAL')
      .map(extractValue)
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

    const laNinaVals = data
      .filter(d => d.ensoPhase === 'LA_NINA')
      .map(extractValue)
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

    const buildStats = (
      vals: number[],
      phase: 'EL_NINO' | 'NEUTRAL' | 'LA_NINA',
      name: string,
      color: string,
      bg: string,
      border: string,
      text: string
    ): PhaseBoxStats => {
      const n = vals.length;
      if (n === 0) {
        return {
          phase,
          phaseName: name,
          color,
          badgeBg: bg,
          badgeBorder: border,
          badgeText: text,
          n: 0,
          min: 0,
          q1: 0,
          median: 0,
          q3: 0,
          max: 0,
          iqr: 0,
          mean: 0,
          stdDev: 0,
          cv: 0,
          ci95Low: 0,
          ci95High: 0,
          outliers: [],
          values: []
        };
      }

      const q1 = calculatePercentile(vals, 25);
      const median = calculatePercentile(vals, 50);
      const q3 = calculatePercentile(vals, 75);
      const iqr = q3 - q1;
      const lowerFence = q1 - 1.5 * iqr;
      const upperFence = q3 + 1.5 * iqr;

      const nonOutliers = vals.filter(v => v >= lowerFence && v <= upperFence);
      const outliers = vals.filter(v => v < lowerFence || v > upperFence);

      const min = nonOutliers.length > 0 ? nonOutliers[0] : vals[0];
      const max = nonOutliers.length > 0 ? nonOutliers[nonOutliers.length - 1] : vals[vals.length - 1];

      const mean = calculateMean(vals)!;
      const stdDev = calculateStdDev(vals)!;
      const cv = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;
      const se = stdDev / Math.sqrt(n);
      const ci95Low = mean - 1.96 * se;
      const ci95High = mean + 1.96 * se;

      return {
        phase,
        phaseName: name,
        color,
        badgeBg: bg,
        badgeBorder: border,
        badgeText: text,
        n,
        min: Number(min.toFixed(1)),
        q1: Number(q1.toFixed(1)),
        median: Number(median.toFixed(1)),
        q3: Number(q3.toFixed(1)),
        max: Number(max.toFixed(1)),
        iqr: Number(iqr.toFixed(1)),
        mean: Number(mean.toFixed(1)),
        stdDev: Number(stdDev.toFixed(1)),
        cv: Number(cv.toFixed(1)),
        ci95Low: Number(ci95Low.toFixed(1)),
        ci95High: Number(ci95High.toFixed(1)),
        outliers,
        values: vals
      };
    };

    const elNino = buildStats(elNinoVals, 'EL_NINO', 'El Niño (Warm)', '#e11d48', 'bg-rose-50', 'border-rose-300', 'text-rose-900');
    const neutral = buildStats(neutralVals, 'NEUTRAL', 'Neutral Phase', '#64748b', 'bg-slate-50', 'border-slate-300', 'text-slate-900');
    const laNina = buildStats(laNinaVals, 'LA_NINA', 'La Niña (Cool)', '#0284c7', 'bg-sky-50', 'border-sky-300', 'text-sky-900');

    // Run One-Way ANOVA & Kruskal-Wallis
    const anovaKruskal = calculateAnovaAndKruskal(
      [
        { name: 'El Niño', values: elNinoVals },
        { name: 'Neutral', values: neutralVals },
        { name: 'La Niña', values: laNinaVals }
      ],
      'ENSO Phase',
      `${varConfig.shortLabel} Rainfall`
    );

    return {
      elNino,
      neutral,
      laNina,
      allGroups: [elNino, neutral, laNina],
      anovaKruskal
    };
  }, [data, selectedVariable, unitMode, varConfig]);

  if (!data || !phaseStats || data.length < 5) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              ENSO-Stratified Rainfall Distribution Boxplot
            </h3>
            <p className="text-xs text-slate-500">
              Quartile distributions, interquartile ranges, and ANOVA across El Niño, Neutral, and La Niña
            </p>
          </div>
        </div>
        <EmptyState
          title="Awaiting ENSO-Stratified Rainfall Records"
          message="Connect official dataset to compute medians, IQR quartiles, and Kruskal-Wallis rank tests."
          sourceAuthority="IMD × NOAA CPC"
          requiredSchema={['Rainfall_mm', 'ENSO_Phase']}
          onConnectClick={onConnectClick}
        />
        <div className="mt-3">
          <SourceBadge
            source="IMD Gridded × NOAA CPC"
            period="Awaiting connection"
            units="Quartiles & Medians"
            observationCount={null}
          />
        </div>
      </div>
    );
  }

  const { elNino, neutral, laNina, allGroups, anovaKruskal } = phaseStats;

  // Global bounds for visualization scaling
  const allMins = allGroups.map(g => g.min).filter(v => v !== 0);
  const allMaxs = allGroups.map(g => g.max).filter(v => v !== 0);
  const globalMin = allMins.length > 0 ? Math.min(...allMins) : 0;
  const globalMax = allMaxs.length > 0 ? Math.max(...allMaxs) : 1000;
  const rangeSpan = Math.max(1, globalMax - globalMin);
  const displayMin = unitMode === 'PERCENT' ? Math.min(-60, Math.floor(globalMin / 10) * 10 - 10) : Math.max(0, Math.floor(globalMin / 50) * 50 - 50);
  const displayMax = unitMode === 'PERCENT' ? Math.max(60, Math.ceil(globalMax / 10) * 10 + 10) : Math.ceil(globalMax / 50) * 50 + 50;
  const displaySpan = displayMax - displayMin;

  const toPct = (val: number) => {
    return Math.max(0, Math.min(100, ((val - displayMin) / displaySpan) * 100));
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-semibold border border-emerald-200">
              Stratified Quartile Architecture
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Group Medians, IQR Boxes, Whisker Fences &amp; Outliers
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            El Niño vs Neutral vs La Niña: Telangana {varConfig.shortLabel} Boxplot
          </h3>
          <p className="text-xs text-slate-500">
            Comparing parametric means ($\bar&#123;x&#125; \pm 95\% \text&#123;CI&#125;$) and non-parametric median/IQR distributions across Pacific phases.
          </p>
        </div>

        {/* Units Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setUnitMode('MM')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              unitMode === 'MM' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Precipitation (mm)
          </button>
          <button
            type="button"
            onClick={() => setUnitMode('PERCENT')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              unitMode === 'PERCENT' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Departure (%)
          </button>
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
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cfg.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Hypothesis Testing Summary Banner */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-slate-900 block font-serif">
            Kruskal-Wallis Rank Sum Test (H-Statistic):
          </span>
          <span className="text-slate-600">
            H({anovaKruskal.kruskalWallis.degreesOfFreedom}) = <strong>{anovaKruskal.kruskalWallis.hStatistic?.toFixed(2)}</strong>, p-value = <strong>{anovaKruskal.kruskalWallis.pValue?.toFixed(4)}</strong> ({anovaKruskal.kruskalWallis.isSignificant ? 'Statistically Significant at α=0.05' : 'No statistically significant difference at α=0.05'})
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="bg-white px-2 py-1 rounded border border-slate-200 text-slate-700">
            ANOVA F = <strong>{anovaKruskal.anova?.fStatistic?.toFixed(2) ?? anovaKruskal.oneWayAnova?.fStatistic?.toFixed(2) ?? 'N/A'}</strong> (p = {anovaKruskal.anova?.pValue?.toFixed(4) ?? anovaKruskal.oneWayAnova?.pValue?.toFixed(4) ?? 'N/A'})
          </span>
          <span className="bg-white px-2 py-1 rounded border border-slate-200 text-slate-700">
            Effect Size η² = <strong>{anovaKruskal.anova?.etaSquared?.toFixed(3) ?? anovaKruskal.oneWayAnova?.etaSquared?.toFixed(3) ?? 'N/A'}</strong>
          </span>
        </div>
      </div>

      {/* Custom Precision SVG / CSS Boxplot Rendering */}
      <div className="space-y-6 pt-2 pb-4">
        {allGroups.map(group => {
          const leftQ1 = toPct(group.q1);
          const widthIQR = Math.max(2, toPct(group.q3) - toPct(group.q1));
          const leftMedian = toPct(group.median);
          const leftMin = toPct(group.min);
          const leftMax = toPct(group.max);
          const leftMean = toPct(group.mean);

          return (
            <div key={group.phase} className="space-y-1.5">
              {/* Group Label Row */}
              <div className="flex flex-wrap items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${group.badgeBg} ${group.badgeBorder} ${group.badgeText}`}>
                    {group.phaseName}
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">N = {group.n} seasons</span>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] text-slate-600">
                  <span>Median: <strong>{group.median}{unitMode === 'PERCENT' ? '%' : 'mm'}</strong></span>
                  <span>Mean: <strong>{group.mean}{unitMode === 'PERCENT' ? '%' : 'mm'}</strong> (σ=±{group.stdDev})</span>
                  <span>CV: <strong>{group.cv}%</strong></span>
                  <span>IQR: <strong>{group.iqr}{unitMode === 'PERCENT' ? '%' : 'mm'}</strong></span>
                </div>
              </div>

              {/* Boxplot Visual Track */}
              <div className="relative h-10 w-full bg-slate-50 border border-slate-200 rounded px-2 flex items-center">
                {/* Reference LPA Line */}
                {unitMode === 'MM' && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-teal-600 z-10 opacity-70"
                    style={{ left: `${toPct(varConfig.normalMm)}%` }}
                    title={`IMD LPA Normal = ${varConfig.normalMm} mm`}
                  />
                )}
                {unitMode === 'PERCENT' && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-700 z-10 opacity-70"
                    style={{ left: `${toPct(0)}%` }}
                    title="Normal 0% Departure"
                  />
                )}

                {/* Whisker Line (Min to Max) */}
                <div
                  className="absolute h-0.5 bg-slate-400 z-0"
                  style={{
                    left: `${leftMin}%`,
                    width: `${Math.max(1, leftMax - leftMin)}%`
                  }}
                />

                {/* Whisker Left Cap (Min) */}
                <div
                  className="absolute h-3 w-0.5 bg-slate-500 z-0"
                  style={{ left: `${leftMin}%` }}
                  title={`Min: ${group.min}`}
                />

                {/* Whisker Right Cap (Max) */}
                <div
                  className="absolute h-3 w-0.5 bg-slate-500 z-0"
                  style={{ left: `${leftMax}%` }}
                  title={`Max: ${group.max}`}
                />

                {/* IQR Box (Q1 to Q3) */}
                <div
                  className="absolute h-6 rounded-sm border z-10 transition-all opacity-85 hover:opacity-100 flex items-center justify-center cursor-pointer shadow-2xs"
                  style={{
                    left: `${leftQ1}%`,
                    width: `${widthIQR}%`,
                    backgroundColor: group.color,
                    borderColor: '#ffffff'
                  }}
                  title={`Q1: ${group.q1} | Median: ${group.median} | Q3: ${group.q3} | IQR: ${group.iqr}`}
                >
                  {/* Inside Median Line */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-xs z-20"
                    style={{
                      left: `${((group.median - group.q1) / Math.max(0.1, group.iqr)) * 100}%`
                    }}
                  />
                </div>

                {/* Parametric Mean Diamond / Marker */}
                <div
                  className="absolute w-2.5 h-2.5 rotate-45 bg-amber-400 border border-slate-900 z-30 transform -translate-x-1/2 shadow-xs"
                  style={{ left: `${leftMean}%` }}
                  title={`Sample Mean: ${group.mean} (95% CI: [${group.ci95Low}, ${group.ci95High}])`}
                />
              </div>
            </div>
          );
        })}

        {/* Axis Ticks */}
        <div className="relative w-full h-5 text-[10px] font-mono text-slate-400 border-t border-slate-200 pt-1">
          <span className="absolute left-0">{displayMin}{unitMode === 'PERCENT' ? '%' : 'mm'}</span>
          <span className="absolute left-1/4 transform -translate-x-1/2">{Math.round(displayMin + displaySpan * 0.25)}{unitMode === 'PERCENT' ? '%' : 'mm'}</span>
          <span className="absolute left-2/4 transform -translate-x-1/2">{Math.round(displayMin + displaySpan * 0.5)}{unitMode === 'PERCENT' ? '%' : 'mm'}</span>
          <span className="absolute left-3/4 transform -translate-x-1/2">{Math.round(displayMin + displaySpan * 0.75)}{unitMode === 'PERCENT' ? '%' : 'mm'}</span>
          <span className="absolute right-0">{displayMax}{unitMode === 'PERCENT' ? '%' : 'mm'}</span>
        </div>
      </div>

      {/* Legend & Climatological Annotation */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] pt-2 border-t border-slate-100 text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#e11d48] inline-block"></span>
            <span>IQR Box (25th–75th Percentile)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-3 bg-white border border-slate-400 inline-block"></span>
            <span>Median Line (50th Percentile)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 bg-amber-400 border border-slate-800 inline-block"></span>
            <span>Parametric Mean (♦)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-0.5 h-3 bg-teal-600 inline-block"></span>
            <span>LPA Normal Baseline</span>
          </span>
        </div>

        <SourceBadge
          source="India Meteorological Department (IMD) × NOAA CPC"
          period="1980 – 2024"
          units="Quartiles & CV (%)"
          observationCount={data.length}
        />
      </div>
    </div>
  );
};
