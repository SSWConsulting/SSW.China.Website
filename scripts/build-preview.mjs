#!/usr/bin/env node
/**
 * `npm run build:preview`：构建可视化编辑预览站（部署在 Vercel，见 vercel.json 与 DECISIONS §111）。
 *
 * 与线上构建（`npm run build`，纯静态、发布到 ssw.cn）用同一份代码，只多设两个开关：
 * - TINA_PUBLIC_VISUAL_EDITING=1：后台带 router ⇒ 打开文档即「左表单、右预览」（同 npm run dev）。
 * - SSW_VISUAL_PREVIEW=1：astro.config.mjs 挂 Vercel 适配器、注入 /tina-island 端点，
 *   页面带上可编辑区域标记（Editable.astro）。
 *
 * - TINA_PUBLIC_PREVIEW_BASE=/admin/preview：后台预览的页面地址加这个前缀，
 *   页面的打包资源也走这个前缀（astro.config.mjs 的 assetsPrefix）。构建完把页面与资源复制一份到
 *   /admin/preview/ 下，预览站直接按文件提供（不用 vercel.json 改写：改写与适配器的兜底路由谁先生效不好保证）。
 *   这样 ssw.cn 只要把 /admin/ 反代到预览站，预览页与资源都在 ssw.cn 名下（DECISIONS §116）。
 *
 * 不设这些开关时，`npm run build` 的产物与接入前逐字节相同。
 */
import { spawnSync } from 'node:child_process';
import { cpSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const r = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    TINA_PUBLIC_VISUAL_EDITING: '1',
    SSW_VISUAL_PREVIEW: '1',
    TINA_PUBLIC_PREVIEW_BASE: '/admin/preview',
  },
});
if (r.status !== 0) process.exit(r.status ?? 1);

// @astrojs/vercel 把静态文件放在这里。admin/ 是后台本身，media/ 体积大且两边都按根路径引用，不复制。
const STATIC = '.vercel/output/static';
const SKIP = new Set(['admin', 'media']);
for (const name of readdirSync(STATIC)) {
  if (!SKIP.has(name))
    cpSync(join(STATIC, name), join(STATIC, 'admin/preview', name), { recursive: true });
}
