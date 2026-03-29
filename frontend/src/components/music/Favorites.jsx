import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { Trash2, Music, Play } from 'lucide-react';
import MusicPlayer from './MusicPlayer';
import { backendUrl } from '../../config';

export default function Favorites() {
  const { token, user } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, [token]);

  const fetchFavorites = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${backendUrl}/api/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setFavorites(data);
      }
    } catch (error) {
      console.error('Failed to fetch favorites', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (e, id) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${backendUrl}/api/favorites/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setFavorites(favorites.filter(fav => fav.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete favorite', error);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen py-32 px-6 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-4">
          Please Login
        </h2>
        <p className="text-gray-400">You need to be logged in to view your favorites.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-24 px-6 relative z-10 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-2 h-8 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
        <h2 className="text-4xl font-extrabold text-white">
          {user?.username}'s Library
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-primary/50 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
          <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">No favorites yet</h3>
          <p className="text-gray-400">Discover new music on the home page and save them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-32">
          {favorites.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setCurrentSong({ title: song.song_title, artist: song.artist, youtube_video_id: song.youtube_video_id })}
              className="group bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all duration-300 cursor-pointer flex flex-col items-start gap-4"
            >
              <div className="w-full flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-xl font-bold text-white truncate mb-1 bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-secondary transition-all">
                    {song.song_title}
                  </h3>
                  <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                </div>
                <button
                  onClick={(e) => removeFavorite(e, song.id)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors shrink-0"
                  title="Remove"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-sm group-hover:border-primary/30 transition-colors">
                 {song.youtube_video_id ? (
                     <span className="text-primary flex items-center gap-1.5 font-medium">
                         <Play className="w-4 h-4" /> Play track
                     </span>
                 ) : (
                    <span className="text-gray-500">Audio only</span>
                 )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {currentSong && <MusicPlayer song={currentSong} />}
    </div>
  );
}
