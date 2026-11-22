// The Starlight Job — a top-down stealth heist game.
// Deterministic: the same repo always writes the same bytes to the output dir.
// MAKEFUN_OUTPUT_DIR stands in for /output when running outside the grader.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Clear only the CONTENTS of the output dir. The grader mounts /output as a
// volume, so removing the dir itself would fail with EBUSY ("Device or
// resource busy"). Removing each entry instead works on a mount point.
if (existsSync(outDir)) {
  for (const entry of readdirSync(outDir)) {
    rmSync(join(outDir, entry), { recursive: true, force: true });
  }
}
mkdirSync(outDir, { recursive: true });

// Copy the game and its screenshots into the output dir. The dossier is
// built from these copies, so what the grader reads is exactly what shipped.
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
const screenshotsDir = join(repoRoot, 'screenshots');
if (existsSync(screenshotsDir)) {
  cpSync(screenshotsDir, join(outDir, 'screenshots'), { recursive: true });
}

// Build the dossier LAST, from the copied files, and write it out.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
