import React, { useState, useEffect, useContext } from 'react';
import { Music, Search, Menu, X, LogOut, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/authContext.js';
import { useTheme } from '../../context/useTheme.js';
import PremiumUpgradeButton from '../billing/PremiumUpgradeButton.jsx';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'Contact', href: '/contact' },
    { name: 'About', href: '/about' },
  ];

  if (user) {
    navLinks.push({ name: 'Favorites', href: '/favorites' });
  }

  const isActive = (path) => (path === '/' ? location.pathname === '/' : location.pathname === path);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'glass-surface-strong border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.18)]' : 'bg-transparent pt-4'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-shadow duration-500">
            <Music className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:to-white transition-all duration-500">
            AI Music
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.href} className={`text-sm font-medium tracking-wide relative group transition-colors duration-300 ${isActive(link.href) ? 'app-text' : 'app-muted hover:text-white'}`}>
              {link.name}
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 ${isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'}`} />
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              navigate('/');
              window.requestAnimationFrame(() => {
                document.getElementById('hero-search')?.focus({ preventScroll: false });
                document.getElementById('hero-search')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              });
            }}
            className="p-2 rounded-full hover:bg-white/10 transition-colors duration-300"
            title="Search songs"
            aria-label="Search songs"
          >
            <Search className="w-5 h-5 app-muted" />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/10 transition-colors duration-300"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {user ? (
            <div className="flex items-center gap-4">
              {!user.is_premium && <PremiumUpgradeButton compact />}
              <span className="text-primary font-semibold">Hello, {user.username}</span>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center hover:bg-red-500/20 transition-all duration-300 text-red-500 group"
                title="Logout"
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="app-muted hover:text-white font-medium transition-colors">Login</Link>
              <Link to="/register" className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full font-medium transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)]">Sign Up</Link>
            </div>
          )}
        </div>

        <button className="md:hidden p-2 app-text" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden glass-surface-strong border-b border-white/10 overflow-hidden">
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.href} className="app-muted hover:text-white text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                  {link.name}
                </Link>
              ))}
              <button type="button" onClick={toggleTheme} className="flex items-center gap-2 app-muted hover:text-white font-medium">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
              <div className="h-px bg-white/10 my-2" />
              {user ? (
                <>
                  {!user.is_premium && <PremiumUpgradeButton compact className="mb-2" />}
                  <div className="text-primary font-medium px-2 py-1">Logged in as {user.username}</div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 font-medium"
                  >
                    <LogOut size={20} /> Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-3 mt-2">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="app-muted hover:text-white font-medium text-lg">Login</Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="bg-primary/20 text-primary px-4 py-2 rounded-xl font-medium text-center border border-primary/30">Create Account</Link>
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
