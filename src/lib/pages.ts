import { z } from 'astro/zod';
import { list, load, req } from './content.ts';

/**
 * 各页面的文案（content/pages/*.json，后台「页面」下各项）。
 *
 * 页面的**结构**（有哪些区块、什么顺序、什么版式）在代码里；
 * 这里只装可编辑的文字与列表。缺必填项 ⇒ 构建失败（见 lib/content.ts）。
 */

export const seoSchema = z.object({
  title: req,
  description: req.max(160, '超过 160 字，搜索结果会被截断'),
});

export type Seo = z.infer<typeof seoSchema>;

const strings = (min = 1) => list(req, min);

export const home = load(
  'pages/home',
  z.object({
    seo: seoSchema,
    hero: z.object({ titleLines: strings(), lead: req, button: req }),
    services: z.object({ title: req, intro: req }),
    filmstrip: z.object({ title: req, button: req }),
    fde: z.object({
      title: req,
      intro: req,
      focusLabel: req,
      stages: list(z.object({ name: req, description: req, focus: req })),
      modes: req,
      note: req,
    }),
    cases: z.object({ title: req }),
    whyUs: z.object({ title: req, paragraphs: strings(), recognitionLabel: req }),
    ecosystem: z.object({
      title: req,
      productCta: req,
      tina: z.object({ description: req, tags: strings(0) }),
      yakshaver: z.object({ description: req, tags: strings(0) }),
      fireug: z.object({
        kind: req,
        tagline: req,
        description: req,
        bilibiliLabel: req,
        youtubeLabel: req,
        stats: list(z.object({ label: req, value: req }), 0),
      }),
    }),
    globe: z.object({ title: req, subtitle: req }),
  }),
);

export const chinafyIcons = ['localize', 'social', 'integration', 'support'] as const;

export const chinafy = load(
  'pages/chinafy',
  z.object({
    seo: seoSchema,
    /** 面包屑末项、结构化数据 Service.name。 */
    name: req,
    hero: z.object({ eyebrow: req, titleParts: strings(), lede: req, body: req, button: req }),
    why: z.object({ title: req, paragraphs: strings() }),
    offer: z.object({
      title: req,
      items: list(z.object({ icon: z.enum(chinafyIcons), title: req, text: req })),
    }),
    scope: z.object({ title: req, items: list(z.object({ term: req, detail: req })) }),
  }),
);

const entry = z.object({ title: req, intro: req, linkLabel: req });

export const about = load(
  'pages/about',
  z.object({
    seo: seoSchema,
    /** 面包屑末项。 */
    name: req,
    hero: z.object({
      /** 页面大标题，也是结构化数据 AboutPage.name。 */
      title: req,
      paragraphs: strings(),
      image: z.object({
        src: req,
        w: z.number().int().positive(),
        h: z.number().int().positive(),
        alt: req,
      }),
    }),
    focus: z.object({ title: req, items: list(z.object({ title: req, text: req })), note: req }),
    offices: entry,
    community: entry,
    recognition: z.object({ title: req }),
  }),
);

const slide = { label: req, kicker: req, title: req };
const card = z.object({ title: req, sub: req });

/** /deck/ 展会轮播页。每页的 label 用于圆点导航与读屏（「第 N 页：label」）。 */
export const deck = load(
  'pages/deck',
  z.object({
    seo: seoSchema,
    cover: z.object({ ...slide, tags: strings(0) }),
    overview: z.object({ ...slide, services: list(card.extend({ points: strings(0) })) }),
    services: list(
      z.object({
        ...slide,
        lead: req,
        /** 卡片编号样式：罗马数字（I II III）或两位数字（01 02…）。 */
        numbering: z.enum(['roman', 'decimal']),
        cards: list(card.extend({ solid: z.boolean().optional() })),
        foot: req,
      }),
    ),
    process: z.object({ ...slide, steps: list(card), foot: req }),
    closing: z.object({ label: req, title: req, lead: req, button: req }),
  }),
);
