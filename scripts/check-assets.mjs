#!/usr/bin/env node
import { siteConfig, publishBlockers } from '../src/config/site.config.ts';

const rows = [
  ['首屏背景照片', siteConfig.hero.backgroundImage, '首屏卡片只呈现红黑渐变底，不放占位图'],
  ['企业微信联系人二维码', siteConfig.wecom.qrImage, '咨询面板显示诚实的未配置空状态，不生成假码'],
  ['企业微信可搜索账号', siteConfig.wecom.searchableId, '账号行与复制功能整行不输出'],
  ['Tina 标识', siteConfig.ecosystem.tina.logo, '以真实名称纯文字呈现'],
  ['YakShaver 标识', siteConfig.ecosystem.yakshaver.logo, '以真实名称纯文字呈现'],
  ['FireUG 标识', siteConfig.ecosystem.fireug.logo, '以真实名称纯文字呈现'],
  ['页脚法定名称', siteConfig.footer.legalName, '该行不输出'],
  ['隐私政策链接', siteConfig.footer.privacyUrl, '不输出链接，绝不使用 href="#"'],
  ['ICP 备案', siteConfig.footer.icp, '不输出备案行，绝不填写占位备案号'],
  ['公安备案', siteConfig.footer.publicSecurity, '不输出备案行'],
];

const pad = (s, n) =>
  s + ' '.repeat(Math.max(0, n - [...s].reduce((w, c) => w + (c.charCodeAt(0) > 255 ? 2 : 1), 0)));

console.log('\n素材配置状态（src/config/site.config.ts）\n');
console.log(`  ${pad('素材', 24)}${pad('状态', 10)}未提供时的页面行为`);
console.log(`  ${'─'.repeat(78)}`);
for (const [name, value, fallback] of rows) {
  const present = value !== null && value !== undefined && value !== '';
  console.log(
    `  ${pad(name, 24)}${pad(present ? '已配置' : '待提供', 10)}${present ? '—' : fallback}`,
  );
}

const blockers = publishBlockers(siteConfig);
if (blockers.length === 0) {
  console.log('\n✓ 没有发布阻塞项。\n');
  process.exit(0);
}

console.log('\n发布阻塞项：\n');
for (const item of blockers) console.log(`  ✗ ${item}`);
console.log(
  '\n说明：这些缺失不影响本地预览与构建 —— 页面已按诚实降级渲染。\n' +
    '      但正式发布前必须补齐，否则咨询流程无法真正完成。\n',
);
process.exit(1);
