import React from 'react';
import { 
  Award, 
  TrendingDown, 
  Sparkles, 
  AlertCircle, 
  HelpCircle, 
  CheckCircle2, 
  Scale,
  Calendar,
  Layers
} from 'lucide-react';
import { ResearchSummaryResults } from '../statistics/statisticalEvidenceEngine';

interface ResearchSummaryCardProps {
  summary: ResearchSummaryResults;
  onSelectRelationship?: (id: string) => void;
}

export const ResearchSummaryCard: React.FC<ResearchSummaryCardProps> = ({
  summary,
  onSelectRelationship
}) => {
  const {
    strongestRelationship,
    weakestRelationship,
    mostSignificantResult,
    mostUncertainResult,
    totalEvaluated,
    significantCount,
    meanSharedVariancePct,
    timeRange,
    sampleSize,
    importantLimitations
  } = summary;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      {/* Header & Meta Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-600" />
              Dynamic Empirical Synthesis
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Sample Range: {timeRange[0]}–{timeRange[1]} (N = {sampleSize} yrs)
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight font-serif">
            Executive Research Summary of Empirical Statistical Evidence
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Synthesized dynamically from 100% live mathematical models without hardcoded assumptions. Quantifies teleconnection coupling, thermal anomalies, and agricultural yield sensitivity in Telangana.
          </p>
        </div>

        {/* Global Evaluation Metrics */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Significant Tests</div>
            <div className="text-base font-bold text-slate-900 font-mono">
              {significantCount} <span className="text-xs font-normal text-slate-500">/ {totalEvaluated}</span>
            </div>
            <div className="text-[10px] text-teal-700 font-semibold font-mono">
              {totalEvaluated > 0 ? ((significantCount / totalEvaluated) * 100).toFixed(0) : '0'}% at α=0.05
            </div>
          </div>

          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Mean Shared Var</div>
            <div className="text-base font-bold text-slate-900 font-mono">
              {meanSharedVariancePct}%
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Average R²
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Empirical Findings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Strongest Relationship */}
        <div 
          onClick={() => onSelectRelationship?.(strongestRelationship.id)}
          className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2.5 transition-all hover:shadow-xs hover:border-emerald-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
              Strongest Observed
            </span>
            <Award className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 line-clamp-1 font-serif">
              {strongestRelationship.shortName}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              Pearson <span className="font-mono font-semibold text-slate-900">r = {strongestRelationship.estimate.pearsonR.toFixed(3)}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-700 bg-white/80 p-2 rounded border border-emerald-100 font-mono leading-tight space-y-0.5">
            <div>Shared Var: <span className="font-semibold text-emerald-800">R² = {(strongestRelationship.estimate.rSquared * 100).toFixed(1)}%</span></div>
            <div>p-value: <span className="font-semibold">{strongestRelationship.pValue < 0.0001 ? '< 0.0001' : strongestRelationship.pValue.toFixed(4)}</span></div>
            <div>95% CI: [{strongestRelationship.confidenceInterval95[0].toFixed(2)}, {strongestRelationship.confidenceInterval95[1].toFixed(2)}]</div>
          </div>
        </div>

        {/* 2. Most Statistically Significant */}
        <div 
          onClick={() => onSelectRelationship?.(mostSignificantResult.id)}
          className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2.5 transition-all hover:shadow-xs hover:border-blue-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded">
              Most Significant
            </span>
            <CheckCircle2 className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 line-clamp-1 font-serif">
              {mostSignificantResult.shortName}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              p-value = <span className="font-mono font-semibold text-blue-900">{mostSignificantResult.pValue < 0.0001 ? '< 0.0001' : mostSignificantResult.pValue.toFixed(4)}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-700 bg-white/80 p-2 rounded border border-blue-100 font-mono leading-tight space-y-0.5">
            <div>t-statistic: <span className="font-semibold text-blue-800">t({mostSignificantResult.degreesOfFreedom}) = {mostSignificantResult.tStatistic.toFixed(2)}</span></div>
            <div>Pearson r: <span className="font-semibold">{mostSignificantResult.estimate.pearsonR.toFixed(3)}</span></div>
            <div>Decision: <span className="font-semibold text-blue-900">Reject H₀ (p &lt; 0.05)</span></div>
          </div>
        </div>

        {/* 3. Weakest Relationship */}
        <div 
          onClick={() => onSelectRelationship?.(weakestRelationship.id)}
          className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2.5 transition-all hover:shadow-xs hover:border-amber-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
              Weakest Observed
            </span>
            <TrendingDown className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 line-clamp-1 font-serif">
              {weakestRelationship.shortName}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              Pearson <span className="font-mono font-semibold text-slate-900">r = {weakestRelationship.estimate.pearsonR.toFixed(3)}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-700 bg-white/80 p-2 rounded border border-amber-100 font-mono leading-tight space-y-0.5">
            <div>Shared Var: <span className="font-semibold text-amber-800">R² = {(weakestRelationship.estimate.rSquared * 100).toFixed(1)}%</span></div>
            <div>p-value: <span className="font-semibold">{weakestRelationship.pValue.toFixed(4)}</span></div>
            <div>Decision: <span className="font-semibold">{weakestRelationship.isStatisticallySignificant ? 'Reject H₀' : 'Fail to Reject H₀'}</span></div>
          </div>
        </div>

        {/* 4. Most Uncertain Result */}
        <div 
          onClick={() => onSelectRelationship?.(mostUncertainResult.id)}
          className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2.5 transition-all hover:shadow-xs hover:border-purple-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded">
              Most Uncertain (CI)
            </span>
            <HelpCircle className="w-4 h-4 text-purple-700" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 line-clamp-1 font-serif">
              {mostUncertainResult.shortName}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              CI Span = <span className="font-mono font-semibold text-purple-900">{mostUncertainResult.ciSpan.toFixed(3)}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-700 bg-white/80 p-2 rounded border border-purple-100 font-mono leading-tight space-y-0.5">
            <div>95% CI: [{mostUncertainResult.confidenceInterval95[0].toFixed(2)}, {mostUncertainResult.confidenceInterval95[1].toFixed(2)}]</div>
            <div>Slope SE: <span className="font-semibold text-purple-800">±{mostUncertainResult.estimate.olsSeSlope.toFixed(2)}</span></div>
            <div>Rel Uncertainty: <span className="font-semibold">{(mostUncertainResult.relativeUncertainty * 100).toFixed(0)}%</span></div>
          </div>
        </div>
      </div>

      {/* Important Limitations Accordion / Callout */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-2.5">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
            Important Methodological Limitations (Empirical Constraints)
          </h4>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
          {importantLimitations.map((lim, idx) => (
            <li key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80">
              <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{lim}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
