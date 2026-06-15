import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Check, Clock, Copy, ExternalLink, Tag } from 'lucide-react';
import { labs, resources } from '../data';
import type { Level, Resource, ResourceType } from '../data';
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
  'cheatsheet':          { label: 'Cheatsheet', color: ACCENT, bg: ACCENT_BG },
  'runbook':             { label: 'Runbook', color: BLUE, bg: BLUE_BG },
  'lab-worksheet':       { label: 'Lab worksheet', color: GREEN, bg: GREEN_BG },
  'project-brief':       { label: 'Project brief', color: PURPLE, bg: PURPLE_BG },
  'interview-prep':      { label: 'Interview prep', color: AMBER, bg: AMBER_BG },
  'official-reference':  { label: 'Official reference', color: BLUE, bg: BLUE_BG },
  'architecture-diagram':{ label: 'Architecture diagram', color: TEXT2, bg: SURF2 },
  'template':            { label: 'Template', color: GREEN, bg: GREEN_BG },
  'assessment':          { label: 'Assessment', color: AMBER, bg: AMBER_BG },
  'troubleshooting-guide':{ label: 'Troubleshooting', color: AMBER, bg: AMBER_BG },
  'decision-record':     { label: 'Decision record', color: TEXT2, bg: SURF2 },
  'production-readiness':{ label: 'Production readiness', color: RED, bg: RED_BG },
  'failure-mode-drill':  { label: 'Failure drill', color: RED, bg: RED_BG },
  'security-review':     { label: 'Security review', color: AMBER, bg: AMBER_BG },
  'cost-review':         { label: 'Cost review', color: ACCENT, bg: ACCENT_BG },
  'portfolio-artifact':  { label: 'Portfolio artifact', color: PURPLE, bg: PURPLE_BG },
};

type ResourceDetailProps = {
  slug: string;
  onBack: () => void;
  onOpenRelatedLab?: (title: string) => void;
};

export default function ResourceDetail({ slug, onBack, onOpenRelatedLab }: ResourceDetailProps) {
  const resource = resources.find((item) => item.slug === slug) ?? resources[0];
  const [reviewed, setReviewed] = useState(false);
  const [copied, setCopied] = useState(false);
  const relatedLabs = useMemo(() => {
    const domain = resource.domain.toLowerCase();
    const tagSet = new Set(resource.tags.map((tag) => tag.toLowerCase()));
    return labs
      .filter((lab) => {
        const text = `${lab.title} ${lab.track} ${lab.skills.join(' ')}`.toLowerCase();
        return text.includes(domain) || Array.from(tagSet).some((tag) => tag.length > 3 && text.includes(tag));
      })
      .slice(0, 3);
  }, [resource]);

  const handleCopy = () => {
    const citation = `${resource.title} — ${resource.summary}`;
    navigator.clipboard?.writeText(citation).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      aria-label="Resource detail content"
      className="min-h-full overflow-y-auto"
      role="region"
      style={{ background: BG, fontFamily: 'var(--font-sans)' }}
      tabIndex={0}
    >
      <div className="border-b" style={{ background: SURF, borderColor: BORDER }}>
        <div className="max-w-[1280px] mx-auto px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 mb-4 transition-colors"
            style={{ color: TEXT2, fontSize: 11, fontFamily: 'var(--font-mono)' }}
            type="button"
          >
            <ArrowLeft size={12} /> Resources
          </button>

          <div className="flex items-start justify-between gap-5 flex-wrap">
            <div className="min-w-0 max-w-[820px]">
              <div className="flex flex-wrap gap-1.5 items-center mb-3">
                <TypeBadge type={resource.type} />
                <LevelBadge level={resource.level} />
                <span style={{ color: TEXT2, fontSize: 10, fontFamily: 'var(--font-mono)' }}>{resource.domain}</span>
                <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>~{resource.duration}m</span>
              </div>
              <h1 style={{ color: TEXT, fontSize: 22, lineHeight: 1.2, fontWeight: 650 }}>{resource.title}</h1>
              <p style={{ color: TEXT2, fontSize: 14, lineHeight: 1.75, marginTop: 12 }}>{resource.summary}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-sm border transition-all"
                style={{ background: copied ? GREEN_BG : 'transparent', borderColor: copied ? alpha(GREEN, 31) : BORDER2, color: copied ? GREEN : TEXT2, fontSize: 10, fontFamily: 'var(--font-mono)' }}
                type="button"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy citation'}
              </button>
              <button
                onClick={() => setReviewed((value) => !value)}
                aria-pressed={reviewed}
                className="figma-v2-primary-button flex items-center gap-1.5 px-3 py-2 rounded-sm border transition-all"
                style={{ background: reviewed ? GREEN_BG : ACCENT_BG, borderColor: reviewed ? alpha(GREEN, 31) : alpha(ACCENT, 25), color: reviewed ? GREEN : ACCENT, fontSize: 10, fontFamily: 'var(--font-mono)' }}
                type="button"
              >
                <BookOpen size={12} /> {reviewed ? 'Reviewed' : 'Mark reviewed'}
              </button>
            </div>
            {reviewed && (
              <p role="status" style={{ color: GREEN, fontSize: 10, fontFamily: 'var(--font-mono)', width: '100%', textAlign: 'right' }}>
                Saved to this local profile as reviewed.
              </p>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-4 min-w-0">
          <Panel label="Overview">
            <p style={{ color: TEXT2, fontSize: 13, lineHeight: 1.75 }}>
              Use this resource as a field reference while you work through labs, interview drills, and portfolio evidence. Capture the commands, decisions, and tradeoffs that would matter in a real incident review.
            </p>
          </Panel>

          <Panel label="Operator workflow">
            <Step index="01" title="Read for signals" body={`Skim the ${TYPE_CFG[resource.type].label.toLowerCase()} for the exact nouns, commands, and failure modes you would name in a production conversation.`} />
            <Step index="02" title="Practice against a lab" body="Apply the resource to a hands-on scenario, then write down what evidence would prove the system is healthy." />
            <Step index="03" title="Turn it into interview language" body="Convert the operational steps into a concise answer: symptom, safest inspection path, fix, validation, and follow-up prevention." />
          </Panel>

          <Panel label="Evidence prompts">
            <ul className="space-y-2">
              {[
                `What command or artifact proves you understood ${resource.domain}?`,
                'What would be risky to change before gathering more evidence?',
                'What signal would you show a senior engineer before recommending a fix?',
                'What follow-up would prevent the same failure from recurring?',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 w-1 h-1 rounded-full shrink-0" style={{ background: ACCENT }} />
                  <span style={{ color: TEXT2, fontSize: 13, lineHeight: 1.65 }}>{item}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <aside className="space-y-4 min-w-0">
          <Panel label="Tags">
            <div className="flex flex-wrap gap-1.5">
              {resource.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border" style={{ borderColor: BORDER2, color: TEXT2, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          </Panel>

          <Panel label="Reading estimate">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ background: ACCENT_BG, color: ACCENT }}>
                <Clock size={16} />
              </div>
              <div>
                <p style={{ color: TEXT, fontSize: 18, fontWeight: 650 }}>{resource.duration}m</p>
                <p style={{ color: TEXT2, fontSize: 11 }}>Focused review</p>
              </div>
            </div>
          </Panel>

          <Panel label="Related labs">
            <div className="space-y-2">
              {relatedLabs.length === 0 ? (
                <p style={{ color: TEXT2, fontSize: 12 }}>No matched labs yet.</p>
              ) : relatedLabs.map((lab) => (
                <button
                  key={lab.id}
                  onClick={() => onOpenRelatedLab?.(lab.title)}
                  className="w-full text-left p-3 rounded-sm border transition-all"
                  style={{ background: SURF2, borderColor: BORDER, color: TEXT }}
                  type="button"
                >
                  <span style={{ display: 'block', color: TEXT, fontSize: 12, fontWeight: 550 }}>{lab.title}</span>
                  <span style={{ display: 'block', color: TEXT2, fontSize: 10, fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                    {lab.level} · {lab.duration}m
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <a
            href="/resources"
            onClick={(event) => { event.preventDefault(); onBack(); }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm border transition-all"
            style={{ borderColor: BORDER2, color: TEXT2, fontSize: 10, fontFamily: 'var(--font-mono)' }}
          >
            <ExternalLink size={12} /> Resource index
          </a>
        </aside>
      </main>
    </div>
  );
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border overflow-hidden" style={{ background: SURF, borderColor: BORDER }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: BORDER }}>
        <span style={{ color: TEXT, fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 650 }}>{label}</span>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Step({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0" style={{ borderColor: BORDER }}>
      <span className="shrink-0 px-1.5 py-px rounded-sm" style={{ color: ACCENT, background: ACCENT_BG, fontSize: 9, fontFamily: 'var(--font-mono)' }}>{index}</span>
      <div>
        <p style={{ color: TEXT, fontSize: 13, fontWeight: 550 }}>{title}</p>
        <p style={{ color: TEXT2, fontSize: 12, lineHeight: 1.65, marginTop: 3 }}>{body}</p>
      </div>
    </div>
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
