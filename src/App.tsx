import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, TabId } from './components/Navigation';
import { DatasetImportModal } from './components/DatasetImportModal';
import { AutoUpdateModal } from './components/AutoUpdateModal';
import { TelanganaMapThumbnail } from './components/TelanganaMapThumbnail';
import { PageMetadataFooter } from './components/PageMetadataFooter';
import { LandingPage } from './pages/LandingPage';
import { OverviewPage } from './pages/OverviewPage';
import { EnsoPage } from './pages/EnsoPage';
import { RainfallPage } from './pages/RainfallPage';
import { TemperaturePage } from './pages/TemperaturePage';
import { AgriculturePage } from './pages/AgriculturePage';
import { DistrictPage } from './pages/DistrictPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { TimeSeriesPage } from './pages/TimeSeriesPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { SourcesPage } from './pages/SourcesPage';
import { ResearchReportPage } from './pages/ResearchReportPage';
import { DatasetService } from './services/datasetService';
import { ResearchDatasetState } from './types/dataset';
import { ResearchFilters } from './types/filters';

const DEFAULT_FILTERS: ResearchFilters = {
  startYear: 1980,
  endYear: 2026,
  ensoPhase: 'ALL',
  selectedVariable: 'composite',
  season: 'SWM_MONSOON',
  geographyLevel: 'state',
  selectedDistrictId: undefined,
  selectedCropId: 'paddy_rice',
  lagMonths: 0
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('landing');
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isDataGovernanceModalOpen, setIsDataGovernanceModalOpen] = useState(false);
  const [datasetState, setDatasetState] = useState<ResearchDatasetState>(DatasetService.getState());
  const [filters, setFilters] = useState<ResearchFilters>(DEFAULT_FILTERS);

  // Subscribe to central dataset events
  useEffect(() => {
    const unsubscribe = DatasetService.subscribe((updated) => {
      setDatasetState(updated);
    });
    return unsubscribe;
  }, []);

  const handleFilterChange = (updated: Partial<ResearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleNavigate = (tab: TabId) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Global Academic Header */}
      <Header
        datasetState={datasetState}
        onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
        onOpenDataGovernanceModal={() => setIsDataGovernanceModalOpen(true)}
        onNavigateToLanding={() => handleNavigate('landing')}
      />

      {/* Module Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={handleNavigate}
      />

      {/* Main Research Working Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'landing' && (
          <LandingPage
            onNavigate={handleNavigate}
            onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
            datasetState={datasetState}
          />
        )}

        {activeTab === 'overview' && (
          <OverviewPage
            datasetState={datasetState}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
            onSelectDistrict={(distId) => {
              if (distId) handleNavigate('district');
            }}
          />
        )}

        {activeTab === 'enso' && (
          <EnsoPage
            datasetState={datasetState}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
          />
        )}

        {activeTab === 'rainfall' && (
          <RainfallPage
            datasetState={datasetState}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
          />
        )}

        {activeTab === 'temperature' && (
          <TemperaturePage
            datasetState={datasetState}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
          />
        )}

        {activeTab === 'agriculture' && (
          <AgriculturePage
            datasetState={datasetState}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
          />
        )}

        {activeTab === 'district' && (
          <DistrictPage
            datasetState={datasetState}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
          />
        )}

        {activeTab === 'statistics' && (
          <StatisticsPage
            datasetState={datasetState}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
          />
        )}

        {activeTab === 'timeseries' && (
          <TimeSeriesPage
            datasetState={datasetState}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
          />
        )}

        {activeTab === 'methodology' && (
          <MethodologyPage />
        )}

        {activeTab === 'sources' && (
          <SourcesPage
            datasetState={datasetState}
            onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
          />
        )}

        {activeTab === 'report' && (
          <ResearchReportPage datasetState={datasetState} />
        )}

        {/* Global Academic Lineage & Auto-Update Metadata Footer on Analytical Views */}
        {activeTab !== 'landing' && (
          <PageMetadataFooter
            datasetState={datasetState}
            onOpenDataGovernanceModal={() => setIsDataGovernanceModalOpen(true)}
            pageTitle={activeTab}
          />
        )}
      </main>

      {/* Dataset Ingestion Modal */}
      <DatasetImportModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
        isDataLoaded={datasetState.isOfficialDataLoaded}
      />

      {/* Data Governance, Auto-Update & Provenance Modal */}
      <AutoUpdateModal
        isOpen={isDataGovernanceModalOpen}
        onClose={() => setIsDataGovernanceModalOpen(false)}
      />

      {/* Institutional Academic Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3 text-center md:text-left">
              <div className="w-8 h-8 rounded-md bg-white border border-slate-200 p-0.5 flex items-center justify-center shadow-2xs overflow-hidden shrink-0">
                <TelanganaMapThumbnail className="w-full h-full object-contain" />
              </div>
              <div>
                <strong className="text-slate-800 block text-xs">
                  El Niño × Telangana Research Project
                </strong>
                <span className="text-[11px] text-slate-400">
                  Statistical Climate Analysis • Climatological Econometrics
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-slate-600 text-[11px]">
              <button
                type="button"
                onClick={() => handleNavigate('overview')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('enso')}
                className="hover:text-slate-900 cursor-pointer"
              >
                ENSO
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('rainfall')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Rainfall
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('temperature')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Temperature
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('agriculture')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Agriculture
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('district')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Districts
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('statistics')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Statistical Hypotheses
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('timeseries')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Time Series
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('methodology')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Methodology
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('sources')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Data Sources
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <p>
              Data grounded in official public repositories: NOAA Climate Prediction Center, India Meteorological Department (IMD), DES Telangana & TSDPS.
            </p>
            <p className="font-mono">
              Hypothesis Level: α = 0.05 • LPA SWM Baseline: 750.5 mm
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
