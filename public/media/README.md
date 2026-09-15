# 素材投放目录

把图片、二维码、标识、照片放进这个目录，然后在
`src/config/site.config.ts` 里填入路径与原始像素尺寸。

本目录原样输出、文件名不带 hash，因此路径稳定，可以直接替换文件。

各项素材缺失时页面会怎么表现，见 `docs/PENDING-ASSETS.md`。

当前已有：

- `ssw-logo.svg` —— SSW 深色背景版标识（导航与页脚使用）
- `ssw-logo-light.svg` —— SSW 浅色背景版标识
- `ssw-mark.svg` —— SSW 方形标记
- `tina-logo.svg` —— Tina 全称标识（产品卡片；卡片上由 CSS 滤镜转白）
- `tina-mark.svg` —— Tina 图形标记（产品卡片右下角水印，纯装饰）
- `yakshaver-logo-dark.svg` —— YakShaver 深色底横向标识（产品卡片）
- `yakshaver-gradient.webp` —— YakShaver 卡片右侧渐变底（纯装饰）

- `ai-solutions-bg.mp4` —— 视频通栏的背景视频（4.8 MB / 1920×1080 / H.264 / 11.5s）
- `ai-solutions-poster.jpg` —— 上面那支视频的首帧海报（68 KB，ffmpeg 抽帧）

Tina / YakShaver 的四个文件与这支视频都取自 ssw.com.au 的官方素材，未做任何修改。
视频较大，页面里是 `preload="none"` + 进入视口才加载，不影响首屏。

`placeholder/` 子目录里是**案例区块的占位照片**，来自 Lorem Picsum（Unsplash License，
免署名），已转灰度。它们不是任何真实项目的现场照片，发布前必须连同目录一起删除 ——
详见 `placeholder/README.md`。

`client-logos/` 子目录是首页客户标识跑马灯的九个标识：其中八个取自 ssw.com.au 的
同一组文件、未做修改；`fudan.png`（复旦大学）由用户提供。**里面全是第三方商标**，
页面上由 CSS 滤镜统一转白 —— 因此**新增标识必须是透明底**，
不透明背景会被染成一整块黑方块（`RGBA` 色彩类型不等于背景透明，要验四角像素的 alpha）。
是否可用于中国站需业务与法务确认 —— 未确认前 `npm run check:assets` 会阻塞发布，
详见 `docs/DECISIONS.md` §35。

`why-ssw-poster.jpeg`（1920×1080，413 KB）是「为什么选择 SSW」的配图，取自 ssw.com.au
的 `jake-b.png`；原文件是 1.77 MB 的 PNG，已重编码为 JPEG。

`recognition/microsoft-squares.png` 是资质徽章的图标，**Microsoft 商标**，
是否可用于中国站需业务与法务确认（`check:assets` 会阻塞）。

**不要**在这里放生成的、示意的或占位的二维码。
