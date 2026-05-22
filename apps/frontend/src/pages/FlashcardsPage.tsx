import { RotateCcw, Send } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "../api";
import EmptyState from "../components/EmptyState";
import type { Flashcard } from "../types";

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.flashcards().then(setCards);
  }, []);

  if (!cards.length) return <EmptyState message="Loading flashcards..." />;
  const card = cards[index % cards.length];

  const submit = async () => {
    await api.quizAttempt(card.lesson_id, revealed ? 1 : 0.5, { [String(card.id)]: card.answer });
    setSubmitted(true);
  };

  return (
    <section className="page narrow">
      <header className="page-header">
        <div>
          <p className="eyebrow">Spaced repetition demo</p>
          <h1>Flashcards and quiz attempt telemetry</h1>
        </div>
      </header>

      <div className="flashcard">
        <span>{card.difficulty}</span>
        <h2>{card.prompt}</h2>
        {revealed && (
          <div className="answer">
            <strong>{card.answer}</strong>
            <p>{card.pinyin}</p>
          </div>
        )}
      </div>

      <div className="actions">
        <button onClick={() => setRevealed((value) => !value)}>
          <RotateCcw aria-hidden="true" />
          <span>{revealed ? "Hide" : "Reveal"}</span>
        </button>
        <button onClick={() => { setIndex((value) => value + 1); setRevealed(false); setSubmitted(false); }}>
          Next
        </button>
        <button className="primary-action" onClick={submit}>
          <Send aria-hidden="true" />
          <span>{submitted ? "Submitted" : "Submit quiz attempt"}</span>
        </button>
      </div>
    </section>
  );
}
