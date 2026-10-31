import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

/** Generate SEO exports from this build, including content-only Tina edits. */
export default function seoArtifacts() {
  let root;
  let output;
  return {
    name: 'ssw-seo-artifacts',
    hooks: {
      'astro:config:done': ({ config, buildOutput }) => {
        root = fileURLToPath(config.root);
        output = fileURLToPath(buildOutput === 'static' ? config.outDir : config.build.client);
      },
      'astro:build:done': () => {
        // Vercel copies this directory to its final static output in a later hook.
        if (!existsSync(resolve(output, 'index.html'))) {
          throw new Error('Cannot locate rendered pages for SEO generation');
        }
        const result = spawnSync(
          process.execPath,
          [resolve(root, 'scripts/seo.mjs'), '--output-dir', output],
          { cwd: root, stdio: 'inherit' },
        );
        if (result.error) throw result.error;
        if (result.status !== 0) throw new Error('SEO artifact generation failed');
      },
    },
  };
}
