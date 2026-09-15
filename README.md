# SSW.cn（2026 改版）

深炭黑 + SSW 红 `#CC4141` 的中文官网：首页 + 三个 AI 服务详情页。技术栈：Vite + 原生 TypeScript + 原生 CSS。

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

新增页面的做法：在 `services/<slug>/index.html` 建文件（照抄现有那三个的骨架），
再把入口加进 `vite.config.ts` 的 `build.rollupOptions.input`。

## 运行

```bash
npm install
npm run dev        # http://localhost:5173
```

| 命令                   | 作用                                                               |
| ---------------------- | ------------------------------------------------------------------ |
| `npm run dev`          | 本地开发预览                                                       |
| `npm run build`        | 类型检查 + 生产构建到 `dist/`                                      |
| `npm run preview`      | 预览生产构建（http://localhost:4173）                              |
| `npm run typecheck`    | `tsc --noEmit`                                                     |
| `npm run contrast`     | 从 `tokens.css` 读取真实令牌校验对比度，并阻止品牌红被用作文字颜色 |
| `npm run check:assets` | 打印待补素材表；存在发布阻塞项时退出码非零                         |
| `npm run fonts:sync`   | 从 `node_modules` 同步 Inter 拉丁子集到 `public/fonts/`            |
| `npm run verify`       | typecheck + 格式检查 + 对比度 + 构建（日常应当全绿）               |
| `npm run preflight`    | `verify` + 素材检查 —— **发布前的闸门**，素材未补齐时会失败        |

## 补充素材：只需要改一个文件

把文件放进 `public/media/`，然后在 [`src/config/site.config.ts`](src/config/site.config.ts) 填入路径与原始像素尺寸。

所有 `null` 都有明确的诚实降级行为（构建期条件渲染，因此 JS 关闭时同样成立），逐项说明见 [`docs/PENDING-ASSETS.md`](docs/PENDING-ASSETS.md)。

## 发布前必须完成

`npm run check:assets` 会列出阻塞项。当前两项：

1. **真实企业微信二维码** —— 配置 `wecom.qrImage` 后，必须**在另一台设备实扫验证**，并在手机上验证长按保存与「打开二维码图片」。在此之前咨询面板显示的是诚实的未配置空状态，不会出现任何可扫描的假码。
2. **中国站 ICP 备案信息** —— 配置 `footer.icp`。**不得填写占位或推测的备案号**，也不得把澳洲站的法律信息直接搬过来。

其余素材（可搜索企业微信号、产品标识、团队照片、法定名称、隐私政策链接）缺失不阻塞发布，页面会自动省略对应内容而不是留空框。

## 明暗主题

深色是基准（交接文档 §3 的设计值）；浅色以 `:root[data-theme='light']` 覆盖同一组语义令牌，
组件 CSS 一律只读令牌，没有任何 `dark:` / `light:` 分支。

初始主题：已存选择 → 系统 `prefers-color-scheme` → 深色。选择记在 `localStorage['ssw-cn-theme']`。
主题在 `<head>` 的预渲染脚本里、样式表之前确定，因此不会闪烁。
无 JS 时属性不存在、深色令牌生效，主题按钮保持隐藏。

两套调色板都已过对比度校验，详见 `npm run contrast`。

## 本次实现刻意不做的事

- **案例目前是占位内容**：`src/sections/cases.html` 与 `cases` 配置项存在，但整段带发布闸门（`npm run check:assets` 会点名）。将来拿到获准公开的真实案例，按文档 §案例 的字段清单替换。采集字段见 `docs/PENDING-ASSETS.md`。
- 不虚构客户、成果数字、资质、团队规模、照片、二维码、备案号、法定名称。
- 图示一律标注为示意，不出现「运行中／成功率／客户名称」等模拟状态，不绘制未经验证的产品界面。

## 结构

```
index.html            首页骨架
services/*/index.html AI 服务详情页骨架（每个目录一个页面 ⇒ 干净 URL）
src/partials/*.html   跨页面共用的碎片：head、body 首尾、三张服务卡片
src/sections/*.html   一区块一文件，中文文案就住在这里
src/config/           唯一的素材配置面（types.ts 是契约，site.config.ts 是取值）
src/styles/           tokens.css 是闭合令牌集；motion.css 含全部 @keyframes 与唯一的动效开关
src/scripts/          nav / wecom-modal / reveal / motion，全部是渐进增强
build/html-include.ts ~90 行本地 Vite 插件：@include / @if / @else / {{ }}
docs/DECISIONS.md     所有「文档未规定、由实现推断」的取值与理由
docs/VERIFY.md        验收清单与已执行的验证结果
```

两条评审规则：**所有 `@keyframes` 只出现在 `motion.css`**；**`tokens.css` 之外不出现时长／位移字面量**。
