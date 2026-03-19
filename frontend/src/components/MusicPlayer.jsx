import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Minimize2 } from "lucide-react";

const MusicPlayer = ({ song, onNext }) => {
    const [expanded, setExpanded] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

    // ✅ Auto collapse when song changes
    useEffect(() => {
        setExpanded(false);
        setFullscreen(false);
    }, [song]);

    if (!song) return null;

    return (
        <motion.div
            drag
            dragMomentum={false}
            className={`fixed z-50 ${fullscreen
                    ? "inset-0 flex items-center justify-center bg-black/80"
                    : "bottom-6 left-1/2 transform -translate-x-1/2"
                }`}
        >
            <AnimatePresence mode="wait">
                {!expanded && !fullscreen && (
                    <motion.div
                        key="mini"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setExpanded(true)}
                        className="relative cursor-pointer bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2rem] p-3 pr-6 flex items-center gap-4 w-[360px] hover:bg-white/10 transition-colors group"
                    >
                        {/* Gradient Glow */}
                        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl -z-10 group-hover:opacity-100 opacity-60 transition duration-500"></div>

                        {song.image && (
                            <div className="relative w-14 h-14 shrink-0">
                                <img
                                    src={song.image}
                                    alt={song.title}
                                    className="w-full h-full rounded-full object-cover border-2 border-gray-800 animate-[spin_8s_linear_infinite]"
                                />
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full"></div>
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <h4 className="text-white font-bold text-sm truncate">
                                {song.title}
                            </h4>
                            <p className="text-gray-400 text-xs truncate mt-0.5">
                                {song.artist}
                            </p>
                        </div>

                        {/* Equalizer animation */}
                        <div className="flex items-end gap-1 h-5 shrink-0">
                            {[1, 2, 3].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{ height: ["4px", "20px", "4px"] }}
                                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                                    className="w-1 bg-purple-500 rounded-full"
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {(expanded || fullscreen) && (
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 60 }}
                        transition={{ duration: 0.35 }}
                        className={`relative bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 ${fullscreen ? "w-[90%] h-[85%]" : "w-[420px]"
                            }`}
                    >
                        {/* Gradient Glow */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 blur-2xl -z-10"></div>

                        {/* Controls */}
                        <div className="flex justify-between mb-4">
                            <button
                                onClick={() =>
                                    fullscreen ? setFullscreen(false) : setExpanded(false)
                                }
                                className="text-white hover:text-red-400 transition"
                            >
                                <X size={18} />
                            </button>

                            <button
                                onClick={() => setFullscreen(!fullscreen)}
                                className="text-white hover:text-green-400 transition"
                            >
                                {fullscreen ? (
                                    <Minimize2 size={18} />
                                ) : (
                                    <Maximize2 size={18} />
                                )}
                            </button>
                        </div>

                        {/* Song Info */}
                        <div className="flex flex-col items-center text-center mb-6">
                            {song.image && (
                                <div className="relative w-40 h-40 mb-5 group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition duration-700"></div>
                                    <img
                                        src={song.image}
                                        alt={song.title}
                                        className="relative w-full h-full rounded-full object-cover border-[6px] border-gray-900 shadow-[0_0_30px_rgba(0,0,0,0.8)] animate-[spin_8s_linear_infinite]"
                                    />
                                    {/* Record hole */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black rounded-full border border-gray-800"></div>
                                </div>
                            )}

                            <h3 className="text-white font-extrabold text-2xl truncate w-full px-4">
                                {song.title}
                            </h3>
                            <p className="text-gray-300 font-medium text-base mt-2 truncate w-full px-4">
                                {song.artist}
                            </p>
                        </div>

                        {/* YouTube Player or Fallback */}
                        {song.youtube_video_id ? (
                            <iframe
                                width="100%"
                                height={fullscreen ? "70%" : "220"}
                                src={`https://www.youtube.com/embed/${song.youtube_video_id}?autoplay=1&rel=0`}
                                title="YouTube player"
                                frameBorder="0"
                                allow="autoplay; encrypted-media"
                                allowFullScreen
                                className="rounded-xl"
                            ></iframe>
                        ) : song.preview_url ? (
                            <div className="text-center p-4 bg-white/5 rounded-xl">
                                <p className="text-gray-300 mb-2">🎵 30-Second Preview</p>
                                <audio
                                    controls
                                    className="w-full"
                                    src={song.preview_url}
                                >
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        ) : (
                            <div className="text-center p-8 bg-white/5 rounded-xl">
                                <p className="text-gray-400 text-sm">
                                    🎶 Video not available
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                    YouTube API quota exceeded or video not found
                                </p>
                            </div>
                        )}

                        {/* Auto Next Button */}
                        {onNext && (
                            <button
                                onClick={onNext}
                                className="mt-4 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-xl hover:opacity-90 transition"
                            >
                                ▶ Play Next Recommendation
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MusicPlayer;
