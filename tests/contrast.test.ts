import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const globalsCss = readFileSync(path.resolve(__dirname, '../src/app/globals.css'), 'utf-8');

type Hsl = [number, number, number];

type Theme = Record<string, Hsl>;

const hexRe = /^#([0-9a-f]{3,8})$/i;
const hslRe = /(\d+(?:\.\d+)?)\s+([\d.]+)%\s+([\d.]+)%/;

function parseValue(raw: string): Hsl | null {
  const v = raw.trim();
  const hex = hexRe.exec(v);
  if (hex) {
    let hexStr = hex[1];
    if (hexStr.length === 3)
      hexStr = hexStr
        .split('')
        .map(c => c + c)
        .join('');
    if (hexStr.length === 4)
      hexStr = hexStr
        .split('')
        .map(c => c + c)
        .join('');
    if (hexStr.length !== 6 && hexStr.length !== 8) return null;
    const r = parseInt(hexStr.slice(0, 2), 16) / 255;
    const g = parseInt(hexStr.slice(2, 4), 16) / 255;
    const b = parseInt(hexStr.slice(4, 6), 16) / 255;
    return rgbToHsl([r, g, b]);
  }
  const m = hslRe.exec(v);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function hslToRgb([h, s, l]: Hsl): [number, number, number] {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return color;
  };
  return [f(0), f(8), f(4)];
}

function rgbToHsl([r, g, b]: [number, number, number]): Hsl {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(c => {
    const c255 = Math.max(0, Math.min(1, c)) * 255;
    const cNorm = c255 / 255;
    return cNorm <= 0.03928 ? cNorm / 12.92 : Math.pow((cNorm + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Hsl, b: Hsl): number {
  const la = luminance(hslToRgb(a));
  const lb = luminance(hslToRgb(b));
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

function extractTheme(css: string, selector: string): Theme {
  const start = css.indexOf(`${selector} {`);
  const end = css.indexOf('}', start);
  const block = css.slice(start, end);
  const vars: Theme = {};
  const re = /--([\w-]+):\s*([^;!]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    const parsed = parseValue(m[2]);
    if (parsed) vars[m[1]] = parsed;
  }
  return vars;
}

const light = extractTheme(globalsCss, ':root');
const dark = extractTheme(globalsCss, '.dark');

function pair(
  name: string,
  fgVar: string,
  bgVar: string,
  options: { lightOnly?: boolean; darkOnly?: boolean } = {}
) {
  return { name, fgVar, bgVar, ...options };
}

// Token pairs that components actually use. Must all be >= 4.5:1 per MVP-SPEC §9.4.
const pairs = [
  pair('Foreground on background', 'foreground', 'background'),
  pair('Primary foreground on primary', 'primary-foreground', 'primary'),
  pair('Secondary foreground on secondary', 'secondary-foreground', 'secondary'),
  pair('Muted foreground on muted', 'muted-foreground', 'muted'),
  pair('Accent foreground on accent', 'accent-foreground', 'accent'),
  pair('Card foreground on card', 'card-foreground', 'card'),
  pair('Popover foreground on popover', 'popover-foreground', 'popover'),
  pair('Destructive foreground on destructive', 'destructive-foreground', 'destructive'),
  pair('Success foreground on success', 'success-foreground', 'success'),
  pair('Warning foreground on warning', 'warning-foreground', 'warning'),
  pair('Chip user', 'chip-user-fg', 'chip-user-bg'),
  pair('Chip AI inferred (outline)', 'chip-ai-inferred', 'background'),
  pair('Chip AI recommended (outline)', 'chip-ai-recommended', 'background'),
  pair('Chip proposed (outline)', 'chip-proposed', 'background'),
  pair('Chip open', 'chip-open-fg', 'chip-open-bg'),
  pair('Link on background', 'link', 'background'),
  pair('Input text on input', 'foreground', 'input'),
];

function assertRatio(theme: Theme, themeName: string, fgVar: string, bgVar: string, name: string) {
  const fg = theme[fgVar];
  const bg = theme[bgVar];
  expect(fg, `${themeName}: ${name} missing ${fgVar}`).toBeDefined();
  expect(bg, `${themeName}: ${name} missing ${bgVar}`).toBeDefined();
  const ratio = contrast(fg, bg);
  expect(
    ratio,
    `${themeName}: ${name} (${fgVar} on ${bgVar}) = ${ratio.toFixed(2)}:1`
  ).toBeGreaterThanOrEqual(4.5);
}

describe('WCAG AA contrast of design tokens', () => {
  it('light mode tokens meet 4.5:1', () => {
    for (const p of pairs) {
      assertRatio(light, 'light', p.fgVar, p.bgVar, p.name);
    }
  });

  it('dark mode tokens meet 4.5:1', () => {
    for (const p of pairs) {
      assertRatio(dark, 'dark', p.fgVar, p.bgVar, p.name);
    }
  });

  it('chip tokens exist in both themes', () => {
    for (const v of [
      'chip-user-bg',
      'chip-user-fg',
      'chip-ai-inferred',
      'chip-ai-recommended',
      'chip-proposed',
      'chip-open-bg',
      'chip-open-fg',
    ]) {
      expect(light[v], `light ${v}`).toBeDefined();
      expect(dark[v], `dark ${v}`).toBeDefined();
    }
  });
});
