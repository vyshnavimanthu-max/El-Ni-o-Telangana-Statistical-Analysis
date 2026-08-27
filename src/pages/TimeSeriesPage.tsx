import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Activity,
  Calendar,
  Layers,
  Table as TableIcon,
  Download,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Maximize2,
  Info,
  Clock,
  Sparkles,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import { ResearchDatasetState } from '../types/dataset';
import { ResearchFilters } from '../types/filters';
import { FilterPanel } from '../components/FilterPanel';
import { SourceBadge } from '../components/SourceBadge';
import { EmptyState } from '../components/EmptyState';
import { 
  calculateRollingCorrelation,
  RollingCorrelationPoint 
} from '../statistics/engine';
import {
  calculateMannKendallAndSensSlope,
  calculateAcfAndPacf,
  calculateAdfTest,
  calculateMovingAveragesAndDecomp,
  calculateTelanganaMonthlySeasonality,
  MannKendallResult,
  AcfPacfResult,
  AdfTestResult
} from '../statistics/timeSeriesEngine';
import { 
  getOfficialImdMonthlyRainfallRecords,
  getOfficialImdTemperatureRecords 
} from '../data/referenceOfficialData';

interface TimeSeriesPageProps {
  datasetState: ResearchDatasetState;
  filters: ResearchFilters;
  onFilterChange: (updated: Partial<ResearchFilters>) => void;
  onResetFilters: () => void;
  onOpenDatasetModal: () => void;
}

type TabMode = 
  | 'TREND_MANN_KENDALL' 
  | 'SEASONALITY' 
  | 'MOVING_AVERAGE' 
  | 'ACF_PACF' 
  | 'STATIONARITY_ADF' 
  | 'ROLLING_ENSO_CORRELATION' 
  | 'ARIMA_INFERENCE_FRAMEWORK';

type AnalyzedVariableKey = 
  | 'rainfall' 
  | 'rainfall_anomaly' 
  | 'temperature' 
  | 'oni';

export const TimeSeriesPage: React.FC<TimeSeriesPageProps> = ({
  datasetState,
  filters,
  onFilterChange,
  onResetFilters,
  onOpenDatasetModal
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('TREND_MANN_KENDALL');
  const [selectedVar, setSelectedVar] = useState<AnalyzedVariableKey>('rainfall');
  const [rollingWindowSize, setRollingWindowSize] = useState<15 | 20>(15);
  const [maWindowType, setMaWindowType] = useState<'ma3' | 'ma5' | 'ma10'>('ma5');

  const isLoaded = datasetState.isOfficialDataLoaded;

  // Filtered dataset according to start/end year range
  const filteredMerged = useMemo(() => {
    return datasetState.mergedRecords.filter(
      m => m.year >= filters.startYear && m.year <= filters.endYear && (filters.ensoPhase === 'ALL' || m.ensoPhase === filters.ensoPhase)
    );
  }, [datasetState.mergedRecords, filters.startYear, filters.endYear, filters.ensoPhase]);

  // Extract continuous aligned arrays
  const timeSeriesArrays = useMemo(() => {
    const years = filteredMerged.map(r => r.year);
    const rainfall = filteredMerged.map(r => r.rainfallJjasMm);
    const rainfallAnomaly = filteredMerged.map(r => r.rainfallAnomalyPercent);
    const temperature = filteredMerged.map(r => r.meanMaxTempC);
    const oni = filteredMerged.map(r => r.oniJjas);

    return {
      years,
      rainfall: {
        name: 'Telangana Monsoon Rainfall (JJAS)',
        unit: 'mm',
        values: rainfall,
        normalLpa: 750.5
      },
      rainfall_anomaly: {
        name: 'Rainfall Percentage Departure vs LPA',
        unit: '%',
        values: rainfallAnomaly,
        normalLpa: 0
      },
      temperature: {
        name: 'Monsoon Mean Max Temperature (T_max)',
        unit: '°C',
        values: temperature,
        normalLpa: 32.4
      },
      oni: {
        name: 'Oceanic Niño Index (ONI JJAS SST Anomaly)',
        unit: '°C',
        values: oni,
        normalLpa: 0
      }
    };
  }, [filteredMerged]);

  const activeSeries = timeSeriesArrays[selectedVar];

  // 1. Mann-Kendall and Sen's Slope Results for all variables
  const mkRainfall = useMemo(() => {
    return calculateMannKendallAndSensSlope(
      timeSeriesArrays.years,
      timeSeriesArrays.rainfall.values.filter((v): v is number => v !== null),
      'Telangana Southwest Monsoon Rainfall',
      'mm'
    );
  }, [timeSeriesArrays]);

  const mkTemp = useMemo(() => {
    return calculateMannKendallAndSensSlope(
      timeSeriesArrays.years,
      timeSeriesArrays.temperature.values.filter((v): v is number => v !== null),
      'Mean Maximum Temperature (T_max)',
      '°C'
    );
  }, [timeSeriesArrays]);

  const mkActive = useMemo(() => {
    return calculateMannKendallAndSensSlope(
      timeSeriesArrays.years,
      activeSeries.values.filter((v): v is number => v !== null),
      activeSeries.name,
      activeSeries.unit
    );
  }, [timeSeriesArrays.years, activeSeries]);

  // 2. ACF & PACF calculation
  const acfPacfResult = useMemo(() => {
    return calculateAcfAndPacf(
      activeSeries.values,
      activeSeries.name,
      12
    );
  }, [activeSeries]);

  // 3. Stationarity ADF Test
  const adfActive = useMemo(() => {
    return calculateAdfTest(
      activeSeries.values,
      activeSeries.name,
      1,
      selectedVar === 'temperature' // include deterministic trend for temperature
    );
  }, [activeSeries, selectedVar]);

  // 4. Moving Average & Decomposition
  const decompData = useMemo(() => {
    const cleanYears: number[] = [];
    const cleanVals: number[] = [];
    for (let i = 0; i < timeSeriesArrays.years.length; i++) {
      const y = activeSeries.values[i];
      if (typeof y === 'number' && !isNaN(y)) {
        cleanYears.push(timeSeriesArrays.years[i]);
        cleanVals.push(y);
      }
    }
    return calculateMovingAveragesAndDecomp(cleanYears, cleanVals);
  }, [timeSeriesArrays.years, activeSeries]);

  // 5. Monthly Seasonality breakdown
  const monthlySeasonality = useMemo(() => {
    const rawMonthly = getOfficialImdMonthlyRainfallRecords();
    // Filter and merge phase from datasetState
    const mapped = rawMonthly
      .filter(r => r.year >= filters.startYear && r.year <= filters.endYear)
      .map(r => {
        const match = datasetState.mergedRecords.find(m => m.year === r.year);
        return {
          ...r,
          ensoPhase: match?.ensoPhase || 'NEUTRAL'
        };
      });
    return calculateTelanganaMonthlySeasonality(mapped);
  }, [datasetState.mergedRecords, filters.startYear, filters.endYear]);

  // 6. Rolling ENSO-Rainfall Correlation (15-year / 20-year)
  const rollingCorrelationResult = useMemo(() => {
    const alignedData = filteredMerged.map(r => ({
      year: r.year,
      x: r.oniJjas,
      y: r.rainfallJjasMm
    }));
    return calculateRollingCorrelation(
      alignedData,
      rollingWindowSize,
      'ONI JJAS',
      'Monsoon Rainfall'
    );
  }, [filteredMerged, rollingWindowSize]);

  // Export Complete Time Series Statistics CSV
  const handleExportCsv = () => {
    if (filteredMerged.length === 0) return;
    const headers = [
      'Year',
      'Rainfall_JJAS_mm',
      'Rainfall_MA3_mm',
      'Rainfall_MA5_mm',
      'Rainfall_MA10_mm',
      'MeanMaxTemp_C',
      'ONI_JJAS_C',
      'ENSO_Phase'
    ];

    const rows = decompData.map((d) => {
      const rec = filteredMerged.find(m => m.year === d.year);
      return [
        d.year,
        d.observed,
        d.ma3 ?? '',
        d.ma5 ?? '',
        d.ma10 ?? '',
        rec?.meanMaxTempC ?? '',
        rec?.oniJjas ?? '',
        rec?.ensoPhase ?? ''
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Telangana_TimeSeries_Analytics_${filters.startYear}_${filters.endYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. MODULE TITLE & RIGOROUS METHODOLOGY BANNER */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                Module 8: Longitudinal Series & Stochastic Dynamics
              </span>
              <span className="text-xs text-slate-500 font-mono">Statistical Research Methodology</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-serif">
              Time Series Analysis, Stochastic Stationarity & Teleconnection Stability
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Rigorous non-parametric monotonic trend testing (Mann-Kendall, Theil-Sen), intra-seasonal Fourier/monthly breakdown, serial persistence (ACF, PACF), unit-root testing (ADF), and 15/20-year rolling teleconnection stability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Series CSV</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. RESEARCH FILTER MATRIX */}
      <FilterPanel
        filters={filters}
        onFilterChange={onFilterChange}
        onReset={onResetFilters}
        availableYears={[1971, 2026]}
        showCropFilter={false}
        showDistrictFilter={false}
      />

      {/* 3. VARIABLE SELECTOR & TAB NAVIGATION */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Target Variable:</span>
            <select
              value={selectedVar}
              onChange={(e) => setSelectedVar(e.target.value as AnalyzedVariableKey)}
              className="bg-slate-50 border border-slate-200 text-xs rounded-md px-3 py-1.5 font-bold text-slate-800 focus:outline-teal-600 cursor-pointer"
            >
              <option value="rainfall">IMD Monsoon Rainfall (JJAS mm)</option>
              <option value="rainfall_anomaly">IMD Rainfall Departure (% vs LPA)</option>
              <option value="temperature">IMD Mean Max Temperature (T_max °C)</option>
              <option value="oni">NOAA Oceanic Niño Index (ONI JJAS °C)</option>
            </select>
          </div>

          <div className="text-xs font-mono text-slate-500">
            Observation Period: <strong>{filters.startYear}–{filters.endYear}</strong> (N = {filteredMerged.length} years)
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('TREND_MANN_KENDALL')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'TREND_MANN_KENDALL'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>1. Trend (Mann-Kendall & Sen's Slope)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SEASONALITY')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'SEASONALITY'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>2. Intra-Seasonal Monsoon Cycle</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MOVING_AVERAGE')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'MOVING_AVERAGE'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>3. Moving Averages & Smoothing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ACF_PACF')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ACF_PACF'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>4. Autocorrelation (ACF & PACF)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STATIONARITY_ADF')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'STATIONARITY_ADF'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>5. Stationarity (ADF Test)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ROLLING_ENSO_CORRELATION')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ROLLING_ENSO_CORRELATION'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>6. Rolling ENSO Teleconnection</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ARIMA_INFERENCE_FRAMEWORK')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ARIMA_INFERENCE_FRAMEWORK'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>7. Inference vs ARIMA Justification</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: MANN-KENDALL TREND TEST & SEN'S SLOPE
         ========================================================================= */}
      {activeTab === 'TREND_MANN_KENDALL' && (
        <div className="space-y-6">
          {/* Statistical Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rainfall Trend Summary */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900 font-serif">
                  Telangana SWM Monsoon Rainfall (1971–{filters.endYear})
                </h4>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                  mkRainfall.isSignificant ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  {mkRainfall.isSignificant ? 'Significant Monotonic Trend' : 'No Monotonic Trend (Stationary Mean)'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-center">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Mann-Kendall S</span>
                  <strong className="text-sm text-slate-900">{mkRainfall.sStatistic > 0 ? '+' : ''}{mkRainfall.sStatistic}</strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Z Statistic</span>
                  <strong className="text-sm text-slate-900">{mkRainfall.zStatistic > 0 ? '+' : ''}{mkRainfall.zStatistic}</strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">p-value</span>
                  <strong className="text-sm text-slate-900">{mkRainfall.pValue.toFixed(4)}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-center">
                <div className="bg-teal-50/50 p-2.5 rounded border border-teal-200">
                  <span className="text-[10px] text-teal-900 block uppercase font-bold">Sen's Slope (Q_med)</span>
                  <strong className="text-base text-teal-950 font-bold">
                    {mkRainfall.sensSlope > 0 ? '+' : ''}{mkRainfall.sensSlope} mm/yr
                  </strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">95% Confidence Interval</span>
                  <span className="text-xs text-slate-800 font-bold">
                    [{mkRainfall.sensSlopeCi95[0]} to {mkRainfall.sensSlopeCi95[1]}]
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Interpretation:</strong> {mkRainfall.interpretation}
              </p>
            </div>

            {/* Temperature Trend Summary */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900 font-serif">
                  Monsoon Mean Max Temperature T_max (1971–{filters.endYear})
                </h4>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                  mkTemp.isSignificant ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  {mkTemp.isSignificant ? 'Significant Thermal Trend' : 'Stationary Thermal State'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-center">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Mann-Kendall S</span>
                  <strong className="text-sm text-slate-900">{mkTemp.sStatistic > 0 ? '+' : ''}{mkTemp.sStatistic}</strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Z Statistic</span>
                  <strong className="text-sm text-slate-900">{mkTemp.zStatistic > 0 ? '+' : ''}{mkTemp.zStatistic}</strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">p-value</span>
                  <strong className="text-sm text-slate-900">{mkTemp.pValue.toFixed(4)}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-center">
                <div className="bg-rose-50/50 p-2.5 rounded border border-rose-200">
                  <span className="text-[10px] text-rose-900 block uppercase font-bold">Sen's Slope (Q_med)</span>
                  <strong className="text-base text-rose-950 font-bold">
                    {mkTemp.sensSlope > 0 ? '+' : ''}{mkTemp.sensSlope} °C/yr
                  </strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">95% Confidence Interval</span>
                  <span className="text-xs text-slate-800 font-bold">
                    [{mkTemp.sensSlopeCi95[0]} to {mkTemp.sensSlopeCi95[1]}]
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Interpretation:</strong> {mkTemp.interpretation}
              </p>
            </div>
          </div>

          {/* Time Series Chart with Fitted Theil-Sen Robust Line */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  Longitudinal Observations with Fitted Non-Parametric Theil-Sen Trend Line
                </h3>
                <p className="text-xs text-slate-500">
                  Comparing raw empirical series with robust median slope trajectory: y = {mkActive.sensIntercept.toFixed(2)} + ({mkActive.sensSlope > 0 ? '+' : ''}{mkActive.sensSlope.toFixed(3)} × Year)
                </p>
              </div>
              <div className="font-mono text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                Kendall's τ = <strong>{mkActive.tauKendall}</strong> | p = <strong>{mkActive.pValue}</strong>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={decompData} margin={{ top: 15, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{ value: `${activeSeries.name} (${activeSeries.unit})`, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#0f766e' }}
                  />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.375rem', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }} />
                  <ReferenceLine y={activeSeries.normalLpa} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: `LPA Baseline (${activeSeries.normalLpa} ${activeSeries.unit})`, fill: '#64748b', fontSize: 10 }} />

                  <Line
                    type="monotone"
                    dataKey="observed"
                    name={`Observed ${activeSeries.name}`}
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#0284c7' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sensTrend"
                    name={`Sen's Robust Linear Trend (${mkActive.sensSlope > 0 ? '+' : ''}${mkActive.sensSlope} ${activeSeries.unit}/yr)`}
                    stroke="#e11d48"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: INTRA-SEASONAL MONSOON CYCLE & SEASONALITY
         ========================================================================= */}
      {activeTab === 'SEASONALITY' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  Intra-Seasonal Southwest Monsoon Monthly Distribution (June – September)
                </h3>
                <p className="text-xs text-slate-500">
                  Telangana State-Level IMD climatology: Monthly rainfall budget, dispersion, and phase-conditioned deficits.
                </p>
              </div>
              <span className="text-xs font-mono bg-teal-50 text-teal-800 px-2.5 py-1 rounded border border-teal-200 font-semibold">
                Peak: {monthlySeasonality.peakRainfallMonth}
              </span>
            </div>

            {/* Monthly Breakdown Chart */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySeasonality.monthlyBreakdown} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="monthName" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} label={{ value: 'Mean Monthly Rainfall (mm)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#0f766e' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.375rem', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }} />

                  <Bar dataKey="historicalMean" name="Historical Mean (All Years)" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="laNinaMean" name="La Niña Mean" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="neutralMean" name="Neutral Mean" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="elNinoMean" name="El Niño Mean" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-2.5">Monsoon Month</th>
                    <th className="p-2.5 font-mono text-right">Mean (mm)</th>
                    <th className="p-2.5 font-mono text-right">Median (mm)</th>
                    <th className="p-2.5 font-mono text-right">SD (σ)</th>
                    <th className="p-2.5 font-mono text-right">Share of SWM</th>
                    <th className="p-2.5 font-mono text-right">El Niño Deficit (%)</th>
                    <th className="p-2.5 font-mono text-right">Range [Min, Max]</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {monthlySeasonality.monthlyBreakdown.map((m) => (
                    <tr key={m.monthCode} className="hover:bg-slate-50">
                      <td className="p-2.5 font-sans font-bold text-slate-900">{m.monthName}</td>
                      <td className="p-2.5 text-right font-bold text-teal-800">{m.historicalMean} mm</td>
                      <td className="p-2.5 text-right text-slate-700">{m.historicalMedian} mm</td>
                      <td className="p-2.5 text-right text-slate-600">±{m.standardDeviation}</td>
                      <td className="p-2.5 text-right text-slate-800 font-bold">{m.shareOfSwmTotalPct}%</td>
                      <td className="p-2.5 text-right text-rose-600 font-bold">{m.elNinoDeficitPct > 0 ? '+' : ''}{m.elNinoDeficitPct}%</td>
                      <td className="p-2.5 text-right text-slate-500">[{m.minObserved}, {m.maxObserved}]</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
              <strong>Seasonal Dynamics Insight:</strong> {monthlySeasonality.interpretation}
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: MOVING AVERAGE SMOOTHING & MULTI-DECADAL FILTERING
         ========================================================================= */}
      {activeTab === 'MOVING_AVERAGE' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  Multi-Decadal Smoothing & Moving Average Decomposition
                </h3>
                <p className="text-xs text-slate-500">
                  Filtering high-frequency inter-annual variability to reveal low-frequency climate regime shifts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-600 font-semibold">Smoothing Window:</span>
                <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setMaWindowType('ma3')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${maWindowType === 'ma3' ? 'bg-teal-700 text-white font-bold' : 'text-slate-700'}`}
                  >
                    3-Year Triennial
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaWindowType('ma5')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${maWindowType === 'ma5' ? 'bg-teal-700 text-white font-bold' : 'text-slate-700'}`}
                  >
                    5-Year Centered
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaWindowType('ma10')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${maWindowType === 'ma10' ? 'bg-teal-700 text-white font-bold' : 'text-slate-700'}`}
                  >
                    10-Year Decadal
                  </button>
                </div>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={decompData} margin={{ top: 15, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{ value: `${activeSeries.name} (${activeSeries.unit})`, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#0f766e' }}
                  />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.375rem', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }} />

                  {/* Raw Series as lighter bars or line */}
                  <Bar
                    dataKey="observed"
                    name={`Raw ${activeSeries.name}`}
                    fill="#cbd5e1"
                    opacity={0.6}
                  />

                  {/* 3-Year MA */}
                  {maWindowType === 'ma3' && (
                    <Line
                      type="monotone"
                      dataKey="ma3"
                      name="3-Year Triennial Running Mean"
                      stroke="#0d9488"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  )}

                  {/* 5-Year MA */}
                  {maWindowType === 'ma5' && (
                    <Line
                      type="monotone"
                      dataKey="ma5"
                      name="5-Year Centered Running Mean"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  )}

                  {/* 10-Year MA */}
                  {maWindowType === 'ma10' && (
                    <Line
                      type="monotone"
                      dataKey="ma10"
                      name="10-Year Decadal Moving Average"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={false}
                    />
                  )}

                  <Line
                    type="monotone"
                    dataKey="sensTrend"
                    name="Underlying Theil-Sen Trend"
                    stroke="#f43f5e"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block font-serif">Methodological Note on Time Series Filtering:</span>
              <p className="leading-relaxed">
                Annual monsoon precipitation exhibits high high-frequency variance driven by ENSO, IOD, and ISO pulses. The 5-year and 10-year smoothed trajectories illustrate multi-decadal wetter epochs (e.g., late 1980s, 2010s to early 2020s) and drier drought clusters (e.g., 2002–2009, 2014–2015), validating that climate risk is modulated across low-frequency Pacific regimes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: AUTOCORRELATION (ACF) & PARTIAL AUTOCORRELATION (PACF)
         ========================================================================= */}
      {activeTab === 'ACF_PACF' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ACF Chart */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900 font-serif">
                  Sample Autocorrelation Function (ACF)
                </h4>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  Bartlett 95%: ±{acfPacfResult.bartlettThreshold.toFixed(3)}
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={acfPacfResult.lags} margin={{ top: 15, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="lag" tick={{ fontSize: 11, fill: '#475569' }} label={{ value: 'Lag (k years)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[-1, 1]} tick={{ fontSize: 11, fill: '#475569' }} label={{ value: 'Autocorrelation r_k', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#0f766e' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.375rem', fontSize: '12px' }} />

                    {/* Bartlett 95% Confidence Bounds */}
                    <ReferenceLine y={acfPacfResult.bartlettThreshold} stroke="#0284c7" strokeDasharray="3 3" label={{ value: '+95% Bartlett', fill: '#0284c7', fontSize: 9 }} />
                    <ReferenceLine y={-acfPacfResult.bartlettThreshold} stroke="#0284c7" strokeDasharray="3 3" label={{ value: '-95% Bartlett', fill: '#0284c7', fontSize: 9 }} />
                    <ReferenceLine y={0} stroke="#94a3b8" />

                    <Bar dataKey="acf" name="Autocorrelation r_k" fill="#0d9488" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>What ACF Indicates:</strong> {acfPacfResult.acfExplanation}
              </p>
            </div>

            {/* PACF Chart */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900 font-serif">
                  Partial Autocorrelation Function (PACF)
                </h4>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  Durbin-Levinson Recursion
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={acfPacfResult.lags} margin={{ top: 15, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="lag" tick={{ fontSize: 11, fill: '#475569' }} label={{ value: 'Lag (k years)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[-1, 1]} tick={{ fontSize: 11, fill: '#475569' }} label={{ value: 'Partial Autocorrelation φ_kk', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#0f766e' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.375rem', fontSize: '12px' }} />

                    <ReferenceLine y={acfPacfResult.bartlettThreshold} stroke="#0284c7" strokeDasharray="3 3" label={{ value: '+95% Bartlett', fill: '#0284c7', fontSize: 9 }} />
                    <ReferenceLine y={-acfPacfResult.bartlettThreshold} stroke="#0284c7" strokeDasharray="3 3" label={{ value: '-95% Bartlett', fill: '#0284c7', fontSize: 9 }} />
                    <ReferenceLine y={0} stroke="#94a3b8" />

                    <Bar dataKey="pacf" name="Partial Autocorrelation φ_kk" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>What PACF Indicates:</strong> {acfPacfResult.pacfExplanation}
              </p>
            </div>
          </div>

          {/* Ljung-Box Portmanteau White Noise Test */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-bold text-slate-900 font-serif">
                Ljung-Box (Q) Portmanteau Serial Independence Test
              </h4>
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
                acfPacfResult.ljungBoxQ10.isWhiteNoise ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
              }`}>
                {acfPacfResult.ljungBoxQ10.isWhiteNoise ? 'White Noise (Independent Innovations)' : 'Serial Autocorrelation Detected'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">Q Statistic (m={acfPacfResult.maxLag})</span>
                <strong className="text-sm text-slate-900">{acfPacfResult.ljungBoxQ10.qStat}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">Asymptotic p-value</span>
                <strong className="text-sm text-slate-900">{acfPacfResult.ljungBoxQ10.pValue}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">Statistical Decision</span>
                <strong className="text-sm text-slate-900">
                  {acfPacfResult.ljungBoxQ10.isWhiteNoise ? 'Fail to Reject H0' : 'Reject H0'}
                </strong>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Statistical Synthesis:</strong> {acfPacfResult.diagnosticsSummary}
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: STATIONARITY TESTING (AUGMENTED DICKEY-FULLER / ADF)
         ========================================================================= */}
      {activeTab === 'STATIONARITY_ADF' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                    Econometric Unit Root Test
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Augmented Dickey-Fuller (ADF)</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 font-serif mt-1">
                  Stationarity & Unit Root Hypothesis Test: {activeSeries.name}
                </h3>
              </div>

              <span className={`text-xs font-mono font-bold px-3 py-1 rounded border ${
                adfActive.isStationary 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}>
                {adfActive.isStationary ? 'Stationary Series I(0)' : 'Non-Stationary Series I(1)'}
              </span>
            </div>

            {/* ADF Statistical Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">ADF Test Stat (τ)</span>
                <strong className={`text-lg ${adfActive.isStationary ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {adfActive.adfStatistic}
                </strong>
                <span className="text-[10px] text-slate-400 block">t-ratio on γ</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">MacKinnon 1% Crit</span>
                <strong className="text-lg text-slate-700">{adfActive.criticalValues.pct1}</strong>
                <span className="text-[10px] text-slate-400 block">Strong rejection</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">MacKinnon 5% Crit</span>
                <strong className="text-lg text-slate-900">{adfActive.criticalValues.pct5}</strong>
                <span className="text-[10px] text-slate-400 block">Standard α = 0.05</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Estimated p-value</span>
                <strong className="text-lg text-teal-800">≈ {adfActive.pValueEstimated}</strong>
                <span className="text-[10px] text-slate-400 block">Dickey-Fuller dist</span>
              </div>
            </div>

            {/* Regression Specification Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 space-y-2">
              <span className="font-bold text-slate-900 font-serif block">
                Estimated ADF Regression Model Specification:
              </span>
              <p className="font-mono bg-white p-2.5 rounded border border-slate-200 text-slate-800 text-[11px]">
                Δy_t = α {selectedVar === 'temperature' ? '+ β·t ' : ''}+ ({adfActive.gammaCoefficient})·y_{'{t-1}'} + δ_1·Δy_{'{t-1}'} + ε_t
              </p>
              <p className="leading-relaxed">
                <strong>Hypothesis Decision:</strong> <em>Null Hypothesis H0:</em> γ = 0 (Series contains a stochastic unit root and is non-stationary). <em>Alternative H1:</em> γ &lt; 0 (Series is mean-reverting and stationary).
              </p>
              <p className="leading-relaxed">
                <strong>Statistical Report:</strong> {adfActive.interpretation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: ROLLING 15-YEAR & 20-YEAR ENSO-RAINFALL TELECONNECTION DYNAMICS
         ========================================================================= */}
      {activeTab === 'ROLLING_ENSO_CORRELATION' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  Multi-Decadal Rolling Window Teleconnection: Oceanic Niño Index (ONI) vs Telangana Rainfall
                </h3>
                <p className="text-xs text-slate-500">
                  Assessing temporal stability, secular shifts, and non-stationarity in the Pacific SST-Monsoon coupling.
                </p>
              </div>

              {/* Rolling Window Toggle: 15-year vs 20-year */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-600 font-semibold">Window Size:</span>
                <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setRollingWindowSize(15)}
                    className={`px-3 py-1 rounded cursor-pointer ${rollingWindowSize === 15 ? 'bg-teal-700 text-white font-bold' : 'text-slate-700'}`}
                  >
                    15-Year Rolling
                  </button>
                  <button
                    type="button"
                    onClick={() => setRollingWindowSize(20)}
                    className={`px-3 py-1 rounded cursor-pointer ${rollingWindowSize === 20 ? 'bg-teal-700 text-white font-bold' : 'text-slate-700'}`}
                  >
                    20-Year Rolling
                  </button>
                </div>
              </div>
            </div>

            {/* Rolling Correlation Time Series Chart */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={rollingCorrelationResult.points} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="endYear"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    label={{ value: `End of Rolling Window (${rollingWindowSize}-Year Horizon)`, position: 'insideBottom', offset: -10, fontSize: 11, fill: '#475569' }}
                  />
                  <YAxis
                    domain={[-1, 0.5]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{ value: 'Pearson Correlation (r)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#0f766e' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.375rem', fontSize: '12px' }}
                    formatter={(value: any) => [`${typeof value === 'number' ? value.toFixed(3) : value}`, '']}
                  />
                  <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }} />

                  {/* Significance threshold lines */}
                  <ReferenceLine
                    y={-rollingCorrelationResult.rCritical95}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{ value: `Critical α=0.05 (-${rollingCorrelationResult.rCritical95})`, fill: '#f43f5e', fontSize: 10 }}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" />

                  {/* Confidence Interval Area */}
                  <Area
                    type="monotone"
                    dataKey="ci95Low"
                    name="95% CI Lower Bound"
                    stroke="none"
                    fill="#0d9488"
                    fillOpacity={0.15}
                  />

                  {/* Pearson r Trajectory */}
                  <Line
                    type="monotone"
                    dataKey="pearsonR"
                    name={`${rollingWindowSize}-Year Rolling Pearson r (ONI vs JJAS Rainfall)`}
                    stroke="#0f766e"
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#0f766e' }}
                  />

                  {/* Spearman rho Trajectory */}
                  <Line
                    type="monotone"
                    dataKey="spearmanRho"
                    name="Spearman Rank ρ"
                    stroke="#6366f1"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Rolling Teleconnection Metrics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">Mean Rolling r</span>
                <strong className="text-sm text-slate-900">{rollingCorrelationResult.overallMeanR}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">Strongest Teleconnection</span>
                <strong className="text-sm text-teal-800">{rollingCorrelationResult.minR}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">Weakest Window</span>
                <strong className="text-sm text-slate-700">{rollingCorrelationResult.maxR}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">Two-Tailed r_crit</span>
                <strong className="text-sm text-rose-700">±{rollingCorrelationResult.rCritical95}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
              <strong>Teleconnection Non-Stationarity Insight:</strong> {rollingCorrelationResult.interpretation} The rolling 15-year and 20-year curves reveal that while the negative Pacific-Telangana teleconnection is sustained overall, its empirical magnitude deepens significantly during strong multi-decadal ENSO regimes (such as the 1980s and 2000s).
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: STATISTICAL INFERENCE OBJECTIVE VS ARIMA JUSTIFICATION
         ========================================================================= */}
      {activeTab === 'ARIMA_INFERENCE_FRAMEWORK' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-teal-700" />
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Methodological Synthesis: Statistical Inference vs. Pure Forecasting (ARIMA/SARIMA)
                </h3>
                <p className="text-xs text-slate-500">
                  Why Box-Jenkins ARIMA is treated with scientific caution in climate teleconnection research.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-teal-50/50 border border-teal-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-teal-950 font-serif text-sm">
                  <CheckCircle2 className="w-4 h-4 text-teal-700" />
                  <span>Primary Research Objective: Statistical Inference</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  In this statistical research study, the central objective is to <strong>quantify and test the causal teleconnection mechanisms</strong> between equatorial Pacific SST anomalies (ENSO phases) and Telangana's agro-climatic responses.
                </p>
                <ul className="list-disc list-inside text-slate-700 space-y-1 pl-1">
                  <li><strong>Non-parametric Mann-Kendall & Sen's Slope:</strong> Provide distribution-free tests for long-term climatic trends without assuming Gaussian linearity.</li>
                  <li><strong>OLS and Multi-Group ANOVA:</strong> Isolate explained variance ($R^2$, $\eta^2$) and evaluate phase-conditioned mean shifts.</li>
                  <li><strong>Rolling Bivariate Windows:</strong> Detect multi-decadal teleconnection breakdowns and regime non-stationarity.</li>
                </ul>
              </div>

              <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-950 font-serif text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>When ARIMA/SARIMA Is and Is NOT Justified</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  <strong>The Danger of Blind ARIMA Application:</strong> Pure univariate Box-Jenkins ARIMA($p, d, q$) models express $y_t$ purely as a linear combination of its own past lags and random shocks, treating the underlying oceanic physics (ENSO) as unobserved white noise.
                </p>
                <ul className="list-disc list-inside text-slate-700 space-y-1 pl-1">
                  <li><strong>Low Serial Autocorrelation:</strong> As confirmed by our ACF/PACF analysis and Ljung-Box test (p &gt; 0.05), annual monsoon rainfall behaves largely as white noise regarding its own annual lags (r_1 ≈ 0).</li>
                  <li><strong>Exogenous Drivers:</strong> Rainfall is driven exogenously by Pacific SST anomalies (ONI), not by last year's local rainfall. ARIMAX (ARIMA with exogenous regressor) is therefore physically superior to univariate ARIMA.</li>
                </ul>
              </div>
            </div>

            {/* Diagnostic Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-2.5">Methodological Framework</th>
                    <th className="p-2.5">Primary Purpose</th>
                    <th className="p-2.5">Stochastic Assumptions</th>
                    <th className="p-2.5">Scientific Suitability for ENSO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">Mann-Kendall + Theil-Sen</td>
                    <td className="p-2.5 text-slate-700">Monotonic trend detection & robust slope estimation</td>
                    <td className="p-2.5 text-slate-600">Distribution-free; robust to outliers and non-normality</td>
                    <td className="p-2.5 text-teal-800 font-bold">Highly Suitable (Climatological Standard)</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">ACF / PACF + ADF Test</td>
                    <td className="p-2.5 text-slate-700">Serial memory identification & unit root stationarity</td>
                    <td className="p-2.5 text-slate-600">Weak stationarity covariance invariance</td>
                    <td className="p-2.5 text-teal-800 font-bold">Mandatory Diagnostic Step</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">Rolling Window Bivariate (15/20-yr)</td>
                    <td className="p-2.5 text-slate-700">Multi-decadal teleconnection stability & regime shifts</td>
                    <td className="p-2.5 text-slate-600">Locally stationary sub-intervals</td>
                    <td className="p-2.5 text-teal-800 font-bold">Essential for Pacific-Monsoon coupling</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">Univariate ARIMA(p,d,q)</td>
                    <td className="p-2.5 text-slate-700">Pure univariate extrapolation forecasting</td>
                    <td className="p-2.5 text-slate-600">Linear Gaussian autoregression without external physics</td>
                    <td className="p-2.5 text-amber-700 font-bold">Limited (Ignores Oceanic Forcing)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Provenance Badge */}
      <SourceBadge
        source="IMD Pune (0.25° Gridded Rainfall & 0.5° Temperature) & NOAA CPC (ERSSTv5 Oceanic Niño Index)"
        period={`${filters.startYear} – ${filters.endYear}`}
        units="mm, °C, % Departure"
        observationCount={filteredMerged.length}
      />
    </div>
  );
};
