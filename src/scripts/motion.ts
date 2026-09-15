/**
 * 动效偏好的唯一 JS 读取点，与 motion.css 中唯一的 CSS 开关一一对应。
 *
 * 两个触发器：
 *   · prefers-reduced-motion: reduce  —— 真实用户偏好
 *   · html[data-motion="off"]         —— 可测试的覆盖开关
 */
const query = window.matchMedia('(prefers-reduced-motion: reduce)');

export function motionOff(): boolean {
  return document.documentElement.dataset.motion === 'off' || query.matches;
}

export function onMotionChange(handler: () => void): void {
  query.addEventListener('change', handler);
  // 运行时切换 data-motion 也要能被感知（供自动化验证与手动 QA 使用）
  new MutationObserver(handler).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-motion'],
  });
}
