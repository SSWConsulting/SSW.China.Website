// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import visualEditing from './dev/visual-editing/integration.mjs';

/**
 * 可视化编辑预览站的构建（`npm run build:preview`，部署在 Vercel，见 DECISIONS §111）。
 * 只有它挂适配器、带编辑标记；线上构建不设这个开关，产物不变。
 */
const visualPreview = process.env.SSW_VISUAL_PREVIEW === '1';

/**
 * 纯静态输出：`astro build` 产出 `dist/`，部署方式与改版前完全一致
 * （self-hosted runner 把 dist 镜像到 nginx 站点目录，见 .github/workflows/deploy.yml）。
 *
 * TinaCMS 不参与站点渲染 —— 页面在构建期直接读 content/ 下的 JSON（见 src/config/site.ts）。
 * Tina 只负责 /admin/ 编辑后台，由 `tinacms build` 产出到 public/admin/，随 dist 一起发布。
 */
export default defineConfig({
  site: 'https://ssw.cn',
  output: 'static',
  // 可视化编辑：astro dev 与预览站构建下生效，线上构建不受影响，见 dev/visual-editing/。
  integrations: [visualEditing({ preview: visualPreview })],
  // 预览站的 /tina-island 端点按需渲染，需要适配器；页面本身仍是预渲染的静态页。
  ...(visualPreview ? { adapter: vercel() } : {}),
  // 不压缩 HTML：Astro 的压缩会删掉行内元素之间跨行的空白（「中国 当前」→「中国当前」、
  // 「适合场景 公司准备…」粘连），改变渲染结果。改版前的产物保留源码空白，这里保持一致。
  compressHTML: false,
  // services/ai-platform.astro ⇒ /services/ai-platform/index.html，保持改版前的干净 URL。
  build: {
    format: 'directory',
    // 打包产物沿用 /assets/ 前缀（Astro 默认是 /_astro/），nginx 侧的缓存规则不用跟着改。
    assets: 'assets',
    // 全站共用一份 CSS（与改版前相同），不把小样式表内联进每个页面。
    inlineStylesheets: 'never',
  },
  server: { port: 5173 },
  devToolbar: { enabled: false },
  vite: {
    // Editable.astro 据此决定是否输出编辑标记（dev 下总是输出）。
    define: { __SSW_VISUAL_PREVIEW__: JSON.stringify(visualPreview) },
    // cobe 只在 globe.ts 里动态 import()，dev 启动时扫描不到，要等首次请求才临时预构建。
    // 之后若 Vite 因故重新预构建，新结果里没有 cobe，已编译的 globe.ts 仍指向旧地址 ⇒ 504，
    // 地球在 dev 下不显示（2026-10-19 实测）。启动时就预构建它，地址从一开始就稳定。只影响 dev。
    optimizeDeps: { include: ['cobe'] },
    build: {
      target: 'es2022',
      cssTarget: 'chrome111',
      assetsInlineLimit: 0,
      // Vite 8 默认用 Lightning CSS 压缩，它会把 index.css 首行的
      // `@layer tokens, base, layout, components, motion;` 当作冗余删掉。
      // 层级顺序是动效总开关的承重结构（motion 必须最后），显式声明要留在产物里 ——
      // 用 esbuild 压缩，产物与改版前（Vite 6）逐字节一致。
      cssMinify: 'esbuild',
    },
  },
});
