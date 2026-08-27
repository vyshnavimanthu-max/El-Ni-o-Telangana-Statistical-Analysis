export interface CropYieldObservation {
  year: number;
  cropId: string;
  cropName: string;
  season: 'KHARIF' | 'RABI' | 'ANNUAL';
  districtId?: string;
  districtName?: string;
  areaUnderCultivationHectares: number | null;
  productionTonnes: number | null;
  yieldKgPerHectare: number | null;
  yieldAnomalyPercent: number | null; // % departure from 5-year moving average or trendline
  irrigationCoveragePercent?: number | null; // Rainfed vs Canal/Borewell dependency
}

export interface CropMetadata {
  id: string;
  name: string;
  scientificName?: string;
  teluguName?: string;
  season: 'KHARIF' | 'RABI' | 'BOTH';
  waterRequirementCategory: 'HIGH' | 'MEDIUM' | 'LOW';
  waterRequirementMm?: number;
  irrigationPercentage?: number;
  typicalYieldRangeKgHa?: [number, number];
  majorDistricts: string[];
  vulnerabilityToMonsoonDeficit: 'CRITICAL' | 'MODERATE' | 'LOW';
  ensoSensitivityLevel?: 'HIGH' | 'MODERATE' | 'LOW';
  vulnerabilityNotes?: string;
}
