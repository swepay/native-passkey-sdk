// packages/core/src/release-hygiene.test.ts
// Guarda de release: apps/* nunca podem ser publicados no npm.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

describe('release hygiene — apps/* fora do npm', () => {
  const appDirs = readdirSync(join(repoRoot, 'apps'), { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  it('existe pelo menos um app para o teste fazer sentido', () => {
    expect(appDirs.length).toBeGreaterThan(0);
  });

  it.each(appDirs)('apps/%s/package.json tem private: true', (app) => {
    const pkg = readJson(join(repoRoot, 'apps', app, 'package.json'));
    expect(pkg.private).toBe(true);
  });

  it('script publish da raiz exclui ./apps/* do build e publica só via changesets', () => {
    const root = readJson(join(repoRoot, 'package.json'));
    expect(root.scripts.publish).toContain('--filter=!./apps/*');
    expect(root.scripts.publish).toContain('changeset publish');
    expect(root.scripts.publish).not.toMatch(/pnpm\s+publish\s+-r|npm\s+publish/);
  });

  it('changesets: cada app está em `ignore` ou é private (changeset publish nunca publica private)', () => {
    const cfg = readJson(join(repoRoot, '.changeset/config.json'));
    for (const app of appDirs) {
      const pkg = readJson(join(repoRoot, 'apps', app, 'package.json'));
      const covered = cfg.ignore.includes(pkg.name) || pkg.private === true;
      expect(covered, `${pkg.name} sem proteção de publish`).toBe(true);
      expect(cfg.fixed.flat()).not.toContain(pkg.name);
    }
    expect(cfg.access).toBe('public');
    expect(cfg.baseBranch).toBe('main');
  });

  it('release.yml publica só via `changeset publish --provenance` e não roda publish recursivo', () => {
    const yml = readFileSync(join(repoRoot, '.github/workflows/release.yml'), 'utf8');
    expect(yml).toMatch(/publish:\s*pnpm changeset publish --provenance/);
    expect(yml).not.toMatch(/pnpm\s+publish\s+-r|npm\s+publish|pnpm\s+-r\s+publish/);
    expect(yml).toMatch(/pnpm build --filter=!docs/);
  });
});
