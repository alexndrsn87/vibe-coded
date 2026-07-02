<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/cabe3b76-c875-4a15-8304-564b9fa4b42f

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Merseyrail Northern Line Signalling Simulator

Open `/simsig` for a SimSig-inspired signalling game covering **Hunts Cross → Southport**, with every real
station on the line, rendered as a classic schematic signaller's panel on HTML canvas.

### Phase 1 — track & one train (done)

Track diagram render, one Class 777 service running the full route, and the core SimSig interaction — click
the controlled `BIR-SOU` signal near Southport, then click a platform to set the route.

### Phase 2 — full signalling, full station list, dwell times (current)

- **Station dwell times**: the service now calls at every station (all-stations stopper), dwelling 30–35s at
  most stops and 60s at Liverpool Central and Moorfields (busy interchange stations), matching the real
  calling pattern.
- **Full-route interlocking**: three real controlled junctions now require the player to actively set a
  route before a train may pass — **Hall Road**, **Formby**, and **Birkdale** (entry to Southport). Everything
  else remains plain-line automatic 4-aspect signalling that clears itself the moment the track ahead is
  proved clear. Sandhills Junction is deliberately left automatic for now — in reality it's where the
  underground core and other branches converge, and that only becomes meaningful once Phase 3 introduces a
  timetable with other services to conflict with.
- Route release is automatic (TORR-style): once a train clears a controlled junction's protected section,
  the route drops and the signaller must set it again for the next service.
- **Session lengths**: choose a 15, 30 or 60-minute session before you press Start (15 is the default —
  a focused "rush hour blast"). A countdown timer runs alongside the sim clock; when it expires you get a
  grade (S/A/B/C) based on how far the service got, with a "Play again" option.
- **Sound hooks are wired up but silent** — no audio ships with this build. See "Supplying sound effects"
  below if you'd like to add real audio.

Game state and rendering are cleanly separated, the simulation tick is fixed-timestep and deterministic, and
progress autosaves to `localStorage`.

See `src/simsig/data/network.ts` for all station, mileage, speed-limit, dwell-time and stock data — it's the
single place to tweak the route.

### Supplying sound effects

The game calls into `src/simsig/audio/soundManager.ts` at the right moments already, but ships with no audio
files — every call fails silently until you add real clips. Drop files into `public/sfx/` using these exact
names (mp3 or ogg both work):

| File | Used when | Suggested feel |
| --- | --- | --- |
| `public/sfx/signal-click.mp3` | Every signal/platform click | Short, dry mechanical click (~100–200ms) |
| `public/sfx/route-set-thunk.mp3` | A route is successfully set | Solid electro-mechanical "thunk"/relay clunk (~300–500ms), like a NX panel route confirming |
| `public/sfx/route-cancel.mp3` | A route is cancelled | Softer, lower-pitched click/thunk (~200–300ms) |
| `public/sfx/route-warn.mp3` | A route is rejected (conflict, occupied) | Short buzz/beep, attention-getting but not harsh (~200–400ms) |
| `public/sfx/arrival-chime.mp3` | A train arrives at Southport | Pleasant two/three-note chime, like a station announcement bong (~1–2s) |
| `public/sfx/session-end.mp3` | A session's countdown reaches zero | Short fanfare or end-of-shift bell (~1–2s) |

Keep clips short and low-key — these play frequently during normal play. Once the files exist at those paths
the sound toggle in the HUD (top right, speaker icon) will just work; no code changes needed.
