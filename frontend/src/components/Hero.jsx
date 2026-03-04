import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

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
        <section className="relative h-screen flex items-center justify-center">
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-bold mb-6">
                    Discover Music with AI Intelligence
                </h1>

                <div className="relative max-w-xl mx-auto">
                    <input
                        type="text"
                        value={song}
                        onChange={handleChange}
                        placeholder="Search for a song..."
                        className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-6 pr-14 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />

                    <button
                        onClick={handleSearchClick}
                        className="absolute right-2 top-2 p-2 bg-purple-600 rounded-full"
                    >
                        <Search className="w-5 h-5 text-white" />
                    </button>

                    {/* 🔥 AUTOCOMPLETE DROPDOWN */}
                    {suggestions.length > 0 && (
                        <div className="absolute w-full bg-black/90 border border-white/10 mt-2 rounded-xl shadow-xl overflow-hidden z-50">
                            {suggestions.map((item, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleSelect(item)}
                                    className="px-4 py-3 cursor-pointer hover:bg-white/10 transition text-left text-sm"
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Hero;
