import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, MessageCircle, Mic, Send, User, X } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { AuthContext } from '../../context/authContext.js';

const createMessage = (role, content, extra = {}) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  ...extra,
});

const speechRecognitionFactory = () => window.SpeechRecognition || window.webkitSpeechRecognition || null;

const ChatAssistant = ({ onRecommendations }) => {
  const { token, user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    createMessage('bot', 'Hi, I can help you discover music. Try "Play sad songs", "Suggest workout music", or "Arijit Singh songs".'),
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const messagesRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSupported = useMemo(() => Boolean(speechRecognitionFactory()), []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
  }, []);

  const appendMessage = (message) => {
    setMessages((previous) => [...previous, message]);
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    appendMessage(createMessage('user', trimmed));
    setInput('');
    setVoiceError('');
    setIsTyping(true);

    try {
      const data = await apiRequest('/chatbot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: trimmed }),
      });

      window.setTimeout(() => {
        appendMessage(
          createMessage('bot', data.message || 'Here is something you might like.', {
            recommendations: data.recommendations || [],
            intent: data.intent || null,
          }),
        );
        setIsTyping(false);
        onRecommendations?.(data);
      }, 700);
    } catch (error) {
      window.setTimeout(() => {
        appendMessage(createMessage('bot', error.message || 'Something went wrong while searching. Please try again.'));
        setIsTyping(false);
      }, 500);
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = speechRecognitionFactory();
    if (!SpeechRecognition || isListening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError('');
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      const messagesMap = {
        'no-speech': 'No speech detected. Please try again.',
        'not-allowed': 'Microphone permission denied. Please allow microphone access.',
        'audio-capture': 'No microphone was found on this device.',
      };
      setVoiceError(messagesMap[event.error] || 'Voice recognition failed.');
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();
      setInput(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="fixed bottom-6 right-6 z-[80] w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-[0_20px_40px_rgba(0,0,0,0.35)] flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Open music assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed bottom-28 right-6 z-[79] w-[380px] max-w-[calc(100vw-2rem)] rounded-[2rem] glass-surface-strong overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="app-text font-semibold">Music Assistant</h3>
                  <p className="text-xs app-muted">Chat or speak to discover music</p>
                </div>
              </div>
            </div>

            <div ref={messagesRef} className="h-[420px] overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-3xl px-4 py-3 ${message.role === 'user' ? 'bg-primary text-white rounded-br-md' : 'glass-surface text-gray-100 rounded-bl-md'}`}>
                    <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wide opacity-75">
                      {message.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      {message.role}
                    </div>
                    <p className="text-sm leading-6">{message.content}</p>

                    {message.recommendations?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.recommendations.slice(0, 4).map((song) => (
                          <button
                            key={`${song.track_id || song.title}-${song.artist}`}
                            type="button"
                            onClick={() =>
                              onRecommendations?.({
                                matched_song: null,
                                recommendations: message.recommendations,
                                message: message.content,
                                mood: song.mood || message.intent?.mood || '',
                                detected_emotion: '',
                              })
                            }
                            className="w-full text-left rounded-2xl border border-white/10 bg-black/20 px-3 py-2 hover:bg-white/10 transition-colors"
                          >
                            <p className="text-sm font-medium app-text truncate">{song.title}</p>
                            <p className="text-xs app-muted truncate">{song.artist}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-3xl rounded-bl-md px-4 py-3 glass-surface">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((dot) => (
                        <motion.span
                          key={dot}
                          animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.15 }}
                          className="w-2 h-2 rounded-full bg-primary"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    rows={2}
                    placeholder="Ask for songs by mood, artist, or style..."
                    className="w-full resize-none bg-transparent text-sm app-text placeholder:text-gray-500 focus:outline-none"
                  />
                </div>

                {speechSupported && (
                  <button
                    type="button"
                    onClick={startVoiceRecognition}
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors ${isListening ? 'bg-red-500/20 border-red-400/40 text-red-300' : 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10'}`}
                    aria-label="Start voice search"
                  >
                    <motion.span animate={isListening ? { scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] } : { scale: 1, opacity: 1 }} transition={{ duration: 0.9, repeat: isListening ? Infinity : 0 }} className="block">
                      <Mic className="w-5 h-5" />
                    </motion.span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center disabled:opacity-50"
                  aria-label="Send chat message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {(isListening || voiceError || input || (user && !user.is_premium)) && (
                <div className="mt-3 space-y-1">
                  {isListening && <p className="text-xs text-primary">Listening... speak your music request.</p>}
                  {!isListening && input && <p className="text-xs app-muted">Recognized text: {input}</p>}
                  {voiceError && <p className="text-xs text-red-300">{voiceError}</p>}
                  {user && !user.is_premium && <p className="text-xs text-amber-300">Free plan uses the assistant in preview mode. Upgrade for fuller chat results.</p>}
                </div>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatAssistant;
