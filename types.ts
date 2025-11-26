export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface PixelData {
  id: string;
  x: number;
  y: number;
  rgba: number[]; // [r, g, b, a]
}

export interface ProbeJson {
  probe_name: string;
  software: string;
  timestamp: string;
  frame: number;
  bit_depth: string;
  color_space: string;
  pixels: PixelData[];
}

export interface ComparisonPoint {
  id: string;
  x: number;
  y: number;
  refRgba: Rgba;
  testRgba: Rgba;
  deltaE76: number;
  deltaE94: number;
  deltaR: number;
  deltaG: number;
  deltaB: number;
  maxChValue: number; // The value of the max deviation
  maxChName: 'R' | 'G' | 'B' | 'A' | 'None'; // Which channel deviated most
}

export interface AnalysisStats {
  avgDeltaE76: number;
  avgDeltaE94: number;
  maxDeltaE76: number;
  maxChDelta: number; // Global max channel deviation
  passRate: number; // 0-100 based on DE76
  count: number;
}

export type Language = 'en' | 'zh';
export type Theme = 'light' | 'dark';
