/** /tina-island/[name]：本地可视化编辑的重渲染端点。只在 astro dev 下注入（见 ./integration.mjs）。 */
import { experimental_createIslandRoute } from '@tinacms/astro/experimental';
import { islands } from './islands.ts';

export const prerender = false;
export const POST = experimental_createIslandRoute(islands);
