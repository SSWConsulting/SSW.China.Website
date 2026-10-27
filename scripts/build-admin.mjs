#!/usr/bin/env node
/**
 * 构建 TinaCMS 编辑后台（产出 public/admin/，随站点一起发布到 /admin/）。
 *
 * - 有 PUBLIC_TINA_CLIENT_ID 与 TINA_TOKEN ⇒ 构建连接 TinaCloud 的正式后台。
 *   ssw.cn：后台在 /admin/forms/（表单编辑），/admin/ 是装着预览站后台的 iframe 页面（DECISIONS §113、§114）。
 *   预览站（SSW_VISUAL_PREVIEW=1）：后台就在 /admin/。
 *   `--content=local`：直接读仓库里的 content/，不依赖 TinaCloud 是否已索引当前分支。
 * - 没有 ⇒ 跳过并删掉旧的 public/admin/，网站照常构建。
 *   **不会**退而构建本地模式的后台 —— 那个版本连的是 localhost:4001，
 *   发布到线上只会是一个打不开的 /admin/。
 *
 * 网站本身不依赖 Tina：页面在 astro build 时直接读 content/ 下的 JSON。
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const hasCloud = Boolean(process.env.PUBLIC_TINA_CLIENT_ID && process.env.TINA_TOKEN);
// 预览站（npm run build:preview）：预览端点要用 tinacms build 生成的客户端读 TinaCloud，没有凭据就做不出来。
const visualPreview = process.env.SSW_VISUAL_PREVIEW === '1';

if (!hasCloud && visualPreview) {
  console.error(
    '\n✖ 预览站构建需要 PUBLIC_TINA_CLIENT_ID 与 TINA_TOKEN（在 Vercel 项目的环境变量里配置）。\n',
  );
  process.exit(1);
}

if (!hasCloud) {
  rmSync('public/admin', { recursive: true, force: true });
  console.warn(
    '\n⚠ 未设置 PUBLIC_TINA_CLIENT_ID / TINA_TOKEN：跳过编辑后台，本次产物不含 /admin/。\n' +
      '  网站页面不受影响。凭据在 app.tina.io 的项目设置里取得，配置方法见 docs/TINACMS.md。\n',
  );
  process.exit(0);
}

// tinacms build 索引时会在本机起一个 datalayer 服务，默认端口 9000 —— 和 npm run dev 占用的相同，
// 本机开着 dev 时构建会撞端口，所以换一个冷门端口。
// （曾以为生产服务器上的「Connection to leader lost」是 9000 被占用所致，换端口后照旧，
// 最终改为在 GitHub 托管的 runner 上构建，见 DECISIONS §110。）
const DATALAYER_PORT = '9461';

// ssw.cn 是纯静态部署，渲染不了实时预览：它的 /admin/ 是一个整页 iframe，里面是预览站的后台，
// 地址栏保持 ssw.cn/admin/（DECISIONS §113、§114）；
// 表单编辑的后台挪到 /admin/forms/，留作预览站打不开时的退路（§113）。
// 预览站自己的后台仍在 /admin/。
const PREVIEW_ADMIN = 'https://ssw-china-preview.vercel.app/admin/index.html';
const adminFolder = visualPreview ? 'admin' : 'admin/forms';

// 清掉上一次构建的后台（两种布局之间切换时不留旧文件）。
rmSync('public/admin', { recursive: true, force: true });

const r = spawnSync(
  'npx',
  [
    'tinacms',
    'build',
    '--content=local',
    '--skip-search-index',
    '--noTelemetry',
    '--datalayer-port',
    DATALAYER_PORT,
  ],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, TINA_ADMIN_FOLDER: adminFolder },
  },
);
if (r.status !== 0) process.exit(r.status ?? 1);

// 预览站页面里的启动脚本从 /admin/bridge.js 加载 bridge（dev 下由 @tinacms/astro 的 dev 中间件提供）。
// 放进 public/admin/，随 astro build 进入产物。线上构建不需要它。
if (visualPreview) {
  const require = createRequire(import.meta.url);
  copyFileSync(require.resolve('@tinacms/bridge'), 'public/admin/bridge.js');
}

if (!visualPreview) {
  mkdirSync('public/admin', { recursive: true });
  writeFileSync('public/admin/index.html', framePage());
}

/**
 * /admin/ 的套壳页：整页 iframe 装预览站的后台。
 * 带上 # 后面的后台路由，旧书签（#/collections/…）打开的仍是同一个文档；
 * 之后在后台里切换文档，地址栏不会跟着变（跨域读不到 iframe 的地址）。
 * 不加 sandbox：TinaCloud 登录要从 iframe 里弹窗。
 */
function framePage() {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>编辑后台</title>
    <style>
      html, body { height: 100%; margin: 0; }
      iframe { display: block; width: 100%; height: 100%; border: 0; }
    </style>
  </head>
  <body>
    <iframe id="admin" title="编辑后台" allow="clipboard-read; clipboard-write"></iframe>
    <script>
      document.getElementById('admin').src = ${JSON.stringify(PREVIEW_ADMIN)} + location.hash;
    </script>
  </body>
</html>
`;
}
