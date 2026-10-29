# SSW.cn (2026 redesign)

The Chinese-language SSW website in deep charcoal and SSW red `#CC4141`: a home page, three AI service pages and a few supporting pages. Stack: [Astro](https://astro.build) (fully static output) with plain TypeScript and plain CSS. Copy and assets are edited in a [TinaCMS](https://tina.io) admin at [ssw.cn/admin](https://ssw.cn/admin/), with a live visual preview (see [`docs/TINACMS.md`](docs/TINACMS.md)).

The navigation bar and hero follow the layout of [ssw.com.au](https://www.ssw.com.au). This site adds a "SSW around the world" section and a light/dark theme switch.
The only runtime dependency is [`cobe`](https://www.npmjs.com/package/cobe) (13 KB, a WebGL dotted globe). It is loaded on demand (a separate chunk, not part of the main bundle) and shown at every width: beside the office list on desktop, above it on narrow screens.

**Single source of truth for copy and design:** [`docs/spec/SSW-cn-首页文案与视觉设计说明.md`](docs/spec/SSW-cn-首页文案与视觉设计说明.md) (delivered and verified 2026-09-07). The Chinese copy on the pages is taken from that document sentence by sentence. Do not rewrite it as part of code changes.

## Pages

| Path                     | Content                                                                                                                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                      | Home: hero, three core AI service cards, stats, video banner, FDE service, client logos, why SSW, products and community, SSW around the world                                                                    |
| `/services/ai-platform/` | AI platform (AI 底座中台)                                                                                                                                                                                         |
| `/services/ai-workflow/` | AI business workflows (AI 业务工作流)                                                                                                                                                                             |
| `/services/ai-apps/`     | Custom AI applications (AI 应用定制)                                                                                                                                                                              |
| `/chinafy/`              | Chinafy: helping overseas apps enter the Chinese market (content taken from the existing page of the same name on ssw.cn)                                                                                         |
| `/about/`                | About SSW China                                                                                                                                                                                                   |
| `/deck/`                 | Presentation carousel: a full-screen, auto-playing deck of the three core AI services for big screens at trade shows and events (`?motion=on` overrides the system's reduced-motion setting, see DECISIONS §58.2) |

The three cards on the home page link to the matching service pages, and each service page links to the others at the bottom. All pages except `/deck/` share the same navigation, footer, contact panel and bundles (one CSS file, one JS file).

`/deck/` is the exception. It has no navigation or footer and ships its own slim `deck.css` / `deck.ts` (it does not load `index.css` or `main.ts`), reusing only the tokens, base styles and the global motion switch. It is not linked from the navigation, carries `noindex`, and is a standalone URL for event screens.

To add a page: create an `.astro` file under `src/pages/` (the file path is the URL, so `services/foo.astro` ⇒ `/services/foo/`). Put its copy in `content/pages/<slug>.json`, write its schema in `src/lib/pages.ts`, add a matching admin collection under `tina/collections/`, and finally register the page in `PAGES` in `scripts/seo.mjs`.

## Running locally

```bash
npm install
npm run dev        # http://localhost:5173 , admin at http://localhost:5173/admin/index.html
```

| Command                       | What it does                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                 | Local dev server plus the Tina admin in local mode (saving writes straight to local files); page documents open with a live preview |
| `npm run dev:site`            | Site only, without the admin                                                                                                        |
| `npm run build`               | Type check + admin (only when TinaCloud credentials are set) + production build into `dist/`                                        |
| `npm run build:preview`       | Visual-editing preview site for Vercel (needs TinaCloud credentials); see `docs/TINACMS.md`                                         |
| `npm run build:island-server` | After `build`: the Node preview service that renders live edits for ssw.cn/admin, into `dist-island/`; see `docs/DEPLOY-SETUP.md`   |
| `npm run preview`             | Preview the production build (http://localhost:4173)                                                                                |
| `npm run typecheck`           | `astro check` (covers `.astro` templates and TS)                                                                                    |
| `npm run contrast`            | Checks contrast using the real tokens from `tokens.css`, and blocks brand red as a text colour                                      |
| `npm run check:assets`        | Prints the missing-assets table; exits non-zero when there are publish blockers                                                     |
| `npm run fonts:sync`          | Copies the Inter Latin subset from `node_modules` into `public/fonts/`                                                              |
| `npm run verify`              | Type check + format check + contrast + build + SEO check (should be green day to day)                                               |
| `npm run preflight`           | `verify` + asset check — **the pre-release gate**; fails while assets are still missing                                             |

There is no test suite; `verify` is the regression guard.

## Editing copy and adding assets: use the admin

Editors open [`https://ssw.cn/admin/`](https://ssw.cn/admin/) and sign in with their TinaCloud account. Each page document opens with the form on the left and the real page on the right: the preview updates as you type, and clicking text in the preview jumps to its field. If the live preview is unavailable, [`/admin/forms/`](https://ssw.cn/admin/forms/) is a form-only fallback.

Saving does not publish straight away. The TinaCloud editorial workflow creates a `tina/…` branch and opens a pull request; the site updates about three minutes after that PR is merged into `main` (which is protected).

Page copy is edited in the admin's page collections. Images, the QR code, the ICP filing, case studies, client logos and the publish gates live under 站点设置 (Site settings), backed by [`content/settings/site.json`](content/settings/site.json). Images can be uploaded to `public/media/` directly from the admin; always enter the image's **original pixel dimensions** along with it. Setup and usage are covered in [`docs/TINACMS.md`](docs/TINACMS.md).

Every field left empty has a defined, honest fallback (rendered conditionally at build time, so it holds with JavaScript off too). See [`docs/PENDING-ASSETS.md`](docs/PENDING-ASSETS.md) for each one.

## Before going live

`npm run check:assets` lists the blockers. There are currently five:

1. **WeCom QR code not yet scan-verified.** The real QR code is in place, but someone must **scan it on another device** and confirm it adds the contact, then check long-press-to-save on a phone. Only then tick the "scan verified" switch.
2. **Placeholder photos on the AI apps page.** The hero image and the four use-case cards use CC0 placeholder photos (shown in greyscale). Replace them with real photos, or clear them so the cards fall back to plain layout.
3. **Client logo marquee.** These are third-party trademarks taken from ssw.com.au. Business and legal need to confirm the China entity may claim these client relationships.
4. **"Why SSW" recognition badges** (Microsoft Solutions Partner, MAPA award) need the same confirmation.
5. **About page recognition list** (Microsoft partner, MVPs, Regional Director, etc.) needs the same confirmation.

Never toggle a gate just to make the check pass. Other missing assets (searchable WeCom ID, legal entity name, privacy policy link) do not block release; the page simply omits them instead of leaving empty boxes.

## Deployment

- **ssw.cn (production).** Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): the build runs on a GitHub-hosted Ubuntu runner, then a self-hosted Windows runner on the Aliyun server copies `dist/` into nginx and updates the visual-editing preview service (`/tina-island/`, proxied by nginx to a local Node process). Server setup is in [`docs/DEPLOY-SETUP.md`](docs/DEPLOY-SETUP.md).
- **Vercel.** The Vercel GitHub integration builds `npm run build:preview`: `main` deploys to https://ssw-china-preview.vercel.app, and every other branch and pull request gets its own preview link in the PR. Use PR previews to review page changes before merging; they are not for editing copy. `*.vercel.app` is blocked in mainland China, so editors there use ssw.cn/admin.

The site itself stays fully static: visitors never load Tina or any editing code. Pages only carry a few `data-tina-island` markers, and the editing bridge loads only when a page is opened inside the site's own admin.

## Light and dark themes

Dark is the baseline (the design values from §3 of the handover doc). Light mode overrides the same set of semantic tokens under `:root[data-theme='light']`. Component CSS only reads tokens and never branches on `dark:` / `light:`.

Initial theme: saved choice → system `prefers-color-scheme` → dark. The choice is stored in `localStorage['ssw-cn-theme']`. The theme is resolved by an inline script in `<head>` before the stylesheet loads, so there is no flash. Without JavaScript the attribute is absent, the dark tokens apply, and the theme button stays hidden.

Both palettes pass the contrast checks; see `npm run contrast`.

## Deliberately out of scope

- **Case studies are hidden for now.** 站点设置 → 案例 (Case studies) is empty, so the whole section does not render. The placeholder cases are kept in `src/config/placeholder-cases.json`; if they are shown, the section carries a publish gate (`npm run check:assets` flags it). When real, approved case studies are available, enter them in the admin following the field list in the spec's case-study section. The fields to collect are in `docs/PENDING-ASSETS.md`.
- No invented clients, results figures, credentials, team sizes, photos, QR codes, ICP numbers or legal names.
- Diagrams are always labelled as illustrative. No simulated states such as "running", "success rate" or client names, and no product UI that has not been verified.

## Structure

```
src/pages/             One file per page (the file path is the URL)
src/layouts/Base.astro Page shell: <head>, SEO tags, navigation, footer, contact panel
src/components/        Sections (sections/), shared partials (partials/), service page template (service/)
src/lib/               content.ts loads and validates content/; pages.ts, shared.ts, service.ts hold the schemas
src/config/            site.ts normalises Site settings and reports publish blockers; types.ts is the asset contract
src/styles/            tokens.css is the closed token set; motion.css holds every @keyframes and the only motion switch
src/scripts/           nav / wecom-modal / reveal / motion, all progressive enhancement; visual-editing.ts loads the Tina bridge inside the admin only
content/               Copy and asset settings (JSON), read and written by the TinaCMS admin
tina/                  TinaCMS config and admin collection definitions
dev/visual-editing/    /tina-island/ preview endpoints (dev server, Vercel and the ssw.cn preview service)
deploy/                ssw.cn preview service supervisor and the nginx snippet that proxies /tina-island/
docs/DECISIONS.md      Every value inferred during implementation (not specified in the docs), with reasoning
docs/VERIFY.md         Acceptance checklist and the verification results
docs/TINACMS.md        Admin setup, editing rules and known limitations
docs/DEPLOY-SETUP.md   Production server, self-hosted runner, nginx and preview service setup
```

Two review rules: **every `@keyframes` lives in `motion.css` only**, and **no duration or offset literals outside `tokens.css`**.
