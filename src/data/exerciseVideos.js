import { EQUIPMENT_ALTERNATIVE_NAMES } from './equipment.js'
import { GYM_WORKOUTS, WEEKLY_WORKOUTS } from './workouts.js'

export function getExerciseVideoUrl(exerciseName) {
  const query = encodeURIComponent(`${exerciseName} exercise demonstration proper form`)
  return `https://www.youtube.com/results?search_query=${query}`
}

function createExerciseVideoLibrary() {
  const exercises = new Map()
  const addExercise = (exercise, source) => {
    const key = exercise.name.toLocaleLowerCase()
    const existing = exercises.get(key)
    if (existing) {
      existing.sources.add(source)
      if (!existing.description && exercise.description) existing.description = exercise.description
      return
    }

    exercises.set(key, {
      id: key,
      name: exercise.name,
      description: exercise.description || '',
      sources: new Set([source]),
      videoUrl: getExerciseVideoUrl(exercise.name),
    })
  }

  Object.values(GYM_WORKOUTS).flat().forEach(({ exercises: planExercises }) => {
    planExercises.forEach((exercise) => addExercise(exercise, 'gym'))
  })
  WEEKLY_WORKOUTS.home.flat().forEach(({ exercises: planExercises }) => {
    planExercises.forEach((exercise) => addExercise(exercise, 'home'))
  })
  EQUIPMENT_ALTERNATIVE_NAMES.forEach((name) => addExercise({ name }, 'alternative'))

  return [...exercises.values()].map((exercise) => ({
    ...exercise,
    description: exercise.description || `Review the setup and form cues for ${exercise.name}; use controlled movement in a comfortable range.`,
    sources: [...exercise.sources],
  }))
}

export const EXERCISE_VIDEO_LIBRARY = createExerciseVideoLibrary()
