import { defineConfig } from 'tinacms';
import { SettingsCollection } from './collections/settings';
import { SharedCollection } from './collections/shared';
import { HomeCollection } from './collections/home';
import {
  AboutCollection,
  AppsCollection,
  ChinafyCollection,
  DeckCollection,
  ServiceCollection,
} from './collections/pages';

/**
 * TinaCMS 编辑后台（/admin/）。
 *
 * 后端用 TinaCloud：登录、权限、把编辑写回 GitHub 都由它负责，我们不维护服务。
 * 线上站点仍是纯静态 —— 页面在 astro build 时直接读 content/ 下的 JSON，
 * 访客访问不经过 Tina。编辑在后台保存 ⇒ TinaCloud 提交到仓库 ⇒ 触发部署。
 *
 * 本地开发（npm run dev）走本地模式：编辑直接写本地文件，不需要 TinaCloud 账号。
 */

// 编辑写回哪个分支。CI 里由 GITHUB_REF_NAME 提供；本地默认 main。
const branch = process.env.TINA_BRANCH || process.env.GITHUB_REF_NAME || 'main';

export default defineConfig({
  branch,
  // 在 app.tina.io 建项目后取得。本地模式下可以为空。
  clientId: process.env.PUBLIC_TINA_CLIENT_ID ?? null,
  token: process.env.TINA_TOKEN ?? null,

  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  media: {
    tina: {
      // 后台只浏览 public/media/，避免把字体、图标等站点基础文件暴露给编辑。
      mediaRoot: 'media',
      publicFolder: 'public',
    },
  },
  schema: {
    collections: [
      HomeCollection,
      ServiceCollection,
      AppsCollection,
      ChinafyCollection,
      AboutCollection,
      DeckCollection,
      SharedCollection,
      SettingsCollection,
    ],
  },
});
