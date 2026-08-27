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
  Line,
  ComposedChart
} from 'recharts';
import { MergedClimateRecord } from '../types/dataset';
import {
  calculatePearsonCorrelation,
  calculateSpearmanCorrelation,
  calculateLinearRegression
} from '../statistics/engine';
import { EmptyState } from '../components/EmptyState';
import { SourceBadge } from '../components/SourceBadge';

interface EnsoVsTemperatureScatterProps {
  data: MergedClimateRecord[];
  onConnectClick?: () => void;
  className?: string;
}

type ThermalScatterVariable = 'TMAX_ANOM' | 'TMAX_ABS' | 'TMIN_ABS' | 'TMEAN_ABS' | 'TMEAN_ANOM';

export const EnsoVsTemperatureScatter: React.FC<EnsoVsTemperatureScatterProps> = ({
  data,
  onConnectClick,
  className = ''
}) => {
  const [selectedVar, setSelectedVar] = useState<ThermalScatterVariable>('TMAX_ANOM');

  const validData = useMemo(() => {
    return data.filter(d => d.oniJjas !== null && d.meanMaxTempC !== null);
  }, [data]);

  const stats = useMemo(() => {
    if (!validData || validData.length < 3) return null;

    const xVals = validData.map(d => d.oniJjas!);

    const getYValue = (d: MergedClimateRecord): number => {
      const tmax = d.meanMaxTempC!;
      const tmin = d.meanMinTempC ?? (tmax - 8.6);
      const tmean = d.meanTempC ?? ((tmax + tmin) / 2);

      switch (selectedVar) {
        case 'TMAX_ANOM':
          return d.tempMaxAnomalyC ?? Number((tmax - 32.4).toFixed(2));
        case 'TMAX_ABS':
          return tmax;
        case 'TMIN_ABS':
          return tmin;
        case 'TMEAN_ABS':
          return tmean;
        case 'TMEAN_ANOM':
          return d.tempMeanAnomalyC ?? Number((tmean - 28.1).toFixed(2));
      }
    };

    const yVals = validData.map(getYValue);

    let yLabel = 'Max Temp Anomaly (°C)';
    let unit = '°C';
    if (selectedVar === 'TMAX_ABS') yLabel = 'Mean Max Temp (°C)';
    if (selectedVar === 'TMIN_ABS') yLabel = 'Mean Min Temp (°C)';
    if (selectedVar === 'TMEAN_ABS') yLabel = 'Mean Surface Temp (°C)';
    if (selectedVar === 'TMEAN_ANOM') yLabel = 'Mean Temp Anomaly (°C)';

    const corr = calculatePearsonCorrelation(xVals, yVals, 'ONI (JJAS)', yLabel);
    const spearman = calculateSpearmanCorrelation(xVals, yVals, 'ONI (JJAS)', yLabel);
    const reg = calculateLinearRegression(xVals, yVals, yLabel, 'ONI (JJAS)');

    return { corr, spearman, reg, xVals, yVals, yLabel, unit, getYValue };
  }, [validData, selectedVar]);

  if (!data || !stats || validData.length < 3) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Bivariate Scatter: ENSO (ONI) vs Telangana Temperature
            </h3>
            <p className="text-xs text-slate-500">
              Examining daytime maximum thermal anomalies and cloud-cover feedbacks during El Niño
            </p>
          </div>
        </div>
        <EmptyState
          title="Awaiting Merged ENSO & Temperature Records"
          message="Connect official IMD Gridded Temperature dataset to compute thermal sensitivity, correlation, and regression slope against ONI."
          sourceAuthority="IMD Gridded Temp × NOAA CPC"
          requiredSchema={['Year', 'ONI_JJAS', 'Mean_Max_Temperature_C']}
          onConnectClick={onConnectClick}
        />
        <div className="mt-3">
          <SourceBadge
            source="IMD Gridded Temperature × NOAA CPC"
            period="Awaiting connection"
            units="X: °C Anomaly, Y: °C"
            observationCount={null}
          />
        </div>
      </div>
    );
  }

  const { corr, spearman, reg, yLabel, getYValue } = stats;

  const points = validData.map(d => {
    const y = getYValue(d);
    return {
      year: d.year,
      x: d.oniJjas!,
      y,
      phase: d.ensoPhase,
      color: d.ensoPhase === 'EL_NINO' ? '#e11d48' : d.ensoPhase === 'LA_NINA' ? '#0284c7' : '#64748b'
    };
  });

  // Calculate regression line endpoints
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const paddingX = 0.2;
  const slope = reg.slopeBeta ?? reg.coefficients[1]?.estimateBeta ?? 0;
  const intercept = reg.interceptAlpha ?? reg.coefficients[0]?.estimateBeta ?? 0;
  const ciLow = reg.coefficients[1]?.ci95Low ?? 0;
  const ciHigh = reg.coefficients[1]?.ci95High ?? 0;
  const r2Pct = (reg.rSquared ?? 0) * 100;
  const seEst = reg.standardErrorOfEstimate ?? 0;

  const lineStart = { x: Number((minX - paddingX).toFixed(2)), y: Number((intercept + slope * (minX - paddingX)).toFixed(2)) };
  const lineEnd = { x: Number((maxX + paddingX).toFixed(2)), y: Number((intercept + slope * (maxX + paddingX)).toFixed(2)) };

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 bg-amber-50 text-amber-900 rounded border border-amber-200 uppercase">
              Bivariate Sensitivity
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Sample N = {validData.length} annual records
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            ENSO (ONI JJAS) vs Telangana {yLabel}
          </h3>
          <p className="text-xs text-slate-500">
            Ordinary Least Squares (OLS) regression quantifying the empirical thermal teleconnection slope
          </p>
        </div>

        {/* Variable Switcher */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-md text-xs gap-1">
          <button
            type="button"
            onClick={() => setSelectedVar('TMAX_ANOM')}
            className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
              selectedVar === 'TMAX_ANOM'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ΔT_max (Anomaly)
          </button>
          <button
            type="button"
            onClick={() => setSelectedVar('TMAX_ABS')}
            className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
              selectedVar === 'TMAX_ABS'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            T_max (Absolute)
          </button>
          <button
            type="button"
            onClick={() => setSelectedVar('TMEAN_ABS')}
            className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
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
            className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
              selectedVar === 'TMIN_ABS'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            T_min
          </button>
          <button
            type="button"
            onClick={() => setSelectedVar('TMEAN_ANOM')}
            className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
              selectedVar === 'TMEAN_ANOM'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ΔT_mean
          </button>
        </div>
      </div>

      {/* Regression KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
        <div>
          <span className="text-slate-500 block text-[11px]">Pearson r (p-value)</span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {corr.pearsonR !== null ? `${corr.pearsonR > 0 ? '+' : ''}${corr.pearsonR.toFixed(3)}` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {corr.pValuePearson !== null ? `p = ${corr.pValuePearson.toFixed(4)}` : ''}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px]">Spearman Rank ρ</span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {spearman.spearmanRho !== null ? `${spearman.spearmanRho > 0 ? '+' : ''}${spearman.spearmanRho.toFixed(3)}` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {spearman.pValueSpearman !== null ? `p = ${spearman.pValueSpearman.toFixed(4)}` : ''}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px]">OLS Slope β (Sensitivity)</span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {slope !== null ? `${slope > 0 ? '+' : ''}${slope.toFixed(2)} °C / °C ONI` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            95% CI: [{ciLow.toFixed(2)}, {ciHigh.toFixed(2)}]
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px]">Variance Explained (R²)</span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {r2Pct.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 block">
            SE(est) = ±{seEst.toFixed(2)}°C
          </span>
        </div>
      </div>

      {/* Scatter Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 25, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              type="number"
              dataKey="x"
              name="ONI (JJAS)"
              unit="°C"
              domain={[-2.2, 2.6]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
              label={{ value: 'Oceanic Niño Index — ONI JJAS (°C SST Anomaly)', position: 'insideBottom', offset: -12, fill: '#475569', fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yLabel}
              unit="°C"
              domain={selectedVar.includes('ANOM') ? [-2.5, 2.5] : selectedVar === 'TMIN_ABS' ? [21.5, 26.5] : [29.5, 35.5]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
              label={{ value: `Telangana ${yLabel}`, angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[190px]">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1 font-mono">
                      <span className="font-bold text-amber-400">Year {pt.year}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {pt.phase || 'NEUTRAL'}
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">ONI (JJAS):</span>
                        <span className="font-mono font-bold text-amber-300">{pt.x > 0 ? '+' : ''}{pt.x.toFixed(2)}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{yLabel}:</span>
                        <span className="font-mono font-bold text-white">{pt.y > 0 && selectedVar.includes('ANOM') ? '+' : ''}{pt.y.toFixed(2)}°C</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            {/* Zero and Baseline Reference Lines */}
            <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
            {selectedVar.includes('ANOM') && <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />}
            {selectedVar === 'TMAX_ABS' && <ReferenceLine y={32.4} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Tmax Normal (32.4°C)', fill: '#f43f5e', fontSize: 10, position: 'insideTopRight' }} />}
            {selectedVar === 'TMIN_ABS' && <ReferenceLine y={23.8} stroke="#0284c7" strokeDasharray="3 3" label={{ value: 'Tmin Normal (23.8°C)', fill: '#0284c7', fontSize: 10, position: 'insideTopRight' }} />}
            {selectedVar === 'TMEAN_ABS' && <ReferenceLine y={28.1} stroke="#d97706" strokeDasharray="3 3" label={{ value: 'Tmean Normal (28.1°C)', fill: '#d97706', fontSize: 10, position: 'insideTopRight' }} />}

            {/* ENSO Category Stratified Points */}
            <Scatter
              name="Observations"
              data={points}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={payload.color}
                    fillOpacity={0.85}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Regression Model Formula Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-xs gap-2">
        <div className="space-y-0.5">
          <span className="font-mono font-bold text-amber-950 block">
            Fitted OLS Equation: ŷ = {intercept.toFixed(2)} + ({slope.toFixed(2)} × ONI)
          </span>
          <span className="text-[11px] text-slate-600">
            For every +1.0°C rise in ONI SST anomaly, Telangana {yLabel} increases on average by {slope.toFixed(2)}°C.
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span> El Niño</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span> Neutral</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span> La Niña</span>
        </div>
      </div>
    </div>
  );
};
