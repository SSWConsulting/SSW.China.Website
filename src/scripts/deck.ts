import { qs, qsa, on } from './dom';

/**
 * 展会／交流会现场用的全屏轮播（/deck/）。
 *
 * 设计前提是「无人值守」：页面打开后自动循环，任何一次人工操作（翻页、暂停）
 * 之后仍会回到自动播放，不需要有人守在电脑前。
 *
 * 与站内其他脚本一样，这里只做 CSS 做不到的事：
 * 决定当前是第几页、重启进度条、以及把控件条接上。
 * 页与页的淡入位移全在 deck.css 的 motion 层，受动效总开关约束；
 * **停留时长不受**（见 docs/DECISIONS.md §40）—— 关掉动效是不要「动」，
 * 不是要一张幻灯片停在那里不走。
 */

/** 停留时长的下限：再快就来不及读完一页。 */
const MIN_DWELL_MS = 3000;
/** 人工操作后多久恢复自动播放。 */
const RESUME_AFTER_MS = 45000;

function readDwellMs(): number {
  const fromQuery = Number(new URLSearchParams(location.search).get('interval'));
  if (Number.isFinite(fromQuery) && fromQuery > 0) {
    return Math.max(MIN_DWELL_MS, fromQuery * 1000);
  }
  // 令牌是唯一的时长来源：CSS 写 8s，这里读同一个值，两边不会各写一份。
  const token = getComputedStyle(document.documentElement).getPropertyValue('--t-deck-dwell');
  const seconds = Number.parseFloat(token);
  return Number.isFinite(seconds) && seconds > 0 ? Math.max(MIN_DWELL_MS, seconds * 1000) : 8000;
}

function initDeck(): void {
  const deck = qs<HTMLElement>('[data-deck]');
  if (!deck) return;

  const slides = qsa<HTMLElement>('[data-slide]', deck);
  if (slides.length < 2) return;

  const bar = qs<HTMLElement>('[data-deck-bar]', deck);
  const dotsBox = qs<HTMLElement>('[data-deck-dots]', deck);
  const progress = qs<HTMLElement>('[data-deck-progress]', deck);
  const toggle = qs<HTMLButtonElement>('[data-deck-toggle]', deck);
  const toggleLabel = qs<HTMLElement>('[data-deck-toggle-label]', deck);
  const full = qs<HTMLButtonElement>('[data-deck-full]', deck);
  const motionBtn = qs<HTMLButtonElement>('[data-deck-motion]', deck);
  const motionLabel = qs<HTMLElement>('[data-deck-motion-label]', deck);

  const dwell = readDwellMs();
  const autoplayWanted = new URLSearchParams(location.search).get('autoplay') !== 'off';

  let index = 0;
  let playing = autoplayWanted;
  let timer = 0;
  let resumeTimer = 0;

  const dots = slides.map((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `第 ${i + 1} 页：${slide.dataset.label ?? ''}`);
    dot.setAttribute('aria-current', String(i === 0));
    on(dot, 'click', () => {
      go(i);
      interact();
    });
    dotsBox?.append(dot);
    return dot;
  });

  /** 重启进度条：先摘掉动画类并强制回流，否则同名动画不会从头播。 */
  function restartProgress(): void {
    if (!progress) return;
    progress.classList.remove('is-running');
    void progress.offsetWidth;
    if (playing) progress.classList.add('is-running');
  }

  function go(next: number): void {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const current = i === index;
      slide.classList.toggle('is-current', current);
      // 非当前页整段退出可访问性树与 Tab 序列 —— 屏幕阅读器不会读到看不见的六页。
      slide.inert = !current;
      slide.setAttribute('aria-hidden', String(!current));
    });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    schedule();
  }

  /**
   * 让当前这一页重演一次入场。
   * 仅仅再调一次 go(index) 不行 —— `is-current` 本来就在，类名没有变化，
   * 动画也就不会重新开始。必须先摘掉、强制回流、再挂回去。
   */
  function replay(): void {
    const current = slides[index];
    if (!current) return;
    current.classList.remove('is-current');
    void current.offsetWidth;
    current.classList.add('is-current');
    schedule();
  }

  function schedule(): void {
    window.clearTimeout(timer);
    restartProgress();
    if (!playing) return;
    timer = window.setTimeout(() => go(index + 1), dwell);
  }

  function setPlaying(next: boolean): void {
    playing = next;
    toggle?.setAttribute('aria-pressed', String(!next));
    if (toggleLabel) toggleLabel.textContent = next ? '暂停' : '播放';
    schedule();
  }

  /** 任何一次人工操作：暂停自动推进，静置一段时间后自己恢复。 */
  function interact(): void {
    window.clearTimeout(resumeTimer);
    if (!autoplayWanted) return;
    resumeTimer = window.setTimeout(() => setPlaying(true), RESUME_AFTER_MS);
  }

  on(document, 'keydown', (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight' || event.key === 'PageDown') {
      go(index + 1);
      interact();
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      go(index - 1);
      interact();
    } else if (event.key === ' ') {
      event.preventDefault();
      setPlaying(!playing);
      interact();
    } else if (event.key === 'f' || event.key === 'F') {
      void toggleFullscreen();
    }
  });

  async function toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* 浏览器拒绝全屏（未由用户手势触发等）时静默放弃 */
    }
  }

  /**
   * 动效开关。现场大屏常常装在一台开着系统「减少动态效果」的机器上 ——
   * 那台机器不是在浏览网页，是在放演示，所以这里给操作者一个显式的覆盖。
   * 选择记在 localStorage，下次打开同一台机器不必再点一次；
   * 不设置时（既无按钮选择也无 ?motion= 参数）仍然跟随系统偏好。
   */
  function currentMotion(): 'on' | 'off' | 'system' {
    const value = document.documentElement.dataset.motion;
    return value === 'on' || value === 'off' ? value : 'system';
  }

  function syncMotionButton(): void {
    const state = currentMotion();
    // 跟随系统时按钮显示系统实际的结论，操作者看得出「现在到底有没有动效」。
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const playing3d = state === 'on' || (state === 'system' && !reduced);
    motionBtn?.setAttribute('aria-pressed', String(playing3d));
    if (motionLabel) motionLabel.textContent = playing3d ? '动效 开' : '动效 关';
  }

  if (motionBtn) {
    on(motionBtn, 'click', () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const state = currentMotion();
      const playing3d = state === 'on' || (state === 'system' && !reduced);
      const next = playing3d ? 'off' : 'on';
      document.documentElement.dataset.motion = next;
      try {
        localStorage.setItem('ssw-cn-deck-motion', next);
      } catch {
        /* 隐私模式下存不进去就只对本次有效 */
      }
      syncMotionButton();
      replay();
    });
  }

  if (toggle) {
    on(toggle, 'click', () => {
      setPlaying(!playing);
      interact();
    });
  }
  if (full) on(full, 'click', () => void toggleFullscreen());

  // 页面被切到后台时停表：回来时不会一口气连翻好几页。
  // visibilitychange 不在 HTMLElementEventMap 里，这里直接用原生监听。
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.clearTimeout(timer);
    else schedule();
  });

  if (bar) bar.hidden = false;
  syncMotionButton();
  setPlaying(autoplayWanted);
  go(0);
}

initDeck();
