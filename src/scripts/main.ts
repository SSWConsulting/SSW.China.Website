import { initNav } from './nav';
import { initCoreCarousel } from './carousel';
import { initTheme } from './theme';
import { initRegionMenu } from './region';
import { initRipple } from './ripple';
import { initGlobe } from './globe';
import { initReveal, revealAll, cancelOneShots } from './reveal';
import { initSplitWords } from './split-words';
import { initWecomModal } from './wecom-modal';
import { motionOff, onMotionChange } from './motion';
import { initVisualEditing } from './visual-editing';

// 必须最先：在编辑后台里打开时先关掉滚动入场（见 visual-editing.ts）。
initVisualEditing();
initTheme();
initRegionMenu();
initRipple();
const menu = initNav();
initWecomModal(menu);
initCoreCarousel();
initGlobe();
// 必须在 initReveal 之前：切词会重写标题的子节点，
// 而 reveal 只在宿主元素上加类，两者互不干扰，但切词要先落地。
initSplitWords();
initReveal();

// 动效偏好在会话中途改变时的唯一处理点：撤下所有「默认隐藏」，
// 让内容立即回到最终状态，并取消尚未播放的一次性动效。
onMotionChange(() => {
  if (!motionOff()) return;
  delete document.documentElement.dataset.reveal;
  cancelOneShots();
  revealAll();
});
