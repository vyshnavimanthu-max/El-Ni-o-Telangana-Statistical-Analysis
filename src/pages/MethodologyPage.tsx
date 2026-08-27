import React, { useState } from 'react';
import { 
  FileText, 
  HelpCircle, 
  MapPin, 
  Calendar, 
  Database, 
  Layers, 
  Cpu, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Sigma, 
  Scale, 
  ShieldCheck, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
  Zap,
  Clock,
  Compass,
  GitBranch,
  Filter,
  BarChart3
} from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'all' | 'framework' | 'variables' | 'statistical_assumptions' | 'reproducibility'>('all');

  return (
    <div className="space-y-6 pb-12 text-slate-800">
      {/* Page Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-teal-700" />
                Academic Defense &amp; Research Design
              </span>
              <span className="text-xs text-slate-500 font-mono">Formal Protocol Specification</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-serif">
              Research Methodology &amp; Econometric Design
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-4xl leading-relaxed">
              Complete, defensible documentation of the study area, empirical variables, anomaly normalization, mathematical formulations, parametric &amp; non-parametric statistical assumptions, and replication protocols.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 border border-slate-200 rounded-xl shadow-2xs text-xs">
        <button
          type="button"
          onClick={() => setActiveSection('all')}
          className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
            activeSection === 'all' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All Sections
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('framework')}
          className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
            activeSection === 'framework' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          1. Research Framework &amp; Design
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('variables')}
          className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
            activeSection === 'variables' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          2. Mathematical Formulations &amp; Pipeline
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('statistical_assumptions')}
          className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
            activeSection === 'statistical_assumptions' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          3. Statistical Assumptions Matrix
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('reproducibility')}
          className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
            activeSection === 'reproducibility' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          4. Limitations &amp; Reproducibility
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: RESEARCH FRAMEWORK & GEOGRAPHIC DESIGN */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'framework') && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-700" />
              1. Research Design, Spatial Bounds &amp; Variables
            </h3>
            <p className="text-xs text-slate-500">
              Core research hypothesis, geographic domain definition, temporal scale, and variable matrix.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Research Question */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 font-mono uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-teal-700" />
                Primary Research Question
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-serif">
                &ldquo;To what quantifiable extent does the El Niño–Southern Oscillation (ENSO) modulate the Southwest Monsoon (JJAS) precipitation, thermal regime, and major agricultural crop yields across the semi-arid state of Telangana, India?&rdquo;
              </p>
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                <strong>Core Objective:</strong> Provide a non-causal, empirical econometric synthesis testing hydroclimatic teleconnections against 5 key null hypotheses without hardcoded approximations.
              </div>
            </div>

            {/* Study Area */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 font-mono uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-teal-700" />
                Study Area (Telangana, India)
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Telangana lies in the semi-arid core of the Deccan Plateau (15°50&apos;N–19°55&apos;N, 77°14&apos;E–81°19&apos;E) covering <strong>112,077 km²</strong> across 33 administrative districts.
              </p>
              <ul className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <li>• <strong>Agro-Climatic Zones:</strong> Northern, Central, and Southern Telangana Zones.</li>
                <li>• <strong>Drainage Basins:</strong> Godavari Basin (North) &amp; Krishna Basin (South).</li>
                <li>• <strong>Monsoon Exposure:</strong> ~80% of annual rainfall is concentrated in the Southwest Monsoon (June–September).</li>
              </ul>
            </div>

            {/* Study Period */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 font-mono uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-teal-700" />
                Study Period &amp; Harmonization
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                The continuous study period spans <strong>1980 through 2026</strong> (47 annual observation cycles) with historical baseline calibration extending back to 1971.
              </p>
              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div>• <strong>Climatological Baseline (LPA):</strong> 1971–2020 (50-year normal = 750.5 mm).</div>
                <div>• <strong>Longitudinal Integrity:</strong> Continuous state-level time series unbroken across the 2014 state bifurcation.</div>
              </div>
            </div>
          </div>

          {/* Master Variables Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                  Harmonized Empirical Variables Specification
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-500">7 Core Climatological &amp; Agronomic Indicators</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Variable Name</th>
                    <th className="py-2.5 px-3 font-semibold">Symbol</th>
                    <th className="py-2.5 px-3 font-semibold">Domain</th>
                    <th className="py-2.5 px-3 font-semibold">Unit</th>
                    <th className="py-2.5 px-3 font-semibold">Temporal Aggregation</th>
                    <th className="py-2.5 px-4 font-semibold">Primary Official Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 font-mono text-[11px]">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900 font-sans text-xs">Oceanic Niño Index (Monsoon JJAS)</td>
                    <td className="py-2.5 px-3 text-teal-800 font-bold">ONI_JJAS</td>
                    <td className="py-2.5 px-3">Equatorial Pacific</td>
                    <td className="py-2.5 px-3">°C anomaly</td>
                    <td className="py-2.5 px-3">4-month mean (Jun–Sep)</td>
                    <td className="py-2.5 px-4 text-slate-600 font-sans">NOAA CPC (ERSST.v5)</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900 font-sans text-xs">Monsoon Rainfall Total</td>
                    <td className="py-2.5 px-3 text-teal-800 font-bold">Rain_JJAS</td>
                    <td className="py-2.5 px-3">Telangana Statewide</td>
                    <td className="py-2.5 px-3">mm</td>
                    <td className="py-2.5 px-3">Seasonal cumulative sum</td>
                    <td className="py-2.5 px-4 text-slate-600 font-sans">IMD 0.25° Gridded Rainfall</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900 font-sans text-xs">Rainfall Departure from Normal</td>
                    <td className="py-2.5 px-3 text-teal-800 font-bold">Rain_Dep%</td>
                    <td className="py-2.5 px-3">Telangana Statewide</td>
                    <td className="py-2.5 px-3">% vs LPA</td>
                    <td className="py-2.5 px-3">Percentage deviation</td>
                    <td className="py-2.5 px-4 text-slate-600 font-sans">IMD Pune / DES Telangana</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900 font-sans text-xs">Daytime Mean Max Temperature</td>
                    <td className="py-2.5 px-3 text-teal-800 font-bold">T_max</td>
                    <td className="py-2.5 px-3">Telangana Statewide</td>
                    <td className="py-2.5 px-3">°C</td>
                    <td className="py-2.5 px-3">Seasonal daytime average</td>
                    <td className="py-2.5 px-4 text-slate-600 font-sans">IMD 0.5° Gridded Temperature</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900 font-sans text-xs">Kharif Cotton Lint Yield</td>
                    <td className="py-2.5 px-3 text-teal-800 font-bold">Yield_Cotton</td>
                    <td className="py-2.5 px-3">Rainfed cash crop</td>
                    <td className="py-2.5 px-3">kg/ha</td>
                    <td className="py-2.5 px-3">Crop Year (Kharif harvest)</td>
                    <td className="py-2.5 px-4 text-slate-600 font-sans">DES Telangana / data.gov.in</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900 font-sans text-xs">Kharif Paddy Rice Yield</td>
                    <td className="py-2.5 px-3 text-teal-800 font-bold">Yield_Paddy</td>
                    <td className="py-2.5 px-3">Irrigated foodgrain</td>
                    <td className="py-2.5 px-3">kg/ha</td>
                    <td className="py-2.5 px-3">Crop Year (Kharif harvest)</td>
                    <td className="py-2.5 px-4 text-slate-600 font-sans">DES Telangana / Season &amp; Crop Reports</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900 font-sans text-xs">Kharif Maize Grain Yield</td>
                    <td className="py-2.5 px-3 text-teal-800 font-bold">Yield_Maize</td>
                    <td className="py-2.5 px-3">Coarse cereal crop</td>
                    <td className="py-2.5 px-3">kg/ha</td>
                    <td className="py-2.5 px-3">Crop Year (Kharif harvest)</td>
                    <td className="py-2.5 px-4 text-slate-600 font-sans">DES Telangana / data.gov.in</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: MATHEMATICAL FORMULATIONS & PREPROCESSING PIPELINE */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'variables') && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-700" />
              2. Data Preprocessing &amp; Mathematical Formulations
            </h3>
            <p className="text-xs text-slate-500">
              Rigorous formulas for ENSO phase categorization, anomaly normalization, crop yield detrending, and analytical time series.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. ENSO Classification */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-mono text-xs flex items-center justify-center font-bold">1</span>
                <h4 className="text-sm font-bold text-slate-900">ENSO Phase Classification (NOAA 3.4 Criteria)</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The Oceanic Niño Index is averaged across the 4 Southwest Monsoon months (June, July, August, September). Phase categorization strictly adheres to the NOAA Climate Prediction Center operational boundaries:
              </p>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 space-y-1">
                <div>• <strong>El Niño:</strong> ONI_JJAS &ge; +0.50 °C</div>
                <div>• <strong>Neutral:</strong> −0.50 °C &lt; ONI_JJAS &lt; +0.50 °C</div>
                <div>• <strong>La Niña:</strong> ONI_JJAS &le; −0.50 °C</div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Sub-classification: Weak (0.5 to 0.9°C), Moderate (1.0 to 1.4°C), Strong (1.5 to 1.9°C), Very Strong (&ge; 2.0°C).
              </p>
            </div>

            {/* 2. Rainfall Anomaly & Departure */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-mono text-xs flex items-center justify-center font-bold">2</span>
                <h4 className="text-sm font-bold text-slate-900">Rainfall Anomaly &amp; IMD Departure Percentage</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Precipitation departure percentage is standardized against the official 50-year Long Period Average (LPA = 750.5 mm for JJAS):
              </p>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 text-center">
                Dep% = ((R_observed − LPA) / LPA) × 100
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700 space-y-0.5">
                <div>• <strong>Deficient / Drought:</strong> Dep% &lt; −19%</div>
                <div>• <strong>Normal:</strong> −19% &le; Dep% &le; +19%</div>
                <div>• <strong>Excess / Surplus:</strong> Dep% &gt; +19%</div>
              </div>
            </div>

            {/* 3. Temperature Anomaly Calculation */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-mono text-xs flex items-center justify-center font-bold">3</span>
                <h4 className="text-sm font-bold text-slate-900">Temperature Anomaly Normalization</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mean maximum daytime temperature anomalies during June–September are computed relative to the 30-year climatological base reference period (1981–2010 normal mean = 33.20 °C):
              </p>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 text-center">
                T_anomaly,t = T_max,t − T_baseline_mean
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Standardized temperature z-scores are calculated as Z_T = (T_t − mean_T) / std_T to facilitate cross-variable econometric comparisons.
              </p>
            </div>

            {/* 4. Agricultural Yield Calculation & Detrending */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-mono text-xs flex items-center justify-center font-bold">4</span>
                <h4 className="text-sm font-bold text-slate-900">Crop Yield Technological Detrending Protocol</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Raw agricultural yields exhibit upward secular growth from technological innovations (Bt cotton, chemical fertilizers, tubewell expansion). To isolate pure meteorological shocks:
              </p>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 text-center space-y-1">
                <div>Y_actual(t) = beta_0 + beta_1 × t + epsilon_t</div>
                <div>Y_detrended(t) = (Y_actual(t) / Y_trend(t)) × Mean_Yield</div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                The detrended series preserves relative climate shocks while removing non-climatic agronomic technological drift.
              </p>
            </div>
          </div>

          {/* Analytical Methods Grid: Descriptive, Hypothesis Testing, Correlation, Regression, Time Series, Rolling Correlation */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <BarChart3 className="w-4 h-4 text-teal-700" />
              <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                Full Statistical Analytics Framework
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <strong className="text-slate-900 block font-sans">Descriptive Moments &amp; CIs:</strong>
                <p className="text-slate-600 leading-relaxed">
                  Computes sample mean, standard deviation, median, IQR, skewness, kurtosis, and analytical 95% Confidence Intervals using exact Student&apos;s t critical distributions.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <strong className="text-slate-900 block font-sans">Hypothesis Testing Suite:</strong>
                <p className="text-slate-600 leading-relaxed">
                  Evaluates 5 research hypotheses via Two-Sample Independent t-test, Welch&apos;s unequal variance t-test, and non-parametric Mann-Whitney U test at two-tailed alpha = 0.05.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <strong className="text-slate-900 block font-sans">Bivariate Correlation:</strong>
                <p className="text-slate-600 leading-relaxed">
                  Calculates Pearson product-moment (r) and Spearman rank (rho) correlation coefficients with Fisher&apos;s z-transformation for exact 95% confidence bands and Student&apos;s t significance.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <strong className="text-slate-900 block font-sans">OLS Econometric Regression:</strong>
                <p className="text-slate-600 leading-relaxed">
                  Multiple Ordinary Least Squares (OLS) with matrix Gaussian elimination, generating unstandardized slopes (beta), standard errors (SE), t-ratios, p-values, F-statistics, and R² / Adjusted R².
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <strong className="text-slate-900 block font-sans">Time-Series &amp; Mann-Kendall:</strong>
                <p className="text-slate-600 leading-relaxed">
                  Non-parametric Mann-Kendall test for monotonic trends with Sen&apos;s slope estimator, augmented with 5-year and 10-year trailing moving averages.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <strong className="text-slate-900 block font-sans">Rolling Window Correlation:</strong>
                <p className="text-slate-600 leading-relaxed">
                  11-year and 15-year sliding Pearson correlation windows to diagnose decadal stability and teleconnection breakdown (e.g. late 1990s and 2010s IOD modulations).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: STATISTICAL ASSUMPTIONS MATRIX */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'statistical_assumptions') && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <Scale className="w-4 h-4 text-teal-700" />
              3. Statistical Assumptions &amp; Diagnostic Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Rigorous academic exposition of formal parametric and non-parametric statistical assumptions, validation tests, and mitigation strategies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Student's t-test */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900 font-serif">1. Student&apos;s Two-Sample t-Test</h4>
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">Parametric Test</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li>• <strong>Continuous Scale:</strong> Dependent variable (e.g. rainfall mm) is measured on a continuous interval/ratio scale.</li>
                <li>• <strong>Independent Observations:</strong> Each annual crop season represents an independent climatic event across distinct years.</li>
                <li>• <strong>Normality:</strong> Data in each ENSO group are approximately normally distributed (verified via Shapiro-Wilk test).</li>
                <li>• <strong>Homogeneity of Variance:</strong> Homoscedasticity (equal group variances). When violated, the system automatically falls back to <em>Welch&apos;s t-test</em> with Satterthwaite degrees of freedom.</li>
              </ul>
            </div>

            {/* 2. One-Way ANOVA */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900 font-serif">2. One-Way ANOVA (3-Phase Comparison)</h4>
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">Parametric F-Test</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li>• <strong>Independence of Groups:</strong> El Niño, Neutral, and La Niña categories represent mutually exclusive meteorological regimes.</li>
                <li>• <strong>Residual Normality:</strong> Within-group residuals are normally distributed with zero mean.</li>
                <li>• <strong>Homogeneity of Variances:</strong> Equal group variances (Levene&apos;s test). When variances diverge, the non-parametric <em>Kruskal-Wallis H-test</em> is evaluated in parallel.</li>
              </ul>
            </div>

            {/* 3. Pearson Correlation */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900 font-serif">3. Pearson Product-Moment Correlation (r)</h4>
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">Linear Association</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li>• <strong>Linearity:</strong> Bivariate relationship between predictor (ONI) and response (Rainfall) is strictly linear.</li>
                <li>• <strong>Bivariate Normality:</strong> Observation pairs follow a bivariate normal distribution.</li>
                <li>• <strong>Absence of Extreme Outliers:</strong> Absence of severe anomalous points exerting disproportionate leverage (Cook&apos;s Distance &lt; 1.0).</li>
                <li>• <strong>Non-Parametric Fallback:</strong> Spearman rank correlation (rho) is computed concurrently to protect against monotonic non-linearities.</li>
              </ul>
            </div>

            {/* 4. Ordinary Least Squares (OLS) Regression */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900 font-serif">4. Ordinary Least Squares (OLS) Regression</h4>
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">Gauss-Markov</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li>• <strong>Linear in Parameters:</strong> Model specification Y = X*beta + epsilon is linear.</li>
                <li>• <strong>Zero Conditional Mean:</strong> E[epsilon | X] = 0 (no omitted variable bias in baseline teleconnection specification).</li>
                <li>• <strong>No Multicollinearity:</strong> Predictor matrix X has full column rank; Variance Inflation Factor (VIF) &lt; 5.0 for all covariates.</li>
                <li>• <strong>Spherical Errors:</strong> Homoscedasticity (constant error variance) and no serial autocorrelation.</li>
              </ul>
            </div>

            {/* 5. Mann-Kendall Trend Test */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900 font-serif">5. Mann-Kendall Trend Test</h4>
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">Non-Parametric</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li>• <strong>Distribution-Free:</strong> Does not require normality of the underlying hydroclimatic series.</li>
                <li>• <strong>Monotonicity:</strong> Tests for monotonic upward or downward temporal trajectories.</li>
                <li>• <strong>Serial Independence:</strong> Assumes observations are serially independent; lag-1 autocorrelation is verified to prevent false positive trend detection.</li>
              </ul>
            </div>

            {/* 6. Time-Series Analysis */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900 font-serif">6. Longitudinal Time-Series Analysis</h4>
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">Temporal Dynamics</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li>• <strong>Stationarity:</strong> Investigates weak stationarity (constant mean and autocovariance over time).</li>
                <li>• <strong>Uniform Sampling:</strong> Discrete annual time steps (dt = 1 year) without temporal gaps or irregular intervals.</li>
                <li>• <strong>Window Symmetry:</strong> Rolling window metrics (11-yr and 15-yr) preserve sufficient sample degrees of freedom (n_window − 2 &ge; 9).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: LIMITATIONS & REPRODUCIBILITY PROTOCOL */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'reproducibility') && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-teal-700" />
              4. Limitations &amp; Exact Scientific Reproducibility Protocol
            </h3>
            <p className="text-xs text-slate-500">
              Acknowledged methodological boundaries, potential confounding factors, and step-by-step reproduction instructions.
            </p>
          </div>

          {/* Academic Limitations Callout */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase font-mono tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              Explicit Academic Limitations &amp; Confounding Factors
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-slate-700">
              <div className="bg-white/80 p-3 rounded-lg border border-amber-200/80 space-y-1">
                <strong>1. Indian Ocean Dipole (+IOD / -IOD) Modulation:</strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Positive IOD events create warm sea surface anomalies in the western Indian Ocean, delivering compensatory moisture surges that can decouple Telangana rainfall from Pacific El Niño suppression (e.g. 1997 and 2019).
                </p>
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-amber-200/80 space-y-1">
                <strong>2. Synoptic Track Variability:</strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Bay of Bengal low-pressure systems (LPS) and depressions passing through the Godavari Basin can generate extreme episodic rainfall totals regardless of background equatorial Pacific Walker circulation anomalies.
                </p>
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-amber-200/80 space-y-1">
                <strong>3. Human Technological Confounders:</strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Expanding energized borewell irrigation, the Kaleshwaram Lift Irrigation Project, and Bt-cotton adoption post-2002 introduce upward structural trend shifts in agricultural yields that require econometric detrending.
                </p>
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-amber-200/80 space-y-1">
                <strong>4. Non-Causal Epistemology:</strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  All reported statistical models represent observational associations and empirical teleconnections. They must not be interpreted as deterministic monocausal drivers.
                </p>
              </div>
            </div>
          </div>

          {/* Exact Reproducibility Step-by-Step Guide */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Zap className="w-4 h-4 text-teal-700" />
              <h4 className="text-sm font-bold text-slate-900 font-serif">
                Complete Scientific Reproducibility Protocol
              </h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Every numerical statistic, p-value, regression slope, confidence interval, and chart rendered in this platform can be independently reproduced from the primary source datasets following this standardized 5-step computational pipeline:
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-slate-900 block font-sans">Acquire Primary Source Files:</strong>
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    Download NOAA ERSST.v5 ONI monthly records, IMD 0.25° gridded daily rainfall NetCDF/ASCII grids, and Telangana DES Season and Crop Reports for 1980–2026.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-slate-900 block font-sans">Spatial Masking &amp; Temporal Aggregation:</strong>
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    Clip gridded precipitation to the Telangana boundary (15.8°N–19.9°N, 77.2°E–81.8°E) and aggregate June 1 through September 30 daily values to calculate seasonal rainfall total (Rain_JJAS) and average ONI (ONI_JJAS).
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-slate-900 block font-sans">Anomaly Standardization:</strong>
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    Compute rainfall departures relative to the 50-year LPA (750.5 mm) and assign 3-phase ENSO categories based on ONI_JJAS &ge; +0.50 °C (El Niño), &le; −0.50 °C (La Niña), or intermediate (Neutral).
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">4</span>
                <div>
                  <strong className="text-slate-900 block font-sans">Execute Statistical Estimators:</strong>
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    Run bivariate Pearson correlation with Fisher z transform, two-sample Student&apos;s t / Welch&apos;s t, One-Way ANOVA, and multi-variable OLS regression via standard linear algebra inversion (X^T X)^(-1) X^T Y.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">5</span>
                <div>
                  <strong className="text-slate-900 block font-sans">Verify Export Artifact:</strong>
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    Download the standardized unified dataset CSV from the Data Sources page to verify identical row-level observation counts (N = 47) and matching summary moments.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
