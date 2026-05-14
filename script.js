let money = 1000;
const moneyEl = document.getElementById("money");
const resultEl = document.getElementById("result");
const gridEl = document.getElementById("slot-grid");
const spinBtn = document.getElementById("spin-btn");

// REAL REEL STRIPS
const reelStrips = [
  ["🍒","🍋","🔔","⭐","🍒","🍋","💎","🍋","🍒","🔔"],
  ["🍋","🍒","⭐","🍋","🔔","🍒","💎","🍋","⭐","🍒"],
  ["🔔","🍒","🍋","⭐","🍋","💎","🍒","🔔","🍋","⭐"]
];

const reelPositions = [0,0,0];

// Build initial grid
function buildGrid() {
  gridEl.innerHTML = "";
  for (let r = 0; r < 3; r++) {
    const reel = document.createElement("div");
    reel.className = "reel";
    reel.id = "reel-" + r;

    for (let i = 0; i < 3; i++) {
      const cell = document.createElement("div");
      cell.className = "slot-cell";
      cell.textContent = reelStrips[r][(reelPositions[r] + i) % reelStrips[r].length];
      reel.appendChild(cell);
    }

    gridEl.appendChild(reel);
  }
}

buildGrid();

// FAST SPIN (40ms updates)
async function spinReel(reelIndex, duration) {
  const strip = reelStrips[reelIndex];
  const reel = document.getElementById("reel-" + reelIndex);

  let start = performance.now();
  let lastUpdate = 0;

  return new Promise(resolve => {
    function animate(time) {
      const elapsed = time - start;

      if (elapsed - lastUpdate > 40) {
        reelPositions[reelIndex] = (reelPositions[reelIndex] + 1) % strip.length;
        lastUpdate = elapsed;

        reel.innerHTML = "";
        for (let i = 0; i < 3; i++) {
          const cell = document.createElement("div");
          cell.className = "slot-cell";
          cell.textContent = strip[(reelPositions[reelIndex] + i) % strip.length];
          reel.appendChild(cell);
        }
      }

      if (elapsed < duration) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

function getFinalGrid() {
  let result = [];
  for (let r = 0; r < 3; r++) {
    const strip = reelStrips[r];
    const pos = reelPositions[r];
    result.push(strip[pos], strip[(pos+1)%strip.length], strip[(pos+2)%strip.length]);
  }
  return result;
}

// Highlight winning cells
function highlightCells(indices) {
  const cells = [...document.querySelectorAll(".slot-cell")];
  indices.forEach(i => cells[i].classList.add("win-cell"));
}

// YOUR CUSTOM SCORING SYSTEM
function scoreCustom(grid, bet) {
  let bonus = 0;
  let breakdown = [];
  let highlightGroups = [];

  const get = i => grid[i];

  // --- 1. 3-in-a-row (1.5x each) ---
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

  // --- 2. 2×2 squares (2x each) ---
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

  // --- 3. Connected component detection ---
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

  // --- 6-tile rectangle (5x) ---
  if (largestGroup === 6) {
    bonus += 5;
    breakdown.push(`6-tile rectangle → +5×`);
  }

  // --- 8-tile match (7x) ---
  if (largestGroup === 8) {
    bonus += 7;
    breakdown.push(`8-tile match → +7×`);
  }

  // --- 9-tile match (15x) ---
  if (largestGroup === 9) {
    bonus += 15;
    breakdown.push(`FULL BOARD MATCH → +15×`);
  }

  // Final multiplier
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

// SPIN BUTTON
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

  // Clear old highlights
  document.querySelectorAll(".slot-cell").forEach(c => c.classList.remove("win-cell"));

  // FAST staggered spin
  await spinReel(0, 300);
  await spinReel(1, 450);
  await spinReel(2, 600);

  const finalGrid = getFinalGrid();
  const score = scoreCustom(finalGrid, bet);

  // Highlight all groups
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
