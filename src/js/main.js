// Import all required modules
import { allQuestions } from "../data/allQuestions.js";
import { QuizApp } from "./quizApp.js";

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const app = new QuizApp(allQuestions);
  app.initialize();
});
