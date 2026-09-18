import { qs, qsa, on } from './dom';
import { lockScroll, unlockScroll } from './scroll-lock';
import type { MenuController } from './nav';

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

const MAX_RETRIES = 3;
const TOAST_SUCCESS_MS = 4000;
const TOAST_ERROR_MS = 6000;

export function initWecomModal(menu: MenuController): void {
  const panel = qs('[data-wecom-panel]');
  if (!panel) return;
  setupModal(panel, menu);
}

function setupModal(panel: HTMLElement, menu: MenuController): void {
  /* ── 把静态区块整体搬进 <dialog> ────────────────────────────────────────
     移动而非克隆 ⇒ 面板文案只有一份 DOM，也不会产生重复 id。
     JS 未加载时它留在页面末尾，所有 CTA 仍是可达的真实链接。 */
  const dialog = document.createElement('dialog');
  dialog.className = 'wecom-dialog';
  dialog.setAttribute('aria-labelledby', 'wecom-title');
  dialog.setAttribute('aria-describedby', 'wecom-desc');
  // 刻意不加 aria-modal="true"：原生 dialog + top layer 已表达模态，
  // 叠加 aria-modal 在部分引擎会导致读屏软件丢失弹层内容。见 docs/DECISIONS.md
  document.body.append(dialog);
  dialog.append(panel);

  const closeButton = qs<HTMLButtonElement>('[data-wecom-close]', panel);
  const qrFigure = qs('[data-qr-figure]', panel);
  const qrImage = qs<HTMLImageElement>('[data-qr-img]', panel);
  const qrError = qs('[data-qr-error]', panel);
  const qrRetry = qs<HTMLButtonElement>('[data-qr-retry]', panel);
  const idRow = qs('[data-id-row]', panel);
  const idValue = qs('[data-id-value]', panel);
  const idCopy = qs<HTMLButtonElement>('[data-id-copy]', panel);
  const toast = qs('[data-toast]', panel);

  if (closeButton) closeButton.hidden = false;

  let returnTo: HTMLElement | null = null;
  let retries = 0;
  let toastTimer = 0;
  const originalSrc = qrImage?.getAttribute('src') ?? '';

  /* ── 提示条 ─────────────────────────────────────────────────────────── */
  function showToast(message: string, duration: number): void {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
      toast.textContent = '';
    }, duration);
  }

  /* ── 二维码三态 ─────────────────────────────────────────────────────────
     (a) 已配置  (b) 未配置 —— 由构建期条件渲染成诚实空状态，此处无节点可管
     (c) 加载失败 —— 显示重试；若已配置账号则同时保留账号与复制入口 */
  function qrFailed(): boolean {
    if (!qrImage) return false;
    return qrImage.dataset.failed === '1' || (qrImage.complete && qrImage.naturalWidth === 0);
  }

  function applyQrState(): void {
    if (!qrImage) return;
    const failed = qrFailed();
    if (qrFigure) qrFigure.hidden = failed;
    if (qrError) qrError.hidden = !failed;
    qsa('[data-hint]', panel).forEach((hint) => {
      hint.hidden = failed;
    });
  }

  if (qrImage) {
    on(qrImage, 'error', () => {
      qrImage.dataset.failed = '1';
      applyQrState();
    });
    on(qrImage, 'load', () => {
      delete qrImage.dataset.failed;
      applyQrState();
    });
  }

  if (qrRetry && qrImage) {
    on(qrRetry, 'click', () => {
      if (retries >= MAX_RETRIES) return;
      retries += 1;
      qrRetry.disabled = true;
      // 加载态只用文字 —— 文档 §4 禁图标旋转，脉动点又属于循环动效
      qrRetry.textContent = '加载中…';
      delete qrImage.dataset.failed;

      const done = () => {
        qrRetry.textContent = '重新加载';
        qrRetry.disabled = retries >= MAX_RETRIES && qrFailed();
        applyQrState();
      };
      qrImage.addEventListener('load', done, { once: true });
      qrImage.addEventListener('error', done, { once: true });

      const separator = originalSrc.includes('?') ? '&' : '?';
      qrImage.src = `${originalSrc}${separator}r=${retries}`;
    });
  }

  /* ── 复制企业微信号 ─────────────────────────────────────────────────── */
  if (idCopy && idValue && idRow) {
    on(idCopy, 'click', async () => {
      const account = idValue.textContent?.trim() ?? '';
      if (!account) return;
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw new Error('clipboard 不可用');
        await navigator.clipboard.writeText(account);
        showToast('已复制企业微信号', TOAST_SUCCESS_MS);
      } catch {
        showToast('未能复制，请长按或选中账号复制', TOAST_ERROR_MS);
        // 顺手选中账号文本，让上面那句提示真的可执行
        const range = document.createRange();
        range.selectNodeContents(idValue);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });
  }

  /* ── 打开／关闭与焦点管理 ───────────────────────────────────────────── */
  /* 关闭后的收尾。做成幂等，并且由 close() 同步调用 ——
     dialog 的 close 事件是排入任务队列后才派发的，若只依赖它，
     页面会在关闭后仍有一小段时间处于滚动锁定状态。
     close 事件监听保留为兜底，覆盖不是本模块发起的关闭。 */
  function finishClose(): void {
    unlockScroll();
    if (!returnTo) return;
    const trigger = returnTo;
    returnTo = null;
    trigger.focus();
  }

  function open(trigger: HTMLElement): void {
    // 从手机菜单里触发：先关菜单，并把返回焦点改指菜单按钮 ——
    // 菜单里的那个 CTA 马上就要不可见了（文档 §5）。
    const fromMenu = Boolean(trigger.closest('[data-menu-panel]'));
    returnTo = fromMenu ? (menu.toggle ?? trigger) : trigger;
    if (menu.isOpen()) menu.close({ returnFocus: false });

    applyQrState();
    lockScroll();
    dialog.showModal();
    closeButton?.focus();
  }

  function close(): void {
    if (dialog.open) dialog.close();
    finishClose();
  }

  closeButton?.addEventListener('click', close);

  // Esc 走 cancel 事件的单一路径，与关闭按钮、遮罩共用同一个收尾流程
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });

  dialog.addEventListener('close', finishClose);

  // 遮罩关闭：要求 pointerdown 与 click 都落在面板之外，
  // 这样从面板内拖选到面板外不会误关。
  let pressedOutside = false;
  dialog.addEventListener('pointerdown', (event) => {
    pressedOutside = !panel.contains(event.target as Node);
  });
  dialog.addEventListener('click', (event) => {
    if (pressedOutside && !panel.contains(event.target as Node)) close();
    pressedOutside = false;
  });

  // Tab 循环每次按键重算：三种二维码状态下可聚焦控件数量不同。
  // 隐藏控件一律用 hidden/display:none，offsetParent 才能正确过滤。
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const items = qsa<HTMLElement>(FOCUSABLE, dialog).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !dialog.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // 所有咨询按钮都打开这一个面板（文档 §5）。
  // 直接绑定在元素上 ⇒ 先于 nav 的委托处理器执行，nav 会看到 defaultPrevented。
  qsa<HTMLElement>('[data-wecom]').forEach((trigger) => {
    on(trigger, 'click', (event) => {
      event.preventDefault();
      open(trigger);
    });
  });

  applyQrState();
}
