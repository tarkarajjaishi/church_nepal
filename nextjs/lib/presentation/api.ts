'use client'

/**
 * Presentation & Worship Display client API.
 *
 * The live state is versioned in the database and clients long-poll
 * `/presentation/live/watch` with the version they hold. That is deliberate on
 * the server side (see handlers/presentation_live.rs) and it means a display
 * recovers from a dropped connection by simply calling again — there is no
 * reconnect logic here to get wrong.
 */

import api from '@/lib/api'

// --- types ------------------------------------------------------------------

export interface Song {
  id: string
  title: string
  artist: string
  author: string
  album: string
  language: string
  category: string
  songKey: string
  alternateKeys: string
  tempo: string
  bpm: number | null
  timeSignature: string
  ccliNumber: string
  copyright: string
  lyrics: string
  chords: string
  notes: string
  tags: string[]
  isFavourite: boolean
  isArchived: boolean
  useCount: number
  lastUsedAt: string | null
  updatedAt: string
}

export interface SongPage {
  data: Song[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface PresentationTheme {
  id: string
  name: string
  slug: string
  fontFamily: string
  fontSize: number
  textColor: string
  backgroundColor: string
  backgroundImage: string
  textAlign: string
  verticalAlign: string
  textEffects: Record<string, unknown>
  transition: string
  isDefault: boolean
}

export type SlideType =
  | 'text' | 'lyrics' | 'bible' | 'image' | 'video' | 'countdown'
  | 'announcement' | 'blank' | 'logo' | 'quote' | 'offering' | 'welcome'

export interface Slide {
  id: string
  presentationId: string
  sortOrder: number
  slideType: SlideType
  label: string
  title: string
  body: string
  reference: string
  mediaUrl: string
  backgroundUrl: string
  backgroundColor: string
  settings: Record<string, unknown>
  notes: string
  durationSeconds: number | null
}

export interface PresentationRow {
  id: string
  title: string
  kind: string
  description: string
  songId: string | null
  themeId: string | null
  tags: string[]
  isArchived: boolean
  useCount: number
  lastUsedAt: string | null
  slideCount: number
  updatedAt: string
}

/**
 * The API flattens the presentation into the top level with
 * `#[serde(flatten)]`, so this is `Presentation & { slides, theme }` rather
 * than a `{ presentation, slides }` wrapper. Typing it as a wrapper made
 * `res.presentation.title` compile and then read undefined at runtime.
 */
export interface PresentationWithSlides extends Omit<PresentationRow, 'slideCount'> {
  slides: Slide[]
  theme: PresentationTheme | null
  slideCount?: number
}

export interface Playlist {
  id: string
  name: string
  serviceDate: string | null
  serviceTime: string | null
  serviceName: string
  operator: string
  notes: string
  status: string
  isTemplate: boolean
  createdBy: string
  updatedAt: string
}

export interface PlaylistItem {
  id: string
  playlistId: string
  sortOrder: number
  itemKind: string
  presentationId: string | null
  title: string
  settings: Record<string, unknown>
  plannedSeconds: number | null
  notes: string
  slideCount: number | null
}

/**
 * Flattened like the other composite responses — the playlist fields are at
 * the top level alongside `items`, with no `.playlist` wrapper.
 *
 * All four composite types in this module flatten (presentation, playlist,
 * display status, live frame's state is the exception). Assume flat unless the
 * Rust struct says otherwise.
 */
export interface PlaylistWithItems extends Playlist {
  items: PlaylistItem[]
  plannedTotalSeconds: number
}

export interface Display {
  id: string
  name: string
  slug: string
  displayKind: string
  resolution: string
  orientation: string
  aspectRatio: string
  showsNotes: boolean
  showsNextSlide: boolean
  isStreamOutput: boolean
  themeId: string | null
  isEnabled: boolean
  lastSeenAt: string | null
}

/**
 * Also flattened by the API (`#[serde(flatten)]` on DisplayStatus.display),
 * so the display fields sit at the top level next to the derived connection
 * state — there is no `.display` wrapper to read through.
 */
export type Connection = 'online' | 'stale' | 'offline'

export interface DisplayStatus extends Display {
  connection: Connection
  secondsSinceSeen: number | null
}

export type ScreenMode = 'normal' | 'black' | 'logo' | 'blank' | 'freeze'

export interface LiveState {
  version: number
  isLive: boolean
  playlistId: string | null
  playlistItemId: string | null
  presentationId: string | null
  slideId: string | null
  slideIndex: number
  screenMode: ScreenMode
  countdownTarget: string | null
  countdownMessage: string
  countdownPausedSeconds: number | null
  lowerThirdTitle: string
  lowerThirdSubtitle: string
  lowerThirdVisible: boolean
  operator: string
  startedAt: string | null
  updatedAt: string
}

/**
 * Flattened, like every other composite response in this module: the live
 * state fields sit at the top level, not under `.state`.
 *
 * Every composite type here uses `#[serde(flatten)]` — presentation, playlist,
 * display status and this one. Assume flat, and check the Rust struct before
 * assuming otherwise.
 */
export interface LiveFrame extends LiveState {
  currentSlide: Slide | null
  nextSlide: Slide | null
  presentationTitle: string | null
  theme: PresentationTheme | null
  slideTotal: number
}

// --- calls ------------------------------------------------------------------

const qs = (o: Record<string, unknown>) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const presentationApi = {
  // Songs
  songs: async (f: {
    search?: string; language?: string; category?: string; tag?: string
    favourite?: boolean; archived?: boolean; sort?: string; page?: number; perPage?: number
  } = {}): Promise<SongPage> =>
    (
      await api.get(
        `/songs${qs({
          search: f.search, language: f.language, category: f.category, tag: f.tag,
          favourite: f.favourite, archived: f.archived, sort: f.sort,
          page: f.page, per_page: f.perPage,
        })}`
      )
    ).data,

  song: async (id: string): Promise<Song> => (await api.get(`/songs/${id}`)).data,

  createSong: async (b: Record<string, unknown>): Promise<Song> =>
    (await api.post('/songs', b)).data,

  updateSong: async (id: string, b: Record<string, unknown>): Promise<Song> =>
    (await api.put(`/songs/${id}`, b)).data,

  deleteSong: async (id: string) => (await api.delete(`/songs/${id}`)).data,

  /** Preview how lyrics will split into slides, without creating anything. */
  songSlidePreview: async (id: string, maxLines?: number): Promise<{ slides: string[] }> =>
    (await api.get(`/songs/${id}/slide-preview${qs({ max_lines: maxLines })}`)).data,

  // Themes
  themes: async (): Promise<PresentationTheme[]> => (await api.get('/presentation-themes')).data,

  // Presentations
  presentations: async (f: { search?: string; kind?: string; archived?: boolean } = {}): Promise<PresentationRow[]> =>
    (await api.get(`/presentations${qs(f)}`)).data,

  presentation: async (id: string): Promise<PresentationWithSlides> =>
    (await api.get(`/presentations/${id}`)).data,

  createPresentation: async (b: Record<string, unknown>): Promise<PresentationRow> =>
    (await api.post('/presentations', b)).data,

  deletePresentation: async (id: string) => (await api.delete(`/presentations/${id}`)).data,

  presentationFromSong: async (b: {
    song_id: string; theme_id?: string; max_lines?: number; presentation_id?: string
  }): Promise<PresentationWithSlides> => (await api.post('/presentations/from-song', b)).data,

  addSlide: async (presentationId: string, b: Record<string, unknown>): Promise<Slide> =>
    (await api.post(`/presentations/${presentationId}/slides`, b)).data,

  updateSlide: async (slideId: string, b: Record<string, unknown>): Promise<Slide> =>
    (await api.put(`/slides/${slideId}`, b)).data,

  deleteSlide: async (slideId: string) => (await api.delete(`/slides/${slideId}`)).data,

  reorderSlides: async (presentationId: string, ids: string[]) =>
    (await api.put(`/presentations/${presentationId}/slides/reorder`, { ids })).data,

  // Playlists
  playlists: async (): Promise<Playlist[]> => (await api.get('/playlists')).data,

  playlist: async (id: string): Promise<PlaylistWithItems> => (await api.get(`/playlists/${id}`)).data,

  createPlaylist: async (b: Record<string, unknown>): Promise<Playlist> =>
    (await api.post('/playlists', b)).data,

  updatePlaylist: async (id: string, b: Record<string, unknown>): Promise<Playlist> =>
    (await api.put(`/playlists/${id}`, b)).data,

  deletePlaylist: async (id: string) => (await api.delete(`/playlists/${id}`)).data,

  /**
   * The endpoint deserialises an UpsertPlaylist, so a body with `name` is
   * mandatory — posting `{}` is a 422. A blank name makes the server derive
   * one from the source playlist.
   */
  duplicatePlaylist: async (id: string, name = ''): Promise<PlaylistWithItems> =>
    (await api.post(`/playlists/${id}/duplicate`, { name })).data,

  addPlaylistItem: async (playlistId: string, b: Record<string, unknown>): Promise<PlaylistItem> =>
    (await api.post(`/playlists/${playlistId}/items`, b)).data,

  reorderPlaylistItems: async (playlistId: string, ids: string[]) =>
    (await api.put(`/playlists/${playlistId}/items/reorder`, { ids })).data,

  deletePlaylistItem: async (id: string) => (await api.delete(`/playlist-items/${id}`)).data,

  // Displays
  displays: async (): Promise<DisplayStatus[]> => (await api.get('/displays')).data,

  createDisplay: async (b: Record<string, unknown>): Promise<Display> =>
    (await api.post('/displays', b)).data,

  updateDisplay: async (id: string, b: Record<string, unknown>): Promise<Display> =>
    (await api.put(`/displays/${id}`, b)).data,

  deleteDisplay: async (id: string) => (await api.delete(`/displays/${id}`)).data,

  // Live
  dashboard: async () => (await api.get('/presentation/dashboard')).data,

  live: async (): Promise<LiveFrame> => (await api.get('/presentation/live')).data,

  go: async (b: {
    playlist_id?: string; playlist_item_id?: string; presentation_id?: string; slide_index?: number
  }): Promise<LiveFrame> => (await api.post('/presentation/live/go', b)).data,

  stop: async (): Promise<LiveFrame> => (await api.post('/presentation/live/stop', {})).data,

  step: async (direction: 'next' | 'prev'): Promise<LiveFrame> =>
    (await api.post(`/presentation/live/step/${direction}`, {})).data,

  goto: async (b: { slide_index?: number; slide_id?: string }): Promise<LiveFrame> =>
    (await api.post('/presentation/live/goto', b)).data,

  screen: async (mode: ScreenMode): Promise<LiveFrame> =>
    (await api.post('/presentation/live/screen', { mode })).data,

  countdown: async (b: { seconds?: number; target?: string; message?: string }): Promise<LiveFrame> =>
    (await api.post('/presentation/live/countdown', b)).data,

  countdownToggle: async (): Promise<LiveFrame> =>
    (await api.post('/presentation/live/countdown/toggle', {})).data,

  lowerThird: async (b: { title?: string; subtitle?: string; visible?: boolean }): Promise<LiveFrame> =>
    (await api.post('/presentation/live/lower-third', b)).data,
}

// --- display-side watch -----------------------------------------------------

/**
 * Long-poll the public live endpoint.
 *
 * Uses plain fetch, not the axios client: a display device is not logged in,
 * and the axios 401 interceptor would bounce it to /admin/login. It also must
 * NOT camelCase-convert twice, so the raw JSON is normalised here.
 */
export async function watchLive(opts: {
  version: number
  displaySlug?: string
  timeoutMs?: number
  origin: string
  signal?: AbortSignal
}): Promise<LiveFrame> {
  const p = new URLSearchParams({ version: String(opts.version) })
  if (opts.displaySlug) p.set('display', opts.displaySlug)
  p.set('timeout_ms', String(opts.timeoutMs ?? 25_000))

  const res = await fetch(`${opts.origin}/api/presentation/live/watch?${p}`, {
    signal: opts.signal,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`watch failed: HTTP ${res.status}`)
  return camel(await res.json()) as LiveFrame
}

/** snake_case -> camelCase, matching what lib/api.ts does for the admin client. */
function camel(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(camel)
  if (v !== null && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, val]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        camel(val),
      ])
    )
  }
  return v
}

// --- display helpers --------------------------------------------------------

export const SLIDE_TYPES: { value: SlideType; label: string }[] = [
  { value: 'lyrics', label: 'Lyrics' },
  { value: 'bible', label: 'Bible Verse' },
  { value: 'text', label: 'Text' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'countdown', label: 'Countdown' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'quote', label: 'Quote' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'offering', label: 'Offering' },
  { value: 'logo', label: 'Logo' },
  { value: 'blank', label: 'Blank' },
]

export const SCREEN_MODES: { value: ScreenMode; label: string; key: string }[] = [
  { value: 'normal', label: 'Live', key: 'N' },
  { value: 'black', label: 'Black', key: 'B' },
  { value: 'logo', label: 'Logo', key: 'L' },
  { value: 'blank', label: 'Blank', key: 'W' },
  { value: 'freeze', label: 'Freeze', key: 'F' },
]

/** Seconds to m:ss, for countdowns and planned durations. */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`
}
