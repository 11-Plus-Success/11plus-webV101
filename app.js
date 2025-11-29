/* ============================================================
   11+ Quiz Engine – app.js
   Works on:
   - index.html  (subject selection → redirect to quiz.html)
   - quiz.html   (load questions, run quiz)
=============================================================== */

// ------------------------------
// Utility
// ------------------------------
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// --------------------------------------------------------
// INDEX PAGE LOGIC (subject selection → go to quiz.html)
// --------------------------------------------------------
function initIndexPage() {
  const subjectButtons = document.querySelectorAll(".subject-btn");
  if (!subjectButtons.length) return; // Not on index.html

  subjectButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const subject = btn.dataset.subject;
      if (!subject) return;
      // Go to quiz page with subject in query string
      window.location.href = `quiz.html?subject=${encodeURIComponent(subject)}`;
    });
  });
}

// --------------------------------------------------------
// QUIZ PAGE LOGIC
// --------------------------------------------------------

// Global quiz state (only used on quiz.html)
let subject = "";
let questions = [];
let currentIndex = 0;
let score = 0;
let selectedOption = null;

// Quiz DOM elements (may be null on non-quiz pages)
const quizCard = document.getElementById("quiz-card");
const quizStatus = document.getElementById("quiz-status");
const questionText = document.getElementById("question-text");
const optionsList = document.getElementById("options-list");
const explanationBox = document.getElementById("explanation-box");
const explanationText = document.getElementById("explanation-text");
const checkAnswerBtn = document.getElementById("check-answer-btn");
const nextQuestionBtn = document.getElementById("next-question-btn");
const summarySection = document.getElementById("quiz-summary");
const summaryText = document.getElementById("summary-text");
const retryBtn = document.getElementById("retry-btn");
const backBtn = document.getElementById("back-to-subjects-btn");

function onQuizPage() {
  // We consider we are on quiz.html if the main quiz card exists
  return !!quizCard;
}

// ------------------------------
// Load Subject from URL
// ------------------------------
function detectSubject() {
  const params = new URLSearchParams(window.location.search);
  subject = params.get("subject");

  const subjectLabel = document.getElementById("quiz-subject-label");

  if (!subject) {
    if (quizStatus) {
      quizStatus.textContent = "No subject selected. Returning to home…";
    }
    setTimeout(() => (window.location.href = "index.html"), 1500);
    return;
  }

  if (subjectLabel) {
    subjectLabel.textContent = subject;
  }
}

// ------------------------------
// Load Question JSON
// ------------------------------
async function loadQuestions() {
  if (!quizStatus) return;

  try {
    quizStatus.textContent = "Loading questions...";

    const response = await fetch(`questions/${subject}.json`);

    if (!response.ok) throw new Error("File not found");

    const data = await response.json();
    questions = shuffle(data.questions);

    if (!questions || questions.length === 0) {
      quizStatus.textContent = "No questions found.";
      return;
    }

    const totalQ = document.getElementById("total-questions");
    if (totalQ) totalQ.textContent = questions.length;

    quizStatus.style.display = "none";
    if (quizCard) quizCard.style.display = "block";
    showQuestion();
  } catch (error) {
    console.error(error);
    quizStatus.textContent =
      "Error loading question files. Please check that the JSON files exist and are valid.";
  }
}

// ------------------------------
// Render a Question
// ------------------------------
function showQuestion() {
  if (!questionText || !optionsList) return;

  selectedOption = null;
  if (explanationBox) explanationBox.style.display = "none";
  if (checkAnswerBtn) checkAnswerBtn.disabled = true;
  if (nextQuestionBtn) nextQuestionBtn.disabled = true;

  const q = questions[currentIndex];

  const currentNumEl = document.getElementById("current-question-number");
  if (currentNumEl) currentNumEl.textContent = currentIndex + 1;

  questionText.textContent = q.question;

  optionsList.innerHTML = "";

  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.className = "option-btn";
    btn.onclick = () => selectOption(btn, opt);
    optionsList.appendChild(btn);
  });
}

// ------------------------------
// Select an Option
// ------------------------------
function selectOption(btn, value) {
  selectedOption = value;

  document.querySelectorAll(".option-btn").forEach(b => {
    b.classList.remove("selected");
  });

  btn.classList.add("selected");

  if (checkAnswerBtn) checkAnswerBtn.disabled = false;
}

// ------------------------------
// Check Answer
// ------------------------------
function checkAnswer() {
  const q = questions[currentIndex];

  document.querySelectorAll(".option-btn").forEach(btn => {
    btn.disabled = true;

    if (btn.textContent === q.answer) {
      btn.classList.add("correct");
    } else if (btn.classList.contains("selected")) {
      btn.classList.add("incorrect");
    }
  });

  if (explanationText && explanationBox) {
    explanationText.textContent = q.explanation;
    explanationBox.style.display = "block";
  }

  if (selectedOption === q.answer) {
    score++;
  }

  if (checkAnswerBtn) checkAnswerBtn.disabled = true;
  if (nextQuestionBtn) nextQuestionBtn.disabled = false;
}

// ------------------------------
// Next Question
// ------------------------------
function nextQuestion() {
  currentIndex++;

  if (currentIndex >= questions.length) {
    endQuiz();
  } else {
    showQuestion();
  }
}

// ------------------------------
// End Quiz + Save Stats
// ------------------------------
function endQuiz() {
  if (quizCard) quizCard.style.display = "none";
  if (summarySection) summarySection.style.display = "block";

  const total = questions.length;
  const accuracy = Math.round((score / total) * 100);

  if (summaryText) {
    summaryText.textContent = `You scored ${score} out of ${total} (${accuracy}%).`;
  }

  saveResults(subject, score, total, accuracy);
}

// ------------------------------
// Save to LocalStorage (for dashboard)
// ------------------------------
function saveResults(subject, score, total, accuracy) {
  const record = {
    subject,
    score,
    total,
    accuracy,
    timestamp: new Date().toISOString()
  };

  const history = JSON.parse(localStorage.getItem("quizHistory") || "[]");
  history.push(record);
  localStorage.setItem("quizHistory", JSON.stringify(history));
}

// ------------------------------
// Init Quiz Page
// ------------------------------
function initQuizPage() {
  if (!onQuizPage()) return;

  // Button handlers only if elements exist
  if (checkAnswerBtn) {
    checkAnswerBtn.addEventListener("click", checkAnswer);
  }
  if (nextQuestionBtn) {
    nextQuestionBtn.addEventListener("click", nextQuestion);
  }
  if (retryBtn) {
    retryBtn.onclick = () => {
      window.location.href = `quiz.html?subject=${encodeURIComponent(subject)}`;
    };
  }
  if (backBtn) {
    backBtn.onclick = () => {
      window.location.href = "index.html";
    };
  }

  detectSubject();
  // If subject was missing, detectSubject already redirects
  if (subject) {
    loadQuestions();
  }
}

// ------------------------------
// Global Init (runs on every page)
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initIndexPage();  // subject buttons on index.html
  initQuizPage();   // quiz logic on quiz.html
});
