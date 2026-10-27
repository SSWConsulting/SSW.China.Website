#!/usr/bin/env node
/**
 * `npm run build:preview`：构建可视化编辑预览站（部署在 Vercel，见 vercel.json 与 DECISIONS §111）。
 *
 * 与线上构建（`npm run build`，纯静态、发布到 ssw.cn）用同一份代码，多设 SSW_VISUAL_PREVIEW=1：
 * astro.config.mjs 挂 Vercel 适配器、注入 /tina-island 端点，页面带上可编辑区域标记（Editable.astro），
 * 打包资源走 /admin/preview 前缀（assetsPrefix）。后台（可视化编辑）由 build-admin.mjs 构建，与 ssw.cn 相同。
 *
 * 构建完把页面与资源复制一份到 /admin/preview/ 下：后台预览的页面地址带这个前缀（DECISIONS §116、§117）。
 *
 * 不设这个开关时，`npm run build` 的网站页面与接入前逐字节相同。
 */
import { spawnSync } from 'node:child_process';
import { cpSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const r = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, SSW_VISUAL_PREVIEW: '1' },
});
if (r.status !== 0) process.exit(r.status ?? 1);

// @astrojs/vercel 把静态文件放在这里。admin/ 是后台本身，media/ 体积大且两边都按根路径引用，不复制。
const STATIC = '.vercel/output/static';
const SKIP = new Set(['admin', 'media']);
for (const name of readdirSync(STATIC)) {
  if (!SKIP.has(name))
    cpSync(join(STATIC, name), join(STATIC, 'admin/preview', name), { recursive: true });
}
