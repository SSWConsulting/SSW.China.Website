import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { siteConfig } from '../src/config/site.config';

/**
 * 本地 Vite 插件：为静态 index.html 提供三个构建期原语。
 *
 *   <!-- @include sections/hero.html -->        分区块引入（递归、限深）
 *   <!-- @if wecom.qrImage --> A
 *   <!-- @else --> B
 *   <!-- @endif -->                             配置驱动的条件渲染（可嵌套）
 *   {{ wecom.qrImage.src }}                     插值（HTML 转义）
 *
 * 条件与插值全部在构建期求值，因此「素材缺失时的诚实降级」在 JS 关闭时
 * 同样成立 —— 缺失分支的标记根本不会进入产物。
 */

const MAX_DEPTH = 8;

const OPEN_IF = /<!--\s*@if\s/;
/** 最内层 @if 块：块体内不再出现 @if 开标签，因此嵌套可由反复求值解决。 */
const INNERMOST_IF = /<!--\s*@if\s+([\w.]+)\s*-->((?:(?!<!--\s*@if\s)[\s\S])*?)<!--\s*@endif\s*-->/;
const ELSE = /<!--\s*@else\s*-->/;
const INCLUDE = /<!--\s*@include\s+([\w./-]+)\s*-->/g;
const INTERP = /\{\{\s*([\w.]+)\s*\}\}/g;

function lookup(path: string): unknown {
  let cur: unknown = siteConfig;
  for (const key of path.split('.')) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function expandIncludes(
  html: string,
  root: string,
  depth: number,
  watch: (f: string) => void,
): string {
  if (depth > MAX_DEPTH) throw new Error(`@include 嵌套超过 ${MAX_DEPTH} 层，疑似循环引用`);
  return html.replace(INCLUDE, (_m, rel: string) => {
    const file = resolve(root, 'src', rel);
    watch(file);
    let body: string;
    try {
      body = readFileSync(file, 'utf8');
    } catch {
      throw new Error(`@include 找不到文件：src/${rel}`);
    }
    return expandIncludes(body, root, depth + 1, watch);
  });
}

function resolveConditionals(html: string): string {
  let out = html;
  let guard = 0;
  while (OPEN_IF.test(out)) {
    if (++guard > 200) throw new Error('@if 求值未收敛，请检查是否缺少 @endif');
    const before = out;
    out = out.replace(INNERMOST_IF, (_m, key: string, body: string) => {
      const parts = body.split(ELSE);
      if (parts.length > 2) throw new Error(`@if ${key} 内出现多个 @else`);
      const truthy = parts[0] ?? '';
      const falsy = parts[1] ?? '';
      return lookup(key) ? truthy : falsy;
    });
    if (out === before) throw new Error('检测到未闭合的 @if（缺少 @endif）');
  }
  if (/<!--\s*@(else|endif)\s*-->/.test(out)) {
    throw new Error('检测到孤立的 @else / @endif（缺少对应的 @if）');
  }
  return out;
}

function interpolate(html: string): string {
  return html.replace(INTERP, (_m, key: string) => {
    const value = lookup(key);
    // 拼错的键必须报错，而不是静默输出空属性 —— 空的 src/href 是发布事故。
    if (value === undefined) throw new Error(`{{ ${key} }} 在 siteConfig 中不存在`);
    if (value === null) throw new Error(`{{ ${key} }} 为 null；请用 @if 包裹后再插值`);
    return escapeHtml(String(value));
  });
}

export function htmlInclude(): Plugin {
  return {
    name: 'ssw-html-include',
    enforce: 'pre',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const root = process.cwd();
        const watch = (f: string) => ctx.server?.watcher.add(f);
        return interpolate(resolveConditionals(expandIncludes(html, root, 0, watch)));
      },
    },
  };
}
