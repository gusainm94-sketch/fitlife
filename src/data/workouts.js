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

export const WEEKLY_WORKOUTS = {
  gym: [
    { title: 'Upper body strength', focus: 'Upper body', exercises: [
      exercise('gym-mon-chest-press', 'Machine chest press', 3, '10–12', 'Press with control and keep your shoulders relaxed.'),
      exercise('gym-mon-lat-pulldown', 'Lat pulldown', 3, '10–12', 'Pull the bar toward your upper chest without leaning back.'),
      exercise('gym-mon-seated-row', 'Seated cable row', 3, '12', 'Draw your elbows back and gently squeeze your shoulder blades.'),
      exercise('gym-mon-shoulder-press', 'Dumbbell shoulder press', 3, '10', 'Use a comfortable weight and keep your core braced.'),
    ] },
    { title: 'Lower body strength', focus: 'Lower body', exercises: [
      exercise('gym-tue-leg-press', 'Leg press', 3, '12', 'Lower only as far as you can keep your back supported.'),
      exercise('gym-tue-rdl', 'Dumbbell Romanian deadlift', 3, '10', 'Hinge at the hips and keep a soft bend in your knees.'),
      exercise('gym-tue-leg-curl', 'Seated leg curl', 3, '12', 'Move steadily and pause briefly at the curl.'),
      exercise('gym-tue-calf-raise', 'Standing calf raise', 3, '15', 'Rise smoothly, pause, then lower your heels with control.'),
    ] },
    { title: 'Active recovery', focus: 'Recovery', exercises: [
      cardio('gym-wed-walk', 'Easy treadmill walk', '20 min', 'Keep the pace comfortable enough to hold a conversation.'),
      cardio('gym-wed-mobility', 'Full-body mobility', '10 min', 'Move gently through hips, shoulders and upper back.'),
    ] },
    { title: 'Full body basics', focus: 'Full body', exercises: [
      exercise('gym-thu-goblet-squat', 'Goblet squat', 3, '10', 'Keep your chest lifted and knees tracking over your toes.'),
      exercise('gym-thu-incline-press', 'Incline dumbbell press', 3, '10', 'Use a smooth range of motion and avoid locking your elbows.'),
      exercise('gym-thu-cable-row', 'Cable row', 3, '12', 'Sit tall and bring the handle toward your waist.'),
      cardio('gym-thu-bike', 'Stationary bike', '12 min', 'Choose a steady, moderate effort.'),
    ] },
    { title: 'Conditioning & core', focus: 'Conditioning', exercises: [
      cardio('gym-fri-bike', 'Stationary bike intervals', '18 min', 'Alternate 1 minute brisk with 2 minutes easy.'),
      exercise('gym-fri-kettlebell', 'Kettlebell deadlift', 3, '12', 'Hinge at the hips; choose a light, manageable weight.'),
      exercise('gym-fri-plank', 'Forearm plank', 3, '25 sec hold', 'Keep your body long and stop if your lower back feels strained.'),
    ] },
    { title: 'Mobility & core', focus: 'Mobility', exercises: [
      cardio('gym-sat-elliptical', 'Easy elliptical', '10 min', 'Warm up at a relaxed pace.'),
      exercise('gym-sat-cable-chop', 'Light cable wood chop', 3, '10 each side', 'Rotate through your upper body with a light load.'),
      cardio('gym-sat-stretch', 'Stretch and reset', '12 min', 'Finish with gentle stretches that feel comfortable.'),
    ] },
    { title: 'Rest & reset', focus: 'Rest day', exercises: [] },
  ],
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