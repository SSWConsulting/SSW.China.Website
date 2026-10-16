# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

SSW.cn 2026 改版：Astro（纯静态输出）+ 原生 TypeScript + 原生 CSS 的多页站，
文案与素材在 `content/` 下的 JSON 里，由 TinaCMS（TinaCloud）后台编辑。
运行时依赖只有 `cobe`（WebGL 点阵地球，≥1024px 才按需加载）；Tina 只参与 `/admin/`，不进页面。

`README.md` 已覆盖命令表、页面清单、目录结构与补充素材的流程 —— **本文件只记那些
需要读多个文件才能发现的约定**，不重复 README。

## 常用命令

```bash
npm run dev        # localhost:5173（含本地模式的 Tina 后台 /admin/index.html）
npm run verify     # astro check + 格式检查 + 对比度 + 构建 + SEO 检查 —— 每次改动后都应全绿
npm run preflight  # verify + 素材检查（发布闸门，当前必然失败，见下）
```

`npm run contrast` 单独跑对比度；`npm run check:assets` 单独看发布阻塞项。
**没有测试套件**，`verify` 就是回归防线。`npm run dev:site` 只起网站、不起 Tina。

Tina 本地开发的几个坑（均实测）：

- `npm run dev` 占用 4001（GraphQL）与 9000（datalayer）端口；它开着时再跑 `tinacms build`
  会报「Datalayer server is busy on port 9000」，先停掉 dev。
- 本地后台有自己的索引：在后台之外改了 `content/`（如 `git checkout`），后台仍显示旧值，
  此时在后台保存会把旧值写回去。重启 `npm run dev` 再编辑。
- `npm run build` 没有 `PUBLIC_TINA_CLIENT_ID` / `TINA_TOKEN` 时会**跳过** `/admin/`（`scripts/build-admin.mjs`），
  这是有意的：本地模式的后台连的是 localhost，发布出去也打不开。接入步骤见 `docs/TINACMS.md`。

## 提交与 Pull request

**提交信息、PR 标题与描述一律用英文**（仓库在 SSWConsulting 组织下，评审者不一定读中文；
GitHub 文件列表旁显示的就是提交信息首行）。引用页面上的中文文案时保留原文并附英文释义。
代码注释与 `docs/` 仍沿用中文。

## 生产部署

`main` 有 push ⇒ `.github/workflows/deploy.yml` 在阿里云服务器上的 self-hosted Windows runner
（标签 `windows,sswcn`）里构建，`robocopy /MIR` 到 nginx 站点目录。CI 只跑 `contrast` + `build`，
**不跑 `format:check` / `seo:check`**（Windows 检出的 CRLF 会让它们全量报错），这两项靠本地 `verify` 把关。
TinaCloud 把后台的编辑直接提交到 `main`，所以每次编辑都会触发一次部署。服务器配置见 `docs/DEPLOY-SETUP.md`。

## 云端预览发布（WorkBuddy）

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
  `node_modules` 里若残留 x64 的原生模块（rollup/rolldown 的 `*-darwin-x64`）而机器是 arm64，
  构建会在加载原生模块时直接失败。重装即补上 `darwin-arm64` 变体。
- **构建默认先清空 `dist/`**。若环境把该删除判定为批量删除而拒绝，整个构建不会执行。
  替代做法是输出到独立目录 `npx astro build --outDir dist-preview`（再发布该目录）——
  代价是绕过 `npm run build` 里的 `typecheck`，需另跑 `npm run typecheck`。

## 两个事实来源

- **中文文案**：`docs/spec/SSW-cn-首页文案与视觉设计说明.md`。页面上的中文住在 `content/` 的 JSON 里，
  逐句照抄自该文档，**不要在实现中改写文案**。任何该文档之外的新增文案都要在 `docs/DECISIONS.md` 里
  标注「需文案负责人确认」。编辑在后台改文案属于内容运营，不受此限；但代码改动不要顺手改 `content/`。
- **判断记录**：`docs/DECISIONS.md`（100 多条，新条目用 `## §NNN 标题` 追加在末尾）记录每一处「文档未规定、由实现推断」
  或「与 ssw.com.au 有意不同」的取值与理由，`docs/VERIFY.md` 记录已执行的验证。
  **改动涉及取舍时，追加一条，不要改写既有条目。**

## 内容与模板

```
content/pages/*.json      各页文案 + SEO          ← src/lib/pages.ts / service.ts 的 zod schema 校验
content/global/shared.json 导航、页脚、咨询面板、默认 CTA、服务卡片、办公室 ← src/lib/shared.ts
content/settings/site.json 素材、开关、发布闸门     ← src/config/site.ts 收敛成 types.ts 的契约
tina/collections/*.ts     对应的后台表单（字段说明就是给编辑看的规则）
```

- **两条读取路径，语义不同。** 页面文案走 `lib/content.ts` 的 `load()` + zod：必填项缺失 ⇒ **构建失败**
  （后台把必填项清空不会悄悄上线缺字的页面）。素材配置走 `config/site.ts`：缺失 ⇒ `null` ⇒ 诚实降级，不是错误。
- **Tina 写 JSON 的形状**：不接受值为 `null` 的对象（索引会失败），用「键不存在」表示未填；
  清空字符串字段会写成 `""`。`site.ts` 把这两种都收敛成 `null`；`opt` 也把空串视同未填。
  **不要往 `site.json` 里写 `null`。**
- 改 schema 要两边一起改：`src/lib/*.ts`（zod，页面读取）与 `tina/collections/*.ts`（后台表单）。
- 多行字段（标题断行、地址）用 `br()` 把换行变成 `<br />`：`<Fragment set:html={br(x)} />`。
- 结构化数据由 `components/JsonLd.astro` 输出，从同一份文案生成 —— FAQPage 与可见问答天然一致。
- `.astro` 里的说明性注释写成 `{/* */}`（不进产物）；不要写 `<!-- -->`，它会原样输出。
  JSX 表达式里，元素前面不能放 JS 注释（`cond && ( /* … */ <section>` 会让编译器报错），把注释挪到表达式外面。

**行内空白是承重的，三处配置与它有关，不要"顺手优化"：**

- `astro.config.mjs` 里 `compressHTML: false` —— Astro 的压缩会删掉行内元素之间跨行的空白
  （「中国 当前」→「中国当前」）。
- `.astro` 不交给 prettier（`.prettierignore`）—— prettier-plugin-astro 会把交付项那四个
  紧贴的 `<span>` 重排出空白。模板里写成一行的地方（`deliverable` 的 summary、`stage__focus`）是刻意的。
- `vite.build.cssMinify: 'esbuild'` —— 默认的 Lightning CSS 会删掉 `@layer` 顺序声明（见下节）。

新增页面：建 `src/pages/<path>.astro`（文件路径即 URL，`build.format: 'directory'` ⇒ 干净 URL），
文案进 `content/pages/<slug>.json` + schema + Tina 集合，再登记进 `scripts/seo.mjs` 的 `PAGES`。

## 素材配置：`content/settings/site.json`

后台「站点设置」。`src/config/types.ts` 是带注释的契约，`src/config/site.ts` 负责收敛与 `publishBlockers()`。

- **未提供 = 键不存在（或空串），永远不是占位字符串。** 每个缺省都有明确的降级行为
  （不留空图框、不输出半截版权行、不产生指向不存在页面的链接）。
- `publishBlockers()` 返回发布阻塞项，`check:assets` 消费它。当前有五条
  （企业微信二维码实扫、占位照片、客户标识商标授权、两处资质授权）——
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
| 背景视频原生 autoplay     | `components/sections/AiSolutions.astro` | §33  |
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
- **截图的坐标系可能与视口不一致**（截图 800×600，实际视口 1024×768），按截图坐标点击会偏。
  点击、输入改用 `find` / `read_page` 拿到的 `ref`。
