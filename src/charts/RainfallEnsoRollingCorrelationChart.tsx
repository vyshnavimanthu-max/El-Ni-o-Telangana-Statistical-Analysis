import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  Dot
} from 'recharts';
import { MergedClimateRecord } from '../types/dataset';
import { calculateRollingCorrelation, RollingCorrelationPoint } from '../statistics/engine';
import { EmptyState } from '../components/EmptyState';
import { SourceBadge } from '../components/SourceBadge';
import { Info, HelpCircle, TrendingDown, Clock, ShieldCheck } from 'lucide-react';
import { RainfallVariableKey, RAINFALL_VARIABLES } from './RainfallTimeSeriesChart';

interface RainfallEnsoRollingCorrelationChartProps {
  data: MergedClimateRecord[];
  onConnectClick?: () => void;
  className?: string;
}

export const RainfallEnsoRollingCorrelationChart: React.FC<RainfallEnsoRollingCorrelationChartProps> = ({
  data,
  onConnectClick,
  className = ''
}) => {
  const [windowSize, setWindowSize] = useState<15 | 20>(15);
  const [selectedVariable, setSelectedVariable] = useState<RainfallVariableKey>('JJAS');

  // Prepare clean pairs for rolling calculation
  const pairs = useMemo(() => {
    if (!data) return [];
    return data
      .map(d => {
        let rainfallVal: number | null | undefined = null;
        if (selectedVariable === 'JJAS') rainfallVal = d.rainfallJjasMm;
        else if (selectedVariable === 'ANNUAL') rainfallVal = (d as any).annualTotal ?? d.rainfallJjasMm;
        else if (selectedVariable === 'JUNE') rainfallVal = d.rainfallJuneMm;
        else if (selectedVariable === 'JULY') rainfallVal = d.rainfallJulyMm;
        else if (selectedVariable === 'AUGUST') rainfallVal = d.rainfallAugustMm;
        else if (selectedVariable === 'SEPTEMBER') rainfallVal = d.rainfallSeptemberMm;

        return {
          year: d.year,
          x: d.oniJjas,
          y: rainfallVal
        };
      })
      .filter(d => typeof d.year === 'number' && typeof d.x === 'number' && typeof d.y === 'number' && !isNaN(d.x) && !isNaN(d.y));
  }, [data, selectedVariable]);

  const varConfig = RAINFALL_VARIABLES[selectedVariable];

  const rollingResult = useMemo(() => {
    return calculateRollingCorrelation(pairs, windowSize, 'Oceanic Niño Index (ONI)', `${varConfig.shortLabel} Rainfall`);
  }, [pairs, windowSize, varConfig.shortLabel]);

  if (!data || pairs.length < windowSize) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-4 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Rolling ENSO–Rainfall Teleconnection Stability ({windowSize}-Year Window)
            </h3>
            <p className="text-xs text-slate-500">
              Evaluating multi-decadal non-stationarity in the statistical association between equatorial Pacific ONI and Telangana precipitation
            </p>
          </div>
        </div>
        <EmptyState
          title={`Awaiting Continuous Time Series for ${windowSize}-Year Rolling Windows`}
          message={`Requires at least ${windowSize} continuous annual observations of synchronized ONI and rainfall data to compute rolling bivariate correlation coefficients.`}
          sourceAuthority="IMD × NOAA CPC ERSST.v5"
          requiredSchema={['Year', 'JJAS_ONI', 'Rainfall_mm']}
          onConnectClick={onConnectClick}
        />
        <div className="mt-3">
          <SourceBadge
            source="IMD Gridded × NOAA CPC"
            period={`Requires ≥ ${windowSize} continuous years`}
            units="Rolling Pearson r & Spearman ρ"
            observationCount={pairs.length}
          />
        </div>
      </div>
    );
  }

  const { points, overallMeanR, minR, maxR, rCritical95, interpretation } = rollingResult;

  // Format data for Recharts
  const chartData = points.map(p => ({
    endYear: p.endYear,
    startYear: p.startYear,
    windowLabel: p.windowLabel,
    midYear: p.midYear,
    pearsonR: p.pearsonR,
    spearmanRho: p.spearmanRho,
    pValue: p.pValuePearson,
    isSignificant: p.isSignificant,
    rCritPos: rCritical95,
    rCritNeg: -rCritical95,
    ciLow: p.ci95Low,
    ciHigh: p.ci95High
  }));

  const sigPointsCount = points.filter(p => p.isSignificant).length;
  const pctSig = points.length > 0 ? ((sigPointsCount / points.length) * 100).toFixed(0) : '0';

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold border border-indigo-200">
              Decadal Non-Stationarity Metric
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Window: {windowSize}-Year Moving Sub-Epochs ({points.length} overlapping windows)
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            Rolling ENSO–Rainfall Teleconnection Stability in Telangana
          </h3>
          <p className="text-xs text-slate-600 max-w-2xl">
            Statistical associations between ENSO and regional rainfall are not fixed in time. Rolling correlations assess whether the Pacific teleconnection has strengthened, weakened, or decoupled across historical decades.
          </p>
        </div>

        {/* Controls: 15-Year vs 20-Year Window and Variable Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Window Size Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setWindowSize(15)}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                windowSize === 15 ? 'bg-white text-indigo-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              15-Year Window (Primary)
            </button>
            <button
              type="button"
              onClick={() => setWindowSize(20)}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                windowSize === 20 ? 'bg-white text-indigo-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              20-Year Window (Decadal)
            </button>
          </div>
        </div>
      </div>

      {/* Variable Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium mr-1">Precipitation Series:</span>
          {(Object.keys(RAINFALL_VARIABLES) as RainfallVariableKey[]).map(key => {
            const cfg = RAINFALL_VARIABLES[key];
            const isSelected = selectedVariable === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedVariable(key)}
                className={`px-2 py-0.5 text-xs rounded border transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cfg.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Statistical Summary Mini Badges */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200 text-slate-700">
            Mean Rolling r: <strong>{overallMeanR !== null ? (overallMeanR > 0 ? `+${overallMeanR.toFixed(2)}` : overallMeanR.toFixed(2)) : 'N/A'}</strong>
          </span>
          <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200 text-slate-700">
            Span: <strong>[{minR !== null ? minR.toFixed(2) : 'N/A'}, {maxR !== null ? maxR.toFixed(2) : 'N/A'}]</strong>
          </span>
          <span className="bg-emerald-50 px-2 py-1 rounded border border-emerald-200 text-emerald-800">
            Sig. Windows: <strong>{pctSig}%</strong> (p &lt; 0.05)
          </span>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

            <XAxis
              dataKey="endYear"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(y) => `${y}`}
              label={{ value: `End Year of ${windowSize}-Year Rolling Window`, position: 'insideBottom', offset: -2, fontSize: 10, fill: '#94a3b8' }}
            />
            <YAxis
              domain={[-1.0, 1.0]}
              ticks={[-1.0, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1.0]}
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`}
            />

            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '12px', color: '#fff' }}
              formatter={(val: any, name: string, item: any) => {
                const p = item.payload;
                return [
                  <div key="tip" className="space-y-1">
                    <div className="font-mono text-indigo-300 font-bold">
                      Pearson r = {p.pearsonR !== null ? (p.pearsonR > 0 ? `+${p.pearsonR.toFixed(3)}` : p.pearsonR.toFixed(3)) : 'N/A'}
                    </div>
                    <div className="font-mono text-cyan-300 text-xs">
                      Spearman ρ = {p.spearmanRho !== null ? (p.spearmanRho > 0 ? `+${p.spearmanRho.toFixed(3)}` : p.spearmanRho.toFixed(3)) : 'N/A'}
                    </div>
                    <div className="text-slate-300 text-[11px]">
                      Window: <strong>{p.windowLabel}</strong> (N = {windowSize})
                    </div>
                    <div className="text-slate-300 text-[11px]">
                      p-value: <strong>{p.pValue !== null ? p.pValue.toFixed(4) : 'N/A'}</strong> ({p.isSignificant ? 'Statistically Significant at α=0.05' : 'Not Significant'})
                    </div>
                    {p.ciLow !== null && p.ciHigh !== null && (
                      <div className="text-slate-400 text-[10px]">
                        95% CI: [{p.ciLow.toFixed(2)}, {p.ciHigh.toFixed(2)}]
                      </div>
                    )}
                  </div>,
                  ''
                ];
              }}
              labelFormatter={(label) => `Window Ending in ${label}`}
            />

            {/* Zero Baseline */}
            <ReferenceLine y={0} stroke="#334155" strokeWidth={1.5} />

            {/* Critical Correlation Thresholds */}
            <ReferenceLine
              y={-rCritical95}
              stroke="#e11d48"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Sig. Negative Threshold (r ≤ -${rCritical95}, p=0.05)`,
                fill: '#e11d48',
                fontSize: 9,
                position: 'insideBottomLeft'
              }}
            />

            <ReferenceLine
              y={rCritical95}
              stroke="#0284c7"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Sig. Positive Threshold (r ≥ +${rCritical95}, p=0.05)`,
                fill: '#0284c7',
                fontSize: 9,
                position: 'insideTopLeft'
              }}
            />

            {/* Pearson Rolling r Line */}
            <Line
              type="monotone"
              dataKey="pearsonR"
              name="Pearson r"
              stroke="#4f46e5"
              strokeWidth={2.5}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (!cx || !cy) return null;
                return (
                  <circle
                    key={`dot-${payload.endYear}`}
                    cx={cx}
                    cy={cy}
                    r={payload.isSignificant ? 4 : 2.5}
                    fill={payload.isSignificant ? '#e11d48' : '#4f46e5'}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                );
              }}
              activeDot={{ r: 6, fill: '#4338ca', stroke: '#fff', strokeWidth: 2 }}
            />

            {/* Spearman Rolling Rho Line */}
            <Line
              type="monotone"
              dataKey="spearmanRho"
              name="Spearman ρ"
              stroke="#06b6d4"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Explanatory Scientific Interpretation Box */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 font-serif">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span>Scientific Interpretation: Why Do Rolling Correlations Change Over Time?</span>
        </div>
        <p className="text-slate-600 leading-relaxed">
          <strong>Rolling correlations represent changing statistical association over time</strong> rather than a constant physical law. Over multi-decadal timescales, the Indian Monsoon–ENSO coupling experiences modulation driven by broader climate oscillations:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
          <li>
            <strong>Pacific Decadal Oscillation (PDO) &amp; Atlantic Multi-decadal Oscillation (AMO):</strong> Phase shifts in North Pacific and North Atlantic sea surface temperatures alter equatorial Walker circulation cells, periodically enhancing or dampening the sensitivity of Telangana monsoon winds to Niño 3.4 warming.
          </li>
          <li>
            <strong>Indian Ocean Dipole (IOD) Buffering:</strong> Co-occurring Positive IOD (+IOD) events in the tropical Indian Ocean can inject anomalous moisture into peninsular India, offsetting or masking the precipitation deficit that typically accompanies an El Niño epoch.
          </li>
          <li>
            <strong>Empirical Finding in Active Record:</strong> {interpretation}
          </li>
        </ul>
      </div>

      {/* Footer Metadata */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-indigo-600 inline-block"></span>
            <span>Pearson r (Parametric)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-500 border-b border-dashed border-cyan-500 inline-block"></span>
            <span>Spearman ρ (Rank/Non-parametric)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
            <span>Statistically Significant (p &lt; 0.05)</span>
          </span>
        </div>

        <SourceBadge
          source="NOAA CPC ERSST.v5 × IMD Gridded Rainfall"
          period={`${points[0]?.startYear || 1980} – ${points[points.length - 1]?.endYear || 2024}`}
          units={`Rolling ${windowSize}-Year r`}
          observationCount={points.length}
        />
      </div>
    </div>
  );
};
