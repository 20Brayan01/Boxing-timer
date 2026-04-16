import React, { useState } from 'react';
import { 
  Plus, Trash2, GripVertical, Clock, Hash, 
  Image as ImageIcon, ChevronDown, ChevronUp,
  Copy, Layers, ArrowRight
} from 'lucide-react';
import { motion, Reorder } from 'motion/react';
import { Workout, WorkoutSection, Exercise, ExerciseType } from '../../../../packages/shared/types';

interface Props {
  workout: Partial<Workout>;
  onChange: (workout: Partial<Workout>) => void;
}

export default function WorkoutBuilder({ workout, onChange }: Props) {
  const [sections, setSections] = useState<WorkoutSection[]>(workout.sections || []);

  const updateSections = (newSections: WorkoutSection[]) => {
    setSections(newSections);
    onChange({ ...workout, sections: newSections });
  };

  const addSection = () => {
    const newSection: WorkoutSection = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Section',
      repeatCount: 1,
      restBetweenRounds: 60,
      exercises: []
    };
    updateSections([...sections, newSection]);
  };

  const removeSection = (id: string) => {
    updateSections(sections.filter(s => s.id !== id));
  };

  const addExercise = (sectionId: string) => {
    const newExercise: Exercise = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Exercise',
      type: 'reps',
      setsOrRounds: 3,
      repsOrDuration: 12,
      restBetweenSets: 60,
      alternatives: []
    };
    
    updateSections(sections.map(s => 
      s.id === sectionId ? { ...s, exercises: [...s.exercises, newExercise] } : s
    ));
  };

  const updateExercise = (sectionId: string, exerciseId: string, updates: Partial<Exercise>) => {
    updateSections(sections.map(s => 
      s.id === sectionId ? {
        ...s,
        exercises: s.exercises.map(e => e.id === exerciseId ? { ...e, ...updates } : e)
      } : s
    ));
  };

  const removeExercise = (sectionId: string, exerciseId: string) => {
    updateSections(sections.map(s => 
      s.id === sectionId ? { ...s, exercises: s.exercises.filter(e => e.id !== exerciseId) } : s
    ));
  };

  return (
    <div className="space-y-8">
      <Reorder.Group axis="y" values={sections} onReorder={updateSections} className="space-y-6">
        {sections.map((section) => (
          <Reorder.Item 
            key={section.id} 
            value={section}
            className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden"
          >
            <div className="p-6 bg-white/5 border-b border-white/10 flex items-center gap-4">
              <GripVertical className="text-zinc-600 cursor-grab active:cursor-grabbing" size={20} />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  type="text"
                  value={section.name}
                  onChange={(e) => updateSections(sections.map(s => s.id === section.id ? { ...s, name: e.target.value } : s))}
                  className="bg-transparent text-lg font-bold text-white outline-none focus:text-emerald-500 transition-colors"
                  placeholder="Section Name (e.g. Warmup)"
                />
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-zinc-500" />
                  <span className="text-xs text-zinc-500 font-bold uppercase">Repeat</span>
                  <input 
                    type="number"
                    value={section.repeatCount}
                    onChange={(e) => updateSections(sections.map(s => s.id === section.id ? { ...s, repeatCount: parseInt(e.target.value) || 1 } : s))}
                    className="w-16 bg-zinc-950 border border-white/10 rounded-lg px-2 py-1 text-white text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-zinc-500" />
                  <span className="text-xs text-zinc-500 font-bold uppercase">Rest (s)</span>
                  <input 
                    type="number"
                    value={section.restBetweenRounds}
                    onChange={(e) => updateSections(sections.map(s => s.id === section.id ? { ...s, restBetweenRounds: parseInt(e.target.value) || 0 } : s))}
                    className="w-16 bg-zinc-950 border border-white/10 rounded-lg px-2 py-1 text-white text-sm"
                  />
                </div>
              </div>
              <button 
                onClick={() => removeSection(section.id)}
                className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Reorder.Group 
                axis="y" 
                values={section.exercises} 
                onReorder={(newExercises) => updateSections(sections.map(s => s.id === section.id ? { ...s, exercises: newExercises } : s))}
                className="space-y-3"
              >
                {section.exercises.map((exercise) => (
                  <Reorder.Item 
                    key={exercise.id} 
                    value={exercise}
                    className="bg-zinc-950 border border-white/5 rounded-2xl p-4 flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <GripVertical className="text-zinc-800 cursor-grab" size={16} />
                      <input 
                        type="text"
                        value={exercise.name}
                        onChange={(e) => updateExercise(section.id, exercise.id, { name: e.target.value })}
                        className="flex-1 bg-transparent font-semibold text-zinc-200 outline-none focus:text-emerald-500"
                        placeholder="Exercise Name"
                      />
                      <div className="flex bg-zinc-900 rounded-lg p-1">
                        <button 
                          onClick={() => updateExercise(section.id, exercise.id, { type: 'reps' })}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${exercise.type === 'reps' ? 'bg-emerald-500 text-black' : 'text-zinc-500'}`}
                        >
                          Reps
                        </button>
                        <button 
                          onClick={() => updateExercise(section.id, exercise.id, { type: 'time' })}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${exercise.type === 'time' ? 'bg-emerald-500 text-black' : 'text-zinc-500'}`}
                        >
                          Time
                        </button>
                      </div>
                      <button 
                        onClick={() => removeExercise(section.id, exercise.id)}
                        className="text-zinc-700 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-8">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-600 uppercase">{exercise.type === 'reps' ? 'Sets' : 'Rounds'}</label>
                        <input 
                          type="number"
                          value={exercise.setsOrRounds}
                          onChange={(e) => updateExercise(section.id, exercise.id, { setsOrRounds: parseInt(e.target.value) || 1 })}
                          className="w-full bg-zinc-900 border border-white/5 rounded-lg px-3 py-2 text-white text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-600 uppercase">{exercise.type === 'reps' ? 'Reps' : 'Duration (s)'}</label>
                        <input 
                          type="number"
                          value={exercise.repsOrDuration}
                          onChange={(e) => updateExercise(section.id, exercise.id, { repsOrDuration: parseInt(e.target.value) || 1 })}
                          className="w-full bg-zinc-900 border border-white/5 rounded-lg px-3 py-2 text-white text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-600 uppercase">Rest (s)</label>
                        <input 
                          type="number"
                          value={exercise.restBetweenSets}
                          onChange={(e) => updateExercise(section.id, exercise.id, { restBetweenSets: parseInt(e.target.value) || 0 })}
                          className="w-full bg-zinc-900 border border-white/5 rounded-lg px-3 py-2 text-white text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-600 uppercase">Media URL</label>
                        <div className="relative">
                          <input 
                            type="text"
                            value={exercise.mediaUrl || ''}
                            onChange={(e) => updateExercise(section.id, exercise.id, { mediaUrl: e.target.value })}
                            className="w-full bg-zinc-900 border border-white/5 rounded-lg pl-8 pr-3 py-2 text-white text-sm"
                            placeholder="GIF/Video URL"
                          />
                          <ImageIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                        </div>
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              <button 
                onClick={() => addExercise(section.id)}
                className="w-full py-3 border border-dashed border-white/10 rounded-2xl text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2 text-sm font-bold"
              >
                <Plus size={16} />
                Add Exercise to {section.name}
              </button>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <button 
        onClick={addSection}
        className="w-full py-6 bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-3xl text-emerald-500 hover:bg-emerald-500/10 transition-all flex flex-col items-center gap-2"
      >
        <Plus size={24} />
        <span className="font-bold uppercase tracking-wider text-sm">Add New Workout Section</span>
        <span className="text-xs text-emerald-500/50">Warmup, Main, Finisher, etc.</span>
      </button>
    </div>
  );
}
