import React from 'react';
import { motion } from 'framer-motion';

const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const RecommendationSection = ({ matchedSong, recommendations, loading, onSelectSong }) => {
    return (
        <section className="py-20 px-6 max-w-7xl mx-auto relative z-10">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                    AI Recommendations
                </h2>
            </div>

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
                                {matchedSong.image && (
                                    <img
                                        src={matchedSong.image}
                                        alt={matchedSong.title}
                                        className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500"
                                    />
                                )}
                                <div className="text-center md:text-left">
                                    <h3 className="text-3xl font-bold text-white mb-2">
                                        {matchedSong.title}
                                    </h3>
                                    <p className="text-lg text-gray-300 mb-4">
                                        {matchedSong.artist} <span className="text-gray-600">•</span> {matchedSong.album}
                                    </p>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                                        <span className="bg-white/10 px-3 py-1.5 rounded-lg text-gray-300">
                                            🔥 Pop: {matchedSong.popularity}
                                        </span>
                                        <span className="bg-white/10 px-3 py-1.5 rounded-lg text-gray-300">
                                            ⏱ {formatDuration(matchedSong.duration_ms)}
                                        </span>
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
                                <div className="relative overflow-hidden rounded-2xl mb-4">
                                    {song.image ? (
                                        <img
                                            src={song.image}
                                            alt={song.title}
                                            className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full aspect-square bg-gray-800 flex items-center justify-center">
                                            <span className="text-gray-500">No Image</span>
                                        </div>
                                    )}
                                    {/* Play icon overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center transform scale-50 group-hover:scale-100 transition-transform duration-300 shadow-[0_0_20px_rgba(168,85,247,0.8)]">
                                            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                                    {song.title}
                                </h3>
                                <p className="text-sm text-gray-400 truncate mb-1">
                                    {song.artist}
                                </p>
                                <p className="text-xs text-gray-500 truncate mb-4">
                                    {song.album}
                                </p>

                                <div className="flex items-center justify-between mt-auto bg-black/30 p-2.5 rounded-xl border border-white/5">
                                    <span className="text-xs font-medium text-gray-400 bg-white/5 px-2 py-1 rounded-md">
                                        Pop: {song.popularity}
                                    </span>
                                    {song.preview_url && (
                                        <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                            Preview
                                        </span>
                                    )}
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
