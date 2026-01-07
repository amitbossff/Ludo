// Firebase v12
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, ref, set, update, onValue, get }
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAA1DAEu6KmaLTHw1EuUPJko58AOsITz0k",
  authDomain: "amit-a7b1f.firebaseapp.com",
  databaseURL: "https://amit-a7b1f-default-rtdb.firebaseio.com",
  projectId: "amit-a7b1f",
  storageBucket: "amit-a7b1f.firebasestorage.app",
  messagingSenderId: "875229760738",
  appId: "1:875229760738:web:3981228866e3e8fe00e2bb"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Sounds
const diceSound = diceSoundEl();
const moveSound = moveSoundEl();
const cutSound = cutSoundEl();
const winSound = winSoundEl();
const bgMusic = bgMusicEl();

function diceSoundEl(){return document.getElementById("diceSound")}
function moveSoundEl(){return document.getElementById("moveSound")}
function cutSoundEl(){return document.getElementById("cutSound")}
function winSoundEl(){return document.getElementById("winSound")}
function bgMusicEl(){return document.getElementById("bgMusic")}

window.unlockSound = () => {
  diceSound.play().then(()=>diceSound.pause());
  document.getElementById("soundUnlock").remove();
};

// Game vars
let roomCode, myIndex = -1;
const colors = ["red","green","yellow","blue"];
let tokens = [];

const PATH = Array.from({length:52},(_,i)=>({
  x: 12 + (i % 13) * 23,
  y: 12 + Math.floor(i / 13) * 23
}));

window.toggleMusic = () => {
  bgMusic.paused ? bgMusic.play() : bgMusic.pause();
};

window.createRoom = () => {
  roomCode = Math.random().toString(36).substr(2,4).toUpperCase();
  alert("Room Code: " + roomCode);

  set(ref(db,"rooms/"+roomCode),{
    turn:0,
    players:Array(4).fill().map(()=>({pos:-1,home:false}))
  });
  joinGame();
};

window.joinRoom = () => {
  roomCode = roomInput.value;
  joinGame();
};

function joinGame(){
  get(ref(db,"rooms/"+roomCode)).then(s=>{
    const room=s.val();
    myIndex=room.players.findIndex(p=>!p.id);
    if(myIndex==-1)return alert("Room Full");
    update(ref(db,`rooms/${roomCode}/players/${myIndex}`),{id:Date.now()});
    startGame();
  });
}

function startGame(){
  menu.classList.add("hidden");
  game.classList.remove("hidden");
  const board=document.getElementById("board");
  board.innerHTML="";
  tokens=[];

  for(let p=0;p<4;p++){
    for(let t=0;t<4;t++){
      const g=document.createElement("div");
      g.className="token "+colors[p];
      board.appendChild(g);
      tokens.push({el:g,player:p});
    }
  }

  onValue(ref(db,"rooms/"+roomCode),snap=>{
    const data=snap.val();
    turnText.innerText="Turn: "+colors[data.turn].toUpperCase();

    tokens.forEach(t=>{
      const pos=data.players[t.player].pos;
      if(pos>=0 && PATH[pos]){
        t.el.style.left=PATH[pos].x+(t.player*4)+"px";
        t.el.style.top=PATH[pos].y+(t.player*4)+"px";
      }
    });

    if(data.players[myIndex].home){
      winSound.play();
      alert("🎉 YOU WON!");
    }
  });
}

dice.onclick=rollDice;

function rollDice(){
  get(ref(db,"rooms/"+roomCode)).then(s=>{
    const room=s.val();
    if(room.turn!==myIndex)return;

    diceSound.play();
    const value=Math.floor(Math.random()*6)+1;

    let p=room.players[myIndex];

    // HOME RULE
    if(p.pos===-1){
      if(value===6)p.pos=0;
      else return nextTurn(room);
    }else{
      p.pos+=value;
      if(p.pos>=51){p.home=true;p.pos=51;}
    }

    // CUT RULE
    room.players.forEach((op,i)=>{
      if(i!==myIndex && op.pos===p.pos && p.pos>0){
        update(ref(db,`rooms/${roomCode}/players/${i}`),{pos:-1});
        cutSound.play();
      }
    });

    moveSound.play();

    update(ref(db,"rooms/"+roomCode),{
      [`players/${myIndex}`]:p,
      turn:(room.turn+1)%4
    });
  });
}

function nextTurn(room){
  update(ref(db,"rooms/"+roomCode),{
    turn:(room.turn+1)%4
  });
      }
