import { qs, qsa, on } from './dom';
import { motionOff } from './motion';

/**
 * 核心 AI 服务卡片的窄屏轮播圆点。
 *
 * 轮播本身是纯 CSS（overflow-x + scroll-snap），无 JS 时依然可以横向滑动 ——
 * 这里只补两件 CSS 做不到的事：把当前位置反映到圆点上，以及点击圆点跳到对应卡片。
 * 圆点因此完全由 JS 生成（首页 3 张、服务详情页 2 张，数量各不相同），
 * 并且只在轨道**真的**可以横向滚动时才出现，否则就是无法操作的死控件。
 *
 * 位置同步用轨道自身的 scroll 事件而不是 IntersectionObserver：
 * 监听对象是这一个小容器（只在用户滑动卡片时触发），不是页面滚动，
 * 每次只做 N 次 offsetLeft 读取。
 */
export function initCoreCarousel(): void {
  qsa<HTMLElement>('[data-core-cards]').forEach(setupCarousel);
}

function setupCarousel(host: HTMLElement): void {
  const track = qs<HTMLElement>('[data-core-track]', host);
  const dotsBox = qs<HTMLElement>('[data-core-dots]', host);
  if (!track || !dotsBox) return;

  const slides = qsa<HTMLElement>('.core-cards__slide', track);
  if (slides.length < 2) return;

  const dots = slides.map((slide, index) => {
    const title = qs('[data-card-title]', slide)?.textContent?.trim() ?? '';
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `显示第 ${index + 1} 张：${title}`);
    dot.setAttribute('aria-current', String(index === 0));
    dotsBox.append(dot);
    return dot;
  });

  const setCurrent = (index: number): void => {
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
  };

  /** 各卡片相对第一张的横向偏移 —— 与 scrollLeft 同一坐标系。 */
  const offset = (slide: HTMLElement): number => slide.offsetLeft - slides[0]!.offsetLeft;

  const syncFromScroll = (): void => {
    const x = track.scrollLeft;
    let nearest = 0;
    let best = Infinity;
    slides.forEach((slide, i) => {
      const distance = Math.abs(offset(slide) - x);
      if (distance < best) {
        best = distance;
        nearest = i;
      }
    });
    setCurrent(nearest);
  };

  /** 卡片全部放得下时轨道不滚动，圆点没有意义 —— 收起来。 */
  const syncVisibility = (): void => {
    dotsBox.hidden = track.scrollWidth <= track.clientWidth + 1;
  };

  dots.forEach((dot, index) => {
    on(dot, 'click', () => {
      track.scrollTo({
        left: offset(slides[index]!),
        behavior: motionOff() ? 'auto' : 'smooth',
      });
      // 立即反馈，不等平滑滚动结束。
      setCurrent(index);
    });
  });

  on(track, 'scroll', syncFromScroll, { passive: true } as AddEventListenerOptions);
  on(window, 'resize', syncVisibility, { passive: true } as AddEventListenerOptions);
  syncVisibility();
  syncFromScroll();
}
