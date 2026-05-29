# Platform Academy browser-local learner progress

## Problem

Platform Academy currently stores progress under the backend user id `demo-user` because the frontend calls `api.progress()`, `api.dashboard()`, and `api.saveProgress()` without passing a user id. This makes progress shared globally across every browser/session pointed at the same backend.

## Chosen first fix: Option A

Use a browser-local anonymous learner id stored in `localStorage`.

## Requirements

1. Generate a stable browser-local learner id on first load, e.g. `guest-<short-random-or-uuid>`.
2. Store it in `localStorage` so progress persists across refreshes/reopens in the same browser profile.
3. Pass that learner id to:
   - `api.progress(userId)`
   - `api.dashboard(userId)`
   - `api.saveProgress(lessonId, completed, score, userId)`
4. Show the active learner identity in the topbar instead of implying everyone is `demo-user`.
5. Add a low-risk control to reset/regenerate the local learner identity, ideally with clear copy that this starts a fresh local progress profile.
6. Keep backend data model unchanged; it already supports multiple user ids.
7. Keep `demo-user` available only as fallback/API default or explicit seeded-demo wording, not the default active browser user.
8. Add/update tests so mocked fetches assert guest ids are used for progress/dashboard and save-progress payloads.

## Validation

Run in `apps/platform-academy`:

```bash
npm run typecheck
npm test -- --run
npm run build
```

Then controller should browser-QA:

- first load creates `platform-academy-learner-id` in localStorage;
- topbar displays the guest id;
- progress/dashboard requests use that id;
- Mark complete POSTs that id;
- reset/regenerate creates a new id and reloads fresh progress;
- no console errors.
