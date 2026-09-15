#!/usr/bin/env node
/** 把 Inter 拉丁子集从 node_modules 拷到 public/fonts/（该文件随仓库提交）。 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const from = resolve(
  root,
  'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
);
const toDir = resolve(root, 'public/fonts');
const to = resolve(toDir, 'inter-latin-wght-normal.woff2');

if (!existsSync(from)) {
  console.error('✗ 找不到源文件，请先 npm install：', from);
  process.exit(1);
}
mkdirSync(toDir, { recursive: true });
copyFileSync(from, to);
console.log('✓ 已同步 Inter 拉丁子集 →', to.replace(root + '/', ''));
