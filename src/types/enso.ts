export type OniClassification = 'VERY_STRONG_EL_NINO' | 'STRONG_EL_NINO' | 'MODERATE_EL_NINO' | 'WEAK_EL_NINO' | 'NEUTRAL' | 'WEAK_LA_NINA' | 'MODERATE_LA_NINA' | 'STRONG_LA_NINA';

export interface EnsoObservation {
  year: number;
  month: number;
  season3Month: string; // e.g. "JJA", "JAS", "ASO", "SON", "OND", "NDJ", "DJF"
  oniValue: number; // Oceanic Niño Index (°C anomaly in Niño 3.4 region: 5°N-5°S, 120°-170°W)
  nino34Sst?: number; // Raw Sea Surface Temperature (°C)
  classification: OniClassification;
  phase: 'EL_NINO' | 'NEUTRAL' | 'LA_NINA';
  southernOscillationIndex?: number; // SOI standardized index
  iodDmiValue?: number; // Dipole Mode Index for Indian Ocean Dipole interaction
}

export interface EnsoEventSummary {
  eventYear: number;
  peakMonth: string;
  peakOni: number;
  category: 'EL_NINO' | 'LA_NINA';
  strength: 'Weak' | 'Moderate' | 'Strong' | 'Very Strong';
  durationMonths: number;
}
