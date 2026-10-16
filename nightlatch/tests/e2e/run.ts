// Playwright browser test runner. Serves dist/ (run `npm run build` first) unless NL_URL is
// set, runs every case in tests/e2e/suite.ts in a fresh page, and writes
// reports/e2e-report.json and docs/BROWSER_TEST_REPORT.md.
//   npm run e2e                      # everything
//   npx tsx tests/e2e/run.ts title   # cases whose name contains "title"
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { launch, serveDist } from './lib';
import { CASES, type CaseResult, type Check } from './suite';

const filter = process.argv.slice(2).join(' ').toLowerCase();
if (!existsSync('dist/index.html') && !process.env.NL_URL) {
  console.error('dist/ is missing: run `npm run build` first');
  process.exit(2);
}
const srv = process.env.NL_URL ? null : await serveDist();
const url = process.env.NL_URL ?? srv!.url;
mkdirSync('reports/raw', { recursive: true });

const results: (CaseResult & { pageErrors: string[] })[] = [];
for (const c of CASES) {
  if (filter && !c.name.toLowerCase().includes(filter)) continue;
  const t0 = Date.now();
  const checks: Check[] = [];
  let error: string | undefined;
  let extra: Record<string, unknown> | undefined;
  const s = await launch(url);
  try {
    extra = (await c.body(s.page, (name, ok, info) => checks.push({ name, ok, info }))) ?? undefined;
  } catch (e) {
    error = (e as Error).message;
  }
  const pageErrors = s.errors.filter((e) => !/Failed to load resource.*favicon/.test(e));
  await s.browser.close();
  const ok = !error && checks.every((k) => k.ok) && pageErrors.length === 0;
  results.push({ name: c.name, ok, checks, ms: Date.now() - t0, error, extra, pageErrors });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${c.name} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  for (const k of checks) if (!k.ok) console.log(`   x ${k.name}${k.info ? ' — ' + k.info : ''}`);
  if (error) console.log('   error: ' + error);
  for (const e of pageErrors.slice(0, 5)) console.log('   page error: ' + e);
}
srv?.server.close();

const total = results.reduce((a, r) => a + r.checks.length, 0);
const passedChecks = results.reduce((a, r) => a + r.checks.filter((k) => k.ok).length, 0);
writeFileSync('reports/e2e-report.json', JSON.stringify({ generated: new Date().toISOString(), url, results }, null, 1));
let md = '# Night Latch — Browser test report\n\n';
md += `Generated ${new Date().toISOString()} by \`npm run e2e\` (\`tests/e2e/run.ts\`): Playwright driving Chromium against the production build.\n\n`;
md += `> These are automated browser tests. They use real mouse clicks and key presses on the game canvas; no human played these sessions.\n\n`;
md += `**${results.filter((r) => r.ok).length} of ${results.length} cases passed, ${passedChecks} of ${total} checks.**\n\n`;
for (const r of results) {
  md += `## ${r.ok ? '✅' : '❌'} ${r.name} (${(r.ms / 1000).toFixed(0)} s)\n\n`;
  for (const k of r.checks) md += `- ${k.ok ? '✔' : '✘'} ${k.name}${k.info && !k.ok ? ` — ${k.info}` : ''}\n`;
  if (r.error) md += `- ✘ error: ${r.error}\n`;
  if (r.pageErrors.length) md += `- ✘ ${r.pageErrors.length} page errors, first: \`${r.pageErrors[0].slice(0, 200)}\`\n`;
  if (r.extra) md += `\n\`\`\`json\n${JSON.stringify(r.extra, null, 1)}\n\`\`\`\n`;
  md += '\n';
}
md += 'Screenshots: `reports/screens/` (title, menus, notebook, every room, chapter openings and the ending).\n';
writeFileSync('docs/BROWSER_TEST_REPORT.md', md);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} cases, ${passedChecks}/${total} checks`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
