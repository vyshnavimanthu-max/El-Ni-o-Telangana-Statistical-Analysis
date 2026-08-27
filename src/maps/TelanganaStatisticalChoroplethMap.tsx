import React, { useState, useMemo } from 'react';
import { TELANGANA_DISTRICTS, DistrictInfo } from '../data/districts';
import { 
  TELANGANA_DISTRICT_POLYGONS, 
  DistrictGeoPolygon,
  GEO_CONFIG
} from '../data/telanganaGeo';
import { 
  DistrictAnalysisVariable, 
  DistrictCropType,
  getDistrictsMapData,
  getDistrictYearRecord,
  calculateDistrictStats
} from '../data/districtTimeSeriesData';
import { 
  Layers, 
  Calendar, 
  HelpCircle, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  Info,
  AlertCircle
} from 'lucide-react';

interface TelanganaStatisticalChoroplethMapProps {
  selectedDistrictId?: string;
  onSelectDistrict?: (districtId: string | undefined) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  selectedVariable: DistrictAnalysisVariable;
  onVariableChange: (variable: DistrictAnalysisVariable) => void;
  selectedCrop: DistrictCropType;
  onCropChange: (crop: DistrictCropType) => void;
  className?: string;
}

export const TelanganaStatisticalChoroplethMap: React.FC<TelanganaStatisticalChoroplethMapProps> = ({
  selectedDistrictId,
  onSelectDistrict,
  selectedYear,
  onYearChange,
  selectedVariable,
  onVariableChange,
  selectedCrop,
  onCropChange,
  className = ''
}) => {
  const [hoveredDistrictId, setHoveredDistrictId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Map Data for currently selected year, variable, and crop
  const mapData = useMemo(() => {
    return getDistrictsMapData(selectedYear, selectedVariable, selectedCrop);
  }, [selectedYear, selectedVariable, selectedCrop]);

  // District metadata lookup
  const districtPolygonsMap = useMemo(() => {
    const map = new Map<string, DistrictGeoPolygon>();
    TELANGANA_DISTRICT_POLYGONS.forEach(p => map.set(p.id, p));
    return map;
  }, []);

  const districtDataMap = useMemo(() => {
    const map = new Map<string, DistrictInfo>();
    TELANGANA_DISTRICTS.forEach(d => map.set(d.id, d));
    return map;
  }, []);

  // Compute active district info
  const activeDistrictId = hoveredDistrictId || selectedDistrictId;
  const activeDistrictInfo = activeDistrictId ? districtDataMap.get(activeDistrictId) : null;
  const activeDistrictData = activeDistrictId ? mapData.get(activeDistrictId) : null;

  // Compute Variable Meta details (Title, Unit, Source, Color stops)
  const variableMeta = useMemo(() => {
    switch (selectedVariable) {
      case 'rainfall_anomaly':
        return {
          title: 'Telangana District-Level Southwest Monsoon (JJAS) Rainfall Anomaly',
          variableName: 'Rainfall Anomaly',
          unit: '% Departure from 1971–2020 LPA',
          source: 'India Meteorological Department (IMD) 0.25° Gridded Rainfall & TSDPS AWS Network',
          legendTitle: '% Departure from Normal LPA',
          intervals: [
            { label: 'Deficient (< -20%)', color: '#b91c1c', border: '#7f1d1d' },
            { label: 'Mild Deficit (-20% to -5%)', color: '#f59e0b', border: '#b45309' },
            { label: 'Normal (-5% to +5%)', color: '#fef08a', border: '#eab308' },
            { label: 'Mild Excess (+5% to +20%)', color: '#38bdf8', border: '#0284c7' },
            { label: 'Excess / Deluge (> +20%)', color: '#0d9488', border: '#0f766e' }
          ]
        };
      case 'temperature_anomaly':
        return {
          title: 'Telangana District-Level Mean Temperature Anomaly (JJAS)',
          variableName: 'Temperature Anomaly',
          unit: '°C Departure from Climatological Normal',
          source: 'India Meteorological Department (IMD) 0.5° Gridded Temperature Dataset',
          legendTitle: 'Thermal Anomaly (°C)',
          intervals: [
            { label: 'Cool (< -0.5°C)', color: '#0284c7', border: '#0369a1' },
            { label: 'Slightly Below (-0.5 to -0.1°C)', color: '#7dd3fc', border: '#38bdf8' },
            { label: 'Near Normal (-0.1 to +0.1°C)', color: '#e2e8f0', border: '#cbd5e1' },
            { label: 'Slightly Warm (+0.1 to +0.5°C)', color: '#fb923c', border: '#ea580c' },
            { label: 'Warm (> +0.5°C)', color: '#dc2626', border: '#991b1b' }
          ]
        };
      case 'agricultural_yield': {
        const cropLabels: Record<DistrictCropType, string> = {
          paddy: 'Paddy (Rice)',
          cotton: 'Cotton (Kapas)',
          maize: 'Maize (Corn)',
          red_gram: 'Red Gram (Tur)',
          soyabean: 'Soyabean'
        };
        const cropName = cropLabels[selectedCrop] || selectedCrop;
        return {
          title: `Telangana District-Level Agricultural Yield: ${cropName} (Kharif)`,
          variableName: `Agricultural Yield (${cropName})`,
          unit: 'kg/ha',
          source: 'Directorate of Economics & Statistics (DES), Govt. of Telangana Season & Crop Reports',
          legendTitle: `Yield (kg/ha) - ${cropName}`,
          intervals: [
            { label: 'Low (< 2500 kg/ha)', color: '#fed7aa', border: '#f97316' },
            { label: 'Moderate (2500 – 3200 kg/ha)', color: '#a7f3d0', border: '#10b981' },
            { label: 'Good (3200 – 3800 kg/ha)', color: '#34d399', border: '#059669' },
            { label: 'High (> 3800 kg/ha)', color: '#047857', border: '#065f46' }
          ]
        };
      }
      case 'extreme_rainfall':
        return {
          title: 'Telangana District-Level Heavy Rainfall Frequency (JJAS)',
          variableName: 'Heavy Rainfall Days (≥ 64.5 mm)',
          unit: 'Days with Daily Rainfall ≥ 64.5 mm',
          source: 'Telangana State Development Planning Society (TSDPS) & IMD AWS Station Network',
          legendTitle: 'Heavy Rainfall Frequency (Days)',
          intervals: [
            { label: '0 – 2 Days', color: '#e2e8f0', border: '#94a3b8' },
            { label: '3 – 5 Days', color: '#fed7aa', border: '#f97316' },
            { label: '6 – 9 Days', color: '#fb923c', border: '#ea580c' },
            { label: '10 – 14 Days', color: '#dc2626', border: '#b91c1c' },
            { label: '≥ 15 Days (Extreme)', color: '#7f1d1d', border: '#450a0a' }
          ]
        };
    }
  }, [selectedVariable, selectedCrop]);

  // Color mapping logic
  const getDistrictFillColor = (districtId: string, isSelected: boolean, isHovered: boolean) => {
    const datum = mapData.get(districtId);
    if (!datum || !datum.isAvailable || datum.value === null) {
      // Unavailability styling: Muted neutral hash
      return isHovered ? '#64748b' : '#334155';
    }

    const val = datum.value;

    if (selectedVariable === 'rainfall_anomaly') {
      if (val < -20) return isHovered ? '#ef4444' : '#b91c1c'; // Deficient
      if (val < -5) return isHovered ? '#f59e0b' : '#d97706'; // Mild Deficit
      if (val <= 5) return isHovered ? '#fef08a' : '#fde047'; // Normal
      if (val <= 20) return isHovered ? '#38bdf8' : '#0284c7'; // Mild Excess
      return isHovered ? '#2dd4bf' : '#0d9488'; // Excess
    }

    if (selectedVariable === 'temperature_anomaly') {
      if (val < -0.5) return isHovered ? '#38bdf8' : '#0284c7';
      if (val < -0.1) return isHovered ? '#7dd3fc' : '#0ea5e9';
      if (val <= 0.1) return isHovered ? '#f1f5f9' : '#cbd5e1';
      if (val <= 0.5) return isHovered ? '#fb923c' : '#ea580c';
      return isHovered ? '#ef4444' : '#dc2626';
    }

    if (selectedVariable === 'agricultural_yield') {
      if (selectedCrop === 'cotton') {
        if (val < 380) return isHovered ? '#e9d5ff' : '#c084fc';
        if (val < 450) return isHovered ? '#c084fc' : '#a855f7';
        if (val < 520) return isHovered ? '#a855f7' : '#9333ea';
        return isHovered ? '#9333ea' : '#6b21a8';
      }
      if (selectedCrop === 'red_gram') {
        if (val < 700) return isHovered ? '#fed7aa' : '#fb923c';
        if (val < 820) return isHovered ? '#fde047' : '#eab308';
        if (val < 920) return isHovered ? '#86efac' : '#22c55e';
        return isHovered ? '#22c55e' : '#15803d';
      }
      if (selectedCrop === 'soyabean') {
        if (val < 1000) return isHovered ? '#fed7aa' : '#f97316';
        if (val < 1250) return isHovered ? '#fef08a' : '#eab308';
        if (val < 1400) return isHovered ? '#99f6e4' : '#0d9488';
        return isHovered ? '#2dd4bf' : '#0f766e';
      }
      // Default: Paddy / Maize
      if (val < 2500) return isHovered ? '#fed7aa' : '#f97316';
      if (val < 3200) return isHovered ? '#a7f3d0' : '#10b981';
      if (val < 3800) return isHovered ? '#34d399' : '#059669';
      return isHovered ? '#10b981' : '#047857';
    }

    if (selectedVariable === 'extreme_rainfall') {
      if (val <= 2) return isHovered ? '#94a3b8' : '#64748b';
      if (val <= 5) return isHovered ? '#fed7aa' : '#f97316';
      if (val <= 9) return isHovered ? '#fb923c' : '#ea580c';
      if (val <= 14) return isHovered ? '#ef4444' : '#dc2626';
      return isHovered ? '#991b1b' : '#7f1d1d';
    }

    return '#475569';
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.8));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pre-calculated ENSO context for selected year
  const sampleYearRecord = useMemo(() => {
    return getDistrictYearRecord('adilabad', selectedYear);
  }, [selectedYear]);

  // Selected district statistics (Mean, Median, SD, Anomaly, ENSO state, Selected Crop)
  const selectedDistrictStats = useMemo(() => {
    if (!selectedDistrictId) return null;
    return calculateDistrictStats(selectedDistrictId, selectedVariable, selectedYear, selectedCrop);
  }, [selectedDistrictId, selectedVariable, selectedYear, selectedCrop]);

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 ${className}`}>
      {/* 1. MAP HEADER: Dynamic Title, Year, Variable, Unit, and Source */}
      <div className="border-b border-slate-200 pb-4 space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                Official Statistical Choropleth
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Year: <strong className="text-slate-900">{selectedYear}</strong> | ENSO: <strong className={sampleYearRecord?.ensoPhase === 'El Niño' ? 'text-rose-600' : sampleYearRecord?.ensoPhase === 'La Niña' ? 'text-teal-700' : 'text-slate-700'}>{sampleYearRecord?.ensoPhase || 'Neutral'}</strong> (ONI: {sampleYearRecord?.oniJjas !== undefined ? `${sampleYearRecord.oniJjas > 0 ? '+' : ''}${sampleYearRecord.oniJjas}°C` : '0.0°C'})
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-serif tracking-tight">
              {variableMeta.title}
            </h3>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-slate-500 block">
              Unit: <strong className="text-slate-800">{variableMeta.unit}</strong>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Administrative Coverage: 33 Telangana Districts
            </span>
          </div>
        </div>

        {/* Source citation */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-100">
          <Info className="w-3.5 h-3.5 text-teal-700 shrink-0" />
          <span>
            <strong>Source:</strong> {variableMeta.source}
          </span>
        </div>
      </div>

      {/* 2. INTERACTIVE CONTROLS: Variable, Crop, and Year Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        {/* Variable Selection */}
        <div className="lg:col-span-4 space-y-1">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
            Select Climatological / Agricultural Variable:
          </label>
          <select
            value={selectedVariable}
            onChange={(e) => onVariableChange(e.target.value as DistrictAnalysisVariable)}
            className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-teal-600 focus:outline-hidden"
          >
            <option value="rainfall_anomaly">Rainfall Anomaly (% Departure from 1971–2020 LPA)</option>
            <option value="temperature_anomaly">Temperature Anomaly (°C Departure from Normal)</option>
            <option value="agricultural_yield">Agricultural Yield (kg/ha by Crop)</option>
            <option value="extreme_rainfall">Extreme Rainfall (Days ≥ 64.5 mm, post-2016)</option>
          </select>
        </div>

        {/* Crop Selection (Active when variable is agricultural yield) */}
        {selectedVariable === 'agricultural_yield' && (
          <div className="lg:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Selected Crop Cultivar:
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => onCropChange(e.target.value as DistrictCropType)}
              className="w-full bg-white border border-emerald-300 rounded-md px-3 py-1.5 text-xs font-semibold text-emerald-900 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
            >
              <option value="paddy">Paddy (Rice) - Irrigated/Canal</option>
              <option value="cotton">Cotton (Kapas) - Rainfed/Semi-irrigated</option>
              <option value="maize">Maize (Corn) - Rainfed</option>
              <option value="red_gram">Red Gram (Tur) - Rainfed Pulses</option>
              <option value="soyabean">Soyabean - Northern Black Soils</option>
            </select>
          </div>
        )}

        {/* Year Selection & Quick Steppers */}
        <div className={selectedVariable === 'agricultural_yield' ? 'lg:col-span-5 space-y-1' : 'lg:col-span-8 space-y-1'}>
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Year Timeline: <strong className="text-teal-900 text-sm font-mono">{selectedYear}</strong>
            </label>
            {/* Quick historical benchmark buttons */}
            <div className="hidden sm:flex items-center gap-1 text-[10px]">
              <span className="text-slate-400">Key Years:</span>
              <button
                type="button"
                onClick={() => onYearChange(1987)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${selectedYear === 1987 ? 'bg-rose-600 text-white font-bold' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                title="1987 Severe El Niño Drought"
              >
                '87 (El Niño)
              </button>
              <button
                type="button"
                onClick={() => onYearChange(2002)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${selectedYear === 2002 ? 'bg-rose-600 text-white font-bold' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                title="2002 Historic Drought"
              >
                '02 (Drought)
              </button>
              <button
                type="button"
                onClick={() => onYearChange(2020)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${selectedYear === 2020 ? 'bg-teal-700 text-white font-bold' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                title="2020 Record Deluge (La Niña)"
              >
                '20 (Deluge)
              </button>
              <button
                type="button"
                onClick={() => onYearChange(2023)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${selectedYear === 2023 ? 'bg-amber-600 text-white font-bold' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                title="2023 Strong El Niño"
              >
                '23 (El Niño)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onYearChange(Math.max(1980, selectedYear - 1))}
              disabled={selectedYear <= 1980}
              className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-700" />
            </button>

            <input
              type="range"
              min={1980}
              max={2024}
              value={selectedYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="w-full accent-teal-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />

            <button
              type="button"
              onClick={() => onYearChange(Math.min(2024, selectedYear + 1))}
              disabled={selectedYear >= 2024}
              className="p-1.5 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              title="Next Year"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN MAP & STATISTICAL SIDEBAR VIEWPORT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* MAP CANVAS VIEWPORT */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-lg p-3 relative overflow-hidden shadow-inner flex flex-col items-center justify-center min-h-[500px]">
          {/* Zoom / Pan Controls */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-slate-900/90 backdrop-blur-xs p-1 rounded-md border border-slate-700 shadow-sm text-slate-200">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset View"
              className="p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 text-slate-400">
              {(zoomLevel * 100).toFixed(0)}%
            </span>
          </div>

          {/* Toggle Labels */}
          <div className="absolute top-3 right-3 z-10 bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-2 text-[11px] text-slate-300">
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="rounded border-slate-600 text-teal-600 focus:ring-teal-500 h-3 w-3"
              />
              <span>District Labels</span>
            </label>
          </div>

          {/* SVG Map Canvas */}
          <svg
            viewBox={`0 0 ${GEO_CONFIG.width} ${GEO_CONFIG.height}`}
            className="w-full h-auto max-h-[480px] select-none transition-transform duration-150"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: 'center center'
            }}
          >
            <defs>
              {/* Graticule pattern */}
              <pattern id="gis-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.4" strokeDasharray="2 2" />
              </pattern>

              {/* District Active Drop Shadow */}
              <filter id="choropleth-active-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.8" />
              </filter>

              {/* Unavailable Hatch Pattern */}
              <pattern id="unavailable-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="1.5" />
              </pattern>
            </defs>

            {/* Background Canvas */}
            <rect width={GEO_CONFIG.width} height={GEO_CONFIG.height} fill="#090d16" rx="8" />
            <rect width={GEO_CONFIG.width} height={GEO_CONFIG.height} fill="url(#gis-grid-pattern)" rx="8" />

            {/* 33 District Vector Polygons */}
            <g id="telangana-choropleth-polygons">
              {TELANGANA_DISTRICT_POLYGONS.map((district) => {
                const isSelected = district.id === selectedDistrictId;
                const isHovered = district.id === hoveredDistrictId;
                const datum = mapData.get(district.id);
                const isUnavailable = !datum || !datum.isAvailable || datum.value === null;

                const fillColor = isUnavailable ? 'url(#unavailable-hatch)' : getDistrictFillColor(district.id, isSelected, isHovered);

                return (
                  <path
                    key={district.id}
                    id={`poly-${district.id}`}
                    d={district.path}
                    fill={fillColor}
                    fillOpacity={isSelected ? 1.0 : isHovered ? 0.95 : 0.85}
                    stroke={isSelected ? '#ffffff' : isHovered ? '#38bdf8' : '#0f172a'}
                    strokeWidth={isSelected ? 3.0 : isHovered ? 2.0 : 0.9}
                    strokeLinejoin="round"
                    filter={isSelected || isHovered ? 'url(#choropleth-active-shadow)' : undefined}
                    className="cursor-pointer transition-all duration-100 ease-out"
                    onClick={() => {
                      if (onSelectDistrict) {
                        onSelectDistrict(isSelected ? undefined : district.id);
                      }
                    }}
                    onMouseEnter={() => setHoveredDistrictId(district.id)}
                    onMouseLeave={() => setHoveredDistrictId(null)}
                  />
                );
              })}
            </g>

            {/* District Centroid Micro-labels */}
            {showLabels && (
              <g id="telangana-district-labels" className="pointer-events-none">
                {TELANGANA_DISTRICT_POLYGONS.map((district) => {
                  const isSelected = district.id === selectedDistrictId;
                  const isHovered = district.id === hoveredDistrictId;

                  return (
                    <g key={`lbl-${district.id}`}>
                      <circle
                        cx={district.center[0]}
                        cy={district.center[1]}
                        r={isSelected ? 4 : 2}
                        fill={isSelected ? '#ffffff' : '#020617'}
                        stroke="#ffffff"
                        strokeWidth="0.8"
                      />
                      <text
                        x={district.center[0]}
                        y={district.center[1] + 9}
                        textAnchor="middle"
                        className={`text-[8.5px] font-sans font-semibold select-none ${
                          isSelected ? 'fill-white font-bold text-[9.5px]' : isHovered ? 'fill-sky-300 font-bold' : 'fill-slate-100'
                        }`}
                        style={{
                          textShadow: '0 0 3px #000, 0 0 1px #000'
                        }}
                      >
                        {district.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>

          {/* Scale bar & Coordinates */}
          <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span>0</span>
              <div className="w-16 h-1 bg-slate-600 relative">
                <span className="absolute left-0 top-0 w-8 h-full bg-teal-400"></span>
              </div>
              <span>100 km</span>
            </div>
            <span>WGS84 (15.8°N–19.9°N, 77.1°E–81.9°E)</span>
          </div>
        </div>

        {/* STATISTICAL LEGEND & DISTRICT INSPECTOR SIDEBAR */}
        <div className="lg:col-span-4 space-y-4">
          {/* STATISTICAL LEGEND */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-900 font-serif">
                {variableMeta.legendTitle}
              </span>
              <span className="text-[10px] font-mono text-slate-500">Class Intervals</span>
            </div>

            <div className="space-y-1.5">
              {variableMeta.intervals.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-4 h-3 rounded-xs border shrink-0" 
                      style={{ backgroundColor: item.color, borderColor: item.border }}
                    />
                    <span className="text-slate-700 text-[11px] font-medium">{item.label}</span>
                  </div>
                </div>
              ))}

              {/* Unavailable swatch */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-3 rounded-xs border border-slate-400 bg-slate-700 shrink-0" />
                  <span className="text-slate-500 text-[11px] italic">Official district-level data unavailable</span>
                </div>
              </div>
            </div>
          </div>

          {/* DISTRICT STATISTICS CARD (WHEN A DISTRICT IS SELECTED) */}
          {selectedDistrictStats ? (
            <div className="bg-white border-2 border-teal-600 rounded-lg p-4 space-y-3 shadow-sm">
              <div className="flex items-start justify-between border-b border-slate-200 pb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                    <h4 className="text-base font-bold text-slate-900 font-serif">{selectedDistrictStats.districtName}</h4>
                  </div>
                  <span className="text-xs text-slate-500">
                    Administrative District (Telangana)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectDistrict && onSelectDistrict(undefined)}
                  className="text-[10px] text-slate-400 hover:text-slate-700 underline cursor-pointer"
                >
                  Clear
                </button>
              </div>

              {/* If data is available vs unavailable */}
              {selectedDistrictStats.isAvailable && selectedDistrictStats.currentValue !== null ? (
                <div className="space-y-3">
                  {/* Current Selected Value & Anomaly */}
                  <div className="bg-teal-50/70 border border-teal-200 rounded p-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-semibold text-teal-900 uppercase">
                        {selectedYear} Observed Value:
                      </span>
                      <span className="text-lg font-bold font-mono text-teal-950">
                        {selectedDistrictStats.currentValue > 0 && selectedVariable.includes('anomaly') ? '+' : ''}
                        {selectedDistrictStats.currentValue} {selectedDistrictStats.unit}
                      </span>
                    </div>
                    {selectedDistrictStats.currentAnomaly !== null && selectedVariable !== 'rainfall_anomaly' && (
                      <span className="text-[11px] text-teal-700 font-mono block mt-0.5">
                        Anomaly: {selectedDistrictStats.currentAnomaly > 0 ? '+' : ''}{selectedDistrictStats.currentAnomaly} {selectedDistrictStats.unit}
                      </span>
                    )}
                  </div>

                  {/* Rigorous Descriptive Statistics Grid: Mean, Median, SD */}
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-[10px] uppercase text-slate-500 font-sans block font-semibold">Mean</span>
                      <strong className="text-slate-900 text-xs">{selectedDistrictStats.mean ?? 'N/A'}</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-[10px] uppercase text-slate-500 font-sans block font-semibold">Median</span>
                      <strong className="text-slate-900 text-xs">{selectedDistrictStats.median ?? 'N/A'}</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-[10px] uppercase text-slate-500 font-sans block font-semibold">SD (σ)</span>
                      <strong className="text-slate-900 text-xs">{selectedDistrictStats.sd ?? 'N/A'}</strong>
                    </div>
                  </div>

                  {/* ENSO State & Crop Details */}
                  <div className="space-y-1.5 text-xs bg-slate-50 p-2.5 rounded border border-slate-200 font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">ENSO State ({selectedYear}):</span>
                      <span className="font-semibold text-slate-900 font-mono">
                        {selectedDistrictStats.ensoPhase} (ONI: {selectedDistrictStats.oniJjas > 0 ? '+' : ''}{selectedDistrictStats.oniJjas}°C)
                      </span>
                    </div>

                    {selectedVariable === 'agricultural_yield' && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-600">Selected Crop:</span>
                        <span className="font-semibold text-emerald-800 capitalize">
                          {selectedCrop.replace('_', ' ')} (Kharif)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Explicit required unavailable message */
                <div className="bg-amber-50 border border-amber-200 p-3 rounded text-center space-y-1.5">
                  <AlertCircle className="w-5 h-5 text-amber-700 mx-auto" />
                  <p className="text-xs font-bold text-amber-900">
                    Official district-level data unavailable for this variable.
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Synthetic or interpolated substitutes are strictly prohibited by protocol.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-5 text-center text-slate-500 space-y-1">
              <span className="text-xs font-semibold text-slate-700 block">No District Selected</span>
              <p className="text-[11px] text-slate-500">
                Click any district on the choropleth map to inspect detailed statistical metrics (Mean, Median, SD, Anomaly, and ENSO response).
              </p>
            </div>
          )}

          {/* 4. HISTORICAL ADMINISTRATIVE BOUNDARY REORGANIZATION NOTE */}
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
              Administrative Boundary Documentation
            </span>
            <p className="leading-relaxed text-slate-600">
              Telangana was formed on 2 June 2014 with 10 legacy districts. On 11 October 2016, the Government of Telangana reorganized these into 31 administrative districts, later adjusted to 33 in Feb 2019 (Mulugu & Narayanpet).
            </p>
            <p className="leading-relaxed text-slate-600">
              <strong>Methodology:</strong> Gridded climatological datasets (IMD 0.25° rainfall and 0.5° temperature) are computed consistently for all 33 district polygons using area-weighted spatial zonal statistics across 1980–2024. For non-spatial point surveys (AWS extreme rainfall & DES crop surveys), pre-2016 records are displayed as unavailable rather than synthetically merged without defensible methodology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
