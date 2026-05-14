// --- Core state ---
let money = 1000;
let xp = 0;
let level = 1;
let day = 1;

const DAY_DURATION_SECONDS = 5 * 60; // 5 minutes
let remainingSeconds = DAY_DURATION_SECONDS;

let moneyAtDayStart = money;

// Simple XP curve: level n requires n * 1000 XP
function xpNeededForLevel(lvl) {
  return lvl * 1000;
}

// Games: minimal for now, but structured for expansion
const games = [
  {
    id: "blackjack",
    name: "Blackjack",
    minBet: 25,
    todayWagered: 0,
    yesterdayWagered: 0,
    unlockedAtLevel: 1
  },
  {
    id: "slots",
    name: "Slots",
    minBet: 10,
    todayWagered: 0,
    yesterdayWagered: 0,
    unlockedAtLevel: 1
  },
  {
    id: "crash",
    name: "Crash",
    minBet: 50,
    todayWagered: 0,
    yesterdayWagered: 0,
    unlockedAtLevel: 3
  }
];

let currentGameId = null;

// --- DOM refs ---
const moneyEl = document.getElementById("money");
const xpEl = document.getElementById("xp");
const levelEl = document.getElementById("level");
const dayEl = document.getElementById("day");
const timerEl = document.getElementById("timer");

const gamesListEl = document.getElementById("games-list");
const currentGameTitleEl = document.getElementById("current-game-title");
const betInputEl = document.getElementById("bet-amount");
const minBetLabelEl = document.getElementById("min-bet-label");
const playButtonEl = document.getElementById("play-button");
const resultMessageEl = document.getElementById("result-message");

const dayStartMoneyEl = document.getElementById("day-start-money");
const dayProfitEl = document.getElementById("day-profit");
const logEl = document.getElementById("log");

// --- Utility formatting ---
function formatMoney(value) {
  return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function log(message) {
  const entry = document.createElement("div");
  entry.className = "log-entry";
  const time = new Date().toLocaleTimeString();
  entry.innerHTML = `<span class="time">[${time}]</span>${message}`;
  logEl.prepend(entry);
}

// --- Rendering ---
function renderStats() {
  moneyEl.textContent = formatMoney(money);
  xpEl.textContent = xp.toLocaleString("en-US");
  levelEl.textContent = level;
  dayEl.textContent = day;
  timerEl.textContent = formatTimer(remainingSeconds);

  dayStartMoneyEl.textContent = formatMoney(moneyAtDayStart);
  const diff = money - moneyAtDayStart;
  const sign = diff >= 0 ? "+" : "-";
  dayProfitEl.textContent = `${sign}${formatMoney(Math.abs(diff))}`;
}

function renderGamesList() {
  gamesListEl.innerHTML = "";

  games.forEach(game => {
    if (level < game.unlockedAtLevel) return;

    const item = document.createElement("div");
    item.className = "game-item";
    if (game.id === currentGameId) item.classList.add("active");

    const nameSpan = document.createElement("span");
    nameSpan.className = "game-name";
    nameSpan.textContent = game.name;

    const metaSpan = document.createElement("span");
    metaSpan.className = "game-meta";
    metaSpan.textContent = `Min bet: ${formatMoney(game.minBet)}`;

    item.appendChild(nameSpan);
    item.appendChild(metaSpan);

    item.addEventListener("click", () => {
      selectGame(game.id);
    });

    gamesListEl.appendChild(item);
  });
}

function renderCurrentGame() {
  if (!currentGameId) {
    currentGameTitleEl.textContent = "Select a game";
    minBetLabelEl.textContent = "";
    playButtonEl.disabled = true;
    return;
  }

  const game = games.find(g => g.id === currentGameId);
  currentGameTitleEl.textContent = game.name;
  minBetLabelEl.textContent = `(Minimum bet: ${formatMoney(game.minBet)})`;
  playButtonEl.disabled = false;

  // Clamp bet input to at least min bet
  if (Number(betInputEl.value) < game.minBet) {
    betInputEl.value = game.minBet;
  }
  betInputEl.min = game.minBet;
}

// --- Game selection ---
function selectGame(gameId) {
  currentGameId = gameId;
  renderGamesList();
  renderCurrentGame();
  resultMessageEl.textContent = "";
  resultMessageEl.className = "result";
}

// --- Leveling ---
function checkLevelUp() {
  let needed = xpNeededForLevel(level);
  let leveledUp = false;

  while (xp >= needed) {
    xp -= needed;
    level += 1;
    leveledUp = true;
    needed = xpNeededForLevel(level);
  }

  if (leveledUp) {
    log(`Level up! You are now level ${level}.`);
    renderGamesList();
  }
}

// --- End of day logic ---
function endOfDay() {
  const profit = money - moneyAtDayStart;
  if (profit > 0) {
    xp += profit;
    log(`Day ${day} ended. You earned ${formatMoney(profit)} → ${profit.toLocaleString()} XP.`);
    checkLevelUp();
  } else if (profit < 0) {
    log(`Day ${day} ended. You lost ${formatMoney(Math.abs(profit))}. No XP gained.`);
  } else {
    log(`Day ${day} ended. Broke even. No XP gained.`);
  }

  // Update min bets based on todayWagered
  games.forEach(game => {
    game.yesterdayWagered = game.todayWagered;

    if (game.todayWagered > 0) {
      // Simple inflation: +1% min bet per 500 wagered, capped at +100% per day
      const factor = Math.min(1 + game.todayWagered / 50000, 2);
      const oldMin = game.minBet;
      game.minBet = Math.max(1, Math.round(game.minBet * factor));
      log(
        `${game.name} min bet changed from ${formatMoney(oldMin)} to ${formatMoney(
          game.minBet
        )} (wagered ${formatMoney(game.todayWagered)} today).`
      );
    } else {
      // Light decay if untouched: min bet drifts 10% back toward 10
      const target = 10;
      const diff = game.minBet - target;
      game.minBet = Math.round(game.minBet - diff * 0.1);
    }

    game.todayWagered = 0;
  });

  day += 1;
  remainingSeconds = DAY_DURATION_SECONDS;
  moneyAtDayStart = money;

  renderStats();
  renderGamesList();
  renderCurrentGame();
}

// --- Timer ---
setInterval(() => {
  if (remainingSeconds <= 0) {
    endOfDay();
  } else {
    remainingSeconds -= 1;
    timerEl.textContent = formatTimer(remainingSeconds);
  }
}, 1000);

// --- Playing games (very simple odds for now) ---
function playCurrentGame() {
  if (!currentGameId) return;

  const game = games.find(g => g.id === currentGameId);
  let bet = Number(betInputEl.value);

  if (!Number.isFinite(bet) || bet <= 0) {
    resultMessageEl.textContent = "Enter a valid bet.";
    resultMessageEl.className = "result";
    return;
  }

  if (bet < game.minBet) {
    resultMessageEl.textContent = `Bet must be at least ${formatMoney(game.minBet)}.`;
    resultMessageEl.className = "result";
    return;
  }

  if (bet > money) {
    resultMessageEl.textContent = "You don't have enough money for that bet.";
    resultMessageEl.className = "result";
    return;
  }

  // Deduct bet
  money -= bet;
  game.todayWagered += bet;

  // Simple per-game odds
  let winChance;
  let payoutMultiplier;

  switch (game.id) {
    case "blackjack":
      winChance = 0.47;
      payoutMultiplier = 2.0;
      break;
    case "slots":
      winChance = 0.42;
      payoutMultiplier = 3.0;
      break;
    case "crash":
      winChance = 0.35;
      payoutMultiplier = 3.5;
      break;
    default:
      winChance = 0.5;
      payoutMultiplier = 2.0;
  }

  const roll = Math.random();
  if (roll < winChance) {
    const winnings = Math.round(bet * payoutMultiplier);
    money += winnings;
    resultMessageEl.textContent = `You won ${formatMoney(winnings - bet)}!`;
    resultMessageEl.className = "result win";
    log(`Won ${formatMoney(winnings - bet)} on ${game.name} (bet ${formatMoney(bet)}).`);
  } else {
    resultMessageEl.textContent = `You lost ${formatMoney(bet)}.`;
    resultMessageEl.className = "result lose";
    log(`Lost ${formatMoney(bet)} on ${game.name}.`);
  }

  renderStats();
}

// --- Event wiring ---
playButtonEl.addEventListener("click", playCurrentGame);

// Initial render
renderStats();
renderGamesList();
// Auto-select first unlocked game
const firstUnlocked = games.find(g => level >= g.unlockedAtLevel);
if (firstUnlocked) selectGame(firstUnlocked.id);
