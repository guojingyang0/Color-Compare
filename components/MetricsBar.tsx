import React from 'react';
import { AnalysisStats, Language } from '../types';

interface MetricsBarProps {
  stats: AnalysisStats | null;
  threshold: number;
  lang: Language;
}

const translations = {
  en: {
    avgDe76: 'Avg ΔE (76)',
    avgDe94: 'Avg ΔE (94)',
    maxDe76: 'Max ΔE (76)',
    maxCh: 'Max Ch Diff',
    passRate: 'Pass Rate',
    samples: 'Samples',
    threshold: 'Threshold'
  },
  zh: {
    avgDe76: '平均 ΔE (76)',
    avgDe94: '平均 ΔE (94)',
    maxDe76: '最大 ΔE (76)',
    maxCh: '最大通道偏差',
    passRate: '通过率',
    samples: '采样点数',
    threshold: '阈值'
  }
};

const MetricCard = ({ label, value, subValue, status }: { label: string, value: string, subValue?: string, status?: 'good' | 'bad' | 'neutral' }) => (
  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 min-w-[140px] shadow-sm transition-colors duration-300">
    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">{label}</div>
    <div className={`text-2xl font-bold mt-1 ${
      status === 'good' ? 'text-emerald-500 dark:text-emerald-400' : 
      status === 'bad' ? 'text-rose-500 dark:text-rose-400' : 
      'text-slate-800 dark:text-slate-100'
    }`}>
      {value}
    </div>
    {subValue && <div className="text-slate-400 dark:text-slate-500 text-xs mt-1">{subValue}</div>}
  </div>
);

export const MetricsBar: React.FC<MetricsBarProps> = ({ stats, threshold, lang }) => {
  const t = translations[lang];
  
  if (!stats) return null;

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 transition-colors duration-300">
      <MetricCard 
        label={t.avgDe76} 
        value={stats.avgDeltaE76.toFixed(4)} 
        status={stats.avgDeltaE76 < threshold ? 'good' : 'bad'}
      />
      <MetricCard 
        label={t.avgDe94} 
        value={stats.avgDeltaE94.toFixed(4)} 
        status={stats.avgDeltaE94 < threshold ? 'good' : 'bad'}
      />
      <MetricCard 
        label={t.maxDe76} 
        value={stats.maxDeltaE76.toFixed(4)} 
        status={stats.maxDeltaE76 < threshold * 2 ? 'neutral' : 'bad'} 
      />
      <MetricCard 
        label={t.maxCh} 
        value={stats.maxChDelta.toFixed(4)} 
        status={stats.maxChDelta < 0.01 ? 'good' : 'neutral'}
      />
      <MetricCard 
        label={t.passRate} 
        value={`${stats.passRate.toFixed(1)}%`} 
        subValue={`${t.threshold}: ${threshold}`}
        status={stats.passRate > 95 ? 'good' : 'bad'}
      />
      <MetricCard 
        label={t.samples} 
        value={stats.count.toString()} 
        status="neutral"
      />
    </div>
  );
};
