import React from 'react';
import { 
  Compass, 
  Gauge, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  AlertOctagon, 
  Scale, 
  TrendingUp, 
  TrendingDown,
  Layers,
  LineChart as LineChartIcon
} from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { EvidenceRelationshipItem } from '../statistics/statisticalEvidenceEngine';

interface RelationshipInterpretationCardProps {
  item: EvidenceRelationshipItem;
  onClose?: () => void;
}

export const RelationshipInterpretationCard: React.FC<RelationshipInterpretationCardProps> = ({
  item,
  onClose
}) => {
  const { r, rho, olsSlope, olsIntercept, olsSeSlope, rSquared } = {
    r: item.estimate.pearsonR,
    rho: item.estimate.spearmanRho,
    olsSlope: item.estimate.olsSlope,
    olsIntercept: item.estimate.olsIntercept,
    olsSeSlope: item.estimate.olsSeSlope,
    rSquared: item.estimate.rSquared
  };

  const scatterData = item?.scatterData || [];
  const elNinoPoints = scatterData.filter(d => d.phase === 'EL_NINO');
  const neutralPoints = scatterData.filter(d => d.phase === 'NEUTRAL');
  const laNinaPoints = scatterData.filter(d => d.phase === 'LA_NINA');

  const xVals = scatterData.map(d => d.x);
  const xMin = xVals.length > 0 ? Math.min(...xVals) : -1;
  const xMax = xVals.length > 0 ? Math.max(...xVals) : 1;

  // Prepare fitted OLS regression line data points
  const regLineData = [
    { x: Number((xMin - 0.2).toFixed(2)), y: Number((olsIntercept + olsSlope * (xMin - 0.2)).toFixed(2)) },
    { x: 0, y: Number(olsIntercept.toFixed(2)) },
    { x: Number((xMax + 0.2).toFixed(2)), y: Number((olsIntercept + olsSlope * (xMax + 0.2)).toFixed(2)) }
  ];

  return (
    <div className="bg-white border-2 border-slate-300 rounded-xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 font-semibold">
              Deep Scientific Evidence Breakdown
            </span>
            <span className="text-xs text-slate-500 font-mono">
              N = {item.sampleSize} years (df = {item.degreesOfFreedom})
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 font-serif tracking-tight">
            {item.relationship}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-3 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 ${
            item.isStatisticallySignificant
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : 'bg-slate-100 text-slate-700 border border-slate-300'
          }`}>
            {item.isStatisticallySignificant ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{item.significanceLabel} (α = 0.05)</span>
          </span>
        </div>
      </div>

      {/* Grid: 6 Core Academic Interpretation Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Direction */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
            <Compass className="w-4 h-4 text-teal-700" />
            <span>1. Direction</span>
          </div>
          <div className="text-sm font-bold text-slate-900 font-serif">
            {r > 0 ? 'Positive Monotonic (+)' : r < 0 ? 'Inverse / Negative Teleconnection (−)' : 'Null / Zero Slope'}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {item.interpretation.direction}
          </p>
        </div>

        {/* 2. Strength */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
            <Gauge className="w-4 h-4 text-teal-700" />
            <span>2. Strength &amp; Effect Size</span>
          </div>
          <div className="text-sm font-bold text-slate-900 font-serif">
            {item.effectSize.magnitude} (R² = {(rSquared * 100).toFixed(1)}%)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {item.interpretation.strength}
          </p>
        </div>

        {/* 3. Uncertainty */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-purple-700" />
            <span>3. Uncertainty &amp; 95% CI</span>
          </div>
          <div className="text-sm font-bold text-slate-900 font-serif font-mono">
            95% CI: [{item.confidenceInterval95[0].toFixed(2)}, {item.confidenceInterval95[1].toFixed(2)}]
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {item.interpretation.uncertainty}
          </p>
        </div>

        {/* 4. Statistical Significance */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
            <Scale className="w-4 h-4 text-teal-700" />
            <span>4. Statistical Significance</span>
          </div>
          <div className="text-sm font-bold text-slate-900 font-serif font-mono">
            p = {item.pValue < 0.0001 ? '< 0.0001' : item.pValue.toFixed(4)} (t = {item.tStatistic.toFixed(2)})
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {item.interpretation.statisticalSignificance}
          </p>
        </div>

        {/* 5. Practical Meaning */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-amber-700" />
            <span>5. Practical Real-World Meaning</span>
          </div>
          <div className="text-sm font-bold text-slate-900 font-serif">
            {olsSlope > 0 ? `+${olsSlope.toFixed(2)}` : olsSlope.toFixed(2)} {item.responseUnit} per 1.0 {item.predictorUnit}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {item.interpretation.practicalMeaning}
          </p>
        </div>

        {/* 6. Limitations */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4 text-rose-700" />
            <span>6. Limitations &amp; Confounders</span>
          </div>
          <div className="text-sm font-bold text-slate-900 font-serif">
            Coupled Climate &amp; Non-Linear Noise
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {item.interpretation.limitations}
          </p>
        </div>
      </div>

      {/* Visual Empirical Verification: Scatter & OLS Fit Line */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <LineChartIcon className="w-4 h-4 text-slate-700" />
            <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
              Empirical Scatter &amp; Bivariate OLS Fit Line
            </h4>
          </div>
          {/* Phase Legend */}
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>El Niño</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
              <span>Neutral</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
              <span>La Niña</span>
            </div>
          </div>
        </div>

        <div className="h-64 min-h-[256px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name={item.predictorVar} 
                unit={item.predictorUnit ? ` ${item.predictorUnit}` : ''}
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: '#64748b' }}
                label={{ value: `${item.predictorVar}${item.predictorUnit ? ` (${item.predictorUnit})` : ''}`, position: 'bottom', offset: 5, fontSize: 11, fill: '#334155' }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name={item.responseVar} 
                unit={item.responseUnit ? ` ${item.responseUnit}` : ''}
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: '#64748b' }}
                label={{ value: `${item.responseVar}${item.responseUnit ? ` (${item.responseUnit})` : ''}`, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#334155' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    if (!data) return null;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded shadow-lg text-[11px] font-mono space-y-0.5 border border-slate-700">
                        {data.year && <div className="font-bold text-teal-300">{data.year} ({data.phase || 'Observed'})</div>}
                        <div>{item.predictorVar}: {typeof data.x === 'number' ? data.x.toFixed(2) : data.x} {item.predictorUnit}</div>
                        <div>{item.responseVar}: {typeof data.y === 'number' ? data.y.toFixed(2) : data.y} {item.responseUnit}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine x={0} stroke="#cbd5e1" strokeDasharray="2 2" />
              <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="2 2" />
              <Scatter name="El Niño" data={elNinoPoints} fill="#f43f5e" />
              <Scatter name="Neutral" data={neutralPoints} fill="#94a3b8" />
              <Scatter name="La Niña" data={laNinaPoints} fill="#0d9488" />
              {regLineData.length > 0 && (
                <Scatter 
                  name="Fitted OLS Trend" 
                  data={regLineData} 
                  line={{ stroke: '#1e293b', strokeWidth: 2 }} 
                  shape={() => null} 
                  isAnimationActive={false} 
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
          <div><strong>Fitted OLS Model:</strong> Y = {olsIntercept.toFixed(2)} + ({olsSlope.toFixed(2)} &times; X)</div>
          <div><strong>R²:</strong> {(rSquared * 100).toFixed(1)}%</div>
          <div><strong>SE(β₁):</strong> ±{olsSeSlope.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};
