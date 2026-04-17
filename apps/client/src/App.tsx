/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  Play, Pause, RotateCcw, Settings, Volume2, VolumeX, 
  ChevronUp, ChevronDown, X, Home, Dumbbell, User, 
  FastForward, Info, Award, History, Clock, Star, Plus, Minus,
  ChevronLeft, ChevronRight, Share2, Zap, Coffee, ShieldCheck, TrendingUp, Moon, Sun, Sliders,
  Crown, CheckCircle2, Sparkles, LayoutDashboard, Layout, Settings2
} from 'lucide-react';
import { TimerState, Workout, User as SharedUser } from './shared-types';
import WorkoutPlayer from './components/WorkoutPlayer';

type Tab = 'timer' | 'workouts' | 'profile';
type View = 'tabs' | 'setup' | 'workout-detail';


const WORKOUTS: Workout[] = [];

type SoundType = 'bell' | 'horn' | 'tap' | 'beep' | 'double_tap';

interface Config {
  rounds: number;
  fightTime: number; // in seconds
  restTime: number;
  warmupTime: number;
  warningTime: number; // seconds before finish
  intervalTime: number; // recurring beep
  startSound: SoundType;
  warningSound: SoundType;
  intervalSound: SoundType;
  finishSound: SoundType;
}

const DEFAULT_CONFIG: Config = {
  rounds: 10,
  fightTime: 180, // 3 minutes
  restTime: 60,   // 1 minute
  warmupTime: 10, // 10 seconds
  warningTime: 10,
  intervalTime: 0,
  startSound: 'bell',
  warningSound: 'tap',
  intervalSound: 'beep',
  finishSound: 'horn',
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('timer');
  const [currentView, setCurrentView] = useState<View>('tabs');
  const [isPremium, setIsPremium] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [authSource, setAuthSource] = useState<'generic' | 'subscription'>('generic');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [showRating, setShowRating] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [setupTab, setSetupTab] = useState<'quick' | 'advanced'>('quick');
  const [showWorkoutOverlay, setShowWorkoutOverlay] = useState(false);
  const [rating, setRating] = useState(0);
  
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Payment Result State
  const [paymentResult, setPaymentResult] = useState<'success' | 'failure' | null>(null);
  const [subscriptionWarning, setSubscriptionWarning] = useState<string | null>(null);
  
  // Timer State
  const [timerState, setTimerState] = useState<TimerState>('IDLE');
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(config.warmupTime);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState(0);

  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isPlayingWorkout, setIsPlayingWorkout] = useState(false);
  const [publicStats, setPublicStats] = useState<any>(null);

  // Fetch workouts and global stats
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'https://training-grounds-production.up.railway.app';
    
    // Fetch stats
    fetch(`${API_URL}/api/public-stats`)
      .then(res => res.json())
      .then(setPublicStats)
      .catch(err => console.error('Stats fetch error:', err));

    fetch(`${API_URL}/api/workouts`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Oops, we haven't got JSON!");
        }
        return res.json();
      })
      .then(data => {
        // Normalization for the hierarchical model
        const normalizedData = data.map((w: any) => ({
          ...w,
          isPremium: w.isPremium ?? !!w.is_premium ?? false,
          gifUrl: w.gifUrl || w.gif_url || '',
          completions: w.completions ?? 0,
          sections: (Array.isArray(w.sections) ? w.sections : []).map((s: any) => ({
            ...s,
            exercises: (Array.isArray(s.exercises) ? s.exercises : []).map((e: any) => ({
              ...e,
              setsOrRounds: e.setsOrRounds || 1,
              repsOrDuration: e.repsOrDuration || 0,
              restBetweenSets: e.restBetweenSets || 0
            }))
          }))
        }));
        setWorkouts(normalizedData);
      })
      .catch(err => {
        console.error('Failed to fetch workouts:', err);
        setWorkouts([]);
      });
  }, []);

  // Auto-hide splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    // Check for successful payment in URL
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const paymentStatus = params.get('payment');

    if (paymentStatus === 'success' && sessionId && token) {
      verifySubscription(sessionId);
    } else if (paymentStatus === 'cancel') {
      setPaymentResult('failure');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (token) {
      fetchUser();
    }

    return () => clearTimeout(timer);
  }, [token]);

  const fetchUser = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'https://training-grounds-production.up.railway.app';
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const userData = await res.json();
          setUser(userData);
          checkSubscriptionWarning(userData.subscription_end_date);
          if (userData.subscription_end_date) {
            const isExpired = new Date(userData.subscription_end_date) < new Date();
            setIsPremium(!isExpired);
          }
        }
      } else {
        console.error('Fetch user failed with status:', res.status);
        handleLogout();
      }
    } catch (err) {
      console.error('Fetch user error:', err);
    }
  };

  const verifySubscription = async (sessionId: string) => {
    const API_URL = import.meta.env.VITE_API_URL || 'https://training-grounds-production.up.railway.app';
    try {
      const res = await fetch(`${API_URL}/api/subscription/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          setPaymentResult('success');
          fetchUser();
        }
      } else {
        setPaymentResult('failure');
      }
    } catch (err) {
      setPaymentResult('failure');
    } finally {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const checkSubscriptionWarning = (endDateStr: string | null) => {
    if (!endDateStr) return;
    const endDate = new Date(endDateStr);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0 && diffDays <= 7) {
      setSubscriptionWarning(`Your subscription expires in ${diffDays} days. Don't forget to renew!`);
    } else if (diffDays <= 0) {
      setSubscriptionWarning('Your subscription has expired. Renew now to keep Elite access!');
    } else {
      setSubscriptionWarning(null);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || 'https://training-grounds-production.up.railway.app';
    const endpoint = authMode === 'login' ? `${API_URL}/api/auth/login` : `${API_URL}/api/auth/signup`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (authMode === 'login') {
          localStorage.setItem('token', data.token);
          setToken(data.token);
          setUser(data.user);
          const hasActiveSub = data.user.subscription_end_date && new Date(data.user.subscription_end_date) > new Date();
          setIsPremium(!!hasActiveSub);
          setAuthEmail('');
          setAuthPassword('');
        } else {
          // Auto-login after successful signup
          if (data.success || data.token) {
            const loginToken = data.token;
            if (loginToken) {
              localStorage.setItem('token', loginToken);
              setToken(loginToken);
              if (data.user) {
                setUser(data.user);
                const hasActiveSub = data.user.subscription_end_date && new Date(data.user.subscription_end_date) > new Date();
                setIsPremium(!!hasActiveSub);
              } else {
                fetchUser();
              }
              setAuthEmail('');
              setAuthPassword('');
            } else {
              // If backend only returns success but no token, we switch to login
              setAuthMode('login');
              setAuthError('Account created! Please log in.');
            }
          } else {
            setAuthError(data.error || 'Signup failed');
          }
        }
      } else {
        let errorMsg = 'Authentication failed';
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        }
        setAuthError(errorMsg);
      }
    } catch (err) {
      setAuthError('Authentication failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'https://training-grounds-production.up.railway.app';
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const handleLogout = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'https://training-grounds-production.up.railway.app';
    if (token) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Logout failed:', err);
      }
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsPremium(false);
  };

  const handleCheckout = async (plan: any) => {
    if (!token) {
      setAuthSource('subscription');
      setActiveTab('profile');
      setShowSubscription(false);
      return;
    }
    setIsProcessingPayment(true);
    const API_URL = import.meta.env.VITE_API_URL || 'https://training-grounds-production.up.railway.app';
    try {
      const response = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: plan.id, // Prefer planId from new docs
          planName: plan.name,
          price: plan.price,
          duration: plan.duration
        }),
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'Failed to create checkout session');
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Payment failed to initialize. Please try again later.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  // Sound generator
  const playAudio = useCallback((type: SoundType) => {
    if (isMuted) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    
    const playNote = (freq: number, duration: number, type: OscillatorType = 'sine', startTime: number = 0) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    switch (type) {
      case 'bell':
        // Boxing Round Bell (Triple hit)
        [0, 0.2, 0.4].forEach(offset => playNote(880, 0.8, 'triangle', offset));
        break;
      case 'horn':
        // Final Final Horn
        playNote(110, 1.5, 'sawtooth');
        playNote(115, 1.5, 'sawtooth');
        break;
      case 'tap':
        // Wood block tap
        playNote(1200, 0.05, 'square');
        break;
      case 'beep':
        playNote(880, 0.1, 'sine');
        break;
      case 'double_tap':
        playNote(1000, 0.05, 'square');
        playNote(1000, 0.05, 'square', 0.1);
        break;
    }
  }, [isMuted]);

  // Modernized legacy sound call for compatibility
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

  // Reset timer on config change if not active
  useEffect(() => {
    if (!isActive && timerState === 'IDLE') {
      setTimeLeft(config.warmupTime || config.fightTime || config.restTime);
      if (config.warmupTime > 0) {
        setTimerState('WARMUP');
      } else if (config.fightTime > 0) {
        setTimerState('FIGHT');
      } else {
        setTimerState('REST');
      }
    }
  }, [config.warmupTime, config.fightTime, config.restTime, isActive, timerState, config]);

  const handleTimerEnd = useCallback(() => {
    if (timerState === 'WARMUP' || timerState === 'IDLE') {
      playAudio(config.startSound);
      setTimerState('FIGHT');
      setTimeLeft(config.fightTime);
    } else if (timerState === 'FIGHT') {
      if (currentRound < config.rounds) {
        playAudio(config.startSound); // Round end/Rest start
        setTimerState('REST');
        setTimeLeft(config.restTime);
      } else {
        playAudio(config.finishSound);
        setTimerState('FINISHED');
        setIsActive(false);
        setShowRating(true);
      }
    } else if (timerState === 'REST') {
      playAudio(config.startSound);
      setTimerState('FIGHT');
      setCurrentRound(prev => prev + 1);
      setTimeLeft(config.fightTime);
    }
  }, [timerState, currentRound, config, playAudio]);

  const skipPhase = () => {
    handleTimerEnd();
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1;
          
          // Interval beep logic
          if (timerState === 'FIGHT' && config.intervalTime > 0) {
            const elapsedInRound = config.fightTime - next;
            if (elapsedInRound > 0 && elapsedInRound % config.intervalTime === 0 && next > 0) {
              playAudio(config.intervalSound);
            }
          }

          // Warning logic
          if (timerState === 'FIGHT' && next === config.warningTime && next > 0) {
             playAudio(config.warningSound);
          }

          return next;
        });
        setTotalSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerEnd();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, handleTimerEnd, timerState, config, playAudio]);

  const toggleTimer = () => {
    if (timerState === 'IDLE') {
       startTraining();
    } else {
       setIsActive(!isActive);
    }
  };

  const startTraining = () => {
    // Validation: At least one phase must have time
    if (config.warmupTime === 0 && config.fightTime === 0 && config.restTime === 0) {
      return;
    }

    if (!isActive) {
      playAudio(config.startSound);
    }
    
    setCurrentRound(1);
    setTotalSecondsElapsed(0);
    setCurrentView('tabs');
    setActiveTab('timer');

    if (config.warmupTime > 0) {
      setTimerState('WARMUP');
      setTimeLeft(config.warmupTime);
      setIsActive(true);
    } else if (config.fightTime > 0) {
      setTimerState('FIGHT');
      setTimeLeft(config.fightTime);
      setIsActive(true);
    } else {
      setTimerState('REST');
      setTimeLeft(config.restTime);
      setIsActive(true);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimerState('IDLE');
    setCurrentRound(1);
    setTimeLeft(config.warmupTime);
    setTotalSecondsElapsed(0);
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
        className="fixed inset-0 z-[200] bg-bg flex flex-col items-center justify-center p-8 text-center overflow-hidden"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
        transition={{ duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-warmup/10 rounded-full blur-[160px]"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-fight/5 rounded-full blur-[120px]"
            animate={{ 
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1, ease: "backOut" }}
          className="relative z-10 mb-12"
        >
          <div className="relative">
            <motion.div 
              className="w-32 h-32 bg-warmup rounded-[40px] flex items-center justify-center mb-8 shadow-2xl shadow-warmup/40 rotate-12 mx-auto relative z-20"
              animate={{ rotate: [12, 8, 12] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Dumbbell size={64} className="text-white -rotate-12" />
            </motion.div>
            <motion.div 
              className="absolute inset-0 bg-warmup/20 rounded-[40px] blur-2xl -z-10"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <h1 className="font-display text-7xl font-black italic tracking-tighter mb-2 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              MONKEY SQUAD
            </h1>
            <div className="flex items-center justify-center gap-3">
              <motion.div initial={{ width: 0 }} animate={{ width: 32 }} transition={{ delay: 1, duration: 0.5 }} className="h-[1px] bg-warmup/40" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Wu-Gong Boxing School</span>
              <motion.div initial={{ width: 0 }} animate={{ width: 32 }} transition={{ delay: 1, duration: 0.5 }} className="h-[1px] bg-warmup/40" />
            </div>
          </motion.div>
        </motion.div>
        
        <div className="absolute bottom-20 left-0 right-0 flex flex-col items-center">
          <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden mb-6 relative">
            <motion.div 
              className="h-full bg-gradient-to-r from-warmup to-fight"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute top-0 left-0 h-full w-20 bg-white/40 blur-md"
              animate={{ x: [-100, 300] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <motion.span 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40"
          >
            Mastering the Art of Boxing
          </motion.span>
        </div>
      </motion.div>
    );
  }

  return (
    <Routes>
      <Route path="*" element={
        <div className="flex flex-col h-screen overflow-hidden bg-bg text-white">
      {/* Background Atmosphere */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 blur-[100px] transition-colors duration-1000"
        style={{ 
          background: `radial-gradient(circle at 50% 50%, ${(activeTab === 'timer' && currentView === 'tabs') ? getThemeColor() : 'var(--color-warmup)'} 0%, transparent 70%)` 
        }}
      />

      {/* Subscription Warning Banner */}
      <AnimatePresence>
        {subscriptionWarning && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-black py-3 px-6 flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Crown size={18} fill="currentColor" />
              <span className="text-xs font-bold uppercase tracking-wide">{subscriptionWarning}</span>
            </div>
            <button onClick={() => setSubscriptionWarning(null)} className="p-1">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Result Overlays */}
      <AnimatePresence>
        {paymentResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 40, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className={`w-full max-w-sm p-10 rounded-[48px] text-center border relative overflow-hidden ${
                paymentResult === 'success' ? 'border-emerald-500/30 shadow-emerald-500/20' : 'border-red-500/30 shadow-red-500/20'
              } ${isDarkMode ? 'bg-bg' : 'bg-white'} shadow-2xl`}
            >
              {/* Background Glow */}
              <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-20 ${
                paymentResult === 'success' ? 'bg-emerald-500' : 'bg-red-500'
              }`} />
              
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", damping: 12 }}
                className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 relative z-10 ${
                  paymentResult === 'success' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' : 'bg-red-500 text-white shadow-lg shadow-red-500/40'
                }`}
              >
                {paymentResult === 'success' ? <CheckCircle2 size={48} /> : <X size={48} />}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative z-10"
              >
                <h2 className="text-4xl font-display font-black italic mb-4 tracking-tight uppercase">
                  {paymentResult === 'success' ? 'Elite Unlocked' : 'Access Denied'}
                </h2>
                
                <p className={`mb-10 leading-relaxed font-medium ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                  {paymentResult === 'success' 
                    ? 'Your Monkey Squad Elite membership is now active. The school of champions awaits you.' 
                    : 'Something went wrong with your transaction. The monkey squad requires a valid tribute.'}
                </p>
                
                <button
                  onClick={() => setPaymentResult(null)}
                  className={`w-full py-5 font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-xl ${
                    paymentResult === 'success' 
                      ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                      : 'bg-red-500 text-white shadow-red-500/30'
                  }`}
                >
                  {paymentResult === 'success' ? 'Enter the Dojo' : 'Try Again'}
                </button>
              </motion.div>

              {/* Decorative Elements */}
              {paymentResult === 'success' && (
                <motion.div 
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-emerald-400 rounded-full"
                      initial={{ 
                        x: "50%", 
                        y: "50%",
                        scale: 0 
                      }}
                      animate={{ 
                        x: `${50 + (Math.random() - 0.5) * 100}%`,
                        y: `${50 + (Math.random() - 0.5) * 100}%`,
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        delay: Math.random() * 2,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentView === 'tabs' && (
          <motion.div 
            key="tabs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full"
          >
            {/* Header */}
            <header className="p-6 flex justify-between items-center z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">Boxing Timer</span>
                <h1 className="font-display text-xl font-extrabold italic tracking-tight">Training Ground</h1>
              </div>
              <div className="flex items-center gap-2">
                {!isPremium && (
                  <button 
                    onClick={() => setShowSubscription(true)}
                    title="Unlock advanced presets and pro features"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    <Crown size={12} fill="currentColor" />
                    Get Pro Access
                  </button>
                )}
                <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 shadow-sm transition-all ${
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

            <main className="flex-1 p-6 overflow-y-auto pb-32">
              <AnimatePresence mode="wait">
                {activeTab === 'timer' && (
                  <motion.div 
                    key="timer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col h-full overflow-hidden -mt-6"
                  >
                    {/* Timer Header */}
                    <div className="w-full flex justify-between items-center py-4 z-10">
                      <button 
                        onClick={() => {
                          if (isActive) {
                            if (window.confirm('Stop training?')) resetTimer();
                          } else {
                            setActiveTab('workouts');
                          }
                        }}
                        className={`p-3 rounded-2xl transition-all active:scale-90 ${
                          isDarkMode 
                            ? 'glass-card glass-card-hover' 
                            : 'bg-white border border-slate-200 shadow-sm hover:bg-slate-50'
                        }`}
                      >
                        {isActive ? <Home size={20} /> : <Dumbbell size={20} />}
                      </button>
                      
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-0.5" title="Operating mode">
                          {selectedWorkout ? selectedWorkout.category : 'Standard Mode'}
                        </span>
                        <h2 className="text-sm font-display font-black italic uppercase tracking-widest text-warmup text-center">
                          {selectedWorkout ? selectedWorkout.name : 'Custom Timer'}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setIsMuted(!isMuted)}
                          title={isMuted ? "Unmute sounds" : "Mute sounds"}
                          className={`p-3 rounded-2xl transition-all active:scale-90 ${
                            isDarkMode 
                              ? 'glass-card glass-card-hover' 
                              : 'bg-white border border-slate-200 shadow-sm hover:bg-slate-50'
                          }`}
                        >
                          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        
                        <div className="flex items-center gap-2">
                             <button 
                              onClick={() => {
                                setSetupTab('quick');
                                setCurrentView('setup');
                              }}
                              title="Training Settings"
                              className={`p-3 rounded-2xl transition-all active:scale-90 ${
                                isDarkMode 
                                  ? 'glass-card glass-card-hover bg-warmup/10 border-warmup/20 text-warmup' 
                                  : 'bg-warmup/10 text-warmup border border-warmup/20 shadow-sm hover:bg-warmup/20'
                              }`}
                            >
                              <Settings size={20} />
                            </button>
                          </div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-6 pt-2 overflow-y-auto custom-scrollbar">
                      {/* Timer Display */}
                      <div className="relative flex items-center justify-center z-10 mb-12">
                        {/* Outer Ticks */}
                        <div className="absolute w-80 h-80 flex items-center justify-center pointer-events-none">
                          {Array.from({ length: 72 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`tick ${i % 6 === 0 ? 'active h-4 w-0.5' : 'h-2 w-px'}`}
                              style={{ 
                                transform: `rotate(${i * 5}deg) translateY(-145px)`,
                                color: getThemeColor(),
                                opacity: (i * 5) < (getProgress() / 100) * 360 ? 0.6 : 0.1
                              }} 
                            />
                          ))}
                        </div>

                        {/* Main Dial Surface */}
                        <motion.div 
                          className={`w-64 h-64 rounded-full flex items-center justify-center relative z-10 dial-surface ${!isDarkMode ? 'light' : ''}`}
                          animate={{ 
                            scale: isActive ? 1.05 : 1,
                            backgroundColor: timerState === 'REST' ? (isDarkMode ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.03)') : 'transparent'
                          }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        >
                          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                            {/* Inner Subtle Fill Gradient */}
                            <defs>
                              <radialGradient id="timerGradient" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor={getThemeColor()} stopOpacity="0" />
                                <stop offset="100%" stopColor={getThemeColor()} stopOpacity="0.1" />
                              </radialGradient>
                            </defs>

                            {/* Ghost/Background Ring */}
                            <circle
                              cx="128"
                              cy="128"
                              r="120"
                              fill="transparent"
                              stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                              strokeWidth="10"
                            />

                            {/* Progress Ring */}
                            <motion.circle
                              cx="128"
                              cy="128"
                              r="120"
                              fill="url(#timerGradient)"
                              stroke={getThemeColor()}
                              strokeWidth="10"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 120}
                              animate={{ 
                                strokeDashoffset: (2 * Math.PI * 120) - (getProgress() / 100) * (2 * Math.PI * 120),
                              }}
                              transition={{ 
                                duration: 1, 
                                ease: "linear",
                              }}
                              style={{ 
                                filter: `drop-shadow(0 0 12px ${getThemeColor()}44)`,
                                opacity: timerState === 'IDLE' ? 0.1 : 1
                              }}
                            />
                          </svg>

                          {/* Inner Content */}
                          <div className="flex flex-col items-center justify-center text-center z-20">
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={timerState + (timerState === 'FIGHT' && timeLeft <= 10 ? '-warn' : '')}
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ 
                                  opacity: 1, 
                                  y: 0, 
                                  scale: timerState === 'REST' ? 1.2 : 1,
                                  fontWeight: timerState === 'REST' ? 900 : 800
                                }}
                                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                className={`font-display uppercase tracking-[0.25em] mb-2 px-4 py-1 rounded-full transition-all ${
                                  timerState === 'REST' 
                                    ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                                    : ''
                                }`}
                                style={{ 
                                  color: timerState === 'REST' ? undefined : getThemeColor(),
                                  fontSize: timerState === 'REST' ? '1.1rem' : '0.75rem'
                                }}
                              >
                                {timerState === 'FIGHT' && timeLeft <= 10 ? 'Finish Strong!' : (timerState === 'IDLE' ? 'Ready' : timerState)}
                              </motion.span>
                            </AnimatePresence>
                            
                            <span className={`font-mono text-7xl font-black tracking-tighter tabular-nums ${!isDarkMode ? 'text-slate-900' : 'text-white'}`}>
                              {formatTime(timeLeft)}
                            </span>

                            {/* Progress Percentage Subtle */}
                            {timerState !== 'IDLE' && (
                              <motion.span 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.3 }}
                                className="text-[10px] font-black mt-2 opacity-30"
                              >
                                {Math.round(getProgress())}%
                              </motion.span>
                            )}

                            {/* Central Knob Detail */}
                            <div className={`absolute w-12 h-12 rounded-full opacity-10 border-2 ${!isDarkMode ? 'border-black' : 'border-white'}`} />

                            {/* Glowing Indicator Dot */}
                            <motion.div 
                              className="absolute w-4 h-4 rounded-full z-30 flex items-center justify-center"
                              style={{ 
                                backgroundColor: getThemeColor(),
                                boxShadow: `0 0 20px ${getThemeColor()}, 0 0 40px ${getThemeColor()}44`,
                                top: '50%',
                                left: '50%',
                                marginTop: '-8px',
                                marginLeft: '-8px',
                              }}
                              animate={{ 
                                rotate: (getProgress() / 100) * 360 - 90,
                                translateX: 120
                              }}
                              transition={{ duration: 1, ease: "linear" }}
                            >
                              <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
                            </motion.div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-8 mb-12">
                        <button 
                          onClick={resetTimer}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                            isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          <RotateCcw size={20} />
                        </button>

                        <button 
                          onClick={toggleTimer}
                          className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${
                            isDarkMode ? 'bg-white text-black shadow-white/10' : 'bg-black text-white shadow-black/20'
                          }`}
                        >
                          {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>

                        <button 
                          onClick={skipPhase}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                            isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          <FastForward size={20} />
                        </button>
                      </div>

                      {/* Stats Grid */}
                      <div className="w-full max-w-md grid grid-cols-2 gap-4 mb-8">
                        <div className={`p-6 rounded-[32px] border flex flex-col items-center ${isDarkMode ? 'glass-card border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Current Round</span>
                          <div className="flex items-end gap-1">
                            <span className="text-3xl font-display font-black italic">{currentRound}</span>
                            <span className="text-xs font-bold opacity-30 mb-1">/ {config.rounds}</span>
                          </div>
                        </div>
                        <div className={`p-6 rounded-[32px] border flex flex-col items-center ${isDarkMode ? 'glass-card border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Total Time</span>
                          <span className="text-3xl font-display font-black italic">{formatTime(totalSecondsElapsed)}</span>
                        </div>
                      </div>

                      {/* Workout Focus Overlay Mini */}
                      {selectedWorkout && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowWorkoutOverlay(true)}
                          className="w-full max-w-md mb-8 z-10 cursor-pointer"
                        >
                          <div className={`p-5 rounded-[32px] border ${isDarkMode ? 'glass-card border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/10 relative">
                                <img src={selectedWorkout.gifUrl} alt={selectedWorkout.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                  <Plus size={16} className="text-white" />
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-warmup mb-0.5">
                                  {timerState === 'REST' ? 'Next Round Focus' : 'Current Focus'}
                                </div>
                                <h3 className="font-bold text-sm italic font-display opacity-80">Round {timerState === 'REST' ? currentRound + 1 : currentRound}</h3>
                              </div>
                            </div>
                            
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={currentRound + timerState}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}
                              >
                                <p className="text-sm font-medium leading-relaxed italic text-center">
                                  "{selectedWorkout?.description || 'Push your limits and master the craft.'}"
                                </p>
                              </motion.div>
                            </AnimatePresence>
                            
                            <div className="mt-3 flex justify-center">
                              <span className="text-[8px] font-bold uppercase tracking-widest opacity-30">Tap to expand tutorial</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'workouts' && (
                  <motion.div 
                    key="workouts"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-3xl font-display font-extrabold italic">Workouts</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">School:</span>
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Monkey Squad</span>
                      </div>
                    </div>

                    {(selectedCategories.length > 0 || selectedDifficulties.length > 0) && (
                      <button 
                        onClick={() => {
                          setSelectedCategories([]);
                          setSelectedDifficulties([]);
                        }}
                        className="text-[10px] font-bold text-warmup uppercase tracking-widest mb-4 flex items-center gap-1"
                      >
                        <X size={12} /> Clear Filters
                      </button>
                    )}

                    {/* Filters */}
                    <div className="space-y-4 mb-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Category</span>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                          {['Stamina', 'Technique', 'Power', 'Speed'].map(cat => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategories(prev => 
                                prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                              )}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                                selectedCategories.includes(cat)
                                  ? 'bg-warmup border-warmup text-white shadow-lg shadow-warmup/20'
                                  : isDarkMode ? 'glass-card border-white/5 opacity-60' : 'bg-white border-slate-200 opacity-60'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Difficulty</span>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                          {['Beginner', 'Intermediate', 'Advanced', 'Pro'].map(diff => (
                            <button
                              key={diff}
                              onClick={() => setSelectedDifficulties(prev => 
                                prev.includes(diff) ? prev.filter(d => d !== diff) : [...prev, diff]
                              )}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                                selectedDifficulties.includes(diff)
                                  ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20'
                                  : isDarkMode ? 'glass-card border-white/5 opacity-60' : 'bg-white border-slate-200 opacity-60'
                              }`}
                            >
                              {diff}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      {workouts.filter(w => {
                        const catMatch = selectedCategories.length === 0 || selectedCategories.includes(w.category);
                        const diffMatch = selectedDifficulties.length === 0 || selectedDifficulties.includes(w.difficulty);
                        return catMatch && diffMatch;
                      }).map((w) => (
                        <div 
                          key={w.id} 
                          onClick={() => {
                            if (w.isPremium && !isPremium) {
                              setShowSubscription(true);
                            } else {
                              setSelectedWorkout(w);
                              setCurrentView('workout-detail');
                            }
                          }}
                          className={`relative overflow-hidden border rounded-[32px] p-5 flex flex-col gap-4 transition-all cursor-pointer group active:scale-[0.98] ${
                            isDarkMode ? 'glass-card border-white/5' : 'bg-white border-slate-200 shadow-sm'
                          }`}
                        >
                          {w.isPremium && !isPremium && (
                            <div className="absolute top-4 right-4 z-20">
                              <Crown size={16} className="text-amber-500" fill="currentColor" />
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 overflow-hidden ${
                                isDarkMode ? 'bg-white/5' : 'bg-slate-100'
                              }`}>
                                <img src={w.gifUrl} alt={w.name} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg leading-tight italic font-display">{w.name}</h3>
                                <div className="flex items-center gap-1 mt-1">
                                  <Layout size={12} className="text-amber-500" />
                                  <span className="text-xs font-bold opacity-60">
                                    {w.sections?.length || 0} Sections
                                  </span>
                                  <span className="mx-1 opacity-20">•</span>
                                  <span className="text-xs opacity-40 uppercase tracking-widest font-bold">
                                    {(w.sections || []).reduce((acc: number, s: any) => acc + s.exercises.length, 0)} Bricks
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex gap-3">
                              <div className="flex items-center gap-1">
                                <TrendingUp size={14} className="text-warmup" />
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{w.difficulty}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap size={14} className="text-amber-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{w.category}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User size={14} className="text-blue-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{(w.completions || 0).toLocaleString()}</span>
                              </div>
                            </div>
                            <button className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                              w.isPremium && !isPremium ? 'bg-white/5' : 'bg-warmup shadow-warmup/20 group-hover:scale-110'
                            }`}>
                              {w.isPremium && !isPremium ? <Crown size={18} className="text-amber-500" /> : <ChevronRight size={20} className="text-white" />}
                            </button>
                          </div>
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
                    
                    {!user ? (
                      <div className={`p-8 rounded-[40px] border ${isDarkMode ? 'glass-card border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-center mb-8">
                          <div className="w-20 h-20 bg-warmup/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <User size={40} className="text-warmup" />
                          </div>
                          <h3 className="text-2xl font-display font-black italic mb-1">
                            {authMode === 'login' ? 'Welcome Back' : 'Join the Squad'}
                          </h3>
                          <p className="text-xs opacity-40 uppercase tracking-widest font-bold">
                            {authMode === 'login' ? 'Login to your account' : 'Create your training profile'}
                          </p>
                        </div>

                        <form onSubmit={handleAuth} className="space-y-4">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Email Address</label>
                            <input 
                              type="email" 
                              required
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              className={`w-full p-4 rounded-2xl border bg-transparent focus:outline-none focus:ring-2 ring-warmup/50 transition-all ${
                                isDarkMode ? 'border-white/10' : 'border-slate-200'
                              }`}
                              placeholder="fighter@monkeysquad.com"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Password</label>
                            <input 
                              type="password" 
                              required
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              className={`w-full p-4 rounded-2xl border bg-transparent focus:outline-none focus:ring-2 ring-warmup/50 transition-all ${
                                isDarkMode ? 'border-white/10' : 'border-slate-200'
                              }`}
                              placeholder="••••••••"
                            />
                          </div>

                          {authError && (
                            <p className="text-xs text-red-500 font-bold text-center">{authError}</p>
                          )}

                          <button 
                            type="submit"
                            disabled={isAuthLoading}
                            className={`w-full py-5 bg-warmup text-white font-bold rounded-2xl shadow-xl shadow-warmup/20 active:scale-95 transition-transform flex items-center justify-center gap-2 ${isAuthLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            {isAuthLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {authMode === 'login' ? 'Login' : 'Sign Up'}
                          </button>

                          <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className={`px-2 text-white/40 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>Or continue with</span>
                            </div>
                          </div>

                          <button 
                            type="button"
                            onClick={handleGoogleLogin}
                            className={`w-full py-4 border rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 ${
                              isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                          </button>
                        </form>

                        <div className="mt-8 text-center">
                          <button 
                            onClick={() => {
                              setAuthMode(authMode === 'login' ? 'signup' : 'login');
                              setAuthError('');
                            }}
                            className="text-xs font-bold opacity-40 hover:opacity-100 transition-opacity"
                          >
                            {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-6 mb-10">
                          <div className="w-20 h-20 bg-gradient-to-br from-fight-warn to-warmup rounded-3xl flex items-center justify-center text-3xl font-display font-black italic">
                            {user.email.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold truncate max-w-[200px]">{user.email.split('@')[0]}</h3>
                            <p className="text-white/40">{isPremium ? 'Elite Member' : 'Free Member'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-10">
                          <div className={`${isDarkMode ? 'glass-card' : 'bg-white/5 border border-white/10'} rounded-2xl p-5`}>
                            <Award className="text-yellow-500 mb-2" />
                            <div className="text-2xl font-display font-bold">42</div>
                            <div className="text-white/40 text-xs uppercase tracking-widest">Workouts</div>
                          </div>
                          <div className={`${isDarkMode ? 'glass-card' : 'bg-white/5 border border-white/10'} rounded-2xl p-5`}>
                            <History className="text-warmup mb-2" />
                            <div className="text-2xl font-display font-bold">12.5h</div>
                            <div className="text-white/40 text-xs uppercase tracking-widest">Total Time</div>
                          </div>
                        </div>

                        {isPremium && user.subscription_end_date && (
                          <div className={`mb-8 p-6 rounded-[32px] border ${isDarkMode ? 'glass-card border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <ShieldCheck size={16} className="text-emerald-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Elite Active</span>
                            </div>
                            <h3 className="text-lg font-display font-black italic mb-1">Subscription Details</h3>
                            <p className="text-xs opacity-50">Expires on: {new Date(user.subscription_end_date).toLocaleDateString()}</p>
                          </div>
                        )}

                        {!isPremium && (
                          <div 
                            onClick={() => setShowSubscription(true)}
                            className={`mb-8 p-6 rounded-[32px] border cursor-pointer relative overflow-hidden group transition-all ${
                              isDarkMode ? 'glass-card border-amber-500/30' : 'bg-amber-50 border-amber-200'
                            }`}
                          >
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-2">
                                <Crown size={16} className="text-amber-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Go Elite</span>
                              </div>
                              <h3 className="text-lg font-display font-black italic mb-1">Monkey Squad Membership</h3>
                              <p className="text-xs opacity-50 mb-4">Join the school of champions.</p>
                              <button className="text-xs font-bold text-amber-500 flex items-center gap-1">
                                View Plans <ChevronRight size={14} />
                              </button>
                            </div>
                            <Sparkles size={60} className="absolute -right-4 -bottom-4 text-amber-500/10 group-hover:scale-125 transition-transform" />
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className={`w-full flex items-center justify-between p-4 rounded-2xl border ${isDarkMode ? 'glass-card' : 'bg-white/5 border-white/5'}`}>
                            <span className="flex items-center gap-3 font-medium text-sm opacity-80">
                              <Moon size={18} className="text-warmup" /> Dark Mode
                            </span>
                            <button 
                              onClick={() => setIsDarkMode(!isDarkMode)}
                              className={`relative w-14 h-8 rounded-full p-1 transition-all duration-300 ${isDarkMode ? 'bg-warmup' : 'bg-slate-200'}`}
                            >
                              <motion.div 
                                className="w-6 h-6 bg-white rounded-full shadow-md"
                                animate={{ x: isDarkMode ? 24 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            </button>
                          </div>

                          <div className={`p-6 rounded-[32px] border ${isDarkMode ? 'glass-card border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Training History</h4>
                            <div className="space-y-4">
                              {[
                                { date: 'Today', workout: 'The 12 Jabs', time: '18m', xp: '+120 XP' },
                                { date: 'Yesterday', workout: 'Heavy Bag Blast', time: '24m', xp: '+240 XP' },
                                { date: 'Oct 24', workout: 'Monkey Squad Elite', time: '45m', xp: '+500 XP' },
                              ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xs font-bold opacity-40 group-hover:opacity-100 transition-opacity">
                                      {item.date.substring(0, 3)}
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold">{item.workout}</div>
                                      <div className="text-[10px] opacity-40 uppercase tracking-widest font-bold">{item.time} • {item.xp}</div>
                                    </div>
                                  </div>
                                  <ChevronRight size={16} className="opacity-20 group-hover:opacity-100 transition-opacity" />
                                </div>
                              ))}
                            </div>
                            <button className="w-full mt-6 py-3 text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity">
                              View All Activity
                            </button>
                          </div>

                          <button 
                            onClick={handleLogout}
                            className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all active:scale-[0.98] mt-4 mb-32 ${
                              isDarkMode 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
                                : 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'
                            }`}
                          >
                            <span className="flex items-center gap-3 font-bold text-sm">
                              <RotateCcw size={18} /> Sign Out of Training Ground
                            </span>
                            <ChevronRight size={18} className="opacity-40" />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </motion.div>
        )}

        {currentView === 'workout-detail' && selectedWorkout && (
          <motion.div 
            key="workout-detail"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            <header className="p-6 flex items-center gap-4 z-10">
              <button 
                onClick={() => setCurrentView('tabs')}
                className={`p-3 rounded-2xl transition-all active:scale-90 ${
                  isDarkMode 
                    ? 'glass-card glass-card-hover' 
                    : 'bg-white border border-slate-200 shadow-sm hover:bg-slate-50'
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-2xl font-display font-black italic tracking-tight">Workout Details</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-6 pb-32 custom-scrollbar">
              <div className="relative w-full aspect-video rounded-[32px] overflow-hidden mb-8 shadow-2xl">
                <img src={selectedWorkout.gifUrl} alt={selectedWorkout.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-warmup text-white text-[10px] font-black uppercase tracking-widest">
                      {selectedWorkout.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">
                      {selectedWorkout.difficulty}
                    </span>
                  </div>
                  <h1 className="text-4xl font-display font-black italic tracking-tight">{selectedWorkout.name}</h1>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className={`${isDarkMode ? 'glass-card' : 'bg-white border border-slate-200'} rounded-2xl p-4 text-center`}>
                  <Layout size={18} className="text-warmup mx-auto mb-1" />
                  <div className="text-lg font-display font-bold">{selectedWorkout.sections?.length || 0}</div>
                  <div className="text-[8px] uppercase tracking-widest opacity-40">Sections</div>
                </div>
                <div className={`${isDarkMode ? 'glass-card' : 'bg-white border border-slate-200'} rounded-2xl p-4 text-center`}>
                  <Dumbbell size={18} className="text-amber-500 mx-auto mb-1" />
                  <div className="text-lg font-display font-bold">
                    {(selectedWorkout.sections || []).reduce((acc: number, s: any) => acc + s.exercises.length, 0)}
                  </div>
                  <div className="text-[8px] uppercase tracking-widest opacity-40">Exercises</div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-4">Description</h3>
                <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
                  {selectedWorkout.description}
                </p>
              </div>

              <div className="mb-8">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-4">Hierarchy Flow</h3>
                <div className="space-y-6">
                  {(selectedWorkout.sections || []).map((s, si) => (
                    <div key={s.id || si} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{s.name} • Repeat {s.repeatCount}x</span>
                      </div>
                      <div className="space-y-2">
                        {s.exercises.map((e, ei) => (
                          <div 
                            key={e.id || ei}
                            className={`flex items-start gap-4 p-4 rounded-2xl border ${
                              isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-xl bg-warmup/10 text-warmup flex items-center justify-center text-[10px] font-black shrink-0 italic">
                              {ei + 1}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-black uppercase italic opacity-90">{e.name}</p>
                              <div className="flex items-center gap-3">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                  {e.type === 'time' ? `${e.repsOrDuration}s` : `${e.repsOrDuration} Reps`}
                                </p>
                                {e.setsOrRounds > 1 && (
                                  <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                                    {e.setsOrRounds} Sets
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  if (selectedWorkout.sections && selectedWorkout.sections.length > 0) {
                    setIsPlayingWorkout(true);
                  } else {
                    // Fallback for custom settings if sections missing
                    startTraining();
                  }
                }}
                className={`w-full py-5 font-bold rounded-2xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3 ${
                  isDarkMode ? 'bg-white text-black shadow-white/5' : 'bg-black text-white shadow-black/10'
                }`}
              >
                <Play size={20} fill="currentColor" />
                Start Workout
              </button>
            </div>
          </motion.div>
        )}

        {currentView === 'setup' && (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            <header className="p-6 flex flex-col gap-6 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setCurrentView('tabs')}
                    className={`p-3 rounded-2xl transition-all active:scale-90 ${
                      isDarkMode 
                        ? 'glass-card glass-card-hover' 
                        : 'bg-white border border-slate-200 shadow-sm hover:bg-slate-50'
                    }`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-2xl font-display font-black italic tracking-tight uppercase">Session Gear</h2>
                </div>
              </div>

              {/* Settings Tabs */}
              <div className={`p-1 rounded-2xl flex items-center gap-1 ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                <button
                  onClick={() => setSetupTab('quick')}
                  className={`flex-1 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all ${
                    setupTab === 'quick'
                      ? (isDarkMode ? 'bg-warmup text-white shadow-lg shadow-warmup/20' : 'bg-white text-warmup shadow-sm')
                      : 'opacity-40 hover:opacity-60'
                  }`}
                >
                  Quick Setup
                </button>
                <button
                  onClick={() => setSetupTab('advanced')}
                  className={`flex-1 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all ${
                    setupTab === 'advanced'
                      ? (isDarkMode ? 'bg-warmup text-white shadow-lg shadow-warmup/20' : 'bg-white text-warmup shadow-sm')
                      : 'opacity-40 hover:opacity-60'
                  }`}
                >
                  Advanced Gear
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 pb-32 custom-scrollbar">
              <AnimatePresence mode="wait">
                {setupTab === 'quick' ? (
                  <motion.div
                    key="quick"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Core Settings - Minimal & Fast */}
                    <div className="space-y-6 pt-4">
                      <div className={`p-8 rounded-[40px] border relative overflow-hidden ${
                        isDarkMode ? 'glass-card border-white/5 bg-warmup/5' : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                        <div className="absolute -right-12 -top-12 opacity-5 rotate-12">
                          <Zap size={200} className="text-warmup" />
                        </div>

                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-warmup/20 flex items-center justify-center text-warmup">
                              <Play size={24} fill="currentColor" className="ml-1" />
                            </div>
                            <div>
                              <h3 className="text-xl font-display font-black italic uppercase tracking-tight">Ready to Work?</h3>
                              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Dial in your core stats</p>
                            </div>
                          </div>

                          <div className="space-y-6">
                            {[
                              { label: "Rounds", value: config.rounds, min: 1, onChange: (v: number) => setConfig(prev => ({ ...prev, rounds: Math.max(1, v) })) },
                              { label: "Fight Time", value: config.fightTime, min: 0, isTime: true, onChange: (v: number) => setConfig(prev => ({ ...prev, fightTime: Math.max(0, v) })) },
                              { label: "Rest Time", value: config.restTime, min: 0, isTime: true, onChange: (v: number) => setConfig(prev => ({ ...prev, restTime: Math.max(0, v) })) },
                              { label: "Warmup", value: config.warmupTime, min: 0, isTime: true, onChange: (v: number) => setConfig(prev => ({ ...prev, warmupTime: Math.max(0, v) })) },
                            ].map((item, idx) => (
                              <motion.div
                                key={item.label}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                              >
                                <ConfigStepper 
                                  label={item.label} 
                                  value={item.value} 
                                  isTime={item.isTime}
                                  onChange={item.onChange}
                                  isDarkMode={isDarkMode}
                                />
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (timerState === 'IDLE') {
                          setSelectedWorkout(null);
                          startTraining();
                        } else {
                          setCurrentView('tabs');
                        }
                      }}
                      disabled={timerState === 'IDLE' && config.warmupTime === 0 && config.fightTime === 0 && config.restTime === 0}
                      className={`w-full py-7 font-display text-xl font-black italic uppercase tracking-widest rounded-[32px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 mt-8 disabled:opacity-30 disabled:pointer-events-none ${
                        isDarkMode ? 'bg-warmup text-white shadow-warmup/20' : 'bg-black text-white shadow-black/10'
                      }`}
                    >
                      {timerState === 'IDLE' ? (
                        <>
                          <Play size={20} fill="currentColor" />
                          Jump In the Cage
                        </>
                      ) : (
                        <>
                          <Clock size={20} />
                          Resume Training
                        </>
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="advanced"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className={`p-10 rounded-[48px] border overflow-hidden ${
                      isDarkMode ? 'glass-card border-white/5 bg-zinc-900/40' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                      <div className="space-y-8">
                        {/* Advanced Phases */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 italic">Tuning & Alerts</h4>
                          {[
                            { label: "Warning", value: config.warningTime, min: 0, isTime: true, onChange: (v: number) => setConfig(prev => ({ ...prev, warningTime: Math.max(0, v) })) },
                            { label: "Intervals", value: config.intervalTime, min: 0, isTime: true, onChange: (v: number) => setConfig(prev => ({ ...prev, intervalTime: Math.max(0, v) })) },
                          ].map((item) => (
                            <ConfigStepper 
                              key={item.label}
                              label={item.label} 
                              value={item.value} 
                              isTime={item.isTime}
                              onChange={item.onChange}
                              isDarkMode={isDarkMode}
                            />
                          ))}
                        </div>

                        {/* Sound Selector */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 italic">Sound effects</h4>
                          <div className="space-y-6">
                            {[
                              { label: "Round Start/End", key: 'startSound' },
                              { label: "Interval Alert", key: 'intervalSound' },
                              { label: "Warning Alert", key: 'warningSound' },
                              { label: "Final Bell", key: 'finishSound' },
                            ].map((s) => (
                              <div key={s.key} className="space-y-3">
                                <span className="text-[9px] font-bold uppercase opacity-60 tracking-wider flex items-center gap-2">
                                  <Volume2 size={10} /> {s.label}
                                </span>
                                <div className="flex gap-2 flex-wrap">
                                  {(['bell', 'horn', 'tap', 'beep', 'double_tap'] as SoundType[]).map(sound => (
                                    <button
                                      key={sound}
                                      onClick={() => {
                                        setConfig(prev => ({ ...prev, [s.key]: sound }));
                                        playAudio(sound);
                                      }}
                                      className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all ${
                                        (config as any)[s.key] === sound
                                          ? 'bg-warmup text-white shadow-lg shadow-warmup/30'
                                          : isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'
                                      }`}
                                    >
                                      {sound.replace('_', ' ')}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentView('tabs')}
                      className="w-full mt-4 py-6 bg-emerald-500 text-white font-display text-lg font-black italic uppercase rounded-3xl active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                    >
                      Save & Apply
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Workout Tutorial Overlay */}
      <AnimatePresence>
        {showWorkoutOverlay && selectedWorkout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className={`w-full max-w-md h-[85vh] flex flex-col border rounded-[40px] overflow-hidden shadow-2xl ${
                isDarkMode ? 'glass-card border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              <div className="relative aspect-video w-full overflow-hidden shrink-0">
                <img src={selectedWorkout.gifUrl} alt={selectedWorkout.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <button 
                  onClick={() => setShowWorkoutOverlay(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-colors z-20"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-4 left-6 z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-warmup mb-1 block">Training Manual</span>
                  <h2 className="text-2xl font-display font-black italic tracking-tight">{selectedWorkout.name}</h2>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-warmup/10 text-warmup flex items-center justify-center text-xl font-display font-black italic">
                    {timerState === 'REST' ? currentRound + 1 : currentRound}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg italic font-display">
                      {timerState === 'REST' ? 'Next Round Focus' : 'Current Round Focus'}
                    </h3>
                    <p className="text-xs opacity-40 uppercase tracking-widest font-bold">Round {timerState === 'REST' ? currentRound + 1 : currentRound} of {config.rounds}</p>
                  </div>
                </div>
                
                <div className={`p-6 rounded-3xl mb-8 ${isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-lg font-medium leading-relaxed italic text-center">
                    "{selectedWorkout.name}: {selectedWorkout.description}"
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Workout Strategy</h4>
                    <p className="text-sm opacity-70 leading-relaxed">{selectedWorkout.description}</p>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Sections</h4>
                    <div className="space-y-2">
                      {selectedWorkout.sections?.map((section, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-center gap-3 p-3 rounded-xl border ${
                            idx + 1 === (timerState === 'REST' ? currentRound + 1 : currentRound)
                              ? 'bg-warmup/10 border-warmup/30'
                              : 'bg-white/5 border-transparent opacity-40'
                          }`}
                        >
                          <span className="text-[10px] font-black w-4">{idx + 1}</span>
                          <span className="text-xs font-medium truncate">{section.name} (Repeat {section.repeatCount}x)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 pt-0 shrink-0">
                <button
                  onClick={() => setShowWorkoutOverlay(false)}
                  className="w-full py-5 bg-warmup text-white font-bold rounded-2xl shadow-xl shadow-warmup/20 active:scale-95 transition-transform"
                >
                  Return to Training
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-sm p-8 rounded-[40px] text-center relative overflow-hidden border ${
                isDarkMode ? 'bg-bg border-white/10' : 'bg-white border-slate-200'
              } shadow-2xl`}
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-warmup/20 rounded-full blur-3xl" />
              
              <div className="w-20 h-20 bg-warmup rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-warmup/30 rotate-12">
                <Zap size={40} className="text-white" />
              </div>
              
              <h2 className="text-3xl font-display font-black italic mb-3 tracking-tight uppercase">
                Welcome to the Squad
              </h2>
              
              <p className={`mb-8 leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                You're officially part of the Wu-Gong Boxing School. Ready to transform your game?
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowWelcomeModal(false);
                    setShowSubscription(true);
                  }}
                  className="w-full py-4 bg-warmup text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-warmup/20 active:scale-95 transition-transform"
                >
                  Go Elite Now
                </button>
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className={`w-full py-4 font-bold uppercase tracking-widest text-xs opacity-40 hover:opacity-100 transition-opacity`}
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
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
              className={`w-full max-w-sm border rounded-[40px] p-10 text-center shadow-2xl ${
                isDarkMode ? 'glass-card border-white/10' : 'bg-white border-slate-200'
              }`}
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

      {/* Subscription Modal */}
      <AnimatePresence>
        {showSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className={`w-full max-w-lg h-[90vh] sm:h-auto overflow-y-auto border-t sm:border rounded-t-[40px] sm:rounded-[40px] p-8 pb-12 shadow-2xl relative ${
                isDarkMode ? 'bg-bg border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              <button 
                onClick={() => setShowSubscription(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-amber-500 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/30 rotate-12">
                  <Crown size={40} className="text-black -rotate-12" fill="currentColor" />
                </div>
                <h2 className="text-4xl font-display font-black italic mb-2 tracking-tight">Monkey Squad Elite</h2>
                <p className="text-white/40 font-medium">Join the Wu-Gong Boxing School</p>
              </div>

              <div className="space-y-4 mb-10">
                {[
                  { name: 'Contender', duration: '1 Month', price: '$2.99', desc: 'Perfect for starters' },
                  { name: 'Champion', duration: '3 Months', price: '$6.99', desc: 'Most Popular Choice', popular: true },
                  { name: 'Legend', duration: '6 Months', price: '$12.99', desc: 'Best Value Training' },
                ].map((plan, i) => (
                  <button
                    key={i}
                    disabled={isProcessingPayment}
                    onClick={() => handleCheckout(plan)}
                    className={`w-full relative overflow-hidden flex items-center justify-between p-6 border rounded-3xl transition-all active:scale-[0.98] group ${
                      plan.popular 
                        ? (isDarkMode ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10' : 'bg-amber-50 border-amber-500 shadow-lg shadow-amber-900/5')
                        : (isDarkMode ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300')
                    } ${isProcessingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {/* Shining Strike for popular plan */}
                    {plan.popular && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-100 blur-sm" />
                    )}

                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-lg font-black italic tracking-tight ${plan.popular ? 'text-amber-500' : ''}`}>{plan.name}</span>
                        {plan.popular && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[8px] font-black uppercase tracking-widest">Popular</span>
                        )}
                      </div>
                      <div className="text-xs opacity-40 font-bold uppercase tracking-widest">{plan.duration}</div>
                    </div>

                    <div className="text-right">
                      {isProcessingPayment ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                      ) : (
                        <>
                          <div className="text-2xl font-display font-black italic">{plan.price}</div>
                          <div className="text-[10px] opacity-40 font-medium">{plan.desc}</div>
                        </>
                      )}
                    </div>

                    {/* Hover Shine */}
                    {!isProcessingPayment && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 px-4">
                  <CheckCircle2 size={18} className="text-amber-500" />
                  <span className="text-sm font-medium opacity-70">Unlock all Wu-Gong pre-built workouts</span>
                </div>
                <div className="flex items-center gap-3 px-4">
                  <CheckCircle2 size={18} className="text-amber-500" />
                  <span className="text-sm font-medium opacity-70">Custom round presets & training history</span>
                </div>
                <div className="flex items-center gap-3 px-4">
                  <CheckCircle2 size={18} className="text-amber-500" />
                  <span className="text-sm font-medium opacity-70">Advanced analytics & progress tracking</span>
                </div>
              </div>

              <p className="text-center text-[10px] opacity-30 mt-10 px-8">
                Subscription will automatically renew. Cancel anytime in your account settings. 
                By subscribing, you agree to our Terms of Service.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <AnimatePresence>
        {!isActive && (
          <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 px-6 pointer-events-none">
            <motion.nav 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className={`pointer-events-auto flex items-center gap-2 p-2 rounded-full border shadow-2xl transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-white/5 backdrop-blur-3xl border-white/10 shadow-black/50' 
                  : 'bg-white/90 backdrop-blur-2xl border-slate-200 shadow-slate-900/5'
              }`}
            >
              <NavButton active={activeTab === 'timer'} onClick={() => setActiveTab('timer')} icon={<Clock size={20} />} label="Timer" isDarkMode={isDarkMode} />
              <NavButton active={activeTab === 'workouts'} onClick={() => setActiveTab('workouts')} icon={<Dumbbell size={20} />} label="Workouts" isDarkMode={isDarkMode} />
              <NavButton active={activeTab === 'profile'} onClick={() => {
                setAuthSource('generic');
                setActiveTab('profile');
              }} icon={<User size={20} />} label="Profile" isDarkMode={isDarkMode} />
            </motion.nav>
          </div>
        )}
      </AnimatePresence>
      
      {/* Workout Player Overlay */}
      {isPlayingWorkout && selectedWorkout && (
        <WorkoutPlayer 
          workout={selectedWorkout}
          onClose={() => setIsPlayingWorkout(false)}
          onComplete={() => {
            setIsPlayingWorkout(false);
            setShowRating(true);
          }}
        />
      )}
        </div>
      } />
    </Routes>
  );
}

function NavButton({ active, onClick, icon, label, isDarkMode }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; isDarkMode: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-500 overflow-hidden ${
        active 
          ? (isDarkMode ? 'bg-warmup text-white' : 'bg-black text-white') 
          : (isDarkMode ? 'text-white/40 hover:bg-white/5' : 'text-slate-400 hover:bg-slate-100')
      }`}
    >
      <motion.div
        layout
        className="flex items-center gap-2"
      >
        <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
          {icon}
        </div>
        <AnimatePresence mode="wait">
          {active && (
            <motion.span 
              initial={{ width: 0, opacity: 0, x: -10 }}
              animate={{ width: 'auto', opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-xs font-bold uppercase tracking-widest whitespace-nowrap"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      
      {active && (
        <motion.div 
          layoutId="nav-glow"
          className="absolute inset-0 bg-white/10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </button>
  );
}

function ConfigStepper({ label, value, onChange, isDarkMode, isTime = false }: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void;
  isDarkMode: boolean;
  isTime?: boolean;
}) {
  const formatValue = (v: number) => {
    if (!isTime) return v;
    const m = Math.floor(v / 60);
    const s = v % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const increments = isTime ? [1, 30, 60] : [1];

  return (
    <div className="flex flex-col gap-2">
      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>{label}</span>
      <div className={`flex flex-col gap-4 rounded-[32px] p-4 border transition-colors ${
        isDarkMode 
          ? 'glass-card border-white/5' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-center mb-2">
          <div className="flex flex-col items-center">
            <span className={`text-3xl font-display font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {formatValue(value)}
            </span>
            {isTime && <span className="text-[8px] opacity-30 uppercase font-bold tracking-widest">Minutes : Seconds</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[7px] uppercase font-bold tracking-widest opacity-30 text-center">Decrease</span>
            <div className="flex justify-center gap-2">
              {increments.map(inc => (
                <button 
                  key={`dec-${inc}`}
                  onClick={() => onChange(Math.max(inc === 1 ? (isTime ? 5 : 1) : 0, value - inc))}
                  className={`flex-1 h-10 flex flex-col items-center justify-center rounded-xl transition-all active:scale-90 ${
                    isDarkMode ? 'bg-white/5 hover:bg-white/10 border border-white/5' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Minus size={12} />
                  <span className="text-[8px] font-bold">{inc}{isTime ? 's' : ''}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[7px] uppercase font-bold tracking-widest opacity-30 text-center">Increase</span>
            <div className="flex justify-center gap-2">
              {increments.map(inc => (
                <button 
                  key={`inc-${inc}`}
                  onClick={() => onChange(value + inc)}
                  className={`flex-1 h-10 flex flex-col items-center justify-center rounded-xl transition-all active:scale-90 ${
                    isDarkMode ? 'bg-white/5 hover:bg-white/10 border border-white/5' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Plus size={12} />
                  <span className="text-[8px] font-bold">{inc}{isTime ? 's' : ''}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
