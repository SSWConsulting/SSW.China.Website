# 占位照片（发布前必须删除）

这些是**占位素材**，不是任何真实项目的现场照片，也不是 SSW 的人或场地。

- `placeholder-case-hero.jpg` 与 `placeholder-case-1/2/3.jpg` —— 首页「案例」区块用。
  **该区块当前已隐藏**（`cases: []`），这四张暂时没有被任何页面引用。
  （注意与下面的 `placeholder-case-a…d.jpg` 区分：数字结尾的是首页案例，
  字母结尾的是 AI 应用定制页的卡片配图。）
- `placeholder-consulting.jpg` —— AI 应用定制页（`/services/ai-apps/`）首屏通栏配图，
  由 `site.config.ts` 的 `aiApps.heroImage` 引用，`isPlaceholder: true`。
- `placeholder-case-a…d.jpg` —— 同一页四张「切入点」卡片的配图，
  由 `aiApps.useCaseImages` 按下标引用，同样 `isPlaceholder: true`。

**这一页共 5 处占位照片，`check:assets` 会合并成一条阻塞项报出来。**

## 来源与授权

来自 [Lorem Picsum](https://picsum.photos)（转发 Unsplash 图库）。
授权为 **Unsplash License**：可商用、可修改、免署名。
下载日期 2026-09-08，统一以 `?grayscale` 取灰度版本。

| 文件                                    | Picsum ID | 作者            | 原图                                    |
| --------------------------------------- | --------- | --------------- | --------------------------------------- |
| `placeholder-case-hero.jpg`（1600×900） | 122       | Vadim Sherbakov | https://unsplash.com/photos/xS_RzdD5CFE |
| `placeholder-case-1.jpg`（800×450）     | 119       | Nadir Balcikli  | https://unsplash.com/photos/wE9nUW7tMmk |
| `placeholder-case-2.jpg`（800×450）     | 134       | Charlie Foster  | https://unsplash.com/photos/Osl4I3IS9Cw |
| `placeholder-case-3.jpg`（800×450）     | 137       | Vladimir Kramer | https://unsplash.com/photos/xzZtV9ED5Bs |

### 另一来源：Openverse（CC0 1.0）

以下五张经 [Openverse](https://openverse.org) 检索、由其缩略图接口取得，
全部为 **CC0 1.0**（公共领域，可商用、免署名），下载日期 2026-09-10，
尺寸统一 600×400：

| 文件                         | 作者                 | 原始出处         |
| ---------------------------- | -------------------- | ---------------- |
| `placeholder-consulting.jpg` | Startup Stock Photos | StockSnap        |
| `placeholder-case-a.jpg`     | Christina Morillo    | 开发者与双显示器 |
| `placeholder-case-b.jpg`     | Christina Morillo    | 两人临窗交谈     |
| `placeholder-case-c.jpg`     | Direct Media         | 三人会议         |
| `placeholder-case-d.jpg`     | Kristin Hardwick     | 会议室           |

**取图方式**：StockSnap 的 CDN 拒绝直连（403），改用 Openverse 自己的
缩略图接口 —— 那是它提供的正规方式，**没有绕过任何反爬**。

**筛选时弃用过一张**：一张机房网线的图带可见水印，不适合作占位素材，已丢弃。

原 `placeholder-consulting.jpg` 说明保留如下：

`placeholder-consulting.jpg`（600×400）是**另一来源**：
经 [Openverse](https://openverse.org) 检索、由其缩略图接口取得，
原始出处 [StockSnap](https://stocksnap.io/photo/team-meeting-VQXYE2ZEHC)，
作者 Startup Stock Photos，授权 **CC0 1.0**（公共领域，可商用、免署名）。
下载日期 2026-09-10。

合计约 248 KB。

## 分辨率提醒

五张全是 600×400。**首屏那张问题最大**：它现在是**通栏背景**，
1440px 下要铺满 1425px 宽 —— 600px 的原图放大到 2.4 倍，必然发虚。
好在它被压到 28% 不透明度、再叠一层深色渐变，糊掉的细节大部分看不出来，
但这是**占位状态才成立的侥幸**，不能当作可以上线。

切入点卡片那四张按 4:5 竖版裁切，而原图是 3:2 横版 —— `object-fit: cover`
会切掉左右各约三成，构图不受控。

真实照片请提供：首屏至少 **2400px 宽**（通栏），卡片至少 **1200px 宽**且
最好本身接近竖版。

## 为什么是灰度

灰度是刻意的：

- 一眼就能看出不是终稿，不会被误当成真实案例配图；
- 不与 SSW 红 `#CC4141` 抢色，在深浅两套主题下都稳；
- 主卡有 60% 黑遮罩、副卡有 20% 黑遮罩，灰度图在遮罩下依然是干净的质感层。

## 灰度是怎么加的（两处不一样）

- 案例那四张：灰度**烧进了文件**（picsum 的 `?grayscale`）。
- `placeholder-consulting.jpg`：灰度是 **CSS 加的**
  （`.aiapps-hero__media[data-placeholder='true']`），文件本身是彩色。
  好处是把 `isPlaceholder` 改成 `false` 的同时灰度自动消失，
  不必再处理一次图片。新增占位素材请沿用后一种做法。

## 替换方式

拿到获准公开的真实案例照片后：放进 `public/media/`（不是本目录），
在 `site.config.ts` 里改掉 `backgroundImage` 的路径与原始尺寸，
把 `isPlaceholder` 改为 `false`，然后**删除整个 placeholder 目录**。

`npm run check:assets` 在还有 `isPlaceholder: true` 的案例时会返回非零，
占位内容不会静默上线。
