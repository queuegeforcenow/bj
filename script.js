let user = null;
let money = 0;
let lastWorkTime = 0;

let deck = [];
let playerCards = [];
let cpuCards = [];
let gameInProgress = false;
let betAmount = 0;

function login() {
  const id = document.getElementById("user-id").value.trim();
  const pass = document.getElementById("user-pass").value.trim();

  if (!id || !pass) return alert("IDとパスワードを入力してください");

  user = { id, pass };

  // 初回なら1000円付与、2回目以降は保存データ取得
  if (!localStorage.getItem(`${id}_money`)) {
    money = 1000;
  } else {
    money = parseInt(localStorage.getItem(`${id}_money`), 10) || 1000;
  }
  lastWorkTime = parseInt(localStorage.getItem(`${id}_lastWork`)) || 0;

  document.getElementById("auth").style.display = "none";
  document.getElementById("game").style.display = "block";
  document.getElementById("username").textContent = user.id;
  updateMoney();
  checkCooldown();
}

function updateMoney() {
  document.getElementById("money").textContent = money;
  localStorage.setItem(`${user.id}_money`, money);
}

function claimWork() {
  if (!user) return alert("ログインしてください");

  const now = Date.now();
  if (now - lastWorkTime < 60 * 60 * 1000) {
    alert("1時間ごとに1回だけworkできます。");
    return;
  }

  const reward = Math.floor(Math.random() * 4800) + 200;
  money += reward;
  lastWorkTime = now;
  localStorage.setItem(`${user.id}_lastWork`, now);
  updateMoney();
  alert(`work成功！ ¥${reward} 獲得`);
  checkCooldown();
}

function checkCooldown() {
  if (!user) return;

  const now = Date.now();
  const remaining = Math.max(0, 60 * 60 * 1000 - (now - lastWorkTime));
  const cooldown = document.getElementById("cooldown");
  if (remaining > 0) {
    const mins = Math.floor(remaining / 60000);
    cooldown.textContent = `次のworkまで: ${mins}分`;
  } else {
    cooldown.textContent = "💼 workできます！";
  }
}

// ------------- ブラックジャックロジック ---------------

// トランプのデッキ作成
function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const values = [
    "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K",
  ];
  let d = [];
  for (const suit of suits) {
    for (const value of values) {
      d.push({ suit, value });
    }
  }
  return d;
}

// デッキをシャッフル
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// カードの点数計算（Aは1または11）
function calculatePoints(cards) {
  let sum = 0;
  let aceCount = 0;
  for (const c of cards) {
    if (c.value === "A") {
      aceCount++;
      sum += 11;
    } else if (["J", "Q", "K"].includes(c.value)) {
      sum += 10;
    } else {
      sum += Number(c.value);
    }
  }
  // Aの調整
  while (sum > 21 && aceCount > 0) {
    sum -= 10;
    aceCount--;
  }
  return sum;
}

// カードを画面に表示（アニメーション付き）
function renderCards(cards, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  cards.forEach((card, i) => {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";
    cardDiv.style.animationDelay = `${i * 0.1}s`; // アニメーション遅延
    cardDiv.innerHTML = `
      <div>${card.value}</div>
      <div style="text-align:center; font-size:1.5rem;">${card.suit}</div>
      <div style="text-align:right;">${card.value}</div>
    `;
    container.appendChild(cardDiv);
  });
}

// ゲーム開始
function startGame() {
  if (gameInProgress) return alert("ゲーム進行中です");

  betAmount = parseInt(document.getElementById("bet").value, 10);

  if (betAmount > money) return alert("所持金が足りません。");

  money -= betAmount;
  updateMoney();

  deck = shuffle(createDeck());
  playerCards = [];
  cpuCards = [];
  gameInProgress = true;
  document.getElementById("result").textContent = "";
  document.getElementById("actions").style.display = "block";

  // 配る（2枚ずつ）
  playerCards.push(deck.pop());
  cpuCards.push(deck.pop());
  playerCards.push(deck.pop());
  cpuCards.push(deck.pop());

  renderCards(playerCards, "player-cards");
  renderCards(cpuCards.map((c, i) => i === 0 ? c : { suit: "?", value: "?" }), "cpu-cards"); // CPUの2枚目は伏せる

  const playerPoints = calculatePoints(playerCards);
  if (playerPoints === 21) {
    // ブラックジャック即勝ち
    endGame("blackjack");
  }
}

// ヒット（カードを引く）
function hit() {
  if (!gameInProgress) return;
  playerCards.push(deck.pop());
  renderCards(playerCards, "player-cards");

  const points = calculatePoints(playerCards);
  if (points > 21) {
    // バースト負け
    endGame("bust");
  } else if (points === 21) {
    stand();
  }
}

// スタンド（ターン終了、CPUのターン）
function stand() {
  if (!gameInProgress) return;
  document.getElementById("actions").style.display = "none";

  // CPUの伏せてるカードを公開
  renderCards(cpuCards, "cpu-cards");

  let cpuPoints = calculatePoints(cpuCards);
  while (cpuPoints < 17) {
    cpuCards.push(deck.pop());
    renderCards(cpuCards, "cpu-cards");
    cpuPoints = calculatePoints(cpuCards);
  }

  const playerPoints = calculatePoints(playerCards);

  if (cpuPoints > 21) {
    endGame("cpu_bust");
  } else if (cpuPoints === playerPoints) {
    endGame("draw");
  } else if (cpuPoints > playerPoints) {
    endGame("lose");
  } else {
    endGame("win");
  }
}

// ゲーム終了処理
function endGame(result) {
  gameInProgress = false;
  const resText = document.getElementById("result");

  switch (result) {
    case "blackjack":
      money += betAmount * 2.5;
      resText.textContent = "ブラックジャック！あなたの勝ちです！";
      break;
    case "bust":
      resText.textContent = "バースト！あなたの負けです。";
      break;
    case "cpu_bust":
      money += betAmount * 2;
      resText.textContent = "CPUがバースト！あなたの勝ちです！";
      break;
    case "win":
      money += betAmount * 2;
      resText.textContent = "あなたの勝ちです！";
      break;
    case "lose":
      resText.textContent = "あなたの負けです。";
      break;
    case "draw":
      money += betAmount;
      resText.textContent = "引き分けです。掛け金が返却されました。";
      break;
  }
  updateMoney();
  document.getElementById("actions").style.display = "none";
}

