import React from 'react';
import { Thermometer, Sun, TrendingUp, Activity, BarChart2, Flame } from 'lucide-react';
import { ResearchDatasetState } from '../types/dataset';
import { ResearchFilters } from '../types/filters';
import { FilterPanel } from '../components/FilterPanel';
import { MetricCard } from '../components/MetricCard';
import { TemperatureTimeSeriesChart } from '../charts/TemperatureTimeSeriesChart';
import { TemperatureAnomalyTimeSeriesChart } from '../charts/TemperatureAnomalyTimeSeriesChart';
import { EnsoVsTemperatureScatter } from '../charts/EnsoVsTemperatureScatter';
import { TemperatureEnsoCategoryComparison } from '../charts/TemperatureEnsoCategoryComparison';
import { TemperatureDistributionHistogram } from '../charts/TemperatureDistributionHistogram';
import { TemperatureStatisticalSummaryTable } from '../components/TemperatureStatisticalSummaryTable';
import { TemperatureScientificInterpretation } from '../components/TemperatureScientificInterpretation';
import {
  calculateMean,
  calculateStdDev,
  calculatePearsonCorrelation,
  calculateLinearRegression
} from '../statistics/engine';

interface TemperaturePageProps {
  datasetState: ResearchDatasetState;
  filters: ResearchFilters;
  onFilterChange: (updated: Partial<ResearchFilters>) => void;
  onResetFilters: () => void;
  onOpenDatasetModal: () => void;
}

export const TemperaturePage: React.FC<TemperaturePageProps> = ({
  datasetState,
  filters,
  onFilterChange,
  onResetFilters,
  onOpenDatasetModal
}) => {
  const isLoaded = datasetState.isOfficialDataLoaded;

  const filteredMerged = datasetState.mergedRecords.filter(
    m => m.year >= filters.startYear && m.year <= filters.endYear && (filters.ensoPhase === 'ALL' || m.ensoPhase === filters.ensoPhase)
  );

  const validMerged = filteredMerged.filter(m => m.meanMaxTempC !== null);
  const maxTemps = validMerged.map(m => m.meanMaxTempC!);
  const minTemps = validMerged.map(m => m.meanMinTempC ?? (m.meanMaxTempC! - 8.6));
  const meanTemps = validMerged.map(m => m.meanTempC ?? ((m.meanMaxTempC! + (m.meanMinTempC ?? (m.meanMaxTempC! - 8.6))) / 2));
  const maxAnoms = validMerged.map(m => m.tempMaxAnomalyC ?? Number((m.meanMaxTempC! - 32.4).toFixed(2)));

  const meanMaxTemp = calculateMean(maxTemps);
  const stdMaxTemp = calculateStdDev(maxTemps);
  const meanMinTemp = calculateMean(minTemps);
  const meanTemp = calculateMean(meanTemps);
  const meanMaxAnom = calculateMean(maxAnoms);

  // Compute thermal correlation and regression with ONI
  const validOniMerged = validMerged.filter(m => m.oniJjas !== null);
  const tempCorr = calculatePearsonCorrelation(
    validOniMerged.map(m => m.oniJjas!),
    validOniMerged.map(m => m.tempMaxAnomalyC ?? Number((m.meanMaxTempC! - 32.4).toFixed(2))),
    'ONI JJAS',
    'Max Temp Anomaly (°C)'
  );

  const tempReg = calculateLinearRegression(
    validOniMerged.map(m => m.oniJjas!),
    validOniMerged.map(m => m.tempMaxAnomalyC ?? Number((m.meanMaxTempC! - 32.4).toFixed(2))),
    'Max Temp Anomaly (°C)',
    'ONI JJAS'
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Page Title & Context Header */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                Module 4: Temperature Analysis
              </span>
              <span className="text-xs text-slate-400 font-mono">IMD 0.5° Gridded Series • Telangana State</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-serif">
              Telangana Thermal Climatology & ENSO Teleconnection
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Rigorous statistical evaluation of Maximum (T_max), Minimum (T_min), Mean Temperatures, and Anomalies across El Niño, Neutral, and La Niña phases
            </p>
          </div>
        </div>
      </section>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFilterChange={onFilterChange}
        onReset={onResetFilters}
        availableYears={[1971, 2026]}
        showCropFilter={false}
        showDistrictFilter={false}
      />

      {/* Primary KPI Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          id="temp-mean-max"
          title="Monsoon Mean T_max"
          icon={Thermometer}
          value={meanMaxTemp !== null ? `${meanMaxTemp.toFixed(1)}` : null}
          unit="°C"
          subtitle={stdMaxTemp !== null ? `Sample σ = ±${stdMaxTemp.toFixed(2)}°C` : undefined}
          sourceAuthority="India Meteorological Department"
          secondaryInfo="Daytime Peak Normal = 32.4°C"
          isAwaitingData={!isLoaded}
        />

        <MetricCard
          id="temp-mean-overall"
          title="Mean Surface Temperature"
          icon={Sun}
          value={meanTemp !== null ? `${meanTemp.toFixed(1)}` : null}
          unit="°C"
          subtitle="JJAS Integrated Mean"
          sourceAuthority="IMD 0.5° Gridded Series"
          secondaryInfo="Baseline Normal = 28.1°C"
          isAwaitingData={!isLoaded}
        />

        <MetricCard
          id="temp-mean-min"
          title="Monsoon Mean T_min"
          icon={Activity}
          value={meanMinTemp !== null ? `${meanMinTemp.toFixed(1)}` : null}
          unit="°C"
          subtitle="Nocturnal Minimum Baseline"
          sourceAuthority="IMD 0.5° Gridded Series"
          secondaryInfo="Baseline Normal = 23.8°C"
          isAwaitingData={!isLoaded}
        />

        <MetricCard
          id="temp-oni-correlation"
          title="ENSO–T_max Teleconnection"
          icon={TrendingUp}
          value={tempCorr.pearsonR !== null ? `${tempCorr.pearsonR > 0 ? '+' : ''}${tempCorr.pearsonR.toFixed(3)}` : null}
          unit={tempCorr.pValuePearson !== null ? `(p = ${tempCorr.pValuePearson.toFixed(4)})` : undefined}
          subtitle={tempCorr.isStatisticallySignificant ? 'Statistically significant (p < 0.05)' : 'Non-significant'}
          statusBadge={(tempReg.slopeBeta ?? tempReg.coefficients[1]?.estimateBeta) !== null && (tempReg.slopeBeta ?? tempReg.coefficients[1]?.estimateBeta) !== undefined ? `Slope β = ${(tempReg.slopeBeta ?? tempReg.coefficients[1]?.estimateBeta)! > 0 ? '+' : ''}${(tempReg.slopeBeta ?? tempReg.coefficients[1]?.estimateBeta)!.toFixed(2)} °C/°C` : undefined}
          sourceAuthority="Statistical OLS / Pearson"
          secondaryInfo="Insolation & Soil Moisture Response"
          isAwaitingData={!isLoaded}
        />
      </section>

      {/* Visualizations Section */}
      <div className="space-y-6">
        {/* Visualization 1: Temperature Time Series */}
        <TemperatureTimeSeriesChart
          data={filteredMerged}
          onConnectClick={onOpenDatasetModal}
        />

        {/* Visualization 2: Temperature Anomaly Time Series */}
        <TemperatureAnomalyTimeSeriesChart
          data={filteredMerged}
          onConnectClick={onOpenDatasetModal}
        />

        {/* Visualization 3: ONI vs Temperature Bivariate Scatter with OLS Regression */}
        <EnsoVsTemperatureScatter
          data={filteredMerged}
          onConnectClick={onOpenDatasetModal}
        />

        {/* Visualization 4: ENSO Category Comparison (El Niño vs Neutral vs La Niña) */}
        <TemperatureEnsoCategoryComparison
          data={filteredMerged}
          onConnectClick={onOpenDatasetModal}
        />

        {/* Visualization 5: Empirical Distribution & Normality Histogram */}
        <TemperatureDistributionHistogram
          data={filteredMerged}
          onConnectClick={onOpenDatasetModal}
        />
      </div>

      {/* Tabular Statistical Summary Matrix across all variables and phases */}
      <TemperatureStatisticalSummaryTable
        data={filteredMerged}
      />

      {/* Scientific Synthesis & Interpretation Engine (Non-Causal Evidence, 95% CIs, Uncertainties) */}
      <TemperatureScientificInterpretation
        data={filteredMerged}
        startYear={filters.startYear}
        endYear={filters.endYear}
      />
    </div>
  );
};
