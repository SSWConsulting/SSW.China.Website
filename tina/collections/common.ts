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
 * 可视化编辑的预览入口（`ui.router`）：**只在 TINA_PUBLIC_VISUAL_EDITING=1 时设置**。
 *
 * 设了 router，后台就用「左边表单、右边实时预览」打开文档，预览的就是网站页面本身
 * （页面始终带编辑标记，Editable.astro）；实时更新靠 /tina-island 端点。设置它的地方：
 * `npm run dev`（scripts/dev.mjs，端点在 dev/visual-editing/）与 scripts/build-admin.mjs 构建的 /admin/
 * （ssw.cn 上端点是服务器本机的预览服务）。/admin/forms/ 不设 ⇒ 表单编辑，不依赖预览服务。
 * 没有端点的环境设了 router，后台只剩「form fields will appear here」（DECISIONS §106、§108、§117、§120）。
 * Tina 打包后台时把 TINA_PUBLIC_* 替换成常量。不能用 NODE_ENV：实测 `tinacms build` 打包时它不是 production。
 */
type Router = NonNullable<NonNullable<Collection['ui']>['router']>;

export const localPreview = (router: Router): { router?: Router } =>
  process.env.TINA_PUBLIC_VISUAL_EDITING === '1' ? { router } : {};
