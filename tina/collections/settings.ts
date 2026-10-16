import type { Collection } from 'tinacms';
import { enabled, flag, group, image, items, number, strings, text, longText } from '../fields';

const PENDING =
  '发布闸门：勾选时 `npm run check:assets` 会阻塞发布。只有业务与法务确认中国站主体可以主张这些内容后才能取消勾选。';

const ecosystemEntry = (name: string, label: string, withLight = false) =>
  group(name, label, [
    text('name', '名称', { required: true, description: '真实名称，始终呈现。' }),
    image('logo', '标识（深底版）', [], {
      description: '必须是官方素材。留空 ⇒ 以名称纯文字呈现，不自制替代 Logo。',
    }),
    ...(withLight
      ? [image('logoLight', '标识（浅底版）', [], { description: '卡片背景随主题翻转时才需要。' })]
      : []),
    text('logoAlt', '标识替代文本'),
    ...(withLight
      ? []
      : [image('art', '卡片装饰图', [], { description: '纯装饰。留空 ⇒ 卡片只有纯色底。' })]),
  ]);

const placeholderImage = (name: string, label: string) =>
  image(name, label, [
    text('credit', '素材出处', { description: '仅供维护者辨认，不上屏。' }),
    flag('isPlaceholder', '这是占位素材', {
      description: '勾选 ⇒ 页面以灰度呈现，且阻塞发布。换成真实照片后取消勾选。',
    }),
  ]);

/**
 * 站点设置：改版前 src/config/site.config.ts 的全部取值。
 *
 * 这里管「素材与开关」—— 图片、二维码、备案号、发布闸门。
 * 页面上的文案在各页面集合里改。字段契约见 src/config/types.ts，
 * 取值如何收敛（留空 ⇒ null ⇒ 诚实降级）见 src/config/site.ts。
 */
export const SettingsCollection: Collection = {
  name: 'settings',
  label: '站点设置',
  path: 'content/settings',
  format: 'json',
  match: { include: 'site' },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    group('seo', 'SEO / 域名', [
      text('origin', '正式域名', {
        required: true,
        description:
          '不带结尾斜杠，例如 https://ssw.cn。canonical、sitemap、JSON-LD 的绝对地址都由它推导。',
      }),
      text('siteName', '站点名称', { required: true }),
      image('ogImage', '社交分享预览图', [], {
        description: '平台推荐 1200×630。留空 ⇒ 不输出 og:image（宁可没有，也不放假图）。',
      }),
    ]),

    group('hero', '首页首屏', [
      image('backgroundImage', '首屏背景照片', [text('alt', '替代文本')], {
        description: '留空 ⇒ 首屏只呈现红黑渐变底，不放占位图。',
      }),
    ]),

    group('wecom', '企业微信咨询', [
      image('qrImage', '联系人二维码', [], {
        description:
          '真实企业微信二维码或联系人海报。留空 ⇒ 面板显示下方的空状态文案。绝不放生成的假码。',
      }),
      flag('qrScanVerified', '二维码已在另一台设备上实扫验证', {
        description: '没勾选 ⇒ 阻塞发布。客服码会随账号变更失效，实扫能加上人后再勾选。',
      }),
      text('searchableId', '可搜索的企业微信号', {
        description: '可选。留空 ⇒ 账号行整行不输出。',
      }),
      longText('pendingNotice', '二维码未配置时的提示', {
        description: '新增文案，需文案负责人确认。',
      }),
    ]),

    group('advantage', '数据统计（SSW 的积累）', [
      enabled('数据统计'),
      text('title', '标题', { description: '首页、关于我们、AI 应用定制页共用。' }),
      items(
        'stats',
        '数字',
        [
          text('figure', '数字', {
            required: true,
            description: '按已发布口径原样填写，含千分位，例如 7,000。',
          }),
          text('suffix', '后缀', { description: '例如 +；没有就留空。' }),
          text('label', '名称', { required: true }),
          text('note', '补充说明'),
        ],
        'label',
        { description: '最多 3 项。数字是 SSW 已公开的全球口径，不要编造。' },
      ),
    ]),

    group('about', '关于我们页', [
      group('recognition', '资质与合作认证', [
        enabled('资质列表'),
        strings('items', '资质条目'),
        flag('pendingClearance', '待业务/法务确认', { description: PENDING }),
      ]),
    ]),

    group('whyUs', '为什么选择 SSW', [
      enabled('本区块'),
      image('image', '左栏配图（16:9）', [], { description: '留空 ⇒ 左栏不渲染，收成单栏。' }),
      text('videoUrl', '视频地址', {
        description: '留空 ⇒ 不渲染播放按钮。必须是中国大陆可访问的地址（B 站或自建）。',
      }),
      text('caption', '配图说明', { description: '留空 ⇒ 不输出。' }),
      group('recognition', '资质与荣誉徽章', [
        enabled('徽章'),
        flag('pendingClearance', '待业务/法务确认', { description: PENDING }),
        items(
          'badges',
          '徽章',
          [
            text('label', '文字', { required: true }),
            image('icon', '图标', [], { description: '可选。' }),
          ],
          'label',
        ),
      ]),
    ]),

    group('clients', '客户标识跑马灯', [
      enabled('跑马灯'),
      text('title', '区块标题（仅读屏可见）'),
      flag('pendingClearance', '待业务/法务确认', { description: PENDING }),
      items(
        'logos',
        '客户标识',
        [
          text('name', '客户名称', { required: true, description: '作为图片替代文本。' }),
          {
            type: 'image',
            name: 'src',
            label: '标识文件',
            description: '必须是透明底（页面上统一转白）。',
          },
          number('w', '宽（px）'),
          number('h', '高（px）'),
        ],
        'name',
        { description: '全部是第三方商标，新增前确认中国站主体可以主张该客户关系。' },
      ),
    ]),

    items(
      'cases',
      '案例',
      [
        text('title', '标题', { required: true }),
        longText('summary', '简介'),
        text('clientName', '客户名称', {
          description: '占位时必须是一眼可辨的示例名，不得编造真实企业。',
        }),
        image('clientLogo', '客户标志', [], { description: '留空 ⇒ 以客户名纯文字呈现。' }),
        image('backgroundImage', '背景照片', [], {
          description: '留空 ⇒ 品牌渐变兜底。绝不用虚构实景照片冒充项目现场。',
        }),
        text('url', '案例详情地址', { description: '留空 ⇒ 卡片不是链接，也不显示箭头。' }),
        flag('isPlaceholder', '这是占位案例', { description: '勾选 ⇒ 阻塞发布。' }),
      ],
      'title',
      { description: '第 1 条是主推大卡，第 2–4 条是下方副卡。清空 ⇒ 整段不渲染。' },
    ),

    group('aiApps', 'AI 应用定制页素材', [
      placeholderImage('heroImage', '首屏配图'),
      items(
        'useCaseImages',
        '四张切入点卡片配图',
        [
          { type: 'image', name: 'src', label: '图片文件' },
          number('w', '宽（px）'),
          number('h', '高（px）'),
          text('credit', '素材出处'),
          flag('isPlaceholder', '这是占位素材'),
        ],
        'credit',
        {
          description:
            '按顺序对应：文档处理 / 内部知识检索 / 客户咨询分流 / 为现有软件增加 AI。某一项不放图 ⇒ 该卡片降级为纯排版。',
        },
      ),
    ]),

    group('ecosystem', '产品与技术社区', [
      ecosystemEntry('tina', 'Tina'),
      ecosystemEntry('yakshaver', 'YakShaver'),
      ecosystemEntry('fireug', 'FireUG', true),
    ]),

    group('footer', '页脚与备案', [
      text('legalName', '中国站主体法定名称', { description: '需核实。留空 ⇒ 该行不输出。' }),
      text('copyrightHolder', '版权归属方', { description: '留空 ⇒ 不输出版权行。' }),
      number('copyrightYear', '版权年份'),
      text('privacyUrl', '隐私政策地址', {
        description: '留空 ⇒ 不输出链接（绝不使用 href="#"）。',
      }),
      group('icp', 'ICP 备案', [text('number', '备案号'), text('url', '查询地址')], {
        description: '绝不填写推测或占位备案号。备案必须与实际承载新站的域名对应。',
      }),
      group('publicSecurity', '公安备案', [text('number', '备案号'), text('url', '查询地址')]),
    ]),
  ],
};
