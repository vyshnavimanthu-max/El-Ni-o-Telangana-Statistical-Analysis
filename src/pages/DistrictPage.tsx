import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Search, 
  Layers, 
  HelpCircle, 
  CloudRain, 
  Thermometer, 
  Sprout, 
  Zap, 
  Download, 
  ArrowUpDown, 
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { ResearchDatasetState } from '../types/dataset';
import { ResearchFilters } from '../types/filters';
import { TelanganaStatisticalChoroplethMap } from '../maps/TelanganaStatisticalChoroplethMap';
import { TELANGANA_DISTRICTS, AGRO_CLIMATIC_ZONES, DistrictInfo } from '../data/districts';
import { 
  DistrictAnalysisVariable, 
  DistrictCropType,
  getDistrictYearRecord,
  getDistrictTimeSeries,
  calculateDistrictStats
} from '../data/districtTimeSeriesData';
import { SourceBadge } from '../components/SourceBadge';

interface DistrictPageProps {
  datasetState: ResearchDatasetState;
  filters: ResearchFilters;
  onFilterChange: (updated: Partial<ResearchFilters>) => void;
  onResetFilters: () => void;
  onOpenDatasetModal: () => void;
}

export const DistrictPage: React.FC<DistrictPageProps> = ({
  datasetState,
  filters,
  onFilterChange,
  onResetFilters,
  onOpenDatasetModal
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [selectedVariable, setSelectedVariable] = useState<DistrictAnalysisVariable>('rainfall_anomaly');
  const [selectedCrop, setSelectedCrop] = useState<DistrictCropType>('paddy');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'name' | 'observed' | 'anomaly' | 'normal' | 'mean'>('anomaly');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sample year record for ENSO context
  const sampleYearRecord = useMemo(() => {
    return getDistrictYearRecord('adilabad', selectedYear);
  }, [selectedYear]);

  // Selected district info
  const selectedDistrictId = filters.selectedDistrictId;
  const activeDistrictInfo = useMemo(() => {
    return TELANGANA_DISTRICTS.find(d => d.id === selectedDistrictId) || null;
  }, [selectedDistrictId]);

  // Selected district stats
  const districtStats = useMemo(() => {
    if (!selectedDistrictId) return null;
    return calculateDistrictStats(selectedDistrictId, selectedVariable, selectedYear, selectedCrop);
  }, [selectedDistrictId, selectedVariable, selectedYear, selectedCrop]);

  // Selected district multi-year time-series for sparkline
  const districtSeries = useMemo(() => {
    if (!selectedDistrictId) return [];
    return getDistrictTimeSeries(selectedDistrictId, 1980, 2024);
  }, [selectedDistrictId]);

  // Table rows for all 33 districts
  const tableRows = useMemo(() => {
    return TELANGANA_DISTRICTS.map(d => {
      const stats = calculateDistrictStats(d.id, selectedVariable, selectedYear, selectedCrop);
      const rec = getDistrictYearRecord(d.id, selectedYear);
      return {
        id: d.id,
        name: d.name,
        teluguName: d.teluguName,
        headquarters: d.headquarters,
        zone: d.zone,
        zoneName: d.zoneName,
        normalLpa: d.normalSwmRainfallMm,
        stats,
        record: rec
      };
    });
  }, [selectedVariable, selectedYear, selectedCrop]);

  // Filtered & Sorted table rows
  const filteredAndSortedRows = useMemo(() => {
    return tableRows
      .filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              r.teluguName.includes(searchTerm) ||
                              r.headquarters.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesZone = selectedZoneFilter === 'ALL' || r.zone === selectedZoneFilter;
        return matchesSearch && matchesZone;
      })
      .sort((a, b) => {
        let valA: number | string = 0;
        let valB: number | string = 0;

        if (sortField === 'name') {
          return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }

        if (sortField === 'normal') {
          valA = a.normalLpa;
          valB = b.normalLpa;
        } else if (sortField === 'observed') {
          valA = a.stats.currentValue ?? -9999;
          valB = b.stats.currentValue ?? -9999;
        } else if (sortField === 'anomaly') {
          valA = a.stats.currentAnomaly ?? a.stats.currentValue ?? -9999;
          valB = b.stats.currentAnomaly ?? b.stats.currentValue ?? -9999;
        } else if (sortField === 'mean') {
          valA = a.stats.mean ?? -9999;
          valB = b.stats.mean ?? -9999;
        }

        return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [tableRows, searchTerm, selectedZoneFilter, sortField, sortOrder]);

  const handleSort = (field: 'name' | 'observed' | 'anomaly' | 'normal' | 'mean') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'District ID',
      'District Name',
      'Telugu Name',
      'Agro-Climatic Zone',
      'Headquarters',
      'Year',
      'Variable',
      'Observed Value',
      'Anomaly',
      'Unit',
      'Historical Mean',
      'Historical Median',
      'Historical SD',
      'ENSO Phase',
      'ONI JJAS (°C)',
      'Data Availability'
    ];

    const rows = filteredAndSortedRows.map(r => [
      `"${r.id}"`,
      `"${r.name}"`,
      `"${r.teluguName}"`,
      `"${r.zoneName}"`,
      `"${r.headquarters}"`,
      selectedYear,
      `"${selectedVariable}"`,
      r.stats.currentValue ?? 'Unavailable',
      r.stats.currentAnomaly ?? 'Unavailable',
      `"${r.stats.unit}"`,
      r.stats.mean ?? 'Unavailable',
      r.stats.median ?? 'Unavailable',
      r.stats.sd ?? 'Unavailable',
      `"${r.stats.ensoPhase}"`,
      r.stats.oniJjas,
      r.stats.isAvailable ? 'Official Data' : 'Official district-level data unavailable'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `telangana_district_${selectedVariable}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. MODULE TITLE & GEOGRAPHIC SCOPE BANNER */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                Module 6: Spatial Heterogeneity
              </span>
              <span className="text-xs text-slate-500 font-mono">Geographic Scope: State of Telangana Exclusively</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-serif">
              District-Level Climatology & Agricultural Spatial Analysis
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Official 33-district administrative boundaries, IMD 0.25° gridded rainfall anomalies, 0.5° thermal anomalies, DES crop yields, and TSDPS extreme rainfall metrics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
              33 Districts / 4 Agro-Zones
            </span>
          </div>
        </div>
      </section>

      {/* 2. ADMINISTRATIVE BOUNDARY REORGANIZATION NOTICE */}
      <section className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 text-xs text-amber-950 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Important Notice on Historical Administrative District Boundaries</span>
        </div>
        <p className="text-slate-700 leading-relaxed">
          <strong>Boundary Evolution:</strong> Telangana was formed on 2 June 2014 with 10 legacy districts. On 11 October 2016, the Government of Telangana reorganized the state into 31 administrative districts, later adjusted to 33 districts in February 2019 (creation of Mulugu and Narayanpet).
        </p>
        <p className="text-slate-700 leading-relaxed">
          <strong>Methodological Principle:</strong> Continuous spatial meteorological data (IMD 0.25° rainfall and 0.5° temperature) are computed consistently across all years (1980–2024) by extracting area-weighted zonal statistics for the official 33 district polygons. For non-spatial point surveys (AWS extreme rainfall station counts and DES crop reports), pre-reorganization records for newly created units are marked as <em>"Official district-level data unavailable for this variable."</em> Rather than synthesizing arbitrary estimates or merging legacy districts without defensible methodology, unavailable entries are explicitly designated.
        </p>
      </section>

      {/* 3. INTERACTIVE STATISTICAL CHOROPLETH MAP */}
      <TelanganaStatisticalChoroplethMap
        selectedDistrictId={filters.selectedDistrictId}
        onSelectDistrict={(id) => {
          onFilterChange({
            geographyLevel: id ? 'district' : 'state',
            selectedDistrictId: id
          });
        }}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedVariable={selectedVariable}
        onVariableChange={setSelectedVariable}
        selectedCrop={selectedCrop}
        onCropChange={setSelectedCrop}
      />

      {/* 4. SELECTED DISTRICT COMPREHENSIVE STATISTICAL PROFILE */}
      {activeDistrictInfo && districtStats && (
        <section className="bg-white border-2 border-teal-600 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-700" />
                <h3 className="text-lg font-bold text-slate-900 font-serif">
                  {activeDistrictInfo.name} ({activeDistrictInfo.teluguName})
                </h3>
                <span className="text-xs font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                  {activeDistrictInfo.zoneName}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                HQ: {activeDistrictInfo.headquarters} | Area: {activeDistrictInfo.areaSqKm} km² | SWM Normal LPA (JJAS): {activeDistrictInfo.normalSwmRainfallMm} mm | Primary Soils: {activeDistrictInfo.majorSoilType}
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-500">Selected Year:</span>
              <strong className="text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                {selectedYear}
              </strong>
            </div>
          </div>

          {/* Statistical Metrics Grid */}
          {districtStats.isAvailable && districtStats.currentValue !== null ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Observed Value */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    {selectedYear} Observed
                  </span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    {districtStats.currentValue > 0 && selectedVariable.includes('anomaly') ? '+' : ''}
                    {districtStats.currentValue}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">{districtStats.unit}</span>
                </div>

                {/* 2. Anomaly */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Departure / Anomaly
                  </span>
                  <span className={`text-base font-bold font-mono ${
                    (districtStats.currentAnomaly ?? 0) > 0 ? 'text-teal-700' : (districtStats.currentAnomaly ?? 0) < 0 ? 'text-rose-600' : 'text-slate-800'
                  }`}>
                    {districtStats.currentAnomaly !== null ? `${districtStats.currentAnomaly > 0 ? '+' : ''}${districtStats.currentAnomaly}` : 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">{districtStats.unit}</span>
                </div>

                {/* 3. Mean */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Historical Mean (1980–2024)
                  </span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    {districtStats.mean !== null ? districtStats.mean : 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">{districtStats.unit}</span>
                </div>

                {/* 4. Median */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Historical Median
                  </span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    {districtStats.median !== null ? districtStats.median : 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">{districtStats.unit}</span>
                </div>

                {/* 5. Standard Deviation */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Standard Dev (σ)
                  </span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    ±{districtStats.sd !== null ? districtStats.sd : 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">{districtStats.unit}</span>
                </div>

                {/* 6. ENSO State */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    ENSO State ({selectedYear})
                  </span>
                  <span className={`text-sm font-bold font-mono block ${
                    districtStats.ensoPhase === 'El Niño' ? 'text-rose-700' : districtStats.ensoPhase === 'La Niña' ? 'text-teal-700' : 'text-slate-800'
                  }`}>
                    {districtStats.ensoPhase}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    ONI: {districtStats.oniJjas > 0 ? '+' : ''}{districtStats.oniJjas}°C
                  </span>
                </div>
              </div>

              {/* Multi-Year Longitudinal Historical Series (1980–2024) */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 font-serif">
                    Historical Longitudinal Trend in {activeDistrictInfo.name} (1980–2024)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Selected year ({selectedYear}) highlighted in teal
                  </span>
                </div>

                {/* Sparkline Bar Series */}
                <div className="h-20 flex items-end gap-1 pt-4 border-b border-slate-300">
                  {districtSeries.map((d) => {
                    const isCurrent = d.year === selectedYear;
                    let val = 0;
                    if (selectedVariable === 'rainfall_anomaly') val = d.rainfallAnomalyPct;
                    else if (selectedVariable === 'temperature_anomaly') val = d.tempAnomalyC * 20; // scaled for bar
                    else if (selectedVariable === 'extreme_rainfall') val = (d.extremeRainfallDays ?? 0) * 4;
                    else if (selectedVariable === 'agricultural_yield') val = ((d.cropYields[selectedCrop] ?? 3000) / 4000) * 60;

                    const height = Math.min(100, Math.max(8, Math.abs(val) * 1.2));
                    const isPositive = val >= 0;

                    return (
                      <div
                        key={d.year}
                        onClick={() => setSelectedYear(d.year)}
                        title={`${d.year} (${d.ensoPhase}): ${selectedVariable === 'rainfall_anomaly' ? `${d.rainfallAnomalyPct}%` : selectedVariable === 'temperature_anomaly' ? `${d.tempAnomalyC}°C` : ''}`}
                        className={`flex-1 flex flex-col justify-end items-center cursor-pointer transition-all ${
                          isCurrent ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div
                          style={{ height: `${height}%` }}
                          className={`w-full rounded-t-xs ${
                            isCurrent
                              ? 'bg-teal-600 ring-2 ring-teal-400'
                              : isPositive
                              ? 'bg-sky-500'
                              : 'bg-rose-400'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>1980</span>
                  <span>1990</span>
                  <span>2000</span>
                  <span>2010</span>
                  <span>2020</span>
                  <span>2024</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-amber-700 mx-auto" />
              <h4 className="text-sm font-bold text-amber-900">
                Official district-level data unavailable for this variable.
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                No official statistical records were published for {activeDistrictInfo.name} for {selectedVariable.replace('_', ' ')} in {selectedYear}. Synthetic estimates are strictly forbidden.
              </p>
            </div>
          )}
        </section>
      )}

      {/* 5. ALL 33 DISTRICTS COMPARATIVE STATISTICAL TABLE */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-serif">
              33 Districts Comparative Climatological & Agricultural Matrix ({selectedYear})
            </h3>
            <p className="text-xs text-slate-500">
              Cross-sectional ranking across all 33 administrative units for {selectedVariable.replace('_', ' ')} (ENSO: {sampleYearRecord?.ensoPhase})
            </p>
          </div>

          {/* Action Bar: Search, Zone Filter, CSV Export */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search district name / HQ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-teal-600 w-44 sm:w-52"
              />
            </div>

            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded-md px-2.5 py-1 text-slate-700 font-medium"
            >
              <option value="ALL">All 4 Zones</option>
              {AGRO_CLIMATIC_ZONES.map(z => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <th className="p-2.5 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>District Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-2.5">Agro-Climatic Zone</th>
                <th className="p-2.5 font-mono text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('normal')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>LPA Normal</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-2.5 font-mono text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('observed')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>{selectedYear} Observed</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-2.5 font-mono text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('anomaly')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Anomaly / Dep.</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-2.5 font-mono text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('mean')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Hist. Mean</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-2.5 font-mono text-right">Median</th>
                <th className="p-2.5 font-mono text-right">SD (σ)</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedRows.map((r) => {
                const isSelected = selectedDistrictId === r.id;
                const isAvail = r.stats.isAvailable && r.stats.currentValue !== null;

                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-teal-50/80 font-semibold' : ''
                    }`}
                  >
                    <td className="p-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className={`w-3 h-3 ${isSelected ? 'text-teal-700' : 'text-slate-400'}`} />
                      <span>{r.name}</span>
                      <span className="text-[11px] text-slate-400 font-telugu font-normal">({r.teluguName})</span>
                    </td>
                    <td className="p-2.5 text-slate-600">{r.zoneName}</td>
                    <td className="p-2.5 font-mono text-right text-slate-700">
                      {r.normalLpa} mm
                    </td>
                    <td className="p-2.5 font-mono text-right">
                      {isAvail ? (
                        <strong className="text-slate-900">
                          {r.stats.currentValue > 0 && selectedVariable.includes('anomaly') ? '+' : ''}
                          {r.stats.currentValue} {r.stats.unit}
                        </strong>
                      ) : (
                        <span className="text-slate-400 italic">Unavailable</span>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-right">
                      {isAvail && r.stats.currentAnomaly !== null ? (
                        <span className={`font-bold ${
                          r.stats.currentAnomaly > 0 ? 'text-teal-700' : r.stats.currentAnomaly < 0 ? 'text-rose-600' : 'text-slate-700'
                        }`}>
                          {r.stats.currentAnomaly > 0 ? '+' : ''}{r.stats.currentAnomaly} {r.stats.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-right text-slate-600">
                      {r.stats.mean !== null ? r.stats.mean : 'N/A'}
                    </td>
                    <td className="p-2.5 font-mono text-right text-slate-600">
                      {r.stats.median !== null ? r.stats.median : 'N/A'}
                    </td>
                    <td className="p-2.5 font-mono text-right text-slate-500">
                      {r.stats.sd !== null ? `±${r.stats.sd}` : 'N/A'}
                    </td>
                    <td className="p-2.5 text-center">
                      {isAvail ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Official
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200" title="Official district-level data unavailable for this variable.">
                          Unavailable
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          onFilterChange({
                            geographyLevel: isSelected ? 'state' : 'district',
                            selectedDistrictId: isSelected ? undefined : r.id
                          });
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Provenance footer */}
        <SourceBadge
          source="India Meteorological Department (0.25° Rainfall & 0.5° Temperature), DES Telangana Season & Crop Reports, and TSDPS Network"
          period="1980 – 2024 / 2026 Climatology"
          units="% Departure, °C, kg/ha, Days"
          observationCount={33}
        />
      </section>
    </div>
  );
};
