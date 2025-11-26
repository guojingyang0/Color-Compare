import { Rgba, ComparisonPoint } from '../types';

// Convert linear 0-1 RGB to XYZ then to Lab
// Simplified conversion for demonstration purposes assuming sRGB D65
const rgbToLab = (r: number, g: number, b: number): { l: number; a: number; b: number } => {
  let R = r;
  let G = g;
  let B = b;

  // sRGB gamma correction
  if (R > 0.04045) R = Math.pow((R + 0.055) / 1.055, 2.4);
  else R = R / 12.92;
  if (G > 0.04045) G = Math.pow((G + 0.055) / 1.055, 2.4);
  else G = G / 12.92;
  if (B > 0.04045) B = Math.pow((B + 0.055) / 1.055, 2.4);
  else B = B / 12.92;

  R *= 100;
  G *= 100;
  B *= 100;

  const X = R * 0.4124 + G * 0.3576 + B * 0.1805;
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const Z = R * 0.0193 + G * 0.1192 + B * 0.9505;

  let x = X / 95.047;
  let y = Y / 100.000;
  let z = Z / 108.883;

  if (x > 0.008856) x = Math.pow(x, 1 / 3);
  else x = 7.787 * x + 16 / 116;
  if (y > 0.008856) y = Math.pow(y, 1 / 3);
  else y = 7.787 * y + 16 / 116;
  if (z > 0.008856) z = Math.pow(z, 1 / 3);
  else z = 7.787 * z + 16 / 116;

  const L = 116 * y - 16;
  const a = 500 * (x - y);
  const bVal = 200 * (y - z);

  return { l: L, a: a, b: bVal };
};

// Calculate Delta E 76
export const calculateDeltaE76 = (c1: Rgba, c2: Rgba): number => {
  const lab1 = rgbToLab(c1.r, c1.g, c1.b);
  const lab2 = rgbToLab(c2.r, c2.g, c2.b);

  const dL = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;

  return Math.sqrt(dL * dL + da * da + db * db);
};

// Calculate Delta E 94 (Graphic Arts)
export const calculateDeltaE94 = (c1: Rgba, c2: Rgba): number => {
  const lab1 = rgbToLab(c1.r, c1.g, c1.b);
  const lab2 = rgbToLab(c2.r, c2.g, c2.b);

  const dL = lab1.l - lab2.l;
  const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
  const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
  const dC = C1 - C2;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  // dH^2 = dE^2 - dL^2 - dC^2
  // But strictly: dH = sqrt(da^2 + db^2 - dC^2)
  let dH2 = da * da + db * db - dC * dC;
  if (dH2 < 0) dH2 = 0; // Float precision check
  const dH = Math.sqrt(dH2);

  const kL = 1;
  const kC = 1;
  const kH = 1;
  const K1 = 0.045;
  const K2 = 0.015;
  const sL = 1;
  const sC = 1 + K1 * C1;
  const sH = 1 + K2 * C1;

  const termL = dL / (kL * sL);
  const termC = dC / (kC * sC);
  const termH = dH / (kH * sH);

  return Math.sqrt(termL * termL + termC * termC + termH * termH);
};

export const calculateMaxChannel = (c1: Rgba, c2: Rgba): { val: number, name: 'R' | 'G' | 'B' | 'A' | 'None' } => {
    const dr = Math.abs(c1.r - c2.r);
    const dg = Math.abs(c1.g - c2.g);
    const db = Math.abs(c1.b - c2.b);
    const da = Math.abs(c1.a - c2.a);

    let maxVal = dr;
    let name: 'R' | 'G' | 'B' | 'A' | 'None' = 'R';

    if (dg > maxVal) { maxVal = dg; name = 'G'; }
    if (db > maxVal) { maxVal = db; name = 'B'; }
    if (da > maxVal) { maxVal = da; name = 'A'; }
    
    if (maxVal === 0) name = 'None';

    return { val: maxVal, name };
};

export const generateMockData = (softwareName: string, variance: number): any => {
  const points = [];
  const gridSize = 9; // 9x9 grid
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Create a gradient
      const r = i / gridSize;
      const g = j / gridSize;
      const b = 0.5;
      
      // Add noise if variance > 0
      const noise = () => (Math.random() - 0.5) * variance;
      
      points.push({
        id: `pt_${i}_${j}`,
        x: (i + 0.5) / gridSize,
        y: (j + 0.5) / gridSize,
        rgba: [
            Math.max(0, Math.min(1, r + noise())), 
            Math.max(0, Math.min(1, g + noise())), 
            Math.max(0, Math.min(1, b + noise())), 
            1.0
        ]
      });
    }
  }

  return {
    probe_name: "ColorProbe_Test_01",
    software: softwareName,
    timestamp: new Date().toISOString(),
    frame: 1001,
    bit_depth: "32f",
    color_space: "Linear",
    pixels: points
  };
};
