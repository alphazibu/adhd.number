// guard.js（新規ファイル・フロント用）
(() => {
  const UID_KEY = "uid";
  const FLAG_KEY = "cheatFlag";
  const LAST_SEND = "lastSend";
  const MAX_JUMP = 5000;      // 1送信で許容する最大増分
  const MIN_INTERVAL = 800;  // 送信間隔(ms)

  const uid = localStorage.getItem(UID_KEY);
  if (!uid) return;

  // BAN確認（即時）
  fetch(`https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/banCheck?uid=${uid}`)
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(j => {
      if (j.banned) hardBan();
    })
    .catch(()=>{});

  // 送信前ガード（index側から window.safeSend を使う）
  window.safeSend = (count) => {
    const now = Date.now();
    const last = Number(localStorage.getItem(LAST_SEND) || 0);
    if (now - last < MIN_INTERVAL) flag();

    const prev = Number(sessionStorage.prevCount || 0);
    if (count - prev > MAX_JUMP) flag();

    sessionStorage.prevCount = count;
    localStorage.setItem(LAST_SEND, now);

    if (localStorage.getItem(FLAG_KEY) === "1") {
      report(uid, "client_detect");
      hardBan();
      return false;
    }
    return true;
  };

  function flag(){
    localStorage.setItem(FLAG_KEY, "1");
  }

  function report(uid, reason){
    fetch(`https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/reportCheat`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ uid, reason, t:Date.now() })
    }).catch(()=>{});
  }

  function hardBan(){
    localStorage.removeItem(UID_KEY);
    localStorage.removeItem(FLAG_KEY);
    sessionStorage.clear();
    location.reload();
  }
})();
