import { useEffect, useMemo, useState } from 'react';
import { Search, Clock, CheckCircle2, Circle, AlertCircle, Send, Star, Server, FileText, ArrowRight } from 'lucide-react';
import { labStateKey, REFERENCE_PROGRESS_EVENT } from '../../localProgress';
import { labs } from '../data';
import type { Lab, Level, LabRuntime, LabStatus } from '../data';
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
  SURF3,
  TERMINAL,
  TEXT,
  TEXT2,
  TEXT3,
  alpha,
} from '../themeTokens';

const STATUS_CFG: Record<LabStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  'not-started':    { label: 'Not started',    color: TEXT3,  bg: SURF2,    icon: <Circle      size={10} /> },
  'in-progress':    { label: 'In progress',    color: AMBER,  bg: AMBER_BG, icon: <AlertCircle size={10} /> },
  'strong-evidence':{ label: 'Strong evidence',color: BLUE,   bg: BLUE_BG,  icon: <CheckCircle2 size={10} /> },
  'submitted':      { label: 'Submitted',      color: GREEN,  bg: GREEN_BG, icon: <Send        size={10} /> },
};

const LEVEL_COL: Record<Level, { color: string; bg: string }> = {
  Fresher:      { color: GREEN, bg: GREEN_BG },
  Intermediate: { color: BLUE,  bg: BLUE_BG  },
  Advanced:     { color: AMBER, bg: AMBER_BG },
};

function levelLabel(level: Level | 'All') {
  return level === 'All' ? 'All levels' : level;
}

function runtimeLabel(runtime: LabRuntime | 'All') {
  if (runtime === 'All') return 'All runtimes';
  return runtime === 'cluster' ? 'Cluster' : 'File-only';
}

type StoredLabState = {
  checklist?: Record<string, boolean>;
  evidence?: Record<string, boolean>;
  workbookAnswers?: string[];
  submitted?: boolean;
  savedAt?: string;
};

function readStoredLabState(slug: string): StoredLabState {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(labStateKey(slug)) || '{}') as StoredLabState;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function completedChecklistCount(state: StoredLabState) {
  return Object.values(state.checklist ?? {}).filter(Boolean).length;
}

function hasStoredProgress(state: StoredLabState) {
  return (
    completedChecklistCount(state) > 0 ||
    Boolean(state.savedAt) ||
    Boolean(state.workbookAnswers?.some((answer) => answer.trim().length > 0)) ||
    Boolean(Object.entries(state.evidence ?? {}).some(([term, attached]) => term !== 'namespace-yaml' && attached))
  );
}

function statusForStoredLab(state: StoredLabState): LabStatus {
  if (state.submitted) return 'submitted';
  return hasStoredProgress(state) ? 'in-progress' : 'not-started';
}

interface LabsQueueProps { onOpenLab: (id: number) => void; }

export default function LabsQueue({ onOpenLab }: LabsQueueProps) {
  const [selectedId, setSelectedId]       = useState(2);
  const [search, setSearch]               = useState('');
  const [levelFilter, setLevelFilter]     = useState<Level | 'All'>('All');
  const [runtimeFilter, setRuntimeFilter] = useState<LabRuntime | 'All'>('All');
  const [statusFilter, setStatusFilter]   = useState<LabStatus | 'All'>('All');
  const [starredIds, setStarredIds]       = useState<Set<number>>(new Set());
  const [progressVersion, setProgressVersion] = useState(0);

  useEffect(() => {
    const refreshProgress = () => setProgressVersion((version) => version + 1);
    window.addEventListener(REFERENCE_PROGRESS_EVENT, refreshProgress);
    window.addEventListener('storage', refreshProgress);
    return () => {
      window.removeEventListener(REFERENCE_PROGRESS_EVENT, refreshProgress);
      window.removeEventListener('storage', refreshProgress);
    };
  }, []);

  const labStateBySlug = useMemo(
    () => new Map(labs.map((lab) => [lab.slug, readStoredLabState(lab.slug)])),
    [progressVersion]
  );
  const getStoredState = (lab: Lab) => labStateBySlug.get(lab.slug) ?? {};
  const getEffectiveStatus = (lab: Lab) => statusForStoredLab(getStoredState(lab));
  const getCompletedCount = (lab: Lab) => completedChecklistCount(getStoredState(lab));

  const selected = labs.find((l) => l.id === selectedId) || labs[0];
  const chooseLab = (id: number) => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      onOpenLab(id);
      return;
    }
    setSelectedId(id);
  };
  const toggleStar = (id: number) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = labs.filter((lab) => {
    const q  = lab.title.toLowerCase().includes(search.toLowerCase()) || lab.track.toLowerCase().includes(search.toLowerCase());
    const lv = levelFilter  === 'All' || lab.level   === levelFilter;
    const rt = runtimeFilter=== 'All' || lab.runtime === runtimeFilter;
    const st = statusFilter === 'All' || getEffectiveStatus(lab) === statusFilter;
    return q && lv && rt && st;
  });

  return (
    <div className="flex h-full overflow-hidden" style={{ background: BG }}>

      {/* ── Left pane ─────────────────────────────────────── */}
      <div
        className="figma-v2-labs-rail w-full md:w-[340px] lg:w-[380px] shrink-0 flex flex-col border-r overflow-hidden"
        style={{ background: SURF, borderColor: BORDER }}
      >
        {/* Search */}
        <div className="p-3 border-b space-y-2" style={{ borderColor: BORDER }}>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-sm border"
            style={{ background: SURF2, borderColor: BORDER }}
          >
            <Search size={12} style={{ color: TEXT2 }} />
            <input
              type="text"
              placeholder="filter labs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none bg-transparent"
              style={{ color: TEXT, fontSize: 12, fontFamily: 'var(--font-mono)' }}
            />
          </div>

          {/* Filter chips */}
          <div className="space-y-1.5">
            <FilterGroup label="Level">
              {(['All', 'Fresher', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                <Chip key={lvl} active={levelFilter === lvl} onClick={() => setLevelFilter(lvl)}
                  color={lvl !== 'All' ? LEVEL_COL[lvl as Level].color : undefined}>
                  {levelLabel(lvl)}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="Runtime">
              {(['All', 'cluster', 'file-only'] as const).map((rt) => (
                <Chip key={rt} active={runtimeFilter === rt} onClick={() => setRuntimeFilter(rt)}>
                  {runtimeLabel(rt)}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="Status">
              {(['All', 'not-started', 'in-progress', 'submitted'] as const).map((st) => {
                const cfg = st !== 'All' ? STATUS_CFG[st] : null;
                return (
                  <Chip key={st} active={statusFilter === st}
                    color={cfg?.color}
                    onClick={() => setStatusFilter(st)}>
                    {st === 'All' ? 'All status' : cfg?.label || st}
                  </Chip>
                );
              })}
            </FilterGroup>
          </div>
        </div>

        {/* Count */}
        <div className="px-4 py-1.5 border-b" style={{ borderColor: BORDER }}>
          <span style={{ color: TEXT2, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
            {filtered.length}/{labs.length} labs
          </span>
        </div>

        {/* Lab list */}
        <div className="flex-1 overflow-y-auto" role="region" aria-label="Lab queue" tabIndex={0}>
          {filtered.map((lab) => {
            const status = STATUS_CFG[getEffectiveStatus(lab)];
            const lvlCol = LEVEL_COL[lab.level];
            const active = lab.id === selectedId;
            const starred = starredIds.has(lab.id);
            return (
              <article
                key={lab.id}
                className="px-4 py-3 border-b cursor-pointer transition-all"
                style={{
                  borderColor: BORDER,
                  background: active ? SURF3 : 'transparent',
                  borderLeft: `2px solid ${active ? ACCENT : 'transparent'}`,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = SURF2; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <div className="flex items-start gap-2 mb-1">
                  <button
                    aria-label={`Select lab: ${lab.title}`}
                    aria-pressed={active}
                    className="min-w-0 flex-1 text-left"
                    onClick={() => chooseLab(lab.id)}
                    style={{
                      background: 'transparent',
                      border: 0,
                      color: 'inherit',
                      padding: 0,
                    }}
                    type="button"
                  >
                    <p style={{ color: active ? TEXT : TEXT2, fontSize: 13, fontWeight: 500, marginBottom: 0 }}>
                      {lab.title}
                    </p>
                  </button>
                  <button
                    aria-label={starred ? `Unstar ${lab.title}` : `Star ${lab.title}`}
                    aria-pressed={starred}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleStar(lab.id);
                    }}
                    className="flex items-center justify-center rounded-sm border transition-all"
                    style={{
                      width: 26,
                      height: 26,
                      borderColor: starred ? alpha(AMBER, 44) : BORDER2,
                      background: starred ? AMBER_BG : 'transparent',
                      color: starred ? AMBER : TEXT3,
                    }}
                    type="button"
                  >
                    <Star size={12} fill={starred ? AMBER : 'none'} />
                  </button>
                </div>
                <button
                  aria-label={`Select lab details: ${lab.title}`}
                  className="w-full text-left"
                  onClick={() => chooseLab(lab.id)}
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: 'inherit',
                    padding: 0,
                  }}
                  type="button"
                >
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>{lab.track}</span>
                    <MonoBadge color={lvlCol.color} bg={lvlCol.bg}>{lab.level}</MonoBadge>
                    <MonoBadge color={lab.runtime === 'cluster' ? BLUE : TEXT2} bg={lab.runtime === 'cluster' ? BLUE_BG : SURF2}>
                      {runtimeLabel(lab.runtime)}
                    </MonoBadge>
                    <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                      {lab.duration}m
                    </span>
                    {lab.portfolioGrade && (
                      <MonoBadge color={AMBER} bg={AMBER_BG}>Portfolio</MonoBadge>
                    )}
                  </div>
                  <div className="mt-2">
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-px rounded-sm"
                      style={{ color: status.color, background: status.bg, fontSize: 9, fontFamily: 'var(--font-mono)' }}
                    >
                      {status.icon} {status.label}
                    </span>
                  </div>
                </button>
                <button
                  aria-label={`Open workbook: ${lab.title}`}
                  className="figma-v2-primary-button mt-3 w-full py-2 rounded-sm border text-[10px] md:hidden"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenLab(lab.id);
                  }}
                  style={{ background: ACCENT_BG, borderColor: alpha(ACCENT, 25), color: ACCENT, fontFamily: 'var(--font-mono)' }}
                  type="button"
                >
                  Open workbook
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {/* ── Right preview pane ────────────────────────────── */}
      <div className="figma-v2-main-pane hidden md:flex flex-1 flex-col overflow-hidden" style={{ background: BG }}>
        <LabPreview
          lab={selected}
          status={getEffectiveStatus(selected)}
          completedCount={getCompletedCount(selected)}
          starred={starredIds.has(selected.id)}
          onToggleStar={() => toggleStar(selected.id)}
          onOpen={() => onOpenLab(selected.id)}
        />
      </div>
    </div>
  );
}

function LabPreview({
  lab,
  status,
  completedCount,
  starred,
  onToggleStar,
  onOpen
}: {
  lab: Lab;
  status: LabStatus;
  completedCount: number;
  starred: boolean;
  onToggleStar: () => void;
  onOpen: () => void;
}) {
  const statusCfg  = STATUS_CFG[status];
  const lvlCol  = LEVEL_COL[lab.level];
  const done    = completedCount;
  const pct     = Math.round((done / lab.checklist.length) * 100);

  return (
    <div className="flex-1 overflow-y-auto" role="region" aria-label="Selected lab preview" tabIndex={0}>
      {/* Preview header */}
      <div className="px-6 py-4 border-b sticky top-0 z-10" style={{ background: SURF, borderColor: BORDER }}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-2 items-center">
              <MonoBadge color={lvlCol.color} bg={lvlCol.bg}>{lab.level}</MonoBadge>
              <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>{lab.track}</span>
              <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>{lab.duration}m</span>
              <MonoBadge color={statusCfg.color} bg={statusCfg.bg}>{statusCfg.label}</MonoBadge>
              {lab.portfolioGrade && <MonoBadge color={AMBER} bg={AMBER_BG}>Portfolio</MonoBadge>}
            </div>
            <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 600, lineHeight: 1.3 }}>{lab.title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              aria-label={starred ? `Unstar ${lab.title}` : `Star ${lab.title}`}
              aria-pressed={starred}
              onClick={onToggleStar}
              className="flex items-center gap-1.5 px-3 py-2 rounded-sm border transition-all"
              style={{ background: starred ? AMBER_BG : 'transparent', borderColor: starred ? alpha(AMBER, 31) : BORDER2, color: starred ? AMBER : TEXT2, fontSize: 10, fontFamily: 'var(--font-mono)' }}
              type="button"
            >
              <Star size={11} fill={starred ? AMBER : 'none'} /> {starred ? 'Starred' : 'Star lab'}
            </button>
            <button
              onClick={onOpen}
              className="figma-v2-primary-button flex items-center gap-1.5 px-3 py-2 rounded-sm border transition-all"
              style={{ background: ACCENT_BG, borderColor: alpha(ACCENT, 25), color: ACCENT, fontSize: 11, fontFamily: 'var(--font-mono)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = alpha(ACCENT, 50))}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = alpha(ACCENT, 25))}
              type="button"
            >
              Open workbook <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Scenario */}
        <Section label="SCENARIO">
          <p style={{ color: TEXT2, fontSize: 13, lineHeight: 1.7 }}>{lab.scenario}</p>
        </Section>

        {/* Skills */}
        <Section label="SKILLS PRACTICED">
          <div className="flex flex-wrap gap-1.5">
            {lab.skills.map((s, i) => (
              <span key={i} className="px-2 py-1 rounded-sm border" style={{ borderColor: BORDER2, color: TEXT2, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                {s}
              </span>
            ))}
          </div>
        </Section>

        {/* Validation commands */}
        <Section label="VALIDATION COMMANDS">
          <div className="rounded-sm overflow-hidden" style={{ background: TERMINAL, border: `1px solid ${BORDER}` }}>
            <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: BORDER2 }}>
              <div className="flex gap-1">
                {['#1C2030', '#1C2030', '#1A3020'].map((c, i) => (
                  <div key={i} className="w-2 h-2 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <span style={{ color: ACCENT, fontSize: 9, fontFamily: 'var(--font-mono)', opacity: 0.85 }}>validation</span>
            </div>
            <div className="p-4 space-y-2.5">
              {lab.validationCommands.map((cmd, i) => (
                <div key={i} className="flex gap-2">
                  <span style={{ color: ACCENT, fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.6, flexShrink: 0 }}>$</span>
                  <code style={{ color: CODE_TEXT, fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.6, wordBreak: 'break-all' }}>
                    {cmd}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Checklist */}
        <Section label={`CHECKLIST · ${done}/${lab.checklist.length}`}>
          <div className="h-px mb-3" style={{ background: BORDER2 }}>
            <div className="h-px transition-all" style={{ width: `${pct}%`, background: ACCENT, opacity: 0.7 }} />
          </div>
          <div className="space-y-1.5">
            {lab.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                {item.completed
                  ? <CheckCircle2 size={12} style={{ color: GREEN, flexShrink: 0 }} />
                  : <Circle size={12} style={{ color: TEXT3, flexShrink: 0 }} />}
                <span style={{ color: item.completed ? TEXT3 : TEXT2, fontSize: 12, textDecoration: item.completed ? 'line-through' : 'none' }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <button
          aria-label={`Open full workbook: ${lab.title}`}
          onClick={onOpen}
          className="figma-v2-primary-button w-full py-2.5 rounded-sm border transition-all flex items-center justify-center gap-2"
          style={{ background: ACCENT_BG, borderColor: alpha(ACCENT, 25), color: ACCENT, fontSize: 11, fontFamily: 'var(--font-mono)' }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = alpha(ACCENT, 50))}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = alpha(ACCENT, 25))}
          type="button"
        >
          Open full workbook <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ color: TEXT3, fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: 10 }}>{label}</p>
      {children}
    </div>
  );
}

function MonoBadge({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <span
      className="px-1.5 py-px rounded-sm"
      style={{ color, background: bg, fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
    >
      {children}
    </span>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[64px_1fr] gap-2 items-start">
      <span style={{ color: TEXT2, fontSize: 10, fontFamily: 'var(--font-sans)', letterSpacing: 0, paddingTop: 5 }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, color, children }: { active: boolean; onClick: () => void; color?: string; children: React.ReactNode }) {
  const chipColor = color || ACCENT;
  return (
    <button
      aria-pressed={active}
      onClick={onClick}
      className="figma-v2-chip px-2 py-1 rounded-sm border transition-all"
      data-active={active ? 'true' : 'false'}
      style={{
        background: active ? (color ? alpha(color, 14) : ACCENT_BG) : SURF2,
        color: active ? chipColor : TEXT2,
        borderColor: active ? alpha(chipColor, 46) : BORDER2,
        boxShadow: active ? `inset 0 0 0 1px ${alpha(chipColor, 13)}` : 'none',
        fontSize: 10,
        fontFamily: 'var(--font-sans)',
      } as React.CSSProperties}
      type="button"
    >
      {children}
    </button>
  );
}
