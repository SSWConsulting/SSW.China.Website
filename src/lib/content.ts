import { z } from 'astro/zod';

/**
 * 读取 content/ 下由 TinaCMS 编辑的 JSON，并按 schema 校验。
 *
 * 校验失败 ⇒ **构建失败**，并指出是哪个文件的哪个字段。后台里把必填文案清空、
 * 或手工改坏 JSON，都不会悄悄上线一个缺字的页面。
 * （站点素材配置 content/settings/site.json 走另一条路：src/config/site.ts，
 * 那里的「缺失」有明确的降级含义，不是错误。）
 */

const files = import.meta.glob<unknown>('../../content/**/*.json', {
  eager: true,
  import: 'default',
});

export function load<S extends z.ZodType>(rel: string, schema: S): z.infer<S> {
  const key = `../../content/${rel}.json`;
  if (!(key in files)) throw new Error(`content/${rel}.json 不存在`);
  const result = schema.safeParse(files[key]);
  if (!result.success) {
    const issues = result.error.issues.map(
      (i) => `  · ${i.path.join('.') || '(根)'}：${i.message}`,
    );
    throw new Error(`content/${rel}.json 不符合要求：\n${issues.join('\n')}`);
  }
  return result.data;
}

/**
 * 多行文本 ⇒ HTML：转义后把换行变成 <br />（标题断行、地址）。
 * 配合 `<Fragment set:html={br(x)} />` 使用。
 */
export function br(text: string): string {
  return text
    .split('\n')
    .map((line) =>
      line
        .trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;'),
    )
    .join('<br />');
}

// ── schema 积木 ─────────────────────────────────────────────────────────────

/** 必填文案：不能为空。 */
export const req = z.string().trim().min(1, '必填，不能为空');
/** 选填文案：空串视同未填。 */
export const opt = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? v : undefined));
export const link = z.object({ label: req, href: req });
export const list = <T extends z.ZodType>(item: T, min = 1) =>
  z.array(item).min(min, `至少需要 ${min} 项`);
