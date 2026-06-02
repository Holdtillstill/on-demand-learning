# Platform Academy visual QA: contrast and sticky navigation

## User-reported issues

1. Course/lesson description text is still hard to see in dark mode. Specific example text:
   - "Find relevant files and logs in a project or container filesystem."
   - "Explain process exit codes and permission failures."
   - "Build a short text pipeline that extracts incident evidence."
   - Course: "Linux and Command Line Foundations"
2. The user does not want these secondary descriptions to look identical to primary headings/buttons, but they must be easily readable.
3. During long content scrolling, the left nav/sidebar visually only covers one screen length instead of staying full-height/sticky through the scroll.
4. The fix requires rendered UI validation, not CSS inspection alone.

## Required fix direction

- Improve contrast/readability of secondary body text in course rows, lesson rows, roadmap stage course links, resource/lab rows, and other dark-mode cards.
- Preserve hierarchy: descriptions should still be visually secondary relative to headings, but readable on dark cards.
- Fix the left product sidebar/nav so it remains full viewport height and visually continuous while scrolling long pages. Likely ensure `.product-sidebar` has `height: 100vh`, `min-height: 100vh`, robust sticky behavior, and dark-mode background/border treatment that does not end after the first viewport.
- Avoid reverting the premium dark theme.
- Avoid touching unrelated backend/content.

## Validation

1. Inspect affected source sections and CSS cascade.
2. Run the app locally if possible and visually inspect at least:
   - `/dashboard/home` around the "Linux and Command Line Foundations" course row.
   - a long course page such as the Linux course, verifying the left nav remains full height while scrolling.
   - a lesson page with long body/practice content, verifying readable contrast.
3. Run:
   ```bash
   cd apps/platform-academy
   npm run typecheck
   npm test -- --run
   npm run build
   ```
4. Leave changes uncommitted for controller review.

## Output summary

Include files changed, visual issues found, exact CSS/UX fixes, validation results, and any remaining concerns.
