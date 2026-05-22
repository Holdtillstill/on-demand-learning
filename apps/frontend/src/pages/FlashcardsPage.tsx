import { CheckCircle2, RotateCcw, Send, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "../api";
import EmptyState from "../components/EmptyState";
import type { ReviewCard } from "../types";

export default function FlashcardsPage() {
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.dueReviews().then((queue) => setCards(queue.cards));
  }, []);

  if (!cards.length) return <EmptyState message="Loading flashcards..." />;
  const card = cards[index % cards.length];
  const currentPosition = (index % cards.length) + 1;

  const submit = async (quality: number, correct: boolean) => {
    const review = await api.answerReview(card.id, quality, correct);
    await api.quizAttempt(card.lesson_id, correct ? 1 : 0.4, { [String(card.id)]: correct ? card.answer : "needs review" });
    setStatus(`Next due ${new Date(review.due_at).toLocaleString()}`);
    setRevealed(false);
    setIndex((value) => value + 1);
  };

  return (
    <section className="page narrow">
      <header className="page-header">
        <div>
          <p className="eyebrow">Spaced repetition demo</p>
          <h1>Due review queue</h1>
          <p className="lead">{cards.length} cards due. Answers update SRS scheduling, quiz attempt telemetry, and XP counters.</p>
        </div>
      </header>

      <div className="review-progress" aria-label={`Review card ${currentPosition} of ${cards.length}`}>
        <span>Card {currentPosition} of {cards.length}</span>
        <div className="progress-track">
          <div style={{ width: `${Math.round((currentPosition / cards.length) * 100)}%` }} />
        </div>
      </div>

      <div className="flashcard">
        <span>{card.difficulty} / ease {card.ease.toFixed(1)} / interval {card.interval_days}d</span>
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
        <button onClick={() => { setIndex((value) => value + 1); setRevealed(false); setStatus(""); }}>
          Skip
        </button>
        <button onClick={() => void submit(2, false)}>
          <XCircle aria-hidden="true" />
          <span>Again</span>
        </button>
        <button className="primary-action" onClick={() => void submit(5, true)}>
          <Send aria-hidden="true" />
          <span>Know it</span>
        </button>
      </div>
      {status && (
        <p className="status-message" role="status">
          <CheckCircle2 aria-hidden="true" />
          <span>{status}</span>
        </p>
      )}
    </section>
  );
}
