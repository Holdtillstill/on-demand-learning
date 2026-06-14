import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, CheckCircle2, BookOpen, FlaskConical,
  ChevronRight, RotateCcw, ChevronDown, ChevronUp
} from 'lucide-react';
import { lessonDetails } from '../data';
import type { Level, LessonDetail } from '../data';

interface LessonReaderProps {
  onBack: () => void;
  lessonId?: number;
  onOpenLesson?: (lessonId: number) => void;
  onOpenRelatedLab?: (lessonId: number) => void;
}

const LEVEL_COLORS: Record<Level, { bg: string; text: string }> = {
  Fresher: { bg: '#DCFCE7', text: '#166534' },
  Intermediate: { bg: '#DBEAFE', text: '#1E40AF' },
  Advanced: { bg: '#FEF3C7', text: '#92400E' },
};

const GLOSSARY_TERMS = [
  { term: 'NetworkPolicy', def: 'A Kubernetes resource that controls how pods communicate with each other and with external endpoints using label selectors.' },
  { term: 'CNI', def: 'Container Network Interface — a specification and set of libraries for configuring network interfaces in Linux containers.' },
  { term: 'Egress', def: 'Outbound traffic from a pod to other pods, services, or external endpoints.' },
  { term: 'Ingress (policy)', def: 'Inbound traffic rules to a pod from other pods or external sources. Not to be confused with the Kubernetes Ingress resource.' },
  { term: 'Namespace isolation', def: 'A pattern using NetworkPolicy to prevent cross-namespace traffic by default, enforcing least-privilege network access.' },
  { term: 'PodSelector', def: 'A label selector within a NetworkPolicy that identifies which pods the policy applies to.' },
];

const FLASHCARDS = [
  { q: 'What does a NetworkPolicy with an empty podSelector ({}) select?', a: 'All pods in the namespace.' },
  { q: 'Which direction does a default-deny NetworkPolicy apply to?', a: 'Only the direction specified: ingress, egress, or both.' },
  { q: 'Can a NetworkPolicy block traffic to kube-dns?', a: 'Yes, if egress rules do not allow UDP/TCP 53 to kube-system.' },
  { q: 'What CNI plugin supports NetworkPolicy in EKS?', a: 'The AWS VPC CNI plugin does not enforce NetworkPolicy natively; Calico or Cilium must be installed.' },
];

type LessonBlock = { type: 'text' | 'code'; text: string };
type LessonBodySection = { title: string; blocks: LessonBlock[] };

function findLesson(lessonId?: number) {
  return lessonDetails.find((lesson) => lesson.id === lessonId) ?? lessonDetails[0];
}

function courseLessonsFor(lesson: LessonDetail) {
  return lessonDetails
    .filter((item) => item.courseId === lesson.courseId)
    .sort((a, b) => a.sequence - b.sequence);
}

function cleanMarkdown(text: string) {
  return text
    .replace(/^[-*]\\s+/gm, '- ')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function splitLessonBody(body: string): LessonBodySection[] {
  const sections: LessonBodySection[] = [];
  let current: LessonBodySection = { title: 'Overview', blocks: [] };
  let pending: string[] = [];
  let pendingType: 'text' | 'code' = 'text';

  const flush = () => {
    const text = pending.join('\\n').trim();
    if (text) current.blocks.push({ type: pendingType, text: cleanMarkdown(text) });
    pending = [];
  };

  for (const line of body.split('\\n')) {
    if (line.startsWith('## ')) {
      flush();
      if (current.blocks.length) sections.push(current);
      current = { title: line.replace(/^##\\s+/, '').trim(), blocks: [] };
      pendingType = 'text';
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      pendingType = 'text';
      continue;
    }

    const lineType: 'text' | 'code' = trimmed.startsWith('$ ') ? 'code' : 'text';
    if (pending.length && pendingType !== lineType) flush();
    pendingType = lineType;
    pending.push(line);
  }

  flush();
  if (current.blocks.length) sections.push(current);
  return sections;
}

function firstPracticeLine(notes: string) {
  return notes.split('\\n').find((line) => line.trim() && !line.startsWith('Checklist:'))?.replace(/^Scenario:\\s*/, '').trim() || notes.trim();
}

export default function LessonReader({ onBack, lessonId, onOpenLesson, onOpenRelatedLab }: LessonReaderProps) {
  const [isComplete, setIsComplete] = useState(false);
  const [glossaryExpanded, setGlossaryExpanded] = useState(true);
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const lesson = findLesson(lessonId);
  const courseLessons = courseLessonsFor(lesson);
  const currentLessonIndex = courseLessons.findIndex((item) => item.id === lesson.id);
  const previousLesson = currentLessonIndex > 0 ? courseLessons[currentLessonIndex - 1] : undefined;
  const nextLesson = currentLessonIndex >= 0 ? courseLessons[currentLessonIndex + 1] : undefined;
  const glossaryTerms = lesson.terms.length ? lesson.terms : GLOSSARY_TERMS;
  const flashcards = lesson.flashcards.length ? lesson.flashcards : FLASHCARDS;
  const currentCard = flashcards[flashcardIdx % flashcards.length];
  const levelCol = LEVEL_COLORS[lesson.level];
  const progressPct = Math.round((lesson.sequence / lesson.totalLessons) * 100);
  const lessonSections = splitLessonBody(lesson.body);

  const handleMarkComplete = () => {
    setIsComplete(true);
    setStickyVisible(true);
  };
  const openLesson = (targetLesson?: LessonDetail) => {
    if (!targetLesson) return;
    onOpenLesson?.(targetLesson.id);
  };

  return (
    <div className="min-h-full" style={{ background: '#F4F4F1' }}>
      {/* Lesson nav bar */}
      <div
        className="sticky top-0 z-20 border-b px-6 py-3 flex items-center justify-between"
        style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[12px] shrink-0 transition-colors"
            style={{ color: '#6B7870' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#1A1D1B')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6B7870')}
          >
            <ArrowLeft size={13} /> Course
          </button>
          <span style={{ color: '#C4C4BC' }}>/</span>
          <span className="text-[12px] truncate" style={{ color: '#8A9690' }}>{lesson.courseTitle}</span>
          <span style={{ color: '#C4C4BC' }}>/</span>
          <span className="text-[12px] font-medium truncate" style={{ color: '#1A1D1B' }}>Lesson {lesson.sequence}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => openLesson(previousLesson)}
            disabled={!previousLesson}
            className="p-1.5 rounded border flex items-center gap-1 text-[12px]"
            style={{ background: '#FFFFFF', borderColor: '#E2E2DC', color: '#6B7870', opacity: previousLesson ? 1 : 0.45, cursor: previousLesson ? 'pointer' : 'not-allowed' }}
          >
            <ArrowLeft size={13} /> Prev
          </button>
          <button
            onClick={() => openLesson(nextLesson)}
            disabled={!nextLesson}
            className="p-1.5 rounded border flex items-center gap-1 text-[12px]"
            style={{ background: '#FFFFFF', borderColor: '#E2E2DC', color: '#6B7870', opacity: nextLesson ? 1 : 0.45, cursor: nextLesson ? 'pointer' : 'not-allowed' }}
          >
            Next <ArrowRight size={13} />
          </button>
          <button
            onClick={handleMarkComplete}
            className="figma-v1-primary-button flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors"
            style={{
              background: isComplete ? '#DCFCE7' : '#0D9488',
              color: isComplete ? '#166534' : '#FFFFFF',
              borderColor: isComplete ? '#BBF7D0' : 'transparent',
            }}
          >
            {isComplete ? <CheckCircle2 size={13} /> : null}
            {isComplete ? 'Completed' : 'Mark Complete'}
          </button>
        </div>
      </div>

      {/* Main reading area */}
      <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-8">
        {/* Article body */}
        <article>
          {/* Lesson metadata */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-semibold"
                style={{ background: levelCol.bg, color: levelCol.text }}
              >
                {lesson.level}
              </span>
              <span className="text-[11px]" style={{ color: '#8A9690' }}>{lesson.courseTrack}</span>
              <span className="text-[11px]" style={{ color: '#8A9690' }}>~{Math.round(lesson.duration)} min read</span>
              <span className="text-[11px]" style={{ color: '#8A9690' }}>Lesson {lesson.sequence} of {lesson.totalLessons}</span>
            </div>
            <h1 className="text-[24px] font-semibold leading-snug mb-1" style={{ color: '#1A1D1B' }}>
              {lesson.title}
            </h1>
            <p className="text-[14px]" style={{ color: '#6B7870' }}>
              {lesson.summary}
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-1 rounded-full overflow-hidden mb-8" style={{ background: '#E2E2DC' }}>
            <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: '#0D9488' }} />
          </div>

          {/* Lesson content */}
          <div className="prose-content space-y-6" style={{ color: '#1A1D1B' }}>
            {lessonSections.map((section) => (
              <LessonSection key={section.title} title={section.title}>
                {section.blocks.map((block, index) => (
                  block.type === 'code'
                    ? <CodeBlock key={index} title="operator commands">{block.text}</CodeBlock>
                    : (
                      <p key={index} className="text-[15px] leading-[1.8] whitespace-pre-line" style={{ color: '#2D3330' }}>
                        {block.text}
                      </p>
                    )
                ))}
              </LessonSection>
            ))}

            {/* Practice scenario */}
            <div
              className="rounded-lg border p-5"
              style={{ background: '#FAFFF7', borderColor: '#BBF7D0' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical size={14} style={{ color: '#0D9488' }} />
                <span className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: '#0D9488' }}>
                  Practice Scenario
                </span>
              </div>
              <p className="text-[14px] font-medium mb-1" style={{ color: '#1A1D1B' }}>
                Practice notes
              </p>
              <p className="text-[13px] leading-relaxed" style={{ color: '#4A5650' }}>
                {firstPracticeLine(lesson.practiceNotes)}
              </p>
              <button
                onClick={() => onOpenRelatedLab?.(lesson.id)}
                className="figma-v1-primary-button mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                style={{ background: '#0D9488', color: '#FFFFFF' }}
              >
                <FlaskConical size={12} /> Open Related Lab
              </button>
            </div>
          </div>

          {/* Completion notice */}
          {stickyVisible && (
            <div
              className="mt-8 rounded-lg border p-4 flex items-center gap-3"
              style={{ background: '#DCFCE7', borderColor: '#BBF7D0' }}
            >
              <CheckCircle2 size={18} style={{ color: '#16A34A' }} />
              <div>
                <p className="text-[13px] font-semibold" style={{ color: '#166534' }}>Lesson marked complete!</p>
                <p className="text-[12px]" style={{ color: '#4A7A56' }}>
                  {lesson.sequence} of {lesson.totalLessons} lessons complete in this course.
                </p>
              </div>
              <button
                onClick={() => openLesson(nextLesson)}
                disabled={!nextLesson}
                className="ml-auto flex items-center gap-1 text-[12px] font-medium"
                style={{ color: '#166534', opacity: nextLesson ? 1 : 0.5, cursor: nextLesson ? 'pointer' : 'not-allowed' }}
              >
                Next lesson <ArrowRight size={13} />
              </button>
            </div>
          )}
        </article>

        {/* Right rail */}
        <aside className="space-y-4">
          {/* Glossary */}
          <div className="rounded-lg border overflow-hidden" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
            <button
              className="w-full px-4 py-3 border-b flex items-center justify-between text-left"
              style={{ borderColor: '#F0F0EC' }}
              onClick={() => setGlossaryExpanded(!glossaryExpanded)}
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#9BA8A0' }}>
                Glossary
              </span>
              {glossaryExpanded ? <ChevronUp size={13} style={{ color: '#C4C4BC' }} /> : <ChevronDown size={13} style={{ color: '#C4C4BC' }} />}
            </button>
            {glossaryExpanded && (
              <div className="divide-y" style={{ borderColor: '#F0F0EC' }}>
                {glossaryTerms.map((g) => (
                  <div key={g.term} className="px-4 py-2.5">
                    <p className="text-[11px] font-semibold mb-0.5" style={{ color: '#1A1D1B', fontFamily: 'var(--font-mono)' }}>
                      {g.term}
                    </p>
                    <p className="text-[11px] leading-relaxed" style={{ color: '#6B7870' }}>{g.def}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flashcards */}
          <div className="rounded-lg border overflow-hidden" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#F0F0EC' }}>
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#9BA8A0' }}>Flashcards</span>
              <span className="text-[10px]" style={{ color: '#8A9690' }}>{(flashcardIdx % flashcards.length) + 1}/{flashcards.length}</span>
            </div>
            <div className="p-4">
              <div
                className="rounded-md p-3 mb-3 cursor-pointer min-h-[80px] flex items-center"
                style={{ background: '#FAFAF7', border: '1px solid #E2E2DC' }}
                onClick={() => setShowAnswer(!showAnswer)}
              >
                <div className="w-full">
                  <p className="text-[12px] font-medium mb-2" style={{ color: '#1A1D1B' }}>{currentCard.q}</p>
                  {showAnswer && (
                    <p className="text-[12px]" style={{ color: '#0F766E', borderTop: '1px solid #E2E2DC', paddingTop: 8 }}>
                      {currentCard.a}
                    </p>
                  )}
                  {!showAnswer && (
                    <p className="text-[11px]" style={{ color: '#C4C4BC' }}>Tap to reveal answer</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setFlashcardIdx((i) => (i - 1 + flashcards.length) % flashcards.length); setShowAnswer(false); }}
                  className="flex-1 py-1.5 rounded border text-[11px]"
                  style={{ borderColor: '#E2E2DC', color: '#6B7870' }}
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setShowAnswer(false)}
                  className="p-1.5 rounded border"
                  style={{ borderColor: '#E2E2DC', color: '#8A9690' }}
                  title="Reset card"
                >
                  <RotateCcw size={11} />
                </button>
                <button
                  onClick={() => { setFlashcardIdx((i) => (i + 1) % flashcards.length); setShowAnswer(false); }}
                  className="flex-1 py-1.5 rounded border text-[11px]"
                  style={{ borderColor: '#E2E2DC', color: '#6B7870' }}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* Related content */}
          <div className="rounded-lg border p-4" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#9BA8A0' }}>
              Related Lessons
            </p>
            <div className="space-y-1.5">
              {courseLessons.filter((item) => item.id !== lesson.id).slice(0, 2).map((relatedLesson) => (
                <div
                  key={relatedLesson.id}
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => openLesson(relatedLesson)}
                  style={{ color: '#2563EB' }}
                >
                  <BookOpen size={11} />
                  <span className="text-[12px] hover:underline">{relatedLesson.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#9BA8A0' }}>
              Course Progress
            </p>
            <div className="space-y-1">
              {courseLessons.map((courseLesson) => (
                <div
                  key={courseLesson.id}
                  className="flex items-center gap-2 py-1 px-2 rounded cursor-pointer"
                  onClick={() => openLesson(courseLesson)}
                  style={{ background: courseLesson.id === lesson.id ? '#DDFAF6' : 'transparent' }}
                >
                  <span className="text-[10px] tabular-nums w-4 shrink-0" style={{ color: '#9BA8A0' }}>{courseLesson.sequence}</span>
                  <span
                    className="text-[11px] leading-snug flex-1"
                    style={{ color: courseLesson.id === lesson.id ? '#0F766E' : courseLesson.sequence < lesson.sequence ? '#8A9690' : '#1A1D1B' }}
                  >
                    {courseLesson.title}
                  </span>
                  {courseLesson.sequence < lesson.sequence && <CheckCircle2 size={11} style={{ color: '#0D9488', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function LessonSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[17px] font-semibold mb-3" style={{ color: '#1A1D1B' }}>{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Term({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="cursor-help border-b border-dotted"
      style={{ color: '#0D9488', borderColor: '#0D9488' }}
      title="See glossary"
    >
      {children}
    </span>
  );
}

function Callout({ type, children }: { type: 'info' | 'warn'; children: React.ReactNode }) {
  const styles = type === 'info'
    ? { bg: '#EFF6FF', border: '#BFDBFE', icon: 'ℹ', color: '#1E40AF' }
    : { bg: '#FFFBEB', border: '#FDE68A', icon: '⚠', color: '#92400E' };
  return (
    <div className="rounded-md border-l-4 px-4 py-3" style={{ background: styles.bg, borderColor: styles.border }}>
      <div className="flex gap-2.5">
        <span className="text-[14px] shrink-0">{styles.icon}</span>
        <p className="text-[13px] leading-relaxed" style={{ color: styles.color }}>{children}</p>
      </div>
    </div>
  );
}

function CodeBlock({ title, children }: { title: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="rounded-md overflow-hidden border" style={{ background: '#0D1A12', borderColor: '#1C3524' }}>
      <div className="px-3 py-1.5 border-b flex items-center justify-between" style={{ borderColor: '#1C3524' }}>
        <span className="text-[10px]" style={{ color: '#4ADE80', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>{title}</span>
        <button
          onClick={handleCopy}
          className="text-[10px] px-2 py-0.5 rounded transition-colors"
          style={{ color: copied ? '#4ADE80' : '#86EFAC', background: '#1C3524' }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre
        className="p-4 text-[12px] leading-relaxed overflow-x-auto"
        style={{ color: '#86EFAC', fontFamily: 'var(--font-mono)', margin: 0 }}
      >
        <code>{children}</code>
      </pre>
    </div>
  );
}
