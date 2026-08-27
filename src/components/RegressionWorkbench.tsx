import React, { useState } from 'react';
import { TrendingUp, Layers, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { MergedClimateCropRecord } from '../types/dataset';
import { calculateMultipleLinearRegression, calculateLinearRegression } from '../statistics/engine';

interface RegressionWorkbenchProps {
  data: MergedClimateCropRecord[];
}

type ModelPreset = 
  | 'rain_on_oni'
  | 'temp_on_oni'
  | 'cotton_multivariate'
  | 'paddy_multivariate'
  | 'maize_multivariate'
  | 'cotton_simple'
  | 'paddy_simple';

interface ModelConfig {
  id: ModelPreset;
  title: string;
  depVar: string;
  depKey: keyof MergedClimateCropRecord;
  predictors: { name: string; key: keyof MergedClimateCropRecord }[];
  description: string;
}

const MODEL_CONFIGS: ModelConfig[] = [
  {
    id: 'rain_on_oni',
    title: 'Model 1: Rainfall Anomaly ~ ONI JJAS',
    depVar: 'Monsoon Rainfall Departure (%)',
    depKey: 'rainfallAnomalyPercent',
    predictors: [
      { name: 'ONI JJAS (°C)', key: 'oniJjas' }
    ],
    description: 'Simple OLS regression estimating the linear sensitivity of Telangana monsoon precipitation departure to Pacific sea surface temperature anomalies.'
  },
  {
    id: 'temp_on_oni',
    title: 'Model 2: Max Temperature ~ ONI JJAS',
    depVar: 'Mean Maximum Temperature (°C)',
    depKey: 'meanMaxTempC',
    predictors: [
      { name: 'ONI JJAS (°C)', key: 'oniJjas' }
    ],
    description: 'Simple OLS regression evaluating daytime surface thermal anomalies in response to Pacific ENSO warming.'
  },
  {
    id: 'cotton_multivariate',
    title: 'Model 3: Cotton Yield ~ ONI + Rainfall + Temperature',
    depVar: 'Cotton Productivity (kg/ha)',
    depKey: 'cottonYieldKgHa',
    predictors: [
      { name: 'ONI JJAS (°C)', key: 'oniJjas' },
      { name: 'Monsoon Rainfall (mm)', key: 'rainfallJjasMm' },
      { name: 'Mean Max Temp (°C)', key: 'meanMaxTempC' }
    ],
    description: 'Multiple OLS regression isolating independent Pacific teleconnection and local hydroclimatic drivers of rainfed cotton productivity.'
  },
  {
    id: 'paddy_multivariate',
    title: 'Model 4: Paddy Yield ~ ONI + Rainfall + Temperature',
    depVar: 'Paddy / Rice Productivity (kg/ha)',
    depKey: 'paddyYieldKgHa',
    predictors: [
      { name: 'ONI JJAS (°C)', key: 'oniJjas' },
      { name: 'Monsoon Rainfall (mm)', key: 'rainfallJjasMm' },
      { name: 'Mean Max Temp (°C)', key: 'meanMaxTempC' }
    ],
    description: 'Multiple OLS regression evaluating irrigated paddy resilience under concurrent Pacific SST and local rainfall variations.'
  },
  {
    id: 'maize_multivariate',
    title: 'Model 5: Maize Yield ~ ONI + Rainfall + Temperature',
    depVar: 'Maize Productivity (kg/ha)',
    depKey: 'maizeYieldKgHa',
    predictors: [
      { name: 'ONI JJAS (°C)', key: 'oniJjas' },
      { name: 'Monsoon Rainfall (mm)', key: 'rainfallJjasMm' },
      { name: 'Mean Max Temp (°C)', key: 'meanMaxTempC' }
    ],
    description: 'Multiple OLS regression modeling rainfed cereal crop productivity response.'
  }
];

export const RegressionWorkbench: React.FC<RegressionWorkbenchProps> = ({ data }) => {
  const [selectedPreset, setSelectedPreset] = useState<ModelPreset>('cotton_multivariate');

  const config = MODEL_CONFIGS.find(m => m.id === selectedPreset) || MODEL_CONFIGS[0];

  const depSeries = data.map(d => d[config.depKey] as number | null | undefined);
  const indepSeries = config.predictors.map(p => ({
    name: p.name,
    values: data.map(d => d[p.key] as number | null | undefined)
  }));

  const regResult = calculateMultipleLinearRegression(depSeries, indepSeries, config.depVar);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 text-purple-700 rounded-md border border-purple-200">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-serif">
              Ordinary Least Squares (OLS) Econometric Regression Suite
            </h3>
            <p className="text-xs text-slate-500">
              Multiple & simple linear models with coefficient standard errors, t-tests, ANOVA F-tests, and full econometric diagnostics
            </p>
          </div>
        </div>

        {/* Model Preset Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="reg-model-select" className="text-xs font-medium text-slate-600">
            Select Model:
          </label>
          <select
            id="reg-model-select"
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value as ModelPreset)}
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
          >
            {MODEL_CONFIGS.map(m => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
        <strong className="text-slate-900 font-mono block mb-0.5">Model Specification:</strong>
        <span>{config.description}</span>
      </div>

      {/* Model Summary Metrics Top Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] text-slate-400 block uppercase">R-Squared (R²)</span>
          <span className="text-base font-bold text-purple-900">
            {regResult.rSquared !== null ? `${(regResult.rSquared * 100).toFixed(1)}%` : '—'}
          </span>
          <span className="text-[10px] text-slate-400 block">Variance Explained</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] text-slate-400 block uppercase">Adjusted R²</span>
          <span className="text-base font-bold text-slate-900">
            {regResult.adjustedRSquared !== null ? `${(regResult.adjustedRSquared * 100).toFixed(1)}%` : '—'}
          </span>
          <span className="text-[10px] text-slate-400 block">Penalized for k vars</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] text-slate-400 block uppercase">Model F-Statistic</span>
          <span className="text-base font-bold text-slate-900">{regResult.fStatistic ?? '—'}</span>
          <span className="text-[10px] text-slate-400 block">F({regResult.dfModel}, {regResult.dfResidual})</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] text-slate-400 block uppercase">p-Value (Model)</span>
          <span className={`text-base font-bold ${regResult.pValueOfModel !== null && regResult.pValueOfModel < 0.05 ? 'text-emerald-700' : 'text-slate-700'}`}>
            {regResult.pValueOfModel !== null ? regResult.pValueOfModel : '—'}
          </span>
          <span className="text-[10px] text-slate-400 block">Omnibus test</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] text-slate-400 block uppercase">RMSE</span>
          <span className="text-base font-bold text-slate-900">{regResult.rmse ?? '—'}</span>
          <span className="text-[10px] text-slate-400 block">Root Mean Sq Error</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] text-slate-400 block uppercase">Sample Size (N)</span>
          <span className="text-base font-bold text-slate-900">N = {regResult.sampleSize}</span>
          <span className="text-[10px] text-slate-400 block">df_res = {regResult.dfResidual}</span>
        </div>
      </div>

      {/* Regression Coefficients Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
          Estimated Parameter Coefficients & Inference (α = 0.05)
        </h4>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Parameter / Predictor</th>
                <th className="py-2.5 px-3">Estimate (β̂)</th>
                <th className="py-2.5 px-3">Std Error (SE)</th>
                <th className="py-2.5 px-3">t-Statistic</th>
                <th className="py-2.5 px-3">p-Value</th>
                <th className="py-2.5 px-3">95% Confidence Interval</th>
                <th className="py-2.5 px-3">VIF</th>
                <th className="py-2.5 px-3">Significance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {regResult.coefficients.map((coef, idx) => {
                const isSig = coef.pValue < 0.05;
                return (
                  <tr key={idx} className={isSig ? 'bg-emerald-50/20' : ''}>
                    <td className="py-2 px-3 font-semibold text-slate-900 font-sans">{coef.name}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{coef.estimateBeta > 0 ? `+${coef.estimateBeta}` : coef.estimateBeta}</td>
                    <td className="py-2 px-3 text-slate-600">{coef.standardError}</td>
                    <td className="py-2 px-3 text-slate-800">{coef.tStatistic}</td>
                    <td className={`py-2 px-3 font-bold ${isSig ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {coef.pValue.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 text-slate-600">[{coef.ci95Low}, {coef.ci95High}]</td>
                    <td className="py-2 px-3 text-slate-600">{coef.vif !== null && coef.vif !== undefined ? coef.vif : '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        isSig ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isSig ? 'Significant (p < 0.05)' : 'p ≥ 0.05'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Diagnostics Grid */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
          Econometric Model Diagnostics & Gauss-Markov Assumption Verification
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Autocorrelation (Durbin-Watson) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="font-bold text-slate-900 block font-sans">1. Durbin-Watson Autocorrelation:</span>
            <div className="font-mono text-slate-800">
              d = <strong className="text-purple-900">{regResult.diagnostics.durbinWatson.statistic ?? '—'}</strong>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {regResult.diagnostics.durbinWatson.interpretation}
            </p>
          </div>

          {/* Residual Normality (Jarque-Bera) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="font-bold text-slate-900 block font-sans">2. Residual Normality (Jarque-Bera):</span>
            <div className="font-mono text-slate-800">
              JB = <strong>{regResult.diagnostics.residualNormality.jarqueBeraStat ?? '—'}</strong> (p = {regResult.diagnostics.residualNormality.pValue ?? '—'})
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              {regResult.diagnostics.residualNormality.isNormal ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              )}
              <span>{regResult.diagnostics.residualNormality.interpretation}</span>
            </div>
          </div>

          {/* Heteroscedasticity (Breusch-Pagan) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="font-bold text-slate-900 block font-sans">3. Heteroscedasticity (Breusch-Pagan):</span>
            <div className="font-mono text-slate-800">
              LM = <strong>{regResult.diagnostics.heteroscedasticityBreuschPagan.lmStatistic ?? '—'}</strong> (p = {regResult.diagnostics.heteroscedasticityBreuschPagan.pValue ?? '—'})
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              {regResult.diagnostics.heteroscedasticityBreuschPagan.isHomoscedastic ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              )}
              <span>{regResult.diagnostics.heteroscedasticityBreuschPagan.interpretation}</span>
            </div>
          </div>

          {/* Multicollinearity (VIF) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="font-bold text-slate-900 block font-sans">4. Multicollinearity (VIF):</span>
            {regResult.diagnostics.multicollinearityVif ? (
              <div className="space-y-0.5 font-mono text-[11px]">
                {regResult.diagnostics.multicollinearityVif.map((v, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-slate-600">{v.variable}:</span>
                    <span className={v.isAcceptable ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                      {v.vif} {v.isAcceptable ? '(OK)' : '(High)'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-slate-400 font-mono text-[11px]">Simple regression (single predictor).</span>
            )}
          </div>
        </div>
      </div>

      {/* Programmatic Academic Interpretation & Limitations */}
      <div className="space-y-3 pt-2">
        <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-lg text-xs text-purple-950 space-y-1">
          <strong className="block font-sans font-bold text-purple-900">
            Econometric Interpretation:
          </strong>
          <p className="leading-relaxed">
            {regResult.interpretation}
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
          <strong className="text-slate-800 block mb-0.5">Model Limitations & Epistemological Boundaries:</strong>
          <span>{regResult.limitations}</span>
        </div>
      </div>
    </div>
  );
};
