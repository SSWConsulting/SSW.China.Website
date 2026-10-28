/**
 * 可视化编辑的启动：页面被本站编辑后台（/admin/，不含表单编辑的 /admin/forms/）用 iframe 打开时，
 * 加载 Tina 的 bridge，让后台找到页面上的可编辑区域（Editable.astro 输出的 data-tina-island）。
 *
 * 访客直接访问时什么都不做，不加载任何编辑代码（DECISIONS §120）。
 * 被别的网站用 iframe 嵌入时读不到父页面地址（跨域），同样什么都不做。
 *
 * 要在 initReveal 之前调用：先把 data-motion 置为 off，滚动入场就不会把区块藏起来 ——
 * bridge 替换进来的新区块不会再被观察，带着 data-reveal 会一直隐藏。
 */
function insideAdmin(): boolean {
  if (window.self === window.top) return false;
  try {
    // nginx 对不带结尾斜杠的 /admin 也直接返回后台，不跳转补斜杠（§121）。
    const path = window.parent.location.pathname;
    return /^\/admin(\/|$)/.test(path) && !/^\/admin\/forms(\/|$)/.test(path);
  } catch {
    return false;
  }
}

export function initVisualEditing(): void {
  if (!insideAdmin() || !document.querySelector('[data-tina-island]')) return;
  document.documentElement.dataset.motion = 'off';
  // 依赖脚本状态显示内容的页面（/deck/ 只显示当前一页）在预览里按「无脚本」排版，否则区块被替换后会全部隐藏。
  if (document.querySelector('[data-tina-static-preview]')) {
    document.documentElement.classList.remove('js');
  }
  // bridge 由编辑后台提供（scripts/build-admin.mjs 拷进 /admin/；dev 下由 @tinacms/astro 的中间件提供），不打进站点脚本。
  const bridge = '/admin/bridge.js';
  void import(/* @vite-ignore */ bridge).then(({ init, refreshForms }) => {
    init();
    document.addEventListener('astro:page-load', refreshForms);
  });
}
