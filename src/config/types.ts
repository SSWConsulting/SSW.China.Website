/**
 * 站点配置契约。
 *
 * 约定：`null` 表示「素材尚未提供」，**永远不是占位字符串**。
 * 每个 null 值都有明确的诚实降级行为（见 docs/PENDING-ASSETS.md），
 * 由构建期条件渲染实现 —— 因此 JS 关闭时降级同样成立。
 */

/** 一张已获准使用的图片素材。w/h 为原始像素尺寸，用于输出 width/height 避免版面跳动。 */
export interface ImageAsset {
  /** public/ 下的路径，例如 '/media/wecom-qr.png'。 */
  src: string;
  w: number;
  h: number;
}

/**
 * 服务详情页的首屏配图。
 *
 * `null` ⇒ 首屏保持单栏纯文字，**不留空图框**（与团队照片同一约定）。
 * `isPlaceholder: true` ⇒ 这不是真实素材，页面上以灰度呈现，
 * 并由 publishBlockers() 阻塞发布。换成真实照片时把它改成 false，
 * 灰度会自动去掉（灰度是 CSS 加的，不是烧进文件的）。
 */
export interface HeroImage extends ImageAsset {
  /** 装饰性配图 ⇒ alt 恒为空串；此处只记录素材说明，供维护者辨认。 */
  credit: string;
  isPlaceholder: boolean;
}

export interface WeComConfig {
  /**
   * 真实企业微信联系人二维码。方形二维码或完整联系人海报均可 ——
   * 按原始比例呈现、白色底板、保留静区，不改色、不裁边、不叠图标。
   * null ⇒ 面板不渲染二维码图框，改为显示 pendingNotice 空状态。
   * **绝不放入生成的假码。**
   */
  qrImage: ImageAsset | null;
  /**
   * qrImage 是否已在**另一台设备上实际扫过**并确认能加上人。
   *
   * 二维码本身是真实素材，但企业微信的客服码会随账号变更而失效 ——
   * 「文件放对了」和「扫得通」是两件事，本仓库无法验证后者。
   * false ⇒ publishBlockers() 阻塞发布。实扫通过后手工改成 true。
   */
  qrScanVerified: boolean;
  /**
   * 可选：真实的、可搜索的企业微信号。
   * null ⇒ 账号行（标签/值/复制按钮）整行不输出。
   */
  searchableId: string | null;
  /**
   * 二维码未配置时面板显示的诚实空状态文案。
   *
   * 新增文案，需文案负责人确认 —— 交接文档未规定此状态的措辞。
   * 这不是「待补标记」，而是一个真实的 UI 空状态：它如实告知当前不可扫码，
   * 不承诺时间、不制造可扫描假码。
   */
  pendingNotice: string;
}

/** 产品／社区条目。名称始终是真实名称；标识必须是真实素材，否则纯文字呈现。 */
export interface EcosystemEntry {
  /** 真实名称，始终呈现。 */
  name: string;
  /**
   * 官方标识素材。null ⇒ 以真实名称纯文字呈现（24px），
   * 不预留空框、不自制替代 Logo。
   *
   * 深底版。Tina / YakShaver 的卡片固定深色、不随主题翻转（见 ecosystem.css），
   * 只用得到这一版；FireUG 的卡片背景用 --c-surface-deep，会随主题翻转，
   * 所以额外提供 `logoLight`，两版都是真实素材，不是同一张图套滤镜。
   */
  logo: ImageAsset | null;
  /**
   * 浅底版，可选。只有卡片背景会随主题翻转时才需要提供 ——
   * 目前只有 FireUG。留空 ⇒ 该条目在浅色主题下仍显示 `logo`（深底版），
   * 适用于卡片本身固定深色的场景。
   */
  logoLight?: ImageAsset | null;
  /** 标识的替代文本，仅在 logo 存在时使用。 */
  logoAlt: string;
  /**
   * 可选：卡片右侧的装饰图（ssw.com.au 产品卡片上的水印图形／渐变底）。
   * 纯装饰，`aria-hidden`，不承载任何信息。null ⇒ 卡片只有纯色底，版式不变。
   * 具体摆放方式由卡片自身的修饰类决定（.product-card--tina / --yak），不进配置。
   */
  art?: ImageAsset | null;
}

/** 一项已公开的统计数字。 */
export interface Statistic {
  /** 数字本身，按已发布口径原样呈现（含千分位）。 */
  figure: string;
  /** 数字后缀，如 '+'。没有后缀时为 null。 */
  suffix: string | null;
  /** 这个数字是什么。 */
  label: string;
  /** 一行补充说明。 */
  note: string;
}

export interface AdvantageConfig {
  /** 区块标题（首页、关于我们、AI 应用定制页共用）。 */
  title: string;
  /** 最多 3 项（版式是四栏栅格：标题一格 + 三个数字，多余的不会渲染）。 */
  stats: Statistic[];
}

/**
 * 一条案例。
 *
 * 交接文档原本要求「案例尚未提供，整个模块隐藏」。用户于 2026-09-08 明确改为
 * 「随便 mock 一点中文文字和图」，因此现在允许放占位内容，但必须满足两条：
 *   1. `isPlaceholder: true` ⇒ 卡片上出现可见的「示例内容」角标；
 *   2. 同一标志会让 `publishBlockers()` 返回非零，`npm run check:assets` 失败，
 *      占位案例不可能静默上线。
 * **仍然禁止**编造看起来像真的客户名、具体成果数字，或伪造客户标志与实景照片。
 */
export interface CaseStudy {
  title: string;
  summary: string;
  /** 客户名称。占位时必须是一眼可辨的示例名，不得编造真实企业。 */
  clientName: string;
  /** 客户标志。null ⇒ 以 clientName 纯文字呈现，不留空图框、不自制标志。 */
  clientLogo: ImageAsset | null;
  /**
   * 背景照片。装饰性 —— 卡片的标题与简介已经承载全部信息，
   * 因此输出 `alt="" aria-hidden`，不需要替代文本。
   * null ⇒ 用品牌渐变兜底。**绝不用虚构实景照片冒充真实项目现场。**
   */
  backgroundImage: ImageAsset | null;
  /** 案例详情地址。null ⇒ 卡片不是链接，也不显示跳转箭头（不产生死控件）。 */
  url: string | null;
  /** 见上：占位内容必须显式声明，会同时触发角标与发布阻塞。 */
  isPlaceholder: boolean;
}

/** 一个客户标识。必须是**透明底**图片（卡片上由 CSS 滤镜统一转白）。 */
export interface ClientLogo extends ImageAsset {
  /** 客户名称，作为图片的替代文本。 */
  name: string;
}

/**
 * 客户标识跑马灯。
 *
 * 跑马灯把同一份名单渲染三条轨道（无缝循环），名单只维护 `logos` 这一份。
 *
 * 里面全是**第三方商标**（Microsoft、Cisco、Commonwealth Bank、Allianz 等），
 * 取自 ssw.com.au。把它们放在中国站上，等于以中国站主体的名义主张这些客户关系 ——
 * 这是业务与法务判断，不是实现细节。因此默认带着 `pendingClearance: true`，
 * `publishBlockers()` 会因此返回非零，确认之前不会静默上线。
 *
 * null ⇒ 整段不渲染。
 */
export interface ClientsConfig {
  /** 区块标题（仅读屏可见）。 */
  title: string;
  /** 名单尚未确认可用于中国站。确认后改为 false。 */
  pendingClearance: boolean;
  logos: ClientLogo[];
}

/** 一枚资质徽章。图标可选；没有图标时只显示文字。 */
export interface RecognitionBadge {
  label: string;
  icon: ImageAsset | null;
}

/**
 * 「为什么选择 SSW」区块。
 *
 * 三个字段各自独立降级，缺什么就不渲染什么，不留空框、不留死控件。
 */
export interface WhyUsConfig {
  /** 左栏配图（16:9）。null ⇒ 左栏不渲染，版式收成单栏。 */
  image: ImageAsset | null;
  /**
   * 配图对应的视频地址。null ⇒ 只呈现静态配图，**不渲染播放按钮**
   * —— 播放按钮点了没东西可播就是死控件。
   *
   * 注意：线上这支视频托管在 YouTube，**中国大陆无法访问**。
   * 填之前请换成境内可访问的地址（B 站或自建），见 docs/PENDING-ASSETS.md。
   */
  videoUrl: string | null;
  /** 配图/视频下方的说明文字。null ⇒ 不输出。 */
  caption: string | null;
  /**
   * 资质与荣誉徽章。
   *
   * 里面是 Microsoft Solutions Partner 与 MAPA 奖项 —— 这些是**资质主张**，
   * 且徽章图标是 Microsoft 商标。是否可由中国站主体主张，需业务与法务确认，
   * 因此默认带 `pendingClearance: true`，会阻塞发布。null ⇒ 整块不渲染。
   */
  recognition: { pendingClearance: boolean; badges: RecognitionBadge[] } | null;
}

/** 一条备案信息及其目标链接。 */
export interface FilingRecord {
  number: string;
  url: string;
}

export interface FooterConfig {
  /** 中国站主体的法定名称，需核实。null ⇒ 该行不输出。 */
  legalName: string | null;
  /** 版权归属方。null ⇒ 不输出版权行（不输出「© 2026 」这种半截内容）。 */
  copyrightHolder: string | null;
  copyrightYear: number;
  /** 真实隐私政策地址。null ⇒ 不输出链接（绝不使用 href="#"）。 */
  privacyUrl: string | null;
  /** ICP 备案。null ⇒ 不输出。**绝不填写推测或占位备案号。** */
  icp: FilingRecord | null;
  /** 公安备案。null ⇒ 不输出。 */
  publicSecurity: FilingRecord | null;
}

export interface HeroConfig {
  /**
   * 首屏背景照片。ssw.com.au 的首屏以一张真实团队/工作照作底。
   * null ⇒ 卡片只呈现红黑渐变底，不放任何占位图或虚构照片。
   */
  backgroundImage: (ImageAsset & { alt: string }) | null;
}

/**
 * 「关于我们」页面（/about/）专属素材。
 *
 * 页面正文（公司历史、业务范围、理念）是固定文案，不走配置 —— 这些是
 * 交接文档之外的新增文案，事实来源是 ssw.cn/aboutus 与 ssw.com.au 的
 * 公开信息，已按本站语气重新撰写，未逐句照抄；具体措辞需文案负责人确认。
 * 只有下面这些「资质主张」需要业务/法务确认后才能上线，因此单独配置。
 */
export interface AboutConfig {
  /**
   * 资质与合作认证列表（Microsoft 金牌合作伙伴、MVP、RD 等）。
   *
   * 这些是 SSW 全球（含澳大利亚总部）的公开资质，中国子公司能否同样主张
   * 需业务与法务确认 —— 与 WhyUsConfig.recognition 同一处理原则。
   * null ⇒ 整块不渲染。
   */
  recognition: { items: string[]; pendingClearance: boolean } | null;
}

/**
 * 站点级 SEO / GEO 设置。
 *
 * `origin` 是**正式域名**，canonical、og:url、sitemap.xml、JSON-LD 里的绝对
 * 地址全部由它推导。填错会把搜索引擎指向不存在的地址，比不填更糟 ——
 * 换域名时只改这一处，并同步重新生成 public/sitemap.xml。
 */
export interface SeoConfig {
  /** 正式域名，**不带结尾斜杠**。例如 'https://ssw.cn'。 */
  origin: string;
  /** 站点名称，用于 og:site_name 与 JSON-LD 的 WebSite.name。 */
  siteName: string;
  /**
   * 社交分享预览图（og:image / twitter:image）。
   *
   * 平台推荐 1200×630；当前用的是真实团队合照（正方形），比例不理想但真实。
   * null ⇒ 不输出 og:image 与 twitter:image 标签（宁可没有，也不放假图）。
   */
  ogImage: ImageAsset | null;
  /**
   * 搜索引擎站长平台的站点验证码（只填 content 里的那串值）。
   * 各自输出为 `<meta name="baidu-site-verification">`、`msvalidate.01`、`360-site-verification`、
   * `sogou_site_verification`。null ⇒ 不输出该标签。见 DEPLOY-SETUP「搜索引擎站长平台」。
   */
  verification: {
    baidu: string | null;
    bing: string | null;
    so360: string | null;
    sogou: string | null;
  };
}

export interface SiteConfig {
  hero: HeroConfig;
  /** 站点级 SEO / GEO 设置。 */
  seo: SeoConfig;
  wecom: WeComConfig;
  /** SSW 的数据统计。null ⇒ 整段不渲染。 */
  advantage: AdvantageConfig | null;
  /** 「关于我们」页面专属素材。 */
  about: AboutConfig;
  /** 「为什么选择 SSW」。null ⇒ 整段不渲染。 */
  whyUs: WhyUsConfig | null;
  /** 客户标识跑马灯。null ⇒ 整段不渲染。 */
  clients: ClientsConfig | null;
  /** 案例。空数组 ⇒ 整段不渲染（当前模板只渲染第一条）。 */
  cases: CaseStudy[];
  /**
   * AI 应用定制页（/services/ai-apps/）的页面级素材。
   *
   * `useCaseImages` 与页面上四张「切入点」卡片一一对应，**按下标取用**
   * —— 模板引擎不支持循环，所以标记里写的是 `useCaseImages.0`…`.3`。
   * 某一项为 `null` ⇒ 那张卡片降级为纯排版（不留空图框），其余卡片不受影响。
   */
  aiApps: {
    heroImage: HeroImage | null;
    useCaseImages: (HeroImage | null)[];
  };
  ecosystem: {
    tina: EcosystemEntry;
    yakshaver: EcosystemEntry;
    fireug: EcosystemEntry;
  };
  footer: FooterConfig;
}
