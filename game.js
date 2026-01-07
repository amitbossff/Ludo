// 🔥 Firebase v12 imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, ref, set, update, onValue, get } 
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// ✅ Tumhara Firebase config (AS-IS)
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

// 🔊 Sounds
const diceSound = document.getElementById("diceSound");
const moveSound = document.getElementById("moveSound");
const cutSound  = document.getElementById("cutSound");

// 🎮 Game variables
let roomCode;
let myIndex = -1;
const colors = ["red","green","yellow","blue"];
let tokens = [];

// 🧭 Ludo path (simplified)
const PATH = [];
for (let i = 0; i < 52; i++) {
  PATH.push({
    x: 12 + (i % 13) * 23,
    y: 12 + Math.floor(i / 13) * 23
  });
}

// 🏠 UI Buttons
document.getElementById("createBtn").onclick = createRoom;
document.getElementById("joinBtn").onclick = joinRoom;
document.getElementById("dice").onclick = rollDice;

// 🎲 Create Room
function createRoom() {
  roomCode = Math.random().toString(36).substr(2,4).toUpperCase();
  alert("Room Code: " + roomCode);

  let players = [];
  for (let i = 0; i < 4; i++) players.push({ pos: 0 });

  set(ref(db, "rooms/" + roomCode), {
    turn: 0,
    players
  });

  joinGame();
}

// 🚪 Join Room
function joinRoom() {
  roomCode = document.getElementById("roomInput").value;
  joinGame();
}

// 👤 Join Logic
function joinGame() {
  get(ref(db, "rooms/" + roomCode)).then(snap => {
    if (!snap.exists()) return alert("Room not found");

    const room = snap.val();
    myIndex = room.players.findIndex(p => !p.id);
    if (myIndex === -1) return alert("Room Full");

    update(ref(db, `rooms/${roomCode}/players/${myIndex}`), {
      id: Date.now()
    });

    startGame();
  });
}

// ▶️ Start Game
function startGame() {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  const board = document.getElementById("board");
  board.innerHTML = "";
  tokens = [];

  for (let p = 0; p < 4; p++) {
    for (let t = 0; t < 4; t++) {
      const g = document.createElement("div");
      g.className = "token " + colors[p];
      board.appendChild(g);
      tokens.push({ el: g, player: p });
    }
  }

  onValue(ref(db, "rooms/" + roomCode), snap => {
    const data = snap.val();
    document.getElementById("turnText").innerText =
      "Turn: " + colors[data.turn].toUpperCase();

    tokens.forEach(tk => {
      const pos = data.players[tk.player].pos;
      if (PATH[pos]) {
        tk.el.style.left = PATH[pos].x + "px";
        tk.el.style.top  = PATH[pos].y + "px";
      }
    });
  });
}

// 🎲 Roll Dice + SOUND + MOVE + CUT
function rollDice() {
  get(ref(db, "rooms/" + roomCode)).then(snap => {
    const room = snap.val();
    if (room.turn !== myIndex) return;

    diceSound.play(); // 🔊 Dice sound

    const dice = Math.floor(Math.random() * 6) + 1;
    let newPos = room.players[myIndex].pos + dice;
    if (newPos > 51) newPos = 51;

    // ❌ CUT LOGIC
    room.players.forEach((p, i) => {
      if (i !== myIndex && p.pos === newPos) {
        update(ref(db, `rooms/${roomCode}/players/${i}`), { pos: 0 });
        cutSound.play(); // 🔊 Cut sound
      }
    });

    moveSound.play(); // 🔊 Move sound

    update(ref(db, "rooms/" + roomCode), {
      [`players/${myIndex}/pos`]: newPos,
      turn: (room.turn + 1) % 4
    });
  });
}
