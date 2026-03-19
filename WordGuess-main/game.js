// game.js
// Tarayıcıda Wordle tarzı 5 harfli kelime tahmin oyunu çekirdeği.
// words.js içinden WORDS ve TARGETS bekler.

import { WORDS, TARGETS } from "./words.js";

document.addEventListener("DOMContentLoaded", () => {
  renderBoard();
  renderKeyboard();
  updateHint("5 harfli kelime, 6 deneme hakkı. Klavye veya sanal tuşlarla deneyebilirsin.");

  newGameBtn.addEventListener("click", resetGame);
  document.addEventListener("keydown", onKeydown);
});


const ROWS = 6;
const COLS = 5;

const state = {
  solution: chooseSolution(),
  row: 0,
  col: 0,
  board: Array.from({ length: ROWS }, () => Array(COLS).fill("")),
  status: "playing", // "playing" | "won" | "lost"
  keyboardColors: new Map(), // letter -> className ("correct" | "present" | "absent")
  layout: "TR-Q", // ileride TR-F gibi varyantlar eklenebilir
};

// DOM referansları
const boardEl = document.getElementById("board");
const keyboardEl = document.getElementById("keyboard");
const newGameBtn = document.getElementById("newGameBtn");
const hintEl = document.getElementById("hint");

// Başlat
renderBoard();
renderKeyboard();
updateHint("5 harfli kelime, 6 deneme hakkı. Klavye veya sanal tuşlarla deneyebilirsin.");

// Olaylar
newGameBtn.addEventListener("click", resetGame);
document.addEventListener("keydown", onKeydown);

// ---------- Oyun mantığı ----------

function chooseSolution(){
  const pool = (TARGETS && TARGETS.length ? TARGETS : WORDS).filter(w=>w.length===COLS);
  return pool[Math.floor(Math.random()*pool.length)];
}

function onKeydown(e){
  if(state.status!=="playing") return;
  const key = normalizeKey(e.key);

  if(key === "enter"){ submitRow(); return; }
  if(key === "backspace"){ backspace(); return; }

  if(isLetter(key) && state.col < COLS){
    setChar(key);
  }
}

function normalizeKey(k){
  // Türkçe küçük harf normalize
  const lower = k.toLocaleLowerCase("tr");
  return lower;
}

function isLetter(ch){
  // Türkçe harfleri içeren regex
  return /^[a-zçğıöşü]$/.test(ch);
}

// ---------- Board render ----------

function renderBoard(){
  boardEl.innerHTML = "";
  for(let r=0; r<ROWS; r++){
    const rowEl = document.createElement("div");
    rowEl.className = "row";
    for(let c=0; c<COLS; c++){
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.row = r;
      tile.dataset.col = c;
      tile.textContent = state.board[r][c] || "";
      rowEl.appendChild(tile);
    }
    boardEl.appendChild(rowEl);
  }
}

function updateBoardTile(r,c, text, anim){
  const selector = `.tile[data-row="${r}"][data-col="${c}"]`;
  const tile = boardEl.querySelector(selector);
  if(!tile) return;
  tile.textContent = text || "";
  if(anim){
    tile.classList.remove("shake","bump","reveal","correct","present","absent");
    // animasyonu yeniden başlatmak için reflow
    void tile.offsetHeight;
    tile.classList.add(anim);
  }
}

// ---------- Sanal klavye ----------

function renderKeyboard(){
  const keysRows = getKeyboardLayout(state.layout);
  keyboardEl.innerHTML = "";

  // Satır 1
  keysRows[0].forEach(k=> appendKeyButton(k));
  // Satır 2
  keysRows[1].forEach(k=> appendKeyButton(k));
  // Satır 3 + özel tuşlar
  appendKeyButton("enter", true);
  keysRows[2].forEach(k=> appendKeyButton(k));
  appendKeyButton("del", true);
}

function getKeyboardLayout(layout){
  // TR-Q düzeni
  const trq = [
    "qwertyuıopğü".split(""),
    "asdfghjklşi".split(""),
    "zxcvbnmöç".split("")
  ];
  // TR-F istenirse kolayca eklenebilir:
  // const trf = [ ... ];
  return trq;
}

function appendKeyButton(k, wide=false){
  const keyBtn = document.createElement("button");
  keyBtn.className = "key" + (wide ? " wide" : "");
  keyBtn.textContent = k;
  applyKeyColor(keyBtn, k);
  keyBtn.addEventListener("click", ()=> onVirtualKey(k));
  keyboardEl.appendChild(keyBtn);
}

function onVirtualKey(k){
  if(state.status!=="playing") return;
  if(k==="enter"){ submitRow(); return; }
  if(k==="del"){ backspace(); return; }
  if(k.length===1 && state.col < COLS){
    setChar(k);
  }
}

function applyKeyColor(el, letter){
  const colorClass = state.keyboardColors.get(letter);
  if(colorClass){
    el.classList.remove("correct","present","absent");
    el.classList.add(colorClass);
  }
}

// ---------- Yazı girişi ----------

function setChar(ch){
  state.board[state.row][state.col] = ch;
  state.col++;
  updateBoardTile(state.row, state.col-1, ch, "bump");
}

function backspace(){
  if(state.col===0) return;
  state.col--;
  state.board[state.row][state.col] = "";
  updateBoardTile(state.row, state.col, "", "shake");
}

// ---------- Tahmin gönderme ----------

function submitRow(){
  if(state.col < COLS){
    rowShake(state.row);
    updateHint("Eksik harf var.");
    return;
  }
  const guess = state.board[state.row].join("");

  if(!isValidWord(guess)){
    rowShake(state.row);
    updateHint("Listede olmayan kelime.");
    return;
  }

  const results = scoreGuess(guess, state.solution);
  revealRow(state.row, results);

  if(guess === state.solution){
    state.status = "won";
    updateHint(`Tebrikler! Çözüm: ${state.solution.toUpperCase()}`);
    return;
  }

  if(state.row === ROWS-1){
    state.status = "lost";
    updateHint(`Olmadı. Çözüm: ${state.solution.toUpperCase()}`);
    return;
  }

  state.row++;
  state.col = 0;
  updateHint("Devam!");
}

function isValidWord(w){
  return WORDS.includes(w);
}

// ---------- Skorlama ----------

function scoreGuess(guess, solution){
  // Wordle benzeri iki geçişli değerlendirme
  const res = Array(COLS).fill("absent");
  const solArr = solution.split("");
  const used = Array(COLS).fill(false);

  // 1. Geçiş: doğru konum
  for(let i=0;i<COLS;i++){
    if(guess[i] === solArr[i]){
      res[i] = "correct";
      used[i] = true;
    }
  }
  // 2. Geçiş: yanlış konumda mevcut
  for(let i=0;i<COLS;i++){
    if(res[i] === "correct") continue;
    const idx = solArr.findIndex((ch, j)=> !used[j] && ch === guess[i]);
    if(idx !== -1){
      res[i] = "present";
      used[idx] = true;
    }
  }
  return res;
}

// ---------- Görsel geri bildirim ----------

function revealRow(r, results){
  for(let c=0;c<COLS;c++){
    const tile = boardEl.querySelector(`.tile[data-row="${r}"][data-col="${c}"]`);
    const letter = state.board[r][c];
    const status = results[c];

    setTimeout(()=>{
      if(!tile) return;
      tile.classList.add("reveal");
      tile.classList.remove("correct","present","absent");
      tile.classList.add(status);

      updateKeyboardColor(letter, status);
      // Klavye renklerini güncel tut
      renderKeyboard();
    }, c*120);
  }
}

function updateKeyboardColor(letter, status){
  const prev = state.keyboardColors.get(letter);
  const priority = { correct: 3, present: 2, absent: 1 };
  if(!prev || priority[status] > priority[prev]){
    state.keyboardColors.set(letter, status);
  }
}

function rowShake(r){
  for(let c=0;c<COLS;c++){
    const tile = boardEl.querySelector(`.tile[data-row="${r}"][data-col="${c}"]`);
    if(!tile) continue;
    tile.classList.remove("shake");
    void tile.offsetHeight;
    tile.classList.add("shake");
  }
}

// ---------- Yardım ve reset ----------

function updateHint(text){
  hintEl.textContent = text;
}

function resetGame(){
  state.solution = chooseSolution();
  state.row = 0;
  state.col = 0;
  state.board = Array.from({ length: ROWS }, () => Array(COLS).fill(""));
  state.status = "playing";
  state.keyboardColors.clear();
  renderBoard();
  renderKeyboard();
  updateHint("Yeni oyun! Bol şans.");
}