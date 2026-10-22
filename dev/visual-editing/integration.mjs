// @ts-check
import tina from '@tinacms/astro/integration';

/**
 * 可视化编辑：**只在 `astro dev` 与预览站构建（`preview: true`）时生效**，线上构建时什么都不做。
 *
 * - 注入 /tina-island/[name] 端点（按需渲染）。线上是纯静态输出，没有适配器，
 *   构建时若存在这个端点会直接失败（NoAdapterInstalled），所以只在 dev 与预览站注入。
 * - 运行 @tinacms/astro 自带集成的 config:setup：dev 下提供 /admin/bridge.js，并挂编辑模式中间件。
 *   预览站的 /admin/bridge.js 由 scripts/build-admin.mjs 放进 public/admin/。
 *
 * 线上的构建产物因此与不接入时逐字节相同，见 docs/DECISIONS.md §108、§111。
 *
 * @param {{ preview?: boolean }} [options]
 * @returns {import('astro').AstroIntegration}
 */
export default function visualEditing({ preview = false } = {}) {
  const inner = tina();
  return {
    name: 'ssw:visual-editing',
    hooks: {
      'astro:config:setup': async (params) => {
        if (params.command !== 'dev' && !preview) return;
        params.injectRoute({
          pattern: '/tina-island/[name]',
          entrypoint: new URL('./route.ts', import.meta.url),
          prerender: false,
        });
        await inner.hooks['astro:config:setup']?.(params);
      },
    },
  };
}
