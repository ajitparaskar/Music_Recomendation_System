import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ListPlus, PlusSquare, Shuffle, Star, X } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { AuthContext } from '../../context/authContext.js';

const LIKED_SONGS_STORAGE_KEY = 'likedSongs';

const getSongKey = (song) => song?.track_id || `${song?.title ?? 'unknown'}-${song?.artist ?? 'unknown'}`;

const loadLikedSongs = () => {
  try {
    const stored = localStorage.getItem(LIKED_SONGS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const formatDuration = (ms) => {
  if (!ms || isNaN(ms)) return '0:00';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const RecommendationSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="glass-surface rounded-3xl p-5 space-y-4">
        <div className="skeleton h-6 rounded-xl w-3/4"></div>
        <div className="skeleton h-4 rounded-lg w-1/2"></div>
        <div className="skeleton h-4 rounded-lg w-2/3"></div>
        <div className="skeleton h-16 rounded-2xl w-full"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton h-10 rounded-xl"></div>
          <div className="skeleton h-10 rounded-xl"></div>
        </div>
      </div>
    ))}
  </div>
);

const RecommendationSection = ({
  matchedSong,
  recommendations,
  loading,
  onSelectSong,
  onQueueSong,
  queueLength,
  shuffleEnabled,
  onToggleShuffle,
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  onAddToPlaylist,
}) => {
  const { token } = useContext(AuthContext);
  const [toastMessage, setToastMessage] = useState('');
  const [likedSongs, setLikedSongs] = useState(() => loadLikedSongs());
  const [dislikedSongKeys, setDislikedSongKeys] = useState([]);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(LIKED_SONGS_STORAGE_KEY, JSON.stringify(likedSongs));
  }, [likedSongs]);

  useEffect(() => {
    setDislikedSongKeys([]);
  }, [recommendations]);

  useEffect(() => () => window.clearTimeout(toastTimeoutRef.current), []);

  const filteredRecommendations = useMemo(
    () => recommendations.filter((song) => !dislikedSongKeys.includes(getSongKey(song))),
    [recommendations, dislikedSongKeys],
  );

  const showToast = (message) => {
    setToastMessage(message);
    window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(''), 2500);
  };

  const isSongLiked = (song) => likedSongs.some((item) => getSongKey(item) === getSongKey(song));

  const handleFavorite = async (event, song) => {
    event.stopPropagation();

    if (!token) {
      showToast('Login to save favorites and keep your library synced.');
      return;
    }

    try {
      const data = await apiRequest('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          song_title: song.title,
          artist: song.artist,
          youtube_video_id: song.youtube_video_id || null,
        }),
      });

      showToast(data.message);
    } catch (error) {
      showToast(error.message || 'Could not save favorite right now.');
    }
  };

  const handleQueue = (event, song) => {
    event.stopPropagation();
    onQueueSong(song);
    showToast(`Added "${song.title}" to queue`);
  };

  const handleLike = (event, song) => {
    event.stopPropagation();

    if (isSongLiked(song)) {
      showToast('Song already liked');
      return;
    }

    setLikedSongs((previous) => [song, ...previous]);
    showToast(`Liked "${song.title}"`);
  };

  const handleDislike = (event, song) => {
    event.stopPropagation();
    const songKey = getSongKey(song);
    setDislikedSongKeys((previous) => (previous.includes(songKey) ? previous : [...previous, songKey]));
    showToast(`Removed "${song.title}" from this view`);
  };

  const handlePlaylistAdd = async (event, song) => {
    event.stopPropagation();

    if (!token) {
      showToast('Login to manage playlists.');
      return;
    }

    if (!selectedPlaylistId) {
      showToast('Select or create a playlist first.');
      return;
    }

    try {
      const result = await onAddToPlaylist(selectedPlaylistId, song);
      showToast(result?.message || `Added "${song.title}" to playlist`);
    } catch (error) {
      showToast(error.message || 'Could not add song to playlist');
    }
  };

  const renderSongActions = (song, compact = false) => (
    <div className={`flex ${compact ? 'gap-2 flex-wrap' : 'flex-wrap gap-3'} items-center`}>
      <button
        type="button"
        onClick={(event) => handleQueue(event, song)}
        className="glass-surface text-white px-3 py-2 rounded-xl flex items-center gap-2 transition-transform hover:-translate-y-0.5"
      >
        <ListPlus className="w-4 h-4" />
        Queue
      </button>

      <button
        type="button"
        onClick={(event) => handleLike(event, song)}
        className={`px-3 py-2 rounded-xl flex items-center gap-2 border transition-colors ${
          isSongLiked(song)
            ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
            : 'glass-surface text-white hover:bg-white/20'
        }`}
      >
        <Heart className={`w-4 h-4 ${isSongLiked(song) ? 'fill-current' : ''}`} />
        Like
      </button>

      <button
        type="button"
        onClick={(event) => handleDislike(event, song)}
        className="glass-surface text-white px-3 py-2 rounded-xl flex items-center gap-2 transition-colors hover:bg-red-500/20"
      >
        <X className="w-4 h-4" />
        Dislike
      </button>

      <button
        type="button"
        onClick={(event) => handlePlaylistAdd(event, song)}
        className="glass-surface text-white px-3 py-2 rounded-xl flex items-center gap-2 transition-colors hover:bg-secondary/20"
      >
        <PlusSquare className="w-4 h-4" />
        Playlist
      </button>
    </div>
  );

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto relative z-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            AI Recommendations
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedPlaylistId}
            onChange={(event) => onSelectPlaylist(event.target.value)}
            className="appearance-none px-4 py-2 rounded-xl border glass-surface app-muted hover:bg-white/10 focus:outline-none focus:border-secondary/50"
          >
            <option value="">Select playlist</option>
            {playlists.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onToggleShuffle}
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-colors ${
              shuffleEnabled
                ? 'bg-secondary/20 border-secondary/40 text-secondary'
                : 'glass-surface app-muted hover:bg-white/10'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            {shuffleEnabled ? 'Shuffle On' : 'Shuffle Off'}
          </button>

          <div className="px-4 py-2 rounded-xl glass-surface app-muted">Queue: {queueLength}</div>
        </div>
      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 glass-surface-strong px-6 py-3 rounded-xl app-text"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <RecommendationSkeleton />
      ) : filteredRecommendations.length === 0 && !matchedSong ? (
        <div className="text-center py-20 glass-surface rounded-3xl">
          <p className="text-xl app-muted">Search for a song, ask the assistant, or pick a mood to discover new music.</p>
        </div>
      ) : (
        <>
          {matchedSong && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onSelectSong(matchedSong)}
              className="mb-12 relative group cursor-pointer"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative glass-surface-strong p-6 md:p-8 rounded-[2rem] flex flex-col gap-6 hover:border-purple-500/50 transition-colors">
                <div className="absolute top-4 right-6 px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full border border-purple-500/30">
                  Best Match
                </div>

                <div className="pr-24">
                  <h3 className="text-4xl font-black app-text mb-3">{matchedSong.title}</h3>
                  <p className="text-lg app-muted mb-4">
                    {matchedSong.artist} <span className="text-gray-600">•</span> {matchedSong.album}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="glass-surface px-3 py-1.5 rounded-lg app-muted">Popularity: {matchedSong.popularity}</span>
                    <span className="glass-surface px-3 py-1.5 rounded-lg app-muted">Duration: {formatDuration(matchedSong.duration_ms)}</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {renderSongActions(matchedSong)}

                  <button
                    type="button"
                    onClick={(event) => handleFavorite(event, matchedSong)}
                    className="bg-primary/20 hover:bg-primary/40 text-primary px-4 py-2 rounded-xl flex items-center gap-2 transition-colors border border-primary/30"
                  >
                    <Star className="w-4 h-4" />
                    Save Favorite
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecommendations.map((song, index) => (
              <motion.div
                key={`${getSongKey(song)}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectSong(song)}
                className="group glass-surface p-5 rounded-3xl hover:border-purple-500/50 transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(168,85,247,0.2)]"
              >
                <div className="flex justify-between items-start mb-4 gap-3">
                  <h3 className="text-xl font-bold app-text group-hover:text-purple-400 transition-colors leading-tight max-w-[85%]">
                    {song.title}
                  </h3>
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 group-hover:bg-purple-500 transition-all duration-300">
                    <svg className="w-4 h-4 text-purple-200 group-hover:text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                <p className="text-sm app-muted truncate mb-1">{song.artist}</p>
                <p className="text-xs text-gray-500 truncate mb-6 pb-4 border-b border-white/5">{song.album}</p>

                <div className="flex items-center justify-between mb-4 bg-black/20 p-2.5 rounded-xl border border-white/5">
                  <span className="text-xs font-medium app-muted bg-white/5 px-2 py-1 rounded-md">Pop: {song.popularity}</span>
                  {song.preview_url && (
                    <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                      Preview
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {renderSongActions(song, true)}

                  <button
                    type="button"
                    onClick={(event) => handleFavorite(event, song)}
                    className="w-full app-muted hover:text-primary transition-colors p-2 rounded-xl glass-surface"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Save Favorite
                    </span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default RecommendationSection;
