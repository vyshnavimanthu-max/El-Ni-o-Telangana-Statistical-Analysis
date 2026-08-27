import React, { useMemo } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { MergedClimateRecord } from '../types/dataset';
import {
  calculateDescriptiveStats,
  calculatePearsonCorrelation,
  calculateSpearmanCorrelation,
  calculateLinearRegression
} from '../statistics/engine';

interface TemperatureStatisticalSummaryTableProps {
  data: MergedClimateRecord[];
  className?: string;
}

interface ThermalMetricRow {
  variableName: string;
  unit: string;
  allMean: number | null;
  allMedian: number | null;
  allSd: number | null;
  allCi: string;
  elNinoMean: number | null;
  elNinoMedian: number | null;
  elNinoSd: number | null;
  neutralMean: number | null;
  neutralMedian: number | null;
  neutralSd: number | null;
  laNinaMean: number | null;
  laNinaMedian: number | null;
  laNinaSd: number | null;
  pearsonR: number | null;
  pValPearson: number | null;
  spearmanRho: number | null;
  regSlope: number | null;
  rSquaredPct: number | null;
}

export const TemperatureStatisticalSummaryTable: React.FC<TemperatureStatisticalSummaryTableProps> = ({
  data,
  className = ''
}) => {
  const validData = useMemo(() => {
    return data.filter(d => d.meanMaxTempC !== null && d.oniJjas !== null);
  }, [data]);

  const rows = useMemo<ThermalMetricRow[]>(() => {
    if (validData.length === 0) return [];

    const variables = [
      {
        name: 'Maximum Temperature (T_max)',
        unit: '°C',
        getter: (d: MergedClimateRecord) => d.meanMaxTempC!
      },
      {
        name: 'Minimum Temperature (T_min)',
        unit: '°C',
        getter: (d: MergedClimateRecord) => d.meanMinTempC ?? (d.meanMaxTempC! - 8.6)
      },
      {
        name: 'Mean Surface Temperature (T_mean)',
        unit: '°C',
        getter: (d: MergedClimateRecord) => d.meanTempC ?? ((d.meanMaxTempC! + (d.meanMinTempC ?? (d.meanMaxTempC! - 8.6))) / 2)
      },
      {
        name: 'Max Temperature Anomaly (ΔT_max)',
        unit: '°C',
        getter: (d: MergedClimateRecord) => d.tempMaxAnomalyC ?? Number((d.meanMaxTempC! - 32.4).toFixed(2))
      },
      {
        name: 'Min Temperature Anomaly (ΔT_min)',
        unit: '°C',
        getter: (d: MergedClimateRecord) => d.tempMinAnomalyC ?? Number(((d.meanMinTempC ?? (d.meanMaxTempC! - 8.6)) - 23.8).toFixed(2))
      },
      {
        name: 'Mean Temperature Anomaly (ΔT_mean)',
        unit: '°C',
        getter: (d: MergedClimateRecord) => d.tempMeanAnomalyC ?? Number((((d.meanMaxTempC! + (d.meanMinTempC ?? (d.meanMaxTempC! - 8.6))) / 2) - 28.1).toFixed(2))
      }
    ];

    const oniVals = validData.map(d => d.oniJjas!);

    return variables.map(v => {
      const allVals = validData.map(v.getter);
      const elNinoVals = validData.filter(d => d.ensoPhase === 'EL_NINO').map(v.getter);
      const neutralVals = validData.filter(d => d.ensoPhase === 'NEUTRAL').map(v.getter);
      const laNinaVals = validData.filter(d => d.ensoPhase === 'LA_NINA').map(v.getter);

      const allStats = calculateDescriptiveStats(allVals, v.name, v.unit);
      const elNinoStats = calculateDescriptiveStats(elNinoVals, 'El Nino', v.unit);
      const neutralStats = calculateDescriptiveStats(neutralVals, 'Neutral', v.unit);
      const laNinaStats = calculateDescriptiveStats(laNinaVals, 'La Nina', v.unit);

      const corr = calculatePearsonCorrelation(oniVals, allVals, 'ONI', v.name);
      const spearman = calculateSpearmanCorrelation(oniVals, allVals, 'ONI', v.name);
      const reg = calculateLinearRegression(oniVals, allVals, v.name, 'ONI');

      return {
        variableName: v.name,
        unit: v.unit,
        allMean: allStats.mean,
        allMedian: allStats.median,
        allSd: allStats.standardDeviation,
        allCi: allStats.confidenceInterval95Mean ? `[${allStats.confidenceInterval95Mean[0].toFixed(2)}, ${allStats.confidenceInterval95Mean[1].toFixed(2)}]` : 'N/A',
        elNinoMean: elNinoStats.mean,
        elNinoMedian: elNinoStats.median,
        elNinoSd: elNinoStats.standardDeviation,
        neutralMean: neutralStats.mean,
        neutralMedian: neutralStats.median,
        neutralSd: neutralStats.standardDeviation,
        laNinaMean: laNinaStats.mean,
        laNinaMedian: laNinaStats.median,
        laNinaSd: laNinaStats.standardDeviation,
        pearsonR: corr.pearsonR,
        pValPearson: corr.pValuePearson,
        spearmanRho: spearman.spearmanRho,
        regSlope: reg.slopeBeta ?? reg.coefficients[1]?.estimateBeta ?? null,
        rSquaredPct: reg.rSquared !== null ? reg.rSquared * 100 : null
      };
    });
  }, [validData]);

  const handleExportCsv = () => {
    if (rows.length === 0) return;

    const headers = [
      'Variable',
      'All_Years_Mean_degC',
      'All_Years_Median_degC',
      'All_Years_SD_degC',
      'All_Years_95_CI',
      'El_Nino_Mean_degC',
      'El_Nino_Median_degC',
      'El_Nino_SD_degC',
      'Neutral_Mean_degC',
      'Neutral_Median_degC',
      'Neutral_SD_degC',
      'La_Nina_Mean_degC',
      'La_Nina_Median_degC',
      'La_Nina_SD_degC',
      'Pearson_r_with_ONI',
      'Pearson_p_value',
      'Spearman_rho',
      'OLS_Slope_beta',
      'R_Squared_Percent'
    ];

    const csvData = rows.map(r => [
      `"${r.variableName}"`,
      r.allMean?.toFixed(2) ?? '',
      r.allMedian?.toFixed(2) ?? '',
      r.allSd?.toFixed(2) ?? '',
      `"${r.allCi}"`,
      r.elNinoMean?.toFixed(2) ?? '',
      r.elNinoMedian?.toFixed(2) ?? '',
      r.elNinoSd?.toFixed(2) ?? '',
      r.neutralMean?.toFixed(2) ?? '',
      r.neutralMedian?.toFixed(2) ?? '',
      r.neutralSd?.toFixed(2) ?? '',
      r.laNinaMean?.toFixed(2) ?? '',
      r.laNinaMedian?.toFixed(2) ?? '',
      r.laNinaSd?.toFixed(2) ?? '',
      r.pearsonR?.toFixed(3) ?? '',
      r.pValPearson?.toFixed(4) ?? '',
      r.spearmanRho?.toFixed(3) ?? '',
      r.regSlope?.toFixed(2) ?? '',
      r.rSquaredPct?.toFixed(1) ?? ''
    ]);

    const blob = new Blob([[headers.join(','), ...csvData.map(row => row.join(','))].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `telangana_temperature_statistical_analysis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (rows.length === 0) return null;

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 bg-amber-50 text-amber-900 rounded border border-amber-200 uppercase">
              Comprehensive Statistical Matrix
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Sample N = {validData.length} records
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            Telangana Thermal Climatology: Parametric & Non-Parametric Statistics
          </h3>
          <p className="text-xs text-slate-500">
            Phase-stratified means, medians, dispersion, 95% confidence bounds, and ONI teleconnection coefficients
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Export Thermal Matrix CSV
        </button>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-xs border-collapse font-sans">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
              <th className="p-2.5 font-serif">Thermal Variable</th>
              <th className="p-2.5 font-mono">Overall Mean ± SD</th>
              <th className="p-2.5 font-mono">95% CI</th>
              <th className="p-2.5 font-mono text-rose-800 bg-rose-50/50">El Niño (x̄ / M)</th>
              <th className="p-2.5 font-mono text-slate-700 bg-slate-50">Neutral (x̄ / M)</th>
              <th className="p-2.5 font-mono text-sky-800 bg-sky-50/50">La Niña (x̄ / M)</th>
              <th className="p-2.5 font-mono">Pearson r (p-val)</th>
              <th className="p-2.5 font-mono">OLS Slope β</th>
              <th className="p-2.5 font-mono">R² (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[11px]">
            {rows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/40 hover:bg-slate-50/80'}>
                <td className="p-2.5 font-medium text-slate-900">
                  {row.variableName}
                </td>
                <td className="p-2.5 font-mono">
                  {row.allMean?.toFixed(2)} ± {row.allSd?.toFixed(2)} {row.unit}
                </td>
                <td className="p-2.5 font-mono text-slate-600">
                  {row.allCi}
                </td>
                <td className="p-2.5 font-mono font-semibold text-rose-700 bg-rose-50/30">
                  {row.elNinoMean?.toFixed(2)} / {row.elNinoMedian?.toFixed(2)} {row.unit}
                </td>
                <td className="p-2.5 font-mono text-slate-700 bg-slate-50/50">
                  {row.neutralMean?.toFixed(2)} / {row.neutralMedian?.toFixed(2)} {row.unit}
                </td>
                <td className="p-2.5 font-mono font-semibold text-sky-700 bg-sky-50/30">
                  {row.laNinaMean?.toFixed(2)} / {row.laNinaMedian?.toFixed(2)} {row.unit}
                </td>
                <td className="p-2.5 font-mono">
                  <span className={row.pValPearson !== null && row.pValPearson < 0.05 ? 'font-bold text-slate-900' : 'text-slate-500'}>
                    {row.pearsonR !== null ? `${row.pearsonR > 0 ? '+' : ''}${row.pearsonR.toFixed(3)}` : 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {row.pValPearson !== null ? `(p = ${row.pValPearson.toFixed(4)})` : ''}
                  </span>
                </td>
                <td className="p-2.5 font-mono text-slate-800">
                  {row.regSlope !== null ? `${row.regSlope > 0 ? '+' : ''}${row.regSlope.toFixed(2)} °C/°C` : 'N/A'}
                </td>
                <td className="p-2.5 font-mono font-semibold text-slate-900">
                  {row.rSquaredPct !== null ? `${row.rSquaredPct.toFixed(1)}%` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
