#!/usr/bin/env node
/**
 * 构建 TinaCMS 编辑后台（产出 public/admin/，随站点一起发布到 /admin/）。
 *
 * - 有 PUBLIC_TINA_CLIENT_ID 与 TINA_TOKEN ⇒ 构建连接 TinaCloud 的正式后台。
 *   `--content=local`：直接读仓库里的 content/，不依赖 TinaCloud 是否已索引当前分支。
 * - 没有 ⇒ 跳过并删掉旧的 public/admin/，网站照常构建。
 *   **不会**退而构建本地模式的后台 —— 那个版本连的是 localhost:4001，
 *   发布到线上只会是一个打不开的 /admin/。
 *
 * 网站本身不依赖 Tina：页面在 astro build 时直接读 content/ 下的 JSON。
 */
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';

const hasCloud = Boolean(process.env.PUBLIC_TINA_CLIENT_ID && process.env.TINA_TOKEN);

if (!hasCloud) {
  rmSync('public/admin', { recursive: true, force: true });
  console.warn(
    '\n⚠ 未设置 PUBLIC_TINA_CLIENT_ID / TINA_TOKEN：跳过编辑后台，本次产物不含 /admin/。\n' +
      '  网站页面不受影响。凭据在 app.tina.io 的项目设置里取得，配置方法见 docs/TINACMS.md。\n',
  );
  process.exit(0);
}

const r = spawnSync(
  'npx',
  ['tinacms', 'build', '--content=local', '--skip-search-index', '--noTelemetry'],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);
process.exit(r.status ?? 1);
