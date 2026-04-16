import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, 
  X, CheckCircle2, Clock, Repeat,
  ArrowRightLeft, Volume2, VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Workout, WorkoutSection, Exercise } from '../../../../packages/shared/types';

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

  const currentSection = workout.sections[sectionIndex];
  const currentExercise = currentSection?.exercises[exerciseIndex];

  useEffect(() => {
    if (currentExercise) {
      setActiveExercise(currentExercise);
    }
  }, [currentExercise]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handlePhaseEnd();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handlePhaseEnd = () => {
    setIsActive(false);
    if (state === 'working') {
      if (activeExercise?.restBetweenSets && activeExercise.restBetweenSets > 0) {
        setState('resting');
        setTimeLeft(activeExercise.restBetweenSets);
        setIsActive(true);
      } else {
        nextStep();
      }
    } else if (state === 'resting' || state === 'section_rest') {
      nextStep();
    }
  };

  const nextStep = () => {
    if (state === 'working' || state === 'resting') {
      // Check if more sets/rounds in current exercise
      if (setIndex < (activeExercise?.setsOrRounds || 1) - 1) {
        setSetIndex(prev => prev + 1);
        startExercise();
      } else {
        // Move to next exercise in section
        if (exerciseIndex < currentSection.exercises.length - 1) {
          setExerciseIndex(prev => prev + 1);
          setSetIndex(0);
          startExercise();
        } else {
          // Finished all exercises in section round
          if (sectionRepeatIndex < currentSection.repeatCount - 1) {
            if (currentSection.restBetweenRounds > 0) {
              setState('section_rest');
              setTimeLeft(currentSection.restBetweenRounds);
              setIsActive(true);
            } else {
              setSectionRepeatIndex(prev => prev + 1);
              setExerciseIndex(0);
              setSetIndex(0);
              startExercise();
            }
          } else {
            // Move to next section
            if (sectionIndex < workout.sections.length - 1) {
              setSectionIndex(prev => prev + 1);
              setSectionRepeatIndex(0);
              setExerciseIndex(0);
              setSetIndex(0);
              startExercise();
            } else {
              setState('complete');
            }
          }
        }
      }
    } else if (state === 'section_rest') {
      setSectionRepeatIndex(prev => prev + 1);
      setExerciseIndex(0);
      setSetIndex(0);
      startExercise();
    }
  };

  const startExercise = () => {
    setState('working');
    if (activeExercise?.type === 'time') {
      setTimeLeft(activeExercise.repsOrDuration);
      setIsActive(true);
    } else {
      setTimeLeft(0);
      setIsActive(false);
    }
  };

  const startWorkout = () => {
    startExercise();
  };

  const toggleAlternative = () => {
    if (!activeExercise || activeExercise.alternatives.length === 0) return;
    // Simple toggle for now: swap main with first alternative
    const alt = activeExercise.alternatives[0];
    const main = currentExercise!;
    
    if (activeExercise.id === main.id) {
      setActiveExercise({
        ...main,
        name: alt.name,
        mediaUrl: alt.mediaUrl || main.mediaUrl,
        repsOrDuration: alt.repsOrDuration || main.repsOrDuration
      });
    } else {
      setActiveExercise(main);
    }
  };

  if (state === 'intro') {
    return (
      <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col p-6">
        <div className="flex justify-between items-center mb-12">
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">{workout.name}</h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">{workout.category}</p>
          </div>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-4"
          >
            <div className="text-6xl font-black text-white">READY?</div>
            <p className="text-zinc-400 max-w-xs mx-auto">
              {workout.sections.length} sections • {workout.totalDuration ? Math.round(workout.totalDuration / 60) : '??'} minutes
            </p>
          </motion.div>

          <div className="w-full max-w-sm space-y-4">
            {workout.sections.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                  {i + 1}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-white">{s.name}</div>
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">{s.exercises.length} exercises • {s.repeatCount} rounds</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={startWorkout}
          className="w-full py-5 bg-emerald-500 text-black font-black text-lg rounded-3xl hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
        >
          START WORKOUT
        </button>
      </div>
    );
  }

  if (state === 'complete') {
    return (
      <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-6"
        >
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
            <CheckCircle2 size={48} className="text-black" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white">WORKOUT COMPLETE</h2>
            <p className="text-zinc-500">You crushed the {workout.name} session!</p>
          </div>
          <button 
            onClick={onComplete}
            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
          >
            FINISH
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 flex justify-between items-center bg-zinc-950/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            {currentSection.name} • Round {sectionRepeatIndex + 1}/{currentSection.repeatCount}
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 space-y-8 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeExercise?.id + state}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-8"
            >
              {state === 'working' ? (
                <>
                  <div className="space-y-2">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tight">{activeExercise?.name}</h1>
                    <div className="text-emerald-500 font-bold uppercase tracking-widest text-sm">
                      Set {setIndex + 1} of {activeExercise?.setsOrRounds}
                    </div>
                  </div>

                  {activeExercise?.mediaUrl && (
                    <div className="w-full max-w-md aspect-video bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 mx-auto">
                      <img 
                        src={activeExercise.mediaUrl} 
                        alt={activeExercise.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <div className="text-8xl font-black text-white tabular-nums">
                    {activeExercise?.type === 'time' ? (
                      timeLeft > 0 ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : 'DONE'
                    ) : (
                      `${activeExercise?.repsOrDuration} REPS`
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-8 py-12">
                  <div className="text-emerald-500 font-black text-2xl uppercase tracking-widest">REST</div>
                  <div className="text-9xl font-black text-white tabular-nums">
                    {timeLeft}
                  </div>
                  <div className="text-zinc-500 font-bold uppercase">
                    Next: {currentSection.exercises[exerciseIndex + 1]?.name || 'Next Round'}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-8 bg-zinc-900/50 border-t border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={toggleAlternative}
            disabled={!activeExercise?.alternatives.length}
            className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase hover:text-white transition-colors disabled:opacity-20"
          >
            <ArrowRightLeft size={16} />
            Alternative
          </button>
          
          <div className="flex items-center gap-8">
            <button className="text-zinc-500 hover:text-white transition-colors">
              <SkipBack size={24} />
            </button>
            
            <button 
              onClick={() => activeExercise?.type === 'time' ? setIsActive(!isActive) : handlePhaseEnd()}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-all active:scale-95"
            >
              {activeExercise?.type === 'time' ? (
                isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />
              ) : (
                <CheckCircle2 size={32} />
              )}
            </button>

            <button onClick={nextStep} className="text-zinc-500 hover:text-white transition-colors">
              <SkipForward size={24} />
            </button>
          </div>

          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${((sectionIndex * currentSection.repeatCount + sectionRepeatIndex + 1) / (workout.sections.length * currentSection.repeatCount)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
