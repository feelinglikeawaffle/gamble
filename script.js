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

// PAYLINES
const paylines = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,4,8], [2,4,6]
];

// PAYOUT TABLE
const payouts = {
  "🍒": 5,
  "🍋": 8,
  "🔔": 15,
  "⭐": 40,
  "💎": 100
};

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

// FAST SPIN (150–250ms)
async function spinReel(reelIndex, duration) {
  const strip = reelStrips[reelIndex];
  const reel = document.getElementById("reel-" + reelIndex);

  let start = performance.now();
  let lastUpdate = 0;

  return new Promise(resolve => {
    function animate(time) {
      const elapsed = time - start;

      if (elapsed - lastUpdate > 40) { // FAST
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

function highlightCells(indices) {
  const cells = [...document.querySelectorAll(".slot-cell")];
  indices.forEach(i => cells[i].classList.add("win-cell"));
}

function calculatePayout(grid, bet) {
  let win = 0;
  let breakdown = [];

  paylines.forEach(line => {
    const a = grid[line[0]];
    const b = grid[line[1]];
    const c = grid[line[2]];

    if (a === b && b === c) {
      const mult = payouts[a];
      const amount = bet * mult;
      win += amount;

      breakdown.push({
        symbol: a,
        line,
        multiplier: mult,
        amount
      });
    }
  });

  return { win, breakdown };
}

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
  const { win, breakdown } = calculatePayout(finalGrid, bet);

  if (win > 0) {
    money += win;

    let text = `WIN: ${win}\n`;

    breakdown.forEach(b => {
      highlightCells(b.line);
      text += `${b.symbol} line → ${bet} × ${b.multiplier} = ${b.amount}\n`;
    });

    resultEl.textContent = text;
  } else {
    resultEl.textContent = "LOSE";
  }

  moneyEl.textContent = "$" + money.toLocaleString();
  spinBtn.disabled = false;
});
