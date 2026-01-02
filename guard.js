// guard.js（フロント用・追加ファイル）
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.2.0/firebase-database.js";

export function createGuard(db, uid){
  let token = null;
  let tokenExp = 0;
  let lastCount = 0;
  let lastAt = Date.now();

  async function fetchToken(){
    const snap = await get(ref(db, "tokens/"+uid));
    if(!snap.exists()){
      const t = Math.random().toString(36).slice(2);
      const exp = Date.now() + 60_000; // 1分有効
      await set(ref(db,"tokens/"+uid), { t, exp });
      token = t; tokenExp = exp;
    } else {
      const v = snap.val();
      token = v.t;
      tokenExp = v.exp;
    }
  }

  async function secureSend(count){
    if(!token || Date.now()>tokenExp) await fetchToken();

    const now = Date.now();
    const dt = Math.max(1,(now-lastAt)/1000);
    const delta = count - lastCount;
    if(delta > dt*5){ // 1秒あたり上限5カウント
      await update(ref(db,"bans/"+uid), { at: now, reason:"speed" });
      localStorage.removeItem("uid");
      location.reload();
      return;
    }

    lastCount = count; lastAt = now;

    await update(ref(db,"scores/"+uid), {
      count, t: now, sig: token
    });
  }

  async function banCheck(){
    const s = await get(ref(db,"bans/"+uid));
    if(s.exists()){
      localStorage.removeItem("uid");
      location.reload();
    }
  }

  return { fetchToken, secureSend, banCheck };
}
