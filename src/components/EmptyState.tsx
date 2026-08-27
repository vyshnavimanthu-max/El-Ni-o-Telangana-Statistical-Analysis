import React from 'react';
import { Database, FileSpreadsheet, ShieldAlert, ArrowUpRight, HelpCircle } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  sourceAuthority?: string;
  requiredSchema?: string[];
  onConnectClick?: () => void;
  actionText?: string;
  heightClass?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Awaiting Official Dataset Connection',
  message = 'This statistical visualization will render automatically once the official IMD/NOAA/DES dataset series is loaded into the pipeline.',
  sourceAuthority = 'India Meteorological Department (IMD) / NOAA CPC',
  requiredSchema = ['Year', 'Observation_Value', 'Baseline_LPA', 'Anomalies'],
  onConnectClick,
  actionText = 'Connect Official Dataset',
  heightClass = 'min-h-[280px]'
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 bg-slate-50/70 border border-dashed border-slate-300 rounded-lg text-center ${heightClass}`}>
      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-3 shadow-xs">
        <Database className="w-5 h-5 text-slate-600" />
      </div>

      <h4 className="text-sm font-semibold text-slate-800 tracking-tight mb-1">
        {title}
      </h4>

      <p className="text-xs text-slate-500 max-w-md mb-4 leading-relaxed">
        {message}
      </p>

      <div className="bg-white border border-slate-200 rounded-md p-3 max-w-md w-full text-left mb-4 shadow-xs">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1.5 pb-1 border-b border-slate-100">
          <span className="flex items-center gap-1 text-slate-600">
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
            Expected Schema Interface
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Authority: {sourceAuthority}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-1">
          {requiredSchema.map((field, idx) => (
            <span key={idx} className="inline-flex items-center text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              {field}
            </span>
          ))}
        </div>
      </div>

      {onConnectClick && (
        <button
          onClick={onConnectClick}
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer"
        >
          <Database className="w-3.5 h-3.5" />
          {actionText}
          <ArrowUpRight className="w-3 h-3 ml-0.5 opacity-70" />
        </button>
      )}
    </div>
  );
};
