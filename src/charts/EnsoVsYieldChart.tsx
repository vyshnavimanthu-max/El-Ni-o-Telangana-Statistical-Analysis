import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine
} from 'recharts';
import { MergedClimateRecord } from '../types/dataset';
import {
  calculatePhaseSummaryStats,
  calculatePearsonCorrelation,
  calculateSpearmanCorrelation,
  calculateLinearRegression,
  calculateMean
} from '../statistics/engine';
import { EmptyState } from '../components/EmptyState';
import { SourceBadge } from '../components/SourceBadge';

interface EnsoVsYieldChartProps {
  data: MergedClimateRecord[];
  onConnectClick?: () => void;
  className?: string;
}

type CropKey = 'paddy' | 'cotton' | 'maize' | 'red_gram' | 'soyabean' | 'multi_crop';

export const EnsoVsYieldChart: React.FC<EnsoVsYieldChartProps> = ({
  data,
  onConnectClick,
  className = ''
}) => {
  const [selectedCrop, setSelectedCrop] = useState<CropKey>('paddy');
  const [viewFormat, setViewFormat] = useState<'SCATTER_OLS' | 'PHASE_BARS'>('SCATTER_OLS');

  const getCropField = (crop: CropKey): keyof MergedClimateRecord => {
    switch (crop) {
      case 'paddy': return 'paddyYieldKgHa';
      case 'cotton': return 'cottonYieldKgHa';
      case 'maize': return 'maizeYieldKgHa';
      case 'red_gram': return 'redGramYieldKgHa';
      case 'soyabean': return 'soyabeanYieldKgHa';
      default: return 'paddyYieldKgHa';
    }
  };

  const getCropName = (crop: CropKey): string => {
    switch (crop) {
      case 'paddy': return 'Paddy (Rice)';
      case 'cotton': return 'Cotton Lint';
      case 'maize': return 'Maize';
      case 'red_gram': return 'Red Gram (Tur)';
      case 'soyabean': return 'Soyabean';
      case 'multi_crop': return '5 Kharif Crop Matrix';
    }
  };

  const validData = useMemo(() => {
    return data.filter(d => d.ensoPhase !== null && d.oniJjas !== null);
  }, [data]);

  const cropKey = getCropField(selectedCrop);
  const cropTitle = getCropName(selectedCrop);

  // Filter for individual crop data
  const cropPairedData = useMemo(() => {
    return validData
      .map(d => ({
        year: d.year,
        oni: d.oniJjas!,
        yield: d[cropKey] as number | null,
        phase: d.ensoPhase!
      }))
      .filter((d): d is { year: number; oni: number; yield: number; phase: 'EL_NINO' | 'NEUTRAL' | 'LA_NINA' } => d.yield !== null);
  }, [validData, cropKey]);

  // Statistics for crop
  const stats = useMemo(() => {
    if (cropPairedData.length < 3) return null;
    const x = cropPairedData.map(d => d.oni);
    const y = cropPairedData.map(d => d.yield);
    const corr = calculatePearsonCorrelation(x, y, 'ONI', `${cropTitle} Yield`);
    const spearman = calculateSpearmanCorrelation(x, y, 'ONI', `${cropTitle} Yield`);
    const reg = calculateLinearRegression(x, y, `${cropTitle} Yield`, 'ONI');
    return { corr, spearman, reg, x, y };
  }, [cropPairedData, cropTitle]);

  if (!data || validData.length < 3) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Agricultural Yield Sensitivity vs Oceanic Niño Index (Kharif Season)
            </h3>
            <p className="text-xs text-slate-500">
              Evaluating crop yield responses across ENSO phases
            </p>
          </div>
        </div>
        <EmptyState
          title="Awaiting DES Agricultural Yield Dataset"
          message="Connect official Directorate of Economics and Statistics Telangana crop production data to compute yield distributions across ENSO phases."
          sourceAuthority="DES Telangana (Season & Crop Reports)"
          requiredSchema={['Year', 'Crop_ID', 'Season', 'Yield_Kg_Per_Hectare', 'Acreage']}
          onConnectClick={onConnectClick}
        />
        <div className="mt-3">
          <SourceBadge
            source="Directorate of Economics and Statistics (DES), Telangana"
            period="Awaiting connection"
            units="kg / hectare"
            observationCount={null}
          />
        </div>
      </div>
    );
  }

  // Multi-crop comparison data
  if (selectedCrop === 'multi_crop') {
    const phases = ['EL_NINO', 'NEUTRAL', 'LA_NINA'] as const;
    const multiCropData = phases.map(phase => {
      const pData = validData.filter(d => d.ensoPhase === phase);
      const avg = (arr: (number | null | undefined)[]) => {
        const valid = arr.filter((v): v is number => v !== null && v !== undefined);
        return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
      };

      return {
        phaseName: phase === 'EL_NINO' ? 'El Niño (Warm)' : phase === 'NEUTRAL' ? 'Neutral (Normal)' : 'La Niña (Cool)',
        phase,
        Paddy: avg(pData.map(d => d.paddyYieldKgHa)),
        Cotton: avg(pData.map(d => d.cottonYieldKgHa)),
        Maize: avg(pData.map(d => d.maizeYieldKgHa)),
        RedGram: avg(pData.map(d => d.redGramYieldKgHa)),
        Soyabean: avg(pData.map(d => d.soyabeanYieldKgHa)),
        count: pData.length
      };
    });

    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 uppercase">
                Agronomic Resilience
              </span>
              <span className="text-xs text-slate-500 font-mono">DES Telangana Official Statistics</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Multi-Crop Yield Sensitivity Stratified by ENSO Phase
            </h3>
            <p className="text-xs text-slate-500">
              Mean Kharif Yield (kg/ha) across Paddy, Cotton, Maize, Red Gram, and Soyabean
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-md">
            {[
              { id: 'paddy', label: 'Paddy' },
              { id: 'cotton', label: 'Cotton' },
              { id: 'maize', label: 'Maize' },
              { id: 'red_gram', label: 'Red Gram' },
              { id: 'soyabean', label: 'Soyabean' },
              { id: 'multi_crop', label: 'All 5 Crops' }
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCrop(c.id as any)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-all cursor-pointer ${
                  selectedCrop === c.id
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={multiCropData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="phaseName" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${v} kg/ha`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '12px', color: '#fff' }}
                formatter={(val: any, name: any) => [`${val} kg/ha`, name]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Bar dataKey="Paddy" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Maize" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Soyabean" fill="#06b6d4" radius={[3, 3, 0, 0]} />
              <Bar dataKey="RedGram" name="Red Gram" fill="#ec4899" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Cotton" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-800">Crop Sensitivity Assessment:</strong> Rainfed cultivars such as <strong>Cotton, Maize, and Red Gram</strong> exhibit higher yield volatility during El Niño deficit years compared to <strong>Paddy</strong>, which benefits from extensive surface canal networks, borewell irrigation, and Mission Kakatiya tank rejuvenation programs that buffer acute monsoon shortfalls.
        </div>

        <div className="pt-1">
          <SourceBadge
            source="Directorate of Economics & Statistics (DES), Telangana"
            period="1971 – 2026"
            units="kg / hectare"
            observationCount={validData.length}
          />
        </div>
      </div>
    );
  }

  // Phase distribution stats for single crop
  const phaseStats = calculatePhaseSummaryStats(
    cropPairedData.map(d => ({ phase: d.phase, value: d.yield }))
  );

  const phaseChartData = [
    {
      phaseName: 'El Niño Phase (Warm)',
      phase: 'EL_NINO',
      meanYield: phaseStats.find(s => s.phase === 'EL_NINO')?.mean || 0,
      count: phaseStats.find(s => s.phase === 'EL_NINO')?.count || 0,
      stdDev: phaseStats.find(s => s.phase === 'EL_NINO')?.standardDeviation || 0,
      color: '#e11d48'
    },
    {
      phaseName: 'Neutral Phase',
      phase: 'NEUTRAL',
      meanYield: phaseStats.find(s => s.phase === 'NEUTRAL')?.mean || 0,
      count: phaseStats.find(s => s.phase === 'NEUTRAL')?.count || 0,
      stdDev: phaseStats.find(s => s.phase === 'NEUTRAL')?.standardDeviation || 0,
      color: '#64748b'
    },
    {
      phaseName: 'La Niña Phase (Cool)',
      phase: 'LA_NINA',
      meanYield: phaseStats.find(s => s.phase === 'LA_NINA')?.mean || 0,
      count: phaseStats.find(s => s.phase === 'LA_NINA')?.count || 0,
      stdDev: phaseStats.find(s => s.phase === 'LA_NINA')?.standardDeviation || 0,
      color: '#0284c7'
    }
  ];

  const scatterPoints = cropPairedData.map(d => ({
    year: d.year,
    x: d.oni,
    y: d.yield,
    phase: d.phase,
    fillColor: d.phase === 'EL_NINO' ? '#e11d48' : d.phase === 'LA_NINA' ? '#0284c7' : '#64748b'
  }));

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 uppercase">
              Agronomic Statistical Response
            </span>
            <span className="text-xs text-slate-500 font-mono">Sample N = {cropPairedData.length} records</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            {cropTitle} Productivity vs Oceanic Niño Index
          </h3>
          <p className="text-xs text-slate-500">
            Assessing Kharif productivity sensitivity, regression slope, and inter-phase yield distributions
          </p>
        </div>

        {/* Crop Selector & View Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-md text-xs">
            {[
              { id: 'paddy', label: 'Paddy' },
              { id: 'cotton', label: 'Cotton' },
              { id: 'maize', label: 'Maize' },
              { id: 'red_gram', label: 'Red Gram' },
              { id: 'soyabean', label: 'Soyabean' },
              { id: 'multi_crop', label: '5-Crop Matrix' }
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCrop(c.id as any)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-all cursor-pointer ${
                  selectedCrop === c.id
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-md text-xs">
            <button
              type="button"
              onClick={() => setViewFormat('SCATTER_OLS')}
              className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                viewFormat === 'SCATTER_OLS'
                  ? 'bg-teal-700 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scatter & OLS
            </button>
            <button
              type="button"
              onClick={() => setViewFormat('PHASE_BARS')}
              className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                viewFormat === 'PHASE_BARS'
                  ? 'bg-teal-700 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Phase Averages
            </button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-md text-xs font-mono">
          <div>
            <span className="block text-[10px] text-slate-500 font-sans">Pearson r:</span>
            <strong className="text-slate-900 font-bold text-sm">
              {stats.corr.pearsonR !== null ? `${stats.corr.pearsonR > 0 ? '+' : ''}${stats.corr.pearsonR.toFixed(3)}` : 'N/A'}
            </strong>
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 font-sans">p-value:</span>
            <strong className={`font-bold text-sm ${stats.corr.pValuePearson !== null && stats.corr.pValuePearson < 0.05 ? 'text-teal-800' : 'text-slate-700'}`}>
              {stats.corr.pValuePearson !== null ? `p = ${stats.corr.pValuePearson.toFixed(4)}` : 'N/A'}
            </strong>
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 font-sans">Spearman ρ:</span>
            <strong className="text-slate-900 text-sm">
              {stats.spearman.spearmanRho !== null ? `${stats.spearman.spearmanRho.toFixed(3)}` : 'N/A'}
            </strong>
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 font-sans">Variance (R²):</span>
            <strong className="text-slate-900 text-sm">
              {stats.reg.rSquared !== null ? `${(stats.reg.rSquared * 100).toFixed(1)}%` : 'N/A'}
            </strong>
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 font-sans">Yield Slope (β):</span>
            <strong className="text-slate-900 text-sm">
              {stats.reg.slopeBeta !== null ? `${stats.reg.slopeBeta > 0 ? '+' : ''}${stats.reg.slopeBeta.toFixed(1)} kg/ha/°C` : 'N/A'}
            </strong>
          </div>
        </div>
      )}

      {viewFormat === 'SCATTER_OLS' ? (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 25, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                dataKey="x"
                domain={[-2.5, 2.5]}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}°C`}
                label={{ value: 'Oceanic Niño Index (°C)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                type="number"
                dataKey="y"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v) => `${v} kg/ha`}
                label={{ value: `${cropTitle} Yield (kg/ha)`, angle: -90, position: 'insideLeft', offset: 5, fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '12px', color: '#fff' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded shadow-md text-xs font-sans">
                        <div className="font-bold border-b border-slate-700 pb-1 mb-1">
                          Kharif Season {pt.year} ({pt.phase})
                        </div>
                        <div className="font-mono text-slate-300">
                          ONI: <strong className="text-teal-300">{pt.x > 0 ? '+' : ''}{pt.x.toFixed(2)}°C</strong>
                        </div>
                        <div className="font-mono text-slate-300">
                          Yield: <strong className="text-emerald-400">{pt.y} kg/ha</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="2 2" />
              <Scatter name="Observations" data={scatterPoints} fill="#10b981" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={phaseChartData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="phaseName" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${v} kg/ha`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '12px', color: '#fff' }}
                formatter={(val: any) => [`${val} kg/ha`, `${cropTitle} Mean Yield`]}
              />
              <Bar dataKey="meanYield" name="Mean Yield (kg/ha)" radius={[4, 4, 0, 0]}>
                {phaseChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Metric Breakdown Table */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {phaseChartData.map((d, i) => (
          <div key={i} className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="block text-[10px] uppercase font-semibold text-slate-500">{d.phase}</span>
            <span className="text-base font-bold font-mono text-slate-900">{d.meanYield} <span className="text-[10px] font-normal text-slate-500">kg/ha</span></span>
            <span className="block text-[10px] text-slate-500 font-mono mt-0.5">Sample N={d.count} (σ=±{d.stdDev})</span>
          </div>
        ))}
      </div>

      <div className="pt-1">
        <SourceBadge
          source="Directorate of Economics & Statistics (DES), Telangana"
          period="1971 – 2026"
          units="kg / hectare"
          observationCount={cropPairedData.length}
        />
      </div>
    </div>
  );
};
