import React, { useState } from 'react';
import { 
  Scale, 
  Download, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ChevronRight, 
  SlidersHorizontal,
  ExternalLink,
  ArrowUpDown
} from 'lucide-react';
import { EvidenceRelationshipItem } from '../statistics/statisticalEvidenceEngine';

interface StatisticalEvidenceTableProps {
  evidenceList: EvidenceRelationshipItem[];
  selectedCrop: 'cotton' | 'paddy' | 'maize';
  onCropChange: (crop: 'cotton' | 'paddy' | 'maize') => void;
  onSelectRelationship: (item: EvidenceRelationshipItem) => void;
  selectedId?: string;
}

export const StatisticalEvidenceTable: React.FC<StatisticalEvidenceTableProps> = ({
  evidenceList,
  selectedCrop,
  onCropChange,
  onSelectRelationship,
  selectedId
}) => {
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'CLIMATE_TELECONNECTION' | 'CLIMATE_THERMAL' | 'AGRONOMIC_VULNERABILITY'>('ALL');
  const [sortField, setSortField] = useState<'r' | 'p' | 'ciSpan'>('p');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filtered = evidenceList.filter(item => {
    if (filterCategory === 'ALL') return true;
    return item.category === filterCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortField === 'r') {
      diff = Math.abs(b.estimate.pearsonR) - Math.abs(a.estimate.pearsonR);
    } else if (sortField === 'p') {
      diff = a.pValue - b.pValue;
    } else if (sortField === 'ciSpan') {
      diff = a.ciSpan - b.ciSpan;
    }
    return sortOrder === 'asc' ? diff : -diff;
  });

  const handleExportCSV = () => {
    const headers = [
      'Relationship',
      'Category',
      'Method',
      'Sample Size (N)',
      'Degrees of Freedom (df)',
      'Pearson r',
      'Spearman rho',
      'OLS Slope',
      'OLS Intercept',
      '95% CI Lower',
      '95% CI Upper',
      'p-value',
      'Statistically Significant (alpha=0.05)',
      'R-squared (%)',
      'Effect Size Magnitude',
      'Direction',
      'Strength',
      'Practical Meaning',
      'Limitations'
    ];

    const rows = evidenceList.map(item => [
      `"${item.relationship}"`,
      `"${item.category}"`,
      `"${item.method}"`,
      item.sampleSize,
      item.degreesOfFreedom,
      item.estimate.pearsonR,
      item.estimate.spearmanRho,
      item.estimate.olsSlope,
      item.estimate.olsIntercept,
      item.confidenceInterval95[0],
      item.confidenceInterval95[1],
      item.pValue,
      item.isStatisticallySignificant ? 'TRUE' : 'FALSE',
      (item.estimate.rSquared * 100).toFixed(2),
      `"${item.effectSize.magnitude}"`,
      `"${item.interpretation.direction.replace(/"/g, '""')}"`,
      `"${item.interpretation.strength.replace(/"/g, '""')}"`,
      `"${item.interpretation.practicalMeaning.replace(/"/g, '""')}"`,
      `"${item.interpretation.limitations.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `telangana_statistical_evidence_matrix_${selectedCrop}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden space-y-0">
      {/* Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold">
              Master Evidence Synthesis Table
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Decision Boundary: α = 0.05 (Two-Tailed)
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-serif tracking-tight">
            Comprehensive Empirical Relationship Matrix
          </h3>
        </div>

        {/* Filter and Export Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Crop Selector */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs">
            <span className="text-[10px] uppercase font-mono text-slate-500 px-1.5 font-semibold">Focus Crop:</span>
            {(['cotton', 'paddy', 'maize'] as const).map(crop => (
              <button
                key={crop}
                type="button"
                onClick={() => onCropChange(crop)}
                className={`px-2.5 py-1 rounded font-medium capitalize cursor-pointer transition-colors ${
                  selectedCrop === crop
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {crop}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 font-medium cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">All Categories ({evidenceList.length})</option>
            <option value="CLIMATE_TELECONNECTION">Teleconnections (Rainfall)</option>
            <option value="CLIMATE_THERMAL">Thermal Regimes (Temp)</option>
            <option value="AGRONOMIC_VULNERABILITY">Agronomic Sensitivity</option>
          </select>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold font-mono cursor-pointer transition-colors shadow-2xs"
            title="Export Evidence Matrix as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Export</span>
          </button>
        </div>
      </div>

      {/* Main Evidence Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Relationship</th>
              <th className="py-3 px-3 font-semibold">Method &amp; Sample</th>
              <th className="py-3 px-3 font-semibold">Estimate (r &amp; Slope)</th>
              <th className="py-3 px-3 font-semibold">95% CI</th>
              <th className="py-3 px-3 font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    if (sortField === 'p') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortField('p'); setSortOrder('asc'); }
                  }}
                  className="flex items-center gap-1 cursor-pointer hover:text-slate-900"
                >
                  <span>p-value</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-3 font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    if (sortField === 'r') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortField('r'); setSortOrder('asc'); }
                  }}
                  className="flex items-center gap-1 cursor-pointer hover:text-slate-900"
                >
                  <span>Effect Size (R²)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-3 font-semibold">Significance</th>
              <th className="py-3 px-4 font-semibold text-right">Interpretation &amp; Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 text-xs font-mono">
                  No statistical evidence records match the current filter criteria.
                </td>
              </tr>
            ) : (
              sorted.map((item) => {
                const isSelected = selectedId === item.id;
              const { r, rho, olsSlope, olsIntercept, rSquared } = {
                r: item.estimate.pearsonR,
                rho: item.estimate.spearmanRho,
                olsSlope: item.estimate.olsSlope,
                olsIntercept: item.estimate.olsIntercept,
                rSquared: item.estimate.rSquared
              };

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectRelationship(item)}
                  className={`cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-teal-50/70 hover:bg-teal-50' 
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* 1. Relationship */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 font-serif text-xs">
                      {item.relationship}
                    </div>
                    <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                      {item.predictorVar} &rarr; {item.responseVar}
                    </div>
                  </td>

                  {/* 2. Method */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                    <div className="font-mono text-[11px] text-slate-800 font-semibold">
                      Pearson r / OLS
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      N = {item.sampleSize} (df = {item.degreesOfFreedom})
                    </div>
                  </td>

                  {/* 3. Estimate */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      r = {r > 0 ? `+${r.toFixed(3)}` : r.toFixed(3)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-600">
                      Slope: {olsSlope > 0 ? `+${olsSlope.toFixed(2)}` : olsSlope.toFixed(2)} {item.responseUnit}/{item.predictorUnit}
                    </div>
                  </td>

                  {/* 4. 95% CI */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="font-mono text-slate-800 text-[11px] font-semibold">
                      [{item.confidenceInterval95[0] > 0 ? `+${item.confidenceInterval95[0].toFixed(2)}` : item.confidenceInterval95[0].toFixed(2)}, {item.confidenceInterval95[1] > 0 ? `+${item.confidenceInterval95[1].toFixed(2)}` : item.confidenceInterval95[1].toFixed(2)}]
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Span = {item.ciSpan.toFixed(2)}
                    </div>
                  </td>

                  {/* 5. p-value */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className={`font-mono font-bold text-[11px] ${
                      item.isStatisticallySignificant ? 'text-teal-900' : 'text-slate-600'
                    }`}>
                      {item.pValue < 0.0001 ? '< 0.0001' : item.pValue.toFixed(4)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      t = {item.tStatistic.toFixed(2)}
                    </div>
                  </td>

                  {/* 6. Effect Size */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        item.effectSize.magnitude === 'Large'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : item.effectSize.magnitude === 'Moderate'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}>
                        {item.effectSize.magnitude}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                      R² = {(rSquared * 100).toFixed(1)}%
                    </div>
                  </td>

                  {/* 7. Significance */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {item.isStatisticallySignificant ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Statistically significant</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Not statistically significant</span>
                      </span>
                    )}
                  </td>

                  {/* 8. Interpretation button */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRelationship(item);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded border border-teal-200 cursor-pointer transition-colors"
                    >
                      <span>Examine Evidence</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        </table>
      </div>

      {/* Table Footer / Legend */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
          <div><strong className="text-slate-900">Alpha:</strong> α = 0.05</div>
          <div><strong className="text-slate-900">CI Method:</strong> Fisher z-transformation</div>
          <div><strong className="text-slate-900">OLS Engine:</strong> Exact Gauss-Jordan inversion</div>
        </div>
        <div className="text-[11px] text-slate-500 font-sans">
          Click any row to inspect full 6-dimensional academic interpretation.
        </div>
      </div>
    </div>
  );
};
