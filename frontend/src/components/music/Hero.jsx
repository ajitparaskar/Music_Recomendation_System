import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { backendUrl } from '../../config';

const Hero = ({ onSearch }) => {
    const [song, setSong] = useState("");
    const [suggestions, setSuggestions] = useState([]);

    const fetchSuggestions = async (value) => {
        if (value.length < 2) {
            setSuggestions([]);
            return;
        }

        const response = await fetch(backendUrl + "/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: value }),
        });

        const data = await response.json();
        setSuggestions(data.suggestions);
    };

    const handleChange = (e) => {
        const value = e.target.value;
        setSong(value);
        fetchSuggestions(value);
    };

    const handleSelect = (selectedSong) => {
        setSong(selectedSong);
        setSuggestions([]);
        onSearch(selectedSong);
    };

    const handleSearchClick = () => {
        if (song.trim() !== "") {
            setSuggestions([]);
            onSearch(song);
        }
    };

    return (
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
            {/* Animated Background Gradients */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px]"
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[150px]"
                />
            </div>

            <div className="relative z-10 text-center px-4 w-full max-w-5xl mx-auto">
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-gray-400"
                >
                    Discover Music with <br className="hidden md:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">AI Intelligence</span>
                </motion.h1>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative max-w-2xl mx-auto"
                >
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-focus-within:opacity-75"></div>
                        <input
                            type="text"
                            value={song}
                            onChange={handleChange}
                            placeholder="Search for a song, artist, or mood..."
                            className="relative w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-full py-5 pl-8 pr-16 text-white text-lg placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-2xl"
                        />

                        <button
                            onClick={handleSearchClick}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                        >
                            <Search className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* 🔥 AUTOCOMPLETE DROPDOWN */}
                    {suggestions.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute w-full bg-black/80 backdrop-blur-2xl border border-white/10 mt-4 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden z-50"
                        >
                            {suggestions.map((item, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleSelect(item)}
                                    className="px-6 py-4 cursor-pointer hover:bg-white/10 transition-colors text-left text-sm md:text-base border-b border-white/5 last:border-0 flex items-center gap-3"
                                >
                                    <Search className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-200 hover:text-white transition-colors">{item}</span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
