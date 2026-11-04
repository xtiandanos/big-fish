import { useEffect, useRef, useState } from 'react';
import { SPECIES, CRITTERS, speciesFor, pointsForTier } from './species.js';
import { drawFish, drawCritter } from './fishArt.js';
import {
  initFacebook,
  fbLogin,
  fbMe,
  fbLogout,
  shareOnFacebook,
} from './facebook.js';

const START_LIVES = 3;
const INVINCIBLE_TIME = 2.2;

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function makeCritter(W, H) {
  const kind = CRITTERS[Math.floor(Math.random() * CRITTERS.length)];
  return {
    kind: 'critter',
    name: kind.name,
    tier: 0,
    size: kind.size,
    color: kind.color,
    points: kind.points,
    x: rand(0, W),
    y: rand(40, H - 40),
    vx: rand(-20, 20),
    vy: rand(-14, 14),
    phase: rand(0, Math.PI * 2),
    wob: rand(0.8, 1.6),
  };
}

function makeFish(tier, W, H, playerTier) {
  const sp = speciesFor(tier);
  const dir = Math.random() < 0.5 ? 1 : -1;
  const size = sp.size * rand(0.85, 1.15);
  return {
    kind: 'fish',
    tier,
    name: sp.name,
    shape: sp.shape,
    seed: rand(0, 10),
    mouthTimer: 0,
    size,
    color: sp.color,
    accent: sp.accent,
    pattern: sp.pattern,
    x: dir > 0 ? -size * 2 : W + size * 2,
    y: rand(60, H - 60),
    vx: dir * sp.speed * rand(0.5, 0.8),
    vy: 0,
    phase: rand(0, Math.PI * 2),
    wob: rand(0.6, 1.4),
    playerTierAtSpawn: playerTier,
  };
}

// Facebook brand "f" mark, used on login/share buttons
function FacebookIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 36 36"
      fill="currentColor"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M25 23.8l1.2-7.3h-7v-4.9c0-2 1-3.9 4.1-3.9h3.2V1.7C26.5 1.5 24.2 1.1 21.6 1.1c-5.6 0-9.3 3.4-9.3 9.7v5.7H4.8v7.3h7.5V35h8V23.8H25z" />
    </svg>
  );
}

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('menu'); // menu | playing | gameover | won
  const [hud, setHud] = useState({
    score: 0,
    tier: 1,
    progress: 0,
    lives: START_LIVES,
    message: '',
  });
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const startRef = useRef(null);
  const hudRef = useRef(hud);
  hudRef.current = hud;
  // Facebook section on the end screens: idle → loading → logged-in/out | unavailable
  const [fbStatus, setFbStatus] = useState('idle');
  const [fbUser, setFbUser] = useState(null);
  // Challenge from a shared link: /?score=1234&species=Shark&name=Christian
  const [challenge] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const score = Number(p.get('score'));
      if (!score) return null;
      return { score, species: p.get('species'), name: p.get('name') };
    } catch {
      return null;
    }
  });

  // Load the FB SDK lazily — only once an end screen is shown.
  useEffect(() => {
    if ((phase === 'gameover' || phase === 'won') && fbStatus === 'idle') {
      setFbStatus('loading');
      initFacebook().then(setFbStatus);
    }
  }, [phase, fbStatus]);

  // Fetch the profile (name + avatar) once logged in.
  useEffect(() => {
    if (fbStatus === 'logged-in' && !fbUser) {
      fbMe().then(setFbUser).catch(() => {});
    }
  }, [fbStatus, fbUser]);

  function handleFbLogin() {
    setFbStatus('loading');
    fbLogin()
      .then((status) => {
        setFbStatus(status);
        if (status === 'logged-in') fbMe().then(setFbUser).catch(() => {});
      })
      .catch(() => setFbStatus('unavailable'));
  }

  function handleFbLogout() {
    setFbUser(null);
    fbLogout().then(() => setFbStatus('logged-out'));
  }

  function handleFbShare() {
    const current = speciesFor(hudRef.current.tier);
    shareOnFacebook({
      score: hudRef.current.score,
      species: current.name,
      playerName: fbUser?.name,
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;
    let W = 0;
    let H = 0;
    let dpr = 1;

    const keys = {};
    const pointer = { x: 0, y: 0, active: false };

    const game = {
      player: null,
      entities: [],
      bubbles: [],
      particles: [],
      time: 0,
      score: 0,
      lives: START_LIVES,
      invincible: 0,
      message: '',
      messageTimer: 0,
      flash: 0,
      lastHud: '',
    };

    function resize() {
      dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
    }
    resize();
    window.addEventListener('resize', resize);

    function startGame() {
      const sp = SPECIES[0];
      game.player = {
        kind: 'fish',
        isPlayer: true,
        tier: sp.tier,
        name: sp.name,
        shape: sp.shape,
        seed: 0,
        mouthTimer: 0,
        size: sp.size,
        color: sp.color,
        accent: sp.accent,
        pattern: sp.pattern,
        x: W / 2,
        y: H / 2,
        vx: 0,
        vy: 0,
        phase: 0,
        wob: 1,
        growth: 0,
        baseSize: sp.size,
        targetSize: sp.size,
      };
      game.entities = [];
      game.particles = [];
      game.score = 0;
      game.lives = START_LIVES;
      game.invincible = 1;
      game.time = 0;
      for (let i = 0; i < 12; i++) game.entities.push(makeCritter(W, H));
      for (let i = 0; i < 6; i++) game.entities.push(makeFish(1, W, H, 1));
      setPhase('playing');
      setMessage('Eat plankton & shrimp to grow!');
    }

    function setMessage(text) {
      game.message = text;
      game.messageTimer = 2.6;
    }
    startRef.current = startGame;

    function evolve(player) {
      const next = SPECIES[player.tier]; // tier is 1-based index into SPECIES
      player.tier = next.tier;
      player.name = next.name;
      player.shape = next.shape;
      player.color = next.color;
      player.accent = next.accent;
      player.pattern = next.pattern;
      player.baseSize = next.size;
      player.targetSize = next.size;
      game.flash = 1;
      setMessage(
        player.tier === 7
          ? 'You are the Whale Shark — apex of the ocean!'
          : `Evolved into ${next.name}!`
      );
      for (let i = 0; i < 24; i++) {
        game.particles.push({
          x: player.x,
          y: player.y,
          vx: rand(-160, 160),
          vy: rand(-160, 160),
          life: 1,
          color: next.accent,
          size: rand(2, 5),
        });
      }
      if (player.tier === 7) {
        setPhase('won');
      }
    }

    function bite(player, ent) {
      const pts = ent.kind === 'critter' ? ent.points : pointsForTier(ent.tier);
      game.score += pts;
      player.growth += pts;
      player.targetSize =
        player.baseSize * (1 + 0.25 * Math.min(1, progressOf(player)));
      game.particles.push(
        ...Array.from({ length: 10 }, () => ({
          x: ent.x,
          y: ent.y,
          vx: rand(-120, 120),
          vy: rand(-120, 120),
          life: 1,
          color: ent.color,
          size: rand(2, 4),
        }))
      );
      if (player.tier < 7 && player.growth >= SPECIES[player.tier - 1].evolveAt) {
        evolve(player);
      }
    }

    function progressOf(player) {
      if (player.tier >= 7) return 1;
      return player.growth / SPECIES[player.tier - 1].evolveAt;
    }

    function hurt(player) {
      if (game.invincible > 0) return;
      game.lives -= 1;
      game.invincible = INVINCIBLE_TIME;
      game.flash = 0.6;
      // knock the player away from danger and shrink back a little
      player.growth = Math.max(0, player.growth * 0.6);
      player.targetSize = player.baseSize;
      if (game.lives <= 0) {
        setPhase('gameover');
        return;
      }
      setMessage(`Ouch! ${game.lives} ${game.lives === 1 ? 'life' : 'lives'} left`);
    }

    function spawnTick() {
      const t = game.player ? game.player.tier : 1;
      const counts = { critter: 0, edible: 0, same: 0, danger: 0 };
      for (const e of game.entities) {
        if (e.kind === 'critter') counts.critter++;
        else if (e.tier < t) counts.edible++;
        else if (e.tier === t) counts.same++;
        else counts.danger++;
      }
      if (counts.critter < 10) game.entities.push(makeCritter(W, H));
      if (counts.edible < 8 + t) {
        // prefer prey one tier below, sometimes further down the chain
        const tier = Math.max(1, t - (1 + Math.floor(Math.random() * 2)));
        if (tier < t) game.entities.push(makeFish(tier, W, H, t));
      }
      if (counts.same < 2) game.entities.push(makeFish(t, W, H, t));
      const dangerCap = Math.min(3 + t, 6);
      if (counts.danger < dangerCap && t < 7) {
        game.entities.push(makeFish(t + 1, W, H, t));
      }
    }

    function update(dt) {
      game.time += dt;
      const p = game.player;
      if (!p) return;

      // --- player movement ---
      const sp = SPECIES[p.tier - 1];
      let ax = 0;
      let ay = 0;
      if (keys.left) ax -= 1;
      if (keys.right) ax += 1;
      if (keys.up) ay -= 1;
      if (keys.down) ay += 1;
      if (ax || ay) {
        const len = Math.hypot(ax, ay);
        p.vx += (ax / len) * sp.speed * 4 * dt;
        p.vy += (ay / len) * sp.speed * 4 * dt;
      } else if (pointer.active) {
        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d > 10) {
          p.vx += (dx / d) * sp.speed * 4 * dt;
          p.vy += (dy / d) * sp.speed * 4 * dt;
        }
      }
      const vmax = sp.speed;
      const v = Math.hypot(p.vx, p.vy);
      if (v > vmax) {
        p.vx = (p.vx / v) * vmax;
        p.vy = (p.vy / v) * vmax;
      }
      // drag
      p.vx *= 1 - 1.6 * dt;
      p.vy *= 1 - 1.6 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.x = Math.max(p.size * 0.5, Math.min(W - p.size * 0.5, p.x));
      p.y = Math.max(30, Math.min(H - 30, p.y));
      // smooth size transitions (grow / evolve)
      p.size += (p.targetSize - p.size) * Math.min(1, 4 * dt);

      if (game.invincible > 0) game.invincible -= dt;
      if (p.mouthTimer > 0) p.mouthTimer -= dt;
      if (game.flash > 0) game.flash -= dt * 1.5;
      if (game.messageTimer > 0) game.messageTimer -= dt;

      // --- entities ---
      for (let i = game.entities.length - 1; i >= 0; i--) {
        const e = game.entities[i];
        e.phase += dt * e.wob;

        if (e.kind === 'critter') {
          e.x += e.vx * dt + Math.sin(e.phase) * 12 * dt;
          e.y += e.vy * dt;
          if (e.x < -30 || e.x > W + 30 || e.y < 20 || e.y > H - 20) {
            if (Math.random() < 0.6) {
              game.entities.splice(i, 1);
              continue;
            }
            e.vx *= -1;
            e.vy *= -1;
          }
        } else {
          // predator steering: bigger fish hunt the player when close
          if (e.tier > p.tier) {
            const dx = p.x - e.x;
            const dy = p.y - e.y;
            const d = Math.hypot(dx, dy);
            if (d < 320) {
              const spd = Math.hypot(e.vx, e.vy) || 60;
              e.vx += ((dx / d) * spd - e.vx) * 1.2 * dt;
              e.vy += ((dy / d) * spd - e.vy) * 1.2 * dt;
            }
          }
          e.x += e.vx * dt;
          e.y += e.vy * dt + Math.sin(e.phase) * 18 * dt;
          // recycle fish that swam far off-screen
          if (e.x < -e.size * 3 - 60 || e.x > W + e.size * 3 + 60) {
            game.entities.splice(i, 1);
            continue;
          }
          e.y = Math.max(30, Math.min(H - 30, e.y));
        }

        // --- collision ---
        if (e.mouthTimer > 0) e.mouthTimer -= dt;
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const dist = Math.hypot(dx, dy);
        // mouths open when closing in on prey (player) or the player (predators)
        if (e.tier < p.tier && dist < p.size * 1.8) p.mouthTimer = 0.3;
        if (e.tier > p.tier && dist < 200) e.mouthTimer = 0.4;
        const hit = dist < p.size * 0.8 + e.size * 0.8;
        if (hit) {
          if (e.tier < p.tier) {
            bite(p, e);
            game.entities.splice(i, 1);
          } else if (e.tier > p.tier) {
            // same-size fish are neutral; only bigger ones are dangerous
            hurt(p);
            if (phaseRef.current !== 'playing') return;
            // push the predator away so it doesn't instantly re-bite
            const d = Math.hypot(dx, dy) || 1;
            e.vx = (-dx / d) * 120;
            e.vy = (-dy / d) * 120;
          }
        }
      }

      spawnTick();

      // ambient bubbles
      if (Math.random() < dt * 3) {
        game.bubbles.push({
          x: rand(0, W),
          y: H + 10,
          r: rand(2, 6),
          vy: rand(-30, -60),
          drift: rand(-10, 10),
        });
      }
      for (let i = game.bubbles.length - 1; i >= 0; i--) {
        const b = game.bubbles[i];
        b.y += b.vy * dt;
        b.x += b.drift * dt;
        if (b.y < -10) game.bubbles.splice(i, 1);
      }

      for (let i = game.particles.length - 1; i >= 0; i--) {
        const pt = game.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vx *= 1 - 2 * dt;
        pt.vy *= 1 - 2 * dt;
        pt.life -= dt * 1.6;
        if (pt.life <= 0) game.particles.splice(i, 1);
      }

      // sync HUD only when something changed
      const prog = progressOf(p);
      const hudKey = `${game.score}|${p.tier}|${Math.round(prog * 100)}|${game.lives}|${game.message}|${game.messageTimer > 0}`;
      if (hudKey !== game.lastHud) {
        game.lastHud = hudKey;
        setHud({
          score: game.score,
          tier: p.tier,
          progress: prog,
          lives: game.lives,
          message: game.messageTimer > 0 ? game.message : '',
        });
      }
    }

    function render() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // ocean gradient
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0b4d7a');
      g.addColorStop(0.5, '#06345c');
      g.addColorStop(1, '#02182e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // light rays
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#bfe9ff';
      for (let i = 0; i < 5; i++) {
        const x = ((W / 5) * i + W * 0.1) + Math.sin(game.time * 0.3 + i) * 40;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 90, 0);
        ctx.lineTo(x + 240, H);
        ctx.lineTo(x + 60, H);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // sand
      ctx.fillStyle = '#123a54';
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 40) {
        ctx.lineTo(x, H - 14 - Math.sin(x * 0.02) * 8);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // bubbles
      ctx.strokeStyle = 'rgba(200, 235, 255, 0.35)';
      ctx.lineWidth = 1.5;
      for (const b of game.bubbles) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // entities
      for (const e of game.entities) {
        if (e.kind === 'critter') drawCritter(ctx, e, game.time);
        else drawFish(ctx, e, game.time);
      }

      // steer target marker (essential on touch, handy with a mouse too)
      if (phaseRef.current === 'playing' && pointer.active) {
        const rr = 10 + Math.sin(game.time * 6) * 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, rr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // player
      const p = game.player;
      if (p && phaseRef.current === 'playing') {
        const blink = game.invincible > 0 && Math.floor(game.time * 8) % 2 === 0;
        if (!blink) {
          drawFish(ctx, p, game.time);
          if (p.size > 60) {
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.font = '12px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(p.name, p.x, p.y - p.size * 0.8);
          }
        }
        if (game.invincible > 0) {
          ctx.strokeStyle = `rgba(255,255,255,${0.4 * Math.min(1, game.invincible)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // particles
      for (const pt of game.particles) {
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // eat / hurt flash
      if (game.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, game.flash) * 0.25})`;
        ctx.fillRect(0, 0, W, H);
      }
    }

    let last = performance.now();
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (phaseRef.current === 'playing') update(dt);
      else game.time += dt; // keep background alive on menus
      render();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    // --- input ---
    function onKey(e, down) {
      const map = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
        a: 'left',
        d: 'right',
        w: 'up',
        s: 'down',
      };
      const k = map[e.key] ?? map[e.key.toLowerCase()];
      if (k) {
        keys[k] = down;
        pointer.active = false;
        e.preventDefault();
      }
      if (down && e.key === 'Enter' && phaseRef.current !== 'playing') {
        startGame();
      }
    }
    const kd = (e) => onKey(e, true);
    const ku = (e) => onKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    function onMove(e) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    }
    function onDown(e) {
      // taps and touch-drags steer the fish too
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
    };
  }, []);

  const sp = speciesFor(hud.tier);
  const nextName = hud.tier < 7 ? SPECIES[hud.tier].name : null;

  return (
    <div className="game-root" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <canvas
        ref={canvasRef}
        onClick={() => {
          if (phase !== 'playing') startRef.current();
        }}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          display: 'block',
          cursor: 'none',
          touchAction: 'none',
        }}
      />

      {/* HUD */}
      {phase === 'playing' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '12px 20px',
            color: '#eaf6ff',
            pointerEvents: 'none',
            textShadow: '0 1px 3px rgba(0,20,40,0.8)',
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {sp.name}
          </div>
          <div style={{ flex: 1, maxWidth: 420 }}>
            <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 3 }}>
              {nextName ? `Grow to evolve into ${nextName}` : 'Apex predator — you win!'}
            </div>
            <div
              style={{
                height: 10,
                borderRadius: 6,
                background: 'rgba(255,255,255,0.18)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.round(hud.progress * 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #9fe870, #ffd166)',
                  transition: 'width 0.2s',
                }}
              />
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{hud.score} pts</div>
          <div style={{ fontSize: 16 }}>{'🐟'.repeat(hud.lives)}</div>
          {fbUser && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.14)',
                borderRadius: 999,
                padding: '4px 8px 4px 4px',
                marginLeft: 'auto',
              }}
            >
              <img
                src={fbUser.pictureUrl}
                alt=""
                width={32}
                height={32}
                style={{ borderRadius: '50%', display: 'block' }}
              />
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {fbUser.name.split(' ')[0]}
              </span>
              <button
                onClick={handleFbLogout}
                title="Log out of Facebook"
                style={{
                  width: 22,
                  height: 22,
                  lineHeight: '20px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#eaf6ff',
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* transient message */}
      {phase === 'playing' && hud.message && (
        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: 0,
            right: 0,
            textAlign: 'center',
            color: '#ffe9a8',
            fontSize: 28,
            fontWeight: 700,
            textShadow: '0 2px 8px rgba(0,20,40,0.9)',
            pointerEvents: 'none',
          }}
        >
          {hud.message}
        </div>
      )}

      {/* overlays */}
      {phase !== 'playing' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(2, 18, 34, 0.55)',
            color: '#eaf6ff',
            textAlign: 'center',
            padding: 24,
          }}
        >
          <h1 style={{ fontSize: 48, margin: '0 0 8px', letterSpacing: 2 }}>
            🐠 Big Fish
          </h1>
          {phase === 'menu' && (
            <p style={{ maxWidth: 460, lineHeight: 1.6, opacity: 0.9 }}>
              Start as a tiny guppy. Eat plankton, shrimp and smaller fish to grow
              and evolve — guppy → clownfish → angelfish → snapper → tuna → shark →
              whale shark. Never touch anything bigger than you!
            </p>
          )}
          {phase === 'menu' && challenge && (
            <div
              style={{
                margin: '8px 0 4px',
                padding: '12px 20px',
                borderRadius: 12,
                background: 'rgba(255, 205, 92, 0.15)',
                border: '1px solid rgba(255, 205, 92, 0.5)',
                fontSize: 17,
                color: '#ffe9a8',
              }}
            >
              🔥 {challenge.name || 'Someone'} scored{' '}
              {challenge.score.toLocaleString()} points
              {challenge.species ? ` as a ${challenge.species}` : ''} — can you
              beat them?
            </div>
          )}
          {phase === 'gameover' && (
            <p style={{ fontSize: 22, margin: '4px 0' }}>
              You got eaten! Final score:{' '}
              <strong>{hudRef.current.score}</strong>
            </p>
          )}
          {phase === 'won' && (
            <p style={{ fontSize: 22, margin: '4px 0' }}>
              👑 You became the Whale Shark — king of the ocean! Score:{' '}
              <strong>{hudRef.current.score}</strong>
            </p>
          )}
          <p style={{ opacity: 0.75, fontSize: 14 }}>
            Move with the mouse (or WASD / arrows)
          </p>
          <button
            onClick={() => startRef.current()}
            style={{
              marginTop: 12,
              padding: '12px 36px',
              fontSize: 18,
              fontWeight: 700,
              color: '#06345c',
              background: 'linear-gradient(180deg, #9fe870, #6fce4e)',
              border: 'none',
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            {phase === 'menu' ? 'Dive in' : 'Play again'}
          </button>

          {/* Facebook: login to unlock sharing; hidden entirely if unavailable */}
          {(phase === 'gameover' || phase === 'won') &&
            fbStatus !== 'idle' &&
            fbStatus !== 'unavailable' && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                {fbStatus === 'loading' && (
                  <span style={{ opacity: 0.7, fontSize: 14 }}>Connecting to Facebook…</span>
                )}
                {fbStatus === 'logged-out' && (
                  <>
                    <span style={{ fontSize: 14, opacity: 0.8 }}>
                      Log in to share your score on Facebook
                    </span>
                    <button
                      onClick={handleFbLogin}
                      style={{
                        padding: '10px 24px',
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#fff',
                        background: '#1877f2',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <FacebookIcon />
                      Login with Facebook
                    </button>
                  </>
                )}
                {fbStatus === 'logged-in' && (
                  <button
                    onClick={handleFbShare}
                    style={{
                      padding: '10px 24px',
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#fff',
                      background: '#1877f2',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <FacebookIcon />
                    Share score on Facebook
                  </button>
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
