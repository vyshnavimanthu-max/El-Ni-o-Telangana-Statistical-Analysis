import React, { useState } from 'react';
import { TELANGANA_MAP_DATA_URL } from '../assets/telanganaMapData';

interface TelanganaMapThumbnailProps {
  className?: string;
  alt?: string;
}

export const TelanganaMapThumbnail: React.FC<TelanganaMapThumbnailProps> = ({
  className = "w-full h-full object-contain",
  alt = "Telangana 33 Districts Administrative Map"
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    // Fallback vector visual if image error occurs
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-teal-900 text-white rounded p-1 text-center font-mono">
        <span className="text-[10px] font-bold tracking-wider text-teal-300">TS-33</span>
        <span className="text-[8px] text-teal-100">TELANGANA</span>
      </div>
    );
  }

  return (
    <img
      src={TELANGANA_MAP_DATA_URL}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
      loading="eager"
    />
  );
};
