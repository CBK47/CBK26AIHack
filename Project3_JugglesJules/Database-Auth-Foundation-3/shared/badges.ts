export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "session" | "skill" | "streak" | "special";
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: "first_session",
    name: "First Steps",
    description: "Complete your first training session",
    icon: "play",
    category: "session",
  },
  {
    id: "first_100_catches",
    name: "Century Club",
    description: "Reach 100 total catches across all tricks",
    icon: "target",
    category: "skill",
  },
  {
    id: "first_500_catches",
    name: "Catch Machine",
    description: "Reach 500 total catches across all tricks",
    icon: "zap",
    category: "skill",
  },
  {
    id: "sessions_10",
    name: "Dedicated Juggler",
    description: "Complete 10 training sessions",
    icon: "dumbbell",
    category: "session",
  },
  {
    id: "sessions_25",
    name: "Committed",
    description: "Complete 25 training sessions",
    icon: "award",
    category: "session",
  },
  {
    id: "sessions_50",
    name: "Juggling Veteran",
    description: "Complete 50 training sessions",
    icon: "medal",
    category: "session",
  },
  {
    id: "marathon",
    name: "Marathon Juggler",
    description: "Complete a single session lasting 30+ minutes",
    icon: "timer",
    category: "session",
  },
  {
    id: "perfect_run",
    name: "Perfect Run",
    description: "Complete a session with zero drops",
    icon: "sparkles",
    category: "special",
  },
  {
    id: "variety_5",
    name: "Variety Show",
    description: "Practice 5 different tricks in one session",
    icon: "shuffle",
    category: "special",
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Start a training session before 7 AM",
    icon: "sunrise",
    category: "special",
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Start a training session after 10 PM",
    icon: "moon",
    category: "special",
  },
  {
    id: "streak_3",
    name: "3-Day Streak",
    description: "Practice for 3 consecutive days",
    icon: "flame",
    category: "streak",
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Practice for 7 consecutive days",
    icon: "flame",
    category: "streak",
  },
  {
    id: "streak_30",
    name: "Monthly Master",
    description: "Practice for 30 consecutive days",
    icon: "crown",
    category: "streak",
  },
  {
    id: "level_5",
    name: "Rising Star",
    description: "Reach Level 5",
    icon: "star",
    category: "skill",
  },
  {
    id: "level_10",
    name: "Seasoned Pro",
    description: "Reach Level 10",
    icon: "trophy",
    category: "skill",
  },
  {
    id: "first_mastery",
    name: "The Master",
    description: "Master your first trick (100 catches)",
    icon: "check-circle",
    category: "skill",
  },
  {
    id: "master_3",
    name: "Triple Threat",
    description: "Master 3 different tricks",
    icon: "crown",
    category: "skill",
  },
  {
    id: "master_all",
    name: "Grandmaster",
    description: "Master every trick in the library",
    icon: "gem",
    category: "skill",
  },
  {
    id: "practice_1h",
    name: "Hour of Power",
    description: "Accumulate 1 hour of total practice time",
    icon: "clock",
    category: "session",
  },
  {
    id: "practice_10h",
    name: "10-Hour Club",
    description: "Accumulate 10 hours of total practice time",
    icon: "clock",
    category: "session",
  },
  {
    id: "practice_50h",
    name: "50 Hours",
    description: "Accumulate 50 hours of total practice time",
    icon: "hourglass",
    category: "session",
  },
];

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_CATALOG.find(b => b.id === id);
}
