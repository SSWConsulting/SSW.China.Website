import { qsa, on } from './dom';

/**
 * 红色按钮的悬停涟漪 —— 照搬 ssw.com.au 的按钮组件。
 *
 * 线上实测：`mouseover` 时往按钮里注入一个圆，
 * 直径 = 按钮 border-box 的长边，圆心落在指针位置，
 * `background: rgba(0,0,0,.25)`，`transform: scale(0)` 起步，
 * `animation: rippling .6s ease-out`（opacity 1→0、scale 0→2）。
 *
 * 两点有意的差异，理由见 docs/DECISIONS.md §38：
 *   · 用 pointerenter 而不是 mouseover —— mouseover 会在移过子元素时反复触发，
 *     线上因此会叠出好几个圈；pointerenter 每次进入只放一个。
 *   · 触屏不触发（pointerenter 在触屏上等同点击，涟漪会挡一下视线又没有悬停语义）。
 */
export function initRipple(): void {
  qsa<HTMLElement>('[data-ripple]').forEach(setup);
}

function setup(host: HTMLElement): void {
  on(host, 'pointerenter', (event) => {
    const pointer = event as PointerEvent;
    if (pointer.pointerType === 'touch') return;

    const rect = host.getBoundingClientRect();
    // 直径取长边，保证圆放大到 2 倍时一定盖满整个按钮
    const diameter = Math.max(rect.width, rect.height);

    const circle = document.createElement('span');
    circle.className = 'ripple';
    circle.style.width = `${diameter}px`;
    circle.style.height = `${diameter}px`;
    circle.style.left = `${pointer.clientX - rect.left - diameter / 2}px`;
    circle.style.top = `${pointer.clientY - rect.top - diameter / 2}px`;

    // 动画结束即移除，避免 DOM 里堆积空 span
    circle.addEventListener('animationend', () => circle.remove(), { once: true });
    host.append(circle);
  });
}
