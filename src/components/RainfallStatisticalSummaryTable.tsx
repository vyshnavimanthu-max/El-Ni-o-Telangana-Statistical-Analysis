import React, { useMemo } from 'react';
import { MergedClimateRecord } from '../types/dataset';
import {
  calculateMean,
  calculateStdDev,
  calculatePercentile,
  calculatePearsonCorrelation,
  calculateSpearmanCorrelation,
  calculateLinearRegression
} from '../statistics/engine';
import { RainfallVariableKey, RAINFALL_VARIABLES } from '../charts/RainfallTimeSeriesChart';
import { Table, Download, ShieldCheck } from 'lucide-react';

interface RainfallStatisticalSummaryTableProps {
  data: MergedClimateRecord[];
  className?: string;
}

export const RainfallStatisticalSummaryTable: React.FC<RainfallStatisticalSummaryTableProps> = ({
  data,
  className = ''
}) => {
  const tableRows = useMemo(() => {
    if (!data || data.length === 0) return [];

    const keys: RainfallVariableKey[] = ['JJAS', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'ANNUAL'];

    return keys.map(key => {
      const config = RAINFALL_VARIABLES[key];

      const cleanPairs = data
        .map(d => {
          let rawVal: number | null | undefined = null;
          if (key === 'JJAS') rawVal = d.rainfallJjasMm;
          else if (key === 'ANNUAL') rawVal = (d as any).annualTotal ?? d.rainfallJjasMm;
          else if (key === 'JUNE') rawVal = d.rainfallJuneMm;
          else if (key === 'JULY') rawVal = d.rainfallJulyMm;
          else if (key === 'AUGUST') rawVal = d.rainfallAugustMm;
          else if (key === 'SEPTEMBER') rawVal = d.rainfallSeptemberMm;

          return {
            val: rawVal,
            oni: d.oniJjas
          };
        })
        .filter(p => typeof p.val === 'number' && !isNaN(p.val as number));

      const vals = cleanPairs.map(p => p.val as number);
      const n = vals.length;
      if (n === 0) return null;

      const mean = calculateMean(vals)!;
      const stdDev = calculateStdDev(vals)!;
      const median = calculatePercentile(vals, 50);
      const q1 = calculatePercentile(vals, 25);
      const q3 = calculatePercentile(vals, 75);
      const iqr = q3 - q1;
      const cv = mean > 0 ? (stdDev / mean) * 100 : 0;
      const se = stdDev / Math.sqrt(n);
      const ci95Low = mean - 1.96 * se;
      const ci95High = mean + 1.96 * se;

      // Correlation with ONI
      const pairedWithOni = cleanPairs.filter(p => typeof p.oni === 'number' && !isNaN(p.oni as number));
      const oniVals = pairedWithOni.map(p => p.oni as number);
      const yVals = pairedWithOni.map(p => p.val as number);

      const corr = calculatePearsonCorrelation(oniVals, yVals, 'ONI', config.shortLabel);
      const spearman = calculateSpearmanCorrelation(oniVals, yVals, 'ONI', config.shortLabel);
      const reg = calculateLinearRegression(oniVals, yVals, config.shortLabel, 'ONI');

      return {
        key,
        label: config.label,
        shortLabel: config.shortLabel,
        normalMm: config.normalMm,
        referencePeriod: config.referencePeriod,
        n,
        mean: Number(mean.toFixed(1)),
        ci95: `[${ci95Low.toFixed(1)}, ${ci95High.toFixed(1)}]`,
        median: Number(median.toFixed(1)),
        iqr: Number(iqr.toFixed(1)),
        stdDev: Number(stdDev.toFixed(1)),
        cv: Number(cv.toFixed(1)),
        pearsonR: corr.pearsonR,
        pValuePearson: corr.pValuePearson,
        isSignificant: corr.isStatisticallySignificant,
        spearmanRho: spearman.spearmanRho,
        pValueSpearman: spearman.pValueSpearman,
        slopeBeta: reg.slopeBeta,
        rSquared: reg.rSquared
      };
    }).filter((r): r is NonNullable<typeof r> => r !== null);
  }, [data]);

  const exportCSV = () => {
    if (tableRows.length === 0) return;
    const headers = [
      'Variable',
      'Normal (mm)',
      'Reference Period',
      'N',
      'Mean (mm)',
      '95% CI Mean',
      'Median (mm)',
      'IQR (mm)',
      'StdDev (mm)',
      'CV (%)',
      'Pearson r',
      'p-value (Pearson)',
      'Spearman rho',
      'p-value (Spearman)',
      'Slope Beta (mm/°C)',
      'R-squared (%)'
    ];

    const csvLines = [
      headers.join(','),
      ...tableRows.map(r => [
        `"${r.label}"`,
        r.normalMm,
        `"${r.referencePeriod}"`,
        r.n,
        r.mean,
        `"${r.ci95}"`,
        r.median,
        r.iqr,
        r.stdDev,
        r.cv,
        r.pearsonR !== null ? r.pearsonR : '',
        r.pValuePearson !== null ? r.pValuePearson : '',
        r.spearmanRho !== null ? r.spearmanRho : '',
        r.pValueSpearman !== null ? r.pValueSpearman : '',
        r.slopeBeta !== null ? r.slopeBeta : '',
        r.rSquared !== null ? (r.rSquared * 100).toFixed(1) : ''
      ].join(','))
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'telangana_rainfall_statistical_summary.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold border border-slate-200">
              Parametric &amp; Non-Parametric Metrics
            </span>
            <span className="text-xs text-slate-500 font-mono">
              IMD 1971–2020 Long Period Average (LPA) Normals Documented
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            Telangana Rainfall Comprehensive Statistical Architecture
          </h3>
          <p className="text-xs text-slate-500">
            Exhaustive empirical summary of central tendency, dispersion, CV (%), bivariate correlations, and OLS regression slopes.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded border border-slate-300 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Export Statistical Table (CSV)
        </button>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-mono uppercase text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-2.5 font-bold">Rainfall Variable</th>
              <th className="p-2.5 font-bold">Normal (LPA)</th>
              <th className="p-2.5 font-bold text-center">N</th>
              <th className="p-2.5 font-bold">Mean (95% CI)</th>
              <th className="p-2.5 font-bold">Median (IQR)</th>
              <th className="p-2.5 font-bold">SD (σ)</th>
              <th className="p-2.5 font-bold">CV (%)</th>
              <th className="p-2.5 font-bold">Pearson r (p-val)</th>
              <th className="p-2.5 font-bold">Spearman ρ</th>
              <th className="p-2.5 font-bold">OLS Slope (β)</th>
              <th className="p-2.5 font-bold">R² (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {tableRows.map((row, idx) => (
              <tr key={row.key} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-50'}>
                <td className="p-2.5 font-sans font-semibold text-slate-900">
                  {row.label}
                  <span className="block text-[10px] font-mono text-slate-400 font-normal">
                    Ref: {row.referencePeriod}
                  </span>
                </td>
                <td className="p-2.5 text-teal-800 font-bold">
                  {row.normalMm} mm
                </td>
                <td className="p-2.5 text-center text-slate-600">
                  {row.n}
                </td>
                <td className="p-2.5 text-slate-900">
                  <strong>{row.mean} mm</strong>
                  <span className="block text-[10px] text-slate-500">{row.ci95}</span>
                </td>
                <td className="p-2.5 text-slate-900">
                  {row.median} mm
                  <span className="block text-[10px] text-slate-500">IQR: {row.iqr} mm</span>
                </td>
                <td className="p-2.5 text-slate-700">
                  ±{row.stdDev} mm
                </td>
                <td className="p-2.5 font-bold text-slate-800">
                  {row.cv}%
                </td>
                <td className="p-2.5">
                  <span className={`font-bold ${row.isSignificant ? 'text-rose-700' : 'text-slate-700'}`}>
                    {row.pearsonR !== null ? `${row.pearsonR > 0 ? '+' : ''}${row.pearsonR.toFixed(3)}` : 'N/A'}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    p = {row.pValuePearson !== null ? row.pValuePearson.toFixed(3) : 'N/A'}
                  </span>
                </td>
                <td className="p-2.5 text-slate-700">
                  {row.spearmanRho !== null ? `${row.spearmanRho > 0 ? '+' : ''}${row.spearmanRho.toFixed(3)}` : 'N/A'}
                  <span className="block text-[10px] text-slate-500">
                    p = {row.pValueSpearman !== null ? row.pValueSpearman.toFixed(3) : 'N/A'}
                  </span>
                </td>
                <td className="p-2.5 text-slate-900">
                  {row.slopeBeta !== null ? `${row.slopeBeta > 0 ? '+' : ''}${row.slopeBeta.toFixed(1)} mm/°C` : 'N/A'}
                </td>
                <td className="p-2.5 font-bold text-slate-800">
                  {row.rSquared !== null ? `${(row.rSquared * 100).toFixed(1)}%` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
        <span>* CV (%) = (Standard Deviation / Mean) × 100. High CV indicates substantial intra-seasonal rainfall volatility.</span>
        <span>Baseline Normal Source: <strong>India Meteorological Department (IMD) 1971–2020 Normals</strong></span>
      </div>
    </div>
  );
};
