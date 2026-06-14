import { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { roadmapStages, courses, labs, resources, interviewPacks, lessonDetails } from '../data';
import type { Level } from '../data';
import type { Screen } from '../App';

const LEVEL_COLORS: Record<Level, { bg: string; text: string; border: string; dot: string }> = {
  Fresher: { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0', dot: '#16A34A' },
  Intermediate: { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE', dot: '#2563EB' },
  Advanced: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', dot: '#D97706' },
};

interface RoadmapProps {
  onNavigate: (screen: Screen) => void;
}

export default function Roadmap({ onNavigate }: RoadmapProps) {
  const [expandedId, setExpandedId] = useState<number | null>(3);
  const [levelFilter, setLevelFilter] = useState<Level | 'All'>('All');

  const filteredStages = levelFilter === 'All'
    ? roadmapStages
    : roadmapStages.filter((s) => s.level === levelFilter);

  const completedCount = roadmapStages.filter((s) => s.completed).length;
  const inProgressCount = roadmapStages.filter((s) => s.inProgress).length;
  const interviewQuestionCount = interviewPacks.reduce((sum, pack) => sum + pack.questionCount, 0);

  const levelSummary: Record<Level, { total: number; done: number }> = {
    Fresher: { total: roadmapStages.filter((s) => s.level === 'Fresher').length, done: roadmapStages.filter((s) => s.level === 'Fresher' && s.completed).length },
    Intermediate: { total: roadmapStages.filter((s) => s.level === 'Intermediate').length, done: roadmapStages.filter((s) => s.level === 'Intermediate' && s.completed).length },
    Advanced: { total: roadmapStages.filter((s) => s.level === 'Advanced').length, done: roadmapStages.filter((s) => s.level === 'Advanced' && s.completed).length },
  };

  return (
    <div className="min-h-full" style={{ background: '#F4F4F1' }}>
      <div className="max-w-[1280px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[18px] font-semibold mb-1" style={{ color: '#1A1D1B' }}>
              Platform Engineering Roadmap
            </h1>
            <p className="text-[13px]" style={{ color: '#6B7870' }}>
              {roadmapStages.length} stages · career progression from Fresher to Staff Platform Engineer
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[22px] font-bold tabular-nums" style={{ color: '#1A1D1B' }}>
                {completedCount}<span className="text-[14px] font-normal" style={{ color: '#8A9690' }}>/21</span>
              </p>
              <p className="text-[11px]" style={{ color: '#8A9690' }}>stages complete</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[11px] font-medium" style={{ color: '#8A9690' }}>Filter:</span>
          {(['All', 'Fresher', 'Intermediate', 'Advanced'] as const).map((lvl) => {
            const col = lvl !== 'All' ? LEVEL_COLORS[lvl] : null;
            return (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className="px-3 py-1 rounded-full border text-[11px] font-medium transition-all"
                style={{
                  background: levelFilter === lvl ? (col?.bg || '#1A1D1B') : '#FFFFFF',
                  color: levelFilter === lvl ? (col?.text || '#FFFFFF') : '#6B7870',
                  borderColor: levelFilter === lvl ? (col?.border || '#1A1D1B') : '#E2E2DC',
                }}
              >
                {lvl}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_256px] gap-6">
          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-[19px] top-0 bottom-0 w-px"
              style={{ background: '#E2E2DC' }}
            />

            <div className="space-y-3">
              {filteredStages.map((stage) => {
                const col = LEVEL_COLORS[stage.level];
                const isExpanded = expandedId === stage.id;
                const isActive = stage.inProgress;

                return (
                  <div key={stage.id} className="relative pl-10">
                    {/* Stage dot */}
                    <div
                      className="absolute left-[10px] top-[14px] w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center z-10"
                      style={{
                        background: stage.completed ? '#0D9488' : isActive ? '#FFFFFF' : '#F4F4F1',
                        borderColor: stage.completed ? '#0D9488' : isActive ? '#0D9488' : '#C4C4BC',
                      }}
                    >
                      {stage.completed
                        ? <CheckCircle2 size={10} style={{ color: '#FFFFFF' }} />
                        : isActive
                          ? <div className="w-2 h-2 rounded-full" style={{ background: '#0D9488' }} />
                          : <span className="text-[8px] font-bold" style={{ color: '#C4C4BC' }}>{stage.id}</span>
                      }
                    </div>

                    {/* Stage card */}
                    <div
                      className="rounded-lg border overflow-hidden cursor-pointer"
                      style={{
                        background: '#FFFFFF',
                        borderColor: isActive ? '#0D9488' : '#E2E2DC',
                        boxShadow: isActive ? '0 0 0 1px #0D9488' : 'none',
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : stage.id)}
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        {/* Stage number */}
                        <span
                          className="text-[11px] font-mono font-bold shrink-0 w-6 text-center"
                          style={{ color: '#9BA8A0' }}
                        >
                          {String(stage.id).padStart(2, '0')}
                        </span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-semibold" style={{ color: '#1A1D1B' }}>
                              {stage.title}
                            </span>
                            {isActive && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                                style={{ background: '#DDFAF6', color: '#0F766E' }}
                              >
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                              style={{ background: col.bg, color: col.text }}
                            >
                              {stage.level}
                            </span>
                            <span className="text-[11px]" style={{ color: '#8A9690' }}>{stage.role}</span>
                            <span className="text-[11px]" style={{ color: '#C4C4BC' }}>·</span>
                            <span className="text-[11px] truncate" style={{ color: '#8A9690' }}>{stage.focus}</span>
                          </div>
                        </div>

                        {/* Expand chevron */}
                        <div className="shrink-0" style={{ color: '#C4C4BC' }}>
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t px-4 py-3 space-y-3" style={{ borderColor: '#F0F0EC', background: '#FAFAF7' }}>
                          {/* Checkpoints */}
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#9BA8A0' }}>
                              Checkpoints
                            </p>
                            <div className="space-y-1.5">
                              {stage.checkpoints.map((cp, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  {stage.completed
                                    ? <CheckCircle2 size={12} style={{ color: '#0D9488', marginTop: 1 }} />
                                    : <Circle size={12} style={{ color: '#C4C4BC', marginTop: 1 }} />
                                  }
                                  <span className="text-[12px]" style={{ color: '#4A5650' }}>{cp}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Related courses */}
                          {stage.courses.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#9BA8A0' }}>
                                Related Courses
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {stage.courses.map((courseName, i) => (
                                  <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); onNavigate('lesson'); }}
                                    className="px-2.5 py-1 rounded border text-[11px] font-medium transition-colors"
                                    style={{ background: '#FFFFFF', borderColor: '#E2E2DC', color: '#2563EB' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF6FF')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                                  >
                                    {courseName}
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
          <div className="space-y-4">
            {/* Catalog summary */}
            <div
              className="rounded-lg border p-4"
              style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#8A9690' }}>
                Catalog Summary
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Courses', value: courses.length, icon: '◫' },
                  { label: 'Lessons', value: lessonDetails.length, icon: '◈' },
                  { label: 'Labs', value: labs.length, icon: '⊛' },
                  { label: 'Resources', value: resources.length, icon: '◻' },
                  { label: 'Interview Packs', value: interviewPacks.length, icon: '◎' },
                  { label: 'Questions', value: interviewQuestionCount, icon: '?' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1 border-b last:border-0" style={{ borderColor: '#F0F0EC' }}>
                    <span className="text-[12px] flex items-center gap-2" style={{ color: '#6B7870' }}>
                      <span style={{ color: '#C4C4BC' }}>{item.icon}</span> {item.label}
                    </span>
                    <span className="text-[13px] font-bold tabular-nums" style={{ color: '#1A1D1B' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Level summary */}
            <div
              className="rounded-lg border p-4"
              style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#8A9690' }}>
                Level Summary
              </p>
              <div className="space-y-3">
                {(Object.entries(levelSummary) as [Level, { total: number; done: number }][]).map(([level, { total, done }]) => {
                  const col = LEVEL_COLORS[level];
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <div key={level}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[12px] font-medium" style={{ color: col.text }}>{level}</span>
                        <span className="text-[11px] tabular-nums" style={{ color: '#8A9690' }}>{done}/{total} stages</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0F0EC' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: col.dot }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Role progression */}
            <div
              className="rounded-lg border p-4"
              style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#8A9690' }}>
                Role Progression
              </p>
              <div className="space-y-1.5">
                {[
                  { role: 'Platform Learner', stages: '1–2', done: true },
                  { role: 'Junior Platform Engineer', stages: '3–4', done: true },
                  { role: 'Platform Engineer', stages: '5–11', current: true },
                  { role: 'Senior Platform Engineer', stages: '12–19', done: false },
                  { role: 'Platform Engineer Lead', stages: '20', done: false },
                  { role: 'Staff Platform Engineer', stages: '21', done: false },
                ].map((r) => (
                  <div
                    key={r.role}
                    className="flex items-center justify-between py-1.5 px-2 rounded"
                    style={{
                      background: r.current ? '#DDFAF6' : 'transparent',
                    }}
                  >
                    <span className="text-[11px] font-medium" style={{ color: r.current ? '#0F766E' : r.done ? '#4A5650' : '#9BA8A0' }}>
                      {r.role}
                    </span>
                    <span className="text-[10px]" style={{ color: '#9BA8A0' }}>Stage {r.stages}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
