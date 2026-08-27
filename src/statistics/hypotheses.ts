import { ResearchHypothesis } from '../types/statistics';

export const FORMULATED_HYPOTHESES: ResearchHypothesis[] = [
  {
    id: 'H1_ENSO_RAINFALL',
    code: 'H1',
    title: 'ENSO Association with Southwest Monsoon Rainfall',
    nullHypothesis: 'H0: There is no statistically significant correlation between the Oceanic Niño Index (ONI JJAS) and Southwest Monsoon rainfall totals in Telangana (ρ = 0).',
    alternativeHypothesis: 'H1: An inverse relationship exists such that higher ONI values (El Niño conditions) are statistically associated with reduced Southwest Monsoon rainfall in Telangana (ρ < 0).',
    statisticalTest: 'Pearson Product-Moment Correlation (r) & Spearman Rank Correlation (ρ)',
    variablesTested: ['ONI_JJAS (°C)', 'SWM_RAINFALL (mm)'],
    status: 'PENDING_DATA_INGESTION',
    caveatNotes: 'Statistical association does not imply direct mechanistic causation. Indian Ocean Dipole (IOD) positive phase events have historically mitigated El Niño drying effects in peninsular India.'
  },
  {
    id: 'H2_ENSO_TEMPERATURE',
    code: 'H2',
    title: 'ENSO Association with Summer/Monsoon Maximum Temperatures',
    nullHypothesis: 'H0: Mean daytime maximum temperature anomalies during JJAS in Telangana do not differ between El Niño, Neutral, and La Niña phases (μ_ElNino = μ_Neutral = μ_LaNina).',
    alternativeHypothesis: 'H1: Mean maximum temperature anomalies in Telangana are significantly elevated during El Niño phases compared to Neutral and La Niña phases.',
    statisticalTest: 'One-Way Analysis of Variance (ANOVA) & Tukey-Kramer HSD Post-Hoc Test',
    variablesTested: ['ENSO Phase (Factor: 3 levels)', 'MAX_TEMP_ANOM (°C)'],
    status: 'PENDING_DATA_INGESTION',
    caveatNotes: 'Reduced cloud cover and precipitation deficits during El Niño years typically increase surface shortwave radiation, driving positive thermal anomalies.'
  },
  {
    id: 'H3_ENSO_AGRICULTURE_YIELD',
    code: 'H3',
    title: 'ENSO Association with Rainfed Crop Yields (Kharif Season)',
    nullHypothesis: 'H0: Detrended Kharif crop yields (Paddy, Cotton, Red Gram, Maize) exhibit no mean difference across ENSO phase classifications.',
    alternativeHypothesis: 'H1: Rainfed Kharif crop yields experience statistically significant negative anomalies during El Niño years compared to Neutral and La Niña years.',
    statisticalTest: 'Ordinary Least Squares (OLS) Multiple Regression with Technological Trend Control & Two-Sample Welch t-test',
    variablesTested: ['ONI_JJAS', 'Detrended Crop Yield Anomalies (% departure)'],
    status: 'PENDING_DATA_INGESTION',
    caveatNotes: 'Irrigated acreage (such as canal network expansions in Telangana post-2014) attenuates climate vulnerability, necessitating crop-wise and irrigation-stratified analysis.'
  },
  {
    id: 'H4_DISTRICT_SPATIAL_HETEROGENEITY',
    code: 'H4',
    title: 'Spatial Heterogeneity of ENSO Sensitivity Across Telangana Agro-Climatic Zones',
    nullHypothesis: 'H0: The magnitude of rainfall departure during El Niño years is spatially uniform across all agro-climatic zones of Telangana.',
    alternativeHypothesis: 'H1: Southern and Central agro-climatic zones of Telangana (semi-arid tract) exhibit significantly greater vulnerability and larger percentage rainfall deficits during El Niño events than the Northern/High-Altitude Godavari tract.',
    statisticalTest: 'Spatial Kruskal-Wallis Test & Moran’s I for Spatial Autocorrelation',
    variablesTested: ['Agro-Climatic Zone (4 zones)', 'District Monsoon Departure (%)'],
    status: 'PENDING_DATA_INGESTION',
    caveatNotes: 'Orography and local synoptic depression tracks from the Bay of Bengal contribute to non-uniform regional sensitivity.'
  }
];
