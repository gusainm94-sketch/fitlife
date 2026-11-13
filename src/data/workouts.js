export const WEEKDAYS = [
  { id: 'monday', name: 'Monday', shortName: 'Mon' },
  { id: 'tuesday', name: 'Tuesday', shortName: 'Tue' },
  { id: 'wednesday', name: 'Wednesday', shortName: 'Wed' },
  { id: 'thursday', name: 'Thursday', shortName: 'Thu' },
  { id: 'friday', name: 'Friday', shortName: 'Fri' },
  { id: 'saturday', name: 'Saturday', shortName: 'Sat' },
  { id: 'sunday', name: 'Sunday', shortName: 'Sun' },
]

const exercise = (id, name, sets, reps, description, duration = '') => ({ id, name, sets, reps, description, duration })
const cardio = (id, name, duration, description) => ({ id, name, sets: 0, reps: '', duration, description })

export const GYM_DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

const gymExercise = (difficulty, day, id, name, sets, reps) => (
  exercise(`${difficulty.toLowerCase()}-${day}-${id}`, name, sets, reps, '')
)

export const GYM_WORKOUTS = {
  Beginner: [
    { title: 'Upper Body', focus: 'Upper Body', category: 'Strength', exercises: [
      gymExercise('Beginner', 'mon', 'machine-chest-press', 'Machine Chest Press', 3, '10–12 reps'),
      gymExercise('Beginner', 'mon', 'lat-pulldown', 'Lat Pulldown', 3, '10–12 reps'),
      gymExercise('Beginner', 'mon', 'seated-cable-row', 'Seated Cable Row', 3, '10–12 reps'),
      gymExercise('Beginner', 'mon', 'machine-shoulder-press', 'Machine Shoulder Press', 2, '10–12 reps'),
    ] },
    { title: 'Lower Body', focus: 'Lower Body', category: 'Strength', exercises: [
      gymExercise('Beginner', 'tue', 'leg-press', 'Leg Press', 3, '10–12 reps'),
      gymExercise('Beginner', 'tue', 'leg-extension', 'Leg Extension', 3, '10–12 reps'),
      gymExercise('Beginner', 'tue', 'seated-leg-curl', 'Seated Leg Curl', 3, '10–12 reps'),
      gymExercise('Beginner', 'tue', 'standing-calf-raise', 'Standing Calf Raise', 3, '12–15 reps'),
    ] },
    { title: 'Recovery', focus: 'Recovery', category: 'Recovery', exercises: [
      gymExercise('Beginner', 'wed', 'light-treadmill-walk', 'Light Treadmill Walk', 1, '10–15 minutes'),
      gymExercise('Beginner', 'wed', 'stationary-cycling', 'Stationary Cycling', 1, '10 minutes'),
      gymExercise('Beginner', 'wed', 'hip-flexor-stretch', 'Hip Flexor Stretch', 2, '30 seconds/side'),
      gymExercise('Beginner', 'wed', 'hamstring-stretch', 'Hamstring Stretch', 2, '30 seconds/side'),
    ] },
    { title: 'Full Body', focus: 'Full Body', category: 'Strength', exercises: [
      gymExercise('Beginner', 'thu', 'goblet-squat', 'Goblet Squat', 3, '10–12 reps'),
      gymExercise('Beginner', 'thu', 'machine-chest-press', 'Machine Chest Press', 3, '10–12 reps'),
      gymExercise('Beginner', 'thu', 'lat-pulldown', 'Lat Pulldown', 3, '10–12 reps'),
      gymExercise('Beginner', 'thu', 'dumbbell-romanian-deadlift', 'Dumbbell Romanian Deadlift', 3, '10–12 reps'),
    ] },
    { title: 'Conditioning', focus: 'Conditioning', category: 'Conditioning', exercises: [
      gymExercise('Beginner', 'fri', 'incline-treadmill-walk', 'Incline Treadmill Walk', 1, '15 minutes'),
      gymExercise('Beginner', 'fri', 'stationary-bike', 'Stationary Bike', 1, '10 minutes'),
      gymExercise('Beginner', 'fri', 'elliptical', 'Elliptical', 1, '10 minutes'),
      gymExercise('Beginner', 'fri', 'rowing-machine', 'Rowing Machine', 1, '8–10 minutes'),
    ] },
    { title: 'Mobility', focus: 'Mobility', category: 'Mobility', exercises: [
      gymExercise('Beginner', 'sat', 'hip-flexor-stretch', 'Hip Flexor Stretch', 2, '30 seconds/side'),
      gymExercise('Beginner', 'sat', 'hamstring-stretch', 'Hamstring Stretch', 2, '30 seconds/side'),
      gymExercise('Beginner', 'sat', 'thoracic-rotation', 'Thoracic Rotation', 2, '8 reps/side'),
      gymExercise('Beginner', 'sat', 'shoulder-mobility', 'Shoulder Mobility', 2, '10 reps'),
    ] },
    { title: 'Complete Rest', focus: 'Rest', category: 'Rest', exercises: [] },
  ],
  Intermediate: [
    { title: 'Upper Body', focus: 'Upper Body', category: 'Strength', exercises: [
      gymExercise('Intermediate', 'mon', 'barbell-bench-press', 'Barbell Bench Press', 3, '8–10 reps'),
      gymExercise('Intermediate', 'mon', 'lat-pulldown', 'Lat Pulldown', 3, '8–12 reps'),
      gymExercise('Intermediate', 'mon', 'seated-cable-row', 'Seated Cable Row', 3, '8–12 reps'),
      gymExercise('Intermediate', 'mon', 'dumbbell-shoulder-press', 'Dumbbell Shoulder Press', 3, '8–10 reps'),
    ] },
    { title: 'Lower Body', focus: 'Lower Body', category: 'Strength', exercises: [
      gymExercise('Intermediate', 'tue', 'barbell-back-squat', 'Barbell Back Squat', 3, '8–10 reps'),
      gymExercise('Intermediate', 'tue', 'romanian-deadlift', 'Romanian Deadlift', 3, '8–10 reps'),
      gymExercise('Intermediate', 'tue', 'leg-press', 'Leg Press', 3, '10–12 reps'),
      gymExercise('Intermediate', 'tue', 'leg-curl', 'Leg Curl', 3, '10–12 reps'),
    ] },
    { title: 'Recovery', focus: 'Recovery', category: 'Recovery', exercises: [
      gymExercise('Intermediate', 'wed', 'light-cycling', 'Light Cycling', 1, '15 minutes'),
      gymExercise('Intermediate', 'wed', 'incline-treadmill-walk', 'Incline Treadmill Walk', 1, '10–15 minutes'),
      gymExercise('Intermediate', 'wed', '90-90-hip-mobility', '90/90 Hip Mobility', 2, '8 reps/side'),
      gymExercise('Intermediate', 'wed', 'thoracic-rotation', 'Thoracic Rotation', 2, '8 reps/side'),
    ] },
    { title: 'Full Body', focus: 'Full Body', category: 'Strength', exercises: [
      gymExercise('Intermediate', 'thu', 'barbell-squat', 'Barbell Squat', 3, '8–10 reps'),
      gymExercise('Intermediate', 'thu', 'bench-press', 'Bench Press', 3, '8–10 reps'),
      gymExercise('Intermediate', 'thu', 'lat-pulldown', 'Lat Pulldown', 3, '8–12 reps'),
      gymExercise('Intermediate', 'thu', 'romanian-deadlift', 'Romanian Deadlift', 3, '8–10 reps'),
    ] },
    { title: 'Conditioning', focus: 'Conditioning', category: 'Conditioning', exercises: [
      gymExercise('Intermediate', 'fri', 'rowing-intervals', 'Rowing Intervals', 5, '1 minute'),
      gymExercise('Intermediate', 'fri', 'assault-bike', 'Assault Bike', 5, '1 minute'),
      gymExercise('Intermediate', 'fri', 'stair-climber', 'Stair Climber', 1, '10–15 minutes'),
      gymExercise('Intermediate', 'fri', 'battle-ropes', 'Battle Ropes', 4, '30 seconds'),
    ] },
    { title: 'Mobility', focus: 'Mobility', category: 'Mobility', exercises: [
      gymExercise('Intermediate', 'sat', '90-90-hip-rotation', '90/90 Hip Rotation', 2, '8 reps/side'),
      gymExercise('Intermediate', 'sat', 'worlds-greatest-stretch', "World's Greatest Stretch", 2, '5 reps/side'),
      gymExercise('Intermediate', 'sat', 'thoracic-rotation', 'Thoracic Rotation', 2, '10 reps/side'),
      gymExercise('Intermediate', 'sat', 'deep-squat-hold', 'Deep Squat Hold', 2, '30 seconds'),
    ] },
    { title: 'Complete Rest', focus: 'Rest', category: 'Rest', exercises: [] },
  ],
  Advanced: [
    { title: 'Upper Body', focus: 'Upper Body', category: 'Strength', exercises: [
      gymExercise('Advanced', 'mon', 'barbell-bench-press', 'Barbell Bench Press', 4, '6–8 reps'),
      gymExercise('Advanced', 'mon', 'weighted-pull-ups', 'Weighted Pull-ups', 4, '6–8 reps'),
      gymExercise('Advanced', 'mon', 'barbell-row', 'Barbell Row', 4, '6–8 reps'),
      gymExercise('Advanced', 'mon', 'overhead-barbell-press', 'Overhead Barbell Press', 3, '6–8 reps'),
    ] },
    { title: 'Lower Body', focus: 'Lower Body', category: 'Strength', exercises: [
      gymExercise('Advanced', 'tue', 'barbell-back-squat', 'Barbell Back Squat', 4, '5–8 reps'),
      gymExercise('Advanced', 'tue', 'romanian-deadlift', 'Romanian Deadlift', 4, '6–8 reps'),
      gymExercise('Advanced', 'tue', 'bulgarian-split-squat', 'Bulgarian Split Squat', 3, '8–10 reps/leg'),
      gymExercise('Advanced', 'tue', 'barbell-hip-thrust', 'Barbell Hip Thrust', 3, '8–10 reps'),
    ] },
    { title: 'Recovery', focus: 'Recovery', category: 'Recovery', exercises: [
      gymExercise('Advanced', 'wed', 'low-intensity-cycling', 'Low-Intensity Cycling', 1, '20 minutes'),
      gymExercise('Advanced', 'wed', 'incline-treadmill-walk', 'Incline Treadmill Walk', 1, '15 minutes'),
      gymExercise('Advanced', 'wed', '90-90-hip-flow', '90/90 Hip Flow', 2, '10 reps/side'),
      gymExercise('Advanced', 'wed', 'thoracic-mobility', 'Thoracic Mobility', 2, '10 reps/side'),
    ] },
    { title: 'Full Body', focus: 'Full Body', category: 'Strength', exercises: [
      gymExercise('Advanced', 'thu', 'barbell-squat', 'Barbell Squat', 4, '5–8 reps'),
      gymExercise('Advanced', 'thu', 'deadlift', 'Deadlift', 3, '5–6 reps'),
      gymExercise('Advanced', 'thu', 'barbell-bench-press', 'Barbell Bench Press', 4, '6–8 reps'),
      gymExercise('Advanced', 'thu', 'weighted-pull-ups', 'Weighted Pull-ups', 3, '6–8 reps'),
    ] },
    { title: 'Conditioning', focus: 'Conditioning', category: 'Conditioning', exercises: [
      gymExercise('Advanced', 'fri', 'treadmill-sprint', 'Treadmill Sprint', 6, '20–30 seconds'),
      gymExercise('Advanced', 'fri', 'assault-bike-sprint', 'Assault Bike Sprint', 6, '20–30 seconds'),
      gymExercise('Advanced', 'fri', 'sled-push', 'Sled Push', 5, '20–30 metres'),
      gymExercise('Advanced', 'fri', 'battle-ropes', 'Battle Ropes', 5, '30 seconds'),
    ] },
    { title: 'Mobility', focus: 'Mobility', category: 'Mobility', exercises: [
      gymExercise('Advanced', 'sat', 'deep-squat-hold', 'Deep Squat Hold', 3, '30–45 seconds'),
      gymExercise('Advanced', 'sat', '90-90-hip-flow', '90/90 Hip Flow', 3, '10 reps/side'),
      gymExercise('Advanced', 'sat', 'couch-stretch', 'Couch Stretch', 2, '45 seconds/side'),
      gymExercise('Advanced', 'sat', 'thoracic-rotation', 'Thoracic Rotation', 3, '10 reps/side'),
    ] },
    { title: 'Complete Rest', focus: 'Rest', category: 'Rest', exercises: [] },
  ],
}

export const WEEKLY_WORKOUTS = {
  gym: GYM_WORKOUTS.Beginner,
  home: [
    { title: 'Upper body strength', focus: 'Upper body', exercises: [
      exercise('home-mon-incline-pushup', 'Incline push-up', 3, '8–12', 'Use a sturdy counter or wall and keep your body in one line.'),
      exercise('home-mon-backpack-row', 'Backpack row', 3, '10 each side', 'Use a lightly loaded backpack and support yourself with your free hand.'),
      exercise('home-mon-shoulder-tap', 'Kneeling shoulder tap', 3, '10 each side', 'Move slowly and keep your hips as steady as possible.'),
      exercise('home-mon-chair-dip', 'Chair triceps press-back', 3, '8–10', 'Keep the movement small and skip it if your shoulders feel uncomfortable.'),
    ] },
    { title: 'Lower body strength', focus: 'Lower body', exercises: [
      exercise('home-tue-chair-squat', 'Chair squat', 3, '12', 'Tap a sturdy chair lightly, then stand tall.'),
      exercise('home-tue-glute-bridge', 'Glute bridge', 3, '12', 'Press through your feet and pause gently at the top.'),
      exercise('home-tue-reverse-lunge', 'Supported reverse lunge', 3, '8 each side', 'Hold a wall or chair for balance if helpful.'),
      exercise('home-tue-calf-raise', 'Calf raise', 3, '15', 'Use a wall for support and move through a comfortable range.'),
    ] },
    { title: 'Active recovery', focus: 'Recovery', exercises: [
      cardio('home-wed-walk', 'Easy neighborhood walk', '20 min', 'Choose a relaxed pace and a route that feels comfortable.'),
      cardio('home-wed-mobility', 'Gentle mobility flow', '10 min', 'Move gently through hips, shoulders and upper back.'),
    ] },
    { title: 'Full body basics', focus: 'Full body', exercises: [
      exercise('home-thu-squat', 'Bodyweight squat', 3, '10–12', 'Keep your weight balanced across your feet.'),
      exercise('home-thu-pushup', 'Wall push-up', 3, '10–12', 'Stand at a comfortable distance and keep your body aligned.'),
      exercise('home-thu-backpack-row', 'Backpack row', 3, '10 each side', 'Use a light backpack and a slow, controlled pull.'),
      exercise('home-thu-march', 'Brisk march in place', 1, '', 'Stay light on your feet and march at a comfortable pace.', '8 min'),
    ] },
    { title: 'Conditioning & core', focus: 'Conditioning', exercises: [
      cardio('home-fri-march', 'Low-impact march', '12 min', 'Alternate a brisk minute with an easy minute.'),
      exercise('home-fri-deadbug', 'Dead bug', 3, '8 each side', 'Keep your lower back comfortably supported as you move.'),
      exercise('home-fri-plank', 'Kneeling plank', 3, '20 sec hold', 'Keep your body long and stop if your lower back feels strained.'),
    ] },
    { title: 'Mobility & core', focus: 'Mobility', exercises: [
      cardio('home-sat-yoga', 'Easy yoga flow', '15 min', 'Choose gentle movements and skip any pose that causes discomfort.'),
      exercise('home-sat-bird-dog', 'Bird dog', 3, '8 each side', 'Reach long in both directions while keeping your hips level.'),
      cardio('home-sat-stretch', 'Stretch and reset', '8 min', 'Finish with gentle stretches that feel comfortable.'),
    ] },
    { title: 'Rest & reset', focus: 'Rest day', exercises: [] },
  ],
}