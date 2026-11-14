import { useState } from 'react'
import { Bookmark, BookmarkCheck, ExternalLink, Music2 } from 'lucide-react'
import { MUSIC_CATEGORIES, MUSIC_PLAYLISTS, getMusicSearchUrl } from '../data/music.js'
import { readLocalJson, writeLocalJson } from '../utils/localStorage.js'
import './MusicPage.css'

const MUSIC_FAVORITES_STORAGE_KEY = 'fitlife.music-favorites.v1'

function loadFavorites() {
  const stored = readLocalJson(MUSIC_FAVORITES_STORAGE_KEY, [])
  return Array.isArray(stored) ? stored.filter((favorite) => typeof favorite === 'string') : []
}

function PlaylistCard({ playlist, isFavorite, onToggleFavorite }) {
  return (
    <article className="music-playlist-card">
      <div className={`music-platform-mark ${playlist.platformId}`} aria-hidden="true"><Music2 size={18} /></div>
      <div className="music-playlist-copy">
        <p className="music-playlist-category">{playlist.category}</p>
        <h3>{playlist.name}</h3>
        <p className="music-playlist-description">{playlist.description}</p>
        <span className="music-platform-name">{playlist.platform}</span>
      </div>
      <button
        className={`music-favorite-button${isFavorite ? ' saved' : ''}`}
        type="button"
        aria-label={`${isFavorite ? 'Remove' : 'Save'} ${playlist.name} on ${playlist.platform} ${isFavorite ? 'from' : 'to'} favorites`}
        aria-pressed={isFavorite}
        onClick={() => onToggleFavorite(playlist.id)}
      >
        {isFavorite ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
      </button>
      <a
        className="music-listen-button"
        href={getMusicSearchUrl(playlist.platformId, playlist.category)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Listen Now: search ${playlist.category} playlists on ${playlist.platform}`}
      >
        Listen Now <ExternalLink size={14} />
      </a>
    </article>
  )
}

export default function MusicPage() {
  const [favorites, setFavorites] = useState(loadFavorites)
  const [showFavorites, setShowFavorites] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const favoriteSet = new Set(favorites)
  const visiblePlaylists = MUSIC_PLAYLISTS.filter((playlist) => !showFavorites || favoriteSet.has(playlist.id))

  function toggleFavorite(playlistId) {
    const nextFavorites = favoriteSet.has(playlistId)
      ? favorites.filter((favorite) => favorite !== playlistId)
      : [...favorites, playlistId]
    if (!writeLocalJson(MUSIC_FAVORITES_STORAGE_KEY, nextFavorites)) {
      setSaveError(true)
      return
    }
    setSaveError(false)
    setFavorites(nextFavorites)
  }

  return (
    <section className="page-content music-page">
      <header className="workout-page-heading">
        <div>
          <p className="eyebrow">Find your workout rhythm</p>
          <h1>Gym music</h1>
          <p className="workout-page-subtitle">Explore playlists for every part of your training, on the music service you use.</p>
        </div>
      </header>

      <div className="music-intro panel">
        <div className="music-intro-icon"><Music2 size={20} /></div>
        <div>
          <strong>Soundtrack your session</strong>
          <p>Choose a category and open its playlist search on Spotify, Apple Music, or YouTube Music. Playback happens on the music service.</p>
        </div>
      </div>

      <div className="music-library-toolbar">
        <div>
          <h2>{showFavorites ? 'Saved playlists' : 'Browse by workout'}</h2>
          <p>{showFavorites ? `${favorites.length} saved` : 'Choose a service to find a playlist that fits your session.'}</p>
        </div>
        <button className={`music-filter-button${showFavorites ? ' active' : ''}`} type="button" aria-pressed={showFavorites} onClick={() => setShowFavorites((current) => !current)}>
          <Bookmark size={15} /> {showFavorites ? 'Browse all' : 'Saved playlists'}{favorites.length > 0 && <span>{favorites.length}</span>}
        </button>
      </div>

      {saveError && <p className="music-save-error" role="alert">Unable to save favorites. Check browser storage and try again.</p>}

      {showFavorites && favorites.length === 0 ? (
        <div className="music-empty panel">
          <Bookmark size={20} />
          <h3>No saved playlists yet</h3>
          <p>Save a playlist with the bookmark button and it will appear here.</p>
        </div>
      ) : MUSIC_CATEGORIES.map((category) => {
        const categoryPlaylists = visiblePlaylists.filter((playlist) => playlist.categoryId === category.id)
        if (!categoryPlaylists.length) return null
        return (
          <section className="music-category-section" key={category.id} aria-labelledby={`music-category-${category.id}`}>
            <header className="music-category-heading">
              <div><h2 id={`music-category-${category.id}`}>{category.name}</h2><p>{category.description}</p></div>
              <span>{categoryPlaylists.length} {categoryPlaylists.length === 1 ? 'option' : 'options'}</span>
            </header>
            <div className="music-playlist-grid">
              {categoryPlaylists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} isFavorite={favoriteSet.has(playlist.id)} onToggleFavorite={toggleFavorite} />
              ))}
            </div>
          </section>
        )
      })}
    </section>
  )
}
