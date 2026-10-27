#!/usr/bin/env node
/**
 * `npm run build:island-server`：ssw.cn 服务器上的可视化编辑预览服务（DECISIONS §117）。
 * 在 `npm run build` 之后运行（要用它生成的 TinaCloud 客户端与 dist/）。
 *
 * 同一份代码以 SSW_VISUAL_PREVIEW=1 + Node 适配器再构建一次，产出两样东西：
 * - 预览页（带编辑标记，资源走 /admin/preview 前缀）：复制进 dist/admin/preview/，随网站一起发布。
 * - dist-island/server/：只负责 /tina-island/ 的 Node 服务，依赖已全部打进产物，
 *   服务器上用 deploy/island-server/supervisor.mjs 常驻运行，nginx 把 /tina-island/ 转给它。
 *
 * 不影响 dist/ 里的网站页面。
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'dist-island';

if (!existsSync('tina/__generated__/client.ts') || !existsSync('dist/admin/index.html')) {
  console.error('\n✖ 先运行 npm run build（需要 TinaCloud 凭据），再构建预览服务。\n');
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
const r = spawnSync('npx', ['astro', 'build', '--outDir', OUT], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, SSW_VISUAL_PREVIEW: '1', SSW_PREVIEW_ADAPTER: 'node' },
});
if (r.status !== 0) process.exit(r.status ?? 1);

// Node 适配器把静态文件放在 <outDir>/client/。admin/ 是后台本身，media/ 两边按根路径引用，不复制。
const STATIC = join(OUT, 'client');
const SKIP = new Set(['admin', 'media']);
const PREVIEW = 'dist/admin/preview';
rmSync(PREVIEW, { recursive: true, force: true });
for (const name of readdirSync(STATIC)) {
  if (!SKIP.has(name)) cpSync(join(STATIC, name), join(PREVIEW, name), { recursive: true });
}
