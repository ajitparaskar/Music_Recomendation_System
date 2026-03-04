import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Music2, Zap, Shield, TrendingUp, Search, Heart } from 'lucide-react';

const Features = () => {
    const features = [
        {
            icon: Brain,
            title: 'AI-Powered Recommendations',
            description: 'Advanced machine learning algorithms analyze your music preferences to suggest songs you\'ll love.',
            color: 'from-purple-500 to-pink-500'
        },
        {
            icon: Search,
            title: 'Smart Search',
            description: 'Intelligent autocomplete and search functionality to quickly find your favorite tracks.',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            icon: Music2,
            title: 'Music Discovery',
            description: 'Discover new artists and genres based on your listening history and preferences.',
            color: 'from-green-500 to-emerald-500'
        },
        {
            icon: Zap,
            title: 'Lightning Fast',
            description: 'Optimized performance ensures instant recommendations and smooth user experience.',
            color: 'from-yellow-500 to-orange-500'
        },
        {
            icon: Shield,
            title: 'Privacy First',
            description: 'Your data is secure and private. We never share your listening habits with third parties.',
            color: 'from-red-500 to-rose-500'
        },
        {
            icon: TrendingUp,
            title: 'Personalized Experience',
            description: 'Get recommendations tailored specifically to your unique taste and mood.',
            color: 'from-indigo-500 to-purple-500'
        },
        {
            icon: Heart,
            title: 'Favorite Tracks',
            description: 'Save and organize your favorite songs for easy access anytime.',
            color: 'from-pink-500 to-rose-500'
        },
        {
            icon: Sparkles,
            title: 'Beautiful UI',
            description: 'Modern, intuitive interface designed for the best user experience.',
            color: 'from-cyan-500 to-blue-500'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen pt-24 pb-12 px-6 relative overflow-hidden"
        >
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-glow" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] animate-pulse-glow delay-1000" />
            </div>

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-2">What We Offer</h2>
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Powerful Features
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Experience the future of music discovery with our cutting-edge AI technology
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.6 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl hover:border-primary/50 transition-all duration-300 group relative overflow-hidden"
                        >
                            {/* Gradient Background on Hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                            
                            <div className="relative z-10">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                                    {feature.title}
                                </h3>
                                
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Additional Info Section */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="mt-16 bg-black/40 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl"
                >
                    <div className="max-w-4xl mx-auto text-center">
                        <h3 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            Ready to Discover Your Next Favorite Song?
                        </h3>
                        <p className="text-gray-400 text-lg mb-8">
                            Start exploring music like never before with our AI-powered recommendation system. 
                            Simply search for a song you love, and we'll find similar tracks that match your taste.
                        </p>
                        <motion.a
                            href="/"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-block bg-gradient-to-r from-primary to-secondary text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            Get Started
                        </motion.a>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Features;
