// app.js

// 10 soruluk örnek seti (çoktan seçmeli, 4 seçenekli)
const questions = [
  {
    q: "Türkiye'nin başkenti hangi şehirdir?",
    options: ["İstanbul", "Ankara", "İzmir", "Bursa"],
    correctIndex: 1
  },
  {
    q: "HTML kısaltmasının açılımı nedir?",
    options: [
      "Hyperlinks and Text Markup Language",
      "HyperText Markup Language",
      "Home Tool Markup Language",
      "Hyper Transfer Mark Language"
    ],
    correctIndex: 1
  },
  {
    q: "Bir yıl kaç haftadır (yaklaşık)?",
    options: ["48", "50", "52", "54"],
    correctIndex: 2
  },
  {
    q: "JavaScript'te dizi uzunluğu hangi özellik ile alınır?",
    options: ["size()", "count()", "length", "len()"],
    correctIndex: 2
  },
  {
    q: "Dünya'nın uydusunun adı nedir?",
    options: ["Deimos", "Phobos", "Ay", "Titan"],
    correctIndex: 2
  },
  {
    q: "CSS'de sınıf seçici nasıl yazılır?",
    options: ["#sınıf", ".sınıf", "::sınıf", "[sınıf]"],
    correctIndex: 1
  },
  {
    q: "HTTP durum kodu 404 neyi ifade eder?",
    options: ["Sunucu Hatası", "Yönlendirme", "Bulunamadı", "Yetkisiz"],
    correctIndex: 2
  },
  {
    q: "Türkiye'nin nüfusça en büyük şehri hangisidir?",
    options: ["Ankara", "İstanbul", "İzmir", "Bursa"],
    correctIndex: 1
  },
  {
    q: "ECMAScript hangi dilin standart adıdır?",
    options: ["Java", "C#", "JavaScript", "Python"],
    correctIndex: 2
  },
  {
    q: "CSS'de renk değeri olarak hangisi geçerlidir?",
    options: ["rgb(255,0,0)", "color(red)", "paint(red)", "rgba#red"],
    correctIndex: 0
  }
];

let state = {
  index: 0,
  score: 0,
  selections: Array(questions.length).fill(null),
  startTime: null,
  endTime: null,
  reviewOpen: false
};

const els = {
  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  questionText: document.getElementById("questionText"),
  optionsList: document.getElementById("optionsList"),
  nextBtn: document.getElementById("nextBtn"),
  skipBtn: document.getElementById("skipBtn"),
  quizCard: document.getElementById("quizCard"),
  resultCard: document.getElementById("resultCard"),
  scoreText: document.getElementById("scoreText"),
  timeText: document.getElementById("timeText"),
  summaryList: document.getElementById("summaryList"),
  restartBtn: document.getElementById("restartBtn"),
  reviewBtn: document.getElementById("reviewBtn"),
  themeToggle: document.getElementById("themeToggle")
};

// Başlat
init();

function init() {
  state = {
    index: 0,
    score: 0,
    selections: Array(questions.length).fill(null),
    startTime: Date.now(),
    endTime: null,
    reviewOpen: false
  };
  els.resultCard.classList.add("hidden");
  els.quizCard.classList.remove("hidden");
  renderQuestion();
  updateProgress();
  wireEvents();
}

function wireEvents() {
  els.nextBtn.onclick = handleNext;
  els.skipBtn.onclick = handleSkip;
  els.restartBtn.onclick = init;
  els.reviewBtn.onclick = () => {
    state.reviewOpen = !state.reviewOpen;
    els.summaryList.classList.toggle("hidden", !state.reviewOpen);
  };
  els.themeToggle.onclick = toggleTheme;
}

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
}

function renderQuestion() {
  const item = questions[state.index];
  els.questionText.textContent = item.q;
  els.optionsList.innerHTML = "";

  item.options.forEach((opt, i) => {
    const li = document.createElement("li");
    li.className = "option";
    li.setAttribute("data-index", i);
    li.innerHTML = `
      <input type="radio" name="opt" id="opt-${i}" ${state.selections[state.index] === i ? "checked" : ""} />
      <label for="opt-${i}">${opt}</label>
    `;
    li.onclick = () => selectOption(i);
    els.optionsList.appendChild(li);
  });

  els.nextBtn.disabled = state.selections[state.index] == null;
}

function selectOption(i) {
  state.selections[state.index] = i;
  // Görsel geri bildirim
  Array.from(els.optionsList.children).forEach((li, idx) => {
    li.classList.toggle("selected", idx === i);
  });
  els.nextBtn.disabled = false;
}

function handleNext() {
  // Skoru anında değerlendir (ilk seferde)
  const sel = state.selections[state.index];
  const correct = questions[state.index].correctIndex;
  if (sel != null && sel === correct && !isAlreadyCounted(state.index)) {
    state.score += 1;
  }
  // Son soruda sonuç ekranına geç
  if (state.index >= questions.length - 1) {
    finish();
  } else {
    state.index += 1;
    renderQuestion();
    updateProgress();
  }
}

function handleSkip() {
  // Seçim yoksa direkt geç
  if (state.index >= questions.length - 1) {
    finish();
  } else {
    state.index += 1;
    renderQuestion();
    updateProgress();
  }
}

function isAlreadyCounted(idx) {
  // Aynı soruya geri dönülse bile çifte sayımı önlemek için basit kontrol
  // Bu örnekte ilerleme tek yönlü olduğu için her soru bir kez değerlendirilir.
  return false;
}

function updateProgress() {
  const current = state.index + 1;
  const total = questions.length;
  els.progressText.textContent = `Soru ${current} / ${total}`;
  const pct = Math.round((current - 1) / total * 100);
  els.progressBar.style.width = `${pct}%`;
}

function finish() {
  state.endTime = Date.now();
  const total = questions.length;
  const sec = Math.floor((state.endTime - state.startTime) / 1000);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");

  els.quizCard.classList.add("hidden");
  els.resultCard.classList.remove("hidden");
  els.scoreText.textContent = `Puanınız: ${state.score} / ${total}`;
  els.timeText.textContent = `Süre: ${mm}:${ss}`;
  els.progressBar.style.width = "100%";
  els.progressText.textContent = `Tamamlandı`;

  renderSummary();
}

function renderSummary() {
  els.summaryList.innerHTML = "";
  questions.forEach((item, idx) => {
    const sel = state.selections[idx];
    const correct = item.correctIndex;
    const div = document.createElement("div");
    div.className = "summary-item";
    const status = sel === correct ? "Doğru" : (sel == null ? "Boş" : "Yanlış");
    const statusColor = sel === correct ? "var(--accent)" : (sel == null ? "var(--muted)" : "var(--danger)");
    div.innerHTML = `
      <div>
        <strong>${idx + 1}. Soru:</strong> ${item.q}
        <div style="margin-top:6px;color:var(--muted)">
          <strong>Seçiminiz:</strong> ${sel != null ? item.options[sel] : "-"}
          <br/>
          <strong>Doğru cevap:</strong> ${item.options[correct]}
        </div>
      </div>
      <span style="color:${statusColor};font-weight:600">${status}</span>
    `;
    els.summaryList.appendChild(div);
  });
  // Başlangıçta özet gizli
  els.summaryList.classList.add("hidden");
}