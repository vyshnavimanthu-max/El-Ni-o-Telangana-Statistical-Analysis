import React, { useState } from 'react';
import {
  CloudRain,
  Droplets,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  Activity,
  Layers,
  BarChart2,
  Info,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { ResearchDatasetState } from '../types/dataset';
import { ResearchFilters } from '../types/filters';
import { FilterPanel } from '../components/FilterPanel';
import { MetricCard } from '../components/MetricCard';
import { RainfallTimeSeriesChart, RainfallVariableKey, RAINFALL_VARIABLES } from '../charts/RainfallTimeSeriesChart';
import { RainfallEnsoRollingCorrelationChart } from '../charts/RainfallEnsoRollingCorrelationChart';
import { EnsoVsRainfallScatter } from '../charts/EnsoVsRainfallScatter';
import { RainfallEnsoBoxplot } from '../charts/RainfallEnsoBoxplot';
import { RainfallDistributionHistogram } from '../charts/RainfallDistributionHistogram';
import { RainfallStatisticalSummaryTable } from '../components/RainfallStatisticalSummaryTable';
import { RainfallDynamicConclusions } from '../components/RainfallDynamicConclusions';
import { calculateMean, calculateStdDev, calculatePercentile } from '../statistics/engine';

interface RainfallPageProps {
  datasetState: ResearchDatasetState;
  filters: ResearchFilters;
  onFilterChange: (updated: Partial<ResearchFilters>) => void;
  onResetFilters: () => void;
  onOpenDatasetModal: () => void;
}

export const RainfallPage: React.FC<RainfallPageProps> = ({
  datasetState,
  filters,
  onFilterChange,
  onResetFilters,
  onOpenDatasetModal
}) => {
  const [selectedVariable, setSelectedVariable] = useState<RainfallVariableKey>('JJAS');
  const isLoaded = datasetState.isOfficialDataLoaded;

  // Filter observations based on active global research filters
  const filteredMerged = datasetState.mergedRecords.filter(
    m => m.year >= filters.startYear && m.year <= filters.endYear && (filters.ensoPhase === 'ALL' || m.ensoPhase === filters.ensoPhase)
  );

  const matchingYearsSet = new Set(filteredMerged.map(r => r.year));

  const filteredRain = datasetState.rainfallObservations.filter(
    r => matchingYearsSet.has(r.year)
  );

  // Compute live active variable statistics
  const currentVarConfig = RAINFALL_VARIABLES[selectedVariable];
  const activeValues = filteredRain
    .map(r => currentVarConfig.getter(r))
    .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));

  const meanVal = calculateMean(activeValues);
  const stdVal = calculateStdDev(activeValues);
  const medianVal = calculatePercentile(activeValues, 50);
  const cvVal = meanVal !== null && stdVal !== null && meanVal > 0 ? (stdVal / meanVal) * 100 : null;

  // Anomaly calculation formula: Anomaly (%) = ((Observed - Normal) / Normal) * 100
  const activeAnomalies = activeValues.map(v => ((v - currentVarConfig.normalMm) / currentVarConfig.normalMm) * 100);
  const meanAnomaly = calculateMean(activeAnomalies);

  // Count deficit (< -19%) and excess (> +19%) years under active selection
  const deficitYearsCount = activeAnomalies.filter(a => a <= -19).length;
  const excessYearsCount = activeAnomalies.filter(a => a >= 19).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-semibold">
                Meteorological Precipitation Research Module
              </span>
              <span className="text-xs text-slate-500 font-mono">
                IMD 0.25° Gridded × DES Telangana (1980–2024)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-serif">
              Telangana Rainfall &amp; Precipitation Anomaly Analysis
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-4xl">
              Quantitative analysis of Telangana precipitation across Southwest Monsoon (JJAS Total), monthly intra-seasonal partitions (June, July, August, September), and annual aggregates against the documented <strong>IMD 1971–2020 Long Period Average (LPA)</strong> baseline.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-right shrink-0">
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Baseline Normal Reference</span>
            <span className="text-xs font-mono font-bold text-teal-800">
              IMD 1971–2020 LPA (JJAS: 750.5 mm)
            </span>
          </div>
        </div>
      </section>

      {/* Formula & Reference Documentation Banner */}
      <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-sky-950">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-700 shrink-0" />
          <span>
            <strong>Anomaly Formula:</strong> <code>Rainfall Anomaly (%) = ((Observed − Normal) / Normal) × 100</code>
          </span>
        </div>
        <div className="font-mono text-[11px] text-sky-800">
          Documented LPA: JJAS = <strong>750.5 mm</strong> | Annual = <strong>952.7 mm</strong> | June = <strong>129.5 mm</strong> | July = <strong>242.8 mm</strong> | Aug = <strong>218.4 mm</strong> | Sept = <strong>159.8 mm</strong>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFilterChange={onFilterChange}
        onReset={onResetFilters}
        availableYears={[1980, 2026]}
        showCropFilter={false}
        showDistrictFilter={true}
      />

      {/* Dynamic Metrics Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          id="rain-active-mean"
          title={`Sample Mean (${currentVarConfig.shortLabel})`}
          icon={CloudRain}
          value={meanVal !== null ? `${meanVal.toFixed(1)}` : null}
          unit="mm"
          subtitle={stdVal !== null ? `Sample σ = ±${stdVal.toFixed(1)} mm | Median = ${medianVal.toFixed(1)} mm` : undefined}
          statusBadge={`LPA: ${currentVarConfig.normalMm} mm`}
          sourceAuthority="India Meteorological Department"
          secondaryInfo={currentVarConfig.referencePeriod}
          isAwaitingData={!isLoaded}
        />

        <MetricCard
          id="rain-cv-metric"
          title="Coefficient of Variation (CV)"
          icon={Activity}
          value={cvVal !== null ? `${cvVal.toFixed(1)}` : null}
          unit="%"
          subtitle={cvVal !== null ? (cvVal > 25 ? 'High intra-seasonal variability' : 'Moderate climate variability') : undefined}
          statusBadge="CV = (σ / x̄) × 100"
          sourceAuthority="IMD 0.25° Gridded Dataset"
          secondaryInfo="Inter-annual Precipitation Dispersion"
          isAwaitingData={!isLoaded}
        />

        <MetricCard
          id="rain-mean-departure"
          title="Mean Departure from Normal"
          icon={Droplets}
          value={meanAnomaly !== null ? `${meanAnomaly > 0 ? '+' : ''}${meanAnomaly.toFixed(1)}` : null}
          unit="%"
          subtitle={meanAnomaly !== null ? (meanAnomaly < 0 ? 'Negative departure bias' : 'Positive departure bias') : undefined}
          sourceAuthority="IMD 1971–2020 Normal"
          secondaryInfo="Empirical Anomaly Mean"
          isAwaitingData={!isLoaded}
        />

        <MetricCard
          id="rain-drought-epochs"
          title="Deficit Years (≤ -19%)"
          icon={AlertTriangle}
          value={isLoaded ? `${deficitYearsCount}` : null}
          unit="years"
          subtitle={`Excess years (≥ +19%): ${excessYearsCount}`}
          statusBadge="IMD Deficient vs Normal"
          sourceAuthority="IMD Operational Criteria"
          secondaryInfo="Meteorological Deficit Frequency"
          isAwaitingData={!isLoaded}
        />
      </section>

      {/* Visualization 1 & 2: Rainfall Time Series & Anomaly Time Series */}
      <RainfallTimeSeriesChart
        data={filteredRain}
        selectedVariable={selectedVariable}
        onVariableChange={setSelectedVariable}
        onConnectClick={onOpenDatasetModal}
      />

      {/* Visualization 3 & 4: ONI vs Rainfall Scatter Plot (OLS Regression) & El Niño/Neutral/La Niña Boxplot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnsoVsRainfallScatter
          data={filteredMerged}
          onConnectClick={onOpenDatasetModal}
        />

        <RainfallEnsoBoxplot
          data={filteredMerged}
          onConnectClick={onOpenDatasetModal}
        />
      </div>

      {/* Visualization 5: Empirical Distribution Histogram & Gaussian Normality */}
      <RainfallDistributionHistogram
        data={filteredRain}
        onConnectClick={onOpenDatasetModal}
      />

      {/* Visualization 6: Rolling ENSO-Rainfall Correlation (15-Year & 20-Year Windows) */}
      <RainfallEnsoRollingCorrelationChart
        data={filteredMerged}
        onConnectClick={onOpenDatasetModal}
      />

      {/* Full Parametric & Non-Parametric Summary Table */}
      <RainfallStatisticalSummaryTable
        data={filteredMerged}
      />

      {/* Dynamic Scientific Conclusions (Strictly Data-Grounded) */}
      <RainfallDynamicConclusions
        data={filteredMerged}
      />
    </div>
  );
};
