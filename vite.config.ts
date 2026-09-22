import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { htmlInclude } from './build/html-include';

/** ESM 配置里没有 __dirname，用 import.meta.url 解析入口。 */
const entry = (rel: string): string => fileURLToPath(new URL(rel, import.meta.url));

export default defineConfig({
  plugins: [htmlInclude()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: {
    // 多页应用：首页 + 三个 AI 服务详情页。
    // 目录式入口 ⇒ 线上路径是 /services/ai-platform/ 这样的干净 URL，
    // dev 与 preview 都能直接解析到对应的 index.html。
    rollupOptions: {
      input: {
        home: entry('index.html'),
        aiPlatform: entry('services/ai-platform/index.html'),
        aiWorkflow: entry('services/ai-workflow/index.html'),
        aiApps: entry('services/ai-apps/index.html'),
        chinafy: entry('chinafy/index.html'),
        about: entry('about/index.html'),
        // 展会／交流会现场的全屏轮播页，不挂进导航，也不进 sitemap。
        deck: entry('deck/index.html'),
      },
    },
    target: 'es2022',
    cssTarget: 'chrome111',
    assetsInlineLimit: 0,
    reportCompressedSize: true,
  },
});
