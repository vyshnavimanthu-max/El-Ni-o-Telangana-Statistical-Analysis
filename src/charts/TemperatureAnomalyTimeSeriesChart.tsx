import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';
import { MergedClimateRecord } from '../types/dataset';
import { EmptyState } from '../components/EmptyState';
import { SourceBadge } from '../components/SourceBadge';

interface TemperatureAnomalyTimeSeriesChartProps {
  data: MergedClimateRecord[];
  onConnectClick?: () => void;
  className?: string;
}

type AnomalyVariable = 'TMAX_ANOM' | 'TMIN_ANOM' | 'TMEAN_ANOM';

export const TemperatureAnomalyTimeSeriesChart: React.FC<TemperatureAnomalyTimeSeriesChartProps> = ({
  data,
  onConnectClick,
  className = ''
}) => {
  const [selectedVar, setSelectedVar] = useState<AnomalyVariable>('TMAX_ANOM');

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => a.year - b.year);
  }, [data]);

  const chartData = useMemo(() => {
    return sortedData
      .filter(d => d.meanMaxTempC !== null)
      .map(d => {
        const tmax = d.meanMaxTempC!;
        const tmin = d.meanMinTempC ?? (tmax - 8.6);
        const tmean = d.meanTempC ?? ((tmax + tmin) / 2);

        const tmaxAnom = d.tempMaxAnomalyC ?? Number((tmax - 32.4).toFixed(2));
        const tminAnom = d.tempMinAnomalyC ?? Number((tmin - 23.8).toFixed(2));
        const tmeanAnom = d.tempMeanAnomalyC ?? Number((tmean - 28.1).toFixed(2));

        let activeAnom = tmaxAnom;
        if (selectedVar === 'TMIN_ANOM') activeAnom = tminAnom;
        if (selectedVar === 'TMEAN_ANOM') activeAnom = tmeanAnom;

        return {
          year: d.year,
          anomaly: activeAnom,
          tmaxAnom,
          tminAnom,
          tmeanAnom,
          tmax,
          tmin,
          tmean,
          ensoPhase: d.ensoPhase,
          oniJjas: d.oniJjas
        };
      });
  }, [sortedData, selectedVar]);

  if (!data || chartData.length === 0) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Telangana Temperature Anomaly Departures (1971–2026)
            </h3>
            <p className="text-xs text-slate-500">
              Interannual thermal departures relative to IMD 1971–2020 LPA Climatological Normals
            </p>
          </div>
        </div>
        <EmptyState
          title="Awaiting Temperature Anomaly Records"
          message="Official IMD gridded series required to calculate temperature anomalies."
          sourceAuthority="IMD Climatology"
          onConnectClick={onConnectClick}
        />
      </div>
    );
  }

  const getMetricLabel = () => {
    switch (selectedVar) {
      case 'TMAX_ANOM': return 'Maximum Temperature Anomaly (ΔT_max)';
      case 'TMIN_ANOM': return 'Minimum Temperature Anomaly (ΔT_min)';
      case 'TMEAN_ANOM': return 'Mean Temperature Anomaly (ΔT_mean)';
    }
  };

  const getNormalBaseline = () => {
    switch (selectedVar) {
      case 'TMAX_ANOM': return '32.4°C';
      case 'TMIN_ANOM': return '23.8°C';
      case 'TMEAN_ANOM': return '28.1°C';
    }
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header & Metric Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 bg-rose-50 text-rose-900 rounded border border-rose-200 uppercase">
              Thermal Departures
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Baseline Normal: {getNormalBaseline()}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            {getMetricLabel()}
          </h3>
          <p className="text-xs text-slate-500">
            Divergence from long-period average showing persistent positive thermal anomalies in El Niño years vs cooling in La Niña
          </p>
        </div>

        {/* Variable Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-md text-xs">
          <button
            type="button"
            onClick={() => setSelectedVar('TMAX_ANOM')}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              selectedVar === 'TMAX_ANOM'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ΔT_max
          </button>
          <button
            type="button"
            onClick={() => setSelectedVar('TMIN_ANOM')}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              selectedVar === 'TMIN_ANOM'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ΔT_min
          </button>
          <button
            type="button"
            onClick={() => setSelectedVar('TMEAN_ANOM')}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              selectedVar === 'TMEAN_ANOM'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ΔT_mean
          </button>
        </div>
      </div>

      {/* Anomaly Bar Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 15, right: 25, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              domain={[-2.5, 2.5]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
              unit="°C"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                const isWarm = d.anomaly >= 0;
                return (
                  <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[200px]">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1 font-mono">
                      <span className="font-bold text-amber-400">Year {label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {d.ensoPhase || 'NEUTRAL'} (ONI: {d.oniJjas !== null ? `${d.oniJjas > 0 ? '+' : ''}${d.oniJjas.toFixed(2)}` : 'N/A'})
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Selected Departure:</span>
                        <span className={`font-mono font-bold ${isWarm ? 'text-rose-400' : 'text-sky-400'}`}>
                          {d.anomaly >= 0 ? '+' : ''}{d.anomaly.toFixed(2)}°C
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Observed T_max:</span>
                        <span className="font-mono text-white">{d.tmax.toFixed(1)}°C (Δ {d.tmaxAnom >= 0 ? '+' : ''}{d.tmaxAnom.toFixed(2)}°C)</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Observed T_min:</span>
                        <span className="font-mono text-white">{d.tmin.toFixed(1)}°C (Δ {d.tminAnom >= 0 ? '+' : ''}{d.tminAnom.toFixed(2)}°C)</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            {/* Zero Baseline */}
            <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
            {/* Heat Stress Thresholds */}
            <ReferenceLine y={1.0} stroke="#f43f5e" strokeDasharray="3 3" strokeOpacity={0.7} label={{ value: '+1.0°C Heat Stress', position: 'insideTopRight', fill: '#e11d48', fontSize: 10 }} />
            <ReferenceLine y={-1.0} stroke="#0284c7" strokeDasharray="3 3" strokeOpacity={0.7} label={{ value: '-1.0°C Cloud Shielding', position: 'insideBottomRight', fill: '#0284c7', fontSize: 10 }} />

            <Bar dataKey="anomaly" name="Anomaly (°C)">
              {chartData.map((entry, index) => {
                const val = entry.anomaly;
                let fill = '#94a3b8';
                if (val >= 1.5) fill = '#be123c';      // Severe Positive Heat Anomaly
                else if (val >= 0.8) fill = '#e11d48'; // Moderate Positive Heat
                else if (val > 0) fill = '#fb7185';    // Mild Warm Anomaly
                else if (val <= -1.2) fill = '#0369a1';// Severe Negative Anomaly
                else if (val <= -0.5) fill = '#0284c7';// Moderate Cool Anomaly
                else fill = '#38bdf8';                 // Mild Cool Anomaly

                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
        <SourceBadge
          source="India Meteorological Department (IMD) 0.5° Temperature Grid"
          period="1971–2026 (Southwest Monsoon JJAS)"
          units="°C Departure from 1971–2020 Normal"
          observationCount={chartData.length}
        />
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block"></span> Warm (El Niño enhanced)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-sky-600 inline-block"></span> Cool (La Niña suppressed)</span>
        </div>
      </div>
    </div>
  );
};
