import { qs, on } from './dom';

const STORAGE_KEY = 'ssw-cn-theme';

type Theme = 'light' | 'dark';

function current(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
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
  if (!toggle) return;

  // 没有 JS 时切换按钮毫无作用，因此它默认 hidden，由这里放出来 —— 不留死控件。
  toggle.hidden = false;
  toggle.setAttribute('aria-label', label(current()));

  on(toggle, 'click', () => {
    const next: Theme = current() === 'light' ? 'dark' : 'light';
    apply(next);
    toggle.setAttribute('aria-label', label(next));
  });

  // 用户没有显式选择过时，跟随系统偏好变化
  const query = window.matchMedia('(prefers-color-scheme: light)');
  query.addEventListener('change', (event) => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored === 'light' || stored === 'dark') return;
    const next: Theme = event.matches ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    toggle.setAttribute('aria-label', label(next));
  });
}
