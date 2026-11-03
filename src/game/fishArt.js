// Procedural fish artwork. Each species gets its own body plan modeled on the
// real fish, plus animation: tail undulation scales with swim speed, the fish
// pitches when diving/climbing, pectoral fins flap, and mouths open when
// closing in on prey (ent.mouthTimer > 0).

const TAU = Math.PI * 2;

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function swimInfo(ent, time) {
  const speed = Math.hypot(ent.vx || 0, ent.vy || 0);
  const phase = time * (3 + speed * 0.05) + (ent.seed || 0) * 2.4;
  const amp = 0.55 + clamp(speed / 150, 0, 1.1) * 0.6;
  return { phase, amp, speed };
}

// Orient the canvas: face travel direction, pitch nose toward vertical motion.
function setup(ctx, ent) {
  const facing = (ent.vx || 0) >= 0 ? 1 : -1;
  const pitch = clamp(
    Math.atan2(ent.vy || 0, Math.abs(ent.vx || 0) + 50) * 0.6,
    -0.4,
    0.4
  );
  ctx.translate(ent.x, ent.y);
  ctx.scale(facing, 1);
  ctx.rotate(pitch);
}

function eye(ctx, x, y, r) {
  ctx.fillStyle = '#101820';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + r * 0.3, y - r * 0.3, r * 0.35, 0, TAU);
  ctx.fill();
}

function pectoral(ctx, x, y, size, angle, flap, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + flap);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.5, size * 0.35, size, size * 0.2);
  ctx.quadraticCurveTo(size * 0.45, -size * 0.05, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function verticalGradient(ctx, s, from, to, y0 = -0.5, y1 = 0.5) {
  const g = ctx.createLinearGradient(0, s * y0, 0, s * y1);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  return g;
}

// ---------------------------------------------------------------- Guppy
// Slim silver body with the signature huge flowing caudal fan.
function drawGuppy(ctx, ent, time, ph, amp) {
  const s = ent.size;
  const w = Math.sin(ph) * 0.4 * amp * s;

  // big caudal fan
  const g = ctx.createLinearGradient(-s * 1.4, 0, -s * 0.2, 0);
  g.addColorStop(0, 'rgba(255,110,60,0.95)');
  g.addColorStop(0.6, 'rgba(230,80,150,0.9)');
  g.addColorStop(1, 'rgba(140,70,200,0.85)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-s * 0.22, -s * 0.12);
  ctx.quadraticCurveTo(-s * 0.9, -s * 0.5 + w, -s * 1.35, -s * 0.6 + w * 1.3);
  ctx.quadraticCurveTo(-s * 0.75, w * 0.4, -s * 1.3, s * 0.62 + w * 1.2);
  ctx.quadraticCurveTo(-s * 0.85, s * 0.45 + w, -s * 0.22, s * 0.14);
  ctx.closePath();
  ctx.fill();

  // dorsal fin
  ctx.fillStyle = 'rgba(255,140,66,0.9)';
  ctx.beginPath();
  ctx.moveTo(-s * 0.2, -s * 0.16);
  ctx.quadraticCurveTo(-s * 0.05, -s * 0.42, s * 0.15, -s * 0.14);
  ctx.closePath();
  ctx.fill();

  // slim iridescent body
  ctx.fillStyle = verticalGradient(ctx, s, '#9db6c4', '#e9f3f6', -0.2, 0.2);
  ctx.beginPath();
  ctx.ellipse(s * 0.05, 0, s * 0.48, s * 0.2, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(70,110,130,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  pectoral(
    ctx,
    s * 0.18,
    s * 0.05,
    s * 0.28,
    0.5,
    Math.sin(time * 9 + (ent.seed || 0)) * 0.45,
    'rgba(255,140,66,0.85)'
  );

  eye(ctx, s * 0.34, -s * 0.05, s * 0.09);
}

// ---------------------------------------------------------- Clownfish
// Rounded orange body, three white bands, and the famous constantly
// "fanning" pectoral fins.
function drawClownfish(ctx, ent, time, ph, amp) {
  const s = ent.size;
  const w = Math.sin(ph) * 0.3 * amp * s;
  const flap = Math.sin(time * 10 + (ent.seed || 0)) * 0.5;

  // rounded fan tail (behind body)
  ctx.fillStyle = '#e8681f';
  ctx.beginPath();
  ctx.moveTo(-s * 0.35, -s * 0.16);
  ctx.quadraticCurveTo(-s * 0.75, -s * 0.4 + w, -s * 0.85, w);
  ctx.quadraticCurveTo(-s * 0.75, s * 0.4 + w, -s * 0.35, s * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(25,25,25,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // dorsal & anal rounded fins
  ctx.fillStyle = '#e8681f';
  ctx.beginPath();
  ctx.moveTo(s * 0.25, -s * 0.26);
  ctx.quadraticCurveTo(-s * 0.1, -s * 0.55, -s * 0.4, -s * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(s * 0.1, s * 0.26);
  ctx.quadraticCurveTo(-s * 0.2, s * 0.52, -s * 0.4, s * 0.22);
  ctx.closePath();
  ctx.fill();

  // body
  ctx.fillStyle = verticalGradient(ctx, s, '#f2762e', '#f9a25c', -0.3, 0.3);
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.5, s * 0.3, 0, 0, TAU);
  ctx.fill();

  // three white bands, clipped to the body, with dark edges
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.5, s * 0.3, 0, 0, TAU);
  ctx.clip();
  for (const [bx, bw] of [
    [s * 0.28, s * 0.09],
    [-s * 0.02, s * 0.13],
    [-s * 0.3, s * 0.08],
  ]) {
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.ellipse(bx, 0, bw, s * 0.4, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,22,25,0.75)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();

  // pectoral fin — clownfish fan theirs almost constantly
  pectoral(ctx, s * 0.05, s * 0.08, s * 0.3, 0.6, flap, 'rgba(240,120,50,0.95)');

  eye(ctx, s * 0.34, -s * 0.08, s * 0.08);
}

// ---------------------------------------------------------- Angelfish
// Tall disc-shaped body with sweeping triangular dorsal/anal fins and
// trailing pelvic filaments.
function drawAngelfish(ctx, ent, time, ph, amp) {
  const s = ent.size;
  const sway = Math.sin(ph) * 0.12 * amp;

  // sweeping dorsal fin
  ctx.fillStyle = 'rgba(80,100,120,0.85)';
  ctx.beginPath();
  ctx.moveTo(s * 0.18, -s * 0.3);
  ctx.quadraticCurveTo(
    s * 0.05,
    -s * (1.0 + sway),
    -s * 0.75,
    -s * (0.7 + sway * 1.5)
  );
  ctx.quadraticCurveTo(-s * 0.3, -s * 0.35, -s * 0.25, -s * 0.28);
  ctx.closePath();
  ctx.fill();

  // anal fin (mirror)
  ctx.fillStyle = 'rgba(255,205,92,0.9)';
  ctx.beginPath();
  ctx.moveTo(s * 0.18, s * 0.3);
  ctx.quadraticCurveTo(
    s * 0.05,
    s * (1.0 + sway),
    -s * 0.75,
    s * (0.7 + sway * 1.5)
  );
  ctx.quadraticCurveTo(-s * 0.3, s * 0.35, -s * 0.25, s * 0.28);
  ctx.closePath();
  ctx.fill();

  // pelvic filament
  ctx.strokeStyle = 'rgba(255,205,92,0.9)';
  ctx.lineWidth = Math.max(1.5, s * 0.04);
  ctx.beginPath();
  ctx.moveTo(s * 0.28, s * 0.22);
  ctx.quadraticCurveTo(-s * 0.3, s * (0.6 + sway), -s * (0.95 + sway), s * (0.5 + sway));
  ctx.stroke();

  // tall disc body
  ctx.fillStyle = verticalGradient(ctx, s, '#cfd8e0', '#f0f5f7', -0.45, 0.3);
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.42, s * 0.42, 0, 0, TAU);
  ctx.fill();

  // dark vertical stripes, clipped to body
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.42, s * 0.42, 0, 0, TAU);
  ctx.clip();
  ctx.strokeStyle = 'rgba(50,65,80,0.8)';
  ctx.lineWidth = s * 0.1;
  for (const [x1, y1, x2, y2] of [
    [s * 0.2, -s * 0.5, s * 0.02, s * 0.5],
    [-s * 0.05, -s * 0.55, -s * 0.25, s * 0.55],
    [-s * 0.3, -s * 0.4, -s * 0.42, s * 0.4],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();

  // snout bump
  ctx.fillStyle = '#cfd8e0';
  ctx.beginPath();
  ctx.arc(s * 0.42, s * 0.05, s * 0.08, 0, TAU);
  ctx.fill();

  pectoral(
    ctx,
    s * 0.1,
    s * 0.1,
    s * 0.26,
    0.7,
    Math.sin(time * 8 + (ent.seed || 0)) * 0.4,
    'rgba(255,205,92,0.9)'
  );

  eye(ctx, s * 0.24, -s * 0.16, s * 0.07);
}

// ------------------------------------------------------------- Snapper
// Deep body, steep forehead, big toothy mouth, spiny dorsal fin, forked tail.
function drawSnapper(ctx, ent, time, ph, amp) {
  const s = ent.size;
  const w = Math.sin(ph) * 0.32 * amp * s;
  const open = clamp(ent.mouthTimer || 0, 0, 1);

  // forked tail
  ctx.fillStyle = ent.color;
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, -s * 0.1);
  ctx.lineTo(-s * 0.95, -s * 0.38 + w);
  ctx.quadraticCurveTo(-s * 0.6, w * 0.5, -s * 0.95, s * 0.38 + w);
  ctx.lineTo(-s * 0.4, s * 0.1);
  ctx.closePath();
  ctx.fill();

  // spiny + soft dorsal fin
  ctx.fillStyle = 'rgba(140,35,55,0.9)';
  ctx.beginPath();
  ctx.moveTo(s * 0.28, -s * 0.26);
  for (let i = 0; i < 4; i++) {
    const x = s * (0.2 - i * 0.14);
    ctx.lineTo(x, -s * 0.42);
    ctx.lineTo(x - s * 0.05, -s * 0.26);
  }
  ctx.quadraticCurveTo(-s * 0.35, -s * 0.42, -s * 0.45, -s * 0.2);
  ctx.closePath();
  ctx.fill();
  // anal fin
  ctx.beginPath();
  ctx.moveTo(-s * 0.05, s * 0.26);
  ctx.quadraticCurveTo(-s * 0.3, s * 0.48, -s * 0.45, s * 0.22);
  ctx.closePath();
  ctx.fill();

  // deep body with steep forehead
  ctx.fillStyle = verticalGradient(ctx, s, '#d95263', '#f2b8ad', -0.3, 0.35);
  ctx.beginPath();
  ctx.moveTo(s * 0.55, s * 0.06);
  ctx.quadraticCurveTo(s * 0.42, -s * 0.34, s * 0.1, -s * 0.32);
  ctx.quadraticCurveTo(-s * 0.35, -s * 0.3, -s * 0.52, -s * 0.1);
  ctx.lineTo(-s * 0.52, s * 0.1);
  ctx.quadraticCurveTo(-s * 0.2, s * 0.34, s * 0.15, s * 0.3);
  ctx.quadraticCurveTo(s * 0.45, s * 0.26, s * 0.55, s * 0.06);
  ctx.closePath();
  ctx.fill();

  // mouth — hinge opens toward prey
  ctx.strokeStyle = 'rgba(90,20,35,0.95)';
  ctx.lineWidth = Math.max(1.5, s * 0.05);
  ctx.beginPath();
  ctx.moveTo(s * 0.52, s * 0.04);
  ctx.quadraticCurveTo(s * 0.4, s * 0.12, s * 0.28, s * 0.1);
  ctx.stroke();
  if (open > 0.05) {
    ctx.fillStyle = 'rgba(90,20,35,0.9)';
    ctx.beginPath();
    ctx.moveTo(s * 0.52, s * 0.04);
    ctx.lineTo(s * 0.3, s * 0.1);
    ctx.lineTo(s * 0.52, s * 0.04 + s * 0.14 * open);
    ctx.closePath();
    ctx.fill();
  }

  pectoral(
    ctx,
    s * 0.12,
    s * 0.1,
    s * 0.28,
    0.7,
    Math.sin(time * 8 + (ent.seed || 0)) * 0.4,
    'rgba(150,50,65,0.9)'
  );

  eye(ctx, s * 0.36, -s * 0.1, s * 0.07);
}

// ---------------------------------------------------------------- Tuna
// Streamlined torpedo, lunate (crescent) tail, dorsal finlets, keel.
function drawTuna(ctx, ent, time, ph, amp) {
  const s = ent.size;
  const w = Math.sin(ph) * 0.3 * amp * s;
  const w2 = Math.sin(ph + 0.6) * 0.24 * amp * s;

  // crescent tail: two swept lobes
  ctx.fillStyle = '#31485f';
  ctx.beginPath();
  ctx.moveTo(-s * 0.42, -s * 0.04);
  ctx.lineTo(-s * 1.0, -s * 0.4 + w);
  ctx.quadraticCurveTo(-s * 0.62, -s * 0.1 + w2, -s * 0.42, s * 0.02);
  ctx.lineTo(-s * 0.42, s * 0.02);
  ctx.lineTo(-s * 1.0, s * 0.4 + w2);
  ctx.quadraticCurveTo(-s * 0.62, s * 0.08 + w, -s * 0.42, s * 0.05);
  ctx.closePath();
  ctx.fill();

  // dorsal sickle fin
  ctx.fillStyle = '#31485f';
  ctx.beginPath();
  ctx.moveTo(s * 0.22, -s * 0.17);
  ctx.quadraticCurveTo(s * 0.02, -s * 0.44, -s * 0.12, -s * 0.16);
  ctx.closePath();
  ctx.fill();

  // torpedo body
  ctx.fillStyle = verticalGradient(ctx, s, '#2e4a66', '#eef3f7', -0.2, 0.22);
  ctx.beginPath();
  ctx.moveTo(s * 0.6, 0);
  ctx.quadraticCurveTo(s * 0.25, -s * 0.24, -s * 0.15, -s * 0.2);
  ctx.quadraticCurveTo(-s * 0.4, -s * 0.16, -s * 0.52, -s * 0.06);
  ctx.lineTo(-s * 0.52, s * 0.06);
  ctx.quadraticCurveTo(-s * 0.4, s * 0.16, -s * 0.15, s * 0.2);
  ctx.quadraticCurveTo(s * 0.25, s * 0.24, s * 0.6, 0);
  ctx.closePath();
  ctx.fill();

  // finlets (the little saillets tuna have behind dorsal & anal fins)
  ctx.fillStyle = '#f2c94c';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x = -s * (0.28 + i * 0.06);
      const y = side * s * (0.15 - i * 0.02);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - s * 0.04, y + side * s * 0.07);
      ctx.lineTo(x - s * 0.08, y);
      ctx.closePath();
      ctx.fill();
    }
  }

  pectoral(
    ctx,
    s * 0.2,
    s * 0.08,
    s * 0.32,
    0.85,
    Math.sin(time * 7 + (ent.seed || 0)) * 0.2,
    'rgba(40,60,85,0.9)'
  );

  eye(ctx, s * 0.42, -s * 0.05, s * 0.06);
}

// ---------------------------------------------------------------- Shark
// Torpedo body, heterocercal tail (long top lobe), big dorsal, gill slits,
// toothy mouth that opens when hunting.
function drawShark(ctx, ent, time, ph, amp) {
  const s = ent.size;
  const w = Math.sin(ph) * 0.28 * amp * s;
  const open = clamp(ent.mouthTimer || 0, 0, 1);

  // heterocercal tail
  ctx.fillStyle = ent.color;
  ctx.beginPath();
  ctx.moveTo(-s * 0.45, -s * 0.03);
  ctx.quadraticCurveTo(-s * 0.85, -s * 0.3 + w, -s * 1.12, -s * 0.48 + w * 1.2);
  ctx.quadraticCurveTo(-s * 0.72, -s * 0.06 + w * 0.6, -s * 0.92, s * 0.3 + w * 0.8);
  ctx.quadraticCurveTo(-s * 0.65, s * 0.1 + w * 0.4, -s * 0.45, s * 0.05);
  ctx.closePath();
  ctx.fill();

  // dorsal fin
  ctx.fillStyle = ent.color;
  ctx.beginPath();
  ctx.moveTo(s * 0.12, -s * 0.2);
  ctx.quadraticCurveTo(-s * 0.02, -s * 0.52, -s * 0.22, -s * 0.2);
  ctx.closePath();
  ctx.fill();

  // far pectoral (behind body)
  pectoral(ctx, s * 0.22, s * 0.14, s * 0.4, 1.1, w * 0.004, 'rgba(85,100,112,0.9)');

  // body
  ctx.fillStyle = verticalGradient(ctx, s, ent.color, '#f2f6f8', -0.22, 0.24);
  ctx.beginPath();
  ctx.moveTo(s * 0.66, s * 0.03);
  ctx.quadraticCurveTo(s * 0.45, -s * 0.24, 0, -s * 0.22);
  ctx.quadraticCurveTo(-s * 0.42, -s * 0.2, -s * 0.58, -s * 0.05);
  ctx.lineTo(-s * 0.58, s * 0.05);
  ctx.quadraticCurveTo(-s * 0.3, s * 0.2, s * 0.1, s * 0.2);
  ctx.quadraticCurveTo(s * 0.48, s * 0.18, s * 0.66, s * 0.03);
  ctx.closePath();
  ctx.fill();

  // gill slits
  ctx.strokeStyle = 'rgba(40,52,62,0.7)';
  ctx.lineWidth = Math.max(1.5, s * 0.03);
  for (let i = 0; i < 3; i++) {
    const x = s * (0.32 - i * 0.07);
    ctx.beginPath();
    ctx.moveTo(x, -s * 0.1);
    ctx.quadraticCurveTo(x - s * 0.02, 0, x, s * 0.08);
    ctx.stroke();
  }

  // mouth with teeth — drops open when hunting
  const mx = s * 0.55;
  const my = s * 0.1;
  ctx.fillStyle = 'rgba(70,15,25,0.95)';
  ctx.beginPath();
  ctx.moveTo(mx, my - s * 0.05);
  ctx.quadraticCurveTo(mx - s * 0.15, my + s * 0.02, mx - s * 0.25, my - s * 0.02);
  ctx.quadraticCurveTo(mx - s * 0.15, my + s * 0.1 + s * 0.14 * open, mx, my + s * 0.06 + s * 0.16 * open);
  ctx.closePath();
  ctx.fill();
  // teeth
  ctx.fillStyle = '#ffffff';
  const toothN = 5;
  for (let i = 0; i < toothN; i++) {
    const t0 = i / toothN;
    const tx = mx - s * 0.22 + t0 * s * 0.22;
    const ty = my + s * 0.02 + t0 * (s * 0.06 + s * 0.12 * open);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + s * 0.03, ty);
    ctx.lineTo(tx + s * 0.015, ty + s * 0.045);
    ctx.closePath();
    ctx.fill();
  }

  pectoral(ctx, s * 0.18, s * 0.1, s * 0.42, 0.9, w * 0.004, ent.color);

  eye(ctx, s * 0.44, -s * 0.08, s * 0.045);
}

// ---------------------------------------------------------- Whale shark
// Huge, broad and blunt-headed with a checkerboard spot pattern, ventral
// mouth, and ridges along the back.
function drawWhaleShark(ctx, ent, time, ph, amp) {
  const s = ent.size;
  const w = Math.sin(ph) * 0.22 * amp * s;
  const open = 0.35 + clamp(ent.mouthTimer || 0, 0, 1) * 0.4;

  // big asymmetric tail
  ctx.fillStyle = '#3e5a74';
  ctx.beginPath();
  ctx.moveTo(-s * 0.45, -s * 0.04);
  ctx.quadraticCurveTo(-s * 0.85, -s * 0.3 + w, -s * 1.05, -s * 0.5 + w * 1.2);
  ctx.quadraticCurveTo(-s * 0.7, -s * 0.05 + w * 0.6, -s * 0.88, s * 0.32 + w * 0.8);
  ctx.quadraticCurveTo(-s * 0.62, s * 0.1 + w * 0.4, -s * 0.45, s * 0.06);
  ctx.closePath();
  ctx.fill();

  // dorsal (set far back, small) + pelvic
  ctx.fillStyle = '#3e5a74';
  ctx.beginPath();
  ctx.moveTo(-s * 0.12, -s * 0.24);
  ctx.quadraticCurveTo(-s * 0.2, -s * 0.44, -s * 0.34, -s * 0.22);
  ctx.closePath();
  ctx.fill();

  // huge pectorals
  pectoral(ctx, s * 0.25, s * 0.16, s * 0.5, 1.15, w * 0.003, 'rgba(62,90,116,0.95)');
  pectoral(ctx, s * 0.28, s * 0.1, s * 0.45, 1.0, -w * 0.003, '#3e5a74');

  // broad body with blunt head
  ctx.fillStyle = verticalGradient(ctx, s, ent.color, '#e6eef2', -0.24, 0.2);
  ctx.beginPath();
  ctx.moveTo(s * 0.64, s * 0.06);
  ctx.quadraticCurveTo(s * 0.62, -s * 0.2, s * 0.3, -s * 0.26);
  ctx.quadraticCurveTo(-s * 0.15, -s * 0.28, -s * 0.5, -s * 0.16);
  ctx.quadraticCurveTo(-s * 0.58, -s * 0.06, -s * 0.52, s * 0.06);
  ctx.quadraticCurveTo(-s * 0.2, s * 0.26, s * 0.15, s * 0.26);
  ctx.quadraticCurveTo(s * 0.5, s * 0.24, s * 0.64, s * 0.06);
  ctx.closePath();
  ctx.fill();

  // checkerboard spots + ridges, clipped to body
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(s * 0.64, s * 0.06);
  ctx.quadraticCurveTo(s * 0.62, -s * 0.2, s * 0.3, -s * 0.26);
  ctx.quadraticCurveTo(-s * 0.15, -s * 0.28, -s * 0.5, -s * 0.16);
  ctx.quadraticCurveTo(-s * 0.58, -s * 0.06, -s * 0.52, s * 0.06);
  ctx.quadraticCurveTo(-s * 0.2, s * 0.26, s * 0.15, s * 0.26);
  ctx.quadraticCurveTo(s * 0.5, s * 0.24, s * 0.64, s * 0.06);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = 'rgba(240,246,250,0.85)';
  const cols = 10;
  const rows = 4;
  const seed = ent.seed || 0;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const gx = -s * 0.5 + (i / (cols - 1)) * s * 1.1;
      const gy = -s * 0.22 + (j / (rows - 1)) * s * 0.3;
      const jitter = Math.sin(seed * 7 + i * 3.1 + j * 5.7) * s * 0.02;
      if ((i + j) % 2 === 0) {
        ctx.beginPath();
        ctx.arc(gx + jitter, gy + jitter, s * 0.05, 0, TAU);
        ctx.fill();
      }
    }
  }
  // longitudinal ridges
  ctx.strokeStyle = 'rgba(35,52,68,0.5)';
  ctx.lineWidth = s * 0.015;
  for (const ry of [-0.1, -0.02]) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, s * ry);
    ctx.quadraticCurveTo(0, s * (ry - 0.05), s * 0.55, s * ry);
    ctx.stroke();
  }
  ctx.restore();

  // huge ventral mouth (filter feeder)
  ctx.fillStyle = 'rgba(60,20,25,0.95)';
  ctx.beginPath();
  ctx.ellipse(
    s * 0.48,
    s * 0.14,
    s * 0.16,
    s * 0.07 * open,
    0.15,
    0,
    TAU
  );
  ctx.fill();

  eye(ctx, s * 0.5, s * 0.02, s * 0.03);
}

const SHAPES = {
  guppy: drawGuppy,
  clownfish: drawClownfish,
  angelfish: drawAngelfish,
  snapper: drawSnapper,
  tuna: drawTuna,
  shark: drawShark,
  whaleshark: drawWhaleShark,
};

export function drawFish(ctx, ent, time) {
  const { phase, amp } = swimInfo(ent, time);
  ctx.save();
  setup(ctx, ent);
  (SHAPES[ent.shape] || drawGuppy)(ctx, ent, time, phase, amp);
  ctx.restore();
}

// ------------------------------------------------------------- Critters
export function drawCritter(ctx, ent, time) {
  const pulse = 1 + Math.sin(time * 4 + ent.phase) * 0.15;
  ctx.save();
  ctx.translate(ent.x, ent.y);
  if (ent.name === 'Plankton') {
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = ent.color;
    ctx.beginPath();
    ctx.arc(0, 0, ent.size * pulse * 2, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(0, 0, ent.size * pulse, 0, TAU);
    ctx.fill();
    // wiggling flagella
    ctx.strokeStyle = ent.color;
    ctx.lineWidth = 1;
    const wig = Math.sin(time * 6 + ent.phase) * 0.6;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(
        side * ent.size * 1.4,
        wig * ent.size,
        side * ent.size * 2.2,
        ent.size * 0.8 + wig * ent.size
      );
      ctx.stroke();
    }
  } else {
    // shrimp: curved body, wiggling antennae, twitching legs
    const wig = Math.sin(time * 5 + ent.phase);
    ctx.rotate(wig * 0.25);
    ctx.fillStyle = ent.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, ent.size, ent.size * 0.55, -0.35, 0, TAU);
    ctx.fill();
    // tail fan
    ctx.beginPath();
    ctx.moveTo(-ent.size * 0.8, 0);
    ctx.lineTo(-ent.size * 1.5, -ent.size * 0.35 + wig * 2);
    ctx.lineTo(-ent.size * 1.5, ent.size * 0.35 + wig * 2);
    ctx.closePath();
    ctx.fill();
    // antennae
    ctx.strokeStyle = ent.color;
    ctx.lineWidth = 1.5;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(ent.size * 0.7, side * ent.size * 0.15);
      ctx.quadraticCurveTo(
        ent.size * 1.4,
        side * ent.size * 0.5 + wig * 3,
        ent.size * 2,
        side * ent.size * 0.3 + wig * 4
      );
      ctx.stroke();
    }
    // legs
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const lx = ent.size * (0.2 - i * 0.4);
      ctx.beginPath();
      ctx.moveTo(lx, ent.size * 0.3);
      ctx.lineTo(lx + wig * 2, ent.size * 0.7);
      ctx.stroke();
    }
  }
  ctx.restore();
}
