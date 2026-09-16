# Event Management System — Frontend

A plain HTML/CSS/JavaScript single-page app for the Event Management System.
No framework and no build step — it runs by being served (or even opened
directly) as static files, and talks to the backend API over `fetch`.

## Tech stack

- HTML5
- CSS3 (custom "printed program / ticket stub" theme, no framework)
- Vanilla JavaScript (`fetch` API) — no React/Vue/build tooling

## Prerequisites

- The backend API running (see the backend's own README) — by default at
  `http://localhost:5000`
- Any way to serve static files, or a browser to open `index.html` directly

## Run it

No `npm install` needed. Serve the folder with any static file server, e.g.:

```bash
npx serve .
```

or

```bash
python3 -m http.server 5173
```

Then open the printed URL (e.g. http://localhost:3000 or
http://localhost:5173) in your browser. You can also double-click
`index.html` to open it directly, though a local static server is
recommended so the browser applies normal CORS/security rules consistently.

## Connecting to the backend

The app expects the API at `http://localhost:5000/api`. If your backend runs
on a different host or port, update the constant at the top of
`js/api.js`:

```js
const API_BASE_URL = 'http://localhost:5000/api';
```

The header at the top of the page shows "API connected" or "API offline" so
you can quickly tell if the frontend can reach the backend.

## Using the app

1. Open the page — the header shows whether it can reach the API.
2. Fill in the **New event** form to add an event to the program.
3. Click any event card to open its detail page.
4. Use **Register** to add attendees (blocked once capacity is reached, and
   duplicate emails are rejected).
5. Use **Add to schedule** to build the running order of sessions; sessions
   are shown sorted by start time.
6. Use **Delete event** to remove an event along with its attendees and
   schedule.

## Project structure

```
frontend/
├── index.html          # Single-page app shell (list view + detail view)
├── css/
│   └── style.css        # All styling — no CSS framework
└── js/
    ├── api.js            # fetch() wrapper for every backend endpoint
    └── app.js            # DOM rendering, state, and event handlers
```

- `index.html` contains two `<section>` views (`#view-list` and
  `#view-detail`) that `app.js` shows/hides — there's no router or page
  reload, it's a single HTML file.
- `api.js` is the only file that knows the backend's URL shape; every
  network call goes through it.
- `app.js` holds the small `state` object (loaded events, current event id)
  and all rendering/event-handling logic.

## Customizing

- **Styling**: all colors, fonts, and spacing are defined as CSS custom
  properties at the top of `css/style.css` (`:root { --paper: ...; }`) —
  change them there to re-theme the whole app.
- **API base URL**: see `js/api.js` as noted above.
