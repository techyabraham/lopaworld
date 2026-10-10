import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../tokens/tokens.css', import.meta.url), 'utf8');
const themes = [...css.matchAll(/\[data-label="([^"]+)"\]\s*\{\s*--accent:\s*(#[\da-fA-F]{6});\s*--accent-contrast:\s*(#[\da-fA-F]{6});/g)];

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((channel) => parseInt(channel, 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function mixWithWhite(hex, amount) {
  const channels = hex.slice(1).match(/../g).map((channel) => parseInt(channel, 16));
  return `#${channels.map((channel) => Math.round(channel * amount + 255 * (1 - amount)).toString(16).padStart(2, '0')).join('')}`;
}

if (themes.length !== 7) throw new Error(`Expected seven label themes; found ${themes.length}.`);
const failures = [];
for (const [, name, accent, accentText] of themes) {
  const textRatio = contrast(accent, '#f8f6f1');
  const buttonRatio = contrast(accent, accentText);
  const badgeRatio = contrast(accent, mixWithWhite(accent, 0.1));
  if (textRatio < 4.5) failures.push(`${name}: accent text contrast ${textRatio.toFixed(2)}:1 (needs 4.5:1)`);
  if (buttonRatio < 4.5) failures.push(`${name}: accent button contrast ${buttonRatio.toFixed(2)}:1 (needs 4.5:1)`);
  if (badgeRatio < 4.5) failures.push(`${name}: accent badge contrast ${badgeRatio.toFixed(2)}:1 (needs 4.5:1)`);
}
if (failures.length) throw new Error(failures.join('\n'));
process.stdout.write(`Contrast check passed for ${themes.length} label themes.\n`);
