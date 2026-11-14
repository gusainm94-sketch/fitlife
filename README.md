# FitLife

FitLife is an original fitness and wellness application built with React, Vite, JavaScript, Tailwind CSS v4, React Router, Lucide icons, and Recharts. It includes a dashboard, gym and home workout plans, an Indian meal planner and ingredient nutrition calculator, a BMI and profile view, daily water and habit trackers, progress summaries, and achievements.

## Run locally

Install dependencies with `npm install`, start the development server with `npm run dev`, and create a production build with `npm run build`. Netlify's SPA fallback is defined in `public/_redirects` so client-side routes can be opened directly after deployment.

## Current stage — Stages 9–16: Integrated planning and tracking

Nutrition includes an Indian meal planner, account-specific food preferences and availability, a personalized chart editor, saved chart history, and a cost estimator that uses prices entered by the user. Recipes reuse the ingredient calculator; unavailable nutrition and unset prices remain unavailable rather than being treated as zero. Meal selections do not count as consumed food: recipe calories enter intake summaries only after the user explicitly logs the meal as eaten. Ingredient estimates use USDA FoodData Central SR Legacy (April 2018) reference values per 100 g and ingredient-specific household weights where available. Poha, curd, and paneer are marked unavailable rather than assigned proxy nutrition values.

Profile details, workout checkmarks, meal selections, daily water and habit records, memberships, earned badges, custom ingredients, saved recipes, food-intake logs, diet preferences, diet charts, and food prices are saved in browser Local Storage separately for each local demo account. The membership store and commission dashboard contain demonstration content only; there are no live product links, market prices, payments, affiliate tracking, partner verification, external synchronization, or backend services. The frontend-only account system is not production authentication. Weight history is not available because historical weigh-ins are not collected.

Daily water and habit values retain their existing account-scoped storage keys and are additionally archived by local calendar date under matching `.history.v1` keys. The latest legacy daily record is preserved when a new date is first saved; gaps are not backfilled. Date-keyed meal plans and weekly workout checkmarks remain in their existing formats and are used for historical views. Existing legacy fitness data is copied to the first local account by the account migration without clearing source keys or overwriting an existing account-scoped value.

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