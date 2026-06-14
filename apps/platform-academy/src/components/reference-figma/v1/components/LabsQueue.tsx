import { useState } from 'react';
import {
  Search, Filter, Clock, CheckCircle2, Circle,
  AlertCircle, Send, Star, Server, FileText, ArrowRight
} from 'lucide-react';
import { labs } from '../data';
import type { Lab, Level, LabRuntime, LabStatus } from '../data';

const STATUS_CONFIG: Record<LabStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  'not-started': { label: 'Not started', bg: '#F0F0EC', text: '#6B7870', icon: <Circle size={11} /> },
  'in-progress': { label: 'In progress', bg: '#FEF3C7', text: '#92400E', icon: <AlertCircle size={11} /> },
  'strong-evidence': { label: 'Strong evidence', bg: '#DBEAFE', text: '#1E40AF', icon: <CheckCircle2 size={11} /> },
  'submitted': { label: 'Submitted', bg: '#DCFCE7', text: '#166534', icon: <Send size={11} /> },
};

const LEVEL_COLORS: Record<Level, { bg: string; text: string }> = {
  Fresher: { bg: '#DCFCE7', text: '#166534' },
  Intermediate: { bg: '#DBEAFE', text: '#1E40AF' },
  Advanced: { bg: '#FEF3C7', text: '#92400E' },
};

interface LabsQueueProps {
  onOpenLab: (id: number) => void;
}

export default function LabsQueue({ onOpenLab }: LabsQueueProps) {
  const [selectedLabId, setSelectedLabId] = useState<number>(2);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<Level | 'All'>('All');
  const [runtimeFilter, setRuntimeFilter] = useState<LabRuntime | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<LabStatus | 'All'>('All');
  const [starredIds, setStarredIds] = useState<Set<number>>(new Set());

  const selectedLab = labs.find((l) => l.id === selectedLabId) || labs[0];
  const toggleStar = (id: number) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredLabs = labs.filter((lab) => {
    const matchesSearch = lab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.track.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'All' || lab.level === levelFilter;
    const matchesRuntime = runtimeFilter === 'All' || lab.runtime === runtimeFilter;
    const matchesStatus = statusFilter === 'All' || lab.status === statusFilter;
    return matchesSearch && matchesLevel && matchesRuntime && matchesStatus;
  });

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#F4F4F1' }}>
      {/* Left: Lab list */}
      <div
        className="w-full md:w-[340px] lg:w-[380px] shrink-0 flex flex-col border-r overflow-hidden"
        style={{ background: '#FAFAF7', borderColor: '#E2E2DC' }}
      >
        {/* Search + filters */}
        <div className="p-4 border-b space-y-3" style={{ borderColor: '#E2E2DC' }}>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-md border"
            style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}
          >
            <Search size={13} style={{ color: '#9BA8A0' }} />
            <input
              type="text"
              placeholder="Search labs…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-[13px] outline-none bg-transparent"
              style={{ color: '#1A1D1B' }}
            />
          </div>

          {/* Filter chips */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1">
              {(['All', 'Fresher', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className="px-2 py-0.5 rounded border text-[10px] font-medium transition-all"
                  style={{
                    background: levelFilter === lvl ? '#1A1D1B' : '#FFFFFF',
                    color: levelFilter === lvl ? '#FFFFFF' : '#6B7870',
                    borderColor: levelFilter === lvl ? '#1A1D1B' : '#E2E2DC',
                  }}
                >
                  {lvl}
                </button>
              ))}
              <div className="w-px h-4 self-center mx-1" style={{ background: '#E2E2DC' }} />
              <button
                onClick={() => setRuntimeFilter('All')}
                className="px-2 py-0.5 rounded border text-[10px] font-medium transition-all"
                style={{
                  background: runtimeFilter === 'All' ? '#1A1D1B' : '#FFFFFF',
                  color: runtimeFilter === 'All' ? '#FFFFFF' : '#6B7870',
                  borderColor: runtimeFilter === 'All' ? '#1A1D1B' : '#E2E2DC',
                }}
              >
                All runtimes
              </button>
              <span className="basis-full h-0" aria-hidden="true" />
              {(['cluster', 'file-only'] as const).map((rt) => (
                <button
                  key={rt}
                  onClick={() => setRuntimeFilter(rt)}
                  className="px-2 py-0.5 rounded border text-[10px] font-medium transition-all"
                  style={{
                    background: runtimeFilter === rt ? '#1A1D1B' : '#FFFFFF',
                    color: runtimeFilter === rt ? '#FFFFFF' : '#6B7870',
                    borderColor: runtimeFilter === rt ? '#1A1D1B' : '#E2E2DC',
                  }}
                >
                  {rt === 'cluster' ? 'Cluster' : 'File-only'}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {(['All', 'not-started', 'in-progress', 'submitted'] as const).map((st) => {
                const config = st === 'All' ? null : STATUS_CONFIG[st];
                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className="px-2 py-0.5 rounded border text-[10px] font-medium transition-all"
                    style={{
                      background: statusFilter === st ? '#1A1D1B' : '#FFFFFF',
                      color: statusFilter === st ? '#FFFFFF' : '#6B7870',
                      borderColor: statusFilter === st ? '#1A1D1B' : '#E2E2DC',
                    }}
                  >
                    {st === 'All' ? 'All status' : config?.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Result count */}
        <div className="px-4 py-2 border-b" style={{ borderColor: '#F0F0EC' }}>
          <p className="text-[11px]" style={{ color: '#8A9690' }}>
            {filteredLabs.length} of {labs.length} labs
          </p>
        </div>

        {/* Lab list */}
        <div className="flex-1 overflow-y-auto">
          {filteredLabs.length === 0
            ? (
              <div className="py-12 text-center">
                <p className="text-[13px]" style={{ color: '#8A9690' }}>No labs match your filters</p>
              </div>
            )
            : filteredLabs.map((lab) => (
              <LabRow
                key={lab.id}
                lab={lab}
                selected={lab.id === selectedLabId}
                starred={starredIds.has(lab.id)}
                onClick={() => setSelectedLabId(lab.id)}
                onToggleStar={() => toggleStar(lab.id)}
              />
            ))
          }
        </div>
      </div>

      {/* Right: Preview pane */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        {selectedLab
          ? (
            <LabPreview
              lab={selectedLab}
              starred={starredIds.has(selectedLab.id)}
              onToggleStar={() => toggleStar(selectedLab.id)}
              onOpenFull={() => onOpenLab(selectedLab.id)}
            />
          )
          : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[13px]" style={{ color: '#8A9690' }}>Select a lab to preview</p>
            </div>
          )
        }
      </div>
    </div>
  );
}

function LabRow({ lab, selected, starred, onClick, onToggleStar }: { lab: Lab; selected: boolean; starred: boolean; onClick: () => void; onToggleStar: () => void }) {
  const statusCfg = STATUS_CONFIG[lab.status];
  const levelCol = LEVEL_COLORS[lab.level];

  return (
    <div
      className="px-4 py-3 border-b cursor-pointer transition-colors"
      style={{
        background: selected ? '#FFFFFF' : 'transparent',
        borderColor: '#F0F0EC',
        borderLeft: selected ? '2px solid #0D9488' : '2px solid transparent',
      }}
      onClick={onClick}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = '#F4F4F1'; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[13px] font-medium leading-snug" style={{ color: '#1A1D1B' }}>
          {lab.title}
        </span>
        <div className="flex items-center shrink-0">
          <button
            aria-label={starred ? `Unstar ${lab.title}` : `Star ${lab.title}`}
            aria-pressed={starred}
            onClick={(event) => {
              event.stopPropagation();
              onToggleStar();
            }}
            className="flex items-center justify-center rounded border transition-colors"
            style={{
              width: 26,
              height: 26,
              background: starred ? '#FEF3C7' : '#FFFFFF',
              borderColor: starred ? '#F59E0B' : '#E2E2DC',
              color: starred ? '#92400E' : '#C4C4BC',
            }}
            type="button"
          >
            <Star size={12} fill={starred ? '#F59E0B' : 'none'} />
          </button>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-1.5">
        {/* Track */}
        <span className="text-[10px]" style={{ color: '#8A9690' }}>{lab.track}</span>

        {/* Level badge */}
        <span
          className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
          style={{ background: levelCol.bg, color: levelCol.text }}
        >
          {lab.level}
        </span>

        {/* Runtime badge */}
        <span
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
          style={
            lab.runtime === 'cluster'
              ? { background: '#EFF6FF', color: '#1E40AF' }
              : { background: '#F0F0EC', color: '#4A5650' }
          }
        >
          {lab.runtime === 'cluster' ? <Server size={9} /> : <FileText size={9} />}
          {lab.runtime === 'cluster' ? 'Cluster' : 'File-only'}
        </span>

        {/* Duration */}
        <span className="flex items-center gap-1 text-[10px]" style={{ color: '#9BA8A0' }}>
          <Clock size={9} /> {lab.duration}m
        </span>

        {/* Portfolio badge */}
        {lab.portfolioGrade && (
          <span
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
            style={{ background: '#F5F3FF', color: '#6D28D9' }}
          >
            <Star size={8} /> Portfolio
          </span>
        )}
      </div>

      {/* Status */}
      <div className="mt-1.5">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
          style={{ background: statusCfg.bg, color: statusCfg.text }}
        >
          {statusCfg.icon}
          {statusCfg.label}
        </span>
      </div>
    </div>
  );
}

function LabPreview({ lab, starred, onToggleStar, onOpenFull }: { lab: Lab; starred: boolean; onToggleStar: () => void; onOpenFull: () => void }) {
  const levelCol = LEVEL_COLORS[lab.level];
  const statusCfg = STATUS_CONFIG[lab.status];
  const completedSteps = lab.checklist.filter((c) => c.completed).length;

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#F4F4F1' }}>
      {/* Preview header */}
      <div className="px-6 py-5 border-b" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1.5">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-semibold"
                style={{ background: levelCol.bg, color: levelCol.text }}
              >
                {lab.level}
              </span>
              <span className="text-[11px]" style={{ color: '#8A9690' }}>{lab.track}</span>
              <span className="flex items-center gap-1 text-[11px]" style={{ color: '#8A9690' }}>
                <Clock size={10} /> {lab.duration}m
              </span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-medium"
                style={{ background: statusCfg.bg, color: statusCfg.text }}
              >
                {statusCfg.label}
              </span>
            </div>
            <h2 className="text-[18px] font-semibold leading-snug" style={{ color: '#1A1D1B' }}>{lab.title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              aria-pressed={starred}
              onClick={onToggleStar}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border text-[12px] font-semibold transition-colors"
              style={{
                background: starred ? '#FEF3C7' : '#FFFFFF',
                borderColor: starred ? '#F59E0B' : '#E2E2DC',
                color: starred ? '#92400E' : '#4A5650',
              }}
              type="button"
            >
              <Star size={12} fill={starred ? '#F59E0B' : 'none'} /> {starred ? 'Starred' : 'Star Lab'}
            </button>
            <button
              onClick={onOpenFull}
              className="figma-v1-primary-button flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-semibold transition-colors"
              style={{ background: '#0D9488', color: '#FFFFFF' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0F766E')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#0D9488')}
            >
              Open Workbook <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Scenario */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#9BA8A0' }}>
            Scenario
          </h3>
          <p className="text-[13px] leading-relaxed" style={{ color: '#4A5650' }}>{lab.scenario}</p>
        </section>

        {/* Skills */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#9BA8A0' }}>
            Skills Practiced
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {lab.skills.map((skill, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded border text-[11px]"
                style={{ background: '#FFFFFF', borderColor: '#E2E2DC', color: '#4A5650' }}
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* Validation commands */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#9BA8A0' }}>
            Validation Commands
          </h3>
          <div className="rounded-md overflow-hidden border" style={{ background: '#0D1A12', borderColor: '#1C3524' }}>
            <div className="px-3 py-1.5 border-b flex items-center gap-2" style={{ borderColor: '#1C3524' }}>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: '#3D5A40' }} />
                <div className="w-2 h-2 rounded-full" style={{ background: '#3D5A40' }} />
                <div className="w-2 h-2 rounded-full" style={{ background: '#3D5A40' }} />
              </div>
              <span className="text-[10px]" style={{ color: '#4ADE80', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>
                terminal
              </span>
            </div>
            <div className="px-4 py-3 space-y-1.5">
              {lab.validationCommands.map((cmd, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span style={{ color: '#4ADE80', fontFamily: 'var(--font-mono)', fontSize: 12 }}>$</span>
                  <code
                    className="flex-1 text-[11px] leading-relaxed break-all"
                    style={{ color: '#86EFAC', fontFamily: 'var(--font-mono)' }}
                  >
                    {cmd}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Expected evidence */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#9BA8A0' }}>
            Expected Evidence
          </h3>
          <div className="space-y-1.5">
            {lab.expectedEvidence.map((ev, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: '#0D9488' }} />
                <span className="text-[12px]" style={{ color: '#4A5650' }}>{ev}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Checklist progress */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#9BA8A0' }}>
              Checklist
            </h3>
            <span className="text-[11px]" style={{ color: '#8A9690' }}>
              {completedSteps}/{lab.checklist.length} complete
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: '#E2E2DC' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${(completedSteps / lab.checklist.length) * 100}%`, background: '#0D9488' }}
            />
          </div>
          <div className="space-y-1.5">
            {lab.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                {item.completed
                  ? <CheckCircle2 size={13} style={{ color: '#0D9488', flexShrink: 0 }} />
                  : <Circle size={13} style={{ color: '#C4C4BC' }} />
                }
                <span
                  className="text-[12px]"
                  style={{ color: item.completed ? '#8A9690' : '#4A5650', textDecoration: item.completed ? 'line-through' : 'none' }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="pt-2">
          <button
            onClick={onOpenFull}
            className="figma-v1-primary-button w-full py-2.5 rounded-md text-[13px] font-semibold transition-colors flex items-center justify-center gap-2"
            style={{ background: '#0D9488', color: '#FFFFFF' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#0F766E')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0D9488')}
          >
            Open Full Workbook <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
