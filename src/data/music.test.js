import test from 'node:test'
import assert from 'node:assert/strict'
import { MUSIC_CATEGORIES, MUSIC_PLATFORMS, MUSIC_PLAYLISTS, getMusicSearchUrl } from './music.js'
import { readLocalJson, SESSION_STORAGE_KEY, writeLocalJson } from '../utils/localStorage.js'

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  }
}

test('music catalog includes each requested category and searchable platform option', () => {
  assert.equal(MUSIC_CATEGORIES.length, 6)
  assert.equal(MUSIC_PLATFORMS.length, 3)
  assert.equal(MUSIC_PLAYLISTS.length, 18)
  assert.equal(new Set(MUSIC_PLAYLISTS.map(({ categoryId }) => categoryId)).size, 6)

  const urls = MUSIC_PLAYLISTS.map(({ platformId, category }) => getMusicSearchUrl(platformId, category))
  assert.equal(urls.length, 18)
  assert.ok(urls.every((url) => /^https:\/\/(open\.spotify\.com\/search\/|music\.apple\.com\/us\/search\?term=|music\.youtube\.com\/search\?q=)/.test(url)))
})

test('music favorites persist while remaining isolated per account', () => {
  const storage = createStorage({ [SESSION_STORAGE_KEY]: JSON.stringify({ userId: 'account-a' }) })
  globalThis.window = { localStorage: storage }

  assert.equal(writeLocalJson('fitlife.music-favorites.v1', ['motivation-spotify']), true)
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ userId: 'account-b' }))
  assert.deepEqual(readLocalJson('fitlife.music-favorites.v1', []), [])
  assert.equal(writeLocalJson('fitlife.music-favorites.v1', ['recovery-apple-music']), true)
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ userId: 'account-a' }))
  assert.deepEqual(readLocalJson('fitlife.music-favorites.v1', []), ['motivation-spotify'])
})
