# Decisions

Decisions taken on twake-calendar-frontend, oldest first, for every package of the repository: an entry names the packages it covers in its Scope line. Append only: a decision that changes gets a new entry that replaces the old one and cites it. Entry format: the `twake-decisions` skill of [linagora/twake-guidelines](https://github.com/linagora/twake-guidelines/blob/main/skills/twake-decisions/SKILL.md).

Categories: UX, UI, Product, Architecture, Infra, Tech.

## 2026-11-23, [Architecture] One decisions log at the repo root

- Decision: the repository keeps a single `docs/decisions.md` at its root for every package, and an entry names the packages it covers in its Scope line; packages keep no log of their own.
- Decided by: Crash-- (CTO), following [JF-Cozy's review of linagora/twake-ui#262](https://github.com/linagora/twake-ui/pull/262#discussion_r4663460487)
- Why: a decision often spans packages, and the `twake-decisions` skill looks up `docs/decisions.md` at the root.
- Scope: the whole repository, every package.

## 2026-11-23, [Tech] HTML served with no-cache instead of no-store

- Decision: the HTML document of the private and public images is served with `Cache-Control: no-cache` in production. `.env.js` and `version.js` keep `no-store`.
- Decided by: Crash-- (CTO), go of 2026-11-23 for the test of the navigation rail across pages
- Why: `no-store` on the document blocks the back-forward cache of the browser, and the document is revalidated on every load with `no-cache` all the same. Nothing in the history of the line documents a need for `no-store`: it came with the nginx cache split of the build optimization (#949), next to the immutable static assets.
- Scope: `nginx-entrypoint.sh`, the private and public images.

## 2026-11-23, [UX] Navigation rail behind TWAKE_RAIL, off by default

- Decision: with the runtime setting `TWAKE_RAIL` on, on desktop (md and up) and on a platform, a vertical rail of the Twake apps is pinned at the left of Calendar and the Twake bar leaves the platform menus to it. Off by default; small screens keep the bar and its menus. Moving between apps stays a real page navigation.
- Decided by: Crash-- (CTO), go of 2026-11-23 for the test of the navigation rail across pages
- Why: the rail is the navigation of the Twake Workplace mockup, and it is tested across the apps before it becomes the default.
- Scope: `apps/private`, `common`, the private image (`TWAKE_RAIL` in `.env.js`).
