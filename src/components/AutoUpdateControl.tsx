import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sliders, 
  ChevronDown, 
  ShieldCheck, 
  Layers,
  Database,
  ExternalLink,
  History,
  AlertCircle
} from 'lucide-react';
import { AutoUpdateService } from '../services/autoUpdateService';
import { AutoUpdateState, UpdateFrequency, SourceUpdateInfo } from '../types/autoUpdate';

interface AutoUpdateControlProps {
  onOpenDataGovernanceModal: () => void;
}

export const AutoUpdateControl: React.FC<AutoUpdateControlProps> = ({
  onOpenDataGovernanceModal
}) => {
  const [state, setState] = useState<AutoUpdateState>(AutoUpdateService.getState());
  const [isOpen, setIsOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = AutoUpdateService.subscribe((updated) => {
      setState(updated);
    });
    return unsubscribe;
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleManualCheck = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await AutoUpdateService.checkForUpdates();
      setActionFeedback(res.message);
      setTimeout(() => setActionFeedback(null), 3500);
    } catch {
      setActionFeedback('Check failed: Remote connection timeout.');
      setTimeout(() => setActionFeedback(null), 3500);
    }
  };

  const handleFrequencyChange = (freq: UpdateFrequency) => {
    AutoUpdateService.setFrequency(freq);
  };

  const handleToggleAuto = () => {
    AutoUpdateService.setAutoUpdateEnabled(!state.isAutoUpdateEnabled);
  };

  const formatTimestamp = (iso: string | null) => {
    if (!iso) return 'Not yet checked';
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return iso;
    }
  };

  const sourcesList = Object.values(state.sources) as SourceUpdateInfo[];
  const hasCriticalAlerts = state.qualityAlerts.some(a => a.severity === 'CRITICAL');
  const hasUpdates = sourcesList.some(s => s.status === 'UPDATE_AVAILABLE');

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Top-Right Compact Trigger */}
      <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-md p-1 shadow-2xs">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2 py-1 rounded text-xs font-sans text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          title="Click to view Data Governance, Sync Cadence & Source Status"
        >
          {state.isChecking ? (
            <span className="flex items-center gap-1.5 text-teal-700 font-medium">
              <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin" />
              <span>Verifying sources...</span>
            </span>
          ) : hasCriticalAlerts ? (
            <span className="flex items-center gap-1.5 text-amber-700 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Quality Alert</span>
            </span>
          ) : hasUpdates ? (
            <span className="flex items-center gap-1.5 text-blue-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Update available</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-slate-800">Data up to date</span>
            </span>
          )}

          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Checked: {formatTimestamp(state.lastChecked)}
          </span>

          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Quick Check Button */}
        <button
          type="button"
          onClick={handleManualCheck}
          disabled={state.isChecking}
          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-60 text-slate-700 text-xs font-medium rounded transition-colors cursor-pointer"
          title="Verify official repository releases right now"
        >
          <RefreshCw className={`w-3 h-3 text-slate-600 ${state.isChecking ? 'animate-spin text-teal-600' : ''}`} />
          <span className="hidden md:inline">Check for Updates</span>
        </button>
      </div>

      {/* Floating Action Feedback Toast */}
      {actionFeedback && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-slate-900 text-white text-xs px-3 py-2 rounded-md shadow-lg border border-slate-800 flex items-center gap-2 whitespace-nowrap animate-fade-in font-sans">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Dropdown Popover: Data Status & Cadence Controls */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden font-sans text-xs animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-400" />
              <div>
                <h3 className="font-bold text-slate-100 text-xs tracking-tight">DATA STATUS & AUTO-UPDATE</h3>
                <p className="text-[10px] text-slate-400 font-mono">Version: {state.activeDatasetVersion}</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
              state.isAutoUpdateEnabled ? 'bg-teal-900/60 text-teal-300 border border-teal-500/30' : 'bg-slate-800 text-slate-400'
            }`}>
              Auto-Sync: {state.isAutoUpdateEnabled ? 'ON' : 'OFF'}
            </span>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3.5 max-h-[75vh] overflow-y-auto">
            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-md border border-slate-200/80 font-mono">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Last Successful Update</span>
                <span className="text-slate-800 font-medium">{formatTimestamp(state.lastSuccessfulUpdate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Last Update Attempt</span>
                <span className="text-slate-800 font-medium">{formatTimestamp(state.lastUpdateAttempt)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Next Scheduled Check</span>
                <span className="text-slate-800 font-medium">{formatTimestamp(state.nextScheduledCheck)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Datasets Updated</span>
                <span className="text-slate-800 font-medium">{state.datasetsUpdatedCount} official sources</span>
              </div>
            </div>

            {/* Quality Alerts Banner if present */}
            {state.qualityAlerts.length > 0 && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-[11px]">Data Quality Warning ({state.qualityAlerts.length})</p>
                    <p className="text-[11px] text-amber-800">{state.qualityAlerts[0].title}: {state.qualityAlerts[0].description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Source Status Mini-List */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>CONFIGURED OFFICIAL SOURCES</span>
                <span className="font-mono text-[10px]">6 Endpoints</span>
              </div>
              <div className="space-y-1 divide-y divide-slate-100 border border-slate-200 rounded-md bg-white overflow-hidden text-xs">
                {sourcesList.slice(0, 4).map(src => (
                  <div key={src.id} className="p-2 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                    <div className="truncate pr-2">
                      <p className="font-medium text-slate-800 truncate">{src.sourceName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{src.datasetName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {src.status === 'UP_TO_DATE' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Up to date
                        </span>
                      )}
                      {src.status === 'UPDATE_AVAILABLE' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono border border-blue-200">
                          Update available
                        </span>
                      )}
                      {src.status === 'AWAITING_OFFICIAL_RELEASE' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                          Awaiting release
                        </span>
                      )}
                      {src.status === 'OFFLINE_UNREACHABLE' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-mono border border-rose-200">
                          Source offline
                        </span>
                      )}
                      {src.status === 'STRUCTURE_CHANGED' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono border border-amber-200">
                          Schema change
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sync Cadence & Toggle Configuration */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-xs">Automatic Verification</span>
                <button
                  type="button"
                  onClick={handleToggleAuto}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    state.isAutoUpdateEnabled ? 'bg-teal-700' : 'bg-slate-300'
                  }`}
                  role="switch"
                  aria-checked={state.isAutoUpdateEnabled}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      state.isAutoUpdateEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/80">
                <span className="text-slate-600">Sync Cadence:</span>
                <div className="flex items-center gap-1">
                  {(['DAILY', 'WEEKLY', 'MONTHLY'] as UpdateFrequency[]).map(freq => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => handleFrequencyChange(freq)}
                      className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors cursor-pointer ${
                        state.frequency === freq
                          ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {freq.charAt(0) + freq.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reanalysis Metadata */}
            <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
              <span>Analysis Recalculated:</span>
              <span className="font-mono text-slate-700">{formatTimestamp(state.lastAnalysisRecalculated)}</span>
            </div>
          </div>

          {/* Popover Footer with Action Buttons */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleManualCheck}
              disabled={state.isChecking}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-medium rounded border border-slate-300 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${state.isChecking ? 'animate-spin text-teal-600' : ''}`} />
              <span>Check for Updates</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenDataGovernanceModal();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded shadow-2xs transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Provenance Center</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
