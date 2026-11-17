const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const QUESTIONS_FILE = path.join(DATA_DIR, "questions.json");
const RESULTS_FILE = path.join(DATA_DIR, "results.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    return fallback;
  }
}

function saveResults(results) {
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

// Send subjects available in the question bank.
app.get("/api/subjects", (req, res) => {
  const questions = readJson(QUESTIONS_FILE, []);
  const subjects = [...new Set(questions.map(q => q.subject))].sort();
  res.json(subjects);
});

// Send questions without exposing the correct answers.
app.get("/api/questions", (req, res) => {
  const subject = String(req.query.subject || "");
  const requestedCount = Math.min(Math.max(Number(req.query.count) || 5, 1), 20);
  const questions = readJson(QUESTIONS_FILE, []);
  const selected = questions
    .filter(q => q.subject.toLowerCase() === subject.toLowerCase())
    .sort(() => Math.random() - 0.5)
    .slice(0, requestedCount)
    .map(({ id, subject, question, options }) => ({ id, subject, question, options }));

  if (!selected.length) {
    return res.status(404).json({ message: "No questions found for this subject." });
  }
  res.json(selected);
});

// Check answers on the server, calculate marks and save the attempt.
app.post("/api/submit", (req, res) => {
  const { studentName, subject, answers, timeTaken } = req.body || {};
  if (!studentName || !subject || !answers || typeof answers !== "object") {
    return res.status(400).json({ message: "Please provide your name, subject and answers." });
  }

  const allQuestions = readJson(QUESTIONS_FILE, []);
  const questionIds = Object.keys(answers);
  const attemptQuestions = allQuestions.filter(
    q => q.subject.toLowerCase() === String(subject).toLowerCase() && questionIds.includes(String(q.id))
  );

  if (!attemptQuestions.length) {
    return res.status(400).json({ message: "No valid quiz answers were submitted." });
  }

  let score = 0;
  const review = attemptQuestions.map(q => {
    const selectedAnswer = Number(answers[q.id]);
    const isCorrect = Number.isInteger(selectedAnswer) && selectedAnswer === q.answerIndex;
    if (isCorrect) score++;
    return {
      id: q.id,
      question: q.question,
      options: q.options,
      selectedAnswer: Number.isInteger(selectedAnswer) ? selectedAnswer : null,
      correctAnswer: q.answerIndex,
      isCorrect,
      explanation: q.explanation
    };
  });

  const total = review.length;
  const result = {
    id: Date.now(),
    studentName: String(studentName).trim().slice(0, 40),
    subject,
    score,
    total,
    percentage: Math.round((score / total) * 100),
    timeTaken: Math.max(0, Number(timeTaken) || 0),
    date: new Date().toISOString()
  };

  const results = readJson(RESULTS_FILE, []);
  results.push(result);
  saveResults(results);

  res.json({ ...result, review });
});

// Show best scores first.
app.get("/api/leaderboard", (req, res) => {
  const results = readJson(RESULTS_FILE, []);
  results.sort((a, b) => b.percentage - a.percentage || a.timeTaken - b.timeTaken);
  res.json(results.slice(0, 10));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Smart Quiz Platform is running at http://localhost:${PORT}`);
});
