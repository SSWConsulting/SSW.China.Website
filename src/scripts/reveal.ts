import { qs, qsa } from './dom';
import { motionOff } from './motion';

/** 错帧上限：最多 +280ms 尾巴，任何内容都不会等待近一秒才可读。 */
const STAGGER_MS = 70;
const STAGGER_CAP = 4;
/** 硬保底：无论观察器是否触发，到点全部显现。 */
const FAILSAFE_MS = 4000;

let contentObserver: IntersectionObserver | null = null;
let oneShotObserver: IntersectionObserver | null = null;

function revealTargets(host: HTMLElement): HTMLElement[] {
  return host.hasAttribute('data-reveal-group') ? qsa('[data-reveal]', host) : [host];
}

function reveal(host: HTMLElement): void {
  revealTargets(host).forEach((el, index) => {
    el.style.setProperty('--reveal-delay', `${Math.min(index, STAGGER_CAP) * STAGGER_MS}ms`);
    el.classList.add('is-revealed');
  });
}

/** 把所有仍未显现的内容立即置为最终状态。用于兜底、减少动效切换与打印。 */
export function revealAll(): void {
  contentObserver?.disconnect();
  contentObserver = null;
  qsa('[data-reveal]').forEach((el) => {
    el.style.removeProperty('--reveal-delay');
    el.classList.add('is-revealed');
  });
}

/** 取消尚未播放的一次性动效，并让其静态终态生效。 */
export function cancelOneShots(): void {
  oneShotObserver?.disconnect();
  oneShotObserver = null;
}

export function initReveal(): void {
  // 减少动效开启、或浏览器不支持 IntersectionObserver ⇒ 不设置 data-reveal，
  // 于是 motion.css 里唯一的「默认隐藏」规则永不生效，正文本来就是可见的。
  if (motionOff() || !('IntersectionObserver' in window)) return;

  document.documentElement.dataset.reveal = 'io';

  const hosts = [
    ...qsa<HTMLElement>('[data-reveal-group]'),
    ...qsa<HTMLElement>('[data-reveal]').filter((el) => !el.closest('[data-reveal-group]')),
  ];

  contentObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        reveal(entry.target as HTMLElement);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
  );
  hosts.forEach((host) => contentObserver?.observe(host));

  // 一次性动效（工作流流动高亮、收尾扫光）：进入视口播放一次后立即停止观察。
  oneShotObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        entry.target.classList.add('is-played');
      }
    },
    { threshold: 0.35 },
  );
  qsa<HTMLElement>('[data-oneshot]').forEach((el) => oneShotObserver?.observe(el));

  // 兜底一：首屏内元素在 load 后立即显现，避免父容器高度为 0 时观察器不触发。
  window.addEventListener(
    'load',
    () => {
      requestAnimationFrame(() => {
        hosts.forEach((host) => {
          if (host.getBoundingClientRect().top < window.innerHeight) {
            contentObserver?.unobserve(host);
            reveal(host);
          }
        });
      });
    },
    { once: true },
  );

  // 兜底二：硬保底。
  window.setTimeout(revealAll, FAILSAFE_MS);

  // 兜底三：打印前全部显现（CSS @media print 也有一层保险）。
  const printQuery = window.matchMedia('print');
  printQuery.addEventListener('change', (event) => {
    if (event.matches) revealAll();
  });
  window.addEventListener('beforeprint', revealAll);

  // 首屏标题不挂 data-reveal（§4 首屏文字立即可读），这里仅做一次存在性校验，
  // 若将来误加会在开发期暴露。
  if (import.meta.env.DEV && qs('.hero__title[data-reveal]')) {
    console.warn('[ssw] 首屏标题不应挂 data-reveal —— 文档 §4 要求首屏文字立即可读。');
  }
}
