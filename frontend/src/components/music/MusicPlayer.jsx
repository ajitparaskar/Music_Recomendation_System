import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Maximize2, Minimize2, SkipForward, X } from 'lucide-react';

const MusicPlayer = ({ song, setCurrentSong, queue = [], setQueue, onSongStart }) => {
  const [expanded, setExpanded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (song) {
      setExpanded(true);
      setFullscreen(false);
      onSongStart?.(song);
    } else {
      setExpanded(false);
      setFullscreen(false);
    }
  }, [song, onSongStart]);

  const cancelPlayback = () => {
    setCurrentSong?.(null);
    setQueue?.([]);
    setExpanded(false);
    setFullscreen(false);
  };

  const playNextSong = () => {
    if (queue.length > 0) {
      setQueue((prev) => {
        const [nextSong, ...rest] = prev;
        setCurrentSong?.(nextSong);
        return rest;
      });
    }
  };

  if (!song) return null;

  const isMiniMode = !expanded && !fullscreen;

  return (
    <motion.div
      drag={!fullscreen}
      dragMomentum={false}
      className={`fixed z-50 ${
        fullscreen ? 'inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md' : 'bottom-6 left-1/2 -translate-x-1/2'
      }`}
    >
      <AnimatePresence mode="wait">
        {isMiniMode && (
          <motion.div
            key="mini"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            onClick={() => setExpanded(true)}
            className="relative cursor-pointer glass-surface-strong rounded-[2rem] p-3 pr-6 flex items-center gap-4 w-[370px] hover:bg-white/10 transition-colors group"
          >
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl -z-10 group-hover:opacity-100 opacity-60 transition duration-500"></div>
            <div className="flex-1 min-w-0">
              <h4 className="app-text font-bold text-sm truncate">{song.title}</h4>
              <p className="app-muted text-xs truncate mt-0.5">{song.artist}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center app-muted"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {(expanded || fullscreen) && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className={`relative glass-surface-strong rounded-2xl p-6 flex flex-col ${fullscreen ? 'w-[90%] h-[85%]' : 'w-[500px]'}`}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 blur-2xl -z-10"></div>

            <div className="flex justify-between items-center mb-4 gap-3">
              <button
                onClick={cancelPlayback}
                className="text-white hover:text-red-400 transition w-9 h-9 rounded-full bg-white/5 flex items-center justify-center"
              >
                <X size={18} />
              </button>
              <button
                onClick={() => setFullscreen(!fullscreen)}
                className="text-white hover:text-green-400 transition w-9 h-9 rounded-full bg-white/5 flex items-center justify-center"
              >
                {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>

            <div className="flex flex-col items-center text-center mb-6">
              <h3 className="app-text font-extrabold text-2xl truncate w-full px-4">{song.title}</h3>
              <p className="app-muted font-medium text-base mt-2 truncate w-full px-4">{song.artist}</p>
              <p className="text-xs text-primary mt-2">Queue remaining: {queue.length}</p>
            </div>

            <div className={`flex-1 flex flex-col justify-center rounded-xl overflow-hidden border border-white/10 bg-black/30 transition-all duration-300 ${fullscreen ? 'h-full' : ''}`}>
              {song.youtube_video_id ? (
                <iframe
                  title={`${song.title} video`}
                  src={`https://www.youtube.com/embed/${song.youtube_video_id}?autoplay=1&rel=0`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="w-full aspect-video"
                />
              ) : song.preview_url ? (
                <div className="flex flex-col items-center justify-center p-8 w-full h-full">
                  <p className="text-white mb-4">Playing Audio Preview</p>
                  <audio controls autoPlay src={song.preview_url} className="w-full max-w-sm" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 w-full h-full text-center">
                  <p className="app-muted text-sm">Video not available</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-center">
              <button
                onClick={playNextSong}
                disabled={queue.length === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl glass-surface text-white hover:bg-white/20 transition disabled:opacity-50"
              >
                <SkipForward className="w-5 h-5" />
                Next Recommendation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MusicPlayer;

