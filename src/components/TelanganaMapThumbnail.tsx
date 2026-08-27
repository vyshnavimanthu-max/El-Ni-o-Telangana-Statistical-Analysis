import React from 'react';
import { TELANGANA_DISTRICT_POLYGONS, TELANGANA_RIVERS } from '../data/telanganaGeo';

interface TelanganaMapThumbnailProps {
  className?: string;
  alt?: string;
  showLabels?: boolean;
}

// 33 distinct harmonious pastel colors for the 33 districts
const DISTRICT_COLORS = [
  '#fecaca', '#fed7aa', '#fef08a', '#d9f99d', '#a7f3d0', '#99f6e4', '#bae6fd', '#c7d2fe', '#e9d5ff', '#fbcfe8',
  '#fda4af', '#fcd34d', '#bef264', '#86efac', '#6ee7b7', '#5eead4', '#7dd3fc', '#a5b4fc', '#d8b4fe', '#f472b6',
  '#fb7185', '#fbbf24', '#a3e635', '#4ade80', '#34d399', '#2dd4bf', '#38bdf8', '#818cf8', '#c084fc', '#e879f9',
  '#f87171', '#f59e0b', '#10b981'
];

export const TelanganaMapThumbnail: React.FC<TelanganaMapThumbnailProps> = ({
  className = "w-full h-full object-contain",
  showLabels = false
}) => {
  return (
    <svg
      viewBox="0 0 560 520"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Telangana 33 Districts Administrative Map"
    >
      <defs>
        <filter id="map-subtle-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Background state backing */}
      <g filter="url(#map-subtle-shadow)">
        {TELANGANA_DISTRICT_POLYGONS.map((district, idx) => {
          const fillColor = DISTRICT_COLORS[idx % DISTRICT_COLORS.length];
          return (
            <g key={district.id}>
              <path
                d={district.path}
                fill={fillColor}
                stroke="#334155"
                strokeWidth="1.2"
                strokeLinejoin="round"
                strokeLinecap="round"
                className="transition-opacity hover:opacity-80"
              >
                <title>{`${district.name} District (Zone: ${district.zone.replace(/_/g, ' ')})`}</title>
              </path>
              {showLabels && (
                <text
                  x={district.center[0]}
                  y={district.center[1]}
                  fontSize="7"
                  fontFamily="sans-serif"
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#0f172a"
                  pointerEvents="none"
                >
                  {district.name.length > 11 ? district.name.slice(0, 9) + '..' : district.name}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Major River Courses */}
      {TELANGANA_RIVERS.map((river) => (
        <path
          key={river.id}
          d={river.path}
          fill="none"
          stroke="#0284c7"
          strokeWidth={river.type === 'major_river' ? '2.2' : '1.2'}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
          pointerEvents="none"
        />
      ))}
    </svg>
  );
};
