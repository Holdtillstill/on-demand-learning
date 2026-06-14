import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  FlaskConical,
  Home,
  Key,
  Library,
  Map,
  MessageSquare,
  Moon,
  Sun,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { api } from "../api";
import { restoreLocalLearnerId } from "../learnerIdentity";
import { STUDY_PLANS_RESTORED_EVENT, readInterviewStudyPlans, uniqueStrings, writeInterviewStudyPlans } from "../lib/interviewStudyPlans";
import { learnerBackupValidationError } from "../lib/learnerBackup";
import type { PlatformLearnerStateExport } from "../types";
import { referenceContentCounts } from "./reference-figma/contentCounts";

export type AppShellProgressSummary = {
  completedLessons: number;
  totalLessons: number;
  completedLabs: number;
  totalLabs: number;
  savedResources: number;
  totalResources: number;
  practicedQuestions: number;
  totalInterviewQuestions: number;
  readinessScore: number;
};

type AppShellProps = {
  children: ReactNode;
  learnerId: string;
  onResetLearner: () => void;
  onRecoverLearner: (learnerId: string) => void;
  progressSummary?: AppShellProgressSummary;
};

type ProductTheme = "dark" | "light";
type ProfileModalTab = "key" | "export" | "import" | "reset";

const THEME_STORAGE_KEY = "platform-academy-theme";
const defaultProgressSummary: AppShellProgressSummary = {
  completedLessons: 0,
  totalLessons: referenceContentCounts.lessons,
  completedLabs: 0,
  totalLabs: referenceContentCounts.labs,
  savedResources: 0,
  totalResources: referenceContentCounts.resources,
  practicedQuestions: 0,
  totalInterviewQuestions: referenceContentCounts.interviewQuestions,
  readinessScore: 0
};

function readInitialTheme(): ProductTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "dark" || storedTheme === "light") return storedTheme;
  } catch {
    return "dark";
  }
  return "dark";
}

const productNavItems = [
  {
    to: "/dashboard/home",
    label: "Home",
    icon: Home,
    match: (path: string) => path === "/" || path.startsWith("/dashboard") || path.startsWith("/courses") || path.startsWith("/lessons")
  },
  { to: "/roadmap", label: "Roadmap", icon: Map, match: (path: string) => path.startsWith("/roadmap") },
  { to: "/labs", label: "Labs", icon: FlaskConical, count: referenceContentCounts.labs, match: (path: string) => path.startsWith("/labs") },
  { to: "/interview-prep", label: "Interview", icon: MessageSquare, count: referenceContentCounts.interviewPacks, match: (path: string) => path.startsWith("/interview-prep") },
  { to: "/resources", label: "Resources", icon: Library, count: referenceContentCounts.resources, match: (path: string) => path.startsWith("/resources") }
] as const;

function pageTitleForPath(pathname: string) {
  if (pathname === "/" || pathname.startsWith("/dashboard")) return "Platform Engineering Readiness";
  if (pathname.startsWith("/roadmap")) return "Platform Engineering Roadmap";
  if (pathname.startsWith("/labs/")) return "Lab Workbook";
  if (pathname.startsWith("/labs")) return "Lab Queue";
  if (pathname.startsWith("/interview-prep")) return "Interview Prep";
  if (pathname.startsWith("/resources/")) return "Resource Detail";
  if (pathname.startsWith("/resources")) return "Resource Index";
  if (pathname.startsWith("/courses") || pathname.startsWith("/lessons")) return "Lesson Reader";
  return "Page not found";
}

export function AppShell({ children, learnerId, onResetLearner, onRecoverLearner, progressSummary = defaultProgressSummary }: AppShellProps) {
  const location = useLocation();
  const [theme, setTheme] = useState<ProductTheme>(readInitialTheme);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryStatus, setRecoveryStatus] = useState("");
  const [recoveryCopied, setRecoveryCopied] = useState(false);
  const [profileJsonPaste, setProfileJsonPaste] = useState("");
  const [profileModalTab, setProfileModalTab] = useState<ProfileModalTab>("key");
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const recoveryButtonRef = useRef<HTMLButtonElement | null>(null);
  const recoveryDialogRef = useRef<HTMLElement | null>(null);
  const recoveryCloseRef = useRef<HTMLButtonElement | null>(null);
  const profileImportInputRef = useRef<HTMLInputElement | null>(null);

  const openRecovery = (tab: ProfileModalTab = "key") => {
    setProfileModalTab(tab);
    setIsResetConfirming(false);
    setRecoveryInput("");
    setRecoveryError("");
    setRecoveryStatus("");
    setRecoveryCopied(false);
    if (tab !== "import") setProfileJsonPaste("");
    setIsRecoveryOpen(true);
  };

  const closeRecovery = () => {
    setIsRecoveryOpen(false);
    setIsResetConfirming(false);
    setRecoveryError("");
    setRecoveryStatus("");
  };

  const startProfileImport = () => {
    profileImportInputRef.current?.click();
  };

  const importLearnerBackupState = async (parsed: unknown) => {
    const validationError = learnerBackupValidationError(parsed);
    if (validationError) {
      setRecoveryError(validationError);
      return;
    }
    const state = parsed as PlatformLearnerStateExport;
    const { interview_study_plans: importedStudyPlans, ...apiState } = state;
    const result = await api.importLearnerState(apiState, learnerId);
    const importedStudyPlanCount = importedStudyPlans?.length ?? 0;
    if (importedStudyPlans) {
      writeInterviewStudyPlans(
        importedStudyPlans.map((plan) => ({
          ...plan,
          name: plan.name.trim() || "Interview study plan",
          questionIds: uniqueStrings(plan.questionIds)
        }))
      );
      window.dispatchEvent(new Event(STUDY_PLANS_RESTORED_EVENT));
    }
    setProfileJsonPaste("");
    setRecoveryStatus(
      `Imported ${result.progress_imported} lessons, ${result.activity_imported} activity rows, ${result.lab_submissions_imported} lab workbooks, and ${importedStudyPlanCount} interview study ${importedStudyPlanCount === 1 ? "plan" : "plans"}.`
    );
    onRecoverLearner(learnerId);
  };

  const copyRecoveryKey = async () => {
    try {
      await navigator.clipboard?.writeText(learnerId);
    } catch {
      // Match the reference build: show copied feedback after the user action even if clipboard APIs are restricted.
    }
    setRecoveryCopied(true);
    window.setTimeout(() => setRecoveryCopied(false), 2000);
  };

  const downloadLearnerBackup = async () => {
    setRecoveryError("");
    setRecoveryStatus("");
    try {
      const state = await api.exportLearnerState(learnerId);
      const backupState: PlatformLearnerStateExport = {
        ...state,
        interview_study_plans: readInterviewStudyPlans()
      };
      const blob = new Blob([JSON.stringify(backupState, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `platform-academy-${learnerId}-state.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setRecoveryStatus("Exported profile backup.");
    } catch {
      setRecoveryError("Profile export failed. Check the API connection and try again.");
    }
  };

  const importLearnerBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setProfileModalTab("import");
    setIsRecoveryOpen(true);
    setRecoveryError("");
    setRecoveryStatus("Importing profile backup...");
    try {
      await importLearnerBackupState(JSON.parse(await file.text()) as unknown);
    } catch {
      setRecoveryError("Profile import failed. Use an exported Platform Academy JSON backup.");
    }
  };

  const importPastedLearnerBackup = async () => {
    const pastedJson = profileJsonPaste.trim();
    if (!pastedJson) {
      startProfileImport();
      return;
    }
    setProfileModalTab("import");
    setIsRecoveryOpen(true);
    setRecoveryError("");
    setRecoveryStatus("Importing pasted profile backup...");
    try {
      await importLearnerBackupState(JSON.parse(pastedJson) as unknown);
    } catch {
      setRecoveryError("Profile import failed. Paste an exported Platform Academy JSON backup.");
    }
  };

  const restoreRecoveryProfile = () => {
    const restoredLearnerId = restoreLocalLearnerId(recoveryInput);
    if (!restoredLearnerId) {
      setRecoveryError("Enter a valid guest recovery key.");
      return;
    }
    onRecoverLearner(restoredLearnerId);
    closeRecovery();
  };

  const nextTheme = theme === "dark" ? "light" : "dark";
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const currentPageTitle = pageTitleForPath(location.pathname);
  const recoveryKeyPreview = `${learnerId.slice(0, 14)}···`;
  const lessonLabel = progressSummary.completedLessons === 1 ? "lesson" : "lessons";
  const labLabel = progressSummary.completedLabs === 1 ? "lab" : "labs";
  const profileProgressText = `score ${progressSummary.readinessScore} · ${progressSummary.completedLabs} ${labLabel} · ${progressSummary.completedLessons} ${lessonLabel}`;
  const profileTabs: Array<{ id: ProfileModalTab; label: string; icon: ReactNode }> = [
    { id: "key", label: "Recovery key", icon: <Key aria-hidden="true" /> },
    { id: "export", label: "Export", icon: <Download aria-hidden="true" /> },
    { id: "import", label: "Import", icon: <Upload aria-hidden="true" /> },
    { id: "reset", label: "Reset", icon: <Trash2 aria-hidden="true" /> }
  ];

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    document.documentElement.dataset.paTheme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#060810" : "#f6f8fb");
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore private-mode storage failures; the current session still updates.
    }
  }, [theme]);

  useEffect(() => {
    if (!isRecoveryOpen) return;
    const dialog = recoveryDialogRef.current;
    const closeButton = recoveryCloseRef.current;
    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    closeButton?.focus();

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRecovery();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => element.offsetParent !== null
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.setTimeout(() => {
        if (previousActive && previousActive !== document.body && document.contains(previousActive)) previousActive.focus();
        else recoveryButtonRef.current?.focus();
      }, 0);
    };
  }, [isRecoveryOpen]);

  return (
    <div className="product-shell">
      <header className="product-topline">
        <div className="topline-breadcrumb" aria-hidden="true" />
        <div className="topbar-actions" aria-label="Profile and quick actions">
          <div className="recovery-key-chip" title="Recovery key">
            <button
              aria-label="Open guest recovery key"
              className="recovery-key-open-button"
              onClick={() => openRecovery("key")}
              ref={recoveryButtonRef}
              title="Open guest recovery key"
              type="button"
            >
              <Key aria-hidden="true" />
              <span>{recoveryKeyPreview}</span>
            </button>
            <button
              aria-label={recoveryCopied ? "Recovery key copied" : "Copy recovery key"}
              className="recovery-key-copy-button"
              onClick={(event) => {
                event.stopPropagation();
                void copyRecoveryKey();
              }}
              title="Copy recovery key"
              type="button"
            >
              {recoveryCopied ? <CheckCircle2 aria-hidden="true" /> : <Copy aria-hidden="true" />}
            </button>
          </div>
          <Link aria-label="Lab Queue" className={location.pathname.startsWith("/labs") ? "topbar-icon-button active" : "topbar-icon-button"} title="Lab Queue" to="/labs">
            <FlaskConical aria-hidden="true" />
          </Link>
          <Link aria-label="Resource Index" className={location.pathname.startsWith("/resources") ? "topbar-icon-button active" : "topbar-icon-button"} title="Resource Index" to="/resources">
            <Library aria-hidden="true" />
          </Link>
          <button
            aria-label={`Switch to ${nextTheme} theme`}
            aria-pressed={theme === "light"}
            className="topbar-icon-button theme-toggle-button"
            onClick={toggleTheme}
            title={`Switch to ${nextTheme} theme`}
            type="button"
          >
            <ThemeIcon aria-hidden="true" />
          </button>
          <span className="topbar-divider" aria-hidden="true" />
          <button aria-label="Export profile" className="topbar-icon-button" onClick={() => openRecovery("export")} title="Export profile" type="button">
            <Download aria-hidden="true" />
          </button>
          <button
            aria-label="Import profile backup"
            className="topbar-icon-button"
            onClick={() => openRecovery("import")}
            title="Import profile"
            type="button"
          >
            <Upload aria-hidden="true" />
          </button>
          <input
            accept="application/json"
            aria-hidden="true"
            className="profile-import-input"
            onChange={(event) => void importLearnerBackup(event)}
            ref={profileImportInputRef}
            tabIndex={-1}
            type="file"
          />
          <button
            aria-label="New profile: start a new local guest workspace"
            className="topbar-icon-button danger"
            onClick={() => openRecovery("reset")}
            title="Reset profile"
            type="button"
          >
            <Trash2 aria-hidden="true" />
          </button>
          <span className="topbar-divider" aria-hidden="true" />
          <button
            aria-label="Open profile and recovery"
            className="topbar-avatar"
            onClick={() => openRecovery("key")}
            type="button"
          >
            <span>G</span>
            <strong>Guest</strong>
            <em className="visually-hidden">Local profile</em>
            <em className="visually-hidden">Browser workspace</em>
          </button>
          <span className="visually-hidden">Progress saved</span>
        </div>
      </header>
      <div className="product-body">
        <aside className="product-sidebar">
          <Link className="product-brand" to="/dashboard/home">
            <span>PA</span>
            <div>
              <strong>Platform Academy</strong>
              <small>Learning workspace</small>
            </div>
          </Link>
          <nav className="product-nav" aria-label="Platform Academy navigation">
            {productNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  to={item.to}
                  key={item.to}
                  className={({ isActive }) => (isActive || item.match(location.pathname) ? "active" : undefined)}
                >
                  <Icon aria-hidden="true" />
                  <span>{item.label}</span>
                  {"count" in item && item.count ? <small>{item.count}</small> : null}
                  <ChevronRight className="product-nav-chevron" aria-hidden="true" />
                </NavLink>
              );
            })}
          </nav>
          <div className="product-sidebar-progress" aria-label="Progress">
            <p>PROGRESS</p>
            <ProgressRow label="Lessons" value={progressSummary.completedLessons} total={progressSummary.totalLessons} />
            <ProgressRow label="Labs" value={progressSummary.completedLabs} total={progressSummary.totalLabs} />
            <ProgressRow label="Resources" value={progressSummary.savedResources} total={progressSummary.totalResources} />
            <ProgressRow label="Interview Qs" value={progressSummary.practicedQuestions} total={progressSummary.totalInterviewQuestions} />
          </div>
          <div className="product-sidebar-profile">
            <div>G</div>
            <span>
              <strong>guest</strong>
              <small>local · unsynced</small>
            </span>
          </div>
        </aside>
        <div className="product-frame">
          <main aria-labelledby="app-route-heading">
            <h1 className="visually-hidden" id="app-route-heading">{currentPageTitle}</h1>
            {children}
          </main>
        </div>
      </div>
      <nav className="mobile-product-nav" aria-label="Platform Academy mobile navigation">
        {productNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              to={item.to}
              key={item.to}
              className={({ isActive }) => (isActive || item.match(location.pathname) ? "active" : undefined)}
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      {isRecoveryOpen && (
        <div className="profile-recovery-backdrop" onClick={closeRecovery}>
          <section
            aria-labelledby="profile-recovery-title"
            aria-modal="true"
            className="profile-recovery-dialog"
            onClick={(event) => event.stopPropagation()}
            ref={recoveryDialogRef}
            role="dialog"
          >
            <div className="recovery-dialog-header">
              <div>
                <h2 id="profile-recovery-title">Profile & Recovery</h2>
                <p>guest · local · unsynced</p>
              </div>
              <button aria-label="Close profile and recovery" className="recovery-close-button" onClick={closeRecovery} ref={recoveryCloseRef} type="button">
                <X aria-hidden="true" />
              </button>
            </div>

            <div className="recovery-profile-strip">
              <div>G</div>
              <span>
                <strong>Guest Learner</strong>
                <small>{profileProgressText}</small>
              </span>
            </div>

            <div className="recovery-tabs" role="tablist" aria-label="Profile recovery sections">
              {profileTabs.map((tab) => (
                <button
                  aria-controls={`profile-tab-${tab.id}`}
                  aria-selected={profileModalTab === tab.id}
                  className={profileModalTab === tab.id ? "active" : undefined}
                  data-danger={tab.id === "reset" ? "true" : undefined}
                  id={`profile-tab-button-${tab.id}`}
                  key={tab.id}
                  onClick={() => {
                    setProfileModalTab(tab.id);
                    setRecoveryError("");
                    setRecoveryStatus("");
                    setIsResetConfirming(false);
                  }}
                  role="tab"
                  type="button"
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div
              aria-labelledby={`profile-tab-button-${profileModalTab}`}
              className="recovery-pane"
              id={`profile-tab-${profileModalTab}`}
              role="tabpanel"
            >
              {profileModalTab === "key" && (
                <>
                  <p className="recovery-copy">Your recovery key is the only way to restore progress on a new device or after clearing storage. Keep it safe.</p>
                  <div className="recovery-key-card">
                    <div>
                      <Key aria-hidden="true" />
                      <span>Recovery key</span>
                    </div>
                    <section>
                      <code>{learnerId}</code>
                      <button className={recoveryCopied ? "copied" : undefined} onClick={copyRecoveryKey} type="button">
                        {recoveryCopied ? <CheckCircle2 aria-hidden="true" /> : <Copy aria-hidden="true" />}
                        {recoveryCopied ? "Copied!" : "Copy"}
                      </button>
                    </section>
                  </div>
                  <form
                    className="recovery-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      restoreRecoveryProfile();
                    }}
                  >
                    <label htmlFor="guest-recovery-key">Restore from key</label>
                    <div>
                      <input
                        id="guest-recovery-key"
                        onChange={(event) => {
                          setRecoveryInput(event.target.value);
                          setRecoveryError("");
                        }}
                        placeholder="pa-xxxx-xxxx-xxxx-xxxx-..."
                        value={recoveryInput}
                      />
                      <button disabled={!recoveryInput.trim()} type="submit">
                        Restore
                      </button>
                    </div>
                  </form>
                </>
              )}

              {profileModalTab === "export" && (
                <>
                  <p className="recovery-copy">Export your full profile — recovery key, progress, and settings — as a JSON file.</p>
                  <div className="recovery-export-card">
                    {[
                      "Recovery key",
                      `Completed lessons (${progressSummary.completedLessons})`,
                      `Completed labs (${progressSummary.completedLabs})`,
                      `Saved resources (${progressSummary.savedResources})`,
                      `Questions practiced (${progressSummary.practicedQuestions})`,
                      `Readiness score (${progressSummary.readinessScore})`
                    ].map((item) => (
                      <span key={item}>
                        <i />
                        {item}
                      </span>
                    ))}
                  </div>
                  <button className="recovery-primary-action" onClick={() => void downloadLearnerBackup()} type="button">
                    <Download aria-hidden="true" />
                    Export profile.json
                  </button>
                </>
              )}

              {profileModalTab === "import" && (
                <>
                  <p className="recovery-copy">Import a profile JSON to restore progress. This replaces your current local profile.</p>
                  <button className="recovery-import-dropzone" onClick={startProfileImport} type="button">
                    <Upload aria-hidden="true" />
                    <strong>Drop profile.json here</strong>
                    <span>or click to browse</span>
                  </button>
                  <label className="recovery-json-paste" htmlFor="profile-json-paste">
                    <span>Or paste JSON directly</span>
                    <textarea
                      id="profile-json-paste"
                      onChange={(event) => {
                        setProfileJsonPaste(event.target.value);
                        setRecoveryError("");
                        setRecoveryStatus("");
                      }}
                      placeholder={'{\n  "version": "1.0",\n  "profile": { ... }\n}'}
                      rows={4}
                      value={profileJsonPaste}
                    />
                  </label>
                  <button className="recovery-primary-action" onClick={() => void importPastedLearnerBackup()} type="button">
                    <Upload aria-hidden="true" />
                    {profileJsonPaste.trim() ? "Import pasted JSON" : "Import profile"}
                  </button>
                </>
              )}

              {profileModalTab === "reset" && (
                <>
                  <div className="recovery-reset-warning">
                    <AlertTriangle aria-hidden="true" />
                    <div>
                      <strong>This action cannot be undone</strong>
                      <p>
                        Resetting permanently deletes local progress, submissions, saved resources, and the current recovery key. Export first if you want to preserve data.
                      </p>
                    </div>
                  </div>
                  {!isResetConfirming ? (
                    <button className="recovery-reset-button" onClick={() => setIsResetConfirming(true)} type="button">
                      <Trash2 aria-hidden="true" />
                      Reset profile
                    </button>
                  ) : (
                    <div className="recovery-reset-confirm">
                      <p>Are you absolutely sure?</p>
                      <div>
                        <button onClick={() => setIsResetConfirming(false)} type="button">
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onResetLearner();
                            closeRecovery();
                          }}
                          type="button"
                        >
                          Yes, reset everything
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {(recoveryError || recoveryStatus) && (
                <div className={recoveryError ? "recovery-message error" : "recovery-message"} role={recoveryError ? "alert" : "status"}>
                  {recoveryError || recoveryStatus}
                </div>
              )}
              </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ProgressRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="product-progress-row">
      <div>
        <span>{label}</span>
        <strong>
          {value}/{total}
        </strong>
      </div>
      <span>
        <i style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}
