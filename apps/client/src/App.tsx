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
  ChevronLeft, ChevronRight, Share2, Zap, Coffee, ShieldCheck, TrendingUp, Moon, Sun,
  Crown, CheckCircle2, Sparkles, LayoutDashboard
} from 'lucide-react';
import { TimerState, Workout, User as SharedUser } from '../../../packages/shared/types';

type Tab = 'home' | 'workouts' | 'profile';
type View = 'tabs' | 'setup' | 'timer' | 'workout-detail';


const WORKOUTS: Workout[] = [
  {
    id: '1',
    name: 'The 12 Jabs',
    description: 'Master the most important punch in boxing. Focus on snap and precision.',
    rounds: 6,
    fightTime: 180,
    restTime: 60,
    category: 'Technique',
    difficulty: 'Beginner',
    completions: 1240,
    rating: 4.8,
    isPremium: false,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKv6eSgY6o/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Double Jab: Focus on the second jab snap.' },
      { round: 2, instruction: 'Jab to Body: Change levels, keep eyes up.' },
      { round: 3, instruction: 'Jab-Cross: Basic 1-2 combo.' },
      { round: 4, instruction: 'Step-in Jab: Close the distance.' },
      { round: 5, instruction: 'Counter Jab: Slip and return.' },
      { round: 6, instruction: 'Speed Jabs: Maximum volume.' },
    ]
  },
  {
    id: '2',
    name: 'Heavy Bag Blast',
    description: 'High intensity interval training on the heavy bag.',
    rounds: 8,
    fightTime: 120,
    restTime: 30,
    category: 'Stamina',
    difficulty: 'Intermediate',
    completions: 850,
    rating: 4.5,
    isPremium: false,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlT6fS6S6S6S6S6/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Warmup: Light punches, move around the bag.' },
      { round: 2, instruction: 'Power Hooks: Focus on hip rotation.' },
      { round: 3, instruction: 'Straight Punches: 1-2-1-2 non-stop.' },
      { round: 4, instruction: 'Body-Head: Upstairs, downstairs.' },
      { round: 5, instruction: 'Defense: Punch, slip, punch.' },
      { round: 6, instruction: 'Intervals: 10s hard, 10s light.' },
      { round: 7, instruction: 'Uppercuts: Close range power.' },
      { round: 8, instruction: 'Burnout: Everything you have left.' },
    ]
  },
  {
    id: '3',
    name: 'Monkey Squad Elite',
    description: 'Advanced Wu-Gong boxing drills for professional fighters.',
    rounds: 12,
    fightTime: 180,
    restTime: 60,
    category: 'Power',
    difficulty: 'Pro',
    completions: 320,
    rating: 4.9,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKv6eSgY6o/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Wu-Gong Stance: Perfect balance and weight distribution.' },
      { round: 2, instruction: 'Monkey Slip: Fluid head movement.' },
      { round: 3, instruction: 'Explosive Entry: Burst through the guard.' },
      { round: 4, instruction: 'Pivot Power: Generate force from the ground.' },
      { round: 5, instruction: 'Triple Threat: Jab, hook, uppercut.' },
      { round: 6, instruction: 'Active Recovery: Move and breathe.' },
      { round: 7, instruction: 'Counter Mastery: Bait and punish.' },
      { round: 8, instruction: 'Pressure: Constant forward motion.' },
      { round: 9, instruction: 'Angle Attack: Never stay on the line.' },
      { round: 10, instruction: 'Body Snatcher: Dig deep into the midsection.' },
      { round: 11, instruction: 'Championship Rounds: Push through the wall.' },
      { round: 12, instruction: 'Final Stand: Empty the tank.' },
    ]
  },
  {
    id: '4',
    name: 'Speed Demon',
    description: 'Focus on hand speed and fast twitch muscle activation.',
    rounds: 10,
    fightTime: 90,
    restTime: 45,
    category: 'Speed',
    difficulty: 'Advanced',
    completions: 540,
    rating: 4.7,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKv6eSgY6o/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Fast Jabs: 100 jabs as fast as possible.' },
      { round: 2, instruction: 'Shoeshine: Rapid uppercuts inside.' },
      { round: 3, instruction: '1-2-3-4: Straight punch flurries.' },
      { round: 4, instruction: 'Head Movement: Slip, slip, roll, roll.' },
      { round: 5, instruction: 'Double Hooks: Lead hook, rear hook speed.' },
      { round: 6, instruction: 'Step-back Counters: Quick retreat and fire.' },
      { round: 7, instruction: 'Volume Jabs: Non-stop lead hand.' },
      { round: 8, instruction: 'Power-Speed Mix: 1 hard, 3 fast.' },
      { round: 9, instruction: 'Reflex Drills: React to the imaginary bag.' },
      { round: 10, instruction: 'Sprint Finish: Max speed till the bell.' },
    ]
  },
  {
    id: '5',
    name: 'Iron Chin Defense',
    description: 'Defensive fundamentals. Blocking, parrying, and rolling.',
    rounds: 6,
    fightTime: 180,
    restTime: 60,
    category: 'Technique',
    difficulty: 'Beginner',
    completions: 2100,
    rating: 4.6,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlT6fS6S6S6S6S6/giphy.gif',
    instructions: [
      { round: 1, instruction: 'High Guard: Keep elbows in, chin down.' },
      { round: 2, instruction: 'Parrying Jabs: Catch and return.' },
      { round: 3, instruction: 'Shoulder Roll: Deflect the cross.' },
      { round: 4, instruction: 'Catching Hooks: Tighten the guard.' },
      { round: 5, instruction: 'Bob and Weave: Under the hooks.' },
      { round: 6, instruction: 'Full Defense: Mix all techniques.' },
    ]
  },
  {
    id: '6',
    name: 'Southpaw Slayer',
    description: 'Tactics for fighting an opposite stance opponent.',
    rounds: 8,
    fightTime: 180,
    restTime: 60,
    category: 'Technique',
    difficulty: 'Intermediate',
    completions: 430,
    rating: 4.8,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKv6eSgY6o/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Lead Foot Battle: Step outside the lead foot.' },
      { round: 2, instruction: 'The Straight Right: Fire down the pipe.' },
      { round: 3, instruction: 'Lead Hook: Over the southpaw jab.' },
      { round: 4, instruction: 'Body Cross: Target the open side.' },
      { round: 5, instruction: 'Circling Right: Stay away from the power.' },
      { round: 6, instruction: 'Double Jab: Blind the opponent.' },
      { round: 7, instruction: 'Counter Left: Slip outside and fire.' },
      { round: 8, instruction: 'Aggressive Pressure: Don\'t let them set.' },
    ]
  },
  {
    id: '7',
    name: 'Endurance Engine',
    description: 'Long rounds to build championship-level stamina.',
    rounds: 4,
    fightTime: 300,
    restTime: 30,
    category: 'Stamina',
    difficulty: 'Advanced',
    completions: 670,
    rating: 4.9,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlT6fS6S6S6S6S6/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Steady Pace: 60% effort, constant movement.' },
      { round: 2, instruction: 'Active Rest: Punch light, don\'t stop.' },
      { round: 3, instruction: 'Building Heat: Increase volume every minute.' },
      { round: 4, instruction: 'The Wall: Push through the fatigue.' },
    ]
  },
  {
    id: '8',
    name: 'Power Puncher',
    description: 'Focus on weight transfer and kinetic linking for max power.',
    rounds: 6,
    fightTime: 120,
    restTime: 90,
    category: 'Power',
    difficulty: 'Intermediate',
    completions: 920,
    rating: 4.7,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKv6eSgY6o/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Grounding: Feel the floor, sit on your punches.' },
      { round: 2, instruction: 'Rear Cross: Full hip rotation.' },
      { round: 3, instruction: 'Lead Hook: Pivot the lead foot 90 degrees.' },
      { round: 4, instruction: 'Overhand Right: Loop it over the guard.' },
      { round: 5, instruction: 'Body Hooks: Sink your weight into the bag.' },
      { round: 6, instruction: 'Power Combos: 1-2-3 with bad intentions.' },
    ]
  },
  {
    id: '9',
    name: 'Shadow Warrior',
    description: 'Pure shadowboxing. Focus on visualization and form.',
    rounds: 5,
    fightTime: 180,
    restTime: 60,
    category: 'Technique',
    difficulty: 'Beginner',
    completions: 3400,
    rating: 4.5,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKv6eSgY6o/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Footwork only: Hands up, move in all directions.' },
      { round: 2, instruction: 'Straight punches: Focus on extension.' },
      { round: 3, instruction: 'Head movement: Slip after every combo.' },
      { round: 4, instruction: 'Imaginary Opponent: React to their punches.' },
      { round: 5, instruction: 'Full Flow: Mix everything together.' },
    ]
  },
  {
    id: '10',
    name: 'The Clinch Master',
    description: 'Inside fighting and clinch work drills.',
    rounds: 6,
    fightTime: 180,
    restTime: 60,
    category: 'Technique',
    difficulty: 'Advanced',
    completions: 280,
    rating: 4.8,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlT6fS6S6S6S6S6/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Closing the Distance: Head down, high guard.' },
      { round: 2, instruction: 'Underhooks: Control the opponent\'s arms.' },
      { round: 3, instruction: 'Short Uppercuts: Dig inside.' },
      { round: 4, instruction: 'Turning the Opponent: Use your weight.' },
      { round: 5, instruction: 'Dirty Boxing: Punch on the break.' },
      { round: 6, instruction: 'Inside Survival: Keep your chin tucked.' },
    ]
  },
  {
    id: '11',
    name: 'Counter-Punching 101',
    description: 'Learn to bait and punish. Timing over speed.',
    rounds: 8,
    fightTime: 120,
    restTime: 60,
    category: 'Technique',
    difficulty: 'Intermediate',
    completions: 1100,
    rating: 4.7,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKv6eSgY6o/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Slip Jab: Return your own jab.' },
      { round: 2, instruction: 'Pull Counter: Lean back and fire the cross.' },
      { round: 3, instruction: 'Catch and Shoot: Block the hook, return the hook.' },
      { round: 4, instruction: 'Duck and Counter: Under the hook, fire the cross.' },
      { round: 5, instruction: 'Step-out Counter: Reset and fire.' },
      { round: 6, instruction: 'Baiting: Leave a small opening.' },
      { round: 7, instruction: 'Check Hook: Pivot as they charge.' },
      { round: 8, instruction: 'Reactive Combinations: 3-punch counters.' },
    ]
  },
  {
    id: '12',
    name: 'Body Blow Burnout',
    description: 'Targeting the midsection for maximum damage.',
    rounds: 6,
    fightTime: 150,
    restTime: 45,
    category: 'Power',
    difficulty: 'Intermediate',
    completions: 890,
    rating: 4.6,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlT6fS6S6S6S6S6/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Jab to Body: Change levels quickly.' },
      { round: 2, instruction: 'Lead Hook to Liver: Dig deep.' },
      { round: 3, instruction: 'Rear Hook to Spleen: Power shot.' },
      { round: 4, instruction: 'Straight Right to Solar Plexus.' },
      { round: 5, instruction: 'Head-Body Mix: Upstairs, downstairs.' },
      { round: 6, instruction: 'Body Flurries: Non-stop hooks.' },
    ]
  },
  {
    id: '13',
    name: 'The Peek-a-Boo Flow',
    description: 'Mike Tyson style head movement and explosive entries.',
    rounds: 10,
    fightTime: 120,
    restTime: 60,
    category: 'Speed',
    difficulty: 'Pro',
    completions: 150,
    rating: 4.9,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKv6eSgY6o/giphy.gif',
    instructions: [
      { round: 1, instruction: 'The Pendulum: Constant side-to-side movement.' },
      { round: 2, instruction: 'Explosive Entry: Leap in with the hook.' },
      { round: 3, instruction: 'Double Roll: Under two hooks.' },
      { round: 4, instruction: 'Uppercut-Hook: The classic Tyson combo.' },
      { round: 5, instruction: 'Body-Head Hooks: Fast transitions.' },
      { round: 6, instruction: 'Shifting: Change stance while punching.' },
      { round: 7, instruction: 'Pressure: Never stop moving forward.' },
      { round: 8, instruction: 'Head Movement Mix: Slip, roll, weave.' },
      { round: 9, instruction: 'Power Flurries: 5-6 punch bursts.' },
      { round: 10, instruction: 'Final Burn: Max intensity.' },
    ]
  },
  {
    id: '14',
    name: 'Footwork Fundamentals',
    description: 'Balance is everything. Drills to keep you on your toes.',
    rounds: 5,
    fightTime: 180,
    restTime: 60,
    category: 'Technique',
    difficulty: 'Beginner',
    completions: 1500,
    rating: 4.4,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKv6eSgY6o/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Step and Slide: Forward, back, left, right.' },
      { round: 2, instruction: 'The Pivot: 45 and 90 degree turns.' },
      { round: 3, instruction: 'Circle Left: Stay on the outside.' },
      { round: 4, instruction: 'Circle Right: Controlled movement.' },
      { round: 5, instruction: 'In and Out: Close distance and retreat.' },
    ]
  },
  {
    id: '15',
    name: 'The Wu-Gong Flow',
    description: 'Rhythmic boxing inspired by traditional martial arts.',
    rounds: 8,
    fightTime: 180,
    restTime: 30,
    category: 'Technique',
    difficulty: 'Advanced',
    completions: 310,
    rating: 4.8,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKv6eSgY6o/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Breathing: Sync breath with every punch.' },
      { round: 2, instruction: 'Circular Blocks: Deflect and return.' },
      { round: 3, instruction: 'The Whip Jab: Relaxed arm, explosive snap.' },
      { round: 4, instruction: 'Flowing Combos: 1-2-3-2-1 sequence.' },
      { round: 5, instruction: 'Animal Stances: Low and high transitions.' },
      { round: 6, instruction: 'Hidden Punches: Fire from the hip.' },
      { round: 7, instruction: 'Rhythmic Defense: Move with the beat.' },
      { round: 8, instruction: 'Zen Boxing: Calm mind, fast hands.' },
    ]
  },
  {
    id: '16',
    name: 'Heavy Bag Power Endurance',
    description: 'Hard punches for the full duration of the round.',
    rounds: 6,
    fightTime: 180,
    restTime: 60,
    category: 'Stamina',
    difficulty: 'Advanced',
    completions: 420,
    rating: 4.7,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlT6fS6S6S6S6S6/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Power Jabs: Snap the bag back.' },
      { round: 2, instruction: '1-2 Power: Every shot at 90%.' },
      { round: 3, instruction: 'Hook Flurries: Don\'t let the bag stop moving.' },
      { round: 4, instruction: 'Body-Head Power: Change levels with force.' },
      { round: 5, instruction: 'Inside Power: Short, explosive shots.' },
      { round: 6, instruction: 'The Finish: Max power till the end.' },
    ]
  },
  {
    id: '17',
    name: 'Reflex & Reaction',
    description: 'Improve your eyes and reaction time.',
    rounds: 6,
    fightTime: 120,
    restTime: 60,
    category: 'Speed',
    difficulty: 'Intermediate',
    completions: 780,
    rating: 4.6,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKv6eSgY6o/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Reactive Jabs: Fire when you see an opening.' },
      { round: 2, instruction: 'Slip-Counter: React to imaginary shots.' },
      { round: 3, instruction: 'Double-End Bag Style: Fast, light touches.' },
      { round: 4, instruction: 'Head Movement Flow: Never be a stationary target.' },
      { round: 5, instruction: 'Counter Flurries: 3 punches for every 1.' },
      { round: 6, instruction: 'Max Speed Reaction: Sprint rounds.' },
    ]
  },
  {
    id: '18',
    name: 'The Ring General',
    description: 'Controlling the space and pace of the fight.',
    rounds: 8,
    fightTime: 180,
    restTime: 60,
    category: 'Technique',
    difficulty: 'Advanced',
    completions: 390,
    rating: 4.8,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKv6eSgY6o/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Center Control: Own the middle of the ring.' },
      { round: 2, instruction: 'Cutting the Ring: Step across their path.' },
      { round: 3, instruction: 'The Long Jab: Keep them at bay.' },
      { round: 4, instruction: 'Feinting: Make them react to nothing.' },
      { round: 5, instruction: 'Trapping: Corner the imaginary opponent.' },
      { round: 6, instruction: 'Lateral Movement: Side to side control.' },
      { round: 7, instruction: 'Pace Control: Slow it down, then speed it up.' },
      { round: 8, instruction: 'Full Ring Mastery: Mix all tactics.' },
    ]
  },
  {
    id: '19',
    name: 'Beginner Boxing Basics',
    description: 'The foundation of everything. Stance and basic punches.',
    rounds: 4,
    fightTime: 180,
    restTime: 90,
    category: 'Technique',
    difficulty: 'Beginner',
    completions: 5600,
    rating: 4.3,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlT6fS6S6S6S6S6/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Stance Check: Feet shoulder width, hands up.' },
      { round: 2, instruction: 'The Jab: Straight out, straight back.' },
      { round: 3, instruction: 'The Cross: Pivot the back foot.' },
      { round: 4, instruction: '1-2 Combo: Jab then Cross.' },
    ]
  },
  {
    id: '20',
    name: 'Wu-Gong Grandmaster',
    description: 'The ultimate test of skill, power, and endurance.',
    rounds: 15,
    fightTime: 180,
    restTime: 30,
    category: 'Power',
    difficulty: 'Pro',
    completions: 45,
    rating: 5.0,
    isPremium: true,
    gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKv6eSgY6o/giphy.gif',
    instructions: [
      { round: 1, instruction: 'Meditation in Motion: Perfect form.' },
      { round: 2, instruction: 'The Monkey Jab: Rhythmic entries.' },
      { round: 3, instruction: 'Iron Guard: Unbreakable defense.' },
      { round: 4, instruction: 'Explosive Bursts: 10s max effort.' },
      { round: 5, instruction: 'Body Snatching: Inside power.' },
      { round: 6, instruction: 'Slip and Counter: Precision timing.' },
      { round: 7, instruction: 'Triple Hooks: Speed and power.' },
      { round: 8, instruction: 'The Wu-Gong Step: Advanced footwork.' },
      { round: 9, instruction: 'Pressure Boxing: No room to breathe.' },
      { round: 10, instruction: 'Counter-Punching: Punish every mistake.' },
      { round: 11, instruction: 'Championship Rounds: Heart over fatigue.' },
      { round: 12, instruction: 'The Wall: Push through.' },
      { round: 13, instruction: 'Final Technique: Mastery of form.' },
      { round: 14, instruction: 'Final Power: Every shot counts.' },
      { round: 15, instruction: 'The Grandmaster: Everything you have.' },
    ]
  }
];

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
  const navigate = useNavigate();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
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
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        checkSubscriptionWarning(userData.subscription_end_date);
        if (userData.subscription_end_date) {
          const isExpired = new Date(userData.subscription_end_date) < new Date();
          setIsPremium(!isExpired);
        }
      } else {
        console.error('Fetch user failed with status:', res.status);
        const errorData = await res.json().catch(() => ({}));
        console.error('Fetch user error data:', errorData);
        handleLogout();
      }
    } catch (err) {
      console.error('Fetch user error:', err);
    }
  };

  const verifySubscription = async (sessionId: string) => {
    try {
      const res = await fetch('/api/subscription/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      });
      if (res.ok) {
        setPaymentResult('success');
        fetchUser();
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
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (res.ok) {
        if (authMode === 'login') {
          localStorage.setItem('token', data.token);
          setToken(data.token);
          setUser(data.user);
          setIsPremium(!!data.user.subscription_end_date && new Date(data.user.subscription_end_date) > new Date());
          setAuthEmail('');
          setAuthPassword('');
        } else {
          // Auto-login after signup
          const loginRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: authEmail, password: authPassword })
          });
          const loginData = await loginRes.json();
          if (loginRes.ok) {
            localStorage.setItem('token', loginData.token);
            setToken(loginData.token);
            setUser(loginData.user);
            setIsPremium(!!loginData.user.subscription_end_date && new Date(loginData.user.subscription_end_date) > new Date());
            setAuthEmail('');
            setAuthPassword('');
            
            if (authSource === 'subscription') {
              setShowSubscription(true);
            } else {
              setShowWelcomeModal(true);
            }
          } else {
            setAuthMode('login');
            setAuthError('Account created! Please login.');
          }
        }
      } else {
        setAuthError(data.error);
      }
    } catch (err) {
      setAuthError('Authentication failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
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
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planName: plan.name,
          price: plan.price,
          duration: plan.duration
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
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
      // Fight Start Sound (High)
      playSound(880, 0.5);
      setTimerState('FIGHT');
      setTimeLeft(config.fightTime);
    } else if (timerState === 'FIGHT') {
      if (currentRound < config.rounds) {
        // Rest Start Sound (Lower)
        playSound(440, 0.5);
        setTimerState('REST');
        setTimeLeft(config.restTime);
      } else {
        // Workout Finished Sound (Victory)
        playSound(880, 0.3);
        setTimeout(() => playSound(1046.5, 0.8), 300);
        setTimerState('FINISHED');
        setIsActive(false);
        setShowRating(true);
      }
    } else if (timerState === 'REST') {
      // Round Start Sound (High)
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
        setTotalSecondsElapsed(prev => prev + 1);
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
    // Start Sound
    playSound(660, 0.2);
    setTimeout(() => playSound(880, 0.4), 200);
    
    setTimerState('WARMUP');
    setTimeLeft(config.warmupTime);
    setCurrentRound(1);
    setIsActive(true);
    setCurrentView('timer');
    setTotalSecondsElapsed(0);
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
          background: `radial-gradient(circle at 50% 50%, ${currentView === 'timer' ? getThemeColor() : 'var(--color-warmup)'} 0%, transparent 70%)` 
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
                <h1 className="font-display text-xl font-extrabold italic tracking-tight">SparTime</h1>
              </div>
              <div className="flex items-center gap-2">
                {!isPremium && (
                  <button 
                    onClick={() => setShowSubscription(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    <Crown size={12} fill="currentColor" />
                    Go Pro
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
                {activeTab === 'home' && (
                  <motion.div 
                    key="home"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    {/* Welcome Card */}
                    <div className={`relative overflow-hidden border rounded-[32px] p-8 transition-all duration-500 ${
                      isDarkMode 
                        ? 'glass-card border-white/10' 
                        : 'bg-gradient-to-br from-amber-50 to-blue-50 border-slate-100 shadow-sm'
                    }`}>
                      <div className="relative z-10">
                        <h2 className="text-3xl font-display font-black italic mb-2">Ready to Spar?</h2>
                        <p className={`${isDarkMode ? 'text-white/50' : 'text-slate-600'} mb-6 max-w-[200px]`}>Set your rounds and push your limits today.</p>
                        <button 
                          onClick={() => {
                            setSelectedWorkout(null);
                            setCurrentView('setup');
                          }}
                          className={`px-8 py-4 font-bold rounded-2xl flex items-center gap-2 active:scale-95 transition-all shadow-lg ${
                            isDarkMode ? 'bg-warmup text-white shadow-warmup/20' : 'bg-black text-white shadow-slate-900/10'
                          }`}
                        >
                          <Play size={18} fill="currentColor" />
                          Start Session
                        </button>
                      </div>
                      <Dumbbell size={120} className={`absolute -right-8 -bottom-8 rotate-12 ${isDarkMode ? 'text-white/5' : 'text-blue-500/5'}`} />
                    </div>

                    {/* Premium CTA */}
                    {!isPremium && (
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setShowSubscription(true)}
                        className={`cursor-pointer border rounded-[32px] p-8 relative overflow-hidden group shadow-2xl transition-all duration-500 ${
                          isDarkMode 
                            ? 'bg-gradient-to-br from-amber-500/20 via-bg to-bg border-amber-500/30 shadow-amber-500/5' 
                            : 'bg-gradient-to-br from-amber-100 via-white to-white border-amber-200 shadow-amber-900/5'
                        }`}
                      >
                        {/* Shining Yellow Strike Effect */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50 blur-sm" />
                        
                        <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Crown size={140} className="text-amber-500 rotate-12" />
                        </div>

                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/40">
                              <Zap size={20} className="text-black fill-black" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-500">Monkey Squad Elite</span>
                          </div>
                          
                          <h3 className="text-2xl font-display font-black italic mb-2 leading-tight">Master the Wu-Gong Boxing Style</h3>
                          <p className={`text-sm mb-6 max-w-[240px] ${isDarkMode ? 'text-white/50' : 'text-slate-600'}`}>
                            Unlock professional workouts from our legendary school of boxing.
                          </p>
                          
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setShowSubscription(true)}
                              className={`px-6 py-3 font-bold rounded-xl shadow-xl transition-all active:scale-95 ${
                                isDarkMode ? 'bg-amber-500 text-black shadow-amber-500/20' : 'bg-black text-white shadow-black/20'
                              }`}
                            >
                              Upgrade Now
                            </button>
                            <div className="flex -space-x-2">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-bg bg-zinc-800 flex items-center justify-center overflow-hidden">
                                  <img src={`https://picsum.photos/seed/${i + 10}/32/32`} alt="user" referrerPolicy="no-referrer" />
                                </div>
                              ))}
                              <div className="w-8 h-8 rounded-full border-2 border-bg bg-amber-500 flex items-center justify-center text-[10px] font-black text-black">
                                +2k
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Animated Shine */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
                      </motion.div>
                    )}

                    {/* Quick Start Presets */}
                    <div>
                      <div className="flex items-center justify-between mb-4 px-1">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Wu-Gong Basics</h4>
                        <span className="text-[10px] font-bold text-warmup uppercase tracking-widest">2 Free Sessions</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {[
                          { 
                            name: 'Monkey Footwork', 
                            rounds: 6, 
                            time: '3:00', 
                            desc: 'Agility & Balance focus',
                            color: 'from-blue-500/20 to-cyan-500/20',
                            icon: <Zap size={20} className="text-blue-400" />
                          },
                          { 
                            name: 'Iron Guard Drill', 
                            rounds: 8, 
                            time: '2:00', 
                            desc: 'Defensive endurance',
                            color: 'from-emerald-500/20 to-teal-500/20',
                            icon: <ShieldCheck size={20} className="text-emerald-400" />
                          },
                        ].map((p, i) => (
                          <button 
                            key={i}
                            onClick={() => {
                              setSelectedWorkout(null);
                              setConfig({ ...config, rounds: p.rounds, fightTime: parseInt(p.time) * 60 });
                              setCurrentView('setup');
                            }}
                            className={`group relative overflow-hidden flex items-center p-5 border rounded-[28px] transition-all active:scale-[0.98] ${
                              isDarkMode 
                                ? 'glass-card border-white/5 hover:border-white/20' 
                                : 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'
                            }`}
                          >
                            <div className={`absolute inset-0 bg-gradient-to-br ${p.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                            
                            <div className="relative z-10 flex items-center gap-5 w-full">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                                isDarkMode ? 'bg-white/5' : 'bg-slate-100'
                              }`}>
                                {p.icon}
                              </div>
                              <div className="text-left flex-1">
                                <div className="font-black text-lg italic tracking-tight">{p.name}</div>
                                <div className="text-xs opacity-50 font-medium mb-1">{p.desc}</div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-warmup">
                                    <RotateCcw size={10} />
                                    {p.rounds} Rounds
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-40">
                                    <Clock size={10} />
                                    {p.time} min
                                  </div>
                                </div>
                              </div>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                isDarkMode ? 'bg-white/5 group-hover:bg-warmup' : 'bg-slate-100 group-hover:bg-black group-hover:text-white'
                              }`}>
                                <Play size={16} fill="currentColor" className="ml-1" />
                              </div>
                            </div>
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
                      {WORKOUTS.filter(w => {
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
                                  <Star size={12} className="text-amber-500 fill-amber-500" />
                                  <span className="text-xs font-bold opacity-60">{w.rating}</span>
                                  <span className="mx-1 opacity-20">•</span>
                                  <span className="text-xs opacity-40 uppercase tracking-widest font-bold">{w.rounds} Rounds</span>
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
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{w.completions.toLocaleString()}</span>
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
                            className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all active:scale-[0.98] ${
                              isDarkMode 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
                                : 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'
                            }`}
                          >
                            <span className="flex items-center gap-3 font-bold text-sm">
                              <RotateCcw size={18} /> Sign Out
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

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className={`${isDarkMode ? 'glass-card' : 'bg-white border border-slate-200'} rounded-2xl p-4 text-center`}>
                  <RotateCcw size={18} className="text-warmup mx-auto mb-1" />
                  <div className="text-lg font-display font-bold">{selectedWorkout.rounds}</div>
                  <div className="text-[8px] uppercase tracking-widest opacity-40">Rounds</div>
                </div>
                <div className={`${isDarkMode ? 'glass-card' : 'bg-white border border-slate-200'} rounded-2xl p-4 text-center`}>
                  <Clock size={18} className="text-amber-500 mx-auto mb-1" />
                  <div className="text-lg font-display font-bold">{selectedWorkout.fightTime / 60}m</div>
                  <div className="text-[8px] uppercase tracking-widest opacity-40">Fight</div>
                </div>
                <div className={`${isDarkMode ? 'glass-card' : 'bg-white border border-slate-200'} rounded-2xl p-4 text-center`}>
                  <History size={18} className="text-emerald-400 mx-auto mb-1" />
                  <div className="text-lg font-display font-bold">{selectedWorkout.restTime}s</div>
                  <div className="text-[8px] uppercase tracking-widest opacity-40">Rest</div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-4">Description</h3>
                <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
                  {selectedWorkout.description}
                </p>
              </div>

              <div className="mb-8">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-4">Round Instructions</h3>
                <div className="space-y-3">
                  {selectedWorkout.instructions.map((inst, i) => (
                    <div 
                      key={i}
                      className={`flex items-start gap-4 p-4 rounded-2xl border ${
                        isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-warmup/10 text-warmup flex items-center justify-center text-xs font-black shrink-0">
                        {inst.round}
                      </div>
                      <p className="text-sm font-medium opacity-80 pt-1">{inst.instruction}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setConfig({
                    rounds: selectedWorkout.rounds,
                    fightTime: selectedWorkout.fightTime,
                    restTime: selectedWorkout.restTime,
                    warmupTime: 10
                  });
                  startTraining();
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
              <h2 className="text-2xl font-display font-black italic tracking-tight">Session Setup</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-6 pb-32 custom-scrollbar">
              {/* Top Space with Premium Card */}
              <div className="min-h-[35vh] flex flex-col justify-end pb-8">
                {!isPremium && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setShowSubscription(true)}
                    className={`border rounded-3xl p-6 relative overflow-hidden group cursor-pointer transition-all ${
                      isDarkMode 
                        ? 'glass-card border-amber-500/30' 
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown size={16} className="text-amber-500 fill-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Monkey Squad Elite</span>
                      </div>
                      <h3 className="text-xl font-display font-black italic mb-1">Unlock Pro Workouts</h3>
                      <p className={`text-sm mb-5 ${isDarkMode ? 'opacity-60' : 'text-slate-500'}`}>
                        Access expert-designed routines from Wu-Gong boxing coaches.
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold opacity-40">Starting at $2.99</span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                          View Plans <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                    <Zap size={80} className={`absolute -right-4 -bottom-4 -rotate-12 group-hover:scale-110 transition-transform ${isDarkMode ? 'text-amber-500/10' : 'text-slate-100'}`} />
                  </motion.div>
                )}
              </div>

              <div className="space-y-5 pb-10">
                {[
                  { label: "Rounds", value: config.rounds, onChange: (v: number) => setConfig(prev => ({ ...prev, rounds: Math.max(1, v) })) },
                  { label: "Fight Time", value: config.fightTime, isTime: true, onChange: (v: number) => setConfig(prev => ({ ...prev, fightTime: Math.max(10, v) })) },
                  { label: "Rest Time", value: config.restTime, isTime: true, onChange: (v: number) => setConfig(prev => ({ ...prev, restTime: Math.max(5, v) })) },
                  { label: "Warmup", value: config.warmupTime, isTime: true, onChange: (v: number) => setConfig(prev => ({ ...prev, warmupTime: Math.max(5, v) })) },
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

              <button
                onClick={() => {
                  setSelectedWorkout(null);
                  startTraining();
                }}
                className={`w-full py-5 font-bold rounded-2xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3 ${isDarkMode ? 'bg-white text-black shadow-white/5' : 'bg-black text-white shadow-black/10'}`}
              >
                <Play size={20} fill="currentColor" />
                Start Training
              </button>
            </div>
          </motion.div>
        )}

        {currentView === 'timer' && (
          <motion.div 
            key="timer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* Header */}
            <div className="w-full flex justify-between items-center p-6 z-10">
              <button 
                onClick={() => {
                  setIsActive(false);
                  setCurrentView('setup');
                }}
                className={`p-3 rounded-2xl transition-all active:scale-90 ${
                  isDarkMode 
                    ? 'glass-card glass-card-hover' 
                    : 'bg-white border border-slate-200 shadow-sm hover:bg-slate-50'
                }`}
              >
                <ChevronLeft size={24} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">
                  {selectedWorkout ? selectedWorkout.name : 'Session Active'}
                </span>
                <h1 className="font-display text-xl font-extrabold italic tracking-tight">SparTime</h1>
              </div>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-2xl transition-all active:scale-90 ${
                  isDarkMode 
                    ? 'glass-card glass-card-hover' 
                    : 'bg-white border border-slate-200 shadow-sm hover:bg-slate-50'
                }`}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
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
                    scale: isActive ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                    <motion.circle
                      cx="128"
                      cy="128"
                      r="120"
                      fill="transparent"
                      stroke={getThemeColor()}
                      strokeWidth="6"
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
                        filter: `drop-shadow(0 0 8px ${getThemeColor()})`,
                        opacity: timerState === 'IDLE' ? 0.1 : 1
                      }}
                    />
                  </svg>

                  {/* Inner Content */}
                  <div className="flex flex-col items-center justify-center text-center z-20">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={timerState + (timerState === 'FIGHT' && timeLeft <= 10 ? '-warn' : '')}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="font-display text-sm font-black uppercase tracking-[0.2em] mb-1"
                        style={{ color: getThemeColor() }}
                      >
                        {timerState === 'FIGHT' && timeLeft <= 10 ? 'Finish Strong!' : (timerState === 'IDLE' ? 'Ready' : timerState)}
                      </motion.span>
                    </AnimatePresence>
                    
                    <span className={`font-mono text-6xl font-black tracking-tighter tabular-nums ${!isDarkMode ? 'text-slate-900' : 'text-white'}`}>
                      {formatTime(timeLeft)}
                    </span>

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

                {/* Outer Glow */}
                <motion.div 
                  className="absolute w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
                  animate={{ 
                    backgroundColor: getThemeColor(),
                    scale: isActive ? [1, 1.1, 1] : 1
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                />
              </div>

            {/* Round Counter */}
            <div className="z-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-4 mb-8 flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Round</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-bold text-warmup">{currentRound}</span>
                <span className="text-xl opacity-30">/</span>
                <span className="text-xl opacity-30">{config.rounds}</span>
              </div>
            </div>

            {/* Workout Info */}
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
                      <p className="text-sm font-medium leading-relaxed italic">
                        "{timerState === 'REST' 
                          ? selectedWorkout.instructions.find(i => i.round === currentRound + 1)?.instruction || 'Get ready for the next round!'
                          : selectedWorkout.instructions.find(i => i.round === currentRound)?.instruction || 'Keep pushing!'}"
                      </p>
                    </motion.div>
                  </AnimatePresence>
                  
                  <div className="mt-3 flex justify-center">
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-30">Tap to expand tutorial</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Controls */}
            <div className="w-full max-w-md grid grid-cols-2 gap-4 z-10 mb-4">
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
                onClick={skipPhase}
                className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-white/5 text-white/70 border border-white/10 font-bold transition-all active:scale-95 hover:bg-white/10"
              >
                <FastForward size={20} />
                Skip
              </button>
            </div>

            <button
              onClick={resetTimer}
              className="w-full max-w-md flex items-center justify-center gap-3 py-4 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 font-bold transition-all active:scale-95 hover:bg-orange-500/20"
            >
              <RotateCcw size={18} />
              Reset Session
            </button>
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
                    "{timerState === 'REST' 
                      ? selectedWorkout.instructions.find(i => i.round === currentRound + 1)?.instruction || 'Get ready for the next round!'
                      : selectedWorkout.instructions.find(i => i.round === currentRound)?.instruction || 'Keep pushing!'}"
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Workout Strategy</h4>
                    <p className="text-sm opacity-70 leading-relaxed">{selectedWorkout.description}</p>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Full Plan</h4>
                    <div className="space-y-2">
                      {selectedWorkout.instructions.map((inst, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-center gap-3 p-3 rounded-xl border ${
                            inst.round === (timerState === 'REST' ? currentRound + 1 : currentRound)
                              ? 'bg-warmup/10 border-warmup/30'
                              : 'bg-white/5 border-transparent opacity-40'
                          }`}
                        >
                          <span className="text-[10px] font-black w-4">{inst.round}</span>
                          <span className="text-xs font-medium truncate">{inst.instruction}</span>
                          {inst.round === (timerState === 'REST' ? currentRound + 1 : currentRound) && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-warmup animate-pulse" />
                          )}
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
              <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={20} />} label="Home" isDarkMode={isDarkMode} />
              <NavButton active={activeTab === 'workouts'} onClick={() => setActiveTab('workouts')} icon={<Dumbbell size={20} />} label="Workouts" isDarkMode={isDarkMode} />
              <NavButton active={activeTab === 'profile'} onClick={() => {
                setAuthSource('generic');
                setActiveTab('profile');
              }} icon={<User size={20} />} label="Profile" isDarkMode={isDarkMode} />
            </motion.nav>
          </div>
        )}
      </AnimatePresence>
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
