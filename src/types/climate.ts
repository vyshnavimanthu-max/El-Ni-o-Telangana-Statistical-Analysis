export interface RainfallObservation {
  year: number;
  districtId?: string;
  districtName?: string;
  zone?: string;
  // Monsoon Breakdown (mm)
  june: number | null;
  july: number | null;
  august: number | null;
  september: number | null;
  southwestMonsoonTotal: number | null; // JJAS aggregate
  northeastMonsoonTotal: number | null; // OND aggregate
  annualTotal: number | null;
  // Long Period Average (LPA) Baseline (1971-2020 IMD Normals)
  lpaSouthwestMonsoon: number;
  anomalyMm: number | null;
  anomalyPercent: number | null; // % departure from normal
  monsoonClassification?: 'LARGE_DEFICIENT' | 'DEFICIENT' | 'NORMAL' | 'EXCESS' | 'LARGE_EXCESS';
  rainyDaysCount?: number | null;
  drySpellsCount?: number | null; // Consecutive days < 2.5mm during peak vegetative phase
}

export interface TemperatureObservation {
  year: number;
  month?: number;
  districtId?: string;
  districtName?: string;
  meanMaxTempC: number | null;
  meanMinTempC: number | null;
  meanTempC: number | null;
  maxTempAnomalyC: number | null;
  minTempAnomalyC: number | null;
  heatWaveDaysCount?: number | null;
}
