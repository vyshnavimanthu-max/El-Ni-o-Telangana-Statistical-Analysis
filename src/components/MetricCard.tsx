import React from 'react';
import { LucideIcon, Info, HelpCircle } from 'lucide-react';

interface MetricCardProps {
  id?: string;
  title: string;
  value: string | number | null | undefined;
  unit?: string;
  subtitle?: string;
  secondaryInfo?: string;
  statusBadge?: string;
  sourceAuthority?: string;
  icon?: LucideIcon;
  trendDirection?: 'positive' | 'negative' | 'neutral';
  isAwaitingData?: boolean;
  tooltipText?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  unit,
  subtitle,
  secondaryInfo,
  statusBadge,
  sourceAuthority,
  icon: Icon,
  trendDirection = 'neutral',
  isAwaitingData = false,
  tooltipText
}) => {
  const hasValue = value !== null && value !== undefined && !isAwaitingData;

  return (
    <div
      id={id}
      className="bg-white rounded-lg border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
            {title}
          </span>

          {statusBadge && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {statusBadge}
            </span>
          )}
        </div>

        <div className="my-2 min-h-[38px] flex items-baseline gap-1.5">
          {hasValue ? (
            <>
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {value}
              </span>
              {unit && (
                <span className="text-xs text-slate-500 font-medium font-mono">
                  {unit}
                </span>
              )}
            </>
          ) : (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-400 italic">
                Awaiting official dataset
              </span>
              <span className="text-[11px] text-slate-400">
                Pending IMD / NOAA / DES feed
              </span>
            </div>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-slate-600 font-medium mb-1">
            {subtitle}
          </p>
        )}
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate" title={sourceAuthority || 'Official Data Authority'}>
          {sourceAuthority ? `Source: ${sourceAuthority}` : 'Standard Protocol'}
        </span>
        {secondaryInfo && (
          <span className="font-mono text-slate-500 shrink-0 ml-1">
            {secondaryInfo}
          </span>
        )}
      </div>
    </div>
  );
};
