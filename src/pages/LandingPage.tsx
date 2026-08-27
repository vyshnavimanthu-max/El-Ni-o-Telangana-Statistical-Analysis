import React from 'react';
import { 
  ArrowRight, 
  BookOpen, 
  Database, 
  Scale, 
  CloudRain, 
  Waves, 
  Thermometer, 
  Sprout, 
  MapPin,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { TabId } from '../components/Navigation';
import { ResearchDatasetState } from '../types/dataset';
import { TelanganaMapThumbnail } from '../components/TelanganaMapThumbnail';

interface LandingPageProps {
  onNavigate: (tab: TabId) => void;
  onOpenDatasetModal: () => void;
  datasetState: ResearchDatasetState;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenDatasetModal,
  datasetState
}) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-8 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700 font-medium font-mono">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              Climate & Agriculture Statistics • Climatological Econometrics
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-serif">
                EL NIÑO × TELANGANA
              </h1>
              <h2 className="text-lg sm:text-xl font-medium text-slate-700 mt-1">
                Statistical Analysis of ENSO, Monsoon Rainfall, Temperature and Agricultural Productivity
              </h2>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              An evidence-based statistical analysis of the relationship between ENSO conditions and climate and agricultural outcomes in Telangana, India.
            </p>

            {/* Research Question Banner */}
            <div className="p-4 bg-slate-50 border-l-4 border-teal-700 rounded-r-lg text-slate-800 text-xs sm:text-sm font-serif italic shadow-2xs">
              <span className="font-sans font-bold not-italic text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                Primary Research Question
              </span>
              &ldquo;To what extent are El Niño/ENSO conditions statistically associated with changes in Telangana&apos;s monsoon rainfall, temperature, and agricultural productivity?&rdquo;
            </div>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('overview')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Explore Analysis
                <ArrowRight className="w-4 h-4 text-teal-300" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('report')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-900 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-teal-300" />
                Research Monograph & Report
              </button>

              <button
                type="button"
                onClick={() => onNavigate('methodology')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-slate-500" />
                Methodology & Sources
              </button>

              <button
                type="button"
                onClick={onOpenDatasetModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs sm:text-sm font-semibold rounded-lg border border-teal-200 transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4 text-teal-700" />
                {datasetState.isOfficialDataLoaded ? 'Manage Ingested Data' : 'Connect Datasets'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 flex justify-center">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-xs max-w-[280px] w-full text-center">
              <div className="aspect-square w-full rounded-lg overflow-hidden border border-slate-200 bg-white p-2 mb-2 flex items-center justify-center shadow-2xs">
                <TelanganaMapThumbnail
                  className="w-full h-full object-contain"
                  alt="Telangana 33 Districts Administrative Map"
                  showLabels={true}
                />
              </div>
              <div className="text-[11px] font-mono text-slate-600 font-medium">
                Telangana 33 Districts Map
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Research Dimensions Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('enso')}
          className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 mb-3 group-hover:scale-105 transition-transform">
            <Waves className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-rose-700 transition-colors">
            1. ENSO Classification
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            NOAA CPC Oceanic Niño Index (ONI 3.4 SST anomaly) tracking warm, neutral, and cool phases across the equatorial Pacific.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('rainfall')}
          className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-md bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 mb-3 group-hover:scale-105 transition-transform">
            <CloudRain className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-sky-700 transition-colors">
            2. Monsoon Rainfall
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Southwest monsoon (June–September) cumulative precipitation, departure from 750.5 mm LPA, and dry spell analysis.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('temperature')}
          className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-3 group-hover:scale-105 transition-transform">
            <Thermometer className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-amber-700 transition-colors">
            3. Thermal Anomalies
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Maximum, minimum, and mean temperature departures during summer and monsoon seasons from IMD gridded series.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('agriculture')}
          className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-3 group-hover:scale-105 transition-transform">
            <Sprout className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">
            4. Crop Productivity
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Kharif and Rabi yield outcomes for major crops (Paddy, Cotton, Maize, Red Gram) with technology trend adjustment.
          </p>
        </div>
      </section>

      {/* Spatial & Statistical Scope Outline */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Core Statistical Investigation Framework
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Strict Non-Causal Epistemology</span>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>
              This research platform rigorously evaluates whether teleconnection signals from the Pacific Ocean (ENSO) demonstrate robust, statistically verifiable associations with agro-climatic dynamics in Telangana, a Deccan plateau state heavily reliant on the Southwest Monsoon.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <strong className="block text-slate-800 mb-1 font-sans">1. Correlation & Linear Regression</strong>
                <span>Calculates Pearson Product-Moment (r) and Spearman rank (ρ) coefficients alongside Ordinary Least Squares (OLS) regression models with exact two-tailed Student&apos;s t-test p-values.</span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <strong className="block text-slate-800 mb-1 font-sans">2. Stratified Phase ANOVA</strong>
                <span>Evaluates whether monsoon rainfall totals, thermal anomalies, and crop yields differ systematically across El Niño, Neutral, and La Niña classifications using Fisher&apos;s F-test.</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded text-amber-900">
              <strong className="block mb-0.5">Methodological Integrity Principle:</strong>
              Correlation does not equal direct causation. The system explicitly accounts for confounding variables such as the Indian Ocean Dipole (IOD), localized synoptic systems over the Bay of Bengal, and expanding canal irrigation in Telangana.
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-lg p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Telangana Spatial Domain
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Spatial coverage encompassing all <strong>33 Administrative Districts</strong> across 4 official Agro-Climatic Zones:
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400"></span> Northern Zone (LPA ~1045 mm)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span> Southern Zone (LPA ~785 mm)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Central Zone (LPA ~915 mm)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> High Altitude Tribal Zone
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('district')}
            className="w-full text-center py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
          >
            Launch Interactive District Map
          </button>
        </div>
      </section>
    </div>
  );
};
