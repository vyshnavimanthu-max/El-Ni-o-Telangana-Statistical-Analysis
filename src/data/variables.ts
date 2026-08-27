export interface VariableDefinition {
  code: string;
  name: string;
  category: 'ENSO' | 'CLIMATE' | 'AGRICULTURE';
  unit: string;
  mathematicalFormula?: string;
  description: string;
  baselinePeriod: string;
  sourceAuthority: string;
}

export const RESEARCH_VARIABLES: VariableDefinition[] = [
  {
    code: 'ONI_JJAS',
    name: 'Oceanic Niño Index (June–September Mean)',
    category: 'ENSO',
    unit: '°C (anomaly)',
    mathematicalFormula: 'ONI_{JJAS} = \\frac{1}{4} \\sum_{m \\in \\{JJA, JAS, ASO, SON\\}} ONI_m',
    description: 'Average ONI departure across the core Indian Southwest Monsoon period. Thresholds: El Niño >= +0.5°C, La Niña <= -0.5°C.',
    baselinePeriod: '30-year centered base period (NOAA standard)',
    sourceAuthority: 'NOAA Climate Prediction Center'
  },
  {
    code: 'SWM_RAINFALL',
    name: 'Southwest Monsoon Cumulative Rainfall',
    category: 'CLIMATE',
    unit: 'mm',
    mathematicalFormula: 'R_{SWM} = \\sum_{t=1}^{122} R_{daily, t} \\quad (\\text{June 1 to Sept 30})',
    description: 'Total precipitation recorded across Telangana during the Southwest Monsoon period.',
    baselinePeriod: '1971–2020 Long Period Average (LPA = 750.5 mm statewide)',
    sourceAuthority: 'India Meteorological Department (IMD)'
  },
  {
    code: 'RAIN_DEP_PCT',
    name: 'Rainfall Departure (% Anomaly)',
    category: 'CLIMATE',
    unit: '% departure',
    mathematicalFormula: '\\Delta R_{\\%} = \\left( \\frac{R_{actual} - LPA}{LPA} \\right) \\times 100',
    description: 'Percentage departure from IMD Long Period Average. Normal is within [-19%, +19%], Deficient is [-59%, -20%], Excess is [+20%, +59%].',
    baselinePeriod: '1971–2020 LPA Normals',
    sourceAuthority: 'India Meteorological Department (IMD)'
  },
  {
    code: 'MAX_TEMP_ANOM',
    name: 'Monsoon Mean Maximum Temperature Anomaly',
    category: 'CLIMATE',
    unit: '°C',
    mathematicalFormula: '\\Delta T_{max} = T_{max, observed} - \\bar{T}_{max, normal}',
    description: 'Departure of daytime peak temperature from the historical climatological mean for June–September.',
    baselinePeriod: '1981–2010 IMD Climatology',
    sourceAuthority: 'India Meteorological Department (IMD)'
  },
  {
    code: 'CROP_YIELD_KHARIF',
    name: 'Kharif Crop Productivity (Yield)',
    category: 'AGRICULTURE',
    unit: 'kg / hectare',
    mathematicalFormula: 'Y = \\frac{\\text{Total Production (kg)}}{\\text{Gross Area Harvested (ha)}}',
    description: 'Crop productivity per unit of harvested land area recorded in official crop estimation surveys (CES).',
    baselinePeriod: '5-year rolling trend / historical series',
    sourceAuthority: 'Directorate of Economics and Statistics, Govt. of Telangana'
  },
  {
    code: 'YIELD_ANOM_PCT',
    name: 'Crop Yield Detrended Anomaly (%)',
    category: 'AGRICULTURE',
    unit: '%',
    mathematicalFormula: '\\Delta Y_{\\%} = \\left( \\frac{Y_{observed} - \\hat{Y}_{trend}}{\\hat{Y}_{trend}} \\right) \\times 100',
    description: 'Percentage deviation of observed crop yield from technology-adjusted quadratic/linear time trend to isolate climatic shock.',
    baselinePeriod: 'Sample timeframe detrended curve',
    sourceAuthority: 'DES Telangana & Statistical Project Protocol'
  }
];
