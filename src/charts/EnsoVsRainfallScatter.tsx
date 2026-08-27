import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Line
} from 'recharts';
import { MergedClimateRecord } from '../types/dataset';
import {
  calculatePearsonCorrelation,
  calculateSpearmanCorrelation,
  calculateLinearRegression
} from '../statistics/engine';
import { EmptyState } from '../components/EmptyState';
import { SourceBadge } from '../components/SourceBadge';
import { RainfallVariableKey, RAINFALL_VARIABLES } from './RainfallTimeSeriesChart';

interface EnsoVsRainfallScatterProps {
  data: MergedClimateRecord[];
  onConnectClick?: () => void;
  className?: string;
}

export const EnsoVsRainfallScatter: React.FC<EnsoVsRainfallScatterProps> = ({
  data,
  onConnectClick,
  className = ''
}) => {
  const [selectedVariable, setSelectedVariable] = useState<RainfallVariableKey>('JJAS');
  const [unitMode, setUnitMode] = useState<'PERCENT' | 'MM'>('PERCENT');

  const varConfig = RAINFALL_VARIABLES[selectedVariable];

  const validData = useMemo(() => {
    return data.filter(d => {
      if (d.oniJjas === null || d.oniJjas === undefined) return false;
      let val: number | null | undefined = null;
      if (selectedVariable === 'JJAS') val = d.rainfallJjasMm;
      else if (selectedVariable === 'ANNUAL') val = (d as any).annualTotal ?? d.rainfallJjasMm;
      else if (selectedVariable === 'JUNE') val = d.rainfallJuneMm;
      else if (selectedVariable === 'JULY') val = d.rainfallJulyMm;
      else if (selectedVariable === 'AUGUST') val = d.rainfallAugustMm;
      else if (selectedVariable === 'SEPTEMBER') val = d.rainfallSeptemberMm;

      return val !== null && val !== undefined && !isNaN(val);
    });
  }, [data, selectedVariable]);

  const stats = useMemo(() => {
    if (!validData || validData.length < 3) return null;

    const xVals = validData.map(d => d.oniJjas!);
    const yVals = validData.map(d => {
      let rawVal = 0;
      if (selectedVariable === 'JJAS') rawVal = d.rainfallJjasMm!;
      else if (selectedVariable === 'ANNUAL') rawVal = (d as any).annualTotal ?? d.rainfallJjasMm!;
      else if (selectedVariable === 'JUNE') rawVal = d.rainfallJuneMm!;
      else if (selectedVariable === 'JULY') rawVal = d.rainfallJulyMm!;
      else if (selectedVariable === 'AUGUST') rawVal = d.rainfallAugustMm!;
      else if (selectedVariable === 'SEPTEMBER') rawVal = d.rainfallSeptemberMm!;

      if (unitMode === 'PERCENT') {
        const normal = varConfig.normalMm;
        return ((rawVal - normal) / normal) * 100;
      }
      return rawVal;
    });

    const yLabel = unitMode === 'PERCENT' ? `${varConfig.shortLabel} Departure (%)` : `${varConfig.shortLabel} (mm)`;

    const corr = calculatePearsonCorrelation(xVals, yVals, 'Equatorial ONI (°C)', yLabel);
    const spearman = calculateSpearmanCorrelation(xVals, yVals, 'Equatorial ONI (°C)', yLabel);
    const reg = calculateLinearRegression(xVals, yVals, yLabel, 'Equatorial ONI (°C)');

    return { corr, spearman, reg, xVals, yVals };
  }, [validData, selectedVariable, unitMode, varConfig]);

  if (!data || !stats || validData.length < 3) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Bivariate Scatter: Oceanic Niño Index vs Telangana Rainfall
            </h3>
            <p className="text-xs text-slate-500">
              Empirical correlation and Ordinary Least Squares (OLS) linear regression
            </p>
          </div>
        </div>
        <EmptyState
          title="Awaiting Merged ENSO & Rainfall Records"
          message="Connect official dataset to compute the empirical Pearson correlation coefficient (r), regression slope (β), and R² goodness of fit."
          sourceAuthority="NOAA CPC × IMD Gridded"
          requiredSchema={['Year', 'ONI_JJAS_Anomaly', 'Rainfall_Departure_Pct']}
          onConnectClick={onConnectClick}
        />
        <div className="mt-3">
          <SourceBadge
            source="NOAA Climate Prediction Center × IMD"
            period="Awaiting connection"
            units="X: °C, Y: % departure / mm"
            observationCount={null}
          />
        </div>
      </div>
    );
  }

  const { corr, spearman, reg, xVals, yVals } = stats;

  const scatterPoints = validData.map(d => {
    let rawVal = 0;
    if (selectedVariable === 'JJAS') rawVal = d.rainfallJjasMm!;
    else if (selectedVariable === 'ANNUAL') rawVal = (d as any).annualTotal ?? d.rainfallJjasMm!;
    else if (selectedVariable === 'JUNE') rawVal = d.rainfallJuneMm!;
    else if (selectedVariable === 'JULY') rawVal = d.rainfallJulyMm!;
    else if (selectedVariable === 'AUGUST') rawVal = d.rainfallAugustMm!;
    else if (selectedVariable === 'SEPTEMBER') rawVal = d.rainfallSeptemberMm!;

    const y = unitMode === 'PERCENT'
      ? Number((((rawVal - varConfig.normalMm) / varConfig.normalMm) * 100).toFixed(1))
      : Number(rawVal.toFixed(1));

    return {
      year: d.year,
      x: d.oniJjas!,
      y,
      rawMm: rawVal,
      phase: d.ensoPhase,
      fillColor: d.ensoPhase === 'EL_NINO' ? '#e11d48' : d.ensoPhase === 'LA_NINA' ? '#0284c7' : '#64748b'
    };
  });

  // Generate regression line points
  const minX = Math.min(...xVals) - 0.2;
  const maxX = Math.max(...xVals) + 0.2;
  const alpha = reg.interceptAlpha ?? 0;
  const beta = reg.slopeBeta ?? 0;

  const regressionLineData = [
    { x: Number(minX.toFixed(2)), y: Number((alpha + beta * minX).toFixed(2)) },
    { x: 0, y: Number(alpha.toFixed(2)) },
    { x: Number(maxX.toFixed(2)), y: Number((alpha + beta * maxX).toFixed(2)) }
  ];

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header with Switchers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-semibold border border-rose-200">
              Parametric OLS Regression
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Sample N = {validData.length} observations
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            Oceanic Niño Index (ONI) vs Telangana {varConfig.shortLabel}
          </h3>
          <p className="text-xs text-slate-500">
            Evaluating linear sensitivity: 1.0°C rise in equatorial Pacific ONI anomaly corresponds to a {beta > 0 ? `+${beta.toFixed(1)}` : beta.toFixed(1)}{unitMode === 'PERCENT' ? '%' : ' mm'} response.
          </p>
        </div>

        {/* Mode Toggle: Percent Anomaly vs Absolute mm */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setUnitMode('PERCENT')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              unitMode === 'PERCENT' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            % Anomaly
          </button>
          <button
            type="button"
            onClick={() => setUnitMode('MM')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              unitMode === 'MM' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Absolute (mm)
          </button>
        </div>
      </div>

      {/* Intra-seasonal Variable Selector Pills */}
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
                  ? 'bg-rose-50 border-rose-400 text-rose-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cfg.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Regression Statistical KPI Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[10px] text-slate-500 font-mono block">Pearson r (Parametric)</span>
          <span className="text-sm font-bold font-mono text-slate-900">
            {corr.pearsonR !== null ? `${corr.pearsonR > 0 ? '+' : ''}${corr.pearsonR.toFixed(3)}` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            p = {corr.pValuePearson !== null ? corr.pValuePearson.toFixed(4) : 'N/A'} {corr.isStatisticallySignificant ? '(Sig. p<0.05)' : '(Not sig)'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[10px] text-slate-500 font-mono block">Spearman ρ (Rank)</span>
          <span className="text-sm font-bold font-mono text-slate-900">
            {spearman.spearmanRho !== null ? `${spearman.spearmanRho > 0 ? '+' : ''}${spearman.spearmanRho.toFixed(3)}` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            p = {spearman.pValueSpearman !== null ? spearman.pValueSpearman.toFixed(4) : 'N/A'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[10px] text-slate-500 font-mono block">OLS Slope (β) &amp; R²</span>
          <span className="text-sm font-bold font-mono text-slate-900">
            β = {beta > 0 ? `+${beta.toFixed(2)}` : beta.toFixed(2)} {unitMode === 'PERCENT' ? '%/°C' : 'mm/°C'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            R² = {reg.rSquared !== null ? `${(reg.rSquared * 100).toFixed(1)}%` : 'N/A'} (Adj: {reg.adjustedRSquared !== null ? `${(reg.adjustedRSquared * 100).toFixed(1)}%` : 'N/A'})
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[10px] text-slate-500 font-mono block">95% CI for Slope (β)</span>
          <span className="text-xs font-bold font-mono text-slate-900 block mt-0.5">
            {reg.coefficients && reg.coefficients[1] 
              ? `[${reg.coefficients[1].ci95Low.toFixed(2)}, ${reg.coefficients[1].ci95High.toFixed(2)}]`
              : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            SE(β) = ±{reg.coefficients && reg.coefficients[1] ? reg.coefficients[1].standardError.toFixed(2) : 'N/A'}
          </span>
        </div>
      </div>

      {/* Scatter & Fitted Line Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              type="number"
              dataKey="x"
              name="Oceanic Niño Index"
              unit="°C"
              domain={[-2.5, 2.8]}
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}°C`}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={unitMode === 'PERCENT' ? 'Departure' : 'Rainfall'}
              unit={unitMode === 'PERCENT' ? '%' : 'mm'}
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}${unitMode === 'PERCENT' ? '%' : 'mm'}`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '12px', color: '#fff' }}
              formatter={(val: any, name: string, item: any) => {
                const p = item.payload;
                return [
                  <div key="tip" className="space-y-1">
                    <div className="font-bold text-white">Monsoon Year: {p.year}</div>
                    <div className="font-mono text-rose-300">Niño 3.4 ONI: {p.x > 0 ? `+${p.x}°C` : `${p.x}°C`} ({p.phase})</div>
                    <div className="font-mono text-emerald-300">
                      Observed: {p.rawMm} mm ({p.y > 0 ? `+${p.y}%` : `${p.y}%`} departure)
                    </div>
                  </div>,
                  ''
                ];
              }}
            />
            
            {/* Reference Threshold Lines */}
            <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1} />
            <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
            <ReferenceLine x={0.5} stroke="#f43f5e" strokeDasharray="2 2" />
            <ReferenceLine x={-0.5} stroke="#0284c7" strokeDasharray="2 2" />

            {/* Scatter Observations */}
            <Scatter
              data={scatterPoints}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={payload.fillColor}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                );
              }}
            />

            {/* OLS Fitted Regression Line */}
            <Scatter
              name="Fitted OLS Trend"
              data={regressionLineData}
              line={{ stroke: '#0f172a', strokeWidth: 2 }}
              shape={() => null}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Regression Formula & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] pt-2 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48] inline-block"></span>
            <span className="text-slate-600">El Niño (ONI ≥ +0.5°C)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#64748b] inline-block"></span>
            <span className="text-slate-600">Neutral</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] inline-block"></span>
            <span className="text-slate-600">La Niña (ONI ≤ -0.5°C)</span>
          </span>
        </div>

        <div className="font-mono text-xs bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
          Fitted OLS: <strong>ŷ = {alpha.toFixed(1)} {beta >= 0 ? `+ ${beta.toFixed(2)}` : `- ${Math.abs(beta).toFixed(2)}`} × (ONI)</strong>
        </div>
      </div>
    </div>
  );
};
