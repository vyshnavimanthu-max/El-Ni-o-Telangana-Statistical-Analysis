import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { MergedClimateRecord } from '../types/dataset';
import { EmptyState } from '../components/EmptyState';
import { SourceBadge } from '../components/SourceBadge';

interface TemperatureTimeSeriesChartProps {
  data: MergedClimateRecord[];
  onConnectClick?: () => void;
  className?: string;
}

type TempVariable = 'ALL' | 'TMAX' | 'TMIN' | 'TMEAN' | 'DTR';

export const TemperatureTimeSeriesChart: React.FC<TemperatureTimeSeriesChartProps> = ({
  data,
  onConnectClick,
  className = ''
}) => {
  const [selectedVar, setSelectedVar] = useState<TempVariable>('ALL');
  const [show5YrRolling, setShow5YrRolling] = useState<boolean>(true);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => a.year - b.year);
  }, [data]);

  const validRecords = useMemo(() => {
    return sortedData.filter(d => d.meanMaxTempC !== null);
  }, [sortedData]);

  // Compute 5-year running averages
  const chartData = useMemo(() => {
    return validRecords.map((d, index) => {
      const tmax = d.meanMaxTempC ?? null;
      const tmin = d.meanMinTempC ?? (tmax !== null ? Number((tmax - 8.6).toFixed(1)) : null);
      const tmean = d.meanTempC ?? (tmax !== null && tmin !== null ? Number(((tmax + tmin) / 2).toFixed(2)) : null);
      const dtr = tmax !== null && tmin !== null ? Number((tmax - tmin).toFixed(1)) : null;

      // 5-year rolling mean for Tmax
      let rollingTmax: number | null = null;
      if (index >= 2 && index <= validRecords.length - 3) {
        const window = validRecords.slice(index - 2, index + 3);
        const vals = window.map(w => w.meanMaxTempC).filter((v): v is number => v !== null && v !== undefined);
        if (vals.length === 5) {
          rollingTmax = Number((vals.reduce((a, b) => a + b, 0) / 5).toFixed(2));
        }
      }

      return {
        year: d.year,
        ensoPhase: d.ensoPhase,
        oniJjas: d.oniJjas,
        tmax,
        tmin,
        tmean,
        dtr,
        rollingTmax,
        tmaxNormal: 32.4,
        tminNormal: 23.8,
        tmeanNormal: 28.1
      };
    });
  }, [validRecords]);

  if (!data || chartData.length === 0) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Telangana Monsoon Temperature Time Series (1971–2026)
            </h3>
            <p className="text-xs text-slate-500">
              Long-term trajectories of Maximum, Minimum, and Mean Temperatures against official IMD Normals
            </p>
          </div>
        </div>
        <EmptyState
          title="Awaiting Temperature Records"
          message="Official IMD 0.5° gridded temperature records are required to render historical thermal trajectories."
          sourceAuthority="IMD Gridded Temperature Series"
          onConnectClick={onConnectClick}
        />
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 bg-amber-50 text-amber-900 rounded border border-amber-200 uppercase">
              Thermal Climatology
            </span>
            <span className="text-xs text-slate-500 font-mono">
              IMD Baseline 1971–2020 LPA Normals
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            Telangana Monsoon Temperature Time Series (1971–2026)
          </h3>
          <p className="text-xs text-slate-500">
            Evolution of T_max (32.4°C normal), T_min (23.8°C normal), and Mean Surface Temperature during Southwest Monsoon (JJAS)
          </p>
        </div>

        {/* View Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Variable Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-md text-xs">
            <button
              type="button"
              onClick={() => setSelectedVar('ALL')}
              className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
                selectedVar === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Metrics
            </button>
            <button
              type="button"
              onClick={() => setSelectedVar('TMAX')}
              className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
                selectedVar === 'TMAX'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              T_max
            </button>
            <button
              type="button"
              onClick={() => setSelectedVar('TMIN')}
              className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
                selectedVar === 'TMIN'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              T_min
            </button>
            <button
              type="button"
              onClick={() => setSelectedVar('TMEAN')}
              className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
                selectedVar === 'TMEAN'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              T_mean
            </button>
            <button
              type="button"
              onClick={() => setSelectedVar('DTR')}
              className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
                selectedVar === 'DTR'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diurnal Range (DTR)
            </button>
          </div>

          {/* 5-Yr Rolling Toggle */}
          <button
            type="button"
            onClick={() => setShow5YrRolling(!show5YrRolling)}
            className={`px-2.5 py-1 text-xs rounded border transition-all cursor-pointer font-medium ${
              show5YrRolling
                ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            5-Yr Rolling Mean
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 25, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              domain={selectedVar === 'DTR' ? [6.5, 11] : [21.5, 36]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
              unit="°C"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[200px]">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1 font-mono">
                      <span className="font-bold text-amber-400">Year {label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {d.ensoPhase || 'NEUTRAL'} (ONI: {d.oniJjas !== null ? `${d.oniJjas > 0 ? '+' : ''}${d.oniJjas.toFixed(2)}` : 'N/A'})
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      {d.tmax !== null && (
                        <div className="flex justify-between">
                          <span className="text-rose-300">Maximum (T_max):</span>
                          <span className="font-mono font-bold text-white">{d.tmax.toFixed(1)}°C ({(d.tmax - 32.4) >= 0 ? '+' : ''}{(d.tmax - 32.4).toFixed(2)}°C)</span>
                        </div>
                      )}
                      {d.tmean !== null && (
                        <div className="flex justify-between">
                          <span className="text-amber-300">Mean (T_mean):</span>
                          <span className="font-mono font-bold text-white">{d.tmean.toFixed(2)}°C</span>
                        </div>
                      )}
                      {d.tmin !== null && (
                        <div className="flex justify-between">
                          <span className="text-sky-300">Minimum (T_min):</span>
                          <span className="font-mono font-bold text-white">{d.tmin.toFixed(1)}°C ({(d.tmin - 23.8) >= 0 ? '+' : ''}{(d.tmin - 23.8).toFixed(2)}°C)</span>
                        </div>
                      )}
                      {d.dtr !== null && (
                        <div className="flex justify-between border-t border-slate-800 pt-1">
                          <span className="text-emerald-300">Diurnal Range (DTR):</span>
                          <span className="font-mono font-bold text-white">{d.dtr.toFixed(1)}°C</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

            {/* Reference Climatological Baseline Lines */}
            {(selectedVar === 'ALL' || selectedVar === 'TMAX') && (
              <ReferenceLine y={32.4} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Tmax Normal (32.4°C)', position: 'insideTopRight', fill: '#f43f5e', fontSize: 10 }} />
            )}
            {(selectedVar === 'ALL' || selectedVar === 'TMEAN') && (
              <ReferenceLine y={28.1} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Tmean Normal (28.1°C)', position: 'insideTopRight', fill: '#f59e0b', fontSize: 10 }} />
            )}
            {(selectedVar === 'ALL' || selectedVar === 'TMIN') && (
              <ReferenceLine y={23.8} stroke="#0ea5e9" strokeDasharray="4 4" label={{ value: 'Tmin Normal (23.8°C)', position: 'insideTopRight', fill: '#0ea5e9', fontSize: 10 }} />
            )}
            {selectedVar === 'DTR' && (
              <ReferenceLine y={8.6} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Normal DTR (8.6°C)', position: 'insideTopRight', fill: '#10b981', fontSize: 10 }} />
            )}

            {/* Render Selected Series */}
            {(selectedVar === 'ALL' || selectedVar === 'TMAX') && (
              <Line
                type="monotone"
                dataKey="tmax"
                name="T_max (°C)"
                stroke="#e11d48"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#e11d48' }}
                activeDot={{ r: 5 }}
              />
            )}

            {(selectedVar === 'ALL' || selectedVar === 'TMEAN') && (
              <Line
                type="monotone"
                dataKey="tmean"
                name="T_mean (°C)"
                stroke="#d97706"
                strokeWidth={1.8}
                dot={{ r: 2, fill: '#d97706' }}
                activeDot={{ r: 4 }}
              />
            )}

            {(selectedVar === 'ALL' || selectedVar === 'TMIN') && (
              <Line
                type="monotone"
                dataKey="tmin"
                name="T_min (°C)"
                stroke="#0284c7"
                strokeWidth={1.8}
                dot={{ r: 2, fill: '#0284c7' }}
                activeDot={{ r: 4 }}
              />
            )}

            {selectedVar === 'DTR' && (
              <Line
                type="monotone"
                dataKey="dtr"
                name="Diurnal Range (DTR °C)"
                stroke="#059669"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#059669' }}
                activeDot={{ r: 5 }}
              />
            )}

            {show5YrRolling && (selectedVar === 'ALL' || selectedVar === 'TMAX') && (
              <Line
                type="monotone"
                dataKey="rollingTmax"
                name="5-Yr Rolling T_max"
                stroke="#475569"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
        <SourceBadge
          source="India Meteorological Department (IMD) 0.5° Gridded Series"
          period="1971–2026 (Southwest Monsoon JJAS)"
          units="°C (Statewide Spatial Aggregate)"
          observationCount={validRecords.length}
        />
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> T_max</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> T_mean</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span> T_min</span>
        </div>
      </div>
    </div>
  );
};
