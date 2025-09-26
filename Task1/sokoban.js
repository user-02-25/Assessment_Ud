const gameElement = document.getElementById("game");
const movesElement = document.getElementById("moves");
const timeElement = document.getElementById("time");
const undoBtn = document.getElementById("undoBtn");

const originalMap = [
  "#######",
  "#.....#",
  "#.P.BT#",
  "#.....#",
  "#..B..#",
  "#..T..#",
  "#######",
].map((row) => row.split(""));

let map;
let targets;
let moves = 0;
let startTime;
let timer;
let moveHistory = [];

function initGame() {
  // reset map and targets
  map = originalMap.map((row) => [...row]);
  targets = [];
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === "T") targets.push({ x, y });
    }
  }

  moves = 0;
  moveHistory = [];
  startTime = Date.now();

  updateUI();
  draw();
  startTimer();
}

function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timeElement.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }, 1000);
}

function updateUI() {
  movesElement.textContent = moves;
  undoBtn.disabled = moveHistory.length === 0;
}

function draw() {
  gameElement.innerHTML = "";

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      const isTarget = targets.some((t) => t.x === x && t.y === y);
      const cellType = map[y][x];

      if (cellType === "#") {
        cell.classList.add("wall");
      } else if (cellType === "P") {
        cell.classList.add("player");
        if (!isTarget) cell.classList.add("floor");
      } else if (cellType === "B") {
        cell.classList.add("box");
        if (isTarget) cell.classList.add("on-target");
        if (!isTarget) cell.classList.add("floor");
      } else if (cellType === "T") {
        cell.classList.add("target");
      } else {
        cell.classList.add("floor");
        if (isTarget) cell.classList.add("target");
      }

      gameElement.appendChild(cell);
    }
  }
}

function findPlayer() {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === "P") return { x, y };
    }
  }
}

function move(dx, dy) {
  const { x, y } = findPlayer();
  const newX = x + dx;
  const newY = y + dy;

  if (newY < 0 || newY >= map.length || newX < 0 || newX >= map[0].length)
    return;

  const nextCell = map[newY][newX];
  const afterNext = map[newY + dy]?.[newX + dx];

  const currentState = {
    map: map.map((row) => [...row]),
    moves: moves,
  };

  let moved = false;

  if (nextCell === "#") return;

  if (nextCell === "B") {
    if (
      newY + dy >= 0 &&
      newY + dy < map.length &&
      newX + dx >= 0 &&
      newX + dx < map[0].length &&
      (afterNext === "." || afterNext === "T")
    ) {
      map[newY + dy][newX + dx] = "B"; // move box
      map[newY][newX] = "P"; // player moves
      map[y][x] = restoreCell(x, y);
      moved = true;
    }
  } else if (nextCell === "." || nextCell === "T") {
    map[newY][newX] = "P";
    map[y][x] = restoreCell(x, y);
    moved = true;
  }

  if (moved) {
    moveHistory.push(currentState);
    moves++;
    updateUI();
    draw();

    if (checkWin()) {
      clearInterval(timer);

      const elapsed = Math.floor((Date.now() - startTime) / 1000);

      setTimeout(showWinModal, 300);
      saveScore(moves, elapsed);
    }
  }
}

function restoreCell(x, y) {
  return targets.some((t) => t.x === x && t.y === y) ? "T" : ".";
}

function checkWin() {
  return targets.every((t) => map[t.y][t.x] === "B");
}
function showWinModal() {
  const modal = document.getElementById("winModal");
  const message = document.getElementById("winMessage");

  message.textContent = `You won in ${moves} moves and ${timeElement.textContent}!`;
  modal.style.display = "flex";
}

function closeWinModal() {
  document.getElementById("winModal").style.display = "none";
  restartGame();
}

function undoMove() {
  if (moveHistory.length > 0) {
    const previousState = moveHistory.pop();
    map = previousState.map;
    moves = previousState.moves;
    updateUI();
    draw();
  }
}

function restartGame() {
  clearInterval(timer);
  initGame();
}
document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp":
      move(0, -1);
      break;
    case "ArrowDown":
      move(0, 1);
      break;
    case "ArrowLeft":
      move(-1, 0);
      break;
    case "ArrowRight":
      move(1, 0);
      break;
    case "u":
    case "U":
      undoMove();
      break;
    case "r":
    case "R":
      restartGame();
      break;
  }
});

initGame();
