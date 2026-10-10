# Portal blue refresh — 10 October 2026

Scope: koomean/koomeanportal, custom domain koomean.com only. No Worker, database, DNS or other website changes.

- Replace orange branding with navy/blue/sky across dark/light modes, buttons, navigation, focus states, hero, application cards, avatar and favicon. Keep IBM typography and header → hero → link rail → tools → app grid layout. Custom application colors remain data controlled.
- Refine control surfaces, card/icon borders, spacing, active states and restrained shadows. Keep long-text/mobile containment and modal accessibility.
- Background motion now starts automatically, muted, after the first paint (~1.2s delay). Keep separate pause/play controls for hero and link rail. Pause video offscreen, in hidden tabs and during maintenance. User pause persists for the current page session; a reload starts default motion again.
- OS reduced motion disables automatic video loading and moving rail/entrances. Browser-denied autoplay falls back to poster + manual play without an error toast.
- Original video: https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260505_101331_74f9b798-3f00-4e86-8a01-377aa16ffeaa.mp4 (1920×1080/24fps,12.04s,2,788,688 bytes). Optimized local loop: assets/hero-loop.mp4 (960×540/24fps H.264, no audio, faststart,156,921 bytes). Same content;94.4% smaller. Autoplay adds this small media request compared with the earlier click-only default.
- Playback handles overlapping pause/resume commands by reconciling the latest intent after an in-flight play promise settles. A rapid hidden→visible sequence reproduced the failure before the fix and passes afterward, with and without a Chrome debugger.

Validation:55 browser checks (including7 viewport widths and3 application views),5 input/security tests, build/domain guards. Browser mutations use synthetic API responses; no production data writes. Final deployment/live verification is recorded separately in the workspace report. Existing audit dated9 October is historical; this note supersedes its orange palette and click-only video default.

Implementation references: [MDN autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), [play promise and rejection](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play).
