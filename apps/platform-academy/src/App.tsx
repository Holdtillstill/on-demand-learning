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
  Download,
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
  Plus,
  RadioTower,
  RefreshCcw,
  Route,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  Trash2,
  UserRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Navigate, Route as RouterRoute, Routes, useLocation, useParams } from "react-router-dom";

import { api } from "./api";
import { getOrCreateLocalLearnerId, resetLocalLearnerId, restoreLocalLearnerId } from "./learnerIdentity";
import type {
  Course,
  Lesson,
  PlatformAcademyCatalog,
  PlatformActivity,
  PlatformActivityInput,
  PlatformInterviewPrep,
  PlatformInterviewPrepIndex,
  PlatformAcademyRoadmap,
  PlatformInterviewStudyPlan,
  PlatformLab,
  PlatformLearnerStateExport,
  PlatformLabSubmission,
  PlatformLabSubmissionInput,
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
  resourcesLoaded: boolean;
  interviewPrep: PlatformInterviewPrepIndex;
  interviewPrepLoaded: boolean;
  progress: Progress[];
  activity: PlatformActivity[];
  labSubmissions: PlatformLabSubmission[];
  dashboard: UserDashboard;
};

const EMPTY_RESOURCES: PlatformResources = {
  domains: [],
  types: [],
  resources: []
};

const EMPTY_INTERVIEW_PREP: PlatformInterviewPrepIndex = {
  domains: [],
  levels: [],
  total_questions: 0,
  packs: []
};

type StaticContentCache = {
  resources?: PlatformResources;
  interviewPrep?: PlatformInterviewPrepIndex;
};

type SaveActivity = (activity: PlatformActivityInput) => Promise<PlatformActivity>;
type SaveLabSubmission = (slug: string, submission: PlatformLabSubmissionInput) => Promise<PlatformLabSubmission>;

type ContentBlock =
  | { type: "heading"; content: string }
  | { type: "paragraph"; content: string }
  | { type: "list"; items: string[] }
  | { type: "code"; lines: string[] };

const levelOrder = ["Fresher", "Intermediate", "Advanced"];
const labTierLabels: Record<PlatformLab["lab_tier"], string> = {
  full: "Full lab",
  guided: "Guided lab",
  "evidence-pack": "Evidence pack"
};
const labTierOrder: PlatformLab["lab_tier"][] = ["full", "guided", "evidence-pack"];
const labScopeLabels = {
  All: "All labs",
  Portfolio: "Portfolio-grade"
} as const;
type LabScopeFilter = keyof typeof labScopeLabels;
const labRuntimeLabels = {
  All: "All runtimes",
  Cluster: "Cluster setup",
  Files: "File-only"
} as const;
type LabRuntimeFilter = keyof typeof labRuntimeLabels;
const rubricStatusLabels: Record<string, string> = {
  missing: "Missing",
  "needs-evidence": "Needs evidence",
  passes: "Passes",
  strong: "Strong"
};
const rubricStatusOrder = ["strong", "passes", "needs-evidence", "missing"];
const learnerStateLimits = {
  progressRows: 120,
  activityRows: 600,
  labRows: 40,
  studyPlanRows: 25,
  studyPlanQuestionRows: 250,
  studyPlanNameLength: 120,
  worksheetFields: 80,
  checkedFields: 160,
  fieldKeyLength: 100,
  worksheetValueLength: 4000
};

const STUDY_PLANS_RESTORED_EVENT = "platform-academy-study-plans-restored";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateBackupFieldMap(value: unknown, valueType: "string" | "boolean", maxFields: number) {
  if (!isRecord(value)) return false;
  const entries = Object.entries(value);
  if (entries.length > maxFields) return false;
  return entries.every(([key, entryValue]) => {
    if (key.length > learnerStateLimits.fieldKeyLength) return false;
    if (valueType === "string") return typeof entryValue === "string" && entryValue.length <= learnerStateLimits.worksheetValueLength;
    return typeof entryValue === "boolean";
  });
}

function validateBackupStudyPlans(value: unknown) {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > learnerStateLimits.studyPlanRows) return false;
  return value.every((plan) => {
    if (!isRecord(plan)) return false;
    if (typeof plan.id !== "string" || typeof plan.name !== "string") return false;
    if (plan.id.length > learnerStateLimits.fieldKeyLength || plan.name.length > learnerStateLimits.studyPlanNameLength) return false;
    if (typeof plan.createdAt !== "string" || typeof plan.updatedAt !== "string") return false;
    if (!Array.isArray(plan.questionIds) || plan.questionIds.length > learnerStateLimits.studyPlanQuestionRows) return false;
    return plan.questionIds.every((questionId) => typeof questionId === "string" && questionId.length <= learnerStateLimits.fieldKeyLength);
  });
}

function sanitizeCheckedItems(value: Record<string, unknown> | undefined, allowedKeys: Set<string>) {
  const sanitized: Record<string, boolean> = {};
  for (const [key, entryValue] of Object.entries(value ?? {})) {
    if (allowedKeys.has(key)) sanitized[key] = Boolean(entryValue);
  }
  return sanitized;
}

function sanitizeWorksheetAnswers(value: Record<string, unknown> | undefined, allowedKeys: Set<string>) {
  const sanitized: Record<string, string> = {};
  for (const [key, entryValue] of Object.entries(value ?? {})) {
    if (!allowedKeys.has(key)) continue;
    if (typeof entryValue === "string") {
      sanitized[key] = entryValue;
    } else if (entryValue !== null && entryValue !== undefined) {
      sanitized[key] = String(entryValue);
    }
  }
  return sanitized;
}

function learnerBackupValidationError(value: unknown) {
  if (!isRecord(value)) return "Use an exported Platform Academy JSON backup.";
  if (value.schema_version !== 1) return "Backup schema version is not supported.";
  if (!Array.isArray(value.progress) || !Array.isArray(value.activity) || !Array.isArray(value.lab_submissions)) {
    return "Use an exported Platform Academy JSON backup.";
  }
  if (
    value.progress.length > learnerStateLimits.progressRows ||
    value.activity.length > learnerStateLimits.activityRows ||
    value.lab_submissions.length > learnerStateLimits.labRows
  ) {
    return "Backup is too large for import.";
  }
  for (const labSubmission of value.lab_submissions) {
    if (!isRecord(labSubmission) || typeof labSubmission.lab_slug !== "string") {
      return "Use an exported Platform Academy JSON backup.";
    }
    if (
      !validateBackupFieldMap(labSubmission.worksheet_answers, "string", learnerStateLimits.worksheetFields) ||
      !validateBackupFieldMap(labSubmission.checked_items, "boolean", learnerStateLimits.checkedFields)
    ) {
      return "Backup lab workbook fields exceed the import limit.";
    }
  }
  if (!validateBackupStudyPlans(value.interview_study_plans)) {
    return "Backup interview study plans exceed the import limit.";
  }
  return "";
}

function allCourses(catalog: PlatformAcademyCatalog) {
  return catalog.levels.flatMap((level) => level.courses);
}

function completedLessonIds(progress: Progress[]) {
  return new Set(progress.filter((row) => row.completed).map((row) => row.lesson_id));
}

function completedActivityIds(activity: PlatformActivity[], targetType: string) {
  return new Set(activity.filter((row) => row.target_type === targetType && row.state === "completed").map((row) => row.target_id));
}

function hasCompletedActivity(data: AcademyData, targetType: string, targetId: string) {
  return data.activity.some((row) => row.target_type === targetType && row.target_id === targetId && row.state === "completed");
}

function upsertActivityRow(activity: PlatformActivity[], saved: PlatformActivity) {
  const next = activity.filter((row) => !(row.target_type === saved.target_type && row.target_id === saved.target_id));
  return [saved, ...next];
}

function upsertLabSubmissionRow(submissions: PlatformLabSubmission[], saved: PlatformLabSubmission) {
  const next = submissions.filter((row) => row.lab_slug !== saved.lab_slug);
  return [saved, ...next];
}

function labSubmissionFor(data: AcademyData, labSlug: string) {
  return data.labSubmissions.find((submission) => submission.lab_slug === labSlug);
}

function labTierFilterOptions(labs: PlatformLab[]): Array<"All" | PlatformLab["lab_tier"]> {
  const presentTiers = labTierOrder.filter((tier) => labs.some((lab) => lab.lab_tier === tier));
  return presentTiers.length > 1 ? ["All", ...presentTiers] : [];
}

function isPortfolioLab(lab: PlatformLab) {
  return lab.portfolio_grade === true;
}

function labInventorySummary(activeSubmissionCount: number, fullLabCount: number, totalLabCount: number) {
  if (fullLabCount === totalLabCount) {
    return `${activeSubmissionCount} active / ${totalLabCount} full ${totalLabCount === 1 ? "lab" : "labs"}`;
  }
  return `${activeSubmissionCount} active / ${fullLabCount} full / ${totalLabCount} total`;
}

function labSubmissionSummary(submission?: PlatformLabSubmission) {
  if (!submission || (submission.score === 0 && submission.completed_checks === 0 && submission.answered_prompts === 0)) {
    return { label: "Not started", className: "not-started", score: 0 };
  }
  if (submission.status === "submitted" || submission.score >= 100) {
    return { label: "Submitted", className: "submitted", score: submission.score };
  }
  if (submission.rubric_feedback.some((item) => item.status === "strong")) {
    return { label: "Strong evidence", className: "strong", score: submission.score };
  }
  return { label: "In progress", className: "in-progress", score: submission.score };
}

function hasLabSubmissionEvidence(submission: PlatformLabSubmission) {
  return (
    submission.score > 0 ||
    submission.completed_checks > 0 ||
    submission.answered_prompts > 0 ||
    submission.status === "submitted" ||
    submission.evidence_terms.length > 0 ||
    Object.values(submission.checked_items).some(Boolean) ||
    Object.values(submission.worksheet_answers).some((value) => String(value).trim().length > 0)
  );
}

function labSubmissionUpdatedTime(submission: PlatformLabSubmission) {
  const date = new Date(submission.updated_at);
  if (Number.isNaN(date.getTime())) return submission.updated_at;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function sortedLabSubmissions(submissions: PlatformLabSubmission[]) {
  return [...submissions].sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime());
}

function labRubricStatusCounts(submission: PlatformLabSubmission) {
  return submission.rubric_feedback.reduce<Record<string, number>>((counts, item) => {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
    return counts;
  }, {});
}

function orderedRubricStatusEntries(counts: Record<string, number>) {
  const known = rubricStatusOrder.filter((status) => counts[status]).map((status) => [status, counts[status]] as const);
  const unknown = Object.entries(counts)
    .filter(([status]) => !rubricStatusOrder.includes(status))
    .sort(([left], [right]) => left.localeCompare(right));
  return [...known, ...unknown];
}

function submissionReportMarkdown(data: AcademyData, submissions: PlatformLabSubmission[]) {
  const lines = ["# Platform Academy Lab Evidence", ""];
  if (submissions.length === 0) {
    lines.push("No lab submissions have been saved yet.");
    return lines.join("\n");
  }

  const allEvidenceTerms = Array.from(new Set(submissions.flatMap((submission) => submission.evidence_terms))).sort((left, right) => left.localeCompare(right));
  const averageScore = Math.round(submissions.reduce((total, submission) => total + submission.score, 0) / submissions.length);
  lines.push(`Saved labs: ${submissions.length}`);
  lines.push(`Average score: ${averageScore}%`);
  if (allEvidenceTerms.length > 0) lines.push(`Evidence terms: ${allEvidenceTerms.join(", ")}`);
  lines.push("");

  for (const submission of submissions) {
    const lab = labForSlug(data, submission.lab_slug);
    const statusCounts = orderedRubricStatusEntries(labRubricStatusCounts(submission));
    const worksheetNotes = (lab?.worksheet_prompts ?? [])
      .map((prompt, index) => ({ prompt, answer: submission.worksheet_answers[`worksheet-${index}`]?.trim() ?? "" }))
      .filter((item) => item.answer.length > 0);
    const learnerArtifacts = lab ? learnerArtifactPaths(lab) : [];
    lines.push(`## ${lab?.title ?? submission.lab_slug}`);
    lines.push("");
    if (lab?.scenario) lines.push(`Scenario: ${lab.scenario}`);
    lines.push("");
    lines.push(`- Lab: ${submission.lab_slug}`);
    lines.push(`- Route: /labs/${submission.lab_slug}`);
    lines.push(`- Status: ${labSubmissionSummary(submission).label}`);
    lines.push(`- Score: ${Math.round(submission.score)}%`);
    lines.push(`- Prompts answered: ${submission.answered_prompts}/${submission.total_prompts}`);
    lines.push(`- Checks completed: ${submission.completed_checks}/${submission.total_checks}`);
    lines.push(`- Updated: ${labSubmissionUpdatedTime(submission)}`);
    if (lab?.lab_tier) lines.push(`- Tier: ${labTierLabels[lab.lab_tier]}`);
    if (submission.evidence_terms.length > 0) lines.push(`- Evidence terms: ${submission.evidence_terms.join(", ")}`);
    if (statusCounts.length > 0) {
      lines.push(`- Rubric: ${statusCounts.map(([status, count]) => `${rubricStatusLabels[status] ?? status}: ${count}`).join(", ")}`);
    }
    lines.push("");
    if (worksheetNotes.length > 0) {
      lines.push("### Worksheet Notes");
      for (const item of worksheetNotes) {
        lines.push(`- ${item.prompt}: ${item.answer.replace(/\s+/g, " ")}`);
      }
      lines.push("");
    }
    if (lab?.expected_evidence?.length) {
      lines.push("### Expected Evidence");
      for (const item of lab.expected_evidence) lines.push(`- ${item}`);
      lines.push("");
    }
    if (learnerArtifacts.length > 0) {
      lines.push("### Learner Artifacts");
      for (const artifactPath of learnerArtifacts) lines.push(`- ${artifactPath}`);
      lines.push("");
    }
    if (lab?.validation_commands?.length) {
      lines.push("### Validation Commands");
      for (const command of lab.validation_commands) lines.push(`- \`${command}\``);
      lines.push("");
    }
    if (submission.rubric_feedback.length > 0) {
      lines.push("### Rubric Follow-ups");
      for (const item of submission.rubric_feedback) {
        const status = rubricStatusLabels[item.status] ?? item.status;
        lines.push(`- ${status}: ${item.criterion} - ${item.feedback}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
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
    <div className="progress-track" role="progressbar" aria-label={`${value}% complete`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <div style={{ width: `${value}%` }} />
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  return <span className={`level-badge level-${level.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{level}</span>;
}

function LabTierBadge({ tier }: { tier: PlatformLab["lab_tier"] }) {
  return <span className={`lab-tier-badge lab-tier-${tier}`}>{labTierLabels[tier]}</span>;
}

function PortfolioLabBadge({ lab }: { lab: PlatformLab }) {
  if (!isPortfolioLab(lab)) return null;
  return <span className="portfolio-lab-badge">{lab.portfolio_focus ? lab.portfolio_focus : "Portfolio-grade"}</span>;
}

function LabRuntimeBadge({ lab }: { lab: PlatformLab }) {
  const isCluster = isClusterRunnableLab(lab);
  return <span className={`lab-runtime-badge ${isCluster ? "lab-runtime-cluster" : "lab-runtime-files"}`}>{isCluster ? "Cluster setup included" : "File-only lab"}</span>;
}

function ActivityToggleButton({
  completed,
  saving,
  onClick,
  actionLabel,
  completedLabel
}: {
  completed: boolean;
  saving: boolean;
  onClick: () => void;
  actionLabel: string;
  completedLabel: string;
}) {
  return (
    <button className={completed ? "activity-toggle completed" : "activity-toggle"} disabled={completed || saving} onClick={onClick} type="button">
      {completed ? (
        <>
          <CheckCircle2 aria-hidden="true" />
          {completedLabel}
        </>
      ) : saving ? (
        "Saving..."
      ) : (
        actionLabel
      )}
    </button>
  );
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
  { to: "/interview-prep", label: "Interview", icon: GraduationCap, match: (path: string) => path.startsWith("/interview-prep") },
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

function coursePath(course: Course) {
  return `/courses/${course.slug}`;
}

function courseForRef(data: AcademyData, courseRef: string) {
  return allCourses(data.catalog).find((course) => course.slug === courseRef || course.id === Number(courseRef));
}

function lessonPath(course: Course, lesson: Course["lessons"][number]) {
  return `${coursePath(course)}/lessons/${lesson.sequence}`;
}

function lessonPathForId(data: AcademyData, lessonId?: number | null) {
  if (!lessonId) return "/";
  const course = courseForLesson(data, lessonId);
  const lesson = course?.lessons.find((item) => item.id === lessonId);
  return course && lesson ? lessonPath(course, lesson) : `/lessons/${lessonId}`;
}

function latestCompletedProgress(data: AcademyData, lessonIds?: Set<number>) {
  return [...data.progress]
    .filter((progress) => progress.completed && (!lessonIds || lessonIds.has(progress.lesson_id)))
    .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())[0];
}

function formatReviewDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CommandBlock({ commands, title = "Commands" }: { commands: string[]; title?: string }) {
  const [copied, setCopied] = useState(false);
  const commandText = commands.length > 0 ? commands.join("\n") : "No command snippet is available for this item.";
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

function LabListSection({ items, title }: { items?: string[]; title: string }) {
  if (!items?.length) return null;
  return (
    <>
      <h2>{title}</h2>
      <ul className="check-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}

const LAB_WORKBOOK_STATE_PREFIX = "platform-academy-lab-workbook:";

const labContractFiles = [
  { label: "Guide", filename: "README.md" },
  { label: "Evidence", filename: "evidence-template.md" },
  { label: "Validator", filename: "validate.sh" },
  { label: "Cleanup", filename: "cleanup.sh" }
];

function learnerArtifactPaths(lab: PlatformLab) {
  return lab.learner_artifact_paths ?? (lab.artifact_paths ?? []).filter((path) => !path.endsWith("/solution.md") && !path.endsWith("/README.md"));
}

function labContractArtifacts(lab: PlatformLab) {
  const paths = learnerArtifactPaths(lab);
  return labContractFiles.map((item) => ({
    ...item,
    path: item.filename === "README.md" ? "README.md" : paths.find((path) => path.endsWith(`/${item.filename}`) || path === item.filename)
  }));
}

function labWorkspaceArchiveName(lab: PlatformLab) {
  return lab.workspace_archive_name || `${lab.slug}-learner-workspace.zip`;
}

function labWorkspaceQuickstartCommands(lab: PlatformLab) {
  return lab.workspace_quickstart_commands?.length
    ? lab.workspace_quickstart_commands
    : [
        `unzip ${labWorkspaceArchiveName(lab)}`,
        `cd ${lab.workspace_root || lab.slug}`,
        "./setup.sh",
        "# Fill evidence.md with your investigation notes",
        "./validate.sh --files-only",
        "./validate.sh",
        "./cleanup.sh"
      ];
}

function labClusterWorkspaceCommands(lab: PlatformLab) {
  return lab.cluster_workspace_commands ?? [];
}

function isClusterRunnableLab(lab: PlatformLab) {
  return labClusterWorkspaceCommands(lab).length > 0;
}

function compactLabItems(items: Array<string | undefined>, limit = 4) {
  return items.filter((item): item is string => Boolean(item?.trim())).slice(0, limit);
}

function labArtifactName(path: string) {
  return path.split("/").pop() ?? path;
}

function labArtifactRole(path: string) {
  const lower = path.toLowerCase();
  if (lower.endsWith("evidence-template.md")) return "Evidence template";
  if (lower.endsWith("validate.sh")) return "Self-check script";
  if (lower.endsWith("cleanup.sh")) return "Cleanup script";
  if (lower.includes("fixed") || lower.includes("safe") || lower.includes("ready") || lower.includes("completed")) return "Target artifact";
  if (lower.includes("start") || lower.includes("broken") || lower.includes("live") || lower.includes("snapshot") || lower.includes("report")) return "Starting evidence";
  if (lower.includes("event") || lower.includes("log") || lower.includes("cloudtrail") || lower.includes("tfplan")) return "Captured evidence";
  if (lower.endsWith(".yaml") || lower.endsWith(".yml") || lower.endsWith(".json")) return "Manifest";
  if (lower.endsWith(".md")) return "Decision note";
  return "Lab artifact";
}

function labRunPhases(lab: PlatformLab) {
  return [
    {
      title: "Prepare workspace",
      label: `${(lab.prerequisites?.length ?? 0) + (lab.setup_commands?.length ?? 0)} setup signals`,
      icon: Terminal,
      items: compactLabItems([...(lab.prerequisites ?? []), ...(lab.setup_commands ?? [])]),
      emptyText: "No setup step is required before opening the evidence."
    },
    {
      title: "Investigate safely",
      label: `${(lab.practice_steps?.length ?? 0) + lab.commands.length} investigation steps`,
      icon: Search,
      items: compactLabItems([...(lab.practice_steps ?? []), ...lab.commands]),
      emptyText: "Use the workbook prompts as the investigation path."
    },
    {
      title: "Prove the finding",
      label: `${(lab.expected_evidence?.length ?? 0) + (lab.validation_commands?.length ?? 0)} proof points`,
      icon: CheckCircle2,
      items: compactLabItems([...(lab.expected_evidence ?? []), ...(lab.validation_commands ?? [])]),
      emptyText: "Save worksheet evidence before marking the lab complete."
    },
    {
      title: "Reset or hand off",
      label: `${(lab.cleanup_commands?.length ?? 0) + (lab.no_cluster_fallback?.length ?? 0)} closeout paths`,
      icon: RefreshCcw,
      items: compactLabItems([...(lab.cleanup_commands ?? []), ...(lab.no_cluster_fallback ?? [])]),
      emptyText: "Record cleanup or no-runtime evidence in the workbook."
    }
  ];
}

function LabOperationalBrief({ lab }: { lab: PlatformLab }) {
  const phases = labRunPhases(lab);
  const artifacts = learnerArtifactPaths(lab).map((path) => ({
    path,
    name: labArtifactName(path),
    role: labArtifactRole(path)
  }));
  const visibleArtifacts = artifacts.slice(0, 8);

  return (
    <section className="lab-operational-brief" aria-label="Guided lab run sequence">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Guided lab run sequence</p>
          <h2>Investigate, prove, validate, clean up</h2>
        </div>
        <span>
          {lab.estimated_minutes} min / {lab.validation_checks?.length ?? 0} workbook checks
        </span>
      </div>
      <div className="lab-brief-grid">
        <div className="lab-run-phase-list">
          {phases.map((phase, index) => {
            const PhaseIcon = phase.icon;
            return (
              <article className="lab-run-phase" key={phase.title}>
                <div className="lab-run-phase-index">
                  <PhaseIcon aria-hidden="true" />
                  <span>{index + 1}</span>
                </div>
                <div>
                  <p className="eyebrow">{phase.label}</p>
                  <h3>{phase.title}</h3>
                  {phase.items.length ? (
                    <ul>
                      {phase.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{phase.emptyText}</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="lab-artifact-map-panel" aria-label="Evidence artifact map">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Evidence artifact map</p>
              <h3>Learner-safe files</h3>
            </div>
            <span>{artifacts.length} files</span>
          </div>
          {visibleArtifacts.length ? (
            <div className="lab-artifact-map-grid">
              {visibleArtifacts.map((artifact) => (
                <div className="lab-artifact-map-item" key={artifact.path}>
                  <FileText aria-hidden="true" />
                  <div>
                    <span>{artifact.role}</span>
                    <strong>{artifact.name}</strong>
                    <code>{artifact.path}</code>
                  </div>
                </div>
              ))}
              {artifacts.length > visibleArtifacts.length ? (
                <p className="lab-artifact-map-more">{artifacts.length - visibleArtifacts.length} more files in the learner workspace bundle.</p>
              ) : null}
            </div>
          ) : (
            <p className="lab-artifact-map-empty">No learner artifact paths are advertised for this lab.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function LabContractPanel({ lab }: { lab: PlatformLab }) {
  const artifacts = labContractArtifacts(lab);
  return (
    <section className="lab-contract-panel" aria-label="Learner workspace contract">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Learner workspace contract</p>
          <h3>Guide, evidence, verification, cleanup</h3>
        </div>
        <span>
          {artifacts.filter((artifact) => artifact.path).length} / {artifacts.length} present
        </span>
      </div>
      <div className="lab-contract-grid">
        {artifacts.map((artifact) => (
          <article className={artifact.path ? "lab-contract-item present" : "lab-contract-item missing"} key={artifact.filename}>
            <CheckCircle2 aria-hidden="true" />
            <div>
              <strong>{artifact.label}</strong>
              <code>{artifact.path ?? `${artifact.filename} missing`}</code>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LabWorkspaceQuickstart({ lab }: { lab: PlatformLab }) {
  const clusterCommands = labClusterWorkspaceCommands(lab);
  return (
    <section className="lab-workspace-quickstart" aria-label="Downloaded workspace quickstart">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Downloaded workspace</p>
          <h3>Run from extracted bundle</h3>
        </div>
        <span>{labWorkspaceArchiveName(lab)}</span>
      </div>
      <CommandBlock commands={labWorkspaceQuickstartCommands(lab)} title="Workspace commands" />
      {clusterCommands.length ? <CommandBlock commands={clusterCommands} title="Optional cluster workflow" /> : null}
    </section>
  );
}

function LabWorkbook({ lab, learnerId, onSaveSubmission }: { lab: PlatformLab; learnerId: string; onSaveSubmission: SaveLabSubmission }) {
  const storageKey = `${LAB_WORKBOOK_STATE_PREFIX}${learnerId}:${lab.slug}`;
  const legacyStorageKey = `${LAB_WORKBOOK_STATE_PREFIX}${lab.slug}`;
  const worksheetItems = lab.worksheet_prompts ?? [];
  const validationItems = lab.validation_checks ?? [];
  const trackedItems = [
    ...worksheetItems.map((item, index) => ({ id: `worksheet-${index}`, item, group: "Worksheet" })),
    ...validationItems.map((item, index) => ({ id: `validation-${index}`, item, group: "Validation" })),
  ];
  const checkedItemIds = new Set(trackedItems.map((item) => item.id));
  const worksheetAnswerIds = new Set(worksheetItems.map((_, index) => `worksheet-${index}`));
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [worksheetAnswers, setWorksheetAnswers] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<"loading" | "saved" | "dirty" | "saving" | "local">("loading");
  const [savedScore, setSavedScore] = useState(0);
  const [rubricFeedback, setRubricFeedback] = useState<PlatformLabSubmission["rubric_feedback"]>([]);
  const [evidenceTerms, setEvidenceTerms] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    try {
      const raw = globalThis.localStorage?.getItem(storageKey) ?? globalThis.localStorage?.getItem(legacyStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === "object" && ("checkedItems" in parsed || "worksheetAnswers" in parsed)) {
          const shaped = parsed as { checkedItems?: Record<string, unknown>; worksheetAnswers?: Record<string, unknown> };
          setCheckedItems(sanitizeCheckedItems(shaped.checkedItems, checkedItemIds));
          setWorksheetAnswers(sanitizeWorksheetAnswers(shaped.worksheetAnswers, worksheetAnswerIds));
        } else {
          setCheckedItems(sanitizeCheckedItems(parsed as Record<string, unknown>, checkedItemIds));
        }
      } else {
        setCheckedItems({});
        setWorksheetAnswers({});
      }
    } catch {
      setCheckedItems({});
      setWorksheetAnswers({});
    }

    setSaveState("loading");
    api
      .labSubmission(lab.slug, learnerId)
      .then((submission) => {
        if (cancelled) return;
        setCheckedItems(sanitizeCheckedItems(submission.checked_items, checkedItemIds));
        setWorksheetAnswers(sanitizeWorksheetAnswers(submission.worksheet_answers, worksheetAnswerIds));
        setSavedScore(submission.score);
        setRubricFeedback(submission.rubric_feedback ?? []);
        setEvidenceTerms(submission.evidence_terms ?? []);
        setSaveState("saved");
      })
      .catch(() => {
        if (cancelled) return;
        setSaveState("local");
      });

    return () => {
      cancelled = true;
    };
  }, [lab.slug, learnerId, legacyStorageKey, storageKey]);

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(
        storageKey,
        JSON.stringify({
          checkedItems: sanitizeCheckedItems(checkedItems, checkedItemIds),
          worksheetAnswers: sanitizeWorksheetAnswers(worksheetAnswers, worksheetAnswerIds)
        })
      );
    } catch {
      // Local worksheet state is optional; ignore storage failures.
    }
  }, [checkedItems, storageKey, worksheetAnswers]);

  const completedCount = trackedItems.filter((item) => checkedItems[item.id]).length;
  const answeredCount = worksheetItems.filter((_, index) => worksheetAnswers[`worksheet-${index}`]?.trim()).length;
  const scoreUnits = trackedItems.length + worksheetItems.length;
  const progressValue = scoreUnits ? Math.round(((completedCount + answeredCount) / scoreUnits) * 100) : 0;
  const rubricStatusCounts = rubricStatusOrder
    .map((status) => ({
      status,
      count: rubricFeedback.filter((item) => item.status === status).length
    }))
    .filter((item) => item.count > 0);
  const unexpectedRubricStatusCounts = Array.from(
    rubricFeedback.reduce((statuses, item) => {
      if (!rubricStatusOrder.includes(item.status)) statuses.add(item.status);
      return statuses;
    }, new Set<string>())
  ).map((status) => ({
    status,
    count: rubricFeedback.filter((item) => item.status === status).length
  }));
  const rubricNeedsAttention = rubricFeedback.filter((item) => item.status === "missing" || item.status === "needs-evidence").length;
  const markDirty = () => setSaveState((current) => (current === "loading" || current === "saving" ? current : "dirty"));
  const toggleItem = (id: string) => {
    setCheckedItems((current) => ({ ...current, [id]: !current[id] }));
    markDirty();
  };
  const updateWorksheetAnswer = (id: string, value: string) => {
    setWorksheetAnswers((current) => ({ ...current, [id]: value }));
    markDirty();
  };
  const saveWorkbook = async () => {
    setSaveState("saving");
    const cleanCheckedItems = sanitizeCheckedItems(checkedItems, checkedItemIds);
    const cleanWorksheetAnswers = sanitizeWorksheetAnswers(worksheetAnswers, worksheetAnswerIds);
    setCheckedItems(cleanCheckedItems);
    setWorksheetAnswers(cleanWorksheetAnswers);
    try {
      const saved = await onSaveSubmission(
        lab.slug,
        {
          checked_items: cleanCheckedItems,
          worksheet_answers: cleanWorksheetAnswers,
          status: progressValue === 100 ? "submitted" : "in_progress"
        }
      );
      setSavedScore(saved.score);
      setRubricFeedback(saved.rubric_feedback ?? []);
      setEvidenceTerms(saved.evidence_terms ?? []);
      setSaveState("saved");
    } catch {
      setSaveState("local");
    }
  };
  return (
    <section className="lab-workbook-panel" aria-labelledby="lab-workbook-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Interactive lab workbook</p>
          <h2 id="lab-workbook-title">Worksheet and validation state</h2>
        </div>
        <div className="lab-download-actions">
          <a className="download-lab-button" download={`${lab.slug}-lab-packet.md`} href={api.labPacketUrl(lab.slug)}>
            <Download aria-hidden="true" />
            Download lab packet
          </a>
          <a className="download-lab-button" download={labWorkspaceArchiveName(lab)} href={api.labWorkspaceBundleUrl(lab.slug)}>
            <Download aria-hidden="true" />
            Download learner workspace
          </a>
          <button className="download-lab-button" disabled={saveState === "loading" || saveState === "saving"} type="button" onClick={() => void saveWorkbook()}>
            <CheckCircle2 aria-hidden="true" />
            {saveState === "saving" ? "Saving..." : "Save workbook"}
          </button>
        </div>
      </div>
      <div className="lab-workbook-progress">
        <span>
          {completedCount} / {trackedItems.length} checks complete · {answeredCount} / {worksheetItems.length} prompts answered · score {saveState === "saved" ? savedScore : progressValue}%
        </span>
        <ProgressBar value={progressValue} />
        <small className="lab-save-state">
          {saveState === "loading" && "Loading saved workbook"}
          {saveState === "saved" && "Saved to profile"}
          {saveState === "dirty" && "Unsaved changes"}
          {saveState === "saving" && "Saving workbook"}
          {saveState === "local" && "Stored in this browser until API save succeeds"}
        </small>
      </div>
      <div className="lab-workbook-grid">
        <section>
          <h3>Worksheet prompts</h3>
          {worksheetItems.map((item, index) => {
            const id = `worksheet-${index}`;
            return (
              <div className="lab-worksheet-answer" key={item}>
                <label className="lab-check-row">
                  <input checked={Boolean(checkedItems[id])} onChange={() => toggleItem(id)} type="checkbox" />
                  <span>{item}</span>
                </label>
                <textarea
                  aria-label={`Evidence note: ${item}`}
                  onChange={(event) => updateWorksheetAnswer(id, event.target.value)}
                  rows={3}
                  value={worksheetAnswers[id] ?? ""}
                />
              </div>
            );
          })}
        </section>
        <section>
          <h3>Validation checks</h3>
          {validationItems.map((item, index) => {
            const id = `validation-${index}`;
            return (
              <label className="lab-check-row" key={item}>
                <input checked={Boolean(checkedItems[id])} onChange={() => toggleItem(id)} type="checkbox" />
                <span>{item}</span>
              </label>
            );
          })}
        </section>
      </div>
      <LabWorkspaceQuickstart lab={lab} />
      <LabContractPanel lab={lab} />
      {learnerArtifactPaths(lab).length ? (
        <div className="lab-artifact-list" aria-label="Learner artifact paths">
          {learnerArtifactPaths(lab).map((path) => (
            <code key={path}>{path}</code>
          ))}
        </div>
      ) : null}
      <section className="lab-rubric-feedback">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Rubric feedback</p>
            <h3>Evidence quality</h3>
          </div>
          {rubricFeedback.length ? (
            <div className="lab-feedback-summary" aria-label="Rubric status summary">
              {[...rubricStatusCounts, ...unexpectedRubricStatusCounts].map(({ status, count }) => (
                <span className={`lab-feedback-summary-${status.replace(/[^a-z0-9]+/g, "-")}`} key={status}>
                  {count} {rubricStatusLabels[status] ?? status}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {rubricFeedback.length ? (
          <div className="lab-feedback-overview">
            <span>{rubricNeedsAttention ? `${rubricNeedsAttention} criteria need stronger evidence` : "All rubric criteria have passing evidence"}</span>
            {evidenceTerms.length ? <span>Matched: {evidenceTerms.slice(0, 6).join(" / ")}</span> : <span>No matched evidence terms yet</span>}
          </div>
        ) : null}
        {rubricFeedback.length ? (
          <div className="lab-feedback-grid">
            {rubricFeedback.map((item, index) => (
              <article className={`lab-feedback-card feedback-${item.status}`} key={item.criterion}>
                <div className="lab-feedback-card-header">
                  <span>Criterion {index + 1}</span>
                  <strong>{rubricStatusLabels[item.status] ?? item.status}</strong>
                </div>
                <p>{item.criterion}</p>
                <small>{item.feedback}</small>
                {item.status === "missing" || item.status === "needs-evidence" ? (
                  <em className="lab-feedback-next">
                    {worksheetItems[index] ? `Update worksheet prompt ${index + 1}` : "Add validation or cleanup evidence"}
                  </em>
                ) : null}
                {item.evidence_terms.length ? (
                  <div className="lab-feedback-terms">
                    <span>Matched evidence</span>
                    {item.evidence_terms.map((term) => (
                      <code key={term}>{term}</code>
                    ))}
                  </div>
                ) : (
                  <div className="lab-feedback-terms empty">
                    <span>No matching evidence yet</span>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <LabListSection items={lab.rubric} title="Rubric" />
        )}
      </section>
    </section>
  );
}

type AppShellProps = {
  children: React.ReactNode;
  learnerId: string;
  onResetLearner: () => void;
  onRecoverLearner: (learnerId: string) => void;
};

function AppShell({ children, learnerId, onResetLearner, onRecoverLearner }: AppShellProps) {
  const location = useLocation();
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryStatus, setRecoveryStatus] = useState("");
  const [recoveryCopied, setRecoveryCopied] = useState(false);

  const openRecovery = () => {
    setRecoveryInput("");
    setRecoveryError("");
    setRecoveryStatus("");
    setRecoveryCopied(false);
    setIsRecoveryOpen(true);
  };

  const closeRecovery = () => {
    setIsRecoveryOpen(false);
    setRecoveryError("");
    setRecoveryStatus("");
  };

  const copyRecoveryKey = async () => {
    try {
      await navigator.clipboard?.writeText(learnerId);
      setRecoveryCopied(true);
    } catch {
      setRecoveryError("Copy is blocked by this browser. Select and copy the key manually.");
    }
  };

  const downloadLearnerBackup = async () => {
    setRecoveryError("");
    setRecoveryStatus("");
    try {
      const state = await api.exportLearnerState(learnerId);
      const backupState: PlatformLearnerStateExport = {
        ...state,
        interview_study_plans: readInterviewStudyPlans()
      };
      const blob = new Blob([JSON.stringify(backupState, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `platform-academy-${learnerId}-state.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setRecoveryStatus("Exported profile backup.");
    } catch {
      setRecoveryError("Profile export failed. Check the API connection and try again.");
    }
  };

  const importLearnerBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setRecoveryError("");
    setRecoveryStatus("");
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const validationError = learnerBackupValidationError(parsed);
      if (validationError) {
        setRecoveryError(validationError);
        return;
      }
      const state = parsed as PlatformLearnerStateExport;
      const { interview_study_plans: importedStudyPlans, ...apiState } = state;
      const result = await api.importLearnerState(apiState, learnerId);
      const importedStudyPlanCount = importedStudyPlans?.length ?? 0;
      if (importedStudyPlans) {
        writeInterviewStudyPlans(
          importedStudyPlans.map((plan) => ({
            ...plan,
            name: plan.name.trim() || "Interview study plan",
            questionIds: uniqueStrings(plan.questionIds)
          }))
        );
        window.dispatchEvent(new Event(STUDY_PLANS_RESTORED_EVENT));
      }
      setRecoveryStatus(
        `Imported ${result.progress_imported} lessons, ${result.activity_imported} activity rows, ${result.lab_submissions_imported} lab workbooks, and ${importedStudyPlanCount} interview study ${importedStudyPlanCount === 1 ? "plan" : "plans"}.`
      );
      onRecoverLearner(learnerId);
    } catch {
      setRecoveryError("Profile import failed. Use an exported Platform Academy JSON backup.");
    }
  };

  const restoreRecoveryProfile = () => {
    const restoredLearnerId = restoreLocalLearnerId(recoveryInput);
    if (!restoredLearnerId) {
      setRecoveryError("Enter a valid guest recovery key.");
      return;
    }
    onRecoverLearner(restoredLearnerId);
    closeRecovery();
  };

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
                  <span>{item.label}</span>
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
                <span className="learner-profile-label">Guest workspace</span>
                <strong>{learnerId}</strong>
                <span>Browser-local progress</span>
              </div>
              <div className="learner-profile-actions">
                <button
                  aria-label="Open guest recovery key"
                  className="learner-recovery-button"
                  onClick={openRecovery}
                  title="Copy this guest recovery key or restore a saved guest workspace."
                  type="button"
                >
                  <Copy aria-hidden="true" />
                  Recovery key
                </button>
                <button
                  aria-label="Start a new local guest workspace"
                  className="learner-reset-button"
                  onClick={onResetLearner}
                  title="Switch this browser to a fresh local progress profile. Existing backend progress remains stored under the old guest id."
                  type="button"
                >
                  <RefreshCcw aria-hidden="true" />
                  New profile
                </button>
              </div>
            </div>
            <div className="topline-actions">
              <Link aria-label="Open lab queue" to="/labs">
                <Terminal aria-hidden="true" />
                <span>Lab queue</span>
              </Link>
              <Link aria-label="Open resource index" to="/resources">
                <Search aria-hidden="true" />
                <span>Resource index</span>
              </Link>
            </div>
          </header>
          <main>{children}</main>
        </div>
        {isRecoveryOpen && (
          <div className="profile-recovery-backdrop" onClick={closeRecovery}>
            <section
              aria-labelledby="profile-recovery-title"
              aria-modal="true"
              className="profile-recovery-dialog"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className="recovery-dialog-header">
                <div>
                  <p className="eyebrow">Guest recovery</p>
                  <h2 id="profile-recovery-title">Save or restore progress</h2>
                </div>
                <button className="recovery-close-button" onClick={closeRecovery} type="button">
                  Close
                </button>
              </div>
              <p className="recovery-helper">Save this key outside the browser to recover progress after clearing browser data.</p>
              <div className="recovery-key-card">
                <span>Current recovery key</span>
                <strong>{learnerId}</strong>
                <button className={recoveryCopied ? "copy-command-button copied" : "copy-command-button"} onClick={copyRecoveryKey} type="button">
                  {recoveryCopied ? <CheckCircle2 aria-hidden="true" /> : <Copy aria-hidden="true" />}
                  {recoveryCopied ? "Copied key" : "Copy key"}
                </button>
              </div>
              <div className="recovery-backup-actions">
                <div>
                  <span>Portable backup</span>
                  <p>Export or import this guest profile's lesson progress, saved activity, lab workbooks, and interview study plans.</p>
                </div>
                <div>
                  <button onClick={() => void downloadLearnerBackup()} type="button">
                    <Download aria-hidden="true" />
                    Export JSON
                  </button>
                  <label>
                    <FileText aria-hidden="true" />
                    Import JSON
                    <input accept="application/json" onChange={(event) => void importLearnerBackup(event)} type="file" />
                  </label>
                </div>
              </div>
              <form
                className="recovery-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  restoreRecoveryProfile();
                }}
              >
                <label htmlFor="guest-recovery-key">Restore saved key</label>
                <div>
                  <input
                    id="guest-recovery-key"
                    onChange={(event) => {
                      setRecoveryInput(event.target.value);
                      setRecoveryError("");
                    }}
                    placeholder="guest-abc123def456"
                    value={recoveryInput}
                  />
                  <button type="submit">Restore profile</button>
                </div>
                {recoveryError && <p role="alert">{recoveryError}</p>}
                {recoveryStatus && (
                  <p className="recovery-status" role="status">
                    {recoveryStatus}
                  </p>
                )}
              </form>
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="academy-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <GraduationCap aria-hidden="true" />
          <div>
            <strong>Platform Academy</strong>
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
  const featuredResource = data.resourcesLoaded
    ? upcomingLab
      ? resourcesForLab(data, upcomingLab)[0] ?? data.resources.resources[0]
      : data.resources.resources[0]
    : undefined;
  const platformLessonIds = useMemo(() => new Set(stats.lessons.map((lesson) => lesson.id)), [stats.lessons]);
  const latestProgress = latestCompletedProgress(data, platformLessonIds);
  const latestLesson = latestProgress ? stats.lessons.find((lesson) => lesson.id === latestProgress.lesson_id) : undefined;
  const latestCourse = latestLesson ? courseForLesson(data, latestLesson.id) : undefined;
  const latestSavedAt = latestProgress
    ? new Date(latestProgress.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : undefined;
  const featuredInterviewPack = data.interviewPrepLoaded
    ? data.interviewPrep.packs.find((pack) => pack.level_group === "Intermediate") ?? data.interviewPrep.packs[0]
    : undefined;
  const practicedQuestions = completedActivityIds(data.activity, "interview_question").size;
  const reviewedResources = completedActivityIds(data.activity, "resource").size;
  const completedLabs = completedActivityIds(data.activity, "lab").size;
  const activeLabSubmissions = data.labSubmissions.filter((submission) => submission.score > 0 || submission.completed_checks > 0 || submission.answered_prompts > 0);
  const strongLabSubmissions = activeLabSubmissions.filter((submission) => submission.rubric_feedback.some((item) => item.status === "strong")).length;
  const earnedAchievements = data.dashboard.achievements.filter((achievement) => achievement.earned);
  const nextAchievement = data.dashboard.achievements.find((achievement) => !achievement.earned);

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
          <p className="eyebrow">Platform learning workspace</p>
          <h1>Platform Academy</h1>
          <p className="lead">{data.catalog.promise}</p>
        </div>
        <div className="workspace-actions">
          {stats.recommended && (
            <Link className="primary-action" to={lessonPathForId(data, stats.recommended.id)}>
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
          <span>Progress</span>
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
          <small>
            {activeLabSubmissions.length} active workbooks / {averageLabMinutes(data.catalog.labs)} min average
          </small>
        </article>
        <article>
          <span>Lab evidence</span>
          <strong>{strongLabSubmissions}</strong>
          <small>{activeLabSubmissions.length} workbook submissions in progress</small>
        </article>
        <article>
          <span>Due review</span>
          <strong>{data.dashboard.due_reviews}</strong>
          <small>{data.dashboard.daily_goal.earned_xp_today} / {data.dashboard.daily_goal.target_xp} XP today</small>
        </article>
          {data.interviewPrepLoaded && (
            <article>
              <span>Interview bank</span>
              <strong>{data.interviewPrep.total_questions}</strong>
              <small>
                {practicedQuestions} practiced / {data.interviewPrep.packs.length} packs
              </small>
            </article>
          )}
      </section>

      <section className="dashboard-layout">
        <div className="dashboard-main">
          <section className="workspace-panel next-work">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Next up</p>
                <h2>{stats.recommended?.title ?? "Select a lesson"}</h2>
              </div>
              {stats.recommended && (
                <Link className="text-link" to={lessonPathForId(data, stats.recommended.id)}>
                  Open lesson <ArrowRight aria-hidden="true" />
                </Link>
              )}
            </div>
            <div className="resume-status">
              <CheckCircle2 aria-hidden="true" />
              <div>
                <span>Saved progress</span>
                <strong>
                  {latestLesson && latestCourse ? `${latestCourse.title}: ${latestLesson.title}` : "New guest profile ready"}
                </strong>
                <p>
                  {latestLesson && latestSavedAt
                    ? `Last saved ${latestSavedAt}. Pick up with the next incomplete lesson.`
                    : "Progress is saved for this browser profile until you start a new one."}
                </p>
              </div>
            </div>
            <div className="next-work-grid">
              <div>
                <span>Course</span>
                <strong>{recommendedCourse?.title ?? "No course selected"}</strong>
                <p>{recommendedCourse?.description ?? "No lessons are available yet."}</p>
              </div>
              {upcomingLab && (
                <div>
                  <span>Lab</span>
                  <strong>{upcomingLab.title}</strong>
                  <p>{upcomingLab.scenario}</p>
                </div>
              )}
              {featuredResource && (
                <div>
                  <span>Reference</span>
                  <strong>{featuredResource.title}</strong>
                  <p>{featuredResource.summary}</p>
                </div>
              )}
            </div>
          </section>

          <section className="workspace-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Course list</p>
                <h2>Courses by level</h2>
              </div>
              <span>
                {filteredCourses.length} of {courses.length} visible
              </span>
            </div>
            <section className="toolbar canonical-toolbar course-filter-toolbar" aria-label="Course filters">
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
              <label className="filter-select course-topic-select">
                <span>Topic</span>
                <select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)}>
                  {["All", ...topics].map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </label>
            </section>
            <div className="course-table" aria-label="Platform Academy courses">
              {filteredCourses.map((course) => {
                const progress = courseProgress(course, stats.completed);
                const track = data.catalog.tracks.find((item) => item.course.slug === course.slug);
                return (
                  <Link className="course-row" to={coursePath(course)} key={course.id}>
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
          <section className="workspace-panel level-readiness">
            <p className="eyebrow">Level coverage</p>
            {data.catalog.levels.map((level) => (
              <div key={level.slug}>
                <strong>{level.title}</strong>
                <span>
                  {level.total_courses} courses / {level.total_lessons} lessons
                </span>
              </div>
            ))}
          </section>

          <section className="workspace-panel activity-rail-card">
            <p className="eyebrow">Saved practice</p>
            <h2>Saved learning state</h2>
            <div>
              <Link to="/interview-prep">
                <span>Interview questions</span>
                <strong>
                  {practicedQuestions}
                  {data.interviewPrepLoaded ? ` / ${data.interviewPrep.total_questions}` : ""}
                </strong>
              </Link>
              <Link to="/resources">
                <span>Resources reviewed</span>
                <strong>
                  {reviewedResources}
                  {data.resourcesLoaded ? ` / ${data.resources.resources.length}` : ""}
                </strong>
              </Link>
              <Link to="/labs">
                <span>Labs run</span>
                <strong>
                  {completedLabs} / {data.catalog.labs.length}
                </strong>
              </Link>
            </div>
          </section>

          <section className="workspace-panel achievement-rail-card">
            <p className="eyebrow">Platform badges</p>
            <h2>Skill signals</h2>
            {earnedAchievements.length ? (
              <div className="achievement-list">
                {earnedAchievements.slice(0, 4).map((achievement) => (
                  <div className="achievement-row earned" key={achievement.code}>
                    <CheckCircle2 aria-hidden="true" />
                    <div>
                      <strong>{achievement.title}</strong>
                      <span>{achievement.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="achievement-empty">Earn badges by completing lessons, saving resources, practicing interviews, and submitting labs.</p>
            )}
            {nextAchievement && (
              <div className="achievement-next">
                <span>Next badge</span>
                <strong>{nextAchievement.title}</strong>
                <ProgressBar value={Math.round((nextAchievement.progress / nextAchievement.target) * 100)} />
                <small>
                  {nextAchievement.progress} / {nextAchievement.target} signals
                </small>
              </div>
            )}
          </section>

          {featuredInterviewPack && (
            <section className="workspace-panel interview-rail-card">
              <p className="eyebrow">Interview sprint</p>
              <h2>{featuredInterviewPack.title}</h2>
              <p>{featuredInterviewPack.focus}</p>
              <div className="chip-list">
                <span>{featuredInterviewPack.questions.length} questions</span>
                <span>{featuredInterviewPack.official_sources.length} source links</span>
              </div>
              <Link className="text-link" to={`/interview-prep?pack=${featuredInterviewPack.slug}`}>
                Open prep <ArrowRight aria-hidden="true" />
              </Link>
            </section>
          )}

          <section className="workspace-panel readiness-panel">
            <p className="eyebrow">Learning checks</p>
            <h2>What gets counted</h2>
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
              <strong>Sources</strong>
              <p>Resource pages include official links and reviewed dates when available. Course and lesson pages currently rely on the local catalog.</p>
            </div>
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
          <h1>Roadmap from kubectl basics to running platforms</h1>
          <p className="lead">Each stage groups lessons, checkpoints, and labs so you know what to practice next.</p>
        </div>
        <div className="readiness-score">
          <span>Current progress</span>
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
                  <h3>Checkpoints</h3>
                  <ul>
                    {stage.checkpoints.map((checkpoint) => (
                      <li key={checkpoint}>{checkpoint}</li>
                    ))}
                  </ul>
                  <div className="stage-courses">
                    {courses.map((course) => (
                      <Link to={coursePath(course)} key={course.id}>
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
            <p className="eyebrow">Sources</p>
            <h2>What this roadmap uses</h2>
            <p>Roadmap stages are built from the app's courses, labs, checkpoints, and resources. Resource pages include official links and reviewed dates where available.</p>
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Level summary</p>
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
  const [selectedTier, setSelectedTier] = useState<"All" | PlatformLab["lab_tier"]>("All");
  const [selectedScope, setSelectedScope] = useState<LabScopeFilter>("All");
  const [selectedRuntime, setSelectedRuntime] = useState<LabRuntimeFilter>("All");
  const completedLabs = completedActivityIds(data.activity, "lab");
  const fullLabCount = data.catalog.labs.filter((lab) => lab.lab_tier === "full").length;
  const portfolioLabCount = data.catalog.labs.filter(isPortfolioLab).length;
  const clusterLabCount = data.catalog.labs.filter(isClusterRunnableLab).length;
  const activeSubmissionCount = data.labSubmissions.filter((submission) => submission.score > 0 || submission.completed_checks > 0 || submission.answered_prompts > 0).length;
  const tierOptions = labTierFilterOptions(data.catalog.labs);
  const filteredLabs = data.catalog.labs.filter(
    (lab) =>
      (selectedScope === "All" || isPortfolioLab(lab)) &&
      (selectedRuntime === "All" || (selectedRuntime === "Cluster" ? isClusterRunnableLab(lab) : !isClusterRunnableLab(lab))) &&
      (selectedLevel === "All" || lab.level_group === selectedLevel) &&
      (selectedTopic === "All" || lab.track === selectedTopic) &&
      (selectedTier === "All" || lab.lab_tier === selectedTier)
  );
  const activeLab = filteredLabs[0];
  const activeResource = activeLab ? resourcesForLab(data, activeLab)[0] : undefined;
  const activeSubmission = activeLab ? labSubmissionFor(data, activeLab.slug) : undefined;
  const activeSubmissionSummary = labSubmissionSummary(activeSubmission);
  const inventoryDetail = labInventorySummary(activeSubmissionCount, fullLabCount, data.catalog.labs.length);
  const inventorySummary = [
    clusterLabCount > 0 ? `${clusterLabCount} cluster-ready` : "",
    portfolioLabCount > 0 ? `${portfolioLabCount} portfolio-grade` : "",
    inventoryDetail
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <section className="page canonical-page labs-page">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Lab workspace</p>
          <h1>Labs for incidents and architecture reviews</h1>
          <p className="lead">Practice short scenarios with commands and checks you can run locally before marking a lesson complete.</p>
        </div>
        <div className="workspace-actions">
          <Link className="secondary-action" to="/labs/history">
            <FileText aria-hidden="true" />
            Evidence journal
          </Link>
          <div className="readiness-score">
            <span>Lab inventory</span>
            <strong>{filteredLabs.length}</strong>
            <small>{inventorySummary}</small>
          </div>
        </div>
      </header>

      <section className="toolbar compact canonical-toolbar" aria-label="Lab filters">
        {portfolioLabCount > 0 ? (
          <div className="segmented lab-scope-filter">
            {(Object.keys(labScopeLabels) as LabScopeFilter[]).map((scope) => (
              <button key={scope} className={selectedScope === scope ? "selected" : ""} onClick={() => setSelectedScope(scope)}>
                {labScopeLabels[scope]}
              </button>
            ))}
          </div>
        ) : null}
        {clusterLabCount > 0 ? (
          <div className="segmented lab-runtime-filter">
            {(Object.keys(labRuntimeLabels) as LabRuntimeFilter[]).map((runtime) => (
              <button key={runtime} className={selectedRuntime === runtime ? "selected" : ""} onClick={() => setSelectedRuntime(runtime)}>
                {labRuntimeLabels[runtime]}
              </button>
            ))}
          </div>
        ) : null}
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
        {tierOptions.length > 0 ? (
          <div className="segmented lab-tier-filter">
            {tierOptions.map((tier) => (
              <button key={tier} className={selectedTier === tier ? "selected" : ""} onClick={() => setSelectedTier(tier)}>
                {tier === "All" ? "All tiers" : labTierLabels[tier]}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="lab-workspace">
        <aside className="lab-queue" aria-label="Platform labs">
          {filteredLabs.map((lab) => (
            <LabCard completed={completedLabs.has(lab.slug)} lab={lab} key={lab.slug} submission={labSubmissionFor(data, lab.slug)} />
          ))}
        </aside>

        <section className="runbook-workspace">
          {activeLab ? (
            <>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Selected lab</p>
                  <h2>{activeLab.title}</h2>
                </div>
                <Link className="text-link" to={`/labs/${activeLab.slug}`}>
                  Open detail <ArrowRight aria-hidden="true" />
                </Link>
              </div>
              <p>{activeLab.scenario}</p>
              <div className="runbook-meta">
                <LevelBadge level={activeLab.level_group} />
                <LabTierBadge tier={activeLab.lab_tier} />
                <PortfolioLabBadge lab={activeLab} />
                <LabRuntimeBadge lab={activeLab} />
                <LabSubmissionBadge submission={activeSubmission} />
                <span>{activeLab.track}</span>
                <span>{activeLab.estimated_minutes} min</span>
                <span>{activeLab.difficulty}</span>
              </div>
              {isPortfolioLab(activeLab) ? (
                <div className="portfolio-lab-callout">
                  <strong>Structurally verified lab</strong>
                  <span>Broken and fixed artifacts are parsed in the release gate, including YAML or JSON contracts where this lab uses them.</span>
                </div>
              ) : null}
              {activeSubmission ? (
                <div className="lab-submission-summary">
                  <strong>{activeSubmissionSummary.label}</strong>
                  <span>{Math.round(activeSubmission.score)}% workbook score</span>
                  <span>
                    {activeSubmission.answered_prompts} prompts / {activeSubmission.completed_checks} checks
                  </span>
                </div>
              ) : null}
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
                  <h3>What to save</h3>
                  <p>{activeResource?.artifacts.slice(0, 2).join(" / ") ?? "No related resource is linked to this lab."}</p>
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

function LabEvidenceJournalPage({ data }: { data: AcademyData }) {
  const submissions = sortedLabSubmissions(data.labSubmissions.filter(hasLabSubmissionEvidence));
  const strongSignals = submissions.reduce((total, submission) => total + submission.rubric_feedback.filter((item) => item.status === "strong").length, 0);
  const averageScore = submissions.length > 0 ? Math.round(submissions.reduce((total, submission) => total + submission.score, 0) / submissions.length) : 0;
  const evidenceTerms = Array.from(new Set(submissions.flatMap((submission) => submission.evidence_terms))).slice(0, 18);

  const downloadReport = () => {
    const blob = new Blob([submissionReportMarkdown(data, submissions)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "platform-academy-lab-evidence.md";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="page canonical-page lab-evidence-page">
      <Link className="back-link" to="/labs">
        <ChevronLeft aria-hidden="true" />
        Labs
      </Link>
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Lab evidence journal</p>
          <h1>Saved workbooks and rubric signals</h1>
          <p className="lead">Review the lab evidence already attached to this guest profile and export it as a short portfolio note.</p>
        </div>
        <div className="readiness-score">
          <span>Saved labs</span>
          <strong>{submissions.length}</strong>
          <small>
            {averageScore}% average / {strongSignals} strong signals
          </small>
        </div>
      </header>

      <section className="lab-evidence-actions" aria-label="Lab evidence actions">
        <Link className="secondary-action" to="/labs">
          <Terminal aria-hidden="true" />
          Lab queue
        </Link>
        <button className="secondary-action" disabled={submissions.length === 0} onClick={downloadReport} type="button">
          <Download aria-hidden="true" />
          Download report
        </button>
      </section>

      {evidenceTerms.length > 0 ? (
        <section className="lab-evidence-term-strip" aria-label="Evidence terms">
          {evidenceTerms.map((term) => (
            <code key={term}>{term}</code>
          ))}
        </section>
      ) : null}

      {submissions.length > 0 ? (
        <section className="lab-evidence-list" aria-label="Saved lab submissions">
          {submissions.map((submission) => {
            const lab = labForSlug(data, submission.lab_slug);
            const summary = labSubmissionSummary(submission);
            const statusCounts = orderedRubricStatusEntries(labRubricStatusCounts(submission));
            return (
              <article className="lab-evidence-card" key={submission.lab_slug}>
                <div className="lab-evidence-card-header">
                  <div>
                    <div className="runbook-meta">
                      {lab ? <LevelBadge level={lab.level_group} /> : null}
                      {lab ? <LabTierBadge tier={lab.lab_tier} /> : null}
                      {lab ? <PortfolioLabBadge lab={lab} /> : null}
                      <LabSubmissionBadge submission={submission} />
                      <span>Updated {labSubmissionUpdatedTime(submission)}</span>
                    </div>
                    <h2>{lab?.title ?? submission.lab_slug}</h2>
                    <p>{lab?.scenario ?? "This saved workbook references a lab that is not in the current catalog."}</p>
                  </div>
                  <Link className="text-link" to={`/labs/${submission.lab_slug}`}>
                    Open lab <ArrowRight aria-hidden="true" />
                  </Link>
                </div>

                <dl className="lab-evidence-metrics">
                  <div>
                    <dt>Score</dt>
                    <dd>{Math.round(submission.score)}%</dd>
                  </div>
                  <div>
                    <dt>Prompts</dt>
                    <dd>
                      {submission.answered_prompts}/{submission.total_prompts}
                    </dd>
                  </div>
                  <div>
                    <dt>Checks</dt>
                    <dd>
                      {submission.completed_checks}/{submission.total_checks}
                    </dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{summary.label}</dd>
                  </div>
                </dl>

                {statusCounts.length > 0 ? (
                  <div className="lab-evidence-rubric" aria-label={`${lab?.title ?? submission.lab_slug} rubric status`}>
                    {statusCounts.map(([status, count]) => (
                      <span className={`lab-evidence-rubric-${status.replace(/[^a-z0-9]+/g, "-")}`} key={status}>
                        {rubricStatusLabels[status] ?? status}: {count}
                      </span>
                    ))}
                  </div>
                ) : null}

                {submission.evidence_terms.length > 0 ? (
                  <div className="lab-evidence-terms">
                    {submission.evidence_terms.map((term) => (
                      <code key={term}>{term}</code>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState title="No lab evidence saved yet." detail="Run a lab workbook and save it to build this journal." />
      )}
    </section>
  );
}

function LabSubmissionBadge({ submission }: { submission?: PlatformLabSubmission }) {
  const summary = labSubmissionSummary(submission);
  return (
    <span className={`lab-submission-badge lab-submission-${summary.className}`}>
      {summary.label}
      {submission && summary.score > 0 ? ` · ${Math.round(summary.score)}%` : ""}
    </span>
  );
}

function LabCard({ lab, completed, submission }: { lab: PlatformLab; completed: boolean; submission?: PlatformLabSubmission }) {
  return (
    <Link className="lab-card lab-queue-row" to={`/labs/${lab.slug}`}>
      <div className="lab-meta">
        <LevelBadge level={lab.level_group} />
        <LabTierBadge tier={lab.lab_tier} />
        <PortfolioLabBadge lab={lab} />
        <LabRuntimeBadge lab={lab} />
        <LabSubmissionBadge submission={submission} />
        <span>
          <Clock aria-hidden="true" />
          {lab.estimated_minutes} min
        </span>
        {completed && <span>saved</span>}
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

function officialSourcesForResource(resource: PlatformResource) {
  if (resource.official_sources?.length) return resource.official_sources;
  if (resource.source_url) return [{ label: resource.source_label ?? "Official source", url: resource.source_url }];
  return [];
}

function textTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 3);
}

function matchingOfficialSources(question: PlatformInterviewPrep["questions"][number], sources: PlatformInterviewPrep["official_sources"]) {
  const text = `${question.question} ${question.scenario} ${question.answer_outline.join(" ")} ${question.practice_task}`.toLowerCase();
  const matches = sources.filter((source) => textTokens(source.label).some((token) => text.includes(token)));
  return (matches.length > 0 ? matches : sources.slice(0, 1)).slice(0, 2);
}

function matchingQuestionLabs(question: PlatformInterviewPrep["questions"][number], labs: PlatformLab[]) {
  const text = `${question.question} ${question.scenario} ${question.answer_outline.join(" ")} ${question.practice_task}`.toLowerCase();
  const matches = labs.filter((lab) => {
    const searchable = `${lab.slug} ${lab.title} ${lab.scenario} ${lab.skills.join(" ")} ${lab.checklist.join(" ")} ${lab.commands.join(" ")}`.toLowerCase();
    return textTokens(searchable).some((token) => text.includes(token));
  });
  return (matches.length > 0 ? matches : question.practice_task.toLowerCase().includes("lab") ? labs : []).slice(0, 2);
}

function preferredQuestionResourceType(question: PlatformInterviewPrep["questions"][number]) {
  const text = `${question.question} ${question.scenario} ${question.answer_outline.join(" ")} ${question.practice_task}`.toLowerCase();
  if (text.includes("runbook") || text.includes("restart") || text.includes("incident")) return "runbook";
  if (text.includes("review") || text.includes("criteria") || text.includes("launch")) return "production readiness checklist";
  if (text.includes("checklist") || text.includes("triage") || text.includes("diagnosis") || text.includes("evidence")) return "troubleshooting guide";
  if (text.includes("template")) return "template";
  if (text.includes("security") || text.includes("permission") || text.includes("rbac") || text.includes("iam")) return "security review";
  if (text.includes("cost") || text.includes("capacity")) return "cost review";
  return "interview prep";
}

function matchingQuestionResources(question: PlatformInterviewPrep["questions"][number], pack: PlatformInterviewPrep, data: AcademyData) {
  const preferredType = preferredQuestionResourceType(question);
  const sameDomain = data.resources.resources.filter((resource) => resource.domain === pack.domain);
  const preferred = sameDomain.find((resource) => resource.resource_type === preferredType);
  const officialReference = sameDomain.find((resource) => resource.resource_type === "official reference");
  const linkedResources = [preferred, officialReference].filter((resource): resource is PlatformResource => Boolean(resource));
  return Array.from(new globalThis.Map<string, PlatformResource>(linkedResources.map((resource) => [resource.slug, resource])).values());
}

function markdownList(items: string[]) {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None listed.";
}

function fileSafeSlug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "platform-academy"
  );
}

type InterviewStudyPlan = PlatformInterviewStudyPlan;

const INTERVIEW_STUDY_PLAN_STORAGE_KEY = "platform-academy-interview-study-plans-v1";

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function readInterviewStudyPlans(): InterviewStudyPlan[] {
  try {
    const raw = globalThis.localStorage?.getItem(INTERVIEW_STUDY_PLAN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        const plan = item as Partial<InterviewStudyPlan>;
        const questionIds = Array.isArray(plan.questionIds) ? plan.questionIds.filter((questionId): questionId is string => typeof questionId === "string") : [];
        if (typeof plan.id !== "string" || typeof plan.name !== "string") return null;
        return {
          id: plan.id,
          name: plan.name.trim() || "Interview study plan",
          questionIds: uniqueStrings(questionIds),
          createdAt: typeof plan.createdAt === "string" ? plan.createdAt : new Date().toISOString(),
          updatedAt: typeof plan.updatedAt === "string" ? plan.updatedAt : new Date().toISOString()
        };
      })
      .filter((plan): plan is InterviewStudyPlan => Boolean(plan))
      .slice(0, 25);
  } catch {
    return [];
  }
}

function writeInterviewStudyPlans(plans: InterviewStudyPlan[]) {
  try {
    globalThis.localStorage?.setItem(INTERVIEW_STUDY_PLAN_STORAGE_KEY, JSON.stringify(plans));
  } catch {
    // Local storage can be unavailable in private browsing modes.
  }
}

function makeInterviewStudyPlanId() {
  return `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function downloadMarkdownFile(filename: string, markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function courseForInterviewPack(data: AcademyData, pack: PlatformInterviewPrep) {
  return allCourses(data.catalog).find((course) => course.slug === pack.related_course_slug);
}

function labsForInterviewPack(data: AcademyData, pack: PlatformInterviewPrep) {
  return data.catalog.labs.filter((lab) => pack.related_labs.includes(lab.slug));
}

function interviewCramSheetMarkdown(
  pack: PlatformInterviewPrep,
  data: AcademyData,
  relatedCourse?: Course,
  relatedLabs: PlatformLab[] = [],
  headingLevel = 1,
  options: { questionIndexes?: number[] } = {}
) {
  const packHeading = "#".repeat(Math.max(1, Math.min(headingLevel, 5)));
  const questionHeading = "#".repeat(Math.max(2, Math.min(headingLevel + 1, 6)));
  const packSources = pack.official_sources.map((source) => `${source.label}: ${source.url}`);
  const labLines = relatedLabs.map((lab) => `${lab.title} (${lab.level_group}) - /labs/${lab.slug}`);
  const questionIndexes = options.questionIndexes ?? pack.questions.map((_, index) => index);
  const questionSections = questionIndexes
    .map((index) => ({ index, question: pack.questions[index] }))
    .filter((item): item is { index: number; question: PlatformInterviewPrep["questions"][number] } => Boolean(item.question))
    .map(({ question, index }) => {
      const questionSources = matchingOfficialSources(question, pack.official_sources);
      const questionLabs = matchingQuestionLabs(question, relatedLabs);
      const questionResources = matchingQuestionResources(question, pack, data);
      const resourceLines = questionResources.map((resource) => {
        const reviewed = resource.reviewed_at ? `, reviewed ${formatReviewDate(resource.reviewed_at)}` : "";
        const official = officialSourcesForResource(resource)
          .map((source) => `${source.label}: ${source.url}`)
          .join("; ");
        return `${resource.title} (${resource.resource_type}${reviewed}) - /resources/${resource.slug}${official ? `; ${official}` : ""}`;
      });

      return [
        `${questionHeading} ${index + 1}. ${question.question}`,
        "",
        `Scenario: ${question.scenario}`,
        "",
        "Answer outline:",
        markdownList(question.answer_outline),
        "",
        "Strong signals:",
        markdownList(question.strong_signals),
        "",
        "Red flags:",
        markdownList(question.red_flags),
        "",
        `Practice task: ${question.practice_task}`,
        "",
        "Study links:",
        markdownList([
          ...questionResources.map((resource) => `Resource: ${resource.title} - /resources/${resource.slug}`),
          ...questionLabs.map((lab) => `Lab: ${lab.title} - /labs/${lab.slug}`),
          ...questionSources.map((source) => `Docs: ${source.label} - ${source.url}`)
        ]),
        "",
        "Resource source notes:",
        markdownList(resourceLines)
      ].join("\n");
    });

  return [
    `${packHeading} ${pack.title}`,
    "",
    `Domain: ${pack.domain}`,
    `Level: ${pack.level_group}`,
    `Focus: ${pack.focus}`,
    relatedCourse ? `Related course: ${relatedCourse.title} - ${coursePath(relatedCourse)}` : "Related course: None linked.",
    "",
    "Official docs:",
    markdownList(packSources),
    "",
    "Related labs:",
    markdownList(labLines),
    "",
    ...questionSections
  ].join("\n");
}

function interviewCramSheetCollectionMarkdown(title: string, packs: PlatformInterviewPrep[], data: AcademyData) {
  const questionCount = packs.reduce((total, pack) => total + pack.questions.length, 0);
  const domains = Array.from(new Set(packs.map((pack) => pack.domain))).sort();
  const levels = Array.from(new Set(packs.map((pack) => pack.level_group))).sort();
  return [
    `# ${title}`,
    "",
    `Packs: ${packs.length}`,
    `Questions: ${questionCount}`,
    `Domains: ${domains.length ? domains.join(", ") : "None"}`,
    `Levels: ${levels.length ? levels.join(", ") : "None"}`,
    "",
    ...packs.map((pack) =>
      interviewCramSheetMarkdown(pack, data, courseForInterviewPack(data, pack), labsForInterviewPack(data, pack), 2)
    )
  ].join("\n\n");
}

function studyPlanQuestionGroups(plan: InterviewStudyPlan, data: AcademyData) {
  const selectedQuestions = new Set(plan.questionIds);
  return data.interviewPrep.packs
    .map((pack) => ({
      pack,
      questionIndexes: pack.questions.map((_, index) => index).filter((index) => selectedQuestions.has(interviewQuestionActivityId(pack, index)))
    }))
    .filter((group) => group.questionIndexes.length > 0);
}

function interviewStudyPlanMarkdown(plan: InterviewStudyPlan, data: AcademyData) {
  const groups = studyPlanQuestionGroups(plan, data);
  const questionCount = groups.reduce((total, group) => total + group.questionIndexes.length, 0);
  const domains = Array.from(new Set(groups.map((group) => group.pack.domain))).sort();
  const levels = Array.from(new Set(groups.map((group) => group.pack.level_group))).sort();
  return [
    `# ${plan.name} study plan`,
    "",
    `Packs: ${groups.length}`,
    `Questions: ${questionCount}`,
    `Domains: ${domains.length ? domains.join(", ") : "None"}`,
    `Levels: ${levels.length ? levels.join(", ") : "None"}`,
    `Updated: ${plan.updatedAt}`,
    "",
    ...groups.map((group) =>
      interviewCramSheetMarkdown(
        group.pack,
        data,
        courseForInterviewPack(data, group.pack),
        labsForInterviewPack(data, group.pack),
        2,
        { questionIndexes: group.questionIndexes }
      )
    )
  ].join("\n\n");
}

function interviewQuestionActivityId(pack: PlatformInterviewPrep, questionIndex: number) {
  return `${pack.slug}:${questionIndex + 1}`;
}

function InterviewPrepPage({ data, onSaveActivity }: { data: AcademyData; onSaveActivity: SaveActivity }) {
  const location = useLocation();
  const requestedPack = new URLSearchParams(location.search).get("pack") ?? "";
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [query, setQuery] = useState("");
  const [activeSlug, setActiveSlug] = useState(requestedPack || data.interviewPrep.packs[0]?.slug || "");
  const [savingQuestionId, setSavingQuestionId] = useState("");
  const [showUnpracticedOnly, setShowUnpracticedOnly] = useState(false);
  const [studyPlans, setStudyPlans] = useState<InterviewStudyPlan[]>(() => readInterviewStudyPlans());
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [planName, setPlanName] = useState("");
  const [planStatus, setPlanStatus] = useState("");
  const questionPanelRef = useRef<HTMLElement | null>(null);
  const practicedQuestions = completedActivityIds(data.activity, "interview_question");

  useEffect(() => {
    if (requestedPack) setActiveSlug(requestedPack);
  }, [requestedPack]);

  useEffect(() => {
    const reloadStudyPlans = () => setStudyPlans(readInterviewStudyPlans());
    window.addEventListener(STUDY_PLANS_RESTORED_EVENT, reloadStudyPlans);
    return () => window.removeEventListener(STUDY_PLANS_RESTORED_EVENT, reloadStudyPlans);
  }, []);

  useEffect(() => {
    if (studyPlans.length === 0) {
      if (selectedPlanId) setSelectedPlanId("");
      return;
    }
    if (!selectedPlanId || !studyPlans.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlanId(studyPlans[0].id);
    }
  }, [selectedPlanId, studyPlans]);

  const selectPack = useCallback((slug: string) => {
    setActiveSlug(slug);
    window.requestAnimationFrame(() => {
      questionPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const saveQuestionPractice = useCallback(
    async (targetId: string) => {
      setSavingQuestionId(targetId);
      try {
        await onSaveActivity({ target_type: "interview_question", target_id: targetId });
      } finally {
        setSavingQuestionId("");
      }
    },
    [onSaveActivity]
  );

  const filteredPacks = data.interviewPrep.packs.filter((pack) => {
    const searchable = `${pack.title} ${pack.domain} ${pack.level_group} ${pack.focus} ${pack.questions.map((question) => question.question).join(" ")}`.toLowerCase();
    return (
      (selectedLevel === "All" || pack.level_group === selectedLevel) &&
      (selectedDomain === "All" || pack.domain === selectedDomain) &&
      searchable.includes(query.toLowerCase())
    );
  });
  const activePack = filteredPacks.find((pack) => pack.slug === activeSlug) ?? filteredPacks[0];
  const relatedCourse = activePack ? courseForInterviewPack(data, activePack) : undefined;
  const relatedLabs = activePack ? labsForInterviewPack(data, activePack) : [];
  const studyLinkCount = new Set(
    data.interviewPrep.packs.flatMap((pack) => [
      ...pack.official_sources.map((source) => `source:${source.url}`),
      ...pack.related_labs.map((labSlug) => `lab:${labSlug}`),
      `course:${pack.related_course_slug}`,
    ])
  ).size;
  const practicedQuestionCount = practicedQuestions.size;
  const activeQuestionItems = activePack
    ? activePack.questions
      .map((question, index) => ({
        question,
        index,
        targetId: interviewQuestionActivityId(activePack, index),
        practiced: practicedQuestions.has(interviewQuestionActivityId(activePack, index))
      }))
      .filter((item) => !showUnpracticedOnly || !item.practiced)
    : [];
  const selectedPlan = studyPlans.find((plan) => plan.id === selectedPlanId);
  const selectedPlanGroups = selectedPlan ? studyPlanQuestionGroups(selectedPlan, data) : [];
  const selectedPlanQuestionCount = selectedPlanGroups.reduce((total, group) => total + group.questionIndexes.length, 0);
  const selectedPlanPackCount = selectedPlanGroups.length;
  const activePackQuestionIds = activePack ? activePack.questions.map((_, index) => interviewQuestionActivityId(activePack, index)) : [];
  const visibleQuestionIds = filteredPacks.flatMap((pack) => pack.questions.map((_, index) => interviewQuestionActivityId(pack, index)));
  const activePackInSelectedPlan =
    Boolean(selectedPlan) && activePackQuestionIds.length > 0 && activePackQuestionIds.every((questionId) => selectedPlan?.questionIds.includes(questionId));

  const saveStudyPlans = useCallback((nextPlans: InterviewStudyPlan[]) => {
    setStudyPlans(nextPlans);
    writeInterviewStudyPlans(nextPlans);
  }, []);
  const addQuestionIdsToSelectedPlan = useCallback(
    (questionIds: string[], status: string) => {
      if (!selectedPlan || questionIds.length === 0) return;
      const now = new Date().toISOString();
      const nextPlans = studyPlans.map((plan) =>
        plan.id === selectedPlan.id
          ? {
              ...plan,
              questionIds: uniqueStrings([...plan.questionIds, ...questionIds]),
              updatedAt: now
            }
          : plan
      );
      saveStudyPlans(nextPlans);
      setPlanStatus(status);
    },
    [saveStudyPlans, selectedPlan, studyPlans]
  );
  const createStudyPlan = () => {
    const now = new Date().toISOString();
    const name = planName.trim() || (activePack ? `${activePack.domain} ${activePack.level_group} plan` : "Platform interview plan");
    const plan: InterviewStudyPlan = {
      id: makeInterviewStudyPlanId(),
      name,
      questionIds: uniqueStrings(activePackQuestionIds),
      createdAt: now,
      updatedAt: now
    };
    saveStudyPlans([plan, ...studyPlans].slice(0, 25));
    setSelectedPlanId(plan.id);
    setPlanName("");
    setPlanStatus("Study plan saved.");
  };
  const addActivePackToSelectedPlan = () => {
    if (!activePack) return;
    addQuestionIdsToSelectedPlan(activePackQuestionIds, `${activePack.title} added.`);
  };
  const addVisiblePacksToSelectedPlan = () => {
    addQuestionIdsToSelectedPlan(visibleQuestionIds, `${filteredPacks.length} visible ${filteredPacks.length === 1 ? "pack" : "packs"} added.`);
  };
  const removeActivePackFromSelectedPlan = () => {
    if (!selectedPlan || !activePack) return;
    const removeIds = new Set(activePackQuestionIds);
    const now = new Date().toISOString();
    const nextPlans = studyPlans.map((plan) =>
      plan.id === selectedPlan.id
        ? {
            ...plan,
            questionIds: plan.questionIds.filter((questionId) => !removeIds.has(questionId)),
            updatedAt: now
          }
        : plan
    );
    saveStudyPlans(nextPlans);
    setPlanStatus(`${activePack.title} removed.`);
  };
  const deleteSelectedPlan = () => {
    if (!selectedPlan) return;
    const nextPlans = studyPlans.filter((plan) => plan.id !== selectedPlan.id);
    saveStudyPlans(nextPlans);
    setSelectedPlanId(nextPlans[0]?.id ?? "");
    setPlanStatus("Study plan deleted.");
  };
  const downloadCramSheet = () => {
    if (!activePack) return;
    downloadMarkdownFile(`${activePack.slug}-cram-sheet.md`, interviewCramSheetMarkdown(activePack, data, relatedCourse, relatedLabs));
  };
  const downloadVisibleCramSheets = () => {
    if (filteredPacks.length === 0) return;
    const scope = [
      selectedDomain !== "All" ? selectedDomain : "",
      selectedLevel !== "All" ? selectedLevel : "",
      query.trim() ? "search" : ""
    ].filter(Boolean);
    const title = `${scope.length ? scope.join(" ") : "Platform Academy"} interview cram sheets`;
    const filename = `${fileSafeSlug(scope.length ? scope.join("-") : "platform-academy")}-interview-cram-sheets.md`;
    downloadMarkdownFile(filename, interviewCramSheetCollectionMarkdown(title, filteredPacks, data));
  };
  const downloadSelectedStudyPlan = () => {
    if (!selectedPlan || selectedPlanQuestionCount === 0) return;
    downloadMarkdownFile(`${fileSafeSlug(selectedPlan.name)}-study-plan.md`, interviewStudyPlanMarkdown(selectedPlan, data));
  };

  return (
    <section className="page canonical-page interview-page">
      <header className="workspace-header interview-heading">
        <div>
          <p className="eyebrow">Scenario questions, answer notes, docs links</p>
          <h1>Interview prep</h1>
          <p className="lead">
            Practice realistic platform interview scenarios with answer outlines, common mistakes, and links to official docs.
          </p>
        </div>
        <dl className="resource-stats">
          <div>
            <dt>Questions</dt>
            <dd>{data.interviewPrep.total_questions}</dd>
          </div>
          <div>
            <dt>Packs</dt>
            <dd>{data.interviewPrep.packs.length}</dd>
          </div>
          <div>
            <dt>Study links</dt>
            <dd>{studyLinkCount}</dd>
          </div>
          <div>
            <dt>Practiced</dt>
            <dd>{practicedQuestionCount}</dd>
          </div>
        </dl>
      </header>

      <section className="toolbar canonical-toolbar" aria-label="Interview prep filters">
        <div className="search-box">
          <Search aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search scenarios, IAM, SLOs, Helm..." />
        </div>
        <div className="segmented">
          <Filter aria-hidden="true" />
          {["All", ...data.interviewPrep.levels].map((level) => (
            <button key={level} className={selectedLevel === level ? "selected" : ""} onClick={() => setSelectedLevel(level)}>
              {level}
            </button>
          ))}
        </div>
        <div className="segmented topics">
          {["All", ...data.interviewPrep.domains].map((domain) => (
            <button key={domain} className={selectedDomain === domain ? "selected" : ""} onClick={() => setSelectedDomain(domain)}>
              {domain}
            </button>
          ))}
        </div>
        <div className="interview-export-row">
          <span>
            {filteredPacks.length} visible {filteredPacks.length === 1 ? "pack" : "packs"} / {data.interviewPrep.packs.length} total
          </span>
          <button className="secondary-action" disabled={filteredPacks.length === 0} onClick={downloadVisibleCramSheets} type="button">
            <Download aria-hidden="true" />
            Download {filteredPacks.length} visible {filteredPacks.length === 1 ? "pack" : "packs"}
          </button>
        </div>
        <div className="interview-plan-builder" aria-label="Saved interview study plans">
          <div className="interview-plan-summary">
            <span>{studyPlans.length} saved {studyPlans.length === 1 ? "plan" : "plans"}</span>
            <strong>{selectedPlan ? selectedPlan.name : "No saved plan"}</strong>
            <small>
              {selectedPlan
                ? `${selectedPlanQuestionCount} questions / ${selectedPlanPackCount} ${selectedPlanPackCount === 1 ? "pack" : "packs"}`
                : "Create a plan from the active pack"}
            </small>
          </div>
          <input
            aria-label="Study plan name"
            onChange={(event) => setPlanName(event.target.value)}
            placeholder="Study plan name"
            value={planName}
          />
          <select aria-label="Saved study plan" onChange={(event) => setSelectedPlanId(event.target.value)} value={selectedPlanId}>
            <option value="">Select plan</option>
            {studyPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
          <div className="interview-plan-actions">
            <button className="secondary-action" disabled={!activePack} onClick={createStudyPlan} type="button">
              <Plus aria-hidden="true" />
              New plan
            </button>
            <button className="secondary-action" disabled={!selectedPlan || !activePack || activePackInSelectedPlan} onClick={addActivePackToSelectedPlan} type="button">
              <BookMarked aria-hidden="true" />
              Add active
            </button>
            <button className="secondary-action" disabled={!selectedPlan || filteredPacks.length === 0} onClick={addVisiblePacksToSelectedPlan} type="button">
              <Layers3 aria-hidden="true" />
              Add visible
            </button>
            <button className="secondary-action" disabled={!selectedPlan || selectedPlanQuestionCount === 0} onClick={downloadSelectedStudyPlan} type="button">
              <Download aria-hidden="true" />
              Download plan
            </button>
            <button className="secondary-action danger-action" disabled={!selectedPlan} onClick={deleteSelectedPlan} type="button">
              <Trash2 aria-hidden="true" />
              Delete
            </button>
          </div>
          {activePackInSelectedPlan && (
            <button className="text-link" onClick={removeActivePackFromSelectedPlan} type="button">
              Remove active pack
            </button>
          )}
          {planStatus && <span className="interview-plan-status" role="status">{planStatus}</span>}
        </div>
      </section>

      <section className="interview-layout">
        <aside className="interview-pack-list" aria-label="Interview prep packs">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Prep packs</p>
              <h2>{filteredPacks.length} packs</h2>
            </div>
          </div>
          <div className="interview-pack-scroll">
            {filteredPacks.map((pack) => {
              const isSelected = activePack?.slug === pack.slug;
              const packPracticedCount = pack.questions.filter((_, index) => practicedQuestions.has(interviewQuestionActivityId(pack, index))).length;
              return (
                <button
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${pack.title}. ${pack.level_group}. ${pack.questions.length} questions. ${
                    isSelected ? "Selected pack" : "Show questions"
                  }. ${pack.focus}`}
                  className={isSelected ? "interview-pack-card selected" : "interview-pack-card"}
                  key={pack.slug}
                  onClick={() => selectPack(pack.slug)}
                >
                  <span className="interview-pack-card-top">
                    <span>{pack.level_group}</span>
                    <span>{packPracticedCount} / {pack.questions.length} practiced</span>
                  </span>
                  <strong>{pack.title}</strong>
                  <small>{isSelected ? "Selected pack" : "Show questions"}</small>
                </button>
              );
            })}
          </div>
          {filteredPacks.length === 0 && <EmptyState title="No interview packs match those filters." />}
        </aside>

        {activePack && (
          <article className="workspace-panel interview-main" ref={questionPanelRef}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  {activePack.domain} / {activePack.level_group}
                </p>
                <h2>{activePack.title}</h2>
              </div>
              <div className="section-actions">
                <button className="secondary-action" onClick={downloadCramSheet} type="button">
                  <Download aria-hidden="true" />
                  Download cram sheet
                </button>
                {relatedCourse && (
                  <Link className="text-link" to={coursePath(relatedCourse)}>
                    Related course <ArrowRight aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
            <p className="interview-focus">{activePack.focus}</p>

            <div className="interview-source-grid">
              <section>
                <p className="eyebrow">Docs to read</p>
                {activePack.official_sources.map((source) => (
                  <a className="source-link" href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                    <ExternalLink aria-hidden="true" />
                    {source.label}
                  </a>
                ))}
              </section>
              <section>
                <p className="eyebrow">Related labs</p>
                {relatedLabs.length > 0 ? (
                  relatedLabs.map((lab) => (
                    <Link className="resource-mini-row" aria-label={lab.title} to={`/labs/${lab.slug}`} key={lab.slug}>
                      <span>{lab.level_group}</span>
                      <strong>{lab.title}</strong>
                    </Link>
                  ))
                ) : (
                  <p>No lab is linked to this interview pack yet.</p>
                )}
              </section>
            </div>

            <div className="question-progress-toolbar">
              <div>
                <p className="eyebrow">Question queue</p>
                <h3>
                  {activeQuestionItems.length} visible / {activePack.questions.length} in this pack
                </h3>
              </div>
              <button
                className={showUnpracticedOnly ? "activity-toggle active" : "activity-toggle"}
                onClick={() => setShowUnpracticedOnly((current) => !current)}
                type="button"
              >
                {showUnpracticedOnly ? "Showing open questions" : "Show open only"}
              </button>
            </div>

            <div className="interview-question-stack">
              {activeQuestionItems.map(({ question, index, targetId, practiced }) => {
                const questionSources = matchingOfficialSources(question, activePack.official_sources);
                const questionLabs = matchingQuestionLabs(question, relatedLabs);
                const questionResources = matchingQuestionResources(question, activePack, data);
                return (
                  <section className="interview-question" key={question.question}>
                    <div className="question-number">{String(index + 1).padStart(2, "0")}</div>
                    <div>
                      <div className="question-title-row">
                        <h3>{question.question}</h3>
                        <button
                          className={practiced ? "activity-toggle completed" : "activity-toggle"}
                          disabled={practiced || savingQuestionId === targetId}
                          onClick={() => void saveQuestionPractice(targetId)}
                          type="button"
                        >
                          {practiced ? (
                            <>
                              <CheckCircle2 aria-hidden="true" />
                              Practiced
                            </>
                          ) : savingQuestionId === targetId ? (
                            "Saving..."
                          ) : (
                            "Mark practiced"
                          )}
                        </button>
                        <button
                          className={selectedPlan?.questionIds.includes(targetId) ? "activity-toggle completed" : "activity-toggle"}
                          disabled={!selectedPlan || selectedPlan.questionIds.includes(targetId)}
                          onClick={() => addQuestionIdsToSelectedPlan([targetId], "Question added to study plan.")}
                          type="button"
                        >
                          {selectedPlan?.questionIds.includes(targetId) ? (
                            <>
                              <CheckCircle2 aria-hidden="true" />
                              In plan
                            </>
                          ) : (
                            "Add to plan"
                          )}
                        </button>
                      </div>
                      <p>{question.scenario}</p>
                      <h4>Answer outline</h4>
                      <ul className="check-list">
                        {question.answer_outline.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <div className="interview-signal-grid">
                        <div>
                          <h4>Good answers include</h4>
                          <div className="chip-list">
                            {question.strong_signals.map((signal) => (
                              <span key={signal}>{signal}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4>Common mistakes</h4>
                          <ul className="check-list compact-list">
                            {question.red_flags.map((flag) => (
                              <li key={flag}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="practice-task">
                        <Target aria-hidden="true" />
                        <span>{question.practice_task}</span>
                      </div>
                      <div className="question-study-links" aria-label={`Study links for question ${index + 1}`}>
                        <h4>Study this</h4>
                        <div>
                          {relatedCourse && (
                            <Link aria-label={`Course: ${relatedCourse.title}`} to={coursePath(relatedCourse)}>
                              <BookOpen aria-hidden="true" />
                              <span>Course</span>
                              <strong>{relatedCourse.title}</strong>
                            </Link>
                          )}
                          {questionResources.map((resource) => (
                            <Link aria-label={`Resource: ${resource.title}`} to={`/resources/${resource.slug}`} key={resource.slug}>
                              <BookMarked aria-hidden="true" />
                              <span>Resource</span>
                              <strong>{resource.title}</strong>
                            </Link>
                          ))}
                          {questionLabs.map((lab) => (
                            <Link aria-label={`Lab: ${lab.title}`} to={`/labs/${lab.slug}`} key={lab.slug}>
                              <Terminal aria-hidden="true" />
                              <span>Lab</span>
                              <strong>{lab.title}</strong>
                            </Link>
                          ))}
                          {questionSources.map((source) => (
                            <a aria-label={`Docs: ${source.label}`} href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                              <ExternalLink aria-hidden="true" />
                              <span>Docs</span>
                              <strong>{source.label}</strong>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })}
              {activeQuestionItems.length === 0 && <EmptyState title="All questions in this pack are practiced." detail="Turn off the open-only filter to review the full answer set." />}
            </div>
          </article>
        )}
      </section>
    </section>
  );
}

function LabDetailPage({
  data,
  learnerId,
  onSaveActivity,
  onSaveLabSubmission
}: {
  data: AcademyData;
  learnerId: string;
  onSaveActivity: SaveActivity;
  onSaveLabSubmission: SaveLabSubmission;
}) {
  const { slug = "" } = useParams();
  const [savingActivity, setSavingActivity] = useState(false);
  const lab = labForSlug(data, slug);
  if (!lab) return <EmptyState title="Lab not found." detail="That lab is not in the current catalog." />;
  const course = allCourses(data.catalog).find((item) => item.slug === lab.course_slug);
  const relatedResources = resourcesForLab(data, lab);
  const isTracked = hasCompletedActivity(data, "lab", lab.slug);
  const submission = labSubmissionFor(data, lab.slug);
  const submissionSummary = labSubmissionSummary(submission);

  const saveLabActivity = async () => {
    setSavingActivity(true);
    try {
      await onSaveActivity({ target_type: "lab", target_id: lab.slug });
    } finally {
      setSavingActivity(false);
    }
  };

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
          <span>{submissionSummary.label}</span>
          <strong>{submission ? Math.round(submission.score) : lab.estimated_minutes}</strong>
          <small>{submission ? "score" : "minutes"}</small>
        </div>
      </header>

      <section className="detail-layout">
        <article className="workspace-panel">
          <div className="runbook-meta">
            <LevelBadge level={lab.level_group} />
            <LabTierBadge tier={lab.lab_tier} />
            <PortfolioLabBadge lab={lab} />
            <span>{lab.track}</span>
            {course && <span>{course.title}</span>}
          </div>
          {isPortfolioLab(lab) ? (
            <div className="portfolio-lab-callout">
              <strong>Portfolio-grade practice</strong>
              <span>Use the workbook and saved evidence as a reusable incident, release, or architecture review note.</span>
            </div>
          ) : null}
          <div className="activity-save-panel">
            <div>
              <p className="eyebrow">Saved in your profile</p>
              <h2>{isTracked ? "Lab run is saved" : "Track this lab after practice"}</h2>
              <p>Saved lab activity stays with this guest profile.</p>
            </div>
            <ActivityToggleButton
              actionLabel="Mark lab run"
              completed={isTracked}
              completedLabel="Lab saved"
              onClick={() => void saveLabActivity()}
              saving={savingActivity}
            />
          </div>
          <LabOperationalBrief lab={lab} />
          <LabWorkbook lab={lab} learnerId={learnerId} onSaveSubmission={onSaveLabSubmission} />
          <LabListSection items={lab.prerequisites} title="Prerequisites" />
          {lab.setup_commands?.length ? <CommandBlock commands={lab.setup_commands} title="Setup commands" /> : null}
          {lab.setup_self_check_commands?.length ? (
            <CommandBlock commands={lab.setup_self_check_commands} title="Opt-in self-check commands" />
          ) : null}
          <LabListSection items={lab.practice_steps} title="Practice steps" />
          <CommandBlock commands={lab.commands} title="Runbook commands" />
          <LabListSection items={lab.expected_evidence} title="Expected evidence" />
          {lab.validation_commands?.length ? <CommandBlock commands={lab.validation_commands} title="Validation commands" /> : null}
          <h2>Validation checklist</h2>
          <ul className="check-list">
            {lab.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {lab.cleanup_commands?.length ? <CommandBlock commands={lab.cleanup_commands} title="Cleanup commands" /> : null}
          <LabListSection items={lab.no_cluster_fallback} title="No-cluster fallback" />
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
              <Link className="text-link" to={lessonPathForId(data, lab.lesson_id)}>
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
              <p>No related resource is linked to this lab.</p>
            )}
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Before using commands</p>
            <p>These lab commands are meant for local practice. Check the current official docs before using them on a live cluster.</p>
          </section>
        </aside>
      </section>
    </section>
  );
}

function DeferredContentPage({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="page canonical-page">
      <EmptyState title={title} detail={detail} />
    </section>
  );
}

let designStylesLoaded = false;
let designStylesPromise: Promise<unknown> | undefined;

function loadDesignStyles() {
  if (!designStylesPromise) {
    designStylesPromise = import("./designs.css").then(() => {
      designStylesLoaded = true;
    });
  }
  return designStylesPromise;
}

function DesignStylesGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(designStylesLoaded);

  useEffect(() => {
    let isMounted = true;
    void loadDesignStyles().then(() => {
      if (isMounted) setReady(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!ready) {
    return <DeferredContentPage title="Loading design system..." detail="The visual exploration stylesheet is loading." />;
  }

  return <>{children}</>;
}

function ResourcesPage({ data }: { data: AcademyData }) {
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [query, setQuery] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(36);
  const filteredResources = data.resources.resources.filter((resource) => {
    const text =
      `${resource.title} ${resource.summary} ${resource.domain} ${resource.resource_type} ${resource.outcomes.join(" ")} ${resource.artifacts.join(" ")} ${(resource.source_takeaways ?? []).join(" ")} ${(resource.study_tasks ?? []).join(" ")} ${(resource.interview_prompts ?? []).join(" ")} ${officialSourcesForResource(resource)
        .map((source) => source.label)
        .join(" ")}`.toLowerCase();
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
  const featuredSources = featuredResource ? officialSourcesForResource(featuredResource) : [];
  const hasActiveFilters = selectedDomain !== "All" || selectedType !== "All" || query.trim().length > 0;

  useEffect(() => {
    setVisibleLimit(36);
  }, [selectedDomain, selectedType, query]);

  return (
    <section className="page canonical-page resources-page">
      <header className="workspace-header resources-heading">
        <div>
          <p className="eyebrow">Runbooks, projects, checklists, references</p>
          <h1>Resource library</h1>
          <p className="lead">
            Searchable runbooks, project briefs, checklists, and references for Kubernetes, EKS, Helm, ArgoCD, SRE, security, Terraform, and FinOps practice.
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
      <section className="resource-filter-bar" aria-label="Resource filters">
        <div className="search-box">
          <Search aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resources, runbooks, projects..." />
        </div>
        <label className="filter-select">
          <span>Domain</span>
          <select value={selectedDomain} onChange={(event) => setSelectedDomain(event.target.value)}>
            {["All", ...data.resources.domains].map((domain) => (
              <option key={domain} value={domain}>
                {domain === "All" ? "All domains" : domain}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-select">
          <span>Type</span>
          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
            {["All", ...data.resources.types].map((type) => (
              <option key={type} value={type}>
                {type === "All" ? "All types" : type}
              </option>
            ))}
          </select>
        </label>
        <div className="filter-summary">
          <Filter aria-hidden="true" />
          <span>{filteredResources.length} matches</span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSelectedDomain("All");
                setSelectedType("All");
                setQuery("");
              }}
            >
              Reset
            </button>
          )}
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
              {featuredSources.length > 0 && (
                <div className="resource-source-strip" aria-label="Official links">
                  {featuredSources.slice(0, 3).map((source) => (
                    <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                      <ExternalLink aria-hidden="true" />
                      {source.label}
                    </a>
                  ))}
                </div>
              )}
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
              <h2>{visibleResources.length} shown / {filteredResources.length} matching resources</h2>
            </div>
          </div>
          {visibleResources.map((resource) => (
            <ResourceCard resource={resource} data={data} key={resource.slug} />
          ))}
          {hiddenResourceCount > 0 && (
            <div className="resource-pagination">
              <span>{hiddenResourceCount} matching resources remain.</span>
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
  const sourceCount = officialSourcesForResource(resource).length;
  const reviewed = hasCompletedActivity(data, "resource", resource.slug);
  return (
    <Link className="resource-card resource-row" to={`/resources/${resource.slug}`}>
      <div className="resource-card-top">
        <LevelBadge level={resource.level_group} />
        <span>{resource.resource_type}</span>
        <span>{resource.estimated_minutes} min</span>
        {sourceCount > 0 && <span>{sourceCount} sources</span>}
        {reviewed && <span>reviewed</span>}
      </div>
      <h2>{resource.title}</h2>
      <p>{resource.summary}</p>
      <div className="resource-card-artifacts">
        {resource.artifacts.slice(0, 3).map((artifact) => (
          <span key={artifact}>{artifact}</span>
        ))}
      </div>
      <div className="resource-links">
        <span>{resource.domain}</span>
        <span>{resource.safety_level}</span>
        {lab && <span>Lab: {lab.title}</span>}
      </div>
    </Link>
  );
}

function ResourceDetailPage({ data, onSaveActivity }: { data: AcademyData; onSaveActivity: SaveActivity }) {
  const { slug = "" } = useParams();
  const [savingActivity, setSavingActivity] = useState(false);
  const resource = resourceForSlug(data, slug);
  if (!resource) return <EmptyState title="Resource not found." detail="That resource is not in the current library." />;
  const sourceTakeaways = resource.source_takeaways ?? [];
  const studyTasks = resource.study_tasks ?? [];
  const interviewPrompts = resource.interview_prompts ?? [];
  const officialSources = officialSourcesForResource(resource);
  const relatedLabs = data.catalog.labs.filter((lab) => resource.related_labs.includes(lab.slug));
  const isTracked = hasCompletedActivity(data, "resource", resource.slug);
  const relatedCourses: Course[] = Array.from(
    new globalThis.Map<number, Course>(
      relatedLabs
        .map((lab) => allCourses(data.catalog).find((course) => course.slug === lab.course_slug))
        .filter((course): course is Course => Boolean(course))
        .map((course) => [course.id, course])
    ).values()
  );
  const saveResourceActivity = async () => {
    setSavingActivity(true);
    try {
      await onSaveActivity({ target_type: "resource", target_id: resource.slug });
    } finally {
      setSavingActivity(false);
    }
  };

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
          <div className="activity-save-panel">
            <div>
              <p className="eyebrow">Saved in your profile</p>
              <h2>{isTracked ? "Resource review is saved" : "Track this resource after review"}</h2>
              <p>Marking this reviewed saves it to this guest profile.</p>
            </div>
            <ActivityToggleButton
              actionLabel="Mark reviewed"
              completed={isTracked}
              completedLabel="Review saved"
              onClick={() => void saveResourceActivity()}
              saving={savingActivity}
            />
          </div>
          <CommandBlock commands={resource.commands} title="Commands" />
          {officialSources.length > 0 && (
            <>
              <h2>Official links</h2>
              <div className="resource-source-grid">
                {officialSources.map((source) => (
                  <a className="source-link" href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                    <ExternalLink aria-hidden="true" />
                    {source.label}
                  </a>
                ))}
              </div>
            </>
          )}
          <h2>Outcomes</h2>
          <ul className="check-list">
            {resource.outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>
          {sourceTakeaways.length > 0 && (
            <>
              <h2>Takeaways from docs</h2>
              <ul className="check-list">
                {sourceTakeaways.map((takeaway) => (
                  <li key={takeaway}>{takeaway}</li>
                ))}
              </ul>
            </>
          )}
          {studyTasks.length > 0 && (
            <>
              <h2>Study tasks</h2>
              <ul className="check-list">
                {studyTasks.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </>
          )}
          {interviewPrompts.length > 0 && (
            <>
              <h2>Interview prompts</h2>
              <ul className="check-list">
                {interviewPrompts.map((prompt) => (
                  <li key={prompt}>{prompt}</li>
                ))}
              </ul>
            </>
          )}
          <h2>What to produce</h2>
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
              <p>No related lab is linked to this resource.</p>
            )}
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Related courses</p>
            {relatedCourses.length > 0 ? (
              relatedCourses.map((course) => (
                <Link className="resource-mini-row" to={coursePath(course)} key={course.id}>
                  <span>{course.category}</span>
                  <strong>{course.title}</strong>
                </Link>
              ))
            ) : (
              <p>No related course is linked yet.</p>
            )}
          </section>
          <section className="workspace-panel source-review-panel">
            <p className="eyebrow">Sources and review</p>
            {officialSources.length > 0 ? (
              <p>
                {officialSources.length} official link{officialSources.length === 1 ? "" : "s"} available.
              </p>
            ) : (
              <p>No external source URL is available for this resource yet.</p>
            )}
            <p>
              {resource.reviewed_at
                ? `Reviewed ${formatReviewDate(resource.reviewed_at)}`
                : "No review timestamp is available for this resource yet."}
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
    title: "Cloud Operations Board",
    direction: "A dashboard view of incidents, rollout checks, and academy progress.",
    signal: "Operations"
  },
  {
    id: 2,
    title: "Editorial Academy",
    direction: "A clean journal for platform lessons, resources, and study order.",
    signal: "Editorial"
  },
  {
    id: 3,
    title: "Terminal Practice Console",
    direction: "A keyboard-friendly practice view built around commands, queues, and runbooks.",
    signal: "Terminal"
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
    direction: "A dark monitoring wall for progress, labs, reviews, and learning signals.",
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
    title: "SaaS Dashboard",
    direction: "A restrained dashboard for course progress and practice planning.",
    signal: "SaaS"
  },
  {
    id: 8,
    title: "Curriculum Map",
    direction: "A map view that groups courses by platform domain.",
    signal: "Map"
  },
  {
    id: 9,
    title: "Certification Bootcamp",
    direction: "A focused bootcamp view for outcomes, drills, and exam-grade practice.",
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
      label: "Resources",
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
          <dd className="design-proof-detail">{item.detail}</dd>
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
      <p className="design-kicker">Reusable resource</p>
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
            Each direction uses the same Kubernetes, EKS, Helm, ArgoCD, and SRE curriculum data, shown through a different learning interface.
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
          <p>Compared in May 2026 against official docs, cloud learning hubs, hands-on lab platforms, and certification practice sites.</p>
        </article>
        <article>
          <span>Product bar</span>
          <p>Learners need commands, labs, source dates, saved progress, and notes they can reuse.</p>
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
              <Link to={coursePath(leadCourse)}>
                Start control sequence <ArrowRight aria-hidden="true" />
              </Link>
            )}
            <Link to="/roadmap">Open roadmap</Link>
          </div>
        </div>
        <div className="control-screen" aria-label="Cloud control room status">
          <div className="control-screen-header">
            <RadioTower aria-hidden="true" />
            <span>Platform progress board</span>
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
            <Link to={coursePath(leadCourse)}>
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
            <span>Sources</span>
            <p>Every course page should show source docs, version context, and last-reviewed dates when available.</p>
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
              <Link to={coursePath(course)} key={course.id}>
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
            <h2>Checks</h2>
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
            <Link className={`atlas-node atlas-node-${index + 1}`} to={coursePath(track.course)} key={track.slug}>
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
          {stats.recommended && <Link to={lessonPathForId(data, stats.recommended.id)}>Resume lesson</Link>}
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
            <li>Resources produce reusable runbooks, diagrams, worksheets, or review notes.</li>
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
            <span>Course console</span>
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
              <p className="design-kicker">Academy progress</p>
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
              <h2>Tracks</h2>
              <span>{stats.tracks.length} active tracks</span>
            </div>
            {stats.tracks.slice(0, 6).map((track) => (
              <Link to={coursePath(track.course)} key={track.slug}>
                <span>{track.level_group}</span>
                <strong>{track.title}</strong>
                <p>{track.role}</p>
              </Link>
            ))}
          </section>
          <section className="saas-evidence" id="resources">
            <div className="saas-table-head">
              <h2>Resource checks</h2>
              <span>{stats.resources.length} reusable resources</span>
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
        <p className="design-kicker">Curriculum map</p>
        <h1>Choose a learning route by platform domain.</h1>
        <p>{data.catalog.promise}</p>
      </header>
      <DesignEvidenceStrip data={data} stats={stats} />
      <section className="command-layout">
        <div className="command-map-board" aria-label="Platform course map">
          <span className="map-line map-line-a" />
          <span className="map-line map-line-b" />
          <span className="map-line map-line-c" />
          {stats.courses.slice(0, 5).map((course, index) => (
            <Link className="command-node" style={positions[index]} to={coursePath(course)} key={course.id}>
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
            <Link to={lessonPathForId(data, stats.recommended.id)}>
              Continue drill <ArrowRight aria-hidden="true" />
            </Link>
          )}
        </div>
        <aside>
          <Target aria-hidden="true" />
          <strong>{stats.completionPercent}%</strong>
          <span>progress score</span>
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
  const { courseRef = "" } = useParams();
  const completed = useMemo(() => completedLessonIds(data.progress), [data.progress]);
  const course = courseForRef(data, courseRef);
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
                <Link className="lesson-row canonical-lesson-row" to={lessonPath(course, lesson)} key={lesson.id}>
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
            <p className="eyebrow">Labs</p>
            {courseLabs.length > 0 ? (
              courseLabs.slice(0, 5).map((lab) => (
                <Link className="resource-mini-row" aria-label={lab.title} to={`/labs/${lab.slug}`} key={lab.slug}>
                  <span>{lab.estimated_minutes} min</span>
                  <strong>{lab.title}</strong>
                </Link>
              ))
            ) : (
              <p>No labs are linked to this course yet.</p>
            )}
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Reusable resources</p>
            {courseResources.length > 0 ? (
              courseResources.slice(0, 6).map((resource) => (
                <Link className="resource-mini-row" aria-label={resource.title} to={`/resources/${resource.slug}`} key={resource.slug}>
                  <span>{resource.resource_type}</span>
                  <strong>{resource.title}</strong>
                </Link>
              ))
            ) : (
              <p>No resources are linked to this course yet.</p>
            )}
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Sources and review</p>
            <p>This course uses the local catalog. Resource pages carry official links and reviewed dates where available.</p>
          </section>
        </aside>
      </section>
    </section>
  );
}

function LessonPage({ data, learnerId, onProgressSaved }: { data: AcademyData; learnerId: string; onProgressSaved: () => void }) {
  const { id = "", courseRef = "", sequence = "" } = useParams();
  const routeCourse = courseRef ? courseForRef(data, courseRef) : undefined;
  const routeSequence = Number(sequence);
  const routeLesson = routeCourse && Number.isInteger(routeSequence) ? routeCourse.lessons.find((item) => item.sequence === routeSequence) : undefined;
  const numericLessonId = routeLesson?.id ?? Number(id);
  const catalogCourse = Number.isInteger(numericLessonId) ? courseForLesson(data, numericLessonId) : undefined;
  const isPlatformLessonRoute = Boolean(catalogCourse?.lessons.some((item) => item.id === numericLessonId));
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [completionFeedback, setCompletionFeedback] = useState<"auto" | "manual" | "previous" | "">("");
  const saveInFlight = useRef(false);
  const savedLessonId = useRef<number | null>(null);

  useEffect(() => {
    setLesson(null);
    setSaved(false);
    setError("");
    setCompletionFeedback("");
    saveInFlight.current = false;
    savedLessonId.current = null;
    if (!isPlatformLessonRoute) return;
    api.lesson(String(numericLessonId)).then(setLesson).catch((err) => setError(err.message));
  }, [isPlatformLessonRoute, numericLessonId]);

  useEffect(() => {
    if (!lesson) return;
    const isCompleted = completedLessonIds(data.progress).has(lesson.id);
    if (isCompleted) {
      savedLessonId.current = lesson.id;
      setCompletionFeedback((current) => current || "previous");
    }
    setSaved(isCompleted || savedLessonId.current === lesson.id);
  }, [data.progress, lesson]);

  const save = useCallback(async (source: "auto" | "manual" = "manual") => {
    if (!lesson || saved || savedLessonId.current === lesson.id || saveInFlight.current) return;
    saveInFlight.current = true;
    setSaving(true);
    try {
      await api.saveProgress(lesson.id, true, 1, learnerId);
      savedLessonId.current = lesson.id;
      setSaved(true);
      setCompletionFeedback(source);
      onProgressSaved();
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  }, [learnerId, lesson, onProgressSaved, saved]);

  useEffect(() => {
    if (!lesson || saved) return;
    const handleScroll = () => {
      const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      const viewportBottom = window.scrollY + window.innerHeight;
      if (documentHeight > 0 && viewportBottom >= documentHeight - 120) {
        void save("auto");
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lesson, save, saved]);

  if (!isPlatformLessonRoute) {
    return (
      <EmptyState
        title="Lesson outside Platform Academy."
        detail="This standalone workspace only opens and tracks lessons from the Platform Academy catalog."
      />
    );
  }
  if (error) return <EmptyState title="Lesson unavailable." detail={error} />;
  if (!lesson) return <EmptyState title="Loading lesson..." />;
  const course = catalogCourse;
  const courseLessons = [...(course?.lessons ?? [])].sort((left, right) => left.sequence - right.sequence);
  const lessonIndex = courseLessons.findIndex((item) => item.id === lesson.id);
  const previousLesson = lessonIndex > 0 ? courseLessons[lessonIndex - 1] : undefined;
  const nextLessonItem = lessonIndex >= 0 ? courseLessons[lessonIndex + 1] : undefined;
  const relatedLabs = data.catalog.labs.filter((lab) => lab.lesson_id === lesson.id);
  const relatedResources = resourcesForLesson(data, lesson.id);
  const completionMessage =
    completionFeedback === "auto"
      ? "Completed automatically after reading."
      : completionFeedback === "previous"
        ? "Already completed in this guest workspace."
        : "Progress saved for this guest workspace.";

  return (
    <section className="page canonical-page lesson-page">
      <Link className="back-link" to={course ? coursePath(course) : "/"}>
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
          {previousLesson && (
            <Link className="secondary-action" aria-label={`Previous lesson ${previousLesson.title}`} to={course ? lessonPath(course, previousLesson) : `/lessons/${previousLesson.id}`}>
              <ChevronLeft aria-hidden="true" />
              Previous lesson
            </Link>
          )}
          {nextLessonItem && (
            <Link className="secondary-action" aria-label={`Next lesson ${nextLessonItem.title}`} to={course ? lessonPath(course, nextLessonItem) : `/lessons/${nextLessonItem.id}`}>
              Next lesson
              <ArrowRight aria-hidden="true" />
            </Link>
          )}
          <button className="primary-action" disabled={saving} onClick={() => void save("manual")}>
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
            <p className="eyebrow">Related labs</p>
            {relatedLabs.length > 0 ? (
              relatedLabs.map((lab) => (
                <Link className="resource-mini-row" aria-label={lab.title} to={`/labs/${lab.slug}`} key={lab.slug}>
                  <span>{lab.level_group}</span>
                  <strong>{lab.title}</strong>
                </Link>
              ))
            ) : (
              <p>No lab is linked to this lesson yet.</p>
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
              <p>No resource is linked to this lesson yet.</p>
            )}
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Sources and practice</p>
            <p>Lesson content is loaded from the local API. Resource pages carry official links and reviewed dates where available.</p>
            <p>Use the linked lab checklist and resources to decide what to save.</p>
          </section>
        </aside>
      </section>

      {saved && (
        <div className="lesson-completion-notice" role="status">
          <CheckCircle2 aria-hidden="true" />
          <span>{completionMessage}</span>
          {nextLessonItem && course && (
            <Link to={lessonPath(course, nextLessonItem)}>
              Next lesson <ArrowRight aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [learnerId, setLearnerId] = useState(getOrCreateLocalLearnerId);
  const [data, setData] = useState<AcademyData | null>(null);
  const [error, setError] = useState("");
  const loadRequestId = useRef(0);
  const staticContentCache = useRef<StaticContentCache>({});

  const loadDeferredStaticContent = useCallback((requestId: number) => {
    const cached = staticContentCache.current;
    if (cached.resources && cached.interviewPrep) return Promise.resolve();

    return Promise.all([cached.resources ? Promise.resolve(cached.resources) : api.resources(), cached.interviewPrep ? Promise.resolve(cached.interviewPrep) : api.interviewPrep()])
      .then(([resources, interviewPrep]) => {
        staticContentCache.current = { resources, interviewPrep };
        if (requestId !== loadRequestId.current) return;
        setData((current) =>
          current
            ? {
                ...current,
                resources,
                resourcesLoaded: true,
                interviewPrep,
                interviewPrepLoaded: true
              }
            : current
        );
      })
      .catch((err) => {
        if (requestId !== loadRequestId.current) return;
        setError(err.message);
      });
  }, []);

  const loadData = useCallback(() => {
    const requestId = loadRequestId.current + 1;
    loadRequestId.current = requestId;
    setError("");

    return Promise.all([api.catalog(), api.roadmap(), api.progress(learnerId), api.activity(learnerId), api.labSubmissions(learnerId), api.dashboard(learnerId, "platform")])
      .then(([catalog, roadmap, progress, activity, labSubmissions, dashboard]) => {
        if (requestId !== loadRequestId.current) return;
        const cached = staticContentCache.current;
        setData({
          catalog,
          roadmap,
          resources: cached.resources ?? EMPTY_RESOURCES,
          resourcesLoaded: Boolean(cached.resources),
          interviewPrep: cached.interviewPrep ?? EMPTY_INTERVIEW_PREP,
          interviewPrepLoaded: Boolean(cached.interviewPrep),
          progress,
          activity,
          labSubmissions,
          dashboard
        });
        void loadDeferredStaticContent(requestId);
      })
      .catch((err) => {
        if (requestId !== loadRequestId.current) return;
        setError(err.message);
      });
  }, [learnerId, loadDeferredStaticContent]);

  const resetLearner = () => {
    loadRequestId.current += 1;
    setData(null);
    setError("");
    setLearnerId(resetLocalLearnerId());
  };

  const recoverLearner = (restoredLearnerId: string) => {
    loadRequestId.current += 1;
    setData(null);
    setError("");
    setLearnerId(restoredLearnerId);
    void api.saveActivity({ target_type: "guest_recovery", target_id: "profile-restore" }, restoredLearnerId).catch(() => undefined);
  };

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const saveActivity = useCallback<SaveActivity>(
    async (activity) => {
      const saved = await api.saveActivity(activity, learnerId);
      setData((current) => (current ? { ...current, activity: upsertActivityRow(current.activity, saved) } : current));
      return saved;
    },
    [learnerId]
  );

  const saveLabSubmission = useCallback<SaveLabSubmission>(
    async (slug, submission) => {
      const saved = await api.saveLabSubmission(slug, submission, learnerId);
      setData((current) => (current ? { ...current, labSubmissions: upsertLabSubmissionRow(current.labSubmissions, saved) } : current));
      return saved;
    },
    [learnerId]
  );

  if (error) {
    return (
      <AppShell learnerId={learnerId} onRecoverLearner={recoverLearner} onResetLearner={resetLearner}>
        <EmptyState title="Platform Academy is unavailable." detail={error} />
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell learnerId={learnerId} onRecoverLearner={recoverLearner} onResetLearner={resetLearner}>
        <EmptyState title="Loading Platform Academy..." />
      </AppShell>
    );
  }

  return (
    <AppShell learnerId={learnerId} onRecoverLearner={recoverLearner} onResetLearner={resetLearner}>
      <Routes>
        <RouterRoute path="/" element={<DashboardPage data={data} />} />
        <RouterRoute path="/dashboard/home" element={<DashboardPage data={data} />} />
        <RouterRoute path="/roadmap" element={<RoadmapPage data={data} />} />
        <RouterRoute path="/labs" element={<LabsPage data={data} />} />
        <RouterRoute path="/labs/history" element={<LabEvidenceJournalPage data={data} />} />
        <RouterRoute path="/labs/:slug" element={<LabDetailPage data={data} learnerId={learnerId} onSaveActivity={saveActivity} onSaveLabSubmission={saveLabSubmission} />} />
        <RouterRoute
          path="/interview-prep"
          element={
            data.interviewPrepLoaded ? (
              <InterviewPrepPage data={data} onSaveActivity={saveActivity} />
            ) : (
              <DeferredContentPage title="Loading interview prep..." detail="Scenario packs are loading after the core academy workspace." />
            )
          }
        />
        <RouterRoute
          path="/resources"
          element={
            data.resourcesLoaded ? (
              <ResourcesPage data={data} />
            ) : (
              <DeferredContentPage title="Loading resource library..." detail="Runbooks and references are loading after the core academy workspace." />
            )
          }
        />
        <RouterRoute
          path="/resources/:slug"
          element={
            data.resourcesLoaded ? (
              <ResourceDetailPage data={data} onSaveActivity={saveActivity} />
            ) : (
              <DeferredContentPage title="Loading resource..." detail="The resource library is loading after the core academy workspace." />
            )
          }
        />
        <RouterRoute
          path="/designs"
          element={
            <DesignStylesGate>
              <DesignsIndexPage data={data} />
            </DesignStylesGate>
          }
        />
        <RouterRoute
          path="/designs/:id"
          element={
            <DesignStylesGate>
              <DesignVariantPage data={data} />
            </DesignStylesGate>
          }
        />
        <RouterRoute path="/courses/:courseRef" element={<CoursePage data={data} />} />
        <RouterRoute path="/courses/:courseRef/lessons/:sequence" element={<LessonPage data={data} learnerId={learnerId} onProgressSaved={loadData} />} />
        <RouterRoute path="/lessons/:id" element={<LessonPage data={data} learnerId={learnerId} onProgressSaved={loadData} />} />
        <RouterRoute path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
