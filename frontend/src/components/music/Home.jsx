import React, { useState } from 'react';
import Hero from './Hero';
import RecommendationSection from './RecommendationSection';
import MusicPlayer from './MusicPlayer';
import { motion } from 'framer-motion';
import { backendUrl } from '../../config';

const Home = () => {
    const [matchedSong, setMatchedSong] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentSong, setCurrentSong] = useState(null); // 🔥 NEW

    const fetchRecommendations = async (song) => {
        try {
            setLoading(true);

            const response = await fetch(backendUrl + "/recommend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ song }),
            });

            const data = await response.json();
            console.log("Response from backend:", data);

            setMatchedSong(data.matched_song);
            setRecommendations(data.recommendations);

            // Automatically set matched song as current song
            if (data.matched_song) {
                setCurrentSong(data.matched_song);
            }

        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Hero onSearch={fetchRecommendations} />

            <div className="relative z-10 pb-32">
                <RecommendationSection
                    matchedSong={matchedSong}
                    recommendations={recommendations}
                    loading={loading}
                    onSelectSong={setCurrentSong}  // 🔥 PASS HANDLER
                />
            </div>

            <MusicPlayer song={currentSong} /> {/* 🔥 PASS CURRENT SONG */}
        </motion.div>
    );
};

export default Home;
