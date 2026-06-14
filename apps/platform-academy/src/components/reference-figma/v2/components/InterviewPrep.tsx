import { useEffect, useState } from 'react';
import { Search, BookOpen, FlaskConical, CheckCircle2, Circle, Download, Plus, AlertTriangle, Check } from 'lucide-react';
import { interviewPacks } from '../data';
import type { Level, InterviewPack } from '../data';
import {
  answerWriteupFor,
  buildReferenceCramSheet,
  buildReferenceCramSheetCollection,
  downloadMarkdownFile,
  referenceStudyPlanExists,
  saveReferenceStudyPlan,
} from '../../interviewHelpers';
import { INTERVIEW_STATE_KEY, notifyReferenceProgressChanged } from '../../localProgress';
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
  RED,
  RED_BG,
  SURF,
  SURF2,
  SURF3,
  TEXT,
  TEXT2,
  TEXT3,
  alpha,
} from '../themeTokens';

const LEVEL_COL: Record<Level, { color: string; bg: string }> = {
  Fresher:      { color: GREEN, bg: GREEN_BG },
  Intermediate: { color: BLUE,  bg: BLUE_BG  },
  Advanced:     { color: AMBER, bg: AMBER_BG },
};

function levelLabel(level: Level | 'All') {
  return level === 'All' ? 'All levels' : level;
}

function readStoredInterviewState() {
  if (typeof window === 'undefined') return { practicedIds: [] as number[], completedPracticeIds: [] as number[] };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(INTERVIEW_STATE_KEY) || '{}') as {
      practicedIds?: number[];
      completedPracticeIds?: number[];
    };
    return {
      practicedIds: parsed.practicedIds ?? [],
      completedPracticeIds: parsed.completedPracticeIds ?? [],
    };
  } catch {
    return { practicedIds: [] as number[], completedPracticeIds: [] as number[] };
  }
}

function writeStoredInterviewState(practicedIds: Set<number>, completedPracticeIds: Set<number>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      INTERVIEW_STATE_KEY,
      JSON.stringify({
        practicedIds: Array.from(practicedIds),
        completedPracticeIds: Array.from(completedPracticeIds),
      })
    );
    notifyReferenceProgressChanged();
  } catch {
    // Keep the current session usable if local storage is unavailable.
  }
}

type InterviewPrepProps = {
  onOpenDoc?: (docTitle: string) => void;
  onOpenRelatedLab?: (labTitle: string) => void;
};

export default function InterviewPrep({ onOpenDoc, onOpenRelatedLab }: InterviewPrepProps = {}) {
  const storedState = readStoredInterviewState();
  const [selectedId, setSelectedId]   = useState(1);
  const [search, setSearch]           = useState('');
  const [levelFilter, setLevelFilter] = useState<Level | 'All'>('All');
  const [practicedIds, setPracticedIds] = useState<Set<number>>(() => new Set(storedState.practicedIds));
  const [completedPracticeIds, setCompletedPracticeIds] = useState<Set<number>>(() => new Set(storedState.completedPracticeIds));

  const filtered = interviewPacks.filter((p) => {
    const q  = p.title.toLowerCase().includes(search.toLowerCase()) || p.domain.toLowerCase().includes(search.toLowerCase());
    const lv = levelFilter === 'All' || p.level === levelFilter;
    return q && lv;
  });
  const selected = filtered.find((p) => p.id === selectedId) || filtered[0] || interviewPacks[0];

  const totalQ    = interviewPacks.reduce((a, p) => a + p.questionCount, 0);
  const practicedN = practicedIds.size;

  const toggle = (id: number) => setPracticedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  useEffect(() => {
    writeStoredInterviewState(practicedIds, completedPracticeIds);
  }, [completedPracticeIds, practicedIds]);

  return (
    <div className="figma-v2-interview-root flex h-full overflow-hidden" style={{ background: BG }}>

      {/* ── Left: pack list ───────────────────────────────── */}
      <div
        className="figma-v2-side-rail w-full md:w-[340px] lg:w-[380px] shrink-0 flex flex-col border-r overflow-hidden"
        style={{ background: SURF, borderColor: BORDER }}
      >
        <div className="p-3 border-b space-y-2.5" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>Interview Prep</p>
              <p style={{ color: TEXT2, fontSize: 10, fontFamily: 'var(--font-sans)', marginTop: 1 }}>
                {practicedN}/{totalQ} practiced
              </p>
            </div>
            <button
              onClick={() => downloadMarkdownFile('platform-academy-interview-cram-sheets.md', buildReferenceCramSheetCollection('Platform Academy interview cram sheets', filtered))}
              className="flex items-center gap-1 px-2 py-1.5 rounded-sm border transition-all"
              style={{ borderColor: BORDER2, color: TEXT2, fontSize: 10, fontFamily: 'var(--font-sans)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = SURF2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              type="button"
            >
              <Download size={10} /> Cram sheet
            </button>
          </div>

          {/* Global progress bar */}
          <div className="h-px" style={{ background: BORDER2 }}>
            <div className="h-px" style={{ width: `${(practicedN / totalQ) * 100}%`, background: ACCENT, opacity: 0.7 }} />
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-sm border"
            style={{ background: SURF2, borderColor: BORDER }}
          >
            <Search size={11} style={{ color: TEXT2 }} />
            <input
              aria-label="Filter interview packs"
              type="text"
              placeholder="Filter packs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none bg-transparent"
              style={{ color: TEXT, fontSize: 11, fontFamily: 'var(--font-mono)' }}
            />
          </div>

          {/* Level filter */}
          <div aria-label="Interview level filters" className="flex gap-1" role="group">
            {(['All', 'Fresher', 'Intermediate', 'Advanced'] as const).map((lvl) => {
              const col = lvl !== 'All' ? LEVEL_COL[lvl as Level] : null;
              const active = levelFilter === lvl;
              return (
                <button
                  key={lvl}
                  aria-pressed={active}
                  onClick={() => setLevelFilter(lvl)}
                  className="px-2 py-0.5 rounded-sm border transition-all text-[10px]"
                  data-active={active ? 'true' : 'false'}
                  style={{
                    background: active ? (col?.bg || ACCENT_BG) : SURF2,
                    color: active ? (col?.color || ACCENT) : TEXT2,
                    borderColor: active ? (col?.color || ACCENT) : BORDER2,
                    boxShadow: active ? `inset 0 0 0 1px ${alpha(col?.color || ACCENT, 33)}` : 'none',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {levelLabel(lvl)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto" role="region" aria-label="Interview pack list" tabIndex={0}>
          {filtered.map((pack) => {
            const lvlCol = LEVEL_COL[pack.level];
            const isActive = pack.id === selectedId;
            const packPracticed = pack.questions.filter((q) => practicedIds.has(q.id)).length;
            return (
              <button
                key={pack.id}
                aria-label={`Select interview pack: ${pack.title}`}
                aria-pressed={isActive}
                className="w-full px-4 py-3 border-b cursor-pointer transition-all text-left"
                style={{
                  borderColor: BORDER,
                  background: isActive ? SURF3 : 'transparent',
                  borderLeft: `2px solid ${isActive ? ACCENT : 'transparent'}`,
                }}
                onClick={() => setSelectedId(pack.id)}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = SURF2; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                type="button"
              >
                <p style={{ color: isActive ? TEXT : TEXT2, fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                  {pack.title}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ color: lvlCol.color, background: lvlCol.bg, padding: '0 5px', borderRadius: 2, fontSize: 8, fontFamily: 'var(--font-mono)' }}>
                    {pack.level}
                  </span>
                  <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-sans)' }}>{pack.domain}</span>
                  <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-sans)' }}>{pack.questionCount} questions</span>
                </div>
                {pack.questions.length > 0 && (
                  <div className="mt-2 h-px" style={{ background: BORDER2 }}>
                    <div className="h-px" style={{ width: `${(packPracticed / pack.questions.length) * 100}%`, background: ACCENT, opacity: 0.5 }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: pack detail ───────────────────────────── */}
      <div className="figma-v2-main-pane block flex-1 overflow-y-auto" role="region" aria-label="Interview practice details" style={{ background: BG }} tabIndex={0}>
        <PackDetail
          pack={selected}
          completedPracticeIds={completedPracticeIds}
          onCompletePractice={(packId) => setCompletedPracticeIds((prev) => new Set(prev).add(packId))}
          practicedIds={practicedIds}
          onToggle={toggle}
          onOpenDoc={onOpenDoc}
          onOpenRelatedLab={onOpenRelatedLab}
        />
      </div>
    </div>
  );
}

function PackDetail({
  pack, completedPracticeIds, onCompletePractice, practicedIds, onToggle, onOpenDoc, onOpenRelatedLab,
}: {
  pack: InterviewPack;
  completedPracticeIds: Set<number>;
  onCompletePractice: (packId: number) => void;
  practicedIds: Set<number>;
  onToggle: (id: number) => void;
  onOpenDoc?: (docTitle: string) => void;
  onOpenRelatedLab?: (labTitle: string) => void;
}) {
  const lvlCol = LEVEL_COL[pack.level];
  const practicedCount = pack.questions.filter((q) => practicedIds.has(q.id)).length;
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [studyPlanIds, setStudyPlanIds] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState('');
  const activeQuestion = pack.questions.find((q) => q.id === activeQuestionId) ?? pack.questions[0];
  const activeQuestionIndex = activeQuestion ? Math.max(0, pack.questions.findIndex((q) => q.id === activeQuestion.id)) : 0;
  const activeWriteup = activeQuestion ? answerWriteupFor(pack, activeQuestion, activeQuestionIndex) : null;
  const isInStudyPlan = studyPlanIds.has(pack.id) || referenceStudyPlanExists(pack);
  const isPracticeComplete = completedPracticeIds.has(pack.id);

  const DIFF_COL = {
    easy:   { color: GREEN, bg: GREEN_BG },
    medium: { color: AMBER, bg: AMBER_BG },
    hard:   { color: RED,   bg: RED_BG },
  };

  return (
    <div className="w-full max-w-[1040px] ml-0 mr-auto px-5 py-5 space-y-5">
      {/* Pack header */}
      <div className="rounded-sm border p-5" style={{ background: SURF, borderColor: BORDER }}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <MonoBadge color={lvlCol.color} bg={lvlCol.bg}>
                {pack.level}
              </MonoBadge>
              <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-sans)' }}>{pack.domain}</span>
              <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-sans)' }}>{pack.questionCount} questions</span>
              <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-sans)' }}>~{pack.duration}m</span>
            </div>
            <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 600 }}>{pack.title}</h2>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[10px]"
              onClick={() => {
                const result = saveReferenceStudyPlan(pack);
                setStudyPlanIds((prev) => new Set(prev).add(pack.id));
                setStatus(
                  result.created
                    ? `${pack.title} saved as a study plan with ${result.questionCount} questions.`
                    : `${pack.title} study plan updated with ${result.questionCount} questions.`
                );
              }}
              style={{ borderColor: isInStudyPlan ? alpha(ACCENT, 25) : BORDER2, color: isInStudyPlan ? ACCENT : TEXT2, fontFamily: 'var(--font-mono)' }}
              type="button">
              <Plus size={10} /> {isInStudyPlan ? 'In plan' : 'Study plan'}
            </button>
            <button className="figma-v2-primary-button flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[10px]"
              onClick={() => {
                downloadMarkdownFile(`${pack.slug}-cram-sheet.md`, buildReferenceCramSheet(pack));
                setStatus(`${pack.title} cram sheet downloaded.`);
              }}
              style={{ background: ACCENT_BG, borderColor: alpha(ACCENT, 25), color: ACCENT, fontFamily: 'var(--font-mono)' }}
              type="button">
              <Download size={10} /> Cram sheet
            </button>
          </div>
        </div>
        {status && (
          <p style={{ color: ACCENT, fontSize: 10, fontFamily: 'var(--font-mono)', marginBottom: 10 }} role="status">
            {status}
          </p>
        )}
        {pack.questions.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: BORDER2 }}>
              <div className="h-px" style={{ width: `${(practicedCount / pack.questions.length) * 100}%`, background: ACCENT, opacity: 0.7 }} />
            </div>
            <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
              {practicedCount}/{pack.questions.length} practiced
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5">
        <div className="space-y-4">
          {/* Questions */}
          <SidePanel label="Question queue">
            <div>
              {pack.questions.map((q, i) => {
                const practiced = practicedIds.has(q.id);
                const diff = DIFF_COL[q.difficulty];
                return (
                  <div
                    key={q.id}
                    className={`flex items-start gap-3 py-3 px-2 -mx-2 rounded-sm cursor-pointer transition-all ${i < pack.questions.length - 1 ? 'border-b' : ''}`}
                    style={{ borderColor: BORDER, background: activeQuestion?.id === q.id ? SURF2 : 'transparent' }}
                  >
                    <button
                      aria-label={practiced ? `Mark question ${i + 1} not practiced` : `Mark question ${i + 1} practiced`}
                      aria-pressed={practiced}
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveQuestionId(q.id);
                        onToggle(q.id);
                      }}
                      className="shrink-0 transition-transform active:scale-95 flex items-center justify-center rounded-sm border"
                      style={{ width: 40, height: 40, marginTop: -7, marginBottom: -7, borderColor: 'transparent', background: 'transparent' }}
                      type="button"
                    >
                      {practiced
                        ? <CheckCircle2 size={16} style={{ color: GREEN }} />
                        : <Circle size={16} style={{ color: TEXT3 }} />}
                    </button>
                    <button
                      aria-label={`Select question ${i + 1}: ${q.question}`}
                      aria-pressed={activeQuestion?.id === q.id}
                      className="flex flex-1 items-start gap-3 text-left"
                      onClick={() => setActiveQuestionId(q.id)}
                      style={{
                        background: 'transparent',
                        border: 0,
                        color: 'inherit',
                        padding: 0,
                      }}
                      type="button"
                    >
                      <span style={{ flex: 1, color: practiced ? TEXT3 : TEXT2, fontSize: 13, lineHeight: 1.5 }}>
                        {q.question}
                      </span>
                      <MonoBadge color={diff.color} bg={diff.bg}>{q.difficulty}</MonoBadge>
                    </button>
                  </div>
                );
              })}
              {pack.questions.length < pack.questionCount && (
                <p style={{ color: TEXT3, fontSize: 12, marginTop: 12, fontFamily: 'var(--font-mono)' }}>
                  +{pack.questionCount - pack.questions.length} more questions in the full pack
                </p>
              )}
            </div>
          </SidePanel>

          {activeWriteup && activeQuestion && (
            <SidePanel label="Answer write-up">
              <div className="space-y-3">
                <div>
                  <p style={{ color: TEXT, fontSize: 13, lineHeight: 1.5, fontWeight: 600 }}>
                    {activeQuestion.question}
                  </p>
                  <p style={{ color: TEXT2, fontSize: 12, lineHeight: 1.6, marginTop: 6 }}>
                    {activeWriteup.scenario}
                  </p>
                </div>
                <div>
                  <p style={{ color: TEXT3, fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: 6 }}>
                    Answer outline
                  </p>
                  {activeWriteup.outline.map((item, i) => (
                    <div key={item} className="flex items-start gap-2 py-1">
                      <span style={{ color: ACCENT, fontSize: 10, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{ color: TEXT2, fontSize: 12, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p style={{ color: GREEN, fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: 6 }}>
                      Good answers include
                    </p>
                    {activeWriteup.strongSignals.map((item, i) => (
                      <div key={`${item}-${i}`} className="flex items-start gap-2 py-1">
                        <div className="w-1 h-1 rounded-full shrink-0 mt-2" style={{ background: GREEN }} />
                        <span style={{ color: TEXT2, fontSize: 12, lineHeight: 1.4 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p style={{ color: RED, fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: 6 }}>
                      Common mistakes
                    </p>
                    {activeWriteup.redFlags.map((item, i) => (
                      <div key={`${item}-${i}`} className="flex items-start gap-2 py-1">
                        <AlertTriangle size={10} style={{ color: RED, flexShrink: 0, marginTop: 3 }} />
                        <span style={{ color: TEXT2, fontSize: 12, lineHeight: 1.4 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SidePanel>
          )}

          {/* Practice task */}
          <div className="rounded-sm border p-4" style={{ background: SURF, borderColor: BORDER }}>
            <p style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-sans)', letterSpacing: 0, marginBottom: 10 }}>Practice task</p>
            <p style={{ color: TEXT, fontSize: 13, lineHeight: 1.65, marginBottom: 14 }}>
              {activeWriteup?.practiceTask ?? pack.practiceTask}
            </p>
            <button
              className="figma-v2-primary-button flex items-center gap-1.5 px-3 py-2 rounded-sm border transition-all text-[10px]"
              onClick={() => {
                onCompletePractice(pack.id);
                setStatus(isPracticeComplete ? 'Practice task already complete.' : 'Practice task marked complete.');
              }}
              style={{ background: isPracticeComplete ? GREEN_BG : ACCENT_BG, borderColor: alpha(isPracticeComplete ? GREEN : ACCENT, 25), color: isPracticeComplete ? GREEN : ACCENT, fontFamily: 'var(--font-mono)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = alpha(isPracticeComplete ? GREEN : ACCENT, 50))}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = alpha(isPracticeComplete ? GREEN : ACCENT, 25))}
              type="button"
            >
              <Check size={11} /> {isPracticeComplete ? 'Complete' : 'Mark complete'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <SidePanel label="Docs to read">
            {pack.docsToRead.map((doc, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-2 py-1.5 border-b last:border-0 cursor-pointer text-left"
                onClick={() => {
                  if (onOpenDoc) onOpenDoc(doc);
                  else setStatus(`Open ${doc} from the resource index.`);
                }}
                style={{ borderColor: BORDER }}
                type="button"
              >
                <BookOpen size={10} style={{ color: BLUE, flexShrink: 0 }} />
                <span style={{ color: BLUE, fontSize: 12 }}>{doc}</span>
              </button>
            ))}
          </SidePanel>

          <SidePanel label="Related labs">
            {pack.relatedLabs.map((lab, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-2 py-1.5 border-b last:border-0 cursor-pointer text-left"
                onClick={() => {
                  if (onOpenRelatedLab) onOpenRelatedLab(lab);
                  else setStatus(`Open ${lab} from the labs queue.`);
                }}
                style={{ borderColor: BORDER }}
                type="button"
              >
                <FlaskConical size={10} style={{ color: ACCENT, flexShrink: 0 }} />
                <span style={{ color: ACCENT, fontSize: 12 }}>{lab}</span>
              </button>
            ))}
          </SidePanel>

          <SidePanel label="Strong signals">
            {pack.strongSignals.map((s, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 border-b last:border-0" style={{ borderColor: BORDER }}>
                <div className="w-1 h-1 rounded-full shrink-0 mt-2" style={{ background: GREEN }} />
                <span style={{ color: TEXT2, fontSize: 12, lineHeight: 1.4 }}>{s}</span>
              </div>
            ))}
          </SidePanel>

          <SidePanel label="Red flags">
            {pack.redFlags.map((f, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 border-b last:border-0" style={{ borderColor: BORDER }}>
                <AlertTriangle size={10} style={{ color: RED, flexShrink: 0, marginTop: 3 }} />
                <span style={{ color: TEXT2, fontSize: 12, lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </SidePanel>
        </div>
      </div>
    </div>
  );
}

function SidePanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border overflow-hidden" style={{ background: SURF, borderColor: BORDER }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: BORDER }}>
        <span style={{ color: TEXT2, fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 0 }}>{label}</span>
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  );
}

function MonoBadge({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <span className="px-1.5 py-px rounded-sm" style={{ color, background: bg, fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
      {children}
    </span>
  );
}
