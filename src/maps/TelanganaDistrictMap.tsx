import React, { useState, useMemo } from 'react';
import { TELANGANA_DISTRICTS, AGRO_CLIMATIC_ZONES, DistrictInfo } from '../data/districts';
import { 
  TELANGANA_DISTRICT_POLYGONS, 
  TELANGANA_RIVERS, 
  TELANGANA_RESERVOIRS, 
  TELANGANA_ELEVATION_CONTOURS,
  DistrictGeoPolygon,
  GEO_CONFIG
} from '../data/telanganaGeo';
import { 
  MapPin, 
  Info, 
  Layers, 
  CloudRain, 
  Droplets, 
  Compass, 
  Mountain, 
  Sprout, 
  Maximize2, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Eye,
  Activity
} from 'lucide-react';
import { SourceBadge } from '../components/SourceBadge';

interface TelanganaDistrictMapProps {
  selectedDistrictId?: string;
  onSelectDistrict?: (districtId: string | undefined) => void;
  className?: string;
}

type MapThematicMode = 'rainfall' | 'crop_belts' | 'elevation' | 'agro_zones' | 'anomaly_2026';

export const TelanganaDistrictMap: React.FC<TelanganaDistrictMapProps> = ({
  selectedDistrictId,
  onSelectDistrict,
  className = ''
}) => {
  const [hoveredDistrictId, setHoveredDistrictId] = useState<string | null>(null);
  const [thematicMode, setThematicMode] = useState<MapThematicMode>('rainfall');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');
  
  // Layer visibility toggles
  const [showRivers, setShowRivers] = useState<boolean>(true);
  const [showReservoirs, setShowReservoirs] = useState<boolean>(true);
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Lookups
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

  const activeDistrictId = selectedDistrictId || hoveredDistrictId;
  const activeDistrictInfo = activeDistrictId ? districtDataMap.get(activeDistrictId) : null;
  const activeDistrictPoly = activeDistrictId ? districtPolygonsMap.get(activeDistrictId) : null;

  // Compute color based on active thematic layer
  const getDistrictFillColor = (poly: DistrictGeoPolygon, isSelected: boolean, isHovered: boolean) => {
    if (selectedZoneFilter !== 'ALL' && poly.zone !== selectedZoneFilter) {
      return '#f1f5f9'; // muted out of zone
    }

    if (thematicMode === 'rainfall') {
      // SWM Rainfall gradient (420mm -> 1060mm)
      const rain = poly.normalSwmRainfallMm;
      if (rain < 500) return isHovered ? '#f43f5e' : '#fda4af'; // South dry (Rose)
      if (rain < 600) return isHovered ? '#f59e0b' : '#fcd34d'; // Amber
      if (rain < 750) return isHovered ? '#eab308' : '#fef08a'; // Yellow
      if (rain < 850) return isHovered ? '#0ea5e9' : '#bae6fd'; // Light Blue
      if (rain < 950) return isHovered ? '#0284c7' : '#7dd3fc'; // Blue
      return isHovered ? '#0f766e' : '#5eead4'; // North-East forest (>950mm, Teal)
    }

    if (thematicMode === 'crop_belts') {
      switch (poly.dominantCrop) {
        case 'Paddy': return isHovered ? '#059669' : '#6ee7b7';
        case 'Cotton': return isHovered ? '#7c3aed' : '#c4b5fd';
        case 'Maize': return isHovered ? '#d97706' : '#fde68a';
        case 'Red Gram': return isHovered ? '#db2777' : '#fbcfe8';
        case 'Soyabean': return isHovered ? '#0891b2' : '#a5f3fc';
        default: return '#cbd5e1';
      }
    }

    if (thematicMode === 'elevation') {
      const elev = poly.elevationM;
      if (elev > 500) return isHovered ? '#92400e' : '#d97706'; // High Plateau (Vikarabad/Medchal)
      if (elev > 350) return isHovered ? '#b45309' : '#f59e0b'; // Mid Plateau
      if (elev > 250) return isHovered ? '#d97706' : '#fcd34d'; // Low Plateau
      if (elev > 180) return isHovered ? '#15803d' : '#86efac'; // River Basin
      return isHovered ? '#047857' : '#34d399'; // Low Valley (Godavari/Bhadradri)
    }

    if (thematicMode === 'agro_zones') {
      switch (poly.zone) {
        case 'NORTHERN_TELANGANA_ZONE': return isHovered ? '#0d9488' : '#5eead4';
        case 'SOUTHERN_TELANGANA_ZONE': return isHovered ? '#0284c7' : '#7dd3fc';
        case 'CENTRAL_TELANGANA_ZONE': return isHovered ? '#6366f1' : '#a5b4fc';
        case 'HIGH_ALTITUDE_TRIBAL_ZONE': return isHovered ? '#059669' : '#6ee7b7';
        default: return '#94a3b8';
      }
    }

    if (thematicMode === 'anomaly_2026') {
      const anomaly = poly.anomaly2026Pct;
      if (anomaly > 10) return isHovered ? '#047857' : '#6ee7b7'; // Large Excess
      if (anomaly > 0) return isHovered ? '#0d9488' : '#99f6e4'; // Normal to Mild Excess
      if (anomaly > -5) return isHovered ? '#eab308' : '#fef08a'; // Normal to Mild Deficit
      return isHovered ? '#e11d48' : '#fca5a5'; // Deficient
    }

    return '#cbd5e1';
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.8));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-4 shadow-xs ${className}`}>
      {/* Header & Thematic Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
              GIS Geospatial Cartography
            </span>
            <span className="text-xs text-slate-400 font-mono">WGS84 Projected (15.8°N–19.9°N, 77.1°E–81.9°E)</span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 font-serif tracking-tight flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-700" />
            Telangana High-Fidelity Geospatial Cartographic Framework
          </h3>
          <p className="text-xs text-slate-500">
            Real vector district boundaries, hydrography (Godavari & Krishna basins), elevation topography, and climatology
          </p>
        </div>

        {/* Thematic Mode Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setThematicMode('rainfall')}
            className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              thematicMode === 'rainfall' ? 'bg-white text-teal-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-teal-600" />
            <span>Rainfall LPA</span>
          </button>

          <button
            type="button"
            onClick={() => setThematicMode('crop_belts')}
            className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              thematicMode === 'crop_belts' ? 'bg-white text-emerald-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sprout className="w-3.5 h-3.5 text-emerald-600" />
            <span>Crop Belts</span>
          </button>

          <button
            type="button"
            onClick={() => setThematicMode('elevation')}
            className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              thematicMode === 'elevation' ? 'bg-white text-amber-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mountain className="w-3.5 h-3.5 text-amber-600" />
            <span>Elevation Relief</span>
          </button>

          <button
            type="button"
            onClick={() => setThematicMode('agro_zones')}
            className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              thematicMode === 'agro_zones' ? 'bg-white text-indigo-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Agro Zones</span>
          </button>

          <button
            type="button"
            onClick={() => setThematicMode('anomaly_2026')}
            className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              thematicMode === 'anomaly_2026' ? 'bg-white text-rose-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-rose-600" />
            <span>2026 Anomaly</span>
          </button>
        </div>
      </div>

      {/* Layer Toggles & Map Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-slate-50 px-3 py-2 rounded-md border border-slate-200 text-xs">
        {/* Layer Switches */}
        <div className="flex flex-wrap items-center gap-3 text-slate-700">
          <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">GIS Layers:</span>
          
          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showRivers} 
              onChange={(e) => setShowRivers(e.target.checked)} 
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
            />
            <span>Rivers & Reservoirs</span>
          </label>

          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showContours} 
              onChange={(e) => setShowContours(e.target.checked)} 
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
            />
            <span>Contours</span>
          </label>

          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showGraticule} 
              onChange={(e) => setShowGraticule(e.target.checked)} 
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
            />
            <span>Lat/Lon Grid</span>
          </label>

          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showLabels} 
              onChange={(e) => setShowLabels(e.target.checked)} 
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
            />
            <span>District Labels</span>
          </label>
        </div>

        {/* Zone Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500">Filter Zone:</span>
          <select
            value={selectedZoneFilter}
            onChange={(e) => setSelectedZoneFilter(e.target.value)}
            className="bg-white border border-slate-200 text-xs rounded px-2 py-0.5 text-slate-700 font-medium"
          >
            <option value="ALL">All 4 Zones (33 Districts)</option>
            {AGRO_CLIMATIC_ZONES.map(z => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Cartographic Map Viewport */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-lg p-3 relative overflow-hidden shadow-inner flex items-center justify-center min-h-[480px]">
          {/* Map Top Bar Controls */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-slate-800/90 backdrop-blur-xs p-1 rounded-md border border-slate-700 shadow-sm text-slate-200">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1 hover:bg-slate-700 rounded transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1 hover:bg-slate-700 rounded transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset View"
              className="p-1 hover:bg-slate-700 rounded transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 text-slate-400">
              {(zoomLevel * 100).toFixed(0)}%
            </span>
          </div>

          {/* Compass Rose */}
          <div className="absolute top-3 right-3 z-10 bg-slate-800/90 backdrop-blur-xs px-2 py-1.5 rounded-md border border-slate-700 flex items-center gap-1.5 text-[10px] font-mono text-slate-300 shadow-sm">
            <div className="w-4 h-4 rounded-full border border-teal-400/60 flex items-center justify-center relative">
              <span className="w-0.5 h-2 bg-rose-500 absolute -top-0.5 rounded-xs"></span>
              <span className="text-[7px] font-bold text-white relative -top-0.5">N</span>
            </div>
            <span>GIS North</span>
          </div>

          {/* SVG Map Canvas */}
          <svg
            viewBox={`0 0 ${GEO_CONFIG.width} ${GEO_CONFIG.height}`}
            className="w-full h-auto max-h-[480px] select-none transition-transform duration-200"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: 'center center'
            }}
          >
            <defs>
              {/* Graticule pattern */}
              <pattern id="gis-graticule" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
              </pattern>

              {/* River Glow Filter */}
              <filter id="river-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* District Active Drop Shadow */}
              <filter id="active-district-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
              </filter>
            </defs>

            {/* Background Canvas */}
            <rect width={GEO_CONFIG.width} height={GEO_CONFIG.height} fill="#0b1329" rx="8" />
            <rect width={GEO_CONFIG.width} height={GEO_CONFIG.height} fill="url(#gis-graticule)" rx="8" />

            {/* Graticule Coordinate Labels */}
            {showGraticule && (
              <g className="text-[8px] font-mono fill-slate-500 select-none">
                <line x1="40" y1="40" x2="520" y2="40" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x="525" y="43">19.5°N</text>

                <line x1="40" y1="160" x2="520" y2="160" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x="525" y="163">18.5°N</text>

                <line x1="40" y1="280" x2="520" y2="280" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x="525" y="283">17.5°N</text>

                <line x1="40" y1="400" x2="520" y2="400" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x="525" y="403">16.5°N</text>

                <line x1="140" y1="40" x2="140" y2="480" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x="135" y="495">78.0°E</text>

                <line x1="260" y1="40" x2="260" y2="480" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x="255" y="495">79.0°E</text>

                <line x1="380" y1="40" x2="380" y2="480" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x="375" y="495">80.0°E</text>

                <line x1="500" y1="40" x2="500" y2="480" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x="495" y="495">81.0°E</text>
              </g>
            )}

            {/* Topographic Elevation Contours */}
            {showContours && (
              <g className="pointer-events-none opacity-40">
                {TELANGANA_ELEVATION_CONTOURS.map(c => (
                  <path
                    key={c.id}
                    d={c.path}
                    fill="none"
                    stroke={c.color}
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                ))}
              </g>
            )}

            {/* 33 District Realistic Vector Polygons */}
            <g id="telangana-districts-layer">
              {TELANGANA_DISTRICT_POLYGONS.map((district) => {
                const isSelected = district.id === selectedDistrictId;
                const isHovered = district.id === hoveredDistrictId;
                const fillColor = getDistrictFillColor(district, isSelected, isHovered);

                return (
                  <path
                    key={district.id}
                    id={`district-poly-${district.id}`}
                    d={district.path}
                    fill={fillColor}
                    fillOpacity={isSelected ? 0.95 : isHovered ? 0.9 : 0.75}
                    stroke={isSelected ? '#ffffff' : isHovered ? '#38bdf8' : '#1e293b'}
                    strokeWidth={isSelected ? 2.5 : isHovered ? 1.8 : 0.8}
                    strokeLinejoin="round"
                    filter={isSelected || isHovered ? 'url(#active-district-shadow)' : undefined}
                    className="cursor-pointer transition-all duration-150 ease-out"
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

            {/* Hydrographic River Courses Layer */}
            {showRivers && (
              <g id="telangana-rivers-layer" className="pointer-events-none">
                {TELANGANA_RIVERS.map(river => (
                  <g key={river.id}>
                    {/* River Water Glow Base */}
                    <path
                      d={river.path}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth={river.type === 'major_river' ? 3.5 : 2}
                      strokeLinecap="round"
                      opacity={0.7}
                      filter="url(#river-glow)"
                    />
                    {/* River Core Stream */}
                    <path
                      d={river.path}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth={river.type === 'major_river' ? 1.8 : 1.2}
                      strokeLinecap="round"
                    />
                    {/* River Name Label */}
                    {river.labelPoint && (
                      <text
                        x={river.labelPoint[0]}
                        y={river.labelPoint[1]}
                        className="text-[8px] font-sans font-bold fill-sky-300 italic select-none"
                        style={{ textShadow: '0 0 3px #0f172a' }}
                      >
                        ~ {river.name} ~
                      </text>
                    )}
                  </g>
                ))}
              </g>
            )}

            {/* Strategic Reservoirs & Barrages */}
            {showRivers && showReservoirs && (
              <g id="telangana-reservoirs-layer">
                {TELANGANA_RESERVOIRS.map(res => (
                  <g key={res.id} className="cursor-pointer">
                    <circle
                      cx={res.x}
                      cy={res.y}
                      r={res.r + 2}
                      fill="#0284c7"
                      fillOpacity={0.4}
                      className="animate-pulse"
                    />
                    <circle
                      cx={res.x}
                      cy={res.y}
                      r={res.r}
                      fill="#38bdf8"
                      stroke="#ffffff"
                      strokeWidth="1.2"
                    />
                    <text
                      x={res.x}
                      y={res.y - 8}
                      textAnchor="middle"
                      className="text-[7.5px] font-sans font-bold fill-sky-200 pointer-events-none select-none"
                      style={{ textShadow: '0 0 3px #000' }}
                    >
                      {res.name}
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* District Centroid Markers & Micro-labels */}
            {showLabels && (
              <g id="telangana-district-labels-layer" className="pointer-events-none">
                {TELANGANA_DISTRICT_POLYGONS.map((district) => {
                  const isSelected = district.id === selectedDistrictId;
                  const isHovered = district.id === hoveredDistrictId;

                  return (
                    <g key={`label-${district.id}`}>
                      <circle
                        cx={district.center[0]}
                        cy={district.center[1]}
                        r={isSelected ? 4 : 2}
                        fill={isSelected ? '#ffffff' : '#0f172a'}
                        stroke="#ffffff"
                        strokeWidth="0.8"
                      />
                      <text
                        x={district.center[0]}
                        y={district.center[1] + 9}
                        textAnchor="middle"
                        className={`text-[8.5px] font-sans font-semibold select-none ${
                          isSelected ? 'fill-white font-bold text-[9.5px]' : isHovered ? 'fill-sky-300 font-bold' : 'fill-slate-900'
                        }`}
                        style={{ 
                          textShadow: isSelected || isHovered ? '0 0 4px #000, 0 0 2px #000' : '0 0 3px rgba(255,255,255,0.9), 0 0 1px #fff' 
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

          {/* Metric Scale Bar */}
          <div className="absolute bottom-3 left-3 bg-slate-800/90 backdrop-blur-xs px-2.5 py-1 rounded border border-slate-700 text-[10px] font-mono text-slate-300 flex items-center gap-2">
            <span>0</span>
            <div className="w-16 h-1 bg-slate-400 relative">
              <span className="absolute left-0 top-0 w-8 h-full bg-teal-400"></span>
            </div>
            <span>100 km</span>
          </div>

          {/* Active Layer Tag */}
          <div className="absolute bottom-3 right-3 bg-slate-800/90 backdrop-blur-xs px-2.5 py-1 rounded border border-slate-700 text-[10px] font-mono text-teal-400">
            Layer: {thematicMode.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        {/* Right Sidebar: District Inspector & Thematic Legend */}
        <div className="lg:col-span-4 space-y-3">
          {/* Active District Inspection Card */}
          {activeDistrictInfo && activeDistrictPoly ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between border-b border-slate-200 pb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                    <h4 className="text-sm font-bold text-slate-900">{activeDistrictInfo.name}</h4>
                    <span className="text-xs text-slate-400 font-telugu font-normal">({activeDistrictInfo.teluguName})</span>
                  </div>
                  <span className="text-[11px] text-teal-700 font-semibold block mt-0.5">
                    {activeDistrictInfo.zoneName}
                  </span>
                </div>

                <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                  HQ: {activeDistrictInfo.headquarters}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] uppercase text-slate-400 block font-sans">Monsoon LPA (JJAS)</span>
                  <strong className="text-teal-800 text-sm">{activeDistrictInfo.normalSwmRainfallMm} mm</strong>
                </div>

                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] uppercase text-slate-400 block font-sans">2026 Monsoon Anomaly</span>
                  <strong className={`text-sm ${activeDistrictPoly.anomaly2026Pct > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {activeDistrictPoly.anomaly2026Pct > 0 ? '+' : ''}{activeDistrictPoly.anomaly2026Pct}%
                  </strong>
                </div>

                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] uppercase text-slate-400 block font-sans">Elevation (MSL)</span>
                  <span className="text-slate-800 font-bold">{activeDistrictPoly.elevationM} m</span>
                </div>

                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] uppercase text-slate-400 block font-sans">Geographic Area</span>
                  <span className="text-slate-800">{activeDistrictInfo.areaSqKm} km²</span>
                </div>
              </div>

              <div className="text-xs space-y-1.5 pt-1">
                <div>
                  <span className="font-semibold text-slate-600 block text-[11px]">Dominant Soil Profile:</span>
                  <span className="text-slate-800">{activeDistrictInfo.majorSoilType}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600 block text-[11px]">Dominant Kharif Crops:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {activeDistrictInfo.primaryCrops.map((c, i) => (
                      <span key={i} className="text-[10px] bg-slate-200/80 px-2 py-0.5 rounded text-slate-800 font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {onSelectDistrict && (
                <button
                  type="button"
                  onClick={() => onSelectDistrict(selectedDistrictId === activeDistrictInfo.id ? undefined : activeDistrictInfo.id)}
                  className={`w-full text-center py-2 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    selectedDistrictId === activeDistrictInfo.id 
                      ? 'bg-rose-700 hover:bg-rose-800 text-white' 
                      : 'bg-teal-700 hover:bg-teal-800 text-white'
                  }`}
                >
                  {selectedDistrictId === activeDistrictInfo.id 
                    ? 'Deselect District (Reset to Statewide View)' 
                    : `Filter Research Analytics for ${activeDistrictInfo.name}`}
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-5 text-center text-xs text-slate-500">
              <Info className="w-5 h-5 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-700 mb-1">Interactive Geospatial Inspector</p>
              <p className="leading-relaxed">
                Hover over or click any of the 33 district polygons to inspect climatological normals, 2026 monsoon departure, soil types, and dominant crop tracts.
              </p>
            </div>
          )}

          {/* Thematic Legend Panel */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-lg text-xs space-y-2.5">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700 block border-b border-slate-100 pb-1.5">
              Thematic Legend: {thematicMode.replace('_', ' ').toUpperCase()}
            </span>

            {thematicMode === 'rainfall' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3 rounded-xs bg-[#5eead4] border border-slate-300"></span>
                    <span className="text-slate-700">&gt; 950 mm (High / Forest Agency)</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">Adilabad, Mulugu</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3 rounded-xs bg-[#7dd3fc] border border-slate-300"></span>
                    <span className="text-slate-700">850 – 950 mm (Northern Zone)</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">Nirmal, Jagtial</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3 rounded-xs bg-[#bae6fd] border border-slate-300"></span>
                    <span className="text-slate-700">750 – 850 mm (State Average)</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">Warangal, Medak</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3 rounded-xs bg-[#fef08a] border border-slate-300"></span>
                    <span className="text-slate-700">600 – 750 mm (Moderate Rain)</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">Hyderabad, Yadadri</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3 rounded-xs bg-[#fda4af] border border-slate-300"></span>
                    <span className="text-slate-700">&lt; 500 mm (Semi-Arid Dryland)</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">Gadwal, Narayanpet</span>
                </div>
              </div>
            )}

            {thematicMode === 'crop_belts' && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="w-3 h-3 rounded-xs bg-[#6ee7b7]"></span>
                  <span className="text-slate-800 font-semibold">Paddy (Rice) Canal Tracts</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="w-3 h-3 rounded-xs bg-[#c4b5fd]"></span>
                  <span className="text-slate-800 font-semibold">Cotton (Lint) Black Soils</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="w-3 h-3 rounded-xs bg-[#fde68a]"></span>
                  <span className="text-slate-800 font-semibold">Maize (Corn) Red Chalka</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="w-3 h-3 rounded-xs bg-[#fbcfe8]"></span>
                  <span className="text-slate-800 font-semibold">Red Gram / Pulses Drylands</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="w-3 h-3 rounded-xs bg-[#a5f3fc]"></span>
                  <span className="text-slate-800 font-semibold">Soyabean Oilseed Tract</span>
                </div>
              </div>
            )}

            {thematicMode === 'elevation' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-[#d97706]"></span>
                    <span className="text-slate-700">&gt; 500 m (Upper Deccan Ridge)</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">Vikarabad</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-[#f59e0b]"></span>
                    <span className="text-slate-700">350 – 500 m (Central Plateau)</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">Hyderabad/Medak</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-[#86efac]"></span>
                    <span className="text-slate-700">&lt; 200 m (River Valleys)</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">Kothagudem/Khammam</span>
                </div>
              </div>
            )}

            {thematicMode === 'agro_zones' && (
              <div className="space-y-1.5">
                {AGRO_CLIMATIC_ZONES.map(z => (
                  <div key={z.id} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: z.color }}></span>
                      <span className="text-slate-700 font-medium">{z.name}</span>
                    </div>
                    <span className="font-mono text-slate-500 text-[10px]">~{z.normalRainfallMm} mm</span>
                  </div>
                ))}
              </div>
            )}

            {thematicMode === 'anomaly_2026' && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="w-3 h-3 rounded-xs bg-[#6ee7b7]"></span>
                  <span className="text-slate-700">&gt; +10% (Substantial Monsoon Excess)</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="w-3 h-3 rounded-xs bg-[#99f6e4]"></span>
                  <span className="text-slate-700">0% to +10% (Normal to Above Normal)</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="w-3 h-3 rounded-xs bg-[#fca5a5]"></span>
                  <span className="text-slate-700">&lt; 0% (Rainfall Deficit Tract)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <SourceBadge
          source="Survey of India, DES Govt. of Telangana & IMD Climatological Isohyets"
          period="1971 – 2026 Geospatial Baseline"
          units="WGS84 Coordinates, mm & km²"
          observationCount={33}
        />
      </div>
    </div>
  );
};
