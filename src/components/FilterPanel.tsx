import React from 'react';
import { Filter, Calendar, MapPin, Sprout, BarChart3, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { ResearchFilters, EnsoPhase, ClimateSeason } from '../types/filters';
import { TELANGANA_DISTRICTS } from '../data/districts';
import { TELANGANA_CROPS } from '../data/crops';

interface FilterPanelProps {
  filters: ResearchFilters;
  onFilterChange: (updated: Partial<ResearchFilters>) => void;
  onReset?: () => void;
  availableYears?: [number, number];
  isCompact?: boolean;
  className?: string;
  showCropFilter?: boolean;
  showDistrictFilter?: boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onReset,
  availableYears = [1980, 2026],
  isCompact = false,
  className = '',
  showCropFilter = true,
  showDistrictFilter = true
}) => {
  const ensoPhases: { label: string; value: EnsoPhase; description: string }[] = [
    { label: 'All Phases', value: 'ALL', description: 'Full climatological period' },
    { label: 'El Niño (Warm)', value: 'EL_NINO', description: 'ONI ≥ +0.5°C' },
    { label: 'Neutral', value: 'NEUTRAL', description: '-0.5°C < ONI < +0.5°C' },
    { label: 'La Niña (Cool)', value: 'LA_NINA', description: 'ONI ≤ -0.5°C' }
  ];

  const seasons: { label: string; value: ClimateSeason }[] = [
    { label: 'SW Monsoon (JJAS)', value: 'SWM_MONSOON' },
    { label: 'NE Monsoon (OND)', value: 'NEM_POST_MONSOON' },
    { label: 'Annual (Jan-Dec)', value: 'ANNUAL' }
  ];

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-4 shadow-xs ${className}`}>
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-700" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
            Statistical Filter Matrix
          </h3>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Defaults
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Study Period Start Year */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            Start Year
          </label>
          <select
            value={filters.startYear}
            onChange={(e) => {
              const newStart = parseInt(e.target.value, 10);
              if (newStart > filters.endYear) {
                onFilterChange({ startYear: newStart, endYear: newStart });
              } else {
                onFilterChange({ startYear: newStart });
              }
            }}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono cursor-pointer"
          >
            {Array.from({ length: availableYears[1] - availableYears[0] + 1 }, (_, i) => availableYears[0] + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Study Period End Year */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            End Year
          </label>
          <select
            value={filters.endYear}
            onChange={(e) => {
              const newEnd = parseInt(e.target.value, 10);
              if (newEnd < filters.startYear) {
                onFilterChange({ startYear: newEnd, endYear: newEnd });
              } else {
                onFilterChange({ endYear: newEnd });
              }
            }}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono cursor-pointer"
          >
            {Array.from({ length: availableYears[1] - availableYears[0] + 1 }, (_, i) => availableYears[0] + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* ENSO State Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            ENSO State
          </label>
          <select
            value={filters.ensoPhase}
            onChange={(e) => onFilterChange({ ensoPhase: e.target.value as EnsoPhase })}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
          >
            {ensoPhases.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Season Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <BarChart3 className="w-3 h-3 text-slate-400" />
            Meteorological Window
          </label>
          <select
            value={filters.season}
            onChange={(e) => onFilterChange({ season: e.target.value as ClimateSeason })}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
          >
            {seasons.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Geography / District Filter */}
        {showDistrictFilter && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              Spatial Scope
            </label>
            <select
              value={filters.selectedDistrictId || 'STATE'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'STATE') {
                  onFilterChange({ geographyLevel: 'state', selectedDistrictId: undefined });
                } else {
                  onFilterChange({ geographyLevel: 'district', selectedDistrictId: val });
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
            >
              <option value="STATE">Telangana (All 33 Districts Aggregate)</option>
              <optgroup label="Administrative Districts">
                {TELANGANA_DISTRICTS.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.zoneName.replace(' Zone', '')})</option>
                ))}
              </optgroup>
            </select>
          </div>
        )}

        {/* Agricultural Crop Filter */}
        {showCropFilter && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Sprout className="w-3 h-3 text-slate-400" />
              Crop Parameter
            </label>
            <select
              value={filters.selectedCropId || 'paddy_rice'}
              onChange={(e) => onFilterChange({ selectedCropId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
            >
              {TELANGANA_CROPS.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span>Active Window: <strong className="font-mono text-slate-700">{filters.startYear} – {filters.endYear}</strong> ({filters.endYear - filters.startYear + 1} Years)</span>
          <span className="text-slate-300">•</span>
          <span>Phase: <strong className="text-slate-700">{filters.ensoPhase}</strong></span>
          <span className="text-slate-300">•</span>
          <span>Baseline Reference: <strong className="text-slate-700">1971–2020 IMD Normals</strong></span>
        </div>
      </div>
    </div>
  );
};
