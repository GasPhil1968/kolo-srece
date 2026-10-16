// Run only the browser playthrough: npx tsx tests/e2e/play.ts [url]
import { writeFileSync, mkdirSync } from 'node:fs';
import { launch, serveDist } from './lib';
import { playthrough } from './playthrough';

const given = process.argv[2];
const srv = given ? null : await serveDist();
const url = given ?? srv!.url;
const s = await launch(url);
const r = await playthrough(s.page, { maxMinutes: Number(process.env.NL_MINUTES ?? 40) });
mkdirSync('reports', { recursive: true });
writeFileSync('reports/raw/playthrough.log', r.log.join('\n'));
console.log(JSON.stringify({ ...r, log: r.log.slice(-25) }, null, 1));
console.log(s.errors.slice(0, 20).join('\n'));
await s.browser.close();
srv?.server.close();
process.exit(r.ok ? 0 : 1);
