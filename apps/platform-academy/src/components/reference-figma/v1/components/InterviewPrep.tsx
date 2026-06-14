import { useState } from 'react';
import {
  Search, ChevronRight, BookOpen, FlaskConical, CheckCircle2, Circle,
  Download, Star, Plus, AlertTriangle, ArrowRight, Check
} from 'lucide-react';
import { interviewPacks } from '../data';
import type { Level, InterviewPack, InterviewQuestion } from '../data';
import {
  answerWriteupFor,
  buildReferenceCramSheet,
  buildReferenceCramSheetCollection,
  downloadMarkdownFile,
  referenceStudyPlanExists,
  saveReferenceStudyPlan,
} from '../../interviewHelpers';

const LEVEL_COLORS: Record<Level, { bg: string; text: string }> = {
  Fresher: { bg: '#DCFCE7', text: '#166534' },
  Intermediate: { bg: '#DBEAFE', text: '#1E40AF' },
  Advanced: { bg: '#FEF3C7', text: '#92400E' },
};

const DOMAINS = ['All', 'Kubernetes', 'EKS', 'Helm', 'ArgoCD', 'AWS', 'Observability', 'SRE', 'Terraform', 'Platform', 'Incident Response'];

type InterviewPrepProps = {
  onOpenDoc?: (docTitle: string) => void;
  onOpenRelatedLab?: (labTitle: string) => void;
};

export default function InterviewPrep({ onOpenDoc, onOpenRelatedLab }: InterviewPrepProps = {}) {
  const [selectedPackId, setSelectedPackId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<Level | 'All'>('All');
  const [domainFilter, setDomainFilter] = useState('All');
  const [practicedIds, setPracticedIds] = useState<Set<number>>(new Set([1, 2]));

  const filteredPacks = interviewPacks.filter((pack) => {
    const matchesSearch = pack.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'All' || pack.level === levelFilter;
    const matchesDomain = domainFilter === 'All' || pack.domain === domainFilter;
    return matchesSearch && matchesLevel && matchesDomain;
  });
  const selectedPack = filteredPacks.find((p) => p.id === selectedPackId) || filteredPacks[0] || interviewPacks[0];

  const togglePracticed = (questionId: number) => {
    setPracticedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const totalQuestions = interviewPacks.reduce((acc, p) => acc + p.questionCount, 0);
  const practicedTotal = practicedIds.size;

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#F4F4F1' }}>
      {/* Left: Pack list */}
      <div
        className="w-full md:w-[340px] lg:w-[380px] shrink-0 flex flex-col border-r overflow-hidden"
        style={{ background: '#FAFAF7', borderColor: '#E2E2DC' }}
      >
        {/* Header */}
        <div className="p-4 border-b space-y-3" style={{ borderColor: '#E2E2DC' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold" style={{ color: '#1A1D1B' }}>Interview Prep</h2>
              <p className="text-[11px]" style={{ color: '#8A9690' }}>
                {practicedTotal} of {totalQuestions} questions practiced
              </p>
            </div>
            <button
              onClick={() => downloadMarkdownFile('platform-academy-interview-cram-sheets.md', buildReferenceCramSheetCollection('Platform Academy interview cram sheets', filteredPacks))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-[11px] font-medium"
              style={{ background: '#FFFFFF', borderColor: '#E2E2DC', color: '#4A5650' }}
              type="button"
            >
              <Download size={11} /> Cram Sheet
            </button>
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-md border"
            style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}
          >
            <Search size={13} style={{ color: '#9BA8A0' }} />
            <input
              type="text"
              placeholder="Search packs…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-[13px] outline-none bg-transparent"
              style={{ color: '#1A1D1B' }}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1">
            {(['All', 'Fresher', 'Intermediate', 'Advanced'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className="px-2 py-0.5 rounded border text-[10px] font-medium"
                style={{
                  background: levelFilter === lvl ? '#1A1D1B' : '#FFFFFF',
                  color: levelFilter === lvl ? '#FFFFFF' : '#6B7870',
                  borderColor: levelFilter === lvl ? '#1A1D1B' : '#E2E2DC',
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Overall progress */}
        <div className="px-4 py-2 border-b" style={{ borderColor: '#F0F0EC' }}>
          <div className="flex justify-between text-[11px] mb-1" style={{ color: '#8A9690' }}>
            <span>Overall progress</span>
            <span className="tabular-nums">{practicedTotal}/{totalQuestions}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#E2E2DC' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${(practicedTotal / totalQuestions) * 100}%`, background: '#0D9488' }}
            />
          </div>
        </div>

        {/* Pack list */}
        <div className="flex-1 overflow-y-auto">
          {filteredPacks.length === 0
            ? (
              <div className="py-12 text-center">
                <p className="text-[13px]" style={{ color: '#8A9690' }}>No packs found</p>
              </div>
            )
            : filteredPacks.map((pack) => {
              const practicedInPack = pack.questions.filter((q) => practicedIds.has(q.id)).length;
              const levelCol = LEVEL_COLORS[pack.level];
              return (
                <div
                  key={pack.id}
                  className="px-4 py-3 border-b cursor-pointer transition-colors"
                  style={{
                    background: selectedPackId === pack.id ? '#FFFFFF' : 'transparent',
                    borderColor: '#F0F0EC',
                    borderLeft: selectedPackId === pack.id ? '2px solid #0D9488' : '2px solid transparent',
                  }}
                  onClick={() => setSelectedPackId(pack.id)}
                  onMouseEnter={(e) => { if (selectedPackId !== pack.id) e.currentTarget.style.background = '#F4F4F1'; }}
                  onMouseLeave={(e) => { if (selectedPackId !== pack.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[13px] font-medium" style={{ color: '#1A1D1B' }}>{pack.title}</span>
                    <ChevronRight size={13} style={{ color: '#C4C4BC' }} className="shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                      style={{ background: levelCol.bg, color: levelCol.text }}
                    >
                      {pack.level}
                    </span>
                    <span className="text-[10px]" style={{ color: '#8A9690' }}>{pack.domain}</span>
                    <span className="text-[10px]" style={{ color: '#8A9690' }}>
                      {pack.questionCount} Qs · {pack.duration}m
                    </span>
                  </div>
                  {/* Mini progress */}
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: '#E2E2DC' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pack.questions.length > 0 ? (practicedInPack / pack.questions.length) * 100 : 0}%`,
                        background: '#0D9488',
                      }}
                    />
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* Right: Pack detail */}
      <div className="hidden md:flex flex-1 flex-col overflow-y-auto" style={{ background: '#F4F4F1' }}>
        <PackDetail
          pack={selectedPack}
          practicedIds={practicedIds}
          onTogglePracticed={togglePracticed}
          onOpenDoc={onOpenDoc}
          onOpenRelatedLab={onOpenRelatedLab}
        />
      </div>
    </div>
  );
}

function PackDetail({
  pack,
  practicedIds,
  onTogglePracticed,
  onOpenDoc,
  onOpenRelatedLab,
}: {
  pack: InterviewPack;
  practicedIds: Set<number>;
  onTogglePracticed: (id: number) => void;
  onOpenDoc?: (docTitle: string) => void;
  onOpenRelatedLab?: (labTitle: string) => void;
}) {
  const levelCol = LEVEL_COLORS[pack.level];
  const practicedCount = pack.questions.filter((q) => practicedIds.has(q.id)).length;
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [studyPlanIds, setStudyPlanIds] = useState<Set<number>>(new Set());
  const [completedPracticeIds, setCompletedPracticeIds] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState('');
  const activeQuestion = pack.questions.find((q) => q.id === activeQuestionId) ?? pack.questions[0];
  const activeQuestionIndex = activeQuestion ? Math.max(0, pack.questions.findIndex((q) => q.id === activeQuestion.id)) : 0;
  const activeWriteup = activeQuestion ? answerWriteupFor(pack, activeQuestion, activeQuestionIndex) : null;
  const isInStudyPlan = studyPlanIds.has(pack.id) || referenceStudyPlanExists(pack);
  const isPracticeComplete = completedPracticeIds.has(pack.id);

  const DIFFICULTY_COLORS = {
    easy: { bg: '#DCFCE7', text: '#166534' },
    medium: { bg: '#FEF3C7', text: '#92400E' },
    hard: { bg: '#FEF2F2', text: '#DC2626' },
  };

  return (
    <div className="w-full max-w-[1040px] ml-0 mr-auto px-5 py-5 space-y-6">
      {/* Pack header */}
      <div className="rounded-lg border p-5" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-semibold"
                style={{ background: levelCol.bg, color: levelCol.text }}
              >
                {pack.level}
              </span>
              <span className="text-[11px]" style={{ color: '#8A9690' }}>{pack.domain}</span>
              <span className="text-[11px]" style={{ color: '#8A9690' }}>
                {pack.questionCount} questions · ~{pack.duration}m
              </span>
            </div>
            <h2 className="text-[18px] font-semibold" style={{ color: '#1A1D1B' }}>{pack.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border text-[12px] font-medium"
              onClick={() => {
                const result = saveReferenceStudyPlan(pack);
                setStudyPlanIds((prev) => new Set(prev).add(pack.id));
                setStatus(
                  result.created
                    ? `${pack.title} saved as a study plan with ${result.questionCount} questions.`
                    : `${pack.title} study plan updated with ${result.questionCount} questions.`
                );
              }}
              style={{ background: '#FFFFFF', borderColor: isInStudyPlan ? '#0D9488' : '#E2E2DC', color: isInStudyPlan ? '#0D9488' : '#4A5650' }}
              type="button"
            >
              <Plus size={12} /> {isInStudyPlan ? 'In Plan' : 'Study Plan'}
            </button>
            <button
              className="figma-v1-primary-button flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-semibold"
              onClick={() => {
                downloadMarkdownFile(`${pack.slug}-cram-sheet.md`, buildReferenceCramSheet(pack));
                setStatus(`${pack.title} cram sheet downloaded.`);
              }}
              style={{ background: '#0D9488', color: '#FFFFFF' }}
              type="button"
            >
              <Download size={12} /> Cram Sheet
            </button>
          </div>
        </div>
        {status && (
          <p className="text-[11px] mb-3" style={{ color: '#0D9488' }} role="status">
            {status}
          </p>
        )}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#F0F0EC' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${pack.questions.length > 0 ? (practicedCount / pack.questions.length) * 100 : 0}%`,
                background: '#0D9488',
              }}
            />
          </div>
          <span className="text-[11px] tabular-nums" style={{ color: '#8A9690' }}>
            {practicedCount}/{pack.questions.length} practiced
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* Left: questions + practice task */}
        <div className="space-y-4">
          {/* Question queue */}
          <div className="rounded-lg border overflow-hidden" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: '#F0F0EC' }}>
              <h3 className="text-[12px] font-semibold" style={{ color: '#1A1D1B' }}>Question Queue</h3>
            </div>
            <div>
              {pack.questions.map((q, i) => {
                const practiced = practicedIds.has(q.id);
                const diffCol = DIFFICULTY_COLORS[q.difficulty];
                return (
                  <div
                    key={q.id}
                    className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors ${i < pack.questions.length - 1 ? 'border-b' : ''}`}
                    style={{ borderColor: '#F0F0EC', background: activeQuestion?.id === q.id ? '#F7F7F4' : 'transparent' }}
                    onClick={() => setActiveQuestionId(q.id)}
                  >
                    <button
                      aria-label={practiced ? `Mark question ${i + 1} not practiced` : `Mark question ${i + 1} practiced`}
                      aria-pressed={practiced}
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveQuestionId(q.id);
                        onTogglePracticed(q.id);
                      }}
                      className="shrink-0 transition-transform active:scale-95 flex items-center justify-center rounded-md border"
                      style={{ width: 40, height: 40, marginTop: -8, marginBottom: -8, background: 'transparent', borderColor: 'transparent' }}
                      type="button"
                    >
                      {practiced
                        ? <CheckCircle2 size={17} style={{ color: '#0D9488' }} />
                        : <Circle size={17} style={{ color: '#C4C4BC' }} />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[13px] leading-snug"
                        style={{ color: practiced ? '#8A9690' : '#1A1D1B' }}
                      >
                        {q.question}
                      </p>
                    </div>
                    <span
                      className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold mt-0.5"
                      style={{ background: diffCol.bg, color: diffCol.text }}
                    >
                      {q.difficulty}
                    </span>
                  </div>
                );
              })}
              {pack.questions.length < pack.questionCount && (
                <div className="px-4 py-3 border-t" style={{ borderColor: '#F0F0EC' }}>
                  <p className="text-[12px]" style={{ color: '#8A9690' }}>
                    +{pack.questionCount - pack.questions.length} more questions in the full pack
                  </p>
                </div>
              )}
            </div>
          </div>

          {activeWriteup && activeQuestion && (
            <div className="rounded-lg border overflow-hidden" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: '#F0F0EC' }}>
                <h3 className="text-[12px] font-semibold" style={{ color: '#1A1D1B' }}>Answer Write-up</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-[13px] font-semibold leading-snug" style={{ color: '#1A1D1B' }}>
                    {activeQuestion.question}
                  </p>
                  <p className="text-[12px] leading-relaxed mt-2" style={{ color: '#4A5650' }}>
                    {activeWriteup.scenario}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#9BA8A0' }}>
                    Answer outline
                  </h4>
                  <div className="space-y-2">
                    {activeWriteup.outline.map((item, i) => (
                      <div key={item} className="flex items-start gap-2">
                        <span className="text-[10px] tabular-nums mt-0.5" style={{ color: '#0D9488' }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[12px] leading-snug" style={{ color: '#4A5650' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#166534' }}>
                      Good answers include
                    </h4>
                    <div className="space-y-1.5">
                      {activeWriteup.strongSignals.map((item, i) => (
                        <div key={`${item}-${i}`} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: '#16A34A' }} />
                          <span className="text-[12px] leading-snug" style={{ color: '#1A1D1B' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#DC2626' }}>
                      Common mistakes
                    </h4>
                    <div className="space-y-1.5">
                      {activeWriteup.redFlags.map((item, i) => (
                        <div key={`${item}-${i}`} className="flex items-start gap-2">
                          <AlertTriangle size={11} style={{ color: '#DC2626', marginTop: 2, flexShrink: 0 }} />
                          <span className="text-[12px] leading-snug" style={{ color: '#4A5650' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Practice task */}
          <div className="rounded-lg border p-5" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#9BA8A0' }}>
              Practice Task
            </h3>
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#1A1D1B' }}>
              {activeWriteup?.practiceTask ?? pack.practiceTask}
            </p>
            <button
              className="figma-v1-primary-button flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-semibold transition-colors"
              onClick={() => {
                setCompletedPracticeIds((prev) => new Set(prev).add(pack.id));
                setStatus(isPracticeComplete ? 'Practice task already complete.' : 'Practice task marked complete.');
              }}
              style={{ background: isPracticeComplete ? '#166534' : '#0D9488', color: '#FFFFFF' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0F766E')}
              onMouseLeave={(e) => (e.currentTarget.style.background = isPracticeComplete ? '#166534' : '#0D9488')}
              type="button"
            >
              <Check size={13} /> {isPracticeComplete ? 'Task Complete' : 'Mark Task Complete'}
            </button>
          </div>
        </div>

        {/* Right: docs, signals, labs */}
        <div className="space-y-4">
          {/* Docs to read */}
          <div className="rounded-lg border p-4" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#9BA8A0' }}>
              Docs to Read
            </h3>
            <div className="space-y-1.5">
              {pack.docsToRead.map((doc, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-2 cursor-pointer text-left py-1"
                  onClick={() => {
                    if (onOpenDoc) onOpenDoc(doc);
                    else setStatus(`Open ${doc} from the resource library.`);
                  }}
                  style={{ color: '#2563EB' }}
                  type="button"
                >
                  <BookOpen size={11} />
                  <span className="text-[12px] hover:underline">{doc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Related labs */}
          <div className="rounded-lg border p-4" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#9BA8A0' }}>
              Related Labs
            </h3>
            <div className="space-y-1.5">
              {pack.relatedLabs.map((lab, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-2 cursor-pointer text-left py-1"
                  onClick={() => {
                    if (onOpenRelatedLab) onOpenRelatedLab(lab);
                    else setStatus(`Open ${lab} from the labs queue.`);
                  }}
                  style={{ color: '#2563EB' }}
                  type="button"
                >
                  <FlaskConical size={11} />
                  <span className="text-[12px] hover:underline">{lab}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Strong signals */}
          <div className="rounded-lg border p-4" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#166534' }}>
              Strong Signals
            </h3>
            <div className="space-y-2">
              {pack.strongSignals.map((signal, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: '#16A34A' }} />
                  <span className="text-[12px] leading-snug" style={{ color: '#1A1D1B' }}>{signal}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Red flags */}
          <div className="rounded-lg border p-4" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#DC2626' }}>
              Red Flags
            </h3>
            <div className="space-y-2">
              {pack.redFlags.map((flag, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle size={11} style={{ color: '#DC2626', marginTop: 2, flexShrink: 0 }} />
                  <span className="text-[12px] leading-snug" style={{ color: '#1A1D1B' }}>{flag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
