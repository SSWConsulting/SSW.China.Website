# 待补素材：放哪、填哪、页面会怎么变

所有素材都通过一个文件配置：[`src/config/site.config.ts`](../src/config/site.config.ts)。
文件放进 `public/media/`（该目录原样输出、路径不带 hash，可直接替换）。

约定：`null` 表示「尚未提供」，**永远不写占位字符串**。条件渲染发生在构建期，
因此下面每一条降级行为在 JS 关闭时同样成立。

运行 `npm run check:assets` 查看当前状态与发布阻塞项。

---

## 1. 企业微信联系人二维码 —— 已提供，但仍是发布阻塞项

**2026-09-18 更新：素材已就位。** 用户提供了真实的企业微信客服海报，
已放进 `public/media/wecom-qr.jpg`（1086×1375），配置如下：

```ts
wecom: {
  qrImage: { src: '/media/wecom-qr.jpg', w: 1086, h: 1375 },
  qrScanVerified: false,
}
```

下面这段是**素材到位前**的降级说明，保留作为规则记录。
当前面板已经渲染真实二维码，不再显示 `pendingNotice`。

**仍然阻塞发布的是 `qrScanVerified`** —— 文件放对了不等于扫得通，
企业微信客服码会随账号变更失效，仓库无法自证。请在另一台设备实扫确认能加上人，
再把这个标志改成 `true`。详见 `docs/DECISIONS.md` §61。

同一批还有一张英文版海报 `public/media/wecom-qr-en.jpg`，
全站 `lang` 都是 `zh-CN`，当前没有英文界面消费它，先留存。

`w`/`h` 填**原始像素尺寸**，用于输出 `width`/`height` 属性，避免弹层打开时版面跳动。

- **未提供时**：不渲染二维码图框（沿用文档「缺少照片则不留图框」的处理），
  面板显示真实标题、说明与 `wecom.pendingNotice` 的诚实空状态。
  **不会出现任何可扫描的假码。**
- 方形二维码或完整联系人海报都可以：按原始比例呈现、白色底板、保留静区，
  不改色、不裁边、不叠图标；非方形素材用 `object-fit: contain` 完整显示。
- **发布前必须**：在另一台设备实扫验证；在手机上验证长按保存到相册。
  （「打开二维码图片」链接已于 2026-09-18 按用户要求移除，见 `docs/DECISIONS.md` §62。）

## 1b. 首屏背景照片

```ts
hero: { backgroundImage: { src: '/media/hero.jpg', w: 2600, h: 1150, alt: 'SSW 团队协作' } }
```

ssw.com.au 的首屏以一张真实团队/工作照作底，靠右裁切，桌面叠一层红色渐变遮罩。

- **未提供时**：卡片只呈现红黑渐变底 —— 这是一个完成态的设计，不是坏图，
  也不会放占位图或任何虚构照片。
- 已提供时按 `object-fit: cover`、`object-position: 100% 50%` 呈现；
  <1024px 不透明度 0.6，≥1024px 为 1 并叠加红色遮罩（与线上一致）。
- 必须是获准使用的真实照片，`alt` 必填。

## 2. 企业微信可搜索账号（可选）

```ts
wecom: {
  searchableId: 'SSW-China';
}
```

- **未提供时**：企业微信号整行（标签、账号值、复制按钮、复制成功/失败提示）
  完全不输出，不在可达性树也不在 Tab 序列中。
- 已提供时会出现「复制账号」按钮；复制成功提示「已复制企业微信号」，
  失败提示「未能复制，请长按或选中账号复制」并自动选中账号文本。
- 二维码加载失败时，账号行会与错误提示同时显示，作为诚实的备用路径。

## 3. 未配置态文案（需文案负责人确认）

```ts
wecom: {
  pendingNotice: '二维码尚未配置。配置完成后，此处显示可扫描的企业微信二维码。';
}
```

**这是交接文档没有规定的新增文案。** 文档只给了「加载失败」的措辞，没有给「尚未配置」的。
当前措辞如实告知当前不可扫码、不承诺时间、不制造假码。请文案负责人确认或替换。

## 4. 产品与社区标识（Tina / YakShaver / FireUG）

**Tina 与 YakShaver 已补齐**（2026-09-08，经用户确认后取自 ssw.com.au 的官方素材）：

```ts
tina:      { logo: '/media/tina-logo.svg' (1020×254),  art: '/media/tina-mark.svg' (448×621) }
yakshaver: { logo: '/media/yakshaver-logo-dark.svg' (212×41), art: '/media/yakshaver-gradient.webp' (500×320) }
```

`art` 是产品卡片右侧的装饰图（Tina 水印图形／YakShaver 渐变底），纯装饰、`aria-hidden`，
为 null 时卡片只有纯色底、版式不变。Tina 的两个图形是 Tina 橙 `#EC4815`，
卡片上由 CSS 滤镜转白（与线上做法一致），**原始素材未做任何修改**。

**FireUG 标识已补齐**（2026-09-09，按用户要求取自 fireusergroup.com 官方素材）：

```ts
ecosystem: { fireug: { name: 'FireUG', logo: { src: '/media/fireug-logo.png', w: 512, h: 135 }, logoAlt: 'FireUG' } }
```

原图 512×203 含烧进位图的副标题，已裁掉下半带 ⇒ 512×135（详见 DECISIONS §44）。
FireUG 是 SSW 自有社区（对方页脚「Powered by SSW」，备案号为 ssw.cn 主号加 -1 后缀），
因此与 Tina／YakShaver 同处理，**不设商标授权闸门**。

- 三条产品／社区标识均已配置，本节不再有缺项。
- 若未来某项被置回 `null`：以真实名称纯文字呈现，**不预留空的标识框、不自制替代 Logo**。

**链接**（Tina 与 YakShaver 核实于 2026-09-07；FireUG 频道核实于 2026-09-09）：
Tina → `https://tina.io/`；YakShaver → `https://yakshaver.ai/`；
FireUG → B 站 `https://space.bilibili.com/545713776`、
YouTube `https://www.youtube.com/@fireusergroup`。

~~未核实 FireUG 独立频道地址前，不做「前往 B 站」按钮，也不产生死链。~~
**该约束已解除**：频道地址在对方官网上得到核实，卡片上原先兜底指向
`https://ssw.cn/upcomingevents?lang=zh-CN` 的「了解 FireUG」链接，
已换成两个真实频道入口。YouTube 那个带 `sr-only` 提示「中国大陆可能无法访问」。

## 5. 团队照片（可选）—— 已随「关于 SSW」区块一并移除

**本节不再有待补项。** 用户 2026-09-09 要求删掉「以工程实践，推动 AI 落地」
区块（即整个「关于 SSW」），团队照片是那个区块里唯一的素材位，
因此配置字段 `about.teamPhoto`、类型 `TeamPhoto`、`check:assets` 里的
「团队照片」一行都已移除 —— 留着会报一个没有渲染位置的空槽，属于误导。

要恢复整块，按 DECISIONS §46 的清单来（六个文件），照片字段的形状是：

```ts
about: { teamPhoto: { src: '/media/team.jpg', w: 2400, h: 800, caption: '准确图注', alt: '替代文本', ratioDesktop: '3 / 1', ratioMobile: '4 / 3' } }
```

- **未提供时**：关于区保持 760px 纯文字，不留空图框。
- `caption` 与 `alt` 必填 —— 没有真实图注的照片不可发布。

## 6. 页脚法律与备案资料

```ts
footer: {
  legalName: '（中国站主体法定名称，需核实）',
  copyrightHolder: 'SSW',
  copyrightYear: 2026,
  privacyUrl: 'https://…',
  icp: { number: '京ICP备…号', url: 'https://beian.miit.gov.cn/' },
  publicSecurity: { number: '京公网安备…号', url: 'https://…' },
}
```

- 每一项独立成行、独立省略。当前只输出「© 2026 SSW」与标识。
- **绝不填写推测或占位的备案号与法定名称。**
- **不得把澳洲站的法律信息直接替代中国站内容。**
- `privacyUrl` 为 `null` 时不输出链接，绝不使用 `href="#"`。
- `icp` 是发布阻塞项：中国大陆上线前必须填入真实备案号。

## 7. 案例模块 —— 目前整段不存在

当前没有获准公开的真实案例，因此**没有 `cases` 区块文件，配置里也没有对应字段**，
不存在被半启用的可能，页面上不会出现空白、占位卡片或「敬请期待」。

将来拿到至少一条完整且获准公开的案例即可启用（无需凑够三条）。按文档 §案例 采集：

- 可公开客户名，或获准的匿名描述
- 业务问题
- 实施范围
- 实际结果
- 结果口径及时间范围
- 公开授权
- 可用图片

呈现方式：一条横向故事「客户信息与业务问题 → 实施方案 → 实际结果」，
标题用「看看 AI 如何进入实际业务」。没有内页时直接在首页呈现摘要，
不设置无目标的「查看详情」。**成果可为定性结果；涉及数字时必须附事实依据，不自行推算。**

## 7. 案例（当前是占位内容，阻塞发布）

```ts
cases: [{ title, summary, clientName, clientLogo, backgroundImage, url, isPlaceholder }];
```

交接文档原本要求「案例尚未提供，整个模块隐藏」。用户于 2026-09-08 明确改为
「随便 mock 一点中文文字和图」，因此现在放着**一条显式标记的占位案例**：

- 客户名是 `示例客户`，标题与简介都明说是占位，**没有编造真实企业或成果数字**；
- `clientLogo` 为 null ⇒ 客户名纯文字呈现，**没有伪造的客户标志**；
- `backgroundImage` 指向 `public/media/placeholder/` 下的**占位照片**
  （Lorem Picsum / Unsplash License，免署名，已转灰度）——
  灰度是刻意的，一眼可辨不是终稿；**这些照片不是任何真实项目的现场**；
- `url` 为 null ⇒ 卡片不是链接，也不渲染跳转箭头（不产生死控件）；
- `isPlaceholder: true` ⇒ 卡片左上角有可见的「示例内容」角标，
  且 `publishBlockers()` 返回非零，`npm run check:assets` 退出码为 1。

**发布前必须二选一**：换成获准公开的真实案例（补齐 `clientLogo` /
`backgroundImage` / `url` 并把 `isPlaceholder` 改为 false），
或把 `cases` 清空让整段不渲染。**两种情况都要删掉 `public/media/placeholder/` 整个目录。**

## 8. 数据统计（用的是全球口径，非中国区）

```ts
advantage: { sourceNote, stats: [{ figure, suffix, label, note }] }
```

当前三个数字取自 ssw.com.au 已公开的全球数据（2026-09-08）。
`sourceNote` 作为**可见文字**渲染在数字下方，明确写出这是全球口径 ——
不允许出现没有出处说明的成果数字。若拿到中国区数据，改配置即可；
`advantage` 置 null 则整段不渲染。

## 8. 「为什么选择 SSW」的视频地址（`whyUs.videoUrl`）—— 已解决

2026-09-09：已填入 B 站地址 `https://www.bilibili.com/video/BV1MN411m7mn/`，
**中国大陆可正常访问**，此前 YouTube 版本对目标用户打不开的问题就此解决。
播放按钮已渲染（76.5px 圆形、品牌红渐变、毛玻璃），新标签页打开。

封面图同时由用户更换为 `public/media/why-ssw-poster.jpeg`（1920×1080）。
`whyUs.caption` 按用户要求保持 `null`，不输出说明文字。
