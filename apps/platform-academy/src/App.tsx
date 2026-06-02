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
  Target,
  Terminal,
  Trash2,
  UserRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useParams } from "react-router-dom";

import { api } from "./api";
import { academyQueryKeys, useAcademyData } from "./api/queries";
import { ActivityToggleButton } from "./components/ActivityToggleButton";
import { AppShell } from "./components/AppShell";
import { CommandBlock } from "./components/CommandBlock";
import { EmptyState } from "./components/EmptyState";
import { LabListSection } from "./components/LabListSection";
import { PortfolioLabBadge } from "./components/labs/PortfolioLabBadge";
import { RichContent } from "./components/RichContent";
import { LabTierBadge } from "./components/ui/LabTierBadge";
import { LevelBadge } from "./components/ui/LevelBadge";
import { ProgressBar } from "./components/ui/ProgressBar";
import { getOrCreateLocalLearnerId, resetLocalLearnerId } from "./learnerIdentity";
import { STUDY_PLANS_RESTORED_EVENT, type InterviewStudyPlan, makeInterviewStudyPlanId, readInterviewStudyPlans, uniqueStrings, writeInterviewStudyPlans } from "./lib/interviewStudyPlans";
import { DeferredContentPage } from "./pages/DeferredContentPage";
import { AppRouter } from "./Router";
import type { AcademyCoreData, AcademyData } from "./types/academy";
import type {
  Course,
  Lesson,
  PlatformAcademyCatalog,
  PlatformActivity,
  PlatformActivityInput,
  PlatformInterviewPrep,
  PlatformLab,
  PlatformLabSubmission,
  PlatformLabSubmissionInput,
  PlatformResource,
  PlatformRoadmapStage,
  PlatformTrack,
  Progress,
  UserDashboard
} from "./types";

type SaveActivity = (activity: PlatformActivityInput) => Promise<PlatformActivity>;
type SaveLabSubmission = (slug: string, submission: PlatformLabSubmissionInput) => Promise<PlatformLabSubmission>;

function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 60_000
      }
    }
  });
}

const levelOrder = ["Fresher", "Intermediate", "Advanced"];
const labTierLabels: Record<PlatformLab["lab_tier"], string> = {
  full: "Full lab",
  guided: "Guided lab",
  "evidence-pack": "Evidence pack"
};
const labTierOrder: PlatformLab["lab_tier"][] = ["full", "guided", "evidence-pack"];
const labRuntimeLabels = {
  All: "All runtimes",
  Cluster: "Cluster setup",
  Files: "File-only"
} as const;
type LabRuntimeFilter = keyof typeof labRuntimeLabels;
const starterLabPath = [
  {
    slug: "trace-service-to-pod",
    label: "Service routing incident",
    proof: "Selector, Pod label, EndpointSlice, fix, and cleanup evidence."
  },
  {
    slug: "debug-crashloop-imagepull",
    label: "First-response triage",
    proof: "CrashLoopBackOff, ImagePullBackOff, previous logs, events, and owner split."
  },
  {
    slug: "review-yaml-before-apply",
    label: "Safe manifest review",
    proof: "Risk inventory, false leads, dry-run boundary, vendor questions, and safer baseline."
  },
  {
    slug: "debug-irsa-access-denied",
    label: "Cloud access handoff",
    proof: "ServiceAccount identity, IAM trust subject, CloudTrail denial, and least-privilege fix."
  }
] as const;
const rubricStatusLabels: Record<string, string> = {
  missing: "Missing",
  "needs-evidence": "Needs evidence",
  passes: "Passes",
  strong: "Strong"
};
const rubricStatusOrder = ["strong", "passes", "needs-evidence", "missing"];

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

function averageLabMinutes(labs: PlatformLab[]) {
  if (labs.length === 0) return 0;
  return Math.round(labs.reduce((total, lab) => total + lab.estimated_minutes, 0) / labs.length);
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
    lines.push("### Rubric Follow-ups");
    if (submission.rubric_feedback.length > 0) {
      for (const item of submission.rubric_feedback) {
        const status = rubricStatusLabels[item.status] ?? item.status;
        lines.push(`- ${status}: ${item.criterion} - ${item.feedback}`);
      }
    } else {
      lines.push("- No rubric follow-ups generated for this saved workbook yet.");
    }
    lines.push("");
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

function LabRuntimeBadge({ lab }: { lab: PlatformLab }) {
  const isCluster = isClusterRunnableLab(lab);
  return <span className={`lab-runtime-badge ${isCluster ? "lab-runtime-cluster" : "lab-runtime-files"}`}>{isCluster ? "Cluster setup included" : "File-only lab"}</span>;
}

type AcademyStats = {
  courses: Course[];
  lessons: Course["lessons"][number][];
  completed: Set<number>;
  totalCompleted: number;
  completionPercent: number;
  recommended?: Course["lessons"][number];
};

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
  if (lower.endsWith("triage-notes.md") || lower.endsWith("hop-trace.md")) return "False-lead review";
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

function labFalseLeadArtifact(lab: PlatformLab) {
  const paths = [...learnerArtifactPaths(lab), ...(lab.artifact_paths ?? [])];
  return paths.find((path) => {
    const name = labArtifactName(path).toLowerCase();
    return name === "triage-notes.md" || name === "hop-trace.md";
  });
}

function progressPercent(done: number, total: number) {
  if (total <= 0) return 100;
  return Math.min(100, Math.round((done / total) * 100));
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

function labWorkbookPhaseRows(lab: PlatformLab, checkedItems: Record<string, boolean>, worksheetAnswers: Record<string, string>) {
  const worksheetItems = lab.worksheet_prompts ?? [];
  const validationItems = lab.validation_checks ?? [];
  const setupSignals = (lab.prerequisites?.length ?? 0) + (lab.setup_commands?.length ?? 0) + labWorkspaceQuickstartCommands(lab).length;
  const answerText = Object.values(worksheetAnswers).join("\n").toLowerCase();
  const falseLeadArtifact = labFalseLeadArtifact(lab);
  const falseLeadArtifactName = falseLeadArtifact ? labArtifactName(falseLeadArtifact) : "";
  const falseLeadCaptured =
    Boolean(falseLeadArtifactName && answerText.includes(falseLeadArtifactName.toLowerCase())) ||
    answerText.includes("false lead") ||
    answerText.includes("triage") ||
    answerText.includes("hop trace");
  const answeredPrompts = worksheetItems.filter((_, index) => worksheetAnswers[`worksheet-${index}`]?.trim()).length;
  const completedValidation = validationItems.filter((_, index) => checkedItems[`validation-${index}`]).length;
  const closeoutIndexes = labCloseoutIndexes(validationItems);
  const completedCloseout = closeoutIndexes.filter(({ index }) => checkedItems[`validation-${index}`]).length;
  const cleanupSignals = (lab.cleanup_commands?.length ?? 0) + (lab.no_cluster_fallback?.length ?? 0);

  return [
    {
      title: "Setup",
      status: setupSignals > 0 ? "Setup ready" : "No setup needed",
      detail: setupSignals > 0 ? `${setupSignals} setup or workspace signals are listed` : "Open the provided evidence files.",
      value: setupSignals > 0 ? 100 : 100,
      icon: Terminal
    },
    {
      title: "False-lead triage",
      status: falseLeadCaptured ? "False leads captured" : "False leads pending",
      detail: falseLeadArtifactName ? `${falseLeadArtifactName} should be cited before diagnosis.` : "No false-lead artifact is advertised.",
      value: falseLeadCaptured ? 100 : 0,
      icon: Search
    },
    {
      title: "Evidence",
      status: `${answeredPrompts}/${worksheetItems.length} prompts answered`,
      detail: worksheetItems.length ? "Worksheet notes drive the rubric feedback." : "No worksheet prompts are advertised.",
      value: progressPercent(answeredPrompts, worksheetItems.length),
      icon: FileText
    },
    {
      title: "Validation",
      status: `${completedValidation}/${validationItems.length} validation checks`,
      detail: validationItems.length ? "Mark checks after commands and evidence pass." : "No validation checklist is advertised.",
      value: progressPercent(completedValidation, validationItems.length),
      icon: CheckCircle2
    },
    {
      title: "Closeout",
      status: closeoutIndexes.length ? `${completedCloseout}/${closeoutIndexes.length} closeout checks` : cleanupSignals ? "Closeout path listed" : "No cleanup needed",
      detail: cleanupSignals ? "Cleanup or no-runtime evidence belongs in the final note." : "Default path has no cleanup action.",
      value: closeoutIndexes.length ? progressPercent(completedCloseout, closeoutIndexes.length) : 100,
      icon: RefreshCcw
    }
  ];
}

function LabWorkbookPhaseStatus({ lab, checkedItems, worksheetAnswers }: { lab: PlatformLab; checkedItems: Record<string, boolean>; worksheetAnswers: Record<string, string> }) {
  const phases = labWorkbookPhaseRows(lab, checkedItems, worksheetAnswers);
  return (
    <section className="lab-phase-status" aria-label="Lab run progress by phase">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Run progress</p>
          <h3>Run progress by phase</h3>
        </div>
        <span>{phases.filter((phase) => phase.value >= 100).length} / {phases.length} ready</span>
      </div>
      <div className="lab-phase-status-grid">
        {phases.map((phase) => {
          const PhaseIcon = phase.icon;
          return (
            <article className="lab-phase-status-row" key={phase.title}>
              <PhaseIcon aria-hidden="true" />
              <div>
                <div className="lab-phase-status-copy">
                  <strong>{phase.title}</strong>
                  <span>{phase.status}</span>
                </div>
                <ProgressBar value={phase.value} />
                <small>{phase.detail}</small>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

type LabCommandStage = {
  id: "setup" | "evidence" | "validation" | "closeout";
  title: string;
  status: string;
  commands: string[];
  icon: LucideIcon;
};

function labCloseoutIndexes(validationItems: string[]) {
  return validationItems
    .map((item, index) => ({ item: item.toLowerCase(), index }))
    .filter(({ item }) => ["cleanup", "no-cluster", "no-aws", "no-live", "no-runtime", "handoff"].some((term) => item.includes(term)));
}

function labCloseoutCommands(lab: PlatformLab) {
  return lab.cleanup_commands?.length ? lab.cleanup_commands : lab.no_cluster_fallback ?? [];
}

function commandCountLabel(count: number) {
  return `${count} ${count === 1 ? "command" : "commands"}`;
}

function labCommandStages(lab: PlatformLab, checkedItems: Record<string, boolean>, worksheetAnswers: Record<string, string>): LabCommandStage[] {
  const worksheetItems = lab.worksheet_prompts ?? [];
  const validationItems = lab.validation_checks ?? [];
  const answeredPrompts = worksheetItems.filter((_, index) => worksheetAnswers[`worksheet-${index}`]?.trim()).length;
  const completedValidation = validationItems.filter((_, index) => checkedItems[`validation-${index}`]).length;
  const closeoutIndexes = labCloseoutIndexes(validationItems);
  const completedCloseout = closeoutIndexes.filter(({ index }) => checkedItems[`validation-${index}`]).length;

  return [
    {
      id: "setup",
      title: "Setup",
      status: commandCountLabel(lab.setup_commands?.length ?? 0),
      commands: lab.setup_commands ?? [],
      icon: Terminal
    },
    {
      id: "evidence",
      title: "Evidence",
      status: `${answeredPrompts}/${worksheetItems.length} notes`,
      commands: lab.commands,
      icon: FileText
    },
    {
      id: "validation",
      title: "Validation",
      status: `${completedValidation}/${validationItems.length} checks`,
      commands: lab.validation_commands ?? [],
      icon: CheckCircle2
    },
    {
      id: "closeout",
      title: "Closeout",
      status: closeoutIndexes.length ? `${completedCloseout}/${closeoutIndexes.length} checks` : labCloseoutCommands(lab).length ? "listed" : "none",
      commands: labCloseoutCommands(lab),
      icon: RefreshCcw
    }
  ];
}

function LabPhaseCommandDeck({ lab, checkedItems, worksheetAnswers }: { lab: PlatformLab; checkedItems: Record<string, boolean>; worksheetAnswers: Record<string, string> }) {
  const stages = labCommandStages(lab, checkedItems, worksheetAnswers);
  const [activeStageId, setActiveStageId] = useState<LabCommandStage["id"]>("setup");
  const activeStage = stages.find((stage) => stage.id === activeStageId) ?? stages[0];

  return (
    <section className="lab-command-deck" aria-label="Lab phase command deck">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Phase commands</p>
          <h3>Copy by lab phase</h3>
        </div>
        <span>{commandCountLabel(activeStage.commands.length)}</span>
      </div>
      <div className="lab-command-tabs" aria-label="Lab command phase">
        {stages.map((stage) => {
          const StageIcon = stage.icon;
          return (
            <button
              aria-label={`${stage.title}: ${stage.status}`}
              aria-pressed={stage.id === activeStage.id}
              className={stage.id === activeStage.id ? "active" : undefined}
              key={stage.id}
              onClick={() => setActiveStageId(stage.id)}
              type="button"
            >
              <StageIcon aria-hidden="true" />
              <strong>{stage.title}</strong>
              <span>{stage.status}</span>
            </button>
          );
        })}
      </div>
      <CommandBlock commands={activeStage.commands} title={`${activeStage.title} commands`} />
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
  const dirtyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    dirtyRef.current = false;
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
        if (cancelled || dirtyRef.current) return;
        setCheckedItems(sanitizeCheckedItems(submission.checked_items, checkedItemIds));
        setWorksheetAnswers(sanitizeWorksheetAnswers(submission.worksheet_answers, worksheetAnswerIds));
        setSavedScore(submission.score);
        setRubricFeedback(submission.rubric_feedback ?? []);
        setEvidenceTerms(submission.evidence_terms ?? []);
        setSaveState("saved");
      })
      .catch(() => {
        if (cancelled || dirtyRef.current) return;
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
  const markDirty = () => {
    dirtyRef.current = true;
    setSaveState((current) => (current === "saving" ? current : "dirty"));
  };
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
      dirtyRef.current = false;
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
      <LabWorkbookPhaseStatus lab={lab} checkedItems={checkedItems} worksheetAnswers={worksheetAnswers} />
      <LabPhaseCommandDeck lab={lab} checkedItems={checkedItems} worksheetAnswers={worksheetAnswers} />
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
        <article>
          <span>Interview bank</span>
          <strong>{data.interviewPrepLoaded ? data.interviewPrep.total_questions : "..."}</strong>
          <small>
            {data.interviewPrepLoaded ? `${practicedQuestions} practiced / ${data.interviewPrep.packs.length} packs` : "Scenario packs loading"}
          </small>
        </article>
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

          <section className="workspace-panel interview-rail-card">
            <p className="eyebrow">Interview sprint</p>
            <h2>{featuredInterviewPack?.title ?? "Scenario packs loading"}</h2>
            <p>{featuredInterviewPack?.focus ?? "Interview drills are loading after the core workspace."}</p>
            <div className="chip-list">
              <span>{featuredInterviewPack ? `${featuredInterviewPack.questions.length} questions` : "Loading packs"}</span>
              <span>{featuredInterviewPack ? `${featuredInterviewPack.official_sources.length} source links` : "Cached offline"}</span>
            </div>
            {featuredInterviewPack && (
              <Link className="text-link" to={`/interview-prep?pack=${featuredInterviewPack.slug}`}>
                Open prep <ArrowRight aria-hidden="true" />
              </Link>
            )}
          </section>

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
  const [selectedRuntime, setSelectedRuntime] = useState<LabRuntimeFilter>("All");
  const completedLabs = completedActivityIds(data.activity, "lab");
  const fullLabCount = data.catalog.labs.filter((lab) => lab.lab_tier === "full").length;
  const portfolioLabCount = data.catalog.labs.filter(isPortfolioLab).length;
  const clusterLabCount = data.catalog.labs.filter(isClusterRunnableLab).length;
  const activeSubmissionCount = data.labSubmissions.filter((submission) => submission.score > 0 || submission.completed_checks > 0 || submission.answered_prompts > 0).length;
  const tierOptions = labTierFilterOptions(data.catalog.labs);
  const filteredLabs = data.catalog.labs.filter(
    (lab) =>
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

      <LabStarterPath data={data} />

      <section className="toolbar compact canonical-toolbar" aria-label="Lab filters">
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
        <span className="lab-duration">
          <Clock aria-hidden="true" />
          {lab.estimated_minutes} min
        </span>
        {completed && <span className="lab-saved-badge">saved</span>}
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

function LabStarterPath({ data }: { data: AcademyData }) {
  const starterLabs = starterLabPath.flatMap((item) => {
    const lab = labForSlug(data, item.slug);
    return lab ? [{ ...item, lab, submission: labSubmissionFor(data, lab.slug) }] : [];
  });

  if (!starterLabs.length) return null;

  return (
    <section className="lab-starter-path" aria-label="Starter incident path">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Starter incident path</p>
          <h2>Begin with live-feeling incidents</h2>
        </div>
        <span>{starterLabs.length} priority labs</span>
      </div>
      <div className="lab-starter-path-grid">
        {starterLabs.map((item, index) => (
          <Link className="lab-starter-step" to={`/labs/${item.lab.slug}`} aria-label={`Open starter lab: ${item.lab.title}`} key={item.lab.slug}>
            <span className="lab-starter-step-number">{index + 1}</span>
            <div>
              <p className="eyebrow">{item.label}</p>
              <strong>{item.lab.title}</strong>
              <span>{item.proof}</span>
              <div className="lab-starter-meta">
                <LabRuntimeBadge lab={item.lab} />
                <LabSubmissionBadge submission={item.submission} />
              </div>
            </div>
            <ArrowRight aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
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
  const visibleResources = filteredResources.slice(0, visibleLimit);
  const hiddenResourceCount = Math.max(filteredResources.length - visibleResources.length, 0);
  const nextPageCount = Math.min(36, hiddenResourceCount);
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
            <RichContent text={lesson.body} />
          </article>

          <section className="practice-panel workspace-panel">
            <div>
              <p className="eyebrow">Lab scenario</p>
              <h2>Practice the lesson</h2>
            </div>
            <RichContent text={lesson.practice_notes} />
          </section>

          <section className="workspace-panel">
            <h2>Key terms</h2>
            <div className="term-grid">
              {lesson.terms.map((term) => (
                <article className="term-card" key={term.id}>
                  <strong>{term.term}</strong>
                  <span>{term.context}</span>
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

function NotFoundPage() {
  return (
    <section className="page canonical-page not-found-page">
      <header className="workspace-header not-found-header">
        <div>
          <p className="eyebrow">Not found</p>
          <h1>Page not found</h1>
          <p className="lead">This route is not available in Platform Academy.</p>
        </div>
        <div className="workspace-actions not-found-actions">
          <Link className="primary-action" to="/dashboard/home">
            <LayoutDashboard aria-hidden="true" />
            Open dashboard
          </Link>
          <Link className="secondary-action" to="/labs">
            <Terminal aria-hidden="true" />
            Open labs
          </Link>
          <Link className="secondary-action" to="/resources">
            <BookMarked aria-hidden="true" />
            Open resources
          </Link>
        </div>
      </header>
      <section className="workspace-panel not-found-panel">
        <h2>Available sections</h2>
        <p>Use the dashboard, lab workspace, or resource library to continue from the current catalog.</p>
      </section>
    </section>
  );
}

function PlatformAcademyApp() {
  const [learnerId, setLearnerId] = useState(getOrCreateLocalLearnerId);
  const queryClient = useQueryClient();
  const { data, error, refetchCore } = useAcademyData(learnerId);
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : "";

  const resetLearner = () => {
    setLearnerId(resetLocalLearnerId());
  };

  const recoverLearner = (restoredLearnerId: string) => {
    setLearnerId(restoredLearnerId);
    void api.saveActivity({ target_type: "guest_recovery", target_id: "profile-restore" }, restoredLearnerId).catch(() => undefined);
  };

  const refreshAcademyData = useCallback(() => {
    void refetchCore();
  }, [refetchCore]);

  const saveActivity = useCallback<SaveActivity>(
    async (activity) => {
      const saved = await api.saveActivity(activity, learnerId);
      queryClient.setQueryData<AcademyCoreData>(academyQueryKeys.core(learnerId), (current) =>
        current ? { ...current, activity: upsertActivityRow(current.activity, saved) } : current
      );
      return saved;
    },
    [learnerId, queryClient]
  );

  const saveLabSubmission = useCallback<SaveLabSubmission>(
    async (slug, submission) => {
      const saved = await api.saveLabSubmission(slug, submission, learnerId);
      queryClient.setQueryData<AcademyCoreData>(academyQueryKeys.core(learnerId), (current) =>
        current ? { ...current, labSubmissions: upsertLabSubmissionRow(current.labSubmissions, saved) } : current
      );
      return saved;
    },
    [learnerId, queryClient]
  );

  if (errorMessage) {
    return (
      <AppShell learnerId={learnerId} onRecoverLearner={recoverLearner} onResetLearner={resetLearner}>
        <EmptyState title="Platform Academy is unavailable." detail={errorMessage} />
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
      <AppRouter
        dashboard={<DashboardPage data={data} />}
        roadmap={<RoadmapPage data={data} />}
        labs={<LabsPage data={data} />}
        labEvidenceJournal={<LabEvidenceJournalPage data={data} />}
        labDetail={<LabDetailPage data={data} learnerId={learnerId} onSaveActivity={saveActivity} onSaveLabSubmission={saveLabSubmission} />}
        interviewPrep={
          data.interviewPrepLoaded ? (
            <InterviewPrepPage data={data} onSaveActivity={saveActivity} />
          ) : (
            <DeferredContentPage title="Loading interview prep..." detail="Scenario packs are loading after the core academy workspace." />
          )
        }
        resources={
          data.resourcesLoaded ? (
            <ResourcesPage data={data} />
          ) : (
            <DeferredContentPage title="Loading resource library..." detail="Runbooks and references are loading after the core academy workspace." />
          )
        }
        resourceDetail={
          data.resourcesLoaded ? (
            <ResourceDetailPage data={data} onSaveActivity={saveActivity} />
          ) : (
            <DeferredContentPage title="Loading resource..." detail="The resource library is loading after the core academy workspace." />
          )
        }
        course={<CoursePage data={data} />}
        lessonByCourseSequence={<LessonPage data={data} learnerId={learnerId} onProgressSaved={refreshAcademyData} />}
        lessonById={<LessonPage data={data} learnerId={learnerId} onProgressSaved={refreshAcademyData} />}
        notFound={<NotFoundPage />}
      />
    </AppShell>
  );
}

export default function App() {
  const [client] = useState(createAppQueryClient);

  return (
    <QueryClientProvider client={client}>
      <PlatformAcademyApp />
    </QueryClientProvider>
  );
}
