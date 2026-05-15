let money = 1000;
const moneyEl = document.getElementById("money");
const resultEl = document.getElementById("result");
const gridEl = document.getElementById("slot-grid");
const spinBtn = document.getElementById("spin-btn");

// All possible symbols
const SYMBOLS = ["🍒","🍋","🔔","⭐","💎"];

// Build initial empty grid
function buildGrid() {
  gridEl.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "slot-cell";
    cell.textContent = "❔";
    gridEl.appendChild(cell);
  }
}
buildGrid();

// Highlight winning cells
function highlightCells(indices) {
  const cells = [...document.querySelectorAll(".slot-cell")];
  indices.forEach(i => cells[i].classList.add("win-cell"));
}

// Random symbol
function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

// --- BOOSTED HIDDEN ODDS ---
function rollHiddenOutcome() {
  const roll = Math.random() * 100;

  if (roll < 3) return "full9";
  if (roll < 8) return "match8";
  if (roll < 18) return "rect6";
  if (roll < 33) return "square4";
  if (roll < 55) return "line3";

  return "none";
}

// --- PATTERN FORCERS ---
function randomSymbolDifferent(s) {
  let r = s;
  while (r === s) r = randomSymbol();
  return r;
}

function forceFull9() {
  const s = randomSymbol();
  return Array(9).fill(s);
}

function forceMatch8() {
  const s = randomSymbol();
  const grid = Array(9).fill(s);
  const missing = Math.floor(Math.random() * 9);
  grid[missing] = randomSymbolDifferent(s);
  return grid;
}

function forceRect6() {
  const s = randomSymbol();
  const patterns = [
    [0,1,2,3,4,5],
    [3,4,5,6,7,8],
    [0,3,6,1,4,7],
    [1,4,7,2,5,8]
  ];
  const pick = patterns[Math.floor(Math.random()*patterns.length)];
  const grid = Array(9).fill(randomSymbol());
  pick.forEach(i => grid[i] = s);
  return grid;
}

function forceSquare4() {
  const s = randomSymbol();
  const squares = [
    [0,1,3,4],
    [1,2,4,5],
    [3,4,6,7],
    [4,5,7,8]
  ];
  const sq = squares[Math.floor(Math.random()*squares.length)];
  const grid = Array(9).fill(randomSymbol());
  sq.forEach(i => grid[i] = s);
  return grid;
}

function forceLine3() {
  const s = randomSymbol();
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  const line = lines[Math.floor(Math.random()*lines.length)];
  const grid = Array(9).fill(randomSymbol());
  line.forEach(i => grid[i] = s);
  return grid;
}

// --- CUSTOM SCORING SYSTEM ---
function scoreCustom(grid, bet) {
  let bonus = 0;
  let breakdown = [];
  let highlightGroups = [];

  const get = i => grid[i];

  // 3-in-a-row
  const lines = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];

  lines.forEach(line => {
    if (get(line[0]) === get(line[1]) && get(line[1]) === get(line[2])) {
      bonus += 1.5;
      breakdown.push(`3-in-a-row (${get(line[0])}) → +1.5×`);
      highlightGroups.push(line);
    }
  });

  // 2×2 squares
  const squares = [
    [0,1,3,4],
    [1,2,4,5],
    [3,4,6,7],
    [4,5,7,8]
  ];

  squares.forEach(sq => {
    if (get(sq[0]) === get(sq[1]) &&
        get(sq[1]) === get(sq[2]) &&
        get(sq[2]) === get(sq[3])) {
      bonus += 2;
      breakdown.push(`2×2 square (${get(sq[0])}) → +2×`);
      highlightGroups.push(sq);
    }
  });

  // Connected component detection
  function floodFill(start) {
    const target = get(start);
    let visited = new Set([start]);
    let queue = [start];

    while (queue.length) {
      const i = queue.pop();
      const neighbors = [];

      if (i % 3 !== 0) neighbors.push(i - 1);
      if (i % 3 !== 2) neighbors.push(i + 1);
      if (i > 2)        neighbors.push(i - 3);
      if (i < 6)        neighbors.push(i + 3);

      neighbors.forEach(n => {
        if (!visited.has(n) && get(n) === target) {
          visited.add(n);
          queue.push(n);
        }
      });
    }

    return visited;
  }

  let largestGroup = 0;
  let counted = new Set();

  for (let i = 0; i < 9; i++) {
    if (!counted.has(i)) {
      const group = floodFill(i);
      group.forEach(x => counted.add(x));
      largestGroup = Math.max(largestGroup, group.size);
    }
  }

  if (largestGroup === 6) {
    bonus += 5;
    breakdown.push(`6-tile rectangle → +5×`);
  }

  if (largestGroup === 8) {
    bonus += 7;
    breakdown.push(`8-tile match → +7×`);
  }

  if (largestGroup === 9) {
    bonus += 15;
    breakdown.push(`FULL BOARD MATCH → +15×`);
  }

  const finalMultiplier = 1 + bonus;
  const totalWin = bet * finalMultiplier;

  return {
    bonus,
    finalMultiplier,
    breakdown,
    totalWin,
    highlightGroups
  };
}

// --- SPIN ANIMATION (PURE RANDOM) ---
async function spinAnimation(finalGrid) {
  const cells = document.querySelectorAll(".slot-cell");

  // Spin for 600ms
  const spinTime = 600;
  const start = performance.now();

  return new Promise(resolve => {
    function animate(time) {
      const elapsed = time - start;

      // While spinning: show random symbols
      if (elapsed < spinTime) {
        cells.forEach(c => c.textContent = randomSymbol());
        requestAnimationFrame(animate);
      } else {
        // Stop: show finalGrid
        for (let i = 0; i < 9; i++) {
          cells[i].textContent = finalGrid[i];
        }
        resolve();
      }
    }
    requestAnimationFrame(animate);
  });
}

// --- SPIN BUTTON ---
spinBtn.addEventListener("click", async () => {
  const bet = Number(document.getElementById("bet").value);
  if (bet <= 0 || bet > money) {
    resultEl.textContent = "Invalid bet";
    return;
  }

  money -= bet;
  moneyEl.textContent = "$" + money.toLocaleString();
  resultEl.textContent = "";
  spinBtn.disabled = true;

  document.querySelectorAll(".slot-cell").forEach(c => c.classList.remove("win-cell"));

  // 1. Decide final grid BEFORE spinning
  const outcome = rollHiddenOutcome();
  let finalGrid;

  switch (outcome) {
    case "full9": finalGrid = forceFull9(); break;
    case "match8": finalGrid = forceMatch8(); break;
    case "rect6": finalGrid = forceRect6(); break;
    case "square4": finalGrid = forceSquare4(); break;
    case "line3": finalGrid = forceLine3(); break;
    default:
      // Pure random 3×3 grid
      finalGrid = Array(9).fill(0).map(() => randomSymbol());
      break;
  }

  // 2. Spin animation INTO finalGrid
  await spinAnimation(finalGrid);

  // 3. Score
  const score = scoreCustom(finalGrid, bet);

  score.highlightGroups.forEach(group => highlightCells(group));

  if (score.totalWin > bet) {
    money += score.totalWin;
    resultEl.textContent =
      `WIN: ${score.totalWin}\n\n` +
      score.breakdown.join("\n");
  } else {
    resultEl.textContent = "LOSE";
  }

  moneyEl.textContent = "$" + money.toLocaleString();
  spinBtn.disabled = false;
});
