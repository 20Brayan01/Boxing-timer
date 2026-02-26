export type TimerState = 'IDLE' | 'WARMUP' | 'FIGHT' | 'REST' | 'FINISHED';

export interface RoundInstruction {
  round: number;
  instruction: string;
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  rounds: number;
  fightTime: number;
  restTime: number;
  category: 'Stamina' | 'Technique' | 'Power' | 'Speed';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
  completions: number;
  rating: number;
  isPremium: boolean;
  gifUrl: string;
  instructions: RoundInstruction[];
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
