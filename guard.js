import { ref, get, set, remove, update } from "https://www.gstatic.com/firebasejs/10.2.0/firebase-database.js";

export function createGuard(db, uid) {
  let token = null;
  let tokenExp = 0;
  let lastCount = localStorage.countVal ? parseFloat(localStorage.countVal) : 0;
  let lastAt = Date.now();

  // トークン（署名）の取得
  async function fetchToken() {
    try {
      const s = await get(ref(db, "tokens/" + uid));
      if (!s.exists()) {
        token = Math.random().toString(36).slice(2);
        tokenExp = Date.now() + 60000;
        await set(ref(db, "tokens/" + uid), { t: token, exp: tokenExp });
      } else {
        token = s.val().t;
        tokenExp = s.val().exp;
      }
    } catch (e) { console.error(e); }
  }

  // 不正検知時の処理
  async function ban(reason) {
    await set(ref(db, "bans/" + uid), { at: Date.now(), reason: reason });
    await remove(ref(db, "scores/" + uid));
    localStorage.removeItem("uid");
    localStorage.removeItem("countVal");
    alert("不正な操作を検知しました。");
    location.reload();
  }

  // スコアの安全な送信
  async function secureSend(count) {
    if (!token || Date.now() > tokenExp) await fetchToken();

    const now = Date.now();
    const dt = Math.max(0.1, (now - lastAt) / 1000);
    const delta = count - lastCount;

    // 1秒間に5以上増えていたらBAN（加速ツール対策）
    if (delta > dt * 5) {
      await ban("speed_hack");
      return;
    }

    lastCount = count;
    lastAt = now;

    await update(ref(db, "scores/" + uid), {
      count: Math.floor(count),
      t: now,
      sig: token
    });
  }

  // 放置加算などの数値ジャンプを許可する
  function sync(newCount) {
    lastCount = newCount;
    lastAt = Date.now();
  }

  // 起動時のBANチェック
  async function banCheck() {
    const s = await get(ref(db, "bans/" + uid));
    if (s.exists()) {
      localStorage.removeItem("uid");
      localStorage.removeItem("countVal");
      document.body.innerHTML = "<h1 style='color:white;text-align:center;margin-top:20%'>Access Denied</h1>";
      return true;
    }
    return false;
  }

  return { secureSend, banCheck, sync };
}
