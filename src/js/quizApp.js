// quizApp.js
// Main logic for the Software Engineering Quiz App
// Assumes allQuestions.js is loaded first

export class QuizApp {
  constructor(allQuestions) {
    this.allQuestions = allQuestions;
    this.topics = [...new Set(allQuestions.map((q) => q.topic))];
    this.currentTopic = null;
    this.userAnswers = {}; // { topic: { [questionIndex]: userAnswer } }
    this.quizResults = {}; // { topic: { correct: [], wrong: [] } }
    this.STORAGE_KEY = "quizAppProgress";
  }

  initialize() {
    this.loadProgress();
    this.renderTopics();
    this.setupEventListeners();
  }

  // --- Local Storage Helpers ---
  saveProgress() {
    const data = {
      userAnswers: this.userAnswers,
      quizResults: this.quizResults,
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  loadProgress() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      this.userAnswers = parsed.userAnswers || {};
      this.quizResults = parsed.quizResults || {};
    }
  }

  // --- UI Rendering ---
  createTopicCard(topic) {
    const card = document.createElement("div");
    card.className =
      "topic-card bg-gray-800 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl";
    const questionCount = this.allQuestions.filter(
      (q) => q.topic === topic
    ).length;
    card.innerHTML = `
      <h3 class="text-xl font-semibold text-blue-400 mb-2">${topic}</h3>
      <p class="text-gray-400">${questionCount} questions</p>
    `;
    card.onclick = () => this.showQuestionsForTopic(topic);
    return card;
  }

  renderTopics() {
    const topicsContainer = document.getElementById("topics-container");
    topicsContainer.innerHTML = "";
    this.topics.forEach((topic) => {
      const card = this.createTopicCard(topic);
      topicsContainer.appendChild(card);
    });
  }

  createQuestionCard(
    question,
    index,
    selectedAnswer = null,
    showResult = false
  ) {
    const card = document.createElement("div");
    card.className = "question-card";
    card.id = `question-${index}`;

    const questionText = document.createElement("p");
    questionText.className = "text-lg mb-4";
    questionText.textContent = `${index + 1}. ${question.question}`;

    const optionsContainer = document.createElement("div");
    optionsContainer.className = "space-y-3";

    question.options.forEach((option) => {
      const optionDiv = document.createElement("div");
      optionDiv.className =
        "option-label bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition duration-150 cursor-pointer";
      optionDiv.innerHTML = `
        <label class="flex items-center cursor-pointer w-full">
          <input type="radio" name="q${index}" value="${option}" class="form-radio h-5 w-5 text-blue-500 bg-gray-800 border-gray-600 focus:ring-blue-400 focus:ring-offset-gray-700 mr-3" ${
        showResult ? "disabled" : ""
      }>
          <span>${option}</span>
        </label>
      `;
      // Set checked property directly for reliability
      const input = optionDiv.querySelector("input[type=radio]");
      if (selectedAnswer === option) input.checked = true;
      optionsContainer.appendChild(optionDiv);
    });

    // Hint Button
    const hintButton = document.createElement("button");
    hintButton.className =
      "hint-button mt-4 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out flex items-center";
    hintButton.innerHTML = `
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      Show Hint
    `;
    const hintContent = document.createElement("div");
    hintContent.className = "hint-content mt-4 p-4 bg-yellow-900/30 rounded-lg";
    hintContent.innerHTML = `<p class="text-yellow-300 font-medium">Correct Answer: ${question.answer}</p>`;
    hintContent.style.display = "none";
    hintButton.onclick = () => {
      if (hintContent.classList.contains("show")) {
        hintContent.classList.remove("show");
        setTimeout(() => {
          hintContent.style.display = "none";
        }, 300);
        hintButton.innerHTML = `
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Show Hint
        `;
      } else {
        hintContent.style.display = "block";
        setTimeout(() => {
          hintContent.classList.add("show");
        }, 10);
        hintButton.innerHTML = `
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          Hide Hint
        `;
      }
    };

    card.appendChild(questionText);
    card.appendChild(optionsContainer);
    card.appendChild(hintButton);
    card.appendChild(hintContent);

    // If showing results, show feedback
    if (showResult) {
      const feedbackDiv = document.createElement("div");
      feedbackDiv.className = "mt-4 p-4 rounded-lg";
      if (selectedAnswer === question.answer) {
        feedbackDiv.classList.add("bg-green-900/50");
        feedbackDiv.innerHTML = `<p class="text-green-400">✓ Correct!</p>`;
        card.classList.add("correct-answer");
      } else {
        feedbackDiv.classList.add("bg-red-900/50");
        feedbackDiv.innerHTML = `
          <p class="text-red-400">✗ Incorrect</p>
          <p class="text-gray-300 mt-2">Your answer: <span class="font-semibold">${
            selectedAnswer || "No answer"
          }</span></p>
          <p class="text-gray-300 mt-2">Correct answer: <span class="font-semibold">${
            question.answer
          }</span></p>
        `;
        card.classList.add("incorrect-answer");
      }
      card.appendChild(feedbackDiv);
    }

    return card;
  }

  updateProgressBar(topic) {
    const topicQuestions = this.allQuestions.filter((q) => q.topic === topic);
    const answers = this.userAnswers[topic] || {};
    const answered = Object.keys(answers).length;
    const percent = topicQuestions.length
      ? Math.round((answered / topicQuestions.length) * 100)
      : 0;
    const bar = document.getElementById("progress-bar");
    if (bar) {
      bar.style.width = percent + "%";
      bar.title = `${answered}/${topicQuestions.length} questions answered`;
    }
  }

  updateLiveScore(topic) {
    const topicQuestions = this.allQuestions.filter((q) => q.topic === topic);
    const answers = this.userAnswers[topic] || {};
    const answered = Object.keys(answers).length;
    document.getElementById("current-score").textContent = answered;
    document.getElementById("score-display").classList.remove("hidden");
  }

  renderQuestions(topic, showResult = false) {
    const questionsContainer = document.getElementById("questions-container");
    questionsContainer.innerHTML = "";
    const topicQuestions = this.allQuestions.filter((q) => q.topic === topic);
    const answers = this.userAnswers[topic] || {};
    topicQuestions.forEach((question, idx) => {
      const card = this.createQuestionCard(
        question,
        idx,
        answers[idx],
        showResult
      );
      questionsContainer.appendChild(card);
    });
    document.getElementById("total-questions").textContent =
      topicQuestions.length;
    this.updateProgressBar(topic);
    if (!showResult) this.updateLiveScore(topic);
  }

  showQuestionsForTopic(topic) {
    this.currentTopic = topic;
    document.getElementById("topic-selection").classList.add("hidden");
    document.getElementById("questions-screen").classList.remove("hidden");
    document.getElementById("results-screen").classList.add("hidden");
    document.getElementById("current-topic-title").textContent = topic;
    document.getElementById("score-display").classList.add("hidden");
    this.renderQuestions(topic);
    // Restore previous answers if any
    const questionsContainer = document.getElementById("questions-container");
    questionsContainer
      .querySelectorAll("input[type=radio]")
      .forEach((input) => {
        input.addEventListener("change", (e) => {
          const idx = parseInt(input.name.replace("q", ""));
          if (!this.userAnswers[topic]) this.userAnswers[topic] = {};
          this.userAnswers[topic][idx] = input.value;
          this.saveProgress();
          this.updateProgressBar(topic);
          this.updateLiveScore(topic);
        });
      });
  }

  calculateAndShowResults() {
    const topicQuestions = this.allQuestions.filter(
      (q) => q.topic === this.currentTopic
    );
    const answers = this.userAnswers[this.currentTopic] || {};
    let correct = 0;
    let wrong = 0;
    let correctList = [],
      wrongList = [];
    topicQuestions.forEach((q, idx) => {
      if (answers[idx] === q.answer) {
        correct++;
        correctList.push(idx);
      } else {
        wrong++;
        wrongList.push(idx);
      }
    });
    this.quizResults[this.currentTopic] = {
      correct: correctList,
      wrong: wrongList,
    };
    this.saveProgress();
    // Show results
    document.getElementById("current-score").textContent = correct;
    document.getElementById("score-display").classList.remove("hidden");
    this.showResultsScreen({ correct, wrong, total: topicQuestions.length });
  }

  showResultsScreen({ correct, wrong, total }) {
    document.getElementById("questions-screen").classList.add("hidden");
    document.getElementById("results-screen").classList.remove("hidden");
    document.getElementById("final-score").textContent = Math.round(
      (correct / total) * 100
    );
    document.getElementById("correct-count").textContent = correct;
    document.getElementById("total-count").textContent = total;
    // Show detailed results
    const questionsContainer = document.getElementById("questions-container");
    this.renderQuestions(this.currentTopic, true);
    // Update results progress bar
    const bar = document.getElementById("results-progress-bar");
    if (bar)
      bar.style.width = (total ? Math.round((correct / total) * 100) : 0) + "%";
  }

  setupEventListeners() {
    // Topic selection
    document.getElementById("back-to-topics").addEventListener("click", () => {
      document.getElementById("topic-selection").classList.remove("hidden");
      document.getElementById("questions-screen").classList.add("hidden");
      document.getElementById("results-screen").classList.add("hidden");
    });

    document
      .getElementById("back-to-topics-from-results")
      .addEventListener("click", () => {
        document.getElementById("topic-selection").classList.remove("hidden");
        document.getElementById("results-screen").classList.add("hidden");
      });

    document.getElementById("retry-quiz").addEventListener("click", () => {
      // Clear answers for this topic
      if (this.userAnswers[this.currentTopic])
        delete this.userAnswers[this.currentTopic];
      if (this.quizResults[this.currentTopic])
        delete this.quizResults[this.currentTopic];
      this.saveProgress();
      this.showQuestionsForTopic(this.currentTopic);
    });

    document.getElementById("submit-answers").addEventListener("click", () => {
      this.calculateAndShowResults();
    });

    // Reset Quiz button logic
    document.getElementById("reset-quiz").addEventListener("click", () => {
      localStorage.removeItem(this.STORAGE_KEY);
      this.userAnswers = {};
      this.quizResults = {};
      location.reload();
    });
  }
}
