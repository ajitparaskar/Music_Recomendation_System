import React, { useMemo, useState } from 'react';
import { ListMusic, Music2, Plus, Trash2 } from 'lucide-react';

const PlaylistPanel = ({
  loggedIn,
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  onCreatePlaylist,
  onRemoveSong,
  onPlaySong,
  loading,
}) => {
  const [playlistName, setPlaylistName] = useState('');

  const selectedPlaylist = useMemo(
    () => playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? playlists[0] ?? null,
    [playlists, selectedPlaylistId],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = playlistName.trim();
    if (!trimmedName) {
      return;
    }

    const created = await onCreatePlaylist(trimmedName);
    if (created) {
      setPlaylistName('');
    }
  };

  return (
    <section className="glass-surface rounded-3xl p-6 relative z-[60]">
      <div className="flex items-center gap-3 mb-6">
        <ListMusic className="w-5 h-5 text-secondary" />
        <h3 className="text-2xl font-bold app-text">Playlists</h3>
      </div>

      {!loggedIn ? (
        <p className="app-muted">Login to create playlists and save songs for later.</p>
      ) : (
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={playlistName}
              onChange={(event) => setPlaylistName(event.target.value)}
              placeholder="Create a new playlist"
              className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-4 py-3 app-text placeholder:text-gray-500 focus:outline-none focus:border-secondary/50"
            />
            <button
              type="submit"
              className="px-4 py-3 rounded-2xl bg-secondary/20 border border-secondary/30 text-secondary hover:bg-secondary/30 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
          </form>

          {loading ? (
            <p className="app-muted">Loading playlists...</p>
          ) : playlists.length === 0 ? (
            <p className="app-muted">Your playlists will appear here once you create one.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-3">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    type="button"
                    onClick={() => onSelectPlaylist(playlist.id)}
                    className={`px-4 py-2 rounded-2xl border transition-colors ${
                      playlist.id === selectedPlaylist?.id
                        ? 'bg-secondary/20 border-secondary/40 text-secondary'
                        : 'bg-black/30 border-white/10 app-muted hover:bg-white/10'
                    }`}
                  >
                    {playlist.name}
                  </button>
                ))}
              </div>

              <div className="bg-black/30 border border-white/10 rounded-3xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h4 className="text-xl font-semibold app-text">{selectedPlaylist?.name || 'Select a playlist'}</h4>
                    {selectedPlaylist && (
                      <p className="text-sm app-muted">
                        {selectedPlaylist.songs.length} saved song{selectedPlaylist.songs.length === 1 ? '' : 's'}
                      </p>
                    )}
                  </div>
                </div>

                {!selectedPlaylist ? (
                  <p className="app-muted">Choose a playlist to view its songs.</p>
                ) : selectedPlaylist.songs.length === 0 ? (
                  <p className="app-muted">Add songs from recommendations to start building this playlist.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedPlaylist.songs.map((song) => (
                      <div key={song.id} className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            onPlaySong({
                              title: song.song_title,
                              artist: song.artist,
                              youtube_video_id: song.youtube_video_id,
                              preview_url: song.preview_url,
                              track_id: song.track_id,
                              image: song.image,
                              spotify_url: song.spotify_url,
                            })
                          }
                          className="text-left flex-1 min-w-0"
                        >
                          <p className="app-text font-semibold truncate">{song.song_title}</p>
                          <p className="text-sm app-muted truncate">{song.artist}</p>
                        </button>

                        <div className="flex items-center gap-2 shrink-0">
                          <Music2 className="w-4 h-4 text-secondary" />
                          <button
                            type="button"
                            onClick={() => onRemoveSong(selectedPlaylist.id, song.id)}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default PlaylistPanel;
