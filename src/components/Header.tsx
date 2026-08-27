import React from 'react';
import { Database, BookOpen, Layers, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { ResearchDatasetState } from '../types/dataset';
import { AutoUpdateControl } from './AutoUpdateControl';

interface HeaderProps {
  datasetState: ResearchDatasetState;
  onOpenDatasetModal: () => void;
  onOpenDataGovernanceModal: () => void;
  onNavigateToLanding: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  datasetState,
  onOpenDatasetModal,
  onOpenDataGovernanceModal,
  onNavigateToLanding
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Project Branding & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToLanding}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shadow-xs group-hover:border-teal-400 transition-colors overflow-hidden shrink-0">
              <img
                src="/telangana_map.jpg"
                alt="Telangana District Map"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold tracking-wider text-teal-700 uppercase bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Statistical Climate Analysis
                </span>
                <span className="text-[11px] text-slate-400 font-mono">TS-CLIM-STAT-2026</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight group-hover:text-teal-900 transition-colors">
                EL NIÑO × TELANGANA
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">
                Statistical Analysis of ENSO, Monsoon Rainfall, Temperature and Agricultural Productivity
              </p>
            </div>
          </button>
        </div>

        {/* Top-Right Controls: Auto-Update Status Widget & Dataset Manager */}
        <div className="flex items-center flex-wrap gap-2 self-end md:self-auto">
          {/* Dedicated Auto-Update & Data Status Control */}
          <AutoUpdateControl
            onOpenDataGovernanceModal={onOpenDataGovernanceModal}
          />

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Dataset Status Badge & Connect */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs bg-slate-50 border-slate-200">
            {datasetState.isOfficialDataLoaded ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-slate-700 font-medium hidden sm:inline">
                  Official Series
                </span>
                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  N={datasetState.rainfallObservations.length}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-slate-600 font-medium">
                  Awaiting Data
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenDatasetModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-teal-300" />
            <span className="hidden sm:inline">{datasetState.isOfficialDataLoaded ? 'Datasets' : 'Connect'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
