import {
  Activity,
  Boxes,
  CheckCircle2,
  Clock,
  Cloud,
  Compass,
  GitBranch,
  Layers3,
  Network,
  ShieldCheck,
  Terminal
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api";
import EmptyState from "../components/EmptyState";
import type { PlatformAcademyCatalog, PlatformAcademyRoadmap, PlatformTrack, Progress, UserDashboard } from "../types";

const trackIcons: Record<string, LucideIcon> = {
  kubernetes: Network,
  eks: Cloud,
  helm: Boxes,
  argocd: GitBranch,
  sre: Activity
};

function completedForTrack(track: PlatformTrack, progressByLesson: Map<number, Progress>) {
  return track.course.lessons.filter((lesson) => progressByLesson.get(lesson.id)?.completed).length;
}

export default function PlatformAcademyPage() {
  const [catalog, setCatalog] = useState<PlatformAcademyCatalog | null>(null);
  const [roadmap, setRoadmap] = useState<PlatformAcademyRoadmap | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [dashboard, setDashboard] = useState<UserDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.platformAcademy(), api.platformRoadmap(), api.progress(), api.dashboard()])
      .then(([catalogPayload, roadmapPayload, progressPayload, dashboardPayload]) => {
        setCatalog(catalogPayload);
        setRoadmap(roadmapPayload);
        setProgress(progressPayload);
        setDashboard(dashboardPayload);
      })
      .catch((err) => setError(err.message));
  }, []);

  const progressByLesson = useMemo(() => new Map(progress.map((item) => [item.lesson_id, item])), [progress]);

  const platformLessons = useMemo(() => catalog?.tracks.flatMap((track) => track.course.lessons) ?? [], [catalog]);
  const completedLessons = platformLessons.filter((lesson) => progressByLesson.get(lesson.id)?.completed).length;
  const nextLesson = platformLessons.find((lesson) => !progressByLesson.get(lesson.id)?.completed) ?? platformLessons[0];
  const completionPercent = platformLessons.length > 0 ? Math.round((completedLessons / platformLessons.length) * 100) : 0;

  if (error) return <EmptyState message={`Platform Academy unavailable: ${error}`} />;
  if (!catalog || !roadmap) return <EmptyState message="Loading Platform Academy..." />;

  return (
    <section className="page platform-academy-page">
      <header className="academy-hero">
        <div className="academy-hero-copy">
          <p className="eyebrow">Platform Academy</p>
          <h1>Learn Kubernetes, EKS, Helm, ArgoCD, and SRE through production scenarios</h1>
          <p className="lead">{catalog.promise}</p>
          <div className="academy-actions">
            {nextLesson && (
              <Link className="primary-action" to={`/lessons/${nextLesson.id}`}>
                <Compass aria-hidden="true" />
                <span>{completedLessons > 0 ? "Continue path" : "Start the academy"}</span>
              </Link>
            )}
            <a href="#platform-labs">
              <Terminal aria-hidden="true" />
              <span>Open labs</span>
            </a>
          </div>
        </div>
        <div className="academy-progress-panel" aria-label="Platform Academy progress">
          <div>
            <span>Progress</span>
            <strong>{completionPercent}%</strong>
          </div>
          <div className="progress-track">
            <div style={{ width: `${completionPercent}%` }} />
          </div>
          <dl className="academy-stats">
            <div>
              <dt>Courses</dt>
              <dd>{catalog.total_courses}</dd>
            </div>
            <div>
              <dt>Lessons</dt>
              <dd>{catalog.total_lessons}</dd>
            </div>
            <div>
              <dt>Completed</dt>
              <dd>{completedLessons}</dd>
            </div>
            <div>
              <dt>XP</dt>
              <dd>{dashboard?.xp.total ?? 0}</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="academy-section roadmap-layout" aria-labelledby="platform-roadmap-title">
        <div className="section-heading">
          <p className="eyebrow">Role roadmap</p>
          <h2 id="platform-roadmap-title">A senior-platform path from workload debugging to reliability leadership</h2>
        </div>
        <div className="roadmap-column">
          {roadmap.stages.map((stage) => (
            <article className="roadmap-stage" key={stage.sequence}>
              <span>{stage.sequence}</span>
              <div>
                <h3>{stage.title}</h3>
                <p>{stage.role}</p>
                <strong>{stage.focus}</strong>
                <ul>
                  {stage.checkpoints.map((checkpoint) => (
                    <li key={checkpoint}>{checkpoint}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
        <aside className="academy-briefing">
          <ShieldCheck aria-hidden="true" />
          <h2>Production standard</h2>
          <p>
            Each course connects concepts to inspectable signals: commands, failure modes, design tradeoffs, review prompts, and local-safe labs.
          </p>
        </aside>
      </section>

      <section className="academy-section" aria-labelledby="platform-tracks-title">
        <div className="section-heading">
          <p className="eyebrow">Learning tracks</p>
          <h2 id="platform-tracks-title">Five tracks with direct lesson entry and progress</h2>
        </div>
        <div className="track-board">
          {catalog.tracks.map((track) => {
            const Icon = trackIcons[track.slug] ?? Layers3;
            const completed = completedForTrack(track, progressByLesson);
            const nextTrackLesson = track.course.lessons.find((lesson) => !progressByLesson.get(lesson.id)?.completed) ?? track.course.lessons[0];
            return (
              <article className="track-row" data-track={track.slug} key={track.slug}>
                <div className="track-heading">
                  <Icon aria-hidden="true" />
                  <div>
                    <p className="eyebrow">{track.course.category} / {track.course.level}</p>
                    <h3>{track.title}</h3>
                    <p>{track.role}</p>
                  </div>
                </div>
                <div className="track-summary">
                  <p>{track.summary}</p>
                  <ul>
                    {track.outcomes.map((outcome) => (
                      <li key={outcome}>{outcome}</li>
                    ))}
                  </ul>
                </div>
                <div className="track-lessons">
                  <div className="track-progress-line">
                    <CheckCircle2 aria-hidden="true" />
                    <span>
                      {completed} / {track.course.lessons.length} lessons complete
                    </span>
                  </div>
                  {track.course.lessons.map((lesson) => (
                    <Link to={`/lessons/${lesson.id}`} key={lesson.id}>
                      <span>Lesson {lesson.sequence}</span>
                      <strong>{lesson.title}</strong>
                    </Link>
                  ))}
                  {nextTrackLesson && (
                    <Link className="track-cta" to={`/lessons/${nextTrackLesson.id}`}>
                      {completed > 0 ? "Continue this track" : "Start this track"}
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="academy-section" id="platform-labs" aria-labelledby="platform-labs-title">
        <div className="section-heading">
          <p className="eyebrow">Practical labs</p>
          <h2 id="platform-labs-title">Local-safe drills for the incidents and reviews platform teams actually face</h2>
        </div>
        <div className="lab-grid">
          {catalog.labs.map((lab) => (
            <article className="lab-card" key={lab.slug}>
              <div className="lab-card-header">
                <span>{lab.track}</span>
                <span>
                  <Clock aria-hidden="true" />
                  {lab.estimated_minutes} min
                </span>
              </div>
              <h3>{lab.title}</h3>
              <p>{lab.scenario}</p>
              <div className="word-list">
                {lab.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <pre>{lab.commands.slice(0, 3).join("\n")}</pre>
              <ul>
                {lab.checklist.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {lab.lesson_id && (
                <Link className="track-cta" to={`/lessons/${lab.lesson_id}`}>
                  Open lab lesson
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
