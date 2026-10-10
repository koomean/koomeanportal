# Persistent settings and social link motion

The Portal social rail starts automatically when public links load. Normal speed is 38s per loop, approximately 18% faster than the previous 45s. Slow is 52s and fast is 28s. Changing speed preserves the current animation phase. Pause/play remains available.

Previously, `.marquee-section:focus-within` paused the rail while the play button retained focus, so clicking play could leave the animation stopped even after the pointer moved away. The rule now pauses for keyboard focus on actual links; pointer hover pauses only on devices that support hover. Hidden tabs, offscreen content, shared maintenance, reduced motion and explicit pause still stop animation.

Settings adds independently controlled social rail/video playback, scrolling speed, data saver and a reset action. The catalog adds a favorites-only filter/count that combines with search and group selection. Empty favorites explain how to star an app, and Show all clears restrictive filters. Reset restores supported preference defaults and clears transient search/group filtering while keeping stars and signed-in state.

Supported preferences persist automatically under the existing `koomean_portal_prefs_v3` localStorage key. Loading validates types and supplies defaults for added fields. Old theme/language/layout choices migrate. Explicit pause buttons also save their choices. Hover, focus, visibility, network errors and reduced-motion pauses do not overwrite the saved preferences. Data saver retains the video preference, prevents startup media loading and detaches an existing video source. Turning it off resumes video only when requested and visible. Browser autoplay denial keeps the poster/manual play option.

Persistence is per browser/device, without a login or backend write. Clearing site storage removes it. A saving failure is clearly shown in Settings when browser storage is blocked. Google ID tokens remain memory-only and require sign-in after reload; preferences are not authentication credentials.

Validation: 86 Chrome/Playwright browser checks and five security checks pass, including reload/fresh-context persistence, old/corrupt/invalid preferences, touch input, phase-preserving speed changes, data-saver network behavior, reset retention, blocked saving, auth races and CSP. Existing responsive checks cover 280–1440px in three app views. Visual review covers 1440/390/280px and Thai/English settings. Tests use synthetic auth/API; public visual checks use real read-only catalog responses. No production admin writes or real owner login.

Scope is only `koomean/koomeanportal` / `koomean.com`. Shared Worker, databases, DNS and other websites are unchanged. Existing Cloudflare-injected scripts may still be blocked by CSP; no shared policy was relaxed.

References: [W3C carousel animation controls](https://www.w3.org/WAI/tutorials/carousels/animations/), [MDN reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion). Production deployment and asset verification are recorded in the local task report.
