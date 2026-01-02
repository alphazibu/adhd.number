<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Focus Density</title>
<style>
:root{--main:#7cfbff;}
body{
  margin:0;height:100vh;overflow:hidden;
  display:flex;justify-content:center;align-items:center;
  background:#020808;color:#fff;font-family:system-ui;
}
#bg{position:absolute;inset:0;filter:blur(160px);z-index:-3}
canvas{position:absolute;inset:0;z-index:-2}
.card{text-align:center;position:relative}
.count{font-size:9rem;font-weight:100}
.leaderboard{opacity:.6;margin-top:6px}
.rank{font-size:2rem;margin-top:24px}
.increase{
  position:absolute;bottom:20px;
  font-size:1.5rem;
  opacity:0;transition:.8s;
}
</style>
</head>
<body>

<div id="bg"></div>
<canvas id="c"></canvas>

<div class="card">
  <div class="count" id="count">0</div>
  <div class="leaderboard" id="lb">- / -</div>
  <div class="rank" id="stage">×1</div>
  <div class="increase" id="inc"></div>
</div>

<script>
/* UID */
if(!localStorage.uid){
  localStorage.uid="u"+Math.random().toString(36).slice(2);
}
const uid = localStorage.uid;

/* 状態（表示用） */
let countVal = 0;
let last = Date.now();

/* UI */
const ce=count, lbE=lb, stE=stage, incE=inc;

/* 非表示加算（見た目だけ） */
let hiddenAt=0;
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){
    hiddenAt=Date.now();
  }else{
    const g=Math.floor((Date.now()-hiddenAt)/1000)*2;
    if(g>0){
      countVal+=g;
      incE.textContent="+"+g;
      incE.style.opacity=1;
      incE.style.transform="translateY(-30px)";
      setTimeout(()=>incE.style.opacity=0,800);
    }
  }
});

/* メインループ */
setInterval(async ()=>{
  const now=Date.now();
  const dt=(now-last)/1000;
  last=now;

  countVal+=dt;
  const stage=Math.floor(countVal/10000)+1;

  ce.textContent=Math.floor(countVal).toLocaleString();
  stE.textContent="×"+stage;

  /* ここにsecureUpdateを送る部分を残す場合はfetchで呼ぶ */
},1000);

/* ランキング取得（既存通り） */
// もしgetRank APIを使うならここにfetch追加

/* BANチェック（5秒ごと） */
setInterval(async ()=>{
  try{
    const r = await fetch("/banCheck",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({uid})
    });
    const j = await r.json();
    if(j.banned){
      localStorage.removeItem("uid");
      alert("BANされました。UIDリセットします。ページを再読み込みして下さい。");
      location.reload();
    }
  }catch{}
},5000);

/* 背景 */
function theme(){
  const h=new Date().getHours();
  const c=h<6?["#7b5cff","#2b145c"]:
          h<18?["#7cfbff","#5effc6"]:
               ["#ffb86c","#ff8c42"];
  document.documentElement.style.setProperty("--main",c[0]);
  bg.style.background=`radial-gradient(circle,${c[1]},#000)`;
}
theme(); setInterval(theme,60000);

/* canvas */
const cv=c,ctx=cv.getContext("2d");
function resize(){cv.width=innerWidth;cv.height=innerHeight}
addEventListener("resize",resize);resize();

let p=[...Array(120)].map(()=>( {
  x:Math.random()*cv.width,
  y:Math.random()*cv.height,
  vx:(Math.random()-.5)*.25,
  vy:(Math.random()-.5)*.25
}));
(function loop(){
  ctx.clearRect(0,0,cv.width,cv.height);
  p.forEach(o=>{
    o.x+=o.vx;o.y+=o.vy;
    if(o.x<0||o.x>cv.width)o.vx*=-1;
    if(o.y<0||o.y>cv.height)o.vy*=-1;
    ctx.fillStyle="rgba(255,255,255,.4)";
    ctx.fillRect(o.x,o.y,2,2);
  });
  requestAnimationFrame(loop);
})();
</script>
</body>
</html>
