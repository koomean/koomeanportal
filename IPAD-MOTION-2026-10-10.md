# Social rail startup on iPad and iPhone

When public links arrive after the first animation frame, Safari on iPadOS 27 can keep displaying the rail at its initial position until interaction. The animation clock still advances, so checking only `currentTime` does not detect this rendering failure.

Keep the empty rail's animation disabled while `data-loading` is present. Insert both link loops before clearing that attribute and `aria-busy`. Safari starts the percentage transform with the populated width. The existing 38-second default, speed choices, pause/play storage, hover/keyboard pauses, offscreen and background pauses, and OS reduced-motion behavior are retained. No polling, synthetic touches, extra animation loop, new libraries or relaxed security policy are needed.

Validation:

- A held bootstrap response failed the new empty-track guard before the fix and passed afterward.
- `npm run test:webkit`: 24 checks, including iPad portrait/landscape and iPhone startup without a tap, delayed data, saved pause/play across reload, touch focus, reduced motion and empty links.
- `npm run test:browser`: 86 existing Chrome checks.
- `npm test`: 5 security checks; Portal domain/build guard passes.
- Native iPadOS 27.0 simulator (Xcode, iPad Pro 11 M5): capture pixels without a debugger, JS animation inspection or interaction. Delayed baseline gives 0 changed rail pixels; fixed built source gives 43,922 changed pixels between captures 1.5 seconds apart. Removing masks, promoting layers, removing the wrapper transform or removing the initial time seek individually did not fix the delayed baseline.
- Native iOS 27.0 simulator (iPhone 17): fixed built source gives 46,610 changed rail pixels between captures 1.5 seconds apart, without a tap or animation inspection.

Native screenshots are required for this regression because reading animation/computed style through an inspector can itself wake the previously stale layer. The simulator is not a physical device, and its installed OS is 27.0 rather than the reported 27.0.1. Evidence and the experiment ledger are saved in the workspace report `reports/portal-ipad-2026-10-10`.

Deployment scope: this Portal repository and its GitHub Pages workflow only. No Worker, D1, DNS or other website changes.
