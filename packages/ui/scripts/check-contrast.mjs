import { readFileSync } from 'node:fs';

// Entrance token model: seven label tones (label fg on label tone) plus fixed palette pairs.
const css = readFileSync(new URL('../tokens/tokens.css', import.meta.url), 'utf8');
const themes = [...css.matchAll(/\[data-label="([^"]+)"\]\s*\{\s*--label-tone:\s*(#[\da-fA-F]{6});\s*--label-photo:\s*(#[\da-fA-F]{6});\s*--label-fg:\s*(#[\da-fA-F]{6});/g)];
const token = (name) => {
  const match = css.match(new RegExp(`--${name}:\\s*(#[\\da-fA-F]{6})`));
  if (!match) throw new Error(`Token --${name} is missing or not a hex colour.`);
  return match[1];
};

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((channel) => parseInt(channel, 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

if (themes.length !== 7) throw new Error(`Expected seven label themes; found ${themes.length}.`);
const failures = [];
const report = [];
for (const [, name, tone, , fg] of themes) {
  const ratio = contrast(fg, tone);
  report.push(`${name} fg/tone ${ratio.toFixed(2)}`);
  if (ratio < 4.5) failures.push(`${name}: --label-fg on --label-tone ${ratio.toFixed(2)}:1 (needs 4.5:1)`);
}

const pairs = [
  ['ink on paper', token('ink'), token('paper')],
  ['muted on paper', token('muted'), token('paper')],
  ['signal-text on paper', token('signal-text'), token('paper')],
  ['white on signal', '#FFFFFF', token('signal')],
  ['muted-on-ink on ink', token('muted-on-ink'), token('ink')],
  ['quiet-on-ink on ink', token('quiet-on-ink'), token('ink')],
];
for (const [name, fg, bg] of pairs) {
  const ratio = contrast(fg, bg);
  report.push(`${name} ${ratio.toFixed(2)}`);
  if (ratio < 4.5) failures.push(`${name}: ${ratio.toFixed(2)}:1 (needs 4.5:1)`);
}

if (failures.length) throw new Error(failures.join('\n'));
process.stdout.write(`Contrast check passed for ${themes.length} label themes and ${pairs.length} palette pairs.\n${report.join('\n')}\n`);
