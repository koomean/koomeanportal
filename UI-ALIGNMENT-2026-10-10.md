# Charcoal canvas and consistent Portal controls — 10 October 2026

Portal only (`koomean.com`, repository `koomean/koomeanportal`). This supersedes the navy surface palette in the earlier blue refresh; the structure and controlled automatic motion remain.

- Restore original charcoal canvas `#14181d` and neutral panel colors. Blue/sky accents are outlines, control icons and focus states. Primary and selected settings controls have neutral backgrounds. New visits default to dark; saved explicit light/system choices remain available.
- Replace text-glyph UI icons with 26 local Lucide SVG sources using one 24-unit grid and consistent stroke. The build creates an inline sprite with no runtime icon library/CDN dependency. Brand/application logos retain their identity; the black GitHub registry mark is white in dark mode for visibility.
- Align header control heights to 44px (36px on the narrowest layout), refresh to 44×44px, and view controls to centered 36×36px inside their 44px wrapper. Search icons are centered independently of font metrics. Inputs and primary form actions use a consistent 44px baseline.
- Add consistent clear buttons to app, user, logo and command searches, preserving keyboard focus. Disable competing native search decoration.
- Fix the logo chooser's stretched previews by overriding the old broad span selector: previews are 44×44px and thumbnails 28×28px. Use balanced responsive tiles, bounded dialog scrolling, visible selection and full-name tooltips. Filter invalid icon slugs and provide vector fallbacks for broken thumbnails.

Validation: 60 browser checks, including seven viewport widths (280–1440px) in three app views, focus isolation, input clearing, actual SVG rendering, autoplay/pause/reduced motion, auth races and CSP. Five security checks and the Portal domain/build guard passed. Visual review used real public catalog reads and actual registry brand SVGs at 1440/390/280px; admin writes and sign-in were synthetic fixtures, never owner data. Production verification is recorded separately in the local task report after deployment.

Icon sources: [Lucide](https://lucide.dev/guide/lucide), [upstream commit 70562c1](https://github.com/lucide-icons/lucide/tree/70562c1ee1c4fdcf736fe97bc893fb8511927934/icons). Retain the upstream [license](licenses/Lucide-LICENSE.txt). SVG source is pinned in this repository and must be reviewed when updated.

No shared Worker, database, DNS, Blog or other website was changed. Existing CSP and memory-only authentication behavior remain. Cloudflare's injected analytics/JSDetection can still produce CSP diagnostics; this UI update does not change shared Cloudflare settings or relax script policy.
