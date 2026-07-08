const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const libraryView = document.getElementById("libraryView");
const playView = document.getElementById("playView");
const gameTitle = document.getElementById("gameTitle");
const gameMode = document.getElementById("gameMode");
const scoreValue = document.getElementById("scoreValue");
const bestValue = document.getElementById("bestValue");
const controlText = document.getElementById("controlText");
const statusPill = document.getElementById("statusPill");
const overlay = document.getElementById("gameOverlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const backButton = document.getElementById("backButton");
const homeButton = document.getElementById("homeButton");
const searchInput = document.getElementById("searchInput");

const games = {
  snake: {
    title: "Snake",
    mode: "Quick reflexes",
    controls: "Arrow keys or WASD",
    start: "Eat the red apples. Do not hit the wall or your tail."
  },
  tetris: {
    title: "Tetris",
    mode: "Classic blocks",
    controls: "Left/Right move, Up rotate, Down drop",
    start: "Fit falling pieces together and clear full lines."
  },
  sled: {
    title: "Snow Sled 3D",
    mode: "Downhill run",
    controls: "Left/Right or A/D to steer",
    start: "Steer through gates and avoid trees on the slope."
  }
};

let activeGame = null;
let running = false;
let animationId = null;
let lastFrame = 0;
let keys = {};
let score = 0;
let best = JSON.parse(localStorage.getItem("quickPlayBest") || "{}");

function setScore(nextScore) {
  score = nextScore;
  scoreValue.textContent = String(score);
  if (activeGame && score > (best[activeGame] || 0)) {
    best[activeGame] = score;
    localStorage.setItem("quickPlayBest", JSON.stringify(best));
    bestValue.textContent = String(score);
  }
}

function showOverlay(title, text, buttonText = "Start") {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startButton.textContent = buttonText;
  overlay.classList.remove("is-hidden");
}

function hideOverlay() {
  overlay.classList.add("is-hidden");
}

function stopLoop() {
  running = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function gameOver(message) {
  stopLoop();
  showOverlay("Game over", message, "Play again");
}

function openGame(gameId) {
  activeGame = gameId;
  const game = games[gameId];
  stopLoop();
  libraryView.classList.add("is-hidden");
  playView.classList.remove("is-hidden");
  gameTitle.textContent = game.title;
  gameMode.textContent = game.mode;
  controlText.textContent = game.controls;
  statusPill.textContent = game.title;
  bestValue.textContent = String(best[gameId] || 0);
  setScore(0);
  resetGame();
  showOverlay(game.title, game.start, "Start");
}

function backHome() {
  stopLoop();
  activeGame = null;
  playView.classList.add("is-hidden");
  libraryView.classList.remove("is-hidden");
  statusPill.textContent = "Pick a game";
  drawIdleCanvas();
}

function startGame() {
  if (!activeGame) return;
  stopLoop();
  resetGame();
  hideOverlay();
  running = true;
  lastFrame = performance.now();
  animationId = requestAnimationFrame(loop);
}

function resetGame() {
  setScore(0);
  if (activeGame === "snake") resetSnake();
  if (activeGame === "tetris") resetTetris();
  if (activeGame === "sled") resetSled();
  drawGame(0);
}

function loop(time) {
  const delta = Math.min(48, time - lastFrame);
  lastFrame = time;
  updateGame(delta);
  drawGame(delta);
  if (running) animationId = requestAnimationFrame(loop);
}

function updateGame(delta) {
  if (activeGame === "snake") updateSnake(delta);
  if (activeGame === "tetris") updateTetris(delta);
  if (activeGame === "sled") updateSled(delta);
}

function drawGame(delta) {
  if (activeGame === "snake") drawSnake();
  if (activeGame === "tetris") drawTetris();
  if (activeGame === "sled") drawSled(delta);
}

document.querySelectorAll(".game-tile").forEach((tile) => {
  tile.addEventListener("click", () => openGame(tile.dataset.game));
});

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  document.querySelectorAll(".game-tile").forEach((tile) => {
    const game = games[tile.dataset.game];
    const text = `${game.title} ${game.mode} ${game.start}`.toLowerCase();
    tile.classList.toggle("is-hidden", query !== "" && !text.includes(query));
  });
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", () => {
  if (!activeGame) return;
  startGame();
});
backButton.addEventListener("click", backHome);
homeButton.addEventListener("click", backHome);

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
  }
  keys[key] = true;
  handleGameKey(key);
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

let snake;
let snakeTimer = 0;

function resetSnake() {
  snake = {
    grid: 22,
    body: [{ x: 10, y: 11 }, { x: 9, y: 11 }, { x: 8, y: 11 }],
    food: { x: 16, y: 11 },
    dir: { x: 1, y: 0 },
    next: { x: 1, y: 0 }
  };
  snakeTimer = 0;
}

function handleSnakeKey(key) {
  const nextDirs = {
    arrowup: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 },
    d: { x: 1, y: 0 }
  };
  const next = nextDirs[key];
  if (!next || (next.x + snake.dir.x === 0 && next.y + snake.dir.y === 0)) return;
  snake.next = next;
}

function updateSnake(delta) {
  snakeTimer += delta;
  if (snakeTimer < Math.max(82, 132 - score * 2)) return;
  snakeTimer = 0;
  snake.dir = snake.next;
  const head = snake.body[0];
  const nextHead = { x: head.x + snake.dir.x, y: head.y + snake.dir.y };
  const hitWall = nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= snake.grid || nextHead.y >= snake.grid;
  const hitBody = snake.body.some((part) => part.x === nextHead.x && part.y === nextHead.y);
  if (hitWall || hitBody) {
    gameOver(`Final score: ${score}`);
    return;
  }
  snake.body.unshift(nextHead);
  if (nextHead.x === snake.food.x && nextHead.y === snake.food.y) {
    setScore(score + 1);
    placeSnakeFood();
  } else {
    snake.body.pop();
  }
}

function placeSnakeFood() {
  do {
    snake.food = {
      x: Math.floor(Math.random() * snake.grid),
      y: Math.floor(Math.random() * snake.grid)
    };
  } while (snake.body.some((part) => part.x === snake.food.x && part.y === snake.food.y));
}

function drawSnake() {
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const size = Math.floor(Math.min(canvas.width, canvas.height) * 0.82);
  const cell = size / snake.grid;
  const ox = (canvas.width - size) / 2;
  const oy = (canvas.height - size) / 2;

  ctx.fillStyle = "#17233d";
  ctx.fillRect(ox, oy, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  for (let i = 0; i <= snake.grid; i++) {
    ctx.beginPath();
    ctx.moveTo(ox + i * cell, oy);
    ctx.lineTo(ox + i * cell, oy + size);
    ctx.moveTo(ox, oy + i * cell);
    ctx.lineTo(ox + size, oy + i * cell);
    ctx.stroke();
  }

  ctx.fillStyle = "#e54b4b";
  ctx.beginPath();
  ctx.arc(ox + (snake.food.x + 0.5) * cell, oy + (snake.food.y + 0.5) * cell, cell * 0.36, 0, Math.PI * 2);
  ctx.fill();

  snake.body.forEach((part, index) => {
    ctx.fillStyle = index === 0 ? "#6ee7b7" : "#0c9f8c";
    ctx.fillRect(ox + part.x * cell + 2, oy + part.y * cell + 2, cell - 4, cell - 4);
  });
}

const tetrisShapes = [
  { color: "#38bdf8", cells: [[1, 1, 1, 1]] },
  { color: "#f97316", cells: [[1, 0, 0], [1, 1, 1]] },
  { color: "#2364aa", cells: [[0, 0, 1], [1, 1, 1]] },
  { color: "#facc15", cells: [[1, 1], [1, 1]] },
  { color: "#22c55e", cells: [[0, 1, 1], [1, 1, 0]] },
  { color: "#a855f7", cells: [[0, 1, 0], [1, 1, 1]] },
  { color: "#e54b4b", cells: [[1, 1, 0], [0, 1, 1]] }
];

let tetris;
let tetrisTimer = 0;

function resetTetris() {
  tetris = {
    cols: 10,
    rows: 20,
    board: Array.from({ length: 20 }, () => Array(10).fill(null)),
    piece: null
  };
  tetrisTimer = 0;
  spawnPiece();
}

function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

function spawnPiece() {
  const shape = tetrisShapes[Math.floor(Math.random() * tetrisShapes.length)];
  tetris.piece = {
    cells: cloneMatrix(shape.cells),
    color: shape.color,
    x: Math.floor(tetris.cols / 2) - Math.ceil(shape.cells[0].length / 2),
    y: 0
  };
  if (collides(tetris.piece, 0, 0, tetris.piece.cells)) {
    gameOver(`Final score: ${score}`);
  }
}

function collides(piece, dx, dy, cells) {
  for (let y = 0; y < cells.length; y++) {
    for (let x = 0; x < cells[y].length; x++) {
      if (!cells[y][x]) continue;
      const bx = piece.x + x + dx;
      const by = piece.y + y + dy;
      if (bx < 0 || bx >= tetris.cols || by >= tetris.rows) return true;
      if (by >= 0 && tetris.board[by][bx]) return true;
    }
  }
  return false;
}

function rotatePiece() {
  const cells = tetris.piece.cells;
  const rotated = cells[0].map((_, x) => cells.map((row) => row[x]).reverse());
  if (!collides(tetris.piece, 0, 0, rotated)) tetris.piece.cells = rotated;
}

function lockPiece() {
  const piece = tetris.piece;
  piece.cells.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) tetris.board[piece.y + y][piece.x + x] = piece.color;
    });
  });
  clearLines();
  spawnPiece();
}

function clearLines() {
  let lines = 0;
  tetris.board = tetris.board.filter((row) => {
    if (row.every(Boolean)) {
      lines++;
      return false;
    }
    return true;
  });
  while (tetris.board.length < tetris.rows) tetris.board.unshift(Array(tetris.cols).fill(null));
  if (lines) setScore(score + lines * 100 + (lines - 1) * 50);
}

function handleTetrisKey(key) {
  if (!running) return;
  if (key === "arrowleft" && !collides(tetris.piece, -1, 0, tetris.piece.cells)) tetris.piece.x--;
  if (key === "arrowright" && !collides(tetris.piece, 1, 0, tetris.piece.cells)) tetris.piece.x++;
  if (key === "arrowup" || key === "w") rotatePiece();
  if (key === "arrowdown" || key === "s") {
    if (!collides(tetris.piece, 0, 1, tetris.piece.cells)) {
      tetris.piece.y++;
      setScore(score + 1);
    }
  }
}

function updateTetris(delta) {
  tetrisTimer += delta;
  if (tetrisTimer < Math.max(170, 720 - Math.floor(score / 8))) return;
  tetrisTimer = 0;
  if (!collides(tetris.piece, 0, 1, tetris.piece.cells)) {
    tetris.piece.y++;
  } else {
    lockPiece();
  }
}

function drawTetris() {
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cell = Math.floor(Math.min(canvas.width / 14, canvas.height / 22));
  const ox = Math.floor((canvas.width - tetris.cols * cell) / 2);
  const oy = Math.floor((canvas.height - tetris.rows * cell) / 2);
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(ox, oy, tetris.cols * cell, tetris.rows * cell);

  drawTetrisCells(tetris.board, ox, oy, cell);
  drawPiece(tetris.piece, ox, oy, cell);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  for (let x = 0; x <= tetris.cols; x++) {
    ctx.beginPath();
    ctx.moveTo(ox + x * cell, oy);
    ctx.lineTo(ox + x * cell, oy + tetris.rows * cell);
    ctx.stroke();
  }
  for (let y = 0; y <= tetris.rows; y++) {
    ctx.beginPath();
    ctx.moveTo(ox, oy + y * cell);
    ctx.lineTo(ox + tetris.cols * cell, oy + y * cell);
    ctx.stroke();
  }
}

function drawTetrisCells(board, ox, oy, cell) {
  board.forEach((row, y) => {
    row.forEach((color, x) => {
      if (!color) return;
      drawBlock(ox + x * cell, oy + y * cell, cell, color);
    });
  });
}

function drawPiece(piece, ox, oy, cell) {
  piece.cells.forEach((row, y) => {
    row.forEach((filled, x) => {
      if (!filled) return;
      drawBlock(ox + (piece.x + x) * cell, oy + (piece.y + y) * cell, cell, piece.color);
    });
  });
}

function drawBlock(x, y, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x + 4, y + 4, size - 8, Math.max(3, size * 0.14));
}

let sled;

function resetSled() {
  sled = {
    x: 0,
    speed: 0.032,
    distance: 0,
    gatePoints: 0,
    obstacles: [],
    gateTimer: 0,
    treeTimer: 0,
    tilt: 0
  };
}

function updateSled(delta) {
  const steer = (keys.arrowleft || keys.a ? -1 : 0) + (keys.arrowright || keys.d ? 1 : 0);
  sled.x += steer * delta * 0.003;
  sled.x = Math.max(-1.35, Math.min(1.35, sled.x));
  sled.tilt += (steer - sled.tilt) * 0.12;
  sled.distance += delta * sled.speed;
  sled.speed += delta * 0.000002;
  sled.gateTimer -= delta;
  sled.treeTimer -= delta;

  if (sled.gateTimer <= 0) {
    sled.gateTimer = 1200;
    const center = Math.random() * 1.7 - 0.85;
    sled.obstacles.push({ type: "gate", x: center, z: 1, passed: false });
  }
  if (sled.treeTimer <= 0) {
    sled.treeTimer = 520;
    const side = Math.random() < 0.5 ? -1 : 1;
    sled.obstacles.push({ type: "tree", x: side * (0.45 + Math.random() * 1.1), z: 1, passed: false });
  }

  sled.obstacles.forEach((item) => {
    item.z -= delta * sled.speed;
    if (item.z < 0.18 && !item.passed) {
      if (item.type === "tree" && Math.abs(sled.x - item.x) < 0.24) gameOver(`Final score: ${score}`);
      if (item.type === "gate") {
        if (Math.abs(sled.x - item.x) < 0.38) sled.gatePoints += 10;
        else gameOver(`Final score: ${score}`);
      }
      item.passed = true;
    }
  });
  sled.obstacles = sled.obstacles.filter((item) => item.z > -0.1);
  if (running) setScore(Math.floor(sled.distance) + sled.gatePoints);
}

function drawSled() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#9ad7ff");
  sky.addColorStop(0.55, "#eaf8ff");
  sky.addColorStop(1, "#ffffff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#5d7894";
  drawMountain(50, 270, 260, 92);
  drawMountain(230, 260, 260, 120);
  drawMountain(430, 265, 330, 105);

  ctx.fillStyle = "#f8fbff";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(canvas.width * 0.36, canvas.height * 0.46);
  ctx.lineTo(canvas.width * 0.64, canvas.height * 0.46);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 18; i++) {
    const z = ((i / 18 + sled.distance * 0.035) % 1);
    const y = perspectiveY(z);
    const left = perspectiveX(-0.82, z);
    const right = perspectiveX(0.82, z);
    ctx.strokeStyle = "rgba(35,100,170,0.16)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  sled.obstacles.forEach(drawSledObstacle);
  drawSledPlayer();
}

function drawMountain(x, base, width, height) {
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.lineTo(x + width * 0.45, base - height);
  ctx.lineTo(x + width, base);
  ctx.closePath();
  ctx.fill();
}

function perspectiveY(z) {
  return canvas.height * (0.47 + (1 - z) * 0.5);
}

function perspectiveX(x, z) {
  const scale = 70 + (1 - z) * 240;
  return canvas.width / 2 + x * scale;
}

function drawSledObstacle(item) {
  const x = perspectiveX(item.x, item.z);
  const y = perspectiveY(item.z);
  const scale = 0.35 + (1 - item.z) * 1.8;
  if (item.type === "tree") {
    ctx.fillStyle = "#7a4b2b";
    ctx.fillRect(x - 4 * scale, y - 22 * scale, 8 * scale, 28 * scale);
    ctx.fillStyle = "#0b7a53";
    ctx.beginPath();
    ctx.moveTo(x, y - 70 * scale);
    ctx.lineTo(x - 24 * scale, y - 16 * scale);
    ctx.lineTo(x + 24 * scale, y - 16 * scale);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.strokeStyle = "#e54b4b";
    ctx.lineWidth = 5 * scale;
    ctx.beginPath();
    ctx.moveTo(x - 42 * scale, y - 55 * scale);
    ctx.lineTo(x - 42 * scale, y);
    ctx.moveTo(x + 42 * scale, y - 55 * scale);
    ctx.lineTo(x + 42 * scale, y);
    ctx.stroke();
    ctx.strokeStyle = "#2364aa";
    ctx.beginPath();
    ctx.moveTo(x - 42 * scale, y - 55 * scale);
    ctx.lineTo(x + 42 * scale, y - 55 * scale);
    ctx.stroke();
  }
}

function drawSledPlayer() {
  const x = canvas.width / 2 + sled.x * 130;
  const y = canvas.height * 0.83;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sled.tilt * 0.18);
  ctx.fillStyle = "#e54b4b";
  ctx.fillRect(-28, -18, 56, 28);
  ctx.fillStyle = "#111827";
  ctx.fillRect(-36, 8, 72, 7);
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(0, -30, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function handleGameKey(key) {
  if (key === " " && !running && activeGame) {
    startGame();
    return;
  }
  if (activeGame === "snake") handleSnakeKey(key);
  if (activeGame === "tetris") handleTetrisKey(key);
}

function drawIdleCanvas() {
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawThumbnails() {
  document.querySelectorAll("[data-thumb]").forEach((thumb) => {
    const thumbCtx = thumb.getContext("2d");
    const w = thumb.width;
    const h = thumb.height;
    const type = thumb.dataset.thumb;
    thumbCtx.fillStyle = "#111827";
    thumbCtx.fillRect(0, 0, w, h);

    if (type === "snake") {
      thumbCtx.fillStyle = "#17233d";
      thumbCtx.fillRect(36, 28, w - 72, h - 56);
      thumbCtx.fillStyle = "#0c9f8c";
      [[3, 4], [4, 4], [5, 4], [6, 4], [6, 5], [6, 6], [7, 6]].forEach(([x, y], index) => {
        thumbCtx.fillStyle = index === 6 ? "#6ee7b7" : "#0c9f8c";
        thumbCtx.fillRect(64 + x * 28, 34 + y * 24, 22, 22);
      });
      thumbCtx.fillStyle = "#e54b4b";
      thumbCtx.beginPath();
      thumbCtx.arc(w - 104, 88, 16, 0, Math.PI * 2);
      thumbCtx.fill();
    }

    if (type === "tetris") {
      const colors = ["#38bdf8", "#f97316", "#facc15", "#22c55e", "#a855f7", "#e54b4b"];
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 9; x++) {
          if (Math.random() > 0.58 && y < 3) continue;
          thumbCtx.fillStyle = colors[(x + y) % colors.length];
          thumbCtx.fillRect(78 + x * 29, 46 + y * 27, 24, 24);
        }
      }
      thumbCtx.fillStyle = "#2364aa";
      thumbCtx.fillRect(230, 28, 24, 24);
      thumbCtx.fillRect(230, 55, 24, 24);
      thumbCtx.fillRect(230, 82, 24, 24);
      thumbCtx.fillRect(257, 82, 24, 24);
    }

    if (type === "sled") {
      const sky = thumbCtx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#9ad7ff");
      sky.addColorStop(1, "#ffffff");
      thumbCtx.fillStyle = sky;
      thumbCtx.fillRect(0, 0, w, h);
      thumbCtx.fillStyle = "#5d7894";
      thumbCtx.beginPath();
      thumbCtx.moveTo(10, 160);
      thumbCtx.lineTo(120, 60);
      thumbCtx.lineTo(235, 160);
      thumbCtx.closePath();
      thumbCtx.fill();
      thumbCtx.beginPath();
      thumbCtx.moveTo(170, 158);
      thumbCtx.lineTo(300, 52);
      thumbCtx.lineTo(430, 158);
      thumbCtx.closePath();
      thumbCtx.fill();
      thumbCtx.fillStyle = "#f8fbff";
      thumbCtx.beginPath();
      thumbCtx.moveTo(0, h);
      thumbCtx.lineTo(155, 112);
      thumbCtx.lineTo(265, 112);
      thumbCtx.lineTo(w, h);
      thumbCtx.closePath();
      thumbCtx.fill();
      thumbCtx.strokeStyle = "#e54b4b";
      thumbCtx.lineWidth = 5;
      thumbCtx.beginPath();
      thumbCtx.moveTo(140, 118);
      thumbCtx.lineTo(140, 174);
      thumbCtx.moveTo(280, 118);
      thumbCtx.lineTo(280, 174);
      thumbCtx.stroke();
      thumbCtx.fillStyle = "#111827";
      thumbCtx.fillRect(172, 204, 78, 8);
      thumbCtx.fillStyle = "#e54b4b";
      thumbCtx.fillRect(184, 178, 54, 28);
    }
  });
}

drawThumbnails();
drawIdleCanvas();
