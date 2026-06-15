import { useState } from 'react';
import { Search, Clock, ChevronLeft, ChevronRight, ExternalLink, FileText } from 'lucide-react';
import { resources } from '../data';
import type { Level, ResourceType, Resource } from '../data';

const LEVEL_COLORS: Record<Level, { bg: string; text: string }> = {
  Fresher: { bg: '#DCFCE7', text: '#166534' },
  Intermediate: { bg: '#DBEAFE', text: '#1E40AF' },
  Advanced: { bg: '#FEF3C7', text: '#92400E' },
};

const TYPE_LABELS: Record<ResourceType, string> = {
  'cheatsheet': 'Cheatsheet',
  'runbook': 'Runbook',
  'lab-worksheet': 'Worksheet',
  'project-brief': 'Project Brief',
  'interview-prep': 'Interview Prep',
  'official-reference': 'Official Ref',
  'architecture-diagram': 'Architecture Diagram',
  'template': 'Template',
  'assessment': 'Assessment',
  'troubleshooting-guide': 'Troubleshooting',
  'decision-record': 'Decision Record',
  'production-readiness': 'Production Readiness',
  'failure-mode-drill': 'Failure Drill',
  'security-review': 'Security Review',
  'cost-review': 'Cost Review',
  'portfolio-artifact': 'Portfolio',
};

const TYPE_COLORS: Record<ResourceType, { bg: string; text: string }> = {
  'cheatsheet': { bg: '#DDFAF6', text: '#0F766E' },
  'runbook': { bg: '#DBEAFE', text: '#1E40AF' },
  'lab-worksheet': { bg: '#F0FDF4', text: '#166534' },
  'project-brief': { bg: '#F5F3FF', text: '#6D28D9' },
  'interview-prep': { bg: '#FEF3C7', text: '#92400E' },
  'official-reference': { bg: '#EFF6FF', text: '#1E40AF' },
  'architecture-diagram': { bg: '#F0F0EC', text: '#4A5650' },
  'template': { bg: '#F0FDF4', text: '#166534' },
  'assessment': { bg: '#FEF3C7', text: '#92400E' },
  'troubleshooting-guide': { bg: '#FFF7ED', text: '#C2410C' },
  'decision-record': { bg: '#F0F0EC', text: '#4A5650' },
  'production-readiness': { bg: '#FEF2F2', text: '#DC2626' },
  'failure-mode-drill': { bg: '#FEF2F2', text: '#DC2626' },
  'security-review': { bg: '#FFF7ED', text: '#C2410C' },
  'cost-review': { bg: '#DDFAF6', text: '#0F766E' },
  'portfolio-artifact': { bg: '#F5F3FF', text: '#6D28D9' },
};

const ALL_DOMAINS = ['All', ...Array.from(new Set(resources.map((r) => r.domain))).sort()];
const ALL_TYPES: ('All' | ResourceType)[] = ['All', 'cheatsheet', 'runbook', 'troubleshooting-guide', 'template', 'architecture-diagram', 'interview-prep', 'lab-worksheet', 'security-review', 'production-readiness', 'failure-mode-drill', 'cost-review'];

const PAGE_SIZE = 10;

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

function domainLabel(domain: string) {
  return DOMAIN_LABELS[domain] || domain;
}

type ResourcesProps = {
  onOpenResource?: (resource: Resource) => void;
};

export default function Resources({ onOpenResource }: ResourcesProps = {}) {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'All' | ResourceType>('All');
  const [levelFilter, setLevelFilter] = useState<Level | 'All'>('All');
  const [page, setPage] = useState(1);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const filtered = resources.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.summary.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesDomain = domainFilter === 'All' || r.domain === domainFilter;
    const matchesType = typeFilter === 'All' || r.type === typeFilter;
    const matchesLevel = levelFilter === 'All' || r.level === levelFilter;
    return matchesSearch && matchesDomain && matchesType && matchesLevel;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (q: string) => {
    setSearch(q);
    setPage(1);
  };
  const openResource = (resource: Resource) => {
    if (onOpenResource) {
      onOpenResource(resource);
      return;
    }
    window.location.assign(`/resources/${resource.slug}`);
  };

  return (
    <div className="min-h-full" style={{ background: '#F4F4F1' }}>
      <div className="max-w-[1280px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[18px] font-semibold" style={{ color: '#1A1D1B' }}>Resource Library</h1>
            <p className="text-[13px]" style={{ color: '#6B7870' }}>
              {resources.length} resources across 16 types · cheatsheets, runbooks, templates, and more
            </p>
          </div>
        </div>

        {/* Search + filters */}
        <div
          className="rounded-lg border p-4 mb-4 space-y-3"
          style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}
        >
          {/* Search bar */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-md border"
            style={{ background: '#FAFAF7', borderColor: '#E2E2DC' }}
          >
            <Search size={13} style={{ color: '#9BA8A0' }} />
            <input
              type="text"
              placeholder="Search resources by title, summary, or tag…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 text-[13px] outline-none bg-transparent"
              style={{ color: '#1A1D1B' }}
            />
            {search && (
              <button
                onClick={() => handleSearch('')}
                className="text-[11px]"
                style={{ color: '#9BA8A0' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-2 items-start">
            {/* Domain */}
            <div className="flex flex-wrap gap-1">
              {ALL_DOMAINS.slice(0, 9).map((d) => (
                <button
                  key={d}
                  aria-pressed={domainFilter === d}
                  onClick={() => { setDomainFilter(d); setPage(1); }}
                  className="px-2 py-0.5 rounded border text-[10px] font-medium"
                  style={{
                    background: domainFilter === d ? '#1A1D1B' : '#FFFFFF',
                    color: domainFilter === d ? '#FFFFFF' : '#6B7870',
                    borderColor: domainFilter === d ? '#1A1D1B' : '#E2E2DC',
                  }}
                  type="button"
                >
                  {domainLabel(d)}
                </button>
              ))}
            </div>

            <div className="w-px h-5 self-center" style={{ background: '#E2E2DC' }} />

            {/* Level */}
            {(['All', 'Fresher', 'Intermediate', 'Advanced'] as const).map((lvl) => (
              <button
                key={lvl}
                aria-pressed={levelFilter === lvl}
                onClick={() => { setLevelFilter(lvl); setPage(1); }}
                className="px-2 py-0.5 rounded border text-[10px] font-medium"
                style={{
                  background: levelFilter === lvl ? '#1A1D1B' : '#FFFFFF',
                  color: levelFilter === lvl ? '#FFFFFF' : '#6B7870',
                  borderColor: levelFilter === lvl ? '#1A1D1B' : '#E2E2DC',
                }}
                type="button"
              >
                {lvl === 'All' ? 'All levels' : lvl}
              </button>
            ))}
          </div>

          {/* Type chips */}
          <div className="flex flex-wrap gap-1">
            {ALL_TYPES.map((t) => {
              const col = t !== 'All' ? TYPE_COLORS[t] : null;
              return (
                <button
                  key={t}
                  aria-pressed={typeFilter === t}
                  onClick={() => { setTypeFilter(t); setPage(1); }}
                  className="px-2 py-0.5 rounded border text-[10px] font-medium transition-all"
                  style={{
                    background: typeFilter === t ? (col?.bg || '#1A1D1B') : '#FFFFFF',
                    color: typeFilter === t ? (col?.text || '#FFFFFF') : '#6B7870',
                    borderColor: typeFilter === t ? (col?.text || '#1A1D1B') : '#E2E2DC',
                  }}
                  type="button"
                >
                  {t === 'All' ? 'All types' : TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px]" style={{ color: '#8A9690' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            {search ? ` for "${search}"` : ''}
          </p>
          <p className="text-[12px]" style={{ color: '#8A9690' }}>
            Page {page} of {totalPages}
          </p>
        </div>

        {/* Resource table */}
        <div className="rounded-lg border overflow-hidden" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
          {/* Table header */}
          <div
            className="grid px-4 py-2 text-[10px] font-semibold uppercase tracking-widest border-b"
            style={{
              gridTemplateColumns: '1fr 120px 90px 60px 60px',
              color: '#9BA8A0',
              borderColor: '#F0F0EC',
              background: '#FAFAF7',
            }}
          >
            <span>Resource</span>
            <span>Type</span>
            <span>Domain</span>
            <span>Level</span>
            <span>Time</span>
          </div>

          {paginated.length === 0
            ? (
              <div className="py-12 text-center">
                <p className="text-[13px]" style={{ color: '#8A9690' }}>No resources match your filters</p>
              </div>
            )
            : paginated.map((resource, i) => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                isLast={i === paginated.length - 1}
                onClick={() => setSelectedResource(resource)}
              />
            ))
          }
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 rounded border transition-colors disabled:opacity-40"
              style={{ background: '#FFFFFF', borderColor: '#E2E2DC', color: '#6B7870' }}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-8 h-8 rounded border text-[12px] font-medium transition-colors"
                style={{
                  background: page === p ? '#0D9488' : '#FFFFFF',
                  color: page === p ? '#FFFFFF' : '#6B7870',
                  borderColor: page === p ? '#0D9488' : '#E2E2DC',
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded border transition-colors disabled:opacity-40"
              style={{ background: '#FFFFFF', borderColor: '#E2E2DC', color: '#6B7870' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Resource detail overlay */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedResource(null)} />
          <div
            className="relative w-full max-w-[600px] rounded-lg border overflow-hidden shadow-xl"
            style={{ background: '#FFFFFF', borderColor: '#E2E2DC', maxHeight: '80vh', overflowY: 'auto' }}
          >
            <div className="sticky top-0 px-5 py-4 border-b flex items-start justify-between gap-4" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <TypeBadge type={selectedResource.type} />
                  <LevelBadge level={selectedResource.level} />
                  <span className="text-[11px]" style={{ color: '#8A9690' }}>{selectedResource.domain}</span>
                </div>
                <h3 className="text-[16px] font-semibold" style={{ color: '#1A1D1B' }}>{selectedResource.title}</h3>
              </div>
              <button onClick={() => setSelectedResource(null)} style={{ color: '#8A9690' }} className="text-[20px] leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[14px] leading-relaxed" style={{ color: '#4A5650' }}>{selectedResource.summary}</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedResource.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-1 rounded border text-[11px]" style={{ background: '#F7F7F4', borderColor: '#E2E2DC', color: '#6B7870' }}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <span className="flex items-center gap-1 text-[12px]" style={{ color: '#8A9690' }}>
                  <Clock size={12} /> ~{selectedResource.duration} min read
                </span>
                <button
                  onClick={() => openResource(selectedResource)}
                  className="figma-v1-primary-button ml-auto flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-semibold"
                  style={{ background: '#0D9488', color: '#FFFFFF' }}
                  type="button"
                >
                  <ExternalLink size={12} /> Open Resource
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResourceRow({ resource, isLast, onClick }: { resource: Resource; isLast: boolean; onClick: () => void }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors group ${!isLast ? 'border-b' : ''}`}
      style={{ borderColor: '#F0F0EC' }}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAF7')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Title + summary */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-medium truncate" style={{ color: '#1A1D1B' }}>
            {resource.title}
          </span>
        </div>
        <p className="text-[11px] truncate" style={{ color: '#8A9690' }}>{resource.summary}</p>
        <div className="flex gap-1.5 mt-1 flex-wrap">
          {resource.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: '#F0F0EC', color: '#6B7870' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Type */}
      <div className="w-[120px] shrink-0 hidden sm:block">
        <TypeBadge type={resource.type} />
      </div>

      {/* Domain */}
      <div className="w-[90px] shrink-0 hidden md:block">
        <span className="text-[11px]" style={{ color: '#6B7870' }}>{resource.domain}</span>
      </div>

      {/* Level */}
      <div className="w-[60px] shrink-0 hidden md:block">
        <LevelBadge level={resource.level} />
      </div>

      {/* Duration */}
      <div className="w-[60px] shrink-0 hidden lg:block">
        <span className="flex items-center gap-1 text-[11px]" style={{ color: '#8A9690' }}>
          <Clock size={10} /> {resource.duration}m
        </span>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: ResourceType }) {
  const col = TYPE_COLORS[type];
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap"
      style={{ background: col.bg, color: col.text }}
    >
      <FileText size={9} /> {TYPE_LABELS[type]}
    </span>
  );
}

function LevelBadge({ level }: { level: Level }) {
  const col = LEVEL_COLORS[level];
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold"
      style={{ background: col.bg, color: col.text }}
    >
      {level}
    </span>
  );
}
