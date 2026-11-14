import assert from 'node:assert/strict'
import test from 'node:test'
import { EQUIPMENT_ALTERNATIVE_NAMES } from './equipment.js'
import { GYM_WORKOUTS, WEEKLY_WORKOUTS } from './workouts.js'
import { EXERCISE_VIDEO_LIBRARY, getExerciseVideoUrl } from './exerciseVideos.js'

const libraryByName = new Map(EXERCISE_VIDEO_LIBRARY.map((exercise) => [exercise.name.toLocaleLowerCase(), exercise]))

test('every gym and home workout exercise has a YouTube demonstration search link', () => {
  const workoutExercises = [
    ...Object.values(GYM_WORKOUTS).flatMap((plans) => plans.flatMap(({ exercises }) => exercises)),
    ...WEEKLY_WORKOUTS.home.flatMap(({ exercises }) => exercises),
  ]

  for (const exercise of workoutExercises) {
    const video = libraryByName.get(exercise.name.toLocaleLowerCase())
    assert.ok(video, `${exercise.name} is in the video library`)
    assert.match(video.videoUrl, /^https:\/\/www\.youtube\.com\/results\?search_query=/)
    assert.ok(video.sources.includes(exercise.id.startsWith('home-') ? 'home' : 'gym'))
    assert.ok(video.description)
  }
  assert.equal(libraryByName.get('dead bug').description, 'Keep your lower back comfortably supported as you move.')
})

test('configured equipment alternatives have video links and are labeled as alternatives', () => {
  for (const name of EQUIPMENT_ALTERNATIVE_NAMES) {
    const video = libraryByName.get(name.toLocaleLowerCase())
    assert.ok(video, `${name} is in the video library`)
    assert.ok(video.sources.includes('alternative'))
  }
})

test('YouTube searches encode exercise names without inventing video IDs', () => {
  assert.equal(
    getExerciseVideoUrl('World’s Greatest Stretch'),
    `https://www.youtube.com/results?search_query=${encodeURIComponent('World’s Greatest Stretch exercise demonstration proper form')}`,
  )
  assert.ok(EXERCISE_VIDEO_LIBRARY.every(({ videoUrl }) => !/youtube\.com\/watch|youtu\.be\//.test(videoUrl)))
})
