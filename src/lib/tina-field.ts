import { tinaField } from '@tinacms/astro/tina-field';

/**
 * 可视化编辑的点选定位标记：给元素加上 `data-tina-field={tf(obj, 'field')}`，
 * 在本地后台的预览里点它，左边表单就跳到对应字段。
 *
 * 只有本地预览端点（dev/visual-editing/）渲染时，数据才带 Tina 的元数据；
 * 页面构建期从 JSON 读来的数据没有，tinaField 返回空串 ⇒ 这里返回 undefined ⇒
 * Astro 不输出该属性，线上产物不变。
 */
export function tf(object: object, field?: string, index?: number): string | undefined {
  return tinaField(object as never, field as never, index) || undefined;
}
