# MIT Graduate Economics Association

A responsive, static website for MIT GEA, ready for GitHub Pages. Plain HTML, CSS, and JavaScript; no build step, package manager, or server-side services required.

## Preview

From this directory, run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173. Use a web server, rather than opening the HTML files directly, so the calendar can load its data.

## Add an event

Edit `data/events.json`, copy an existing event object, and give it a unique `id`. The site automatically sorts events by date and updates both the month calendar and event list.

```json
{
  "id": "community-event-2026-12-01",
  "title": "Your event title",
  "date": "2026-12-01",
  "category": "social",
  "label": "Social",
  "description": "A short description of the event.",
  "location": "6–8 pm ET · Your confirmed venue",
  "url": "mailto:gea-social@mit.edu",
  "action": "Ask about this event",
  "allDay": true
}
```

- Dates use `YYYY-MM-DD`. The calendar opens to the current month in Cambridge (America/New_York).
- Categories: `tournament`, `social`, or `community`.
- `label` is the short visible category, such as “Deadline.”
- `url` can be a relative page, HTTPS link, or email link. Only use trusted links.
- Events currently use **day-level calendar entries**. Put any confirmed meeting times in `location` or `description`; exported events remain all-day reminders. `allDay` must stay true. This avoids inventing meeting times for the initial tournament dates.
- Download calendar exports **all listed events**, regardless of the selected month or category. Downloads are snapshots, not automatically updating subscriptions; stable IDs help calendar clients recognize events.
- The initial file contains only the two dates supplied by the organizer. No example events are shown publicly.
- Keep JSON valid: quote strings, separate objects with commas, and omit a trailing comma after the final object.

Run the content check after editing:

```sh
python3 scripts/check_site.py
```

## Pages and assets

- `index.html`: home, calendar, tournament feature, and resource introduction.
- `resources.html`: support directory, student communities, MIT life links, and GEA officers.
- `table-tennis.html`: matchups, scheduler, result submission, dates, and FAQ.
- `assets/style.css`: colors, type, responsive layouts, and reduced-motion support.
- `assets/app.js`: mobile navigation, calendar filtering/navigation, and iCalendar export.
- `assets/*.svg`: original GEA mark, community illustration, and table tennis artwork. The mark is a custom association design, not the official MIT logo.

Typography loads DM Sans and Manrope from Google Fonts, with local sans-serif fallbacks. No analytics, cookies, tracking scripts, or API keys are configured.

## Content sources and updates

Resource links and officer information were checked against https://economics.mit.edu/academic-programs/phd-program/student-resources on November 4, 2026. Review officer details each year and update the source note on the resources page.

Tournament links are the exact links supplied by the organizer. Their contents were not accessible through the research tool, so no pairings, rules, scores, venue, or times have been copied or invented. The dates are November 18 and November 20, **2026**, matching the supplied weekdays. Confirm venue and time before adding them to the page and event data.

Tournament date copy also appears in `index.html` and `table-tennis.html`; update those feature sections when replacing the featured tournament. The ongoing calendar itself is entirely data-driven.

## GitHub Pages

Publish this repository with GitHub Pages using **Deploy from a branch**, your chosen branch, and **/ (root)**. `.nojekyll` allows the static files to be served directly. All internal links are relative, so the site also works under a project subpath.

The files have been prepared locally. Publishing requires pushing them to GitHub and enabling Pages in the repository settings; neither action is performed by the local preview.
