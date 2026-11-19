// Leonida Trophy Guide — entrypoint (Node 22, standard library only).
// The guide itself is plain static files in app/ (index.html, app.js,
// style.css, data/trophies.json) that run offline in a browser. This program
// hands the entry in: it copies app/ and screenshots/ from beside this file
// to /output and writes /output/dossier.json with the vendored make.fun
// library (vendor/makefun-frontend.ts, unchanged from the kit). The dossier
// is what the judge reads: the screenshots, the first load's files and
// bytes, and the source. Outside the grader, MAKEFUN_OUTPUT_DIR stands in
// for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate refuses an entry without 3 or 4 screenshots, so fail loudly here
// instead of handing in an entry the scorer would reject.
const shotsDir = join(here, 'screenshots');
const shotCount = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((f) => statSync(join(shotsDir, f)).isFile()).length
  : 0;
if (shotCount < 3 || shotCount > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shotCount}`);
}
if (!existsSync(join(here, 'app', 'index.html'))) {
  throw new Error('app/index.html is missing');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

// My own confirmation line, so a run says what it handed in.
console.log(`Leonida Trophy Guide handed in: ${shotCount} screenshots, app/ + dossier.json in ${out}`);
