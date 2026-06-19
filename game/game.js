'use strict';

/* =====================================================================
   SUPER BOX BROS — a Mario-style platformer in vanilla JavaScript.
   No libraries. Everything (physics, collision, enemies, sound, UI)
   is built from scratch and heavily commented so it's easy to learn.
   ===================================================================== */

// ---------- Configuration ----------
const TILE      = 40;             // size of one grid square in pixels
const ROWS      = 15;             // every level is 15 tiles tall
const VIEW_W    = 960;            // visible width  (24 tiles)
const VIEW_H    = ROWS * TILE;    // visible height (600)
const GRAVITY   = 0.8;            // downward pull per frame
const MOVE_ACCEL= 0.9;            // how fast we speed up when running
const MAX_RUN   = 5.0;            // top horizontal speed
const FRICTION  = 0.80;           // ground slow-down when no key pressed
const JUMP_VEL  = -14.5;          // initial upward jump velocity
const MAX_FALL  = 16;             // terminal falling speed
const START_LIVES = 3;
const IFRAMES   = 90;             // invincibility frames after a hit
const LEVEL_SECS  = 250;          // countdown timer per level
const STEP      = 1 / 60;         // fixed physics timestep

// ---------- Visual themes (one per level) ----------
const THEMES = [
  { name:'Grasslands', sky:['#79c2ff','#cde6ff'], hill:'#4caa4c', ground:'#7a4b25', grass:'#4caa4c', sun:'#fff3b0', night:false },
  { name:'Desert Dusk', sky:['#ff9e57','#ffd9a0'], hill:'#c98a3c', ground:'#9c6b2e', grass:'#d9a441', sun:'#fff0c2', night:false },
  { name:'Crystal Cave', sky:['#241b3a','#3a2b5e'], hill:'#2a2046', ground:'#403055', grass:'#7d5cff', sun:'#9d8cff', night:true },
  { name:'Frozen Night', sky:['#0e2a4a','#235a8c'], hill:'#cfe9ff', ground:'#5a738c', grass:'#eaf6ff', sun:'#dff0ff', night:true },
  { name:'Sky Castle', sky:['#ffb3de','#9ad0ff'], hill:'#caa6ff', ground:'#8a6fc4', grass:'#e0c2ff', sun:'#fff6d0', night:false },
];

/* ---------- Level maps ----------
   Legend:  X = solid ground   = platform   ? = bonus block
            o = coin   E = enemy   ^ = spikes(hazard)
            P = player start     G = goal flag
   Bottom rows are the floor. Gaps in the floor are pits (fall = death).
   Every level keeps jumps within reach (≤3 tiles up, ≤4 tiles across).   */
const LEVELS = [
  // ---- Level 1: Grasslands (gentle tutorial, solid floor) ----
  [
    "                                                ",
    "                                                ",
    "                                                ",
    "                                                ",
    "                                                ",
    "              o o o                             ",
    "             =======                            ",
    "                                       o o o    ",
    "                          ?           =======   ",
    "       o o                                      ",
    "      =====              ===                    ",
    "                                                ",
    "  P            E              E           G     ",
    "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  ],
  // ---- Level 2: Desert Dusk (first pit + spikes) ----
  [
    "                                                        ",
    "                                                        ",
    "                                                        ",
    "                   o o o                                ",
    "                  =======                               ",
    "                                                        ",
    "            o o                          o o            ",
    "           =====                        =====           ",
    "                          ?  ?                          ",
    "                                                        ",
    "        o                                       o       ",
    "       ===                  ===                ===      ",
    "  P        E       ^^^             E                 G  ",
    "XXXXXXXXXXXXXXXXXXXXXXXXXXX   XXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXXXXXXXXXXXX   XXXXXXXXXXXXXXXXXXXXXXXXXXX",
  ],
  // ---- Level 3: Crystal Cave (more platforming, two pits) ----
  [
    "                                                              ",
    "                                                              ",
    "          o o                                  o o            ",
    "         =====            ? ?                 =====           ",
    "                                                              ",
    "                    o o                                       ",
    "     ===           =====            ===          ===          ",
    "                                   E                          ",
    "             o            o o              o o                ",
    "            ===          =====            =====      ?        ",
    "                                                              ",
    "   o   E                        E                       o     ",
    "  P    ^^      E       ^^^               ^^^         E      G  ",
    "XXXXXXXXXXXXXXXXXXXXXX     XXXXXXXXXXXXX     XXXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXXXXXXX     XXXXXXXXXXXXX     XXXXXXXXXXXXXXXXXXX",
  ],
  // ---- Level 4: Frozen Night (tougher, enemies on platforms) ----
  [
    "                                                              ",
    "                                                              ",
    "                  o o o                                       ",
    "       ? ?       =======            E                         ",
    "                                  =======                     ",
    "    o o                                          o o o        ",
    "   =====            E                           =======       ",
    "                  =====        o o                            ",
    "           o o                =====        E                  ",
    "          =====                           =====     ? ?       ",
    "                       E                                      ",
    "   o          ^^^^    ===        ^^^^           o o           ",
    "  P    E                                  E              G    ",
    "XXXXXXXXXXXXXX     XXXXXXXXXXXX      XXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXX     XXXXXXXXXXXX      XXXXXXXXXXXXXXXXXXXXXXXXXXX",
  ],
  // ---- Level 5: Sky Castle (a climbing finale; floor below is safe to retry) ----
  [
    "                                                                    ",
    "                                                          o o o  G  ",
    "                                                         ========== ",
    "                                                  ===              ",
    "                                      o o                          ",
    "                          E          =====       E                 ",
    "                       =======                                     ",
    "              o o                        ===          ? ?          ",
    "             =====        ===                                      ",
    "      ? ?                          o o          E                  ",
    "                    E             =====       =====                ",
    "   o o      ===                                                    ",
    "  P  E              ^^^^         E         ^^^^          E          ",
    "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  ],
];

// ---------- Canvas setup ----------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ---------- Input ----------
const keys = { left:false, right:false, jump:false };
let jumpQueued = false;          // edge-trigger so holding jump = one jump

function setKey(code, down) {
  switch (code) {
    case 'ArrowLeft': case 'KeyA': keys.left = down; break;
    case 'ArrowRight': case 'KeyD': keys.right = down; break;
    case 'ArrowUp': case 'KeyW': case 'Space':
      keys.jump = down; if (down) jumpQueued = true; break;
  }
}
window.addEventListener('keydown', (e) => {
  if (['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyP' && game.state === 'playing') { game.state = 'paused'; return; }
  if (e.code === 'KeyP' && game.state === 'paused')  { game.state = 'playing'; return; }
  if (e.code === 'Enter') handleEnter();
  if (e.repeat) return;
  setKey(e.code, true);
});
window.addEventListener('keyup', (e) => setKey(e.code, false));

// Touch / mouse buttons
function bindHold(id, on, off) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = (e) => { e.preventDefault(); on(); };
  const end   = (e) => { e.preventDefault(); off(); };
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointerleave', end);
  el.addEventListener('pointercancel', end);
}
bindHold('left',  () => keys.left = true,  () => keys.left = false);
bindHold('right', () => keys.right = true, () => keys.right = false);
bindHold('jump',  () => { keys.jump = true; jumpQueued = true; }, () => keys.jump = false);
// Tap the canvas to start / advance screens
canvas.addEventListener('pointerdown', () => { initAudio(); handleEnter(); });

function handleEnter() {
  initAudio();
  if (game.state === 'title')      { startGame(); }
  else if (game.state === 'levelclear') { game.level++; loadLevel(game.level); game.state = 'playing'; }
  else if (game.state === 'gameover' || game.state === 'win') { game.state = 'title'; }
}

/* ============================================================
   AUDIO — tiny Web Audio synth (no files needed)
   ============================================================ */
let actx = null;
function initAudio() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (actx && actx.state === 'suspended') actx.resume();
}
function tone(freq, start, dur, type = 'square', vol = 0.14) {
  if (!actx) return;
  const t0 = actx.currentTime + start;
  const osc = actx.createOscillator();
  const gain = actx.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(actx.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}
const SFX = {
  jump:  () => tone(420, 0, 0.12, 'square', 0.12),
  coin:  () => { tone(988, 0, 0.07); tone(1319, 0.06, 0.12); },
  bonus: () => { tone(660, 0, 0.08); tone(880, 0.08, 0.12); },
  stomp: () => { tone(180, 0, 0.12, 'sawtooth', 0.18); tone(120, 0.05, 0.12, 'square', 0.1); },
  hurt:  () => { tone(400, 0, 0.1, 'sawtooth', 0.18); tone(150, 0.1, 0.2, 'sawtooth', 0.16); },
  die:   () => [523,415,330,196].forEach((f,i)=>tone(f, i*0.13, 0.16, 'triangle', 0.16)),
  clear: () => [523,659,784,1046].forEach((f,i)=>tone(f, i*0.12, 0.16, 'square', 0.14)),
  over:  () => [392,330,262,196].forEach((f,i)=>tone(f, i*0.16, 0.22, 'triangle', 0.16)),
  win:   () => [523,659,784,1046,1318,1046,1318].forEach((f,i)=>tone(f, i*0.13, 0.2, 'square', 0.14)),
};

/* ============================================================
   GAME STATE
   ============================================================ */
const game = {
  state: 'title',          // title | playing | paused | levelclear | gameover | win
  level: 0,
  score: 0,
  coins: 0,
  lives: START_LIVES,
  time: LEVEL_SECS,
  timeAcc: 0,
  shake: 0,
  intro: 0,                // frames remaining for "Level X" banner
};

let grid = [];             // 2D array of tile chars (collision map)
let levelW = 0;            // level width in tiles
let levelPxW = 0;          // level width in pixels
let coinsList = [];
let enemies = [];
let particles = [];
let goal = { x: 0, y: 0 };
let startPos = { x: 0, y: 0 };
let camX = 0;

const player = {
  x: 0, y: 0, w: 26, h: 36,
  vx: 0, vy: 0,
  dir: 1,                  // 1 = facing right, -1 = left
  onGround: false,
  invincible: 0,
  walkPhase: 0,
};

// ---------- Tile helpers ----------
const SOLID = new Set(['X', '=', '?', 'U']);
function tileAt(col, row) {
  if (row < 0 || row >= ROWS || col < 0 || col >= levelW) return ' ';
  return grid[row][col];
}
const isSolid = (ch) => SOLID.has(ch);

// ---------- Load a level from its char map ----------
function loadLevel(index) {
  const map = LEVELS[index];
  levelW = Math.max(...map.map(r => r.length));
  levelPxW = levelW * TILE;
  grid = [];
  coinsList = []; enemies = []; particles = [];

  for (let r = 0; r < ROWS; r++) {
    const rowStr = (map[r] || '').padEnd(levelW, ' ');
    const rowArr = [];
    for (let c = 0; c < levelW; c++) {
      let ch = rowStr[c];
      const px = c * TILE, py = r * TILE;
      if (ch === 'o') { coinsList.push({ x: px+8, y: py+8, w: 24, h: 24, got: false, ph: Math.random()*6 }); ch = ' '; }
      else if (ch === 'E') { enemies.push(makeEnemy(px+6, py+8)); ch = ' '; }
      else if (ch === 'G') { goal = { x: px, y: py }; ch = ' '; }
      else if (ch === 'P') { startPos = { x: px+7, y: py+4 }; ch = ' '; }
      rowArr.push(ch);
    }
    grid.push(rowArr);
  }
  respawnPlayer();
  game.time = LEVEL_SECS; game.timeAcc = 0; game.intro = 110;
}

function makeEnemy(x, y) {
  return { x, y, w: 30, h: 30, vx: -1.1, dir: -1, alive: true, squash: 0, ph: Math.random()*6 };
}
function respawnPlayer() {
  player.x = startPos.x; player.y = startPos.y;
  player.vx = 0; player.vy = 0; player.dir = 1;
  player.onGround = false; player.invincible = IFRAMES;
}

function startGame() {
  game.level = 0; game.score = 0; game.coins = 0; game.lives = START_LIVES;
  loadLevel(0); game.state = 'playing';
}

/* ============================================================
   UPDATE (physics) — runs at a fixed 60Hz timestep
   ============================================================ */
function update() {
  if (game.intro > 0) game.intro--;
  if (game.shake > 0) game.shake--;

  // Countdown timer
  game.timeAcc += STEP;
  if (game.timeAcc >= 1) { game.timeAcc -= 1; game.time--; if (game.time <= 0) { game.time = 0; loseLife(); return; } }

  // ----- Horizontal movement -----
  if (keys.left)  { player.vx -= MOVE_ACCEL; player.dir = -1; }
  if (keys.right) { player.vx += MOVE_ACCEL; player.dir = 1; }
  if (!keys.left && !keys.right) player.vx *= FRICTION;
  player.vx = Math.max(-MAX_RUN, Math.min(MAX_RUN, player.vx));
  if (Math.abs(player.vx) < 0.05) player.vx = 0;

  // ----- Jump (edge-triggered) -----
  if (jumpQueued && player.onGround) {
    player.vy = JUMP_VEL; player.onGround = false; SFX.jump();
    spawnParticles(player.x + player.w/2, player.y + player.h, 6, '#ffffff');
  }
  jumpQueued = false;

  // ----- Gravity -----
  player.vy = Math.min(player.vy + GRAVITY, MAX_FALL);

  // ----- Move + collide, one axis at a time -----
  moveX(player, player.vx);
  moveY(player, player.vy);

  if (Math.abs(player.vx) > 0.4 && player.onGround) player.walkPhase += 0.25;
  if (player.invincible > 0) player.invincible--;

  // ----- Death by falling into a pit -----
  if (player.y > VIEW_H + 60) { loseLife(); return; }

  // ----- Hazard tiles (spikes) -----
  if (overlapsTile(player, '^') && player.invincible <= 0) { hurt(); }

  updateEnemies();
  updateCoins();
  updateParticles();

  // ----- Reached the goal -----
  if (rectsOverlap(player, { x: goal.x, y: goal.y - TILE*2, w: TILE, h: TILE*3 })) {
    SFX.clear();
    game.score += Math.floor(game.time) * 5;   // time bonus
    game.state = (game.level >= LEVELS.length - 1) ? 'win' : 'levelclear';
    if (game.state === 'win') SFX.win();
  }

  // ----- Camera follows player, clamped to level bounds -----
  const target = player.x + player.w/2 - VIEW_W/2;
  camX = Math.max(0, Math.min(target, levelPxW - VIEW_W));
}

// Move on X axis then push out of solid tiles
function moveX(e, dx) {
  e.x += dx;
  const minR = Math.floor(e.y / TILE), maxR = Math.floor((e.y + e.h - 1) / TILE);
  const minC = Math.floor(e.x / TILE), maxC = Math.floor((e.x + e.w - 1) / TILE);
  for (let r = minR; r <= maxR; r++) for (let c = minC; c <= maxC; c++) {
    if (isSolid(tileAt(c, r))) {
      if (dx > 0) e.x = c * TILE - e.w; else if (dx < 0) e.x = (c + 1) * TILE;
      e.vx = 0; return;
    }
  }
  if (e.x < 0) { e.x = 0; e.vx = 0; }
}

// Move on Y axis then push out; detect ground + bonus-block hits
function moveY(e, dy) {
  e.y += dy;
  e.onGround = false;
  const minR = Math.floor(e.y / TILE), maxR = Math.floor((e.y + e.h - 1) / TILE);
  const minC = Math.floor(e.x / TILE), maxC = Math.floor((e.x + e.w - 1) / TILE);
  for (let r = minR; r <= maxR; r++) for (let c = minC; c <= maxC; c++) {
    if (isSolid(tileAt(c, r))) {
      if (dy > 0) { e.y = r * TILE - e.h; e.vy = 0; e.onGround = true; }
      else if (dy < 0) {
        e.y = (r + 1) * TILE; e.vy = 0;
        if (e === player && grid[r][c] === '?') hitBonus(c, r);
      }
      return;
    }
  }
}

function hitBonus(c, r) {
  grid[r][c] = 'U';                       // becomes a spent block
  game.score += 50; game.coins++;
  SFX.bonus();
  spawnParticles(c*TILE + TILE/2, r*TILE, 10, '#ffd23f');
}

/* ---------- Enemies ---------- */
function updateEnemies() {
  for (const en of enemies) {
    if (!en.alive) { en.squash += 1; continue; }
    en.ph += 0.15;
    en.vy = Math.min((en.vy || 0) + GRAVITY, MAX_FALL);
    moveX(en, en.vx);
    moveY(en, en.vy);

    // Turn around at a wall
    const aheadCol = Math.floor((en.x + (en.dir>0 ? en.w + 2 : -2)) / TILE);
    const midRow = Math.floor((en.y + en.h/2) / TILE);
    if (isSolid(tileAt(aheadCol, midRow))) { en.dir *= -1; en.vx = 1.1 * en.dir; }
    // Turn around at a ledge (so they don't walk off platforms)
    const footRow = Math.floor((en.y + en.h + 2) / TILE);
    if (en.onGround && !isSolid(tileAt(aheadCol, footRow))) { en.dir *= -1; en.vx = 1.1 * en.dir; }
    en.vx = 1.1 * en.dir;

    // Interaction with the player
    if (player.invincible <= 0 && rectsOverlap(player, en)) {
      const falling = player.vy > 0 && (player.y + player.h) - en.y < 20;
      if (falling) {                       // stomp!
        en.alive = false; en.squash = 1;
        player.vy = JUMP_VEL * 0.7;        // bounce
        game.score += 200; SFX.stomp();
        spawnParticles(en.x + en.w/2, en.y, 12, '#ff5d5d');
      } else {
        hurt();
      }
    }
  }
  enemies = enemies.filter(e => e.alive || e.squash < 18);
}

/* ---------- Coins ---------- */
function updateCoins() {
  for (const c of coinsList) {
    if (c.got) continue;
    c.ph += 0.15;
    if (rectsOverlap(player, c)) {
      c.got = true; game.coins++; game.score += 100; SFX.coin();
      spawnParticles(c.x + c.w/2, c.y + c.h/2, 8, '#ffe66d');
      if (game.coins % 25 === 0) game.lives++;   // free life every 25 coins
    }
  }
  coinsList = coinsList.filter(c => !c.got);
}

/* ---------- Damage / lives ---------- */
function hurt() {
  if (player.invincible > 0) return;
  game.lives--; SFX.hurt();
  game.shake = 14;
  spawnParticles(player.x + player.w/2, player.y + player.h/2, 14, '#ff3b3b');
  if (game.lives <= 0) { game.state = 'gameover'; SFX.over(); }
  else { player.invincible = IFRAMES; player.vy = -8; player.vx = -player.dir * 4; }
}
function loseLife() {
  game.lives--; SFX.die(); game.shake = 18;
  if (game.lives <= 0) { game.state = 'gameover'; SFX.over(); }
  else { loadLevel(game.level); }   // restart current level
}

/* ---------- Particles ---------- */
function spawnParticles(x, y, n, color) {
  for (let i = 0; i < n; i++) {
    particles.push({
      x, y,
      vx: (Math.random()-0.5)*6, vy: (Math.random()-0.9)*6,
      life: 30 + Math.random()*20, color, size: 2 + Math.random()*4,
    });
  }
}
function updateParticles() {
  for (const p of particles) { p.vy += 0.3; p.x += p.vx; p.y += p.vy; p.life--; }
  particles = particles.filter(p => p.life > 0);
}

// ---------- Geometry helpers ----------
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function overlapsTile(e, ch) {
  const minR = Math.floor(e.y / TILE), maxR = Math.floor((e.y + e.h - 1) / TILE);
  const minC = Math.floor(e.x / TILE), maxC = Math.floor((e.x + e.w - 1) / TILE);
  for (let r = minR; r <= maxR; r++) for (let c = minC; c <= maxC; c++) {
    if (tileAt(c, r) === ch) return true;
  }
  return false;
}

/* ============================================================
   RENDERING
   ============================================================ */
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

function render() {
  const theme = THEMES[game.level] || THEMES[0];
  ctx.save();
  if (game.shake > 0) ctx.translate((Math.random()-0.5)*game.shake, (Math.random()-0.5)*game.shake);

  drawBackground(theme);

  ctx.save();
  ctx.translate(-Math.round(camX), 0);
  drawTiles(theme);
  drawGoal();
  drawCoins();
  drawEnemies();
  drawParticles();
  drawPlayer();
  ctx.restore();

  drawHUD(theme);
  ctx.restore();

  // Full-screen overlays for non-playing states
  if (game.state === 'title')      drawTitle();
  if (game.state === 'paused')     drawCenterPanel('PAUSED', 'Press P to resume');
  if (game.state === 'levelclear') drawCenterPanel('LEVEL CLEAR!', 'Press ENTER for the next level', '#7CFC9A');
  if (game.state === 'gameover')   drawCenterPanel('GAME OVER', 'Press ENTER to return to title', '#ff6b6b');
  if (game.state === 'win')        drawWin();
  if (game.intro > 0 && game.state === 'playing') drawIntro(theme);
}

function drawBackground(theme) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, theme.sky[0]); g.addColorStop(1, theme.sky[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Sun / moon
  ctx.fillStyle = theme.sun; ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.arc(VIEW_W - 120, 110, 46, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;

  // Stars in night themes
  if (theme.night) {
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    for (let i = 0; i < 40; i++) {
      const sx = (i*97 % VIEW_W), sy = (i*53 % 260);
      ctx.fillRect(sx, sy, 2, 2);
    }
  }

  // Parallax hills (move slower than the camera)
  const hillOff = -(camX * 0.4) % 480;
  ctx.fillStyle = theme.hill;
  for (let i = -1; i < 4; i++) {
    const bx = hillOff + i*480;
    ctx.beginPath();
    ctx.moveTo(bx, VIEW_H);
    ctx.quadraticCurveTo(bx+120, VIEW_H-150, bx+240, VIEW_H);
    ctx.quadraticCurveTo(bx+360, VIEW_H-180, bx+480, VIEW_H);
    ctx.fill();
  }
  // Parallax clouds
  ctx.fillStyle = theme.night ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.7)';
  const cloudOff = -(camX * 0.2) % 360;
  for (let i = -1; i < 5; i++) cloud(cloudOff + i*360 + 60, 80 + (i%2)*50);
}
function cloud(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI*2);
  ctx.arc(x+26, y+6, 28, 0, Math.PI*2);
  ctx.arc(x+58, y, 22, 0, Math.PI*2);
  ctx.fill();
}

function drawTiles(theme) {
  const first = Math.floor(camX / TILE);
  const last = Math.min(levelW, first + VIEW_W / TILE + 2);
  for (let c = first; c < last; c++) {
    for (let r = 0; r < ROWS; r++) {
      const ch = grid[r][c]; const x = c*TILE, y = r*TILE;
      if (ch === 'X') {
        ctx.fillStyle = theme.ground; ctx.fillRect(x, y, TILE, TILE);
        if (!isSolid(tileAt(c, r-1))) { ctx.fillStyle = theme.grass; ctx.fillRect(x, y, TILE, 8); }
        ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.strokeRect(x+.5, y+.5, TILE-1, TILE-1);
      } else if (ch === '=') {
        ctx.fillStyle = theme.grass; ctx.fillRect(x, y, TILE, 14);
        ctx.fillStyle = theme.ground; ctx.fillRect(x, y+14, TILE, TILE-14);
        ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.strokeRect(x+.5, y+.5, TILE-1, TILE-1);
      } else if (ch === '?' || ch === 'U') {
        ctx.fillStyle = ch === '?' ? '#ffb01f' : '#9a7b3a';
        roundRect(x+2, y+2, TILE-4, TILE-4, 6); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ch === '?' ? '?' : '·', x+TILE/2, y+TILE/2+1);
      } else if (ch === '^') {
        ctx.fillStyle = '#d7d7e0';
        for (let s = 0; s < 4; s++) {
          const sx = x + s*10;
          ctx.beginPath(); ctx.moveTo(sx, y+TILE); ctx.lineTo(sx+5, y+TILE-18); ctx.lineTo(sx+10, y+TILE); ctx.fill();
        }
      }
    }
  }
}

function drawGoal() {
  const x = goal.x + TILE/2, baseY = goal.y + TILE;
  const topY = baseY - TILE*2.4;
  ctx.strokeStyle = '#cfcfcf'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, topY); ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x, topY, 7, 0, Math.PI*2); ctx.fill();
  const wave = Math.sin(performance.now()/180) * 4;
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.moveTo(x, topY+4);
  ctx.lineTo(x+44+wave, topY+16);
  ctx.lineTo(x, topY+30);
  ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('★', x+20, topY+21);
}

function drawCoins() {
  for (const c of coinsList) {
    const cx = c.x + c.w/2, cy = c.y + c.h/2;
    const sx = Math.abs(Math.cos(c.ph)) * 0.9 + 0.1;   // spin effect
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sx, 1);
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffec99'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

function drawEnemies() {
  for (const en of enemies) {
    const x = en.x, y = en.y;
    if (!en.alive) {
      ctx.fillStyle = 'rgba(180,60,60,.8)';
      const flat = Math.min(en.squash, 14);
      roundRect(x, y + en.h - 8 - (14-flat), en.w, 8 + (14-flat)/2, 4); ctx.fill();
      continue;
    }
    const bob = Math.sin(en.ph) * 2;
    ctx.fillStyle = '#c1121f';
    roundRect(x, y + bob, en.w, en.h - bob, 8); ctx.fill();
    // angry eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x+9, y+12+bob, 5, 0, Math.PI*2); ctx.arc(x+21, y+12+bob, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x+9+en.dir*1.5, y+12+bob, 2.4, 0, Math.PI*2); ctx.arc(x+21+en.dir*1.5, y+12+bob, 2.4, 0, Math.PI*2); ctx.fill();
    // feet
    ctx.fillStyle = '#7a0c14';
    const f = Math.sin(en.ph*1.5) * 3;
    ctx.fillRect(x+3, y+en.h-4+bob, 9, 5+Math.max(0,f));
    ctx.fillRect(x+en.w-12, y+en.h-4+bob, 9, 5+Math.max(0,-f));
  }
}

function drawPlayer() {
  // Flicker while invincible
  if (player.invincible > 0 && Math.floor(player.invincible/4) % 2 === 0) return;
  const x = player.x, y = player.y;
  // squash & stretch from vertical speed
  const stretch = Math.max(-3, Math.min(3, player.vy * 0.18));
  const w = player.w - stretch, h = player.h + stretch;
  const ox = x + (player.w - w)/2, oy = y + (player.h - h);

  // body
  ctx.fillStyle = '#3a86ff';
  roundRect(ox, oy+8, w, h-8, 6); ctx.fill();
  // cap
  ctx.fillStyle = '#e63946';
  roundRect(ox-2, oy, w+4, 12, 5); ctx.fill();
  ctx.fillStyle = '#c1121f'; ctx.fillRect(ox + (player.dir>0? w-6: -2), oy+3, 8, 6);
  // eyes
  ctx.fillStyle = '#fff';
  const ex = ox + w/2 + player.dir*4;
  ctx.beginPath(); ctx.arc(ex, oy+18, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#15224a';
  ctx.beginPath(); ctx.arc(ex + player.dir*1.5, oy+18, 2.4, 0, Math.PI*2); ctx.fill();
  // legs (walk animation)
  ctx.fillStyle = '#1f3a8a';
  const swing = player.onGround ? Math.sin(player.walkPhase) * 4 : 2;
  ctx.fillRect(ox+3, oy+h-6, 8, 6 + Math.max(0, swing));
  ctx.fillRect(ox+w-11, oy+h-6, 8, 6 + Math.max(0, -swing));
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life/40);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

// ---------- HUD ----------
function drawHUD(theme) {
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  roundRect(12, 12, VIEW_W - 24, 46, 12); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.font = 'bold 20px "Segoe UI", sans-serif';
  ctx.fillText('🏆 ' + game.score, 28, 36);
  ctx.fillText('🪙 ' + game.coins, 190, 36);
  // lives as hearts
  ctx.fillText('❤️'.repeat(Math.max(0, game.lives)) || '—', 320, 36);
  ctx.textAlign = 'center';
  ctx.fillText('Level ' + (game.level+1) + '/' + LEVELS.length + ' · ' + theme.name, VIEW_W/2 + 60, 36);
  ctx.textAlign = 'right';
  ctx.fillStyle = game.time < 30 ? '#ff6b6b' : '#fff';
  ctx.fillText('⏱ ' + game.time, VIEW_W - 28, 36);
}

// ---------- Overlays ----------
function drawDim() { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }

function drawTitle() {
  drawDim();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 64px "Segoe UI", sans-serif';
  ctx.fillText('SUPER BOX BROS', VIEW_W/2, 180);
  ctx.fillStyle = '#fff'; ctx.font = '20px "Segoe UI", sans-serif';
  ctx.fillText('A Mario-style platformer · 5 levels to conquer', VIEW_W/2, 230);

  ctx.font = '17px "Segoe UI", sans-serif'; ctx.fillStyle = '#cfd6ff';
  const lines = [
    '← →  /  A D   move          Space / ↑ / W   jump',
    'Stomp enemies from above • collect coins • smash ? blocks',
    'Grab 25 coins for a free life • reach the 🚩 flag to clear a level',
  ];
  lines.forEach((t, i) => ctx.fillText(t, VIEW_W/2, 300 + i*30));

  const pulse = 0.5 + 0.5*Math.sin(performance.now()/300);
  ctx.globalAlpha = 0.5 + pulse*0.5;
  ctx.fillStyle = '#7CFC9A'; ctx.font = 'bold 26px "Segoe UI", sans-serif';
  ctx.fillText('▶  Press ENTER or tap to start', VIEW_W/2, 440);
  ctx.globalAlpha = 1;
}

function drawCenterPanel(title, subtitle, color = '#ffd23f') {
  drawDim();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = color; ctx.font = 'bold 56px "Segoe UI", sans-serif';
  ctx.fillText(title, VIEW_W/2, VIEW_H/2 - 30);
  ctx.fillStyle = '#fff'; ctx.font = '22px "Segoe UI", sans-serif';
  ctx.fillText(subtitle, VIEW_W/2, VIEW_H/2 + 30);
  ctx.fillStyle = '#cfd6ff'; ctx.font = '18px "Segoe UI", sans-serif';
  ctx.fillText('Score: ' + game.score + '   Coins: ' + game.coins, VIEW_W/2, VIEW_H/2 + 70);
}

function drawWin() {
  drawDim();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 60px "Segoe UI", sans-serif';
  ctx.fillText('🎉 YOU WIN! 🎉', VIEW_W/2, 200);
  ctx.fillStyle = '#fff'; ctx.font = '26px "Segoe UI", sans-serif';
  ctx.fillText('You conquered all ' + LEVELS.length + ' levels!', VIEW_W/2, 270);
  ctx.fillStyle = '#7CFC9A'; ctx.font = 'bold 30px "Segoe UI", sans-serif';
  ctx.fillText('Final Score: ' + game.score, VIEW_W/2, 330);
  ctx.fillStyle = '#cfd6ff'; ctx.font = '20px "Segoe UI", sans-serif';
  ctx.fillText('Press ENTER to play again', VIEW_W/2, 400);
}

function drawIntro(theme) {
  const a = Math.min(1, game.intro/30) * Math.min(1, (110-game.intro)/15);
  ctx.globalAlpha = Math.max(0, Math.min(1, a));
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, VIEW_H/2-60, VIEW_W, 120);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 44px "Segoe UI", sans-serif';
  ctx.fillText('LEVEL ' + (game.level+1) + ' — ' + theme.name, VIEW_W/2, VIEW_H/2);
  ctx.globalAlpha = 1;
}

/* ============================================================
   MAIN LOOP — fixed-timestep update, render every frame
   ============================================================ */
let lastTime = performance.now();
let acc = 0;
function loop(now) {
  let dt = (now - lastTime) / 1000;
  lastTime = now;
  if (dt > 0.25) dt = 0.25;            // avoid huge jumps after tab switch
  if (game.state === 'playing') {
    acc += dt;
    while (acc >= STEP) { update(); acc -= STEP; }
  } else {
    acc = 0;
  }
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
