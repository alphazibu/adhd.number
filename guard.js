// guard.js
export function createGuard(db, uid) {
  let lastCount = localStorage.countVal ? parseFloat(localStorage.countVal) : 0;
  let lastAt = Date.now();

  // スコアの異常増加をチェックする関数
  async function secureSend(count) {
    const now = Date.now();
    const dt = Math.max(0.1, (now - lastAt) / 1000);
    const delta = count - lastCount;

    // 1秒間に50以上増えていたら警告（デバッグ用に少し緩め）
    if (delta > dt * 50) {
      console.warn("異常なスコア増加を検知しました");
      return;
    }

    lastCount = count;
    lastAt = now;
    // Firebaseが設定されていればここに保存処理を書く
  }

  // 放置加算などで数値が飛ぶときに、監視の基準点を更新する
  function sync(newCount) {
    lastCount = newCount;
    lastAt = Date.now();
  }

  // BANされているかチェック（今回は常にfalse）
  async function banCheck() {
    return false;
  }

  return { secureSend, banCheck, sync };
}
