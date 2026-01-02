// guard.js（フロント専用・最終強化）
import { ref, get, set, update, remove } from "https://www.gstatic.com/firebasejs/10.2.0/firebase-database.js";

export function createGuard(db, uid){
  let token=null, tokenExp=0;
  let lastCount=0, lastAt=Date.now();

  async function fetchToken(){
    const s = await get(ref(db,"tokens/"+uid));
    if(!s.exists()){
      token = Math.random().toString(36).slice(2);
      tokenExp = Date.now()+60000;
      await set(ref(db,"tokens/"+uid),{t:token,exp:tokenExp});
    }else{
      token=s.val().t; tokenExp=s.val().exp;
    }
  }

  async function ban(reason){
    await set(ref(db,"bans/"+uid),{at:Date.now(),reason});
    await remove(ref(db,"scores/"+uid));   // ランキングから抹消
    await remove(ref(db,"tokens/"+uid));
    localStorage.removeItem("uid");
    location.reload();
  }

  async function secureSend(count){
    if(!token || Date.now()>tokenExp) await fetchToken();

    const now=Date.now();
    const dt=Math.max(1,(now-lastAt)/1000);
    const delta=count-lastCount;

    if(delta>dt*5){ // 異常増加
      await ban("speed");
      return;
    }

    lastCount=count; lastAt=now;

    await update(ref(db,"scores/"+uid),{
      count, t:now, sig:token
    });
  }

  async function banCheck(){
    const s = await get(ref(db,"bans/"+uid));
    if(s.exists()){
      await remove(ref(db,"scores/"+uid));
      localStorage.removeItem("uid");
      location.reload();
    }
  }

  return { fetchToken, secureSend, banCheck };
}
