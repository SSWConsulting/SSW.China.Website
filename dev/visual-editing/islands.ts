/**
 * 本地可视化编辑：可编辑区域（岛）的注册表。**只在 astro dev 下被加载**（见 ./integration.mjs）。
 *
 * 每个岛 = 页面上一个 <Editable island="…"> 包裹的区域。后台 iframe 里的 bridge 每次按键
 * 把草稿 POST 到 /tina-island/<name>，这里用 Tina 生成的客户端取到文档（草稿会自动覆盖进来），
 * 再用与页面相同的正文组件重渲染，返回的 HTML 替换掉页面上的那个包裹元素。
 *
 * 这个目录不在 tsconfig 的 include 里：它依赖 `tina/__generated__/`，只有跑过
 * `tinacms dev` / `tinacms build` 才存在，CI 的类型检查不能依赖它。
 */
import { requestWithMetadata } from '@tinacms/astro';
import type { IslandConfig, IslandRegistry } from '@tinacms/astro/experimental';
import client from '../../tina/__generated__/client';
import { about, chinafy, deck, home } from '../../src/lib/pages.ts';
import { site } from '../../src/config/site.ts';
import {
  loadApps,
  loadService,
  serviceMeta,
  serviceSchema,
  type ServiceSlug,
} from '../../src/lib/service.ts';
import ServiceMain from '../../src/components/pages/ServiceMain.astro';
import AppsMain from '../../src/components/pages/AppsMain.astro';
import ChinafyMain from '../../src/components/pages/ChinafyMain.astro';
import AboutMain from '../../src/components/pages/AboutMain.astro';
import DeckStage from '../../src/components/pages/DeckStage.astro';
import HeroCopy from '../../src/components/sections/home/HeroCopy.astro';
import ServicesBody from '../../src/components/sections/home/ServicesBody.astro';
import FilmstripBody from '../../src/components/sections/home/FilmstripBody.astro';
import FdeBody from '../../src/components/sections/home/FdeBody.astro';
import WhyUsBody from '../../src/components/sections/home/WhyUsBody.astro';
import EcosystemBody from '../../src/components/sections/home/EcosystemBody.astro';
import GlobeHead from '../../src/components/sections/home/GlobeHead.astro';

/**
 * 编辑过程中字段可能被清空：GraphQL 返回 null，列表变成 null。正文组件按构建期校验过的形状写，
 * 遇到 null 会直接报错、预览卡住。这里拿构建期的同一份内容当「形状模板」，
 * 把草稿里缺失的位置补成同类型的空值（字符串 → ''，列表 → []，对象 → 递归），
 * 草稿自带的元数据（_content_source 等，点选定位要用）原样保留。
 * 预览里因此能看到「清空后」的样子；真正保存时仍由构建期的 zod 校验把关。
 */
function withShape(draft: unknown, shape: unknown): unknown {
  if (Array.isArray(shape)) {
    if (!Array.isArray(draft)) return [];
    const item = shape[0];
    return item === undefined ? draft : draft.map((d) => withShape(d, item));
  }
  if (shape && typeof shape === 'object') {
    const src =
      draft && typeof draft === 'object' && !Array.isArray(draft)
        ? (draft as Record<string, unknown>)
        : {};
    const out: Record<string, unknown> = { ...src };
    for (const [k, v] of Object.entries(shape)) out[k] = withShape(src[k], v);
    return out;
  }
  if (typeof shape === 'string') return typeof draft === 'string' ? draft : '';
  if (typeof shape === 'number') return typeof draft === 'number' ? draft : shape;
  if (typeof shape === 'boolean') return typeof draft === 'boolean' ? draft : false;
  return draft ?? shape;
}

const homeDoc = () =>
  requestWithMetadata(client.queries.home({ relativePath: 'home.json' }), { priority: 'primary' });

type HomeKey = keyof typeof home;

/** 首页上的一个岛：取首页文档里的某一段，交给正文组件。 */
function homeIsland(
  key: HomeKey,
  component: IslandConfig['component'],
  wrapperClass: string,
  toProps: (part: unknown) => Record<string, unknown>,
): IslandConfig {
  return {
    fetch: homeDoc,
    component,
    // 必须与页面上 <Editable> 的标签和 class 一致：bridge 用它替换页面元素。
    wrapper: { tag: 'div', className: wrapperClass },
    propsFromData: (result) => {
      const data = (result as { data?: { home?: Record<string, unknown> } }).data?.home ?? {};
      return toProps(withShape(data[key], home[key]));
    },
  };
}

/** 首页以外的页面：整块 <main>（或轮播的 .deck__stage）是一个岛，取整份文档交给正文组件。 */
function pageIsland(
  fetch: (params: URLSearchParams) => Promise<unknown>,
  docKey: string,
  component: IslandConfig['component'],
  wrapper: IslandConfig['wrapper'],
  toProps: (doc: Record<string, unknown>, params: URLSearchParams) => Record<string, unknown>,
): IslandConfig {
  return {
    fetch: (_request, params) => fetch(params),
    component,
    wrapper,
    propsFromData: (result, params) => {
      const doc =
        (result as { data?: Record<string, Record<string, unknown>> }).data?.[docKey] ?? {};
      return toProps(doc, params);
    },
  };
}

const doc = <T>(query: Promise<T>) => requestWithMetadata(query, { priority: 'primary' });
const slugOf = (params: URLSearchParams): ServiceSlug =>
  params.get('slug') === 'ai-workflow' ? 'ai-workflow' : 'ai-platform';

/** 服务页的「本页专用 CTA」：沿用构建期规则 —— 三项都填才生效，否则用全站默认。 */
function serviceCta(draft: unknown) {
  const parsed = serviceSchema.shape.cta.safeParse(draft ?? undefined);
  return parsed.success ? parsed.data : undefined;
}

export const islands: IslandRegistry = {
  hero: homeIsland('hero', HeroCopy, 'hero__copy', (hero) => ({ hero })),
  services: homeIsland('services', ServicesBody, 'container', (services) => ({ services })),
  filmstrip: homeIsland('filmstrip', FilmstripBody, 'filmstrip__inner', (filmstrip) => ({
    filmstrip,
  })),
  fde: homeIsland('fde', FdeBody, 'container', (fde) => ({ fde })),
  whyUs: homeIsland('whyUs', WhyUsBody, 'container', (copy) => ({ copy, why: site.whyUs })),
  ecosystem: homeIsland('ecosystem', EcosystemBody, 'container', (eco) => ({ eco })),
  globe: homeIsland('globe', GlobeHead, 'globe__head', (globe) => ({ globe })),

  service: pageIsland(
    (params) => doc(client.queries.service({ relativePath: `${slugOf(params)}.json` })),
    'service',
    ServiceMain,
    { tag: 'main' },
    (draft, params) => {
      const slug = slugOf(params);
      const c = withShape(draft, loadService(slug)) as Record<string, unknown>;
      return { c: { ...c, cta: serviceCta(draft.cta) }, meta: serviceMeta[slug] };
    },
  ),
  apps: pageIsland(
    () => doc(client.queries.apps({ relativePath: 'ai-apps.json' })),
    'apps',
    AppsMain,
    { tag: 'main' },
    (draft) => ({ c: withShape(draft, loadApps()) }),
  ),
  chinafy: pageIsland(
    () => doc(client.queries.chinafy({ relativePath: 'chinafy.json' })),
    'chinafy',
    ChinafyMain,
    { tag: 'main' },
    (draft) => ({ c: withShape(draft, chinafy) }),
  ),
  about: pageIsland(
    () => doc(client.queries.about({ relativePath: 'about.json' })),
    'about',
    AboutMain,
    { tag: 'main' },
    (draft) => ({ c: withShape(draft, about) }),
  ),
  deck: pageIsland(
    () => doc(client.queries.deck({ relativePath: 'deck.json' })),
    'deck',
    DeckStage,
    { tag: 'div', className: 'deck__stage' },
    (draft) => ({ d: withShape(draft, deck) }),
  ),
};
