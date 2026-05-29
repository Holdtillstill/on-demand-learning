# Platform Academy premium polish pass

## Source critique

The current Cloud Native Platform Academy is functional but visually safe: light utilitarian palette, generic enterprise dashboard layout, little elevation, instantaneous hover states, limited command-copy feedback, and an unoptimized HTML shell.

## Reasonable implementation scope

Implement a focused premium polish pass rather than a total rewrite.

### Must implement

1. **Premium developer-focused visual system**
   - Make the product dashboard feel more like a high-end developer education/SRE training surface.
   - Prefer a polished dark/default developer mode or strong dark shell treatment with slate/emerald/cyan accents.
   - Preserve existing IA, routes, content, and tests.
   - Keep readability/accessibility high; no low-contrast neon-on-black gimmicks.

2. **Depth and glass treatment**
   - Add subtle gradients, ambient glows, shadow/elevation, and glassy/sticky chrome where appropriate.
   - Improve sidebars, topbar, cards, lab/runbook panels, course rows, resource cards, and the right rail.

3. **Interaction polish**
   - Add transitions to buttons, links, nav items, cards, segmented controls, resource/course/lab rows.
   - Add hover lift/elevation where it helps scanning.
   - Respect `prefers-reduced-motion`.
   - Animate progress bars via CSS without breaking their width/ARIA semantics.
   - Improve command-copy visual feedback (e.g. copied pulse/glow state) using existing copied state; do not break clipboard tests.

4. **Visual hierarchy**
   - Make the next-best-action / continue-lesson CTA visually dominant.
   - Improve icon treatments with soft colored/gradient chips where feasible.
   - Reduce feeling of flat generic internal tool.

5. **SEO/social shell + focus states**
   - Add meta description, theme color, Open Graph/Twitter tags, canonical-ish app metadata if safe.
   - Add a simple inline SVG favicon/data URI or keep safe fallback.
   - Add strong `:focus-visible` styles for keyboard users.

6. **Tests/validation**
   - Update/add tests only where needed for new accessible labels/text/classes.
   - Run `npm run typecheck`, `npm test -- --run`, and `npm run build` in `apps/platform-academy`.

### Avoid

- Do not rework backend/API.
- Do not remove existing design exploration routes.
- Do not invent fake learning claims or completion data.
- Do not create a separate theme toggle unless it is low-risk and tested; a cohesive premium default is enough.
- Do not commit; controller will validate and commit.
