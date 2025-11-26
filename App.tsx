import React, { useState, useEffect } from 'react';
import { ProbeJson, ComparisonPoint, AnalysisStats, PixelData, Language, Theme } from './types';
import { calculateDeltaE76, calculateDeltaE94, calculateMaxChannel, generateMockData } from './services/colorMath';
import { MetricsBar } from './components/MetricsBar';
import { Heatmap } from './components/Heatmap';
import { ScatterPlotView, HistogramView, ChannelDiffChart } from './components/Charts';
import { analyzeWithGemini } from './services/gemini';

// Icons
const UploadIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
);
const AIIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
);
const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
);
const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
);
const LangIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
);

const translations = {
  en: {
    appTitle: 'ColorCompare GUI',
    threshold: 'Threshold',
    selectRef: 'Select Ref',
    selectTest: 'Select Test',
    analyzing: 'Analyzing...',
    geminiAnalysis: 'AI Analysis',
    reportTitle: 'AI Technical Report',
    noData: 'Load two JSON files to begin comparison',
    analysisFailed: 'Analysis Failed: No matching coordinates found',
    checkIds: 'Please ensure both JSON files contain pixels with matching coordinates (x, y).',
    refPoints: 'Ref Pixels',
    testPoints: 'Test Pixels',
    tabTable: 'Table',
    tabHeatmap: 'Heatmap',
    tabScatter: 'Scatter',
    tabHist: 'Histogram',
    tabChannel: 'Channels',
    colId: 'ID',
    colRef: 'Ref RGBA',
    colTest: 'Test RGBA',
    colDe76: 'ΔE (76)',
    colMaxCh: 'Max Ch',
    colStatus: 'Status'
  },
  zh: {
    appTitle: '色彩对比工具 GUI',
    threshold: '通过阈值',
    selectRef: '选择参考 JSON',
    selectTest: '选择测试 JSON',
    analyzing: '分析中...',
    geminiAnalysis: '智能分析',
    reportTitle: 'AI 技术报告',
    noData: '请加载两个 JSON 文件以开始对比',
    analysisFailed: '分析失败：未找到匹配的坐标点',
    checkIds: '请确保两个 JSON 文件包含具有相同坐标 (x, y) 的像素点数据。',
    refPoints: '参考点数',
    testPoints: '测试点数',
    tabTable: '表格数据',
    tabHeatmap: '热力图',
    tabScatter: '散点图',
    tabHist: '直方图',
    tabChannel: '通道偏差',
    colId: 'ID',
    colRef: '参考 RGBA',
    colTest: '测试 RGBA',
    colDe76: 'ΔE (76)',
    colMaxCh: '最大偏差通道',
    colStatus: '状态'
  }
};

// --- Text Parsing Helper ---
const parseBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-900 dark:text-indigo-100">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const FormattedReport: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="space-y-3">
      {text.split('\n').map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;
        
        // Headers
        if (trimmed.endsWith(':') || (trimmed.startsWith('**') && trimmed.endsWith('**'))) {
           return <h4 key={idx} className="font-bold text-lg text-slate-800 dark:text-indigo-200 mt-4 mb-2">{parseBold(trimmed.replace(/^\*\*/, '').replace(/\*\*$/, ''))}</h4>
        }
        
        // Numbered List
        if (trimmed.match(/^\d+\./)) {
           const [num, ...rest] = trimmed.split('.');
           return (
             <div key={idx} className="flex gap-3 mb-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 text-xs font-bold shrink-0 mt-0.5">{num}</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">{parseBold(rest.join('.').trim())}</p>
             </div>
           )
        }
        
        // Bullet List
        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
           return (
              <div key={idx} className="flex gap-3 mb-2 ml-1">
                 <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500 shrink-0" />
                 <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">{parseBold(trimmed.replace(/^[-•]\s*/, ''))}</p>
              </div>
           )
        }

        // Standard Paragraph
        return <p key={idx} className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">{parseBold(trimmed)}</p>
      })}
    </div>
  )
}

const App: React.FC = () => {
  const [refData, setRefData] = useState<ProbeJson | null>(null);
  const [testData, setTestData] = useState<ProbeJson | null>(null);
  const [comparison, setComparison] = useState<ComparisonPoint[]>([]);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [threshold, setThreshold] = useState<number>(1.0);
  const [activeTab, setActiveTab] = useState<'table' | 'heatmap' | 'scatter' | 'histogram' | 'channels'>('table');
  
  // UI State
  const [lang, setLang] = useState<Language>('zh'); 
  const [theme, setTheme] = useState<Theme>('dark');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  const t = translations[lang];

  // Apply theme to HTML
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Load Mock Data
  useEffect(() => {
    setRefData(generateMockData("REFERENCE", 0));
    setTestData(generateMockData("TEST", 0.05));
  }, []);

  // Comparison Logic
  useEffect(() => {
    if (!refData || !testData) return;

    const results: ComparisonPoint[] = [];
    let totalDeltaE76 = 0;
    let totalDeltaE94 = 0;
    let maxDeltaE76 = 0;
    let maxGlobalCh = 0;
    let passCount = 0;

    // Use coordinates as key for alignment (using 5 decimal places for precision tolerance)
    const getCoordKey = (p: PixelData) => `${p.x.toFixed(5)}_${p.y.toFixed(5)}`;

    const testMap = new Map<string, PixelData>();
    if (testData.pixels) {
      testData.pixels.forEach(p => testMap.set(getCoordKey(p), p));
    }

    if (refData.pixels) {
      refData.pixels.forEach(refP => {
        const key = getCoordKey(refP);
        const testP = testMap.get(key);

        if (testP && refP.rgba && testP.rgba) {
          // Ensure RGBA parsing is robust for arrays
          // Added fallback to 0 in case of missing channels to prevent crash
          const r1 = { 
            r: refP.rgba[0] ?? 0, 
            g: refP.rgba[1] ?? 0, 
            b: refP.rgba[2] ?? 0, 
            a: refP.rgba[3] ?? 1.0 
          };
          const r2 = { 
            r: testP.rgba[0] ?? 0, 
            g: testP.rgba[1] ?? 0, 
            b: testP.rgba[2] ?? 0, 
            a: testP.rgba[3] ?? 1.0 
          };
          
          const de76 = calculateDeltaE76(r1, r2);
          const de94 = calculateDeltaE94(r1, r2);
          const maxCh = calculateMaxChannel(r1, r2);
          
          totalDeltaE76 += de76;
          totalDeltaE94 += de94;

          if (de76 > maxDeltaE76) maxDeltaE76 = de76;
          if (maxCh.val > maxGlobalCh) maxGlobalCh = maxCh.val;
          if (de76 <= threshold) passCount++;

          results.push({
            id: refP.id, // Keep Ref ID for display purposes
            x: refP.x,
            y: refP.y,
            refRgba: r1,
            testRgba: r2,
            deltaE76: de76,
            deltaE94: de94,
            deltaR: Math.abs(r1.r - r2.r),
            deltaG: Math.abs(r1.g - r2.g),
            deltaB: Math.abs(r1.b - r2.b),
            maxChValue: maxCh.val,
            maxChName: maxCh.name
          });
        }
      });
    }

    setComparison(results);
    setStats({
      avgDeltaE76: results.length ? totalDeltaE76 / results.length : 0,
      avgDeltaE94: results.length ? totalDeltaE94 / results.length : 0,
      maxDeltaE76,
      maxChDelta: maxGlobalCh,
      passRate: results.length ? (passCount / results.length) * 100 : 0,
      count: results.length
    });
    setAiReport(null);
  }, [refData, testData, threshold]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isRef: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset value so same file can be selected again
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as ProbeJson;
        if (isRef) setRefData(json);
        else setTestData(json);
      } catch (err) {
        alert(lang === 'zh' ? "无效的 JSON 文件" : "Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleAiAnalysis = async () => {
    if (!stats || comparison.length === 0) return;
    
    setIsAnalyzing(true);
    // Get top 5 worst points based on DE76
    const worstPoints = [...comparison].sort((a, b) => b.deltaE76 - a.deltaE76).slice(0, 5);
    
    const report = await analyzeWithGemini(stats, worstPoints, lang);
    setAiReport(report);
    setIsAnalyzing(false);
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleLang = () => setLang(prev => prev === 'en' ? 'zh' : 'en');

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-300 font-sans text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row justify-between items-center shadow-sm z-20 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">CP</div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.appTitle}</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 justify-center">
           <div className="flex items-center gap-2 mr-2">
             <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                title="Toggle Theme"
             >
               {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
             </button>
             <button 
                onClick={toggleLang} 
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium transition-colors"
                title="Switch Language"
             >
               <LangIcon />
               {lang === 'en' ? 'EN' : '中'}
             </button>
           </div>

           <div className="flex flex-col">
            <label className="text-xs text-slate-500 dark:text-slate-500 mb-1 font-medium">{t.threshold} (ΔE)</label>
            <input 
              type="number" 
              value={threshold} 
              step="0.1" 
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm w-24 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>
          
          <div className="flex gap-2">
             <div className="relative group">
                  <input type="file" onChange={(e) => handleFileUpload(e, true)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".json" />
                  <div className="flex items-center bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-sm transition-all shadow-sm group-hover:border-indigo-400">
                    <UploadIcon />
                    <div className="flex flex-col items-start max-w-[120px]">
                        <div className="flex justify-between w-full">
                           <span className="text-[10px] text-slate-400 uppercase tracking-wider">Ref</span>
                           {refData?.pixels && <span className="text-[10px] text-emerald-500 font-bold ml-2">{refData.pixels.length} pts</span>}
                        </div>
                        <span className="font-medium truncate w-full block">{refData ? refData.software : t.selectRef}</span>
                    </div>
                  </div>
             </div>
             
             <div className="relative group">
                  <input type="file" onChange={(e) => handleFileUpload(e, false)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".json" />
                  <div className="flex items-center bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-sm transition-all shadow-sm group-hover:border-indigo-400">
                     <UploadIcon />
                     <div className="flex flex-col items-start max-w-[120px]">
                        <div className="flex justify-between w-full">
                           <span className="text-[10px] text-slate-400 uppercase tracking-wider">Test</span>
                           {testData?.pixels && <span className="text-[10px] text-emerald-500 font-bold ml-2">{testData.pixels.length} pts</span>}
                        </div>
                        <span className="font-medium truncate w-full block">{testData ? testData.software : t.selectTest}</span>
                    </div>
                  </div>
             </div>
          </div>
        </div>
      </header>

      {/* Summary Metrics */}
      <MetricsBar stats={stats} threshold={threshold} lang={lang} />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col bg-slate-50/50 dark:bg-slate-950/50">
        
        {/* Tab Nav */}
        <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 mb-6 gap-2">
          {['table', 'heatmap', 'scatter', 'histogram', 'channels'].map((tabKey) => {
              const labelMap: Record<string, string> = {
                  'table': t.tabTable,
                  'heatmap': t.tabHeatmap,
                  'scatter': t.tabScatter,
                  'histogram': t.tabHist,
                  'channels': t.tabChannel
              };
              return (
                <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey as any)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                    activeTab === tabKey 
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
                >
                {labelMap[tabKey]}
                </button>
              );
          })}
          <div className="flex-1"></div>
          <button 
            onClick={handleAiAnalysis}
            disabled={isAnalyzing || !stats}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95 ${
              aiReport 
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700' 
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white'
            }`}
          >
             {isAnalyzing ? <span className="animate-spin mr-2">⟳</span> : <AIIcon />}
             {isAnalyzing ? t.analyzing : t.geminiAnalysis}
          </button>
        </div>

        {/* AI Report Panel */}
        {aiReport && (
          <div className="mb-6 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-500/30 rounded-xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
             {/* Gradient Background Decoration */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-0"></div>
             
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center text-lg gap-2">
                        <span className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg"><AIIcon /></span> 
                        {t.reportTitle}
                    </h3>
                    <button onClick={() => setAiReport(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">✕</button>
                </div>
                
                <FormattedReport text={aiReport} />
             </div>
          </div>
        )}

        {/* Views */}
        <div className="flex-1 overflow-auto rounded-lg">
          {(!refData || !testData) ? (
            // State: No files loaded
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600">
              <div className="w-20 h-20 mb-4 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                 <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <p className="text-lg font-medium">{t.noData}</p>
            </div>
          ) : comparison.length === 0 ? (
             // State: Files loaded but no intersection
             <div className="flex flex-col items-center justify-center h-full text-rose-500 dark:text-rose-400 p-8 text-center">
               <div className="w-20 h-20 mb-4 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center border border-rose-200 dark:border-rose-800">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               </div>
               <h3 className="text-xl font-bold mb-2">{t.analysisFailed}</h3>
               <p className="text-slate-500 dark:text-slate-400 max-w-md">{t.checkIds}</p>
               <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                     <span className="block text-slate-400 text-xs uppercase mb-1">{t.refPoints}</span>
                     <span className="text-slate-800 dark:text-slate-200 font-mono text-lg font-bold">{refData?.pixels?.length || 0}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                     <span className="block text-slate-400 text-xs uppercase mb-1">{t.testPoints}</span>
                     <span className="text-slate-800 dark:text-slate-200 font-mono text-lg font-bold">{testData?.pixels?.length || 0}</span>
                  </div>
               </div>
             </div>
          ) : (
            <>
              {activeTab === 'table' && (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm transition-colors duration-300">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 uppercase text-xs font-semibold tracking-wider">
                        <tr>
                          <th className="px-4 py-3">{t.colId}</th>
                          <th className="px-4 py-3">{t.colRef}</th>
                          <th className="px-4 py-3">{t.colTest}</th>
                          <th className="px-4 py-3 text-right">{t.colDe76}</th>
                          <th className="px-4 py-3 text-right">{t.colMaxCh}</th>
                          <th className="px-4 py-3 text-right">{t.colStatus}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {comparison.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                            <td className="px-4 py-2 font-mono text-xs">{row.id}</td>
                            <td className="px-4 py-2 font-mono text-xs">
                              <span className="text-red-600 dark:text-red-400">{row.refRgba.r.toFixed(3)}</span>, 
                              <span className="text-green-600 dark:text-green-400"> {row.refRgba.g.toFixed(3)}</span>, 
                              <span className="text-blue-600 dark:text-blue-400"> {row.refRgba.b.toFixed(3)}</span>
                            </td>
                            <td className="px-4 py-2 font-mono text-xs">
                              <span className="text-red-700 dark:text-red-500">{row.testRgba.r.toFixed(3)}</span>, 
                              <span className="text-green-700 dark:text-green-500"> {row.testRgba.g.toFixed(3)}</span>, 
                              <span className="text-blue-700 dark:text-blue-500"> {row.testRgba.b.toFixed(3)}</span>
                            </td>
                            <td className={`px-4 py-2 text-right font-bold ${row.deltaE76 > threshold ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {row.deltaE76.toFixed(4)}
                            </td>
                             <td className="px-4 py-2 text-right font-mono text-xs">
                                {row.maxChName}: {row.maxChValue.toFixed(4)}
                            </td>
                             <td className="px-4 py-2 text-right">
                               <span className={`inline-block w-2.5 h-2.5 rounded-full ${row.deltaE76 > threshold ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'}`}></span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'heatmap' && <Heatmap data={comparison} threshold={threshold} lang={lang} />}
              {activeTab === 'scatter' && <ScatterPlotView data={comparison} lang={lang} />}
              {activeTab === 'histogram' && <HistogramView data={comparison} lang={lang} />}
              {activeTab === 'channels' && <ChannelDiffChart data={comparison} lang={lang} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;