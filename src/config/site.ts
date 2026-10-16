import raw from '../../content/settings/site.json' with { type: 'json' };
import type {
  CaseStudy,
  EcosystemEntry,
  FilingRecord,
  HeroImage,
  ImageAsset,
  SiteConfig,
  Statistic,
} from './types';

/**
 * 站点素材配置的唯一入口。
 *
 * 取值住在 `content/settings/site.json`，由 TinaCMS 后台（/admin/ →「站点设置」）编辑，
 * 也可以直接改文件。这里做两件事：
 *
 *  1. **把 Tina 写出来的形状收敛回 `types.ts` 的契约。** 编辑在后台清空一个可选字段时，
 *     Tina 可能删掉这个键，也可能写成空串 —— 两者在这里一律变成 `null`，
 *     于是「`null` 表示尚未提供」的约定（以及它背后的诚实降级）不因换了编辑方式而失效。
 *  2. 提供 `publishBlockers()`，供 `npm run check:assets` 消费。
 *
 * 模板只读 `site`，不直接读 JSON。
 */

type Json = Record<string, unknown>;

const obj = (v: unknown): Json | null =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : null;
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const bool = (v: unknown): boolean => v === true;
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** 图片必须同时有地址与原始尺寸，缺一项就当作「未提供」—— 不输出缺 width/height 的 <img>。 */
function image(v: unknown): ImageAsset | null {
  const o = obj(v);
  const src = str(o?.src);
  const w = num(o?.w);
  const h = num(o?.h);
  return src && w && h ? { src, w, h } : null;
}

function heroImage(v: unknown): HeroImage | null {
  const img = image(v);
  const o = obj(v);
  return img
    ? { ...img, credit: str(o?.credit) ?? '', isPlaceholder: bool(o?.isPlaceholder) }
    : null;
}

function filing(v: unknown): FilingRecord | null {
  const o = obj(v);
  const number = str(o?.number);
  const url = str(o?.url);
  return number && url ? { number, url } : null;
}

function ecosystemEntry(v: unknown, fallbackName: string): EcosystemEntry {
  const o = obj(v);
  const name = str(o?.name) ?? fallbackName;
  return {
    name,
    logo: image(o?.logo),
    logoLight: image(o?.logoLight),
    logoAlt: str(o?.logoAlt) ?? name,
    art: image(o?.art),
  };
}

function statistic(v: unknown): Statistic | null {
  const o = obj(v);
  const figure = str(o?.figure);
  const label = str(o?.label);
  if (!figure || !label) return null;
  return { figure, suffix: str(o?.suffix), label, note: str(o?.note) ?? '' };
}

function caseStudy(v: unknown): CaseStudy | null {
  const o = obj(v);
  const title = str(o?.title);
  if (!title) return null;
  return {
    title,
    summary: str(o?.summary) ?? '',
    clientName: str(o?.clientName) ?? '',
    clientLogo: image(o?.clientLogo),
    backgroundImage: image(o?.backgroundImage),
    url: str(o?.url),
    isPlaceholder: bool(o?.isPlaceholder),
  };
}

const present = <T>(x: T | null): x is T => x !== null;

/** 可整段关闭的区块：键缺失或显式 `null` ⇒ 关闭；Tina 里用 `enabled: false` 也表示关闭。 */
const section = (v: unknown): Json | null => {
  const o = obj(v);
  return o && o.enabled !== false ? o : null;
};

export function toSiteConfig(input: unknown): SiteConfig {
  const c = obj(input) ?? {};
  const seo = obj(c.seo);
  const hero = obj(c.hero);
  const heroBg = image(hero?.backgroundImage);
  const wecom = obj(c.wecom);
  const advantage = section(c.advantage);
  const about = obj(c.about);
  const aboutRec = section(about?.recognition);
  const whyUs = section(c.whyUs);
  const whyUsRec = section(whyUs?.recognition);
  const clients = section(c.clients);
  const aiApps = obj(c.aiApps);
  const eco = obj(c.ecosystem);
  const footer = obj(c.footer);

  const origin = str(seo?.origin);
  if (!origin) throw new Error('site.json：seo.origin 必填（canonical、sitemap 都由它推导）');

  return {
    seo: {
      origin: origin.replace(/\/$/, ''),
      siteName: str(seo?.siteName) ?? 'SSW',
      ogImage: image(seo?.ogImage),
    },
    hero: {
      backgroundImage: heroBg
        ? { ...heroBg, alt: str(obj(hero?.backgroundImage)?.alt) ?? '' }
        : null,
    },
    wecom: {
      qrImage: image(wecom?.qrImage),
      qrScanVerified: bool(wecom?.qrScanVerified),
      searchableId: str(wecom?.searchableId),
      pendingNotice: str(wecom?.pendingNotice) ?? '',
    },
    advantage: advantage ? { stats: list(advantage.stats).map(statistic).filter(present) } : null,
    about: {
      recognition: aboutRec
        ? {
            items: list(aboutRec.items).map(str).filter(present),
            pendingClearance: bool(aboutRec.pendingClearance),
          }
        : null,
    },
    whyUs: whyUs
      ? {
          image: image(whyUs.image),
          videoUrl: str(whyUs.videoUrl),
          caption: str(whyUs.caption),
          recognition: whyUsRec ? { pendingClearance: bool(whyUsRec.pendingClearance) } : null,
        }
      : null,
    clients: clients ? { pendingClearance: bool(clients.pendingClearance) } : null,
    cases: list(c.cases).map(caseStudy).filter(present),
    aiApps: {
      heroImage: heroImage(aiApps?.heroImage),
      // 保留 null 的位置：第 n 项对应页面上第 n 张卡片。
      useCaseImages: list(aiApps?.useCaseImages).map(heroImage),
    },
    ecosystem: {
      tina: ecosystemEntry(eco?.tina, 'Tina'),
      yakshaver: ecosystemEntry(eco?.yakshaver, 'YakShaver'),
      fireug: ecosystemEntry(eco?.fireug, 'FireUG'),
    },
    footer: {
      legalName: str(footer?.legalName),
      copyrightHolder: str(footer?.copyrightHolder),
      copyrightYear: num(footer?.copyrightYear) ?? new Date().getFullYear(),
      privacyUrl: str(footer?.privacyUrl),
      icp: filing(footer?.icp),
      publicSecurity: filing(footer?.publicSecurity),
    },
  };
}

export const site: SiteConfig = toSiteConfig(raw);
/** 旧名，供脚本沿用。 */
export const siteConfig = site;

/**
 * 发布阻塞项：缺少这些素材时咨询流程无法真正可用。
 * scripts/check-assets.mjs 消费此函数。
 */
export function publishBlockers(c: SiteConfig): string[] {
  const out: string[] = [];
  if (c.wecom.qrImage === null && c.wecom.searchableId === null) {
    out.push(
      'wecom.qrImage —— 真实企业微信二维码尚未配置，且无可搜索账号作为替代路径。' +
        '咨询流程当前无法完成，发布前必须补齐并实扫验证。',
    );
  } else if (c.wecom.qrImage !== null && !c.wecom.qrScanVerified) {
    out.push(
      'wecom.qrScanVerified —— 二维码文件已就位，但尚未有人在另一台设备上实际扫过。' +
        '企业微信客服码会随账号变更失效，仓库无法自证「扫得通」：' +
        '请实扫确认能加上人，再把 qrScanVerified 改为 true。',
    );
  }
  const placeholders = c.cases.filter((x) => x.isPlaceholder).length;
  if (placeholders > 0) {
    out.push(
      `cases —— 有 ${placeholders} 条占位案例（isPlaceholder: true）。` +
        '这是为查看版式而放的示例内容，不是真实案例：发布前必须替换为获准公开的真实案例，' +
        '或清空 cases 数组让整段不渲染。配图同样是占位素材，' +
        '删除 public/media/placeholder/ 整个目录。',
    );
  }
  const aiAppsPlaceholders = [c.aiApps.heroImage, ...c.aiApps.useCaseImages].filter(
    (x) => x?.isPlaceholder,
  ).length;
  if (aiAppsPlaceholders > 0) {
    out.push(
      `aiApps —— AI 应用定制页有 ${aiAppsPlaceholders} 处占位照片（isPlaceholder: true）：` +
        '首屏通栏配图与四张切入点卡片。它们不是 SSW 的人，也不是 SSW 的场地，' +
        '页面上已统一以灰度呈现。发布前必须替换为真实照片（SSW 中国团队、杭州办公室、' +
        'FireUG 活动现场均可），或将对应项置为 null 让该处降级为纯排版。' +
        '全部替换后删除 public/media/placeholder/。',
    );
  }
  if (c.whyUs?.recognition?.pendingClearance) {
    out.push(
      'whyUs.recognition —— 「资质与荣誉」里是 Microsoft Solutions Partner 与 MAPA 奖项，' +
        '徽章图标是 Microsoft 商标，均取自 ssw.com.au。发布前需确认中国站主体可以主张这些资质、' +
        '且商标用法获准；确认后把 pendingClearance 改为 false，或将 recognition 置为 null。',
    );
  }
  if (c.clients?.pendingClearance) {
    out.push(
      'clients —— 客户标识跑马灯里是第三方商标（Microsoft、Cisco、Commonwealth Bank、Allianz 等），' +
        '取自 ssw.com.au。发布前需确认中国站主体可以主张同一批客户关系、且商标用法获准；' +
        '确认后把 pendingClearance 改为 false，或将 clients 置为 null 让整段不渲染。',
    );
  }
  if (c.about.recognition?.pendingClearance) {
    out.push(
      'about.recognition —— 「关于我们」页面的资质与合作认证列表（Microsoft 金牌合作伙伴、' +
        'MVP、Regional Director 等）是 SSW 全球（含澳洲总部）的公开资质，发布前需确认中国子公司' +
        '能否同样主张；确认后把 pendingClearance 改为 false，或将 recognition 置为 null 让整段不渲染。',
    );
  }
  if (c.footer.icp === null) {
    out.push('footer.icp —— 中国站 ICP 备案信息待核实。中国大陆上线前必须填入真实备案号。');
  }
  return out;
}
