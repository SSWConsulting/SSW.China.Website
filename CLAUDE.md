# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

SSW.cn 2026 改版：Vite + 原生 TypeScript + 原生 CSS 的多页静态站（首页 + 三个 AI 服务详情页）。
运行时依赖只有 `cobe`（WebGL 点阵地球，≥1024px 才按需加载）。

`README.md` 已覆盖命令表、页面清单、目录结构与补充素材的流程 —— **本文件只记那些
需要读多个文件才能发现的约定**，不重复 README。

## 常用命令

```bash
npm run dev        # localhost:5173
npm run verify     # typecheck + 格式检查 + 对比度 + 构建 —— 每次改动后都应全绿
npm run preflight  # verify + 素材检查（发布闸门，当前必然失败，见下）
```

`npm run contrast` 单独跑对比度；`npm run check:assets` 单独看发布阻塞项。
**没有测试套件**，`verify` 就是回归防线。

## 云端预览发布

给同伴预览走「静态站点」发布：**把 `dist/` 当作站点根目录**上传（静态服务），
**不要发布仓库根目录** —— 根目录不是 HTTP 服务。目录式入口的干净 URL
（`/services/ai-platform/`）与根绝对路径 `/assets/...` 在静态服务下都原样可用，无需额外重写。

线上链接只反映**发布那一刻**的产物 —— 改完代码必须重新构建再重新发布才生效。

当前线上：https://ssw-cn-preview-46551.app.workbuddy.host/

**发布后校验线上是否真生效，务必加缓存破坏参数** —— 边缘节点会缓存（响应头
`eo-cache-status: HIT`），直接 `curl` 可能拿到旧页面而误判发布失败：

```bash
curl -s "$URL/?t=$(date +%s)" -o /tmp/live.html && diff -q /tmp/live.html dist/index.html
```

发布调用偶发 `fetch failed`（瞬时错误），重试一次即可。

发布调用若报「**应用预留域名 `<prefix>-<随机数>` 未绑定到本次发布环境**」：

- 工作区**已有**应用记录 → 加 `updateExistingApp: true`，链接保持不变（日常重新发布走这条）。
- 工作区**没有**已登记应用 → 只能加 `createNewApp: true`，此时**分享链接会换成新的
  `<domainPrefix>-<随机数>.app.workbuddy.host`**，旧链接作废，需通知已拿到旧链接的人。

构建有两个环境坑（均实测）：

- **ARM Mac 上构建报 `MODULE_NOT_FOUND` 时，先重跑 `npm install`。**
  `node_modules` 里若残留 `@rollup/rollup-darwin-x64` 而机器是 arm64，
  `vite build` 会在加载 rollup 原生模块时直接失败。重装即补上 `darwin-arm64` 变体。
- **`vite build` 默认先清空 `dist/`**（`emptyOutDir`）。若环境把该删除判定为批量删除而拒绝，
  整个构建不会执行。替代做法是输出到独立目录 `npx vite build --outDir dist-preview`
  （再发布该目录）—— 代价是绕过 `npm run build` 里的 `typecheck`，需另跑 `npm run typecheck`。

## 两个事实来源

- **中文文案**：`docs/spec/SSW-cn-首页文案与视觉设计说明.md`。页面上的中文逐句照抄，
  **不要在实现中改写文案**。任何该文档之外的新增文案都要在 `docs/DECISIONS.md` 里
  标注「需文案负责人确认」。
- **判断记录**：`docs/DECISIONS.md`（约 39 条）记录每一处「文档未规定、由实现推断」
  或「与 ssw.com.au 有意不同」的取值与理由，`docs/VERIFY.md` 记录已执行的验证。
  **改动涉及取舍时，追加一条，不要改写既有条目。**

## 构建期模板：`build/html-include.ts`

约 90 行的本地 Vite 插件，提供三个原语：

```html
<!-- @include sections/hero.html -->
<!-- @if wecom.qrImage -->
A
<!-- @else -->
B
<!-- @endif -->
{{ wecom.searchableId }}
```

- 条件与插值**在构建期求值** —— 所以「素材缺失时的诚实降级」在 JS 关闭时同样成立，
  缺失分支的标记根本不会进入产物。
- `{{ }}` 的键不存在或为 `null` 会**抛错**（避免空 `src`/`href` 上线）。
- **不支持循环**。多条目要么用索引访问（`{{ cases.0.title }}` + `@if cases.1`），
  要么把一份名单写成 partial 再 `@include` 多次（客户标识跑马灯就是三条轨道共用一份）。

新增页面：建 `services/<slug>/index.html`，再把入口加进 `vite.config.ts` 的
`build.rollupOptions.input`（目录式入口 ⇒ 干净 URL）。

## 素材配置：`src/config/site.config.ts`

唯一需要非作者编辑的文件。`types.ts` 是带注释的契约。

- **`null` 表示「尚未提供」，永远不是占位字符串。** 每个 `null` 都有明确的降级行为
  （不留空图框、不输出半截版权行、不产生指向不存在页面的链接）。
- `publishBlockers()` 返回发布阻塞项，`check:assets` 消费它。当前有五条
  （企业微信二维码、ICP 备案、占位案例、客户标识商标授权、资质徽章授权）——
  **preflight 失败是预期状态**，不要为了让它通过而改配置。

## CSS 架构

层级顺序在 `src/styles/index.css` 首行：`@layer tokens, base, layout, components, motion`。
**motion 在最后 —— 动效总开关必须能覆盖任何来源。**

两条评审规则：

1. **所有 `@keyframes` 只出现在 `motion.css`。**
2. **`tokens.css` 之外不出现时长／位移字面量**（照搬 ssw.com.au 的像素值除外，见下）。

### 动效总开关与四个例外

`motion.css` 末尾是全站唯一禁用动效的地方：`prefers-reduced-motion: reduce` 与
`html[data-motion="off"]` 各把 `--motion` 置 0、`--ambient` 置 `none`。
因为 `calc(240ms * 0) = 0s`，约 95% 的动效随之失效。

**消费 `--ambient` 必须用长写法**：`animation-name: var(--ambient, mesh-drift)`。
简写 `animation: var(--ambient, X) …` 会被误解析。

**以下四处是用户明确要求的例外，不受总开关约束 —— 不要"修好"它们**：

| 例外                      | 位置                                    | 记录 |
| ------------------------- | --------------------------------------- | ---- |
| 地球无条件自转            | `globe.ts` 的 `AUTO_SPIN`               | §19  |
| 悬停手势（箭头旋转/放大） | `--t-gesture: 300ms`（不乘 `--motion`） | §31  |
| 背景视频原生 autoplay     | `sections/ai-solutions.html`            | §33  |
| 按钮涟漪                  | `--t-ripple: 600ms`                     | §38  |

历史教训：曾把**悬停终态**写成 `rotate(calc(45deg * var(--motion)))`，
减少动效下终态被算成 `rotate(0)`，整个效果消失。**开关该关的是「动」，不是「态」**——
终态照写，靠时长归零来降级。

### 降级原则（承重设计）

CSS 一次性动效的**基础规则持有最终状态**；"隐藏/偏移"的起始状态只写在 `@keyframes` 里，
靠 `animation-fill-mode: backwards`（或 `both`）生效。于是 JS 不跑、动画被禁、
中途取消、元素未被观察到 —— 渲染结果都是完成后的静态图。

唯一的「默认隐藏」规则作用域限定在 `html[data-reveal="io"]`，该属性只有
`IntersectionObserver` 存在**且**动效未关时才由 `main.ts` 设置。

### 主题

深色是基准（`:root`），浅色以 `:root[data-theme='light']` 覆盖**同一组语义令牌**。
组件 CSS 一律只读令牌，**没有任何 `dark:` / `light:` 分支**。
少数照搬 ssw.com.au 的区块（产品卡片、案例主卡、视频通栏）是刻意固定深色的，
在两套主题下都不翻转。

### 对比度守卫

`scripts/check-contrast.mjs` 从 `tokens.css` 读真实令牌校验两套主题，并额外强制：
**品牌红 `--c-brand` 不得作为文字颜色**（深底上仅 3.72:1）。
需要红色文字时用 `--c-brand-text`；纯图标可以用 `--c-brand`，但必须在同一行注释「图标」。

## 复刻 ssw.com.au 的约定

导航、首屏、卡片、跑马灯等多个区块是照搬 ssw.com.au 的版式。

**线上根字号是 18px**，所以它的 rem 值都是 1.125×。这些区块里**硬编码解析后的 px 值**
（`rounded-card` 1rem → 18px、`p-6` → 27px、`text-2xl` → 27px），
以便精确对齐而不干扰本站其余部分（16px 根字号）。

**抄取值，不要抄类名。** 已经因此踩过两次：`border-0.75` 的计算值其实是 `0.5px`；
面板内边距照类名写成 `0`，线上实际是 `22.5px`。**测计算值，或直接读线上 CSS 原文。**
工具类要连变体一起测 —— `bg-sswDarkRed` 不存在，但 `.hover\:bg-sswDarkRed:hover` 存在。

## 诚实性约束（贯穿全程）

不虚构客户、成果数字、资质、地域团队规模、照片、二维码、备案号、法定名称。
图示一律标明为示意；不生成任何可扫描的假二维码。

当前页面上的占位内容（示例案例、灰度占位图、第三方客户标识与资质徽章）
**全部带发布闸门**，`check:assets` 会点名。新增此类内容时沿用同一模式：
配置里加显式标志 → `publishBlockers()` 里加一条。

## 验证环境的已知限制

内置 Browser 面板（`mcp__Claude_Browser__*`）有几个会误导结论的坑，都实测过：

- **`requestAnimationFrame` 冻结**（0 帧/700ms），`IntersectionObserver` 回调与
  `scroll` 事件也不派发 —— 依赖它们的逻辑要用合成事件或直接读计算值来验证。
- **面板报告 `prefers-reduced-motion: reduce`** ⇒ `--motion` 为 0、所有时长读作 `0s`。
  要读真实时长，先临时 `document.documentElement.style.setProperty('--motion','1')`。
- **产生不了真实 `:hover`**（`el.matches(':hover')` 恒为 false）。
  验证悬停要读规则声明值，或派发带坐标的 `PointerEvent`。
- **视口模拟会中途失效**（`resize_window` 报成功但 `innerWidth` 不变）。
  窄屏版式可改为直接收窄容器宽度做等效验证，并在 `VERIFY.md` 里注明是等效而非实测。
- 面板未显示时 `document.hidden` 为 true，视频会被浏览器暂停 —— 不是代码问题。

## README 中已过时的一处

README 的「本次实现刻意不做的事」写着「案例模块整段不存在：没有 `cases` 区块文件，
配置里也没有对应字段」。**这已过时** —— 用户后来要求加入占位案例，
现在有 `src/sections/cases.html` 与 `cases` 配置项（带发布闸门）。修改 README 时请一并更正。
