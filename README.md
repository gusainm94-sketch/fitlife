# FitLife

FitLife is an original fitness and wellness application built with React, Vite, JavaScript, Tailwind CSS v4, React Router, Lucide icons, and Recharts. It includes a dashboard, gym and home workout plans, an Indian meal planner, a BMI and profile view, daily water and habit trackers, progress summaries, and achievements.

## Run locally

Install dependencies with `npm install`, start the development server with `npm run dev`, and create a production build with `npm run build`.

## Current stage

The dashboard's activity metrics are illustrative and are not recorded activity. Profile details, workout checkmarks, meal selections, daily water and habit records, and earned badges are saved in the browser's local storage. There is no backend, account sync, or authentication; weight history is not available because historical weigh-ins are not collected.

## Structure

- `src/components/` — reusable interface components
- `src/layouts/` — responsive application shell
- `src/pages/` — route-level screens
- `src/assets/` — local visual assets
- `src/hooks/` — reusable React hooks
- `src/context/` — shared application state
- `src/utils/` — helpers and persistence utilities
- `src/data/` — app data and defaults
- `src/styles/` — extended style resources