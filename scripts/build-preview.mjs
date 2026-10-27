#!/usr/bin/env node
/**
 * `npm run build:preview`：构建可视化编辑预览站（部署在 Vercel，见 vercel.json 与 DECISIONS §111）。
 *
 * 与线上构建（`npm run build`，纯静态、发布到 ssw.cn）用同一份代码，多设 SSW_VISUAL_PREVIEW=1：
 * astro.config.mjs 挂 Vercel 适配器、注入 /tina-island 端点。后台（可视化编辑）由 build-admin.mjs 构建，
 * 与 ssw.cn 相同；预览的是网站页面本身（页面始终带编辑标记，DECISIONS §120）。
 */
import { spawnSync } from 'node:child_process';

const r = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, SSW_VISUAL_PREVIEW: '1' },
});
process.exit(r.status ?? 1);
