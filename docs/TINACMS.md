# TinaCMS：编辑后台的接入与使用

网站的文案与素材配置都在 `content/` 下的 JSON 里，由 [TinaCMS](https://tina.io) 提供编辑后台（`/admin/`）。
后端用 **TinaCloud**，由它负责登录、权限，以及把编辑提交回 GitHub，我们不需要维护任何服务。

```
编辑在 /admin/ 改文案、点保存
  └─> TinaCloud 把改动提交到 SSWConsulting/SSW.China.Website 的 main
       └─> GitHub Actions：云端构建，服务器上的 runner 拷贝发布
            ├─ 校验失败（必填文案被清空等）→ 停止，线上保持原样
            └─ 校验通过 → 新版本上线
```

线上站点仍然是纯静态的：页面在 `astro build` 时直接读 `content/` 下的 JSON，访客访问不经过 Tina。

## 一次性配置（管理员）

### 1. 在 TinaCloud 建项目

1. 用 GitHub 账号登录 [app.tina.io](https://app.tina.io)，新建项目（Create Project）。
2. 仓库选 `SSWConsulting/SSW.China.Website`。如果列表里没有这个仓库，需要 SSWConsulting 组织管理员在 GitHub 上给 TinaCloud 应用授权该仓库。
3. **Site URL** 填 `https://ssw.cn`。本地调试再加一条 `http://localhost:5173`。
4. 在项目的 Overview 页面复制 **Client ID**，再到 Tokens 页面生成一个 **Read Only Token**。

### 2. 把凭据交给 CI

在 GitHub 仓库的 **Settings → Secrets and variables → Actions** 里新增两个 secret：

| 名称                    | 值                       |
| ----------------------- | ------------------------ |
| `PUBLIC_TINA_CLIENT_ID` | 上一步的 Client ID       |
| `TINA_TOKEN`            | 上一步的 Read Only Token |

配置之后，下一次部署产物里就会带上 `/admin/`。**没配置时 `/admin/` 不会发布**（见 `scripts/build-admin.mjs`），网站本身不受影响。

### 3. 可视化编辑预览站（Vercel）

编辑者日常用 `https://ssw.cn/admin/`（实时预览靠服务器本机的预览服务，见 DEPLOY-SETUP）。
Vercel 上另有一个**预览站**：同一份代码用 `npm run build:preview` 构建（`vercel.json` 已配置），它自己的 `/admin/` 打开文档也是「左表单、右预览」，
主要用途是下面的 PR 预览。在预览站保存与在 ssw.cn 保存完全一样：走 Editorial Workflow 建分支开 PR（见「已知限制」）。预览站对搜索引擎声明 noindex。

部署用 Vercel 的 GitHub 集成（DECISIONS §123）：Vercel 项目连接本仓库后，

- `main` 的每次更新（包括后台保存）⇒ 预览站的正式部署（`https://ssw-china-preview.vercel.app`），与 ssw.cn 同时更新。
- 其他分支与每个 PR ⇒ 各自的 **PR 预览**部署，Vercel 在 PR 里贴出链接，用来在合并前看页面改动。

Vercel 一侧要配置：

1. 项目 **Settings → Environment Variables**：`PUBLIC_TINA_CLIENT_ID` 与 `TINA_TOKEN`，勾选 **Production** 与 **Preview**
   （值与 GitHub 仓库 secret 相同）。没有它们构建会直接失败（`scripts/build-admin.mjs`）。
2. 项目 **Settings → Git**：Production Branch 为 `main`。
3. 预览站域名（通常是 `https://ssw-china-preview.vercel.app`）加进 TinaCloud 项目的 **Site URLs**。
4. PR 预览默认受 Vercel 的 Deployment Protection 保护，只有 Vercel 团队成员能打开；要给团队外的人看，在
   **Settings → Deployment Protection** 里调整。

**PR 预览只用来看页面，不要在它的 `/admin/` 里改文案**：Tina 的分支在 Vercel 上固定为 `main`
（`tina/config.ts` 读 `GITHUB_REF_NAME`，Vercel 上没有），在 PR 预览里保存不会改到这个 PR，而是另建一个 `tina/…` 分支和 PR
（`main` 受保护，不会直接写进 `main`，§124）；右侧预览显示的是 PR 的页面代码配上 `main` 的内容。PR 预览的域名每次不同，也不在 TinaCloud 的 Site URLs 里，后台通常登录不了。
PR 预览构建时跳过 TinaCloud 的 schema 校验（`--skip-cloud-checks`），否则改了 schema 的 PR 会因与 `main` 不一致而构建失败（DECISIONS §126）。

### 4. 邀请编辑

在 TinaCloud 项目的 Collaborators 里邀请编辑人员。他们打开 `https://ssw.cn/admin/`，用 TinaCloud 账号登录即可。

## 后台里有什么

| 集合                              | 文件                                                 | 管什么                                                       |
| --------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| 页面：首页                        | `content/pages/home.json`                            | 首页各区块的标题与正文                                       |
| 页面：AI 底座中台 / AI 业务工作流 | `content/pages/ai-platform.json`、`ai-workflow.json` | 两个服务页（同一个模板）                                     |
| 页面：AI 应用定制                 | `content/pages/ai-apps.json`                         | AI 应用定制页                                                |
| 页面：落地中国                    | `content/pages/chinafy.json`                         | /chinafy/                                                    |
| 页面：关于我们                    | `content/pages/about.json`                           | /about/                                                      |
| 页面：演示轮播                    | `content/pages/deck.json`                            | /deck/（展会大屏）                                           |
| 全站通用                          | `content/global/shared.json`                         | 导航、页脚联系方式、咨询面板、默认收尾 CTA、服务卡片、办公室 |
| 站点设置                          | `content/settings/site.json`                         | 图片素材、二维码、备案号、案例、客户标识、**发布闸门**       |

每个页面都有自己的 **SEO** 字段（浏览器标题和页面描述）。canonical、og 标签与结构化数据由它们自动生成。

页面**结构**（有哪些区块、什么顺序、什么版式）在代码里，后台只改文字、列表与素材。
列表里的项可以增删、拖动排序；编号（01、02…，I、II、III）会自动生成。

## 编辑规则

这些规则原本写在代码注释里，换成后台编辑后依然有效：

- **留空 = 尚未提供，不要填占位文字。** 「站点设置」里的可选项留空后，页面会按约定降级：不显示空图框，不输出半截版权行，也不生成指向不存在页面的链接。每个字段的说明里都写了留空后会怎样。
- **发布闸门。** 「待业务/法务确认」「这是占位素材」「这是占位案例」「二维码已实扫验证」这几个开关会让 `npm run check:assets` 报告阻塞项。只有确认属实后才能改动，不要为了让检查通过而改开关。
- **不虚构。** 客户、数字、资质、照片、二维码、备案号、法定名称都必须是真实的。
- **必填文案不能清空。** 页面文案缺少必填项时，构建会失败并指出是哪个字段。线上保持上一个版本，修好后再保存一次即可。
- **中文文案的事实来源** 仍是 `docs/spec/SSW-cn-首页文案与视觉设计说明.md`。改动规格之外的文案，应先经文案负责人确认。

## 本地开发

```bash
npm run dev        # 网站 + 本地编辑后台：http://localhost:5173/admin/index.html
```

本地模式不需要 TinaCloud 账号，后台的保存会直接写入本地的 `content/` 文件，用 git 提交即可。
只想看网站、不启动后台时，用 `npm run dev:site`。

## 已知限制与后续可做

- **可视化编辑在 ssw.cn、预览站和本地。** 在 `https://ssw.cn/admin/`（或预览站的 `/admin/`、本地 `npm run dev` 的后台）打开任意一个「页面：…」，左边是表单，右边是实时预览：输入时预览立刻更新，点预览里的文字会跳到对应字段。「全站通用」（导航、页脚等）仍是表单编辑；「站点设置」里只有首页的数据统计与客户标识可在预览里点选（§122），其余在表单里改。ssw.cn 的实时预览靠服务器本机的预览服务（见 DEPLOY-SETUP）；它停了时用 `https://ssw.cn/admin/forms/` 的表单编辑。实现与限制见 DECISIONS §108、§109、§111、§113、§117。
- **预览站部署在 Vercel，`*.vercel.app` 在国内被拦截。** 国内编辑者用 `https://ssw.cn/admin/`。
- **保存后先开 PR，合并后才上线（Editorial Workflow，§124）。** TinaCloud 项目开了 Editorial Workflow 并把 `main` 设为受保护分支，GitHub 上也有规则集 `Protect main`（合并前必须走 PR）。在后台保存时会要求起分支名，TinaCloud 建 `tina/…` 分支、提交并开 PR；PR 合并进 `main` 后才触发部署。
  - 默认分支名按文档生成（如 `tina/pages/home`）。仓库开了「合并后自动删除分支」，正常不会重名；若同一页面上一个 PR 还没合并又保存，会提示「A branch with this name already exists」，改个分支名即可。
  - 不想上线的测试 PR 直接关闭，并删除它的分支。
  - 合并后线上约 3 分钟更新；HTML 带 `Cache-Control: no-cache`（服务器 nginx 配置，见 DEPLOY-SETUP），正常刷新即可看到新内容。
- **TinaCloud 的服务器在海外。** 国内编辑打开后台可能偏慢，但访客访问网站不经过 TinaCloud，不受影响。
- 「Organization」结构化数据（法定名称、地址、sameAs 等）仍写在 `src/components/partials/Head.astro` 里。它们是已核实的主体信息，改动前需要核实，所以没有放进后台。
