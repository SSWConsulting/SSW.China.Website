#!/usr/bin/env node
/**
 * `npm run dev`：网站 + 本地 Tina 后台，并开启首页的可视化编辑（左边表单、右边实时预览）。
 *
 * 用 Node 设置环境变量再启动 tinacms，而不是在 package.json 里写 `X=1 tinacms dev`，
 * 是为了在 Windows 上也能用。TINA_PUBLIC_VISUAL_EDITING 只在这里设置：
 * 线上构建（scripts/build-admin.mjs）不设，后台就保持表单编辑。见 docs/DECISIONS.md §108。
 */
import { spawn } from 'node:child_process';

const win = process.platform === 'win32';
// Windows 上 shell: true 会把参数原样拼成一条命令行，不加引号 `astro dev` 会被拆成两个参数，tinacms 报 Command not found。
const child = spawn(
  'npx',
  ['tinacms', 'dev', '--noTelemetry', '-c', win ? '"astro dev"' : 'astro dev'],
  {
    stdio: 'inherit',
    shell: win,
    env: { ...process.env, TINA_PUBLIC_VISUAL_EDITING: '1' },
  },
);
child.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
