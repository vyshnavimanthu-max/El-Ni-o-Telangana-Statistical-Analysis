import React, { useState } from 'react';
import { Waves, Thermometer, Info, Activity, Layers, CloudRain, Sprout, Compass } from 'lucide-react';
import { ResearchDatasetState } from '../types/dataset';
import { ResearchFilters } from '../types/filters';
import { FilterPanel } from '../components/FilterPanel';
import { MetricCard } from '../components/MetricCard';
import { EnsoTimeSeriesChart } from '../charts/EnsoTimeSeriesChart';
import { EnsoVsRainfallScatter } from '../charts/EnsoVsRainfallScatter';
import { EnsoVsTemperatureScatter } from '../charts/EnsoVsTemperatureScatter';
import { EnsoPhasesComparison } from '../charts/EnsoPhasesComparison';
import { EnsoVsYieldChart } from '../charts/EnsoVsYieldChart';
import { EnsoMonsoonMonthlyAnalysis } from '../components/EnsoMonsoonMonthlyAnalysis';
import { EnsoResearchInterpretation } from '../components/EnsoResearchInterpretation';
import { SourceBadge } from '../components/SourceBadge';
import { calculateMean, calculateStdDev } from '../statistics/engine';

interface EnsoPageProps {
  datasetState: ResearchDatasetState;
  filters: ResearchFilters;
  onFilterChange: (updated: Partial<ResearchFilters>) => void;
  onResetFilters: () => void;
  onOpenDatasetModal: () => void;
}

export const EnsoPage: React.FC<EnsoPageProps> = ({
  datasetState,
  filters,
  onFilterChange,
  onResetFilters,
  onOpenDatasetModal
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MONSOON_BREAKDOWN' | 'SCATTERS' | 'PHASE_COMPARISONS' | 'AGRICULTURE' | 'INTERPRETATION'>('OVERVIEW');
  const isLoaded = datasetState.isOfficialDataLoaded;

  // Filter ENSO observations
  const filteredEnso = (datasetState.ensoObservations || []).filter(e => {
    const inYear = e.year >= filters.startYear && e.year <= filters.endYear;
    const inPhase = filters.ensoPhase === 'ALL' || e.phase === filters.ensoPhase;
    return inYear && inPhase;
  });

  // Filter merged climate matrix records for live chart computations
  const filteredMerged = (datasetState.mergedRecords || []).filter(d => {
    const inYear = d.year >= filters.startYear && d.year <= filters.endYear;
    const inPhase = filters.ensoPhase === 'ALL' || d.ensoPhase === filters.ensoPhase;
    return inYear && inPhase;
  });

  // Calculate live summary stats from active filtered records
  const allOniVals = filteredEnso.map(e => e.oniValue);
  const meanOni = calculateMean(allOniVals);
  const stdOni = calculateStdDev(allOniVals);
  const maxOni = allOniVals.length > 0 ? Math.max(...allOniVals) : null;
  const minOni = allOniVals.length > 0 ? Math.min(...allOniVals) : null;
  const elNinoCount = filteredEnso.filter(e => e.phase === 'EL_NINO').length;
  const laNinaCount = filteredEnso.filter(e => e.phase === 'LA_NINA').length;
  const neutralCount = filteredEnso.filter(e => e.phase === 'NEUTRAL').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Section Header */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold">
                Atmospheric Teleconnection Research Module
              </span>
              <span className="text-xs text-slate-500 font-mono">NOAA CPC ERSST.v5 × IMD 0.25° × DES Telangana</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-serif">
              ENSO Statistical Teleconnections in Telangana
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-4xl">
              Evaluating the statistical associations between equatorial Pacific Oceanic Niño Index (ONI) conditions and Telangana southwest monsoon rainfall, surface temperature anomalies, and agricultural productivity.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFilterChange={onFilterChange}
        onReset={onResetFilters}
        availableYears={[1950, 2026]}
        showCropFilter={false}
        showDistrictFilter={false}
      />

      {/* Metrics Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          id="enso-mean-oni"
          title="Sample Mean ONI Anomaly"
          icon={Waves}
          value={meanOni !== null ? `${meanOni > 0 ? '+' : ''}${meanOni.toFixed(2)}` : null}
          unit="°C"
          subtitle={stdOni !== null ? `Sample σ = ±${stdOni.toFixed(2)}°C` : undefined}
          sourceAuthority="NOAA Climate Prediction Center"
          secondaryInfo="Niño 3.4 SST Anomaly (ERSST.v5)"
          isAwaitingData={!isLoaded}
        />

        <MetricCard
          id="enso-elnino-episodes"
          title="El Niño Epochs (Warm)"
          icon={Thermometer}
          value={isLoaded ? `${elNinoCount}` : null}
          unit="seasons"
          subtitle={isLoaded ? `${((elNinoCount / Math.max(1, filteredEnso.length)) * 100).toFixed(0)}% of filtered record` : undefined}
          statusBadge="ONI ≥ +0.5°C"
          sourceAuthority="NOAA 3-Month Running Mean"
          secondaryInfo={maxOni !== null ? `Peak Warm: +${maxOni.toFixed(2)}°C` : 'Warm Equatorial Phase'}
          isAwaitingData={!isLoaded}
        />

        <MetricCard
          id="enso-lanina-episodes"
          title="La Niña Epochs (Cool)"
          icon={Activity}
          value={isLoaded ? `${laNinaCount}` : null}
          unit="seasons"
          subtitle={isLoaded ? `${((laNinaCount / Math.max(1, filteredEnso.length)) * 100).toFixed(0)}% of filtered record` : undefined}
          statusBadge="ONI ≤ -0.5°C"
          sourceAuthority="NOAA 3-Month Running Mean"
          secondaryInfo={minOni !== null ? `Peak Cool: ${minOni.toFixed(2)}°C` : 'Cool Equatorial Phase'}
          isAwaitingData={!isLoaded}
        />

        <MetricCard
          id="enso-neutral-episodes"
          title="Neutral Climate State"
          icon={Info}
          value={isLoaded ? `${neutralCount}` : null}
          unit="seasons"
          subtitle={isLoaded ? `${((neutralCount / Math.max(1, filteredEnso.length)) * 100).toFixed(0)}% of filtered record` : undefined}
          statusBadge="-0.5°C < ONI < +0.5°C"
          sourceAuthority="NOAA CPC"
          secondaryInfo="Equatorial Balance"
          isAwaitingData={!isLoaded}
        />
      </section>

      {/* Main ENSO Time Series Chart (Full Interactive Component with 1980–Latest & 1950–Latest toggles) */}
      <EnsoTimeSeriesChart
        data={filteredEnso}
        onConnectClick={onOpenDatasetModal}
      />

      {/* Intra-Seasonal Southwest Monsoon Monthly Breakdown (June, July, August, September, JJAS) */}
      <EnsoMonsoonMonthlyAnalysis
        data={filteredMerged}
        onConnectClick={onOpenDatasetModal}
      />

      {/* Bivariate Scatter Plots & OLS Regressions */}
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

      {/* ENSO Stratified Phase Comparison (El Niño vs Neutral vs La Niña) */}
      <EnsoPhasesComparison
        data={filteredMerged}
        onConnectClick={onOpenDatasetModal}
      />

      {/* Agricultural Yield Sensitivity (Paddy, Cotton, Maize, Red Gram, Soyabean) */}
      <EnsoVsYieldChart
        data={filteredMerged}
        onConnectClick={onOpenDatasetModal}
      />

      {/* Synthesized Research Interpretation (5 Core Questions Grounded in Empirical Statistics) */}
      <EnsoResearchInterpretation
        data={filteredMerged}
      />
    </div>
  );
};
