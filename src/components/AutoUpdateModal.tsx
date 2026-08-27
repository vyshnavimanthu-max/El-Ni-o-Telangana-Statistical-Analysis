import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  History, 
  ShieldCheck, 
  Layers, 
  FileText, 
  ExternalLink,
  AlertCircle,
  Play,
  RotateCcw,
  Sliders,
  Check,
  Search,
  Filter,
  BarChart3,
  Server
} from 'lucide-react';
import { AutoUpdateService } from '../services/autoUpdateService';
import { AutoUpdateState, UpdateFrequency, SourceUpdateInfo } from '../types/autoUpdate';
import { OFFICIAL_SOURCES } from '../data/officialSources';

interface AutoUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutoUpdateModal: React.FC<AutoUpdateModalProps> = ({
  isOpen,
  onClose
}) => {
  const [state, setState] = useState<AutoUpdateState>(AutoUpdateService.getState());
  const [activeTab, setActiveTab] = useState<'sources' | 'versions' | 'changelog' | 'quality' | 'provenance' | 'sandbox'>('sources');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [logFilter, setLogFilter] = useState<string>('ALL');

  useEffect(() => {
    const unsubscribe = AutoUpdateService.subscribe((updated) => {
      setState(updated);
    });
    return unsubscribe;
  }, []);

  const sourcesList = Object.values(state.sources) as SourceUpdateInfo[];

  if (!isOpen) return null;

  const showNotification = (message: string, type: 'success' | 'error' | 'warning') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleGlobalCheck = async () => {
    setIsProcessing(true);
    try {
      const res = await AutoUpdateService.checkForUpdates();
      showNotification(res.message, res.hasUpdates ? 'success' : 'success');
    } catch {
      showNotification('Update check failed: Official source connection timeout.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckSource = async (sourceId: string) => {
    setIsProcessing(true);
    try {
      const res = await AutoUpdateService.checkForUpdates(sourceId);
      showNotification(res.message, 'success');
    } catch {
      showNotification('Failed to connect to source endpoint.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreVersion = (versionId: string) => {
    if (confirm(`Restore dataset version ${versionId}? All statistical models, ANOVA, regressions, and charts will be recalculated from this version.`)) {
      const ok = AutoUpdateService.restoreVersion(versionId);
      if (ok) {
        showNotification(`Dataset restored to ${versionId}. All statistical models recalculated.`, 'success');
      } else {
        showNotification('Failed to restore dataset version snapshot.', 'error');
      }
    }
  };

  const handleRefreshAnalysis = () => {
    setIsProcessing(true);
    try {
      AutoUpdateService.refreshAllAnalysis();
      showNotification('Complete statistical pipeline recalculated from entire active dataset.', 'success');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunSandboxScenario = async (
    scenario: 
      | 'NOAA_NEW_2026_ONI' 
      | 'IMD_RAINFALL_UPDATE' 
      | 'DES_AGRI_ADVANCE_ESTIMATE' 
      | 'STRUCTURE_CHANGE_TEST' 
      | 'UNIT_ANOMALY_TEST'
      | 'SOURCE_OFFLINE_TEST'
  ) => {
    setIsProcessing(true);
    try {
      const res = await AutoUpdateService.simulateIncomingOfficialUpdate(scenario);
      showNotification(res.message, res.success ? 'success' : (res.alert ? 'warning' : 'error'));
    } catch (e: any) {
      showNotification(`Sandbox test error: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimestamp = (iso: string | null) => {
    if (!iso) return 'Not available';
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-US', {
        year: 'numeric',
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

  const filteredLogs = state.changeLog.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.sourceName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = logFilter === 'ALL' || log.action === logFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in font-sans">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 text-teal-300 rounded-lg border border-teal-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Data Governance & Auto-Update Control Center
                </h2>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 border border-teal-500/30">
                  {state.activeDatasetVersion}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Multi-Source Verification, Automated Ingestion Integrity, Version History & Reproducibility
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGlobalCheck}
              disabled={isProcessing || state.isChecking}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-medium rounded border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${state.isChecking || isProcessing ? 'animate-spin' : ''}`} />
              <span>Check All Sources</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between shrink-0 ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200' :
            feedback.type === 'warning' ? 'bg-amber-50 text-amber-900 border-b border-amber-200' :
            'bg-rose-50 text-rose-900 border-b border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {feedback.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
              {feedback.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-500 hover:text-slate-800 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center gap-1 sm:gap-2 overflow-x-auto shrink-0 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('sources')}
            className={`py-3 px-3 border-b-2 font-medium flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'sources'
                ? 'border-teal-700 text-teal-900 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-teal-600" />
            <span>Source Connectors ({Object.keys(state.sources).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('versions')}
            className={`py-3 px-3 border-b-2 font-medium flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'versions'
                ? 'border-teal-700 text-teal-900 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Version Control & Rollback ({state.versionHistory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('changelog')}
            className={`py-3 px-3 border-b-2 font-medium flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'changelog'
                ? 'border-teal-700 text-teal-900 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-indigo-600" />
            <span>Change Log & Audit Trail ({state.changeLog.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quality')}
            className={`py-3 px-3 border-b-2 font-medium flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'quality'
                ? 'border-teal-700 text-teal-900 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${state.qualityAlerts.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Quality & Alerts ({state.qualityAlerts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('provenance')}
            className={`py-3 px-3 border-b-2 font-medium flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'provenance'
                ? 'border-teal-700 text-teal-900 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Data Provenance Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sandbox')}
            className={`py-3 px-3 border-b-2 font-medium flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'sandbox'
                ? 'border-teal-700 text-teal-900 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Play className="w-4 h-4 text-emerald-600" />
            <span>Update Sandbox & Defense Verification</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: SOURCE CONNECTORS */}
          {activeTab === 'sources' && (
            <div className="space-y-6">
              {/* Top Configuration & Cadence Strip */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Automated Verification Schedule & Cadence
                  </h3>
                  <p className="text-xs text-slate-600">
                    The background daemon polls configured official mirrors and checks schema signatures without modifying active datasets until verified.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-slate-200 text-xs">
                    <span className="text-slate-500 px-1.5 text-[11px]">Frequency:</span>
                    {(['DAILY', 'WEEKLY', 'MONTHLY'] as UpdateFrequency[]).map(freq => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => AutoUpdateService.setFrequency(freq)}
                        className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                          state.frequency === freq
                            ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                            : 'bg-transparent text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {freq.charAt(0) + freq.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-200 text-xs">
                    <span className="text-slate-700 font-medium">Auto-Sync:</span>
                    <button
                      type="button"
                      onClick={() => AutoUpdateService.setAutoUpdateEnabled(!state.isAutoUpdateEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        state.isAutoUpdateEnabled ? 'bg-teal-700' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${state.isAutoUpdateEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Source Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sourcesList.map(src => (
                  <div key={src.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3.5 shadow-2xs hover:border-slate-300 transition-colors">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{src.sourceName}</span>
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {src.currentVersion}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{src.datasetName}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{src.sourceOrganization}</p>
                      </div>

                      <div className="shrink-0">
                        {src.status === 'UP_TO_DATE' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Up to date
                          </span>
                        )}
                        {src.status === 'UPDATE_AVAILABLE' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-200">
                            <RefreshCw className="w-3 h-3 text-blue-600" /> New data available
                          </span>
                        )}
                        {src.status === 'AWAITING_OFFICIAL_RELEASE' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                            <Clock className="w-3 h-3 text-slate-500" /> Awaiting release
                          </span>
                        )}
                        {src.status === 'OFFLINE_UNREACHABLE' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-medium border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" /> Source offline
                          </span>
                        )}
                        {src.status === 'STRUCTURE_CHANGED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Schema changed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata Specs */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-100 font-mono">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-sans">Coverage</span>
                        <span className="text-slate-800 font-medium">{src.coveragePeriod}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-sans">Observations</span>
                        <span className="text-slate-800 font-medium">N = {src.observationCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-sans">Last Checked</span>
                        <span className="text-slate-800">{formatTimestamp(src.lastChecked)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-sans">Quality Score</span>
                        <span className="text-emerald-700 font-semibold">{src.qualityScore}% Passed</span>
                      </div>
                    </div>

                    {/* Validation Rules Preview */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Pre-Ingestion Validation Rules:
                      </span>
                      <ul className="text-[11px] text-slate-600 space-y-0.5 pl-3 list-disc">
                        {src.validationRulesSummary.map((rule, idx) => (
                          <li key={idx}>{rule}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Endpoint Status & Single Sync Button */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]" title={src.endpointUrl}>
                        {src.endpointType} • {src.machineReadableStatus}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCheckSource(src.id)}
                        disabled={isProcessing || state.isChecking}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className="w-3 h-3 text-slate-600" />
                        <span>Verify Source</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: VERSION CONTROL & ROLLBACK */}
          {activeTab === 'versions' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-3">
                <Layers className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-blue-900">
                  <p className="font-semibold text-sm">Strict Dataset Versioning & Non-Destructive Storage</p>
                  <p>
                    Previous datasets are never permanently overwritten. Every accepted update generates an immutable snapshot.
                    Researchers can inspect previous versions and restore them at any time; restoring a previous version automatically re-runs all statistical regressions, ANOVA, and time-series models.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {state.versionHistory.map(snapshot => (
                  <div
                    key={snapshot.versionId}
                    className={`border rounded-lg p-4 space-y-3 transition-colors ${
                      snapshot.isActive
                        ? 'bg-teal-50/40 border-teal-300 ring-1 ring-teal-400/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                          snapshot.isActive ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {snapshot.versionId}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{snapshot.label}</h4>
                          <p className="text-[11px] text-slate-500 font-mono">
                            Snapshot Generated: {formatTimestamp(snapshot.timestamp)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {snapshot.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded font-medium border border-teal-300">
                            <Check className="w-3.5 h-3.5 text-teal-700" /> Active Dataset
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRestoreVersion(snapshot.versionId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded shadow-2xs transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3 text-teal-300" />
                            <span>Restore this Version</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200/60">
                      <span className="font-semibold text-slate-800">Changes / Coverage: </span>
                      {snapshot.changeSummary}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-sans">Total Observations</span>
                        <span className="font-bold text-slate-800">N = {snapshot.totalObservations}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-sans">NOAA ONI Series</span>
                        <span className="font-bold text-slate-800">{snapshot.ensoCount} seasons</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-sans">IMD SWM Rainfall</span>
                        <span className="font-bold text-slate-800">{snapshot.rainfallCount} years</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-sans">DES Crop Yields</span>
                        <span className="font-bold text-slate-800">{snapshot.agriCount} records</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DATA CHANGE LOG */}
          {activeTab === 'changelog' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2 border-b border-slate-200">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search change log descriptions..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="ALL">All Actions</option>
                    <option value="UPDATE_CHECK">Update Checks</option>
                    <option value="DATASET_APPLIED">Datasets Ingested</option>
                    <option value="REANALYSIS">Statistical Reanalyses</option>
                    <option value="QUALITY_ALERT">Quality Alerts</option>
                    <option value="ROLLBACK">Version Rollbacks</option>
                    <option value="STRUCTURE_MISMATCH">Schema Changes</option>
                  </select>
                </div>
              </div>

              {/* Log Timeline */}
              <div className="space-y-2 font-sans">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No change log records match the selected filter criteria.
                  </div>
                ) : (
                  filteredLogs.map(log => (
                    <div key={log.id} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1 text-xs shadow-2xs hover:border-slate-300">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                            log.status === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                            log.status === 'ERROR' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {log.action}
                          </span>
                          <span className="font-semibold text-slate-800">{log.sourceName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>

                      <p className="text-slate-700 pl-1">{log.description}</p>

                      {log.details && (
                        <div className="text-[11px] font-mono text-slate-500 pl-1 pt-1 flex flex-wrap gap-x-4 gap-y-1">
                          {log.details.addedObservations !== undefined && <span>+Obs: {log.details.addedObservations}</span>}
                          {log.details.versionTo && <span>Version: {log.details.versionTo}</span>}
                          {log.details.reanalyzedModelsCount && <span>Reanalyzed Models: {log.details.reanalyzedModelsCount}</span>}
                          {log.details.notes && <span className="font-sans italic">{log.details.notes}</span>}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DATA QUALITY ALERTS */}
          {activeTab === 'quality' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Automated Ingestion Quality & Structural Defense
                  </h3>
                  <p className="text-xs text-slate-600">
                    If incoming data contains renamed columns, unit discrepancies, out-of-bounds metrics, or duplicate keys, the ingestion engine halts and raises a quality alert.
                  </p>
                </div>
                {state.qualityAlerts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => AutoUpdateService.clearAllQualityAlerts()}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors cursor-pointer"
                  >
                    Clear All Alerts
                  </button>
                )}
              </div>

              {state.qualityAlerts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-bold text-slate-900 text-sm">All Quality Checks Passed</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Zero structural mismatches, unit anomalies, or missing keys detected across active official datasets.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {state.qualityAlerts.map(alert => (
                    <div key={alert.id} className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="font-bold text-amber-900 text-sm">{alert.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-200/80 text-amber-900 font-bold">
                            {alert.code}
                          </span>
                        </div>
                        <button
                          onClick={() => AutoUpdateService.dismissQualityAlert(alert.id)}
                          className="text-amber-800 hover:text-amber-950 cursor-pointer text-xs"
                        >
                          Dismiss
                        </button>
                      </div>

                      <p className="text-amber-900">{alert.description}</p>

                      <div className="bg-amber-100/60 p-2 rounded text-[11px] space-y-1 font-mono text-amber-950">
                        <div><span className="font-semibold font-sans">Source: </span>{alert.sourceName}</div>
                        <div><span className="font-semibold font-sans">Variables Affected: </span>{alert.affectedVariables.join(', ')}</div>
                        <div><span className="font-semibold font-sans">Action Enacted: </span>{alert.actionTaken}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Baseline Quality Rules Audit */}
              <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2 text-xs">
                <h4 className="font-bold text-slate-900">Standard Pre-Ingestion Rules Applied:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="font-semibold text-slate-800 block">Rainfall Bounds:</span>
                    JJAS totals must lie within [0 mm, 2500 mm]. IMD normal baseline is fixed at 750.5 mm.
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="font-semibold text-slate-800 block">ENSO ONI Bounds:</span>
                    3-month anomalies must lie within [-3.5°C, +3.5°C] with standard 12 rolling window season codes.
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="font-semibold text-slate-800 block">District Normalization:</span>
                    District names mapped against official 33 Telangana administrative dictionary with legacy aliases.
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="font-semibold text-slate-800 block">Agricultural Yields:</span>
                    Positive values only; Paddy [1000–5000 kg/ha], Cotton [200–800 kg/ha lint].
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DATA PROVENANCE MATRIX */}
          {activeTab === 'provenance' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Academic Data Provenance & Reproducibility Matrix
                </h3>
                <p className="text-xs text-slate-600">
                  Full lineage trace of all active datasets, institutional origins, mathematical processing states, and official peer-reviewed citations.
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Organization</th>
                      <th className="py-2.5 px-3">Dataset Name</th>
                      <th className="py-2.5 px-3">Active Version</th>
                      <th className="py-2.5 px-3">Temporal Coverage</th>
                      <th className="py-2.5 px-3">Resolution & Units</th>
                      <th className="py-2.5 px-3">Sample N</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">NOAA CPC / NWS</td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">Oceanic Niño Index (ERSST.v5)</td>
                      <td className="py-2.5 px-3 text-teal-700 font-bold">{state.sources.noaa_cpc_oni?.currentVersion || 'v2026.08.15'}</td>
                      <td className="py-2.5 px-3">1950 – 2026</td>
                      <td className="py-2.5 px-3">Niño 3.4 (°C anomaly)</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">918 seasons</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Validated</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">IMD Pune / MoES</td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">High-Res Gridded Rainfall</td>
                      <td className="py-2.5 px-3 text-teal-700 font-bold">{state.sources.imd_gridded_rainfall?.currentVersion || 'v2026.08.15'}</td>
                      <td className="py-2.5 px-3">1971 – 2026</td>
                      <td className="py-2.5 px-3">0.25° Grid (mm)</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">47 years</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Validated</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">IMD Pune / MoES</td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">Gridded Maximum Temperature</td>
                      <td className="py-2.5 px-3 text-teal-700 font-bold">{state.sources.imd_gridded_temp?.currentVersion || 'v2026.08.15'}</td>
                      <td className="py-2.5 px-3">1971 – 2026</td>
                      <td className="py-2.5 px-3">0.5° Grid (°C)</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">47 years</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Validated</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">DES Telangana</td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">Season & Crop Reports (Kharif)</td>
                      <td className="py-2.5 px-3 text-teal-700 font-bold">{state.sources.des_telangana_agri?.currentVersion || 'v2026.08.01'}</td>
                      <td className="py-2.5 px-3">1971 – 2026</td>
                      <td className="py-2.5 px-3">State/District (kg/ha)</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">228 records</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Validated</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">TSDPS Telangana</td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">Mandal AWS Telemetry Network</td>
                      <td className="py-2.5 px-3 text-teal-700 font-bold">{state.sources.tsdps_aws?.currentVersion || 'v2026.08.15'}</td>
                      <td className="py-2.5 px-3">2014 – 2026</td>
                      <td className="py-2.5 px-3">1,044 Mandals (AWS)</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">1,044 stns</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Telemetry OK</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Provenance Footnote */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800 block">Reproducibility & Execution Footnote:</span>
                <p>
                  Every statistical regression, ANOVA test, Pearson correlation, and Mann-Kendall trend model is bound to the active snapshot hash <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[10px] text-slate-800">{state.activeDatasetVersion}</code>. Analysis recalculated on <span className="font-mono">{formatTimestamp(state.lastAnalysisRecalculated)}</span> across full continuous series (1980–2026, N=47).
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: UPDATE SANDBOX & DEFENSE VERIFICATION */}
          {activeTab === 'sandbox' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-start gap-3">
                <Play className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-emerald-900">
                  <p className="font-semibold text-sm">Automated Update & Defense Verification Sandbox</p>
                  <p>
                    Test realistic real-world scenarios to verify that the auto-update pipeline accurately validates incoming data, intercepts corrupted schemas, halts invalid units, and automatically triggers full statistical reanalysis when valid observations are published.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Scenario 1: Valid NOAA Monthly Update */}
                <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 shadow-2xs hover:border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase">Scenario A: Official Ingestion</span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">Valid Release</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">NOAA CPC August 2026 ONI Release</h4>
                  <p className="text-xs text-slate-600">
                    Simulates ingestion of newly finalized NOAA CPC August 2026 Oceanic Niño Index (JAS: -0.45°C). Validates observations, versions dataset, and recalculates all ANOVA and OLS regression models.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRunSandboxScenario('NOAA_NEW_2026_ONI')}
                    disabled={isProcessing}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run NOAA Ingestion & Reanalysis</span>
                  </button>
                </div>

                {/* Scenario 2: Valid IMD Post-Monsoon Update */}
                <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 shadow-2xs hover:border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase">Scenario B: Official Ingestion</span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">Valid Release</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">IMD Pune Gridded Rainfall Verification</h4>
                  <p className="text-xs text-slate-600">
                    Simulates IMD Pune finalized post-monsoon 0.25° gridded rainfall verification calibrated with Telangana ground AWS observations.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRunSandboxScenario('IMD_RAINFALL_UPDATE')}
                    disabled={isProcessing}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run IMD Ingestion & Reanalysis</span>
                  </button>
                </div>

                {/* Scenario 3: Structural Change Interception */}
                <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 shadow-2xs hover:border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase">Scenario C: Defense Test</span>
                    <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-bold">Schema Change</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Source Structure Changed (DES Telangana)</h4>
                  <p className="text-xs text-slate-600">
                    Simulates source modifying column headers or formatting. Verifies that the engine intercepts the mismatch, rejects automatic ingestion, and displays <span className="font-semibold text-amber-800">"Source structure changed. Manual validation required."</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRunSandboxScenario('STRUCTURE_CHANGE_TEST')}
                    disabled={isProcessing}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Test Structural Defense Interception</span>
                  </button>
                </div>

                {/* Scenario 4: Unit Anomaly Interception */}
                <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 shadow-2xs hover:border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase">Scenario D: Defense Test</span>
                    <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-bold">Unit Mismatch</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Measurement Unit Anomaly (mm → cm)</h4>
                  <p className="text-xs text-slate-600">
                    Simulates an incoming feed with values reported in centimeters (e.g. 75.1) instead of millimeters (750.5 mm). Verifies that the unit validator detects the scale discrepancy and halts ingestion.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRunSandboxScenario('UNIT_ANOMALY_TEST')}
                    disabled={isProcessing}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Test Unit Anomaly Interception</span>
                  </button>
                </div>

                {/* Scenario 5: Remote Endpoint Failure */}
                <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 shadow-2xs hover:border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase">Scenario E: Resilience Test</span>
                    <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-bold">Source Offline</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Official Source Temporarily Unreachable</h4>
                  <p className="text-xs text-slate-600">
                    Simulates an HTTP 503 or network failure. Verifies that the system displays <span className="font-semibold text-rose-800">"Update unavailable — official source could not be reached"</span> while retaining the active verified dataset.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRunSandboxScenario('SOURCE_OFFLINE_TEST')}
                    disabled={isProcessing}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Test Source Offline Handling</span>
                  </button>
                </div>

                {/* Force Non-Incremental Reanalysis */}
                <div className="p-4 bg-slate-900 text-white rounded-lg space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-400 uppercase">Mandatory Statistical Rule</span>
                    <span className="text-[10px] font-mono text-teal-300 bg-teal-950 px-1.5 py-0.5 rounded border border-teal-800 font-bold">Non-Incremental</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Recalculate All Mathematical Models</h4>
                  <p className="text-xs text-slate-300">
                    Forces complete recalculation of all descriptive moments, Pearson $r$, OLS $\beta$, Welch's $t$, ANOVA $F$, Kruskal-Wallis $H$, and Mann-Kendall $S$ from the entire active dataset.
                  </p>
                  <button
                    type="button"
                    onClick={handleRefreshAnalysis}
                    disabled={isProcessing}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>Refresh & Recalculate All Statistics</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <span>Active Dataset: <strong className="text-slate-800 font-sans">{state.activeDatasetVersion}</strong></span>
            <span>•</span>
            <span>Recalculated: {formatTimestamp(state.lastAnalysisRecalculated)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshAnalysis}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-medium rounded border border-slate-300 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 text-slate-600 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Refresh Analysis</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded shadow-2xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
