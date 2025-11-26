import { GoogleGenAI } from "@google/genai";
import { AnalysisStats, ComparisonPoint, Language } from "../types";

export const analyzeWithGemini = async (
  stats: AnalysisStats,
  worstPoints: ComparisonPoint[],
  lang: Language
): Promise<string> => {
  if (!process.env.API_KEY) {
    return lang === 'en' 
      ? "API Key not found. Please set the API_KEY environment variable."
      : "未找到 API 密钥。请设置 API_KEY 环境变量。";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const promptEn = `
    You are a Color Science Expert analyzing a comparison report between two video processing engines (Reference vs Test).
    
    Statistics:
    - Average Delta E (76): ${stats.avgDeltaE76.toFixed(4)}
    - Average Delta E (94): ${stats.avgDeltaE94.toFixed(4)}
    - Max Delta E (76): ${stats.maxDeltaE76.toFixed(4)}
    - Max Channel Deviation: ${stats.maxChDelta.toFixed(4)}
    - Pass Rate (Threshold 1.0): ${stats.passRate.toFixed(1)}%
    
    Worst 3 Points of Deviation:
    ${worstPoints.map(p => `- ID: ${p.id}, Delta E(76): ${p.deltaE76.toFixed(4)}, Ref RGB: [${p.refRgba.r.toFixed(2)},${p.refRgba.g.toFixed(2)},${p.refRgba.b.toFixed(2)}]`).join('\n')}
    
    Please provide a concise technical summary in ENGLISH. 
    1. Is the test result acceptable for professional color grading (Target < 1.0 DeltaE)?
    2. What color ranges seem to be most affected based on the worst points?
    3. Suggest potential causes (e.g., Gamma mismatch, Gamut mapping error).
  `;

  const promptZh = `
    你是一位色彩科学专家，正在分析两个视频处理引擎（参考 vs 测试）之间的对比报告。
    
    统计数据：
    - 平均 Delta E (76): ${stats.avgDeltaE76.toFixed(4)}
    - 平均 Delta E (94): ${stats.avgDeltaE94.toFixed(4)}
    - 最大 Delta E (76): ${stats.maxDeltaE76.toFixed(4)}
    - 最大通道偏差 (Max Ch): ${stats.maxChDelta.toFixed(4)}
    - 通过率 (阈值 1.0): ${stats.passRate.toFixed(1)}%
    
    偏差最大的3个点：
    ${worstPoints.map(p => `- ID: ${p.id}, Delta E(76): ${p.deltaE76.toFixed(4)}, Ref RGB: [${p.refRgba.r.toFixed(2)},${p.refRgba.g.toFixed(2)},${p.refRgba.b.toFixed(2)}]`).join('\n')}
    
    请用中文提供简明的技术总结。
    1. 测试结果是否满足专业调色要求 (目标 < 1.0 DeltaE)？
    2. 基于最差的点，哪些颜色范围受影响最大？
    3. 建议潜在原因（例如：Gamma 不匹配，色域映射错误等）。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: lang === 'zh' ? promptZh : promptEn,
    });
    return response.text || (lang === 'zh' ? "未生成响应。" : "No response generated.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return lang === 'zh' ? "分析失败。请检查控制台详情。" : "Failed to generate analysis. Please check console for details.";
  }
};
