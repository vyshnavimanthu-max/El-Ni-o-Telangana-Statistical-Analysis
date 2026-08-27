import React from 'react';
import { Waves, CloudRain, Thermometer, Sprout, Database, Layers, ArrowUpRight, Scale } from 'lucide-react';
import { ResearchFilters } from '../types/filters';
import { ResearchDatasetState } from '../types/dataset';
import { MetricCard } from '../components/MetricCard';
import { FilterPanel } from '../components/FilterPanel';
import { EnsoTimeSeriesChart } from '../charts/EnsoTimeSeriesChart';
import { RainfallTimeSeriesChart } from '../charts/RainfallTimeSeriesChart';
import { EnsoVsRainfallScatter } from '../charts/EnsoVsRainfallScatter';
import { EnsoVsTemperatureScatter } from '../charts/EnsoVsTemperatureScatter';
import { EnsoVsYieldChart } from '../charts/EnsoVsYieldChart';
import { CorrelationMatrix } from '../charts/CorrelationMatrix';
import { EnsoPhasesComparison } from '../charts/EnsoPhasesComparison';
import { TelanganaDistrictMap } from '../maps/TelanganaDistrictMap';
import { TelanganaMapThumbnail } from '../components/TelanganaMapThumbnail';
import { calculateMean } from '../statistics/engine';

interface OverviewPageProps {
  datasetState: ResearchDatasetState;
  filters: ResearchFilters;
  onFilterChange: (updated: Partial<ResearchFilters>) => void;
  onResetFilters: () => void;
  onOpenDatasetModal: () => void;
  onSelectDistrict?: (id: string | undefined) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  datasetState,
  filters,
  onFilterChange,
  onResetFilters,
  onOpenDatasetModal,
  onSelectDistrict
}) => {
  // Filter dataset by active year range and phase
  const isLoaded = datasetState.isOfficialDataLoaded;
  
  const filteredMerged = datasetState.mergedRecords.filter(r => {
    const inYear = r.year >= filters.startYear && r.year <= filters.endYear;
    const inPhase = filters.ensoPhase === 'ALL' || r.ensoPhase === filters.ensoPhase;
    return inYear && inPhase;
  });

  const matchingYearsSet = new Set(filteredMerged.map(r => r.year));

  const filteredEnso = datasetState.ensoObservations.filter(
    e => e.year >= filters.startYear && e.year <= filters.endYear && (filters.ensoPhase === 'ALL' || e.phase === filters.ensoPhase)
  );

  const filteredRain = datasetState.rainfallObservations.filter(
    r => matchingYearsSet.has(r.year)
  );

  const filteredTemp = datasetState.temperatureObservations.filter(
    t => matchingYearsSet.has(t.year)
  );

  // Compute live research summary metrics if data is loaded
  const meanRainfall = isLoaded ? calculateMean(filteredRain.map(r => r.southwestMonsoonTotal)) : null;
  const meanRainfallAnomaly = isLoaded ? calculateMean(filteredRain.map(r => r.anomalyPercent)) : null;
  const meanMaxTemp = isLoaded ? calculateMean(filteredTemp.map(t => t.meanMaxTempC)) : null;
  
  const meanPaddyYield = isLoaded ? calculateMean(filteredMerged.map(m => m.paddyYieldKgHa)) : null;

  // Most recent ENSO event or classification
  const latestEnsoRecord = isLoaded && filteredEnso.length > 0 ? filteredEnso[filteredEnso.length - 1] : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Section */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-2xs shrink-0 overflow-hidden flex items-center justify-center">
              <TelanganaMapThumbnail className="w-full h-full object-contain rounded" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                  Overview Dashboard
                </span>
                <span className="text-xs text-slate-400 font-mono">Academic Session 2026</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-serif">
                EL NIÑO × TELANGANA
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Statistical Climate & Agricultural Analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenDatasetModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-teal-300" />
              {isLoaded ? 'Dataset Active (Manage)' : 'Ingest Official Dataset'}
            </button>
          </div>
        </div>
      </section>

      {/* Reusable Research Filter Matrix */}
      <FilterPanel
        filters={filters}
        onFilterChange={onFilterChange}
        onReset={onResetFilters}
        availableYears={[1980, 2026]}
        showCropFilter={true}
        showDistrictFilter={true}
      />

      {/* Meaningful Research Cards (Displays "Awaiting official dataset" when unpopulated) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ENSO STATUS */}
        <MetricCard
          id="metric-enso-status"
          title="ENSO Status"
          icon={Waves}
          value={latestEnsoRecord ? `${latestEnsoRecord.oniValue > 0 ? '+' : ''}${latestEnsoRecord.oniValue}°C` : null}
          unit={latestEnsoRecord ? `(${latestEnsoRecord.phase.replace('_', ' ')})` : undefined}
          subtitle={latestEnsoRecord ? `Latest Period: ${latestEnsoRecord.season3Month} ${latestEnsoRecord.year}` : undefined}
          statusBadge={latestEnsoRecord?.classification ? latestEnsoRecord.classification.replace(/_/g, ' ') : undefined}
          sourceAuthority="NOAA Climate Prediction Center"
          secondaryInfo="Niño 3.4 SST Anomaly"
          isAwaitingData={!isLoaded}
        />

        {/* MONSOON RAINFALL */}
        <MetricCard
          id="metric-rainfall"
          title="Monsoon Rainfall (JJAS)"
          icon={CloudRain}
          value={meanRainfall !== null ? `${meanRainfall.toFixed(1)}` : null}
          unit="mm"
          subtitle={meanRainfallAnomaly !== null ? `Mean Departure: ${meanRainfallAnomaly > 0 ? '+' : ''}${meanRainfallAnomaly.toFixed(1)}% vs LPA` : undefined}
          statusBadge={meanRainfallAnomaly !== null ? (meanRainfallAnomaly < -19 ? 'Deficient' : meanRainfallAnomaly > 19 ? 'Excess' : 'Normal') : undefined}
          sourceAuthority="India Meteorological Department"
          secondaryInfo="LPA Baseline: 750.5 mm"
          isAwaitingData={!isLoaded}
        />

        {/* TEMPERATURE */}
        <MetricCard
          id="metric-temperature"
          title="Monsoon Max Temperature"
          icon={Thermometer}
          value={meanMaxTemp !== null ? `${meanMaxTemp.toFixed(1)}` : null}
          unit="°C"
          subtitle={meanMaxTemp !== null ? 'Daytime Peak Average across JJAS' : undefined}
          sourceAuthority="IMD Gridded Daily Temp 0.5°"
          secondaryInfo="Summer/Monsoon Average"
          isAwaitingData={!isLoaded}
        />

        {/* AGRICULTURAL PRODUCTIVITY */}
        <MetricCard
          id="metric-yield"
          title="Paddy Productivity (Kharif)"
          icon={Sprout}
          value={meanPaddyYield !== null ? `${Math.round(meanPaddyYield)}` : null}
          unit="kg / ha"
          subtitle={meanPaddyYield !== null ? 'Mean Yield across Selected Years' : undefined}
          sourceAuthority="DES, Govt. of Telangana"
          secondaryInfo="Kharif Season Crop Estimation"
          isAwaitingData={!isLoaded}
        />
      </section>

      {/* Prominent Telangana Geospatial Map Showcase */}
      <section className="space-y-3">
        <TelanganaDistrictMap
          selectedDistrictId={filters.selectedDistrictId}
          onSelectDistrict={(id) => {
            onFilterChange({
              geographyLevel: id ? 'district' : 'state',
              selectedDistrictId: id
            });
            if (onSelectDistrict) onSelectDistrict(id);
          }}
        />
      </section>

      {/* Main Analytical Visualizations */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Primary Statistical Visualization Suite
            </h3>
            <p className="text-xs text-slate-500">
              Interactive statistical and climatological charts with real empirical observations
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">7 Core Statistical Modules</span>
        </div>

        {/* Row 1: Time Series (ENSO & Rainfall) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnsoTimeSeriesChart
            data={filteredEnso}
            onConnectClick={onOpenDatasetModal}
          />
          <RainfallTimeSeriesChart
            data={filteredRain}
            onConnectClick={onOpenDatasetModal}
          />
        </div>

        {/* Row 2: Bivariate Scatters (ENSO vs Rainfall & ENSO vs Temperature) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnsoVsRainfallScatter
            data={filteredMerged}
            onConnectClick={onOpenDatasetModal}
          />
          <EnsoVsTemperatureScatter
            data={filteredMerged}
            onConnectClick={onOpenDatasetModal}
          />
        </div>

        {/* Row 3: Agriculture & Phase Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnsoVsYieldChart
            data={filteredMerged}
            onConnectClick={onOpenDatasetModal}
          />
          <EnsoPhasesComparison
            data={filteredMerged}
            onConnectClick={onOpenDatasetModal}
          />
        </div>

        {/* Row 4: Multivariate Correlation Matrix */}
        <div className="w-full">
          <CorrelationMatrix
            data={filteredMerged}
            onConnectClick={onOpenDatasetModal}
          />
        </div>
      </section>
    </div>
  );
};
