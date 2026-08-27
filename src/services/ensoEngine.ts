/**
 * ENSO Data Processing & Climatological Teleconnection Engine
 * 
 * METHODOLOGICAL RIGOR & MATHEMATICAL FORMULATION:
 * - Overlapping 3-month running mean seasons (DJF, JFM, ..., NDJ) are serially auto-correlated
 *   moving-average filters (3-month boxcar windows).
 * - Treating all 12 seasons as independent data points artificially inflates sample size (N = 12 * Years)
 *   and falsely collapses p-values (pseudo-replication).
 * - For rigorous econometric & statistical modeling with Telangana Southwest Monsoon (June–September),
 *   we extract single, orthogonal, non-overlapping annual indicators.
 */

import { 
  ENSORecord, 
  DerivedMonsoonEnsoIndicator, 
  OniSeasonCode, 
  EnsoState, 
  OniStrength 
} from '../types/dataModels';
import { OFFICIAL_SOURCES } from '../data/officialSources';

export type MonsoonEnsoIndicatorType = 'JJA' | 'JAS' | 'JJAS_MEAN' | 'MJJ';

export class EnsoEngine {
  /**
   * NOAA CPC Official Operational Thresholds for ONI (Niño 3.4 SST Anomaly):
   * - Very Strong El Niño: ONI >= +2.0°C
   * - Strong El Niño: +1.5°C <= ONI < +2.0°C
   * - Moderate El Niño: +1.0°C <= ONI < +1.5°C
   * - Weak El Niño: +0.5°C <= ONI < +1.0°C
   * - Neutral: -0.5°C < ONI < +0.5°C
   * - Weak La Niña: -1.0°C < ONI <= -0.5°C
   * - Moderate La Niña: -1.5°C < ONI <= -1.0°C
   * - Strong La Niña: ONI <= -1.5°C
   */
  public static classifyOni(oni: number): { state: EnsoState; strength: OniStrength } {
    if (oni >= 2.0) return { state: 'EL_NINO', strength: 'VERY_STRONG_EL_NINO' };
    if (oni >= 1.5) return { state: 'EL_NINO', strength: 'STRONG_EL_NINO' };
    if (oni >= 1.0) return { state: 'EL_NINO', strength: 'MODERATE_EL_NINO' };
    if (oni >= 0.5) return { state: 'EL_NINO', strength: 'WEAK_EL_NINO' };
    if (oni <= -1.5) return { state: 'LA_NINA', strength: 'STRONG_LA_NINA' };
    if (oni <= -1.0) return { state: 'LA_NINA', strength: 'MODERATE_LA_NINA' };
    if (oni <= -0.5) return { state: 'LA_NINA', strength: 'WEAK_LA_NINA' };
    return { state: 'NEUTRAL', strength: 'NEUTRAL' };
  }

  /**
   * Month mapping for the 12 overlapping 3-month running seasons
   */
  public static readonly SEASON_ORDER: OniSeasonCode[] = [
    'DJF', 'JFM', 'FMA', 'MAM', 'AMJ', 'MJJ',
    'JJA', 'JAS', 'ASO', 'SON', 'OND', 'NDJ'
  ];

  /**
   * Extracts orthogonal, non-overlapping annual monsoon indicators from continuous ENSO records.
   * 
   * @param rawRecords Raw 3-month running ONI records (1950–2024)
   * @param indicatorType Chosen monsoon indicator:
   *   - 'JJA': June-July-August (Monsoon onset & early progression)
   *   - 'JAS': July-August-September (Core rainfall & active depression phase)
   *   - 'JJAS_MEAN': Arithmetic average of JJA and JAS (capturing June–September aggregate)
   *   - 'MJJ': May-June-July (Early season lead indicator)
   */
  public static extractMonsoonIndicators(
    rawRecords: ENSORecord[],
    indicatorType: MonsoonEnsoIndicatorType = 'JJAS_MEAN'
  ): DerivedMonsoonEnsoIndicator[] {
    const recordsByYear = new Map<number, Map<OniSeasonCode, ENSORecord>>();

    for (const record of rawRecords) {
      if (!recordsByYear.has(record.year)) {
        recordsByYear.set(record.year, new Map());
      }
      recordsByYear.get(record.year)!.set(record.season, record);
    }

    const derivedList: DerivedMonsoonEnsoIndicator[] = [];
    const years = Array.from(recordsByYear.keys()).sort((a, b) => a - b);

    for (const year of years) {
      const yearMap = recordsByYear.get(year)!;
      let calculatedOni: number | null = null;
      let methodDesc = '';

      if (indicatorType === 'JJA') {
        const jja = yearMap.get('JJA');
        if (jja) {
          calculatedOni = jja.oni;
          methodDesc = 'Direct JJA (June-July-August) 3-month running mean';
        }
      } else if (indicatorType === 'JAS') {
        const jas = yearMap.get('JAS');
        if (jas) {
          calculatedOni = jas.oni;
          methodDesc = 'Direct JAS (July-August-September) 3-month running mean';
        }
      } else if (indicatorType === 'MJJ') {
        const mjj = yearMap.get('MJJ');
        if (mjj) {
          calculatedOni = mjj.oni;
          methodDesc = 'Lead indicator MJJ (May-June-July) 3-month running mean';
        }
      } else if (indicatorType === 'JJAS_MEAN') {
        const jja = yearMap.get('JJA');
        const jas = yearMap.get('JAS');
        if (jja && jas) {
          calculatedOni = (jja.oni + jas.oni) / 2;
          methodDesc = 'Composite mean of overlapping JJA and JAS running means: (ONI_JJA + ONI_JAS)/2';
        } else if (jja) {
          calculatedOni = jja.oni;
          methodDesc = 'Fallback single season JJA (JAS missing)';
        } else if (jas) {
          calculatedOni = jas.oni;
          methodDesc = 'Fallback single season JAS (JJA missing)';
        }
      }

      if (calculatedOni !== null) {
        const roundedOni = Number(calculatedOni.toFixed(2));
        const { state, strength } = this.classifyOni(roundedOni);

        derivedList.push({
          year,
          indicatorType,
          oniValue: roundedOni,
          ensoState: state,
          classification: strength,
          transformationMethod: methodDesc,
          degreeOfFreedomNote: `Independent annual sample (df = N - 2 = ${years.length - 2}). No intra-annual duplicate counting.`,
          source: OFFICIAL_SOURCES.noaa_cpc_oni
        });
      }
    }

    return derivedList;
  }

  /**
   * Diagnostic summary of ENSO phases across selected time window
   */
  public static getPhaseDistribution(derivedIndicators: DerivedMonsoonEnsoIndicator[]) {
    const total = derivedIndicators.length;
    const elNinoCount = derivedIndicators.filter(d => d.ensoState === 'EL_NINO').length;
    const neutralCount = derivedIndicators.filter(d => d.ensoState === 'NEUTRAL').length;
    const laNinaCount = derivedIndicators.filter(d => d.ensoState === 'LA_NINA').length;

    return {
      totalYears: total,
      elNinoYears: elNinoCount,
      elNinoPercent: total > 0 ? (elNinoCount / total) * 100 : 0,
      neutralYears: neutralCount,
      neutralPercent: total > 0 ? (neutralCount / total) * 100 : 0,
      laNinaYears: laNinaCount,
      laNinaPercent: total > 0 ? (laNinaCount / total) * 100 : 0
    };
  }
}
