import {
  Activity,
  ArrowRight,
  BookOpen,
  BookMarked,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Cloud,
  Compass,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  Filter,
  Gauge,
  GitBranch,
  Globe,
  GraduationCap,
  Hexagon,
  Layers3,
  LayoutDashboard,
  ListChecks,
  Map,
  MonitorDot,
  Network,
  RadioTower,
  RefreshCcw,
  Route,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  UserRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Navigate, Route as RouterRoute, Routes, useLocation, useParams } from "react-router-dom";

import { api } from "./api";
import { getOrCreateLocalLearnerId, resetLocalLearnerId } from "./learnerIdentity";
import type {
  Course,
  Lesson,
  PlatformAcademyCatalog,
  PlatformAcademyRoadmap,
  PlatformLab,
  PlatformResource,
  PlatformResources,
  PlatformRoadmapStage,
  PlatformTrack,
  Progress,
  UserDashboard
} from "./types";

type AcademyData = {
  catalog: PlatformAcademyCatalog;
  roadmap: PlatformAcademyRoadmap;
  resources: PlatformResources;
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

type AcademyStats = {
  courses: Course[];
  lessons: Course["lessons"][number][];
  completed: Set<number>;
  totalCompleted: number;
  completionPercent: number;
  recommended?: Course["lessons"][number];
};

const productNavItems = [
  {
    to: "/dashboard/home",
    label: "Home",
    icon: LayoutDashboard,
    match: (path: string) => path === "/" || path.startsWith("/dashboard") || path.startsWith("/courses") || path.startsWith("/lessons")
  },
  { to: "/roadmap", label: "Roadmap", icon: Map, match: (path: string) => path.startsWith("/roadmap") },
  { to: "/labs", label: "Labs", icon: Terminal, match: (path: string) => path.startsWith("/labs") },
  { to: "/resources", label: "Resources", icon: BookMarked, match: (path: string) => path.startsWith("/resources") }
] as const;

function getAcademyStats(data: AcademyData): AcademyStats {
  const courses = allCourses(data.catalog);
  const lessons = courses.flatMap((course) => course.lessons);
  const completed = completedLessonIds(data.progress);
  const totalCompleted = lessons.filter((lesson) => completed.has(lesson.id)).length;
  return {
    courses,
    lessons,
    completed,
    totalCompleted,
    completionPercent: data.catalog.total_lessons > 0 ? Math.round((totalCompleted / data.catalog.total_lessons) * 100) : 0,
    recommended: nextLesson(courses, completed)
  };
}

function courseForLesson(data: AcademyData, lessonId: number) {
  return allCourses(data.catalog).find((course) => course.lessons.some((lesson) => lesson.id === lessonId));
}

function labForSlug(data: AcademyData, slug: string) {
  return data.catalog.labs.find((lab) => lab.slug === slug);
}

function resourceForSlug(data: AcademyData, slug: string) {
  return data.resources.resources.find((resource) => resource.slug === slug);
}

function labsForCourse(data: AcademyData, course: Course) {
  return data.catalog.labs.filter((lab) => lab.course_slug === course.slug);
}

function resourcesForCourse(data: AcademyData, course: Course) {
  const lessonIds = new Set(course.lessons.map((lesson) => lesson.id));
  const labSlugs = new Set(labsForCourse(data, course).map((lab) => lab.slug));
  return data.resources.resources.filter(
    (resource) =>
      resource.related_lessons.some((lessonId) => lessonIds.has(lessonId)) || resource.related_labs.some((labSlug) => labSlugs.has(labSlug))
  );
}

function resourcesForLab(data: AcademyData, lab: PlatformLab) {
  return data.resources.resources.filter((resource) => resource.related_labs.includes(lab.slug));
}

function resourcesForLesson(data: AcademyData, lessonId: number) {
  const labs = data.catalog.labs.filter((lab) => lab.lesson_id === lessonId).map((lab) => lab.slug);
  return data.resources.resources.filter(
    (resource) => resource.related_lessons.includes(lessonId) || resource.related_labs.some((labSlug) => labs.includes(labSlug))
  );
}

function formatReviewDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CommandBlock({ commands, title = "Command surface" }: { commands: string[]; title?: string }) {
  const [copied, setCopied] = useState(false);
  const commandText = commands.length > 0 ? commands.join("\n") : "No command snippet is seeded for this item.";
  const copyCommands = async () => {
    if (!commands.length || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(commandText);
    setCopied(true);
  };
  return (
    <div className="command-console">
      <div className="command-console-header">
        <div>
          <Terminal aria-hidden="true" />
          <span>{title}</span>
        </div>
        <button className={`copy-command-button${copied ? " copied" : ""}`} disabled={!commands.length} onClick={copyCommands} type="button">
          {copied ? <CheckCircle2 aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? `Copied ${title}` : `Copy ${title}`}
        </button>
      </div>
      <pre>
        <code>{commandText}</code>
      </pre>
    </div>
  );
}

function AppShell({ children, learnerId, onResetLearner }: { children: React.ReactNode; learnerId: string; onResetLearner: () => void }) {
  const location = useLocation();

  if (!location.pathname.startsWith("/designs")) {
    return (
      <div className="product-shell">
        <aside className="product-sidebar">
          <Link className="product-brand" to="/dashboard/home">
            <span>PA</span>
            <div>
              <strong>Platform Academy</strong>
              <small>AWS / Kubernetes / SRE</small>
            </div>
          </Link>
          <nav className="product-nav" aria-label="Platform Academy navigation">
            {productNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  to={item.to}
                  key={item.to}
                  className={({ isActive }) => (isActive || item.match(location.pathname) ? "active" : undefined)}
                >
                  <Icon aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="product-sidebar-footer">
            <span>Exploration routes</span>
            <Link to="/designs">
              <Sparkles aria-hidden="true" />
              Designs
            </Link>
          </div>
        </aside>
        <div className="product-frame">
          <header className="product-topline">
            <div className="learner-profile" aria-label="Active learner profile">
              <UserRound aria-hidden="true" />
              <div>
                <strong>{learnerId}</strong>
                <span>Local guest workspace in this browser</span>
              </div>
              <button
                aria-label="Start a new local guest workspace"
                className="learner-reset-button"
                onClick={onResetLearner}
                title="Switch this browser to a fresh local progress profile. Existing backend progress remains stored under the old guest id."
                type="button"
              >
                <RefreshCcw aria-hidden="true" />
                New local profile
              </button>
            </div>
            <div className="topline-actions">
              <Link to="/labs">
                <Terminal aria-hidden="true" />
                Lab queue
              </Link>
              <Link to="/resources">
                <Search aria-hidden="true" />
                Resource index
              </Link>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </div>
    );
  }

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
          <NavLink to="/resources">
            <FileText aria-hidden="true" />
            Resources
          </NavLink>
          <NavLink to="/designs">
            <Sparkles aria-hidden="true" />
            Designs
          </NavLink>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

function DashboardPage({ data }: { data: AcademyData }) {
  const stats = useMemo(() => getAcademyStats(data), [data]);
  const courses = stats.courses;
  const topics = useMemo(() => Array.from(new Set(courses.map((course) => course.category))), [courses]);
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [query, setQuery] = useState("");
  const recommendedCourse = stats.recommended ? courseForLesson(data, stats.recommended.id) : undefined;
  const upcomingLab = data.catalog.labs.find((lab) => (stats.recommended ? lab.lesson_id === stats.recommended.id : false)) ?? data.catalog.labs[0];
  const featuredResource = upcomingLab ? resourcesForLab(data, upcomingLab)[0] ?? data.resources.resources[0] : data.resources.resources[0];

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
    <section className="page canonical-page dashboard-home">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Production learning workspace</p>
          <h1>Platform Academy</h1>
          <p className="lead">{data.catalog.promise}</p>
        </div>
        <div className="workspace-actions">
          {stats.recommended && (
            <Link className="primary-action" to={`/lessons/${stats.recommended.id}`}>
              <Compass aria-hidden="true" />
              {stats.totalCompleted > 0 ? "Continue lesson" : "Start path"}
            </Link>
          )}
          <Link className="secondary-action" to="/roadmap">
            <Route aria-hidden="true" />
            Roadmap
          </Link>
        </div>
      </header>

      <section className="ops-summary" aria-label="Academy operating summary">
        <article>
          <span>Readiness</span>
          <strong>{stats.completionPercent}%</strong>
          <ProgressBar value={stats.completionPercent} />
          <small>
            {stats.totalCompleted} of {data.catalog.total_lessons} lessons complete
          </small>
        </article>
        <article>
          <span>Curriculum</span>
          <strong>{data.catalog.total_courses}</strong>
          <small>{data.catalog.total_lessons} sequenced lessons</small>
        </article>
        <article>
          <span>Lab inventory</span>
          <strong>{data.catalog.labs.length}</strong>
          <small>{averageLabMinutes(data.catalog.labs)} min average drill</small>
        </article>
        <article>
          <span>Review state</span>
          <strong>{data.dashboard.due_reviews}</strong>
          <small>{data.dashboard.daily_goal.earned_xp_today} / {data.dashboard.daily_goal.target_xp} XP today</small>
        </article>
      </section>

      <section className="dashboard-layout">
        <div className="dashboard-main">
          <section className="workspace-panel next-work">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Next best action</p>
                <h2>{stats.recommended?.title ?? "Select a lesson"}</h2>
              </div>
              {stats.recommended && (
                <Link className="text-link" to={`/lessons/${stats.recommended.id}`}>
                  Open lesson <ArrowRight aria-hidden="true" />
                </Link>
              )}
            </div>
            <div className="next-work-grid">
              <div>
                <span>Course</span>
                <strong>{recommendedCourse?.title ?? "No course selected"}</strong>
                <p>{recommendedCourse?.description ?? "The seeded catalog has no available lessons."}</p>
              </div>
              {upcomingLab && (
                <div>
                  <span>Lab gate</span>
                  <strong>{upcomingLab.title}</strong>
                  <p>{upcomingLab.scenario}</p>
                </div>
              )}
              {featuredResource && (
                <div>
                  <span>Reference artifact</span>
                  <strong>{featuredResource.title}</strong>
                  <p>{featuredResource.summary}</p>
                </div>
              )}
            </div>
          </section>

          <section className="workspace-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Track pipeline</p>
                <h2>Courses by operating level</h2>
              </div>
              <span>
                {filteredCourses.length} of {courses.length} visible
              </span>
            </div>
            <section className="toolbar canonical-toolbar" aria-label="Course filters">
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
            <div className="course-table" aria-label="Platform Academy courses">
              {filteredCourses.map((course) => {
                const progress = courseProgress(course, stats.completed);
                const track = data.catalog.tracks.find((item) => item.course.slug === course.slug);
                return (
                  <Link className="course-row" to={`/courses/${course.id}`} key={course.id}>
                    <div>
                      <LevelBadge level={track?.level_group ?? course.level} />
                      <strong>{course.title}</strong>
                      <p>{course.description}</p>
                    </div>
                    <span>{course.category}</span>
                    <span>{course.lessons.length} lessons</span>
                    <div>
                      <b>{progress.percent}%</b>
                      <ProgressBar value={progress.percent} />
                    </div>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
            {filteredCourses.length === 0 && <EmptyState title="No courses match those filters." />}
          </section>
        </div>

        <aside className="dashboard-rail">
          <section className="workspace-panel readiness-panel">
            <p className="eyebrow">Readiness gates</p>
            <h2>Evidence before progress</h2>
            <div>
              <span className={data.dashboard.daily_goal.met ? "gate-state met" : "gate-state"}>{data.dashboard.daily_goal.met ? "Met" : "In progress"}</span>
              <strong>Daily XP target</strong>
              <p>
                {data.dashboard.daily_goal.earned_xp_today} of {data.dashboard.daily_goal.target_xp} XP earned today.
              </p>
            </div>
            <div>
              <span className={stats.totalCompleted > 0 ? "gate-state met" : "gate-state"}>{stats.totalCompleted > 0 ? "Started" : "Not started"}</span>
              <strong>Lesson completion</strong>
              <p>{stats.totalCompleted} completed lessons are recorded for this local guest profile.</p>
            </div>
            <div>
              <span className="gate-state">Review</span>
              <strong>Source posture</strong>
              <p>Seeded content exposes commands, artifacts, safety labels, and related labs; external source URLs are not seeded.</p>
            </div>
          </section>

          <section className="workspace-panel level-readiness">
            <p className="eyebrow">Level coverage</p>
            {data.catalog.levels.map((level) => (
              <div key={level.slug}>
                <LevelBadge level={level.level_group} />
                <strong>{level.title}</strong>
                <span>
                  {level.total_courses} courses / {level.total_lessons} lessons
                </span>
              </div>
            ))}
          </section>
        </aside>
      </section>
    </section>
  );
}

function RoadmapPage({ data }: { data: AcademyData }) {
  const stats = useMemo(() => getAcademyStats(data), [data]);
  const stageCourses = (stage: PlatformRoadmapStage) =>
    stage.course_slugs
      .map((slug) => allCourses(data.catalog).find((course) => course.slug === slug))
      .filter((course): course is Course => Boolean(course));

  return (
    <section className="page canonical-page roadmap-page">
      <header className="workspace-header">
        <div>
        <p className="eyebrow">Recommended order</p>
          <h1>Roadmap from first kubectl habits to production platform ownership</h1>
          <p className="lead">Each stage pairs lessons with checkpoints, course evidence, and lab validation before advancing.</p>
        </div>
        <div className="readiness-score">
          <span>Current readiness</span>
          <strong>{stats.completionPercent}%</strong>
          <ProgressBar value={stats.completionPercent} />
        </div>
      </header>

      <section className="roadmap-layout">
        <div className="roadmap-timeline">
          {data.roadmap.stages.map((stage) => {
            const courses = stageCourses(stage);
            const stageLessons = courses.flatMap((course) => course.lessons);
            const completedLessons = stageLessons.filter((lesson) => stats.completed.has(lesson.id)).length;
            const relatedLabs = data.catalog.labs.filter((lab) => courses.some((course) => course.slug === lab.course_slug));
            return (
              <article className="roadmap-stage canonical-stage" key={stage.sequence}>
                <div className="stage-index">{stage.sequence}</div>
                <div className="stage-body">
                  <div className="stage-header">
                    <LevelBadge level={stage.level_group} />
                    <span>{stage.role}</span>
                  </div>
                  <h2>{stage.title}</h2>
                  <p>{stage.focus}</p>
                  <div className="stage-metrics">
                    <span>{courses.length} courses</span>
                    <span>{stageLessons.length} lessons</span>
                    <span>{relatedLabs.length} labs</span>
                    <span>{completedLessons} complete</span>
                  </div>
                  <h3>Promotion checkpoints</h3>
                  <ul>
                    {stage.checkpoints.map((checkpoint) => (
                      <li key={checkpoint}>{checkpoint}</li>
                    ))}
                  </ul>
                  <div className="stage-courses">
                    {courses.map((course) => (
                      <Link to={`/courses/${course.id}`} key={course.id}>
                        <BookOpen aria-hidden="true" />
                        {course.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="roadmap-rail">
          <section className="workspace-panel">
            <p className="eyebrow">Source and review posture</p>
            <h2>Trust model</h2>
            <p>Roadmap gates use seeded courses, labs, checkpoints, and resources. External official-source links and review timestamps are not in the current payload.</p>
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Evidence gates</p>
            {data.catalog.levels.map((level) => (
              <div className="evidence-row" key={level.slug}>
                <LevelBadge level={level.level_group} />
                <strong>{level.total_lessons} lessons</strong>
                <span>{level.audience}</span>
              </div>
            ))}
          </section>
        </aside>
      </section>
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
  const activeLab = filteredLabs[0];
  const activeResource = activeLab ? resourcesForLab(data, activeLab)[0] : undefined;

  return (
    <section className="page canonical-page labs-page">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Command workspace</p>
          <h1>Labs for platform incidents and architecture reviews</h1>
          <p className="lead">Runbook-style drills expose scenario context, command surfaces, and validation gates before a lesson counts as ready.</p>
        </div>
        <div className="readiness-score">
          <span>Lab inventory</span>
          <strong>{filteredLabs.length}</strong>
          <small>{data.catalog.labs.length} total seeded labs</small>
        </div>
      </header>

      <section className="toolbar compact canonical-toolbar" aria-label="Lab filters">
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

      <section className="lab-workspace">
        <aside className="lab-queue" aria-label="Platform labs">
          {filteredLabs.map((lab) => (
            <LabCard lab={lab} key={lab.slug} />
          ))}
        </aside>

        <section className="runbook-workspace">
          {activeLab ? (
            <>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Selected runbook</p>
                  <h2>{activeLab.title}</h2>
                </div>
                <Link className="text-link" to={`/labs/${activeLab.slug}`}>
                  Open detail <ArrowRight aria-hidden="true" />
                </Link>
              </div>
              <p>{activeLab.scenario}</p>
              <div className="runbook-meta">
                <LevelBadge level={activeLab.level_group} />
                <span>{activeLab.track}</span>
                <span>{activeLab.estimated_minutes} min</span>
                <span>{activeLab.difficulty}</span>
              </div>
              <CommandBlock commands={activeLab.commands} />
              <div className="validation-grid">
                <div>
                  <h3>Validation checklist</h3>
                  <ul>
                    {activeLab.checklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Evidence artifact</h3>
                  <p>{activeResource?.artifacts.slice(0, 2).join(" / ") ?? "No related resource artifact is seeded for this lab."}</p>
                  {activeResource && (
                    <Link className="text-link" to={`/resources/${activeResource.slug}`}>
                      Open resource <ArrowRight aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </div>
            </>
          ) : (
            <EmptyState title="No labs match those filters." />
          )}
        </section>
      </section>
    </section>
  );
}

function LabCard({ lab }: { lab: PlatformLab }) {
  return (
    <Link className="lab-card lab-queue-row" to={`/labs/${lab.slug}`}>
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
    </Link>
  );
}

function LabDetailPage({ data }: { data: AcademyData }) {
  const { slug = "" } = useParams();
  const lab = labForSlug(data, slug);
  if (!lab) return <EmptyState title="Lab not found." detail="The lab slug is not present in the seeded catalog." />;
  const course = allCourses(data.catalog).find((item) => item.slug === lab.course_slug);
  const relatedResources = resourcesForLab(data, lab);

  return (
    <section className="page canonical-page lab-detail-page">
      <Link className="back-link" to="/labs">
        <ChevronLeft aria-hidden="true" />
        Labs
      </Link>
      <header className="workspace-header">
        <div>
          <p className="eyebrow">
            {lab.track} / {lab.difficulty}
          </p>
          <h1>{lab.title}</h1>
          <p className="lead">{lab.scenario}</p>
        </div>
        <div className="readiness-score">
          <span>Estimated time</span>
          <strong>{lab.estimated_minutes}</strong>
          <small>minutes</small>
        </div>
      </header>

      <section className="detail-layout">
        <article className="workspace-panel">
          <div className="runbook-meta">
            <LevelBadge level={lab.level_group} />
            <span>{lab.track}</span>
            {course && <span>{course.title}</span>}
          </div>
          <CommandBlock commands={lab.commands} title="Runbook commands" />
          <h2>Validation checklist</h2>
          <ul className="check-list">
            {lab.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h2>Skills covered</h2>
          <div className="chip-list">
            {lab.skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </article>

        <aside className="detail-rail">
          <section className="workspace-panel">
            <p className="eyebrow">Lesson linkage</p>
            <h2>{course?.title ?? "Course not found"}</h2>
            {lab.lesson_id && (
              <Link className="text-link" to={`/lessons/${lab.lesson_id}`}>
                Open linked lesson <ArrowRight aria-hidden="true" />
              </Link>
            )}
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Related resources</p>
            {relatedResources.length > 0 ? (
              relatedResources.slice(0, 4).map((resource) => (
                <Link className="resource-mini-row" aria-label={resource.title} to={`/resources/${resource.slug}`} key={resource.slug}>
                  <span>{resource.resource_type}</span>
                  <strong>{resource.title}</strong>
                </Link>
              ))
            ) : (
              <p>No related resource is seeded for this lab.</p>
            )}
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Source and review posture</p>
            <p>This lab is seeded with local-safe scenario data and command snippets. Verify cloud-provider commands against current official docs before live-cluster use.</p>
          </section>
        </aside>
      </section>
    </section>
  );
}

function ResourcesPage({ data }: { data: AcademyData }) {
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [query, setQuery] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(36);
  const filteredResources = data.resources.resources.filter((resource) => {
    const text = `${resource.title} ${resource.summary} ${resource.domain} ${resource.resource_type}`.toLowerCase();
    return (
      (selectedDomain === "All" || resource.domain === selectedDomain) &&
      (selectedType === "All" || resource.resource_type === selectedType) &&
      text.includes(query.toLowerCase())
    );
  });
  const featuredResource = filteredResources[0];
  const visibleResources = filteredResources.slice(0, visibleLimit);
  const hiddenResourceCount = Math.max(filteredResources.length - visibleResources.length, 0);
  const nextPageCount = Math.min(36, hiddenResourceCount);
  const featuredLab = featuredResource ? data.catalog.labs.find((lab) => featuredResource.related_labs.includes(lab.slug)) : undefined;

  useEffect(() => {
    setVisibleLimit(36);
  }, [selectedDomain, selectedType, query]);

  return (
    <section className="page canonical-page resources-page">
      <header className="workspace-header resources-heading">
        <div>
          <p className="eyebrow">Runbooks, projects, rubrics, references</p>
          <h1>Resource library</h1>
          <p className="lead">
            Searchable operational artifacts for Kubernetes, EKS, Helm, ArgoCD, SRE, platform engineering, security, Terraform, and FinOps practice.
          </p>
        </div>
        <dl className="resource-stats">
          <div>
            <dt>Resources</dt>
            <dd>{data.resources.resources.length}</dd>
          </div>
          <div>
            <dt>Domains</dt>
            <dd>{data.resources.domains.length}</dd>
          </div>
          <div>
            <dt>Types</dt>
            <dd>{data.resources.types.length}</dd>
          </div>
        </dl>
      </header>
      <section className="toolbar canonical-toolbar" aria-label="Resource filters">
        <div className="search-box">
          <Search aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resources, runbooks, projects..." />
        </div>
        <div className="segmented topics">
          {["All", ...data.resources.domains].map((domain) => (
            <button key={domain} className={selectedDomain === domain ? "selected" : ""} onClick={() => setSelectedDomain(domain)}>
              {domain}
            </button>
          ))}
        </div>
        <div className="segmented topics">
          {["All", ...data.resources.types].map((type) => (
            <button key={type} className={selectedType === type ? "selected" : ""} onClick={() => setSelectedType(type)}>
              {type}
            </button>
          ))}
        </div>
      </section>

      <section className="resource-layout">
        <article className="resource-feature">
          {featuredResource ? (
            <>
              <div className="resource-card-top">
                <LevelBadge level={featuredResource.level_group} />
                <span>{featuredResource.resource_type}</span>
                <span>{featuredResource.safety_level}</span>
              </div>
              <h2>{featuredResource.title}</h2>
              <p>{featuredResource.summary}</p>
              <CommandBlock commands={featuredResource.commands.slice(0, 3)} title="Primary snippets" />
              <div className="resource-feature-footer">
                {featuredLab && <span>Related lab: {featuredLab.title}</span>}
                <Link className="primary-action" to={`/resources/${featuredResource.slug}`}>
                  Open resource <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </>
          ) : (
            <EmptyState title="No resources match those filters." />
          )}
        </article>

        <section className="resource-index" aria-label="Platform Academy resources">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Library index</p>
              <h2>{visibleResources.length} shown / {filteredResources.length} matching artifacts</h2>
            </div>
          </div>
          {visibleResources.map((resource) => (
            <ResourceCard resource={resource} data={data} key={resource.slug} />
          ))}
          {hiddenResourceCount > 0 && (
            <div className="resource-pagination">
              <span>{hiddenResourceCount} matching artifacts remain.</span>
              <button type="button" onClick={() => setVisibleLimit((current) => current + 36)}>
                Load {nextPageCount} more resources
              </button>
            </div>
          )}
        </section>
      </section>
      {filteredResources.length === 0 && <EmptyState title="No resources match those filters." />}
    </section>
  );
}

function ResourceCard({ resource, data }: { resource: PlatformResource; data: AcademyData }) {
  const lab = data.catalog.labs.find((item) => resource.related_labs.includes(item.slug));
  return (
    <Link className="resource-card resource-row" to={`/resources/${resource.slug}`}>
      <div className="resource-card-top">
        <LevelBadge level={resource.level_group} />
        <span>{resource.resource_type}</span>
        <span>{resource.estimated_minutes} min</span>
      </div>
      <h2>{resource.title}</h2>
      <p>{resource.summary}</p>
      <div className="resource-links">
        <span>{resource.domain}</span>
        <span>{resource.safety_level}</span>
        {lab && <span>Lab: {lab.title}</span>}
      </div>
    </Link>
  );
}

function ResourceDetailPage({ data }: { data: AcademyData }) {
  const { slug = "" } = useParams();
  const resource = resourceForSlug(data, slug);
  if (!resource) return <EmptyState title="Resource not found." detail="The resource slug is not present in the seeded library." />;
  const relatedLabs = data.catalog.labs.filter((lab) => resource.related_labs.includes(lab.slug));
  const relatedCourses: Course[] = Array.from(
    new globalThis.Map<number, Course>(
      relatedLabs
        .map((lab) => allCourses(data.catalog).find((course) => course.slug === lab.course_slug))
        .filter((course): course is Course => Boolean(course))
        .map((course) => [course.id, course])
    ).values()
  );

  return (
    <section className="page canonical-page resource-detail-page">
      <Link className="back-link" to="/resources">
        <ChevronLeft aria-hidden="true" />
        Resources
      </Link>
      <header className="workspace-header">
        <div>
          <p className="eyebrow">
            {resource.domain} / {resource.resource_type}
          </p>
          <h1>{resource.title}</h1>
          <p className="lead">{resource.summary}</p>
        </div>
        <div className="readiness-score">
          <span>Estimated time</span>
          <strong>{resource.estimated_minutes}</strong>
          <small>minutes</small>
        </div>
      </header>

      <section className="detail-layout">
        <article className="workspace-panel resource-detail-main">
          <div className="runbook-meta">
            <LevelBadge level={resource.level_group} />
            <span>{resource.safety_level}</span>
            <span>{resource.domain}</span>
          </div>
          <CommandBlock commands={resource.commands} title="Command surface" />
          <h2>Outcomes</h2>
          <ul className="check-list">
            {resource.outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>
          <h2>Expected artifacts</h2>
          <div className="chip-list">
            {resource.artifacts.map((artifact) => (
              <span key={artifact}>{artifact}</span>
            ))}
          </div>
          <h2>Next steps</h2>
          <ul className="check-list">
            {resource.next_steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </article>

        <aside className="detail-rail">
          <section className="workspace-panel">
            <p className="eyebrow">Prerequisites</p>
            <ul className="check-list">
              {resource.prerequisites.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Related labs</p>
            {relatedLabs.length > 0 ? (
              relatedLabs.map((lab) => (
                <Link className="resource-mini-row" aria-label={lab.title} to={`/labs/${lab.slug}`} key={lab.slug}>
                  <span>{lab.level_group}</span>
                  <strong>{lab.title}</strong>
                </Link>
              ))
            ) : (
              <p>No related lab is seeded for this resource.</p>
            )}
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Related courses</p>
            {relatedCourses.length > 0 ? (
              relatedCourses.map((course) => (
                <Link className="resource-mini-row" to={`/courses/${course.id}`} key={course.id}>
                  <span>{course.category}</span>
                  <strong>{course.title}</strong>
                </Link>
              ))
            ) : (
              <p>No related course could be inferred from seeded labs.</p>
            )}
          </section>
          <section className="workspace-panel source-review-panel">
            <p className="eyebrow">Source and review posture</p>
            {resource.source_url ? (
              <a className="source-link" href={resource.source_url} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" />
                {resource.source_label ?? "Official source"}
              </a>
            ) : (
              <p>No external source URL is seeded for this resource yet.</p>
            )}
            <p>
              {resource.reviewed_at
                ? `Reviewed ${formatReviewDate(resource.reviewed_at)}`
                : "No review timestamp is seeded for this resource yet."}
            </p>
            <p>Use the safety label and prerequisites as local guidance, then verify live commands against current official docs.</p>
          </section>
        </aside>
      </section>
    </section>
  );
}

const designBriefs = [
  {
    id: 1,
    title: "Cinematic Cloud Control Room",
    direction: "A launch-room view of incidents, rollout gates, and academy progress.",
    signal: "Control room"
  },
  {
    id: 2,
    title: "Editorial Academy",
    direction: "A refined journal for senior platform judgment and curriculum sequencing.",
    signal: "Editorial"
  },
  {
    id: 3,
    title: "Terminal Ops Cockpit",
    direction: "A keyboard-first training console built around commands, queues, and runbooks.",
    signal: "TUI"
  },
  {
    id: 4,
    title: "Glass Cloud Atlas",
    direction: "A translucent atlas of domains, tracks, and cloud-native waypoints.",
    signal: "Atlas"
  },
  {
    id: 5,
    title: "Observability Wall",
    direction: "A dark monitoring wall for readiness, labs, reviews, and learning signals.",
    signal: "Telemetry"
  },
  {
    id: 6,
    title: "Infra Blueprint",
    direction: "A precise blueprint sheet for platform architecture progression.",
    signal: "Blueprint"
  },
  {
    id: 7,
    title: "Premium SaaS Dashboard",
    direction: "A restrained operating dashboard for academy administration and cohort planning.",
    signal: "SaaS"
  },
  {
    id: 8,
    title: "Command Center Map",
    direction: "A network map that treats the curriculum as deployable platform territory.",
    signal: "Map"
  },
  {
    id: 9,
    title: "Certification Bootcamp",
    direction: "A focused bootcamp surface for outcomes, drills, and exam-grade practice.",
    signal: "Bootcamp"
  },
  {
    id: 10,
    title: "Resource Magazine Library",
    direction: "An elegant library for runbooks, cheatsheets, references, and project briefs.",
    signal: "Library"
  }
] as const;

type DesignStats = {
  courses: Course[];
  tracks: PlatformTrack[];
  labs: PlatformLab[];
  resources: PlatformResource[];
  stages: PlatformRoadmapStage[];
  domains: string[];
  totalCompleted: number;
  completionPercent: number;
  recommended?: Course["lessons"][number];
};

function getDesignStats(data: AcademyData): DesignStats {
  const courses = allCourses(data.catalog);
  const lessons = courses.flatMap((course) => course.lessons);
  const completed = completedLessonIds(data.progress);
  const totalCompleted = lessons.filter((lesson) => completed.has(lesson.id)).length;
  return {
    courses,
    tracks: data.catalog.tracks,
    labs: data.catalog.labs,
    resources: data.resources.resources,
    stages: data.roadmap.stages,
    domains: data.resources.domains,
    totalCompleted,
    completionPercent: data.catalog.total_lessons > 0 ? Math.round((totalCompleted / data.catalog.total_lessons) * 100) : 0,
    recommended: nextLesson(courses, completed)
  };
}

function averageLabMinutes(labs: PlatformLab[]) {
  if (labs.length === 0) return 0;
  return Math.round(labs.reduce((total, lab) => total + lab.estimated_minutes, 0) / labs.length);
}

function firstResourceForLab(resources: PlatformResource[], lab?: PlatformLab) {
  if (!lab) return resources[0];
  return resources.find((resource) => resource.related_labs.includes(lab.slug)) ?? resources[0];
}

function DesignFrameNav({ activeId }: { activeId?: number }) {
  return (
    <div className="design-navline">
      <Link to="/designs">
        <ChevronLeft aria-hidden="true" />
        Designs
      </Link>
      <Link to="/">Academy</Link>
      {activeId && <span>{String(activeId).padStart(2, "0")} / 10</span>}
    </div>
  );
}

function DesignEvidenceStrip({ data, stats }: { data: AcademyData; stats: DesignStats }) {
  const items = [
    {
      label: "Curriculum",
      value: `${data.catalog.total_courses} courses`,
      detail: `${data.catalog.total_lessons} sequenced lessons`
    },
    {
      label: "Practice",
      value: `${stats.labs.length} labs`,
      detail: `${averageLabMinutes(stats.labs)} min average drill`
    },
    {
      label: "Artifacts",
      value: `${stats.resources.length} resources`,
      detail: `${stats.domains.length} domains with commands`
    },
    {
      label: "Progress",
      value: `${stats.completionPercent}% ready`,
      detail: `${stats.totalCompleted} completed / ${data.dashboard.xp.total} XP`
    }
  ];

  return (
    <dl className="design-proof-strip" aria-label="Academy proof points">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          <span>{item.detail}</span>
        </div>
      ))}
    </dl>
  );
}

function DesignLabBrief({ lab, title = "Featured lab" }: { lab?: PlatformLab; title?: string }) {
  if (!lab) return null;
  return (
    <article className="design-lab-brief">
      <p className="design-kicker">{title}</p>
      <h2>{lab.title}</h2>
      <p>{lab.scenario}</p>
      <div>
        {lab.skills.slice(0, 4).map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
      <pre>
        <code>{lab.commands.slice(0, 2).join("\n")}</code>
      </pre>
      <ul>
        {lab.checklist.slice(0, 3).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function DesignResourceBrief({ resource }: { resource?: PlatformResource }) {
  if (!resource) return null;
  return (
    <article className="design-resource-brief">
      <p className="design-kicker">Reusable artifact</p>
      <h2>{resource.title}</h2>
      <p>{resource.summary}</p>
      <div>
        <span>{resource.resource_type}</span>
        <span>{resource.safety_level}</span>
        <span>{resource.estimated_minutes} min</span>
      </div>
      <strong>{resource.artifacts.slice(0, 2).join(" / ")}</strong>
    </article>
  );
}

function DesignsIndexPage({ data }: { data: AcademyData }) {
  const stats = getDesignStats(data);
  return (
    <section className="design-page design-index">
      <header className="design-index-hero">
        <DesignFrameNav />
        <div>
          <p className="design-kicker">Design explorations</p>
          <h1>Ten visual systems for Platform Academy.</h1>
          <p>
            Each direction uses the same Kubernetes, EKS, Helm, ArgoCD, and SRE curriculum data, reshaped into a different senior platform
            learning product.
          </p>
        </div>
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
            <dt>Resources</dt>
            <dd>{stats.resources.length}</dd>
          </div>
        </dl>
      </header>

      <DesignEvidenceStrip data={data} stats={stats} />

      <section className="design-research-notes" aria-label="Research lens">
        <article>
          <span>Research lens</span>
          <p>Benchmarked in May 2026 against official docs, cloud learning hubs, hands-on lab platforms, and certification simulators.</p>
        </article>
        <article>
          <span>Product bar</span>
          <p>Senior learners need command surfaces, timed labs, source freshness, progress state, and artifacts they can reuse at work.</p>
        </article>
      </section>

      <section className="design-index-grid" aria-label="Design routes">
        {designBriefs.map((brief) => (
          <Link className={`design-index-card design-index-card-${brief.id}`} to={`/designs/${brief.id}`} key={brief.id}>
            <span>{String(brief.id).padStart(2, "0")}</span>
            <div>
              <p>{brief.signal}</p>
              <h2>{brief.title}</h2>
            </div>
            <small>{brief.direction}</small>
            <ArrowRight aria-hidden="true" />
          </Link>
        ))}
      </section>
    </section>
  );
}

function DesignVariantPage({ data }: { data: AcademyData }) {
  const { id = "" } = useParams();
  const stats = getDesignStats(data);
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId < 1 || numericId > 10) {
    return <EmptyState title="Design route not found." detail="Choose a numbered design exploration from the index." />;
  }

  switch (numericId) {
    case 1:
      return <DesignControlRoom data={data} stats={stats} />;
    case 2:
      return <DesignEditorialAcademy data={data} stats={stats} />;
    case 3:
      return <DesignTerminalCockpit data={data} stats={stats} />;
    case 4:
      return <DesignCloudAtlas data={data} stats={stats} />;
    case 5:
      return <DesignObservabilityWall data={data} stats={stats} />;
    case 6:
      return <DesignInfraBlueprint data={data} stats={stats} />;
    case 7:
      return <DesignSaasDashboard data={data} stats={stats} />;
    case 8:
      return <DesignCommandCenterMap data={data} stats={stats} />;
    case 9:
      return <DesignBootcamp data={data} stats={stats} />;
    case 10:
      return <DesignResourceLibrary data={data} stats={stats} />;
    default:
      return null;
  }
}

function DesignControlRoom({ data, stats }: { data: AcademyData; stats: DesignStats }) {
  const leadCourse = stats.courses[0];
  const leadStage = stats.stages[0];
  const leadLab = stats.labs[0];
  return (
    <section className="design-page design-control-room">
      <DesignFrameNav activeId={1} />
      <div className="control-room-grid">
        <div className="control-copy">
          <p className="design-kicker">Live platform academy</p>
          <h1>Platform Academy</h1>
          <p>{data.catalog.promise}</p>
          <div className="design-actions">
            {leadCourse && (
              <Link to={`/courses/${leadCourse.id}`}>
                Start control sequence <ArrowRight aria-hidden="true" />
              </Link>
            )}
            <Link to="/roadmap">Open roadmap</Link>
          </div>
        </div>
        <div className="control-screen" aria-label="Cloud control room status">
          <div className="control-screen-header">
            <RadioTower aria-hidden="true" />
            <span>Platform readiness board</span>
            <strong>{stats.completionPercent}% trained</strong>
          </div>
          <div className="radar-scope" aria-hidden="true">
            <span />
            <i />
            <b />
          </div>
          {leadLab && (
            <div className="control-current-lab">
              <span>Current drill</span>
              <strong>{leadLab.title}</strong>
              <code>{leadLab.commands[0]}</code>
            </div>
          )}
          <div className="control-status-list">
            {stats.tracks.slice(0, 4).map((track) => (
              <div key={track.slug}>
                <span>{track.level_group}</span>
                <strong>{track.title}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
      <DesignEvidenceStrip data={data} stats={stats} />
      <section className="control-mission-strip" aria-label="Mission metrics">
        <article>
          <span>Active courses</span>
          <strong>{data.catalog.total_courses}</strong>
        </article>
        <article>
          <span>Local-safe labs</span>
          <strong>{stats.labs.length}</strong>
        </article>
        <article>
          <span>Current objective</span>
          <strong>{leadStage?.title ?? "Roadmap calibration"}</strong>
        </article>
      </section>
    </section>
  );
}

function DesignEditorialAcademy({ data, stats }: { data: AcademyData; stats: DesignStats }) {
  const leadCourse = stats.courses[0];
  return (
    <section className="design-page design-editorial">
      <DesignFrameNav activeId={2} />
      <header className="editorial-masthead">
        <p>Platform Academy Review</p>
        <h1>Production judgment, taught in sequence.</h1>
        <span>{data.catalog.total_lessons} lessons across Kubernetes, GitOps, SRE, and cloud operations.</span>
      </header>
      <DesignEvidenceStrip data={data} stats={stats} />
      <section className="editorial-layout">
        <article className="editorial-feature">
          <p className="design-kicker">Featured syllabus</p>
          <h2>{leadCourse?.title ?? data.catalog.title}</h2>
          <p>{leadCourse?.description ?? data.catalog.promise}</p>
          {leadCourse && (
            <Link to={`/courses/${leadCourse.id}`}>
              Read the course brief <ArrowRight aria-hidden="true" />
            </Link>
          )}
        </article>
        <div className="editorial-columns">
          {stats.tracks.slice(0, 3).map((track) => (
            <article key={track.slug}>
              <BookMarked aria-hidden="true" />
              <span>{track.level_group}</span>
              <h3>{track.title}</h3>
              <p>{track.summary}</p>
            </article>
          ))}
        </div>
        <aside className="editorial-aside">
          <h2>Field notes</h2>
          {stats.resources.slice(0, 4).map((resource) => (
            <Link to="/resources" key={resource.slug}>
              <span>{resource.resource_type}</span>
              {resource.title}
            </Link>
          ))}
          <div className="editorial-source-note">
            <span>Source posture</span>
            <p>Every serious course page should expose upstream docs, version context, and last-reviewed dates next to the lesson.</p>
          </div>
        </aside>
      </section>
    </section>
  );
}

function DesignTerminalCockpit({ data, stats }: { data: AcademyData; stats: DesignStats }) {
  const commands = [
    ...stats.labs.flatMap((lab) => lab.commands),
    ...stats.resources.flatMap((resource) => resource.commands)
  ].slice(0, 6);
  return (
    <section className="design-page design-terminal">
      <DesignFrameNav activeId={3} />
      <div className="terminal-shell">
        <header>
          <Terminal aria-hidden="true" />
          <span>academyctl session --profile sre</span>
          <strong>{data.dashboard.xp.total} xp</strong>
        </header>
        <DesignEvidenceStrip data={data} stats={stats} />
        <div className="terminal-grid">
          <article className="terminal-hero">
            <p>local-guest@platform-academy:~$ ./start-learning</p>
            <h1>Ops cockpit for Kubernetes practice.</h1>
            <span>{data.catalog.promise}</span>
          </article>
          <article className="terminal-panel">
            <h2>Queue</h2>
            {stats.labs.slice(0, 4).map((lab) => (
              <div key={lab.slug}>
                <span>{lab.level_group}</span>
                <strong>{lab.title}</strong>
              </div>
            ))}
          </article>
          <article className="terminal-panel terminal-command-panel">
            <h2>Command buffer</h2>
            <pre>
              <code>{commands.length > 0 ? commands.join("\n") : "$ kubectl get pods -A"}</code>
            </pre>
          </article>
          <article className="terminal-panel terminal-route-panel">
            <h2>Route table</h2>
            {stats.courses.slice(0, 5).map((course) => (
              <Link to={`/courses/${course.id}`} key={course.id}>
                <span>{course.category}</span>
                {course.title}
              </Link>
            ))}
          </article>
          <article className="terminal-panel terminal-signal-panel">
            <h2>Signal panel</h2>
            {stats.resources.slice(0, 4).map((resource) => (
              <div key={resource.slug}>
                <span>{resource.resource_type}</span>
                <strong>{resource.domain}</strong>
              </div>
            ))}
          </article>
          <article className="terminal-panel terminal-lab-panel">
            <h2>Verification gates</h2>
            {stats.labs[0]?.checklist.slice(0, 4).map((item) => (
              <div key={item}>
                <span>assert</span>
                <strong>{item}</strong>
              </div>
            ))}
          </article>
        </div>
      </div>
    </section>
  );
}

function DesignCloudAtlas({ data, stats }: { data: AcademyData; stats: DesignStats }) {
  return (
    <section className="design-page design-atlas">
      <DesignFrameNav activeId={4} />
      <header className="atlas-header">
        <p className="design-kicker">Cloud atlas</p>
        <h1>Navigate the platform curriculum by domain.</h1>
        <p>{data.catalog.promise}</p>
      </header>
      <DesignEvidenceStrip data={data} stats={stats} />
      <section className="atlas-layout">
        <div className="atlas-map" aria-label="Course atlas">
          {stats.tracks.slice(0, 6).map((track, index) => (
            <Link className={`atlas-node atlas-node-${index + 1}`} to={`/courses/${track.course.id}`} key={track.slug}>
              <Globe aria-hidden="true" />
              <span>{track.level_group}</span>
              <strong>{track.course.category}</strong>
            </Link>
          ))}
        </div>
        <aside className="atlas-panel">
          <h2>Domain layers</h2>
          <div>
            {stats.domains.slice(0, 8).map((domain) => (
              <span key={domain}>{domain}</span>
            ))}
          </div>
          <dl>
            <div>
              <dt>Tracks</dt>
              <dd>{stats.tracks.length}</dd>
            </div>
            <div>
              <dt>Resources</dt>
              <dd>{stats.resources.length}</dd>
            </div>
            <div>
              <dt>Labs</dt>
              <dd>{stats.labs.length}</dd>
            </div>
          </dl>
          <DesignLabBrief lab={stats.labs.find((lab) => lab.level_group === "Advanced") ?? stats.labs[0]} title="Map waypoint" />
        </aside>
      </section>
    </section>
  );
}

function DesignObservabilityWall({ data, stats }: { data: AcademyData; stats: DesignStats }) {
  const metricRows = [
    { label: "Course inventory", value: data.catalog.total_courses },
    { label: "Lessons shipped", value: data.catalog.total_lessons },
    { label: "Completed lessons", value: stats.totalCompleted },
    { label: "Due reviews", value: data.dashboard.due_reviews }
  ];
  return (
    <section className="design-page design-observability">
      <DesignFrameNav activeId={5} />
      <header className="obs-header">
        <div>
          <p className="design-kicker">Observability wall</p>
          <h1>Learning signals for platform operators.</h1>
        </div>
        <Gauge aria-hidden="true" />
      </header>
      <DesignEvidenceStrip data={data} stats={stats} />
      <section className="obs-metric-grid">
        {metricRows.map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>
      <section className="obs-wall">
        <article className="obs-chart">
          <h2>Curriculum load</h2>
          {data.catalog.levels.map((level) => (
            <div key={level.slug}>
              <span>{level.level_group}</span>
              <i style={{ width: `${Math.max(8, Math.min(100, level.total_lessons * 8))}%` }} />
              <strong>{level.total_lessons}</strong>
            </div>
          ))}
        </article>
        <article className="obs-logs">
          <h2>Training event stream</h2>
          {stats.labs.slice(0, 5).map((lab) => (
            <p key={lab.slug}>
              <Activity aria-hidden="true" />
              <span>{lab.track}</span>
              {lab.scenario}
            </p>
          ))}
        </article>
        <article className="obs-current">
          <MonitorDot aria-hidden="true" />
          <span>Next lesson</span>
          <strong>{stats.recommended?.title ?? "Select a lesson"}</strong>
          {stats.recommended && <Link to={`/lessons/${stats.recommended.id}`}>Resume lesson</Link>}
        </article>
        <DesignLabBrief lab={stats.labs.find((lab) => lab.track === "SRE") ?? stats.labs[0]} title="Runbook drill" />
      </section>
    </section>
  );
}

function DesignInfraBlueprint({ data, stats }: { data: AcademyData; stats: DesignStats }) {
  return (
    <section className="design-page design-blueprint">
      <DesignFrameNav activeId={6} />
      <header className="blueprint-title">
        <div>
          <p className="design-kicker">Infrastructure blueprint</p>
          <h1>Platform Academy build sheet.</h1>
        </div>
        <Hexagon aria-hidden="true" />
      </header>
      <DesignEvidenceStrip data={data} stats={stats} />
      <section className="blueprint-sheet">
        <div className="blueprint-spec">
          <span>Spec PA-2026</span>
          <strong>{data.catalog.total_courses} courses / {data.catalog.total_lessons} lessons</strong>
          <p>{data.catalog.promise}</p>
          <ul>
            <li>Each lab is tied to a lesson ID.</li>
            <li>Resources produce reusable runbooks, diagrams, worksheets, or review artifacts.</li>
            <li>AWS commands remain sandbox-first or read-only.</li>
          </ul>
        </div>
        <div className="blueprint-plan">
          {stats.stages.map((stage) => (
            <article key={stage.sequence}>
              <span>{String(stage.sequence).padStart(2, "0")}</span>
              <div>
                <h2>{stage.title}</h2>
                <p>{stage.focus}</p>
              </div>
              <strong>{stage.level_group}</strong>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function DesignSaasDashboard({ data, stats }: { data: AcademyData; stats: DesignStats }) {
  return (
    <section className="design-page design-saas">
      <div className="saas-layout">
        <aside className="saas-sidebar">
          <DesignFrameNav activeId={7} />
          <div>
            <GraduationCap aria-hidden="true" />
            <strong>Platform Academy</strong>
            <span>Cohort console</span>
          </div>
          <nav aria-label="Dashboard sections">
            <a href="#overview">Overview</a>
            <a href="#tracks">Tracks</a>
            <a href="#resources">Resources</a>
          </nav>
        </aside>
        <div className="saas-workspace">
          <header id="overview">
            <div>
              <p className="design-kicker">Academy operations</p>
              <h1>Curriculum health dashboard.</h1>
            </div>
            <Link to="/labs">Review labs</Link>
          </header>
          <DesignEvidenceStrip data={data} stats={stats} />
          <section className="saas-kpis">
            <article>
              <Database aria-hidden="true" />
              <span>Resources</span>
              <strong>{stats.resources.length}</strong>
            </article>
            <article>
              <Gauge aria-hidden="true" />
              <span>Completion</span>
              <strong>{stats.completionPercent}%</strong>
            </article>
            <article>
              <Cpu aria-hidden="true" />
              <span>XP earned</span>
              <strong>{data.dashboard.xp.total}</strong>
            </article>
          </section>
          <section className="saas-table" id="tracks">
            <div className="saas-table-head">
              <h2>Track pipeline</h2>
              <span>{stats.tracks.length} active tracks</span>
            </div>
            {stats.tracks.slice(0, 6).map((track) => (
              <Link to={`/courses/${track.course.id}`} key={track.slug}>
                <span>{track.level_group}</span>
                <strong>{track.title}</strong>
                <p>{track.role}</p>
              </Link>
            ))}
          </section>
          <section className="saas-evidence" id="resources">
            <div className="saas-table-head">
              <h2>Evidence gates</h2>
              <span>{stats.resources.length} reusable artifacts</span>
            </div>
            {stats.resources.slice(0, 4).map((resource) => (
              <article key={resource.slug}>
                <span>{resource.resource_type}</span>
                <strong>{resource.domain}</strong>
                <p>{resource.artifacts.slice(0, 2).join(" / ")}</p>
              </article>
            ))}
          </section>
        </div>
      </div>
    </section>
  );
}

function DesignCommandCenterMap({ data, stats }: { data: AcademyData; stats: DesignStats }) {
  const positions = [
    { left: "12%", top: "24%" },
    { left: "42%", top: "12%" },
    { left: "70%", top: "30%" },
    { left: "28%", top: "64%" },
    { left: "62%", top: "70%" }
  ];
  return (
    <section className="design-page design-command-map">
      <DesignFrameNav activeId={8} />
      <header className="command-header">
        <p className="design-kicker">Command center</p>
        <h1>Deploy learning routes across the platform map.</h1>
        <p>{data.catalog.promise}</p>
      </header>
      <DesignEvidenceStrip data={data} stats={stats} />
      <section className="command-layout">
        <div className="command-map-board" aria-label="Platform course map">
          <span className="map-line map-line-a" />
          <span className="map-line map-line-b" />
          <span className="map-line map-line-c" />
          {stats.courses.slice(0, 5).map((course, index) => (
            <Link className="command-node" style={positions[index]} to={`/courses/${course.id}`} key={course.id}>
              <Server aria-hidden="true" />
              <span>{course.category}</span>
              <strong>{course.title}</strong>
            </Link>
          ))}
        </div>
        <aside className="command-rail">
          <h2>Dispatch queue</h2>
          {stats.labs.slice(0, 5).map((lab) => (
            <article key={lab.slug}>
              <RadioTower aria-hidden="true" />
              <div>
                <strong>{lab.title}</strong>
                <span>{lab.estimated_minutes} min / {lab.level_group}</span>
                <p>{lab.scenario}</p>
              </div>
            </article>
          ))}
        </aside>
      </section>
    </section>
  );
}

function DesignBootcamp({ data, stats }: { data: AcademyData; stats: DesignStats }) {
  return (
    <section className="design-page design-bootcamp">
      <DesignFrameNav activeId={9} />
      <header className="bootcamp-hero">
        <div>
          <p className="design-kicker">Certification bootcamp</p>
          <h1>Train for platform interviews, incidents, and architecture reviews.</h1>
          <p>{data.catalog.promise}</p>
          {stats.recommended && (
            <Link to={`/lessons/${stats.recommended.id}`}>
              Continue drill <ArrowRight aria-hidden="true" />
            </Link>
          )}
        </div>
        <aside>
          <Target aria-hidden="true" />
          <strong>{stats.completionPercent}%</strong>
          <span>readiness score</span>
        </aside>
      </header>
      <DesignEvidenceStrip data={data} stats={stats} />
      <section className="bootcamp-timeline" aria-label="Bootcamp progression">
        {data.catalog.levels.map((level, index) => (
          <article key={level.slug}>
            <span>Week {index + 1}</span>
            <h2>{level.level_group}</h2>
            <p>{level.audience}</p>
            <strong>{level.total_courses} courses</strong>
          </article>
        ))}
      </section>
      <section className="bootcamp-drills">
        {stats.resources.slice(0, 4).map((resource) => (
          <article key={resource.slug}>
            <span>{resource.resource_type}</span>
            <h3>{resource.title}</h3>
            <p>{resource.summary}</p>
          </article>
        ))}
      </section>
      <section className="bootcamp-assessment" aria-label="Assessment gates">
        <DesignLabBrief lab={stats.labs.find((lab) => lab.level_group === "Advanced") ?? stats.labs[0]} title="Timed assessment" />
        <DesignResourceBrief resource={firstResourceForLab(stats.resources, stats.labs[0])} />
      </section>
    </section>
  );
}

function DesignResourceLibrary({ data, stats }: { data: AcademyData; stats: DesignStats }) {
  const leadResource = stats.resources[0];
  const leadLab = stats.labs.find((lab) => leadResource?.related_labs.includes(lab.slug)) ?? stats.labs[0];
  return (
    <section className="design-page design-library">
      <DesignFrameNav activeId={10} />
      <header className="library-hero">
        <p className="design-kicker">Resource library</p>
        <h1>Runbooks, briefs, and references for every platform domain.</h1>
        <p>{data.catalog.promise}</p>
      </header>
      <DesignEvidenceStrip data={data} stats={stats} />
      <section className="library-layout">
        <article className="library-feature">
          <BookMarked aria-hidden="true" />
          <span>{leadResource?.resource_type ?? "resource"}</span>
          <h2>{leadResource?.title ?? "Platform resource collection"}</h2>
          <p>{leadResource?.summary ?? "Curated support material for the academy."}</p>
          {leadResource && (
            <pre>
              <code>{leadResource.commands.slice(0, 2).join("\n")}</code>
            </pre>
          )}
          {leadLab && <small>Related lab: {leadLab.title}</small>}
          <Link to="/resources">Open resource library</Link>
        </article>
        <div className="library-stack">
          {stats.resources.slice(0, 6).map((resource) => (
            <article key={resource.slug}>
              <span>{resource.domain}</span>
              <h3>{resource.title}</h3>
              <p>{resource.outcomes.slice(0, 2).join(" ")}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
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
  const courseLabs = labsForCourse(data, course);
  const courseResources = resourcesForCourse(data, course);

  return (
    <section className="page canonical-page course-detail-page">
      <Link className="back-link" to="/">
        <ChevronLeft aria-hidden="true" />
        Courses
      </Link>
      <header className="workspace-header course-header">
        <div>
          <div className="course-title-line">
            <Icon aria-hidden="true" />
            <LevelBadge level={track?.level_group ?? course.level} />
            <span>{course.category}</span>
          </div>
          <h1>{course.title}</h1>
          <p className="lead">{course.description}</p>
        </div>
        <div className="readiness-score">
          <span>Course progress</span>
          <strong>{progress.percent}%</strong>
          <ProgressBar value={progress.percent} />
          <small>
            {progress.done} of {progress.total} lessons complete
          </small>
        </div>
      </header>

      <section className="detail-layout">
        <div className="detail-main">
          {track && (
            <section className="workspace-panel">
              <p className="eyebrow">Track outcome</p>
              <h2>{track.title}</h2>
              <p>{track.summary}</p>
              <ul className="check-list">
                {track.outcomes.map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="workspace-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Lesson sequence</p>
                <h2>{course.lessons.length} lessons</h2>
              </div>
            </div>
            <div className="lesson-list" aria-label={`${course.title} lessons`}>
              {course.lessons.map((lesson) => (
                <Link className="lesson-row canonical-lesson-row" to={`/lessons/${lesson.id}`} key={lesson.id}>
                  <span>{lesson.sequence}</span>
                  <div>
                    <h2>{lesson.title}</h2>
                    <p>{lesson.summary}</p>
                  </div>
                  {completed.has(lesson.id) ? <CheckCircle2 aria-label="Completed" /> : <ArrowRight aria-hidden="true" />}
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="detail-rail">
          <section className="workspace-panel">
            <p className="eyebrow">Lab gates</p>
            {courseLabs.length > 0 ? (
              courseLabs.slice(0, 5).map((lab) => (
                <Link className="resource-mini-row" aria-label={lab.title} to={`/labs/${lab.slug}`} key={lab.slug}>
                  <span>{lab.estimated_minutes} min</span>
                  <strong>{lab.title}</strong>
                </Link>
              ))
            ) : (
              <p>No labs are seeded for this course.</p>
            )}
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Reusable artifacts</p>
            {courseResources.length > 0 ? (
              courseResources.slice(0, 6).map((resource) => (
                <Link className="resource-mini-row" aria-label={resource.title} to={`/resources/${resource.slug}`} key={resource.slug}>
                  <span>{resource.resource_type}</span>
                  <strong>{resource.title}</strong>
                </Link>
              ))
            ) : (
              <p>No resources are linked to this course in the seeded data.</p>
            )}
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Source and review posture</p>
            <p>Course metadata is seeded from the local catalog. External docs links, vendor version context, and last-reviewed dates are not exposed by the current API.</p>
          </section>
        </aside>
      </section>
    </section>
  );
}

function LessonPage({ data, learnerId, onProgressSaved }: { data: AcademyData; learnerId: string; onProgressSaved: () => void }) {
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
      await api.saveProgress(lesson.id, true, 1, learnerId);
      setSaved(true);
      onProgressSaved();
    } finally {
      setSaving(false);
    }
  };

  if (error) return <EmptyState title="Lesson unavailable." detail={error} />;
  if (!lesson) return <EmptyState title="Loading lesson..." />;
  const course = courseForLesson(data, lesson.id);
  const relatedLabs = data.catalog.labs.filter((lab) => lab.lesson_id === lesson.id);
  const relatedResources = resourcesForLesson(data, lesson.id);

  return (
    <section className="page canonical-page lesson-page">
      <Link className="back-link" to={course ? `/courses/${course.id}` : "/"}>
        <ChevronLeft aria-hidden="true" />
        {course?.title ?? "Academy"}
      </Link>
      <header className="workspace-header lesson-heading">
        <div>
          <p className="eyebrow">
            Platform Academy / {lesson.course_category} / Lesson {lesson.sequence}
          </p>
          <h1>{lesson.title}</h1>
          <p className="lead">{lesson.summary}</p>
        </div>
        <div className="workspace-actions">
          <button className="primary-action" disabled={saving} onClick={save}>
            <CheckCircle2 aria-hidden="true" />
            {saved ? "Progress saved" : saving ? "Saving..." : "Mark complete"}
          </button>
        </div>
      </header>

      <section className="detail-layout lesson-layout">
        <div className="detail-main">
          <article className="lesson-body workspace-panel">
            <RichContent text={lesson.body_simplified} />
          </article>

          <section className="practice-panel workspace-panel">
            <div>
              <p className="eyebrow">Lab scenario</p>
              <h2>Practice the lesson</h2>
            </div>
            <RichContent text={lesson.pinyin} />
          </section>

          <section className="workspace-panel">
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
          </section>
        </div>

        <aside className="detail-rail">
          <section className="workspace-panel">
            <p className="eyebrow">Review flashcards</p>
            <div className="review-list">
              {lesson.flashcards.map((card) => (
                <article key={card.id}>
                  <strong>{card.prompt}</strong>
                  <p>{card.answer}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Related lab gates</p>
            {relatedLabs.length > 0 ? (
              relatedLabs.map((lab) => (
                <Link className="resource-mini-row" aria-label={lab.title} to={`/labs/${lab.slug}`} key={lab.slug}>
                  <span>{lab.level_group}</span>
                  <strong>{lab.title}</strong>
                </Link>
              ))
            ) : (
              <p>No lab is linked to this lesson in the seeded data.</p>
            )}
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Related resources</p>
            {relatedResources.length > 0 ? (
              relatedResources.slice(0, 5).map((resource) => (
                <Link className="resource-mini-row" aria-label={resource.title} to={`/resources/${resource.slug}`} key={resource.slug}>
                  <span>{resource.resource_type}</span>
                  <strong>{resource.title}</strong>
                </Link>
              ))
            ) : (
              <p>No resource is linked to this lesson in the seeded data.</p>
            )}
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Source and review posture</p>
            <p>Lesson content is loaded from the local API. No external source URL, version target, or last-reviewed timestamp is present in the lesson payload.</p>
            <p>Use the linked lab checklist and resource artifacts as the completion evidence.</p>
          </section>
        </aside>
      </section>
    </section>
  );
}

export default function App() {
  const [learnerId, setLearnerId] = useState(getOrCreateLocalLearnerId);
  const [data, setData] = useState<AcademyData | null>(null);
  const [error, setError] = useState("");
  const loadRequestId = useRef(0);

  const loadData = useCallback(() => {
    const requestId = loadRequestId.current + 1;
    loadRequestId.current = requestId;
    setError("");

    return Promise.all([api.catalog(), api.roadmap(), api.resources(), api.progress(learnerId), api.dashboard(learnerId)])
      .then(([catalog, roadmap, resources, progress, dashboard]) => {
        if (requestId !== loadRequestId.current) return;
        setData({ catalog, roadmap, resources, progress, dashboard });
      })
      .catch((err) => {
        if (requestId !== loadRequestId.current) return;
        setError(err.message);
      });
  }, [learnerId]);

  const resetLearner = () => {
    loadRequestId.current += 1;
    setData(null);
    setError("");
    setLearnerId(resetLocalLearnerId());
  };

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (error) {
    return (
      <AppShell learnerId={learnerId} onResetLearner={resetLearner}>
        <EmptyState title="Platform Academy is unavailable." detail={error} />
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell learnerId={learnerId} onResetLearner={resetLearner}>
        <EmptyState title="Loading Platform Academy..." />
      </AppShell>
    );
  }

  return (
    <AppShell learnerId={learnerId} onResetLearner={resetLearner}>
      <Routes>
        <RouterRoute path="/" element={<DashboardPage data={data} />} />
        <RouterRoute path="/dashboard/home" element={<DashboardPage data={data} />} />
        <RouterRoute path="/roadmap" element={<RoadmapPage data={data} />} />
        <RouterRoute path="/labs" element={<LabsPage data={data} />} />
        <RouterRoute path="/labs/:slug" element={<LabDetailPage data={data} />} />
        <RouterRoute path="/resources" element={<ResourcesPage data={data} />} />
        <RouterRoute path="/resources/:slug" element={<ResourceDetailPage data={data} />} />
        <RouterRoute path="/designs" element={<DesignsIndexPage data={data} />} />
        <RouterRoute path="/designs/:id" element={<DesignVariantPage data={data} />} />
        <RouterRoute path="/courses/:id" element={<CoursePage data={data} />} />
        <RouterRoute path="/lessons/:id" element={<LessonPage data={data} learnerId={learnerId} onProgressSaved={loadData} />} />
        <RouterRoute path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
