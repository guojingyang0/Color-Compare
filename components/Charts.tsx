
import React from 'react';
import { ComparisonPoint, Language } from '../types';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line
} from 'recharts';

interface Props {
  data: ComparisonPoint[];
  lang: Language;
}

const translations = {
  en: {
    linearity: 'Linearity Check (Green Channel)',
    errorDist: 'Error Distribution (ΔE 2000 Bins)',
    channelDiff: 'Channel Deviation (Top 50 Errors)',
    refG: 'Ref Green',
    testG: 'Test Green',
    count: 'Count',
    diffR: 'Diff R',
    diffG: 'Diff G',
    diffB: 'Diff B',
    id: 'ID',
    deltaE: 'ΔE (2000)'
  },
  zh: {
    linearity: '线性度检查 (G通道)',
    errorDist: '误差分布 (ΔE 2000 区间)',
    channelDiff: '通道偏差分析 (前50个大误差)',
    refG: '参考 G值',
    testG: '测试 G值',
    count: '数量',
    diffR: '偏差 R',
    diffG: '偏差 G',
    diffB: '偏差 B',
    id: 'ID',
    deltaE: 'ΔE (2000)'
  }
};

// --- Custom Tooltips ---

const CustomTooltipScatter = ({ active, payload, lang }: any) => {
  if (active && payload && payload.length && payload[0]) {
    const data = payload[0].payload;
    if (!data) return null;

    const t = translations[lang];
    const isBad = data.deltaE > 1.0;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md p-3 rounded-lg border border-slate-700 shadow-xl text-xs z-50 min-w-[180px]">
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700 gap-4">
          <span className="font-bold text-slate-100 font-mono">{data.id}</span>
          <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${isBad ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {t.deltaE} {data.deltaE.toFixed(4)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <span className="text-slate-400 text-right pr-2">{t.refG}:</span>
          <span className="text-left font-mono text-slate-200">{data.x.toFixed(4)}</span>
          <span className="text-slate-400 text-right pr-2">{t.testG}:</span>
          <span className="text-left font-mono text-slate-200">{data.y.toFixed(4)}</span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomTooltipHist = ({ active, payload, label, lang }: any) => {
  if (active && payload && payload.length && payload[0]) {
    const t = translations[lang];
    return (
      <div className="bg-slate-900/95 backdrop-blur-md p-3 rounded-lg border border-slate-700 shadow-xl text-xs z-50">
        <p className="text-slate-400 mb-1">ΔE (2000) Range: <span className="text-slate-200 font-mono font-bold">{label}</span></p>
        <p className="text-slate-200 font-bold text-sm">
          {t.count}: <span className="text-indigo-400">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomTooltipChannel = ({ active, payload, lang }: any) => {
  if (active && payload && payload.length && payload[0]) {
    const data = payload[0].payload;
    if (!data) return null;

    const t = translations[lang];
    return (
      <div className="bg-slate-900/95 backdrop-blur-md p-3 rounded-lg border border-slate-700 shadow-xl text-xs z-50 min-w-[160px]">
        <div className="mb-2 pb-2 border-b border-slate-700">
           <span className="font-bold text-slate-100 font-mono block">{t.id}: {data.id}</span>
        </div>
        <div className="space-y-1">
           <div className="flex justify-between">
              <span className="text-red-400 font-medium">{t.diffR}</span>
              <span className="font-mono text-slate-200">{data.dr.toFixed(5)}</span>
           </div>
           <div className="flex justify-between">
              <span className="text-green-400 font-medium">{t.diffG}</span>
              <span className="font-mono text-slate-200">{data.dg.toFixed(5)}</span>
           </div>
           <div className="flex justify-between">
              <span className="text-blue-400 font-medium">{t.diffB}</span>
              <span className="font-mono text-slate-200">{data.db.toFixed(5)}</span>
           </div>
        </div>
      </div>
    );
  }
  return null;
};

// --- Charts ---

export const ScatterPlotView: React.FC<Props> = ({ data, lang }) => {
  const t = translations[lang];
  // Uses DE2000
  const chartData = data.map(pt => ({
    x: pt.refRgba.g,
    y: pt.testRgba.g,
    deltaE: pt.deltaE2000,
    id: pt.id
  }));

  return (
    <div className="h-[400px] w-full bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
      <h3 className="text-slate-800 dark:text-slate-300 mb-4 font-semibold">{t.linearity}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
          <XAxis type="number" dataKey="x" name={t.refG} stroke="#94a3b8" domain={[0, 1]} tick={{fontSize: 12}} />
          <YAxis type="number" dataKey="y" name={t.testG} stroke="#94a3b8" domain={[0, 1]} tick={{fontSize: 12}} />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            content={(props) => <CustomTooltipScatter {...props} lang={lang} />}
          />
          <Scatter name="Pixels" data={chartData} fill="#38bdf8" shape="circle" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export const HistogramView: React.FC<Props> = ({ data, lang }) => {
  const t = translations[lang];
  const bins = [0, 0.5, 1.0, 2.0, 5.0, 10.0];
  // Uses DE2000
  const histData = bins.map((bin, i) => {
    const nextBin = bins[i + 1] || 1000;
    const count = data.filter(d => d.deltaE2000 >= bin && d.deltaE2000 < nextBin).length;
    return {
      name: `${bin}-${nextBin === 1000 ? '>' : nextBin}`,
      count: count
    };
  });

  return (
    <div className="h-[400px] w-full bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
      <h3 className="text-slate-800 dark:text-slate-300 mb-4 font-semibold">{t.errorDist}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={histData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
          <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
          <Tooltip 
             cursor={{fill: 'rgba(255,255,255,0.05)'}}
             content={(props) => <CustomTooltipHist {...props} lang={lang} />}
          />
          <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ChannelDiffChart: React.FC<Props> = ({ data, lang }) => {
  const t = translations[lang];
  // Sort by error (DE2000) and take top 50
  const topData = [...data]
    .sort((a, b) => b.deltaE2000 - a.deltaE2000)
    .slice(0, 50)
    .map(pt => ({
      id: pt.id,
      dr: pt.deltaR,
      dg: pt.deltaG,
      db: pt.deltaB
    }));

  return (
    <div className="h-[400px] w-full bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
      <h3 className="text-slate-800 dark:text-slate-300 mb-4 font-semibold">{t.channelDiff}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={topData}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
          <XAxis dataKey="id" stroke="#94a3b8" hide />
          <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
          <Tooltip 
             content={(props) => <CustomTooltipChannel {...props} lang={lang} />}
          />
          <Legend wrapperStyle={{paddingTop: '10px'}} />
          <Line type="monotone" dataKey="dr" stroke="#ef4444" dot={false} name={t.diffR} strokeWidth={2} activeDot={{r: 6}} />
          <Line type="monotone" dataKey="dg" stroke="#22c55e" dot={false} name={t.diffG} strokeWidth={2} activeDot={{r: 6}} />
          <Line type="monotone" dataKey="db" stroke="#3b82f6" dot={false} name={t.diffB} strokeWidth={2} activeDot={{r: 6}} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
