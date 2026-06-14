import { useState } from 'react';
import {
  ArrowRight, BookOpen, FlaskConical, ChevronRight, Clock, BarChart2,
  Layers, Shield, Server, Activity, TrendingUp, MessageSquare, Star,
  CheckCircle2, Circle, Play
} from 'lucide-react';
import { courses, labs, interviewPacks, lessonDetails } from '../data';
import type { Level, Course } from '../data';
import type { Screen } from '../App';
import { defaultReferenceDashboardProgress, type ReferenceDashboardProgress } from '../../dashboardProgress';

const LEVEL_COLORS: Record<Level, { bg: string; text: string; dot: string }> = {
  Fresher: { bg: '#DCFCE7', text: '#166534', dot: '#16A34A' },
  Intermediate: { bg: '#DBEAFE', text: '#1E40AF', dot: '#2563EB' },
  Advanced: { bg: '#FEF3C7', text: '#92400E', dot: '#D97706' },
};

const TRACK_ICONS: Record<string, React.ReactNode> = {
  Kubernetes: <Layers size={13} />,
  EKS: <Server size={13} />,
  Security: <Shield size={13} />,
  Helm: <BookOpen size={13} />,
  ArgoCD: <Activity size={13} />,
  AWS: <Server size={13} />,
  Terraform: <Layers size={13} />,
  Observability: <BarChart2 size={13} />,
  SRE: <TrendingUp size={13} />,
  'Incident Response': <Activity size={13} />,
  FinOps: <TrendingUp size={13} />,
  Platform: <Layers size={13} />,
};

const platforms = [
  { id: 'k8s', label: 'Kubernetes', icon: '⎈', earned: true },
  { id: 'eks', label: 'EKS', icon: 'AWS', earned: true },
  { id: 'helm', label: 'Helm', icon: '⛵', earned: false },
  { id: 'argocd', label: 'ArgoCD', icon: '⟳', earned: false },
  { id: 'sre', label: 'SRE', icon: '◎', earned: false },
  { id: 'tf', label: 'Terraform', icon: '◆', earned: false },
];

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
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

  const filteredCourses = levelFilter === 'All'
    ? coursesForDisplay
    : coursesForDisplay.filter((c) => c.level === levelFilter);

  const levelCounts = {
    Fresher: progress ? progressSnapshot.levelTotals.Fresher : coursesForDisplay.filter((c) => c.level === 'Fresher').length,
    Intermediate: progress ? progressSnapshot.levelTotals.Intermediate : coursesForDisplay.filter((c) => c.level === 'Intermediate').length,
    Advanced: progress ? progressSnapshot.levelTotals.Advanced : coursesForDisplay.filter((c) => c.level === 'Advanced').length,
  };

  const readinessScore = progressSnapshot.readinessScore;
  const interviewQuestionCount = interviewPacks.reduce((sum, pack) => sum + pack.questionCount, 0);
  const firstLessonIdForCourse = (courseId: number) =>
    lessonDetails.find((lesson) => lesson.courseId === courseId)?.id ?? currentLesson.lessonId;
  const savedPracticeItems =
    progressSnapshot.savedResources || progressSnapshot.practicedQuestions || progressSnapshot.completedLabs
      ? [
          { label: 'RBAC interview Q — revisit', type: 'interview' },
          { label: 'EKS VPC CNI deep dive', type: 'resource' },
          { label: 'Rolling update lab', type: 'lab' },
        ]
      : [];

  return (
    <div className="min-h-full" style={{ background: '#F4F4F1' }}>
      <div className="max-w-[1280px] mx-auto px-6 py-6">

        {/* Status strip — not a hero banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Continue lesson */}
          <div
            className="rounded-lg border p-4 flex flex-col gap-3 cursor-pointer group"
            style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}
            onClick={() => onOpenLesson(currentLesson.lessonId)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BookOpen size={13} style={{ color: '#0D9488' }} />
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#0D9488' }}>
                  Continue Lesson
                </span>
              </div>
              <ChevronRight size={14} style={{ color: '#C4C4BC' }} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div>
              <p className="text-[11px] mb-0.5" style={{ color: '#8A9690' }}>{currentLesson.courseTitle}</p>
              <p className="text-[14px] font-semibold leading-snug" style={{ color: '#1A1D1B' }}>{currentLesson.lessonTitle}</p>
              <p className="text-[11px] mt-1" style={{ color: '#8A9690' }}>
                Lesson {currentLesson.lessonNum} of {currentLesson.total}
              </p>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#E2E2DC' }}>
              <div className="h-full rounded-full" style={{ width: `${currentLesson.progressPct}%`, background: '#0D9488' }} />
            </div>
          </div>

          {/* Continue lab */}
          <div
            className="rounded-lg border p-4 flex flex-col gap-3 cursor-pointer group"
            style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}
            onClick={() => onOpenLab(currentLab.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FlaskConical size={13} style={{ color: '#2563EB' }} />
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#2563EB' }}>
                  {progressSnapshot.currentLabLabel}
                </span>
              </div>
              <ChevronRight size={14} style={{ color: '#C4C4BC' }} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div>
              <p className="text-[11px] mb-0.5" style={{ color: '#8A9690' }}>{currentLab.track} · {currentLab.level}</p>
              <p className="text-[14px] font-semibold leading-snug" style={{ color: '#1A1D1B' }}>{currentLab.title}</p>
              <p className="text-[11px] mt-1" style={{ color: '#8A9690' }}>
                {currentLabCompletedSteps}/{currentLabTotalSteps} steps completed
              </p>
            </div>
            <div className="flex gap-1.5">
              <RuntimeBadge runtime={currentLab.runtime} />
              <span
                className="px-2 py-0.5 rounded text-[10px] font-medium"
                style={{ background: '#FEF3C7', color: '#92400E' }}
              >
                {progressSnapshot.currentLabStateLabel}
              </span>
            </div>
          </div>

          {/* Readiness score */}
          <div
            className="rounded-lg border p-4 flex flex-col gap-3"
            style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}
          >
            <div className="flex items-center gap-1.5">
              <BarChart2 size={13} style={{ color: '#8A9690' }} />
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#8A9690' }}>
                Readiness Score
              </span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-[36px] font-bold leading-none tabular-nums" style={{ color: '#1A1D1B' }}>
                {readinessScore}
              </span>
              <span className="text-[14px] mb-1" style={{ color: '#8A9690' }}>/100</span>
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-1" style={{ color: '#8A9690' }}>
                <span>Beginner</span><span>Intermediate</span><span>Senior</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E2E2DC' }}>
                <div className="h-full rounded-full" style={{ width: `${readinessScore}%`, background: '#0D9488' }} />
              </div>
            </div>
            <p className="text-[11px]" style={{ color: '#6B7870' }}>
              {progressSnapshot.readinessMessage}
            </p>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Left: course list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold" style={{ color: '#1A1D1B' }}>
                Curriculum · {courses.length} Courses
              </h2>
              {/* Level filter */}
              <div className="flex items-center gap-1 p-0.5 rounded-md border" style={{ background: '#F0F0EC', borderColor: '#E2E2DC' }}>
                {(['All', 'Fresher', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevelFilter(lvl)}
                    className="px-2.5 py-1 rounded text-[11px] font-medium transition-all"
                    style={{
                      background: levelFilter === lvl ? '#FFFFFF' : 'transparent',
                      color: levelFilter === lvl ? '#1A1D1B' : '#6B7870',
                      boxShadow: levelFilter === lvl ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    {lvl === 'All' ? `All` : lvl}
                    {lvl !== 'All' && (
                      <span className="ml-1" style={{ color: '#9BA8A0' }}>
                        {levelCounts[lvl as Level]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="rounded-lg border overflow-hidden"
              style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}
            >
                {filteredCourses.map((course, i) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  isLast={i === filteredCourses.length - 1}
                  onNavigate={() => onOpenLesson(firstLessonIdForCourse(course.id))}
                />
              ))}
            </div>
          </div>

          {/* Right rail */}
          <div className="space-y-4">
            {/* Interview sprint */}
            <div
              className="rounded-lg border p-4"
              style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}
            >
              <div className="flex items-center gap-1.5 mb-3">
                <MessageSquare size={13} style={{ color: '#8A9690' }} />
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#8A9690' }}>
                  Interview Sprint
                </span>
              </div>
              <p className="text-[13px] font-medium mb-1" style={{ color: '#1A1D1B' }}>
                {interviewPacks.length} packs · {interviewQuestionCount} questions
              </p>
              <p className="text-[12px] mb-3" style={{ color: '#6B7870' }}>
                {progressSnapshot.practicedQuestions > 0
                  ? `${progressSnapshot.practicedQuestions} questions practiced. Focus on Kubernetes Architecture next.`
                  : 'No questions practiced yet. Start with Kubernetes Architecture.'}
              </p>
              <button
                onClick={() => onNavigate('interview')}
                className="figma-v1-primary-button w-full py-2 px-3 rounded-md text-[12px] font-semibold flex items-center justify-center gap-2 transition-colors"
                style={{ background: '#0D9488', color: '#FFFFFF' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#0F766E')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#0D9488')}
              >
                <Play size={12} /> Start Practice Session
              </button>
            </div>

            {/* Level coverage */}
            <div
              className="rounded-lg border p-4"
              style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#8A9690' }}>
                Level Coverage
              </p>
              <div className="space-y-2.5">
                {Object.entries(levelCounts).map(([level, count]) => {
                  const col = LEVEL_COLORS[level as Level];
                  const completedCount = progress
                    ? progressSnapshot.levelCompleted[level as Level]
                    : coursesForDisplay.filter((c) => c.level === level && c.progress === 100).length;
                  const totalCount = Math.max(count, 1);
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <span
                        className="w-[80px] text-[11px] font-medium shrink-0"
                        style={{ color: col.text }}
                      >
                        {level}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#F0F0EC' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(completedCount / totalCount) * 100}%`, background: col.dot }}
                        />
                      </div>
                      <span className="text-[11px] tabular-nums shrink-0" style={{ color: '#8A9690' }}>
                        {completedCount}/{count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform badges */}
            <div
              className="rounded-lg border p-4"
              style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#8A9690' }}>
                Platform Badges
              </p>
              <div className="grid grid-cols-3 gap-2">
                {platforms.map((p) => {
                  const earned = progress ? progressSnapshot.earnedBadgeIds.includes(p.id) : p.earned;
                  return (
                  <div
                    key={p.id}
                    className="flex flex-col items-center gap-1.5 py-2 rounded-md"
                    style={{
                      background: earned ? '#DDFAF6' : '#F7F7F4',
                      opacity: earned ? 1 : 0.6,
                    }}
                  >
                    <span className="text-[16px]">{p.icon}</span>
                    <span className="text-[9px] font-medium" style={{ color: earned ? '#0F766E' : '#8A9690' }}>
                      {p.label}
                    </span>
                    {earned && <Star size={8} fill="#0D9488" style={{ color: '#0D9488' }} />}
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Saved practice */}
            <div
              className="rounded-lg border p-4"
              style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#8A9690' }}>
                Saved Practice
              </p>
              <div className="space-y-2">
                {savedPracticeItems.length ? savedPracticeItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer"
                    style={{ color: '#4A5650' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F0F0EC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span
                      className="w-[52px] text-[9px] font-semibold uppercase tracking-wider shrink-0 text-center px-1 py-0.5 rounded"
                      style={{
                        background: item.type === 'lab' ? '#EFF6FF' : item.type === 'interview' ? '#FEF3C7' : '#F0F0EC',
                        color: item.type === 'lab' ? '#1E40AF' : item.type === 'interview' ? '#92400E' : '#4A5650',
                      }}
                    >
                      {item.type}
                    </span>
                    <span className="text-[12px] truncate">{item.label}</span>
                  </div>
                )) : (
                  <p className="text-[12px]" style={{ color: '#8A9690' }}>No saved practice yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseRow({ course, isLast, onNavigate }: { course: Course; isLast: boolean; onNavigate: () => void }) {
  const col = LEVEL_COLORS[course.level];
  const isComplete = course.progress === 100;
  const hasStarted = course.progress > 0;

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 cursor-pointer group transition-colors ${!isLast ? 'border-b' : ''}`}
      style={{ borderColor: '#F0F0EC' }}
      onClick={onNavigate}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAF7')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Completion icon */}
      <div className="shrink-0">
        {isComplete
          ? <CheckCircle2 size={16} style={{ color: '#0D9488' }} />
          : hasStarted
            ? <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#0D9488' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0D9488' }} />
              </div>
            : <Circle size={16} style={{ color: '#C4C4BC' }} />
        }
      </div>

      {/* Track icon */}
      <div
        className="w-7 h-7 rounded flex items-center justify-center shrink-0"
        style={{ background: '#F0F0EC', color: '#6B7870' }}
      >
        {TRACK_ICONS[course.track] || <Layers size={13} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-medium truncate" style={{ color: '#1A1D1B' }}>
            {course.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px]" style={{ color: '#8A9690' }}>
            {course.track}
          </span>
          <span className="text-[11px]" style={{ color: '#C4C4BC' }}>·</span>
          <span className="text-[11px]" style={{ color: '#8A9690' }}>
            {course.lessons} lessons · {course.labs} lab
          </span>
          <span className="text-[11px]" style={{ color: '#C4C4BC' }}>·</span>
          <span className="flex items-center gap-1 text-[11px]" style={{ color: '#8A9690' }}>
            <Clock size={10} /> {course.duration}m
          </span>
        </div>
      </div>

      {/* Level badge */}
      <span
        className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium"
        style={{ background: col.bg, color: col.text }}
      >
        {course.level}
      </span>

      {/* Progress */}
      <div className="shrink-0 w-16 hidden md:block">
        <div className="flex justify-between text-[10px] mb-1" style={{ color: '#9BA8A0' }}>
          <span>{course.progress}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: '#E2E2DC' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${course.progress}%`,
              background: isComplete ? '#0D9488' : '#2563EB',
            }}
          />
        </div>
      </div>

      <ArrowRight size={13} style={{ color: '#C4C4BC' }} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </div>
  );
}

function RuntimeBadge({ runtime }: { runtime: 'cluster' | 'file-only' }) {
  return (
    <span
      className="px-2 py-0.5 rounded text-[10px] font-medium"
      style={
        runtime === 'cluster'
          ? { background: '#EFF6FF', color: '#1E40AF' }
          : { background: '#F0F0EC', color: '#4A5650' }
      }
    >
      {runtime === 'cluster' ? 'Cluster setup' : 'File-only'}
    </span>
  );
}
