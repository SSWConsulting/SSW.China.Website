import type { Collection } from 'tinacms';
import { group, items, longText, strings, text } from '../fields';
import { localPreview, seo } from './common';

/** 首页文案。区块顺序与版式在代码里；素材（图片、案例、数字）在「站点设置」。 */
export const HomeCollection: Collection = {
  name: 'home',
  label: '页面：首页',
  path: 'content/pages',
  format: 'json',
  match: { include: 'home' },
  ui: {
    allowedActions: { create: false, delete: false },
    // 本地可视化编辑：只在 npm run dev 下打开预览（见 common.ts 的 localPreview）。
    ...localPreview(() => '/'),
  },
  fields: [
    seo,
    group('hero', '首屏', [
      strings('titleLines', '大标题（每项一行）'),
      longText('lead', '导语', { required: true }),
      text('button', '按钮文字', { required: true }),
    ]),
    group('services', 'AI 服务', [
      text('title', '标题', { required: true }),
      longText('intro', '导语', { required: true }),
    ]),
    group('filmstrip', '视频通栏', [
      text('title', '标题', { required: true }),
      text('button', '按钮文字', { required: true }),
    ]),
    group('fde', 'FDE 服务', [
      text('title', '标题', { required: true }),
      longText('intro', '导语', { required: true }),
      text('focusLabel', '「交付关注点」标签', { required: true }),
      items(
        'stages',
        '阶段',
        [
          text('name', '名称', { required: true }),
          longText('description', '说明', { required: true }),
          text('focus', '交付关注点', { required: true }),
        ],
        'name',
      ),
      text('modes', '协作方式', { required: true }),
      longText('note', '补充说明', { required: true }),
    ]),
    group('cases', '案例', [text('title', '标题', { required: true })], {
      description: '案例内容在「站点设置 → 案例」。',
    }),
    group('whyUs', '为什么选择 SSW', [
      text('title', '标题', { required: true }),
      strings('paragraphs', '正文段落'),
      text('recognitionLabel', '「资质与荣誉」标题', { required: true }),
    ]),
    group('ecosystem', '产品与技术社区', [
      text('title', '标题', { required: true }),
      text('productCta', '产品卡片按钮文字', { required: true }),
      group('tina', 'Tina 卡片', [
        longText('description', '简介', { required: true }),
        strings('tags', '标签'),
      ]),
      group('yakshaver', 'YakShaver 卡片', [
        longText('description', '简介', { required: true }),
        strings('tags', '标签'),
      ]),
      group('fireug', 'FireUG 卡片', [
        text('kind', '类别', { required: true }),
        text('tagline', '口号', { required: true }),
        longText('description', '简介', { required: true }),
        text('bilibiliLabel', 'B 站按钮文字', { required: true }),
        text('youtubeLabel', '油管按钮文字', { required: true }),
        items(
          'stats',
          '数据',
          [text('label', '名称', { required: true }), text('value', '数值', { required: true })],
          'label',
          { description: '取自 FireUG 官网原文，不要编造。' },
        ),
      ]),
    ]),
    group(
      'faq',
      '常见问题',
      [
        text('title', '标题', { required: true }),
        items(
          'items',
          '问答',
          [
            text('question', '问题', { required: true }),
            longText('answer', '回答', { required: true }),
          ],
          'question',
        ),
      ],
      {
        description:
          '同一份问答也输出为 FAQPage 结构化数据，并写进 llms.txt（搜索引擎与 AI 问答会引用）。回答只写可核实的事实。',
      },
    ),
    group(
      'globe',
      'SSW 遍布全球',
      [text('title', '标题', { required: true }), text('subtitle', '副标题', { required: true })],
      { description: '办公室列表在「全站通用 → 办公室」。' },
    ),
  ],
};
