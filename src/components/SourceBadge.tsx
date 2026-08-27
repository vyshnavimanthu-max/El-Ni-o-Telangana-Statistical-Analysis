import React from 'react';
import { Database, Calendar, Activity, Layers } from 'lucide-react';
import { ObservationMetadata } from '../types/filters';

interface SourceBadgeProps {
  metadata?: ObservationMetadata;
  source?: string;
  period?: string;
  units?: string;
  observationCount?: number | null;
  className?: string;
  isCompact?: boolean;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  metadata,
  source = metadata?.source || 'India Meteorological Department / NOAA CPC',
  period = metadata?.period || 'Awaiting official dataset',
  units = metadata?.units || 'Standard SI / IMD Units',
  observationCount = metadata?.observationCount,
  className = '',
  isCompact = false
}) => {
  if (isCompact) {
    return (
      <div className={`inline-flex flex-wrap items-center gap-2 text-xs text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded border border-slate-200 ${className}`}>
        <span className="font-medium text-slate-700">{source}</span>
        <span className="text-slate-300">|</span>
        <span>{period}</span>
        {observationCount !== null && observationCount !== undefined && (
          <>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-teal-700 font-medium">N = {observationCount}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div id="source-badge-container" className={`bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 shadow-xs ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="flex items-start gap-2">
          <Database className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400">Data Source</span>
            <span className="font-medium text-slate-800 line-clamp-1" title={source}>{source}</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400">Temporal Coverage</span>
            <span className="font-medium text-slate-800">{period}</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Layers className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400">Physical Unit</span>
            <span className="font-mono font-medium text-slate-800">{units}</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Activity className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400">Sample Size</span>
            <span className="font-mono font-medium text-teal-700">
              {observationCount !== null && observationCount !== undefined 
                ? `N = ${observationCount} observations` 
                : 'Pending connection'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
