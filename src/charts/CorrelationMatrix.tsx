import React from 'react';
import { MergedClimateRecord } from '../types/dataset';
import { calculatePearsonCorrelation } from '../statistics/engine';
import { EmptyState } from '../components/EmptyState';
import { SourceBadge } from '../components/SourceBadge';

interface CorrelationMatrixProps {
  data: MergedClimateRecord[];
  onConnectClick?: () => void;
  className?: string;
}

export const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({
  data,
  onConnectClick,
  className = ''
}) => {
  const validData = data.filter(d => d.oniJjas !== null && d.rainfallAnomalyPercent !== null);

  const variables = [
    { key: 'oniJjas', label: 'ONI (JJAS)', short: 'ONI' },
    { key: 'rainfallJjasMm', label: 'Rainfall (mm)', short: 'Rain (mm)' },
    { key: 'rainfallAnomalyPercent', label: 'Rainfall Anomaly (%)', short: 'Rain %' },
    { key: 'meanMaxTempC', label: 'Max Temp (°C)', short: 'T_max' },
    { key: 'paddyYieldKgHa', label: 'Paddy Yield', short: 'Paddy' },
    { key: 'cottonYieldKgHa', label: 'Cotton Yield', short: 'Cotton' },
    { key: 'maizeYieldKgHa', label: 'Maize Yield', short: 'Maize' }
  ];

  if (!data || validData.length < 3) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-4 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Multivariate Statistical Correlation Matrix (Pearson r & p-values)
            </h3>
            <p className="text-xs text-slate-500">
              Pairwise correlation grid across ENSO, meteorological, and crop productivity variables
            </p>
          </div>
        </div>
        <EmptyState
          title="Awaiting Ingested Multivariate Series"
          message="Connect official dataset to compute the full correlation matrix with two-tailed p-values and 95% confidence intervals."
          sourceAuthority="NOAA CPC × IMD × DES Telangana"
          requiredSchema={['ONI_JJAS', 'Rainfall_mm', 'Rainfall_Departure', 'Max_Temp', 'Crop_Yields']}
          onConnectClick={onConnectClick}
        />
        <div className="mt-3">
          <SourceBadge
            source="Multivariate Synthesis (NOAA × IMD × DES)"
            period="Awaiting connection"
            units="Dimensionless r [-1.0, +1.0]"
            observationCount={null}
          />
        </div>
      </div>
    );
  }

  // Compute pairwise correlation grid
  const matrix: { varA: string; varB: string; r: number | null; p: number | null; sig: boolean | null }[][] = [];

  for (let i = 0; i < variables.length; i++) {
    const row: any[] = [];
    for (let j = 0; j < variables.length; j++) {
      if (i === j) {
        row.push({ varA: variables[i].label, varB: variables[j].label, r: 1.0, p: 0, sig: true });
      } else {
        const seriesA = validData.map(d => (d as any)[variables[i].key]);
        const seriesB = validData.map(d => (d as any)[variables[j].key]);
        const res = calculatePearsonCorrelation(seriesA, seriesB, variables[i].label, variables[j].label);
        row.push({
          varA: variables[i].label,
          varB: variables[j].label,
          r: res.pearsonR,
          p: res.pValuePearson,
          sig: res.isStatisticallySignificant
        });
      }
    }
    matrix.push(row);
  }

  // Helper for heatmap cell color
  const getCellColor = (r: number | null) => {
    if (r === null) return 'bg-slate-100 text-slate-400';
    if (r === 1.0) return 'bg-slate-200 text-slate-700 font-bold';
    if (r > 0.6) return 'bg-teal-600 text-white font-bold';
    if (r > 0.3) return 'bg-teal-200 text-teal-900 font-medium';
    if (r > 0.05) return 'bg-teal-50 text-teal-800';
    if (r < -0.6) return 'bg-amber-700 text-white font-bold';
    if (r < -0.3) return 'bg-amber-200 text-amber-900 font-medium';
    if (r < -0.05) return 'bg-amber-50 text-amber-800';
    return 'bg-slate-50 text-slate-600';
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-4 shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Multivariate Correlation Matrix (Pearson Product-Moment r)
          </h3>
          <p className="text-xs text-slate-500">
            Pairwise bivariate coefficients. Statistically significant cells (* p &lt; 0.05, ** p &lt; 0.01) highlighted.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500"></span> Negative r
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-teal-600"></span> Positive r
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left font-semibold text-slate-500 border border-slate-200 bg-slate-50">
                Variable
              </th>
              {variables.map(v => (
                <th key={v.key} className="p-2 text-center font-semibold text-slate-700 border border-slate-200 bg-slate-50 whitespace-nowrap">
                  {v.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td className="p-2 font-medium text-slate-800 border border-slate-200 bg-slate-50 whitespace-nowrap">
                  {variables[rowIdx].label}
                </td>
                {row.map((cell, colIdx) => (
                  <td
                    key={colIdx}
                    className={`p-2 text-center border border-slate-200 font-mono transition-colors ${getCellColor(cell.r)}`}
                    title={`${cell.varA} vs ${cell.varB}\nPearson r: ${cell.r}\np-value: ${cell.p}`}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className="font-semibold text-xs">
                        {cell.r !== null ? (cell.r > 0 ? `+${cell.r.toFixed(2)}` : cell.r.toFixed(2)) : '—'}
                      </span>
                      {cell.p !== null && rowIdx !== colIdx && (
                        <span className="text-[9px] opacity-80">
                          {cell.p < 0.01 ? '** p<.01' : cell.p < 0.05 ? '* p<.05' : `p=${cell.p.toFixed(2)}`}
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <SourceBadge
          source="NOAA CPC ONI × IMD Gridded × DES Telangana"
          period="1980 – 2024"
          units="Dimensionless r [-1.0, +1.0]"
          observationCount={validData.length}
        />
      </div>
    </div>
  );
};
