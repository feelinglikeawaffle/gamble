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

const reelPositions = [0,0,0]; // index in each strip

// Build 3 reels visually
function buildGrid() {
  gridEl.innerHTML = "";
  for (let r = 0; r < 3; r++) {
    const reel = document.createElement("div");
    reel.className = "reel";
    reel.id = "reel-" + r;

    // Fill with 3 visible symbols
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

// SPIN ANIMATION
async function spinReel(reelIndex, duration) {
  const strip = reelStrips[reelIndex];
  const reel = document.getElementById("reel-" + reelIndex);

  let start = performance.now();
  let lastUpdate = 0;

  return new Promise(resolve => {
    function animate(time) {
      const elapsed = time - start;

      if (elapsed - lastUpdate > 60) {
        reelPositions[reelIndex] = (reelPositions[reelIndex] + 1) % strip.length;
        lastUpdate = elapsed;

        // Update visible symbols
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

// GET FINAL GRID
function getFinalGrid() {
  let result = [];
  for (let r = 0; r < 3; r++) {
    const strip = reelStrips[r];
    const pos = reelPositions[r];
    result.push(strip[pos], strip[(pos+1)%strip.length], strip[(pos+2)%strip.length]);
  }
  return result;
}

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

function calculatePayout(grid, bet) {
  let win = 0;

  for (const line of paylines) {
    const a = grid[line[0]];
    const b = grid[line[1]];
    const c = grid[line[2]];

    if (a === b && b === c) {
      win += bet * payouts[a];
    }
  }

  return win;
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

  // Spin reels with staggered timing
  await spinReel(0, 1200);
  await spinReel(1, 1600);
  await spinReel(2, 2000);

  const finalGrid = getFinalGrid();
  const win = calculatePayout(finalGrid, bet);

  if (win > 0) {
    money += win;
    resultEl.textContent = `WIN: ${win}`;
  } else {
    resultEl.textContent = "LOSE";
  }

  moneyEl.textContent = "$" + money.toLocaleString();
  spinBtn.disabled = false;
});
