'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Music, Plus, Search, Star, Trash2, X, Save, Presentation, Loader2,
} from 'lucide-react'
import { presentationApi, type Song } from '@/lib/presentation/api'
import {
  CARD, PageHeader, EmptyState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

const LANGUAGES = ['Nepali', 'English', 'Hindi', 'Mixed']
const CATEGORIES = ['Worship', 'Praise', 'Hymn', 'Christmas', 'Easter', 'Communion', 'Youth', 'Children']
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm']

const EMPTY = {
  title: '', artist: '', author: '', language: 'Nepali', category: 'Worship',
  songKey: '', bpm: '', timeSignature: '4/4', ccliNumber: '', copyright: '', lyrics: '', notes: '',
}

export default function SongLibraryPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [language, setLanguage] = useState('')
  const [editing, setEditing] = useState<Song | 'new' | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['songs', search, language],
    queryFn: () => presentationApi.songs({ search: search || undefined, language: language || undefined, perPage: 100 }),
    placeholderData: (p) => p,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['songs'] })
    qc.invalidateQueries({ queryKey: ['songs-count'] })
  }

  const favourite = useMutation({
    mutationFn: (s: Song) => presentationApi.updateSong(s.id, { title: s.title, is_favourite: !s.isFavourite }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => presentationApi.deleteSong(id),
    onSuccess: () => { invalidate(); toast.success('Song deleted') },
    onError: (e: Error) => toast.error(e.message),
  })

  // Building a presentation from a song is the action an operator wants most
  // from this page, so it lives on the row rather than behind an edit screen.
  const buildDeck = useMutation({
    mutationFn: (s: Song) => presentationApi.presentationFromSong({ song_id: s.id }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['presentations'] })
      toast.success(`Built ${res.slides.length} slides from "${res.title}"`)
    },
    onError: (e: Error) => toast.error(e.message || 'Could not build slides'),
  })

  const songs = data?.data ?? []

  return (
    <>
      <PageHeader
        title="Song Library"
        subtitle={data ? `${data.total} song${data.total === 1 ? '' : 's'}` : undefined}
        actions={
          <button type="button" onClick={() => setEditing('new')} className={btn.primary}>
            <Plus className="size-4" aria-hidden />
            Add Song
          </button>
        }
      />

      <div className={`${CARD} p-3 sm:p-4 mb-4 flex flex-wrap items-center gap-2`}>
        <form
          className="relative flex-1 min-w-[14rem]"
          onSubmit={(e) => { e.preventDefault(); setSearch(searchDraft) }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
          <input
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search title, artist or lyrics…"
            aria-label="Search songs"
            className={`${field} pl-9`}
          />
        </form>
        <select className={`${field} w-auto`} value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language">
          <option value="">All languages</option>
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        {isLoading ? (
          <TableSkeleton cols={6} />
        ) : !songs.length ? (
          <EmptyState
            icon={Music}
            title={search ? 'No songs match that search' : 'No songs yet'}
            subtitle={search ? 'Try a different term.' : 'Add your first worship song.'}
            action={
              search
                ? <button type="button" onClick={() => { setSearch(''); setSearchDraft('') }} className={btn.secondary}>Clear search</button>
                : <button type="button" onClick={() => setEditing('new')} className={btn.primary}>Add Song</button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['', 'Title', 'Artist', 'Language', 'Key', 'BPM', 'Used', ''].map((h, i) => (
                    <th key={i} scope="col" className="text-left px-3 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {songs.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => favourite.mutate(s)}
                        aria-label={s.isFavourite ? `Unfavourite ${s.title}` : `Favourite ${s.title}`}
                        aria-pressed={s.isFavourite}
                        className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Star className={`size-4 ${s.isFavourite ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground'}`} aria-hidden />
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setEditing(s)}
                        className="font-medium text-left hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        {s.title}
                      </button>
                      {s.tags.length > 0 && (
                        <span className="ml-2 inline-flex gap-1">
                          {s.tags.slice(0, 2).map((t) => (
                            <Chip key={t} className="bg-muted text-muted-foreground border-border">{t}</Chip>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground max-w-[12rem] truncate">{s.artist || '—'}</td>
                    <td className="px-3 py-3 text-muted-foreground">{s.language || '—'}</td>
                    <td className="px-3 py-3 tabular-nums">{s.songKey || '—'}</td>
                    <td className="px-3 py-3 tabular-nums text-muted-foreground">{s.bpm ?? '—'}</td>
                    <td className="px-3 py-3 tabular-nums text-muted-foreground">{s.useCount}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <span className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => buildDeck.mutate(s)}
                          disabled={buildDeck.isPending || !s.lyrics.trim()}
                          title={s.lyrics.trim() ? 'Build slides from lyrics' : 'Add lyrics first'}
                          className={btn.ghost}
                        >
                          {buildDeck.isPending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Presentation className="size-3.5" aria-hidden />}
                          Slides
                        </button>
                        <button
                          type="button"
                          onClick={() => { if (window.confirm(`Delete "${s.title}"?`)) remove.mutate(s.id) }}
                          className={btn.ghost}
                          aria-label={`Delete ${s.title}`}
                        >
                          <Trash2 className="size-3.5 text-destructive" aria-hidden />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <SongEditor
          song={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { invalidate(); setEditing(null) }}
        />
      )}
    </>
  )
}

function SongEditor({
  song,
  onClose,
  onSaved,
}: {
  song: Song | null
  onClose: () => void
  onSaved: () => void
}) {
  const [f, setF] = useState(
    song
      ? {
          title: song.title, artist: song.artist, author: song.author,
          language: song.language, category: song.category, songKey: song.songKey,
          bpm: song.bpm?.toString() ?? '', timeSignature: song.timeSignature,
          ccliNumber: song.ccliNumber, copyright: song.copyright,
          lyrics: song.lyrics, notes: song.notes,
        }
      : EMPTY
  )
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))

  // Blank lines separate slides — show the operator the split before saving so
  // the lyric formatting is not a surprise on the projector.
  const slideCount = f.lyrics.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean).length

  const save = useMutation({
    mutationFn: () => {
      const body = {
        title: f.title.trim(), artist: f.artist.trim(), author: f.author.trim(),
        language: f.language, category: f.category, song_key: f.songKey,
        bpm: f.bpm ? Number(f.bpm) : null, time_signature: f.timeSignature,
        ccli_number: f.ccliNumber.trim(), copyright: f.copyright.trim(),
        lyrics: f.lyrics, notes: f.notes.trim(),
      }
      return song ? presentationApi.updateSong(song.id, body) : presentationApi.createSong(body)
    },
    onSuccess: () => { toast.success(song ? 'Song updated' : 'Song added'); onSaved() },
    onError: (e: Error) => toast.error(e.message || 'Could not save this song'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={song ? `Edit ${song.title}` : 'Add song'}>
      <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className={`relative w-full sm:max-w-3xl max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-2xl`}>
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">{song ? 'Edit song' : 'Add song'}</h2>
          <button type="button" onClick={onClose} className={btn.ghost} aria-label="Close"><X className="size-4" aria-hidden /></button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); if (f.title.trim()) save.mutate() }}
          className="p-5 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="s-title" required>Title</Label>
              <input id="s-title" className={field} value={f.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div><Label htmlFor="s-artist">Artist</Label><input id="s-artist" className={field} value={f.artist} onChange={(e) => set('artist', e.target.value)} /></div>
            <div><Label htmlFor="s-author">Author</Label><input id="s-author" className={field} value={f.author} onChange={(e) => set('author', e.target.value)} /></div>
            <div>
              <Label htmlFor="s-lang">Language</Label>
              <select id="s-lang" className={field} value={f.language} onChange={(e) => set('language', e.target.value)}>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="s-cat">Category</Label>
              <select id="s-cat" className={field} value={f.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="s-key">Key</Label>
              <select id="s-key" className={field} value={f.songKey} onChange={(e) => set('songKey', e.target.value)}>
                <option value="">—</option>
                {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="s-bpm">BPM</Label>
                <input id="s-bpm" inputMode="numeric" className={field} value={f.bpm} onChange={(e) => set('bpm', e.target.value.replace(/[^\d]/g, ''))} />
              </div>
              <div>
                <Label htmlFor="s-ts">Time sig.</Label>
                <input id="s-ts" className={field} value={f.timeSignature} onChange={(e) => set('timeSignature', e.target.value)} />
              </div>
            </div>
            <div><Label htmlFor="s-ccli">CCLI number</Label><input id="s-ccli" className={field} value={f.ccliNumber} onChange={(e) => set('ccliNumber', e.target.value)} /></div>
            <div><Label htmlFor="s-copy">Copyright</Label><input id="s-copy" className={field} value={f.copyright} onChange={(e) => set('copyright', e.target.value)} /></div>
          </div>

          <div>
            <Label htmlFor="s-lyrics" hint="Separate slides with a blank line">Lyrics</Label>
            <textarea
              id="s-lyrics"
              rows={12}
              className={`${field} py-2 font-mono text-[13px] leading-relaxed resize-y`}
              placeholder={'Verse 1 line one\nVerse 1 line two\n\nChorus line one\nChorus line two'}
              value={f.lyrics}
              onChange={(e) => set('lyrics', e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {slideCount > 0 ? `Will produce ${slideCount} slide${slideCount === 1 ? '' : 's'}.` : 'No lyrics yet.'}
            </p>
          </div>

          <div>
            <Label htmlFor="s-notes">Notes</Label>
            <textarea id="s-notes" rows={2} className={`${field} py-2 resize-y`} value={f.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={btn.secondary}>Cancel</button>
            <button type="submit" disabled={!f.title.trim() || save.isPending} className={btn.primary}>
              <Save className="size-4" aria-hidden />
              {save.isPending ? 'Saving…' : song ? 'Save changes' : 'Add song'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
