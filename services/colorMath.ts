
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

// Calculate Delta E 2000
export const calculateDeltaE2000 = (c1: Rgba, c2: Rgba): number => {
    const lab1 = rgbToLab(c1.r, c1.g, c1.b);
    const lab2 = rgbToLab(c2.r, c2.g, c2.b);
    
    // Constants
    const kL = 1;
    const kC = 1;
    const kH = 1;
    
    const l1 = lab1.l;
    const a1 = lab1.a;
    const b1 = lab1.b;
    const l2 = lab2.l;
    const a2 = lab2.a;
    const b2 = lab2.b;
    
    const c1_ = Math.sqrt(a1 * a1 + b1 * b1);
    const c2_ = Math.sqrt(a2 * a2 + b2 * b2);
    const c_bar = (c1_ + c2_) / 2;
    
    const c_bar7 = Math.pow(c_bar, 7);
    const g = 0.5 * (1 - Math.sqrt(c_bar7 / (c_bar7 + 6103515625))); // 25^7
    
    const a1_prime = (1 + g) * a1;
    const a2_prime = (1 + g) * a2;
    
    const c1_prime = Math.sqrt(a1_prime * a1_prime + b1 * b1);
    const c2_prime = Math.sqrt(a2_prime * a2_prime + b2 * b2);
    
    // Compute h_prime
    const h1_prime = (a1_prime === 0 && b1 === 0) ? 0 : Math.atan2(b1, a1_prime) * 180 / Math.PI;
    const h1_prime_pos = h1_prime >= 0 ? h1_prime : h1_prime + 360;
    
    const h2_prime = (a2_prime === 0 && b2 === 0) ? 0 : Math.atan2(b2, a2_prime) * 180 / Math.PI;
    const h2_prime_pos = h2_prime >= 0 ? h2_prime : h2_prime + 360;
    
    // Compute delta L, C, H
    const delta_l_prime = l2 - l1;
    const delta_c_prime = c2_prime - c1_prime;
    
    let delta_h_prime = 0;
    if (c1_prime * c2_prime === 0) {
        delta_h_prime = 0;
    } else {
        const diff = h2_prime_pos - h1_prime_pos;
        if (Math.abs(diff) <= 180) {
            delta_h_prime = diff;
        } else if (diff > 180) {
            delta_h_prime = diff - 360;
        } else {
            delta_h_prime = diff + 360;
        }
    }
    const delta_big_h_prime = 2 * Math.sqrt(c1_prime * c2_prime) * Math.sin(delta_h_prime * Math.PI / 360);
    
    // Compute averages
    const l_bar_prime = (l1 + l2) / 2;
    const c_bar_prime = (c1_prime + c2_prime) / 2;
    
    let h_bar_prime = 0;
    if (c1_prime * c2_prime === 0) {
        h_bar_prime = h1_prime_pos + h2_prime_pos;
    } else {
        const sum = h1_prime_pos + h2_prime_pos;
        if (Math.abs(h1_prime_pos - h2_prime_pos) <= 180) {
            h_bar_prime = sum / 2;
        } else if (sum < 360) {
            h_bar_prime = (sum + 360) / 2;
        } else {
            h_bar_prime = (sum - 360) / 2;
        }
    }
    
    const t = 1 - 0.17 * Math.cos((h_bar_prime - 30) * Math.PI / 180) 
                + 0.24 * Math.cos((2 * h_bar_prime) * Math.PI / 180)
                + 0.32 * Math.cos((3 * h_bar_prime + 6) * Math.PI / 180)
                - 0.20 * Math.cos((4 * h_bar_prime - 63) * Math.PI / 180);
                
    const delta_theta = 30 * Math.exp(-Math.pow((h_bar_prime - 275) / 25, 2));
    const c_bar_prime7 = Math.pow(c_bar_prime, 7);
    const r_c = 2 * Math.sqrt(c_bar_prime7 / (c_bar_prime7 + 6103515625));
    const s_l = 1 + (0.015 * Math.pow(l_bar_prime - 50, 2)) / Math.sqrt(20 + Math.pow(l_bar_prime - 50, 2));
    const s_c = 1 + 0.045 * c_bar_prime;
    const s_h = 1 + 0.015 * c_bar_prime * t;
    const r_t = -Math.sin(2 * delta_theta * Math.PI / 180) * r_c;
    
    const term_l = delta_l_prime / (kL * s_l);
    const term_c = delta_c_prime / (kC * s_c);
    const term_h = delta_big_h_prime / (kH * s_h);
    
    return Math.sqrt(term_l * term_l + term_c * term_c + term_h * term_h + r_t * term_c * term_h);
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
