/**
 * 全站共用的滚动锁定。做成幂等并记录滚动位置，
 * 由咨询弹层与手机菜单抽屉共用 —— 避免两处各自实现导致状态打架。
 *
 * 配合 base.css 的 `scrollbar-gutter: stable`，隐藏滚动条时页面不会横向跳动。
 */
let locked = false;
let savedY = 0;

export function lockScroll(): void {
  if (locked) return;
  savedY = window.scrollY;
  document.documentElement.style.overflow = 'hidden';
  locked = true;
}

export function unlockScroll(): void {
  if (!locked) return;
  document.documentElement.style.overflow = '';
  locked = false;
  window.scrollTo(0, savedY);
}

export function isScrollLocked(): boolean {
  return locked;
}
