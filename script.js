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
  },
  twenty48: {
    title: "2048",
    mode: "Number puzzle",
    controls: "Arrow keys or WASD",
    start: "Slide matching numbers together and try to reach 2048."
  },
  blast: {
    title: "Block Blast",
    mode: "Block puzzle",
    controls: "Click a grid spot to place the block",
    start: "Place each block. Full rows and columns clear for points."
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
  if (activeGame === "twenty48") reset2048();
  if (activeGame === "blast") resetBlast();
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
  if (activeGame === "twenty48") update2048(delta);
  if (activeGame === "blast") updateBlast(delta);
}

function drawGame(delta) {
  if (activeGame === "snake") drawSnake();
  if (activeGame === "tetris") drawTetris();
  if (activeGame === "sled") drawSled(delta);
  if (activeGame === "twenty48") draw2048();
  if (activeGame === "blast") drawBlast();
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

canvas.addEventListener("click", (event) => {
  if (activeGame !== "blast" || !running) return;
  handleBlastClick(event);
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
    speed: 0.00022,
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
  sled.x += steer * delta * 0.0024;
  sled.x = Math.max(-1.35, Math.min(1.35, sled.x));
  sled.tilt += (steer - sled.tilt) * 0.12;
  sled.distance += delta * sled.speed;
  sled.speed = Math.min(0.00045, sled.speed + delta * 0.0000000016);
  sled.gateTimer -= delta;
  sled.treeTimer -= delta;

  if (sled.gateTimer <= 0) {
    sled.gateTimer = 2600;
    const center = Math.random() * 1.7 - 0.85;
    sled.obstacles.push({ type: "gate", x: center, z: 1.45, passed: false });
  }
  if (sled.treeTimer <= 0) {
    sled.treeTimer = 1450;
    const side = Math.random() < 0.5 ? -1 : 1;
    sled.obstacles.push({ type: "tree", x: side * (0.48 + Math.random() * 1.08), z: 1.35, passed: false });
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
    const z = ((i / 18 + sled.distance * 0.018) % 1);
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
  const clamped = Math.max(0, Math.min(1.45, z));
  return canvas.height * (0.42 + (1.45 - clamped) * 0.38);
}

function perspectiveX(x, z) {
  const clamped = Math.max(0, Math.min(1.45, z));
  const scale = 58 + (1.45 - clamped) * 230;
  return canvas.width / 2 + x * scale;
}

function drawSledObstacle(item) {
  const x = perspectiveX(item.x, item.z);
  const y = perspectiveY(item.z);
  const depth = Math.max(0, 1.45 - item.z);
  const scale = 0.5 + depth * 1.35;
  if (item.type === "tree") {
    ctx.shadowColor = "rgba(0,0,0,0.28)";
    ctx.shadowBlur = 10 * scale;
    ctx.shadowOffsetY = 6 * scale;
    ctx.fillStyle = "#7a4b2b";
    ctx.fillRect(x - 6 * scale, y - 28 * scale, 12 * scale, 34 * scale);
    ctx.fillStyle = "#0b7a53";
    ctx.beginPath();
    ctx.moveTo(x, y - 86 * scale);
    ctx.lineTo(x - 32 * scale, y - 20 * scale);
    ctx.lineTo(x + 32 * scale, y - 20 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#12a36d";
    ctx.beginPath();
    ctx.moveTo(x, y - 66 * scale);
    ctx.lineTo(x - 24 * scale, y - 5 * scale);
    ctx.lineTo(x + 24 * scale, y - 5 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  } else {
    ctx.shadowColor = "rgba(0,0,0,0.30)";
    ctx.shadowBlur = 9 * scale;
    ctx.shadowOffsetY = 5 * scale;
    ctx.strokeStyle = "#e54b4b";
    ctx.lineWidth = 7 * scale;
    ctx.beginPath();
    ctx.moveTo(x - 48 * scale, y - 66 * scale);
    ctx.lineTo(x - 42 * scale, y);
    ctx.moveTo(x + 48 * scale, y - 66 * scale);
    ctx.lineTo(x + 42 * scale, y);
    ctx.stroke();
    ctx.strokeStyle = "#2364aa";
    ctx.lineWidth = 9 * scale;
    ctx.beginPath();
    ctx.moveTo(x - 50 * scale, y - 66 * scale);
    ctx.lineTo(x + 50 * scale, y - 66 * scale);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${Math.max(10, 15 * scale)}px Trebuchet MS, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GO", x, y - 66 * scale);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
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

let game2048;

function reset2048() {
  game2048 = {
    size: 4,
    board: Array.from({ length: 4 }, () => Array(4).fill(0)),
    movingTiles: [],
    animating: false,
    animationTime: 0,
    animationDuration: 150,
    pendingBoard: null,
    pendingPoints: 0
  };
  add2048Tile();
  add2048Tile();
}

function update2048(delta) {
  if (!game2048.animating) return;
  game2048.animationTime += delta;
  if (game2048.animationTime < game2048.animationDuration) return;
  game2048.board = game2048.pendingBoard;
  game2048.animating = false;
  game2048.movingTiles = [];
  game2048.pendingBoard = null;
  if (game2048.pendingPoints) setScore(score + game2048.pendingPoints);
  add2048Tile();
  if (!canMove2048()) gameOver(`Final score: ${score}`);
}

function add2048Tile() {
  const empty = [];
  game2048.board.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) empty.push({ x, y });
    });
  });
  if (!empty.length) return;
  const spot = empty[Math.floor(Math.random() * empty.length)];
  game2048.board[spot.y][spot.x] = Math.random() < 0.9 ? 2 : 4;
}

function slide2048Line(line) {
  const values = line
    .map((value, index) => ({ value, index }))
    .filter((tile) => tile.value);
  const output = Array(4).fill(0);
  const moves = [];
  let points = 0;
  let target = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i + 1] && values[i].value === values[i + 1].value) {
      const nextValue = values[i].value * 2;
      output[target] = nextValue;
      moves.push({ from: values[i].index, to: target, value: values[i].value, result: nextValue });
      moves.push({ from: values[i + 1].index, to: target, value: values[i + 1].value, result: nextValue });
      points += nextValue;
      i++;
    } else {
      output[target] = values[i].value;
      moves.push({ from: values[i].index, to: target, value: values[i].value, result: values[i].value });
    }
    target++;
  }
  return { line: output, moves, points };
}

function move2048(direction) {
  if (!running || game2048.animating) return;
  const before = JSON.stringify(game2048.board);
  const nextBoard = Array.from({ length: 4 }, () => Array(4).fill(0));
  const movingTiles = [];
  let points = 0;

  if (direction === "left" || direction === "right") {
    game2048.board.forEach((row, y) => {
      const input = direction === "left" ? row : row.slice().reverse();
      const result = slide2048Line(input);
      points += result.points;
      const output = direction === "left" ? result.line : result.line.slice().reverse();
      nextBoard[y] = output;
      result.moves.forEach((move) => {
        const fromX = direction === "left" ? move.from : 3 - move.from;
        const toX = direction === "left" ? move.to : 3 - move.to;
        movingTiles.push({ fromX, fromY: y, toX, toY: y, value: move.value });
      });
    });
  } else {
    for (let x = 0; x < 4; x++) {
      const column = game2048.board.map((row) => row[x]);
      const input = direction === "up" ? column : column.reverse();
      const result = slide2048Line(input);
      points += result.points;
      const output = direction === "up" ? result.line : result.line.slice().reverse();
      output.forEach((value, y) => {
        nextBoard[y][x] = value;
      });
      result.moves.forEach((move) => {
        const fromY = direction === "up" ? move.from : 3 - move.from;
        const toY = direction === "up" ? move.to : 3 - move.to;
        movingTiles.push({ fromX: x, fromY, toX: x, toY, value: move.value });
      });
    }
  }

  if (JSON.stringify(nextBoard) === before) return;
  game2048.movingTiles = movingTiles;
  game2048.pendingBoard = nextBoard;
  game2048.pendingPoints = points;
  game2048.animationTime = 0;
  game2048.animating = true;
}

function canMove2048() {
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const value = game2048.board[y][x];
      if (!value) return true;
      if (game2048.board[y][x + 1] === value || (game2048.board[y + 1] && game2048.board[y + 1][x] === value)) {
        return true;
      }
    }
  }
  return false;
}

function draw2048() {
  ctx.fillStyle = "#111322";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const layout = get2048Layout();
  const boardSize = layout.boardSize;
  const ox = layout.ox;
  const oy = layout.oy;
  const progress = game2048.animating ? easeOutCubic(game2048.animationTime / game2048.animationDuration) : 1;
  ctx.fillStyle = "#34304a";
  roundRect(ox, oy, boardSize, boardSize, 18, true);

  const displayBoard = game2048.animating ? Array.from({ length: 4 }, () => Array(4).fill(0)) : game2048.board;
  displayBoard.forEach((row, y) => {
    row.forEach((value, x) => {
      draw2048Tile(x, y, value, layout);
    });
  });

  game2048.movingTiles.forEach((tile) => {
    const x = tile.fromX + (tile.toX - tile.fromX) * progress;
    const y = tile.fromY + (tile.toY - tile.fromY) * progress;
    draw2048Tile(x, y, tile.value, layout);
  });
}

function get2048Layout() {
  const boardSize = Math.floor(Math.min(canvas.width, canvas.height) * 0.78);
  const gap = Math.max(10, boardSize * 0.025);
  const cell = (boardSize - gap * 5) / 4;
  return {
    boardSize,
    gap,
    cell,
    ox: (canvas.width - boardSize) / 2,
    oy: (canvas.height - boardSize) / 2
  };
}

function draw2048Tile(x, y, value, layout) {
  const px = layout.ox + layout.gap + x * (layout.cell + layout.gap);
  const py = layout.oy + layout.gap + y * (layout.cell + layout.gap);
  ctx.fillStyle = get2048Color(value);
  roundRect(px, py, layout.cell, layout.cell, 14, true);
  if (!value) return;
  ctx.fillStyle = value <= 4 ? "#372f31" : "#fff";
  ctx.font = `900 ${Math.max(24, layout.cell * 0.34)}px Trebuchet MS, Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(value), px + layout.cell / 2, py + layout.cell / 2 + 2);
}

function easeOutCubic(value) {
  const t = Math.max(0, Math.min(1, value));
  return 1 - Math.pow(1 - t, 3);
}

function get2048Color(value) {
  const colors = {
    0: "#262a3f",
    2: "#eee4da",
    4: "#ede0c8",
    8: "#f2b179",
    16: "#f59563",
    32: "#f67c5f",
    64: "#f65e3b",
    128: "#edcf72",
    256: "#edcc61",
    512: "#9c6bff",
    1024: "#43d9ff",
    2048: "#7ce7a6"
  };
  return colors[value] || "#ff5ab8";
}

let blast;
const blastShapes = [
  [[1]],
  [[1, 1]],
  [[1, 1, 1]],
  [[1], [1], [1]],
  [[1, 1], [1, 1]],
  [[1, 0], [1, 1]],
  [[0, 1], [1, 1]],
  [[1, 1, 1], [0, 1, 0]]
];

function resetBlast() {
  blast = {
    size: 8,
    board: Array.from({ length: 8 }, () => Array(8).fill(null)),
    shape: nextBlastShape()
  };
}

function updateBlast() {}

function nextBlastShape() {
  const cells = blastShapes[Math.floor(Math.random() * blastShapes.length)];
  const colors = ["#43d9ff", "#ff5ab8", "#7ce7a6", "#ffe45c", "#6f49ff", "#ff623d"];
  return {
    cells: cells.map((row) => row.slice()),
    color: colors[Math.floor(Math.random() * colors.length)]
  };
}

function handleBlastClick(event) {
  const grid = getBlastGrid();
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * sx;
  const y = (event.clientY - rect.top) * sy;
  const col = Math.floor((x - grid.x) / grid.cell);
  const row = Math.floor((y - grid.y) / grid.cell);
  if (placeBlastShape(col, row)) drawBlast();
}

function placeBlastShape(col, row) {
  if (!canPlaceBlast(col, row, blast.shape.cells)) return false;
  let cellsPlaced = 0;
  blast.shape.cells.forEach((shapeRow, y) => {
    shapeRow.forEach((filled, x) => {
      if (!filled) return;
      blast.board[row + y][col + x] = blast.shape.color;
      cellsPlaced++;
    });
  });
  setScore(score + cellsPlaced);
  clearBlastLines();
  blast.shape = nextBlastShape();
  if (!hasBlastMove()) gameOver(`Final score: ${score}`);
  return true;
}

function canPlaceBlast(col, row, shape) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const bx = col + x;
      const by = row + y;
      if (bx < 0 || by < 0 || bx >= blast.size || by >= blast.size || blast.board[by][bx]) return false;
    }
  }
  return true;
}

function clearBlastLines() {
  const rows = [];
  const cols = [];
  for (let y = 0; y < blast.size; y++) {
    if (blast.board[y].every(Boolean)) rows.push(y);
  }
  for (let x = 0; x < blast.size; x++) {
    if (blast.board.every((row) => row[x])) cols.push(x);
  }
  rows.forEach((y) => blast.board[y].fill(null));
  cols.forEach((x) => blast.board.forEach((row) => {
    row[x] = null;
  }));
  if (rows.length || cols.length) setScore(score + (rows.length + cols.length) * 25);
}

function hasBlastMove() {
  for (let y = 0; y < blast.size; y++) {
    for (let x = 0; x < blast.size; x++) {
      if (canPlaceBlast(x, y, blast.shape.cells)) return true;
    }
  }
  return false;
}

function getBlastGrid() {
  const size = Math.floor(Math.min(canvas.width, canvas.height) * 0.68);
  return {
    size,
    cell: size / blast.size,
    x: Math.floor((canvas.width - size) / 2),
    y: 42
  };
}

function drawBlast() {
  ctx.fillStyle = "#111322";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const grid = getBlastGrid();
  ctx.fillStyle = "#20243a";
  roundRect(grid.x - 10, grid.y - 10, grid.size + 20, grid.size + 20, 18, true);

  for (let y = 0; y < blast.size; y++) {
    for (let x = 0; x < blast.size; x++) {
      const px = grid.x + x * grid.cell;
      const py = grid.y + y * grid.cell;
      ctx.fillStyle = blast.board[y][x] || "#2c314d";
      roundRect(px + 3, py + 3, grid.cell - 6, grid.cell - 6, 8, true);
    }
  }

  ctx.fillStyle = "#a6a8c4";
  ctx.font = "900 20px Trebuchet MS, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Next block", canvas.width / 2, canvas.height - 98);
  drawBlastShape(blast.shape, canvas.width / 2, canvas.height - 58, 30);
}

function drawBlastShape(shape, cx, cy, cell) {
  const width = shape.cells[0].length * cell;
  const height = shape.cells.length * cell;
  const ox = cx - width / 2;
  const oy = cy - height / 2;
  shape.cells.forEach((row, y) => {
    row.forEach((filled, x) => {
      if (!filled) return;
      ctx.fillStyle = shape.color;
      roundRect(ox + x * cell + 3, oy + y * cell + 3, cell - 6, cell - 6, 7, true);
    });
  });
}

function roundRect(x, y, width, height, radius, fill) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  if (fill) ctx.fill();
}

function handleGameKey(key) {
  if (key === " " && !running && activeGame) {
    startGame();
    return;
  }
  if (activeGame === "snake") handleSnakeKey(key);
  if (activeGame === "tetris") handleTetrisKey(key);
  if (activeGame === "twenty48") {
    if (key === "arrowleft" || key === "a") move2048("left");
    if (key === "arrowright" || key === "d") move2048("right");
    if (key === "arrowup" || key === "w") move2048("up");
    if (key === "arrowdown" || key === "s") move2048("down");
  }
}

function drawIdleCanvas() {
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawThumbDecor(baseCtx, w, h, accent) {
  baseCtx.save();
  baseCtx.strokeStyle = "rgba(255,255,255,0.18)";
  baseCtx.lineWidth = 4;
  baseCtx.strokeRect(10, 10, w - 20, h - 20);
  baseCtx.fillStyle = "rgba(255,255,255,0.10)";
  baseCtx.beginPath();
  baseCtx.moveTo(0, 0);
  baseCtx.lineTo(w * 0.62, 0);
  baseCtx.lineTo(w * 0.28, h);
  baseCtx.lineTo(0, h);
  baseCtx.closePath();
  baseCtx.fill();
  baseCtx.strokeStyle = accent;
  baseCtx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const x = 34 + i * 96;
    baseCtx.beginPath();
    baseCtx.moveTo(x, 28);
    baseCtx.lineTo(x + 26, 28);
    baseCtx.stroke();
  }
  baseCtx.restore();
}

function drawThumbText(baseCtx, text, x, y, size, color) {
  baseCtx.save();
  baseCtx.font = `900 ${size}px Trebuchet MS, Arial`;
  baseCtx.textAlign = "center";
  baseCtx.textBaseline = "middle";
  baseCtx.lineWidth = Math.max(4, size * 0.12);
  baseCtx.strokeStyle = "rgba(0,0,0,0.58)";
  baseCtx.strokeText(text, x, y);
  baseCtx.fillStyle = color;
  baseCtx.fillText(text, x, y);
  baseCtx.restore();
}

function drawThumbSpark(baseCtx, x, y, radius, color) {
  baseCtx.save();
  baseCtx.strokeStyle = color;
  baseCtx.lineWidth = 3;
  baseCtx.beginPath();
  baseCtx.moveTo(x - radius, y);
  baseCtx.lineTo(x + radius, y);
  baseCtx.moveTo(x, y - radius);
  baseCtx.lineTo(x, y + radius);
  baseCtx.stroke();
  baseCtx.restore();
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
      const bg = thumbCtx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#143b47");
      bg.addColorStop(1, "#101827");
      thumbCtx.fillStyle = bg;
      thumbCtx.fillRect(0, 0, w, h);
      drawThumbDecor(thumbCtx, w, h, "#6ee7b7");
      thumbCtx.fillStyle = "#17233d";
      thumbCtx.fillRect(36, 28, w - 72, h - 56);
      thumbCtx.strokeStyle = "rgba(110,231,183,0.42)";
      thumbCtx.lineWidth = 2;
      for (let i = 0; i < 9; i++) {
        thumbCtx.beginPath();
        thumbCtx.moveTo(48 + i * 38, 40);
        thumbCtx.lineTo(48 + i * 38, h - 46);
        thumbCtx.stroke();
      }
      thumbCtx.fillStyle = "#0c9f8c";
      [[3, 4], [4, 4], [5, 4], [6, 4], [6, 5], [6, 6], [7, 6]].forEach(([x, y], index) => {
        thumbCtx.fillStyle = index === 6 ? "#6ee7b7" : "#0c9f8c";
        thumbCtx.fillRect(64 + x * 28, 34 + y * 24, 22, 22);
      });
      drawThumbSpark(thumbCtx, 92, 78, 11, "#43d9ff");
      drawThumbSpark(thumbCtx, 318, 156, 9, "#ffe45c");
      thumbCtx.fillStyle = "#e54b4b";
      thumbCtx.beginPath();
      thumbCtx.arc(w - 104, 88, 16, 0, Math.PI * 2);
      thumbCtx.fill();
      drawThumbText(thumbCtx, "SNAKE", w / 2, 214, 38, "#ffffff");
    }

    if (type === "tetris") {
      const bg = thumbCtx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#2d1a55");
      bg.addColorStop(1, "#101827");
      thumbCtx.fillStyle = bg;
      thumbCtx.fillRect(0, 0, w, h);
      drawThumbDecor(thumbCtx, w, h, "#a58cff");
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
      drawThumbSpark(thumbCtx, 84, 52, 10, "#43d9ff");
      drawThumbSpark(thumbCtx, 334, 70, 12, "#ff5ab8");
      drawThumbText(thumbCtx, "TETRIS", w / 2, 214, 38, "#ffffff");
    }

    if (type === "sled") {
      const sky = thumbCtx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#9ad7ff");
      sky.addColorStop(1, "#ffffff");
      thumbCtx.fillStyle = sky;
      thumbCtx.fillRect(0, 0, w, h);
      drawThumbDecor(thumbCtx, w, h, "#43d9ff");
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
      thumbCtx.strokeStyle = "rgba(67,217,255,0.55)";
      thumbCtx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        thumbCtx.beginPath();
        thumbCtx.moveTo(62 + i * 54, 204 + (i % 2) * 12);
        thumbCtx.lineTo(104 + i * 54, 184 + (i % 2) * 12);
        thumbCtx.stroke();
      }
      thumbCtx.fillStyle = "#111827";
      thumbCtx.fillRect(172, 204, 78, 8);
      thumbCtx.fillStyle = "#e54b4b";
      thumbCtx.fillRect(184, 178, 54, 28);
      drawThumbText(thumbCtx, "SLED 3D", w / 2, 42, 32, "#ffffff");
    }

    if (type === "twenty48") {
      const gradient = thumbCtx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, "#35295f");
      gradient.addColorStop(1, "#161b2e");
      thumbCtx.fillStyle = gradient;
      thumbCtx.fillRect(0, 0, w, h);
      drawThumbDecor(thumbCtx, w, h, "#ffe45c");
      drawThumbSpark(thumbCtx, 54, 62, 12, "#ff5ab8");
      drawThumbSpark(thumbCtx, 362, 74, 13, "#43d9ff");
      const tiles = [
        ["2", "#eee4da"], ["4", "#ede0c8"], ["8", "#f2b179"], ["16", "#f59563"],
        ["32", "#f67c5f"], ["64", "#f65e3b"], ["128", "#edcf72"], ["2048", "#7ce7a6"]
      ];
      tiles.forEach(([label, color], index) => {
        const x = 72 + (index % 4) * 70;
        const y = 42 + Math.floor(index / 4) * 70;
        thumbCtx.fillStyle = color;
        thumbCtx.fillRect(x, y, 58, 58);
        thumbCtx.fillStyle = index < 2 ? "#372f31" : "#fff";
        thumbCtx.font = `900 ${label.length > 2 ? 19 : 25}px Trebuchet MS, Arial`;
        thumbCtx.textAlign = "center";
        thumbCtx.textBaseline = "middle";
        thumbCtx.fillText(label, x + 29, y + 31);
      });
      drawThumbText(thumbCtx, "2048", w / 2, 216, 42, "#ffffff");
    }

    if (type === "blast") {
      const gradient = thumbCtx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, "#0e7189");
      gradient.addColorStop(1, "#20173c");
      thumbCtx.fillStyle = gradient;
      thumbCtx.fillRect(0, 0, w, h);
      drawThumbDecor(thumbCtx, w, h, "#ff5ab8");
      drawThumbSpark(thumbCtx, 64, 60, 11, "#ffe45c");
      drawThumbSpark(thumbCtx, 356, 156, 14, "#7ce7a6");
      const colors = ["#43d9ff", "#ff5ab8", "#7ce7a6", "#ffe45c", "#6f49ff", "#ff623d"];
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 8; x++) {
          thumbCtx.fillStyle = colors[(x + y * 2) % colors.length];
          thumbCtx.fillRect(62 + x * 36, 46 + y * 30, 28, 24);
        }
      }
      thumbCtx.fillStyle = "#ffffff";
      thumbCtx.font = "900 44px Trebuchet MS, Arial";
      thumbCtx.textAlign = "center";
      thumbCtx.textBaseline = "middle";
      thumbCtx.fillText("BLAST", w / 2, 214);
    }
  });
}

drawThumbnails();
drawIdleCanvas();
