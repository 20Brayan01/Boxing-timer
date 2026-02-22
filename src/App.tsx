/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, RotateCcw, Settings, Volume2, VolumeX, 
  ChevronUp, ChevronDown, X, Home, Dumbbell, User, 
  FastForward, Info, Award, History, Clock
} from 'lucide-react';

type TimerState = 'IDLE' | 'WARMUP' | 'FIGHT' | 'REST' | 'FINISHED';
type Tab = 'home' | 'workouts' | 'profile';

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
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [showConfig, setShowConfig] = useState(false);
  
  // Timer State
  const [timerState, setTimerState] = useState<TimerState>('IDLE');
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(config.warmupTime);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

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
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerEnd();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, handleTimerEnd]);

  const toggleTimer = () => {
    if (timerState === 'IDLE' || timerState === 'FINISHED') {
      setTimerState('WARMUP');
      setTimeLeft(config.warmupTime);
      setCurrentRound(1);
    }
    setIsActive(!isActive);
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
      case 'FIGHT': return 'var(--color-fight)';
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
          <div className="w-32 h-32 bg-fight rounded-[32px] flex items-center justify-center mb-6 shadow-2xl shadow-fight/20 rotate-12">
            <Dumbbell size={64} className="text-white -rotate-12" />
          </div>
          <h1 className="font-display text-5xl font-extrabold italic tracking-tighter mb-2">SparTime</h1>
          <p className="text-white/40 font-medium tracking-wide">TRAIN LIKE A PRO</p>
        </motion.div>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => setShowSplash(false)}
          className="w-full max-w-xs py-5 bg-white text-black font-bold rounded-2xl shadow-xl active:scale-95 transition-transform"
        >
          Get Started
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg text-white pb-24">
      {/* Background Atmosphere */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 blur-[100px] transition-colors duration-1000"
        style={{ 
          background: `radial-gradient(circle at 50% 50%, ${activeTab === 'home' ? getThemeColor() : 'var(--color-warmup)'} 0%, transparent 70%)` 
        }}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col items-center"
            >
              {/* Header */}
              <div className="w-full max-w-md flex justify-between items-center mb-8 z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">Boxing Timer</span>
                  <h1 className="font-display text-xl font-extrabold italic tracking-tight">SparTime</h1>
                </div>
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-full hover:bg-white/5 transition-colors"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>

              {/* Timer Display */}
              <div className="relative flex items-center justify-center z-10 mb-8">
                <svg className="w-72 h-72 -rotate-90">
                  <circle
                    cx="144"
                    cy="144"
                    r={radius}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                    strokeDasharray="4 8"
                  />
                  <motion.circle
                    cx="144"
                    cy="144"
                    r={radius}
                    fill="transparent"
                    stroke={getThemeColor()}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "linear" }}
                    className="timer-ring"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={timerState}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="font-display text-xl font-bold uppercase tracking-widest mb-1"
                      style={{ color: getThemeColor() }}
                    >
                      {timerState === 'IDLE' ? 'Ready' : timerState}
                    </motion.span>
                  </AnimatePresence>
                  
                  <span className="font-mono text-6xl font-bold tracking-tighter tabular-nums">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* Round Counter */}
              <div className="z-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-3 mb-8 flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Round</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-display font-bold text-warmup">{currentRound}</span>
                  <span className="text-lg opacity-30">/</span>
                  <span className="text-lg opacity-30">{config.rounds}</span>
                </div>
              </div>

              {/* Main Controls */}
              <div className="w-full max-w-md grid grid-cols-2 gap-3 z-10 mb-4">
                <button
                  onClick={toggleTimer}
                  className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all active:scale-95 ${
                    isActive 
                      ? 'bg-white/10 text-white border border-white/20' 
                      : 'bg-warmup text-white shadow-lg shadow-warmup/20'
                  }`}
                >
                  {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                  {isActive ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={resetTimer}
                  className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 font-bold transition-all active:scale-95 hover:bg-orange-500/20"
                >
                  <RotateCcw size={20} />
                  Reset
                </button>
              </div>

              {/* Secondary Controls */}
              <div className="w-full max-w-md flex flex-col gap-3 z-10">
                {(isActive || timerState !== 'IDLE') && (
                  <button
                    onClick={skipPhase}
                    className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 text-white/70 border border-white/10 font-bold transition-all active:scale-95 hover:bg-white/10"
                  >
                    <FastForward size={20} />
                    Finish Round
                  </button>
                )}
                <button
                  onClick={() => setShowConfig(true)}
                  className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 text-white/50 border border-white/5 font-medium transition-all hover:bg-white/10"
                >
                  <Settings size={20} />
                  Configure Session
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'workouts' && (
            <motion.div 
              key="workouts"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full max-w-md mx-auto"
            >
              <h2 className="text-3xl font-display font-extrabold italic mb-6">Workouts</h2>
              <div className="grid gap-4">
                {[
                  { name: 'Heavy Bag Blast', rounds: 12, time: '3:00', icon: <Dumbbell className="text-fight" /> },
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full max-w-md mx-auto"
            >
              <h2 className="text-3xl font-display font-extrabold italic mb-8">Profile</h2>
              
              <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 bg-gradient-to-br from-fight to-warmup rounded-3xl flex items-center justify-center text-3xl font-display font-black italic">
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

      {/* Config Modal */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-display font-bold italic">Session Setup</h2>
                <button onClick={() => setShowConfig(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <ConfigSlider 
                  label="Rounds" 
                  value={config.rounds} 
                  min={1} 
                  max={15} 
                  onChange={(v) => setConfig(prev => ({ ...prev, rounds: v }))}
                />
                <ConfigSlider 
                  label="Fight Time" 
                  value={config.fightTime} 
                  min={30} 
                  max={600} 
                  step={30}
                  isTime
                  onChange={(v) => setConfig(prev => ({ ...prev, fightTime: v }))}
                />
                <ConfigSlider 
                  label="Rest Time" 
                  value={config.restTime} 
                  min={10} 
                  max={120} 
                  step={10}
                  isTime
                  onChange={(v) => setConfig(prev => ({ ...prev, restTime: v }))}
                />
                <ConfigSlider 
                  label="Warmup" 
                  value={config.warmupTime} 
                  min={5} 
                  max={60} 
                  step={5}
                  isTime
                  onChange={(v) => setConfig(prev => ({ ...prev, warmupTime: v }))}
                />
              </div>

              <button
                onClick={() => {
                  setShowConfig(false);
                  resetTimer();
                }}
                className="w-full mt-10 py-4 bg-white text-black font-bold rounded-2xl active:scale-95 transition-transform"
              >
                Apply Configuration
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
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-fight scale-110' : 'text-white/30 hover:text-white/50'}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function ConfigSlider({ label, value, min, max, step = 1, onChange, isTime = false }: { 
  label: string; 
  value: number; 
  min: number; 
  max: number; 
  step?: number;
  onChange: (v: number) => void;
  isTime?: boolean;
}) {
  const formatValue = (v: number) => {
    if (!isTime) return v;
    const m = Math.floor(v / 60);
    const s = v % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <span className="text-white/40 text-xs font-bold uppercase tracking-widest">{label}</span>
        <span className="text-xl font-mono font-bold text-white">{formatValue(value)}</span>
      </div>
      <div className="relative h-10 flex items-center">
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={value} 
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-fight"
        />
      </div>
    </div>
  );
}
