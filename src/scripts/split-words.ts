import { qsa } from './dom';
import { motionOff } from './motion';

/**
 * 标题逐词入场（取自 Elyte 模板的招牌动效：模糊 + 上移 + 微旋转 + 淡入，逐词错开）。
 *
 * 只做一件事：把 `[data-words]` 标题的文本切成 `<span class="word">`，并写入 `--wi`
 * 序号。动画本身全部在 CSS 里（`motion.css` 的 `word-in`），本文件不碰时长。
 *
 * 中文没有空格，纯按空格切会把「把 AI 做对，靠的是这三件事」切成两块，
 * 长短悬殊、错帧看不出来。所以切分规则是：
 *   · 连续的拉丁字母／数字（AI、SSW、YakShaver）算**一个**单位，不拆开；
 *   · 中日韩字符**逐字**成为一个单位；
 *   · 标点跟在前一个单位后面，不单独成块，避免标点先于文字出现。
 *
 * 这不是「逐字打字」（交接文档明令禁止的那种）—— 没有光标、没有顺序键入感，
 * 是一次性的错帧显现，`STAGGER_CAP` 之后不再累加，整句可读时间有上限。
 */

/** 每个单位之间错开的档数上限。超过之后所有单位共用同一个延迟。 */
const STAGGER_CAP = 12;

const CJK = /[㐀-鿿豈-﫿぀-ヿ]/;
const LATIN = /[A-Za-z0-9]/;
const TRAILING_PUNCT = /[\s　-〿＀-･.,!?;:'")\]}]/;

/** 把一段文本切成「可独立入场的单位」。 */
export function splitUnits(text: string): string[] {
  const units: string[] = [];
  let latin = '';

  const flushLatin = (): void => {
    if (latin) {
      units.push(latin);
      latin = '';
    }
  };

  for (const ch of text) {
    if (LATIN.test(ch)) {
      latin += ch;
      continue;
    }
    flushLatin();

    // 标点与空格并入上一个单位，避免它们自己占一档错帧
    if (TRAILING_PUNCT.test(ch)) {
      if (units.length) units[units.length - 1] += ch;
      else if (ch.trim()) units.push(ch);
      continue;
    }
    if (CJK.test(ch) || ch.trim()) units.push(ch);
  }
  flushLatin();

  return units;
}

export function initSplitWords(): void {
  // 动效关闭 ⇒ 完全不改 DOM。标题保持原样的一整段文本，
  // CSS 里那条 .word 规则因此没有作用对象，终态即原始渲染。
  if (motionOff()) return;

  for (const el of qsa<HTMLElement>('[data-words]')) {
    const text = el.textContent?.trim();
    if (!text) continue;

    const units = splitUnits(text);
    // 切不出两个以上单位就不折腾（单字标题没有错帧可言）
    if (units.length < 2) continue;

    const frag = document.createDocumentFragment();
    units.forEach((unit, i) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.style.setProperty('--wi', String(Math.min(i, STAGGER_CAP)));
      span.textContent = unit;
      frag.appendChild(span);
    });

    el.textContent = '';
    el.appendChild(frag);
    el.dataset.words = 'split';

    // 切开之后每个字是独立的 inline-block，部分读屏软件会逐块朗读、
    // 在字与字之间插入停顿。把整句挂成 aria-label、子节点隐藏，
    // 读屏拿到的就还是原来那一句。
    // （区块用 aria-labelledby 指向这些标题，可达名称因此仍是同一段文字。）
    el.setAttribute('aria-label', text);
    for (const span of qsa<HTMLElement>('.word', el)) {
      span.setAttribute('aria-hidden', 'true');
    }
  }
}
