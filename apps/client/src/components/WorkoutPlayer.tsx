import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, 
  X, CheckCircle2, Clock, Repeat,
  ArrowRightLeft, Volume2, VolumeX,
  FastForward, Info, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Workout, WorkoutSection, Exercise } from '../shared-types';

interface Props {
  workout: Workout;
  onClose: () => void;
  onComplete: () => void;
}

type PlayerState = 'intro' | 'working' | 'resting' | 'section_rest' | 'complete';

export default function WorkoutPlayer({ workout, onClose, onComplete }: Props) {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [sectionRepeatIndex, setSectionRepeatIndex] = useState(0);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [state, setState] = useState<PlayerState>('intro');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentSection = workout.sections[sectionIndex];
  const currentExercise = currentSection?.exercises[exerciseIndex];

  // Initialize active exercise based on current original exercise
  useEffect(() => {
    if (currentExercise) {
      setActiveExercise(currentExercise);
    }
  }, [currentExercise]);

  const totalSteps = useMemo(() => {
    let count = 0;
    workout.sections.forEach(s => {
      let sectionSteps = 0;
      s.exercises.forEach(e => {
        sectionSteps += e.setsOrRounds;
      });
      count += sectionSteps * s.repeatCount;
    });
    return count;
  }, [workout]);

  const currentStepProgress = useMemo(() => {
    let completedSteps = 0;
    for (let si = 0; si < sectionIndex; si++) {
      const s = workout.sections[si];
      let sSteps = 0;
      s.exercises.forEach(e => sSteps += e.setsOrRounds);
      completedSteps += sSteps * s.repeatCount;
    }
    
    // Current section
    const s = workout.sections[sectionIndex];
    if (s) {
      let sStepsPerRound = 0;
      s.exercises.forEach(e => sStepsPerRound += e.setsOrRounds);
      completedSteps += sectionRepeatIndex * sStepsPerRound;

      // Current round
      for (let ei = 0; ei < exerciseIndex; ei++) {
        completedSteps += s.exercises[ei].setsOrRounds;
      }
      completedSteps += setIndex;
    }
    
    return completedSteps;
  }, [workout, sectionIndex, sectionRepeatIndex, exerciseIndex, setIndex]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handlePhaseEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive && activeExercise?.type === 'time') {
       handlePhaseEnd();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, activeExercise?.type]);

  const playSound = (type: 'beep' | 'finish') => {
    if (isMuted) return;
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'beep') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.error('Audio failed', e);
    }
  };

  const handlePhaseEnd = () => {
    setIsActive(false);
    playSound('finish');
    
    if (state === 'working') {
      if (activeExercise?.restBetweenSets && activeExercise.restBetweenSets > 0) {
        setState('resting');
        setTimeLeft(activeExercise.restBetweenSets);
        setIsActive(true);
      } else {
        nextStep();
      }
    } else {
      nextStep();
    }
  };

  const nextStep = () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // 1. Next Set
    if (setIndex < (activeExercise?.setsOrRounds || 1) - 1) {
      setSetIndex(prev => prev + 1);
      startExercise();
      return;
    }

    // 2. Next Exercise in Section
    if (exerciseIndex < currentSection.exercises.length - 1) {
      setExerciseIndex(prev => prev + 1);
      setSetIndex(0);
      startExercise();
      return;
    }

    // 3. Finished round of section
    if (sectionRepeatIndex < (currentSection.repeatCount || 1) - 1) {
      if (currentSection.restBetweenRounds > 0 && state !== 'section_rest') {
        setState('section_rest');
        setTimeLeft(currentSection.restBetweenRounds);
        setIsActive(true);
      } else {
        setSectionRepeatIndex(prev => prev + 1);
        setExerciseIndex(0);
        setSetIndex(0);
        startExercise();
      }
      return;
    }

    // 4. Next Section
    if (sectionIndex < workout.sections.length - 1) {
      setSectionIndex(prev => prev + 1);
      setSectionRepeatIndex(0);
      setExerciseIndex(0);
      setSetIndex(0);
      startExercise();
      return;
    }

    // 5. Workout Complete
    setState('complete');
  };

  const prevStep = () => {
    setIsActive(false);
    if (setIndex > 0) {
      setSetIndex(prev => prev - 1);
      startExercise();
    } else if (exerciseIndex > 0) {
      setExerciseIndex(prev => prev - 1);
      const prevEx = currentSection.exercises[exerciseIndex - 1];
      setSetIndex(prevEx.setsOrRounds - 1);
      startExercise();
    } else if (sectionRepeatIndex > 0) {
      setSectionRepeatIndex(prev => prev - 1);
      setExerciseIndex(currentSection.exercises.length - 1);
      const prevEx = currentSection.exercises[currentSection.exercises.length - 1];
      setSetIndex(prevEx.setsOrRounds - 1);
      startExercise();
    } else if (sectionIndex > 0) {
      setSectionIndex(prev => prev - 1);
      const prevSec = workout.sections[sectionIndex - 1];
      setSectionRepeatIndex(prevSec.repeatCount - 1);
      setExerciseIndex(prevSec.exercises.length - 1);
      const prevEx = prevSec.exercises[prevSec.exercises.length - 1];
      setSetIndex(prevEx.setsOrRounds - 1);
      startExercise();
    }
  };

  const startExercise = () => {
    setState('working');
    // Ensure we refer to a fresh exercise if indices changed
    const targetEx = workout.sections[sectionIndex].exercises[exerciseIndex];
    if (targetEx.type === 'time') {
      setTimeLeft(targetEx.repsOrDuration);
      setIsActive(true);
    } else {
      setTimeLeft(0);
      setIsActive(false);
    }
  };

  const startWorkout = () => {
    setState('working');
    setSectionIndex(0);
    setSectionRepeatIndex(0);
    setExerciseIndex(0);
    setSetIndex(0);
    startExercise();
  };

  const toggleAlternative = () => {
    if (!activeExercise || !currentExercise) return;
    if (activeExercise.alternatives && activeExercise.alternatives.length > 0) {
      // Basic toggle between original and first alternative
      if (activeExercise.id === currentExercise.id) {
        const alt = activeExercise.alternatives[0];
        setActiveExercise({
          ...currentExercise,
          name: alt.name,
          mediaUrl: alt.mediaUrl || currentExercise.mediaUrl,
          repsOrDuration: alt.repsOrDuration || currentExercise.repsOrDuration,
          id: 'alt_' + currentExercise.id
        });
      } else {
        setActiveExercise(currentExercise);
      }
    }
  };

  if (state === 'intro') {
    return (
      <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white tracking-tight">{workout.name}</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">{workout.category}</p>
          </div>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center space-y-12 py-12">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-4"
          >
            <div className="text-7xl font-black text-white italic tracking-tighter">GET READY</div>
            <p className="text-zinc-400 text-sm font-medium">
              Hierarchical Workout Flow • {workout.sections.length} Sections
            </p>
          </motion.div>

          <div className="w-full max-w-sm space-y-3">
            {workout.sections.map((s, i) => (
              <motion.div 
                key={s.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-5 bg-white/[0.03] rounded-3xl border border-white/5"
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-sm italic">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black text-white uppercase italic">{s.name}</div>
                  <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                    {s.exercises.length} Exercises • Repeat {s.repeatCount}x
                  </div>
                </div>
                {s.restBetweenRounds > 0 && (
                  <div className="flex flex-col items-end">
                    <Clock size={12} className="text-zinc-600" />
                    <span className="text-[8px] font-black text-zinc-600">{s.restBetweenRounds}s REST</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-4 mt-auto">
          <button 
            onClick={startWorkout}
            className="w-full py-6 bg-emerald-500 text-black font-black text-xl italic rounded-[2rem] hover:bg-emerald-400 transition-all active:scale-95 shadow-2xl shadow-emerald-500/20 uppercase"
          >
            Commence Mission
          </button>
        </div>
      </div>
    );
  }

  if (state === 'complete') {
    return (
      <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 animate-pulse" />
            <div className="relative w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
              <CheckCircle2 size={64} className="text-black" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">MISSION ACCOMPLISHED</h2>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">You conquered the {workout.name}</p>
          </div>
          <button 
            onClick={onComplete}
            className="w-full py-5 bg-white text-black font-black italic text-lg rounded-[2rem] hover:bg-zinc-200 transition-colors uppercase tracking-widest"
          >
            Dismiss
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col overflow-hidden">
      {/* Dynamic Header */}
      <div className="p-6 pb-4 flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
              {currentSection.name}
            </div>
          </div>
          <h3 className="text-white font-black italic tracking-tight text-lg">
            Round {sectionRepeatIndex + 1} <span className="text-zinc-600">of</span> {currentSection.repeatCount}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 flex flex-col px-6 justify-center relative">
        <AnimatePresence mode="wait">
          <motion.div 
            key={`${sectionIndex}-${sectionRepeatIndex}-${exerciseIndex}-${setIndex}-${state}`}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -10 }}
            className="w-full text-center space-y-8"
          >
            {state === 'working' ? (
              <div className="space-y-12">
                <div className="space-y-2">
                  <div className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] italic">
                    Exercise {exerciseIndex + 1}/{currentSection.exercises.length} • Set {setIndex + 1}/{activeExercise?.setsOrRounds}
                  </div>
                  <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                    {activeExercise?.name}
                  </h1>
                </div>

                {activeExercise?.mediaUrl && (
                  <div className="w-full max-w-sm aspect-video bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-white/10 mx-auto shadow-2xl relative">
                    <img 
                      src={activeExercise.mediaUrl} 
                      alt={activeExercise.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>
                )}

                <div className="flex flex-col items-center">
                  <div className="text-[12rem] font-black text-white leading-none tabular-nums tracking-tighter italic">
                    {activeExercise?.type === 'time' ? (
                       timeLeft
                    ) : (
                      activeExercise?.repsOrDuration
                    )}
                  </div>
                  <div className="text-emerald-500 font-black italic tracking-widest text-sm uppercase -mt-4">
                    {activeExercise?.type === 'time' ? 'SECONDS LEFT' : 'REPS REQUIRED'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-12 py-12">
                <div className="relative">
                   <div className="absolute inset-0 bg-amber-500/20 blur-3xl opacity-30 rounded-full" />
                   <div className="text-amber-500 font-black text-3xl italic uppercase tracking-[0.5em] relative">REST</div>
                </div>
                
                <div className="text-[14rem] font-black text-white tabular-nums leading-none italic tracking-tighter">
                  {timeLeft}
                </div>
                
                <div className="space-y-4">
                  <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Incoming Intelligence</p>
                  <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] inline-block">
                    <div className="text-white font-black italic uppercase text-xl">
                      {currentSection.exercises[exerciseIndex + 1]?.name || 'Next Strategic Round'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Strategic Controls */}
      <div className="p-8 pb-12 pt-4 space-y-10">
        <div className="flex items-center justify-between">
          <button 
            onClick={toggleAlternative}
            disabled={!currentExercise?.alternatives?.length}
            className="group flex flex-col items-center gap-2 disabled:opacity-20 transition-all"
          >
            <div className="p-4 bg-white/5 rounded-2xl group-active:scale-95 transition-transform">
              <ArrowRightLeft size={18} className="text-zinc-400 group-hover:text-white" />
            </div>
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Swap Alt</span>
          </button>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={prevStep}
              className="p-4 bg-white/5 rounded-full text-zinc-500 hover:text-white active:scale-90 transition-all"
            >
              <SkipBack size={24} />
            </button>
            
            <button 
              onClick={() => activeExercise?.type === 'time' ? setIsActive(!isActive) : handlePhaseEnd()}
              className={`w-24 h-24 rounded-full flex items-center justify-center text-black shadow-2xl transition-all active:scale-90 relative overflow-hidden ${
                isActive ? 'bg-white shadow-white/10' : 'bg-emerald-500 shadow-emerald-500/20'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
              {activeExercise?.type === 'time' ? (
                isActive ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />
              ) : (
                <CheckCircle2 size={36} />
              )}
            </button>

            <button 
              onClick={state === 'working' ? handlePhaseEnd : nextStep}
              className="p-4 bg-white/5 rounded-full text-zinc-500 hover:text-white active:scale-90 transition-all"
            >
              <SkipForward size={24} />
            </button>
          </div>

          <button 
            onClick={nextStep}
            className="group flex flex-col items-center gap-2 transition-all"
          >
            <div className="p-4 bg-white/5 rounded-2xl group-active:scale-95 transition-transform">
              <FastForward size={18} className="text-zinc-400 group-hover:text-white" />
            </div>
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Skip Phase</span>
          </button>
        </div>

        {/* Global Mission Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Mission Progress</span>
            <span className="text-[10px] font-black text-emerald-500 italic">
              {Math.round((currentStepProgress / totalSteps) * 100)}%
            </span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
            <motion.div 
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStepProgress / totalSteps) * 100}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
