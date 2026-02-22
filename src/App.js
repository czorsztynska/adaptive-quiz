import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState("menu");

  const [quizTitle, setQuizTitle] = useState("Nowy quiz");
  const [questions, setQuestions] = useState([]);

  const [queue, setQueue] = useState([]);
  const current = queue[0];

  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showWrongAnswer, setShowWrongAnswer] = useState(false);

  const [qText, setQText] = useState("");
  const [aText, setAText] = useState("");
  const [editIndex, setEditIndex] = useState(null);

  // Default quizzes
  const defaultQuizzes = [
    { id: "quiz1", title: "Quiz 1 - Miesiące i daty" },
    { id: "quiz2", title: "Quiz 2 - Państwa i podróżowanie" },
    { id: "quiz3", title: "Quiz 3 - Nawigacja i komunikacja" }
  ];

  // LOAD DEFAULT QUIZ
  const loadDefaultQuiz = async (quizId) => {
    try {
      const response = await fetch(`${window.location.origin}/adaptive-quiz/${quizId}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setQuizTitle(data.title);
      setQuestions(data.questions);
    } catch (err) {
      console.error(`Failed to load ${quizId}:`, err);
      alert(`Błąd ładowania ${quizId}`);
    }
  };

  // LOAD
  useEffect(() => {
    loadDefaultQuiz("quiz1");
  }, []);

  // SAVE
  const persist = updated => {
    setQuestions(updated);
  };

  // QUIZ
  const startQuiz = () => {
    if (questions.length === 0) return;
    // Shuffle questions for random order
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setAttempts(0);
    setCorrect(0);
    setFeedback("");
    setShowWrongAnswer(false);
    setMode("quiz");
  };

  const checkAnswer = () => {
    setAttempts(a => a + 1);
    console.log("Checking answer:", input, "against", current.answer);
    if (input.trim().toLowerCase() === current.answer.toLowerCase()) {
      setCorrect(c => c + 1);
      setQueue(q => q.slice(1));
      setFeedback("✅ Dobrze");
      setShowWrongAnswer(false);
      // Clear input immediately when the answer is correct (we advance automatically)
      setInput("");
    } else {
      setFeedback("❌ Źle – wróci");
      setShowWrongAnswer(true);
      // Keep the user's input so the comparison panel can show which letters are wrong
    }
  };

  const continueToNext = () => {
    // Shuffle remaining questions when moving wrong answer to end
    const remaining = queue.slice(1);
    const shuffledRemaining = [...remaining, current].sort(() => Math.random() - 0.5);
    setQueue(shuffledRemaining);
    setShowWrongAnswer(false);
    setFeedback("");
    // Now clear the input after the user clicked next
    setInput("");
  };

  const insertChar = (char) => {
    setInput(prev => prev + char);
  };

  const score =
    attempts === 0 ? 0 : Math.round((correct / attempts) * 100);

  // COMPARE ANSWERS
  const compareAnswers = (userAnswer, correctAnswer) => {
    const user = userAnswer.trim().toLowerCase();
    const correct = correctAnswer.toLowerCase();
    const maxLen = Math.max(user.length, correct.length);
    
    const comparison = [];
    for (let i = 0; i < maxLen; i++) {
      if (user[i] === correct[i]) {
        comparison.push({ char: correct[i] || "", isWrong: false, extra: false });
      } else if (i >= user.length) {
        comparison.push({ char: correct[i], isWrong: false, isMissing: true });
      } else if (i >= correct.length) {
        comparison.push({ char: user[i], isWrong: true, extra: true });
      } else {
        comparison.push({ char: user[i], isWrong: true, extra: false });
      }
    }
    return comparison;
  };

  const answerComparison = input && showWrongAnswer ? compareAnswers(input, current.answer) : null;


  // CREATOR
  const saveQuestion = () => {
    if (!qText || !aText) return;

    const updated = [...questions];

    if (editIndex !== null) {
      updated[editIndex] = {
        question: qText,
        answer: aText.toLowerCase()
      };
    } else {
      updated.push({
        question: qText,
        answer: aText.toLowerCase()
      });
    }

    persist(updated);
    setQText("");
    setAText("");
    setEditIndex(null);
  };

  const editQuestion = i => {
    setQText(questions[i].question);
    setAText(questions[i].answer);
    setEditIndex(i);
  };

  const deleteQuestion = i => {
    const updated = questions.filter((_, idx) => idx !== i);
    persist(updated);
  };

  // JSON
  const exportJSON = () => {
    const blob = new Blob(
      [JSON.stringify({ title: quizTitle, questions }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const data = JSON.parse(ev.target.result);
      setQuizTitle(data.title || "Zaimportowany quiz");
      persist(
        data.questions.map(q => ({
          question: q.question,
          answer: q.answer.toLowerCase()
        }))
      );
    };
    reader.readAsText(file);
  };

  // MENU
  if (mode === "menu") {
    return (
      <div className="app">
        <div className="card center">
          <h1>{quizTitle}</h1>
          <button onClick={startQuiz}>▶ Start quizu</button>
          <button onClick={() => setMode("create")}>
            ✏️ Kreator quizu
          </button>
        </div>
      </div>
    );
  }

  // CREATOR
  if (mode === "create") {
    return (
      <div className="app">
        <div className="card">
          <h2>Kreator</h2>

          <div className="default-quizzes">
            <p><strong>📚 Bazowe quizy:</strong></p>
            <div className="quiz-buttons">
              {defaultQuizzes.map(quiz => (
                <button
                  key={quiz.id}
                  className="default-quiz-btn"
                  onClick={() => loadDefaultQuiz(quiz.id)}
                >
                  {quiz.title}
                </button>
              ))}
            </div>
          </div>

          <hr />

          <input
            value={quizTitle}
            onChange={e => setQuizTitle(e.target.value)}
            placeholder="Tytuł quizu"
          />

          <input
            value={qText}
            onChange={e => setQText(e.target.value)}
            placeholder="Pytanie"
          />
          <input
            value={aText}
            onChange={e => setAText(e.target.value)}
            placeholder="Poprawna odpowiedź"
          />

          <button onClick={saveQuestion}>
            {editIndex !== null ? "💾 Zapisz zmiany" : "➕ Dodaj pytanie"}
          </button>

          <div className="list">
            {questions.map((q, i) => (
              <div key={i} className="item">
                {i + 1}. {q.question}
                <div className="item-actions">
                  <button onClick={() => editQuestion(i)}>✏️</button>
                  <button
                    className="danger"
                    onClick={() => deleteQuestion(i)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="json-controls">
            <button onClick={exportJSON}>⬇ JSON</button>
            <label className="import">
              ⬆ JSON
              <input type="file" accept=".json" onChange={importJSON} />
            </label>
          </div>

          <button onClick={() => setMode("menu")}>⬅ Menu</button>
        </div>
      </div>
    );
  }

  // QUIZ END
  if (!current) {
    return (
      <div className="app">
        <div className="card center">
          <h2>Koniec</h2>
          <p>Wynik: {score}%</p>
          <button onClick={() => setMode("menu")}>🔁 Menu</button>
        </div>
      </div>
    );
  }

  // QUIZ
  return (
    <div className="app">
      <div className="card">
        <h2>{current.question}</h2>

        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !showWrongAnswer && checkAnswer()}
          placeholder="Twoja odpowiedź"
          disabled={showWrongAnswer}
        />

        <div className="umlaut-buttons">
          {["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"].map(char => (
            <button
              key={char}
              className="umlaut-btn"
              onClick={() => insertChar(char)}
              disabled={showWrongAnswer}
            >
              {char}
            </button>
          ))}
        </div>

        {!showWrongAnswer && (
          <button onClick={checkAnswer}>Sprawdź</button>
        )}

        <div className="feedback">{feedback}</div>

        {showWrongAnswer && (
          <div className="wrong-answer-panel">
            <div className="answer-comparison">
              <div className="comparison-row">
                <strong>Twoja odpowiedź:</strong>
                <span className="comparison-text">
                  {answerComparison && answerComparison.map((item, i) => (
                    <span
                      key={i}
                      className={`char ${item.isWrong ? "wrong" : ""} ${item.isMissing ? "missing" : ""}`}
                    >
                      {item.extra && item.char ? item.char : (item.char || "□")}
                    </span>
                  ))}
                </span>
              </div>
              <div className="comparison-row">
                <strong>Poprawna odpowiedź:</strong>
                <span className="comparison-text correct">
                  {current.answer}
                </span>
              </div>
            </div>
            <button onClick={continueToNext}>Dalej →</button>
          </div>
        )}

        <div className="stats">
          <span>Próby: {attempts}</span>
          <span>Poprawne: {correct}</span>
          <span>{score}%</span>
        </div>
      </div>
    </div>
  );
}
