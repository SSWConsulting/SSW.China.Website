import { z } from 'astro/zod';
import { list, load, opt, req } from './content.ts';
import { seoSchema } from './pages.ts';

/**
 * 「AI 底座中台」与「AI 业务工作流」两页同构：同一套区块、同一个模板
 * （components/service/ServicePage.astro），各自一份文案。
 */

const image = z.object({
  src: req,
  w: z.number().int().positive(),
  h: z.number().int().positive(),
});
const head = z.object({ eyebrow: req, title: req, intro: opt });
const titled = z.object({ title: req, text: req });

export const serviceSchema = z.object({
  seo: seoSchema,
  /** 服务名称：页面大标题、面包屑末项、结构化数据 Service.name。 */
  name: req,
  hero: z.object({
    image,
    lede: req,
    body: req,
    primaryButton: req,
    secondaryButton: req,
  }),
  pillars: head.extend({ intro: req, items: list(titled) }),
  usecases: head.extend({ items: list(titled) }),
  capabilities: z.object({
    eyebrow: req,
    title: req,
    items: list(z.object({ term: req, detail: req })),
    fitLabel: req,
    fit: req,
  }),
  scope: head.extend({
    intro: req,
    fitLabel: req,
    fit: req,
    deliverables: list(z.object({ title: req, subtitle: req, body: req, outputs: list(req, 0) })),
  }),
  process: z.object({ eyebrow: req, title: req, steps: list(titled) }),
  beyond: head.extend({ items: list(titled) }),
  faq: z.object({
    eyebrow: req,
    title: req,
    items: list(z.object({ question: req, answer: req })),
  }),
  more: z.object({ title: req }),
  /**
   * 本页专用收尾 CTA；三项全空（或没有这个字段）⇒ 用全站默认。
   * 只填了一部分 ⇒ 构建失败，避免半截文案上线。
   */
  cta: z
    .object({ title: opt, lead: opt, button: opt })
    .optional()
    .superRefine((v, ctx) => {
      const filled = v ? [v.title, v.lead, v.button].filter(Boolean).length : 0;
      if (filled > 0 && filled < 3)
        ctx.addIssue({ code: 'custom', message: '标题、导语、按钮文字要么都填，要么都留空' });
    })
    .transform((v) =>
      v?.title && v.lead && v.button
        ? { title: v.title, lead: v.lead, button: v.button }
        : undefined,
    ),
});

export type ServiceContent = z.infer<typeof serviceSchema>;

export type ServiceSlug = 'ai-platform' | 'ai-workflow';

export const loadService = (slug: ServiceSlug) => load(`pages/${slug}`, serviceSchema);

/**
 * 两张服务页在结构上的差异。页面与本地可视化编辑端点都按 slug 从这里取，保证两边一致。
 */
export const serviceMeta = {
  'ai-platform': {
    path: '/services/ai-platform/',
    /** 区块 id 前缀：#platform-faq-title 等。 */
    prefix: 'platform',
    bodyClass: 'service-design-page service-design-page--ai-platform',
    /** 底部「其他 AI 服务」里放哪两张卡片。 */
    others: ['workflow', 'apps'],
    /**
     * 支柱编号（I / II / III）是否对读屏隐藏。改版前两页不一致，迁移时原样保留，
     * 统一与否是可访问性取舍，单独决定（见 docs/DECISIONS.md §103）。
     */
    pillarNumHidden: true,
  },
  'ai-workflow': {
    path: '/services/ai-workflow/',
    prefix: 'workflow',
    bodyClass: 'service-design-page service-design-page--ai-workflow',
    others: ['platform', 'apps'],
    pillarNumHidden: false,
  },
} as const satisfies Record<
  ServiceSlug,
  {
    path: string;
    prefix: string;
    bodyClass: string;
    others: readonly ('platform' | 'workflow' | 'apps')[];
    pillarNumHidden: boolean;
  }
>;

export type ServiceMeta = (typeof serviceMeta)[ServiceSlug];

/** 两位数编号：01、02…… */
export const pad2 = (i: number) => String(i + 1).padStart(2, '0');

/** 罗马数字编号（支柱卡片）。 */
export const roman = (i: number) =>
  ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][i] ?? String(i + 1);

/** 「AI 应用定制」页：首屏标题不是服务名、切入点卡片带配图、FAQ 可带要点列表。 */
export const appsSchema = z.object({
  seo: seoSchema,
  name: req,
  hero: z.object({ title: req, lede: req, body: req, primaryButton: req, secondaryButton: req }),
  pillars: head.extend({ intro: req, items: list(titled) }),
  usecases: head.extend({ items: list(titled) }),
  scope: head.extend({
    intro: req,
    fitLabel: req,
    fit: req,
    contactLink: req,
    deliverables: list(z.object({ title: req, subtitle: req, body: req, outputs: list(req, 0) })),
    note: req,
  }),
  process: z.object({ eyebrow: req, title: req, steps: list(titled) }),
  beyond: head.extend({ items: list(titled) }),
  faq: z.object({
    eyebrow: req,
    title: req,
    items: list(
      z.object({
        question: req,
        answer: req,
        /** 可选的要点列表：「术语：说明」，术语加粗。 */
        points: list(z.object({ term: req, text: req }), 0).optional(),
      }),
    ),
  }),
});

export type AppsContent = z.infer<typeof appsSchema>;

export const loadApps = () => load('pages/ai-apps', appsSchema);

/** FAQPage 结构化数据里的回答全文：正文 + 要点（与页面可见内容一致）。 */
export const faqText = (f: {
  answer: string;
  points?: { term: string; text: string }[] | undefined;
}) => [f.answer, ...(f.points ?? []).map((p) => `${p.term}：${p.text}`)].join(' ');
