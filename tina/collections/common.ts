import type { Collection } from 'tinacms';
import { group, longText, text } from '../fields';

/** 每个页面都有的 SEO 字段。 */
export const seo = group('seo', 'SEO', [
  text('title', '浏览器标题', { required: true, description: '也用作 og:title。' }),
  longText('description', '页面描述', {
    required: true,
    description: '搜索结果与社交分享的摘要，不超过 160 字。',
  }),
]);

/** 页面自己的收尾 CTA。留空 ⇒ 用「全站通用 → 收尾 CTA（默认）」。 */
export const ctaOverride = group(
  'cta',
  '收尾 CTA（本页专用）',
  [text('title', '标题'), text('lead', '导语'), text('button', '按钮文字')],
  { description: '三项都填才生效；否则使用全站默认文案。' },
);

/**
 * 本地可视化编辑的预览入口（`ui.router`）：**只在 TINA_PUBLIC_VISUAL_EDITING=1 时设置**。
 *
 * 设了 router，后台就用「左边表单、右边实时预览」打开文档；预览要靠本地 `astro dev` 的
 * /tina-island 端点（dev/visual-editing/）。这个开关只由 `npm run dev`（scripts/dev.mjs）设置；
 * 线上构建（scripts/build-admin.mjs）不设 ⇒ 没有 router ⇒ 表单编辑 ——
 * 线上没有预览端点，设了反而只剩「form fields will appear here」（DECISIONS §106、§108）。
 * Tina 打包后台时把 TINA_PUBLIC_* 替换成常量。不能用 NODE_ENV：实测 `tinacms build` 打包时它不是 production。
 *
 * scripts/build-admin.mjs 构建可视化后台时另设 TINA_PUBLIC_PREVIEW_BASE=/admin/preview：预览页挂在 /admin/preview/ 下，
 * 与线上页面分开（DECISIONS §116、§117）。Tina 后台只预览同源页面，所以预览页必须在 ssw.cn 自己名下。
 */
type Router = NonNullable<NonNullable<Collection['ui']>['router']>;

const previewBase = process.env.TINA_PUBLIC_PREVIEW_BASE ?? '';

export const localPreview = (router: Router): { router?: Router } =>
  process.env.TINA_PUBLIC_VISUAL_EDITING === '1'
    ? {
        router: async (args) => {
          const path = await router(args);
          return path === undefined ? undefined : `${previewBase}${path}`;
        },
      }
    : {};
