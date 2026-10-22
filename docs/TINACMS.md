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

### 3. 邀请编辑

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

- **线上是表单编辑；本地的页面支持可视化编辑。** `npm run dev` 后在本地后台打开任意一个「页面：…」，左边是表单，右边是实时预览：输入时预览立刻更新，点预览里的文字会跳到对应字段。「全站通用」「站点设置」和线上后台仍是表单编辑。线上要支持可视化编辑，需要在服务器上常驻一个 Node 服务（纯静态部署下不可行）。实现与限制见 DECISIONS §108、§109。
- **编辑直接提交到 main。** 每次保存都会触发一次部署。如果需要「先提 PR、审核后再上线」，可以开启 TinaCloud 的 Editorial Workflow（付费功能），由它为每次编辑建分支并开 PR。
- **TinaCloud 的服务器在海外。** 国内编辑打开后台可能偏慢，但访客访问网站不经过 TinaCloud，不受影响。
- 「Organization」结构化数据（法定名称、地址、sameAs 等）仍写在 `src/components/partials/Head.astro` 里。它们是已核实的主体信息，改动前需要核实，所以没有放进后台。
