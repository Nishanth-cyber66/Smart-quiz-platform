const $ = (id) => document.getElementById(id);

let questions = [];
let answers = {};
let currentIndex = 0;
let secondsLeft = 0;
let timerInterval = null;
let quizStartedAt = 0;
let currentSubject = "";

async function loadSubjects() {
  try {
    const response = await fetch("/api/subjects");
    const subjects = await response.json();
    $("subject").innerHTML = '<option value="">Choose a subject</option>' +
      subjects.map(s => `<option value="${s}">${s}</option>`).join("");
  } catch (error) {
    $("subject").innerHTML = '<option value="">Could not load subjects</option>';
    $("setupMessage").textContent = "Could not connect to the server. Please restart it and refresh.";
  }
}

function showSection(id) {
  ["quizSection", "resultSection"].forEach(section => $(section).classList.add("hidden"));
  if (id) $(id).classList.remove("hidden");
}

async function startQuiz() {
  const name = $("studentName").value.trim();
  const subject = $("subject").value;
  const count = Number($("questionCount").value);

  if (!name) return $("setupMessage").textContent = "Please enter your name first.";
  if (!subject) return $("setupMessage").textContent = "Please select a subject.";

  $("setupMessage").textContent = "Loading your questions...";
  $("startBtn").disabled = true;

  try {
    const response = await fetch(`/api/questions?subject=${encodeURIComponent(subject)}&count=${count}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load questions.");

    questions = data;
    answers = {};
    currentIndex = 0;
    currentSubject = subject;
    secondsLeft = questions.length * 60;
    quizStartedAt = Date.now();
    $("quizTitle").textContent = `${subject} Quiz`;
    $("setupMessage").textContent = "";
    showSection("quizSection");
    renderQuestion();
    startTimer();
    $("quizSection").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    $("setupMessage").textContent = error.message;
  } finally {
    $("startBtn").disabled = false;
  }
}

function startTimer() {
  clearInterval(timerInterval);
  updateTimer();
  timerInterval = setInterval(() => {
    secondsLeft--;
    updateTimer();
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      submitQuiz(true);
    }
  }, 1000);
}

function updateTimer() {
  const mins = Math.floor(Math.max(0, secondsLeft) / 60);
  const secs = Math.max(0, secondsLeft) % 60;
  $("timer").textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  $("timer").parentElement.classList.toggle("warning", secondsLeft <= 30);
}

function renderQuestion() {
  const q = questions[currentIndex];
  $("questionNumber").textContent = `QUESTION ${String(currentIndex + 1).padStart(2, "0")}`;
  $("questionText").textContent = q.question;
  $("progressText").textContent = `Question ${currentIndex + 1} of ${questions.length}`;
  $("answeredText").textContent = `${Object.keys(answers).length} answered`;
  $("quizProgress").style.width = `${((currentIndex + 1) / questions.length) * 100}%`;

  $("options").innerHTML = q.options.map((option, index) => `
    <button class="option ${answers[q.id] === index ? "selected" : ""}" data-index="${index}">
      <span class="option-letter">${String.fromCharCode(65 + index)}</span><span>${escapeHtml(option.trim())}</span>
    </button>`).join("");

  $("options").querySelectorAll(".option").forEach(button => {
    button.addEventListener("click", () => {
      answers[q.id] = Number(button.dataset.index);
      renderQuestion();
    });
  });

  $("prevBtn").disabled = currentIndex === 0;
  $("prevBtn").style.opacity = currentIndex === 0 ? ".45" : "1";
  $("nextBtn").classList.toggle("hidden", currentIndex === questions.length - 1);
  $("submitBtn").classList.toggle("hidden", currentIndex !== questions.length - 1);
  renderDots();
}

function renderDots() {
  $("questionDots").innerHTML = questions.map((q, i) => `
    <button class="dot ${i === currentIndex ? "current" : ""} ${answers[q.id] !== undefined ? "done" : ""}" data-index="${i}">${i + 1}</button>
  `).join("");
  $("questionDots").querySelectorAll(".dot").forEach(button => {
    button.addEventListener("click", () => {
      currentIndex = Number(button.dataset.index);
      renderQuestion();
    });
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[char]));
}

$("prevBtn").addEventListener("click", () => {
  if (currentIndex > 0) { currentIndex--; renderQuestion(); }
});
$("nextBtn").addEventListener("click", () => {
  if (currentIndex < questions.length - 1) { currentIndex++; renderQuestion(); }
});
$("submitBtn").addEventListener("click", () => {
  const unanswered = questions.length - Object.keys(answers).length;
  const message = unanswered ? `You have ${unanswered} unanswered question(s). Submit anyway?` : "Are you sure you want to submit your test?";
  if (confirm(message)) submitQuiz(false);
});
$("startBtn").addEventListener("click", startQuiz);
$("tryAgainBtn").addEventListener("click", () => {
  clearInterval(timerInterval);
  showSection(null);
  $("home").scrollIntoView({ behavior: "smooth" });
  $("setupMessage").textContent = "Choose a subject to start another quiz.";
});

async function submitQuiz(autoSubmitted) {
  clearInterval(timerInterval);
  $("submitBtn").disabled = true;
  try {
    const timeTaken = Math.round((Date.now() - quizStartedAt) / 1000);
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: $("studentName").value.trim(),
        subject: currentSubject,
        answers,
        timeTaken
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Could not submit quiz.");
    displayResult(result, autoSubmitted);
    loadLeaderboard();
  } catch (error) {
    alert(error.message);
  } finally {
    $("submitBtn").disabled = false;
  }
}

function displayResult(result, autoSubmitted) {
  showSection("resultSection");
  $("resultHeading").textContent = result.percentage >= 80 ? "Excellent work!" : result.percentage >= 50 ? "Good effort!" : "Keep practising!";
  $("resultMessage").textContent = autoSubmitted ? "Your time ended, so your test was submitted automatically." : "Your quiz has been submitted successfully.";
  $("scoreValue").textContent = `${result.score}/${result.total}`;
  $("percentageValue").textContent = `${result.percentage}%`;
  $("correctValue").textContent = result.score;
  $("wrongValue").textContent = result.total - result.score;
  const m = Math.floor(result.timeTaken / 60), s = result.timeTaken % 60;
  $("timeValue").textContent = `${m}:${String(s).padStart(2, "0")}`;

  $("reviewList").innerHTML = result.review.map((item, i) => {
    const chosen = item.selectedAnswer === null ? "Not answered" : `${String.fromCharCode(65 + item.selectedAnswer)}. ${escapeHtml(item.options[item.selectedAnswer])}`;
    const correct = `${String.fromCharCode(65 + item.correctAnswer)}. ${escapeHtml(item.options[item.correctAnswer])}`;
    return `<article class="review-item">
      <div class="review-status ${item.isCorrect ? "correct" : "incorrect"}">${item.isCorrect ? "✓ Correct" : "✕ Incorrect"}</div>
      <h4>${i + 1}. ${escapeHtml(item.question)}</h4>
      <p class="review-answer">Your answer: ${chosen}</p>
      <p class="review-answer">Correct answer: <strong>${correct}</strong></p>
      <div class="explanation"><strong>Explanation:</strong> ${escapeHtml(item.explanation)}</div>
    </article>`;
  }).join("");
  $("resultSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function loadLeaderboard() {
  try {
    const response = await fetch("/api/leaderboard");
    const results = await response.json();
    if (!results.length) {
      $("leaderRows").innerHTML = '<p class="empty-state">No attempts yet. Be the first to take a quiz!</p>';
      return;
    }
    $("leaderRows").innerHTML = results.map((r, i) => `
      <div class="leader-row">
        <strong>${i + 1}. ${escapeHtml(r.studentName)}</strong>
        <span>${escapeHtml(r.subject)}</span>
        <span class="score-pill">${r.score}/${r.total} · ${r.percentage}%</span>
      </div>`).join("");
  } catch (error) {
    $("leaderRows").innerHTML = '<p class="empty-state">Leaderboard is temporarily unavailable.</p>';
  }
}

loadSubjects();
loadLeaderboard();
