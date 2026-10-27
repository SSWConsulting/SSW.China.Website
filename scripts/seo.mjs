#!/usr/bin/env node
/**
 * SEO / GEO 产物生成与守卫。
 *
 *   node scripts/seo.mjs          生成 public/sitemap.xml 与 public/llms.txt
 *   node scripts/seo.mjs --check  只校验，不写文件（verify 里跑的就是这个）
 *
 * 校验读的是**构建产物** dist/ —— 页面由 Astro 渲染，源文件里已经没有完整的
 * <head>。因此 --check 必须在 astro build 之后跑（npm run verify 里已经按此排序）。
 *
 * 为什么要脚本而不是手写这两个文件：它们里面全是绝对 URL，域名来自
 * content/settings/site.json 的 seo.origin（后台「站点设置 → SEO / 域名」）。手写会在换域名、加页面时悄悄过期，
 * 而过期的 sitemap / canonical 比没有更糟 —— 会把搜索引擎指到不存在的地址。
 *
 * --check 模式检查四件事：
 *   1. PAGES 里每个页面的源文件真实存在（防止列了已删除的页面）；
 *   2. 每个页面都有 <title>、<meta description>、canonical、og:url；
 *   3. canonical 与 PAGES 里登记的路径一致（防止复制粘贴时漏改）；
 *   4. 磁盘上的 sitemap.xml / llms.txt 与当前配置生成的内容一致
 *      （改了域名或加了页面却忘了重新生成，这里会红）。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteConfig } from '../src/config/site.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = siteConfig.seo.origin.replace(/\/$/, '');

/**
 * 站点的**公开**页面。
 *
 * /deck/ 刻意不在这里 —— 它是展会现场循环播放的轮播页，既不挂导航也不进
 * sitemap（见 vite.config.ts 里同样的说明），页面自己也带 noindex。
 *
 * 新增页面时：在这里加一行，然后跑 `npm run seo` 重新生成。
 */
const PAGES = [
  { route: '/', src: 'index.html', priority: '1.0' },
  { route: '/services/ai-platform/', src: 'services/ai-platform/index.html', priority: '0.9' },
  { route: '/services/ai-workflow/', src: 'services/ai-workflow/index.html', priority: '0.9' },
  { route: '/services/ai-apps/', src: 'services/ai-apps/index.html', priority: '0.9' },
  { route: '/chinafy/', src: 'chinafy/index.html', priority: '0.8' },
  { route: '/about/', src: 'about/index.html', priority: '0.7' },
];

const read = (rel) => readFileSync(resolve(root, rel), 'utf8');
/** 页面的构建产物路径。 */
const built = (p) => `dist/${p.src}`;
const pick = (html, re) => {
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
};

const meta = (p) => {
  const html = read(built(p));
  return {
    title: pick(html, /<title>([^<]*)<\/title>/),
    description: pick(html, /<meta\s+name="description"\s+content="([^"]*)"/s),
    canonical: pick(html, /<link\s+rel="canonical"\s+href="([^"]*)"/),
    ogUrl: pick(html, /<meta\s+property="og:url"\s+content="([^"]*)"/),
  };
};

const sitemap = () => {
  const urls = PAGES.map(
    (p) =>
      `  <url>\n    <loc>${origin}${p.route}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- 由 scripts/seo.mjs 生成，请勿手工编辑；改动后跑 npm run seo -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

const llms = () => {
  const lines = [
    `# ${siteConfig.seo.siteName}（SSW 中国）`,
    '',
    '> 智鹏瑞尔软件（杭州）有限公司是 SSW 在中国的分公司。SSW 1990 年成立于澳大利亚，',
    '> 30 多年来在全球 15 个国家为超过 1000 家企业和组织提供软件开发、技术咨询、',
    '> 数字化转型及创新解决方案。中国区聚焦三类可独立采购的 AI 服务，',
    '> 并提供 FDE（Forward Deployed Engineer）驻场或远程协作。',
    '',
    '## 页面',
    '',
  ];
  for (const p of PAGES) {
    const m = meta(p);
    lines.push(`- [${m.title}](${origin}${p.route}): ${m.description}`);
  }
  lines.push(
    '',
    '## 联系方式',
    '',
    '- 邮箱：info@ssw.com.au',
    '- 电话：+86 571 8517 8910',
    '- 地址：浙江省杭州市拱墅区新天地街 406 号星城发展大厦 2 幢 305 室（邮编 310004）',
    '',
    '## 说明',
    '',
    '- 本文件由 scripts/seo.mjs 生成，内容与站点页面同源，请勿手工编辑。',
    '- /deck/ 是展会现场循环播放的轮播页，不属于站点正文，未列入。',
    '',
  );
  return lines.join('\n');
};

const isCheck = process.argv.includes('--check');
const problems = [];

for (const p of PAGES) {
  if (!existsSync(resolve(root, built(p)))) {
    problems.push(`${built(p)} —— PAGES 里登记了这个页面，但构建产物里没有（先跑 astro build）`);
    continue;
  }
  const m = meta(p);
  for (const [k, label] of [
    ['title', '<title>'],
    ['description', '<meta name="description">'],
    ['canonical', '<link rel="canonical">'],
    ['ogUrl', '<meta property="og:url">'],
  ]) {
    if (!m[k]) problems.push(`${p.src} —— 缺 ${label}`);
  }
  // 只比对路径部分：域名由 seo.origin 统一推导
  for (const [k, label] of [
    ['canonical', 'canonical'],
    ['ogUrl', 'og:url'],
  ]) {
    const v = m[k];
    if (v && !v.endsWith(p.route)) {
      problems.push(`${p.src} —— ${label} 是「${v}」，与登记路径「${p.route}」对不上`);
    }
  }
  if (m.description && m.description.length > 160) {
    problems.push(
      `${p.src} —— description ${m.description.length} 字，超过 160（搜索结果会被截断）`,
    );
  }

  // FAQPage 结构化数据必须与页面上真正显示的问题一一对应 —— Google 明确要求
  // schema 内容与可见内容一致，不一致属于违规标记。改 FAQ 文案却忘了同步
  // JSON-LD 是最容易发生的漂移，这里直接拦住。
  const html = read(built(p));
  const visible = [...html.matchAll(/<summary class="faq__q">([\s\S]*?)<\/summary>/g)].map((x) =>
    x[1]
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  );
  const faqBlock = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((x) => {
      try {
        return JSON.parse(x[1]);
      } catch {
        problems.push(`${p.src} —— 有一段 JSON-LD 解析失败`);
        return null;
      }
    })
    .find((o) => o && o['@type'] === 'FAQPage');
  const inSchema = faqBlock ? faqBlock.mainEntity.map((q) => q.name) : [];

  if (visible.length && !faqBlock) {
    problems.push(`${p.src} —— 页面有 ${visible.length} 条 FAQ，但没有 FAQPage 结构化数据`);
  } else if (faqBlock && JSON.stringify(visible) !== JSON.stringify(inSchema)) {
    problems.push(
      `${p.src} —— FAQPage 里的问题与页面可见的 FAQ 对不上（页面 ${visible.length} 条 / schema ${inSchema.length} 条），改完文案要同步 JSON-LD`,
    );
  }
}

/**
 * robots.txt 也由脚本生成 —— 里面的 Sitemap 必须是绝对 URL，
 * 手写就会在换域名时和 seo.origin 脱节。
 *
 * 没有单独给 AI 爬虫（GPTBot / ClaudeBot / PerplexityBot 等）写规则：
 * `User-agent: *` 已经放行全部，这正是 GEO 想要的结果 —— 希望被生成式引擎
 * 抓取和引用。将来若要拦某一个，在这里加对应的 User-agent 段。
 */
const robots = () =>
  [
    '# 由 scripts/seo.mjs 生成，请勿手工编辑；改动后跑 npm run seo',
    'User-agent: *',
    'Allow: /',
    // 编辑后台与它的预览页（/admin/preview/，带编辑标记的页面副本）不该被收录（DECISIONS §117）。
    'Disallow: /admin/',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');

const outputs = [
  ['public/robots.txt', robots()],
  ['public/sitemap.xml', sitemap()],
  ['public/llms.txt', llms()],
];

if (isCheck) {
  for (const [rel, want] of outputs) {
    const abs = resolve(root, rel);
    if (!existsSync(abs)) {
      problems.push(`${rel} 不存在 —— 跑 npm run seo 生成`);
    } else if (read(rel) !== want) {
      problems.push(`${rel} 与当前配置不一致 —— 跑 npm run seo 重新生成`);
    }
  }
  if (problems.length) {
    console.error('\n✗ SEO 检查未通过：\n');
    for (const p of problems) console.error('  ✗ ' + p);
    console.error('');
    process.exit(1);
  }
  console.log(`✓ SEO 检查通过（${PAGES.length} 个公开页面，域名 ${origin}）`);
} else {
  if (problems.length) {
    console.error('\n✗ 生成前检查未通过：\n');
    for (const p of problems) console.error('  ✗ ' + p);
    console.error('');
    process.exit(1);
  }
  for (const [rel, content] of outputs) {
    writeFileSync(resolve(root, rel), content, 'utf8');
    console.log('✓ 已生成 ' + rel);
  }
  console.log(`  域名 ${origin}，${PAGES.length} 个公开页面`);
}
