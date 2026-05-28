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
  Cpu,
  Database,
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
  Route,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Target,
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

function ResourcesPage({ data }: { data: AcademyData }) {
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [query, setQuery] = useState("");
  const filteredResources = data.resources.resources.filter((resource) => {
    const text = `${resource.title} ${resource.summary} ${resource.domain} ${resource.resource_type}`.toLowerCase();
    return (
      (selectedDomain === "All" || resource.domain === selectedDomain) &&
      (selectedType === "All" || resource.resource_type === selectedType) &&
      text.includes(query.toLowerCase())
    );
  });

  return (
    <section className="page">
      <header className="page-heading resources-heading">
        <p className="eyebrow">Codex gap audit: resources, projects, rubrics, references</p>
        <h1>Resource library for comprehensive platform mastery</h1>
        <p className="lead">
          Cheatsheets, runbooks, worksheets, project briefs, templates, references, diagrams, assessments, and interview drills for every academy domain.
        </p>
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
            <dt>Artifact types</dt>
            <dd>{data.resources.types.length}</dd>
          </div>
        </dl>
      </header>
      <section className="toolbar" aria-label="Resource filters">
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
      <section className="resource-grid" aria-label="Platform Academy resources">
        {filteredResources.map((resource) => (
          <ResourceCard resource={resource} data={data} key={resource.slug} />
        ))}
      </section>
      {filteredResources.length === 0 && <EmptyState title="No resources match those filters." />}
    </section>
  );
}

function ResourceCard({ resource, data }: { resource: PlatformResource; data: AcademyData }) {
  const lab = data.catalog.labs.find((item) => resource.related_labs.includes(item.slug));
  return (
    <article className="resource-card">
      <div className="resource-card-top">
        <LevelBadge level={resource.level_group} />
        <span>{resource.resource_type}</span>
        <span>{resource.estimated_minutes} min</span>
      </div>
      <h2>{resource.title}</h2>
      <p>{resource.summary}</p>
      <div className="chip-list">
        <span>{resource.domain}</span>
        <span>{resource.safety_level}</span>
      </div>
      <h3>Outcomes</h3>
      <ul>
        {resource.outcomes.slice(0, 2).map((outcome) => (
          <li key={outcome}>{outcome}</li>
        ))}
      </ul>
      <h3>Artifact</h3>
      <p>{resource.artifacts.join(" • ")}</p>
      <pre>
        <code>{resource.commands.join("\n")}</code>
      </pre>
      <div className="resource-links">
        {lab?.lesson_id && (
          <Link className="text-link" to={`/lessons/${lab.lesson_id}`}>
            Related lesson <ArrowRight aria-hidden="true" />
          </Link>
        )}
        {lab && <span>Lab: {lab.title}</span>}
      </div>
    </article>
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
        <div className="terminal-grid">
          <article className="terminal-hero">
            <p>demo-user@platform-academy:~$ ./start-learning</p>
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
      <section className="blueprint-sheet">
        <div className="blueprint-spec">
          <span>Spec PA-2026</span>
          <strong>{data.catalog.total_courses} courses / {data.catalog.total_lessons} lessons</strong>
          <p>{data.catalog.promise}</p>
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
    </section>
  );
}

function DesignResourceLibrary({ data, stats }: { data: AcademyData; stats: DesignStats }) {
  const leadResource = stats.resources[0];
  return (
    <section className="design-page design-library">
      <DesignFrameNav activeId={10} />
      <header className="library-hero">
        <p className="design-kicker">Resource library</p>
        <h1>Runbooks, briefs, and references for every platform domain.</h1>
        <p>{data.catalog.promise}</p>
      </header>
      <section className="library-layout">
        <article className="library-feature">
          <BookMarked aria-hidden="true" />
          <span>{leadResource?.resource_type ?? "resource"}</span>
          <h2>{leadResource?.title ?? "Platform resource collection"}</h2>
          <p>{leadResource?.summary ?? "Curated support material for the academy."}</p>
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
    Promise.all([api.catalog(), api.roadmap(), api.resources(), api.progress(), api.dashboard()])
      .then(([catalog, roadmap, resources, progress, dashboard]) => setData({ catalog, roadmap, resources, progress, dashboard }))
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
        <RouterRoute path="/resources" element={<ResourcesPage data={data} />} />
        <RouterRoute path="/designs" element={<DesignsIndexPage data={data} />} />
        <RouterRoute path="/designs/:id" element={<DesignVariantPage data={data} />} />
        <RouterRoute path="/courses/:id" element={<CoursePage data={data} />} />
        <RouterRoute path="/lessons/:id" element={<LessonPage onProgressSaved={loadData} />} />
        <RouterRoute path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
