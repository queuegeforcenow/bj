let user = null;
let money = 0;
let lastWorkTime = 0;

function login() {
  const id = document.getElementById("user-id").value;
  const pass = document.getElementById("user-pass").value;

  if (!id || !pass) return alert("IDとパスワードを入力してください");

  user = { id, pass };
  money = parseInt(localStorage.getItem(`${id}_money`)) || 1000;
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

// ここにブラックジャックロジック追加予定
function startGame() {
  alert("ブラックジャックゲーム開始（あとで実装）");
}
