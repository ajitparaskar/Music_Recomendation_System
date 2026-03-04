import React from 'react';
import { motion } from 'framer-motion';

const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const RecommendationSection = ({ matchedSong, recommendations, loading, onSelectSong }) => {
    return (
        <section className="py-20 px-6 max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">AI Recommendations</h2>

            {loading ? (
                <p className="text-gray-400">Loading...</p>
            ) : recommendations.length === 0 ? (
                <p className="text-gray-400">Search for a song.</p>
            ) : (
                <>
                    {matchedSong && (
                        <div
                            onClick={() => onSelectSong(matchedSong)}
                            className="mb-10 bg-white/5 p-6 rounded-2xl border border-purple-500 cursor-pointer hover:border-purple-300 transition"
                        >
                            <h3 className="text-xl text-purple-400 font-bold mb-3">
                                Matched Song
                            </h3>

                            <div className="flex items-center gap-4">
                                {matchedSong.image && (
                                    <img
                                        src={matchedSong.image}
                                        alt={matchedSong.title}
                                        className="w-20 h-20 rounded-xl object-cover"
                                    />
                                )}

                                <div>
                                    <p className="text-lg font-semibold text-white">
                                        {matchedSong.title}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        {matchedSong.artist} • {matchedSong.album}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Popularity: {matchedSong.popularity} • {formatDuration(matchedSong.duration_ms)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {recommendations.map((song, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => onSelectSong(song)}
                                className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-purple-400 transition cursor-pointer"
                            >
                                {song.image && (
                                    <img
                                        src={song.image}
                                        alt={song.title}
                                        className="w-full h-40 rounded-xl object-cover mb-4"
                                    />
                                )}

                                <h3 className="text-lg font-bold text-white">
                                    {song.title}
                                </h3>

                                <p className="text-sm text-gray-400">
                                    {song.artist}
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                    {song.album}
                                </p>

                                <p className="text-xs text-gray-500">
                                    Popularity: {song.popularity}
                                </p>

                                <div className="flex justify-between mt-3 text-xs">
                                    {song.preview_url && (
                                        <span className="text-green-400">
                                            30s Preview Available
                                        </span>
                                    )}

                                    <a
                                        href={song.spotify_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-purple-400 hover:underline"
                                    >
                                        Open in Spotify
                                    </a>
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
