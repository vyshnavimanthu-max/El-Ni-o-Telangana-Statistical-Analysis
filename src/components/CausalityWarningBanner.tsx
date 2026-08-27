import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  GitBranch, 
  Compass,
  Cpu,
  Layers
} from 'lucide-react';

export const CausalityWarningBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-amber-50/80 border-2 border-amber-300/80 rounded-xl p-5 shadow-xs space-y-3">
      {/* Prominent Visible Warning Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 bg-amber-500 text-white rounded-lg shadow-2xs shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-900">
              Fundamental Academic Directive & Methodological Warning
            </div>
            <div className="text-base sm:text-lg font-black text-amber-950 font-serif tracking-tight mt-0.5">
              &ldquo;Statistical association does not by itself establish causation.&rdquo;
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold font-mono transition-colors self-start sm:self-center cursor-pointer"
        >
          <span>{isExpanded ? 'Hide Epistemological Framework' : 'View Causal Inference Framework'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <p className="text-xs text-amber-900/90 leading-relaxed">
        Observed statistical associations (e.g., negative correlation between Pacific ONI and Telangana Southwest Monsoon precipitation, or temperature correlations with crop yields) represent empirical empirical teleconnections. In complex coupled climate-agronomic systems, correlation can be modulated, suppressed, or magnified by unmodeled regional confounders, intermediate synoptic mechanics, and human policy adaptations.
      </p>

      {/* Expanded Causal Inference & Confounder Breakdown */}
      {isExpanded && (
        <div className="pt-3 border-t border-amber-200 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          <div className="bg-white/90 p-3 rounded-lg border border-amber-200/70 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-950 font-sans">
              <GitBranch className="w-3.5 h-3.5 text-amber-700" />
              1. Confounding Oceanic Dipoles
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Concurrent <strong>Positive Indian Ocean Dipole (+IOD)</strong> events generate anomalous warm SSTs in the western Arabian Sea, inducing moisture surges that frequently mitigate or completely offset Pacific El Niño suppression in Telangana (e.g. 1997 & 2019).
            </p>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-amber-200/70 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-950 font-sans">
              <Compass className="w-3.5 h-3.5 text-amber-700" />
              2. Synoptic Track Variability
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Monsoon low-pressure systems (LPS) forming over the <strong>Head Bay of Bengal</strong> and tracking west-northwest through the Godavari Basin can yield extreme precipitation totals regardless of background equatorial Pacific Walker circulation strength.
            </p>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-amber-200/70 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-950 font-sans">
              <Cpu className="w-3.5 h-3.5 text-amber-700" />
              3. Agronomic Technology Shocks
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              The introduction of <strong>genetically modified Bt cotton (2002+)</strong>, subsidized electricity for borewells, and major lift irrigation projects (Kaleshwaram) create secular upward shifts in crop productivity that decouple yield from pure rainfall anomalies.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
