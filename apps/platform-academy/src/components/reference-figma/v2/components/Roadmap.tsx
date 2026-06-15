import { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { roadmapStages, courses, labs, resources, interviewPacks, lessonDetails } from '../data';
import type { Level } from '../data';
import type { Screen } from '../App';
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

const LEVEL_COL: Record<Level, { color: string; bg: string }> = {
  Fresher:      { color: GREEN, bg: GREEN_BG },
  Intermediate: { color: BLUE,  bg: BLUE_BG  },
  Advanced:     { color: AMBER, bg: AMBER_BG },
};

interface RoadmapProps { onNavigate: (s: Screen) => void; }

export default function Roadmap({ onNavigate }: RoadmapProps) {
  const [expanded, setExpanded] = useState<number | null>(3);
  const [levelFilter, setLevelFilter] = useState<Level | 'All'>('All');

  const filtered = levelFilter === 'All' ? roadmapStages : roadmapStages.filter((s) => s.level === levelFilter);
  const done  = roadmapStages.filter((s) => s.completed).length;
  const total = roadmapStages.length;
  const interviewQuestionCount = interviewPacks.reduce((sum, pack) => sum + pack.questionCount, 0);

  const levelSummary = (['Fresher', 'Intermediate', 'Advanced'] as Level[]).map((lvl) => ({
    lvl,
    total: roadmapStages.filter((s) => s.level === lvl).length,
    done:  roadmapStages.filter((s) => s.level === lvl && s.completed).length,
  }));

  return (
    <div className="min-h-full" style={{ background: BG, fontFamily: 'var(--font-sans)' }}>
      <div className="max-w-[1280px] mx-auto px-6 py-6">

        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 style={{ color: TEXT, fontSize: 16, fontWeight: 600 }}>
              Platform Engineering Roadmap
            </h1>
            <p style={{ color: TEXT2, fontSize: 12, marginTop: 2 }}>
              {roadmapStages.length} stages · Fresher → Staff Platform Engineer
            </p>
          </div>
          <div className="text-right">
            <div style={{ color: TEXT, fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
              {done}
              <span style={{ color: TEXT3, fontSize: 16 }}>/{total}</span>
            </div>
            <p style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)', marginTop: 2 }}>stages complete</p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 mb-5">
          <span style={{ color: TEXT2, fontSize: 10, fontFamily: 'var(--font-sans)' }}>Level</span>
          {(['All', 'Fresher', 'Intermediate', 'Advanced'] as const).map((lvl) => {
            const col  = lvl !== 'All' ? LEVEL_COL[lvl as Level] : null;
            const active = levelFilter === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className="px-2.5 py-1 rounded-sm border transition-all text-[10px]"
                data-active={active ? 'true' : 'false'}
                style={{
                  background: active ? (col?.bg || ACCENT_BG) : SURF2,
                  color: active ? (col?.color || ACCENT) : TEXT2,
                  borderColor: active ? alpha(col?.color || ACCENT, 46) : BORDER2,
                  boxShadow: active ? `inset 0 0 0 1px ${alpha(col?.color || ACCENT, 13)}` : 'none',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {lvl === 'All' ? 'All levels' : lvl}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">

          {/* Timeline */}
          <div className="relative">
            {/* Connector line */}
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{ left: 11, background: BORDER2 }}
            />

            <div className="space-y-2">
              {filtered.map((stage) => {
                const col = LEVEL_COL[stage.level];
                const open = expanded === stage.id;

                return (
                  <div key={stage.id} className="relative pl-9">
                    {/* Stage marker */}
                    <div
                      className="absolute flex items-center justify-center rounded-sm"
                      style={{
                        left: 0, top: 11,
                        width: 22, height: 22,
                        background: stage.completed ? GREEN_BG : stage.inProgress ? ACCENT_BG : SURF,
                        border: `1px solid ${stage.completed ? GREEN : stage.inProgress ? ACCENT : BORDER2}`,
                        zIndex: 1,
                      }}
                    >
                      {stage.completed
                        ? <CheckCircle2 size={11} style={{ color: GREEN }} />
                        : <span style={{ color: stage.inProgress ? ACCENT : TEXT3, fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {String(stage.id).padStart(2, '0')}
                          </span>
                      }
                    </div>

                    {/* Card */}
                    <div
                      className="rounded-sm border overflow-hidden transition-all"
                      style={{
                        background: SURF,
                        borderColor: stage.inProgress ? alpha(ACCENT, 25) : BORDER,
                      }}
                    >
                      <button
                        aria-label={`${open ? 'Collapse' : 'Expand'} roadmap stage: ${stage.title}`}
                        aria-expanded={open}
                        className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left"
                        onClick={() => setExpanded(open ? null : stage.id)}
                        type="button"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ color: TEXT, fontSize: 13, fontWeight: 500 }}>{stage.title}</span>
                            {stage.inProgress && (
                              <span
                                className="px-1.5 py-px rounded-sm"
                                style={{ color: ACCENT, background: ACCENT_BG, fontSize: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}
                              >
                                CURRENT
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span
                              className="px-1.5 py-px rounded-sm"
                              style={{ color: col.color, background: col.bg, fontSize: 8, fontFamily: 'var(--font-mono)' }}
                            >
                              {stage.level.toUpperCase()}
                            </span>
                            <span style={{ color: TEXT2, fontSize: 11 }}>{stage.role}</span>
                            <span style={{ color: TEXT3, fontSize: 11 }}>·</span>
                            <span style={{ color: TEXT3, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {stage.focus}
                            </span>
                          </div>
                        </div>
                        <span style={{ color: TEXT3 }}>
                          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </span>
                      </button>

                      {open && (
                        <div
                          className="border-t px-4 py-3 space-y-3"
                          style={{ borderColor: BORDER, background: SURF2 }}
                        >
                          {/* Checkpoints */}
                          <div>
                            <p style={{ color: TEXT3, fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: 8 }}>
                              CHECKPOINTS
                            </p>
                            <div className="space-y-1.5">
                              {stage.checkpoints.map((cp, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  {stage.completed
                                    ? <CheckCircle2 size={11} style={{ color: GREEN, marginTop: 1, flexShrink: 0 }} />
                                    : <Circle size={11} style={{ color: TEXT3, marginTop: 1, flexShrink: 0 }} />}
                                  <span style={{ color: TEXT2, fontSize: 12 }}>{cp}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Courses */}
                          {stage.courses.length > 0 && (
                            <div>
                              <p style={{ color: TEXT3, fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: 8 }}>
                                COURSES
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {stage.courses.map((c, i) => (
                                  <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); onNavigate('lesson'); }}
                                    className="px-2.5 py-1 rounded-sm border text-[11px] transition-colors"
                                    style={{ background: 'transparent', borderColor: BORDER2, color: BLUE }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = BLUE_BG)}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                    type="button"
                                  >
                                    {c}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right rail */}
          <div className="space-y-3">
            {/* Catalog stats */}
            <SidePanel label="CATALOG">
              {[
                { k: 'Courses', v: courses.length }, { k: 'Lessons', v: lessonDetails.length }, { k: 'Labs', v: labs.length },
                { k: 'Resources', v: resources.length }, { k: 'Int. Packs', v: interviewPacks.length }, { k: 'Questions', v: interviewQuestionCount },
              ].map((row) => (
                <div key={row.k} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: BORDER }}>
                  <span style={{ color: TEXT2, fontSize: 11 }}>{row.k}</span>
                  <span style={{ color: TEXT, fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{row.v}</span>
                </div>
              ))}
            </SidePanel>

            {/* Level progress */}
            <SidePanel label="BY LEVEL">
              {levelSummary.map(({ lvl, total, done }) => {
                const col = LEVEL_COL[lvl];
                const pct = total > 0 ? (done / total) * 100 : 0;
                return (
                  <div key={lvl} className="py-2">
                    <div className="flex justify-between mb-1.5">
                      <span style={{ color: col.color, fontSize: 10, fontFamily: 'var(--font-mono)' }}>{lvl.toUpperCase()}</span>
                      <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>{done}/{total}</span>
                    </div>
                    <div className="h-px" style={{ background: BORDER2 }}>
                      <div className="h-px transition-all" style={{ width: `${pct}%`, background: col.color, opacity: 0.8 }} />
                    </div>
                  </div>
                );
              })}
            </SidePanel>

            {/* Role ladder */}
            <SidePanel label="ROLE LADDER">
              {[
                { role: 'Platform Learner',        stages: '1–2',  done: true,  current: false },
                { role: 'Junior Platform Eng.',    stages: '3–4',  done: true,  current: false },
                { role: 'Platform Engineer',       stages: '5–11', done: false, current: true  },
                { role: 'Senior Platform Eng.',    stages: '12–19',done: false, current: false },
                { role: 'Platform Eng. Lead',      stages: '20',   done: false, current: false },
                { role: 'Staff Platform Eng.',     stages: '21',   done: false, current: false },
              ].map((r) => (
                <div
                  key={r.role}
                  className="flex items-center justify-between py-1.5 px-2 rounded-sm"
                  style={{ background: r.current ? ACCENT_BG : 'transparent' }}
                >
                  <span style={{ color: r.current ? ACCENT : r.done ? GREEN : TEXT3, fontSize: 11 }}>
                    {r.role}
                  </span>
                  <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                    {r.stages}
                  </span>
                </div>
              ))}
            </SidePanel>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidePanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border overflow-hidden" style={{ background: SURF, borderColor: BORDER }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: BORDER }}>
        <span style={{ color: TEXT3, fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.1em' }}>{label}</span>
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  );
}
