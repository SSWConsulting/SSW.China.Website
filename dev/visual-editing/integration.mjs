// @ts-check
import tina from '@tinacms/astro/integration';

/**
 * 本地可视化编辑：**只在 `astro dev` 时生效**，`astro build` 时什么都不做。
 *
 * - 注入 /tina-island/[name] 端点（按需渲染）。线上是纯静态输出，没有适配器，
 *   构建时若存在这个端点会直接失败（NoAdapterInstalled），所以只在 dev 注入。
 * - 运行 @tinacms/astro 自带集成的 dev 部分：提供 /admin/bridge.js、编辑模式中间件。
 *
 * 线上的构建产物因此与不接入时逐字节相同，见 docs/DECISIONS.md §108。
 *
 * @returns {import('astro').AstroIntegration}
 */
export default function visualEditing() {
  const inner = tina();
  return {
    name: 'ssw:visual-editing-dev',
    hooks: {
      'astro:config:setup': async (params) => {
        if (params.command !== 'dev') return;
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
