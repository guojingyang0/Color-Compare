
import { GoogleGenAI } from "@google/genai";
import { AnalysisStats, ComparisonPoint, Language, AIConfig } from "../types";

// Helper to normalize OpenAI URLs
const getOpenAiUrl = (baseUrl: string): string => {
    let url = baseUrl.trim() || "https://api.openai.com/v1";
    // Remove trailing slash
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    // If user accidentally pasted the full endpoint, use it
    if (url.endsWith('/chat/completions')) {
        return url;
    }
    // Otherwise append the endpoint
    return `${url}/chat/completions`;
};

// Test Connection Function
export const testConnection = async (config: AIConfig): Promise<{ success: boolean; message: string }> => {
    const apiKey = (config.apiKey || process.env.API_KEY || "").trim();
    const baseUrl = (config.baseUrl || "").trim();
    const model = (config.model || "").trim();

    if (!apiKey) return { success: false, message: "No API Key provided" };

    try {
        if (config.provider === 'google') {
            const clientOptions: any = { apiKey };
            if (baseUrl) {
                clientOptions.rootUrl = baseUrl;
            }
            const ai = new GoogleGenAI(clientOptions);
            // Try a minimal generation
            await ai.models.generateContent({
                model: model,
                contents: "Test",
            });
            return { success: true, message: "Google Gemini connection successful!" };
        } else {
            const url = getOpenAiUrl(baseUrl);
            
            // Check for common typos in model names if 400 occurs
            const isGpt41 = model.includes('4.1');

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "ColorCompare Pro"
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: "user", content: "Test" }],
                    max_tokens: 5
                })
            });

            const text = await response.text();
            let data;
            
            try {
                data = JSON.parse(text);
            } catch (e) {
                // Return a snippet of the raw response if it's HTML or plain text
                throw new Error(`Invalid JSON response (${response.status}). Endpoint: ${url}\nResponse: ${text.substring(0, 150)}...`);
            }

            if (!response.ok) {
                // Robust error parsing for various proxy formats
                // standard: error.message
                // some proxies: msg, message, error (string)
                let msg = 
                    data.error?.message || 
                    data.message || 
                    data.msg || 
                    (typeof data.error === 'string' ? data.error : JSON.stringify(data));
                
                // Add hint for common typos
                if (response.status === 400 || response.status === 404) {
                    if (isGpt41) {
                         msg += " (Did you mean 'gpt-4o'?)";
                    } else if (msg.includes('model')) {
                         msg += " (Check Model Name)";
                    }
                }

                throw new Error(`${response.status}: ${msg}`);
            }
            
            return { success: true, message: `Connected to ${model} successfully!` };
        }
    } catch (e: any) {
        return { success: false, message: e.message || "Connection failed" };
    }
};

// Construct the prompt based on stats and language
const constructPrompt = (stats: AnalysisStats, worstPoints: ComparisonPoint[], lang: Language): string => {
    const isZh = lang === 'zh';
    
    const statsText = isZh ? `
    统计数据：
    - 平均 Delta E (2000): ${stats.avgDeltaE2000.toFixed(4)}
    - 最大 Delta E (2000): ${stats.maxDeltaE2000.toFixed(4)}
    - 平均 Delta E (94): ${stats.avgDeltaE94.toFixed(4)}
    - 平均 Delta E (76): ${stats.avgDeltaE76.toFixed(4)}
    - 最大 Delta E (76): ${stats.maxDeltaE76.toFixed(4)}
    - 最大通道偏差 (Max Ch): ${stats.maxChDelta.toFixed(4)}
    - 通过率 (DeltaE 2000 < 1.0): ${stats.passRate.toFixed(1)}%
    
    偏差最大的3个点 (基于 DE2000)：
    ${worstPoints.map(p => `- ID: ${p.id}, Delta E(00): ${p.deltaE2000.toFixed(4)}, Ref RGB: [${p.refRgba.r.toFixed(2)},${p.refRgba.g.toFixed(2)},${p.refRgba.b.toFixed(2)}]`).join('\n')}
    ` : `
    Statistics:
    - Average Delta E (2000): ${stats.avgDeltaE2000.toFixed(4)}
    - Max Delta E (2000): ${stats.maxDeltaE2000.toFixed(4)}
    - Average Delta E (94): ${stats.avgDeltaE94.toFixed(4)}
    - Average Delta E (76): ${stats.avgDeltaE76.toFixed(4)}
    - Max Delta E (76): ${stats.maxDeltaE76.toFixed(4)}
    - Max Channel Deviation: ${stats.maxChDelta.toFixed(4)}
    - Pass Rate (Threshold 1.0 on DE2000): ${stats.passRate.toFixed(1)}%
    
    Worst 3 Points of Deviation (based on DE2000):
    ${worstPoints.map(p => `- ID: ${p.id}, Delta E(00): ${p.deltaE2000.toFixed(4)}, Ref RGB: [${p.refRgba.r.toFixed(2)},${p.refRgba.g.toFixed(2)},${p.refRgba.b.toFixed(2)}]`).join('\n')}
    `;

    const instructions = isZh 
        ? `作为一位色彩科学专家，请分析以下颜色对比数据。
您的任务是：
1. 评估整体颜色匹配质量（基于 Delta E 2000）。
2. 分析最大偏差发生的位置和颜色通道。
3. 如果有明显偏差，推测可能的原因（例如伽马校正问题、色彩空间转换错误、或压缩伪影）。
4. 给出简短的技术建议。

请用中文回答，格式清晰。

${statsText}`
        : `As a color science expert, please analyze the following color comparison data.
Your task is to:
1. Evaluate the overall color matching quality (based on Delta E 2000).
2. Analyze where and on which channel the maximum deviations occur.
3. Speculate on possible causes for significant deviations (e.g., gamma correction issues, color space conversion errors, or compression artifacts).
4. Provide brief technical recommendations.

Please answer in English with clear formatting.

${statsText}`;

    return instructions;
};

// Generic AI Analysis function
export const analyzeWithAI = async (
  stats: AnalysisStats,
  worstPoints: ComparisonPoint[],
  lang: Language,
  config: AIConfig
): Promise<string> => {
  const apiKey = (config.apiKey || process.env.API_KEY || "").trim();
  const baseUrl = (config.baseUrl || "").trim();
  const model = (config.model || "").trim();

  if (!apiKey) {
    return lang === 'en' 
      ? "API Key not found. Please set the API_KEY in settings or environment."
      : "未找到 API 密钥。请在设置中配置或设置环境变量。";
  }

  const promptContent = constructPrompt(stats, worstPoints, lang);

  try {
    if (config.provider === 'google') {
        // --- GOOGLE GEMINI (Official SDK) ---
        const clientOptions: any = { apiKey };
        if (baseUrl) {
             clientOptions.rootUrl = baseUrl; 
        }

        const ai = new GoogleGenAI(clientOptions);
        const response = await ai.models.generateContent({
            model: model,
            contents: promptContent,
        });
        return response.text || (lang === 'zh' ? "未生成响应。" : "No response generated.");

    } else {
        // --- OPENAI COMPATIBLE (Fetch) ---
        const url = getOpenAiUrl(baseUrl);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                // OpenRouter specific headers (optional but good practice)
                "HTTP-Referer": window.location.origin,
                "X-Title": "ColorCompare Pro"
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "user", content: promptContent }
                ],
                temperature: 0.7
            })
        });

        const text = await response.text();
        let data;
        
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error(`Invalid API response (not JSON). The URL might be wrong. Preview: ${text.substring(0, 100)}...`);
        }

        if (!response.ok) {
            const msg = data.error?.message || data.message || data.msg || JSON.stringify(data);
            throw new Error(`${response.status} ${msg}`);
        }

        return data.choices?.[0]?.message?.content || (lang === 'zh' ? "未生成响应。" : "No response generated.");
    }

  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    const msg = error.message || String(error);
    return lang === 'zh' 
        ? `分析失败: ${msg}` 
        : `Analysis Failed: ${msg}`;
  }
};
