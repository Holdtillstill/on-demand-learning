import { useState } from 'react';
import { Search, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { resources } from '../data';
import type { Level, ResourceType, Resource } from '../data';
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
  PURPLE,
  PURPLE_BG,
  RED,
  RED_BG,
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

const TYPE_CFG: Record<ResourceType, { label: string; color: string; bg: string }> = {
  'cheatsheet':          { label: 'Cheatsheet',  color: ACCENT, bg: ACCENT_BG },
  'runbook':             { label: 'Runbook',      color: BLUE,   bg: BLUE_BG  },
  'lab-worksheet':       { label: 'Lab worksheet',    color: GREEN,  bg: GREEN_BG },
  'project-brief':       { label: 'Project brief',      color: PURPLE, bg: PURPLE_BG },
  'interview-prep':      { label: 'Interview prep',    color: AMBER,  bg: AMBER_BG },
  'official-reference':  { label: 'Official reference', color: BLUE,   bg: BLUE_BG  },
  'architecture-diagram':{ label: 'Architecture diagram', color: TEXT2,  bg: SURF2    },
  'template':            { label: 'Template',     color: GREEN,  bg: GREEN_BG },
  'assessment':          { label: 'Assessment',   color: AMBER,  bg: AMBER_BG },
  'troubleshooting-guide':{ label:'Troubleshooting', color: AMBER,  bg: AMBER_BG },
  'decision-record':     { label: 'Decision record',     color: TEXT2,  bg: SURF2    },
  'production-readiness':{ label: 'Production readiness',    color: RED,    bg: RED_BG },
  'failure-mode-drill':  { label: 'Failure drill',color: RED,    bg: RED_BG },
  'security-review':     { label: 'Security review',   color: AMBER,  bg: AMBER_BG },
  'cost-review':         { label: 'Cost review',  color: ACCENT, bg: ACCENT_BG },
  'portfolio-artifact':  { label: 'Portfolio artifact',    color: PURPLE, bg: PURPLE_BG },
};

const ALL_DOMAINS = ['All', ...Array.from(new Set(resources.map((r) => r.domain))).sort()];
const QUICK_TYPES: ('All' | ResourceType)[] = ['All', 'cheatsheet', 'runbook', 'troubleshooting-guide', 'template', 'architecture-diagram', 'interview-prep', 'production-readiness', 'failure-mode-drill'];
const PAGE_SIZE = 12;

const DOMAIN_LABELS: Record<string, string> = {
  'All': 'All domains',
  'AWS IAM': 'AWS IAM',
  'AWS Operations': 'AWS Operations',
  'ArgoCD': 'ArgoCD',
  'CI/CD': 'CI/CD',
  'Career': 'Career',
  'Cloud Native': 'Cloud Native',
  'Docker': 'Docker',
  'EKS': 'EKS',
};

const FILTER_TYPE_LABELS: Record<ResourceType, string> = {
  'cheatsheet': 'Cheatsheet',
  'runbook': 'Runbook',
  'lab-worksheet': 'Lab worksheet',
  'project-brief': 'Project brief',
  'interview-prep': 'Interview prep',
  'official-reference': 'Official reference',
  'architecture-diagram': 'Architecture diagram',
  'template': 'Template',
  'assessment': 'Assessment',
  'troubleshooting-guide': 'Troubleshooting',
  'decision-record': 'Decision record',
  'production-readiness': 'Production readiness',
  'failure-mode-drill': 'Failure drill',
  'security-review': 'Security review',
  'cost-review': 'Cost review',
  'portfolio-artifact': 'Portfolio artifact',
};

function domainLabel(domain: string) {
  return DOMAIN_LABELS[domain] || domain;
}

function levelLabel(level: Level | 'All') {
  return level === 'All' ? 'All levels' : level;
}

function typeFilterLabel(type: ResourceType | 'All') {
  return type === 'All' ? 'All types' : FILTER_TYPE_LABELS[type];
}

type ResourcesProps = {
  onOpenResource?: (resource: Resource) => void;
};

export default function Resources({ onOpenResource }: ResourcesProps = {}) {
  const [search, setSearch]           = useState('');
  const [domain, setDomain]           = useState('All');
  const [type, setType]               = useState<'All' | ResourceType>('All');
  const [level, setLevel]             = useState<Level | 'All'>('All');
  const [page, setPage]               = useState(1);
  const [detail, setDetail]           = useState<Resource | null>(null);

  const filtered = resources.filter((r) => {
    const q  = r.title.toLowerCase().includes(search.toLowerCase()) || r.tags.some((t) => t.includes(search.toLowerCase()));
    const d  = domain === 'All' || r.domain === domain;
    const tp = type   === 'All' || r.type   === type;
    const lv = level  === 'All' || r.level  === level;
    return q && d && tp && lv;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetAndSearch = (q: string) => { setSearch(q); setPage(1); };
  const openResource = (resource: Resource) => {
    if (onOpenResource) {
      onOpenResource(resource);
      return;
    }
    window.location.assign(`/resources/${resource.slug}`);
  };

  return (
    <div className="min-h-full" style={{ background: BG, fontFamily: 'var(--font-sans)' }}>
      <div className="max-w-[1280px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 style={{ color: TEXT, fontSize: 16, fontWeight: 600 }}>Resource Index</h1>
            <p style={{ color: TEXT2, fontSize: 12, marginTop: 2 }}>
              {resources.length} resources · cheatsheets, runbooks, templates, drills, and more
            </p>
          </div>
        </div>

        {/* Search + filters */}
        <div className="rounded-sm border p-4 mb-4 space-y-3" style={{ background: SURF, borderColor: BORDER }}>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-sm border"
            style={{ background: SURF2, borderColor: BORDER }}
          >
            <Search size={12} style={{ color: TEXT3 }} />
            <input
              aria-label="Search resources"
              type="text"
              placeholder="search by title, tag, or keyword…"
              value={search}
              onChange={(e) => resetAndSearch(e.target.value)}
              className="flex-1 outline-none bg-transparent"
              style={{ color: TEXT, fontSize: 12, fontFamily: 'var(--font-mono)' }}
            />
            {search && (
              <button aria-label="Clear resource search" onClick={() => resetAndSearch('')} style={{ color: TEXT3 }} type="button">
                <X size={12} />
              </button>
            )}
          </div>

          <FilterGroup label="Domain">
            {ALL_DOMAINS.map((d) => (
              <FilterChip key={d} active={domain === d} onClick={() => { setDomain(d); setPage(1); }}>
                {domainLabel(d)}
              </FilterChip>
            ))}
          </FilterGroup>

          <FilterGroup label="Level">
            {(['All', 'Fresher', 'Intermediate', 'Advanced'] as const).map((lvl) => {
              const col = lvl !== 'All' ? LEVEL_COL[lvl as Level] : null;
              return (
                <FilterChip key={lvl} active={level === lvl} color={col?.color} onClick={() => { setLevel(lvl); setPage(1); }}>
                  {levelLabel(lvl)}
                </FilterChip>
              );
            })}
          </FilterGroup>

          <FilterGroup label="Type">
            {QUICK_TYPES.map((t) => {
              const cfg = t !== 'All' ? TYPE_CFG[t] : null;
              return (
                <FilterChip key={t} active={type === t} color={cfg?.color} onClick={() => { setType(t); setPage(1); }}>
                  {typeFilterLabel(t)}
                </FilterChip>
              );
            })}
          </FilterGroup>
        </div>

        {/* Result meta */}
        <div className="flex items-center justify-between mb-2">
          <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
            {filtered.length} results {search ? `· "${search}"` : ''}
          </span>
          <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
            {page}/{totalPages}
          </span>
        </div>

        {/* Table */}
        <div className="hidden md:block rounded-sm border overflow-hidden" style={{ borderColor: BORDER }}>
          {/* Table head */}
          <div
            className="grid px-4 py-2 border-b"
            style={{
              gridTemplateColumns: '1fr 110px 90px 60px 54px',
              borderColor: BORDER,
              background: SURF,
            }}
          >
            {['Resource', 'Type', 'Domain', 'Level', 'Time'].map((h) => (
              <span key={h} style={{ color: TEXT3, fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>{h}</span>
            ))}
          </div>

          {paginated.length === 0
            ? <div className="py-16 text-center" style={{ background: SURF }}>
                <p style={{ color: TEXT3, fontSize: 13 }}>No resources match your filters</p>
              </div>
            : paginated.map((r, i) => (
              <ResourceRow
                key={r.id}
                resource={r}
                isLast={i === paginated.length - 1}
                onClick={() => setDetail(r)}
              />
            ))
          }
        </div>

        <div className="grid gap-2 md:hidden" role="list" aria-label="Resources">
          {paginated.length === 0
            ? <div className="py-12 text-center rounded-sm border" style={{ background: SURF, borderColor: BORDER }}>
                <p style={{ color: TEXT3, fontSize: 13 }}>No resources match your filters</p>
              </div>
            : paginated.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                onClick={() => setDetail(r)}
              />
            ))
          }
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <PagBtn ariaLabel="Previous resource page" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
              <ChevronLeft size={12} />
            </PagBtn>
            {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map((p) => (
              <PagBtn key={p} active={page === p} ariaLabel={`Go to resource page ${p}`} onClick={() => setPage(p)}>
                {p}
              </PagBtn>
            ))}
            <PagBtn ariaLabel="Next resource page" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
              <ChevronRight size={12} />
            </PagBtn>
          </div>
        )}
      </div>

      {/* Detail overlay */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setDetail(null)} />
          <div
            aria-labelledby="resource-preview-title"
            aria-modal="true"
            className="relative w-full max-w-[560px] rounded-sm border shadow-2xl overflow-hidden"
            role="dialog"
            style={{ background: SURF, borderColor: BORDER2, maxHeight: '80vh', overflowY: 'auto' }}
            tabIndex={0}
          >
            <div className="sticky top-0 px-5 py-4 border-b flex items-start justify-between gap-4" style={{ background: SURF, borderColor: BORDER }}>
              <div>
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <TypeBadge type={detail.type} />
                  <LevelBadge level={detail.level} />
                  <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>{detail.domain}</span>
                </div>
                <h3 id="resource-preview-title" style={{ color: TEXT, fontSize: 15, fontWeight: 600 }}>{detail.title}</h3>
              </div>
              <button aria-label="Close resource preview" onClick={() => setDetail(null)} style={{ color: TEXT3, fontSize: 20, lineHeight: 1 }} type="button">×</button>
            </div>
            <div className="p-5 space-y-4">
              <p style={{ color: TEXT2, fontSize: 13, lineHeight: 1.7 }}>{detail.summary}</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-1 rounded-sm border" style={{ borderColor: BORDER2, color: TEXT2, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <span style={{ color: TEXT3, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  ~{detail.duration}m
                </span>
                <button
                  onClick={() => openResource(detail)}
                  className="figma-v2-primary-button ml-auto px-3 py-2 rounded-sm border text-[10px] transition-all"
                  style={{ background: ACCENT_BG, borderColor: alpha(ACCENT, 25), color: ACCENT, fontFamily: 'var(--font-mono)' }}
                  type="button"
                >
                  OPEN RESOURCE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource, onClick }: { resource: Resource; onClick: () => void }) {
  return (
    <article role="listitem">
      <button
        aria-label={`Open resource preview: ${resource.title}`}
        className="w-full rounded-sm border p-3 text-left transition-all"
        data-resource-card="true"
        onClick={onClick}
        onMouseEnter={(e) => (e.currentTarget.style.background = SURF2)}
        onMouseLeave={(e) => (e.currentTarget.style.background = SURF)}
        style={{
          background: SURF,
          borderColor: BORDER,
        }}
        type="button"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p style={{ color: TEXT, fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
              {resource.title}
            </p>
            <p style={{ color: TEXT2, fontSize: 11, lineHeight: 1.55, marginTop: 5 }}>
              {resource.summary}
            </p>
          </div>
          <span className="shrink-0" style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
            {resource.duration}m
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <TypeBadge type={resource.type} />
          <LevelBadge level={resource.level} />
          <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>{resource.domain}</span>
        </div>
        <span className="mt-3 inline-block" style={{ color: ACCENT, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
          View details
        </span>
      </button>
    </article>
  );
}

function ResourceRow({ resource, isLast, onClick }: { resource: Resource; isLast: boolean; onClick: () => void }) {
  return (
    <button
      aria-label={`Open resource preview: ${resource.title}`}
      className={`grid items-center px-4 py-3 cursor-pointer transition-all ${!isLast ? 'border-b' : ''}`}
      style={{
        gridTemplateColumns: '1fr 110px 90px 60px 54px',
        borderColor: BORDER,
        background: SURF,
        textAlign: 'left',
        width: '100%',
      }}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = SURF2)}
      onMouseLeave={(e) => (e.currentTarget.style.background = SURF)}
      type="button"
    >
      <div className="min-w-0 pr-4">
        <p style={{ color: TEXT, fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {resource.title}
        </p>
        <p style={{ color: TEXT3, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
          {resource.summary.slice(0, 80)}…
        </p>
      </div>
      <div className="pr-2"><TypeBadge type={resource.type} /></div>
      <span style={{ color: TEXT2, fontSize: 10, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {resource.domain}
      </span>
      <LevelBadge level={resource.level} />
      <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>{resource.duration}m</span>
    </button>
  );
}

function TypeBadge({ type }: { type: ResourceType }) {
  const cfg = TYPE_CFG[type];
  return (
    <span className="inline-block px-1.5 py-px rounded-sm whitespace-nowrap" style={{ color: cfg.color, background: cfg.bg, fontSize: 9, fontFamily: 'var(--font-sans)', letterSpacing: 0 }}>
      {cfg.label}
    </span>
  );
}

function LevelBadge({ level }: { level: Level }) {
  const col = LEVEL_COL[level];
  return (
    <span className="inline-block px-1.5 py-px rounded-sm" style={{ color: col.color, background: col.bg, fontSize: 9, fontFamily: 'var(--font-sans)' }}>
      {level}
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

function FilterChip({ active, onClick, color, children }: { active: boolean; onClick: () => void; color?: string; children: React.ReactNode }) {
  const chipColor = color || ACCENT;
  return (
    <button
      aria-pressed={active}
      onClick={onClick}
      className="figma-v2-chip px-2 py-1 rounded-sm border transition-all text-[10px]"
      data-active={active ? 'true' : 'false'}
      style={{
        background: active ? (color ? alpha(color, 14) : ACCENT_BG) : SURF2,
        color: active ? chipColor : TEXT2,
        borderColor: active ? chipColor : BORDER2,
        boxShadow: active ? `inset 0 0 0 1px ${alpha(chipColor, 33)}` : 'none',
        fontFamily: 'var(--font-sans)',
      } as React.CSSProperties}
      type="button"
    >
      {children}
    </button>
  );
}

function PagBtn({ children, onClick, disabled, active, ariaLabel }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; active?: boolean; ariaLabel?: string }) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className="figma-v2-page-button w-7 h-7 flex items-center justify-center rounded-sm border transition-all text-[10px] disabled:opacity-30"
      data-active={active ? 'true' : 'false'}
      style={{
        '--figma-chip-bg': active ? ACCENT_BG : SURF,
        '--figma-chip-color': active ? ACCENT : TEXT2,
        '--figma-chip-border': active ? alpha(ACCENT, 25) : BORDER,
        fontFamily: 'var(--font-mono)',
      } as React.CSSProperties}
      type="button"
    >
      {children}
    </button>
  );
}
