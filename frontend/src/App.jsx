import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import Features from './components/Features';
import Contact from './components/Contact';
import Login from './components/Login';
import Register from './components/Register';
import Favorites from './components/Favorites';
import { AuthProvider } from './context/AuthContext';

function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background text-white selection:bg-primary/30">
        <Navbar />

        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/favorites" element={<Favorites />} />
          </Routes>
        </AnimatePresence>
      </div>
    </AuthProvider>
  );
}

export default App;
