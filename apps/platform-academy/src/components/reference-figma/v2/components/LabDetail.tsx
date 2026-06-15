import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, Clock, Server, FileText, Star, Copy, Check,
  CheckCircle2, Circle, AlertCircle, Send, Download, Save
} from 'lucide-react';
import { api } from '../../../../api';
import { downloadReferenceLabPacket, type LabPacketDownloadResult } from '../../labPacketHelpers';
import { labStateKey, notifyReferenceProgressChanged } from '../../localProgress';
import { labs, resources } from '../data';
import type { Level, LabStatus } from '../data';
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
  RED,
  RED_BG,
  SURF,
  SURF2,
  TERMINAL,
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

const STATUS_CFG: Record<LabStatus, { label: string; color: string; bg: string }> = {
  'not-started':    { label: 'Not started',    color: TEXT2, bg: SURF2    },
  'in-progress':    { label: 'In progress',    color: AMBER, bg: AMBER_BG },
  'strong-evidence':{ label: 'Strong evidence',color: BLUE,  bg: BLUE_BG  },
  'submitted':      { label: 'Submitted',      color: GREEN, bg: GREEN_BG },
};

type RubricStatus = 'missing' | 'needs-evidence' | 'passes' | 'strong';
const RUBRIC_CFG: Record<RubricStatus, { label: string; color: string; bg: string }> = {
  'missing':       { label: 'Missing',       color: RED,   bg: RED_BG   },
  'needs-evidence':{ label: 'Needs evidence',color: AMBER, bg: AMBER_BG },
  'passes':        { label: 'Passes',        color: BLUE,  bg: BLUE_BG  },
  'strong':        { label: 'Strong',        color: GREEN, bg: GREEN_BG },
};

const TABS = ['Brief', 'Console', 'Workbook', 'Evidence', 'Rubric'] as const;
type LabDetailTab = (typeof TABS)[number];

interface LabDetailProps { labId: number; onBack: () => void; }

function runtimeLabel(runtime: 'cluster' | 'file-only') {
  return runtime === 'cluster' ? 'Cluster setup' : 'File-only';
}

type EvidenceArtifact = {
  term: string;
  desc: string;
  attached: boolean;
  note: string;
};

type StoredLabState = {
  checklist?: Record<string, boolean>;
  evidence?: Record<string, boolean>;
  workbookAnswers?: string[];
  submitted?: boolean;
  savedAt?: string;
};

const INITIAL_EVIDENCE_ARTIFACTS: EvidenceArtifact[] = [
  { term: 'namespace-yaml', desc: 'Namespace manifest with labels and resource quotas', attached: true, note: 'Starter evidence is available.' },
  { term: 'pod-running-output', desc: 'Terminal output: pod in Running state', attached: false, note: 'Attach command output after validation.' },
  { term: 'event-log', desc: 'kubectl get events output with timestamps', attached: false, note: 'Attach event output from the incident window.' },
  { term: 'pod-spec-yaml', desc: 'Final pod spec with resource limits documented', attached: false, note: 'Attach the final manifest or copied YAML.' },
];

const WORKBOOK_PROMPTS = [
  { prompt: '1. Describe the initial cluster state. What was present before you began?', ph: 'e.g., 3 nodes, kube-system with standard add-ons, no app namespaces…' },
  { prompt: '2. List the exact commands you ran, in order.', ph: 'kubectl create namespace dev-ops → kubectl apply -f pod.yaml →…' },
  { prompt: '3. What was the output of the validation commands? Any unexpected results?', ph: 'Paste key output lines. Note deviations from expected…' },
  { prompt: '4. What would you do differently in production?', ph: 'e.g., Add resource quotas before deploying, enable audit logging…' },
];

function readStoredLabState(slug: string): StoredLabState {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(labStateKey(slug)) || '{}') as StoredLabState;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStoredLabState(slug: string, state: StoredLabState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(labStateKey(slug), JSON.stringify(state));
    notifyReferenceProgressChanged();
  } catch {
    // The in-session UI still works if the browser blocks local storage.
  }
}

export default function LabDetail({ labId, onBack }: LabDetailProps) {
  const lab = labs.find((l) => l.id === labId) || labs[1];
  const storedLabState = readStoredLabState(lab.slug);
  const [checklist, setChecklist]   = useState(() =>
    lab.checklist.map((c) => ({ ...c, completed: storedLabState.checklist?.[String(c.id)] ?? false }))
  );
  const [tab, setTab]               = useState<LabDetailTab>('Brief');
  const [copiedIdx, setCopiedIdx]   = useState<number | null>(null);
  const [saveState, setSaveState]   = useState<'idle' | 'saving' | 'saved'>(storedLabState.savedAt ? 'saved' : 'idle');
  const [packetState, setPacketState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [packetPreview, setPacketPreview] = useState<LabPacketDownloadResult | null>(null);
  const [evidenceArtifacts, setEvidenceArtifacts] = useState(() =>
    INITIAL_EVIDENCE_ARTIFACTS.map((artifact) => ({
      ...artifact,
      attached: storedLabState.evidence?.[artifact.term] ?? artifact.attached,
    }))
  );
  const [workbookAnswers, setWorkbookAnswers] = useState(() =>
    WORKBOOK_PROMPTS.map((_, index) => storedLabState.workbookAnswers?.[index] ?? '')
  );
  const initialEvidenceCount = evidenceArtifacts.filter((artifact) => artifact.attached).length;
  const [evidenceStatus, setEvidenceStatus] = useState(`${initialEvidenceCount} ${initialEvidenceCount === 1 ? 'artifact' : 'artifacts'} attached`);
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'submitted'>(storedLabState.submitted ? 'submitted' : 'idle');

  const lvlCol = LEVEL_COL[lab.level];
  const done   = checklist.filter((c) => c.completed).length;
  const pct    = Math.round((done / checklist.length) * 100);
  const packetUrl = api.labPacketUrl(lab.slug);
  const attachedEvidenceCount = evidenceArtifacts.filter((artifact) => artifact.attached).length;
  const hasLocalProgress =
    done > 0 ||
    saveState === 'saved' ||
    workbookAnswers.some((answer) => answer.trim().length > 0) ||
    evidenceArtifacts.some((artifact) => artifact.term !== 'namespace-yaml' && artifact.attached);
  const effectiveStatus: LabStatus =
    submissionState === 'submitted' ? 'submitted' : submissionState === 'submitting' || hasLocalProgress ? 'in-progress' : 'not-started';
  const stCfg  = STATUS_CFG[effectiveStatus];

  const toggle = (id: number) =>
    setChecklist((prev) => prev.map((c) => c.id === id ? { ...c, completed: !c.completed } : c));

  useEffect(() => {
    writeStoredLabState(lab.slug, {
      checklist: Object.fromEntries(checklist.map((item) => [String(item.id), item.completed])),
      evidence: Object.fromEntries(evidenceArtifacts.map((artifact) => [artifact.term, artifact.attached])),
      workbookAnswers,
      submitted: submissionState === 'submitted',
      savedAt: saveState === 'saved' ? new Date().toISOString() : storedLabState.savedAt,
    });
  }, [checklist, evidenceArtifacts, lab.slug, saveState, storedLabState.savedAt, submissionState, workbookAnswers]);

  const handleCopy = (cmd: string, i: number) => {
    navigator.clipboard.writeText(cmd).catch(() => {});
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  const handleSave = () => {
    setSaveState('saving');
    setTimeout(() => setSaveState('saved'), 1000);
  };

  const handlePacketDownload = async () => {
    setPacketState('loading');
    const result = await downloadReferenceLabPacket(lab, packetUrl);
    setPacketPreview(result);
    setPacketState(result.error ? 'error' : 'ready');
  };

  const handleSubmit = () => {
    setSubmissionState('submitting');
    setTimeout(() => {
      setSubmissionState('submitted');
      setEvidenceStatus(`Lab submitted for review · ${attachedEvidenceCount}/${evidenceArtifacts.length}`);
    }, 700);
  };

  const openRelatedResource = (resourceId: number) => {
    const resource = resources.find((item) => item.id === resourceId);
    window.location.assign(resource ? `/resources/${resource.slug}` : '/resources');
  };

  const toggleEvidenceArtifact = (term: string) => {
    const current = evidenceArtifacts.find((artifact) => artifact.term === term);
    if (!current) return;

    const nextAttached = !current.attached;
    const nextCount = evidenceArtifacts.filter((artifact) => artifact.term === term ? nextAttached : artifact.attached).length;
    setEvidenceArtifacts((prev) => prev.map((artifact) => artifact.term === term ? { ...artifact, attached: nextAttached } : artifact));
    setEvidenceStatus(`${term} ${nextAttached ? 'attached' : 'removed'} · ${nextCount}/${evidenceArtifacts.length}`);
  };

  const rubricRows: { criterion: string; status: RubricStatus; note: string }[] = [
    { criterion: 'Namespace and cluster setup', status: effectiveStatus === 'submitted' ? 'strong' : effectiveStatus === 'in-progress' ? 'passes' : 'missing', note: effectiveStatus === 'submitted' ? 'Namespace created with correct labels.' : 'Not yet started.' },
    { criterion: 'Workload deployed with correct spec', status: effectiveStatus === 'submitted' ? 'strong' : 'missing', note: effectiveStatus === 'submitted' ? 'Deployment YAML matches rubric.' : 'Deployment not validated.' },
    { criterion: 'Validation commands executed', status: effectiveStatus === 'in-progress' ? 'needs-evidence' : effectiveStatus === 'submitted' ? 'passes' : 'missing', note: effectiveStatus === 'in-progress' ? 'Commands run, output not captured.' : effectiveStatus === 'submitted' ? 'Output captured and reviewed.' : 'Not started.' },
    { criterion: 'Evidence journal entry complete', status: effectiveStatus === 'submitted' ? 'strong' : 'missing', note: effectiveStatus === 'submitted' ? 'All artifacts attached.' : 'Journal entry required.' },
  ];

  const packetOverlay = packetPreview ? (
    <div className="figma-v2-packet-overlay fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 500 }}>
      <div className="figma-v2-packet-backdrop absolute inset-0" onClick={() => setPacketPreview(null)} />
      <div className="figma-v2-packet-panel relative w-full max-w-[760px] rounded-sm border shadow-2xl overflow-hidden">
        <div className="figma-v2-packet-header px-5 py-4 border-b flex items-start justify-between gap-4">
          <div>
            <p style={{ color: packetPreview.error ? AMBER : 'var(--packet-accent)', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
              {packetPreview.error ? 'Packet fallback ready' : 'Packet ready'}
            </p>
            <h2 style={{ color: 'var(--packet-text)', fontSize: 15, fontWeight: 600, marginTop: 4 }}>{lab.title}</h2>
          </div>
          <button aria-label="Close lab packet preview" onClick={() => setPacketPreview(null)} style={{ color: 'var(--packet-text-3)', fontSize: 20, lineHeight: 1 }} type="button">×</button>
        </div>
        <pre className="figma-v2-packet-body m-0 p-5 overflow-auto" style={{ maxHeight: '56vh', fontSize: 11, lineHeight: 1.7, fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
          {packetPreview.markdown}
        </pre>
        <div className="figma-v2-packet-footer px-5 py-3 border-t flex items-center gap-2 justify-end">
          <a
            className="figma-v2-packet-secondary px-3 py-2 rounded-sm border text-[10px]"
            href={packetPreview.sourceUrl}
            rel="noreferrer"
            style={{ fontFamily: 'var(--font-mono)' }}
            target="_blank"
          >
            Open raw
          </a>
          <button
            className="figma-v2-packet-primary px-3 py-2 rounded-sm border text-[10px]"
            onClick={() => void navigator.clipboard.writeText(packetPreview.markdown).catch(() => undefined)}
            style={{ fontFamily: 'var(--font-mono)' }}
            type="button"
          >
            Copy packet
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
    <div className="min-h-full" style={{ background: BG, fontFamily: 'var(--font-sans)' }}>

      {/* ── Lab header ──────────────────────────────────────── */}
      <div className="border-b" style={{ background: SURF, borderColor: BORDER }}>
        <div className="max-w-[1280px] mx-auto px-6 py-4">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
            <button
              onClick={onBack}
              className="flex items-center gap-1 transition-colors"
              style={{ color: TEXT3, fontSize: 11 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = TEXT2)}
              onMouseLeave={(e) => (e.currentTarget.style.color = TEXT3)}
            >
              <ArrowLeft size={11} /> labs
            </button>
            <span style={{ color: TEXT3, fontSize: 11 }}>/</span>
            <span style={{ color: TEXT2, fontSize: 11 }}>{lab.title.toLowerCase().replace(/ /g, '-')}</span>
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2 items-center">
                <MonoBadge color={lvlCol.color} bg={lvlCol.bg}>{lab.level}</MonoBadge>
                <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>{lab.track}</span>
                <MonoBadge color={lab.runtime === 'cluster' ? BLUE : TEXT2} bg={lab.runtime === 'cluster' ? BLUE_BG : SURF2}>
                  {runtimeLabel(lab.runtime)}
                </MonoBadge>
                <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>{lab.duration}m</span>
                {lab.portfolioGrade && <MonoBadge color={AMBER} bg={AMBER_BG}>Portfolio</MonoBadge>}
                <MonoBadge color={stCfg.color} bg={stCfg.bg}>{stCfg.label}</MonoBadge>
              </div>
              <h1 style={{ color: TEXT, fontSize: 19, fontWeight: 600 }}>{lab.title}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                aria-label="Download lab packet"
                onClick={() => void handlePacketDownload()}
                disabled={packetState === 'loading'}
                className="figma-v2-secondary-button flex items-center gap-1.5 px-3 py-2 rounded-sm border transition-all"
                style={{
                  background: packetState === 'ready' ? ACCENT_BG : 'transparent',
                  borderColor: packetState === 'ready' ? alpha(ACCENT, 31) : BORDER2,
                  color: packetState === 'ready' ? ACCENT : TEXT2,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  opacity: packetState === 'loading' ? 0.7 : 1,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = SURF2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = packetState === 'ready' ? ACCENT_BG : 'transparent')}
                type="button"
              >
                <Download size={12} /> {packetState === 'loading' ? 'Preparing' : packetState === 'ready' ? 'Packet ready' : 'Lab packet'}
              </button>
              <button
                aria-pressed={submissionState === 'submitted'}
                disabled={submissionState === 'submitting'}
                onClick={handleSubmit}
                className="figma-v2-primary-button flex items-center gap-1.5 px-3 py-2 rounded-sm border transition-all"
                style={{ background: submissionState === 'submitted' ? GREEN_BG : ACCENT_BG, borderColor: submissionState === 'submitted' ? alpha(GREEN, 31) : alpha(ACCENT, 25), color: submissionState === 'submitted' ? GREEN : ACCENT, fontSize: 11, fontFamily: 'var(--font-mono)', opacity: submissionState === 'submitting' ? 0.75 : 1 }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = alpha(submissionState === 'submitted' ? GREEN : ACCENT, 50))}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = alpha(submissionState === 'submitted' ? GREEN : ACCENT, 25))}
                type="button"
              >
                <Send size={11} /> {submissionState === 'submitted' ? 'Submitted' : submissionState === 'submitting' ? 'Submitting...' : 'Submit lab'}
              </button>
            </div>
          </div>

          {/* Progress strip */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: BORDER2 }}>
              <div className="h-px transition-all" style={{ width: `${pct}%`, background: ACCENT, opacity: 0.7 }} />
            </div>
            <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>{done}/{checklist.length}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-[1280px] mx-auto px-6 flex gap-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="figma-v2-tab-button py-2.5 px-4 border-b-2 transition-all whitespace-nowrap"
              data-active={tab === t ? 'true' : 'false'}
              style={{
                '--figma-tab-border': tab === t ? ACCENT : 'transparent',
                '--figma-tab-color': tab === t ? ACCENT : TEXT2,
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.08em',
              } as React.CSSProperties}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-6 py-6">

        {tab === 'Brief' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            <div className="space-y-4">
              <ContentPanel label="SCENARIO">
                <p style={{ color: TEXT2, fontSize: 14, lineHeight: 1.7 }}>{lab.scenario}</p>
              </ContentPanel>
              {[
                { label: 'SETUP',    body: 'Ensure a running Kubernetes cluster. Verify kubectl context. Create a dedicated namespace for isolation.' },
                { label: 'INSPECT',  body: 'Examine cluster state before any changes. Document existing resources. Identify potential conflicts.' },
                { label: 'VALIDATE', body: 'Run each validation command. Capture output for the evidence journal. Compare against expected evidence.' },
                { label: 'CLEANUP',  body: 'Delete all created resources. Remove the namespace. Verify no orphaned cluster-level resources remain.' },
              ].map((s) => (
                <ContentPanel key={s.label} label={s.label}>
                  <p style={{ color: TEXT2, fontSize: 13, lineHeight: 1.65 }}>{s.body}</p>
                </ContentPanel>
              ))}
            </div>

            <div className="space-y-4">
              {/* Checklist */}
              <ContentPanel label={`CHECKLIST · ${done}/${checklist.length}`}>
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <label key={item.id} className="flex items-start gap-2.5 cursor-pointer group">
                      <button
                        aria-label={`${item.completed ? 'Mark incomplete' : 'Mark complete'}: ${item.text}`}
                        onClick={() => toggle(item.id)}
                        className="shrink-0 mt-0.5"
                        type="button"
                      >
                        {item.completed
                          ? <CheckCircle2 size={13} style={{ color: GREEN }} />
                          : <Circle size={13} style={{ color: TEXT3 }} />}
                      </button>
                      <span style={{ color: item.completed ? TEXT3 : TEXT, fontSize: 12, textDecoration: item.completed ? 'line-through' : 'none' }}>
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              </ContentPanel>

              <ContentPanel label="SKILLS">
                <div className="flex flex-wrap gap-1.5">
                  {lab.skills.map((s, i) => (
                    <span key={i} className="px-2 py-1 rounded-sm border" style={{ borderColor: BORDER2, color: TEXT2, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </ContentPanel>

              <ContentPanel label="RELATED RESOURCES">
                {lab.relatedResources.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => openRelatedResource(r.id)}
                    className="w-full text-left py-1.5 border-b last:border-0 cursor-pointer"
                    style={{ borderColor: BORDER }}
                    type="button"
                  >
                    <span style={{ color: BLUE, fontSize: 12 }}>{r.title}</span>
                  </button>
                ))}
              </ContentPanel>
            </div>
          </div>
        )}

        {tab === 'Console' && (
          <div className="max-w-[820px] space-y-5">
            <p style={{ color: TEXT2, fontSize: 13 }}>
              Run each command and capture the output for your evidence journal.
            </p>
            <div className="rounded-sm overflow-hidden" style={{ background: TERMINAL, border: `1px solid ${BORDER}` }}>
              <div className="px-4 py-2 border-b flex items-center gap-2" style={{ borderColor: BORDER2 }}>
                <div className="flex gap-1.5">
                  {['#1A1D30', '#1A1D30', '#1A3020'].map((c, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <span style={{ color: ACCENT, fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.85, marginLeft: 8 }}>
                  {lab.title.toLowerCase().replace(/\s+/g, '-')} — validation
                </span>
              </div>
              <div className="p-5 space-y-5">
                {lab.validationCommands.map((cmd, i) => (
                  <div key={i} className="group">
                    <div className="flex items-start gap-2.5">
                      <span style={{ color: ACCENT, fontFamily: 'var(--font-mono)', fontSize: 13, opacity: 0.6, flexShrink: 0 }}>$</span>
                      <code style={{ color: CODE_TEXT, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7, flex: 1, wordBreak: 'break-all' }}>
                        {cmd}
                      </code>
                      <button
                        aria-label={`Copy validation command ${i + 1}`}
                        onClick={() => handleCopy(cmd, i)}
                        className="opacity-100 transition-opacity p-1.5 rounded-sm"
                        style={{ background: SURF2 }}
                        type="button"
                      >
                        {copiedIdx === i
                          ? <Check size={11} style={{ color: ACCENT }} />
                          : <Copy size={11} style={{ color: TEXT3 }} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ContentPanel label="EXPECTED EVIDENCE">
              <div className="space-y-2">
                {lab.expectedEvidence.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full shrink-0 mt-2" style={{ background: ACCENT, opacity: 0.6 }} />
                    <span style={{ color: TEXT2, fontSize: 13 }}>{ev}</span>
                  </div>
                ))}
              </div>
            </ContentPanel>
          </div>
        )}

        {tab === 'Workbook' && (
          <div className="max-w-[720px]">
            <div className="rounded-sm border overflow-hidden" style={{ background: SURF, borderColor: BORDER }}>
              <div className="px-5 py-3.5 border-b" style={{ borderColor: BORDER }}>
                <h3 style={{ color: TEXT, fontSize: 13, fontWeight: 500 }}>Worksheet Prompts</h3>
                <p style={{ color: TEXT3, fontSize: 11, marginTop: 2 }}>Responses become your evidence journal entry.</p>
              </div>
              <div className="p-5 space-y-5">
                {WORKBOOK_PROMPTS.map((q, i) => (
                  <div key={i}>
                    <p style={{ color: TEXT, fontSize: 12, fontWeight: 500, marginBottom: 6 }}>{q.prompt}</p>
                    <textarea
                      rows={3}
                      placeholder={q.ph}
                      className="w-full rounded-sm border outline-none resize-none px-3 py-2 transition-colors"
                      style={{
                        background: SURF2,
                        borderColor: BORDER,
                        color: TEXT,
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                        lineHeight: 1.6,
                      }}
                      value={workbookAnswers[i] ?? ''}
                      onChange={(e) => {
                        const nextValue = e.currentTarget.value;
                        setWorkbookAnswers((prev) => prev.map((answer, answerIndex) => answerIndex === i ? nextValue : answer));
                        setSaveState('idle');
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = alpha(ACCENT, 38))}
                      onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
                    />
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: BORDER }}>
                <span style={{ color: TEXT3, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  {saveState === 'saved' ? '✓ saved' : saveState === 'saving' ? 'saving…' : 'unsaved'}
                </span>
                <button
                  onClick={handleSave}
                  className="figma-v2-primary-button flex items-center gap-1.5 px-3 py-1.5 rounded-sm border transition-all"
                  style={{ background: ACCENT_BG, borderColor: alpha(ACCENT, 25), color: ACCENT, fontSize: 10, fontFamily: 'var(--font-mono)' }}
                >
                  <Save size={11} />
                  {saveState === 'saving' ? 'Saving…' : 'Save progress'}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'Evidence' && (
          <div className="max-w-[720px] space-y-2.5">
            <div className="flex items-center justify-between pb-1">
              <span style={{ color: TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>{evidenceStatus}</span>
              <span style={{ color: attachedEvidenceCount === evidenceArtifacts.length ? GREEN : TEXT3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                {attachedEvidenceCount}/{evidenceArtifacts.length}
              </span>
            </div>
            {evidenceArtifacts.map((a) => (
              <div
                key={a.term}
                className="flex items-start gap-4 p-4 rounded-sm border"
                style={{ background: SURF, borderColor: a.attached ? alpha(GREEN, 19) : BORDER }}
              >
                <div className="shrink-0 mt-0.5">
                  {a.attached
                    ? <CheckCircle2 size={14} style={{ color: GREEN }} />
                    : <Circle size={14} style={{ color: TEXT3 }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <code style={{ color: ACCENT, fontSize: 11, fontFamily: 'var(--font-mono)' }}>{a.term}</code>
                  <p style={{ color: TEXT2, fontSize: 12, marginTop: 2 }}>{a.desc}</p>
                  <p style={{ color: a.attached ? GREEN : TEXT3, fontSize: 10, marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                    {a.attached ? 'attached to evidence map' : a.note}
                  </p>
                </div>
                <button
                  aria-label={`${a.attached ? 'Remove' : 'Attach'} ${a.term}`}
                  onClick={() => toggleEvidenceArtifact(a.term)}
                  className="shrink-0 px-2.5 py-1.5 rounded-sm border transition-all text-[10px]"
                  style={{
                    background: a.attached ? GREEN_BG : 'transparent',
                    borderColor: a.attached ? alpha(GREEN, 19) : BORDER2,
                    color: a.attached ? GREEN : TEXT2,
                    fontFamily: 'var(--font-mono)',
                  }}
                  type="button"
                >
                  {a.attached ? 'Remove' : 'Attach'}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'Rubric' && (
          <div className="max-w-[720px] space-y-2.5">
            {rubricRows.map((row, i) => {
              const cfg = RUBRIC_CFG[row.status];
              return (
                <div key={i} className="flex items-start gap-4 p-4 rounded-sm border" style={{ background: SURF, borderColor: BORDER }}>
                  <span
                    className="shrink-0 px-2 py-1 rounded-sm mt-0.5"
                    style={{ color: cfg.color, background: cfg.bg, fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}
                  >
                    {cfg.label}
                  </span>
                  <div>
                    <p style={{ color: TEXT, fontSize: 13, fontWeight: 500 }}>{row.criterion}</p>
                    <p style={{ color: TEXT2, fontSize: 12, marginTop: 2 }}>{row.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
    {packetOverlay && createPortal(packetOverlay, document.body)}
    </>
  );
}

function ContentPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border overflow-hidden" style={{ background: SURF, borderColor: BORDER }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: BORDER }}>
        <span style={{ color: TEXT3, fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.1em' }}>{label}</span>
      </div>
      <div className="p-4">{children}</div>
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
