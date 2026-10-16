/**
 * 模板里用到的两个小工具。
 *
 * 延续旧构建插件（build/html-include.ts）的两条硬约束：
 * 插值的值缺失时**构建失败**，而不是静默输出空的 src/href —— 空属性上线是发布事故。
 */

/** 取一个必须存在的值。`null`/`undefined` ⇒ 抛错并点名键路径。 */
export function need<T>(value: T | null | undefined, key: string): T {
  if (value === undefined) throw new Error(`${key} 在站点配置中不存在`);
  if (value === null) throw new Error(`${key} 为 null；请先用条件渲染包裹再取值`);
  return value;
}

/**
 * JSON-LD：校验并压缩一段 JSON 文本，供 `<script type="application/ld+json" set:html>` 使用。
 * 解析失败直接让构建失败；`<` 转义，防止值里出现 `</script>` 提前闭合标签。
 */
export function ld(json: string): string {
  return JSON.stringify(JSON.parse(json)).replace(/</g, '\\u003c');
}
