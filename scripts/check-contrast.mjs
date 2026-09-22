#!/usr/bin/env node
/**
 * 从 tokens.css 读取真实令牌值，校验实际使用到的每一组前后景对比度。
 * 阈值：正文 ≥4.5:1，大字号与 UI 边界 ≥3:1。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(resolve(root, 'src/styles/tokens.css'), 'utf8');

/** 分别取出深色（:root）与浅色（:root[data-theme='light']）两套令牌。 */
function block(startRe) {
  const m = css.match(startRe);
  if (!m) return '';
  const from = m.index + m[0].length;
  let depth = 1;
  for (let i = from; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(from, i);
  }
  return '';
}

function parse(text) {
  const out = {};
  for (const [, name, value] of text.matchAll(/(--c-[\w-]+):\s*(#[0-9a-fA-F]{3,6});/g)) {
    out[name] = value;
  }
  return out;
}

const darkTokens = parse(block(/:root\s*\{/));
const lightOverrides = parse(block(/:root\[data-theme='light'\]\s*\{/));
const lightTokens = { ...darkTokens, ...lightOverrides };

if (!Object.keys(lightOverrides).length) {
  console.log("\n✗ 未找到浅色主题令牌块 :root[data-theme='light']\n");
  process.exit(1);
}

const channel = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function luminance(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

// [前景, 背景, 最低要求, 用途]
const pairs = [
  ['--c-text', '--c-bg', 4.5, '主文字'],
  ['--c-text', '--c-panel', 4.5, '主文字（面板／节点）'],
  ['--c-text-2', '--c-bg', 4.5, '次文字'],
  ['--c-text-2', '--c-panel', 4.5, '次文字（面板）'],
  ['--c-text-3', '--c-bg', 4.5, '辅助文字'],
  ['--c-text-3', '--c-panel', 4.5, '辅助文字（面板）'],
  ['--c-on-brand', '--c-brand', 4.5, '红底白字（默认态）'],
  ['--c-on-brand', '--c-brand-hover', 4.5, '红底白字（悬停）'],
  ['--c-on-brand', '--c-brand-active', 4.5, '红底白字（按下）'],
  ['--c-brand', '--c-bg', 3, '品牌红作为 UI 边界／大字号'],
  ['--c-brand', '--c-panel', 3, '品牌红在面板上（节点边界）'],
  ['--c-control', '--c-bg', 3, '控件边界／语义连线'],
  ['--c-control', '--c-panel', 3, '控件边界（面板上）'],
  ['--c-focus', '--c-bg', 3, '键盘焦点环'],
  ['--c-brand-text', '--c-bg', 4.5, '可用于文字的红'],
  ['--c-brand-text', '--c-panel', 4.5, '可用于文字的红（面板）'],
  ['--c-text', '--c-card', 4.5, '主文字（核心服务卡片）'],
  ['--c-text-2', '--c-card', 4.5, '次文字（核心服务卡片）'],
  ['--c-text', '--c-card-hover', 4.5, '主文字（卡片悬停态）'],
  ['--c-text-2', '--c-card-hover', 4.5, '次文字（卡片悬停态）'],
  ['--c-bg', '--c-text', 4.5, '卡片右下角箭头（反色圆钮）'],
  ['--c-product-text', '--c-tina', 4.5, 'Tina 卡片白字'],
  ['--c-product-text', '--c-tina-hover', 4.5, 'Tina 卡片白字（悬停）'],
  ['--c-product-text', '--c-product-bg', 4.5, 'YakShaver 卡片主文字'],
  ['--c-product-text-2', '--c-product-bg', 4.5, 'YakShaver 卡片正文'],
  ['--c-product-text-2', '--c-product-bg-hover', 4.5, 'YakShaver 卡片正文（悬停）'],
  ['--c-product-bg', '--c-product-text', 4.5, '产品卡片「了解」按钮（反色）'],
  ['--c-footer-head', '--c-footer-bg', 4.5, '页脚栏目标题'],
  ['--c-footer-text', '--c-footer-bg', 4.5, '页脚链接'],
  ['--c-footer-text-2', '--c-footer-bg', 4.5, '页脚法律信息'],
  ['--c-text', '--c-case-card', 4.5, '案例副卡标题'],
  ['--c-text-2', '--c-case-card', 4.5, '案例副卡简介'],
  ['--c-control', '--c-case-card', 3, '案例副卡「示例内容」角标边框'],
  ['--c-text', '--c-surface-deep', 4.5, '说明卡主文字'],
  ['--c-hero-ink', '--c-hero-worst', 4.5, 'AI 应用定制页首屏白字（压暗照片最坏底色）'],
  ['--c-hero-ink-2', '--c-hero-worst', 4.5, 'AI 应用定制页首屏副文案（同上）'],
  ['--c-text-2', '--c-surface-deep', 4.5, '说明卡引言与徽章说明'],
];

let failed = 0;

function runTheme(name, tokens) {
  console.log(`\n对比度校验 · ${name}（来源：src/styles/tokens.css）\n`);
  for (const [fg, bg, min, use] of pairs) {
    const a = tokens[fg];
    const b = tokens[bg];
    if (!a || !b) {
      console.log(`  ✗ 令牌缺失：${fg} 或 ${bg}`);
      failed++;
      continue;
    }
    const r = ratio(a, b);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(
      `  ${ok ? '✓' : '✗'} ${r.toFixed(2).padStart(5)}:1  (≥${min})  ${fg} on ${bg}  — ${use}`,
    );
  }
  const brandOnBg = ratio(tokens['--c-brand'], tokens['--c-bg']);
  console.log(
    `\n  注：品牌红在页面底色上为 ${brandOnBg.toFixed(2)}:1 —— ` +
      `实现中一律不用于文字，仅用于大字号、UI 边界与装饰。`,
  );
}

runTheme('深色主题', darkTokens);
runTheme('浅色主题', lightTokens);
console.log('');

/* 自动化守卫：品牌红 --c-brand 不得作为文字颜色（border-color/background 不受限）。
   交接文档 §7 要求「品牌红避免作为深色背景上的小字号正文」，实测 3.72:1 也确实不达标。
   文字需要红色时用 --c-brand-text（两套主题均 ≥4.5:1）。
   纯图标可以用 --c-brand（WCAG 只要求非文字内容 ≥3:1），但必须在同一行标注「图标」。 */
const styleDir = resolve(root, 'src/styles');
const offenders = [];
for (const file of readdirSync(styleDir)) {
  if (!file.endsWith('.css')) continue;
  const text = readFileSync(resolve(styleDir, file), 'utf8');
  text.split('\n').forEach((line, i) => {
    const isColour = /(?<![-\w])color:\s*var\(--c-brand\)/.test(line);
    if (isColour && !line.includes('图标')) {
      offenders.push(`src/styles/${file}:${i + 1}  ${line.trim()}`);
    }
  });
}
if (offenders.length) {
  console.log('\n✗ 品牌红被用作文字颜色（正文尺寸下仅 3.72:1，不合规）：\n');
  for (const o of offenders) console.log(`    ${o}`);
  failed += offenders.length;
} else {
  console.log('  ✓ 品牌红未被用作任何文字颜色。');
}

if (failed > 0) {
  console.log(`\n✗ ${failed} 组未达标。\n`);
  process.exit(1);
}
console.log('\n✓ 全部达标。\n');
