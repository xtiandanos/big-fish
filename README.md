# 🐠 Big Fish

An ocean survival game: start as a tiny guppy, eat smaller organisms to grow,
and evolve up the food chain until you become the whale shark — the biggest
fish in the sea.

## Evolution chain

Guppy → Clownfish → Angelfish → Snapper → Tuna → Shark → **Whale Shark**

- Eat anything **smaller** than you (plankton, shrimp, lower-tier fish) to
  fill the growth bar and evolve.
- **Bigger** fish hunt you down — avoid them or lose a life (you get 3).
- Same-size fish are harmless neighbors.
- Reach Whale Shark to win.

## Controls

- **Mouse** — your fish swims toward the pointer
- **WASD / Arrow keys** — direct swimming
- **Enter / button** — start or restart

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5180

## Tech

React 18 + Vite, HTML5 Canvas (all artwork drawn procedurally — no assets).
