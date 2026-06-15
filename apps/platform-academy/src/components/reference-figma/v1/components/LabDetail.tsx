import { useState } from 'react';
import {
  ArrowLeft, Clock, Server, FileText, Star, Copy, Check,
  CheckCircle2, Circle, AlertCircle, Send, Download, ChevronDown, ChevronRight, Save
} from 'lucide-react';
import { api } from '../../../../api';
import { downloadReferenceLabPacket, type LabPacketDownloadResult } from '../../labPacketHelpers';
import { labs } from '../data';
import type { Level, LabStatus } from '../data';

const LEVEL_COLORS: Record<Level, { bg: string; text: string }> = {
  Fresher: { bg: '#DCFCE7', text: '#166534' },
  Intermediate: { bg: '#DBEAFE', text: '#1E40AF' },
  Advanced: { bg: '#FEF3C7', text: '#92400E' },
};

const STATUS_CONFIG: Record<LabStatus, { label: string; bg: string; text: string }> = {
  'not-started': { label: 'Not started', bg: '#F0F0EC', text: '#6B7870' },
  'in-progress': { label: 'In progress', bg: '#FEF3C7', text: '#92400E' },
  'strong-evidence': { label: 'Strong evidence', bg: '#DBEAFE', text: '#1E40AF' },
  'submitted': { label: 'Submitted', bg: '#DCFCE7', text: '#166534' },
};

type RubricStatus = 'missing' | 'needs-evidence' | 'passes' | 'strong';
const RUBRIC_CONFIG: Record<RubricStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  'missing': { label: 'Missing', bg: '#FEF2F2', text: '#DC2626', icon: <AlertCircle size={12} /> },
  'needs-evidence': { label: 'Needs evidence', bg: '#FEF3C7', text: '#92400E', icon: <AlertCircle size={12} /> },
  'passes': { label: 'Passes', bg: '#DBEAFE', text: '#1E40AF', icon: <CheckCircle2 size={12} /> },
  'strong': { label: 'Strong', bg: '#DCFCE7', text: '#166534', icon: <CheckCircle2 size={12} /> },
};

interface LabDetailProps {
  labId: number;
  onBack: () => void;
}

type EvidenceArtifact = {
  term: string;
  desc: string;
  attached: boolean;
  note: string;
};

const INITIAL_EVIDENCE_ARTIFACTS: EvidenceArtifact[] = [
  { term: 'namespace-yaml', desc: 'The namespace manifest with labels and quotas', attached: true, note: 'Starter evidence is available.' },
  { term: 'pod-running-screenshot', desc: 'Terminal output showing pod in Running state', attached: false, note: 'Attach command output or a screenshot after validation.' },
  { term: 'event-log', desc: 'kubectl get events output with timestamps', attached: false, note: 'Attach event output from the incident window.' },
  { term: 'pod-spec-yaml', desc: 'Final pod spec YAML with resource limits documented', attached: false, note: 'Attach the final manifest or copied YAML.' },
];

export default function LabDetail({ labId, onBack }: LabDetailProps) {
  const lab = labs.find((l) => l.id === labId) || labs[1];
  const [checklist, setChecklist] = useState(lab.checklist.map((c) => ({ ...c })));
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string>('brief');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [packetState, setPacketState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [packetPreview, setPacketPreview] = useState<LabPacketDownloadResult | null>(null);
  const [evidenceArtifacts, setEvidenceArtifacts] = useState(INITIAL_EVIDENCE_ARTIFACTS);
  const [evidenceStatus, setEvidenceStatus] = useState('1 artifact attached');

  const levelCol = LEVEL_COLORS[lab.level];
  const statusCfg = STATUS_CONFIG[lab.status];
  const completedSteps = checklist.filter((c) => c.completed).length;
  const packetUrl = api.labPacketUrl(lab.slug);
  const attachedEvidenceCount = evidenceArtifacts.filter((artifact) => artifact.attached).length;

  const rubricItems: { criterion: string; status: RubricStatus; note: string }[] = [
    { criterion: 'Cluster setup and namespace creation', status: lab.status === 'submitted' ? 'strong' : lab.status === 'in-progress' ? 'passes' : 'missing', note: lab.status === 'submitted' ? 'Namespace created with correct labels and quotas.' : 'No evidence submitted yet.' },
    { criterion: 'Workload deployment with correct spec', status: lab.status === 'submitted' ? 'strong' : 'missing', note: lab.status === 'submitted' ? 'Deployment YAML matches rubric requirements.' : 'Deployment not yet validated.' },
    { criterion: 'Validation commands executed', status: lab.status === 'in-progress' ? 'needs-evidence' : lab.status === 'submitted' ? 'passes' : 'missing', note: lab.status === 'in-progress' ? 'Commands run but output not captured.' : lab.status === 'submitted' ? 'Command output captured and reviewed.' : 'Not started.' },
    { criterion: 'Evidence journal entry', status: lab.status === 'submitted' ? 'strong' : 'missing', note: lab.status === 'submitted' ? 'Journal entry complete with all artifacts.' : 'Journal entry required.' },
  ];

  const handleCopy = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  const handleSave = () => {
    setSaveState('saving');
    setTimeout(() => setSaveState('saved'), 1200);
    setTimeout(() => setSaveState('idle'), 3000);
  };

  const handlePacketDownload = async () => {
    setPacketState('loading');
    const result = await downloadReferenceLabPacket(lab, packetUrl);
    setPacketPreview(result);
    setPacketState(result.error ? 'error' : 'ready');
  };

  const toggleEvidenceArtifact = (term: string) => {
    const current = evidenceArtifacts.find((artifact) => artifact.term === term);
    if (!current) return;

    const nextAttached = !current.attached;
    const nextCount = evidenceArtifacts.filter((artifact) => artifact.term === term ? nextAttached : artifact.attached).length;
    setEvidenceArtifacts((prev) => prev.map((artifact) => artifact.term === term ? { ...artifact, attached: nextAttached } : artifact));
    setEvidenceStatus(`${term} ${nextAttached ? 'attached' : 'removed'} · ${nextCount}/${evidenceArtifacts.length}`);
  };

  const toggleChecklist = (id: number) => {
    setChecklist((prev) => prev.map((c) => c.id === id ? { ...c, completed: !c.completed } : c));
  };

  const sections = [
    { id: 'brief', label: 'Operational Brief' },
    { id: 'console', label: 'Command Console' },
    { id: 'workbook', label: 'Workbook' },
    { id: 'evidence', label: 'Evidence Map' },
    { id: 'rubric', label: 'Rubric' },
  ];

  return (
    <div className="min-h-full" style={{ background: '#F4F4F1', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Lab header */}
      <div className="border-b" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
        <div className="max-w-[1280px] mx-auto px-6 py-4">
          {/* Back + meta */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-[12px] transition-colors"
              style={{ color: '#6B7870' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1A1D1B')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6B7870')}
            >
              <ArrowLeft size={13} /> Labs
            </button>
            <span style={{ color: '#C4C4BC' }}>/</span>
            <span className="text-[12px] truncate" style={{ color: '#4A5650' }}>{lab.title}</span>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2 mb-2">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-semibold"
                  style={{ background: levelCol.bg, color: levelCol.text }}
                >
                  {lab.level}
                </span>
                <span className="text-[11px]" style={{ color: '#8A9690' }}>{lab.track}</span>
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
                  style={lab.runtime === 'cluster' ? { background: '#EFF6FF', color: '#1E40AF' } : { background: '#F0F0EC', color: '#4A5650' }}
                >
                  {lab.runtime === 'cluster' ? <Server size={9} /> : <FileText size={9} />}
                  {lab.runtime === 'cluster' ? 'Cluster setup included' : 'File-only lab'}
                </span>
                <span className="flex items-center gap-1 text-[11px]" style={{ color: '#8A9690' }}>
                  <Clock size={10} /> {lab.duration}m
                </span>
                {lab.portfolioGrade && (
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{ background: '#F5F3FF', color: '#6D28D9' }}
                  >
                    <Star size={8} /> Portfolio-grade
                  </span>
                )}
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-medium"
                  style={{ background: statusCfg.bg, color: statusCfg.text }}
                >
                  {statusCfg.label}
                </span>
              </div>
              <h1 className="text-[20px] font-semibold" style={{ color: '#1A1D1B' }}>{lab.title}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                aria-label="Download lab packet"
                onClick={() => void handlePacketDownload()}
                disabled={packetState === 'loading'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md border text-[12px] font-medium transition-colors"
                style={{
                  background: packetState === 'ready' ? '#DDFAF6' : '#FFFFFF',
                  borderColor: packetState === 'ready' ? '#0D9488' : '#E2E2DC',
                  color: packetState === 'ready' ? '#0D9488' : '#4A5650',
                  opacity: packetState === 'loading' ? 0.7 : 1,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F0F0EC')}
                onMouseLeave={(e) => (e.currentTarget.style.background = packetState === 'ready' ? '#DDFAF6' : '#FFFFFF')}
                type="button"
              >
                <Download size={13} /> {packetState === 'loading' ? 'Preparing' : packetState === 'ready' ? 'Packet Ready' : 'Lab Packet'}
              </button>
              <button
                className="figma-v1-primary-button flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-semibold transition-colors"
                style={{ background: '#0D9488', color: '#FFFFFF' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#0F766E')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#0D9488')}
              >
                <Send size={13} /> Submit Lab
              </button>
            </div>
          </div>

          {/* Checklist progress strip */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#F0F0EC' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(completedSteps / checklist.length) * 100}%`, background: '#0D9488' }}
              />
            </div>
            <span className="text-[11px] tabular-nums" style={{ color: '#8A9690' }}>
              {completedSteps}/{checklist.length} steps
            </span>
          </div>
        </div>

        {/* Section tabs */}
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className="py-2.5 px-3 text-[12px] font-medium whitespace-nowrap border-b-2 transition-all"
                style={{
                  borderColor: activeSection === s.id ? '#0D9488' : 'transparent',
                  color: activeSection === s.id ? '#0D9488' : '#6B7870',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section content */}
      <div className="max-w-[1280px] mx-auto px-6 py-6">
        {activeSection === 'brief' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <div className="space-y-6">
              {/* Scenario */}
              <div className="rounded-lg border p-5" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
                <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#9BA8A0' }}>Scenario</h3>
                <p className="text-[14px] leading-relaxed" style={{ color: '#1A1D1B' }}>{lab.scenario}</p>
              </div>

              {/* Operational sections */}
              {[
                { label: 'Setup', content: 'Ensure you have a running Kubernetes cluster (minikube, kind, or managed). Verify kubectl is configured with the correct context. Create a dedicated namespace for this lab to keep resources isolated.' },
                { label: 'Inspect', content: 'Examine the initial state of the cluster resources. Review existing deployments, services, and configurations. Identify any pre-existing resources that may affect your work.' },
                { label: 'Validate', content: 'Run the provided validation commands to confirm your work meets the rubric requirements. Capture the output for your evidence journal. Each validation command corresponds to a rubric criterion.' },
                { label: 'Cleanup', content: 'After completing the lab, remove all resources created during the exercise. Delete the namespace and any cluster-level resources. Verify no orphaned resources remain.' },
              ].map((section) => (
                <div key={section.label} className="rounded-lg border overflow-hidden" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
                  <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: '#F0F0EC' }}>
                    <span className="text-[12px] font-semibold" style={{ color: '#1A1D1B' }}>{section.label}</span>
                  </div>
                  <div className="px-5 py-3">
                    <p className="text-[13px] leading-relaxed" style={{ color: '#4A5650' }}>{section.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: checklist */}
            <div className="space-y-4">
              <div className="rounded-lg border overflow-hidden" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#F0F0EC' }}>
                  <span className="text-[12px] font-semibold" style={{ color: '#1A1D1B' }}>Checklist</span>
                  <span className="text-[11px] tabular-nums" style={{ color: '#8A9690' }}>{completedSteps}/{checklist.length}</span>
                </div>
                <div className="p-4 space-y-2">
                  {checklist.map((item) => (
                    <label key={item.id} className="flex items-start gap-2.5 cursor-pointer group">
                      <button
                        onClick={() => toggleChecklist(item.id)}
                        className="mt-0.5 shrink-0"
                      >
                        {item.completed
                          ? <CheckCircle2 size={15} style={{ color: '#0D9488' }} />
                          : <Circle size={15} style={{ color: '#C4C4BC' }} className="group-hover:text-[#0D9488]" />
                        }
                      </button>
                      <span
                        className="text-[13px] leading-snug"
                        style={{
                          color: item.completed ? '#9BA8A0' : '#1A1D1B',
                          textDecoration: item.completed ? 'line-through' : 'none',
                        }}
                      >
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="rounded-lg border p-4" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#9BA8A0' }}>Skills Practiced</p>
                <div className="flex flex-wrap gap-1.5">
                  {lab.skills.map((skill, i) => (
                    <span key={i} className="px-2 py-1 rounded border text-[11px]" style={{ background: '#F7F7F4', borderColor: '#E2E2DC', color: '#4A5650' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Related resources */}
              <div className="rounded-lg border p-4" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#9BA8A0' }}>Related Resources</p>
                <div className="space-y-1.5">
                  {lab.relatedResources.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-[12px] cursor-pointer" style={{ color: '#2563EB' }}>
                      <ChevronRight size={11} />
                      <span className="hover:underline">{r.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'console' && (
          <div className="max-w-[800px] space-y-6">
            <p className="text-[13px]" style={{ color: '#6B7870' }}>
              Validation commands for this lab. Run each command in your terminal and capture the output for your evidence journal.
            </p>
            <div className="rounded-lg overflow-hidden border" style={{ background: '#0D1A12', borderColor: '#1C3524' }}>
              {/* Terminal header */}
              <div className="px-4 py-2 border-b flex items-center gap-2" style={{ borderColor: '#1C3524' }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3D5A40' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3D5A40' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#4ADE80', opacity: 0.5 }} />
                </div>
                <span className="text-[11px] ml-2" style={{ color: '#4ADE80', fontFamily: 'var(--font-mono)', opacity: 0.6 }}>
                  {lab.title.toLowerCase().replace(/\s+/g, '-')} — validation
                </span>
              </div>

              <div className="p-4 space-y-4">
                {lab.validationCommands.map((cmd, i) => (
                  <div key={i} className="group">
                    <div className="flex items-start gap-2">
                      <span style={{ color: '#4ADE80', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: '1.6' }}>$</span>
                      <code
                        className="flex-1 text-[12px] leading-relaxed break-all"
                        style={{ color: '#DDFAF6', fontFamily: 'var(--font-mono)' }}
                      >
                        {cmd}
                      </code>
                      <button
                        onClick={() => handleCopy(cmd, i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded"
                        style={{ background: '#1C3524' }}
                      >
                        {copiedIdx === i
                          ? <Check size={12} style={{ color: '#4ADE80' }} />
                          : <Copy size={12} style={{ color: '#4ADE80' }} />
                        }
                      </button>
                    </div>
                    {/* Mock output */}
                    <div className="mt-1.5 ml-4 text-[11px] leading-relaxed" style={{ color: '#4A5650', fontFamily: 'var(--font-mono)' }}>
                      {i === 0 && '# Run this command to verify pod status'}
                      {i === 1 && '# Pipe through grep to filter relevant fields'}
                      {i === 2 && '# Capture last 20 lines of container logs'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expected output */}
            <div className="rounded-lg border p-4" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
              <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#9BA8A0' }}>Expected Evidence</h3>
              <div className="space-y-2">
                {lab.expectedEvidence.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: '#0D9488' }} />
                    <span className="text-[13px]" style={{ color: '#4A5650' }}>{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'workbook' && (
          <div className="max-w-[720px] space-y-6">
            <div className="rounded-lg border overflow-hidden" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: '#F0F0EC' }}>
                <h3 className="text-[13px] font-semibold" style={{ color: '#1A1D1B' }}>Worksheet Prompts</h3>
                <p className="text-[11px] mt-0.5" style={{ color: '#8A9690' }}>Answer these questions as you work through the lab. Your responses become your evidence journal entry.</p>
              </div>
              <div className="p-5 space-y-5">
                {[
                  { prompt: '1. Describe the initial cluster state before you began. What namespaces and resources were present?', placeholder: 'e.g., Cluster had 3 nodes, kube-system namespace with standard add-ons, no application namespaces…' },
                  { prompt: '2. List the exact kubectl commands you ran to complete the primary task, in order.', placeholder: 'e.g., kubectl create namespace dev-ops → kubectl apply -f pod.yaml → …' },
                  { prompt: '3. What was the output of the validation commands? Did anything differ from expectations?', placeholder: 'Paste key output lines here, note any unexpected findings…' },
                  { prompt: '4. What would you do differently if you encountered this scenario in production?', placeholder: 'e.g., I would add resource quotas to the namespace before deploying…' },
                ].map((q, i) => (
                  <div key={i}>
                    <p className="text-[12px] font-medium mb-1.5" style={{ color: '#1A1D1B' }}>{q.prompt}</p>
                    <textarea
                      rows={3}
                      placeholder={q.placeholder}
                      className="w-full text-[12px] rounded-md border p-2.5 outline-none transition-colors resize-none"
                      style={{ background: '#FAFAF7', borderColor: '#E2E2DC', color: '#1A1D1B', fontFamily: 'var(--font-sans)' }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#0D9488')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#E2E2DC')}
                    />
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: '#F0F0EC' }}>
                <span className="text-[11px]" style={{ color: '#8A9690' }}>
                  {saveState === 'saved' ? 'Progress saved ✓' : saveState === 'saving' ? 'Saving…' : 'Auto-saved locally'}
                </span>
                <button
                  onClick={handleSave}
                  className="figma-v1-primary-button flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                  style={{ background: '#0D9488', color: '#FFFFFF' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#0F766E')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#0D9488')}
                >
                  <Save size={12} />
                  {saveState === 'saving' ? 'Saving…' : 'Save Progress'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'evidence' && (
          <div className="max-w-[720px] space-y-4">
            <p className="text-[13px]" style={{ color: '#6B7870' }}>
              Artifact map for this lab. Each evidence term corresponds to a rubric criterion. Attach screenshots, YAML, or command output.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: '#8A9690' }}>{evidenceStatus}</span>
              <span className="text-[12px] tabular-nums" style={{ color: attachedEvidenceCount === evidenceArtifacts.length ? '#166534' : '#8A9690' }}>
                {attachedEvidenceCount}/{evidenceArtifacts.length}
              </span>
            </div>
            {evidenceArtifacts.map((artifact) => (
              <div
                key={artifact.term}
                className="flex items-start gap-4 p-4 rounded-lg border"
                style={{
                  background: '#FFFFFF',
                  borderColor: artifact.attached ? '#BBF7D0' : '#E2E2DC',
                }}
              >
                <div className="shrink-0 mt-0.5">
                  {artifact.attached
                    ? <CheckCircle2 size={16} style={{ color: '#0D9488' }} />
                    : <Circle size={16} style={{ color: '#C4C4BC' }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <code className="text-[12px] font-medium" style={{ color: '#1A1D1B', fontFamily: 'var(--font-mono)' }}>
                    {artifact.term}
                  </code>
                  <p className="text-[12px] mt-0.5" style={{ color: '#6B7870' }}>{artifact.desc}</p>
                  <p className="text-[11px] mt-1.5" style={{ color: artifact.attached ? '#166534' : '#8A9690' }}>
                    {artifact.attached ? 'Attached to evidence map' : artifact.note}
                  </p>
                </div>
                <button
                  aria-label={`${artifact.attached ? 'Remove' : 'Attach'} ${artifact.term}`}
                  onClick={() => toggleEvidenceArtifact(artifact.term)}
                  className="shrink-0 px-2.5 py-1.5 rounded border text-[11px] font-medium transition-colors"
                  style={{
                    background: artifact.attached ? '#DCFCE7' : '#FFFFFF',
                    borderColor: artifact.attached ? '#BBF7D0' : '#E2E2DC',
                    color: artifact.attached ? '#166534' : '#6B7870',
                  }}
                  type="button"
                >
                  {artifact.attached ? 'Remove' : 'Attach'}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'rubric' && (
          <div className="max-w-[720px] space-y-3">
            <p className="text-[13px]" style={{ color: '#6B7870' }}>
              Rubric feedback based on submitted evidence. Each criterion maps to expected artifacts and validation commands.
            </p>
            {rubricItems.map((item, i) => {
              const cfg = RUBRIC_CONFIG[item.status];
              return (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-lg border"
                  style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}
                >
                  <span
                    className="shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold mt-0.5"
                    style={{ background: cfg.bg, color: cfg.text, whiteSpace: 'nowrap' }}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium mb-0.5" style={{ color: '#1A1D1B' }}>{item.criterion}</p>
                    <p className="text-[12px]" style={{ color: '#6B7870' }}>{item.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {packetPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPacketPreview(null)} />
          <div className="relative w-full max-w-[760px] rounded-lg border overflow-hidden shadow-xl" style={{ background: '#FFFFFF', borderColor: '#E2E2DC' }}>
            <div className="px-5 py-4 border-b flex items-start justify-between gap-4" style={{ borderColor: '#E2E2DC' }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: packetPreview.error ? '#92400E' : '#0D9488' }}>
                  {packetPreview.error ? 'Packet fallback ready' : 'Packet ready'}
                </p>
                <h2 className="text-[16px] font-semibold mt-1" style={{ color: '#1A1D1B' }}>{lab.title}</h2>
              </div>
              <button onClick={() => setPacketPreview(null)} style={{ color: '#8A9690' }} className="text-[20px] leading-none" type="button">×</button>
            </div>
            <pre className="m-0 p-5 overflow-auto" style={{ maxHeight: '56vh', background: '#FAFAF7', color: '#4A5650', fontSize: 12, lineHeight: 1.7, fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
              {packetPreview.markdown}
            </pre>
            <div className="px-5 py-3 border-t flex items-center gap-2 justify-end" style={{ borderColor: '#E2E2DC' }}>
              <a
                className="px-3 py-2 rounded-md border text-[12px] font-medium"
                href={packetPreview.sourceUrl}
                rel="noreferrer"
                style={{ background: '#FFFFFF', borderColor: '#E2E2DC', color: '#4A5650' }}
                target="_blank"
              >
                Open raw
              </a>
              <button
                className="px-3 py-2 rounded-md text-[12px] font-semibold"
                onClick={() => void navigator.clipboard.writeText(packetPreview.markdown)}
                style={{ background: '#0D9488', color: '#FFFFFF' }}
                type="button"
              >
                Copy packet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
