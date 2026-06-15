import type { ReactElement } from "react";
import { useLayoutEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, LoaderCircle } from "lucide-react";

import V2Dashboard from "./reference-figma/v2/components/Dashboard";
import V2InterviewPrep from "./reference-figma/v2/components/InterviewPrep";
import V2LabDetail from "./reference-figma/v2/components/LabDetail";
import V2LabsQueue from "./reference-figma/v2/components/LabsQueue";
import V2LessonReader from "./reference-figma/v2/components/LessonReader";
import V2ResourceDetail from "./reference-figma/v2/components/ResourceDetail";
import V2Resources from "./reference-figma/v2/components/Resources";
import V2Roadmap from "./reference-figma/v2/components/Roadmap";
import { labs as referenceLabs, lessonDetails as referenceLessons, resources as referenceResources } from "./reference-figma/v1/data";
import type { Resource as ReferenceResource } from "./reference-figma/v1/data";
import type { ReferenceDashboardProgress } from "./reference-figma/dashboardProgress";
import v2Css from "../reference-figma-v2.css?raw";

const SHARED_THEME_CSS = `
:host {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.figma-shadow-root {
  --figma-v2-bg: #080A11;
  --figma-v2-surface: #0D0F17;
  --figma-v2-surface-2: #131620;
  --figma-v2-surface-3: #191C28;
  --figma-v2-border: #1A1D2E;
  --figma-v2-border-2: #242840;
  --figma-v2-text: #DDE2F0;
  --figma-v2-text-2: #9AA3C7;
  --figma-v2-text-3: #838BAB;
  --figma-v2-accent: #3DFFD6;
  --figma-v2-accent-bg: #0A201C;
  --figma-v2-green: #1DDF7A;
  --figma-v2-green-bg: #061A0F;
  --figma-v2-amber: #FFB347;
  --figma-v2-amber-bg: #1A1108;
  --figma-v2-blue: #4E9FFF;
  --figma-v2-blue-bg: #081424;
  --figma-v2-red: #FF3D5E;
  --figma-v2-red-bg: #1A0810;
  --figma-v2-purple: #A78BFA;
  --figma-v2-purple-bg: #13102A;
  --figma-v2-terminal: #060810;
  --figma-v2-code-text: #A0FFE8;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #080A11;
  color: #DDE2F0;
  overflow: auto;
  overscroll-behavior: contain;
}

.figma-shadow-root > * {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.figma-v2-side-rail,
.figma-v2-labs-rail {
  width: 100% !important;
}

.figma-v2-main-pane {
  min-width: 0 !important;
}

.figma-v2-interview-root {
  flex-direction: row !important;
}

.figma-status-spin {
  animation: figma-status-spin 900ms linear infinite;
}

@keyframes figma-status-spin {
  to {
    transform: rotate(360deg);
  }
}

:host-context(html:not([data-pa-theme="light"])) .figma-shadow-root,
:host-context(html:not([data-pa-theme="light"])) .figma-shadow-root * {
  --figma-v2-text-2: #9AA3C7 !important;
  --figma-v2-text-3: #838BAB !important;
}

@media (min-width: 768px) {
  .figma-v2-side-rail,
  .figma-v2-labs-rail {
    width: 340px !important;
  }
}

@media (min-width: 1024px) {
  .figma-v2-side-rail,
  .figma-v2-labs-rail {
    width: 380px !important;
  }
}

@media (max-width: 767px) {
  .figma-v2-interview-root {
    flex-direction: column !important;
  }

  .figma-v2-interview-root .figma-v2-side-rail {
    height: min(46%, 390px) !important;
    max-height: min(46%, 390px) !important;
    border-right-width: 0 !important;
    border-bottom-width: 1px !important;
  }

  .figma-v2-interview-root .figma-v2-main-pane {
    display: block !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    overflow-y: auto !important;
  }
}

:host-context(html[data-pa-theme="light"]) .figma-shadow-root,
:host-context(html[data-pa-theme="light"]) .figma-shadow-root * {
  --figma-v2-bg: #f4f4f1;
  --figma-v2-surface: #ffffff;
  --figma-v2-surface-2: #fafaf7;
  --figma-v2-surface-3: #f0f0ec;
  --figma-v2-border: #e2e2dc;
  --figma-v2-border-2: #d4d4cb;
  --figma-v2-text: #1a1d1b;
  --figma-v2-text-2: #4a5650;
  --figma-v2-text-3: #8a9690;
  --figma-v2-accent: #0d9488;
  --figma-v2-accent-bg: #ddfaf6;
  --figma-v2-green: #166534;
  --figma-v2-green-bg: #dcfce7;
  --figma-v2-amber: #92400e;
  --figma-v2-amber-bg: #fef3c7;
  --figma-v2-blue: #1d4ed8;
  --figma-v2-blue-bg: #dbeafe;
  --figma-v2-red: #b91c1c;
  --figma-v2-red-bg: #fee2e2;
  --figma-v2-purple: #6d28d9;
  --figma-v2-purple-bg: #ede9fe;
  --figma-v2-terminal: #f7f7f2;
  --figma-v2-code-text: #0f766e;
  background: #f4f4f1 !important;
  color: #1a1d1b !important;
}

:host-context(html[data-pa-theme="light"]) [style*="rgb(8, 10, 17)"],
:host-context(html[data-pa-theme="light"]) [style*="#080A11"],
:host-context(html[data-pa-theme="light"]) [style*="#080a11"] {
  background: #f4f4f1 !important;
}

:host-context(html[data-pa-theme="light"]) [style*="rgb(13, 15, 23)"],
:host-context(html[data-pa-theme="light"]) [style*="#0D0F17"],
:host-context(html[data-pa-theme="light"]) [style*="#0d0f17"],
:host-context(html[data-pa-theme="light"]) [style*="rgb(19, 22, 32)"],
:host-context(html[data-pa-theme="light"]) [style*="#131620"] {
  background: #ffffff !important;
}

:host-context(html[data-pa-theme="light"]) [style*="rgb(25, 28, 40)"],
:host-context(html[data-pa-theme="light"]) [style*="#191C28"],
:host-context(html[data-pa-theme="light"]) [style*="#191c28"],
:host-context(html[data-pa-theme="light"]) input {
  background: #fafaf7 !important;
}

:host-context(html[data-pa-theme="light"]) [style*="rgb(26, 29, 46)"],
:host-context(html[data-pa-theme="light"]) [style*="#1A1D2E"],
:host-context(html[data-pa-theme="light"]) [style*="#1a1d2e"] {
  border-color: #e2e2dc !important;
}

:host-context(html[data-pa-theme="light"]) [style*="rgb(36, 40, 64)"],
:host-context(html[data-pa-theme="light"]) [style*="#242840"] {
  border-color: #d4d4cb !important;
}

:host-context(html[data-pa-theme="light"]) [style*="rgb(221, 226, 240)"],
:host-context(html[data-pa-theme="light"]) [style*="#DDE2F0"],
:host-context(html[data-pa-theme="light"]) [style*="#dde2f0"] {
  color: #1a1d1b !important;
}

:host-context(html[data-pa-theme="light"]) [style*="rgb(107, 113, 145)"],
:host-context(html[data-pa-theme="light"]) [style*="#6B7191"],
:host-context(html[data-pa-theme="light"]) [style*="#6b7191"] {
  color: #4a5650 !important;
}

:host-context(html[data-pa-theme="light"]) [style*="rgb(57, 61, 87)"],
:host-context(html[data-pa-theme="light"]) [style*="#393D57"],
:host-context(html[data-pa-theme="light"]) [style*="#393d57"] {
  color: #8a9690 !important;
}

:host-context(html[data-pa-theme="light"]) [style*="rgb(10, 32, 28)"],
:host-context(html[data-pa-theme="light"]) [style*="#0A201C"],
:host-context(html[data-pa-theme="light"]) [style*="#0a201c"] {
  background: #ddfaf6 !important;
}

:host-context(html[data-pa-theme="light"]) [style*="rgb(61, 255, 214)"],
:host-context(html[data-pa-theme="light"]) [style*="#3DFFD6"],
:host-context(html[data-pa-theme="light"]) [style*="#3dffd6"] {
  color: #0d9488 !important;
  border-color: rgba(13, 148, 136, 0.42) !important;
}

:host-context(html[data-pa-theme="light"]) input::placeholder {
  color: #8a9690 !important;
}

:host-context(html[data-pa-theme="light"]) .figma-v2-primary-button {
  background: #ddfaf6 !important;
  border-color: rgba(13, 148, 136, 0.42) !important;
  color: #0d9488 !important;
}
`;

const unifiedV2Css = `${v2Css}\n${SHARED_THEME_CSS}`;

function ShadowFigmaScreen({ children, className, css }: { children: ReactElement; className: string; css: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<Root | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  if (import.meta.env.MODE === "test") {
    return (
      <div className={`reference-figma-screen ${className}`}>
        <div aria-label="Platform Academy content" className="figma-shadow-root" role="region" tabIndex={0}>
          {children}
        </div>
      </div>
    );
  }

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    shadow.textContent = "";

    const style = document.createElement("style");
    style.textContent = css;
    const mount = document.createElement("div");
    mount.className = "figma-shadow-root";
    mount.setAttribute("aria-label", "Platform Academy content");
    mount.setAttribute("role", "region");
    mount.tabIndex = 0;
    shadow.append(style, mount);
    const root = createRoot(mount);
    styleRef.current = style;
    rootRef.current = root;

    return () => {
      const currentRoot = rootRef.current;
      window.setTimeout(() => {
        currentRoot?.unmount();
        mount.remove();
        style.remove();
      }, 0);
      if (rootRef.current === root) rootRef.current = null;
      if (styleRef.current === style) styleRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    if (styleRef.current) styleRef.current.textContent = css;
  }, [css]);

  useLayoutEffect(() => {
    rootRef.current?.render(children);
  }, [children]);

  return <div className={`reference-figma-screen ${className}`} ref={hostRef} />;
}

function useReferenceNavigation() {
  const navigate = useNavigate();

  const openLesson = (lessonId: number) => {
    const lesson = referenceLessons.find((item) => item.id === lessonId);
    if (!lesson) {
      navigate(`/lessons/${lessonId}`);
      return;
    }
    navigate(`/courses/${lesson.courseSlug}/lessons/${lesson.sequence}`);
  };

  const openLessonRoute = (lesson: (typeof referenceLessons)[number]) => {
    navigate(`/courses/${lesson.courseSlug}/lessons/${lesson.sequence}`);
  };

  return {
    onNavigate(screen: string) {
      const paths: Record<string, string> = {
        dashboard: "/",
        roadmap: "/roadmap",
        labs: "/labs",
        interview: "/interview-prep",
        resources: "/resources",
        lesson: "/courses/platform-kubernetes-fundamentals/lessons/1",
        "lab-detail": `/labs/${referenceLabs[0]?.slug ?? ""}`,
      };
      navigate(paths[screen] ?? "/");
    },
    onOpenLesson: openLesson,
    onOpenResource(resource: ReferenceResource) {
      navigate(`/resources/${resource.slug}`);
    },
    onOpenDocByTitle(title: string) {
      const pinnedLessonId = PINNED_REFERENCE_DOC_LESSONS[normalizeReferenceLabel(title)];
      const pinnedLesson = pinnedLessonId ? referenceLessons.find((item) => item.id === pinnedLessonId) : undefined;
      if (pinnedLesson) {
        openLessonRoute(pinnedLesson);
        return;
      }

      const lesson = findBestReferenceLesson(title);
      if (lesson) {
        openLessonRoute(lesson);
        return;
      }

      const resource = findBestReferenceMatch(title, referenceResources, (item) => `${item.title} ${item.domain} ${item.summary} ${item.tags.join(" ")}`);
      if (resource) {
        navigate(`/resources/${resource.slug}`);
        return;
      }

      navigate("/resources");
    },
    onOpenLab(id: number) {
      const lab = referenceLabs.find((item) => item.id === id) ?? referenceLabs[0];
      navigate(`/labs/${lab.slug}`);
    },
    onOpenLabByTitle(title: string) {
      const lab = findBestReferenceMatch(title, referenceLabs, (item) => `${item.title} ${item.track} ${item.scenario} ${item.skills.join(" ")}`);
      navigate(`/labs/${(lab ?? referenceLabs[0]).slug}`);
    },
    onOpenRelatedLab(lessonId: number) {
      const lesson = referenceLessons.find((item) => item.id === lessonId) ?? referenceLessons[0];
      const lessonTrack = lesson.courseTrack.toLowerCase();
      const lab =
        referenceLabs.find((item) => {
          const labTrack = item.track.toLowerCase();
          return lessonTrack.includes(labTrack) || labTrack.includes(lessonTrack);
        }) ?? referenceLabs[0];
      navigate(`/labs/${lab.slug}`);
    },
    onBackToLabs() {
      navigate("/labs");
    },
    onBackToResources() {
      navigate("/resources");
    },
    onBackToCourse() {
      navigate("/");
    },
  };
}

const REFERENCE_STOP_WORDS = new Set(["and", "the", "for", "with", "from", "into", "path", "overview", "docs", "doc"]);

const PINNED_REFERENCE_DOC_LESSONS: Record<string, number> = {
  "kubernetes deployments": 2,
  "kubernetes debug pods": 5,
  "kubernetes services": 3,
};

function normalizeReferenceLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function referenceTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !REFERENCE_STOP_WORDS.has(token));
}

function tokenMatches(token: string, haystack: string) {
  if (haystack.includes(token)) return true;
  if (token.endsWith("s") && haystack.includes(token.slice(0, -1))) return true;
  return haystack.includes(`${token}s`);
}

function scoreReferenceMatch(query: string, haystack: string) {
  const normalizedHaystack = haystack.toLowerCase();
  return referenceTokens(query).reduce((score, token) => score + (tokenMatches(token, normalizedHaystack) ? 1 : 0), 0);
}

function findBestReferenceMatch<T>(query: string, items: T[], getText: (item: T) => string) {
  const ranked = items
    .map((item) => ({ item, score: scoreReferenceMatch(query, getText(item)) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.item;
}

function findBestReferenceLesson(query: string) {
  const hasDebugIntent = referenceTokens(query).some((token) => token.startsWith("debug"));
  const ranked = referenceLessons
    .map((item) => {
      const primaryText = `${item.courseTitle} ${item.title} ${item.summary}`;
      const secondaryText = `${item.body} ${item.practiceNotes}`;
      const primary = scoreReferenceMatch(query, primaryText);
      const secondary = scoreReferenceMatch(query, secondaryText);
      const full = scoreReferenceMatch(query, `${primaryText} ${secondaryText}`);
      const debugPrimary = hasDebugIntent && primaryText.toLowerCase().includes("debug") ? 1 : 0;
      return { item, score: primary * 3 + secondary + full, primary, full, debugPrimary };
    })
    .filter((entry) => entry.score >= 3 && entry.primary > 0)
    .sort((a, b) => b.debugPrimary - a.debugPrimary || b.full - a.full || b.score - a.score || b.primary - a.primary);
  return ranked[0]?.item;
}

function useRouteLabId() {
  const { slug = "" } = useParams();
  const lab = referenceLabs.find((item) => item.slug === slug || String(item.id) === slug);
  return lab?.id ?? referenceLabs[1]?.id ?? referenceLabs[0]?.id ?? 1;
}

function useRouteLessonId() {
  const { id = "", courseRef = "", sequence = "" } = useParams();
  const numericId = Number(id);
  if (Number.isInteger(numericId) && numericId > 0) return numericId;

  const numericSequence = Number(sequence);
  const lesson = referenceLessons.find((item) => {
    const courseMatches = !courseRef || item.courseSlug === courseRef;
    return courseMatches && item.sequence === numericSequence;
  });
  if (lesson) return lesson.id;

  const courseFirstLesson = courseRef
    ? referenceLessons.find((item) => item.courseSlug === courseRef && item.sequence === 1)
    : undefined;
  return courseFirstLesson?.id ?? referenceLessons[0]?.id ?? 1;
}

function useRouteResourceSlug() {
  const { slug = "" } = useParams();
  return slug;
}

export function ReferenceFigmaRoadmap() {
  const nav = useReferenceNavigation();
  return (
    <ShadowFigmaScreen className="reference-figma-unified" css={unifiedV2Css}>
      <V2Roadmap onNavigate={nav.onNavigate} />
    </ShadowFigmaScreen>
  );
}

export function ReferenceFigmaDashboard({ progress }: { progress?: ReferenceDashboardProgress }) {
  const nav = useReferenceNavigation();
  return (
    <ShadowFigmaScreen className="reference-figma-unified" css={unifiedV2Css}>
      <V2Dashboard onNavigate={nav.onNavigate} onOpenLab={nav.onOpenLab} onOpenLesson={nav.onOpenLesson} progress={progress} />
    </ShadowFigmaScreen>
  );
}

export function ReferenceFigmaStatus({
  title,
  detail,
  tone = "loading"
}: {
  title: string;
  detail?: string;
  tone?: "loading" | "error";
}) {
  const Icon = tone === "error" ? AlertTriangle : LoaderCircle;

  return (
    <ShadowFigmaScreen className="reference-figma-unified" css={unifiedV2Css}>
      <div className="flex h-full min-h-0 items-center justify-center p-6" style={{ background: "var(--figma-v2-bg)" }}>
        <section
          aria-busy={tone === "loading"}
          className="w-full max-w-[520px] rounded-sm border px-5 py-4"
          role={tone === "error" ? "alert" : "status"}
          style={{ background: "var(--figma-v2-surface)", borderColor: "var(--figma-v2-border-2)" }}
        >
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-sm border"
              style={{
                background: tone === "error" ? "var(--figma-v2-red-bg)" : "var(--figma-v2-accent-bg)",
                borderColor: tone === "error" ? "color-mix(in srgb, var(--figma-v2-red) 35%, transparent)" : "color-mix(in srgb, var(--figma-v2-accent) 35%, transparent)",
                color: tone === "error" ? "var(--figma-v2-red)" : "var(--figma-v2-accent)"
              }}
            >
              <Icon aria-hidden="true" className={tone === "loading" ? "figma-status-spin" : undefined} size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p style={{ color: "var(--figma-v2-text-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Platform Academy
              </p>
              <h1 style={{ color: "var(--figma-v2-text)", fontSize: 18, fontWeight: 600, lineHeight: 1.25, marginTop: 6 }}>{title}</h1>
              {detail && <p style={{ color: "var(--figma-v2-text-2)", fontSize: 12, lineHeight: 1.55, marginTop: 8 }}>{detail}</p>}
            </div>
          </div>
        </section>
      </div>
    </ShadowFigmaScreen>
  );
}

export function ReferenceFigmaInterviewPrep() {
  const nav = useReferenceNavigation();
  return (
    <ShadowFigmaScreen className="reference-figma-unified" css={unifiedV2Css}>
      <V2InterviewPrep onOpenDoc={nav.onOpenDocByTitle} onOpenRelatedLab={nav.onOpenLabByTitle} />
    </ShadowFigmaScreen>
  );
}

export function ReferenceFigmaLabs() {
  const nav = useReferenceNavigation();
  return (
    <ShadowFigmaScreen className="reference-figma-unified" css={unifiedV2Css}>
      <V2LabsQueue onOpenLab={nav.onOpenLab} />
    </ShadowFigmaScreen>
  );
}

export function ReferenceFigmaLabDetail() {
  const nav = useReferenceNavigation();
  const labId = useRouteLabId();
  return (
    <ShadowFigmaScreen className="reference-figma-unified" css={unifiedV2Css}>
      <V2LabDetail labId={labId} onBack={nav.onBackToLabs} />
    </ShadowFigmaScreen>
  );
}

export function ReferenceFigmaResources() {
  const nav = useReferenceNavigation();
  return (
    <ShadowFigmaScreen className="reference-figma-unified" css={unifiedV2Css}>
      <V2Resources onOpenResource={nav.onOpenResource} />
    </ShadowFigmaScreen>
  );
}

export function ReferenceFigmaResourceDetail() {
  const nav = useReferenceNavigation();
  const slug = useRouteResourceSlug();
  return (
    <ShadowFigmaScreen className="reference-figma-unified" css={unifiedV2Css}>
      <V2ResourceDetail slug={slug} onBack={nav.onBackToResources} onOpenRelatedLab={nav.onOpenLabByTitle} />
    </ShadowFigmaScreen>
  );
}

export function ReferenceFigmaLesson() {
  const nav = useReferenceNavigation();
  const lessonId = useRouteLessonId();
  return (
    <ShadowFigmaScreen className="reference-figma-unified" css={unifiedV2Css}>
      <V2LessonReader lessonId={lessonId} onBack={nav.onBackToCourse} onOpenLesson={nav.onOpenLesson} onOpenRelatedLab={nav.onOpenRelatedLab} />
    </ShadowFigmaScreen>
  );
}
