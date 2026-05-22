import { CheckCircle2, Lock, Map, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api";
import EmptyState from "../components/EmptyState";
import type { LearningPath } from "../types";

const stateIcon = {
  completed: CheckCircle2,
  recommended: Sparkles,
  locked: Lock
};

export default function LearningPathPage() {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.learningPath().then(setPath).catch((err) => setError(err.message));
  }, []);

  if (error) return <EmptyState message={`Learning path unavailable: ${error}`} />;
  if (!path) return <EmptyState message="Loading learning path..." />;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Curriculum map</p>
          <h1>Recommended path across language, characters, poetry, art, and culture</h1>
          <p className="lead">Lesson state is computed from demo-user progress so the path changes as completions are saved.</p>
        </div>
        <Map aria-hidden="true" className="header-icon" />
      </header>

      <div className="path-list">
        {path.modules.map((module) => (
          <article className={module.locked ? "path-module locked" : "path-module"} key={module.course_id}>
            <div className="path-module-header">
              <span>{module.sequence}</span>
              <div>
                <p className="eyebrow">{module.category} / {module.era} / {module.level}</p>
                <h2>{module.title}</h2>
              </div>
            </div>
            <div className="path-lessons">
              {module.lessons.map((lesson) => {
                const Icon = stateIcon[lesson.state];
                const content = (
                  <>
                    <Icon aria-hidden="true" />
                    <div>
                      <strong>{lesson.title}</strong>
                      <p>{lesson.summary}</p>
                    </div>
                    <span>{lesson.state}</span>
                  </>
                );
                return lesson.state === "locked" ? (
                  <div className="path-lesson locked" key={lesson.id}>{content}</div>
                ) : (
                  <Link className={`path-lesson ${lesson.state}`} to={`/lessons/${lesson.id}`} key={lesson.id}>{content}</Link>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
