import { useState } from 'react';
import {
  ArrowRight, BookOpen, FlaskConical, Clock, BarChart2,
  Layers, Shield, Server, Activity, TrendingUp, MessageSquare,
  CheckCircle2, Circle, Play, Zap
} from 'lucide-react';
import { courses, labs, interviewPacks, lessonDetails } from '../data';
import type { Level, Course } from '../data';
import type { Screen } from '../App';
import { defaultReferenceDashboardProgress, type ReferenceDashboardProgress } from '../../dashboardProgress';
import {
  ACCENT,
  ACCENT_BG,
  AMBER,
  AMBER_BG,
  BG,
  BLUE,
  BLUE_BG,
  BORDER,
  BORDER2,
  GREEN,
  GREEN_BG,
  SURF,
  SURF2,
  TEXT,
  TEXT2,
  TEXT3,
  alpha,
} from '../themeTokens';

const LEVEL_STYLE: Record<Level, { color: string; bg: string }> = {
  Fresher:      { color: GREEN,  bg: GREEN_BG },
  Intermediate: { color: BLUE,   bg: BLUE_BG  },
  Advanced:     { color: AMBER,  bg: AMBER_BG },
};

const TRACK_ICON: Record<string, React.ReactNode> = {
  Kubernetes:        <Layers   size={11} />,
  EKS:               <Server   size={11} />,
  Security:          <Shield   size={11} />,
  Helm:              <BookOpen size={11} />,
  ArgoCD:            <Activity size={11} />,
  AWS:               <Server   size={11} />,
  Terraform:         <Layers   size={11} />,
  Observability:     <BarChart2 size={11} />,
  SRE:               <TrendingUp size={11} />,
  'Incident Response':<Activity size={11} />,
  FinOps:            <TrendingUp size={11} />,
  Platform:          <Layers   size={11} />,
};

interface DashboardProps {
  onNavigate: (s: Screen) => void;
  onOpenLab: (id: number) => void;
  onOpenLesson: (id: number) => void;
  progress?: ReferenceDashboardProgress;
}

export default function Dashboard({ onNavigate, onOpenLab, onOpenLesson, progress }: DashboardProps) {
  const [levelFilter, setLevelFilter] = useState<Level | 'All'>('All');
  const progressSnapshot = progress ?? defaultReferenceDashboardProgress;
  const coursesForDisplay = courses.map((course) => ({
    ...course,
    progress: progress ? progressSnapshot.courseProgressBySlug[course.slug] ?? 0 : course.progress,
  }));

  const currentLab =
    (progressSnapshot.currentLabSlug ? labs.find((l) => l.slug === progressSnapshot.currentLabSlug) : undefined) ||
    labs.find((l) => l.status === 'in-progress') ||
    labs[1] ||
    labs[0];
  const currentLabCompletedSteps = progress ? progressSnapshot.currentLabCompletedSteps : currentLab.checklist.filter((c) => c.completed).length;
  const currentLabTotalSteps = progressSnapshot.currentLabTotalSteps ?? currentLab.checklist.length;
  const currentLesson = progressSnapshot.currentLesson;
  const filteredCourses = levelFilter === 'All' ? coursesForDisplay : coursesForDisplay.filter((c) => c.level === levelFilter);
  const readinessScore  = progressSnapshot.readinessScore;
  const interviewQuestionCount = interviewPacks.reduce((sum, pack) => sum + pack.questionCount, 0);

  const levelCounts = {
    Fresher:      progress ? progressSnapshot.levelTotals.Fresher : coursesForDisplay.filter((c) => c.level === 'Fresher').length,
    Intermediate: progress ? progressSnapshot.levelTotals.Intermediate : coursesForDisplay.filter((c) => c.level === 'Intermediate').length,
    Advanced:     progress ? progressSnapshot.levelTotals.Advanced : coursesForDisplay.filter((c) => c.level === 'Advanced').length,
  };
  const firstLessonIdForCourse = (courseId: number) =>
    lessonDetails.find((lesson) => lesson.courseId === courseId)?.id ?? currentLesson.lessonId;
  const savedPracticeItems =
    progressSnapshot.savedResources || progressSnapshot.practicedQuestions || progressSnapshot.completedLabs
      ? [
          { label: 'RBAC interview Q — revisit', type: 'INTERVIEW' },
          { label: 'EKS VPC CNI deep dive',      type: 'RESOURCE'  },
          { label: 'Rolling update lab',          type: 'LAB'       },
        ]
      : [];

  return (
    <div className="min-h-full" style={{ background: BG, fontFamily: 'var(--font-sans)' }}>
      <div className="max-w-[1280px] mx-auto px-6 py-6 space-y-6">

        {/* ── Status rail ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* Continue lesson */}
          <StatusCard
            label="CONTINUE LESSON"
            labelColor={ACCENT}
            onClick={() => onOpenLesson(currentLesson.lessonId)}
          >
            <p style={{ color: TEXT2, fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
              {currentLesson.courseTitle}
            </p>
            <p style={{ color: TEXT, fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
              {currentLesson.lessonTitle}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <ProgressBar value={currentLesson.progressPct} color={ACCENT} />
              <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                {currentLesson.completedCount}/{currentLesson.total}
              </span>
            </div>
          </StatusCard>

          {/* Lab in progress */}
          <StatusCard
            label={progressSnapshot.currentLabLabel.toUpperCase()}
            labelColor={BLUE}
            onClick={() => onOpenLab(currentLab.id)}
          >
            <p style={{ color: TEXT2, fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
              {currentLab.track} · {currentLab.level}
            </p>
            <p style={{ color: TEXT, fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
              {currentLab.title}
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Tag
                label={currentLab.runtime === 'cluster' ? 'Cluster' : 'File-only'}
                color={BLUE} bg={BLUE_BG}
              />
              <Tag label={progressSnapshot.currentLabStateLabel} color={AMBER} bg={AMBER_BG} />
              <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                {currentLabCompletedSteps}/{currentLabTotalSteps} steps
              </span>
            </div>
          </StatusCard>

          {/* Readiness score */}
          <StatusCard label="READINESS SCORE" labelColor={TEXT3}>
            <div className="flex items-end gap-3 mt-1">
              <span style={{ color: TEXT, fontSize: 44, fontFamily: 'var(--font-mono)', fontWeight: 700, lineHeight: 1 }}>
                {readinessScore}
              </span>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: TEXT3, fontSize: 16, fontFamily: 'var(--font-mono)' }}>/100</span>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {(['Fresher', 'Intermediate', 'Advanced'] as Level[]).map((lvl) => {
                const done = progress
                  ? progressSnapshot.levelCompleted[lvl]
                  : coursesForDisplay.filter((c) => c.level === lvl && c.progress === 100).length;
                const col = LEVEL_STYLE[lvl];
                const total = Math.max(levelCounts[lvl], 1);
                return (
                  <div key={lvl} className="flex items-center gap-2">
                    <span style={{ color: col.color, fontSize: 10, fontFamily: 'var(--font-mono)', width: 88 }}>
                      {lvl}
                    </span>
                    <div className="flex-1 h-px" style={{ background: BORDER2 }}>
                      <div className="h-px" style={{ width: `${(done / total) * 100}%`, background: col.color, opacity: 0.8 }} />
                    </div>
                    <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                      {done}/{levelCounts[lvl]}
                    </span>
                  </div>
                );
              })}
            </div>
            <p style={{ color: TEXT3, fontSize: 11, marginTop: 12 }}>
              {progressSnapshot.readinessMessage}
            </p>
          </StatusCard>
        </div>

        {/* ── Main content ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">

          {/* Curriculum table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>Curriculum</span>
                <span style={{ color: TEXT3, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  21 courses · 84 lessons
                </span>
              </div>
              {/* Level filter */}
              <div
                className="flex items-center rounded-sm border overflow-hidden"
                style={{ borderColor: BORDER }}
              >
                {(['All', 'Fresher', 'Intermediate', 'Advanced'] as const).map((lvl, i) => {
                  const active = levelFilter === lvl;
                  const col = lvl !== 'All' ? LEVEL_STYLE[lvl as Level] : null;
                  return (
                    <button
                      key={lvl}
                      onClick={() => setLevelFilter(lvl)}
                      className="px-2.5 py-1 transition-all"
                      data-active={active ? 'true' : 'false'}
                      style={{
                        background: active ? (col?.bg || SURF2) : 'transparent',
                        color: active ? (col?.color || ACCENT) : TEXT2,
                        fontSize: 10,
                        fontFamily: 'var(--font-sans)',
                        borderLeft: i > 0 ? `1px solid ${BORDER}` : 'none',
                      }}
                    >
                      {lvl === 'All' ? 'All levels' : lvl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div className="rounded-sm border overflow-hidden" style={{ borderColor: BORDER }}>
              {/* Header */}
              <div
                className="grid px-4 py-2 border-b"
                style={{
                  gridTemplateColumns: '20px 1fr 80px 60px 48px',
                  borderColor: BORDER,
                  background: SURF,
                }}
              >
                {['', 'Course', 'Track', 'Level', 'Progress'].map((h) => (
                  <span key={h} style={{ color: TEXT3, fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                    {h}
                  </span>
                ))}
              </div>

              {filteredCourses.map((course, i) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  isLast={i === filteredCourses.length - 1}
                  onClick={() => onOpenLesson(firstLessonIdForCourse(course.id))}
                />
              ))}
            </div>
          </div>

          {/* Right rail */}
          <div className="space-y-3">

            {/* Interview sprint */}
            <Panel label="INTERVIEW SPRINT">
              <p style={{ color: TEXT2, fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                {interviewPacks.length} packs · {interviewQuestionCount} questions
              </p>
              <p style={{ color: TEXT3, fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
                {progressSnapshot.practicedQuestions > 0
                  ? `${progressSnapshot.practicedQuestions} practiced. Focus: Kubernetes Architecture.`
                  : '0 practiced. Start: Kubernetes Architecture.'}
              </p>
              <button
                onClick={() => onNavigate('interview')}
                className="figma-v2-primary-button w-full flex items-center justify-center gap-2 py-2 rounded-sm transition-all"
                style={{ background: ACCENT_BG, color: ACCENT, border: `1px solid ${alpha(ACCENT, 13)}`, fontSize: 11, fontFamily: 'var(--font-mono)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#0F2820')}
                onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT_BG)}
              >
                <Play size={11} /> START PRACTICE
              </button>
            </Panel>

            {/* Platform badges */}
            <Panel label="PLATFORM BADGES">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'k8s',   label: 'K8S',  earned: true  },
                  { id: 'eks',   label: 'EKS',  earned: true  },
                  { id: 'helm',  label: 'HELM', earned: false },
                  { id: 'argo',  label: 'ARGO', earned: false },
                  { id: 'sre',   label: 'SRE',  earned: false },
                  { id: 'tf',    label: 'TF',   earned: false },
                ].map((b) => {
                  const earned = progress ? progressSnapshot.earnedBadgeIds.includes(b.id) : b.earned;
                  return (
                  <div
                    key={b.id}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-sm border"
                    style={{
                      background: earned ? ACCENT_BG : SURF,
                      borderColor: earned ? alpha(ACCENT, 19) : BORDER,
                      opacity: 1,
                    }}
                  >
                    <Zap size={12} style={{ color: earned ? ACCENT : TEXT3 }} />
                    <span style={{ color: earned ? ACCENT : TEXT3, fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                      {b.label}
                    </span>
                  </div>
                  );
                })}
              </div>
            </Panel>

            {/* Saved practice */}
            <Panel label="SAVED">
              <div className="space-y-1">
                {savedPracticeItems.length ? savedPracticeItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-sm"
                  >
                    <span
                      style={{
                        color: item.type === 'LAB' ? BLUE : item.type === 'INTERVIEW' ? AMBER : TEXT2,
                        fontSize: 8,
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.08em',
                        width: 56,
                        flexShrink: 0,
                      }}
                    >
                      {item.type}
                    </span>
                    <span style={{ color: TEXT2, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                  </div>
                )) : (
                  <p style={{ color: TEXT3, fontSize: 12 }}>No saved practice yet.</p>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── sub-components ─────────────────────────────────────────────

function StatusCard({
  label, labelColor, onClick, children,
}: {
  label: string; labelColor: string; onClick?: () => void; children: React.ReactNode;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between mb-3">
        <span
          style={{ color: labelColor, fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.1em' }}
        >
          {label}
        </span>
        {onClick && <ArrowRight size={12} style={{ color: TEXT3 }} className="group-hover:translate-x-0.5 transition-transform" />}
      </div>
      {children}
    </>
  );

  if (onClick) {
    return (
      <button
        aria-label={label}
        className="rounded-sm border p-4 flex flex-col cursor-pointer transition-all duration-150 group text-left"
        style={{ background: SURF, borderColor: BORDER, width: '100%' }}
        onClick={onClick}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = BORDER2)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className="rounded-sm border p-4 flex flex-col transition-all duration-150 group"
      style={{ background: SURF, borderColor: BORDER }}
    >
      {content}
    </div>
  );
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border overflow-hidden" style={{ background: SURF, borderColor: BORDER }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: BORDER }}>
        <span style={{ color: TEXT3, fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.1em' }}>
          {label}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function CourseRow({ course, isLast, onClick }: { course: Course; isLast: boolean; onClick: () => void }) {
  const col    = LEVEL_STYLE[course.level];
  const done   = course.progress === 100;
  const active = course.progress > 0 && !done;

  return (
    <button
      aria-label={`Open course: ${course.title}`}
      className={`grid items-center px-4 py-2.5 cursor-pointer transition-all group ${!isLast ? 'border-b' : ''}`}
      style={{
        gridTemplateColumns: '20px 1fr 80px 60px 48px',
        borderColor: BORDER,
        background: 'transparent',
        textAlign: 'left',
        width: '100%',
      }}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = SURF2)}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      type="button"
    >
      {/* Status dot */}
      <div>
        {done
          ? <CheckCircle2 size={12} style={{ color: GREEN }} />
          : active
            ? <div className="w-2 h-2 rounded-full border" style={{ borderColor: ACCENT, background: ACCENT_BG }} />
            : <Circle size={12} style={{ color: TEXT3 }} />}
      </div>

      {/* Title */}
      <div className="min-w-0 pr-3">
        <div className="flex items-center gap-2">
          <span style={{ color: TEXT2, fontSize: 11 }}>{TRACK_ICON[course.track]}</span>
          <span style={{ color: TEXT, fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {course.title}
          </span>
        </div>
      </div>

      {/* Track */}
      <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {course.track}
      </span>

      {/* Level */}
      <span style={{ color: col.color, fontSize: 9, fontFamily: 'var(--font-sans)', letterSpacing: 0 }}>
        {course.level}
      </span>

      {/* Progress */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-px" style={{ background: BORDER2 }}>
          <div
            className="h-px"
            style={{
              width: `${course.progress}%`,
              background: done ? GREEN : active ? ACCENT : TEXT3,
              opacity: done ? 0.9 : 0.7,
            }}
          />
        </div>
        <span style={{ color: TEXT3, fontSize: 9, fontFamily: 'var(--font-mono)' }}>
          {course.progress}
        </span>
      </div>
    </button>
  );
}

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="px-1.5 py-0.5 rounded-sm"
      style={{ color, background: bg, fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
    >
      {label}
    </span>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex-1 h-px" style={{ background: BORDER2 }}>
      <div className="h-px" style={{ width: `${value}%`, background: color, opacity: 0.8 }} />
    </div>
  );
}
