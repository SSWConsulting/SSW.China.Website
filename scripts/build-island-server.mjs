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
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

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

// 产物里写死了构建机的绝对路径（file:///home/runner/…，适配器启动时据此推算 client 目录）。
// Windows 上的 Node 解析不了不带盘符的 file URL，服务一启动就报 ERR_INVALID_FILE_URL_PATH（2026-10-27 实测）。
// 换成带盘符的假路径：Windows 解析为 C:\ssw-build\…，Linux/macOS 解析为 /C:/ssw-build/…，两边都合法；
// 运行时只用到 server 与 client 的相对位置，不访问这个路径本身。
const buildRoot = `${pathToFileURL(process.cwd()).href}/`;
let replaced = 0;
for (const file of readdirSync(join(OUT, 'server'), { recursive: true })) {
  if (!String(file).endsWith('.mjs')) continue;
  const p = join(OUT, 'server', String(file));
  const src = readFileSync(p, 'utf8');
  if (!src.includes(buildRoot)) continue;
  writeFileSync(p, src.replaceAll(buildRoot, 'file:///C:/ssw-build/'));
  replaced++;
}
if (replaced === 0) {
  console.error(
    `\n✖ 预览服务产物里没找到构建路径 ${buildRoot}，适配器的产物格式可能变了，检查后再改这里。\n`,
  );
  process.exit(1);
}

// Node 适配器把静态文件放在 <outDir>/client/。admin/ 是后台本身，media/ 两边按根路径引用，不复制。
const STATIC = join(OUT, 'client');
const SKIP = new Set(['admin', 'media']);
const PREVIEW = 'dist/admin/preview';
rmSync(PREVIEW, { recursive: true, force: true });
for (const name of readdirSync(STATIC)) {
  if (!SKIP.has(name)) cpSync(join(STATIC, name), join(PREVIEW, name), { recursive: true });
}
