/* ============================================================
   11+ Dashboard – dashboard.js
   Reads quizHistory from LocalStorage and displays:
   - Overall performance
   - Performance by subject
   - Recent attempts
=============================================================== */

// ------------------------------
// DOM Elements
// ------------------------------
const dashboardStatusEl = document.getElementById("dashboard-status");
const overallBox = document.getElementById("dashboard-summary");
const subjectBox = document.getElementById("subject-breakdown");
const recentBox = document.getElementById("recent-attempts");

const overallAttemptsEl = document.getElementById("overall-attempts");
const overallCorrectEl = document.getElementById("overall-correct");
const overallAccuracyEl = document.getElementById("overall-accuracy");

const subjectStatsContainer = document.getElementById("subject-stats-container");
const recentAttemptsList = document.getElementById("recent-attempts-list");

// ------------------------------
// Load History from LocalStorage
// ------------------------------
function loadHistory() {
  try {
    const raw = localStorage.getItem("quizHistory");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.error("Error parsing quizHistory:", e);
    return [];
  }
}

// ------------------------------
// Compute Overall Stats
// ------------------------------
function computeOverallStats(history) {
  if (history.length === 0) return null;

  let totalAttempts = 0;
  let totalCorrect = 0;

  history.forEach(rec => {
    totalAttempts += rec.total || 0;
    totalCorrect += rec.score || 0;
  });

  const accuracy = totalAttempts > 0
    ? Math.round((totalCorrect / totalAttempts) * 100)
    : 0;

  return { totalAttempts, totalCorrect, accuracy };
}

// ------------------------------
// Compute Per-Subject Stats
// ------------------------------
function computeSubjectStats(history) {
  const subjectMap = {};

  history.forEach(rec => {
    const subj = rec.subject || "Unknown";
    if (!subjectMap[subj]) {
      subjectMap[subj] = {
        subject: subj,
        totalAttempts: 0,
        totalCorrect: 0
      };
    }
    subjectMap[subj].totalAttempts += rec.total || 0;
    subjectMap[subj].totalCorrect += rec.score || 0;
  });

  // Convert to array with accuracy
  return Object.values(subjectMap).map(s => {
    const accuracy = s.totalAttempts > 0
      ? Math.round((s.totalCorrect / s.totalAttempts) * 100)
      : 0;
    return { ...s, accuracy };
  });
}

// ------------------------------
// Render Overall Stats
// ------------------------------
function renderOverall(stats) {
  if (!stats) {
    overallBox.style.display = "none";
    return;
  }

  overallAttemptsEl.textContent = stats.totalAttempts;
  overallCorrectEl.textContent = stats.totalCorrect;
  overallAccuracyEl.textContent = `${stats.accuracy}%`;

  overallBox.style.display = "block";
}

// ------------------------------
// Render Subject Breakdown
// ------------------------------
function renderSubjectBreakdown(subjectStats) {
  if (!subjectStats || subjectStats.length === 0) {
    subjectBox.style.display = "none";
    return;
  }

  subjectStatsContainer.innerHTML = "";

  subjectStats.forEach(s => {
    const p = document.createElement("p");
    const niceName = formatSubjectName(s.subject);
    p.textContent = `${niceName}: ${s.totalCorrect}/${s.totalAttempts} correct (${s.accuracy}%)`;
    subjectStatsContainer.appendChild(p);
  });

  subjectBox.style.display = "block";
}

function formatSubjectName(subject) {
  switch ((subject || "").toLowerCase()) {
    case "maths": return "Maths";
    case "english": return "English";
    case "verbal": return "Verbal Reasoning";
    case "nonverbal": return "Non-Verbal Reasoning";
    case "data": return "Data Interpretation";
    default: return subject || "Unknown";
  }
}

// ------------------------------
// Render Recent Attempts
// ------------------------------
function renderRecentAttempts(history, maxItems = 5) {
  if (!history || history.length === 0) {
    recentBox.style.display = "none";
    return;
  }

  recentAttemptsList.innerHTML = "";

  const sorted = [...history].sort((a, b) =>
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  sorted.slice(0, maxItems).forEach(rec => {
    const li = document.createElement("li");
    const dateStr = rec.timestamp
      ? new Date(rec.timestamp).toLocaleString()
      : "Unknown date";

    li.textContent = `${formatSubjectName(rec.subject)} – ${rec.score}/${rec.total} (${rec.accuracy}%) on ${dateStr}`;
    recentAttemptsList.appendChild(li);
  });

  recentBox.style.display = "block";
}

// ------------------------------
// Main Init
// ------------------------------
function initDashboard() {
  const history = loadHistory();

  if (!history || history.length === 0) {
    dashboardStatusEl.textContent =
      "No quiz history found yet. Complete a quiz to see your progress here.";
    overallBox.style.display = "none";
    subjectBox.style.display = "none";
    recentBox.style.display = "none";
    return;
  }

  dashboardStatusEl.textContent = "";
  const overallStats = computeOverallStats(history);
  const subjectStats = computeSubjectStats(history);

  renderOverall(overallStats);
  renderSubjectBreakdown(subjectStats);
  renderRecentAttempts(history);
}

// Run on load
initDashboard();
