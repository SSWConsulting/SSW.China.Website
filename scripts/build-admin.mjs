#!/usr/bin/env node
/**
 * 构建 TinaCMS 编辑后台（产出 public/admin/，随站点一起发布到 /admin/）。
 *
 * - 有 PUBLIC_TINA_CLIENT_ID 与 TINA_TOKEN ⇒ 构建连接 TinaCloud 的正式后台。
 *   `--content=local`：直接读仓库里的 content/，不依赖 TinaCloud 是否已索引当前分支。
 *   - /admin/：可视化编辑（左表单、右预览）。预览页在 /admin/preview/，实时重渲染由
 *     /tina-island/ 端点完成：ssw.cn 上是服务器本机的预览服务，预览站上是 Vercel Function（DECISIONS §117）。
 *   - /admin/forms/（只在 ssw.cn）：表单编辑，不依赖预览服务。预览服务停了时用它（§113）。
 * - 没有 ⇒ 跳过并删掉旧的 public/admin/，网站照常构建。
 *   **不会**退而构建本地模式的后台 —— 那个版本连的是 localhost:4001，
 *   发布到线上只会是一个打不开的 /admin/。
 *
 * 网站本身不依赖 Tina：页面在 astro build 时直接读 content/ 下的 JSON。
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, rmSync } from 'node:fs';
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

rmSync('public/admin', { recursive: true, force: true });

if (!hasCloud) {
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

/**
 * 跑一次 tinacms build，输出到 public/<folder>/。
 * visual：后台带 router（tina/collections/common.ts），打开文档即「左表单、右预览」，
 * 预览页地址带 /admin/preview 前缀。
 */
function tinaBuild(folder, visual) {
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
      env: {
        ...process.env,
        TINA_ADMIN_FOLDER: folder,
        TINA_PUBLIC_VISUAL_EDITING: visual ? '1' : '',
        TINA_PUBLIC_PREVIEW_BASE: visual ? '/admin/preview' : '',
      },
    },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
}

// 先 admin 再 admin/forms：后者在前者的目录里，反过来可能被前者的构建清掉。
tinaBuild('admin', true);
if (!visualPreview) tinaBuild('admin/forms', false);

// 预览页里的启动脚本从 /admin/bridge.js 加载 bridge（dev 下由 @tinacms/astro 的 dev 中间件提供）。
const require = createRequire(import.meta.url);
copyFileSync(require.resolve('@tinacms/bridge'), 'public/admin/bridge.js');
