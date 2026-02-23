/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, RotateCcw, Settings, Volume2, VolumeX, 
  ChevronUp, ChevronDown, X, Home, Dumbbell, User, 
  FastForward, Info, Award, History, Clock, Star, Plus, Minus,
  ChevronLeft, Zap, Coffee, ShieldCheck, TrendingUp, Moon, Sun
} from 'lucide-react';

type TimerState = 'IDLE' | 'WARMUP' | 'FIGHT' | 'REST' | 'FINISHED';
type Tab = 'home' | 'workouts' | 'profile';
type View = 'tabs' | 'setup' | 'timer';

interface Config {
  rounds: number;
  fightTime: number; // in seconds
  restTime: number;
  warmupTime: number;
}

const DEFAULT_CONFIG: Config = {
  rounds: 12,
  fightTime: 180, // 3 minutes
  restTime: 60,   // 1 minute
  warmupTime: 10, // 10 seconds
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [currentView, setCurrentView] = useState<View>('tabs');
  const [isPremium, setIsPremium] = useState(false);
  
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  
  // Timer State
  const [timerState, setTimerState] = useState<TimerState>('IDLE');
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(config.warmupTime);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(true);

  // Auto-hide splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  // Sound generator
  const playSound = useCallback((frequency: number, duration: number) => {
    if (isMuted) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, [isMuted]);

  const handleTimerEnd = useCallback(() => {
    if (timerState === 'WARMUP') {
      playSound(880, 0.5);
      setTimerState('FIGHT');
      setTimeLeft(config.fightTime);
    } else if (timerState === 'FIGHT') {
      if (currentRound < config.rounds) {
        playSound(440, 0.5);
        setTimerState('REST');
        setTimeLeft(config.restTime);
      } else {
        playSound(880, 1.0);
        setTimerState('FINISHED');
        setIsActive(false);
        setShowRating(true);
      }
    } else if (timerState === 'REST') {
      playSound(880, 0.5);
      setTimerState('FIGHT');
      setCurrentRound(prev => prev + 1);
      setTimeLeft(config.fightTime);
    }
  }, [timerState, currentRound, config, playSound]);

  const skipPhase = () => {
    handleTimerEnd();
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        if (timerState === 'FIGHT' && timeLeft <= 11 && timeLeft > 1) {
          playSound(660, 0.1);
        }
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerEnd();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, handleTimerEnd, timerState, playSound]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const startTraining = () => {
    setTimerState('WARMUP');
    setTimeLeft(config.warmupTime);
    setCurrentRound(1);
    setIsActive(true);
    setCurrentView('timer');
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimerState('IDLE');
    setCurrentRound(1);
    setTimeLeft(config.warmupTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getThemeColor = () => {
    switch (timerState) {
      case 'FIGHT': 
        return timeLeft <= 10 ? 'var(--color-fight-warn)' : 'var(--color-fight)';
      case 'REST': return 'var(--color-rest)';
      case 'WARMUP': return 'var(--color-warmup)';
      default: return '#333';
    }
  };

  const getProgress = () => {
    let total = 1;
    if (timerState === 'WARMUP') total = config.warmupTime;
    if (timerState === 'FIGHT') total = config.fightTime;
    if (timerState === 'REST') total = config.restTime;
    return (timeLeft / total) * 100;
  };

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (getProgress() / 100) * circumference;

  if (showSplash) {
    return (
      <motion.div 
        className="fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center p-8 text-center"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-12"
        >
          <div className="w-32 h-32 bg-fight-warn rounded-[32px] flex items-center justify-center mb-6 shadow-2xl shadow-fight-warn/20 rotate-12">
            <Dumbbell size={64} className="text-white -rotate-12" />
          </div>
          <h1 className="font-display text-5xl font-extrabold italic tracking-tighter mb-2">SparTime</h1>
          <p className="text-white/40 font-medium tracking-wide">TRAIN LIKE A PRO</p>
        </motion.div>
        
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-fight-warn"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: "linear" }}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg text-white">
      {/* Background Atmosphere */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 blur-[100px] transition-colors duration-1000"
        style={{ 
          background: `radial-gradient(circle at 50% 50%, ${currentView === 'timer' ? getThemeColor() : 'var(--color-warmup)'} 0%, transparent 70%)` 
        }}
      />

      <AnimatePresence>
        {currentView === 'tabs' && (
          <motion.div 
            key="tabs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col pb-24"
          >
            {/* Header */}
            <header className="p-6 flex justify-between items-center z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">Boxing Timer</span>
                <h1 className="font-display text-xl font-extrabold italic tracking-tight">SparTime</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 shadow-sm transition-all ${
                  isPremium 
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 ring-1 ring-amber-500/10' 
                    : 'bg-white/5 text-white/40 border-white/10'
                }`}>
                  {isPremium ? (
                    <>
                      <ShieldCheck size={10} />
                      PRO
                    </>
                  ) : (
                    'Free'
                  )}
                </div>
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-full hover:bg-white/5 transition-colors"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>
            </header>

            <main className="flex-1 p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'home' && (
                  <motion.div 
                    key="home"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    {/* Welcome Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-fight-warn/20 to-warmup/20 border border-white/10 rounded-[32px] p-8">
                      <div className="relative z-10">
                        <h2 className="text-3xl font-display font-black italic mb-2">Ready to Spar?</h2>
                        <p className="text-white/60 mb-6 max-w-[200px]">Set your rounds and push your limits today.</p>
                        <button 
                          onClick={() => setCurrentView('setup')}
                          className="px-8 py-4 bg-white text-black font-bold rounded-2xl flex items-center gap-2 active:scale-95 transition-transform"
                        >
                          <Play size={18} fill="currentColor" />
                          Start Session
                        </button>
                      </div>
                      <Dumbbell size={120} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <TrendingUp size={20} className="text-rest mb-2" />
                        <div className="text-2xl font-display font-bold">128</div>
                        <div className="text-[10px] uppercase tracking-widest opacity-40">Total Rounds</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <Clock size={20} className="text-warmup mb-2" />
                        <div className="text-2xl font-display font-bold">4.2h</div>
                        <div className="text-[10px] uppercase tracking-widest opacity-40">Training Time</div>
                      </div>
                    </div>

                    {/* Premium CTA */}
                    {!isPremium && (
                      <div className="bg-zinc-900 border border-yellow-500/30 rounded-[32px] p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4">
                          <Zap size={24} className="text-yellow-500 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-display font-bold italic mb-2">Unlock Pro Features</h3>
                        <p className="text-white/50 text-sm mb-6">Get custom workout presets, advanced analytics, and zero ads.</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Coffee size={18} className="text-yellow-500" />
                            <span className="text-sm font-medium text-white/80">Cheaper than a coffee!</span>
                          </div>
                          <button 
                            onClick={() => setIsPremium(true)}
                            className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl active:scale-95 transition-transform"
                          >
                            $1.99 / mo
                          </button>
                        </div>
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl group-hover:bg-yellow-500/10 transition-colors" />
                      </div>
                    )}

                    {/* Quick Start Presets */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest opacity-40 mb-4 px-1">Quick Start</h4>
                      <div className="space-y-3">
                        {[
                          { name: 'Standard Sparring', rounds: 12, time: '3:00' },
                          { name: 'Heavy Bag Drill', rounds: 8, time: '2:00' },
                        ].map((p, i) => (
                          <button 
                            key={i}
                            onClick={() => {
                              setConfig({ ...config, rounds: p.rounds, fightTime: parseInt(p.time) * 60 });
                              setCurrentView('setup');
                            }}
                            className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                                <RotateCcw size={18} className="text-white/40" />
                              </div>
                              <div className="text-left">
                                <div className="font-bold">{p.name}</div>
                                <div className="text-[10px] opacity-40 uppercase tracking-widest">{p.rounds} Rounds • {p.time} min</div>
                              </div>
                            </div>
                            <ChevronUp className="rotate-90 opacity-20" size={18} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'workouts' && (
                  <motion.div 
                    key="workouts"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h2 className="text-3xl font-display font-extrabold italic mb-6">Workouts</h2>
                    <div className="grid gap-4">
                      {[
                        { name: 'Heavy Bag Blast', rounds: 12, time: '3:00', icon: <Dumbbell className="text-fight-warn" /> },
                        { name: 'Speed Bag Drill', rounds: 6, time: '2:00', icon: <Clock className="text-warmup" /> },
                        { name: 'Shadow Boxing', rounds: 3, time: '3:00', icon: <User className="text-rest" /> },
                      ].map((w, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              {w.icon}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{w.name}</h3>
                              <p className="text-white/40 text-sm">{w.rounds} Rounds • {w.time} min</p>
                            </div>
                          </div>
                          <ChevronUp className="rotate-90 opacity-20" />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'profile' && (
                  <motion.div 
                    key="profile"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h2 className="text-3xl font-display font-extrabold italic mb-8">Profile</h2>
                    
                    <div className="flex items-center gap-6 mb-10">
                      <div className="w-20 h-20 bg-gradient-to-br from-fight-warn to-warmup rounded-3xl flex items-center justify-center text-3xl font-display font-black italic">
                        JD
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">John Doe</h3>
                        <p className="text-white/40">Amateur Lightweight</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <Award className="text-yellow-500 mb-2" />
                        <div className="text-2xl font-display font-bold">42</div>
                        <div className="text-white/40 text-xs uppercase tracking-widest">Workouts</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <History className="text-warmup mb-2" />
                        <div className="text-2xl font-display font-bold">12.5h</div>
                        <div className="text-white/40 text-xs uppercase tracking-widest">Total Time</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="flex items-center gap-3 font-medium text-sm opacity-80">
                          <Zap size={18} className="text-warmup" /> Appearance
                        </span>
                        <button 
                          onClick={() => setIsDarkMode(!isDarkMode)}
                          className={`relative w-20 h-10 rounded-full p-1.5 transition-all duration-300 ${isDarkMode ? 'bg-indigo-900' : 'bg-sky-400'}`}
                        >
                          <motion.div 
                            className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md z-10 relative"
                            animate={{ x: isDarkMode ? 40 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            {isDarkMode ? (
                              <motion.div initial={{ rotate: -90 }} animate={{ rotate: 0 }}><Moon size={16} className="text-indigo-900 fill-indigo-900" /></motion.div>
                            ) : (
                              <motion.div initial={{ rotate: 90 }} animate={{ rotate: 0 }}><Sun size={16} className="text-sky-500 fill-sky-500" /></motion.div>
                            )}
                          </motion.div>
                          <div className="absolute inset-0 flex items-center justify-between px-3.5">
                            <Moon size={14} className={`text-white transition-opacity duration-300 ${isDarkMode ? 'opacity-100' : 'opacity-0'}`} />
                            <Sun size={14} className={`text-white transition-opacity duration-300 ${isDarkMode ? 'opacity-0' : 'opacity-100'}`} />
                          </div>
                        </button>
                      </div>
                      <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <span className="flex items-center gap-3"><Settings size={18} /> Settings</span>
                        <ChevronUp className="rotate-90 opacity-20" size={18} />
                      </button>
                      <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <span className="flex items-center gap-3"><Info size={18} /> Help & Support</span>
                        <ChevronUp className="rotate-90 opacity-20" size={18} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex justify-around items-center z-50">
              <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={24} />} label="Home" />
              <NavButton active={activeTab === 'workouts'} onClick={() => setActiveTab('workouts')} icon={<Dumbbell size={24} />} label="Workouts" />
              <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={24} />} label="Profile" />
            </nav>
          </motion.div>
        )}

        {currentView === 'setup' && (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar"
          >
            {/* Top Space with Premium Card */}
            <div className="min-h-[45vh] flex flex-col justify-end pb-8">
              {!isPremium && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={16} className="text-amber-500 fill-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Pro Recommendation</span>
                    </div>
                    <h3 className="text-lg font-display font-black italic mb-1">Get Prebuilt Workouts</h3>
                    <p className="text-sm opacity-60 mb-4">Upgrade to Pro to access expert-designed routines and save your own presets.</p>
                    <button 
                      onClick={() => setIsPremium(true)}
                      className="text-xs font-bold underline underline-offset-4 hover:text-amber-500 transition-colors"
                    >
                      Learn more about Pro
                    </button>
                  </div>
                  <Zap size={80} className="absolute -right-4 -bottom-4 text-amber-500/10 -rotate-12" />
                </motion.div>
              )}
            </div>

            <header className="flex items-center gap-4 mb-10">
              <button 
                onClick={() => setCurrentView('tabs')}
                className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-2xl font-display font-black italic tracking-tight">Session Setup</h2>
            </header>

            <div className="space-y-5 pb-10">
              <ConfigStepper 
                label="Rounds" 
                value={config.rounds} 
                onChange={(v) => setConfig(prev => ({ ...prev, rounds: Math.max(1, v) }))}
              />
              <ConfigStepper 
                label="Fight Time" 
                value={config.fightTime} 
                isTime
                onChange={(v) => setConfig(prev => ({ ...prev, fightTime: Math.max(10, v) }))}
                step={30}
              />
              <ConfigStepper 
                label="Rest Time" 
                value={config.restTime} 
                isTime
                onChange={(v) => setConfig(prev => ({ ...prev, restTime: Math.max(5, v) }))}
                step={10}
              />
              <ConfigStepper 
                label="Warmup" 
                value={config.warmupTime} 
                isTime
                onChange={(v) => setConfig(prev => ({ ...prev, warmupTime: Math.max(5, v) }))}
                step={5}
              />
            </div>

            <button
              onClick={startTraining}
              className="w-full py-5 bg-white text-black font-bold rounded-2xl shadow-xl shadow-white/5 active:scale-95 transition-transform flex items-center justify-center gap-3"
            >
              <Play size={20} fill="currentColor" />
              Start Training
            </button>
          </motion.div>
        )}

        {currentView === 'timer' && (
          <motion.div 
            key="timer"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex-1 flex flex-col items-center justify-center p-6"
          >
            {/* Header */}
            <div className="w-full max-w-md flex justify-between items-center mb-12 z-10">
              <button 
                onClick={() => {
                  setIsActive(false);
                  setCurrentView('setup');
                }}
                className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">Session Active</span>
                <h1 className="font-display text-xl font-extrabold italic tracking-tight">SparTime</h1>
              </div>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>

            {/* Timer Display */}
            <div className="relative flex items-center justify-center z-10 mb-12">
              <svg className="w-80 h-80 -rotate-90">
                <circle
                  cx="160"
                  cy="160"
                  r={radius}
                  fill="transparent"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="8"
                  strokeDasharray="4 8"
                />
                <motion.circle
                  cx="160"
                  cy="160"
                  r={radius}
                  fill="transparent"
                  stroke={getThemeColor()}
                  strokeWidth={timerState === 'FIGHT' && timeLeft <= 10 ? "16" : "12"}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ 
                    duration: 1, 
                    ease: "linear",
                    // Avoid the "refill sweep" by disabling transition when offset jumps back to circumference
                    strokeDashoffset: { duration: timeLeft === (timerState === 'WARMUP' ? config.warmupTime : timerState === 'FIGHT' ? config.fightTime : config.restTime) ? 0 : 1 }
                  }}
                  className="timer-ring"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={timerState + (timerState === 'FIGHT' && timeLeft <= 10 ? '-warn' : '')}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="font-display text-xl font-bold uppercase tracking-widest mb-1"
                    style={{ color: getThemeColor() }}
                  >
                    {timerState === 'FIGHT' && timeLeft <= 10 ? 'Finish Strong!' : (timerState === 'IDLE' ? 'Ready' : timerState)}
                  </motion.span>
                </AnimatePresence>
                
                <span className="font-mono text-7xl font-bold tracking-tighter tabular-nums">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* Round Counter */}
            <div className="z-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-4 mb-12 flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Round</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-bold text-warmup">{currentRound}</span>
                <span className="text-xl opacity-30">/</span>
                <span className="text-xl opacity-30">{config.rounds}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="w-full max-w-md grid grid-cols-2 gap-4 z-10 mb-6">
              <button
                onClick={toggleTimer}
                className={`flex items-center justify-center gap-3 py-5 rounded-2xl font-bold transition-all active:scale-95 ${
                  isActive 
                    ? 'bg-white/10 text-white border border-white/20' 
                    : 'bg-warmup text-white shadow-lg shadow-warmup/20'
                }`}
              >
                {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                {isActive ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={resetTimer}
                className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 font-bold transition-all active:scale-95 hover:bg-orange-500/20"
              >
                <RotateCcw size={20} />
                Reset
              </button>
            </div>

            <button
              onClick={skipPhase}
              className="w-full max-w-md flex items-center justify-center gap-3 py-5 rounded-2xl bg-white/5 text-white/70 border border-white/10 font-bold transition-all active:scale-95 hover:bg-white/10"
            >
              <FastForward size={20} />
              Finish Phase
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[40px] p-10 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-rest/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award size={40} className="text-rest" />
              </div>
              <h2 className="text-3xl font-display font-extrabold italic mb-2">Finished Workout!</h2>
              <p className="text-white/60 mb-8">Congratulations on completing your session. You crushed it!</p>
              
              <div className="flex justify-center gap-2 mb-10">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button 
                    key={s} 
                    onClick={() => setRating(s)}
                    className="transition-transform active:scale-125"
                  >
                    <Star 
                      size={32} 
                      fill={s <= rating ? "var(--color-rest)" : "transparent"} 
                      stroke={s <= rating ? "var(--color-rest)" : "rgba(255,255,255,0.2)"} 
                    />
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setShowRating(false);
                  resetTimer();
                  setCurrentView('tabs');
                }}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl active:scale-95 transition-transform"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-fight-warn scale-110' : 'text-white/30 hover:text-white/50'}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function ConfigStepper({ label, value, onChange, isTime = false, step = 1 }: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void;
  isTime?: boolean;
  step?: number;
}) {
  const formatValue = (v: number) => {
    if (!isTime) return v;
    const m = Math.floor(v / 60);
    const s = v % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest px-2">{label}</span>
      <div className="flex items-center justify-between bg-white/5 rounded-[20px] p-1 border border-white/5">
        <button 
          onClick={() => onChange(value - step)}
          className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-90"
        >
          <Minus size={18} />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-xl font-display font-black tracking-tighter">
            {formatValue(value)}
          </span>
          {isTime && <span className="text-[7px] opacity-30 uppercase font-bold tracking-widest">Minutes</span>}
        </div>

        <button 
          onClick={() => onChange(value + step)}
          className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-90"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
