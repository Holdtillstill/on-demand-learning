import { useEffect, useState } from "react";

import { api } from "../api";
import EmptyState from "../components/EmptyState";
import type { Progress } from "../types";

export default function ProgressPage() {
  const [progress, setProgress] = useState<Progress[]>([]);

  useEffect(() => {
    api.progress().then(setProgress);
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Mock learner account: demo-user</p>
          <h1>Progress tracking</h1>
          <p className="lead">Lesson completions feed Prometheus counters and give the worker useful data for recommendations.</p>
        </div>
      </header>

      {!progress.length && <EmptyState message="No completed lessons yet. Mark a lesson complete to populate this view." />}
      <div className="table">
        {progress.map((item) => (
          <div className="table-row" key={item.id}>
            <span>Lesson {item.lesson_id}</span>
            <strong>{item.completed ? "Completed" : "In progress"}</strong>
            <span>{Math.round(item.score * 100)}%</span>
            <span>{new Date(item.updated_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
