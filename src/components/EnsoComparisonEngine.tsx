import React, { useState } from 'react';
import { GitCompare, CheckCircle, AlertTriangle, Scale, ArrowRight } from 'lucide-react';
import { MergedClimateCropRecord } from '../types/dataset';
import {
  calculatePhaseGroupComparisons,
  calculateAnovaAndKruskal,
  calculateIndependentTTest,
  calculateMannWhitneyUTest
} from '../statistics/engine';

interface EnsoComparisonEngineProps {
  data: MergedClimateCropRecord[];
}

type CompareVarKey =
  | 'rainfallJjasMm'
  | 'rainfallAnomalyPercent'
  | 'meanMaxTempC'
  | 'cottonYieldKgHa'
  | 'paddyYieldKgHa'
  | 'maizeYieldKgHa';

interface CompareVarOption {
  key: CompareVarKey;
  label: string;
  unit: string;
}

const COMPARE_OPTIONS: CompareVarOption[] = [
  { key: 'rainfallJjasMm', label: 'Southwest Monsoon Total Rainfall', unit: 'mm' },
  { key: 'rainfallAnomalyPercent', label: 'Monsoon Rainfall Departure / Anomaly', unit: '%' },
  { key: 'meanMaxTempC', label: 'Mean Maximum Temperature (T_max)', unit: '°C' },
  { key: 'cottonYieldKgHa', label: 'Kharif Cotton Lint Yield', unit: 'kg/ha' },
  { key: 'paddyYieldKgHa', label: 'Kharif Paddy Rice Yield', unit: 'kg/ha' },
  { key: 'maizeYieldKgHa', label: 'Kharif Maize Grain Yield', unit: 'kg/ha' },
];

export const EnsoComparisonEngine: React.FC<EnsoComparisonEngineProps> = ({ data }) => {
  const [selectedVar, setSelectedVar] = useState<CompareVarKey>('rainfallAnomalyPercent');
  const [twoGroupMode, setTwoGroupMode] = useState<'EL_NINO_VS_NON_EL_NINO' | 'EL_NINO_VS_LA_NINA'>('EL_NINO_VS_NON_EL_NINO');

  const currentOption = COMPARE_OPTIONS.find(o => o.key === selectedVar) || COMPARE_OPTIONS[0];

  // 1. Compute 3-Phase Group Summaries
  const phaseData = data.map(d => ({
    phase: d.ensoPhase,
    value: d[selectedVar] as number | null | undefined
  }));
  const phaseGroups = calculatePhaseGroupComparisons(phaseData);

  // 2. Compute Omnibus One-Way ANOVA & Kruskal-Wallis
  const anovaGroups = [
    { name: 'El Niño', values: data.filter(d => d.ensoPhase === 'EL_NINO').map(d => d[selectedVar] as number).filter(v => typeof v === 'number' && !isNaN(v)) },
    { name: 'Neutral', values: data.filter(d => d.ensoPhase === 'NEUTRAL').map(d => d[selectedVar] as number).filter(v => typeof v === 'number' && !isNaN(v)) },
    { name: 'La Niña', values: data.filter(d => d.ensoPhase === 'LA_NINA').map(d => d[selectedVar] as number).filter(v => typeof v === 'number' && !isNaN(v)) }
  ];
  const multiGroupResult = calculateAnovaAndKruskal(anovaGroups, 'ENSO Phase', currentOption.label);

  // 3. Compute Two-Group Hypothesis Test
  const elNinoVals = data.filter(d => d.ensoPhase === 'EL_NINO').map(d => d[selectedVar] as number).filter(v => typeof v === 'number' && !isNaN(v));
  const compVals = twoGroupMode === 'EL_NINO_VS_NON_EL_NINO'
    ? data.filter(d => d.ensoPhase !== 'EL_NINO').map(d => d[selectedVar] as number).filter(v => typeof v === 'number' && !isNaN(v))
    : data.filter(d => d.ensoPhase === 'LA_NINA').map(d => d[selectedVar] as number).filter(v => typeof v === 'number' && !isNaN(v));

  const compLabel = twoGroupMode === 'EL_NINO_VS_NON_EL_NINO' ? 'Non-El Niño (Neutral + La Niña)' : 'La Niña Years';

  const welchTTest = calculateIndependentTTest(elNinoVals, compVals, 'El Niño Years', compLabel, 0.05);
  const mannWhitneyTest = calculateMannWhitneyUTest(elNinoVals, compVals, 'El Niño Years', compLabel, 0.05);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-serif">
              ENSO Multi-Group Phase Comparison & Hypothesis Testing
            </h3>
            <p className="text-xs text-slate-500">
              Parametric One-Way ANOVA, Welch's t-test, and Non-Parametric Kruskal-Wallis & Mann-Whitney tests
            </p>
          </div>
        </div>

        {/* Variable Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="enso-comp-select" className="text-xs font-medium text-slate-600">
            Dependent Variable:
          </label>
          <select
            id="enso-comp-select"
            value={selectedVar}
            onChange={(e) => setSelectedVar(e.target.value as CompareVarKey)}
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
          >
            {COMPARE_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>
                {opt.label} ({opt.unit})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3-Phase Descriptive Statistics Matrix */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
          1. Three-Phase Climatological Descriptive Statistics Matrix (α = 0.05)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {phaseGroups.map(pg => {
            const isElNino = pg.phase === 'EL_NINO';
            const isLaNina = pg.phase === 'LA_NINA';
            const borderCol = isElNino ? 'border-amber-300 bg-amber-50/40' : isLaNina ? 'border-sky-300 bg-sky-50/40' : 'border-slate-300 bg-slate-50/60';
            const textCol = isElNino ? 'text-amber-900' : isLaNina ? 'text-sky-900' : 'text-slate-800';
            const badgeCol = isElNino ? 'bg-amber-100 text-amber-800' : isLaNina ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-700';

            return (
              <div key={pg.phase} className={`border rounded-lg p-4 space-y-3 ${borderCol}`}>
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className={`text-xs font-bold ${textCol}`}>{pg.displayName}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${badgeCol}`}>
                    N = {pg.sampleSize}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-mono">Mean (x̄)</span>
                    <span className="font-bold font-mono text-slate-900 text-sm">
                      {pg.mean !== null ? `${pg.mean > 0 ? '+' : ''}${pg.mean}` : '—'} {currentOption.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-mono">Median (Q2)</span>
                    <span className="font-bold font-mono text-slate-900 text-sm">
                      {pg.median !== null ? `${pg.median > 0 ? '+' : ''}${pg.median}` : '—'} {currentOption.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-mono">Std Dev (s)</span>
                    <span className="font-mono text-slate-700">{pg.standardDeviation ?? '—'} {currentOption.unit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-mono">Std Error (SE)</span>
                    <span className="font-mono text-slate-700">{pg.standardError ?? '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-mono">IQR [Q1, Q3]</span>
                    <span className="font-mono text-slate-700">
                      {pg.iqr !== null ? `${pg.iqr} [${pg.q1}, ${pg.q3}]` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-mono">Range [Min, Max]</span>
                    <span className="font-mono text-slate-700">[{pg.min ?? '—'}, {pg.max ?? '—'}]</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-500 block">95% Confidence Interval for Mean:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {pg.confidenceInterval95 ? `[${pg.confidenceInterval95[0]} ${currentOption.unit}, ${pg.confidenceInterval95[1]} ${currentOption.unit}]` : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Omnibus ANOVA & Kruskal-Wallis Section */}
      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
            2. Three-Group Omnibus Significance Tests: ANOVA vs Kruskal-Wallis
          </h4>
          <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
            Recommended Test: <strong className="text-teal-800">{multiGroupResult.recommendedTest}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* One-Way ANOVA Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 font-serif">One-Way ANOVA (Parametric F-Test)</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                multiGroupResult.anova.isSignificant ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {multiGroupResult.anova.decision === 'REJECT_NULL' ? 'Reject H₀ (p < 0.05)' : 'Fail to Reject H₀'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">F-Statistic</span>
                <span className="font-bold text-slate-900">{multiGroupResult.anova.fStatistic ?? '—'}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">p-Value</span>
                <span className={`font-bold ${multiGroupResult.anova.isSignificant ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {multiGroupResult.anova.pValue ?? '—'}
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">df (Between, Within)</span>
                <span className="text-slate-800">({multiGroupResult.anova.dfBetween}, {multiGroupResult.anova.dfWithin})</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Effect Size (η²)</span>
                <span className="font-bold text-teal-800">
                  {multiGroupResult.anova.etaSquared !== null ? `${(multiGroupResult.anova.etaSquared * 100).toFixed(1)}%` : '—'}
                </span>
              </div>
            </div>

            {/* Tukey Post-Hoc Comparisons */}
            {multiGroupResult.anova.postHocTukey.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-bold text-slate-700 block mb-1">Tukey HSD Post-Hoc Pairwise Tests:</span>
                <div className="space-y-1 font-mono text-[11px]">
                  {multiGroupResult.anova.postHocTukey.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded">
                      <span className="text-slate-800">{t.groupA} vs {t.groupB}</span>
                      <span className="text-slate-600">Δ = {t.meanDiff > 0 ? '+' : ''}{t.meanDiff} {currentOption.unit}</span>
                      <span className={t.isSignificant ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                        p = {t.pValue.toFixed(3)} {t.isSignificant ? '★' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Kruskal-Wallis Non-Parametric Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 font-serif">Kruskal-Wallis H-Test (Non-Parametric)</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                multiGroupResult.kruskalWallis.isSignificant ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {multiGroupResult.kruskalWallis.decision === 'REJECT_NULL' ? 'Reject H₀ (p < 0.05)' : 'Fail to Reject H₀'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">H-Statistic</span>
                <span className="font-bold text-slate-900">{multiGroupResult.kruskalWallis.hStatistic ?? '—'}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">p-Value (χ²)</span>
                <span className={`font-bold ${multiGroupResult.kruskalWallis.isSignificant ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {multiGroupResult.kruskalWallis.pValue ?? '—'}
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">df</span>
                <span className="text-slate-800">{multiGroupResult.kruskalWallis.degreesOfFreedom}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Effect Size (ε²)</span>
                <span className="font-bold text-teal-800">
                  {multiGroupResult.kruskalWallis.epsilonSquared !== null ? `${(multiGroupResult.kruskalWallis.epsilonSquared * 100).toFixed(1)}%` : '—'}
                </span>
              </div>
            </div>

            {/* Assumptions Diagnostics */}
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] space-y-1">
              <span className="font-bold text-slate-700 block">Model Diagnostics & Assumptions:</span>
              <div className="flex items-center gap-1.5 text-slate-600">
                {multiGroupResult.assumptions.normalityShapiroOrJB.isNormal ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                )}
                <span>{multiGroupResult.assumptions.normalityShapiroOrJB.details}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                {multiGroupResult.assumptions.homogeneityLevene.isHomogeneous ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                )}
                <span>{multiGroupResult.assumptions.homogeneityLevene.details}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Group Targeted Hypothesis Testing Suite */}
      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              3. Two-Group Hypothesis Testing (Welch's t-Test & Mann-Whitney U)
            </h4>
            <p className="text-xs text-slate-500 font-mono">
              H₀: μ_ElNino = μ_Comparison vs H₁: μ_ElNino ≠ μ_Comparison (α = 0.05)
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setTwoGroupMode('EL_NINO_VS_NON_EL_NINO')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                twoGroupMode === 'EL_NINO_VS_NON_EL_NINO' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              El Niño vs Non-El Niño
            </button>
            <button
              type="button"
              onClick={() => setTwoGroupMode('EL_NINO_VS_LA_NINA')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                twoGroupMode === 'EL_NINO_VS_LA_NINA' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              El Niño vs La Niña
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Welch's t-Test */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 font-serif">{welchTTest.testName} (Parametric)</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                welchTTest.decision === 'REJECT_NULL' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {welchTTest.decision === 'REJECT_NULL' ? 'Reject H₀ (p < 0.05)' : 'Fail to Reject H₀'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">t-Statistic</span>
                <span className="font-bold text-slate-900">{welchTTest.testStatisticValue ?? '—'}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">p-Value</span>
                <span className={`font-bold ${welchTTest.pValue !== null && welchTTest.pValue < 0.05 ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {welchTTest.pValue ?? '—'}
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">df (Welch)</span>
                <span className="text-slate-800">{welchTTest.degreesOfFreedom ?? '—'}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Cohen's d</span>
                <span className="font-bold text-teal-800">{welchTTest.effectSizeValue ?? '—'} ({welchTTest.effectSizeInterpretation})</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 pt-1">
              <span className="font-medium text-slate-800">Mean Difference (Δ): </span>
              <span className="font-mono font-bold text-slate-900">{welchTTest.meanDifference ?? '—'} {currentOption.unit}</span>
              {welchTTest.confidenceInterval95Diff && (
                <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                  95% CI of Difference: [{welchTTest.confidenceInterval95Diff[0]} {currentOption.unit}, {welchTTest.confidenceInterval95Diff[1]} {currentOption.unit}]
                </span>
              )}
            </div>
          </div>

          {/* Mann-Whitney U Test */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 font-serif">{mannWhitneyTest.testName} (Non-Parametric)</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                mannWhitneyTest.decision === 'REJECT_NULL' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {mannWhitneyTest.decision === 'REJECT_NULL' ? 'Reject H₀ (p < 0.05)' : 'Fail to Reject H₀'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Mann-Whitney U</span>
                <span className="font-bold text-slate-900">{mannWhitneyTest.testStatisticValue ?? '—'}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">p-Value (Two-Tailed)</span>
                <span className={`font-bold ${mannWhitneyTest.pValue !== null && mannWhitneyTest.pValue < 0.05 ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {mannWhitneyTest.pValue ?? '—'}
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Sample Sizes</span>
                <span className="text-slate-800">n₁={mannWhitneyTest.sampleSize1}, n₂={mannWhitneyTest.sampleSize2}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Rank-Biserial r</span>
                <span className="font-bold text-teal-800">{mannWhitneyTest.effectSizeValue ?? '—'} ({mannWhitneyTest.effectSizeInterpretation})</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 pt-1">
              <span className="text-[11px] text-slate-500 font-mono block">
                Rank-sum distribution metric evaluates non-Gaussian median shifts across historical observations without normality prerequisites.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Programmatic Scientific Synthesis */}
      <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-lg text-xs text-teal-950 space-y-1">
        <strong className="block font-sans text-teal-900 font-bold">
          Empirical Synthesis & Epistemological Interpretation:
        </strong>
        <p className="leading-relaxed">
          {multiGroupResult.interpretation}
        </p>
      </div>
    </div>
  );
};
