import { Award, Flame, Gauge, Layers3, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api";
import EmptyState from "../components/EmptyState";
import type { UserDashboard } from "../types";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<UserDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard().then(setDashboard).catch((err) => setError(err.message));
  }, []);

  if (error) return <EmptyState message={`Dashboard unavailable: ${error}`} />;
  if (!dashboard) return <EmptyState message="Loading learner dashboard..." />;

  const goalPercent = Math.min(100, Math.round((dashboard.daily_goal.earned_xp_today / dashboard.daily_goal.target_xp) * 100));

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Mock learner account: {dashboard.user_id}</p>
          <h1>Learner dashboard</h1>
          <p className="lead">XP, streaks, due reviews, and achievements are backed by API events and Prometheus counters.</p>
        </div>
      </header>

      <div className="metric-grid">
        <article className="metric-tile">
          <Trophy aria-hidden="true" />
          <span>Total XP</span>
          <strong>{dashboard.xp.total}</strong>
          <p>{dashboard.xp.lesson_completion_xp} lesson / {dashboard.xp.quiz_xp} quiz / {dashboard.xp.review_xp} review</p>
        </article>
        <article className="metric-tile">
          <Flame aria-hidden="true" />
          <span>Daily streak</span>
          <strong>{dashboard.streak.current_days} day{dashboard.streak.current_days === 1 ? "" : "s"}</strong>
          <p>{dashboard.streak.freeze_available ? "Freeze available" : "No freeze earned yet"}</p>
        </article>
        <article className="metric-tile">
          <Gauge aria-hidden="true" />
          <span>Daily goal</span>
          <strong>{goalPercent}%</strong>
          <div className="progress-track" aria-label="Daily goal progress">
            <div style={{ width: `${goalPercent}%` }} />
          </div>
        </article>
        <article className="metric-tile">
          <Layers3 aria-hidden="true" />
          <span>Due reviews</span>
          <strong>{dashboard.due_reviews}</strong>
          <Link to="/flashcards">Open review queue</Link>
        </article>
      </div>

      <section className="dashboard-section">
        <h2>Achievements</h2>
        <div className="achievement-grid">
          {dashboard.achievements.map((achievement) => (
            <article className={achievement.earned ? "achievement earned" : "achievement"} key={achievement.code}>
              <Award aria-hidden="true" />
              <div>
                <h3>{achievement.title}</h3>
                <p>{achievement.description}</p>
                <span>{achievement.progress} / {achievement.target}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
