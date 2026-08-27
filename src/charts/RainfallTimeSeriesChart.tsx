import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';
import { RainfallObservation } from '../types/climate';
import { EmptyState } from '../components/EmptyState';
import { SourceBadge } from '../components/SourceBadge';
import { calculateMean, calculateStdDev } from '../statistics/engine';

export type RainfallVariableKey = 'JJAS' | 'ANNUAL' | 'JUNE' | 'JULY' | 'AUGUST' | 'SEPTEMBER';

export interface VariableConfig {
  key: RainfallVariableKey;
  label: string;
  shortLabel: string;
  normalMm: number; // IMD 1971-2020 Long Period Average
  referencePeriod: string;
  getter: (d: RainfallObservation) => number | null;
}

export const RAINFALL_VARIABLES: Record<RainfallVariableKey, VariableConfig> = {
  JJAS: {
    key: 'JJAS',
    label: 'Southwest Monsoon (JJAS Total)',
    shortLabel: 'Monsoon JJAS',
    normalMm: 750.5,
    referencePeriod: 'IMD LPA (1971–2020)',
    getter: (d) => d.southwestMonsoonTotal
  },
  ANNUAL: {
    key: 'ANNUAL',
    label: 'Annual Rainfall Total (Jan–Dec)',
    shortLabel: 'Annual Total',
    normalMm: 952.7,
    referencePeriod: 'IMD LPA (1971–2020)',
    getter: (d) => d.annualTotal
  },
  JUNE: {
    key: 'JUNE',
    label: 'June Rainfall (Monsoon Onset)',
    shortLabel: 'June',
    normalMm: 129.5,
    referencePeriod: 'IMD LPA (1971–2020)',
    getter: (d) => d.june
  },
  JULY: {
    key: 'JULY',
    label: 'July Rainfall (Peak Vegetative Stage)',
    shortLabel: 'July',
    normalMm: 242.8,
    referencePeriod: 'IMD LPA (1971–2020)',
    getter: (d) => d.july
  },
  AUGUST: {
    key: 'AUGUST',
    label: 'August Rainfall (Active Monsoon & Flowering)',
    shortLabel: 'August',
    normalMm: 218.4,
    referencePeriod: 'IMD LPA (1971–2020)',
    getter: (d) => d.august
  },
  SEPTEMBER: {
    key: 'SEPTEMBER',
    label: 'September Rainfall (Monsoon Withdrawal & Maturity)',
    shortLabel: 'September',
    normalMm: 159.8,
    referencePeriod: 'IMD LPA (1971–2020)',
    getter: (d) => d.september
  }
};

interface RainfallTimeSeriesChartProps {
  data: RainfallObservation[];
  selectedVariable?: RainfallVariableKey;
  onVariableChange?: (v: RainfallVariableKey) => void;
  onConnectClick?: () => void;
  className?: string;
}

export const RainfallTimeSeriesChart: React.FC<RainfallTimeSeriesChartProps> = ({
  data,
  selectedVariable: controlledVar,
  onVariableChange,
  onConnectClick,
  className = ''
}) => {
  const [internalVar, setInternalVar] = useState<RainfallVariableKey>('JJAS');
  const [displayMode, setDisplayMode] = useState<'ABSOLUTE' | 'ANOMALY'>('ABSOLUTE');

  const currentVarKey = controlledVar || internalVar;
  const currentVarConfig = RAINFALL_VARIABLES[currentVarKey];

  const handleVarSelect = (key: RainfallVariableKey) => {
    if (onVariableChange) onVariableChange(key);
    else setInternalVar(key);
  };

  if (!data || data.length === 0) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-4 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Telangana Rainfall Time Series
            </h3>
            <p className="text-xs text-slate-500">
              Precipitation vs IMD 1971–2020 Long Period Average (LPA = {currentVarConfig.normalMm} mm)
            </p>
          </div>
        </div>
        <EmptyState
          title="Awaiting Official IMD Rainfall Series"
          message="Connect official IMD Gridded / DES Telangana rainfall dataset to plot historical precipitation and percentage departures from normal."
          sourceAuthority="India Meteorological Department (IMD)"
          requiredSchema={['Year', 'JJAS_Total_mm', 'LPA_Baseline_750.5mm', 'Departure_Pct']}
          onConnectClick={onConnectClick}
        />
        <div className="mt-3">
          <SourceBadge
            source="India Meteorological Department (IMD) / DES Telangana"
            period="1980 – 2024"
            units="mm / % Departure"
            observationCount={null}
          />
        </div>
      </div>
    );
  }

  // Map chart points and calculate anomaly dynamically using explicit formula: ((Observed - Normal) / Normal) * 100
  const chartData = data
    .map(d => {
      const val = currentVarConfig.getter(d);
      if (val === null || val === undefined) return null;
      const normal = currentVarConfig.normalMm;
      const anomalyMm = val - normal;
      const anomalyPercent = ((val - normal) / normal) * 100;

      // IMD Classification
      let imdClass = 'Normal';
      let barColor = '#0d9488'; // Teal for normal (-19% to +19%)
      if (anomalyPercent >= 60) {
        imdClass = 'Large Excess (≥ +60%)';
        barColor = '#0284c7'; // Deep sky
      } else if (anomalyPercent >= 20) {
        imdClass = 'Excess (+20% to +59%)';
        barColor = '#38bdf8'; // Sky
      } else if (anomalyPercent <= -60) {
        imdClass = 'Large Deficient (≤ -60%)';
        barColor = '#dc2626'; // Red
      } else if (anomalyPercent <= -20) {
        imdClass = 'Deficient (-20% to -59%)';
        barColor = '#ea580c'; // Orange-amber
      }

      return {
        year: d.year,
        observedMm: val,
        normalMm: normal,
        anomalyMm: Number(anomalyMm.toFixed(1)),
        anomalyPercent: Number(anomalyPercent.toFixed(1)),
        imdClass,
        barColor
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  const observedValues = chartData.map(d => d.observedMm);
  const sampleMean = calculateMean(observedValues);
  const sampleStd = calculateStdDev(observedValues);
  const sampleCv = sampleMean && sampleStd ? (sampleStd / sampleMean) * 100 : null;

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Header with Variable Tabs and View Mode */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold border border-slate-200">
                Variable: {currentVarConfig.label}
              </span>
              <span className="text-[10px] text-teal-700 font-mono font-medium">
                Normal: {currentVarConfig.normalMm} mm ({currentVarConfig.referencePeriod})
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Telangana {currentVarConfig.shortLabel} {displayMode === 'ABSOLUTE' ? 'Precipitation Series (mm)' : 'Rainfall Departure (% Anomaly)'}
            </h3>
            <p className="text-xs text-slate-500">
              {displayMode === 'ABSOLUTE' 
                ? `Annual observed precipitation vs IMD 1971–2020 Long Period Average (${currentVarConfig.normalMm} mm)`
                : `Anomaly % = ((Observed − Normal) / Normal) × 100 with IMD Standard Meteorological Categories`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setDisplayMode('ABSOLUTE')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  displayMode === 'ABSOLUTE' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Precipitation (mm)
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('ANOMALY')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  displayMode === 'ANOMALY' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Anomaly (%)
              </button>
            </div>
          </div>
        </div>

        {/* Variable Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {(Object.keys(RAINFALL_VARIABLES) as RainfallVariableKey[]).map(key => {
            const cfg = RAINFALL_VARIABLES[key];
            const isSelected = currentVarKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleVarSelect(key)}
                className={`px-2 py-1 text-xs rounded border transition-all ${
                  isSelected
                    ? 'bg-sky-50 border-sky-400 text-sky-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cfg.shortLabel} <span className="font-mono text-[10px] text-slate-400">({cfg.normalMm}mm)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-72 w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 20, left: -5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} />
            
            {displayMode === 'ABSOLUTE' ? (
              <>
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => `${v}mm`}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '12px', color: '#fff' }}
                  formatter={(val: any, name: string, item: any) => {
                    const p = item.payload;
                    return [
                      <div key="tip" className="space-y-1">
                        <div className="font-mono text-emerald-300 font-bold">{p.observedMm} mm</div>
                        <div className="text-slate-300 text-[11px]">Normal LPA: {p.normalMm} mm</div>
                        <div className="text-slate-300 text-[11px]">Departure: {p.anomalyPercent > 0 ? `+${p.anomalyPercent}%` : `${p.anomalyPercent}%`} ({p.anomalyMm > 0 ? `+${p.anomalyMm}mm` : `${p.anomalyMm}mm`})</div>
                        <div className="text-amber-300 text-[11px] font-semibold">IMD Category: {p.imdClass}</div>
                      </div>,
                      ''
                    ];
                  }}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <ReferenceLine
                  y={currentVarConfig.normalMm}
                  stroke="#0f766e"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{ value: `IMD LPA Baseline (${currentVarConfig.normalMm} mm)`, fill: '#0f766e', fontSize: 10, position: 'insideTopRight' }}
                />
                {sampleMean !== null && (
                  <ReferenceLine
                    y={sampleMean}
                    stroke="#64748b"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    label={{ value: `Sample Mean (${sampleMean.toFixed(1)} mm)`, fill: '#64748b', fontSize: 9, position: 'insideBottomRight' }}
                  />
                )}
                <Bar dataKey="observedMm" name="Precipitation" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.barColor} />
                  ))}
                </Bar>
              </>
            ) : (
              <>
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
                  domain={[-100, (dataMax: number) => Math.max(80, Math.ceil(dataMax / 20) * 20)]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '12px', color: '#fff' }}
                  formatter={(val: any, name: string, item: any) => {
                    const p = item.payload;
                    return [
                      <div key="tip" className="space-y-1">
                        <div className="font-mono text-sky-300 font-bold">{p.anomalyPercent > 0 ? `+${p.anomalyPercent}%` : `${p.anomalyPercent}%`}</div>
                        <div className="text-slate-300 text-[11px]">Observed: {p.observedMm} mm vs LPA {p.normalMm} mm</div>
                        <div className="text-slate-300 text-[11px]">Departure: {p.anomalyMm > 0 ? `+${p.anomalyMm}mm` : `${p.anomalyMm}mm`}</div>
                        <div className="text-amber-300 text-[11px] font-semibold">IMD Category: {p.imdClass}</div>
                      </div>,
                      ''
                    ];
                  }}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <ReferenceLine y={0} stroke="#334155" strokeWidth={1.5} />
                <ReferenceLine y={20} stroke="#38bdf8" strokeDasharray="3 3" label={{ value: '+20% (Excess)', fill: '#0284c7', fontSize: 9, position: 'insideTopLeft' }} />
                <ReferenceLine y={-20} stroke="#ea580c" strokeDasharray="3 3" label={{ value: '-20% (Deficient)', fill: '#c2410c', fontSize: 9, position: 'insideBottomLeft' }} />
                <ReferenceLine y={60} stroke="#0284c7" strokeDasharray="2 2" label={{ value: '+60% (Large Excess)', fill: '#0369a1', fontSize: 9, position: 'insideTopLeft' }} />
                <ReferenceLine y={-60} stroke="#dc2626" strokeDasharray="2 2" label={{ value: '-60% (Large Deficient)', fill: '#b91c1c', fontSize: 9, position: 'insideBottomLeft' }} />
                <Bar dataKey="anomalyPercent" name="Anomaly (%)" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-anom-${index}`} fill={entry.barColor} />
                  ))}
                </Bar>
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Climatological Metadata Documentation */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0284c7] inline-block"></span>
              <span className="text-slate-600">Large Excess (≥ +60%)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#38bdf8] inline-block"></span>
              <span className="text-slate-600">Excess (+20% to +59%)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0d9488] inline-block"></span>
              <span className="text-slate-600">Normal (-19% to +19%)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#ea580c] inline-block"></span>
              <span className="text-slate-600">Deficient (-20% to -59%)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#dc2626] inline-block"></span>
              <span className="text-slate-600">Large Deficient (≤ -60%)</span>
            </span>
          </div>

          <div className="font-mono text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            Sample Mean: <strong>{sampleMean ? `${sampleMean.toFixed(1)} mm` : 'N/A'}</strong> | SD: <strong>{sampleStd ? `±${sampleStd.toFixed(1)} mm` : 'N/A'}</strong> | CV: <strong>{sampleCv ? `${sampleCv.toFixed(1)}%` : 'N/A'}</strong>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
          <span>Formula: <code>Anomaly (%) = ((Observed − Normal) / Normal) × 100</code></span>
          <span>Baseline Normal: <strong>IMD 1971–2020 Long Period Average (LPA)</strong></span>
        </div>
      </div>
    </div>
  );
};
