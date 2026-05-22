import { CheckCircle2, Languages } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { api } from "../api";
import EmptyState from "../components/EmptyState";
import type { Lesson } from "../types";

export default function LessonPage() {
  const { id = "" } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [traditional, setTraditional] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.lesson(id).then(setLesson).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <EmptyState message={`Lesson unavailable: ${error}`} />;
  if (!lesson) return <EmptyState message="Loading lesson..." />;

  const complete = async () => {
    await api.saveProgress(lesson.id, true, 1);
    setSaved(true);
  };

  return (
    <section className="page lesson-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Lesson {lesson.sequence}</p>
          <h1>{lesson.title}</h1>
          <p className="lead">{lesson.summary}</p>
        </div>
        <button className="icon-button" onClick={() => setTraditional((value) => !value)} title="Toggle simplified/traditional">
          <Languages aria-hidden="true" />
          <span>{traditional ? "Traditional" : "Simplified"}</span>
        </button>
      </header>

      <article className="lesson-body">
        <p className="hanzi">{traditional ? lesson.body_traditional : lesson.body_simplified}</p>
        <p className="pinyin">{lesson.pinyin}</p>
      </article>

      <section>
        <h2>Vocabulary</h2>
        <div className="vocab-grid">
          {lesson.vocabulary.map((term) => (
            <div className="vocab-card" key={term.id}>
              <strong>{traditional ? term.traditional : term.simplified}</strong>
              <span>{term.pinyin}</span>
              <p>{term.definition}</p>
            </div>
          ))}
        </div>
      </section>

      <button className="primary-action" onClick={complete}>
        <CheckCircle2 aria-hidden="true" />
        <span>{saved ? "Progress saved" : "Mark complete"}</span>
      </button>
    </section>
  );
}
