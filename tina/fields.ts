import type { TinaField } from 'tinacms';

/**
 * 字段构造小工具，让各集合的 schema 读起来接近 content/ 里的 JSON 形状。
 *
 * 约定（与 src/config/site.ts 的收敛规则对应）：
 * - 可选字段留空 ⇒ 页面按「尚未提供」处理，走诚实降级；**不要填占位文字**。
 * - 图片一律是 { src, w, h } 三件套：w/h 是**原始像素尺寸**，用来输出 width/height
 *   避免版面跳动。三项缺任何一项，这张图都按未提供处理。
 */

type Opts = { description?: string; required?: boolean };

export const text = (name: string, label: string, o: Opts = {}): TinaField => ({
  type: 'string',
  name,
  label,
  ...o,
});

/** 多行文本：编辑框里的换行在页面上就是 <br />（用于标题断行、地址）。 */
export const lines = (name: string, label: string, o: Opts = {}): TinaField => ({
  type: 'string',
  name,
  label,
  ui: { component: 'textarea' },
  ...o,
});

export const longText = lines;

export const number = (name: string, label: string, o: Opts = {}): TinaField => ({
  type: 'number',
  name,
  label,
  ...o,
});

export const flag = (name: string, label: string, o: Opts = {}): TinaField => ({
  type: 'boolean',
  name,
  label,
  ...o,
});

export const group = (
  name: string,
  label: string,
  fields: TinaField[],
  o: Opts = {},
): TinaField => ({
  type: 'object',
  name,
  label,
  fields,
  ...o,
});

/** 对象列表。`itemLabel` 取每一项的哪个字段作为列表里的显示名。 */
export const items = (
  name: string,
  label: string,
  fields: TinaField[],
  itemLabel?: string,
  o: Opts = {},
): TinaField => ({
  type: 'object',
  list: true,
  name,
  label,
  fields,
  ...(itemLabel
    ? {
        ui: {
          itemProps: (item: Record<string, unknown>) => ({
            label: String(item?.[itemLabel] ?? ''),
          }),
        },
      }
    : {}),
  ...o,
});

/** 纯文本列表（标签、要点等）。 */
export const strings = (name: string, label: string, o: Opts = {}): TinaField => ({
  type: 'string',
  list: true,
  name,
  label,
  ...o,
});

const PX = '原始像素尺寸，用于输出 width/height、避免版面跳动。换图时必须一起改。';

/** 图片素材 { src, w, h }，可附加字段（alt、credit、isPlaceholder 等）。 */
export const image = (
  name: string,
  label: string,
  extra: TinaField[] = [],
  o: Opts = {},
): TinaField =>
  group(
    name,
    label,
    [
      { type: 'image', name: 'src', label: '图片文件' },
      number('w', '宽（px）', { description: PX }),
      number('h', '高（px）', { description: PX }),
      ...extra,
    ],
    o,
  );

/** 整段区块的开关。关掉 ⇒ 该区块在构建期就不输出（与旧配置里置 null 等价）。 */
export const enabled = (what: string): TinaField =>
  flag('enabled', `显示${what}`, { description: '关闭后整段不渲染，不留空白。缺省视为开启。' });
