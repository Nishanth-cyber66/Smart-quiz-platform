SMART QUIZ & EXAM PREPARATION PLATFORM
======================================

TECHNOLOGIES
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Storage: JSON files (no database installation needed)

FEATURES
1. Subject-wise MCQ quizzes: C Programming, Java, Python and DBMS (10 sample questions per subject)
2. Timer-based tests (1 minute per question)
3. Automatic score and percentage calculation on the backend
4. Correct answers and explanations after submission
5. Leaderboard saved between server restarts

HOW TO RUN ON WINDOWS
---------------------
1. Install Node.js LTS from https://nodejs.org/ if it is not already installed.
2. Extract this ZIP file.
3. Open the extracted folder: smart-quiz-platform
4. Click the folder address bar in File Explorer, type cmd and press Enter.
5. In the Command Prompt, run:

       npm install

6. After installation, run:

       npm start

7. Open Chrome and visit:

       http://localhost:3000

IMPORTANT
- Keep the Command Prompt open while using the website.
- To stop the server, return to Command Prompt and press Ctrl + C.
- Student scores are stored in data/results.json.
- Questions are stored in data/questions.json. You can edit this file to add your own MCQs.
- The sample questions are for demonstration. Replace/add questions according to your syllabus.

PROJECT STRUCTURE
-----------------
smart-quiz-platform/
  server.js
  package.json
  README.txt
  data/
    questions.json
    results.json
  public/
    index.html
    style.css
    app.js

PRESENTATION EXPLANATION
-----------------------
"Our project is a Smart Quiz and Exam Preparation Platform. It helps students prepare
for exams through subject-wise multiple-choice questions. Students can take timed tests.
The backend checks their answers and calculates marks automatically. After submission,
students can see the correct answers with explanations. The leaderboard motivates
students by showing the top scores. We used HTML, CSS and JavaScript for the frontend,
Node.js and Express for the backend, and JSON files for storing questions and results."
