import React, { useState, useEffect, useContext } from 'react';
import { Music, Search, User, Menu, X, LogOut, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Update links to use real routes
    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Features', href: '/features' },
        { name: 'Contact', href: '/contact' },
        { name: 'About', href: '/about' },
    ];
    
    if (user) {
        navLinks.push({ name: 'Favorites', href: '/favorites' });
    }

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        if (path.startsWith('/#')) return false; // Anchor links handled differently
        return location.pathname === path;
    }


    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-black/50 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.6)]' : 'bg-transparent pt-4'}`}
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-shadow duration-500">
                        <Music className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:to-white transition-all duration-500">
                        AI Music
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.href}
                            className={`text-sm font-medium tracking-wide relative group transition-colors duration-300 ${isActive(link.href) ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            {link.name}
                            <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 ${isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                        </Link>
                    ))}
                </div>

                {/* Profile / Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <button className="p-2 rounded-full hover:bg-white/10 transition-colors duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        <Search className="w-5 h-5 text-gray-300" />
                    </button>
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-primary font-semibold">Hello, {user.username}</span>
                            <button 
                                onClick={() => { logout(); navigate('/'); }}
                                className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center hover:bg-red-500/20 transition-all duration-300 text-red-500 group"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link to="/login" className="text-gray-300 hover:text-white font-medium transition-colors">
                                Login
                            </Link>
                            <Link to="/register" className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full font-medium transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
                    >
                        <div className="flex flex-col p-6 gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.href}
                                    className="text-gray-300 hover:text-white text-lg font-medium"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="h-px bg-white/10 my-2" />
                            {user ? (
                                <>
                                    <div className="text-primary font-medium px-2 py-1">Logged in as {user.username}</div>
                                    <button 
                                        onClick={() => { setIsMobileMenuOpen(false); logout(); navigate('/'); }} 
                                        className="flex items-center gap-2 text-red-400 hover:text-red-300 font-medium"
                                    >
                                        <LogOut size={20} /> Logout
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col gap-3 mt-2">
                                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-300 hover:text-white font-medium text-lg">
                                        Login
                                    </Link>
                                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="bg-primary/20 text-primary px-4 py-2 rounded-xl font-medium text-center border border-primary/30">
                                        Create Account
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
