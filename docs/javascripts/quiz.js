// ─── On page load ────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const labId = detectCurrentLab();

  // Update nav tab lock indicators for all labs
  updateNavLockIndicators();

  if (!labId) return;

  // Show or hide the lock overlay for this lab
  const overlay = document.getElementById(`lock-${labId}`);
  if (overlay) {
    const unlocked = localStorage.getItem(`${labId}_unlocked`) === "true";
    if (unlocked) {
      overlay.style.display = "none";
    } else {
      document.body.style.overflow = "hidden"; // prevent scrolling past overlay
    }
  }
});

// ─── Nav lock indicators ──────────────────────────────────────────────────────
// Stamps or removes a 🔒 prefix on each locked lab's navigation tab.

function updateNavLockIndicators() {
  const lockedLabs = ["lab2", "lab3", "lab4", "lab5"];

  // Material for MkDocs renders nav tabs as <a> elements inside
  // .md-tabs__list or the drawer; we target all nav links by href suffix.
  const allLinks = document.querySelectorAll("a");

  allLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";

    lockedLabs.forEach((labId) => {
      // Match links that end with /labN/ or /labN/index.html (both MkDocs patterns)
      const pattern = new RegExp(`/${labId}(?:/(?:index\\.html)?)?$`);
      if (!pattern.test(href)) return;

      const isUnlocked = localStorage.getItem(`${labId}_unlocked`) === "true";
      const text = link.textContent;

      // Remove any existing lock prefix before re-stamping
      const cleaned = text.replace(/^🔒\s*/, "");

      link.textContent = isUnlocked ? cleaned : `🔒 ${cleaned}`;
    });
  });
}

// ─── Go Back handler (called from lock overlay button) ───────────────────────

function goBackFromLock() {
  if (document.referrer && new URL(document.referrer).origin === window.location.origin) {
    history.back();
  } else {
    // Fall back to Home if there is no same-origin referrer
    window.location.href = "../";
  }
}

// ─── Quiz submission ──────────────────────────────────────────────────────────

function submitQuiz(labId) {
  const container  = document.getElementById(`quiz-${labId}`);
  const questions  = container.querySelectorAll(".quiz-question");
  let   allAnswered = true;

  questions.forEach((q, index) => {
    const name   = `q${index + 1}-${labId}`;
    const chosen = container.querySelector(`input[name="${name}"]:checked`);
    const correct = q.dataset.correct;
    const fb     = q.querySelector(".quiz-feedback");

    if (!chosen) { allAnswered = false; return; }

    fb.hidden = false;

    if (chosen.value === correct) {
      fb.innerHTML = `<span class="correct">✅ Correct!</span>`;
    } else {
      const explanations = getExplanations(labId);
      fb.innerHTML = `
        <span class="incorrect">❌ Not quite right.</span>
        <p>The correct answer is <strong>${correct}</strong>.</p>
        <p class="explanation">${explanations[index]}</p>
      `;
    }
  });

  const resultDiv = container.querySelector(".quiz-result");
  resultDiv.hidden = false;

  if (!allAnswered) {
    resultDiv.innerHTML = `<p class="warning">⚠️ Please answer all questions before submitting.</p>`;
    return;
  }

  // Lab 5: show congratulations modal instead of unlocking
  if (container.dataset.final === "true") {
    const modal = document.getElementById("congrats-modal");
    if (modal) modal.hidden = false;
    resultDiv.innerHTML = `<p class="unlock-msg">🎉 You've completed all the labs!</p>`;
    return;
  }

  // Labs 1–4: unlock the next lab regardless of correctness
  const nextLab = container.dataset.unlocks;
  localStorage.setItem(`${nextLab}_unlocked`, "true");

  // Re-render nav indicators now that a new lab was unlocked
  updateNavLockIndicators();

  const nextLabel = nextLab.replace("lab", "Lab ");
  resultDiv.innerHTML = `
    <p class="unlock-msg">
      🔓 <strong>${nextLabel}</strong> is now unlocked!
      <a href="../${nextLab}/">Go to ${nextLabel} →</a>
    </p>
  `;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectCurrentLab() {
  const match = window.location.pathname.match(/\/(lab\d)\//);
  return match ? match[1] : null;
}

function getExplanations(labId) {
  // One explanation string per question, shown when the answer is wrong.
  const map = {
    lab5: [
      "Bob goes beyond just source code — in Lab 5, Step 5.2, Bob is asked to analyze the Java dependency and build upgrade risks, identifying what could block a move from Java 8 to Java 17 and separating source refactors from ecosystem-level risks.",
      "Lab 5, Step 3.2 explicitly states: 'Let's start with Product.java' as the first domain-model modernization example, asking Bob to convert it to a record.",
      "Lab 5, Step 2.2 states that Bob may recommend creating 'modernized/' and 'migration-guide/' folders, and that 'These folders are part of the modernization workflow.'"
    ],
    lab1: [
      "Lab 1, Step 2 explicitly states that Agent Mode is for 'Writing, modifying, refactoring, or improving code', listing actions such as implementing features, creating new files, fixing bugs, and running tools.",
      "Plan Mode is designed for planning, designing, and strategizing before implementation. In Lab 1, Step 2.2, it is used to plan the project structure, API endpoints, and database schema before any code is written.",
      "Lab 1, Step 4.2 defines literate coding as 'the practice of writing code that is self-explanatory through clear structure, meaningful naming conventions, and well-placed comments', aimed at making code easy to understand, maintain, and evolve."
    ],
    lab2: [
      "Lab 2's comparison table lists Ask Mode as the mode that 'Understands and explains code' and 'Helps with architecture analysis', while Agent Mode 'Modifies and generates code' and 'Implements features'.",
      "Step 7.3 of Lab 2 states there are two scope options: Global (available across all workspaces) and Project (available only in the current project).",
      "Step 8 of Lab 2 describes the Bob Findings panel as showing 'identified issues' and allowing you to 'review Bob's suggested fixes' and apply them directly."
    ],
    lab3: [
      "Lab 3, Step 4.1 explains that this code is dangerous because 'user input is inserted directly into the SQL string', allowing an attacker to inject arbitrary SQL. The fix is to use parameterized queries.",
      "Ask Mode is used before making any changes. In Lab 3, Step 2.1, Ask Mode is selected first to explore the codebase and understand what is there, what is missing, and what should be fixed — without modifying anything yet.",
      "Lab 3, Step 3.1 states: 'Plan Mode is useful here because you are not fixing a single bug. You are prioritizing a group of related security and project hygiene issues.'"
    ],
    lab4: [
      "As demonstrated in Lab 4, Bob can translate a complete application from one programming language to another — preserving the original logic while applying the target language's best practices, async patterns, documentation style, and error handling.",
      "Lab 4, Step 2.2 instructs Bob to produce: a Python-to-JavaScript feature mapping, library equivalents, proposed file layout in solution/, dependency recommendations, and validation steps — all before any code is written.",
      "Bob is not limited to reading code — in Lab 4, Step 4.1, Bob runs both the Python and JavaScript versions of data_processor and compares their outputs directly in the workspace to confirm equivalent behavior."
    ]
  };
  return map[labId] || [];
}
