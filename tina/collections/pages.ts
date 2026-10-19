import type { Collection, TinaField } from 'tinacms';
import { flag, group, image, items, lines, longText, strings, text } from '../fields';
import { ctaOverride, localPreview, seo } from './common';

/**
 * 每个文档固定一份，不允许在后台新建或删除。
 * 预览入口（router）只在本地开启，见 common.ts 的 localPreview。
 */
const fixed = { allowedActions: { create: false, delete: false } } as const;

const titled = (name: string, label: string, o: { description?: string } = {}) =>
  items(
    name,
    label,
    [text('title', '标题', { required: true }), longText('text', '说明', { required: true })],
    'title',
    o,
  );

const sectionHead = (extra: TinaField[] = [], withIntro = true) => [
  text('eyebrow', '小标题', { required: true }),
  text('title', '标题', { required: true }),
  ...(withIntro ? [longText('intro', '导语')] : []),
  ...extra,
];

const deliverables = items(
  'deliverables',
  '交付项',
  [
    text('title', '名称', { required: true }),
    text('subtitle', '副标题', { required: true }),
    longText('body', '说明', { required: true }),
    strings('outputs', '交付内容'),
  ],
  'title',
  { description: '编号 01、02… 自动生成。' },
);

const faqItems = (withPoints = false) =>
  items(
    'items',
    '问答',
    [
      text('question', '问题', { required: true }),
      longText('answer', '回答', { required: true }),
      ...(withPoints
        ? [
            items(
              'points',
              '要点（可选）',
              [
                text('term', '术语（加粗）', { required: true }),
                text('text', '说明', { required: true }),
              ],
              'term',
            ),
          ]
        : []),
    ],
    'question',
    { description: '页面上的问答与搜索引擎看到的 FAQ 结构化数据由这份列表同时生成。' },
  );

/** AI 底座中台 / AI 业务工作流：同一个模板，两份文案。 */
export const ServiceCollection: Collection = {
  name: 'service',
  label: '页面：AI 底座中台 / AI 业务工作流',
  path: 'content/pages',
  format: 'json',
  match: { include: '{ai-platform,ai-workflow}' },
  ui: { ...fixed, ...localPreview(({ document }) => `/services/${document._sys.filename}/`) },
  fields: [
    seo,
    text('name', '服务名称', {
      required: true,
      description: '页面大标题、面包屑与结构化数据共用。',
    }),
    group('hero', '首屏', [
      image('image', '首屏配图'),
      text('lede', '导语', { required: true }),
      longText('body', '正文', { required: true }),
      text('primaryButton', '主按钮文字', { required: true }),
      text('secondaryButton', '次按钮文字', { required: true }),
    ]),
    group(
      'pillars',
      '为什么需要',
      sectionHead([titled('items', '要点', { description: '编号 I、II、III 自动生成。' })]),
    ),
    group(
      'usecases',
      '典型场景',
      sectionHead([titled('items', '场景', { description: '编号 01、02… 自动生成。' })]),
    ),
    group('capabilities', '核心能力', [
      text('eyebrow', '小标题', { required: true }),
      text('title', '标题', { required: true }),
      items(
        'items',
        '能力',
        [text('term', '名称', { required: true }), longText('detail', '说明', { required: true })],
        'term',
      ),
      text('fitLabel', '「适合场景」标签', { required: true }),
      longText('fit', '适合场景', { required: true }),
    ]),
    group(
      'scope',
      '交付范围',
      sectionHead([
        text('fitLabel', '「适合这样的你」标签', { required: true }),
        longText('fit', '适合这样的你', { required: true }),
        deliverables,
      ]).map((f) =>
        f.name === 'title'
          ? lines('title', '标题', { required: true, description: '换行 = 页面上的断行。' })
          : f,
      ),
    ),
    group('process', '合作流程', [
      text('eyebrow', '小标题', { required: true }),
      text('title', '标题', { required: true }),
      titled('steps', '步骤', { description: '编号 01、02… 自动生成。' }),
    ]),
    group('beyond', '后续可选服务', sectionHead([titled('items', '服务')])),
    group('faq', '常见问题', [
      text('eyebrow', '小标题', { required: true }),
      text('title', '标题', { required: true }),
      faqItems(),
    ]),
    group('more', '其他 AI 服务', [text('title', '标题', { required: true })], {
      description: '底部的服务卡片文案在「全站通用 → 服务卡片」。',
    }),
    ctaOverride,
  ],
};

/** AI 应用定制。 */
export const AppsCollection: Collection = {
  name: 'apps',
  label: '页面：AI 应用定制',
  path: 'content/pages',
  format: 'json',
  match: { include: 'ai-apps' },
  ui: { ...fixed, ...localPreview(() => '/services/ai-apps/') },
  fields: [
    seo,
    text('name', '服务名称', { required: true, description: '面包屑与结构化数据使用。' }),
    group(
      'hero',
      '首屏',
      [
        text('title', '大标题', { required: true }),
        text('lede', '导语', { required: true }),
        longText('body', '正文', { required: true }),
        text('primaryButton', '主按钮文字', { required: true }),
        text('secondaryButton', '次按钮文字', { required: true }),
      ],
      { description: '首屏配图在「站点设置 → AI 应用定制页素材」。' },
    ),
    group('pillars', '主张', sectionHead([titled('items', '要点')])),
    group(
      'usecases',
      '切入点',
      sectionHead([
        titled('items', '切入点', {
          description: '配图按顺序对应「站点设置 → 四张切入点卡片配图」。',
        }),
      ]),
    ),
    group(
      'scope',
      '交付范围',
      sectionHead([
        text('fitLabel', '「适合这样的你」标签', { required: true }),
        longText('fit', '适合这样的你', { required: true }),
        text('contactLink', '咨询链接文字', { required: true }),
        deliverables,
        longText('note', '备注', { required: true }),
      ]).map((f) =>
        f.name === 'title'
          ? lines('title', '标题', { required: true, description: '换行 = 页面上的断行。' })
          : f,
      ),
    ),
    group('process', '合作流程', [
      text('eyebrow', '小标题', { required: true }),
      text('title', '标题', { required: true }),
      titled('steps', '步骤'),
    ]),
    group('beyond', '不只是模型', sectionHead([titled('items', '服务')])),
    group('faq', '常见问题', [
      text('eyebrow', '小标题', { required: true }),
      text('title', '标题', { required: true }),
      faqItems(true),
    ]),
  ],
};

/** 落地中国。 */
export const ChinafyCollection: Collection = {
  name: 'chinafy',
  label: '页面：落地中国',
  path: 'content/pages',
  format: 'json',
  match: { include: 'chinafy' },
  ui: { ...fixed, ...localPreview(() => '/chinafy/') },
  fields: [
    seo,
    text('name', '页面名称', { required: true, description: '面包屑与结构化数据使用。' }),
    group('hero', '首屏', [
      text('eyebrow', '小标题', { required: true }),
      strings('titleParts', '大标题（每项一行）'),
      longText('lede', '导语', { required: true }),
      longText('body', '正文', { required: true }),
      text('button', '按钮文字', { required: true }),
    ]),
    group('why', '为什么', [
      text('title', '标题', { required: true }),
      strings('paragraphs', '段落'),
    ]),
    group('offer', '我们能帮您做什么', [
      text('title', '标题', { required: true }),
      items(
        'items',
        '服务',
        [
          {
            type: 'string',
            name: 'icon',
            label: '图标',
            required: true,
            options: [
              { value: 'localize', label: '应用本地化' },
              { value: 'social', label: '社交媒体 / 小程序' },
              { value: 'integration', label: '本地服务集成' },
              { value: 'support', label: '长期支持' },
            ],
          },
          text('title', '标题', { required: true }),
          longText('text', '说明', { required: true }),
        ],
        'title',
      ),
    ]),
    group('scope', '涉及领域', [
      text('title', '标题', { required: true }),
      items(
        'items',
        '领域',
        [text('term', '名称', { required: true }), longText('detail', '说明', { required: true })],
        'term',
      ),
    ]),
  ],
};

/** 关于我们。 */
export const AboutCollection: Collection = {
  name: 'about',
  label: '页面：关于我们',
  path: 'content/pages',
  format: 'json',
  match: { include: 'about' },
  ui: { ...fixed, ...localPreview(() => '/about/') },
  fields: [
    seo,
    text('name', '面包屑名称', { required: true }),
    group('hero', '首屏', [
      text('title', '大标题', { required: true }),
      strings('paragraphs', '段落'),
      image('image', '配图', [
        text('alt', '替代文本', { required: true, description: '说清画面里真实存在的东西。' }),
      ]),
    ]),
    group('focus', '核心业务', [
      text('title', '标题', { required: true }),
      titled('items', '业务', { description: '编号 I、II、III 自动生成。' }),
      longText('note', '结语', { required: true }),
    ]),
    group('offices', '全球办公室', [
      text('title', '标题', { required: true }),
      longText('intro', '说明', { required: true }),
      text('linkLabel', '链接文字', { required: true }),
    ]),
    group('community', '技术社区', [
      text('title', '标题', { required: true }),
      longText('intro', '说明', { required: true }),
      text('linkLabel', '链接文字', { required: true }),
    ]),
    group('recognition', '资质与合作认证', [text('title', '标题', { required: true })], {
      description: '资质条目在「站点设置 → 关于我们页」（带发布闸门）。',
    }),
  ],
};

const slide = [
  text('label', '页面名称', { required: true, description: '用于圆点导航与读屏。' }),
  text('kicker', '小标题', { required: true }),
  text('title', '标题', { required: true }),
];
const deckCard = [
  text('title', '标题', { required: true }),
  text('sub', '说明', { required: true }),
];

/** /deck/ 演示轮播（展会现场大屏）。 */
export const DeckCollection: Collection = {
  name: 'deck',
  label: '页面：演示轮播',
  path: 'content/pages',
  format: 'json',
  match: { include: 'deck' },
  ui: { ...fixed, ...localPreview(() => '/deck/') },
  fields: [
    seo,
    group('cover', '封面', [
      text('label', '页面名称', { required: true }),
      text('kicker', '小标题', { required: true }),
      lines('title', '大标题', { required: true, description: '换行 = 页面上的断行。' }),
      strings('tags', '标签'),
    ]),
    group('overview', '三类服务', [
      ...slide,
      items('services', '服务', [...deckCard, strings('points', '要点')], 'title'),
    ]),
    items(
      'services',
      '服务详情页',
      [
        ...slide,
        text('lead', '导语', { required: true }),
        {
          type: 'string',
          name: 'numbering',
          label: '卡片编号样式',
          required: true,
          options: [
            { value: 'roman', label: '罗马数字 I II III' },
            { value: 'decimal', label: '两位数字 01 02' },
          ],
        },
        items('cards', '卡片', [...deckCard, flag('solid', '实心底')], 'title'),
        text('foot', '页脚', { required: true }),
      ],
      'label',
      { description: '每项服务一页，按顺序排在「三类服务」之后。' },
    ),
    group('process', '合作方式', [
      ...slide,
      items('steps', '步骤', deckCard, 'title'),
      longText('foot', '页脚', { required: true }),
    ]),
    group('closing', '收尾', [
      text('label', '页面名称', { required: true }),
      text('title', '标题', { required: true }),
      text('lead', '副标题', { required: true }),
      text('button', '按钮文字', { required: true }),
    ]),
  ],
};
