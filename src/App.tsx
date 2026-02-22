/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, ChevronUp, ChevronDown, X } from 'lucide-react';

type TimerState = 'IDLE' | 'WARMUP' | 'FIGHT' | 'REST' | 'FINISHED';

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
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [showConfig, setShowConfig] = useState(false);
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
      playSound(880, 0.5); // High beep for start
      setTimerState('FIGHT');
      setTimeLeft(config.fightTime);
    } else if (timerState === 'FIGHT') {
      if (currentRound < config.rounds) {
        playSound(440, 0.5); // Lower beep for rest
        setTimerState('REST');
        setTimeLeft(config.restTime);
      } else {
        playSound(880, 1.0); // Long beep for finish
        setTimerState('FINISHED');
        setIsActive(false);
      }
    } else if (timerState === 'REST') {
      playSound(880, 0.5); // High beep for start
      setTimerState('FIGHT');
      setCurrentRound(prev => prev + 1);
      setTimeLeft(config.fightTime);
    }
  }, [timerState, currentRound, config, playSound]);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-bg text-white">
      {/* Background Atmosphere */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 blur-[100px] transition-colors duration-1000"
        style={{ 
          background: `radial-gradient(circle at 50% 50%, ${getThemeColor()} 0%, transparent 70%)` 
        }}
      />

      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-12 z-10">
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

      {/* Main Timer Display */}
      <div className="relative flex items-center justify-center z-10 mb-12">
        <svg className="w-80 h-80 -rotate-90">
          {/* Background Track */}
          <circle
            cx="160"
            cy="160"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
            strokeDasharray="4 8"
          />
          {/* Progress Ring */}
          <motion.circle
            cx="160"
            cy="160"
            r={radius}
            fill="transparent"
            stroke={getThemeColor()}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "linear" }}
            className="timer-ring shadow-[0_0_20px_rgba(0,0,0,0.5)]"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={timerState}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="font-display text-2xl font-bold uppercase tracking-widest mb-2"
              style={{ color: getThemeColor() }}
            >
              {timerState === 'IDLE' ? 'Ready' : timerState}
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

      <button
        onClick={() => setShowConfig(true)}
        className="w-full max-w-md flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 text-white/70 border border-white/10 font-medium transition-all hover:bg-white/10 z-10"
      >
        <Settings size={20} />
        Configure Times
      </button>

      {/* Config Modal */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-display font-bold italic">Settings</h2>
                <button onClick={() => setShowConfig(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <ConfigItem 
                  label="Rounds" 
                  value={config.rounds} 
                  onChange={(v) => setConfig(prev => ({ ...prev, rounds: Math.max(1, v) }))}
                />
                <ConfigItem 
                  label="Fight Time" 
                  value={config.fightTime} 
                  isTime
                  onChange={(v) => setConfig(prev => ({ ...prev, fightTime: Math.max(10, v) }))}
                />
                <ConfigItem 
                  label="Rest Time" 
                  value={config.restTime} 
                  isTime
                  onChange={(v) => setConfig(prev => ({ ...prev, restTime: Math.max(5, v) }))}
                />
                <ConfigItem 
                  label="Warmup" 
                  value={config.warmupTime} 
                  isTime
                  onChange={(v) => setConfig(prev => ({ ...prev, warmupTime: Math.max(3, v) }))}
                />
              </div>

              <button
                onClick={() => {
                  setShowConfig(false);
                  resetTimer();
                }}
                className="w-full mt-10 py-4 bg-white text-black font-bold rounded-2xl active:scale-95 transition-transform"
              >
                Save & Restart
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfigItem({ label, value, onChange, isTime = false }: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void;
  isTime?: boolean;
}) {
  const formatValue = (v: number) => {
    if (!isTime) return v;
    const m = Math.floor(v / 60);
    const s = v % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const step = isTime ? 5 : 1;

  return (
    <div className="flex items-center justify-between">
      <span className="text-white/60 font-medium">{label}</span>
      <div className="flex items-center gap-4 bg-white/5 rounded-xl p-1">
        <button 
          onClick={() => onChange(value - step)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ChevronDown size={20} />
        </button>
        <span className="w-16 text-center font-mono font-bold text-lg">
          {formatValue(value)}
        </span>
        <button 
          onClick={() => onChange(value + step)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ChevronUp size={20} />
        </button>
      </div>
    </div>
  );
}
