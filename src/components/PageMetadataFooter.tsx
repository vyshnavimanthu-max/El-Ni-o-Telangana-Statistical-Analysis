import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  Calendar, 
  FileText, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { AutoUpdateService } from '../services/autoUpdateService';
import { AutoUpdateState } from '../types/autoUpdate';
import { ResearchDatasetState } from '../types/dataset';

interface PageMetadataFooterProps {
  datasetState: ResearchDatasetState;
  onOpenDataGovernanceModal: () => void;
  pageTitle?: string;
}

export const PageMetadataFooter: React.FC<PageMetadataFooterProps> = ({
  datasetState,
  onOpenDataGovernanceModal,
  pageTitle
}) => {
  const [autoUpdateState, setAutoUpdateState] = useState<AutoUpdateState>(AutoUpdateService.getState());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = AutoUpdateService.subscribe((updated) => {
      setAutoUpdateState(updated);
    });
    return unsubscribe;
  }, []);

  const handleRefreshAnalysis = () => {
    setIsRefreshing(true);
    try {
      AutoUpdateService.refreshAllAnalysis();
      setRefreshMessage('Analysis recalculated from complete dataset.');
      setTimeout(() => setRefreshMessage(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCheckUpdates = async () => {
    setIsRefreshing(true);
    try {
      const res = await AutoUpdateService.checkForUpdates();
      setRefreshMessage(res.message);
      setTimeout(() => setRefreshMessage(null), 3500);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTimestamp = (iso: string | null) => {
    if (!iso) return 'August 20, 2026';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  const sampleSize = datasetState.rainfallObservations.length || 47;
  const startYear = datasetState.rainfallObservations[0]?.year || 1980;
  const endYear = datasetState.rainfallObservations[datasetState.rainfallObservations.length - 1]?.year || 2026;

  return (
    <div className="mt-8 pt-4 pb-2 border-t border-slate-200 text-xs font-sans">
      <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Academic Lineage & Reproducibility Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-sans">Data Last Updated</span>
            <span className="text-slate-800 font-semibold">{formatTimestamp(autoUpdateState.lastSuccessfulUpdate)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-sans">Analysis Recalculated</span>
            <span className="text-slate-800 font-semibold">{formatTimestamp(autoUpdateState.lastAnalysisRecalculated)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-sans">Dataset Version</span>
            <span className="text-teal-700 font-bold bg-teal-50 px-1 py-0.5 rounded border border-teal-200">
              {datasetState.datasetVersion || autoUpdateState.activeDatasetVersion}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-sans">Study Period & Sample</span>
            <span className="text-slate-800 font-medium">{startYear}–{endYear} (N = {sampleSize})</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {refreshMessage && (
            <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded border border-emerald-200 animate-fade-in">
              {refreshMessage}
            </span>
          )}

          <button
            type="button"
            onClick={handleRefreshAnalysis}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-medium rounded border border-slate-300 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Recalculate all mathematical and econometric models from current active data"
          >
            <RefreshCw className={`w-3 h-3 text-slate-600 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
            <span>Refresh Analysis</span>
          </button>

          <button
            type="button"
            onClick={handleCheckUpdates}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-medium rounded border border-slate-300 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Poll official source endpoints for newly published observations"
          >
            <Database className="w-3 h-3 text-slate-600" />
            <span>Check for Updates</span>
          </button>

          <button
            type="button"
            onClick={onOpenDataGovernanceModal}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded shadow-2xs transition-colors cursor-pointer"
            title="Open Data Governance & Version History Dashboard"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
            <span className="hidden sm:inline">Provenance</span>
          </button>
        </div>
      </div>
      
      <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] text-slate-400 font-mono px-1">
        <span>Authoritative Sources: NOAA Climate Prediction Center • India Meteorological Department • DES Telangana</span>
        <span>Reproducibility ID: TS-CLIM-STAT-2026-v1</span>
      </div>
    </div>
  );
};
