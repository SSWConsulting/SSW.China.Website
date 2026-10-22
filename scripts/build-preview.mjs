#!/usr/bin/env node
/**
 * `npm run build:preview`：构建可视化编辑预览站（部署在 Vercel，见 vercel.json 与 DECISIONS §111）。
 *
 * 与线上构建（`npm run build`，纯静态、发布到 ssw.cn）用同一份代码，只多设两个开关：
 * - TINA_PUBLIC_VISUAL_EDITING=1：后台带 router ⇒ 打开文档即「左表单、右预览」（同 npm run dev）。
 * - SSW_VISUAL_PREVIEW=1：astro.config.mjs 挂 Vercel 适配器、注入 /tina-island 端点，
 *   页面带上可编辑区域标记（Editable.astro）。
 *
 * 不设这两个开关时，`npm run build` 的产物与接入前逐字节相同。
 */
import { spawnSync } from 'node:child_process';

const r = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, TINA_PUBLIC_VISUAL_EDITING: '1', SSW_VISUAL_PREVIEW: '1' },
});
process.exit(r.status ?? 1);
