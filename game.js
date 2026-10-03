const START_TEASE = "Oh good, it's {name}. Lower your expectations, everyone.";

const TEASES = [
  "I have a black friend who's better than you.",
  "pa diya khellew tr theke bhala khela jay",
  "tore internet dise kera",
  "omfg you are ass"
];

const MISSES_PER_TEASE = 2;

const GIFS = {
  miss: ["gifs/miss1.gif", "gifs/miss2.gif"],
  spike: ["gifs/spike1.gif"],
  gameover: ["gifs/gameover1.gif", "gifs/gameover2.gif"]
};

const DIFFICULTIES = {
  "easy": {
    lives: 20,
    hazardWord: "copyright",
    hazardFontSize: 12,
    maxFallSpeed: 340,
    minSpawnGap: 0.45,
    tracks: [
      { title: "Easy 1", file: "music/easy1.mp3" },
      { title: "Easy 2", file: "music/easy2.mp3" },
      { title: "Easy 3", file: "music/easy3.mp3" },
      { title: "Easy 4", file: "music/easy4.mp3" }
    ]
  },
  "hard": {
    lives: 15,
    hazardWord: "copyright",
    hazardFontSize: 12,
    maxFallSpeed: 380,
    minSpawnGap: 0.4,
    tracks: [
      { title: "Hard 1", file: "music/hard1.mp3" },
      { title: "Hard 2", file: "music/hard2.mp3" },
      { title: "Hard 3", file: "music/hard3.mp3" },
      { title: "Hard 4", file: "music/hard4.mp3" },
      { title: "Quiet On Purpose - Crossroads (ft. Sarah Zaman)", file: "music/hard5.mp3" },
      { title: "Quiet On Purpose - Let Down", file: "music/hard6.mp3" }
    ]
  },
  "Cox to dhaka bus driver": {
    lives: 12,
    hazardWord: "copyright",
    hazardFontSize: 12,
    maxFallSpeed: 420,
    minSpawnGap: 0.35,
    tracks: [
      { title: "Zaman", file: "music/zaman.mp3" }
    ]
  },
  "GOOD LUCK": {
    lives: 10,
    hazardWord: "JOB",
    hazardFontSize: 34,
    maxFallSpeed: 460,
    minSpawnGap: 0.3,
    tracks: [
      { title: "Hardest", file: "music/hardest.mp3" }
    ]
  }
};

const RADIO_STREAK = 3;
const MISSES_TO_STOP_MUSIC = 3;
const STAGES = 5;
const START_SPEED = 190;
const START_GAP = 1.0;
const SPIKE_EVERY = 14;
const SPIKE_LENGTH = 3;
const SPIKE_BOOST = 1.25;
const DROP_FALL_SPEED = 450;
const DROP_FOLLOW_SPEED = 80;
const DROP_SWAY_WIDTH = 50;
const DROP_SWAY_SPEED = 4;
const STRIKE_FALL_SPEED = 380;

const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const herContext = document.getElementById("her").getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const FACE_PIXEL = 2;
const DROP_PIXEL = 2;
const PLAYER_PIXEL = 2;
const FACE_WIDTH = FACE.rows[0].length * FACE_PIXEL;
const FACE_HEIGHT = FACE.rows.length * FACE_PIXEL;
const DROP_WIDTH = DROP.rows[0].length * DROP_PIXEL;
const DROP_HEIGHT = DROP.rows.length * DROP_PIXEL;
const PLAYER_WIDTH = PLAYER.rows[0].length * PLAYER_PIXEL;
const PLAYER_HEIGHT = PLAYER.rows.length * PLAYER_PIXEL;
const STRIKE_SIZE = 80;

const player = {
  x: WIDTH / 2,
  y: HEIGHT - PLAYER_HEIGHT - 4,
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  speed: 300
};

let playerName = "Nameless";
let score = 0;
let misses = 0;
let streak = 0;
let best = 0;
let items = [];
let spawnTimer = 0;
let eventTimer = 6;
let spiking = false;
let spikeLeft = 0;
let sinceSpike = 0;
let playing = false;
let lastTime = 0;
let touchTargetX = null;
let gifTimer = null;
let radioAudio = null;
let currentTrack = null;
let currentDifficulty = "easy";
let currentSettings = DIFFICULTIES["easy"];
let missesInARow = 0;
let currentTrackIndex = 0;
let nextTrackChoice = null;
let teaseIndex = 0;
let missesOnThisTease = 0;
let radioOn = false;
let radioBroken = false;
let radioVolume = 0.7;
const keys = {};

try {
  best = Number(localStorage.getItem("bestScore")) || 0;
} catch (error) {
  best = 0;
}

function byId(id) {
  return document.getElementById(id);
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function drawSprite(drawingContext, sprite, x, y, pixelSize) {
  const left = Math.round(x);
  const top = Math.round(y);
  sprite.rows.forEach((row, rowNumber) => {
    for (let col = 0; col < row.length; col++) {
      const letter = row[col];
      if (letter === ".") continue;
      drawingContext.fillStyle = sprite.colors[letter];
      drawingContext.fillRect(left + col * pixelSize, top + rowNumber * pixelSize, pixelSize, pixelSize);
    }
  });
}

function drawPortrait() {
  herContext.clearRect(0, 0, herContext.canvas.width, herContext.canvas.height);
  drawSprite(herContext, FACE, 0, 0, 2);
}

function say(text) {
  byId("bubble").textContent = text;
}

function sayTease() {
  say(TEASES[teaseIndex].replace("{name}", playerName));
  missesOnThisTease++;
  if (missesOnThisTease >= MISSES_PER_TEASE) {
    missesOnThisTease = 0;
    teaseIndex = (teaseIndex + 1) % TEASES.length;
  }
}

function updateScoreBar() {
  byId("score").textContent = "Score: " + score;
  byId("misses").textContent = "Misses: " + misses + "/" + currentSettings.lives;
  byId("best").textContent = "Best: " + best;
}

function shakeScreen() {
  const stage = byId("stage");
  stage.classList.remove("shake");
  void stage.offsetWidth;
  stage.classList.add("shake");
}

function showGif(kind) {
  const list = GIFS[kind];
  if (!list || list.length === 0) return;
  const image = byId("gif");
  image.hidden = true;
  image.onload = () => { image.hidden = false; };
  image.onerror = () => { image.hidden = true; };
  image.src = pickRandom(list);
  clearTimeout(gifTimer);
  gifTimer = setTimeout(() => { image.hidden = true; }, 1800);
}

function setRadioLabel(text) {
  byId("radio").textContent = "Radio: " + text;
}

function showSongProgress(progress) {
  const percent = Math.floor(progress * 100);
  const stage = Math.min(STAGES, Math.floor(progress * STAGES) + 1);
  byId("songProgress").value = progress;
  byId("stageLabel").textContent = "Stage: " + stage + "/" + STAGES + " (" + percent + "%)";
}

function updateSongProgress() {
  if (!radioAudio || !radioAudio.duration) return;
  showSongProgress(radioAudio.currentTime / radioAudio.duration);
}

function prepareTrack() {
  radioAudio = new Audio(currentTrack.file);
  radioAudio.volume = radioVolume;
  radioAudio.addEventListener("timeupdate", updateSongProgress);
  radioAudio.addEventListener("ended", winGame);
  radioAudio.addEventListener("error", handleRadioError);
  showSongProgress(0);
}

function handleRadioError() {
  radioOn = false;
  radioBroken = true;
  showSongProgress(0);
  setRadioLabel("could not load the song, check the music folder");
}

function startRadio() {
  if (radioOn || radioBroken || !radioAudio) return;
  radioOn = true;
  radioAudio.play().catch(() => {});
  setRadioLabel(currentTrack.title);
}

function stopRadio() {
  radioOn = false;
  if (radioAudio) radioAudio.pause();
  setRadioLabel("off");
}

function fillDifficultyList() {
  const select = byId("difficulty");
  Object.keys(DIFFICULTIES).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

function fillTrackList() {
  const select = byId("track");
  select.innerHTML = "";
  DIFFICULTIES[byId("difficulty").value].tracks.forEach((track, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = track.title;
    select.appendChild(option);
  });
}

function startGame() {
  nextTrackChoice = null;
  playerName = byId("name").value.trim() || "Nameless";
  score = 0;
  misses = 0;
  streak = 0;
  items = [];
  spawnTimer = 0;
  eventTimer = 6;
  spiking = false;
  sinceSpike = 0;
  player.x = WIDTH / 2;
  touchTargetX = null;
  playing = true;
  stopRadio();
  radioBroken = false;
  currentDifficulty = byId("difficulty").value;
  currentSettings = DIFFICULTIES[currentDifficulty];
  currentTrackIndex = Number(byId("track").value);
  currentTrack = currentSettings.tracks[currentTrackIndex];
  missesInARow = 0;
  prepareTrack();

  byId("overlay").hidden = true;
  teaseIndex = 0;
  missesOnThisTease = 0;
  say(START_TEASE.replace("{name}", playerName));
  updateScoreBar();
  updateControls();

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function formatTime(seconds) {
  if (!seconds || seconds < 0) seconds = 0;
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return minutes + ":" + (rest < 10 ? "0" : "") + rest;
}

function songCompletionText() {
  const played = radioAudio ? radioAudio.currentTime : 0;
  const total = radioAudio ? radioAudio.duration : 0;
  return "Song completion: " + formatTime(played) + " / " + formatTime(total);
}

function saveBestScore() {
  if (score <= best) return;
  best = score;
  try {
    localStorage.setItem("bestScore", best);
  } catch (error) {
    best = score;
  }
}

function endGame() {
  playing = false;
  stopRadio();
  saveBestScore();
  updateControls();

  showGif("gameover");
  shakeScreen();

  byId("title").textContent = "Game over";
  byId("info").textContent = songCompletionText();
  byId("play").textContent = "Play again";
  byId("overlay").hidden = false;
  updateScoreBar();
}

function winGame() {
  playing = false;
  radioOn = false;
  saveBestScore();
  showSongProgress(1);
  const tracks = currentSettings.tracks;
  nextTrackChoice = null;
  if (tracks.length > 1) {
    nextTrackChoice = { difficulty: currentDifficulty, index: (currentTrackIndex + 1) % tracks.length };
  }
  updateControls();

  const line = songCompletionText();
  setRadioLabel("finished");

  byId("title").textContent = "Completed!";
  byId("info").textContent = line;
  byId("play").textContent = "Play again";
  byId("overlay").hidden = false;
  updateScoreBar();
}

function updateControls() {
  byId("quit").textContent = playing ? "Quit to menu" : "Quit game";
  byId("nextTrack").disabled = playing || nextTrackChoice === null;
}

function quitGame() {
  if (!playing) return;
  playing = false;
  stopRadio();
  saveBestScore();
  updateControls();

  byId("title").textContent = "You quit";
  byId("info").textContent = songCompletionText();
  byId("play").textContent = "Play again";
  byId("overlay").hidden = false;
  updateScoreBar();
}

function nextTrack() {
  if (playing || nextTrackChoice === null) return;
  byId("difficulty").value = nextTrackChoice.difficulty;
  fillTrackList();
  byId("track").value = nextTrackChoice.index;
  startGame();
}

function quitEverything() {
  stopRadio();
  window.close();
  byId("app").hidden = true;
  byId("goodbye").hidden = false;
}

function onDifficultyChange() {
  fillTrackList();
  nextTrackChoice = null;
  updateControls();
}

function loseLife() {
  misses++;
  missesInARow++;
  streak = 0;
  if (missesInARow >= MISSES_TO_STOP_MUSIC) {
    stopRadio();
  }
  sayTease();
  shakeScreen();
  showGif("miss");
  updateScoreBar();
  if (misses >= currentSettings.lives) endGame();
}

function hitByHazard() {
  streak = 0;
  stopRadio();
  shakeScreen();
  showGif("miss");
}

function getSpikeBoost() {
  return spiking ? SPIKE_BOOST : 1;
}

function movePlayer(dt) {
  let direction = 0;
  if (keys.arrowleft || keys.a) direction -= 1;
  if (keys.arrowright || keys.d) direction += 1;

  if (direction !== 0) {
    player.x += direction * player.speed * dt;
    touchTargetX = null;
  } else if (touchTargetX !== null) {
    const distance = touchTargetX - player.x;
    const step = player.speed * 1.5 * dt;
    if (Math.abs(distance) < step) {
      player.x = touchTargetX;
    } else {
      player.x += Math.sign(distance) * step;
    }
  }

  const halfWidth = player.width / 2;
  player.x = Math.max(halfWidth, Math.min(WIDTH - halfWidth, player.x));
}

function updateSpike(dt) {
  if (spiking) {
    spikeLeft -= dt;
    if (spikeLeft <= 0) {
      spiking = false;
      sinceSpike = 0;
    }
    return;
  }

  sinceSpike += dt;
  if (sinceSpike > SPIKE_EVERY) {
    spiking = true;
    spikeLeft = SPIKE_LENGTH;
    shakeScreen();
    showGif("spike");
  }
}

function addItem(type) {
  let x = 30 + Math.random() * (WIDTH - 60);
  let width = FACE_WIDTH;
  let height = FACE_HEIGHT;
  if (type === "drop") {
    x = Math.max(30, Math.min(WIDTH - 30, player.x + (Math.random() * 2 - 1) * 80));
    width = DROP_WIDTH;
    height = DROP_HEIGHT;
  }
  if (type === "strike") {
    x = player.x;
    width = STRIKE_SIZE;
    height = STRIKE_SIZE;
  }
  items.push({
    x: x,
    y: -height,
    width: width,
    height: height,
    type: type,
    anchorX: x,
    phase: Math.random() * 6.28,
    word: currentSettings.hazardWord,
    fontSize: currentSettings.hazardFontSize
  });
}

function spawnItems(dt) {
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    addItem("normal");
    spawnTimer = Math.max(currentSettings.minSpawnGap, START_GAP - score * 0.015) / getSpikeBoost();
  }

  eventTimer -= dt;
  if (eventTimer <= 0) {
    addItem(Math.random() < 0.5 ? "drop" : "strike");
    eventTimer = 6 + Math.random() * 8;
  }
}

function isCaught(item) {
  const touchesHead = item.y + item.height >= player.y + 6 && item.y <= player.y + 30;
  const linedUp = Math.abs(item.x - player.x) < (player.width + item.width) / 2 - 14;
  return touchesHead && linedUp;
}

function catchItem(item) {
  if (item.type === "drop") {
    misses = Math.max(0, misses - 1);
    updateScoreBar();
    return;
  }
  score++;
  streak++;
  missesInARow = 0;
  if (streak >= RADIO_STREAK) startRadio();
  updateScoreBar();
}

function updateDropItem(item, dt) {
  item.y += DROP_FALL_SPEED * dt;

  const maxFollow = DROP_FOLLOW_SPEED * dt;
  const distanceToPlayer = player.x - item.anchorX;
  item.anchorX += Math.max(-maxFollow, Math.min(maxFollow, distanceToPlayer));

  item.phase += DROP_SWAY_SPEED * dt;
  item.x = item.anchorX + Math.sin(item.phase) * DROP_SWAY_WIDTH;
  item.x = Math.max(20, Math.min(WIDTH - 20, item.x));

  if (isCaught(item)) {
    catchItem(item);
    return true;
  }
  return item.y > HEIGHT;
}

function updateStrikeItem(item, dt) {
  item.y += STRIKE_FALL_SPEED * dt;

  const touchesPlayer =
    item.y + item.height > player.y + 6 &&
    item.y < player.y + player.height &&
    Math.abs(item.x - player.x) < (player.width + item.width) / 2 - 14;

  if (touchesPlayer) {
    hitByHazard();
    return true;
  }
  return item.y > HEIGHT;
}

function updateNormalItem(item, dt) {
  const fallSpeed = Math.min(currentSettings.maxFallSpeed, START_SPEED + score * 4) * getSpikeBoost();
  item.y += fallSpeed * dt;

  if (isCaught(item)) {
    catchItem(item);
    return true;
  }
  if (item.y > HEIGHT) {
    loseLife();
    return true;
  }
  return false;
}

function moveItems(dt) {
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    let shouldRemove;

    if (item.type === "drop") {
      shouldRemove = updateDropItem(item, dt);
    } else if (item.type === "strike") {
      shouldRemove = updateStrikeItem(item, dt);
    } else {
      shouldRemove = updateNormalItem(item, dt);
    }

    if (shouldRemove) items.splice(i, 1);
    if (!playing) return;
  }
}

function update(dt) {
  movePlayer(dt);
  updateSpike(dt);
  spawnItems(dt);
  moveItems(dt);
}

function drawBadge(x, y, word, fontSize) {
  const cell = 5;
  const radius = 8;
  for (let row = 0; row < radius * 2; row++) {
    for (let col = 0; col < radius * 2; col++) {
      const distance = Math.hypot(col + 0.5 - radius, row + 0.5 - radius);
      if (distance > radius) continue;
      let color = "#2fa84f";
      if (distance > radius - 1) color = "#111111";
      else if (col + row < radius) color = "#7be08f";
      context.fillStyle = color;
      context.fillRect(Math.round(x) + col * cell, Math.round(y) + row * cell, cell, cell);
    }
  }
  context.fillStyle = "#111111";
  context.font = "bold " + fontSize + "px monospace";
  context.textAlign = "center";
  context.fillText(word, x + radius * cell, y + radius * cell + fontSize / 3);
}

function drawItem(item) {
  if (item.type === "strike") {
    drawBadge(item.x - item.width / 2, item.y, item.word, item.fontSize);
  } else if (item.type === "drop") {
    drawSprite(context, DROP, item.x - item.width / 2, item.y, DROP_PIXEL);
  } else {
    drawSprite(context, FACE, item.x - item.width / 2, item.y, FACE_PIXEL);
  }
}

function drawPlayer() {
  drawSprite(context, PLAYER, player.x - player.width / 2, player.y, PLAYER_PIXEL);
  context.fillStyle = "#000000";
  context.font = "16px 'Times New Roman', serif";
  context.textAlign = "center";
  context.fillText(playerName, player.x, player.y - 8);
}

function drawSpikeWarning() {
  if (!spiking) return;
  context.fillStyle = "#cc0000";
  context.font = "bold 20px 'Times New Roman', serif";
  context.textAlign = "center";
  context.fillText("RUSH INCOMING!!", WIDTH / 2, 30);
}

function draw() {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  items.forEach(drawItem);
  drawPlayer();
  drawSpikeWarning();
}

function loop(now) {
  if (!playing) return;

  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  update(dt);
  if (!playing) return;

  draw();
  requestAnimationFrame(loop);
}

function setTouchTarget(event) {
  const box = canvas.getBoundingClientRect();
  touchTargetX = (event.clientX - box.left) * WIDTH / box.width;
}

addEventListener("keydown", event => {
  keys[event.key.toLowerCase()] = true;
  if (playing && event.key.startsWith("Arrow")) event.preventDefault();
});

addEventListener("keyup", event => {
  keys[event.key.toLowerCase()] = false;
});

canvas.addEventListener("pointerdown", event => {
  setTouchTarget(event);
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", event => {
  if (event.buttons) setTouchTarget(event);
});

byId("play").addEventListener("click", startGame);

byId("quit").addEventListener("click", event => {
  event.target.blur();
  if (playing) {
    quitGame();
  } else {
    quitEverything();
  }
});

byId("reopen").addEventListener("click", () => {
  location.reload();
});

byId("nextTrack").addEventListener("click", event => {
  nextTrack();
  event.target.blur();
});

byId("difficulty").addEventListener("change", onDifficultyChange);

byId("volume").addEventListener("input", event => {
  radioVolume = event.target.value / 100;
  if (radioAudio) radioAudio.volume = radioVolume;
});

byId("volume").addEventListener("change", event => {
  event.target.blur();
});

byId("name").addEventListener("keydown", event => {
  if (event.key === "Enter") startGame();
});

fillDifficultyList();
fillTrackList();
updateControls();
drawPortrait();
updateScoreBar();
draw();
