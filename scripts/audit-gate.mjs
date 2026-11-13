#!/usr/bin/env node
// Fails when `pnpm audit --prod` reports a high or critical advisory that is not in
// security/audit-allowlist.json, or when an allow-list entry has expired.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const allowlist = JSON.parse(readFileSync(new URL('../security/audit-allowlist.json', import.meta.url), 'utf8'));
const today = new Date().toISOString().slice(0, 10);

let output;
try {
  // A fixed command string: no external input is interpolated.
  output = execSync('pnpm audit --prod --json', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
} catch (error) {
  // pnpm audit exits non-zero whenever it finds advisories; the JSON report is still on stdout.
  output = error.stdout;
  if (!output) throw error;
}

const report = JSON.parse(output);
const findings = Object.values(report.advisories ?? {})
  .filter(({ severity }) => severity === 'high' || severity === 'critical')
  .map(({ github_advisory_id: ghsa, module_name: name, severity, title, findings: found = [] }) => ({
    ghsa, name, severity, title, versions: [...new Set(found.map(({ version }) => version))].join(', '),
  }));

const entries = new Map(allowlist.entries.map((entry) => [entry.ghsa, entry]));
const failures = [];
for (const finding of findings) {
  const entry = entries.get(finding.ghsa);
  const label = `${finding.severity} ${finding.ghsa} ${finding.name}@${finding.versions}: ${finding.title}`;
  if (!entry) failures.push(`not allow-listed: ${label}`);
  else if (entry.expires < today) failures.push(`allow-list entry expired ${entry.expires}: ${label}`);
  else console.log(`accepted until ${entry.expires}: ${label}`);
}

const reported = new Set(findings.map(({ ghsa }) => ghsa));
for (const { ghsa, package: name } of allowlist.entries) {
  if (!reported.has(ghsa)) console.log(`::warning title=Stale audit allow-list entry::${ghsa} (${name}) is no longer reported; remove it from security/audit-allowlist.json`);
}

const counts = report.metadata?.vulnerabilities ?? {};
console.log(`pnpm audit --prod: ${JSON.stringify(counts)}`);
if (failures.length) {
  for (const failure of failures) console.error(`::error title=Dependency audit::${failure}`);
  process.exit(1);
}
console.log(`audit gate passed: ${findings.length} high/critical finding(s), all allow-listed and unexpired`);
