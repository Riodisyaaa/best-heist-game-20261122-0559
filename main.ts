// The Starlight Job — hand-in program (Node 22, standard library only).
//
// It gathers the game (game/) and its screenshots (screenshots/) from beside
// this file into the output directory and writes dossier.json with the
// vendored make.fun library, exactly the summary the judge reads. The program
// is deterministic: the same repository always writes the same bytes.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Start from a clean slate so a stale file can never leak into the hand-in.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The dossier is built last, from the copied files themselves, so it always
// describes exactly the bytes the grader will see — never the repository's
// working copies. The caps mirror the gate's own limits (see the kit's
// RULES.txt): at most four screenshots, each at most 256 KiB; game/ at most
// 993 entries and 48 MiB; the dossier text at most 160 KiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
