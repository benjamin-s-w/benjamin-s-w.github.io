# benjamin-s-w.github.io

SEO portfolio for Ben Woodruff — Search Engine Optimization Specialist.

Static site built with [Eleventy](https://www.11ty.dev/), progressively enhanced
with [htmx](https://htmx.org/), deployed to GitHub Pages by GitHub Actions.

---

## Why this repository is part of the portfolio

The site makes claims about SEO and accessibility quality. Rather than asking you
to take those on faith, they are enforced mechanically. Every pull request runs:

| Gate | Tool | Fails the build when |
| --- | --- | --- |
| Markup validity | `html-validate` | Any HTML error |
| SEO metadata | `tools/check-metadata.js` | Missing/duplicate title, description, or canonical; more than one `h1`; unparseable JSON-LD; a page absent from `sitemap.xml` |
| Link integrity | `lychee` | Any broken internal or external link |
| Lighthouse | `@lhci/cli` | SEO < 100, Accessibility < 100, Best Practices < 95, Performance < 95, CLS > 0.1, TBT > 200ms |

A change that regresses SEO or accessibility cannot reach `main`.

---

## Architecture

### Static-first htmx

The common htmx pattern — request a partial and inject it — produces pages whose
content is absent from the initial HTML response. On an SEO portfolio that would
be a self-inflicted wound.

Instead:

- Every page is a complete pre-rendered HTML document at a real URL.
- htmx uses `hx-boost` with `hx-select="#main"`, fetching the **same full
  document a crawler receives** and swapping only `<main>`.
- No fragment URLs exist, so there is nothing extra to crawl, canonicalize, or
  de-duplicate.
- With JavaScript disabled, every link is an ordinary anchor and the site works.

`src/assets/js/enhance.js` handles the three things boosted navigation breaks:
screen reader announcements (`aria-live`), focus management, and `<head>`
metadata sync (title, description, canonical, robots).

### Single source of truth

`src/_data/site.js` holds identity, contact, and job title. `src/_data/career.js`
holds experience and metrics. `src/_data/capabilities.js` holds capability areas.
Changing a job title is a one-line edit that propagates to every page, all
JSON-LD, and the résumé.

---

## Commands

```bash
npm install
npm run dev        # local server at :8080 with live reload
npm run build      # build to dist/
npm run validate   # html-validate + metadata checks
npm run lhci       # Lighthouse CI with assertions
npm run resume     # regenerate src/static/resume.pdf from tools/resume.html
```

Deployment is push-to-`main`; there is no local deploy command.

### Regenerating images

```bash
node tools/build-images.js tools/source-images/headshot-original.jpg
```

Produces AVIF/WebP/JPEG at 1× and 2×, the 1200×630 Open Graph card, and the
Apple touch icon.

---

## Windows / OneDrive note

This project lives in a OneDrive-synced folder. OneDrive's sync engine corrupts
`npm install` — packages extract as empty directories. If `node_modules` looks
broken, build from a working copy outside OneDrive:

```powershell
$w = "$env:LOCALAPPDATA\portfolio-build"
robocopy . $w /MIR /XD node_modules dist .git /NFL /NDL /NJH /NJS
cd $w; npm install; npm run build
```

CI on Linux is unaffected.

---

## Deployment

`main` → GitHub Pages via `.github/workflows/deploy.yml`. **No secrets required** —
it uses OIDC. The workflow builds, runs the validation gates, and refuses to
publish a build that fails them.

One-time setup: repository **Settings → Pages → Source → GitHub Actions**.

The repository must be named exactly `benjamin-s-w.github.io` for the site to
serve from the domain root. A differently-named repo publishes to
`benjamin-s-w.github.io/<repo>/`, which would break every absolute URL in
`sitemap.xml` and the canonicals.

### Why not Cloudflare

This was originally built for Cloudflare Workers so security headers could be
declared in version control. Attaching a Worker to a custom domain requires the
domain's nameservers to be on Cloudflare, which would have meant migrating a
live site's MX and SPF records just to host a portfolio. Disproportionate risk,
so GitHub Pages it is.

GitHub Pages cannot set custom response headers, so HSTS, CSP, and
`X-Content-Type-Options` are not available. Only `referrer` survives, as a meta
tag. The trade-off is documented on `/technical-notes/` rather than hidden.

### Moving to a custom domain later

1. Change `url` in `src/_data/site.js`
2. Add `src/static/CNAME` containing the hostname
3. Add a DNS `CNAME` record pointing at `benjamin-s-w.github.io`
4. Enable **Enforce HTTPS** in repository settings

---

## Structure

```
src/
  _data/           site.js, career.js, capabilities.js
  _includes/
    layouts/       base.njk, case-study.njk
    partials/      header, footer, schema, hero-photo
  assets/          css, js, img, favicon
  case-studies/    six case studies + shared front matter
  static/          _headers (copied to site root)
  *.njk            pages
tools/
  build-images.js  image pipeline
  check-metadata.js SEO gate
```
