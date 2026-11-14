export const MUSIC_CATEGORIES = [
  { id: 'motivation', name: 'Motivation', description: 'High-energy picks to help you find your focus and keep moving.' },
  { id: 'heavy-lifting', name: 'Heavy Lifting', description: 'Powerful beats for strength sessions and focused sets.' },
  { id: 'cardio-running', name: 'Cardio and Running', description: 'Steady rhythms for runs, rides, and cardio sessions.' },
  { id: 'hiit', name: 'HIIT Workouts', description: 'Up-tempo sounds for intervals and fast-paced circuits.' },
  { id: 'recovery', name: 'Recovery', description: 'Calmer listening for cooldowns and post-workout recovery.' },
  { id: 'yoga-mobility', name: 'Yoga and Mobility', description: 'Relaxed selections for stretching, yoga, and mobility work.' },
]

export const MUSIC_PLATFORMS = [
  { id: 'spotify', name: 'Spotify' },
  { id: 'apple-music', name: 'Apple Music' },
  { id: 'youtube-music', name: 'YouTube Music' },
]

export function getMusicSearchUrl(platformId, categoryName) {
  const query = encodeURIComponent(`${categoryName} workout playlist`)
  if (platformId === 'spotify') return `https://open.spotify.com/search/${query}`
  if (platformId === 'apple-music') return `https://music.apple.com/us/search?term=${query}`
  if (platformId === 'youtube-music') return `https://music.youtube.com/search?q=${query}`
  throw new RangeError(`Unknown music platform: ${platformId}`)
}

export const MUSIC_PLAYLISTS = MUSIC_CATEGORIES.flatMap((category) => MUSIC_PLATFORMS.map((platform) => ({
  id: `${category.id}-${platform.id}`,
  name: `${category.name} Workout Mix`,
  categoryId: category.id,
  category: category.name,
  platformId: platform.id,
  platform: platform.name,
  description: `Find ${category.name.toLowerCase()} playlists on ${platform.name}.`,
})))
