import React, { useContext, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock3, History, ListMusic } from 'lucide-react';
import PremiumUpgradeButton from '../billing/PremiumUpgradeButton.jsx';
import ChatAssistant from './ChatAssistant';
import Hero from './Hero';
import MusicPlayer from './MusicPlayer';
import PlaylistPanel from './PlaylistPanel';
import RecommendationSection from './RecommendationSection';
import { apiRequest } from '../../api/client';
import { AuthContext } from '../../context/authContext.js';

const RECENTLY_PLAYED_STORAGE_KEY = 'recentlyPlayedSongs';
const MAX_RECENTLY_PLAYED = 10;

const getSongKey = (song) => song?.track_id || `${song?.title ?? song?.song_title ?? 'unknown'}-${song?.artist ?? 'unknown'}`;

const shuffleSongs = (songs) => {
  const items = [...songs];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
};

const loadRecentlyPlayed = () => {
  try {
    const stored = localStorage.getItem(RECENTLY_PLAYED_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const formatPlayedAt = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleString();
};

const sameHistorySong = (left, right) => {
  const leftTrackId = left?.track_id || null;
  const rightTrackId = right?.track_id || null;
  if (leftTrackId && rightTrackId) {
    return leftTrackId === rightTrackId;
  }

  const leftTitle = (left?.title || left?.song_title || '').trim().toLowerCase();
  const rightTitle = (right?.title || right?.song_title || '').trim().toLowerCase();
  const leftArtist = (left?.artist || '').trim().toLowerCase();
  const rightArtist = (right?.artist || '').trim().toLowerCase();
  return leftTitle === rightTitle && leftArtist === rightArtist;
};

const toSongPayload = (song) => ({
  title: song.title || song.song_title,
  artist: song.artist,
  youtube_video_id: song.youtube_video_id || null,
  track_id: song.track_id || null,
  image: song.image || null,
  preview_url: song.preview_url || null,
  spotify_url: song.spotify_url || null,
  mood: song.mood || null,
});

const Home = () => {
  const { token, user, logout } = useContext(AuthContext);
  const [matchedSong, setMatchedSong] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [displayedRecommendations, setDisplayedRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => loadRecentlyPlayed());
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [activeMood, setActiveMood] = useState('');
  const [detectedEmotion, setDetectedEmotion] = useState('');
  const [detectedMood, setDetectedMood] = useState('');
  const [recommendationMessage, setRecommendationMessage] = useState('');
  const [detectionLoading, setDetectionLoading] = useState(false);

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  useEffect(() => {
    localStorage.setItem(RECENTLY_PLAYED_STORAGE_KEY, JSON.stringify(recentlyPlayed));
  }, [recentlyPlayed]);

  useEffect(() => {
    setDisplayedRecommendations(shuffleEnabled ? shuffleSongs(recommendations) : recommendations);
  }, [recommendations, shuffleEnabled]);

  useEffect(() => {
    if (!token) {
      setHistoryEntries([]);
      setPlaylists([]);
      setSelectedPlaylistId('');
      return;
    }

    const fetchPersonalizedData = async () => {
      setHistoryLoading(true);
      setPlaylistLoading(true);
      try {
        const [historyData, playlistsData] = await Promise.all([
          apiRequest('/api/history', { headers: authHeaders }),
          apiRequest('/api/playlists', { headers: authHeaders }),
        ]);

        setHistoryEntries(Array.isArray(historyData) ? historyData : []);
        setPlaylists(Array.isArray(playlistsData) ? playlistsData : []);
        setSelectedPlaylistId((previous) => {
          if (previous && playlistsData.some((playlist) => playlist.id === previous)) {
            return previous;
          }
          return playlistsData[0]?.id || '';
        });
      } catch (error) {
        console.error('Failed to load personalized data:', error);
        if (error.status === 401) {
          logout();
        }
      } finally {
        setHistoryLoading(false);
        setPlaylistLoading(false);
      }
    };

    fetchPersonalizedData();
  }, [token, authHeaders, logout]);

  const displayedHistory = useMemo(() => {
    if (token) {
      return historyEntries.map((entry) => ({ ...entry, title: entry.song_title }));
    }
    return recentlyPlayed;
  }, [historyEntries, recentlyPlayed, token]);

  const rememberPlayedSong = async (song) => {
    if (!song) return;

    setRecentlyPlayed((previous) => {
      const nextList = [song, ...previous.filter((item) => !sameHistorySong(item, song))];
      return nextList.slice(0, MAX_RECENTLY_PLAYED);
    });

    if (!token) return;

    const optimisticEntry = {
      id: `${Date.now()}-${getSongKey(song)}`,
      song_title: song.title,
      artist: song.artist,
      played_at: new Date().toISOString(),
      youtube_video_id: song.youtube_video_id || null,
      track_id: song.track_id || null,
      image: song.image || null,
      preview_url: song.preview_url || null,
      spotify_url: song.spotify_url || null,
      mood: song.mood || null,
    };

    setHistoryEntries((previous) => [optimisticEntry, ...previous.filter((item) => !sameHistorySong(item, optimisticEntry))].slice(0, MAX_RECENTLY_PLAYED));

    try {
      const response = await apiRequest('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          song_title: song.title,
          artist: song.artist,
          youtube_video_id: song.youtube_video_id || null,
          track_id: song.track_id || null,
          image: song.image || null,
          preview_url: song.preview_url || null,
          spotify_url: song.spotify_url || null,
        }),
      });
      if (response.message === 'History entry refreshed') {
        setHistoryEntries((previous) =>
          previous.map((item, index) =>
            index === 0 ? { ...item, played_at: optimisticEntry.played_at } : item,
          ),
        );
      }
    } catch (error) {
      console.error('Failed to save history entry:', error);
    }
  };

  const applyRecommendationResponse = (data, options = {}) => {
    const nextRecommendations = data.recommendations ?? [];
    setMatchedSong(data.matched_song || null);
    setRecommendations(nextRecommendations);
    setCurrentSong(data.matched_song || nextRecommendations[0] || null);
    setRecommendationMessage(data.message || options.message || '');
    setActiveMood(data.mood || options.activeMood || '');
    setDetectedMood(data.mood || options.detectedMood || '');
    setDetectedEmotion(data.detected_emotion || options.detectedEmotion || '');
  };

  const handlePlaySong = (song) => setCurrentSong(song);
  const handleAddToQueue = (song) => setQueue((previous) => [...previous, song]);

  const handleCreatePlaylist = async (name) => {
    if (!token) return null;

    try {
      const data = await apiRequest('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ name }),
      });

      if (data.playlist) {
        setPlaylists((previous) => [data.playlist, ...previous]);
        setSelectedPlaylistId(data.playlist.id);
      }

      return data.playlist || null;
    } catch (error) {
      setRecommendationMessage(error.message || 'Unable to create playlist right now.');
      return null;
    }
  };

  const handleAddToPlaylist = async (playlistId, song) => {
    const data = await apiRequest(`/api/playlists/${playlistId}/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        song_title: song.title,
        artist: song.artist,
        youtube_video_id: song.youtube_video_id || null,
        track_id: song.track_id || null,
        image: song.image || null,
        preview_url: song.preview_url || null,
        spotify_url: song.spotify_url || null,
      }),
    });

    if (data.song) {
      setPlaylists((previous) =>
        previous.map((playlist) =>
          playlist.id === playlistId ? { ...playlist, songs: [...playlist.songs, data.song] } : playlist,
        ),
      );
    }

    return data;
  };

  const handleRemovePlaylistSong = async (playlistId, songId) => {
    try {
      await apiRequest(`/api/playlists/${playlistId}/songs/${songId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      setPlaylists((previous) =>
        previous.map((playlist) =>
          playlist.id === playlistId ? { ...playlist, songs: playlist.songs.filter((song) => song.id !== songId) } : playlist,
        ),
      );
    } catch (error) {
      setRecommendationMessage(error.message || 'Unable to remove song from playlist.');
    }
  };

  const fetchRecommendations = async (song) => {
    try {
      setLoading(true);
      const data = await apiRequest('/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ song }),
      });
      applyRecommendationResponse(data, { message: `Showing recommendations related to "${song}".` });
    } catch (error) {
      setMatchedSong(null);
      setRecommendations([]);
      setRecommendationMessage(error.message || 'Unable to load recommendations right now.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMoodRecommendations = async (mood) => {
    try {
      setLoading(true);
      const data = await apiRequest(`/recommend/mood/${mood}?limit=8`, {
        headers: authHeaders,
      });
      applyRecommendationResponse(data, {
        activeMood: mood,
        detectedMood: '',
        detectedEmotion: '',
        message: data.message || `Showing ${mood} recommendations tailored from the audio features dataset.`,
      });
    } catch (error) {
      setRecommendationMessage(error.message || 'Unable to load mood recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const detectMoodFromCamera = async (image) => {
    setDetectionLoading(true);
    setLoading(true);
    try {
      if (!user?.is_premium) {
        throw new Error('Camera mood detection is available on Premium. Upgrade to unlock it.');
      }

      const data = await apiRequest('/recommend/emotion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ image }),
      });

      applyRecommendationResponse(data, {
        activeMood: data.mood,
        detectedMood: data.mood,
        detectedEmotion: data.detected_emotion,
      });
      return data;
    } finally {
      setDetectionLoading(false);
      setLoading(false);
    }
  };

  const handleChatbotRecommendations = (data) => {
    applyRecommendationResponse(data, {
      activeMood: data.intent?.mood || data.mood || '',
      detectedMood: data.mood || '',
      detectedEmotion: data.detected_emotion || '',
      message: data.message || 'Here are some recommendations from the assistant.',
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      <Hero
        onSearch={fetchRecommendations}
        onMoodSelect={fetchMoodRecommendations}
        onDetectMoodFromCamera={detectMoodFromCamera}
        activeMood={activeMood}
        detectedEmotion={detectedEmotion}
        detectedMood={detectedMood}
        recommendationMessage={recommendationMessage}
        detectionLoading={detectionLoading}
      />

      <div className="relative z-10 pb-64">
        {user && !user.is_premium && (
          <div className="max-w-7xl mx-auto px-6 mb-8">
            <PremiumUpgradeButton />
          </div>
        )}

        <RecommendationSection
          matchedSong={matchedSong}
          recommendations={displayedRecommendations}
          loading={loading}
          onSelectSong={handlePlaySong}
          onQueueSong={handleAddToQueue}
          queueLength={queue.length}
          shuffleEnabled={shuffleEnabled}
          onToggleShuffle={() => setShuffleEnabled((previous) => !previous)}
          playlists={playlists}
          selectedPlaylistId={selectedPlaylistId}
          onSelectPlaylist={setSelectedPlaylistId}
          onAddToPlaylist={handleAddToPlaylist}
        />

        <div className="max-w-7xl mx-auto px-6 grid gap-8 xl:grid-cols-[1.1fr_0.9fr_1.1fr]">
          <section className="glass-surface rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              {token ? <History className="w-5 h-5 text-primary" /> : <Clock3 className="w-5 h-5 text-primary" />}
              <h3 className="text-2xl font-bold app-text">{token ? 'Listening History' : 'Recently Played'}</h3>
            </div>

            {historyLoading ? (
              <p className="app-muted">Loading your listening history...</p>
            ) : displayedHistory.length === 0 ? (
              <p className="app-muted">
                {token ? 'Play a song to start building your personalized history.' : 'Songs you play will appear here for quick access.'}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {displayedHistory.map((song, index) => (
                  <button
                    key={`history-${song.id || index}-${getSongKey(song)}`}
                    type="button"
                    onClick={() => handlePlaySong(toSongPayload(song))}
                    className="text-left bg-black/30 border border-white/10 rounded-2xl px-4 py-3 hover:border-primary/50 hover:bg-white/10 transition-all"
                  >
                    <p className="app-text font-semibold truncate">{song.title || song.song_title}</p>
                    <p className="text-sm app-muted truncate">{song.artist}</p>
                    {token && song.played_at && <p className="text-xs text-gray-500 mt-1">{formatPlayedAt(song.played_at)}</p>}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="glass-surface rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <ListMusic className="w-5 h-5 text-secondary" />
              <h3 className="text-2xl font-bold app-text">Queue</h3>
            </div>

            {queue.length === 0 ? (
              <p className="app-muted">Add songs to the queue and they will play in FIFO order.</p>
            ) : (
              <div className="space-y-3">
                {queue.map((song, index) => (
                  <div key={`queue-${index}-${getSongKey(song)}`} className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3">
                    <p className="text-sm text-secondary mb-1">#{index + 1} in queue</p>
                    <p className="app-text font-semibold truncate">{song.title}</p>
                    <p className="text-sm app-muted truncate">{song.artist}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <PlaylistPanel
            loggedIn={Boolean(token)}
            playlists={playlists}
            selectedPlaylistId={selectedPlaylistId}
            onSelectPlaylist={setSelectedPlaylistId}
            onCreatePlaylist={handleCreatePlaylist}
            onRemoveSong={handleRemovePlaylistSong}
            onPlaySong={handlePlaySong}
            loading={playlistLoading}
          />
        </div>
      </div>

      <MusicPlayer
        song={currentSong}
        setCurrentSong={setCurrentSong}
        queue={queue}
        setQueue={setQueue}
        onSongStart={rememberPlayedSong}
        isPremium={Boolean(user?.is_premium)}
      />
      <ChatAssistant onRecommendations={handleChatbotRecommendations} />
    </motion.div>
  );
};

export default Home;
