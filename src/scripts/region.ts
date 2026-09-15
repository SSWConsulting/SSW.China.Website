import { qs, on } from './dom';

/**
 * 地区切换下拉（导航右上角）。
 *
 * 纯增强：按钮与菜单在 HTML 里都是 hidden，脚本没跑就两者都不出现 ——
 * 不会留下点了没反应的死控件。三个地区的链接在页脚常驻，无 JS 时依然可达。
 *
 * 用的是 disclosure 模式（按钮 + aria-expanded + 一组普通链接），
 * 刻意不加 role="menu"：那会带来方向键漫游焦点的义务，这里不需要。
 */
export function initRegionMenu(): void {
  const toggle = qs<HTMLButtonElement>('[data-region-toggle]');
  const menu = qs<HTMLElement>('[data-region-menu]');
  if (!toggle || !menu) return;
  setup(toggle, menu);
}

function setup(toggle: HTMLButtonElement, menu: HTMLElement): void {
  const host = toggle.parentElement as HTMLElement;
  toggle.hidden = false;

  const isOpen = () => !menu.hidden;

  const setState = (open: boolean): void => {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  };

  const close = (options?: { returnFocus?: boolean }): void => {
    if (!isOpen()) return;
    setState(false);
    if (options?.returnFocus) toggle.focus();
  };

  on(toggle, 'click', () => setState(!isOpen()));

  on(document, 'keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) close({ returnFocus: true });
  });

  on(document, 'pointerdown', (event) => {
    if (!isOpen()) return;
    if (host.contains(event.target as Node)) return;
    close();
  });

  // Tab 移出整块时收起：菜单里是普通链接，不困住焦点，
  // 所以要在焦点真的离开之后再判断（relatedTarget 可能为 null）。
  on(host, 'focusout', (event) => {
    if (!isOpen()) return;
    const next = (event as FocusEvent).relatedTarget as Node | null;
    if (next && host.contains(next)) return;
    close();
  });
}
