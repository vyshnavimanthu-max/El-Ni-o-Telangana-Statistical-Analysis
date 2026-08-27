import React, { useState } from 'react';
import { Sprout, Wheat, Droplet, Trees, Tractor, ArrowUpRight, TrendingDown, Layers } from 'lucide-react';
import { ResearchDatasetState } from '../types/dataset';
import { ResearchFilters } from '../types/filters';
import { FilterPanel } from '../components/FilterPanel';
import { MetricCard } from '../components/MetricCard';
import { EnsoVsYieldChart } from '../charts/EnsoVsYieldChart';
import { TELANGANA_CROPS } from '../data/crops';
import { calculateMean } from '../statistics/engine';

interface AgriculturePageProps {
  datasetState: ResearchDatasetState;
  filters: ResearchFilters;
  onFilterChange: (updated: Partial<ResearchFilters>) => void;
  onResetFilters: () => void;
  onOpenDatasetModal: () => void;
}

export const AgriculturePage: React.FC<AgriculturePageProps> = ({
  datasetState,
  filters,
  onFilterChange,
  onResetFilters,
  onOpenDatasetModal
}) => {
  const selectedCropTab = filters.selectedCropId || 'paddy_rice';
  const setSelectedCropTab = (cropId: string) => {
    onFilterChange({ selectedCropId: cropId });
  };
  const isLoaded = datasetState.isOfficialDataLoaded;

  const filteredMerged = datasetState.mergedRecords.filter(
    m => m.year >= filters.startYear && m.year <= filters.endYear && (filters.ensoPhase === 'ALL' || m.ensoPhase === filters.ensoPhase)
  );

  const matchingYearsSet = new Set(filteredMerged.map(r => r.year));

  const filteredAgri = datasetState.agricultureObservations.filter(
    a => matchingYearsSet.has(a.year)
  );

  const meanPaddy = calculateMean(filteredMerged.map(m => m.paddyYieldKgHa));
  const meanCotton = calculateMean(filteredMerged.map(m => m.cottonYieldKgHa));
  const meanMaize = calculateMean(filteredMerged.map(m => m.maizeYieldKgHa));
  const meanRedGram = calculateMean(filteredMerged.map(m => m.redGramYieldKgHa));
  const meanSoyabean = calculateMean(filteredMerged.map(m => m.soyabeanYieldKgHa));

  const activeCropMeta = TELANGANA_CROPS.find(c => c.id === selectedCropTab) || TELANGANA_CROPS[0];

  // Calculate ENSO Phase yield impact across all crops
  const elNinoRecords = filteredMerged.filter(m => m.ensoPhase === 'EL_NINO');
  const neutralRecords = filteredMerged.filter(m => m.ensoPhase === 'NEUTRAL');
  const laNinaRecords = filteredMerged.filter(m => m.ensoPhase === 'LA_NINA');

  const cropSensitivityRows = [
    {
      name: 'Paddy (Rice)',
      irrigation: '85% (High)',
      soil: 'Clay loam / Alluvial',
      elNinoYield: calculateMean(elNinoRecords.map(r => r.paddyYieldKgHa)),
      neutralYield: calculateMean(neutralRecords.map(r => r.paddyYieldKgHa)),
      laNinaYield: calculateMean(laNinaRecords.map(r => r.paddyYieldKgHa)),
      vulnerability: 'Low-Moderate (Protected by Canal/Well Irrigation)'
    },
    {
      name: 'Cotton (Lint)',
      irrigation: '22% (Predominantly Rainfed)',
      soil: 'Deep Black Cotton Soils',
      elNinoYield: calculateMean(elNinoRecords.map(r => r.cottonYieldKgHa)),
      neutralYield: calculateMean(neutralRecords.map(r => r.cottonYieldKgHa)),
      laNinaYield: calculateMean(laNinaRecords.map(r => r.cottonYieldKgHa)),
      vulnerability: 'Severe (Boll shedding & vegetative arrest)'
    },
    {
      name: 'Maize (Corn)',
      irrigation: '45% (Semi-Rainfed)',
      soil: 'Red Chalkas & Medium Black',
      elNinoYield: calculateMean(elNinoRecords.map(r => r.maizeYieldKgHa)),
      neutralYield: calculateMean(neutralRecords.map(r => r.maizeYieldKgHa)),
      laNinaYield: calculateMean(laNinaRecords.map(r => r.maizeYieldKgHa)),
      vulnerability: 'High (Silking & tasseling moisture stress)'
    },
    {
      name: 'Red Gram (Tur)',
      irrigation: '15% (Deep-Rooted Rainfed)',
      soil: 'Red sandy loam & gravelly',
      elNinoYield: calculateMean(elNinoRecords.map(r => r.redGramYieldKgHa)),
      neutralYield: calculateMean(neutralRecords.map(r => r.redGramYieldKgHa)),
      laNinaYield: calculateMean(laNinaRecords.map(r => r.redGramYieldKgHa)),
      vulnerability: 'Moderate (Deep root buffer, susceptible to terminal drought)'
    },
    {
      name: 'Soyabean',
      irrigation: '18% (Rainfed Kharif)',
      soil: 'Northern Black Soils (Adilabad/Nizamabad)',
      elNinoYield: calculateMean(elNinoRecords.map(r => r.soyabeanYieldKgHa)),
      neutralYield: calculateMean(neutralRecords.map(r => r.soyabeanYieldKgHa)),
      laNinaYield: calculateMean(laNinaRecords.map(r => r.soyabeanYieldKgHa)),
      vulnerability: 'Severe (Pod filling sensitive to August dry spells)'
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                Module 5: Agronomic Productivity
              </span>
              <span className="text-xs text-slate-400 font-mono">DES Telangana Season & Crop Reports (1980–2026)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-serif">
              Agricultural Yields & Multi-Crop Climate Vulnerability
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Comparative Kharif Yield Sensitivity (kg/ha) Across 5 Key Crops (Paddy, Cotton, Maize, Red Gram, Soyabean) Under ENSO Regimes
            </p>
          </div>
        </div>
      </section>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFilterChange={onFilterChange}
        onReset={onResetFilters}
        availableYears={[1980, 2026]}
        showCropFilter={true}
        showDistrictFilter={true}
      />

      {/* Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard
          id="agri-paddy-mean"
          title="Paddy (Rice)"
          icon={Sprout}
          value={meanPaddy !== null ? `${Math.round(meanPaddy)}` : null}
          unit="kg / ha"
          subtitle="Irrigated & Semi-Irrigated"
          statusBadge="Major Staple"
          sourceAuthority="DES, Govt. of Telangana"
          secondaryInfo="Semi-Dwarf HYV"
          isAwaitingData={!isLoaded}
        />

        <MetricCard
          id="agri-cotton-mean"
          title="Cotton (Lint)"
          icon={Wheat}
          value={meanCotton !== null ? `${Math.round(meanCotton)}` : null}
          unit="kg / ha"
          subtitle="Rainfed Tracts (>75%)"
          statusBadge="High Sensitivity"
          sourceAuthority="DES Telangana"
          secondaryInfo="Cash Crop Commercial"
          isAwaitingData={!isLoaded}
        />

        <MetricCard
          id="agri-maize-mean"
          title="Maize (Corn)"
          icon={Tractor}
          value={meanMaize !== null ? `${Math.round(meanMaize)}` : null}
          unit="kg / ha"
          subtitle="Grain & Industrial Feed"
          statusBadge="Moderate Risk"
          sourceAuthority="DES Telangana"
          secondaryInfo="Hybrid Cultivars"
          isAwaitingData={!isLoaded}
        />

        <MetricCard
          id="agri-redgram-mean"
          title="Red Gram (Tur)"
          icon={Trees}
          value={meanRedGram !== null ? `${Math.round(meanRedGram)}` : null}
          unit="kg / ha"
          subtitle="Deep-Rooted Legume"
          statusBadge="Drought Buffer"
          sourceAuthority="DES Telangana"
          secondaryInfo="Pulse Intercrop"
          isAwaitingData={!isLoaded}
        />

        <MetricCard
          id="agri-soyabean-mean"
          title="Soyabean"
          icon={Droplet}
          value={meanSoyabean !== null ? `${Math.round(meanSoyabean)}` : null}
          unit="kg / ha"
          subtitle="Northern Black Soil"
          statusBadge="Moisture Critical"
          sourceAuthority="DES Telangana"
          secondaryInfo="Oilseed Commercial"
          isAwaitingData={!isLoaded}
        />
      </section>

      {/* Main Yield vs Phase Chart */}
      <EnsoVsYieldChart
        data={filteredMerged}
        onConnectClick={onOpenDatasetModal}
      />

      {/* Multi-Crop Comparative Sensitivity Matrix Table */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-serif">
              Multi-Crop Agronomic Comparative Sensitivity Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Yield response (kg/ha) across 5 Kharif crops during El Niño (Drought Deficit) vs Neutral vs La Niña (Excess) years (1980–2026)
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
            N={filteredMerged.length} Years
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Crop Name</th>
                <th className="p-2.5">Irrigation Access</th>
                <th className="p-2.5 text-right font-mono text-rose-700">El Niño Mean (kg/ha)</th>
                <th className="p-2.5 text-right font-mono text-slate-700">Neutral Mean (kg/ha)</th>
                <th className="p-2.5 text-right font-mono text-sky-700">La Niña Mean (kg/ha)</th>
                <th className="p-2.5 text-right font-mono">El Niño Deficit (%)</th>
                <th className="p-2.5">Agronomic Risk Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {cropSensitivityRows.map((row, idx) => {
                const deficitPct = (row.elNinoYield !== null && row.neutralYield !== null && row.neutralYield > 0)
                  ? (((row.elNinoYield - row.neutralYield) / row.neutralYield) * 100).toFixed(1)
                  : null;

                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">{row.name}</td>
                    <td className="p-2.5 text-slate-600 font-mono text-[11px]">{row.irrigation}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                      {row.elNinoYield !== null ? Math.round(row.elNinoYield) : '—'}
                    </td>
                    <td className="p-2.5 text-right font-mono text-slate-700">
                      {row.neutralYield !== null ? Math.round(row.neutralYield) : '—'}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-sky-600">
                      {row.laNinaYield !== null ? Math.round(row.laNinaYield) : '—'}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold">
                      {deficitPct !== null ? (
                        <span className={Number(deficitPct) < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {Number(deficitPct) > 0 ? '+' : ''}{deficitPct}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-2.5 text-slate-600 text-[11px]">{row.vulnerability}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Crop Dossier & Vulnerability Matrix */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-serif">
              Telangana Key Crop Vulnerability Profiles
            </h3>
            <p className="text-xs text-slate-500">
              Agronomic characteristics, water requirement (mm), and sensitivity to El Niño dry spells
            </p>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {TELANGANA_CROPS.map((crop) => (
              <button
                key={crop.id}
                type="button"
                onClick={() => setSelectedCropTab(crop.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCropTab === crop.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {crop.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Crop Inspector Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-200 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">{activeCropMeta.name}</h4>
                <span className="text-xs text-slate-500 font-serif italic">({activeCropMeta.scientificName})</span>
              </div>
              <span className="text-xs text-slate-500 font-telugu block mt-0.5">తెలుగు: {activeCropMeta.teluguName}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                activeCropMeta.ensoSensitivityLevel === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                activeCropMeta.ensoSensitivityLevel === 'MODERATE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {activeCropMeta.ensoSensitivityLevel} ENSO Vulnerability
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-sans">Typical Yield Range</span>
              <strong className="text-slate-900">{activeCropMeta.typicalYieldRangeKgHa[0]}–{activeCropMeta.typicalYieldRangeKgHa[1]} kg/ha</strong>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-sans">Water Requirement</span>
              <strong className="text-teal-800">{activeCropMeta.waterRequirementMm} mm</strong>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-sans">Irrigation Coverage</span>
              <span className="text-slate-800 font-semibold">{activeCropMeta.irrigationPercentage}%</span>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-sans">Season</span>
              <span className="text-slate-800 uppercase">{activeCropMeta.season}</span>
            </div>
          </div>

          <div className="text-xs text-slate-700 space-y-1 pt-1">
            <p><strong>Primary Growing Districts:</strong> {activeCropMeta.majorDistricts.join(', ')}</p>
            <p className="text-slate-600 leading-relaxed">
              <strong>Agro-Climatic Vulnerability:</strong> {activeCropMeta.vulnerabilityNotes}
            </p>
          </div>
        </div>

        {/* Irrigation Buffer Factor Note */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded text-xs text-blue-900 leading-relaxed">
          <strong>The Irrigation Decoupling Confounder:</strong> Post-2015, Telangana experienced massive expansion in surface canal irrigation (Kaleshwaram Lift Irrigation Scheme, Mid Manair, Sriramsagar Project) and rejuvenation of minor irrigation water bodies under <em>Mission Kakatiya</em>. As a result, <strong>Paddy yield has become progressively decoupled from instantaneous monsoon rainfall</strong>, whereas rainfed crops like <strong>Cotton, Maize, and Red Gram</strong> remain directly coupled to ENSO-induced precipitation deficits.
        </div>
      </div>
    </div>
  );
};
