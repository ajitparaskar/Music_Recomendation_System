import React, { useEffect, useRef, useState } from 'react';
import { Camera, Mic, Search, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../../api/client';

const MOOD_OPTIONS = [
  { id: 'happy', label: 'Happy' },
  { id: 'sad', label: 'Sad' },
  { id: 'energetic', label: 'Energetic' },
  { id: 'chill', label: 'Chill' },
];

const Hero = ({
  onSearch,
  onMoodSelect,
  onDetectMoodFromCamera,
  activeMood,
  detectedEmotion,
  detectedMood,
  recommendationMessage,
  detectionLoading,
}) => {
  const [song, setSong] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  const fetchSuggestions = async (value) => {
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const data = await apiRequest('/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: value }),
      });
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch {
      setSuggestions([]);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  useEffect(() => () => stopCamera(), []);

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
  }, []);

  useEffect(() => {
    if (!cameraOpen) {
      stopCamera();
      return undefined;
    }

    let active = true;

    const startCamera = async () => {
      setCameraError('');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (error) {
        setCameraError(error?.message || 'Unable to access camera.');
        setCameraReady(false);
      }
    };

    startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [cameraOpen]);

  const handleChange = (event) => {
    const value = event.target.value;
    setSong(value);
    setVoiceError('');
    fetchSuggestions(value);
  };

  const handleSelect = (selectedSong) => {
    const searchLabel = selectedSong?.title || '';
    setSong(searchLabel);
    setSuggestions([]);
    onSearch(searchLabel);
  };

  const handleSearchClick = () => {
    if (song.trim() !== '') {
      setSuggestions([]);
      onSearch(song.trim());
    }
  };

  const handleCaptureMood = async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('Unable to process camera frame.');
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    const image = canvas.toDataURL('image/jpeg', 0.85);

    try {
      await onDetectMoodFromCamera(image);
      setCameraOpen(false);
    } catch (error) {
      setCameraError(error?.message || 'Unable to detect mood from camera.');
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || voiceListening) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceListening(true);
      setVoiceError('');
    };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();
      setSong(transcript);
      fetchSuggestions(transcript);
    };
    recognition.onerror = (event) => {
      const messages = {
        'no-speech': 'No speech detected. Try again and speak a little louder.',
        'not-allowed': 'Microphone permission denied. Please allow access and try again.',
        'audio-capture': 'No microphone was found on this device.',
      };
      setVoiceError(messages[event.error] || 'Voice recognition failed. Please try again.');
      setVoiceListening(false);
    };
    recognition.onend = () => setVoiceListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-16">
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[150px]"
        />
      </div>

      <div className="relative z-10 text-center px-4 w-full max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-gray-400"
        >
          Discover Music with <br className="hidden md:block" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">AI Intelligence</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative max-w-3xl mx-auto"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-focus-within:opacity-75"></div>
            <input
              id="hero-search"
              type="text"
              value={song}
              onChange={handleChange}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearchClick();
                }
              }}
              placeholder="Search for a song, artist, or mood..."
              className="relative w-full glass-surface-strong rounded-full py-5 pl-8 pr-28 text-lg app-text placeholder:text-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-2xl"
            />

            <button
              type="button"
              onClick={startVoiceRecognition}
              className={`absolute right-16 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all ${
                voiceListening
                  ? 'bg-red-500/20 text-red-300 shadow-[0_0_20px_rgba(248,113,113,0.35)]'
                  : 'bg-white/10 text-gray-200 hover:bg-white/20'
              }`}
              aria-label="Start voice search"
            >
              <motion.span
                animate={voiceListening ? { scale: [1, 1.12, 1], opacity: [0.75, 1, 0.75] } : { scale: 1, opacity: 1 }}
                transition={{ duration: 1, repeat: voiceListening ? Infinity : 0 }}
                className="block"
              >
                <Mic className="w-5 h-5" />
              </motion.span>
            </button>

            <button
              type="button"
              onClick={handleSearchClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>

          {(voiceListening || voiceError || song) && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {voiceListening && (
                <span className="inline-flex items-center gap-2 rounded-full glass-surface px-4 py-2 text-sm text-red-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse"></span>
                  Listening for your music request...
                </span>
              )}
              {!voiceListening && song && (
                <span className="inline-flex items-center gap-2 rounded-full glass-surface px-4 py-2 text-sm app-muted">
                  Recognized: <strong className="app-text">{song}</strong>
                </span>
              )}
              {voiceError && (
                <span className="inline-flex items-center gap-2 rounded-full glass-surface px-4 py-2 text-sm text-red-300">
                  {voiceError}
                </span>
              )}
            </div>
          )}

          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute w-full glass-surface-strong mt-4 rounded-2xl overflow-hidden z-50"
            >
              {suggestions.map((item, index) => (
                <button
                  key={item.track_id || `${item.title}-${item.artist}-${index}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full px-6 py-4 hover:bg-white/10 transition-colors text-left text-sm md:text-base border-b border-white/5 last:border-0 flex items-center gap-3"
                >
                  <Search className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="app-text">{item.title}</p>
                    <p className="text-xs app-muted">{item.artist}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {MOOD_OPTIONS.map((mood) => (
            <button
              key={mood.id}
              type="button"
              onClick={() => onMoodSelect(mood.id)}
              className={`px-5 py-3 rounded-2xl border transition-all ${
                activeMood === mood.id
                  ? 'bg-secondary/20 border-secondary/40 text-secondary shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                  : 'glass-surface text-gray-200 hover:bg-white/10'
              }`}
            >
              {mood.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className="px-5 py-3 rounded-2xl border border-primary/30 bg-primary/15 text-primary hover:bg-primary/25 transition-all inline-flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Detect Mood from Camera
          </button>
        </motion.div>

        {(detectedEmotion || detectedMood || recommendationMessage) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 inline-flex max-w-3xl flex-wrap items-center justify-center gap-3 rounded-3xl glass-surface px-6 py-4 text-sm app-text"
          >
            {detectedEmotion && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Emotion: <strong>{detectedEmotion}</strong>
              </span>
            )}
            {detectedMood && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
                Mood: <strong>{detectedMood}</strong>
              </span>
            )}
            {recommendationMessage && <span className="app-muted">{recommendationMessage}</span>}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {cameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md px-4 py-8 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-2xl rounded-[2rem] glass-surface-strong p-6"
            >
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-2xl font-bold app-text">Camera Mood Detection</h3>
                  <p className="text-sm app-muted">Capture one frame and we’ll turn your detected emotion into music mood recommendations.</p>
                </div>
                <button type="button" onClick={() => setCameraOpen(false)} className="p-2 rounded-xl bg-white/5 app-muted hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-3xl overflow-hidden border border-white/10 bg-black/40 min-h-[320px] flex items-center justify-center">
                {cameraError ? (
                  <div className="p-8 text-center">
                    <p className="text-red-300 font-medium">{cameraError}</p>
                    <p className="app-muted text-sm mt-2">If the camera cannot be used, the backend will fall back to a chill mood recommendation.</p>
                  </div>
                ) : (
                  <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm app-muted">
                  {cameraReady ? 'Camera ready. Capture a frame when you are set.' : 'Waiting for camera access...'}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCameraOpen(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 app-muted hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCaptureMood}
                    disabled={!cameraReady || detectionLoading}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-50"
                  >
                    {detectionLoading ? 'Detecting...' : 'Capture & Detect'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Hero;
