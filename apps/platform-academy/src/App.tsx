import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "./api";
import { useAcademyData } from "./api/queries";
import { AppShell, type AppShellProgressSummary } from "./components/AppShell";
import {
  ReferenceFigmaDashboard,
  ReferenceFigmaInterviewPrep,
  ReferenceFigmaLabDetail,
  ReferenceFigmaLabs,
  ReferenceFigmaLesson,
  ReferenceFigmaResourceDetail,
  ReferenceFigmaResources,
  ReferenceFigmaRoadmap,
  ReferenceFigmaStatus
} from "./components/ReferenceFigmaScreens";
import type { ReferenceDashboardProgress, ReferenceLevel } from "./components/reference-figma/dashboardProgress";
import { referenceContentCounts } from "./components/reference-figma/contentCounts";
import {
  clearReferenceProgressStorage,
  readReferenceProgressSnapshot,
  REFERENCE_PROGRESS_EVENT,
  type ReferenceProgressSnapshot
} from "./components/reference-figma/localProgress";
import { getOrCreateLocalLearnerId, resetLocalLearnerId } from "./learnerIdentity";
import { clearInterviewStudyPlans, STUDY_PLANS_RESTORED_EVENT } from "./lib/interviewStudyPlans";
import { DeferredContentPage } from "./pages/DeferredContentPage";
import { AppRouter } from "./Router";
import type { AcademyData } from "./types/academy";
import type { Course, PlatformLabSubmission } from "./types";

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

function allCourses(data: AcademyData) {
  return data.catalog.levels.flatMap((level) => level.courses);
}

function completedLessonIds(data: AcademyData) {
  return new Set(data.progress.filter((row) => row.completed).map((row) => row.lesson_id));
}

function completedActivityIds(data: AcademyData, targetType: string) {
  return new Set(data.activity.filter((row) => row.target_type === targetType && row.state === "completed").map((row) => row.target_id));
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

function courseForLesson(data: AcademyData, lessonId: number) {
  return allCourses(data).find((course) => course.lessons.some((lesson) => lesson.id === lessonId));
}

function labForSlug(data: AcademyData, slug: string) {
  return data.catalog.labs.find((lab) => lab.slug === slug);
}

const emptyReferenceProgress: ReferenceProgressSnapshot = {
  submittedLabSlugs: [],
  practicedQuestionIds: []
};

type AcademyStats = {
  courses: Course[];
  lessons: Course["lessons"][number][];
  completed: Set<number>;
  totalCompleted: number;
  recommended?: Course["lessons"][number];
};

function getAcademyStats(data: AcademyData): AcademyStats {
  const courses = allCourses(data);
  const lessons = courses.flatMap((course) => course.lessons);
  const completed = completedLessonIds(data);
  const totalCompleted = lessons.filter((lesson) => completed.has(lesson.id)).length;

  return {
    courses,
    lessons,
    completed,
    totalCompleted,
    recommended: nextLesson(courses, completed)
  };
}

const referenceLevels: ReferenceLevel[] = ["Fresher", "Intermediate", "Advanced"];

function referenceLevelForCourse(data: AcademyData, course: Course): ReferenceLevel {
  const trackLevel = data.catalog.tracks.find((track) => track.course.slug === course.slug)?.level_group ?? course.level;
  const normalized = String(trackLevel).toLowerCase();
  if (normalized.includes("advanced") || normalized.includes("senior")) return "Advanced";
  if (normalized.includes("intermediate")) return "Intermediate";
  return "Fresher";
}

function readinessScoreFromCounts({
  completedLessons,
  completedLabs,
  savedResources,
  practicedQuestions
}: {
  completedLessons: number;
  completedLabs: number;
  savedResources: number;
  practicedQuestions: number;
}) {
  return Math.min(100, completedLessons * 3 + completedLabs * 12 + savedResources + practicedQuestions * 2);
}

function readinessMessageFor(score: number, completedLessons: number, completedLabs: number, practicedQuestions: number) {
  if (score <= 0) return "Start one lesson or lab to build readiness.";
  if (score >= 80) return "Keep polishing portfolio labs and senior interview drills.";
  if (score >= 50) return "Add one portfolio lab and one interview pack to push toward senior.";

  const labsNeeded = Math.max(1, Math.ceil((50 - score) / 12));
  const lessonNudge = completedLessons === 0 ? " and 1 lesson" : "";
  const interviewNudge = practicedQuestions === 0 ? " plus 1 interview pack" : "";
  return `Complete ${labsNeeded} more ${labsNeeded === 1 ? "lab" : "labs"}${lessonNudge}${interviewNudge} to reach 50.`;
}

function completedLabSlugs(data: AcademyData, referenceProgress: ReferenceProgressSnapshot = emptyReferenceProgress) {
  const slugs = new Set(completedActivityIds(data, "lab"));
  for (const submission of data.labSubmissions) {
    if (submission.status === "submitted" || submission.score >= 100) slugs.add(submission.lab_slug);
  }
  for (const slug of referenceProgress.submittedLabSlugs) slugs.add(slug);
  return slugs;
}

function practicedQuestionCount(data: AcademyData, referenceProgress: ReferenceProgressSnapshot = emptyReferenceProgress) {
  return Math.max(completedActivityIds(data, "interview_question").size, referenceProgress.practicedQuestionIds.length);
}

function getLearnerProgressSummary(data: AcademyData, referenceProgress: ReferenceProgressSnapshot = emptyReferenceProgress): AppShellProgressSummary {
  const stats = getAcademyStats(data);
  const completedLabs = completedLabSlugs(data, referenceProgress).size;
  const savedResources = completedActivityIds(data, "resource").size;
  const practicedQuestions = practicedQuestionCount(data, referenceProgress);
  const readinessScore = readinessScoreFromCounts({
    completedLessons: stats.totalCompleted,
    completedLabs,
    savedResources,
    practicedQuestions
  });

  return {
    completedLessons: stats.totalCompleted,
    totalLessons: referenceContentCounts.lessons,
    completedLabs,
    totalLabs: referenceContentCounts.labs,
    savedResources,
    totalResources: referenceContentCounts.resources,
    practicedQuestions,
    totalInterviewQuestions: referenceContentCounts.interviewQuestions,
    readinessScore
  };
}

function hasLabSubmissionEvidence(submission: PlatformLabSubmission) {
  return (
    submission.score > 0 ||
    submission.completed_checks > 0 ||
    submission.answered_prompts > 0 ||
    submission.status === "submitted" ||
    submission.evidence_terms.length > 0 ||
    Object.values(submission.checked_items).some(Boolean) ||
    Object.values(submission.worksheet_answers).some((value) => value.trim().length > 0)
  );
}

function sortNewestLabSubmissions(submissions: PlatformLabSubmission[]) {
  return [...submissions].sort((left, right) => {
    const rightTime = Date.parse(right.updated_at || right.created_at || "");
    const leftTime = Date.parse(left.updated_at || left.created_at || "");
    return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
  });
}

function getReferenceDashboardProgress(data: AcademyData, referenceProgress: ReferenceProgressSnapshot = emptyReferenceProgress): ReferenceDashboardProgress {
  const stats = getAcademyStats(data);
  const recommendedLesson = stats.recommended ?? stats.lessons[0];
  const recommendedCourse = recommendedLesson ? courseForLesson(data, recommendedLesson.id) : stats.courses[0];
  const recommendedCourseProgress = recommendedCourse ? courseProgress(recommendedCourse, stats.completed) : { done: 0, total: 0, percent: 0 };
  const labSlugs = completedLabSlugs(data, referenceProgress);
  const savedResources = completedActivityIds(data, "resource").size;
  const practicedQuestions = practicedQuestionCount(data, referenceProgress);
  const readinessScore = readinessScoreFromCounts({
    completedLessons: stats.totalCompleted,
    completedLabs: labSlugs.size,
    savedResources,
    practicedQuestions
  });
  const courseProgressBySlug = Object.fromEntries(stats.courses.map((course) => [course.slug, courseProgress(course, stats.completed).percent]));
  const levelCompleted = Object.fromEntries(referenceLevels.map((level) => [level, 0])) as Record<ReferenceLevel, number>;
  const levelTotals = Object.fromEntries(referenceLevels.map((level) => [level, 0])) as Record<ReferenceLevel, number>;

  for (const course of stats.courses) {
    const level = referenceLevelForCourse(data, course);
    const progress = courseProgress(course, stats.completed);
    levelTotals[level] += 1;
    if (progress.total > 0 && progress.done === progress.total) levelCompleted[level] += 1;
  }

  const activeLabSubmission = sortNewestLabSubmissions(data.labSubmissions.filter(hasLabSubmissionEvidence))[0];
  const activeLab = activeLabSubmission ? labForSlug(data, activeLabSubmission.lab_slug) : undefined;
  const recommendedLab = activeLab ?? data.catalog.labs.find((lab) => lab.lesson_id === recommendedLesson?.id) ?? data.catalog.labs[0];
  const hasActiveLab = Boolean(activeLabSubmission);
  const earnedBadgeIds = new Set<string>();
  const addBadgeForText = (text: string) => {
    const normalized = text.toLowerCase();
    if (normalized.includes("kubernetes")) earnedBadgeIds.add("k8s");
    if (normalized.includes("eks")) earnedBadgeIds.add("eks");
    if (normalized.includes("helm")) earnedBadgeIds.add("helm");
    if (normalized.includes("argocd") || normalized.includes("argo")) earnedBadgeIds.add("argo");
    if (normalized.includes("sre") || normalized.includes("reliability")) earnedBadgeIds.add("sre");
    if (normalized.includes("terraform")) earnedBadgeIds.add("tf");
  };

  for (const course of stats.courses) {
    const progress = courseProgress(course, stats.completed);
    if (progress.total > 0 && progress.done === progress.total) addBadgeForText(`${course.title} ${course.category}`);
  }
  for (const slug of labSlugs) {
    const lab = labForSlug(data, slug);
    if (lab) addBadgeForText(`${lab.title} ${lab.track}`);
  }

  return {
    currentLesson: {
      courseTitle: recommendedCourse?.title ?? "Platform Academy",
      lessonTitle: recommendedLesson?.title ?? "Start your first lesson",
      lessonNum: recommendedLesson?.sequence ?? Math.min(recommendedCourseProgress.done + 1, recommendedCourseProgress.total || 1),
      completedCount: recommendedCourseProgress.done,
      total: recommendedCourseProgress.total || recommendedCourse?.lessons.length || 1,
      progressPct: recommendedCourseProgress.percent,
      lessonId: recommendedLesson?.id ?? recommendedCourse?.lessons[0]?.id ?? 1
    },
    currentLabSlug: recommendedLab?.slug,
    currentLabLabel: hasActiveLab && activeLabSubmission?.status === "submitted" ? "Completed Lab" : hasActiveLab ? "Lab In Progress" : "Start Lab",
    currentLabStateLabel: hasActiveLab ? (activeLabSubmission?.status === "submitted" ? "Submitted" : "In progress") : "Ready",
    currentLabCompletedSteps: activeLabSubmission?.completed_checks ?? 0,
    currentLabTotalSteps: activeLabSubmission?.total_checks || recommendedLab?.checklist.length || 0,
    completedLessons: stats.totalCompleted,
    completedLabs: labSlugs.size,
    savedResources,
    practicedQuestions,
    readinessScore,
    readinessMessage: readinessMessageFor(readinessScore, stats.totalCompleted, labSlugs.size, practicedQuestions),
    levelCompleted,
    levelTotals,
    courseProgressBySlug,
    earnedBadgeIds: Array.from(earnedBadgeIds)
  };
}

function DashboardPage({ data, referenceProgress }: { data: AcademyData; referenceProgress: ReferenceProgressSnapshot }) {
  const progress = useMemo(() => getReferenceDashboardProgress(data, referenceProgress), [data, referenceProgress]);
  return <ReferenceFigmaDashboard progress={progress} />;
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
            Open dashboard
          </Link>
          <Link className="secondary-action" to="/labs">
            Open labs
          </Link>
          <Link className="secondary-action" to="/resources">
            Open resources
          </Link>
        </div>
      </header>
    </section>
  );
}

function PlatformAcademyApp() {
  const [learnerId, setLearnerId] = useState(getOrCreateLocalLearnerId);
  const [referenceProgressVersion, setReferenceProgressVersion] = useState(0);
  const queryClient = useQueryClient();
  const { data, error } = useAcademyData(learnerId);
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : "";
  const referenceProgress = useMemo(() => readReferenceProgressSnapshot(), [referenceProgressVersion]);

  useEffect(() => {
    const refreshReferenceProgress = () => setReferenceProgressVersion((version) => version + 1);
    window.addEventListener(REFERENCE_PROGRESS_EVENT, refreshReferenceProgress);
    window.addEventListener("storage", refreshReferenceProgress);
    return () => {
      window.removeEventListener(REFERENCE_PROGRESS_EVENT, refreshReferenceProgress);
      window.removeEventListener("storage", refreshReferenceProgress);
    };
  }, []);

  const resetLearner = () => {
    clearInterviewStudyPlans();
    clearReferenceProgressStorage();
    window.dispatchEvent(new Event(STUDY_PLANS_RESTORED_EVENT));
    queryClient.clear();
    setLearnerId(resetLocalLearnerId());
  };

  const recoverLearner = (restoredLearnerId: string) => {
    queryClient.clear();
    setLearnerId(restoredLearnerId);
    void api.saveActivity({ target_type: "guest_recovery", target_id: "profile-restore" }, restoredLearnerId).catch(() => undefined);
  };

  if (errorMessage) {
    return (
      <AppShell learnerId={learnerId} onRecoverLearner={recoverLearner} onResetLearner={resetLearner}>
        <ReferenceFigmaStatus title="Platform Academy is unavailable" detail={errorMessage} tone="error" />
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell learnerId={learnerId} onRecoverLearner={recoverLearner} onResetLearner={resetLearner}>
        <ReferenceFigmaStatus title="Loading workspace" detail="Preparing your dashboard, labs, resources, and interview queue." />
      </AppShell>
    );
  }

  const progressSummary = getLearnerProgressSummary(data, referenceProgress);

  return (
    <AppShell learnerId={learnerId} onRecoverLearner={recoverLearner} onResetLearner={resetLearner} progressSummary={progressSummary}>
      <AppRouter
        dashboard={<DashboardPage data={data} referenceProgress={referenceProgress} />}
        roadmap={<ReferenceFigmaRoadmap />}
        labs={<ReferenceFigmaLabs />}
        labEvidenceJournal={<ReferenceFigmaLabs />}
        labDetail={<ReferenceFigmaLabDetail />}
        interviewPrep={
          data.interviewPrepLoaded ? (
            <ReferenceFigmaInterviewPrep />
          ) : (
            <DeferredContentPage title="Loading interview prep..." detail="Scenario packs are loading after the core academy workspace." />
          )
        }
        resources={
          data.resourcesLoaded ? (
            <ReferenceFigmaResources />
          ) : (
            <DeferredContentPage title="Loading resource library..." detail="Runbooks and references are loading after the core academy workspace." />
          )
        }
        resourceDetail={
          data.resourcesLoaded ? (
            <ReferenceFigmaResourceDetail />
          ) : (
            <DeferredContentPage title="Loading resource..." detail="The resource library is loading after the core academy workspace." />
          )
        }
        course={<ReferenceFigmaLesson />}
        lessonByCourseSequence={<ReferenceFigmaLesson />}
        lessonById={<ReferenceFigmaLesson />}
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
