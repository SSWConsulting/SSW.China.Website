import type { Collection } from 'tinacms';
import { group, items, lines, longText, number, text } from '../fields';

const card = (name: string, label: string) =>
  group(name, label, [
    text('title', '标题', { required: true }),
    longText('text', '简介', { required: true }),
  ]);

/** 全站通用文案：导航、页脚联系方式、咨询面板、收尾 CTA、服务卡片。 */
export const SharedCollection: Collection = {
  name: 'shared',
  label: '全站通用',
  path: 'content/global',
  format: 'json',
  match: { include: 'shared' },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    group('nav', '顶部导航', [
      items(
        'links',
        '导航链接',
        [text('label', '文字', { required: true }), text('href', '链接', { required: true })],
        'label',
      ),
      text('currentRegion', '当前地区名称', { required: true }),
      text('otherRegionsLabel', '「其他地区」标题', { required: true }),
      items(
        'otherRegions',
        '其他地区',
        [
          text('name', '地区名', {
            required: true,
            description: '菜单抽屉里会显示为「SSW + 地区名」。',
          }),
          text('href', '链接', { required: true }),
        ],
        'name',
      ),
      text('contactLabel', '右上角咨询按钮文字', { required: true }),
    ]),
    group('serviceCards', '服务卡片', [
      card('platform', 'AI 底座中台'),
      card('workflow', 'AI 业务工作流'),
      card('apps', 'AI 应用定制'),
    ]),
    group(
      'cta',
      '收尾 CTA（默认）',
      [
        text('title', '标题', { required: true }),
        text('lead', '导语', { required: true }),
        text('button', '按钮文字', { required: true }),
      ],
      { description: '页面底部「联系我们」区块的默认文案。个别页面在自己的设置里另有文案。' },
    ),
    group('wecom', '企业微信咨询面板', [
      text('title', '标题', { required: true }),
      text('description', '说明', { required: true }),
      text('qrAlt', '二维码替代文本', { required: true }),
      longText('mobileHint', '手机端提示', { required: true }),
    ]),
    group('footer', '页脚联系方式', [
      longText('address', '地址', { required: true }),
      text('email', '邮箱', { required: true }),
      text('phone', '电话（显示）', { required: true }),
      text('phoneHref', '电话链接', { required: true, description: '例如 tel:+8657185178910' }),
    ]),
    items(
      'offices',
      '办公室（首页「SSW 遍布全球」）',
      [
        text('slug', '标识', {
          required: true,
          description: '小写英文，用作页面锚点，例如 hangzhou。',
        }),
        text('name', '名称', { required: true }),
        number('lat', '纬度', { required: true, description: '地球上的标记位置。' }),
        number('lng', '经度', { required: true }),
        text('email', '邮箱', { required: true }),
        text('phone', '电话（显示）', { required: true }),
        text('phoneHref', '电话链接', { required: true }),
        lines('address', '地址', { required: true, description: '换行 = 页面上的断行。' }),
        text('siteUrl', '网站地址', { required: true }),
        text('siteLabel', '网站链接文字', { required: true }),
      ],
      'name',
    ),
  ],
};
