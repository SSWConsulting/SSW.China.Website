import { qs, qsa, on } from './dom';
import { motionOff } from './motion';
import { lockScroll, unlockScroll } from './scroll-lock';

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface MenuController {
  readonly toggle: HTMLElement | null;
  isOpen(): boolean;
  close(options?: { returnFocus?: boolean }): void;
}

/**
 * 是否是「本页锚点」。
 *
 * 多页之后导航项写成 `/#ai-services` —— 在首页它是本页锚点（要平滑滚动、
 * 要参与 scrollspy），在服务详情页它是一次真正的跳转（要交给浏览器）。
 * 判据只能是解析后的 pathname，不能再用 `href^="#"` 选择器。
 */
function isSamePage(link: HTMLAnchorElement): boolean {
  return (
    link.hash.length > 1 && link.pathname === location.pathname && link.origin === location.origin
  );
}

/** 让键盘用户真正落进目标区块，而不是停在页面顶部。 */
function focusSection(target: HTMLElement): void {
  if (!target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1');
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
  }
  // preventScroll 必须加，否则会在平滑滚动之上再跳一次
  target.focus({ preventScroll: true });
}

function initStickyHairline(): void {
  const nav = qs('[data-nav]');
  const sentinel = qs('[data-nav-sentinel]');
  if (!nav || !sentinel || !('IntersectionObserver' in window)) return;

  // 哨兵驱动，零滚动监听
  new IntersectionObserver(
    ([entry]) => {
      if (entry) nav.classList.toggle('is-stuck', !entry.isIntersecting);
    },
    { threshold: 0 },
  ).observe(sentinel);
}

function initScrollSpy(): void {
  const links = qsa<HTMLAnchorElement>('.nav__links a[href*="#"]').filter(isSamePage);
  if (!links.length || !('IntersectionObserver' in window)) return;

  const byId = new Map<string, HTMLAnchorElement>();
  const sections: HTMLElement[] = [];
  for (const link of links) {
    const id = link.hash.slice(1);
    const section = document.getElementById(id);
    if (!section) continue;
    byId.set(id, link);
    sections.push(section);
  }

  const clear = () => links.forEach((link) => link.removeAttribute('aria-current'));

  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const link = byId.get(entry.target.id);
        if (!link) continue;
        if (entry.isIntersecting) {
          clear();
          link.setAttribute('aria-current', 'true');
        } else {
          // 区块离开中线时只摘它自己的高亮 —— 滚回首屏（没有对应导航项）、
          // 或「返回」把页面恢复到顶部时，不能残留上一次的当前项。
          // 只摘自己的，所以跨界时新旧两条记录的先后顺序无关紧要。
          link.removeAttribute('aria-current');
        }
      }
    },
    { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
  );
  sections.forEach((section) => spy.observe(section));
}

function initMenu(): MenuController {
  const toggle = qs<HTMLButtonElement>('[data-menu-toggle]');
  const panel = qs('[data-menu-panel]');

  if (!toggle || !panel) {
    return { toggle: null, isOpen: () => false, close: () => {} };
  }

  return setupMenu(toggle, panel);
}

function setupMenu(toggle: HTMLButtonElement, panel: HTMLElement): MenuController {
  const closeButton = qs<HTMLButtonElement>('[data-menu-close]', panel);
  const scrim = qs('[data-menu-scrim]');
  const desktop = window.matchMedia('(min-width: 1024px)');

  // 无 JS 时按钮保持 hidden、菜单保持流内可见 —— 切换按钮永不是死控件。
  toggle.hidden = false;
  panel.dataset.menuState = 'closed';
  if (closeButton) closeButton.hidden = false;

  const isOpen = () => panel.dataset.menuState === 'open';

  const setState = (open: boolean) => {
    panel.dataset.menuState = open ? 'open' : 'closed';
    toggle.setAttribute('aria-expanded', String(open));
    // 可见文字「菜单」是两个可达名称的子串 ⇒ 满足 WCAG 2.5.3 Label in Name
    toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    if (scrim) scrim.hidden = !open;
  };

  function open(): void {
    if (isOpen()) return;
    setState(true);
    // 抽屉是覆盖全屏的浮层，与咨询弹层同属被点名的例外：锁定滚动。
    lockScroll();
    (closeButton ?? qs<HTMLAnchorElement>('a', panel))?.focus();
  }

  const close = (options?: { returnFocus?: boolean }) => {
    if (!isOpen()) return;
    setState(false);
    unlockScroll();
    if (options?.returnFocus !== false) toggle.focus();
  };

  on(toggle, 'click', () => {
    if (isOpen()) close();
    else open();
  });

  closeButton?.addEventListener('click', () => close());

  on(document, 'keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) close();
  });

  on(document, 'pointerdown', (event) => {
    if (!isOpen()) return;
    const target = event.target as Node;
    if (panel.contains(target) || toggle.contains(target)) return;
    close({ returnFocus: false });
  });

  // 抽屉打开时把 Tab 圈在抽屉内
  on(document, 'keydown', (event) => {
    if (event.key !== 'Tab' || !isOpen()) return;
    const items = qsa<HTMLElement>(FOCUSABLE, panel).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !panel.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });

  desktop.addEventListener('change', (event) => {
    if (event.matches) close({ returnFocus: false });
  });

  // 从抽屉里点了跨页链接（服务详情页、落地中国……）时抽屉仍开着、滚动仍锁着，
  // 页面进入往返缓存后点「返回」会原样恢复成那个状态。离开前收起，
  // 并把焦点从即将隐藏的抽屉里撤出来 —— 不在离开时把焦点送回菜单按钮，
  // 否则恢复后按钮上会凭空亮一圈焦点环。
  window.addEventListener('pagehide', () => {
    if (!isOpen()) return;
    close({ returnFocus: false });
    const active = document.activeElement;
    if (active instanceof HTMLElement && panel.contains(active)) active.blur();
  });

  return { toggle, isOpen, close };
}

function initAnchors(menu: MenuController): void {
  on(document, 'click', (event) => {
    // 咨询按钮由 wecom-modal 直接绑定并已 preventDefault，这里不再接管
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const link = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href]');
    // 跨页链接（服务详情页上的 /#ai-services、卡片上的 /services/…）交给浏览器
    if (!link || !isSamePage(link)) return;

    const target = document.getElementById(link.hash.slice(1));
    // 目标不存在时不吞事件，让浏览器按默认行为处理
    if (!target) return;

    event.preventDefault();

    // 从手机菜单里选中锚点：先关菜单，再把焦点送到目标区块 ——
    // 用户是要去那里，不该退回菜单按钮（文档 §2「选中即关闭」）。
    const fromMenu = Boolean(link.closest('[data-menu-panel]'));
    if (fromMenu) menu.close({ returnFocus: false });

    target.scrollIntoView({ behavior: motionOff() ? 'auto' : 'smooth', block: 'start' });
    // 重复点同一个锚点不再叠历史记录，否则「返回」要按好几次才离开原地
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    focusSection(target);
  });
}

/**
 * 服务详情页上把「AI 服务」标成当前页。
 * scrollspy 在这些页面没有可观察的区块，因此这一处不会与它打架。
 */
/**
 * 标记当前页对应的导航项。
 *
 * scrollspy 只管本页锚点（`isSamePage()` 为真的那些），整页链接它一律跳过 ——
 * 所以「落地中国」这类指向另一个页面的导航项需要在这里单独标。
 *
 * 两条规则，顺序无关（一个页面只会命中一条）：
 * 1. 导航项的 pathname 与当前页相同 ⇒ 就是它。覆盖 /chinafy/。
 * 2. 服务详情页没有自己的导航项，归到「AI 服务」下 ——
 *    那三个页面是从首页那一组卡片进去的，父级就是 AI 服务。
 */
function initCurrentPage(): void {
  const here = location.pathname.replace(/\/index\.html$/, '');
  for (const link of qsa<HTMLAnchorElement>('.nav__links a[href]')) {
    if (link.hash.length > 1 || link.origin !== location.origin) continue;
    if (link.pathname.replace(/\/index\.html$/, '') !== here) continue;
    link.setAttribute('aria-current', 'page');
    return;
  }
  if (!here.startsWith('/services/')) return;
  qs<HTMLAnchorElement>('.nav__links a[href="/#ai-services"]')?.setAttribute(
    'aria-current',
    'page',
  );
}

export function initNav(): MenuController {
  initStickyHairline();
  initScrollSpy();
  initCurrentPage();
  const menu = initMenu();
  initAnchors(menu);
  return menu;
}
