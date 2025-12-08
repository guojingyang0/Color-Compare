
import React, { useState, useEffect } from 'react';
import { AIConfig, AIProvider, Language } from '../types';
import { testConnection } from '../services/gemini';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onSave: (config: AIConfig) => void;
  lang: Language;
}

const translations = {
  en: {
    title: 'AI Settings',
    provider: 'API Provider',
    baseUrl: 'Base URL (Proxy)',
    apiKey: 'API Key',
    model: 'Model',
    cancel: 'Cancel',
    save: 'Save Changes',
    custom: 'Custom Model...',
    phUrl: 'Default (Leave empty)',
    phKey: 'Leave empty to use default env key',
    test: 'Test Connection',
    testing: 'Testing...',
    testSuccess: 'Connection Successful',
    testFail: 'Connection Failed',
    presets: {
      google: 'Google Gemini (Official)',
      openai: 'OpenAI Compatible (OpenRouter/DeepSeek)'
    }
  },
  zh: {
    title: 'AI 设置',
    provider: 'API 提供商',
    baseUrl: '代理地址 (Base URL)',
    apiKey: 'API 密钥',
    model: '模型名称',
    cancel: '取消',
    save: '保存更改',
    custom: '自定义模型...',
    phUrl: '默认 (留空)',
    phKey: '留空则使用默认环境变量',
    test: '测试连接',
    testing: '测试中...',
    testSuccess: '连接成功',
    testFail: '连接失败',
    presets: {
      google: 'Google Gemini (官方协议)',
      openai: 'OpenAI 兼容协议 (OpenRouter/DeepSeek)'
    }
  }
};

const MODEL_PRESETS = {
  openai: [
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Standard)' },
    { value: 'deepseek-chat', label: 'DeepSeek V3' },
    { value: 'deepseek-reasoner', label: 'DeepSeek R1' },
    { value: 'google/gemini-2.0-flash-001', label: 'OpenRouter: Gemini 2.0 Flash' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'OpenRouter: Claude 3.5 Sonnet' }
  ],
  google: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended)' },
    { value: 'gemini-2.0-flash-thinking-exp-01-21', label: 'Gemini 2.0 Flash Thinking' },
    { value: 'gemini-2.0-pro-exp-02-05', label: 'Gemini 2.0 Pro Experimental' }
  ]
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave, lang }) => {
  const [tempConfig, setTempConfig] = useState<AIConfig>(config);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMsg, setTestMsg] = useState('');
  
  const t = translations[lang];

  // Reset temp config when modal opens
  useEffect(() => {
    if (isOpen) {
        setTempConfig(config);
        setTestStatus('idle');
        setTestMsg('');
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleProviderChange = (provider: AIProvider) => {
    // Switch to a default model for that provider if current model is not in presets
    const defaultModel = MODEL_PRESETS[provider][0].value;
    setTempConfig({
      ...tempConfig,
      provider,
      model: defaultModel,
      // Reset base URL recommendation based on provider
      baseUrl: provider === 'openai' ? 'https://new-api.300624.cn/v1/chat/completions' : '' 
    });
    setTestStatus('idle');
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    const result = await testConnection(tempConfig);
    if (result.success) {
        setTestStatus('success');
        setTestMsg(result.message);
    } else {
        setTestStatus('error');
        setTestMsg(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {t.title}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.provider}</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(['openai', 'google'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                    tempConfig.provider === p
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t.presets[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Base URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.baseUrl}</label>
            <input
              type="text"
              value={tempConfig.baseUrl}
              onChange={(e) => setTempConfig({ ...tempConfig, baseUrl: e.target.value })}
              placeholder={tempConfig.provider === 'openai' ? "https://new-api.300624.cn/v1/chat/completions" : t.phUrl}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
            />
            <p className="text-xs text-slate-400">
               {tempConfig.provider === 'google' ? 'Optional. Useful for corporate proxies.' : 'Required for OpenRouter, DeepSeek, etc. Defaults to https://api.openai.com/v1 if empty.'}
            </p>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.apiKey}</label>
            <input
              type="password"
              value={tempConfig.apiKey}
              onChange={(e) => setTempConfig({ ...tempConfig, apiKey: e.target.value })}
              placeholder={t.phKey}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-mono"
            />
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.model}</label>
            <div className="relative">
                <select
                value={MODEL_PRESETS[tempConfig.provider].some(m => m.value === tempConfig.model) ? tempConfig.model : 'custom'}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                        // Clear model to trigger custom input view
                        setTempConfig({ ...tempConfig, model: '' });
                    } else {
                        setTempConfig({ ...tempConfig, model: val });
                    }
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white appearance-none"
                >
                {MODEL_PRESETS[tempConfig.provider].map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                ))}
                <option value="custom">{t.custom}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>
            
            {/* Custom Model Input if needed */}
            {!MODEL_PRESETS[tempConfig.provider].some(m => m.value === tempConfig.model) && (
                <input
                type="text"
                value={tempConfig.model}
                onChange={(e) => setTempConfig({ ...tempConfig, model: e.target.value })}
                placeholder="Enter model name (e.g. gpt-4-turbo)"
                className="w-full mt-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-mono animate-in fade-in slide-in-from-top-1"
                />
            )}
          </div>

          {/* Test Connection Result */}
          {testStatus !== 'idle' && (
             <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                testStatus === 'testing' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600' :
                testStatus === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
             }`}>
                {testStatus === 'testing' && <span className="animate-spin">⟳</span>}
                {testStatus === 'success' && <span>✓</span>}
                {testStatus === 'error' && <span>✕</span>}
                <span className="font-medium break-all">
                    {testStatus === 'testing' ? t.testing : testMsg || (testStatus === 'success' ? t.testSuccess : t.testFail)}
                </span>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between gap-3 flex-shrink-0">
          <button 
             onClick={handleTestConnection}
             disabled={testStatus === 'testing'}
             className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
          >
             {t.test}
          </button>

          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                {t.cancel}
            </button>
            <button 
                onClick={() => { onSave(tempConfig); onClose(); }} 
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-500/30 transition-colors"
            >
                {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
