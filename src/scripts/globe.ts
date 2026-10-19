import { qs, qsa, on } from './dom';

/** SSW 红，与 --c-brand (#cc4141) 一致 */
const MARKER_RGB: [number, number, number] = [0.8, 0.2549, 0.2549];

/**
 * ssw.com.au 的地球固定按深色渲染，在它的浅色主题下也不变。
 * 本站两套主题都要用，所以陆地点与辉光跟随主题走 —— 否则浅底上会是一团灰球。
 */
type GlobeSkin = {
  baseColor: [number, number, number];
  glowColor: [number, number, number];
  dark: number;
  mapBrightness: number;
};

const SKIN: Record<'dark' | 'light', GlobeSkin> = {
  dark: {
    baseColor: [0.92, 0.92, 0.92],
    glowColor: [0.35, 0.35, 0.35],
    dark: 1,
    mapBrightness: 20,
  },
  light: { baseColor: [0.34, 0.34, 0.36], glowColor: [0.9, 0.9, 0.9], dark: 0, mapBrightness: 7 },
};

function skin(): GlobeSkin {
  return document.documentElement.dataset.theme === 'light' ? SKIN.light : SKIN.dark;
}

const MARKER_SIZE = 0.035;
const MARKER_SIZE_SELECTED = 0.055;
const AUTO_SPIN = 0.003;
const LERP = 0.08;
const SNAP = 0.002;

type Office = {
  button: HTMLButtonElement;
  panel: HTMLElement;
  lat: number;
  lng: number;
  slug: string;
  name: string;
};

/** 球体实测占画布 80.15%（见 docs/DECISIONS.md），故半径 = 0.40 × 画布边长 */
const SPHERE_RADIUS_RATIO = 0.4008;

/**
 * 城市名标签相对标记点的偏移，取自 ssw.com.au 的 getTagOffsetClassName。
 * 单位 px；'-100%' 表示按标签自身宽度左移。
 */
const TAG_OFFSET: Record<string, { x: number | string; y: number | string }> = {
  brisbane: { x: 18, y: -36 },
  newcastle: { x: 18, y: '-50%' },
  sydney: { x: 22.5, y: 22.5 },
  melbourne: { x: '-100%', y: 13.5 },
};
const TAG_OFFSET_DEFAULT = { x: 13.5, y: '-50%' } as const;
/** 标签离屏幕边缘至少留这么多（px），否则翻到标记点另一侧。 */
const TAG_EDGE = 8;

function locationToAngles(lat: number, lng: number): [number, number] {
  return [Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180];
}

/** 把角度差收敛到 [-π, π]，避免绕远路 */
function shortestAngle(from: number, to: number): number {
  return ((((to - from) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
}

function initAccordion(offices: Office[]): (index: number) => void {
  let openIndex = 0;

  const render = () => {
    offices.forEach((office, i) => {
      const open = i === openIndex;
      office.button.setAttribute('aria-expanded', String(open));
      office.panel.dataset.state = open ? 'open' : 'closed';
      // 折叠面板整体移出 Tab 序列与可达性树
      if (open) office.panel.removeAttribute('inert');
      else office.panel.setAttribute('inert', '');
    });
  };

  render();
  return (index: number) => {
    openIndex = openIndex === index ? -1 : index;
    render();
  };
}

export function initGlobe(): void {
  const buttons = qsa<HTMLButtonElement>('[data-office]');
  if (!buttons.length) return;

  const offices: Office[] = buttons.map((button) => ({
    button,
    panel: document.getElementById(button.getAttribute('aria-controls') ?? '') as HTMLElement,
    lat: Number(button.dataset.lat),
    lng: Number(button.dataset.lng),
    slug: button.id.replace(/^office-|-tab$/g, ''),
    name: button.querySelector('.office__name')?.textContent?.trim() ?? '',
  }));

  const setOpen = initAccordion(offices);
  let selected = 0;

  const canvas = qs<HTMLCanvasElement>('[data-globe-canvas]');

  let onSelect: (index: number) => void = () => {};

  offices.forEach((office, index) => {
    on(office.button, 'click', () => {
      setOpen(index);
      if (office.button.getAttribute('aria-expanded') === 'true') {
        selected = index;
        onSelect(index);
      }
    });
  });

  if (!canvas) return;

  // 地球在所有宽度下都挂载（用户 2026-10-19 要求，不再沿用 ssw.com.au 的「<1024px 不挂载」，
  // 见 docs/DECISIONS.md §107）。cobe 仍按需动态加载，不进主包。
  void import('cobe')
    .then(({ default: createGlobe }) => {
      mountGlobe(
        createGlobe,
        canvas,
        offices,
        () => selected,
        (fn) => (onSelect = fn),
      );
    })
    .catch((error: unknown) => {
      // 地球是补充性图形，加载失败不影响任何信息；但开发时静默失败不利于排查。
      // 常见原因：dev 服务器重新预构建依赖后，旧标签页按需加载的 cobe 地址已失效（刷新即可）。
      if (import.meta.env.DEV) console.warn('[ssw] cobe 加载失败（地球不显示）：', error);
    });
}

type CreateGlobe = typeof import('cobe').default;

function mountGlobe(
  createGlobe: CreateGlobe,
  canvas: HTMLCanvasElement,
  offices: Office[],
  getSelected: () => number,
  setOnSelect: (fn: (index: number) => void) => void,
): void {
  const wrap = canvas.parentElement as HTMLElement;
  /* 地球直接从当前选中的办公室（默认第一个）开始，不做入场补间。
     cobe 按需加载，加载期间用户可能已换了选中项，所以不能写死 offices[0]。 */
  let currentIndex = getSelected();
  const initialOffice = offices[currentIndex] ?? offices[0]!;
  const [initialPhi, initialTheta] = locationToAngles(initialOffice.lat, initialOffice.lng);
  let phi = initialPhi;
  let theta = initialTheta;
  let target: [number, number] | null = null;
  let speed = 1;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const markers = (selected: number) =>
    offices.map((office, i) => ({
      location: [office.lat, office.lng] as [number, number],
      size: i === selected ? MARKER_SIZE_SELECTED : MARKER_SIZE,
    }));

  const size = () => Math.round(wrap.getBoundingClientRect().width);

  /* ── 城市名标签 ──────────────────────────────────────────────────────────
     ssw.com.au 用 CSS 锚点定位（anchor()，目前仅 Chromium 支持）来摆放标签。
     这里改为自己做正交投影：球体是正交投影且居中，半径 = 0.4008 × 画布边长
     （实测得出）。标签文字直接取自左侧手风琴，不重复维护一份城市名。 */
  const tags = offices.map((office) => {
    const el = document.createElement('span');
    el.className = 'globe__tag';
    el.textContent = office.name;
    el.setAttribute('aria-hidden', 'true');
    wrap.append(el);
    return el;
  });

  /* 标签宽度只在尺寸变化时重新量一次，避免每帧读布局。 */
  let tagWidths: number[] = [];
  let tagWidthsFor = -1;

  function positionTags(selected: number): void {
    const px = size();
    const radius = px * SPHERE_RADIUS_RATIO;
    const centre = px / 2;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    if (tagWidthsFor !== px) {
      tagWidths = tags.map((tag) => tag.offsetWidth);
      tagWidthsFor = px;
    }
    /* 窄屏上地球几乎占满屏宽，靠边的标签会伸出屏幕。超出时翻到标记点另一侧。 */
    const wrapLeft = wrap.getBoundingClientRect().left;
    const viewport = document.documentElement.clientWidth;

    offices.forEach((office, i) => {
      const lat = (office.lat * Math.PI) / 180;
      const lon = (office.lng * Math.PI) / 180;
      // 标记正对镜头时 phi = 3π/2 − lon（与 locationToAngles 同一套约定）
      const a = phi + lon - Math.PI * 1.5;
      const cosLat = Math.cos(lat);
      const vx = cosLat * Math.sin(a);
      const y0 = Math.sin(lat);
      const z0 = cosLat * Math.cos(a);
      const vy = y0 * cosTheta - z0 * sinTheta;
      const vz = y0 * sinTheta + z0 * cosTheta;

      const tag = tags[i]!;
      // vz > 0 表示在朝向镜头的半球；靠近边缘时淡出并虚化
      const facing = Math.max(0, Math.min(1, (vz - 0.02) / 0.22));
      const offset = TAG_OFFSET[office.slug] ?? TAG_OFFSET_DEFAULT;
      const x = centre + radius * vx;
      const width = tagWidths[i] ?? 0;
      let ox = typeof offset.x === 'number' ? `${offset.x}px` : offset.x;
      if (typeof offset.x === 'number') {
        if (wrapLeft + x + offset.x + width > viewport - TAG_EDGE)
          ox = `calc(-100% - ${offset.x}px)`;
      } else if (wrapLeft + x - width < TAG_EDGE) {
        ox = `${TAG_OFFSET_DEFAULT.x}px`;
      }
      const oy = typeof offset.y === 'number' ? `${offset.y}px` : offset.y;

      tag.style.transform =
        `translate3d(${x.toFixed(1)}px, ` +
        `${(centre - radius * vy).toFixed(1)}px, 0) translate(${ox}, ${oy})`;
      tag.style.opacity = String(facing);
      tag.style.filter = facing > 0.99 ? 'none' : `blur(${((1 - facing) * 8).toFixed(1)}px)`;
      tag.classList.toggle('is-selected', i === selected);
    });
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let globe: { update: (s: Record<string, unknown>) => void; destroy: () => void };
  try {
    globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size(),
      height: size(),
      phi,
      theta,
      dark: skin().dark,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: skin().mapBrightness,
      mapBaseBrightness: 0,
      baseColor: skin().baseColor,
      markerColor: MARKER_RGB,
      glowColor: skin().glowColor,
      markers: markers(currentIndex),
      arcs: [
        { from: [-27.47, 153.02], to: [-33.84, 151.21] },
        { from: [-37.81, 144.96], to: [-33.84, 151.21] },
        { from: [-32.93, 151.78], to: [-33.84, 151.21] },
        { from: [-33.84, 151.21], to: [30.27, 120.15] },
        { from: [30.27, 120.15], to: [48.57, 7.75] },
        { from: [48.57, 7.75], to: [39.16, -75.52] },
      ],
      arcColor: MARKER_RGB,
      arcWidth: 0.5,
      arcHeight: 0.01,
      opacity: 1,
    }) as unknown as typeof globe;
  } catch (error) {
    // 地球是补充性图形，失败不影响任何信息；但静默失败不利于排查
    if (import.meta.env.DEV) console.warn('[ssw] 地球初始化失败：', error);
    return;
  }

  canvas.classList.add('is-ready');

  /* ── 渲染循环 ────────────────────────────────────────────────────────────
     cobe 2.x 不带 rAF 循环、也没有 onRender 回调（这一点与网上不少旧例子不同），
     每帧必须自己调用 globe.update()。之前误用 onRender，等于地球只画了一帧，
     自转、聚焦动画和拖拽全部失效。 */
  let lastSize = size();

  function render(): void {
    const px = size();
    if (px !== lastSize) {
      lastSize = px;
      globe.update({ phi, theta, width: px, height: px });
    } else {
      globe.update({ phi, theta });
    }
    positionTags(currentIndex);
  }

  let rafId = 0;

  function frame(): void {
    if (target) {
      const dPhi = shortestAngle(phi, target[0]);
      const dTheta = shortestAngle(theta, target[1]);
      if (Math.abs(dPhi) < SNAP && Math.abs(dTheta) < SNAP) {
        phi = target[0];
        theta = target[1];
        target = null;
      } else {
        phi += dPhi * LERP;
        theta += dTheta * LERP;
      }
    } else if (!dragging) {
      // 地球无条件自转（与 ssw.com.au 一致，用户明确要求）。
      // 这是全站唯一不受动效总开关约束的持续动效，理由见 docs/DECISIONS.md §19。
      phi += AUTO_SPIN * speed;
    }
    render();
    rafId = requestAnimationFrame(frame);
  }

  function start(): void {
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  function stopLoop(): void {
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  start();

  setOnSelect((index) => {
    const office = offices[index];
    if (!office) return;
    currentIndex = index;
    target = locationToAngles(office.lat, office.lng);
    start(); // 视口外被停掉时，选中也要能把循环拉起来
    globe.update({ markers: markers(index) });
    render();
  });

  // 现在循环归我们自己管，离开视口就能真正停掉，不只是画成透明
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : stopLoop()), {
      threshold: 0,
    }).observe(wrap);
  }

  on(wrap, 'pointerenter', () => (speed = 0.8));
  on(wrap, 'pointerleave', () => (speed = 1));

  on(wrap, 'pointerdown', (event) => {
    dragging = true;
    target = null;
    lastX = event.clientX;
    lastY = event.clientY;
    // 指针捕获失败不该让整个拖拽挂掉（某些环境会抛 InvalidPointerId）
    try {
      wrap.setPointerCapture(event.pointerId);
    } catch {
      /* 没有捕获也能拖，只是移出元素后会中断 */
    }
  });

  on(wrap, 'pointermove', (event) => {
    if (!dragging) return;
    phi += (event.clientX - lastX) / 220;
    theta = Math.max(-1.2, Math.min(1.2, theta + (event.clientY - lastY) / 650));
    lastX = event.clientX;
    lastY = event.clientY;
    // 立刻重绘一帧，拖拽跟手，不必等下一帧；即使 rAF 被节流也仍然响应
    render();
  });

  const endDrag = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    try {
      if (wrap.hasPointerCapture(event.pointerId)) wrap.releasePointerCapture(event.pointerId);
    } catch {
      /* 同上 */
    }
  };
  on(wrap, 'pointerup', endDrag);
  on(wrap, 'pointercancel', endDrag);

  // 主题切换时同步换肤
  new MutationObserver(() => {
    globe.update({ ...skin() });
    render();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  globe.update({ markers: markers(currentIndex) });
  render();
}
