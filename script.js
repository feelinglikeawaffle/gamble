let money = 1000;
const moneyEl = document.getElementById("money");
const resultEl = document.getElementById("result");
const gridEl = document.getElementById("slot-grid");
const spinBtn = document.getElementById("spin-btn");

// --- SYMBOLS WITH WEIGHTS + MULTIPLIERS ---
const symbols = [
  { icon: "🍒", weight: 40, payout: 5 },
  { icon: "🍋", weight: 30, payout: 8 },
  { icon: "🔔", weight: 20, payout: 15 },
  { icon: "⭐", weight: 8, payout: 40 },
  { icon: "💎", weight: 2, payout: 100 }
];

// Build weighted pool
let weightedPool = [];
symbols.forEach(s => {
  for (let i = 0; i < s.weight; i++) weightedPool.push(s);
});

// --- PAYLINES (3x3) ---
const paylines = [
  [0,1,2],   // top row
  [3,4,5],   // middle row
  [6,7,8],   // bottom row
  [0,4,8],   // diagonal TL → BR
  [2,4,6]    // diagonal TR → BL
];

// --- INITIAL GRID ---
let grid = Array(9).fill("❔");
renderGrid();

// --- RENDER ---
function renderGrid() {
  gridEl.innerHTML = "";
  grid.forEach(symbol => {
    const cell = document.createElement("div");
    cell.className = "slot-cell";
    cell.textContent = symbol;
    gridEl.appendChild(cell);
  });
}

// --- RANDOM SYMBOL ---
function randomSymbol() {
  return weightedPool[Math.floor(Math.random() * weightedPool.length)];
}

// --- SPIN ANIMATION ---
async function spinReels() {
  spinBtn.disabled = true;
  resultEl.textContent = "";

  // Reel-by-reel animation
  for (let r = 0; r < 3; r++) {
    for (let t = 0; t < 10; t++) {
      for (let row = 0; row < 3; row++) {
        const index = row * 3 + r;
        grid[index] = randomSymbol().icon;
      }
      renderGrid();
      await new Promise(res => setTimeout(res, 60));
    }
  }

  // Final result
  for (let i = 0; i < 9; i++) {
    grid[i] = randomSymbol().icon;
  }
  renderGrid();

  spinBtn.disabled = false;
}

// --- PAYOUT CALC ---
function calculatePayout(bet) {
  let totalWin = 0;

  paylines.forEach(line => {
    const a = grid[line[0]];
    const b = grid[line[1]];
    const c = grid[line[2]];

    if (a === b && b === c) {
      const symbol = symbols.find(s => s.icon === a);
      totalWin += bet * symbol.payout;
    }
  });

  return totalWin;
}

// --- SPIN BUTTON ---
spinBtn.addEventListener("click", async () => {
  const bet = Number(document.getElementById("bet").value);

  if (bet <= 0 || bet > money) {
    resultEl.textContent = "Invalid bet.";
    return;
  }

  money -= bet;
  updateMoney();

  await spinReels();

  const win = calculatePayout(bet);

  if (win > 0) {
    money += win;
    resultEl.textContent = `WIN: ${win}`;
  } else {
    resultEl.textContent = `LOSE`;
  }

  updateMoney();
});

function updateMoney() {
  moneyEl.textContent = "$" + money.toLocaleString();
}
