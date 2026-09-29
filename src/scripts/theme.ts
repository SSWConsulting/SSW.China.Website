import { qs, on } from './dom';

const STORAGE_KEY = 'ssw-cn-theme';

type Theme = 'light' | 'dark';

const systemQuery = window.matchMedia('(prefers-color-scheme: light)');

function current(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function stored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // 隐私模式下写不进去也不影响本次会话的切换
  }
}

function label(theme: Theme): string {
  return theme === 'light' ? '切换到深色主题' : '切换到浅色主题';
}

export function initTheme(): void {
  const toggle = qs<HTMLButtonElement>('[data-theme-toggle]');

  // 与 head.html 引导脚本同一优先级：已存选择 → 系统偏好。
  // 结论不变就不写属性，免得触发地球的 MutationObserver 空跑。
  const sync = (): void => {
    const next = stored() ?? (systemQuery.matches ? 'light' : 'dark');
    if (current() !== next) document.documentElement.dataset.theme = next;
    toggle?.setAttribute('aria-label', label(next));
  };

  // 往返缓存恢复时不会重跑引导脚本，需重新对齐
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) sync();
  });
  // 其他标签页切换主题时同步
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) sync();
  });
  // 用户没有显式选择过时，跟随系统偏好变化
  systemQuery.addEventListener('change', () => {
    if (!stored()) sync();
  });

  if (!toggle) return;

  // 没有 JS 时切换按钮毫无作用，因此它默认 hidden，由这里放出来 —— 不留死控件。
  toggle.hidden = false;
  toggle.setAttribute('aria-label', label(current()));

  on(toggle, 'click', () => {
    const next: Theme = current() === 'light' ? 'dark' : 'light';
    apply(next);
    toggle.setAttribute('aria-label', label(next));
  });
}
