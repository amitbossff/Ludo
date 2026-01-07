let roomCode = "";
let playerId = Math.random().toString(36).substr(2, 5);
let playerIndex = -1;
let totalPlayers = 4;

const PATH = [
  {x:50,y:300},{x:100,y:300},{x:150,y:300},{x:200,y:300},
  {x:250,y:300},{x:300,y:300},{x:350,y:300},{x:400,y:300},
  {x:450,y:300},{x:500,y:300},{x:550,y:300},
  {x:550,y:250},{x:550,y:200},{x:550,y:150},{x:550,y:100},
  {x:550,y:50},
  {x:500,y:50},{x:450,y:50},{x:400,y:50},{x:350,y:50},
  {x:300,y:50},{x:250,y:50},{x:200,y:50},{x:150,y:50},
  {x:100,y:50},{x:50,y:50},
  {x:50,y:100},{x:50,y:150},{x:50,y:200},{x:50,y:250}
];

const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 600,
  backgroundColor: "#ffffff",
  scene: { create }
};

let game = new Phaser.Game(config);
let tokens = [];

function create() {
  let scene = this;
  this.add.text(200, 10, "Online Ludo", { color: "#000" });

  db.ref("rooms").on("value", snap => {
    let data = snap.val();
    if (!data || !data[roomCode]) return;

    let room = data[roomCode];
    tokens.forEach((t, i) => {
      let pos = room.players[i].pos;
      if (PATH[pos]) {
        t.x = PATH[pos].x;
        t.y = PATH[pos].y;
      }
    });
  });

  for (let i = 0; i < totalPlayers; i++) {
    let t = this.add.circle(50, 300, 12, 0xff0000 + i * 2000);
    tokens.push(t);
  }
}

function createRoom() {
  roomCode = Math.random().toString(36).substr(2, 4);
  alert("Room Code: " + roomCode);

  let players = [];
  for (let i = 0; i < totalPlayers; i++) {
    players.push({ pos: 0 });
  }

  db.ref("rooms/" + roomCode).set({
    turn: 0,
    players: players
  });

  joinAsPlayer();
}

function joinRoom() {
  roomCode = document.getElementById("roomInput").value;
  joinAsPlayer();
}

function joinAsPlayer() {
  db.ref("rooms/" + roomCode).once("value", snap => {
    if (!snap.exists()) return alert("Room not found");

    let room = snap.val();
    playerIndex = room.players.findIndex(p => p.id === undefined);

    if (playerIndex === -1) return alert("Room Full");

    db.ref(`rooms/${roomCode}/players/${playerIndex}`).update({
      id: playerId,
      pos: 0
    });
  });
}

function rollDice() {
  db.ref("rooms/" + roomCode).once("value", snap => {
    let room = snap.val();
    if (room.turn !== playerIndex) return;

    let dice = Math.floor(Math.random() * 6) + 1;
    let newPos = room.players[playerIndex].pos + dice;

    db.ref(`rooms/${roomCode}`).update({
      [`players/${playerIndex}/pos`]: newPos,
      turn: (room.turn + 1) % totalPlayers
    });
  });
  }
