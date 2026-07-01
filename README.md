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

**Phase 1** (current): track diagram render, one Class 777 service running the full route, and the core
SimSig interaction — click the controlled `BIR-SOU` signal near Southport, then click a platform to set the
route. The rest of the line runs on automatic 4-aspect signalling that reacts live to track-circuit occupancy.
Game state and rendering are cleanly separated, the simulation tick is fixed-timestep and deterministic, and
progress autosaves to `localStorage`.

See `src/simsig/data/network.ts` for all station, mileage, speed-limit and timetable data — it's the single
place to tweak the route.
