import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FlaskConical, RotateCcw, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { lessonDetails } from '../data';
import type { LessonDetail } from '../data';
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
  CODE_TEXT,
  GREEN,
  GREEN_BG,
  SURF,
  SURF2,
  TERMINAL,
  TEXT,
  TEXT2,
  TEXT3,
  alpha,
} from '../themeTokens';

const LEVEL_COL = {
  Fresher:      { color: GREEN, bg: GREEN_BG },
  Intermediate: { color: BLUE,  bg: BLUE_BG  },
  Advanced:     { color: AMBER, bg: AMBER_BG },
};

const GLOSSARY = [
  { term: 'NetworkPolicy', def: 'A Kubernetes resource controlling how pods communicate with each other and external endpoints using label selectors.' },
  { term: 'CNI', def: 'Container Network Interface — specification and libraries for configuring network interfaces in Linux containers.' },
  { term: 'Egress', def: 'Outbound traffic from a pod to other pods, services, or external endpoints.' },
  { term: 'PodSelector', def: 'A label selector within a NetworkPolicy identifying which pods the policy applies to.' },
  { term: 'Namespace isolation', def: 'Pattern using NetworkPolicy to prevent cross-namespace traffic by default, enforcing least-privilege access.' },
];

const FLASHCARDS = [
  { q: 'What does a NetworkPolicy with an empty podSelector ({}) select?', a: 'All pods in the namespace.' },
  { q: 'Which CNI plugin enforces NetworkPolicy in EKS by default?', a: 'None — AWS VPC CNI does not enforce NetworkPolicy. Calico or Cilium must be installed.' },
  { q: 'Can a NetworkPolicy block traffic to kube-dns?', a: 'Yes, if egress rules omit UDP/TCP 53 to kube-system.' },
  { q: 'What is the effect of policyTypes: [Ingress, Egress] with no rules?', a: 'All ingress and egress to selected pods is denied.' },
];

interface LessonReaderProps {
  onBack: () => void;
  lessonId?: number;
  onOpenLesson?: (lessonId: number) => void;
  onOpenRelatedLab?: (lessonId: number) => void;
}

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
  const [complete, setComplete]           = useState(false);
  const [glossaryOpen, setGlossaryOpen]   = useState(true);
  const [cardIdx, setCardIdx]             = useState(0);
  const [showAnswer, setShowAnswer]       = useState(false);
  const lesson = findLesson(lessonId);
  const courseLessons = courseLessonsFor(lesson);
  const currentLessonIndex = courseLessons.findIndex((item) => item.id === lesson.id);
  const previousLesson = currentLessonIndex > 0 ? courseLessons[currentLessonIndex - 1] : undefined;
  const nextLesson = currentLessonIndex >= 0 ? courseLessons[currentLessonIndex + 1] : undefined;
  const glossary = lesson.terms.length ? lesson.terms : GLOSSARY;
  const flashcards = lesson.flashcards.length ? lesson.flashcards : FLASHCARDS;
  const card = flashcards[cardIdx % flashcards.length];
  const levelCol = LEVEL_COL[lesson.level];
  const progressPct = Math.round((lesson.sequence / lesson.totalLessons) * 100);
  const lessonSections = splitLessonBody(lesson.body);
  const openLesson = (targetLesson?: LessonDetail) => {
    if (!targetLesson) return;
    onOpenLesson?.(targetLesson.id);
  };

  return (
    <div className="min-h-full" style={{ background: BG, fontFamily: 'var(--font-sans)' }}>

      {/* Sticky nav bar */}
      <div
        className="sticky top-0 z-20 border-b px-6 h-11 flex items-center justify-between"
        style={{ background: SURF, borderColor: BORDER }}
      >
        <div className="flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)' }}>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 transition-colors"
            style={{ color: TEXT3, fontSize: 11 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = TEXT2)}
            onMouseLeave={(e) => (e.currentTarget.style.color = TEXT3)}
            type="button"
          >
            <ArrowLeft size={11} /> course
          </button>
          <span style={{ color: TEXT3, fontSize: 11 }}>/</span>
          <span style={{ color: TEXT3, fontSize: 11 }}>{lesson.courseSlug}</span>
          <span style={{ color: TEXT3, fontSize: 11 }}>/</span>
          <span style={{ color: TEXT2, fontSize: 11 }}>lesson-{lesson.sequence}</span>
        </div>

        <div className="flex items-center gap-2">
          <NavBtn ariaLabel="Previous lesson" onClick={() => openLesson(previousLesson)} disabled={!previousLesson}><ArrowLeft size={12} /></NavBtn>
          <NavBtn ariaLabel="Next lesson" onClick={() => openLesson(nextLesson)} disabled={!nextLesson}><ArrowRight size={12} /></NavBtn>
          <button
            onClick={() => setComplete(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border transition-all text-[10px]"
            style={{
              background: complete ? GREEN_BG : ACCENT_BG,
              borderColor: complete ? alpha(GREEN, 25) : alpha(ACCENT, 25),
              color: complete ? GREEN : ACCENT,
              fontFamily: 'var(--font-mono)',
            }}
            type="button"
          >
            {complete && <CheckCircle2 size={11} />}
            {complete ? 'Completed' : 'Mark complete'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-8">

        {/* Article */}
        <article>
          {/* Lesson meta */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <MonoBadge color={levelCol.color} bg={levelCol.bg}>{lesson.level}</MonoBadge>
              <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>{lesson.courseTrack}</span>
              <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>~{Math.round(lesson.duration)} min</span>
              <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>Lesson {lesson.sequence}/{lesson.totalLessons}</span>
            </div>
            <h1 style={{ color: TEXT, fontSize: 22, fontWeight: 600, lineHeight: 1.2, marginBottom: 8 }}>
              {lesson.title}
            </h1>
            <p style={{ color: TEXT2, fontSize: 14, lineHeight: 1.6 }}>
              {lesson.summary}
            </p>
          </div>

          {/* Progress */}
          <div className="h-px mb-8" style={{ background: BORDER2 }}>
            <div className="h-px" style={{ width: `${progressPct}%`, background: ACCENT, opacity: 0.7 }} />
          </div>

          {/* Body */}
          <div className="space-y-8">
            {lessonSections.map((section) => (
              <LessonSection key={section.title} title={section.title}>
                {section.blocks.map((block, index) => (
                  block.type === 'code'
                    ? <CodeBlock key={index} title="operator commands">{block.text}</CodeBlock>
                    : (
                      <p key={index} style={{ color: TEXT2, fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: 12 }}>
                        {block.text}
                      </p>
                    )
                ))}
              </LessonSection>
            ))}

            {/* Practice scenario */}
            <div className="rounded-sm border p-5" style={{ background: ACCENT_BG, borderColor: alpha(ACCENT, 13) }}>
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical size={13} style={{ color: ACCENT }} />
                <span style={{ color: ACCENT, fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>PRACTICE SCENARIO</span>
              </div>
              <p style={{ color: TEXT, fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                Practice notes
              </p>
              <p style={{ color: TEXT2, fontSize: 13, lineHeight: 1.65, marginBottom: 14 }}>
                {firstPracticeLine(lesson.practiceNotes)}
              </p>
              <button
                onClick={() => onOpenRelatedLab?.(lesson.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-sm border transition-all text-[10px]"
                style={{ background: 'transparent', borderColor: alpha(ACCENT, 25), color: ACCENT, fontFamily: 'var(--font-mono)' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = alpha(ACCENT, 50))}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = alpha(ACCENT, 25))}
                type="button"
              >
                <FlaskConical size={11} /> OPEN RELATED LAB
              </button>
            </div>

            {/* Completion notice */}
            {complete && (
              <div className="rounded-sm border p-4 flex items-center gap-3" style={{ background: GREEN_BG, borderColor: alpha(GREEN, 19) }}>
                <CheckCircle2 size={16} style={{ color: GREEN }} />
                <div>
                  <p style={{ color: GREEN, fontSize: 13, fontWeight: 600 }}>Lesson marked complete</p>
                  <p style={{ color: TEXT2, fontSize: 12, marginTop: 2 }}>{lesson.sequence}/{lesson.totalLessons} lessons done in this course.</p>
                </div>
                <button
                  onClick={() => openLesson(nextLesson)}
                  disabled={!nextLesson}
                  className="ml-auto flex items-center gap-1 text-[11px] transition-colors"
                  style={{ color: GREEN, fontFamily: 'var(--font-mono)', opacity: nextLesson ? 1 : 0.45, cursor: nextLesson ? 'pointer' : 'not-allowed' }}
                  type="button"
                >
                  NEXT <ArrowRight size={11} />
                </button>
              </div>
            )}
          </div>
        </article>

        {/* Right rail */}
        <div aria-label="Lesson side panel" className="space-y-3">
          {/* Course progress */}
          <RailPanel label="COURSE PROGRESS">
            {courseLessons.map((courseLesson) => (
              <button
                key={courseLesson.id}
                aria-current={courseLesson.id === lesson.id ? 'step' : undefined}
                aria-label={`Open lesson ${courseLesson.sequence}: ${courseLesson.title}`}
                className="w-full flex items-center gap-2 py-2 border-b last:border-0 rounded-sm px-1 text-left"
                onClick={() => openLesson(courseLesson)}
                style={{
                  borderColor: BORDER,
                  background: courseLesson.id === lesson.id ? ACCENT_BG : 'transparent',
                  cursor: 'pointer',
                }}
                type="button"
              >
                <span style={{ color: TEXT3, fontSize: 9, fontFamily: 'var(--font-mono)', width: 16, flexShrink: 0 }}>{courseLesson.sequence}</span>
                <span style={{ color: courseLesson.id === lesson.id ? ACCENT : courseLesson.sequence < lesson.sequence ? TEXT3 : TEXT2, fontSize: 11, flex: 1, lineHeight: 1.3 }}>
                  {courseLesson.title}
                </span>
                {courseLesson.sequence < lesson.sequence && <CheckCircle2 size={10} style={{ color: GREEN, flexShrink: 0 }} />}
              </button>
            ))}
          </RailPanel>

          {/* Glossary */}
          <div className="rounded-sm border overflow-hidden" style={{ background: SURF, borderColor: BORDER }}>
            <button
              className="w-full px-4 py-2.5 flex items-center justify-between border-b"
              style={{ borderColor: BORDER }}
              onClick={() => setGlossaryOpen(!glossaryOpen)}
              type="button"
            >
              <span style={{ color: TEXT3, fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.1em' }}>GLOSSARY</span>
              {glossaryOpen ? <ChevronUp size={11} style={{ color: TEXT3 }} /> : <ChevronDown size={11} style={{ color: TEXT3 }} />}
            </button>
            {glossaryOpen && (
              <div className="divide-y" style={{ borderColor: BORDER }}>
                {glossary.map((g) => (
                  <div key={g.term} className="px-4 py-2.5 border-b last:border-0" style={{ borderColor: BORDER }}>
                    <p style={{ color: ACCENT, fontSize: 10, fontFamily: 'var(--font-mono)', marginBottom: 3 }}>{g.term}</p>
                    <p style={{ color: TEXT2, fontSize: 11, lineHeight: 1.5 }}>{g.def}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flashcards */}
          <RailPanel label={`FLASHCARDS · ${(cardIdx % flashcards.length) + 1}/${flashcards.length}`}>
            <button
              aria-label={showAnswer ? "Hide flashcard answer" : "Reveal flashcard answer"}
              aria-pressed={showAnswer}
              className="rounded-sm border p-3 mb-3 cursor-pointer min-h-[90px] flex items-center transition-all text-left w-full"
              style={{ background: SURF2, borderColor: showAnswer ? alpha(ACCENT, 19) : BORDER }}
              onClick={() => setShowAnswer(!showAnswer)}
              type="button"
            >
              <div className="w-full">
                <p style={{ color: TEXT, fontSize: 12, lineHeight: 1.5 }}>{card.q}</p>
                {showAnswer && (
                  <p style={{ color: ACCENT, fontSize: 12, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER2}`, lineHeight: 1.5 }}>
                    {card.a}
                  </p>
                )}
                {!showAnswer && (
                  <p style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)', marginTop: 8 }}>tap to reveal</p>
                )}
              </div>
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => { setCardIdx((i) => (i - 1 + flashcards.length) % flashcards.length); setShowAnswer(false); }}
                className="flex-1 py-1.5 rounded-sm border text-[10px] transition-all"
                style={{ borderColor: BORDER2, color: TEXT2, fontFamily: 'var(--font-mono)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = SURF2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                type="button"
              >
                ← PREV
              </button>
              <button
                onClick={() => setShowAnswer(false)}
                aria-label="Reset flashcard"
                className="p-1.5 rounded-sm border"
                style={{ borderColor: BORDER2, color: TEXT3 }}
                title="Reset"
                type="button"
              >
                <RotateCcw size={10} />
              </button>
              <button
                onClick={() => { setCardIdx((i) => (i + 1) % flashcards.length); setShowAnswer(false); }}
                className="flex-1 py-1.5 rounded-sm border text-[10px] transition-all"
                style={{ borderColor: BORDER2, color: TEXT2, fontFamily: 'var(--font-mono)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = SURF2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                type="button"
              >
                NEXT →
              </button>
            </div>
          </RailPanel>

          {/* Related lessons */}
          <RailPanel label="RELATED LESSONS">
            {courseLessons.filter((item) => item.id !== lesson.id).slice(0, 2).map((relatedLesson) => (
              <button
                key={relatedLesson.id}
                className="w-full flex items-center gap-2 py-1.5 border-b last:border-0 cursor-pointer text-left"
                onClick={() => openLesson(relatedLesson)}
                style={{ borderColor: BORDER }}
                type="button"
              >
                <FlaskConical size={10} style={{ color: ACCENT, flexShrink: 0 }} />
                <span style={{ color: ACCENT, fontSize: 12 }}>{relatedLesson.title}</span>
              </button>
            ))}
          </RailPanel>
        </div>
      </div>
    </div>
  );
}

// ── sub-components ─────────────────────────────────────────────

function LessonSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ color: TEXT, fontSize: 16, fontWeight: 600, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function GlossaryTerm({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: ACCENT, borderBottom: `1px dashed ${alpha(ACCENT, 31)}`, cursor: 'help' }} title="See glossary">
      {children}
    </span>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-sm" style={{ background: SURF2, color: ACCENT, fontSize: 12, fontFamily: 'var(--font-mono)', border: `1px solid ${BORDER2}` }}>
      {children}
    </code>
  );
}

function Callout({ type, children }: { type: 'info' | 'warn'; children: React.ReactNode }) {
  const styles = type === 'info'
    ? { bg: BLUE_BG, border: alpha(BLUE, 19), icon: 'ℹ', color: BLUE }
    : { bg: AMBER_BG, border: alpha(AMBER, 19), icon: '⚠', color: AMBER };
  return (
    <div className="rounded-sm border-l-2 px-4 py-3 mt-3" style={{ background: styles.bg, borderColor: styles.border }}>
      <div className="flex gap-2.5">
        <span style={{ color: styles.color, fontSize: 13, flexShrink: 0 }}>{styles.icon}</span>
        <p style={{ color: TEXT2, fontSize: 13, lineHeight: 1.65 }}>{children}</p>
      </div>
    </div>
  );
}

function CodeBlock({ title, children }: { title: string; children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-sm overflow-hidden" style={{ background: TERMINAL, border: `1px solid ${BORDER}` }}>
      <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: BORDER2 }}>
        <span style={{ color: ACCENT, fontSize: 9, fontFamily: 'var(--font-mono)', opacity: 0.85 }}>{title}</span>
        <button
          aria-label={`Copy ${title}`}
          onClick={() => { navigator.clipboard.writeText(children).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm transition-all text-[9px]"
          style={{ background: SURF2, color: copied ? ACCENT : TEXT3, fontFamily: 'var(--font-mono)' }}
          type="button"
        >
          {copied ? <Check size={9} /> : <Copy size={9} />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      <pre style={{ padding: 16, margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7, color: CODE_TEXT, overflowX: 'auto' }}>
        <code>{children}</code>
      </pre>
    </div>
  );
}

function RailPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border overflow-hidden" style={{ background: SURF, borderColor: BORDER }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: BORDER }}>
        <span style={{ color: TEXT3, fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.1em' }}>{label}</span>
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  );
}

function NavBtn({ children, onClick, disabled, ariaLabel }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; ariaLabel: string }) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 flex items-center justify-center rounded-sm border transition-all"
      style={{ background: 'transparent', borderColor: BORDER2, color: TEXT2, opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = SURF2;
      }}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      type="button"
    >
      {children}
    </button>
  );
}

function MonoBadge({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <span className="px-1.5 py-px rounded-sm" style={{ color, background: bg, fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
      {children}
    </span>
  );
}
