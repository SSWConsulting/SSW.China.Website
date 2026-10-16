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
