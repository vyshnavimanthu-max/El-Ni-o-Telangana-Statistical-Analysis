import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { EnsoObservation } from '../types/enso';
import { EmptyState } from '../components/EmptyState';
import { SourceBadge } from '../components/SourceBadge';
import { calculateMean, calculateStdDev } from '../statistics/engine';

interface EnsoTimeSeriesChartProps {
  data: EnsoObservation[];
  onConnectClick?: () => void;
  className?: string;
  defaultPeriod?: '1980_LATEST' | '1950_LATEST';
}

export const EnsoTimeSeriesChart: React.FC<EnsoTimeSeriesChartProps> = ({
  data,
  onConnectClick,
  className = '',
  defaultPeriod = '1980_LATEST'
}) => {
  const [periodPreset, setPeriodPreset] = useState<'1980_LATEST' | '1950_LATEST' | 'CUSTOM'>('1980_LATEST');
  const [seasonFocus, setSeasonFocus] = useState<'ALL' | 'MONSOON'>('MONSOON');

  // Compute available bounds from actual data
  const availableYears = useMemo<number[]>(() => {
    if (!data || data.length === 0) return [];
    const set = new Set<number>();
    data.forEach(d => set.add(d.year));
    return Array.from(set).sort((a: number, b: number) => a - b);
  }, [data]);

  const minAvailableYear = availableYears.length > 0 ? availableYears[0] : 1950;
  const maxAvailableYear = availableYears.length > 0 ? availableYears[availableYears.length - 1] : 2026;

  // Filter based on preset
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    let startY = 1980;
    if (periodPreset === '1950_LATEST') {
      startY = 1950;
    } else if (periodPreset === '1980_LATEST') {
      startY = 1980;
    }

    return data.filter(d => {
      const yearMatch = d.year >= startY && d.year <= maxAvailableYear;
      const seasonMatch = seasonFocus === 'ALL' || ['JJA', 'JAS', 'ASO'].includes(d.season3Month);
      return yearMatch && seasonMatch;
    });
  }, [data, periodPreset, seasonFocus, maxAvailableYear]);

  if (!data || data.length === 0) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Historical Oceanic Niño Index (ONI) Time-Series Chart
            </h3>
            <p className="text-xs text-slate-500">
              Niño 3.4 Region SST Anomaly (°C) with Authoritative NOAA Operational Thresholds
            </p>
          </div>
        </div>
        <EmptyState
          title="Awaiting Official NOAA ONI Time Series"
          message="Connect official NOAA Climate Prediction Center ONI series to display sea surface temperature anomalies across the 1950–2026 timeframe."
          sourceAuthority="NOAA Climate Prediction Center (CPC)"
          requiredSchema={['Year', 'Season (3-month)', 'ONI_Anomaly_C', 'Classification']}
          onConnectClick={onConnectClick}
        />
        <div className="mt-3">
          <SourceBadge
            source="NOAA Climate Prediction Center (CPC) / ERSST.v5"
            period="1950 – 2026"
            units="°C (Niño 3.4 SST Anomaly)"
            observationCount={null}
          />
        </div>
      </div>
    );
  }

  // Summary statistics for displayed timeframe
  const oniValues = filteredData.map(d => d.oniValue);
  const meanOni = calculateMean(oniValues);
  const stdOni = calculateStdDev(oniValues);
  const maxOni = oniValues.length > 0 ? Math.max(...oniValues) : null;
  const minOni = oniValues.length > 0 ? Math.min(...oniValues) : null;
  const elNinoCount = filteredData.filter(d => d.phase === 'EL_NINO').length;
  const laNinaCount = filteredData.filter(d => d.phase === 'LA_NINA').length;
  const neutralCount = filteredData.filter(d => d.phase === 'NEUTRAL').length;

  const formattedChartData = filteredData.map((d) => ({
    label: seasonFocus === 'MONSOON' ? `${d.year} (${d.season3Month})` : `${d.year} ${d.season3Month}`,
    year: d.year,
    season: d.season3Month,
    oni: d.oniValue,
    phase: d.phase,
    classification: d.classification
  }));

  const activeStartYear = periodPreset === '1950_LATEST' ? Math.max(1950, minAvailableYear) : Math.max(1980, minAvailableYear);

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header & Interactive Range Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 uppercase">
              NOAA Operational Series
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Displayed Window: <strong>{activeStartYear}–{maxAvailableYear}</strong> (N = {filteredData.length} records)
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            Oceanic Niño Index (ONI) 3-Month Running Mean Time Series
          </h3>
          <p className="text-xs text-slate-500">
            Niño 3.4 Region SST Anomaly (°C) • Thresholds: El Niño ≥ +0.5°C (Warm) | La Niña ≤ -0.5°C (Cool)
          </p>
        </div>

        {/* Timeframe and Season Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Presets */}
          <div className="flex items-center bg-slate-100 p-1 rounded-md text-xs">
            <button
              type="button"
              onClick={() => setPeriodPreset('1980_LATEST')}
              className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                periodPreset === '1980_LATEST'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1980–{maxAvailableYear} <span className="text-[10px] text-teal-700 font-semibold">(Default Research)</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriodPreset('1950_LATEST')}
              className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                periodPreset === '1950_LATEST'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1950–{maxAvailableYear} (Full NOAA Archive)
            </button>
          </div>

          {/* Season Focus Switch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-md text-xs">
            <button
              type="button"
              onClick={() => setSeasonFocus('MONSOON')}
              className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
                seasonFocus === 'MONSOON'
                  ? 'bg-teal-700 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monsoon Epochs (JJA/JAS/ASO)
            </button>
            <button
              type="button"
              onClick={() => setSeasonFocus('ALL')}
              className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
                seasonFocus === 'ALL'
                  ? 'bg-teal-700 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All 12 Seasons
            </button>
          </div>
        </div>
      </div>

      {/* Phase Threshold Visual Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-md">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 font-medium text-rose-700">
            <span className="w-3 h-3 rounded bg-rose-500 inline-block"></span>
            El Niño Phase (ONI ≥ +0.5°C) — {elNinoCount} ({((elNinoCount / Math.max(1, filteredData.length)) * 100).toFixed(0)}%)
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-3 h-3 rounded bg-slate-400 inline-block"></span>
            Neutral Phase (-0.5°C &lt; ONI &lt; +0.5°C) — {neutralCount} ({((neutralCount / Math.max(1, filteredData.length)) * 100).toFixed(0)}%)
          </span>
          <span className="flex items-center gap-1.5 font-medium text-sky-700">
            <span className="w-3 h-3 rounded bg-sky-500 inline-block"></span>
            La Niña Phase (ONI ≤ -0.5°C) — {laNinaCount} ({((laNinaCount / Math.max(1, filteredData.length)) * 100).toFixed(0)}%)
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-600">
          <span>Mean: <strong>{meanOni !== null ? `${meanOni > 0 ? '+' : ''}${meanOni.toFixed(2)}°C` : '—'}</strong></span>
          <span>σ: <strong>±{stdOni !== null ? stdOni.toFixed(2) : '—'}°C</strong></span>
          <span>Peak Warm: <strong className="text-rose-600">+{maxOni?.toFixed(2)}°C</strong></span>
          <span>Peak Cool: <strong className="text-sky-600">{minOni?.toFixed(2)}°C</strong></span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedChartData} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#64748b' }}
              interval={Math.max(1, Math.floor(formattedChartData.length / 14))}
            />
            <YAxis
              domain={[-2.5, 3.0]}
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}°C`}
              label={{ value: 'ONI SST Anomaly (°C)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '12px', color: '#fff' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload;
                  const isElNino = pt.oni >= 0.5;
                  const isLaNina = pt.oni <= -0.5;
                  const phaseLabel = isElNino ? 'El Niño (Warm)' : isLaNina ? 'La Niña (Cool)' : 'Neutral';
                  const phaseColor = isElNino ? 'text-rose-400' : isLaNina ? 'text-sky-400' : 'text-slate-300';
                  
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-md shadow-lg text-xs font-sans space-y-1">
                      <div className="font-bold border-b border-slate-700 pb-1 flex items-center justify-between gap-4">
                        <span>Year {pt.year} • {pt.season}</span>
                        <span className={`font-mono ${phaseColor}`}>{phaseLabel}</span>
                      </div>
                      <div className="font-mono text-slate-300 pt-1">
                        ONI Value: <strong className="text-teal-300 text-sm">{pt.oni > 0 ? '+' : ''}{pt.oni.toFixed(2)} °C</strong>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Classification: {pt.classification?.replace(/_/g, ' ') || phaseLabel}
                      </div>
                      <div className="text-[10px] text-slate-500 pt-0.5 border-t border-slate-800">
                        Threshold: {pt.oni >= 2.0 ? 'Very Strong' : pt.oni >= 1.5 ? 'Strong' : pt.oni >= 1.0 ? 'Moderate' : pt.oni >= 0.5 ? 'Weak' : pt.oni <= -1.5 ? 'Strong' : pt.oni <= -1.0 ? 'Moderate' : pt.oni <= -0.5 ? 'Weak' : 'Within Normal Bounds'}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Zero Baseline & NOAA Operational Thresholds */}
            <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} strokeDasharray="2 2" />
            <ReferenceLine y={0.5} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '+0.5°C El Niño', fill: '#e11d48', fontSize: 10, position: 'right' }} />
            <ReferenceLine y={-0.5} stroke="#0284c7" strokeDasharray="3 3" label={{ value: '-0.5°C La Niña', fill: '#0369a1', fontSize: 10, position: 'right' }} />
            <ReferenceLine y={1.5} stroke="#be123c" strokeDasharray="2 2" strokeOpacity={0.5} label={{ value: '+1.5°C Strong', fill: '#9f1239', fontSize: 9, position: 'right' }} />
            <ReferenceLine y={-1.5} stroke="#0369a1" strokeDasharray="2 2" strokeOpacity={0.5} label={{ value: '-1.5°C Strong', fill: '#075985', fontSize: 9, position: 'right' }} />

            <Line
              type="monotone"
              dataKey="oni"
              stroke="#0f172a"
              strokeWidth={1.8}
              dot={false}
              activeDot={{ r: 5, fill: '#0d9488', stroke: '#fff', strokeWidth: 1.5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* NOAA Methodology Explanatory Callout */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 leading-relaxed">
        <strong className="text-slate-800">NOAA CPC Methodology Note:</strong> An El Niño or La Niña episode is formally classified by NOAA when the Oceanic Niño Index (3-month running mean of ERSST.v5 in Niño 3.4: 5°N–5°S, 120°W–170°W) meets or exceeds the threshold of <span className="font-mono font-bold text-rose-700">+0.5°C</span> or <span className="font-mono font-bold text-sky-700">-0.5°C</span> for at least 5 consecutive overlapping seasons. Both categorical classifications and continuous ONI numerical metrics are preserved throughout this suite.
      </div>

      <div className="pt-2">
        <SourceBadge
          source="NOAA Climate Prediction Center (CPC) / ERSST.v5"
          period={`${activeStartYear} – ${maxAvailableYear}`}
          units="°C (Niño 3.4 SST Anomaly)"
          observationCount={filteredData.length}
        />
      </div>
    </div>
  );
};
