import db from './db';

const INITIAL_WORKOUTS = [
  {
    id: '1',
    name: 'The 12 Jabs',
    description: 'Master the most important punch in boxing. Focus on snap and precision.',
    rounds: 6,
    fight_time: 180,
    rest_time: 60,
    category: 'Technique',
    difficulty: 'Beginner',
    completions: 1240,
    rating: 4.8,
    is_premium: 0,
    gif_url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKv6eSgY6o/giphy.gif',
    instructions: JSON.stringify([
      { round: 1, instruction: 'Double Jab: Focus on the second jab snap.' },
      { round: 2, instruction: 'Jab to Body: Change levels, keep eyes up.' },
      { round: 3, instruction: 'Jab-Cross: Basic 1-2 combo.' },
      { round: 4, instruction: 'Step-in Jab: Close the distance.' },
      { round: 5, instruction: 'Counter Jab: Slip and return.' },
      { round: 6, instruction: 'Speed Jabs: Maximum volume.' },
    ])
  },
  {
    id: '2',
    name: 'Heavy Bag Blast',
    description: 'High intensity interval training on the heavy bag.',
    rounds: 8,
    fight_time: 120,
    rest_time: 30,
    category: 'Stamina',
    difficulty: 'Intermediate',
    completions: 850,
    rating: 4.5,
    is_premium: 0,
    gif_url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlT6fS6S6S6S6S6/giphy.gif',
    instructions: JSON.stringify([
      { round: 1, instruction: 'Warmup: Light punches, move around the bag.' },
      { round: 2, instruction: 'Power Hooks: Focus on hip rotation.' },
      { round: 3, instruction: 'Straight Punches: 1-2-1-2 non-stop.' },
      { round: 4, instruction: 'Body-Head: Upstairs, downstairs.' },
      { round: 5, instruction: 'Defense: Punch, slip, punch.' },
      { round: 6, instruction: 'Intervals: 10s hard, 10s light.' },
      { round: 7, instruction: 'Uppercuts: Close range power.' },
      { round: 8, instruction: 'Burnout: Everything you have left.' },
    ])
  },
  {
    id: '3',
    name: 'Monkey Squad Elite',
    description: 'Advanced Wu-Gong boxing drills for professional fighters.',
    rounds: 12,
    fight_time: 180,
    rest_time: 60,
    category: 'Power',
    difficulty: 'Pro',
    completions: 320,
    rating: 4.9,
    is_premium: 1,
    gif_url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKv6eSgY6o/giphy.gif',
    instructions: JSON.stringify([
      { round: 1, instruction: 'Shadowboxing: Flow like water, move your head.' },
      { round: 2, instruction: 'The Monkey Jab: Low to high, unexpected angles.' },
      { round: 3, instruction: 'Explosive 1-2: Maximum power on the cross.' },
      { round: 4, instruction: 'Pivot Hooks: Turn the corner on your opponent.' },
      { round: 5, instruction: 'Body Snatcher: Dig deep into the liver.' },
      { round: 6, instruction: 'Slip & Rip: Defensive mastery into offense.' },
      { round: 7, instruction: 'Triple Uppercut: Inside fighting dominance.' },
      { round: 8, instruction: 'The Wu-Gong Step: Advanced footwork patterns.' },
      { round: 9, instruction: 'Counter-Punching: Wait for the opening.' },
      { round: 10, instruction: 'Pressure Boxing: Cut the ring off.' },
      { round: 11, instruction: 'Championship Rounds: Push through the wall.' },
      { round: 12, instruction: 'Final Stand: Empty the tank.' },
    ])
  }
  // ... more can be added later via Admin Panel
];

const INITIAL_PLANS = [
  {
    id: '1_month',
    name: '1 Month Elite',
    price: 19,
    duration_months: 1,
    features: JSON.stringify(['All Premium Workouts', 'Training Analytics', 'Priority Support'])
  },
  {
    id: '3_months',
    name: '3 Months Elite',
    price: 49,
    duration_months: 3,
    features: JSON.stringify(['All Premium Workouts', 'Training Analytics', 'Priority Support', 'Save 15%'])
  },
  {
    id: '6_months',
    name: '6 Months Elite',
    price: 89,
    duration_months: 6,
    features: JSON.stringify(['All Premium Workouts', 'Training Analytics', 'Priority Support', 'Save 25%'])
  }
];

export function seed() {
  const workoutCount = db.prepare('SELECT COUNT(*) as count FROM workouts').get() as any;
  if (workoutCount.count === 0) {
    const insertWorkout = db.prepare(`
      INSERT INTO workouts (id, name, description, rounds, fight_time, rest_time, category, difficulty, completions, rating, is_premium, gif_url, instructions)
      VALUES (@id, @name, @description, @rounds, @fight_time, @rest_time, @category, @difficulty, @completions, @rating, @is_premium, @gif_url, @instructions)
    `);
    
    INITIAL_WORKOUTS.forEach(w => insertWorkout.run(w));
    console.log('Seeded workouts');
  }

  const planCount = db.prepare('SELECT COUNT(*) as count FROM plans').get() as any;
  if (planCount.count === 0) {
    const insertPlan = db.prepare(`
      INSERT INTO plans (id, name, price, duration_months, features)
      VALUES (@id, @name, @price, @duration_months, @features)
    `);
    
    INITIAL_PLANS.forEach(p => insertPlan.run(p));
    console.log('Seeded plans');
  }
}
