export type TimerState = 'IDLE' | 'WARMUP' | 'FIGHT' | 'REST' | 'FINISHED';

export interface RoundInstruction {
  round: number;
  instruction: string;
}

export type ExerciseType = 'reps' | 'time';

export interface ExerciseAlternative {
  name: string;
  mediaUrl?: string;
  repsOrDuration?: number;
}

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  setsOrRounds: number;
  repsOrDuration: number;
  restBetweenSets: number;
  mediaUrl?: string;
  alternatives: ExerciseAlternative[];
}

export interface WorkoutSection {
  id: string;
  name: string;
  repeatCount: number;
  restBetweenRounds: number;
  exercises: Exercise[];
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  rounds: number;
  fightTime: number;
  restTime: number;
  category: string;
  difficulty: string;
  completions: number;
  rating: number;
  isPremium: boolean;
  gifUrl: string;
  instructions: RoundInstruction[];
  sections: WorkoutSection[];
  totalDuration?: number;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  duration: string;
  features: string[];
}

export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
  subscription_end_date?: string;
  created_at?: string;
}
