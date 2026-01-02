// banCheck.js
const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
app.use(express.json());

// BAN情報保存（簡易ファイル版）
const BAN_FILE = path.join(__dirname, "uid_ban.json");

// uid_ban.jsonの読み書き関数
function readBanData(){
  if(!fs.existsSync(BAN_FILE)) return {};
  return JSON.parse(fs.readFileSync(BAN_FILE,"utf8"));
}
function writeBanData(data){
  fs.writeFileSync(BAN_FILE, JSON.stringify(data, null, 2));
}

// BAN確認用API
app.post("/banCheck", (req,res)=>{
  const { uid } = req.body;
  if(!uid) return res.status(400).json({error:"UIDなし"});

  const data = readBanData();
  const now = Date.now();
  if(data[uid] && data[uid] > now){
    return res.json({banned:true});
  }
  res.json({banned:false});
});

// テスト用：BAN追加（管理者専用で呼べる）
app.post("/banAdd", (req,res)=>{
  const { uid, days } = req.body;
  if(!uid) return res.status(400).json({error:"UIDなし"});
  const data = readBanData();
  data[uid] = Date.now() + (days||7)*24*60*60*1000; // デフォ1週間
  writeBanData(data);
  res.json({ok:true});
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`BANサーバー起動: http://localhost:${PORT}`));

