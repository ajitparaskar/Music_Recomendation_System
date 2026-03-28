import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const RecommendationSection = ({ matchedSong, recommendations, loading, onSelectSong }) => {
    const { token } = useContext(AuthContext);
    const [toastMessage, setToastMessage] = useState('');

    const handleFavorite = async (e, song) => {
        e.stopPropagation(); // prevent triggering select song 
        if (!token) {
            setToastMessage('Please login to save favorites.');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    song_title: song.title,
                    artist: song.artist,
                    youtube_video_id: song.youtube_video_id || null
                })
            });
            const data = await response.json();
            setToastMessage(data.message);
            setTimeout(() => setToastMessage(''), 3000);
        } catch (error) {
            setToastMessage('Error saving favorite');
            setTimeout(() => setToastMessage(''), 3000);
        }
    };

    return (
        <section className="py-20 px-6 max-w-7xl mx-auto relative z-10">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                    AI Recommendations
                </h2>
            </div>
            
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-xl text-white shadow-xl"
                    >
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-purple-400 animate-pulse font-medium">Curating your playlist...</p>
                </div>
            ) : recommendations.length === 0 ? (
                <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
                    <p className="text-xl text-gray-400">Search for a song to discover new music.</p>
                </div>
            ) : (
                <>
                    {/* 🔥 MATCHED SONG BANNER */}
                    {matchedSong && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => onSelectSong(matchedSong)}
                            className="mb-12 relative group cursor-pointer"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                            <div className="relative bg-black/60 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] border border-white/10 flex flex-col md:flex-row items-center gap-6 md:gap-8 hover:border-purple-500/50 transition-colors">
                                <div className="absolute top-4 right-6 px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full border border-purple-500/30">
                                    Best Match
                                </div>
                                <div className="text-center md:text-left w-full pl-2">
                                    <h3 className="text-4xl font-black text-white mb-3">
                                        {matchedSong.title}
                                    </h3>
                                    <p className="text-lg text-gray-300 mb-4">
                                        {matchedSong.artist} <span className="text-gray-600">•</span> {matchedSong.album}
                                    </p>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm mt-4">
                                        <span className="bg-white/10 px-3 py-1.5 rounded-lg text-gray-300">
                                            🔥 Pop: {matchedSong.popularity}
                                        </span>
                                        <span className="bg-white/10 px-3 py-1.5 rounded-lg text-gray-300">
                                            ⏱ {formatDuration(matchedSong.duration_ms)}
                                        </span>
                                        <button 
                                            onClick={(e) => handleFavorite(e, matchedSong)}
                                            className="ml-auto bg-primary/20 hover:bg-primary/40 text-primary px-4 py-2 rounded-xl flex items-center gap-2 transition-colors border border-primary/30"
                                        >
                                            <Star className="w-4 h-4" /> Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 🔥 RECOMMENDATIONS GRID */}
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12"></div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {recommendations.map((song, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => onSelectSong(song)}
                                className="group bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(168,85,247,0.2)]"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors leading-tight max-w-[85%] overflow-hidden text-ellipsis display-webkit-box webkit-line-clamp-2 webkit-box-orient-vertical">
                                        {song.title}
                                    </h3>
                                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 group-hover:bg-purple-500 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.6)] transition-all duration-300">
                                        <svg className="w-4 h-4 text-purple-200 group-hover:text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 truncate mb-1">
                                    {song.artist}
                                </p>
                                <p className="text-xs text-gray-500 truncate mb-6 pb-4 border-b border-white/5">
                                    {song.album}
                                </p>

                                <div className="flex items-center justify-between mt-auto bg-black/30 p-2.5 rounded-xl border border-white/5">
                                    <span className="text-xs font-medium text-gray-400 bg-white/5 px-2 py-1 rounded-md">
                                        Pop: {song.popularity}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {song.preview_url && (
                                            <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                                Preview
                                            </span>
                                        )}
                                        <button 
                                            onClick={(e) => handleFavorite(e, song)}
                                            className="text-gray-400 hover:text-primary transition-colors p-1"
                                            title="Add to Favorites"
                                        >
                                            <Star className="w-4 h-4" />
                                        </button>
                                    </div>
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
