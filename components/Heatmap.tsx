
import React, { useState } from 'react';
import { ComparisonPoint, Language } from '../types';

interface HeatmapProps {
  data: ComparisonPoint[];
  threshold: number;
  lang: Language;
}

const translations = {
  en: {
    title: 'Spatial Delta E (2000) Map',
    details: 'Point Details',
    hover: 'Hover over a point to see details',
    id: 'ID',
    deltaE00: 'Delta E (2000)',
    deltaE94: 'Delta E (94)',
    maxCh: 'Max Ch Diff',
    ref: 'Ref RGB',
    test: 'Test RGB'
  },
  zh: {
    title: '空间 Delta E (2000) 热力图',
    details: '点位详情',
    hover: '悬停查看详情',
    id: 'ID',
    deltaE00: 'Delta E (2000)',
    deltaE94: 'Delta E (94)',
    maxCh: '最大通道偏差',
    ref: '参考 RGB',
    test: '测试 RGB'
  }
};

export const Heatmap: React.FC<HeatmapProps> = ({ data, threshold, lang }) => {
  const [hoverPoint, setHoverPoint] = useState<ComparisonPoint | null>(null);
  const t = translations[lang];

  // Using DE2000 for heatmap coloring
  const getColor = (deltaE: number) => {
    if (deltaE < threshold * 0.5) return 'bg-emerald-500';
    if (deltaE < threshold) return 'bg-emerald-300';
    if (deltaE < threshold * 1.5) return 'bg-yellow-400';
    if (deltaE < threshold * 3) return 'bg-orange-500';
    return 'bg-rose-600';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[500px]">
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 relative p-4 overflow-hidden shadow-sm transition-colors duration-300">
        <h3 className="text-slate-800 dark:text-slate-300 mb-2 font-semibold absolute top-4 left-4 z-10 bg-white/80 dark:bg-slate-800/80 px-2 rounded backdrop-blur-sm">{t.title}</h3>
        <div className="w-full h-full relative bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded">
          {data.map((pt) => (
            <div
              key={pt.id}
              className={`absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-150 transition-transform shadow-sm border border-black/10 ${getColor(pt.deltaE2000)}`}
              style={{
                left: `${pt.x * 100}%`,
                top: `${pt.y * 100}%`,
              }}
              onMouseEnter={() => setHoverPoint(pt)}
              onMouseLeave={() => setHoverPoint(null)}
            />
          ))}
        </div>
      </div>

      <div className="w-full lg:w-64 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm transition-colors duration-300">
        <h4 className="text-slate-500 dark:text-slate-400 text-sm uppercase font-bold mb-4">{t.details}</h4>
        {hoverPoint ? (
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-500 block">{t.id}</span>
              <span className="text-slate-800 dark:text-white font-mono font-medium">{hoverPoint.id}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{t.deltaE00}</span>
              <span className={`font-mono font-bold ${hoverPoint.deltaE2000 > threshold ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {hoverPoint.deltaE2000.toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">{t.deltaE94}</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {hoverPoint.deltaE94.toFixed(4)}
              </span>
            </div>
             <div>
              <span className="text-slate-500 block">{t.maxCh}</span>
              <span className="text-slate-800 dark:text-slate-300 font-mono">
                {hoverPoint.maxChName}: {hoverPoint.maxChValue.toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">{t.ref}</span>
              <div className="flex gap-1 mt-1">
                <div className="h-4 w-4 rounded bg-red-500"></div> <span className="text-slate-700 dark:text-slate-300 font-mono">{hoverPoint.refRgba.r.toFixed(3)}</span>
              </div>
              <div className="flex gap-1">
                <div className="h-4 w-4 rounded bg-green-500"></div> <span className="text-slate-700 dark:text-slate-300 font-mono">{hoverPoint.refRgba.g.toFixed(3)}</span>
              </div>
              <div className="flex gap-1">
                <div className="h-4 w-4 rounded bg-blue-500"></div> <span className="text-slate-700 dark:text-slate-300 font-mono">{hoverPoint.refRgba.b.toFixed(3)}</span>
              </div>
            </div>
             <div>
              <span className="text-slate-500 block">{t.test}</span>
              <div className="flex gap-1 mt-1">
                <div className="h-4 w-4 rounded bg-red-800 dark:bg-red-900"></div> <span className="text-slate-700 dark:text-slate-300 font-mono">{hoverPoint.testRgba.r.toFixed(3)}</span>
              </div>
              <div className="flex gap-1">
                <div className="h-4 w-4 rounded bg-green-800 dark:bg-green-900"></div> <span className="text-slate-700 dark:text-slate-300 font-mono">{hoverPoint.testRgba.g.toFixed(3)}</span>
              </div>
              <div className="flex gap-1">
                <div className="h-4 w-4 rounded bg-blue-800 dark:bg-blue-900"></div> <span className="text-slate-700 dark:text-slate-300 font-mono">{hoverPoint.testRgba.b.toFixed(3)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-slate-500 dark:text-slate-600 italic text-center mt-10">
            {t.hover}
          </div>
        )}
      </div>
    </div>
  );
};
