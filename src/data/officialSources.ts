/**
 * Authoritative Metadata Registry for Official Climatological & Agricultural Data Sources
 * 
 * Strict compliance with research standards:
 * - India Meteorological Department (IMD)
 * - NOAA Climate Prediction Center (CPC)
 * - Government of India Open Data Platform (data.gov.in)
 * - Directorate of Economics and Statistics (DES), Telangana
 * - Telangana State Development Planning Society (TSDPS)
 */

import { DataSource } from '../types/dataModels';

export const OFFICIAL_SOURCES: Record<string, DataSource> = {
  noaa_cpc_oni: {
    id: 'noaa_cpc_oni',
    sourceName: 'NOAA Climate Prediction Center (CPC)',
    sourceOrganization: 'National Oceanic and Atmospheric Administration (NOAA) / NWS, USA',
    datasetName: 'Oceanic Niño Index (ONI) - ERSST.v5 SST Anomalies',
    sourceURL: 'https://origin.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php',
    downloadDate: '2026-08-15',
    coveragePeriod: '1950 – 2026 (Continuous Monthly / Till Date)',
    frequency: '3-Month Running Mean (Overlapping)',
    units: '°C (Sea Surface Temperature anomaly in Niño 3.4 region: 5°N–5°S, 120°–170°W)',
    spatialResolution: 'Niño 3.4 Equatorial Pacific Regional Index (5°N–5°S, 120°W–170°W)',
    citation: 'Huang, B., et al. (2017). Extended Reconstructed Sea Surface Temperature version 5 (ERSSTv5): Upgrades, validations, and intercomparisons. Journal of Climate, 30(20), 8179-8205.',
    methodologyNotes: 'Calculated as 3-month running mean of ERSST.v5 SST anomalies in Niño 3.4 region based on centered 30-year base periods updated every 5 years to account for global ocean warming trends.',
    limitations: [
      'Overlapping 3-month windows (e.g. JJA, JAS) are serially auto-correlated; they must not be treated as independent annual observations.',
      'ONI is an ocean-surface index and does not capture atmospheric coupling without verifying Southern Oscillation Index (SOI) or Outgoing Longwave Radiation (OLR).',
      'Non-linear teleconnection: El Niño presence does not guarantee uniform Indian monsoon failure due to IOD and intra-seasonal Madden-Julian Oscillation (MJO) modulations.'
    ],
    status: 'CONNECTED'
  },

  imd_gridded_rainfall: {
    id: 'imd_gridded_rainfall',
    sourceName: 'India Meteorological Department (IMD)',
    sourceOrganization: 'Ministry of Earth Sciences, Government of India / National Climate Centre, Pune',
    datasetName: 'High Resolution Daily Gridded Rainfall Dataset (0.25° × 0.25°)',
    sourceURL: 'https://imdpune.gov.in/cmpg/Griddata/Rainfall_25_Bin.html',
    downloadDate: '2026-08-15',
    coveragePeriod: '1901 – 2026 (1971–2026 active analysis window)',
    frequency: 'Daily records aggregated to Monthly, Southwest Monsoon (JJAS), and Annual',
    units: 'Millimetres (mm) / Departure percentage from Long Period Average (LPA = 750.5 mm)',
    spatialResolution: '0.25° × 0.25° latitude/longitude grid (~27 km × 27 km resolution)',
    citation: 'Pai, D. S., et al. (2014). Development of a new high spatial resolution (0.25° × 0.25°) long period (1901-2010) daily gridded rainfall data set over India. Mausam, 65(1), 1-18.',
    methodologyNotes: 'Developed from ~6,995 quality-controlled rain gauge stations across India using Shepard interpolation algorithm. Clipped precisely to Telangana state boundary (15.8°N–19.9°N, 77.2°E–81.8°E).',
    limitations: [
      'Station density variation: Higher station network density in western Telangana plains compared to eastern agency and forest tracts.',
      'Localized convective cloudbursts (<10 km radius) may be smoothed across 0.25° grid cells.',
      'State-level aggregation uses area-weighted averaging across all Telangana grid centroids.'
    ],
    status: 'CONNECTED'
  },

  imd_gridded_temp: {
    id: 'imd_gridded_temp',
    sourceName: 'India Meteorological Department (IMD)',
    sourceOrganization: 'Ministry of Earth Sciences, Government of India / IMD Pune',
    datasetName: 'High Resolution Daily Gridded Temperature Dataset (0.5° × 0.5°)',
    sourceURL: 'https://imdpune.gov.in/cmpg/Griddata/Max_Temp_NetCDF.html',
    downloadDate: '2026-08-15',
    coveragePeriod: '1951 – 2026 (1971–2026 active analysis window)',
    frequency: 'Daily Maximum and Minimum Temperature aggregated to JJAS Monsoon Mean',
    units: 'Degrees Celsius (°C) and Anomaly departures from 1981–2010 Climatology',
    spatialResolution: '0.5° × 0.5° latitude/longitude (~55 km × 55 km grid)',
    citation: 'Srivastava, A. K., et al. (2009). Development of high resolution daily gridded temperature data set (1969–2005) for the Indian region. Atmospheric Science Letters, 10(4), 249-254.',
    methodologyNotes: 'Modified Cressman interpolation technique applied to daily observational thermometric station networks across the Indian subcontinent.',
    limitations: [
      '0.5° grid is coarser than 0.25° rainfall; microclimatic urban heat island effects (e.g. Greater Hyderabad) are averaged over regional grid blocks.',
      'Station elevation adjustments applied using standard lapse rate of 6.5°C/km.'
    ],
    status: 'CONNECTED'
  },

  des_telangana_agri: {
    id: 'des_telangana_agri',
    sourceName: 'Directorate of Economics and Statistics (DES)',
    sourceOrganization: 'Department of Planning, Government of Telangana, Hyderabad',
    datasetName: 'Telangana Season & Crop Reports / Agricultural Statistics (Kharif & Rabi)',
    sourceURL: 'https://ecostat.telangana.gov.in/',
    downloadDate: '2026-08-15',
    coveragePeriod: '1966 – 2026 (Historical merged with 2014–2026 Telangana publications & 1st Advance Estimates)',
    frequency: 'Annual Crop-Year (Kharif: June–October, Rabi: November–April)',
    units: 'Gross Area Sown (Hectares), Production (Metric Tonnes), Yield (Kilograms per Hectare)',
    spatialResolution: 'Statewide aggregates and 33 Administrative Districts',
    citation: 'Directorate of Economics and Statistics. (2026). Telangana State at a Glance & Season and Crop Report. Government of Telangana, Hyderabad.',
    methodologyNotes: 'Yield estimates derived from official Crop Estimation Surveys (CES) using stratified multi-stage random sampling crop cutting experiments (CCE) conducted across representative agricultural plots.',
    limitations: [
      '2016 Administrative Reorganization: Telangana reorganized from 10 legacy districts into 31 (and later 33) districts; continuous longitudinal series is unbroken at the State level, while district series requires spatial harmonisation.',
      'Technological yield trend: Multi-decadal yield growth is driven by HYV seeds, fertilizers, and borewell expansion; detrending algorithms must be applied to isolate meteorological impacts.',
      'Post-2015 irrigation intervention (Kaleshwaram Lift Irrigation, Mission Kakatiya) heavily cushions canal-irrigated command areas (e.g., paddy) against single-season rainfall deficits.'
    ],
    status: 'CONNECTED'
  },

  tsdps_aws: {
    id: 'tsdps_aws',
    sourceName: 'Telangana State Development Planning Society (TSDPS)',
    sourceOrganization: 'Planning Department, Government of Telangana',
    datasetName: 'Mandal-level Automatic Weather Station (AWS) Network',
    sourceURL: 'https://tsdps.telangana.gov.in/',
    downloadDate: '2024-12-01',
    coveragePeriod: '2014 – Present',
    frequency: 'Hourly, Daily, and Seasonal (JJAS) aggregated statistics',
    units: 'Rainfall (mm), Temperature (°C), Relative Humidity (%), Solar Radiation (W/m²)',
    spatialResolution: 'Mandal level (1,044+ AWS stations, ~1 station per 100 km²)',
    citation: 'Telangana State Development Planning Society. (2024). Weather Analysis and Agro-Advisory Bulletins. Planning Department, Govt. of Telangana, Hyderabad.',
    methodologyNotes: 'High-density telemetry-linked solar-powered automatic weather stations with calibrated tipping-bucket rain gauges and shielded thermistors installed in each mandal headquarters.',
    limitations: [
      'Coverage period begins in 2014 following state formation; unsuitable for multi-decadal historical regression (1980–2024), but provides highest contemporary spatial validation.',
      'Occasional transmission dropouts during extreme weather events require quality-control interpolation.'
    ],
    status: 'CONNECTED'
  },

  data_gov_in: {
    id: 'data_gov_in',
    sourceName: 'Open Government Data (OGD) Platform India',
    sourceOrganization: 'National Informatics Centre (NIC) / Ministry of Electronics & IT, Government of India',
    datasetName: 'District-wise, Season-wise Crop Production Statistics & Met Data (Telangana)',
    sourceURL: 'https://data.gov.in/',
    downloadDate: '2024-11-15',
    coveragePeriod: '1997 – 2023',
    frequency: 'Annual / Seasonal',
    units: 'Standard SI & Indian Agricultural Standard Units',
    spatialResolution: 'District & State Level',
    citation: 'Ministry of Agriculture and Farmers Welfare. (2023). District-wise Crop Production Statistics of India. OGD Platform India (data.gov.in).',
    methodologyNotes: 'Standardized national open-data repository consolidating returns from State agricultural and statistical directorates across India.',
    limitations: [
      'Data publishing lag: Open data releases typically lag 12–18 months behind direct State statistical directorate publications.'
    ],
    status: 'SCHEMA_MAPPED'
  }
};
