# SSW.cn（2026 改版）

深炭黑 + SSW 红 `#CC4141` 的中文官网：首页 + 三个 AI 服务详情页。技术栈：[Astro](https://astro.build)（纯静态输出）+ 原生 TypeScript + 原生 CSS，文案与素材由 [TinaCMS](https://tina.io) 后台编辑（见 [`docs/TINACMS.md`](docs/TINACMS.md)）。

导航条与首屏按 [ssw.com.au](https://www.ssw.com.au) 的版式实现，并新增了「SSW 遍布全球」区块与明暗主题切换。
运行时依赖只有一个 [`cobe`](https://www.npmjs.com/package/cobe)（13KB，WebGL 点阵地球），
且只在 ≥1024px 时按需加载 —— 窄屏完全不下载。

**文案与设计的唯一事实来源**：[`docs/spec/SSW-cn-首页文案与视觉设计说明.md`](docs/spec/SSW-cn-首页文案与视觉设计说明.md)（2026-09-07 交付并已核实）。页面上的中文逐句照抄自该文档，请勿在实现中改写文案。

## 页面

| 路径                     | 内容                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                      | 首页：首屏、三张核心 AI 服务卡片、交付方式、产品与社区、关于 SSW、遍布全球、收尾 CTA                                                        |
| `/services/ai-platform/` | AI 中台建设                                                                                                                                 |
| `/services/ai-workflow/` | AI 业务工作流                                                                                                                               |
| `/services/ai-apps/`     | AI 应用定制                                                                                                                                 |
| `/chinafy/`              | 落地中国：帮助海外应用进入中国市场（内容取自 ssw.cn 现有同名页面）                                                                          |
| `/deck/`                 | 演示轮播：三大核心 AI 服务的全屏自动播放页，供展会／交流会现场大屏循环播放（`?motion=on` 可盖过系统的「减少动态效果」，见 DECISIONS §58.2） |

首页的三张卡片链接到对应的详情页；详情页底部互相链接。前五个页面共用同一份导航、
页脚、咨询面板与打包产物（一份 CSS、一份 JS）。

`/deck/` 是例外：它没有导航与页脚，自带一份精简的 `deck.css` / `deck.ts`
（不加载 `index.css` 与 `main.ts`），只复用令牌、base 与动效总开关。
它不挂进导航、带 `noindex`，是一个单独发给现场大屏的地址。

新增页面的做法：在 `src/pages/` 下建 `.astro` 文件（文件路径即 URL，`services/foo.astro` ⇒ `/services/foo/`），
文案放进 `content/pages/<slug>.json`，在 `src/lib/pages.ts` 写它的 schema，在 `tina/collections/` 加对应的后台集合，
最后把页面登记进 `scripts/seo.mjs` 的 `PAGES`。

## 运行

```bash
npm install
npm run dev        # http://localhost:5173 ，编辑后台 http://localhost:5173/admin/index.html
```

| 命令                   | 作用                                                               |
| ---------------------- | ------------------------------------------------------------------ |
| `npm run dev`          | 本地开发预览 + 本地模式的 Tina 编辑后台（保存即写本地文件）        |
| `npm run dev:site`     | 只启动网站，不启动编辑后台                                         |
| `npm run build`        | 类型检查 + 编辑后台（有 TinaCloud 凭据时）+ 生产构建到 `dist/`     |
| `npm run preview`      | 预览生产构建（http://localhost:4173）                              |
| `npm run typecheck`    | `astro check`（含 `.astro` 模板与 TS）                             |
| `npm run contrast`     | 从 `tokens.css` 读取真实令牌校验对比度，并阻止品牌红被用作文字颜色 |
| `npm run check:assets` | 打印待补素材表；存在发布阻塞项时退出码非零                         |
| `npm run fonts:sync`   | 从 `node_modules` 同步 Inter 拉丁子集到 `public/fonts/`            |
| `npm run verify`       | typecheck + 格式检查 + 对比度 + 构建（日常应当全绿）               |
| `npm run preflight`    | `verify` + 素材检查 —— **发布前的闸门**，素材未补齐时会失败        |

## 改文案、补素材：在编辑后台里改

文案在后台的各「页面」集合里改；图片、二维码、备案号、案例、客户标识与发布闸门在「站点设置」里改
（对应文件 [`content/settings/site.json`](content/settings/site.json)）。图片可以在后台直接上传到 `public/media/`，
填写时连同**原始像素尺寸**一起填。接入与使用说明见 [`docs/TINACMS.md`](docs/TINACMS.md)。

所有 `null` 都有明确的诚实降级行为（构建期条件渲染，因此 JS 关闭时同样成立），逐项说明见 [`docs/PENDING-ASSETS.md`](docs/PENDING-ASSETS.md)。

## 发布前必须完成

`npm run check:assets` 会列出阻塞项。当前两项：

1. **真实企业微信二维码** —— 配置「站点设置 → 企业微信咨询」后，必须**在另一台设备实扫验证**，并在手机上验证长按保存与「打开二维码图片」。在此之前咨询面板显示的是诚实的未配置空状态，不会出现任何可扫描的假码。
2. **中国站 ICP 备案信息** —— 配置「站点设置 → 页脚与备案」。**不得填写占位或推测的备案号**，也不得把澳洲站的法律信息直接搬过来。

其余素材（可搜索企业微信号、产品标识、团队照片、法定名称、隐私政策链接）缺失不阻塞发布，页面会自动省略对应内容而不是留空框。

## 明暗主题

深色是基准（交接文档 §3 的设计值）；浅色以 `:root[data-theme='light']` 覆盖同一组语义令牌，
组件 CSS 一律只读令牌，没有任何 `dark:` / `light:` 分支。

初始主题：已存选择 → 系统 `prefers-color-scheme` → 深色。选择记在 `localStorage['ssw-cn-theme']`。
主题在 `<head>` 的预渲染脚本里、样式表之前确定，因此不会闪烁。
无 JS 时属性不存在、深色令牌生效，主题按钮保持隐藏。

两套调色板都已过对比度校验，详见 `npm run contrast`。

## 本次实现刻意不做的事

- **案例目前隐藏**：「站点设置 → 案例」为空，整段不渲染。占位案例的数据留在 `src/config/placeholder-cases.json`，放出来时整段带发布闸门（`npm run check:assets` 会点名）。将来拿到获准公开的真实案例，按文档 §案例 的字段清单在后台填写。采集字段见 `docs/PENDING-ASSETS.md`。
- 不虚构客户、成果数字、资质、团队规模、照片、二维码、备案号、法定名称。
- 图示一律标注为示意，不出现「运行中／成功率／客户名称」等模拟状态，不绘制未经验证的产品界面。

## 结构

```
src/pages/            每个文件一个页面（文件路径即 URL）
src/layouts/Base.astro 页面外壳：<head>、SEO 标签、导航、页脚、咨询面板
src/components/       区块（sections/）、共用碎片（partials/）、服务页模板（service/）
src/lib/              content.ts 读取并校验 content/；pages.ts、shared.ts、service.ts 是各文件的 schema
src/config/           site.ts 收敛「站点设置」并给出发布阻塞项；types.ts 是素材契约
src/styles/           tokens.css 是闭合令牌集；motion.css 含全部 @keyframes 与唯一的动效开关
src/scripts/          nav / wecom-modal / reveal / motion，全部是渐进增强
content/              文案与素材配置（JSON），由 TinaCMS 后台读写
tina/                 TinaCMS 配置与后台集合定义
docs/DECISIONS.md     所有「文档未规定、由实现推断」的取值与理由
docs/VERIFY.md        验收清单与已执行的验证结果
docs/TINACMS.md       编辑后台的接入、使用规则与已知限制
```

两条评审规则：**所有 `@keyframes` 只出现在 `motion.css`**；**`tokens.css` 之外不出现时长／位移字面量**。
