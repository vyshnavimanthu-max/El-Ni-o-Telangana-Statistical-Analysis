import React from 'react';
import { Scale, CheckCircle, XCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { ResearchHypothesis } from '../types/statistics';

interface HypothesisCardProps {
  hypothesis: ResearchHypothesis;
  isDataLoaded: boolean;
}

export const HypothesisCard: React.FC<HypothesisCardProps> = ({
  hypothesis,
  isDataLoaded
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {hypothesis.code}
            </span>
            <h4 className="text-sm font-bold text-slate-900">
              {hypothesis.title}
            </h4>
          </div>

          <div className="shrink-0">
            {isDataLoaded && hypothesis.decision ? (
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                hypothesis.decision === 'REJECT_NULL' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {hypothesis.decision === 'REJECT_NULL' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {hypothesis.decision === 'REJECT_NULL' ? 'Null Rejected (p < 0.05)' : 'Fail to Reject Null'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                <AlertCircle className="w-3 h-3 text-slate-400" />
                Awaiting Dataset Ingestion
              </span>
            )}
          </div>
        </div>

        {/* Hypotheses Statements */}
        <div className="space-y-2 text-xs mb-4">
          <div className="p-2.5 bg-slate-50 rounded border border-slate-200/80">
            <span className="font-semibold text-slate-700 block mb-0.5">Null Hypothesis (H₀):</span>
            <p className="text-slate-600 font-serif italic">{hypothesis.nullHypothesis}</p>
          </div>

          <div className="p-2.5 bg-slate-50 rounded border border-slate-200/80">
            <span className="font-semibold text-slate-700 block mb-0.5">Alternative Hypothesis (H₁):</span>
            <p className="text-slate-600 font-serif italic">{hypothesis.alternativeHypothesis}</p>
          </div>
        </div>

        {/* Statistical Test & Variables */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
          <div className="bg-slate-50/70 p-2 rounded border border-slate-100">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Statistical Test Protocol</span>
            <span className="text-slate-800 font-medium">{hypothesis.statisticalTest}</span>
          </div>

          <div className="bg-slate-50/70 p-2 rounded border border-slate-100">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Test Variables</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {hypothesis.variablesTested.map((v, i) => (
                <span key={i} className="font-mono text-[10px] bg-white px-1.5 py-0.2 rounded border border-slate-200 text-slate-700">
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Caveat / Notes */}
      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 bg-amber-50/40 -mx-5 -mb-5 p-3 rounded-b-lg border-b border-amber-100">
        <span className="font-semibold text-slate-700">Statistical Caveat: </span>
        {hypothesis.caveatNotes}
      </div>
    </div>
  );
};
