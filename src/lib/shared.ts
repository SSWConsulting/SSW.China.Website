import { z } from 'astro/zod';
import { link, list, load, req } from './content.ts';

/** 全站通用文案（content/global/shared.json，后台「全站通用」）。 */
const card = z.object({ title: req, text: req });

export const ctaSchema = z.object({ title: req, lead: req, button: req });

export const shared = load(
  'global/shared',
  z.object({
    nav: z.object({
      links: list(link),
      currentRegion: req,
      otherRegionsLabel: req,
      otherRegions: list(z.object({ name: req, href: req })),
      contactLabel: req,
    }),
    serviceCards: z.object({ platform: card, workflow: card, apps: card }),
    cta: ctaSchema,
    wecom: z.object({ title: req, description: req, qrAlt: req, mobileHint: req }),
    footer: z.object({
      address: req,
      email: req,
      phone: req,
      phoneHref: req,
      builtWith: req,
      builtWithName: req,
    }),
    offices: list(
      z.object({
        slug: z.string().regex(/^[a-z0-9-]+$/, '只能用小写字母、数字和连字符（用作页面锚点 id）'),
        name: req,
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        email: req,
        phone: req,
        phoneHref: req,
        address: req,
        siteUrl: req,
        siteLabel: req,
      }),
    ),
  }),
);
