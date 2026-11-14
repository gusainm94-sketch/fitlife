# FitLife

FitLife is an original fitness and wellness application built with React, Vite, JavaScript, Tailwind CSS v4, React Router, Lucide icons, and Recharts. It includes a dashboard, gym and home workout plans, an Indian meal planner and ingredient nutrition calculator, a BMI and profile view, daily water and habit trackers, progress summaries, and achievements.

## Run locally

Install dependencies with `npm install`, start the development server with `npm run dev`, and create a production build with `npm run build`.

## Current stage — Stage 8: Food Ingredient Nutrition Calculator

Dashboard and progress metrics use saved workout checkmarks, meal plans, explicitly logged recipe intake, water intake, and habit records. Selecting a planned meal does not count it as consumed; recipe calories enter food-intake summaries only after the user logs the meal as eaten. Food intake remains separate from the calorie-burn activity history. Ingredient estimates use USDA FoodData Central SR Legacy (April 2018) reference values per 100 g and ingredient-specific household weights where available. Poha, curd, and paneer are marked unavailable rather than assigned proxy nutrition values; custom ingredients can be added with values from a package or other identified source. Nutrition values are estimates, not exact values for a particular brand or preparation.

Profile details, workout checkmarks, meal selections, daily water and habit records, memberships, earned badges, custom ingredients, saved recipes, and food-intake logs are saved in browser Local Storage separately for each local demo account. The frontend-only account system does not provide production authentication, backend services, or account sync. Weight history is not available because historical weigh-ins are not collected.

Daily water and habit values retain their existing account-scoped storage keys and are additionally archived by local calendar date under matching `.history.v1` keys. The latest legacy daily record is preserved when a new date is first saved; gaps are not backfilled. Date-keyed meal plans and weekly workout checkmarks remain in their existing formats and are used for historical views. Existing legacy fitness data is copied to the first local account by the account migration without clearing the source keys.

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