import type { CaseStudy, SiteConfig } from './types';

/**
 * ══════════════════════════════════════════════════════════════════════════
 *  这是唯一需要编辑的素材配置文件。
 *
 *  素材放入 public/media/，然后在下面填入路径与原始像素尺寸即可。
 *  所有 null 都有诚实的降级行为，说明见 docs/PENDING-ASSETS.md。
 *  发布前请运行 `npm run check:assets` 检查发布阻塞项。
 * ══════════════════════════════════════════════════════════════════════════
 */
/**
 * 案例区块的占位内容 —— **当前未接入**（`siteConfig.cases` 是空数组，整段不渲染）。
 *
 * 用户 2026-09-09 要求先隐藏案例，之后可能放出来。数据原样保留在这里，
 * 放出来只需把下面的 `cases: []` 改回 `cases: placeholderCases`。
 *
 * 配图仍在 `public/media/placeholder/`，一并保留；真要永久去掉的话，
 * 删掉本常量与那个目录即可（见 docs/PENDING-ASSETS.md §7）。
 */
export const placeholderCases: CaseStudy[] = [
  {
    title: '示例案例一：把重复的政策问答交给 AI 处理',
    summary:
      '这是一段占位简介，仅用于查看卡片版式与排版效果，不描述任何真实项目。真实案例获准公开后替换本条。',
    clientName: '示例客户',
    clientLogo: null,
    backgroundImage: { src: '/media/placeholder/placeholder-case-hero.jpg', w: 1600, h: 900 },
    url: null,
    isPlaceholder: true,
  },
  {
    title: '示例案例二：内部知识检索助手',
    summary: '这是一段占位简介，用于查看副卡的两行标题与三行正文如何排布，不描述任何真实项目。',
    clientName: '示例客户',
    clientLogo: null,
    backgroundImage: { src: '/media/placeholder/placeholder-case-1.jpg', w: 800, h: 450 },
    url: null,
    isPlaceholder: true,
  },
  {
    title: '示例案例三：合同信息自动提取',
    summary: '这是一段较短的占位简介，用于查看卡片在正文长度不同时是否仍然等高。',
    clientName: '示例客户',
    clientLogo: null,
    backgroundImage: { src: '/media/placeholder/placeholder-case-2.jpg', w: 800, h: 450 },
    url: null,
    isPlaceholder: true,
  },
  {
    title: '示例案例四：售后工单智能分派与人工复核',
    summary:
      '这是一段较长的占位简介，用于查看标题换行到两行、正文换行到四行时，卡片底部的图片区是否仍然对齐。不描述任何真实项目。',
    clientName: '示例客户',
    clientLogo: null,
    backgroundImage: { src: '/media/placeholder/placeholder-case-3.jpg', w: 800, h: 450 },
    url: null,
    isPlaceholder: true,
  },
];

export const siteConfig: SiteConfig = {
  hero: {
    backgroundImage: {
      src: '/media/services/home-hero-ai-team-v14.png',
      w: 1860,
      h: 845,
      alt: '团队在现代办公空间中协作处理企业 AI 项目',
    },
  },

  wecom: {
    // 待提供：真实企业微信联系人二维码。发布前必须补齐，并在另一台设备实扫验证。
    // 示例：{ src: '/media/wecom-qr.png', w: 430, h: 430 }
    qrImage: null,

    // 可选，待提供：真实的可搜索企业微信号。例如：'SSW-China'
    searchableId: null,

    // 新增文案，需文案负责人确认。
    pendingNotice: '二维码尚未配置。配置完成后，此处显示可扫描的企业微信二维码。',
  },

  // 产品与技术社区标识：文档要求「标识需真实素材，未提供时使用真实名称纯文字，
  // 不自制替代 Logo」。三者当前均为纯文字，填入 logo 后自动切换为 32px 标识。
  /**
   * 数据统计。取自 ssw.com.au 首页 "The SSW Advantage"，2026-09-08 实测抓取，
   * 是 SSW 已公开的全球数据 —— 不是为中国站编造的数字。
   * 出处按用户 2026-09-08 的要求不再上屏，只保留在这里与 docs/DECISIONS.md。
   * 若将来要换成中国区数据，改这里即可；整个 advantage 置 null 则整段不渲染。
   */
  advantage: {
    stats: [
      { figure: '7,000', suffix: '+', label: '交付方案', note: '企业级软件' },
      { figure: '1,800', suffix: '+', label: '服务客户', note: '覆盖各行业' },
      { figure: '30', suffix: '+', label: '年经验', note: '遍布 15 个国家' },
    ],
  },

  /**
   * 案例。
   *
   * 下面这一条是**占位内容**，用户 2026-09-08 要求「随便 mock 一点中文文字和图」，
   * 用于查看卡片版式。它满足两条硬约束：
   *   · 客户名是一眼可辨的示例名，没有编造真实企业、也没有编造成果数字；
   *   · isPlaceholder: true ⇒ 卡片上有可见的「示例内容」角标，
   *     且 publishBlockers() 会因此返回非零，`npm run check:assets` 直接失败。
   * 模板渲染第 1 条为主推大卡，第 2–4 条为下方三张副卡（照搬 ssw.com.au 的版式）。
   *
   * backgroundImage 指向 public/media/placeholder/ 下的**占位照片**：
   * 来自 Lorem Picsum（picsum.photos，转发 Unsplash 图库，Unsplash License，
   * 可商用、免署名），统一转成灰度 —— 灰度是刻意的，一眼就知道不是终稿，
   * 也不会和品牌红打架。出处与作者见 public/media/placeholder/README.md。
   * 这些照片**不是任何真实项目的现场**，替换真实案例时必须一并删除。
   * 拿到获准公开的真实案例后：替换文案、补上 clientLogo / backgroundImage / url，
   * 并把 isPlaceholder 改为 false。整个数组清空则整段不渲染。
   */
  whyUs: {
    // 用户 2026-09-09 更换的封面图（注意扩展名是 .jpeg，旧的 .jpg 已删）。
    image: { src: '/media/why-ssw-poster.jpeg', w: 1920, h: 1080 },
    // 用户 2026-09-09 换成 B 站地址 —— 境内可正常访问，
    // 此前 YouTube 版本对中国大陆用户点了打不开的问题就此解决。
    videoUrl: 'https://www.bilibili.com/video/BV1MN411m7mn/',
    // 说明文字按用户要求去掉（曾是「视频：SSW 幕后的人（3 分钟，YouTube）」）。
    // null ⇒ 整行不渲染；播放按钮不受影响，仍由 videoUrl 决定。
    caption: null,
    recognition: { pendingClearance: true },
  },

  // 客户标识名单在 src/partials/client-logos.html。里面是第三方商标，
  // 取自 ssw.com.au —— 需确认中国站主体可否主张同一批客户关系。
  clients: { pendingClearance: true },

  // 案例：用户要求先隐藏（2026-09-09）。空数组 ⇒ sections/cases.html 的
  // `@if cases.0` 为假，整段在构建期就不输出。
  // 放出来：改成 `cases: placeholderCases`（数据保留在文件顶部的同名常量里）。
  cases: [],

  // AI 应用定制页首屏配图。
  // 当前是**占位素材**：CC0 1.0，来自 Openverse 检索到的 StockSnap 图库，
  // 出处见 public/media/placeholder/README.md。它不是 SSW 的人，也不是 SSW 的场地 ——
  // 页面上以灰度呈现，且 check:assets 会阻塞发布。
  // 拿到真实照片后：放进 public/media/（不是 placeholder/），改这里的 src/w/h，
  // 把 isPlaceholder 改成 false，灰度自动去掉。
  aiApps: {
    heroImage: {
      src: '/media/placeholder/placeholder-consulting.jpg',
      w: 600,
      h: 400,
      credit: 'Startup Stock Photos / StockSnap，CC0 1.0',
      isPlaceholder: true,
    },
    // 四张切入点卡片的配图，按下标对应页面顺序（文档处理 / 内部知识检索 /
    // 客户咨询分流 / 为现有软件增加 AI）。全部是 CC0 占位素材，出处见
    // public/media/placeholder/README.md。任一项置 null ⇒ 该卡片降级为纯排版。
    useCaseImages: [
      {
        src: '/media/placeholder/placeholder-case-a.jpg',
        w: 600,
        h: 400,
        credit: 'Christina Morillo，CC0',
        isPlaceholder: true,
      },
      {
        src: '/media/placeholder/placeholder-case-b.jpg',
        w: 600,
        h: 400,
        credit: 'Christina Morillo，CC0',
        isPlaceholder: true,
      },
      {
        src: '/media/placeholder/placeholder-case-c.jpg',
        w: 600,
        h: 400,
        credit: 'Direct Media，CC0',
        isPlaceholder: true,
      },
      {
        src: '/media/placeholder/placeholder-case-d.jpg',
        w: 600,
        h: 400,
        credit: 'Kristin Hardwick，CC0',
        isPlaceholder: true,
      },
    ],
  },

  ecosystem: {
    // Tina 与 YakShaver 的标识、水印与渐变底均取自 ssw.com.au 的官方素材，
    // 未做任何改动（Tina 的两个图形是 Tina 橙 #EC4815，卡片上由 CSS 滤镜转白，
    // 与线上做法一致）。
    tina: {
      name: 'Tina',
      logo: { src: '/media/tina-logo.svg', w: 1020, h: 254 },
      logoAlt: 'Tina',
      art: { src: '/media/tina-mark.svg', w: 448, h: 621 },
    },
    yakshaver: {
      name: 'YakShaver',
      logo: { src: '/media/yakshaver-logo-dark.svg', w: 212, h: 41 },
      logoAlt: 'YakShaver',
      art: { src: '/media/yakshaver-gradient.webp', w: 500, h: 320 },
    },
    // FireUG 标识取自 fireusergroup.com 的官方素材（该站页脚写明 Powered by SSW，
    // 备案号是 ssw.cn 同一主号加 -1 后缀 —— 与 Tina／YakShaver 同属自有资产，
    // 因此不设商标授权闸门）。原图 512×203 含烧进位图的副标题
    // 「一群程序员搞的技术频道」，已裁掉下半带（副标题在卡片上用真文字呈现，
    // 小尺寸下位图那行中文会糊）。裁切后 512×135，红色恰是 #CC4141，与 --c-brand 同值。
    fireug: {
      name: 'FireUG',
      logo: { src: '/media/fireug-logo.png', w: 512, h: 135 },
      logoAlt: 'FireUG',
    },
  },

  footer: {
    // 待核实：中国站页脚法律与备案资料。
    // 文档明确：不能将澳洲站法律信息直接替代中国站内容，也不能发布占位备案号。
    legalName: null,
    copyrightHolder: 'SSW',
    copyrightYear: 2026,
    privacyUrl: null,
    // 备案号取自 ssw.cn 现有页脚，由用户于 2026-09-09 确认填入。
    // url 是工信部备案查询官网 —— 中国大陆网站页脚的备案号按惯例链到这里。
    // 注意：备案必须与**实际承载新站的域名**对应；换域名或换主体时要重新核对。
    icp: { number: '浙ICP备20009588号', url: 'https://beian.miit.gov.cn/' },
    publicSecurity: null,
  },
};

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
  if (c.footer.icp === null) {
    out.push('footer.icp —— 中国站 ICP 备案信息待核实。中国大陆上线前必须填入真实备案号。');
  }
  return out;
}
