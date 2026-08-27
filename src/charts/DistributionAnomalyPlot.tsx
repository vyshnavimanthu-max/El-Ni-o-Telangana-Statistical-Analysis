import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { MergedClimateRecord } from '../types/dataset';
import { EmptyState } from '../components/EmptyState';
import { SourceBadge } from '../components/SourceBadge';

interface DistributionAnomalyPlotProps {
  data: MergedClimateRecord[];
  onConnectClick?: () => void;
  className?: string;
}

export const DistributionAnomalyPlot: React.FC<DistributionAnomalyPlotProps> = ({
  data,
  onConnectClick,
  className = ''
}) => {
  const validData = data.filter(d => d.rainfallAnomalyPercent !== null && d.ensoPhase !== null);

  if (!data || validData.length < 5) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-4 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Rainfall Departure Frequency Distribution by ENSO Phase
            </h3>
            <p className="text-xs text-slate-500">
              Histogram of % rainfall departures categorised into IMD classification bins
            </p>
          </div>
        </div>
        <EmptyState
          title="Awaiting Distribution Dataset"
          message="Connect official dataset to compute the empirical histogram and frequency of drought/excess monsoon events under El Niño vs La Niña."
          sourceAuthority="IMD × NOAA CPC"
          requiredSchema={['Rainfall_Departure_Pct', 'ENSO_Phase']}
          onConnectClick={onConnectClick}
        />
        <div className="mt-3">
          <SourceBadge
            source="IMD Gridded Rainfall × NOAA CPC"
            period="Awaiting connection"
            units="% departure count"
            observationCount={null}
          />
        </div>
      </div>
    );
  }

  // Bins: Severe Deficit (< -25%), Moderate Deficit (-25% to -10%), Normal (-10% to +10%), Moderate Excess (+10% to +25%), Large Excess (> +25%)
  const bins = [
    { label: 'Severe Deficit (<-25%)', min: -100, max: -25 },
    { label: 'Mod Deficit (-25 to -10%)', min: -25, max: -10 },
    { label: 'Normal (-10 to +10%)', min: -10, max: 10 },
    { label: 'Mod Excess (+10 to +25%)', min: 10, max: 25 },
    { label: 'Large Excess (>+25%)', min: 25, max: 200 }
  ];

  const chartData = bins.map(bin => {
    const elNinoCount = validData.filter(d => d.ensoPhase === 'EL_NINO' && d.rainfallAnomalyPercent! >= bin.min && d.rainfallAnomalyPercent! < bin.max).length;
    const neutralCount = validData.filter(d => d.ensoPhase === 'NEUTRAL' && d.rainfallAnomalyPercent! >= bin.min && d.rainfallAnomalyPercent! < bin.max).length;
    const laNinaCount = validData.filter(d => d.ensoPhase === 'LA_NINA' && d.rainfallAnomalyPercent! >= bin.min && d.rainfallAnomalyPercent! < bin.max).length;

    return {
      bin: bin.label,
      'El Niño': elNinoCount,
      'Neutral': neutralCount,
      'La Niña': laNinaCount
    };
  });

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-4 shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Rainfall Departure Frequency Distribution by ENSO Phase
          </h3>
          <p className="text-xs text-slate-500">
            Frequency count of Telangana monsoon outcomes binned by IMD operational categories
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="bin" tick={{ fontSize: 10, fill: '#64748b' }} angle={-5} textAnchor="end" />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} label={{ value: 'Years Count', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#64748b' }} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '12px', color: '#fff' }} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Bar dataKey="El Niño" fill="#e11d48" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Neutral" fill="#64748b" radius={[2, 2, 0, 0]} />
            <Bar dataKey="La Niña" fill="#0284c7" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3">
        <SourceBadge
          source="India Meteorological Department (IMD) × NOAA CPC"
          period="1980 – 2024"
          units="Frequency (Years)"
          observationCount={validData.length}
        />
      </div>
    </div>
  );
};
