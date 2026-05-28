import {
  Activity,
  ArrowRight,
  BookOpen,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Cloud,
  Compass,
  Filter,
  GitBranch,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  ListChecks,
  Map,
  Network,
  Route,
  Search,
  ShieldCheck,
  Terminal
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Navigate, Route as RouterRoute, Routes, useParams } from "react-router-dom";

import { api } from "./api";
import type {
  Course,
  Lesson,
  PlatformAcademyCatalog,
  PlatformAcademyRoadmap,
  PlatformLab,
  PlatformRoadmapStage,
  PlatformTrack,
  Progress,
  UserDashboard
} from "./types";

type AcademyData = {
  catalog: PlatformAcademyCatalog;
  roadmap: PlatformAcademyRoadmap;
  progress: Progress[];
  dashboard: UserDashboard;
};

type ContentBlock =
  | { type: "heading"; content: string }
  | { type: "paragraph"; content: string }
  | { type: "list"; items: string[] }
  | { type: "code"; lines: string[] };

const levelOrder = ["Fresher", "Intermediate", "Advanced"];

const categoryIcons: Record<string, LucideIcon> = {
  Kubernetes: Network,
  kubectl: Terminal,
  "Cloud Native": Boxes,
  EKS: Cloud,
  Helm: Boxes,
  ArgoCD: GitBranch,
  Security: ShieldCheck,
  SRE: Activity
};

function iconForCategory(category: string) {
  return categoryIcons[category] ?? Layers3;
}

function allCourses(catalog: PlatformAcademyCatalog) {
  return catalog.levels.flatMap((level) => level.courses);
}

function completedLessonIds(progress: Progress[]) {
  return new Set(progress.filter((row) => row.completed).map((row) => row.lesson_id));
}

function courseProgress(course: Course, completed: Set<number>) {
  const done = course.lessons.filter((lesson) => completed.has(lesson.id)).length;
  return {
    done,
    total: course.lessons.length,
    percent: course.lessons.length > 0 ? Math.round((done / course.lessons.length) * 100) : 0
  };
}

function nextLesson(courses: Course[], completed: Set<number>) {
  return courses.flatMap((course) => course.lessons).find((lesson) => !completed.has(lesson.id)) ?? courses[0]?.lessons[0];
}

function parseContent(text: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  };
  const flushCode = () => {
    if (codeLines.length > 0) {
      blocks.push({ type: "code", lines: codeLines });
      codeLines = [];
    }
  };

  text.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      flushCode();
      return;
    }
    if (line.startsWith("## ")) {
      flushList();
      flushCode();
      blocks.push({ type: "heading", content: line.replace("## ", "") });
      return;
    }
    if (line.startsWith("- ")) {
      flushCode();
      listItems.push(line.replace("- ", ""));
      return;
    }
    if (line.startsWith("$ ")) {
      flushList();
      codeLines.push(line);
      return;
    }
    flushList();
    flushCode();
    blocks.push({ type: "paragraph", content: line });
  });
  flushList();
  flushCode();
  return blocks;
}

function RichContent({ text }: { text: string }) {
  return (
    <>
      {parseContent(text).map((block, index) => {
        if (block.type === "heading") return <h2 key={`${block.type}-${index}`}>{block.content}</h2>;
        if (block.type === "paragraph") return <p key={`${block.type}-${index}`}>{block.content}</p>;
        if (block.type === "code") {
          return (
            <pre key={`${block.type}-${index}`}>
              <code>{block.lines.join("\n")}</code>
            </pre>
          );
        }
        return (
          <ul key={`${block.type}-${index}`}>
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        );
      })}
    </>
  );
}

function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <section className="state-panel">
      <Compass aria-hidden="true" />
      <h1>{title}</h1>
      {detail && <p>{detail}</p>}
    </section>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-track" aria-label={`${value}% complete`}>
      <div style={{ width: `${value}%` }} />
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  return <span className={`level-badge level-${level.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{level}</span>;
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="academy-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <GraduationCap aria-hidden="true" />
          <div>
            <strong>Cloud Native Platform Academy</strong>
            <span>Kubernetes, EKS, Helm, ArgoCD, SRE</span>
          </div>
        </Link>
        <nav aria-label="Platform Academy navigation">
          <NavLink to="/" end>
            <LayoutDashboard aria-hidden="true" />
            Dashboard
          </NavLink>
          <NavLink to="/roadmap">
            <Map aria-hidden="true" />
            Roadmap
          </NavLink>
          <NavLink to="/labs">
            <ListChecks aria-hidden="true" />
            Labs
          </NavLink>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

function DashboardPage({ data }: { data: AcademyData }) {
  const completed = useMemo(() => completedLessonIds(data.progress), [data.progress]);
  const courses = useMemo(() => allCourses(data.catalog), [data.catalog]);
  const topics = useMemo(() => Array.from(new Set(courses.map((course) => course.category))), [courses]);
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [query, setQuery] = useState("");

  const totalCompleted = courses.flatMap((course) => course.lessons).filter((lesson) => completed.has(lesson.id)).length;
  const completionPercent = data.catalog.total_lessons > 0 ? Math.round((totalCompleted / data.catalog.total_lessons) * 100) : 0;
  const recommended = nextLesson(courses, completed);

  const filteredCourses = courses.filter((course) => {
    const levelGroup = data.catalog.tracks.find((track) => track.course.slug === course.slug)?.level_group ?? course.level;
    const text = `${course.title} ${course.description} ${course.category} ${course.level}`.toLowerCase();
    return (
      (selectedLevel === "All" || levelGroup === selectedLevel) &&
      (selectedTopic === "All" || course.category === selectedTopic) &&
      text.includes(query.toLowerCase())
    );
  });

  return (
    <section className="page">
      <header className="dashboard-hero">
        <div>
          <p className="eyebrow">Platform Academy</p>
          <h1>Build real Kubernetes platform judgment from fresher basics to production architecture.</h1>
          <p className="lead">{data.catalog.promise}</p>
          <div className="hero-actions">
            {recommended && (
              <Link className="primary-action" to={`/lessons/${recommended.id}`}>
                <Compass aria-hidden="true" />
                {totalCompleted > 0 ? "Continue learning" : "Start learning"}
              </Link>
            )}
            <Link className="secondary-action" to="/roadmap">
              <Route aria-hidden="true" />
              View roadmap
            </Link>
          </div>
        </div>
        <aside className="progress-panel" aria-label="Learner progress">
          <span>Overall progress</span>
          <strong>{completionPercent}%</strong>
          <ProgressBar value={completionPercent} />
          <dl>
            <div>
              <dt>Courses</dt>
              <dd>{data.catalog.total_courses}</dd>
            </div>
            <div>
              <dt>Lessons</dt>
              <dd>{data.catalog.total_lessons}</dd>
            </div>
            <div>
              <dt>Completed</dt>
              <dd>{totalCompleted}</dd>
            </div>
            <div>
              <dt>XP</dt>
              <dd>{data.dashboard.xp.total}</dd>
            </div>
          </dl>
        </aside>
      </header>

      <section className="level-strip" aria-label="Curriculum levels">
        {data.catalog.levels.map((level) => (
          <article key={level.slug}>
            <LevelBadge level={level.level_group} />
            <h2>{level.title}</h2>
            <p>{level.audience}</p>
            <strong>
              {level.total_courses} courses / {level.total_lessons} lessons
            </strong>
          </article>
        ))}
      </section>

      <section className="toolbar" aria-label="Course filters">
        <div className="search-box">
          <Search aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Kubernetes, Helm, IRSA..." />
        </div>
        <div className="segmented">
          <Filter aria-hidden="true" />
          {["All", ...levelOrder].map((level) => (
            <button key={level} className={selectedLevel === level ? "selected" : ""} onClick={() => setSelectedLevel(level)}>
              {level}
            </button>
          ))}
        </div>
        <div className="segmented topics">
          {["All", ...topics].map((topic) => (
            <button key={topic} className={selectedTopic === topic ? "selected" : ""} onClick={() => setSelectedTopic(topic)}>
              {topic}
            </button>
          ))}
        </div>
      </section>

      <section className="course-board" aria-label="Platform Academy courses">
        {filteredCourses.map((course) => {
          const progress = courseProgress(course, completed);
          const Icon = iconForCategory(course.category);
          const track = data.catalog.tracks.find((item) => item.course.slug === course.slug);
          return (
            <Link className="course-card" to={`/courses/${course.id}`} key={course.id}>
              <div className="course-card-top">
                <Icon aria-hidden="true" />
                <div>
                  <LevelBadge level={track?.level_group ?? course.level} />
                  <span>{course.category}</span>
                </div>
              </div>
              <h2>{course.title}</h2>
              <p>{course.description}</p>
              <div className="course-progress">
                <span>
                  {progress.done} / {progress.total} lessons
                </span>
                <ProgressBar value={progress.percent} />
              </div>
            </Link>
          );
        })}
      </section>
      {filteredCourses.length === 0 && <EmptyState title="No courses match those filters." />}
    </section>
  );
}

function RoadmapPage({ data }: { data: AcademyData }) {
  const stageCourses = (stage: PlatformRoadmapStage) =>
    stage.course_slugs
      .map((slug) => allCourses(data.catalog).find((course) => course.slug === slug))
      .filter((course): course is Course => Boolean(course));

  return (
    <section className="page">
      <header className="page-heading">
        <p className="eyebrow">Recommended order</p>
        <h1>Roadmap from first kubectl habits to production platform ownership</h1>
      </header>
      <div className="roadmap">
        {data.roadmap.stages.map((stage) => (
          <article className="roadmap-stage" key={stage.sequence}>
            <div className="stage-index">{stage.sequence}</div>
            <div>
              <div className="stage-header">
                <LevelBadge level={stage.level_group} />
                <h2>{stage.title}</h2>
              </div>
              <p>{stage.role}</p>
              <strong>{stage.focus}</strong>
              <ul>
                {stage.checkpoints.map((checkpoint) => (
                  <li key={checkpoint}>{checkpoint}</li>
                ))}
              </ul>
              <div className="stage-courses">
                {stageCourses(stage).map((course) => (
                  <Link to={`/courses/${course.id}`} key={course.id}>
                    <BookOpen aria-hidden="true" />
                    {course.title}
                  </Link>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LabsPage({ data }: { data: AcademyData }) {
  const topics = useMemo(() => Array.from(new Set(data.catalog.labs.map((lab) => lab.track))), [data.catalog.labs]);
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const filteredLabs = data.catalog.labs.filter(
    (lab) => (selectedLevel === "All" || lab.level_group === selectedLevel) && (selectedTopic === "All" || lab.track === selectedTopic)
  );

  return (
    <section className="page">
      <header className="page-heading">
        <p className="eyebrow">Local-safe practice</p>
        <h1>Labs for realistic platform incidents and architecture reviews</h1>
      </header>
      <section className="toolbar compact" aria-label="Lab filters">
        <div className="segmented">
          {["All", ...levelOrder].map((level) => (
            <button key={level} className={selectedLevel === level ? "selected" : ""} onClick={() => setSelectedLevel(level)}>
              {level}
            </button>
          ))}
        </div>
        <div className="segmented topics">
          {["All", ...topics].map((topic) => (
            <button key={topic} className={selectedTopic === topic ? "selected" : ""} onClick={() => setSelectedTopic(topic)}>
              {topic}
            </button>
          ))}
        </div>
      </section>
      <section className="lab-grid" aria-label="Platform labs">
        {filteredLabs.map((lab) => (
          <LabCard lab={lab} key={lab.slug} />
        ))}
      </section>
      {filteredLabs.length === 0 && <EmptyState title="No labs match those filters." />}
    </section>
  );
}

function LabCard({ lab }: { lab: PlatformLab }) {
  return (
    <article className="lab-card">
      <div className="lab-meta">
        <LevelBadge level={lab.level_group} />
        <span>
          <Clock aria-hidden="true" />
          {lab.estimated_minutes} min
        </span>
      </div>
      <h2>{lab.title}</h2>
      <p>{lab.scenario}</p>
      <div className="chip-list">
        {lab.skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
      <pre>
        <code>{lab.commands.join("\n")}</code>
      </pre>
      <ul>
        {lab.checklist.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {lab.lesson_id && (
        <Link className="text-link" to={`/lessons/${lab.lesson_id}`}>
          Open lesson <ArrowRight aria-hidden="true" />
        </Link>
      )}
    </article>
  );
}

function CoursePage({ data }: { data: AcademyData }) {
  const { id = "" } = useParams();
  const completed = useMemo(() => completedLessonIds(data.progress), [data.progress]);
  const course = allCourses(data.catalog).find((item) => item.id === Number(id));
  if (!course) return <EmptyState title="Course not found." detail="The catalog may need to be refreshed." />;
  const Icon = iconForCategory(course.category);
  const progress = courseProgress(course, completed);
  const track = data.catalog.tracks.find((item) => item.course.id === course.id);

  return (
    <section className="page">
      <Link className="back-link" to="/">
        <ChevronLeft aria-hidden="true" />
        Courses
      </Link>
      <header className="course-hero">
        <Icon aria-hidden="true" />
        <div>
          <LevelBadge level={track?.level_group ?? course.level} />
          <h1>{course.title}</h1>
          <p className="lead">{course.description}</p>
        </div>
        <aside>
          <span>{course.category}</span>
          <strong>{progress.percent}%</strong>
          <ProgressBar value={progress.percent} />
          <p>
            {progress.done} of {progress.total} lessons complete
          </p>
        </aside>
      </header>
      {track && (
        <section className="outcome-panel">
          <h2>{track.title}</h2>
          <p>{track.summary}</p>
          <ul>
            {track.outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="lesson-list" aria-label={`${course.title} lessons`}>
        {course.lessons.map((lesson) => (
          <Link className="lesson-row" to={`/lessons/${lesson.id}`} key={lesson.id}>
            <span>{lesson.sequence}</span>
            <div>
              <h2>{lesson.title}</h2>
              <p>{lesson.summary}</p>
            </div>
            {completed.has(lesson.id) ? <CheckCircle2 aria-label="Completed" /> : <ArrowRight aria-hidden="true" />}
          </Link>
        ))}
      </section>
    </section>
  );
}

function LessonPage({ onProgressSaved }: { onProgressSaved: () => void }) {
  const { id = "" } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLesson(null);
    setError("");
    api.lesson(id).then(setLesson).catch((err) => setError(err.message));
  }, [id]);

  const save = async () => {
    if (!lesson) return;
    setSaving(true);
    try {
      await api.saveProgress(lesson.id, true, 1);
      setSaved(true);
      onProgressSaved();
    } finally {
      setSaving(false);
    }
  };

  if (error) return <EmptyState title="Lesson unavailable." detail={error} />;
  if (!lesson) return <EmptyState title="Loading lesson..." />;

  return (
    <section className="page lesson-page">
      <Link className="back-link" to="/">
        <ChevronLeft aria-hidden="true" />
        Academy
      </Link>
      <header className="page-heading lesson-heading">
        <div>
          <p className="eyebrow">
            Platform Academy / {lesson.course_category} / Lesson {lesson.sequence}
          </p>
          <h1>{lesson.title}</h1>
          <p className="lead">{lesson.summary}</p>
        </div>
        <button className="primary-action" disabled={saving} onClick={save}>
          <CheckCircle2 aria-hidden="true" />
          {saved ? "Progress saved" : saving ? "Saving..." : "Mark complete"}
        </button>
      </header>

      <article className="lesson-body">
        <RichContent text={lesson.body_simplified} />
      </article>

      <section className="practice-panel">
        <div>
          <p className="eyebrow">Lab scenario</p>
          <h2>Practice the lesson</h2>
        </div>
        <RichContent text={lesson.pinyin} />
      </section>

      <section className="detail-grid">
        <div>
          <h2>Key terms</h2>
          <div className="term-grid">
            {lesson.vocabulary.map((term) => (
              <article className="term-card" key={term.id}>
                <strong>{term.simplified}</strong>
                <span>{term.pinyin}</span>
                <p>{term.definition}</p>
              </article>
            ))}
          </div>
        </div>
        <div>
          <h2>Review flashcards</h2>
          <div className="review-list">
            {lesson.flashcards.map((card) => (
              <article key={card.id}>
                <strong>{card.prompt}</strong>
                <p>{card.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}

export default function App() {
  const [data, setData] = useState<AcademyData | null>(null);
  const [error, setError] = useState("");

  const loadData = () => {
    Promise.all([api.catalog(), api.roadmap(), api.progress(), api.dashboard()])
      .then(([catalog, roadmap, progress, dashboard]) => setData({ catalog, roadmap, progress, dashboard }))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (error) {
    return (
      <AppShell>
        <EmptyState title="Platform Academy is unavailable." detail={error} />
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <EmptyState title="Loading Platform Academy..." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Routes>
        <RouterRoute path="/" element={<DashboardPage data={data} />} />
        <RouterRoute path="/roadmap" element={<RoadmapPage data={data} />} />
        <RouterRoute path="/labs" element={<LabsPage data={data} />} />
        <RouterRoute path="/courses/:id" element={<CoursePage data={data} />} />
        <RouterRoute path="/lessons/:id" element={<LessonPage onProgressSaved={loadData} />} />
        <RouterRoute path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
