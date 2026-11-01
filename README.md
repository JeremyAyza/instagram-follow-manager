# instagram-follow-manager

[![CI](https://github.com/JeremyAyza/instagram-follow-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/JeremyAyza/instagram-follow-manager/actions/workflows/ci.yml)

Browser extension that lists the Instagram accounts you follow that don't follow you back, and unfollows the ones you pick. WXT, React and TypeScript; it runs inside your logged-in instagram.com tab.

**Status:** personal tool. Instagram changes its web UI and internal API without notice, so it can stop working at any time.

> [!WARNING]
> Automating actions on Instagram goes against its Terms of Use and can get an account rate-limited or restricted. The delays below lower that risk; they don't remove it. Use it on your own account.

## How to run

Requires Node 20.

```bash
npm ci
npm run build          # Chrome  -> .output/chrome-mv3
npm run build:firefox  # Firefox -> .output/firefox-mv2
```

In `chrome://extensions`, turn on Developer mode, click **Load unpacked** and pick `.output/chrome-mv3`. Open instagram.com while logged in; the floating button opens the side panel.

## How it works

1. **Session.** Reads `csrftoken` and `ds_user_id` from the instagram.com cookies and sends them with Instagram's public web app ID. It never asks for a password and talks to no server other than instagram.com.
2. **Scan.** Pages through `/api/v1/friendships/{id}/following` and `/followers`, the same endpoints instagram.com calls: 200 and 25 users per page, 15–18 s between pages, 40–50 s every 10 pages. If any page fails, the scan fails; a partial list is never saved. Results go to `chrome.storage.local`.
3. **Compare.** Accounts you follow whose ID isn't in your followers. Tabs split regular accounts from verified/creator ones; there's a search box.
4. **Unfollow.** For each selected account it opens the profile in the same tab, clicks *Following → Unfollow* and waits up to 15 s for the button to read exactly *Follow*. 5–10 s between accounts, 45–60 s every 7–9. Progress is saved, so a reload resumes the queue (can be turned off).
5. **Export / import.** Each list can be saved as JSON and loaded back; imports are merged and de-duplicated by ID.

## Technical decisions

- **Unfollow through the page, not the API.** Clicking the same buttons a person would is slower and breaks when Instagram renames a button (Spanish and English labels are matched). In exchange, the only internal endpoint it depends on is the read-only friendship list.
- **Slow on purpose.** Scanning 1,000 followers takes about 12 minutes. That's the cost of not hammering an endpoint that rate-limits.
- **State lives in `chrome.storage.local`, not React state**, so a scan or an unfollow queue survives navigation and reloads.
- **Shadow DOM.** The panel mounts in a shadow root, so Tailwind and Instagram's CSS don't leak into each other.

## Tests

`npm test` runs Vitest: scan pagination, user mapping and error handling, and the unfollow button flow on a fake DOM. CI runs the typecheck, the tests and the Chrome build.

## Known limitations

- Only Spanish and English button labels are recognized; the UI is in Spanish.
- The success check looks for a *Follow* button anywhere on the page, so a suggestions panel can produce a false success.
- If the page reloads mid-account, that account is skipped on resume.
- Nothing here is tested against live Instagram; endpoint or markup changes break it.

## History

v1 (2025) was a popup in plain JavaScript: you connected by pasting a "Copy as fetch" request from DevTools, and it exported CSV. v2 (2026) is the WXT + React rewrite described here. Both are in the commit history.

## License

[MIT](LICENSE)
