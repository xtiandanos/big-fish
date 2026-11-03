// Evolution chain: the player starts as a Guppy and climbs the food chain.
// tier 0 organisms (plankton/shrimp) are edible by everyone.
// A fish can only eat things with a strictly lower tier, and is eaten by
// anything with a higher tier.
//
// `shape` selects the body plan in fishArt.js, modeled on the real fish.

export const SPECIES = [
  {
    tier: 1,
    name: 'Guppy',
    shape: 'guppy',
    size: 20,
    color: '#9db6c4', // silver body
    accent: '#ff8c42', // orange fan tail
    pattern: 'plain',
    speed: 150,
    evolveAt: 60,
  },
  {
    tier: 2,
    name: 'Clownfish',
    shape: 'clownfish',
    size: 30,
    color: '#f2762e',
    accent: '#f8f9fa',
    pattern: 'stripes',
    speed: 145,
    evolveAt: 140,
  },
  {
    tier: 3,
    name: 'Angelfish',
    shape: 'angelfish',
    size: 42,
    color: '#cfd8e0',
    accent: '#ffcd5c',
    pattern: 'stripes',
    speed: 140,
    evolveAt: 260,
  },
  {
    tier: 4,
    name: 'Snapper',
    shape: 'snapper',
    size: 56,
    color: '#d95263',
    accent: '#f2b8ad',
    pattern: 'plain',
    speed: 135,
    evolveAt: 430,
  },
  {
    tier: 5,
    name: 'Tuna',
    shape: 'tuna',
    size: 74,
    color: '#3e5c7e',
    accent: '#eef3f7',
    pattern: 'plain',
    speed: 132,
    evolveAt: 650,
  },
  {
    tier: 6,
    name: 'Shark',
    shape: 'shark',
    size: 96,
    color: '#6e8291',
    accent: '#eef3f7',
    pattern: 'plain',
    speed: 130,
    evolveAt: 950,
  },
  {
    tier: 7,
    name: 'Whale Shark',
    shape: 'whaleshark',
    size: 130,
    color: '#4f708c',
    accent: '#dfe9ef',
    pattern: 'spots',
    speed: 125,
    evolveAt: Infinity, // final form — the game is won here
  },
];

// Small drifting organisms everyone can eat.
export const CRITTERS = [
  { name: 'Plankton', size: 6, color: '#9fe870', points: 2 },
  { name: 'Shrimp', size: 10, color: '#f2a0b5', points: 3 },
];

export function speciesFor(tier) {
  return SPECIES[Math.min(Math.max(tier, 1), 7) - 1];
}

export function pointsForTier(tier) {
  if (tier <= 0) return 0; // critters use their own points value
  return 4 + tier * 3;
}
